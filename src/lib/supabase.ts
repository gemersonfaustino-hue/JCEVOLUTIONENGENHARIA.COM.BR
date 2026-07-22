import { createClient } from "@supabase/supabase-js";

// Helper para extrair o Project Ref do Supabase a partir da string de conexão PostgreSQL
export function getProjectRefFromDbUrl(dbUrl: string | undefined): string | null {
  if (!dbUrl) return null;
  try {
    const trimmed = dbUrl.trim().replace(/^['"]|['"]$/g, "");
    
    // Tenta casar formato: postgresql://postgres.hzhitfxh27fxkoyrhaf@aws-0-us-east-1.pooler.supabase.com:6543/postgres
    const match = trimmed.match(/postgres\.([a-zA-Z0-9_-]+)@/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Tenta casar formato: postgresql://postgres:password@db.hzhitfxh27fxkoyrhaf.supabase.co:5432/postgres
    const hostMatch = trimmed.match(/@db\.([a-zA-Z0-9_-]+)\.supabase/);
    if (hostMatch && hostMatch[1]) {
      return hostMatch[1];
    }

    // Tenta casar qualquer subdomínio do supabase.co ou supabase.com
    const poolerMatch = trimmed.match(/@([a-zA-Z0-9_-]+)\.pooler\.supabase/);
    if (poolerMatch && poolerMatch[1]) {
      return poolerMatch[1];
    }
  } catch (e) {
    console.error("Erro ao tentar extrair Project Ref do Supabase:", e);
  }
  return null;
}

// Em ambientes de compilação/browser, `process` pode não estar definido
const getEnvVar = (name: string): string => {
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    return process.env[name] || "";
  }
  return "";
};

// Obtém as chaves e URL de forma inteligente
const databaseUrl = getEnvVar("SUPABASE_DATABASE_URL") || getEnvVar("DATABASE_URL");
const projectRef = getProjectRefFromDbUrl(databaseUrl);

// URL do Supabase: prioriza a direta, depois a deduzida do Postgres, depois fallback
export const supabaseUrl = 
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) || 
  getEnvVar("SUPABASE_URL") ||
  (projectRef ? `https://${projectRef}.supabase.co` : "") ||
  "https://placeholder-project.supabase.co";

// Anon Key do Supabase: prioriza a direta, depois fallback com JWT fictício válido para evitar crash no construtor
export const supabaseAnonKey = 
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
  getEnvVar("SUPABASE_ANON_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTcyMTQwMDAwMCwiZXhwIjoyMDM3MDAwMDAwfQ.placeholder";

// Inicializa o cliente oficial do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log(`[Supabase] Cliente inicializado.`);
console.log(` - URL utilizada: ${supabaseUrl}`);
if (supabaseAnonKey.includes("placeholder")) {
  console.warn(` - ⚠️ Chave SUPABASE_ANON_KEY não fornecida. Certifique-se de configurar VITE_SUPABASE_ANON_KEY no seu arquivo .env para acesso autenticado de cliente.`);
}
