import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { jsonrepair } from "jsonrepair";
import dns from "dns";
import zlib from "zlib";

// Force Node.js to resolve IP addresses as IPv4 first instead of IPv6.
// This resolves the 'connect ENETUNREACH' error when trying to connect to Supabase
// in environments where outbound IPv6 routes are unavailable.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const DEFAULT_DB_PATH = path.join(process.cwd(), "database.json");
const DB_PATH = process.env.DATABASE_PATH || DEFAULT_DB_PATH;

let pool: Pool | null = null;
let isSupabaseConnected = false;
let syncTimeout: NodeJS.Timeout | null = null;

function safeEncodeConnectionString(urlStr: string): string {
  try {
    const trimmed = urlStr.trim().replace(/^['"]|['"]$/g, "");
    if (!trimmed.startsWith("postgresql://") && !trimmed.startsWith("postgres://")) {
      return trimmed;
    }
    
    const scheme = trimmed.startsWith("postgresql://") ? "postgresql://" : "postgres://";
    const remainder = trimmed.slice(scheme.length);
    
    const queryIdx = remainder.indexOf("?");
    const pathAndQuery = queryIdx !== -1 ? remainder.slice(queryIdx) : "";
    const mainPart = queryIdx !== -1 ? remainder.slice(0, queryIdx) : remainder;
    
    const lastAtIdx = mainPart.lastIndexOf("@");
    if (lastAtIdx === -1) return trimmed;
    
    const userPassPart = mainPart.slice(0, lastAtIdx);
    const hostDbPart = mainPart.slice(lastAtIdx);
    
    const colonIdx = userPassPart.indexOf(":");
    if (colonIdx === -1) return trimmed;
    
    const user = userPassPart.slice(0, colonIdx);
    const rawPassword = userPassPart.slice(colonIdx + 1);
    
    let encodedPassword = rawPassword;
    let needsEncoding = false;
    try {
      if (decodeURIComponent(rawPassword) === rawPassword) {
        needsEncoding = true;
      }
    } catch (e) {
      needsEncoding = true;
    }
    
    if (needsEncoding) {
      encodedPassword = encodeURIComponent(rawPassword);
    }
    
    return `${scheme}${user}:${encodedPassword}${hostDbPart}${pathAndQuery}`;
  } catch (e) {
    console.error("Erro ao formatar a string de conexão do Supabase:", e);
    return urlStr;
  }
}

export function getSupabasePool(): Pool | null {
  if (pool) return pool;

  const rawConnectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!rawConnectionString || rawConnectionString.trim() === "" || rawConnectionString.includes("MY_SUPABASE_DATABASE_URL") || rawConnectionString.trim() === '""') {
    console.log("Supabase Connection: Nenhuma URL de banco de dados configurada em SUPABASE_DATABASE_URL. Operando apenas com banco de dados local (database.json).");
    return null;
  }

  // Verifica se o usuário manteve os marcadores/brackets originais do Supabase na senha
  if (
    rawConnectionString.includes("[YOUR-PASSWORD]") ||
    rawConnectionString.includes("[your-password]") ||
    rawConnectionString.includes("<your-password>") ||
    rawConnectionString.includes("<YOUR-PASSWORD>") ||
    rawConnectionString.includes("[PASSWORD]") ||
    rawConnectionString.includes("[password]") ||
    rawConnectionString.includes("[sua-senha]") ||
    rawConnectionString.includes("[YOUR_PASSWORD]") ||
    rawConnectionString.includes("<YOUR_PASSWORD>") ||
    rawConnectionString.includes("[SENHA]") ||
    rawConnectionString.includes("[senha]")
  ) {
    console.warn("⚠️ AVISO CRÍTICO DO SUPABASE: Você adicionou a URL de conexão do Supabase, mas esqueceu de substituir '[YOUR-PASSWORD]' (ou '<your-password>') pela sua SENHA REAL do banco de dados! O aplicativo continuará funcionando perfeitamente de forma local com o arquivo database.json, mas a sincronização com a nuvem está pausada até você colocar a senha correta nas configurações.");
    return null;
  }

  const connectionString = safeEncodeConnectionString(rawConnectionString);

  try {
    pool = new Pool({
      connectionString: connectionString,
      ssl: connectionString.includes("sslmode=require") || connectionString.includes("supabase.com") || connectionString.includes("pooler.supabase.com") ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    return pool;
  } catch (error) {
    console.error("Falha ao inicializar o Pool de Conexão com o Supabase:", error);
    return null;
  }
}

function sanitizeDbData(obj: any): { sanitized: any; isModified: boolean } {
  let isModified = false;

  function recurse(value: any): any {
    if (value === null || value === undefined) return value;

    if (Array.isArray(value)) {
      let arrayModified = false;
      const newArray = value.map(item => {
        const sanitizedItem = recurse(item);
        if (sanitizedItem !== item) {
          arrayModified = true;
        }
        return sanitizedItem;
      });
      if (arrayModified) {
        isModified = true;
      }
      return newArray;
    }

    if (typeof value === "object") {
      const sanitized: any = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const val = value[key];
          if (typeof val === "string" && val.startsWith("data:") && val.length > 1000000) {
            console.warn(`Sanitizando propriedade '${key}' com base64 gigante (${val.length} caracteres). Limpando para evitar corrupção.`);
            sanitized[key] = ""; // Limpa a imagem gigante para evitar corromper o banco e timeouts
            isModified = true;
          } else {
            const sanitizedVal = recurse(val);
            if (sanitizedVal !== val) {
              isModified = true;
            }
            sanitized[key] = sanitizedVal;
          }
        }
      }
      return sanitized;
    }

    return value;
  }

  const result = recurse(obj);
  return { sanitized: result, isModified };
}

function prepareSupabasePayload(data: any): any {
  try {
    const jsonStr = JSON.stringify(data);
    const compressedBuffer = zlib.gzipSync(Buffer.from(jsonStr, "utf8"));
    const base64Str = compressedBuffer.toString("base64");
    console.log(`[SupabaseSync] Payload compactado de ${jsonStr.length} para ${base64Str.length} caracteres.`);
    return {
      compressed: true,
      payload: base64Str
    };
  } catch (err) {
    console.error("[SupabaseSync] Erro ao compactar dados para o Supabase, enviando sem compactação:", err);
    return data;
  }
}

function decompressPayloadIfNeeded(data: any): any {
  if (data && data.compressed === true && typeof data.payload === "string") {
    try {
      console.log("[SupabaseSync] Descompactando payload recebido do Supabase...");
      const compressedBuffer = Buffer.from(data.payload, "base64");
      const decompressedBuffer = zlib.gunzipSync(compressedBuffer);
      const jsonStr = decompressedBuffer.toString("utf8");
      console.log(`[SupabaseSync] Descompactado com sucesso! Restaurado para ${jsonStr.length} caracteres.`);
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("[SupabaseSync] Erro ao descompactar payload:", err);
    }
  }
  return data;
}

export async function initSupabaseSync() {
  const p = getSupabasePool();
  if (!p) return;

  try {
    // 1. Testa a conexão básica
    const client = await p.connect();
    console.log("Conectado com sucesso ao banco de dados Supabase (Postgres)!");
    isSupabaseConnected = true;

    // 2. Cria a tabela de estado se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        key VARCHAR(255) PRIMARY KEY,
        data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Busca os dados atuais salvos no Supabase como texto para evitar crashes de parse automático do driver pg se estiver corrompido
    await client.query("SET statement_timeout = 60000;"); // 1 minuto para carregar o banco grande
    const res = await client.query("SELECT data::text as raw_data FROM app_state WHERE key = 'jcengenharia_db' LIMIT 1");
    client.release();

    if (res.rows.length > 0) {
      let rawData = res.rows[0].raw_data;
      if (rawData) {
        let parsedData = null;
        let isValid = false;
        let wasRepaired = false;

        try {
          parsedData = JSON.parse(rawData);
          isValid = true;
        } catch (e) {
          console.error("Dados baixados do Supabase são uma string JSON inválida. Tentando reparar...", e);
          try {
            const repaired = jsonrepair(rawData);
            parsedData = JSON.parse(repaired);
            isValid = true;
            wasRepaired = true;
            console.log("Sucesso: Dados baixados do Supabase reparados com jsonrepair!");
          } catch (repairErr) {
            console.error("Falha ao reparar dados baixados do Supabase:", repairErr);
          }
        }

        if (isValid && parsedData) {
          // Descompacta se estiver compactado no banco de dados do Supabase
          parsedData = decompressPayloadIfNeeded(parsedData);

          // Sanitiza os dados para remover imagens base64 gigantes que incham e travam o banco
          const { sanitized, isModified } = sanitizeDbData(parsedData);
          parsedData = sanitized;

          const serialized = JSON.stringify(parsedData, null, 2);
          const tempPath = DB_PATH + ".tmp";
          const backupPath = DB_PATH + ".bak";

          try {
            // Gravação atômica local
            fs.writeFileSync(tempPath, serialized, "utf8");
            fs.renameSync(tempPath, DB_PATH);
            fs.writeFileSync(backupPath, serialized, "utf8");
            console.log("Banco de dados local (database.json) sincronizado com sucesso a partir dos dados do Supabase!");
          } catch (writeErr) {
            console.error("Falha ao salvar dados baixados do Supabase localmente:", writeErr);
          }

          // Se os dados foram reparados ou sanitizados (modificados), sincroniza de volta na nuvem para limpar o Supabase
          if (wasRepaired || isModified) {
            try {
              console.log("Sincronizando de volta os dados reparados/sanitizados para limpar o banco na nuvem (Supabase)...");
              const writeClient = await p.connect();
              try {
                await writeClient.query("SET statement_timeout = 120000;"); // 2 minutos para processar os 12MB
                const compressedPayload = prepareSupabasePayload(parsedData);
                await writeClient.query(
                  "INSERT INTO app_state (key, data, updated_at) VALUES ('jcengenharia_db', $1, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at",
                  [compressedPayload]
                );
                console.log("Banco de dados na nuvem (Supabase) atualizado e limpo com sucesso!");
              } finally {
                writeClient.release();
              }
            } catch (syncBackErr) {
              console.error("Falha ao sincronizar de volta os dados sanitizados para o Supabase:", syncBackErr);
            }
          }
        } else {
          console.error("Dados corrompidos ou inacabados recebidos do Supabase. Ignorando sincronização para proteger os dados locais.");
        }
      }
    } else {
      // Se não houver dados no Supabase, envia o estado local atual para lá (seeding)
      if (fs.existsSync(DB_PATH)) {
        try {
          const raw = fs.readFileSync(DB_PATH, "utf8");
          let localData;
          try {
            localData = JSON.parse(raw);
          } catch (e) {
            console.warn("Seeding: database.json local está corrompido. Tentando reparar antes de semear...", e);
            const repaired = jsonrepair(raw);
            localData = JSON.parse(repaired);
          }
          const seedClient = await p.connect();
          try {
            await seedClient.query("SET statement_timeout = 120000;"); // 2 minutos para semear o banco grande inicial
            const compressedPayload = prepareSupabasePayload(localData);
            await seedClient.query(
              "INSERT INTO app_state (key, data, updated_at) VALUES ('jcengenharia_db', $1, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at",
              [compressedPayload]
            );
            console.log("Primeira sincronização: Banco de dados local semeado com sucesso no Supabase!");
          } finally {
            seedClient.release();
          }
        } catch (readErr) {
          console.error("Falha ao semear banco de dados inicial no Supabase:", readErr);
        }
      }
    }
  } catch (err: any) {
    let friendlyMessage = err.message || String(err);
    if (err.message && err.message.includes("password authentication failed")) {
      friendlyMessage = "⚠️ FALHA DE SENHA: A senha fornecida na URL de conexão do Supabase está incorreta! Por favor, acesse o painel do Supabase, vá em 'Project Settings' -> 'Database', redefina sua senha e atualize a variável de ambiente SUPABASE_DATABASE_URL com a nova senha.";
    } else if (err.message && err.message.includes("ENETUNREACH")) {
      friendlyMessage = "⚠️ ERRO DE REDE (ENETUNREACH): O servidor do Supabase não pôde ser alcançado por IPv6. Como o plano gratuito não oferece mais IPv4 direto (porta 5432), você DEVE usar a URL do Connection Pooler na porta 6543 (modo Transaction ou Session) para conectar com sucesso via IPv4.";
    }
    console.error("Erro na sincronização inicial com o Supabase:", friendlyMessage);
    isSupabaseConnected = false;
  }
}

// Sincroniza dados com debounce para evitar requisições em excesso
export function queueSupabaseSync(data: any) {
  if (!isSupabaseConnected) {
    const p = getSupabasePool();
    if (!p) return;
    isSupabaseConnected = true; // Força uma tentativa
  }

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    const p = getSupabasePool();
    if (!p) return;

    try {
      const client = await p.connect();
      try {
        await client.query("SET statement_timeout = 120000;"); // 2 minutos para sincronização de banco de dados grande
        const compressedPayload = prepareSupabasePayload(data);
        await client.query(
          "INSERT INTO app_state (key, data, updated_at) VALUES ('jcengenharia_db', $1, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at",
          [compressedPayload]
        );
        console.log("Dados salvos e sincronizados com sucesso no Supabase!");
      } finally {
        client.release();
      }
    } catch (err: any) {
      let friendlyMessage = err.message || String(err);
      if (err.message && err.message.includes("password authentication failed")) {
        friendlyMessage = "⚠️ FALHA DE SENHA NO BACKGROUND: A senha fornecida está incorreta. Atualize sua variável de ambiente SUPABASE_DATABASE_URL.";
      } else if (err.message && err.message.includes("ENETUNREACH")) {
        friendlyMessage = "⚠️ ERRO DE REDE NO BACKGROUND: Não foi possível alcançar o Supabase (ENETUNREACH). Certifique-se de usar a URL do Connection Pooler na porta 6543.";
      } else if (err.message && err.message.includes("timeout")) {
        friendlyMessage = "⚠️ TIMEOUT NO BACKGROUND: O envio de dados para o Supabase expirou devido ao tamanho do banco de dados (12MB). Considere otimizar imagens ou arquivos salvos.";
      }
      console.error("Erro ao enviar atualizações para o Supabase no background:", friendlyMessage);
    }
  }, 1500); // Debounce de 1.5 segundos
}
