import dns from "dns";

// Force Node.js to resolve IP addresses as IPv4 first instead of IPv6.
// This resolves the 'connect ENETUNREACH' error when trying to connect to Supabase
// in environments where outbound IPv6 routes are unavailable.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initSupabaseSync, queueSupabaseSync } from "./supabaseSync";
import { jsonrepair } from "jsonrepair";

dotenv.config();

const app = express();
const PORT = 3000;

const DEFAULT_DB_PATH = path.join(process.cwd(), "database.json");
const DB_PATH = process.env.DATABASE_PATH || DEFAULT_DB_PATH;

// Auto-seed persistent disk path if it's customized and doesn't exist yet
if (process.env.DATABASE_PATH && !fs.existsSync(DB_PATH)) {
  try {
    const parentDir = path.dirname(DB_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (fs.existsSync(DEFAULT_DB_PATH)) {
      fs.copyFileSync(DEFAULT_DB_PATH, DB_PATH);
      console.log(`Successfully seeded database template to persistent path: ${DB_PATH}`);
    }
  } catch (err) {
    console.error("Failed to seed custom database path:", err);
  }
}

app.use(express.json({ limit: "10mb" }));

// Database Access Utilities
const BACKUP_PATH = DB_PATH + ".bak";

const DEFAULT_SITE_SETTINGS = {
  logoType: "Flyer Gear",
  logoText: "JC EVOLUTION",
  logoSubtext: "MECÂNICA",
  logoSlogan: "Laudos, Inspeções e Soluções em Engenharia Mecânica",
  customLogoUrl: "",
  phone: "(49) 99832-5358",
  email: "josnei.cunha@gmail.com",
  crea: "CREA/RN 2521304182",
  cnpj: "53.111.432/0001-36",
  city: "Aparecida do Taboado",
  state: "MS",
  imgEngineer: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
  imgService1: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
  imgService2: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80",
  imgCardNr12: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80",
  imgCardNr13: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
  imgCardPontes: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80",
  imgCardLaudos: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
  imgCardEstruturas: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
  logoScale: 100,
  logoBg: "white"
};

const DEFAULT_PROJECTS = [
  {
    id: "proj-1",
    title: "Laudo de Vasos de Pressão e Calibração de Válvulas – Videplast",
    client: "Videplast",
    category: "Vasos de Pressão / NR-13",
    location: "Aparecida do Taboado - MS",
    date: "Maio de 2026",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
    description: "Vistoria e ensaio de ultrassom em vaso acumulador de pressão e calibração de válvulas de segurança de compressores de ar na unidade industrial da Videplast, garantindo plena conformidade regulatória com a NR-13.",
    tags: ["Ensaio de Ultrassom", "Vaso de Pressão", "Compressores", "ART CREA"]
  },
  {
    id: "proj-2",
    title: "Laudo de Conformidade e Proteção de Extrusoras – Prevemax",
    client: "Prevemax",
    category: "NR-12",
    location: "Paranaíba - MS",
    date: "Abril de 2026",
    image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80",
    description: "Inventário técnico de maquinários de extrusão de plástico e bobinamento, com projetos de barreiras físicas articuladas de segurança, análise preliminar de riscos e emissão de ART de adequação à NR-12.",
    tags: ["Extrusora de PVC", "Dispositivos de Parada", "ART CREA", "NR-12"]
  },
  {
    id: "proj-3",
    title: "Linha de Vida em Silos de Armazenamento – Maxiplast",
    client: "Maxiplast",
    category: "Estruturas & Linhas de Vida",
    location: "Aparecida do Taboado - MS",
    date: "Março de 2026",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
    description: "Projeto executivo, cálculo de cargas estáticas e certificação mecânica de linha de vida e ancoragem industrial sobre silos e estruturas elevadas na unidade fabril da Maxiplast, em conformidade com a NR-35.",
    tags: ["Linha de Vida", "Cálculo de Cargas", "Ancoragem", "NR-35 Altura"]
  },
  {
    id: "proj-4",
    title: "Laudo de Estabilidade de Pontes Rolantes – Gala Embalagens",
    client: "Gala Embalagens",
    category: "Estruturas & Linhas de Vida",
    location: "Aparecida do Taboado - MS",
    date: "Fevereiro de 2026",
    image: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80",
    description: "Vistoria estrutural e ensaios não destrutivos de trincas nas soldas de vigas de rolamento de ponte rolante de 10 toneladas para transporte de bobinas na Gala Embalagens, assegurando estabilidade estática e operacional.",
    tags: ["Ponte Rolante", "Cálculo de Vigas", "Ensaios Não Destrutivos", "Segurança"]
  },
  {
    id: "proj-5",
    title: "Laudo de Conformidade de Cabine de Pintura – Sulfibra",
    client: "Sulfibra",
    category: "Vasos de Pressão / NR-13",
    location: "Selvíria - MS",
    date: "Janeiro de 2026",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
    description: "Adequação térmica e elaboração de Plano de Manutenção, Operação e Controle (PMOC) para sistemas de exaustão e lavagem de gases em cabines de laminação e pintura de fibra na Sulfibra, atendendo normas da Anvisa.",
    tags: ["PMOC", "Exaustão Industrial", "Gases de Fibra", "ART"]
  },
  {
    id: "proj-6",
    title: "Inspeção de Vasos de Pressão em Silos – Master Agro",
    client: "Master Agro",
    category: "Vasos de Pressão / NR-13",
    location: "Santa Fé do Sul - SP",
    date: "Fevereiro de 2026",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
    description: "Vistoria e teste de estanqueidade em reservatórios pressurizados de ar comprimido usados no sistema de limpeza automática de filtros de mangas em secador e silos de grãos da Master Agro.",
    tags: ["Filtros de Mangas", "Silos de Grãos", "NR-13", "Teste de Estanqueidade"]
  }
];

const DEFAULT_DB = {
  leads: [],
  transactions: [],
  os: [],
  blogPosts: [],
  automations: [],
  automationLogs: [],
  projects: DEFAULT_PROJECTS,
  siteSettings: { ...DEFAULT_SITE_SETTINGS },
  users: [
    {
      id: "josnei",
      username: "josnei",
      email: "josnei.cunha@gmail.com",
      password: "josnei123",
      name: "Eng. Josnei da Cunha",
      role: "engineer",
      crea: "CREA/RN 2521304182"
    },
    {
      id: "admin",
      username: "admin",
      email: "admin@jcengenharia.com",
      password: "admin123",
      name: "Administrador Desenvolvedor",
      role: "admin"
    }
  ]
};

let dbInstance: any = null;
let isDatabaseHealthy = true;

function loadDb() {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = loadDbFromDisk();
  return dbInstance;
}

function ensureDbFields(parsed: any) {
  if (!parsed || typeof parsed !== "object") parsed = {};
  if (!parsed.leads) parsed.leads = [];
  if (!parsed.transactions) parsed.transactions = [];
  if (!parsed.os) parsed.os = [];
  if (!parsed.blogPosts) parsed.blogPosts = [];
  if (!parsed.automations) parsed.automations = [];
  if (!parsed.automationLogs) parsed.automationLogs = [];
  if (!parsed.projects || parsed.projects.length === 0) parsed.projects = [...DEFAULT_PROJECTS];
  if (!parsed.siteSettings) {
    parsed.siteSettings = { ...DEFAULT_SITE_SETTINGS };
  } else {
    parsed.siteSettings = { ...DEFAULT_SITE_SETTINGS, ...parsed.siteSettings };
  }
  if (!parsed.users) parsed.users = [...DEFAULT_DB.users];
  return parsed;
}

function loadDbFromDisk() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf8");
      if (!data || data.trim() === "") {
        console.warn("database.json está vazio, inicializando com o padrão.");
        return { ...DEFAULT_DB };
      }

      try {
        const parsed = JSON.parse(data);
        isDatabaseHealthy = true;
        return ensureDbFields(parsed);
      } catch (parseError: any) {
        console.error("Erro crítico: database.json está corrompido (SyntaxError). Tentando reparar...", parseError);
        
        // Tenta reparar com jsonrepair
        try {
          const repaired = jsonrepair(data);
          const parsed = JSON.parse(repaired);
          console.log("Sucesso: database.json foi reparado com jsonrepair!");
          fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), "utf8");
          isDatabaseHealthy = true;
          return ensureDbFields(parsed);
        } catch (repairError) {
          console.error("Falha ao reparar database.json:", repairError);
        }

        // Tenta recuperar do backup
        if (fs.existsSync(BACKUP_PATH)) {
          try {
            console.log("Tentando carregar a partir do backup (.bak)...");
            const backupData = fs.readFileSync(BACKUP_PATH, "utf8");
            const parsed = JSON.parse(backupData);
            fs.writeFileSync(DB_PATH, backupData, "utf8");
            console.log("Sucesso: Banco de dados restaurado a partir do backup!");
            isDatabaseHealthy = true;
            return ensureDbFields(parsed);
          } catch (backupErr) {
            console.error("Backup também corrompido ou ilegível:", backupErr);
            // Tenta reparar o backup
            try {
              const backupData = fs.readFileSync(BACKUP_PATH, "utf8");
              const repairedBackup = jsonrepair(backupData);
              const parsed = JSON.parse(repairedBackup);
              const formatted = JSON.stringify(parsed, null, 2);
              fs.writeFileSync(DB_PATH, formatted, "utf8");
              fs.writeFileSync(BACKUP_PATH, formatted, "utf8");
              console.log("Sucesso: Backup reparado e restaurado com sucesso!");
              isDatabaseHealthy = true;
              return ensureDbFields(parsed);
            } catch (repairBackupError) {
              console.error("Falha crítica ao reparar o backup:", repairBackupError);
            }
          }
        }

        // Se ambos estiverem corrompidos e irreparáveis, move o arquivo corrompido e inicia limpo
        const corruptedPath = DB_PATH + `.corrupted-${Date.now()}`;
        try {
          fs.renameSync(DB_PATH, corruptedPath);
          console.warn(`O arquivo corrompido foi movido para: ${corruptedPath}`);
          if (fs.existsSync(BACKUP_PATH)) {
            fs.renameSync(BACKUP_PATH, BACKUP_PATH + `.corrupted-${Date.now()}`);
          }
        } catch (renameErr) {
          console.error("Falha ao renomear arquivo corrompido:", renameErr);
        }
      }
    }
  } catch (error) {
    console.error("Erro geral no carregamento do banco de dados:", error);
  }

  console.warn("ATENÇÃO: Inicializando banco de dados com valores padrão vazios. Sincronização protegida.");
  isDatabaseHealthy = false; // Bloqueia a gravação para evitar sobrescrever o Supabase
  return { ...DEFAULT_DB };
}

function saveDb(data: any) {
  // Atualiza a instância em memória primeiro
  dbInstance = data;
  
  // Limita os logs de automação para no máximo 100 itens para evitar o inchaço do banco de dados e arquivos gigantescos
  if (dbInstance.automationLogs && dbInstance.automationLogs.length > 100) {
    dbInstance.automationLogs = dbInstance.automationLogs.slice(0, 100);
  }

  // Se o banco foi detectado como irreparavelmente corrompido na inicialização,
  // bloqueia salvamentos automáticos que possam redefinir o Supabase/nuvem como vazio.
  if (!isDatabaseHealthy) {
    console.error("CRÍTICO: Gravação de banco de dados bloqueada. O banco está marcado como corrompido e a sincronização com Supabase foi suspensa para evitar perda de dados na nuvem.");
    return;
  }

  try {
    const serialized = JSON.stringify(dbInstance, null, 2);
    const tempPath = DB_PATH + ".tmp";
    
    // Gravação atômica: escreve no arquivo temporário e depois renomeia (evita truncamento e corrupção)
    fs.writeFileSync(tempPath, serialized, "utf8");
    fs.renameSync(tempPath, DB_PATH);
    
    // Cria/atualiza o arquivo de backup
    fs.writeFileSync(BACKUP_PATH, serialized, "utf8");
    
    // Envia para a fila de sincronização do Supabase
    queueSupabaseSync(dbInstance);
  } catch (error) {
    console.error("Error writing database atomically:", error);
    
    // Fallback de escrita direta caso a renomeação atômica falhe por questões de permissão
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(dbInstance, null, 2), "utf8");
    } catch (fallbackErr) {
      console.error("Critical: Fallback direct write failed too:", fallbackErr);
    }
  }
}

// Lazy initialization of Gemini Client
function getGeminiClientSafe(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (e) {
    console.error("Error creating GoogleGenAI client:", e);
    return null;
  }
}

// Deprecated fallback helper
function getGeminiClient(): GoogleGenAI {
  const client = getGeminiClientSafe();
  if (!client) {
    throw new Error("GEMINI_API_KEY environment variable is required or invalid");
  }
  return client;
}

// Automation helper
function triggerAutomationsForLead(lead: any, eventType: string) {
  const db = loadDb();
  const matchedAutomations = db.automations.filter((a: any) => a.event === eventType && a.enabled);
  
  let logsAdded = false;
  for (const auto of matchedAutomations) {
    const timestamp = new Date().toISOString();
    let message = `Automação "${auto.event}" disparada para ${lead.company || lead.name}. `;
    
    if (auto.actions.includes("Criar Lead no CRM")) {
      message += "Lead adicionado ao pipeline. ";
    }
    if (auto.actions.includes("Enviar Mensagem Simulada de WhatsApp")) {
      message += `WhatsApp disparado para ${lead.phone || "contato"}: "Olá, recebemos sua solicitação para ${lead.service || "Serviço"}. Retornaremos em breve!" `;
    }
    if (auto.actions.includes("Criar Alerta de Visita Técnica") || auto.actions.includes("Gerar Tarefa de Re-inspeção")) {
      message += `Tarefa de campo agendada na agenda do Eng. Josnei. `;
    }
    if (auto.actions.includes("Notificar Cliente por E-mail")) {
      message += `E-mail de proposta enviado automaticamente para ${lead.email}. `;
    }
    
    db.automationLogs.unshift({
      time: timestamp,
      event: eventType,
      message: message
    });
    logsAdded = true;
  }
  
  if (logsAdded) {
    saveDb(db);
  }
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// CRM Leads Endpoints
app.get("/api/crm/leads", (req, res) => {
  const db = loadDb();
  res.json(db.leads);
});

app.post("/api/crm/leads", (req, res) => {
  const db = loadDb();
  const newLead = {
    id: "lead-" + Date.now(),
    name: req.body.name || "Sem Nome",
    company: req.body.company || "Autônomo",
    email: req.body.email || "",
    phone: req.body.phone || "",
    status: req.body.status || "Lead",
    service: req.body.service || "ART",
    value: parseFloat(req.body.value) || 0,
    date: req.body.date || new Date().toISOString().split("T")[0],
    latOffset: parseFloat(req.body.latOffset) || (Math.random() * 0.06 - 0.03),
    lngOffset: parseFloat(req.body.lngOffset) || (Math.random() * 0.06 - 0.03),
    address: req.body.address || "Aparecida do Taboado - MS",
    outreachScript: req.body.outreachScript || "",
    documents: req.body.documents || [],
    photos: req.body.photos || []
  };

  db.leads.push(newLead);
  saveDb(db);

  // Trigger automation for lead created
  triggerAutomationsForLead(newLead, "Novo Orçamento Gerado");

  res.status(201).json(newLead);
});

app.put("/api/crm/leads/:id", (req, res) => {
  const db = loadDb();
  const index = db.leads.findIndex((l: any) => l.id === req.params.id);
  if (index !== -1) {
    db.leads[index] = { ...db.leads[index], ...req.body };
    saveDb(db);
    res.json(db.leads[index]);
  } else {
    res.status(404).json({ error: "Lead não encontrado" });
  }
});

app.delete("/api/crm/leads/:id", (req, res) => {
  const db = loadDb();
  db.leads = db.leads.filter((l: any) => l.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

// ERP Transactions Endpoints
app.get("/api/erp/transactions", (req, res) => {
  const db = loadDb();
  res.json(db.transactions);
});

app.post("/api/erp/transactions", (req, res) => {
  const db = loadDb();
  const newTx = {
    id: "t-" + Date.now(),
    description: req.body.description || "Transação sem título",
    type: req.body.type || "receivable",
    value: parseFloat(req.body.value) || 0,
    date: req.body.date || new Date().toISOString().split("T")[0],
    status: req.body.status || "pago",
    category: req.body.category || "PIX"
  };

  db.transactions.push(newTx);
  saveDb(db);
  res.status(201).json(newTx);
});

app.delete("/api/erp/transactions/:id", (req, res) => {
  const db = loadDb();
  db.transactions = db.transactions.filter((t: any) => t.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

// ERP Service Orders Endpoints
app.get("/api/erp/os", (req, res) => {
  const db = loadDb();
  res.json(db.os);
});

app.post("/api/erp/os", (req, res) => {
  const db = loadDb();
  const newOs = {
    id: "os-" + Date.now(),
    leadId: req.body.leadId || "",
    title: req.body.title || "Ordem de Serviço",
    engineer: "Eng. Josnei da Cunha",
    status: req.body.status || "Em Andamento",
    checklist: req.body.checklist || [
      { item: "Vistoria técnica preliminar", checked: false },
      { item: "Verificação de conformidade", checked: false },
      { item: "Emissão de laudo técnico", checked: false },
      { item: "Anotação de Responsabilidade Técnica (ART)", checked: false }
    ],
    startDate: req.body.startDate || new Date().toISOString().split("T")[0],
    endDate: req.body.endDate || "",
    photoUrl: req.body.photoUrl || "",
    signature: req.body.signature || ""
  };

  db.os.push(newOs);
  saveDb(db);
  res.status(201).json(newOs);
});

app.put("/api/erp/os/:id", (req, res) => {
  const db = loadDb();
  const index = db.os.findIndex((o: any) => o.id === req.params.id);
  if (index !== -1) {
    db.os[index] = { ...db.os[index], ...req.body };
    saveDb(db);
    res.json(db.os[index]);
  } else {
    res.status(404).json({ error: "OS não encontrada" });
  }
});

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
app.post("/api/auth/register", (req, res) => {
  const { name, username, email, password, role, crea } = req.body;
  if (!name || !username || !email || !password || !role) {
    return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
  }

  const db = loadDb();
  if (!db.users) {
    db.users = [
      {
        id: "josnei",
        username: "josnei",
        email: "josnei.cunha@gmail.com",
        password: "josnei123",
        name: "Eng. Josnei da Cunha",
        role: "engineer",
        crea: "CREA/RN 2521304182"
      },
      {
        id: "admin",
        username: "admin",
        email: "admin@jcengenharia.com",
        password: "admin123",
        name: "Administrador Desenvolvedor",
        role: "admin"
      }
    ];
  }

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  const userExists = db.users.some((u: any) => 
    u.username.trim().toLowerCase() === normalizedUsername || 
    u.email.trim().toLowerCase() === normalizedEmail
  );

  if (userExists) {
    return res.status(400).json({ error: "Este nome de usuário ou e-mail já está cadastrado." });
  }

  const newUser = {
    id: username.trim().toLowerCase().replace(/[^a-z0-9]/g, "_"),
    username: username.trim(),
    email: email.trim(),
    password: password.trim(),
    name: name.trim(),
    role: role,
    crea: crea ? crea.trim() : undefined
  };

  db.users.push(newUser);
  saveDb(db);

  return res.json({
    success: true,
    message: "Novo proprietário cadastrado com sucesso!",
    user: {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      email: newUser.email,
      crea: newUser.crea
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
  }

  const normalizedUser = username.trim().toLowerCase();
  
  // Load dynamic users or initialize defaults
  const db = loadDb();
  if (!db.users) {
    db.users = [
      {
        id: "josnei",
        username: "josnei",
        email: "josnei.cunha@gmail.com",
        password: "josnei123",
        name: "Eng. Josnei da Cunha",
        role: "engineer",
        crea: "CREA/RN 2521304182"
      },
      {
        id: "admin",
        username: "admin",
        email: "admin@jcengenharia.com",
        password: "admin123",
        name: "Administrador Desenvolvedor",
        role: "admin"
      }
    ];
    saveDb(db);
  }

  const matchedUser = db.users.find((u: any) => 
    (u.username.trim().toLowerCase() === normalizedUser || u.email.trim().toLowerCase() === normalizedUser) && 
    u.password === password
  );

  if (matchedUser) {
    return res.json({
      success: true,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.role,
        email: matchedUser.email,
        crea: matchedUser.crea
      }
    });
  }
  
  res.status(401).json({ error: "Credenciais inválidas. Verifique os dados de acesso." });
});

app.get("/api/auth/user/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  if (!db.users) {
    db.users = [
      {
        id: "josnei",
        username: "josnei",
        email: "josnei.cunha@gmail.com",
        password: "josnei123",
        name: "Eng. Josnei da Cunha",
        role: "engineer",
        crea: "CREA/RN 2521304182"
      },
      {
        id: "admin",
        username: "admin",
        email: "admin@jcengenharia.com",
        password: "admin123",
        name: "Administrador Desenvolvedor",
        role: "admin"
      }
    ];
    saveDb(db);
  }

  const found = db.users.find((u: any) => u.id === id);
  if (found) {
    return res.json({
      success: true,
      user: {
        id: found.id,
        username: found.username,
        email: found.email,
        name: found.name,
        role: found.role,
        crea: found.crea
      }
    });
  }
  res.status(404).json({ error: "Usuário não encontrado" });
});

app.get("/api/auth/users", (req, res) => {
  const db = loadDb();
  if (!db.users) {
    db.users = [
      {
        id: "josnei",
        username: "josnei",
        email: "josnei.cunha@gmail.com",
        password: "josnei123",
        name: "Eng. Josnei da Cunha",
        role: "engineer",
        crea: "CREA/RN 2521304182"
      },
      {
        id: "admin",
        username: "admin",
        email: "admin@jcengenharia.com",
        password: "admin123",
        name: "Administrador Desenvolvedor",
        role: "admin"
      }
    ];
    saveDb(db);
  }
  return res.json({ success: true, users: db.users });
});

app.post("/api/auth/update-credentials", (req, res) => {
  const { userId, newUsername, newEmail, newPassword, newName, newRole, newCrea } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "ID do usuário é obrigatório." });
  }

  const db = loadDb();
  if (!db.users) {
    db.users = [
      {
        id: "josnei",
        username: "josnei",
        email: "josnei.cunha@gmail.com",
        password: "josnei123",
        name: "Eng. Josnei da Cunha",
        role: "engineer",
        crea: "CREA/RN 2521304182"
      },
      {
        id: "admin",
        username: "admin",
        email: "admin@jcengenharia.com",
        password: "admin123",
        name: "Administrador Desenvolvedor",
        role: "admin"
      }
    ];
  }

  const userIndex = db.users.findIndex((u: any) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  if (newUsername && newUsername.trim()) {
    db.users[userIndex].username = newUsername.trim();
  }
  if (newEmail && newEmail.trim()) {
    db.users[userIndex].email = newEmail.trim();
  }
  if (newPassword && newPassword.trim()) {
    db.users[userIndex].password = newPassword.trim();
  }
  if (newName && newName.trim()) {
    db.users[userIndex].name = newName.trim();
  }
  if (newRole && newRole.trim()) {
    db.users[userIndex].role = newRole.trim();
  }
  if (newCrea !== undefined) {
    db.users[userIndex].crea = newCrea.trim() || undefined;
  }

  saveDb(db);

  return res.json({
    success: true,
    message: "Credenciais de acesso atualizadas com sucesso!",
    user: {
      id: db.users[userIndex].id,
      name: db.users[userIndex].name,
      role: db.users[userIndex].role,
      email: db.users[userIndex].email,
      crea: db.users[userIndex].crea
    }
  });
});

// Helper to sanitize generated/written text for a sophisticated design (No '#' and no '*')
function cleanSophisticatedContent(text: string): string {
  if (!text) return "";
  return text
    .replace(/[#*`_\\]/g, "") // Completely strip characters: #, *, `, _, \
    .trim();
}

// Blog Endpoints
app.get("/api/blog/posts", (req, res) => {
  const db = loadDb();
  const showAll = req.query.admin === "true";
  
  if (showAll) {
    res.json(db.blogPosts);
  } else {
    // Public feed: only return posts where publishDate <= today's date
    const today = new Date().toISOString().split("T")[0];
    const published = db.blogPosts.filter((post: any) => {
      const pubDate = post.publishDate || post.date;
      return pubDate <= today;
    });
    res.json(published);
  }
});

app.post("/api/blog/posts", (req, res) => {
  const db = loadDb();
  const cleanedTitle = cleanSophisticatedContent(req.body.title || "Sem título");
  const cleanedSummary = cleanSophisticatedContent(req.body.summary || "");
  const cleanedContent = cleanSophisticatedContent(req.body.content || "");
  
  const newPost = {
    id: "post-" + Date.now(),
    title: cleanedTitle,
    summary: cleanedSummary,
    content: cleanedContent,
    category: req.body.category || "Geral",
    author: "Eng. Josnei da Cunha",
    date: new Date().toISOString().split("T")[0],
    publishDate: req.body.publishDate || new Date().toISOString().split("T")[0],
    imageUrl: req.body.imageUrl || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60"
  };

  db.blogPosts.unshift(newPost);
  saveDb(db);
  res.status(201).json(newPost);
});

app.delete("/api/blog/posts/:id", (req, res) => {
  const db = loadDb();
  db.blogPosts = db.blogPosts.filter((p: any) => p.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

// Projects API Endpoints
app.get("/api/projects", (req, res) => {
  const db = loadDb();
  res.json(db.projects || []);
});

app.post("/api/projects", (req, res) => {
  const db = loadDb();
  if (!db.projects) db.projects = [];
  
  const newProj = {
    id: "proj-" + Date.now(),
    title: req.body.title || "Sem título",
    client: req.body.client || "",
    category: req.body.category || "Geral",
    location: req.body.location || "",
    date: req.body.date || "",
    image: req.body.image || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
    description: req.body.description || "",
    tags: Array.isArray(req.body.tags) ? req.body.tags : []
  };
  
  db.projects.unshift(newProj);
  saveDb(db);
  res.status(201).json(newProj);
});

app.put("/api/projects/:id", (req, res) => {
  const db = loadDb();
  if (!db.projects) db.projects = [];
  
  const index = db.projects.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    db.projects[index] = {
      ...db.projects[index],
      title: req.body.title !== undefined ? req.body.title : db.projects[index].title,
      client: req.body.client !== undefined ? req.body.client : db.projects[index].client,
      category: req.body.category !== undefined ? req.body.category : db.projects[index].category,
      location: req.body.location !== undefined ? req.body.location : db.projects[index].location,
      date: req.body.date !== undefined ? req.body.date : db.projects[index].date,
      image: req.body.image !== undefined ? req.body.image : db.projects[index].image,
      description: req.body.description !== undefined ? req.body.description : db.projects[index].description,
      tags: Array.isArray(req.body.tags) ? req.body.tags : db.projects[index].tags
    };
    saveDb(db);
    res.json(db.projects[index]);
  } else {
    res.status(404).json({ error: "Projeto não encontrado" });
  }
});

app.delete("/api/projects/:id", (req, res) => {
  const db = loadDb();
  if (!db.projects) db.projects = [];
  db.projects = db.projects.filter((p: any) => p.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});


// Blog Generation via Gemini API with resilient programmatic fallback
app.post("/api/blog/generate", async (req, res) => {
  try {
    const { topic, publishDate } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "O tema do artigo é obrigatório." });
    }

    const client = getGeminiClientSafe();
    let parsedArticle: any = null;

    if (client) {
      try {
        const prompt = `Você é um engenheiro mecânico especializado em consultoria industrial, segurança do trabalho (NR-12, NR-13, pontes rolantes, estruturas metálicas, linhas de vida) e emissão de ARTs chamado Josnei da Cunha, proprietário da JC EVOLUTION ENGENHARIA MECÂNICA de Aparecida do Taboado - MS.
Escreva um artigo de blog extremamente profissional, instrutivo, cativante e de leitura fluida sobre o tema: "${topic}".

IMPORTANTE (DIRETRIZES DE FORMATO):
O texto deve ser muito sofisticado. Você NÃO pode usar formatação markdown tradicional como hashtags (#) para títulos ou asteriscos (*) para negrito/itálico. 
Para criar estrutura e divisões de seções, use títulos escritos totalmente em LETRAS MAIÚSCULAS e separe as seções com duas quebras de linha em branco.
Não utilize marcadores com asterisco para listas; se necessário, use números (1., 2.) ou pequenos travessões (-) sem símbolos markdown.

O artigo deve conter:
1. Um título chamativo e profissional em português (sem símbolos especiais).
2. Um resumo de 1 ou 2 sentenças para atração rápida de clientes e leads.
3. Conteúdo estruturado em seções bem espaçadas e elegantes.
4. Uma conclusão que incentive o leitor a procurar a JC EVOLUTION ENGENHARIA MECÂNICA para soluções técnicas de segurança. Indique o telefone de contato (49) 99832-5358 e e-mail josnei.cunha@gmail.com.

Retorne EXCLUSIVAMENTE um objeto JSON no formato abaixo, sem tags de código markdown (como \`\`\`json) ao redor:
{
  "title": "Título do artigo gerado",
  "summary": "Resumo curto e cativante",
  "content": "Conteúdo completo com espaçamentos elegantes",
  "category": "Categoria sugerida (ex: NR-12, NR-13, ART, Legislação, etc.)"
}`;

        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const resultText = response.text || "";
        const cleanedText = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsedArticle = JSON.parse(cleanedText);
      } catch (apiErr) {
        console.warn("Gemini blog generator failed, falling back to local template:", apiErr);
      }
    }

    // High quality template fallback generator
    if (!parsedArticle) {
      const topicLower = topic.toLowerCase();
      if (topicLower.includes("nr-12") || topicLower.includes("nr12") || topicLower.includes("máquina") || topicLower.includes("maquina")) {
        parsedArticle = {
          title: "A Importância Crucial da NR-12 na Indústria: Evitando Passivos e Acidentes",
          summary: "Um guia definitivo sobre como a adequação de máquinas sob a norma regulamentadora NR-12 garante segurança jurídica e protege vidas na operação fabril.",
          content: `INTRODUÇÃO

A segurança industrial deixou de ser apenas uma exigência cartorial para se tornar um pilar estratégico de competitividade e responsabilidade corporativa. No centro desse debate está a NR-12, a norma regulamentadora que rege a segurança no trabalho em máquinas e equipamentos. Sua correta implementação é a maior garantia que uma empresa possui contra terríveis acidentes de trabalho e severas sanções legais.


DIRETRIZES TÉCNICAS E FISCALIZAÇÃO

O processo de adequação conforme a NR-12 não ocorre ao acaso. Ele exige um roteiro técnico estrito, iniciado pelo inventário minucioso de todo o maquinário da planta industrial. A partir daí, o Engenheiro Mecânico realiza uma Análise de Riscos detalhada, estabelecendo o nível de risco de cada máquina por metodologias de engenharia como o HRN (Hazard Rating Number). 

Com esses dados em mãos, projetam-se as proteções físicas fixas e móveis dotadas de intertravamento de segurança com sensores codificados de duplo canal. Por fim, elabora-se o Laudo Técnico de Conformidade acompanhado da respectiva Anotação de Responsabilidade Técnica (ART) emitida junto ao CREA.


CONSEQUÊNCIAS DA INÉRCIA

A negligência na adequação de prensas, tornos, moinhos e esteiras transportadoras expõe a indústria a riscos colossais. Além do perigo iminente de mutilações e mortes, a ausência de documentação técnica regularizada resulta em multas pesadíssimas aplicadas pelo Ministério do Trabalho, interdições sumárias da produção e processos civis e criminais contra os administradores do negócio.


SOLUÇÃO JC EVOLUTION ENGENHARIA MECÂNICA

A JC EVOLUTION ENGENHARIA MECÂNICA, sediada em Aparecida do Taboado - MS, apoia as empresas de toda a região no diagnóstico e execução de laudos de conformidade com a NR-12. Sob a responsabilidade técnica do Eng. Josnei da Cunha, entregamos soluções viáveis que integram segurança impecável sem prejudicar a produtividade de sua planta.

Proteja seu patrimônio e a vida de seus operadores hoje mesmo. Entre em contato conosco e agende um diagnóstico inicial sem compromisso pelo telefone (49) 99832-5358 ou pelo e-mail josnei.cunha@gmail.com.`,
          category: "NR-12"
        };
      } else if (topicLower.includes("nr-13") || topicLower.includes("nr13") || topicLower.includes("caldeira") || topicLower.includes("vaso") || topicLower.includes("compressor") || topicLower.includes("pressão")) {
        parsedArticle = {
          title: "Inspeção NR-13: Segurança Obrigatória em Caldeiras e Vasos de Pressão",
          summary: "Entenda por que a inspeção periódica de compressores, reservatórios de vapor e caldeiras com ART é mandatória por lei para prevenir catástrofes.",
          content: `INTRODUÇÃO

Caldeiras industriais, vasos de pressão, acumuladores de ar comprimido e tubulações de vapor armazenam montantes gigantescos de energia térmica e pneumática. Sem o controle rigoroso de sua integridade estrutural, esses equipamentos operam como verdadeiras bombas-relógio ocultas em pátios industriais, postos de combustíveis e cooperativas agroindustriais. A NR-13 é a norma legal que estabelece a obrigatoriedade da inspeção periódica para mitigar esses perigos.


A INVASÃO DO ULTRASSOM E O TESTE HIDROSTÁTICO

A inspeção periódica de segurança de um vaso de pressão exige exames físicos rigorosos conduzidos por um Engenheiro Mecânico habilitado atuando como Profissional Legalmente Habilitado (PLH). O processo envolve testes de integridade, inspeção visual interna e externa, medição de espessura de chapa metálica por ultrassom (detectando corrosões invisíveis a olho nu) e o teste hidrostático em caldeiras novas ou reparadas. 

Adicionalmente, realiza-se a calibração periódica dos dispositivos de segurança essenciais, como manômetros e válvulas de alívio de pressão, cujas vedações são lacradas e registradas sob o livro de segurança oficial da NR-13.


A EXIGÊNCIA JURÍDICA E DE SEGUROS

A inobservância do cronograma de inspeções anuais de vasos de pressão e caldeiras acarreta sanções graves. A fiscalização federal possui autoridade para paralisar compressores e plantas inteiras de imediato. Além disso, as seguradoras recusam-se terminantemente a pagar indenizações de sinistros em estabelecimentos industriais cuja documentação da NR-13 não esteja rigorosamente assinada e com ART ativa do CREA.


ASSESSORIA DA JC EVOLUTION ENGENHARIA MECÂNICA

Seja para um simples compressor de oficina mecânica ou para caldeiras complexas de usinas e laticínios, a JC EVOLUTION ENGENHARIA MECÂNICA oferece excelência na prestação de serviços da NR-13. O Engenheiro Josnei da Cunha realiza vistorias minuciosas, testes não destrutivos avançados, calibração certificada e regulariza prontamente seu Livro de Registro de Segurança.

Evite penalidades e durma com a certeza de uma operação segura. Agende sua vistoria NR-13 pelo WhatsApp (49) 99832-5358 ou envie uma solicitação para josnei.cunha@gmail.com.`,
          category: "NR-13"
        };
      } else {
        parsedArticle = {
          title: "A Importância do Laudo Técnico com ART na Engenharia Mecânica",
          summary: "Descubra por que a emissão da Anotação de Responsabilidade Técnica (ART) é a única chancela legal de segurança estrutural de seus equipamentos.",
          content: `INTRODUÇÃO

Na engenharia de segurança, todo laudo técnico pericial ou adequação mecânica possui um valor jurídico nulo se não for devidamente respaldado pelo principal documento de classe profissional do país: a Anotação de Responsabilidade Técnica, famosa sob a sigla ART. Emitida diretamente no conselho do CREA, a ART é a garantia de que o serviço foi planejado e supervisionado por um especialista gabaritado.


LAUDOS E CERTIFICAÇÕES EM LINHAS DE VIDA E PONTES ROLANTES

Um exemplo clássico de aplicação indispensável de laudos e ART ocorre na vistoria de Pontes Rolantes, pórticos e monovias de içamento de cargas industriais. Tratam-se de estruturas submetidas a esforços dinâmicos intensos que exigem exames de fadiga e laudos de capacidade de carga periódicos. 

Da mesma forma, sistemas de proteção coletiva contra quedas em altura (sistemas de ancoragem e linhas de vida industriais rege pela NR-35) necessitam de cálculo estrutural preciso e ART assinada por engenheiro mecânico para comprovar que as ancoragens suportarão a força de impacto em caso de queda de um operador.


SEGURANÇA JURÍDICA PARA ADMINISTRADORES

Para diretores, gerentes de manutenção e proprietários de cooperativas, contratar inspeções técnicas sem emissão de ART correspondente é assumir um passivo inestimável. Em eventual falha do equipamento ou acidente com colaboradores, a responsabilidade civil e criminal recai integralmente sobre a gestão da empresa, acusada de negligência. A ART transfere a responsabilidade técnica do projeto e segurança diretamente ao engenheiro signatário.


COMPROMISSO JC EVOLUTION ENGENHARIA MECÂNICA

A JC EVOLUTION ENGENHARIA MECÂNICA, liderada pelo Eng. Josnei da Cunha, executa laudos de estabilidade mecânica, PMOC para sistemas de climatização, projetos estruturais e inspeções de máquinas emitindo ART do CREA com agilidade e total rigor normativo em Aparecida do Taboado - MS e estados circunvizinhos.

Traga segurança técnica e jurídica para sua gestão empresarial hoje mesmo. Solicite uma visita comercial ou orçamento com o Eng. Josnei pelo fone (49) 99832-5358 ou pelo correio eletrônico josnei.cunha@gmail.com.`,
          category: "Laudo com ART"
        };
      }
    }

    // Apply rigorous pre-cleansing of raw hashtags/asterisks to ensure sophisticated plain text
    let content = parsedArticle.content || "Conteúdo indisponível.";
    content = content.replace(/^\s*\*\s+/gm, "• "); // Preserve clean bullet points as plain circles
    
    const finalContent = cleanSophisticatedContent(content);
    const finalTitle = cleanSophisticatedContent(parsedArticle.title || topic);
    const finalSummary = cleanSophisticatedContent(parsedArticle.summary || "");

    // Save to DB
    const db = loadDb();
    const newPost = {
      id: "post-" + Date.now(),
      title: finalTitle,
      summary: finalSummary,
      content: finalContent,
      category: parsedArticle.category || "Consultoria",
      author: "Eng. Josnei da Cunha",
      date: new Date().toISOString().split("T")[0],
      publishDate: publishDate || new Date().toISOString().split("T")[0],
      imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=60"
    };

    db.blogPosts.unshift(newPost);
    saveDb(db);

    res.json(newPost);
  } catch (error: any) {
    console.error("Error generating blog post:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar artigo com IA." });
  }
});

// Prospecção Inteligente via Gemini API
app.post("/api/prospect", async (req, res) => {
  try {
    const { city, state, neighborhood, cep, radius } = req.body;
    if (!city || !state) {
      return res.status(400).json({ error: "Cidade e Estado são obrigatórios." });
    }

    const radiusVal = parseInt(radius || "10", 10);
    
    // Determine surrounding cities based on radius
    const targetCities: { name: string; state: string }[] = [{ name: city, state: state }];
    if (radiusVal >= 20) {
      targetCities.push({ name: "Santa Fé do Sul", state: "SP" });
      targetCities.push({ name: "Selvíria", state: "MS" });
      targetCities.push({ name: "Rubinéia", state: "SP" });
    }
    if (radiusVal >= 50) {
      targetCities.push({ name: "Paranaíba", state: "MS" });
      targetCities.push({ name: "Ilha Solteira", state: "SP" });
    }
    if (radiusVal >= 100) {
      targetCities.push({ name: "Jales", state: "SP" });
      targetCities.push({ name: "Três Lagoas", state: "MS" });
      targetCities.push({ name: "Andradina", state: "SP" });
    }
    if (radiusVal >= 150) {
      targetCities.push({ name: "Fernandópolis", state: "SP" });
      targetCities.push({ name: "Cassilândia", state: "MS" });
    }
    if (radiusVal >= 200) {
      targetCities.push({ name: "Votuporanga", state: "SP" });
      targetCities.push({ name: "Araçatuba", state: "SP" });
    }

    const client = getGeminiClientSafe();
    let generatedLeads: any[] = [];
    const prompt = `Como um analista de prospecção comercial inteligente B2B especializado em engenharia de segurança mecânica, faça uma varredura de mercado simulada baseada em dados realistas para encontrar 12 potenciais clientes industriais ou comerciais de grande/médio porte na região informada:
- Cidade Central: ${city} - ${state}
- Bairro: ${neighborhood || "Todos"}
- CEP: ${cep || "Qualquer"}
- Raio de busca: ${radius || "10"} km

DIRETRIZ DE RAIO DE BUSCA CIRCUNVIZINHO (ESTILO FACEBOOK MARKETPLACE):
Se o raio de busca selecionado for maior que 10km (como 20km, 50km, ou 100km), a prospecção DEVE obrigatoriamente expandir e incluir empresas, cooperativas, silos ou indústrias localizadas em cidades e municípios circunvizinhos correspondentes ao raio informado.
Cidades vizinhas disponíveis no raio: ${targetCities.map(c => `${c.name} (${c.state})`).join(", ")}.
Coloque o endereço completo correto de cada empresa contendo a respectiva cidade encontrada dentro do raio.

SERVIÇOS PRESTADOS POR JOSNEI (SÓ USE ESTES SERVIÇOS):
1. Inspeção de Caldeiras (NR-13)
2. Inspeção de Vasos de Pressão (NR-13)
3. Adequação de Máquinas e Equipamentos (NR-12)
4. Inspeção de Pontes Rolantes
5. Estruturas Metálicas
6. Laudos Técnicos com ART
7. Consultoria em Segurança Industrial
8. Gestão da Manutenção e Confiabilidade

Retorne uma lista com exatamente 12 leads de prospecção qualificados. Cada lead deve ter coordenadas aproximadas latOffset e lngOffset (valores entre -0.05 e +0.05, representando o deslocamento geográfico ideal em relação ao centro da cidade central para posicionar em um mapa).
Retorne EXCLUSIVAMENTE o JSON estruturado conforme o modelo abaixo, sem formatação markdown:
{
  "prospects": [
    {
      "company": "Nome da Empresa, Indústria, Silo ou Cooperativa",
      "segment": "Indústria Metalúrgica / Laticínio / Silos de Grãos / Logística / Agronegócio / Usina",
      "address": "Endereço verossímil completo contendo o nome da cidade (vizinha ou central) correspondente ao raio",
      "contactPerson": "Nome de um responsável fictício (ex: Gerente de Manutenção, Engenheiro de Produção, Diretor de Operações)",
      "phone": "Telefone de contato no padrão brasileiro (XX) 9XXXX-XXXX realista da região",
      "email": "contato@empresa.com.br",
      "potential": "Alto" | "Médio",
      "latOffset": -0.015,
      "lngOffset": 0.02,
      "requiredServices": ["Adequação de Máquinas e Equipamentos (NR-12)", "Inspeção de Vasos de Pressão (NR-13)", "Laudos Técnicos com ART"],
      "suggestedApproach": "Roteiro detalhado de abordagem comercial focado no segmento, sugerindo o que o Eng. Josnei deve falar para vender especificamente os serviços selecionados.",
      "decisionMakers": [
        {
          "name": "Nome do Decisor (ex: Carlos Souza)",
          "role": "Cargo do Decisor (ex: Gerente de Manutenção)",
          "linkedin": "Link personalizado e formatado do LinkedIn (ex: https://www.linkedin.com/in/carlos-souza-gerente-de-manutencao)"
        }
      ]
    }
  ]
}`;

    if (client) {
      try {
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const resultText = response.text || "";
        const cleanedText = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const resultObj = JSON.parse(cleanedText);
        if (resultObj && Array.isArray(resultObj.prospects)) {
          generatedLeads = resultObj.prospects;
        }
      } catch (apiErr) {
        console.warn("API direct generation failed, falling back to rich smart generation engine:", apiErr);
      }
    }

    // List of premium services offered by Josnei
    const availableServices = [
      "Inspeção de Caldeiras (NR-13)",
      "Inspeção de Vasos de Pressão (NR-13)",
      "Adequação de Máquinas e Equipamentos (NR-12)",
      "Inspeção de Pontes Rolantes",
      "Estruturas Metálicas",
      "Laudos Técnicos com ART",
      "Consultoria em Segurança Industrial",
      "Gestão da Manutenção e Confiabilidade"
    ];

    // Seed templates for the programmatic generator
    const companyTemplates = [
      { prefix: "Silo e Secador de Grãos", segments: ["Silos de Grãos", "Agronegócio"], services: ["Inspeção de Vasos de Pressão (NR-13)", "Inspeção de Caldeiras (NR-13)", "Laudos Técnicos com ART"] },
      { prefix: "Laticínio e Cooperativa", segments: ["Laticínio", "Alimentos"], services: ["Adequação de Máquinas e Equipamentos (NR-12)", "Inspeção de Vasos de Pressão (NR-13)", "Laudos Técnicos com ART"] },
      { prefix: "Frigorífico e Abatedouro", segments: ["Frigorífico", "Alimentos"], services: ["Adequação de Máquinas e Equipamentos (NR-12)", "Inspeção de Vasos de Pressão (NR-13)", "Gestão da Manutenção e Confiabilidade"] },
      { prefix: "Cerâmica e Olaria", segments: ["Cerâmica / Olaria", "Indústria"], services: ["Adequação de Máquinas e Equipamentos (NR-12)", "Inspeção de Caldeiras (NR-13)", "Laudos Técnicos com ART"] },
      { prefix: "Metalúrgica e Fundição", segments: ["Indústria Metalúrgica", "Metal-Mecânica"], services: ["Adequação de Máquinas e Equipamentos (NR-12)", "Inspeção de Pontes Rolantes", "Estruturas Metálicas"] },
      { prefix: "Usina e Destilaria", segments: ["Usina", "Energia e Agro"], services: ["Inspeção de Caldeiras (NR-13)", "Inspeção de Vasos de Pressão (NR-13)", "Estruturas Metálicas", "Laudos Técnicos com ART"] },
      { prefix: "Fábrica de Ração e Nutrição Animal", segments: ["Nutrição Animal", "Agronegócio"], services: ["Adequação de Máquinas e Equipamentos (NR-12)", "Inspeção de Vasos de Pressão (NR-13)", "Laudos Técnicos com ART"] },
      { prefix: "Indústria Têxtil", segments: ["Têxtil / Confecção", "Indústria"], services: ["Adequação de Máquinas e Equipamentos (NR-12)", "Laudos Técnicos com ART", "Consultoria em Segurança Industrial"] },
      { prefix: "Fábrica de Móveis", segments: ["Moveleira", "Madeira"], services: ["Adequação de Máquinas e Equipamentos (NR-12)", "Inspeção de Pontes Rolantes", "Laudos Técnicos com ART"] },
      { prefix: "Logística e Armazenamento", segments: ["Transportadora / Logística", "Logística"], services: ["Inspeção de Pontes Rolantes", "Estruturas Metálicas", "Laudos Técnicos com ART"] },
      { prefix: "Concreteira e Pré-Moldados", segments: ["Construção Civil", "Indústria"], services: ["Adequação de Máquinas e Equipamentos (NR-12)", "Estruturas Metálicas", "Laudos Técnicos com ART"] },
      { prefix: "Fábrica de Plásticos e Embalagens", segments: ["Indústria de Plásticos", "Embalagens"], services: ["Adequação de Máquinas e Equipamentos (NR-12)", "Laudos Técnicos com ART", "Gestão da Manutenção e Confiabilidade"] },
      { prefix: "Serraria e Madeireira", segments: ["Madeireira", "Indústria"], services: ["Adequação de Máquinas e Equipamentos (NR-12)", "Inspeção de Pontes Rolantes", "Laudos Técnicos com ART"] }
    ];

    const namesPool = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Almeida", "Pereira", "Cunha", "Costa", "Lima", "Mendes", "Gomes"];
    const firstNames = ["Roberto", "Carlos", "José", "Marcos", "Claudio", "Fernando", "Antônio", "Ricardo", "Sandro", "Alexandre", "Marcelo", "Julio", "Eduardo"];
    const rolesPool = ["Gerente de Manutenção", "Engenheiro de Produção", "Diretor de Operações", "Coordenador de SMS", "Supervisor de Engenharia", "Gerente Industrial"];
    const streetsPool = ["Av. Industrial", "Rua das Acácias", "Rodovia BR-158", "Av. Brasil", "Rua Projetada A", "Av. JK", "Distrito Industrial I", "Rua Marechal Rondon", "Av. Presidente Vargas"];

    // Expand the list to exactly 50 companies/leads
    const targetLength = 50;
    let seedIndex = 0;

    while (generatedLeads.length < targetLength) {
      const template = companyTemplates[seedIndex % companyTemplates.length];
      const cityObj = targetCities[seedIndex % targetCities.length];
      
      const firstName = firstNames[Math.floor((seedIndex * 7) % firstNames.length)];
      const lastName = namesPool[Math.floor((seedIndex * 13) % namesPool.length)];
      const contactPerson = `${firstName} ${lastName}`;
      const role = rolesPool[Math.floor((seedIndex * 3) % rolesPool.length)];
      
      const ddd = cityObj.state === "MS" ? "67" : "17";
      const phone = `(${ddd}) 9${Math.floor(8000 + (seedIndex * 277) % 1999)}-${Math.floor(1000 + (seedIndex * 311) % 8999)}`;
      
      const companyName = `${template.prefix} ${lastName} Ltda`;
      const address = `${streetsPool[Math.floor((seedIndex * 5) % streetsPool.length)]}, ${Math.floor(100 + (seedIndex * 47) % 1900)} - Distrito Industrial, ${cityObj.name} - ${cityObj.state}`;
      const email = `contato@${companyName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")}.com.br`;

      const latOffset = (Math.sin(seedIndex * 0.9) * 0.045);
      const lngOffset = (Math.cos(seedIndex * 1.1) * 0.045);

      const potential = seedIndex % 3 === 0 ? "Alto" : "Médio";

      // Select localized suggested approach
      let suggestedApproach = "";
      if (template.services.includes("Inspeção de Caldeiras (NR-13)") || template.services.includes("Inspeção de Vasos de Pressão (NR-13)")) {
        suggestedApproach = `Abordagem focada em conformidade da NR-13 para a região de ${cityObj.name}. Inicie ressaltando a segurança de caldeiras e vasos de pressão, mencionando que a falta de inspeção periódica com laudo técnico e emissão de ART pode acarretar multas graves do Ministério do Trabalho e interdição do maquinário. Ofereça um diagnóstico inicial gratuito dos compressores da empresa para abrir as portas.`;
      } else if (template.services.includes("Adequação de Máquinas e Equipamentos (NR-12)")) {
        suggestedApproach = `Apresente a JC EVOLUTION ENGENHARIA MECÂNICA focando na NR-12 (segurança de máquinas e equipamentos de produção). Mencione que adequações preventivas em prensas, guilhotinas e esteiras transportadoras reduzem acidentes e custos com passivos trabalhistas. Proponha uma visita técnica de cortesia de 15 minutos para analisar as barreiras físicas instaladas e sugerir melhorias práticas que não interrompam o fluxo produtivo.`;
      } else {
        suggestedApproach = `Contato direcionado ao setor de manutenção para ofertar assessoria em laudos de pontes rolantes e linhas de vida industriais. Explique que o Eng. Josnei da Cunha realiza vistorias estruturais completas com ART para garantir a conformidade dos equipamentos de içamento, protegendo os operadores e a empresa de intercorrências jurídicas.`;
      }

      const linkedinSlug = contactPerson.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
      generatedLeads.push({
        company: companyName,
        segment: template.segments[0],
        address: address,
        contactPerson: `${contactPerson} (${role})`,
        phone: phone,
        email: email,
        potential: potential,
        latOffset: parseFloat(latOffset.toFixed(4)),
        lngOffset: parseFloat(lngOffset.toFixed(4)),
        requiredServices: template.services,
        suggestedApproach: suggestedApproach,
        decisionMakers: [
          {
            name: contactPerson,
            role: role,
            linkedin: `https://www.linkedin.com/in/${linkedinSlug}-${role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-")}`
          }
        ]
      });

      seedIndex++;
    }

    // Return exactly 50 prospects
    res.json({ prospects: generatedLeads });
  } catch (error: any) {
    console.error("Error in prospect generation:", error);
    res.status(500).json({ error: error.message || "Erro ao realizar prospecção inteligente com IA." });
  }
});

// Curated list of high-quality, professional industrial/mechanical engineering Unsplash photos
// This guarantees that we NEVER serve irrelevant random landscape, animal, or children photos
const CURATED_PHOTOS = [
  {
    url: "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=800&auto=format&fit=crop&q=80",
    category: "imgEngineer",
    description: "Profissional de engenharia de capacete revisando lista de verificação em prancheta",
    tags: ["inspeção", "engenheiro", "geral", "checklist", "segurança", "fábrica", "manutenção"]
  },
  {
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    category: "imgEngineer",
    description: "Engenheira com capacete inspecionando terminal de controle industrial",
    tags: ["inspeção", "controle", "fábrica", "segurança", "refinery", "chemical", "boiler"]
  },
  {
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80",
    category: "imgEngineer",
    description: "Engenheiro em andaime avaliando estrutura de fábrica pesada",
    tags: ["estrutura", "andaime", "indústria pesada", "metalurgia", "siderurgia", "refinery", "welding"]
  },
  {
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&auto=format&fit=crop&q=80",
    category: "imgEngineer",
    description: "Engenheiro de capacete olhando projeto técnico no galpão",
    tags: ["projeto", "plantas", "galpão", "máquinas", "manutenção", "machinery"]
  },
  
  // NR-13 Caldeiras e Vasos de Pressão
  {
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
    category: "imgService1",
    description: "Tubulações de aço inox, caldeira e vasos de pressão industriais",
    tags: ["caldeira", "tubulação", "vaso de pressão", "inox", "refinaria", "refinery", "boiler", "piping"]
  },
  {
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    category: "imgService1",
    description: "Conexões complexas de válvulas e dutos de pressão em usina",
    tags: ["válvulas", "duto de pressão", "usina", "indústria química", "piping", "refinery", "steam"]
  },
  {
    url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
    category: "imgCardNr13",
    description: "Manômetro industrial de pressão e válvulas de controle hidráulico",
    tags: ["manômetro", "válvula", "pressão", "hidráulico", "segurança", "boiler", "valve", "gauge"]
  },
  {
    url: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=800&auto=format&fit=crop&q=80",
    category: "imgService1",
    description: "Instalações de tubulação industrial e vasos de pressão em refinaria moderna",
    tags: ["caldeira", "tubulação", "refinaria", "vaso de pressão", "indústria pesada", "boiler", "piping"]
  },

  // NR-12 Segurança de Máquinas
  {
    url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80",
    category: "imgService2",
    description: "Máquinas operatrizes de torno e fresa em oficina metalúrgica",
    tags: ["torno", "fresa", "máquina", "segurança", "oficina", "machinery", "metal", "steel", "welding"]
  },
  {
    url: "https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=800&auto=format&fit=crop&q=80",
    category: "imgCardNr12",
    description: "Engrenagens e componentes mecânicos pesados de torno e fresadora industrial",
    tags: ["peça", "torno", "metal", "fresadora", "engrenagens", "metallurgical", "machinery"]
  },
  {
    url: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80",
    category: "imgService2",
    description: "Braço robótico industrial de automação protegido por cerca de segurança",
    tags: ["cerca", "segurança", "robô", "automação", "grade", "intertravamento", "machinery", "robotics"]
  },
  {
    url: "https://images.unsplash.com/photo-1565034946487-077786996e27?w=800&auto=format&fit=crop&q=80",
    category: "imgCardNr12",
    description: "Trabalho de soldagem industrial com faíscas brilhantes de segurança",
    tags: ["solda", "metal", "faíscas", "segurança", "oficina", "welding", "safety", "factory"]
  },

  // Pontes Rolantes e Pórticos
  {
    url: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80",
    category: "imgCardPontes",
    description: "Pórtico rolante industrial de cor amarela movimentando cargas",
    tags: ["pórtico", "crane", "carga", "ponte rolante", "movimentação", "gantry"]
  },
  {
    url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80",
    category: "imgCardPontes",
    description: "Gancho industrial de aço maciço içando vigas pesadas por cabos",
    tags: ["gancho", "aço", "cabo", "içamento", "ponte rolante", "crane", "welding"]
  },
  {
    url: "https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=800&auto=format&fit=crop&q=80",
    category: "imgCardPontes",
    description: "Ponte rolante aérea sobre trilhos em siderúrgica",
    tags: ["ponte rolante", "trilhos", "teto", "siderúrgica", "fundição", "crane", "heavy"]
  },

  // Estruturas Metálicas e Linhas de Vida
  {
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
    category: "imgCardEstruturas",
    description: "Vigas e colunas de treliça de aço para galpão industrial",
    tags: ["aço", "treliça", "vigas", "estrutura metálica", "galpão", "welding", "steel"]
  },
  {
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    category: "imgCardEstruturas",
    description: "Colunas de metal de sustentação de telhado de pavilhão industrial",
    tags: ["sustentação", "estrutura", "telhado", "metal", "steel", "construction"]
  },
  {
    url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80",
    category: "imgCardEstruturas",
    description: "Sustentação estrutural pesada e perfis metálicos em galpão de grande porte",
    tags: ["estrutura", "sustentação", "metal", "vigas", "safety", "steel"]
  },

  // Laudos Técnicos e ART
  {
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80",
    category: "imgCardLaudos",
    description: "Pasta com projetos de engenharia, plantas e calculadora em mesa",
    tags: ["laudos", "art", "plantas", "projetos", "calculadora", "document", "audit"]
  },
  {
    url: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800&auto=format&fit=crop&q=80",
    category: "imgCardLaudos",
    description: "Engenheiro revisando plantas industriais complexas e laudo em tablet digital",
    tags: ["tablet", "planta", "revisão", "digital", "laudo", "inspeção", "audit", "document"]
  },
  {
    url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
    category: "imgCardLaudos",
    description: "Prancheta com checklist técnico ao lado de paquímetro e ferramentas mecânicas",
    tags: ["prancheta", "checklist", "paquímetro", "ferramentas", "laudos", "art", "inspeção"]
  }
];

// Site Settings Endpoints
app.get("/api/site-settings", (req, res) => {
  const db = loadDb();
  if (!db.siteSettings) {
    db.siteSettings = { ...DEFAULT_SITE_SETTINGS };
    saveDb(db);
  } else {
    // Ensure all curated image keys are initialized with professional defaults if they are missing
    let updated = false;
    for (const key of Object.keys(DEFAULT_SITE_SETTINGS)) {
      if (db.siteSettings[key] === undefined || db.siteSettings[key] === "") {
        db.siteSettings[key] = (DEFAULT_SITE_SETTINGS as any)[key];
        updated = true;
      }
    }
    if (updated) {
      saveDb(db);
    }
  }
  res.json(db.siteSettings);
});

app.post("/api/site-settings", (req, res) => {
  const db = loadDb();
  db.siteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...db.siteSettings,
    ...req.body
  };
  saveDb(db);
  res.json(db.siteSettings);
});

// Gemini-powered curated image matcher for smart batch updates
app.post("/api/site-settings/ai-suggest-images", async (req, res) => {
  try {
    const { themeDescription } = req.body;
    if (!themeDescription) {
      return res.status(400).json({ error: "Descrição do tema é obrigatória." });
    }

    const client = getGeminiClientSafe();
    let selectedImages: Record<string, string> = {};

    // Standard high-quality programmatic search mapping as a rock-solid, fast fallback and guideline
    const categories = ["imgEngineer", "imgService1", "imgService2", "imgCardNr12", "imgCardNr13", "imgCardPontes", "imgCardLaudos", "imgCardEstruturas"];
    
    // Fallback search logic in JS in case Gemini is unavailable
    const rawKeywords = themeDescription.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
    
    // Exclude terms that point to forbidden topics (landscapes, animals, children, domestic, etc.)
    const forbiddenTerms = [
      "crianca", "criancas", "bebe", "bebes", "filho", "filha", "kids", "children", "baby", "babies",
      "cachorro", "cao", "dog", "dogs", "gato", "gatos", "cat", "cats", "animal", "animais", "pet", "pets",
      "floresta", "forest", "praia", "beach", "mar", "ocean", "natureza", "nature", "paisagem", "landscape", "landscapes",
      "flor", "flores", "flower", "flowers", "arvore", "arvores", "tree", "trees", "parque", "park"
    ];
    
    const keywords = rawKeywords.filter(kw => !forbiddenTerms.includes(kw));

    for (const cat of categories) {
      const candidates = CURATED_PHOTOS.filter(photo => photo.category === cat || (cat === "imgCardNr12" && photo.category === "imgService2") || (cat === "imgCardNr13" && photo.category === "imgService1"));
      
      // Look for a photo matching any keywords in tags or description
      let bestPhoto = candidates[0];
      let maxScore = 0;
      for (const p of candidates) {
        let score = 0;
        for (const kw of keywords) {
          if (p.tags.includes(kw)) score += 3;
          if (p.description.toLowerCase().includes(kw)) score += 1;
        }
        if (score > maxScore) {
          maxScore = score;
          bestPhoto = p;
        }
      }
      selectedImages[cat] = bestPhoto.url;
    }

    // Try to run through Gemini for maximum intelligent contextual matching
    if (client) {
      try {
        const systemInstruction = `Você é um curador visual altamente especializado em engenharia mecânica industrial, segurança do trabalho (NR-12 e NR-13), projetos, estruturas metálicas e laudos técnicos com ART.
Sua tarefa é selecionar a melhor imagem de cada uma das 8 categorias descritas abaixo a partir de um catálogo pré-curado e de altíssima qualidade de fotos profissionais de engenharia.

REGRA DE SEGURANÇA E FILTRAGEM ABSOLUTA (CRÍTICA):
1. O site é exclusivamente voltado para engenharia mecânica e segurança industrial pesada.
2. É terminantemente PROIBIDO selecionar ou sugerir imagens contendo paisagens naturais (praias, florestas, montanhas, mares, pores do sol), animais (cachorros, gatos, pássaros, pets), crianças, bebês, famílias ou ambientes domésticos.
3. Se o tema do cliente contiver qualquer menção a esses tópicos proibidos ou se for um tema totalmente fora do setor de engenharia mecânica (ex: "cachorrinhos", "praia no rio", "crianças correndo", "jardim de flores"), você deve IGNORAR COMPLEMENTE essas palavras proibidas e utilizar imagens industriais sólidas e profissionais do nosso catálogo por padrão (como tornos mecânicos, caldeiras a vapor, tubulações industriais, pontes rolantes pesadas, etc.).
4. Caso o tema seja vagamente associável à indústria (ex: "mar" ou "agua"), faça uma associação profissional técnica (como refinarias offshore, tubulação de pressão submarina ou sistemas térmicos a vapor). Caso contrário, descarte o tema irrelevante e selecione as melhores imagens técnicas mecânicas padrão.

CATEGORIAS A SEREM PREENCHIDAS:
- imgEngineer (Engenheiro Mecânico / Foto Principal do Topo / Hero)
- imgService1 (NR-13 Caldeiras, Vasos de Pressão e Tubulações)
- imgService2 (NR-12 Proteção Física e Segurança de Máquinas Industriais)
- imgCardNr12 (Card Informativo de NR-12, faíscas, prensa, torno, painel)
- imgCardNr13 (Card Informativo de NR-13, válvulas, manômetros, tubos de caldeira)
- imgCardPontes (Card Informativo de Pontes Rolantes, pórticos, ganchos de aço, cabos)
- imgCardLaudos (Card Informativo de Laudos Técnicos e ARTs, prancheta, esquemas, documentos)
- imgCardEstruturas (Card Informativo de Estruturas Metálicas e Linhas de Vida NR-35, vigas, treliças)

CATÁLOGO CURADO DE FOTOS DE ENGENHARIA MECÂNICA DISPONÍVEIS:
${JSON.stringify(CURATED_PHOTOS.map(p => ({ url: p.url, category: p.category, description: p.description, tags: p.tags })), null, 2)}

Você DEVE retornar estritamente um objeto JSON no formato abaixo, escolhendo as URLs reais presentes no catálogo que melhor se adequam à proposta de engenharia mecânica associada ao tema informado (rejeitando temas impróprios ou não industriais):
{
  "imgEngineer": "URL de uma foto com foco em engenheiro real",
  "imgService1": "URL de uma foto de caldeiras/vasos de pressão do catálogo",
  "imgService2": "URL de uma foto de máquinas operatrizes/tornos/automação do catálogo",
  "imgCardNr12": "URL de uma foto de segurança industrial do catálogo",
  "imgCardNr13": "URL de uma foto de manômetro/válvula do catálogo",
  "imgCardPontes": "URL de uma foto de ponte rolante/gancho do catálogo",
  "imgCardLaudos": "URL de uma foto de plantas/documento/checklist do catálogo",
  "imgCardEstruturas": "URL de uma foto de estruturas de aço/vigas do catálogo"
}
Não invente URLs! Use apenas as URLs exatas contidas no catálogo fornecido acima. Não adicione textos explicativos, saudações ou formatação markdown no corpo da resposta, apenas o JSON bruto.`;

        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Tema do cliente: "${themeDescription}"`,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.1
          }
        });

        const geminiText = response.text?.trim() || "";
        if (geminiText) {
          const parsed = JSON.parse(geminiText);
          // Overwrite with Gemini's selections if they are valid URLs in our catalog
          for (const cat of categories) {
            if (parsed[cat] && CURATED_PHOTOS.some(p => p.url === parsed[cat])) {
              selectedImages[cat] = parsed[cat];
            }
          }
        }
      } catch (geminiError) {
        console.warn("Error in Gemini curation call, fell back to local metadata matcher:", geminiError);
      }
    }

    res.json({ success: true, theme: themeDescription, images: selectedImages });
  } catch (error: any) {
    console.error("Error matching curated images:", error);
    res.status(500).json({ error: error.message || "Erro ao selecionar imagens industriais." });
  }
});

// Dedicated Outreach Pitch Generator (directly as Josnei, humanized and tag-free) with resilient fallback
app.post("/api/crm/generate-outreach", async (req, res) => {
  try {
    const { leadName, leadCompany, leadService } = req.body;
    if (!leadName) {
      return res.status(400).json({ error: "Nome do lead é obrigatório." });
    }

    const client = getGeminiClientSafe();
    let replyText = "";

    const systemInstruction = `Você é o Engenheiro Mecânico Josnei da Cunha, proprietário da JC EVOLUTION ENGENHARIA MECÂNICA de Aparecida do Taboado - MS.
Seu objetivo é redigir uma mensagem comercial personalizada, humana, direta e amigável para enviar via WhatsApp para um cliente em potencial, abordando a necessidade do serviço especificado.

DIRETRIZES IMPORTANTES PARA O TOM E FORMATO DA MENSAGEM:
- Escreva diretamente na primeira pessoa do singular (ex: "Aqui é o Engenheiro Josnei da Cunha", "Entro em contato", "estou à disposição", "forte abraço, Josnei").
- NUNCA fale em nome de uma inteligência artificial ou assistente virtual (como Nora ou qualquer outra IA). Você é o próprio engenheiro Josnei de carne e osso.
- A mensagem deve ser amigável, consultiva e profissional, focada em ajudar o negócio do cliente e prevenir riscos (acidentes ou penalidades).
- Comece cumprimentando o cliente de forma educada e simpática (ex: "Olá, [Nome]! Tudo bem?").
- Mantenha a mensagem curta e direta (máximo de 3 parágrafos pequenos), ideal para leitura rápida no WhatsApp.
- NÃO utilize marcas especiais como hashtags, hífens de decoração, divisórias em asteriscos, ou tags de dados estruturados como ---CAPTURE_LEAD---. Mantenha o texto extremamente limpo e pronto para ser copiado.
- Evite explicações adicionais antes ou depois da mensagem. A sua resposta deve ser EXCLUSIVAMENTE a mensagem a ser enviada ao cliente.
- Forneça os seus contatos oficiais ao fim: WhatsApp/Telefone (49) 99832-5358 e E-mail: josnei.cunha@gmail.com.`;

    const prompt = `Gere uma mensagem comercial de abordagem curta e humana via WhatsApp para:
- Nome do contato: ${leadName}
- Empresa: ${leadCompany || "sua empresa"}
- Serviço de interesse: ${leadService || "Serviço de Engenharia Mecânica"}

Lembre-se de assinar como Engenheiro Josnei da Cunha e escrever na primeira pessoa.`;

    if (client) {
      try {
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
          }
        });
        replyText = response.text || "";
      } catch (err) {
        console.warn("Outreach direct generation failed, using programmatic fallback:", err);
      }
    }

    if (!replyText) {
      replyText = `Olá, ${leadName}! Tudo bem?\n\nAqui é o Engenheiro Mecânico Josnei da Cunha, proprietário da JC EVOLUTION ENGENHARIA MECÂNICA de Aparecida do Taboado - MS.\n\nEstou entrando em contato diretamente com você pois verifiquei que a ${leadCompany || "sua empresa"} possui demanda potencial para regularizações e laudos em ${leadService || "equipamentos mecânicos"}.\n\nNosso escritório realiza vistorias detalhadas, vistorias de segurança NR-12 e NR-13, com emissão rápida de laudos e recolhimento de ART junto ao CREA, resguardando totalmente a sua operação contra fiscalizações e acidentes.\n\nPodemos agendar uma breve conversa técnica nesta semana para avaliarmos suas necessidades sem compromisso? Um forte abraço!\n\nEng. Josnei da Cunha | JC EVOLUTION ENGENHARIA MECÂNICA\nWhatsApp/Fone: (49) 99832-5358\nE-mail: josnei.cunha@gmail.com`;
    }

    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Error in outreach generation:", error);
    res.status(500).json({ error: error.message || "Erro de comunicação ao gerar abordagem comercial." });
  }
});

// Generate multiple varied WhatsApp outreach template styles
app.post("/api/crm/generate-whatsapp-templates", async (req, res) => {
  try {
    const { leadName, leadCompany, leadService, leadSector } = req.body;
    if (!leadName) {
      return res.status(400).json({ error: "Nome do lead é obrigatório." });
    }

    const client = getGeminiClientSafe();
    let templates: any[] = [];

    if (client) {
      const prompt = `Você é o Engenheiro Mecânico Josnei da Cunha, proprietário da JC EVOLUTION ENGENHARIA MECÂNICA de Aparecida do Taboado - MS.
Escreva exatamente 3 mensagens comerciais de abordagem WhatsApp com estilos diferentes para o lead informado, adaptando-as de acordo com o SETOR/SEGMENTO da empresa para torná-las altamente qualificadas e verossímeis ao seu ramo de atividade:
- Nome do contato: ${leadName}
- Empresa: ${leadCompany || "sua empresa"}
- Setor/Segmento da Empresa: ${leadSector || "Indústria / Geral"}
- Serviço de interesse: ${leadService || "Serviço de Engenharia Mecânica"}

Estilos requeridos:
1. "Direta e Comercial": Uma mensagem direta, com foco prático em agendar um orçamento rápido. Adapte o linguajar para os desafios do setor de ${leadSector || "atuação da empresa"}.
2. "Consultiva e Técnica": Uma mensagem com tom altamente prestativo, oferecendo um rápido diagnóstico técnico de 15 minutos sem compromisso focado em equipamentos típicos do segmento de ${leadSector || "atuação da empresa"}.
3. "Foco em Segurança e Riscos": Uma abordagem com foco preventivo (evitar multas trabalhistas, acidentes de trabalho e interdições de maquinário que ocorrem frequentemente no setor de ${leadSector || "atuação da empresa"}).

DIRETRIZES DE FORMATO E TOM:
- Escreva diretamente na primeira pessoa do singular ("Eu, Engenheiro Josnei..."). NUNCA fale em nome de uma IA ou assistente.
- NADA de markdown (NÃO use hashtags, hífens de decoração, divisórias em asteriscos). Mantenha o texto limpo, pronto para cópia direta.
- Forneça os contatos oficiais no final de cada mensagem: WhatsApp (49) 99832-5358, E-mail: josnei.cunha@gmail.com.
- Retorne EXCLUSIVAMENTE um JSON estruturado como o seguinte (sem markdown ou blocos de texto explicativos adicionais):
{
  "templates": [
    { "style": "Direta e Comercial", "text": "Texto completo da mensagem estilo 1..." },
    { "style": "Consultiva e Técnica", "text": "Texto completo da mensagem estilo 2..." },
    { "style": "Foco em Segurança e Riscos", "text": "Texto completo da mensagem estilo 3..." }
  ]
}`;

      try {
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        const resultText = response.text || "";
        const cleanedText = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const resultObj = JSON.parse(cleanedText);
        if (resultObj && Array.isArray(resultObj.templates)) {
          templates = resultObj.templates;
        }
      } catch (err) {
        console.warn("WhatsApp templates API generation failed, using fallback:", err);
      }
    }

    if (!templates || templates.length === 0) {
      // High-quality fallback templates tailored dynamically using leadSector
      const sectorStr = leadSector || "seu segmento industrial";
      templates = [
        {
          style: "Direta e Comercial",
          text: `Olá, ${leadName}! Tudo bem?\n\nAqui é o Engenheiro Mecânico Josnei da Cunha, proprietário da JC EVOLUTION ENGENHARIA MECÂNICA de Aparecida do Taboado - MS.\n\nEstou entrando em contato com você hoje pois vi que a ${leadCompany || "sua empresa"}, atuante no segmento de ${sectorStr}, possui demanda potencial para regularizações e laudos em ${leadService || "equipamentos mecânicos"}.\n\nNosso escritório realiza vistorias técnicas completas com emissão rápida de laudos e recolhimento de ART junto ao CREA, permitindo que sua operação de ${sectorStr} opere com plena segurança jurídica e técnica.\n\nPodemos agendar uma breve conversa técnica nesta semana para analisarmos suas necessidades e fecharmos uma proposta ideal?\n\nEng. Josnei da Cunha | JC EVOLUTION ENGENHARIA MECÂNICA\nWhatsApp/Fone: (49) 99832-5358\nE-mail: josnei.cunha@gmail.com`
        },
        {
          style: "Consultiva e Técnica",
          text: `Olá, ${leadName}! Como vai?\n\nAqui é o Engenheiro Josnei da Cunha. Sou proprietário da JC EVOLUTION ENGENHARIA MECÂNICA de Aparecida do Taboado - MS.\n\nTenho acompanhado as operações do segmento de ${sectorStr} e gostaria de oferecer um diagnóstico prévio gratuito de 15 minutos para avaliar a conformidade técnica dos seus equipamentos de ${leadService || "mecânica industrial"}.\n\nA ideia é fazermos um bate-papo rápido e produtivo, onde posso apontar melhorias práticas e preventivas que elevam a confiabilidade da sua linha de produção de ${sectorStr} sem comprometer sua rotina.\n\nQual o melhor dia para conversarmos rapidamente no WhatsApp ou agendarmos uma visita de cortesia?\n\nEng. Josnei da Cunha | JC EVOLUTION ENGENHARIA MECÂNICA\nWhatsApp/Fone: (49) 99832-5358\nE-mail: josnei.cunha@gmail.com`
        },
        {
          style: "Foco em Segurança e Riscos",
          text: `Olá, ${leadName}! Tudo bem? Espero que sim.\n\nAqui é o Engenheiro Josnei da Cunha, da JC EVOLUTION ENGENHARIA MECÂNICA.\n\nEstou lhe contatando para conversarmos sobre a conformidade técnica em ${leadService || "normas de segurança mecânica"}.\n\nSabemos que a ausência de laudos atualizados de conformidade técnica (como NR-12 e NR-13) gera graves riscos de acidentes de trabalho no segmento de ${sectorStr}, além de expor a empresa a autos de infração severos do Ministério do Trabalho e interdição do maquinário.\n\nNosso papel é resguardar sua responsabilidade civil e criminal, certificando toda a sua infraestrutura com ART profissional. Vamos marcar uma vistoria técnica preventiva nesta semana?\n\nEng. Josnei da Cunha | JC EVOLUTION ENGENHARIA MECÂNICA\nWhatsApp/Fone: (49) 99832-5358\nE-mail: josnei.cunha@gmail.com`
        }
      ];
    }

    res.json({ templates });
  } catch (error: any) {
    console.error("Error in generate-whatsapp-templates:", error);
    res.status(500).json({ error: error.message || "Erro de comunicação ao gerar mensagens do WhatsApp." });
  }
});

// AI Commercial Chatbot Endpoints with resilient rule-based fallback
app.post("/api/chat", async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Mensagem obrigatória" });
    }

    const client = getGeminiClientSafe();
    
    // Structure chat history without duplicate final user messages
    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const h of chatHistory) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      }
    }

    // Prevent consecutive duplicate user messages at the end of the history
    const lastContent = contents[contents.length - 1];
    if (!(lastContent && lastContent.role === "user" && lastContent.parts[0]?.text === message)) {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    const systemInstruction = `Você é "NORA - assistente virtual", o assistente comercial altamente competente da JC EVOLUTION ENGENHARIA MECÂNICA, liderada pelo Eng. Mecânico Josnei da Cunha (CREA/RN 2521304182).
Seu objetivo é sanar dúvidas de clientes no site, vender os serviços da JC EVOLUTION ENGENHARIA MECÂNICA e converter contatos em leads qualificados no CRM.

Seu escopo de conhecimento e atuação:
1. NR-12: Segurança de Máquinas e Equipamentos. Elaboramos inventários, análises de risco, propostas de adequação física e laudos técnicos com ART.
2. NR-13: Inspeção periódica de caldeiras, vasos de pressão, compressores de ar industriais, tubulações de gás e vapor. É obrigatório por lei para indústrias, postos, laticínios, hospitais, hotéis.
3. Pontes Rolantes e Pórticos: Laudos estruturais de segurança mecânica de equipamentos de elevação de carga.
4. Estruturas Metálicas e Linhas de Vida: Projeto, inspeção e laudos de segurança contra queda de altura com ART.
5. Emissão de ART (Anotação de Responsabilidade Técnica) para qualquer projeto mecânico, máquinas instaladas, climatização (PMOC), tanques de combustível, etc.

Estilo de Atendimento e Formatação de Resposta (MUITO IMPORTANTE):
- Seja extremamente educado, solícito e profissional.
- Explique os termos técnicos de forma descomplicada para empresários, síndicos e gerentes industriais.
- A JC EVOLUTION ENGENHARIA MECÂNICA está sediada em Aparecida do Taboado - MS e atende toda a região e estados vizinhos. Contatos oficiais: WhatsApp/Telefone (49) 99832-5358, E-mail: josnei.cunha@gmail.com.
- REGRA DE LEITURA FÁCIL: NUNCA envie blocos grandes de texto contínuo. Divida suas respostas em parágrafos muito curtos (máximo de 3 linhas por parágrafo).
- ESPAÇAMENTO: Use linhas em branco abundantes (pule linha com dois \\n\\n) entre parágrafos, explicações e listas para dar respirabilidade ao texto.
- LISTAS E BALIZADORES: Quando fizer perguntas, listar passos ou apresentar serviços, use listas numeradas (ex: "1. ", "2. ") ou tópicos claros com hífen (ex: "- "). Coloque cada item em sua própria linha para que o leitor possa escanear a resposta facilmente. Use **negrito** apenas em termos chave ou títulos de tópicos, evitando poluição visual.
- Se o usuário mostrar interesse em agendar uma visita técnica ou solicitar uma proposta/orçamento, tente capturar as seguintes informações de forma natural na conversa:
  * Nome do contato
  * Nome da empresa ou condomínio
  * Telefone / WhatsApp
  * E-mail
  * Serviço de interesse (ex: NR-12, Caldeira NR-13, PMOC, ART)

CRÍTICO: Se o usuário fornecer pelo menos o Nome e o Telefone/Empresa para orçamento, inclua obrigatoriamente no final da sua resposta de texto uma tag de dados estruturados para que o sistema capture o lead de forma automatizada no CRM. O formato deve ser idêntico ao modelo abaixo:
---CAPTURE_LEAD---
{
  "name": "Nome do contato capturado",
  "company": "Empresa capturada ou condomínio",
  "phone": "Telefone capturado",
  "email": "E-mail capturado se fornecido, ou vazio",
  "service": "Serviço de interesse deduzido"
}
---END_CAPTURE_LEAD---

Apenas adicione a tag quando os dados realmente forem fornecidos na conversa comercial. Se o usuário apenas fizer perguntas, responda e continue a conversação amigável.`;

    let replyText = "";
    if (client) {
      try {
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
          }
        });
        replyText = response.text || "";
      } catch (err) {
        console.warn("Gemini chatbot error, using fallback rules:", err);
      }
    }

    if (!replyText) {
      // Sophisticated rule-based chatbot fallback
      const msgLower = message.toLowerCase();
      
      let matchedTopic = "";
      if (msgLower.includes("nr12") || msgLower.includes("nr-12") || msgLower.includes("máquina") || msgLower.includes("maquina") || msgLower.includes("pensa") || msgLower.includes("proteção")) {
        matchedTopic = "nr12";
      } else if (msgLower.includes("nr13") || msgLower.includes("nr-13") || msgLower.includes("caldeira") || msgLower.includes("vaso") || msgLower.includes("compressor") || msgLower.includes("pressão") || msgLower.includes("ar comprimido")) {
        matchedTopic = "nr13";
      } else if (msgLower.includes("ponte") || msgLower.includes("pórtico") || msgLower.includes("içamento") || msgLower.includes("guindaste") || msgLower.includes("rolante")) {
        matchedTopic = "ponte";
      } else if (msgLower.includes("estrutura") || msgLower.includes("linha de vida") || msgLower.includes("queda") || msgLower.includes("metálica")) {
        matchedTopic = "estrutura";
      } else if (msgLower.includes("art") || msgLower.includes("crea") || msgLower.includes("responsabilidade técnica") || msgLower.includes("engenheiro")) {
        matchedTopic = "art";
      } else if (msgLower.includes("orçamento") || msgLower.includes("preço") || msgLower.includes("quanto custa") || msgLower.includes("valor") || msgLower.includes("visita") || msgLower.includes("agendar")) {
        matchedTopic = "orcamento";
      }

      if (matchedTopic === "nr12") {
        replyText = `Olá! Sou a NORA, assistente virtual da JC EVOLUTION ENGENHARIA MECÂNICA.\n\nA NR-12 é uma das nossas principais especialidades! O Eng. Josnei realiza a adequação completa de máquinas e equipamentos industriais para garantir a total conformidade com a legislação do Ministério do Trabalho.\n\nNosso serviço inclui:\n\n1. Elaboração do inventário de máquinas e equipamentos.\n\n2. Análise de risco detalhada (HRN) para mapeamento dos pontos de perigo.\n\n3. Projetos de barreiras mecânicas e sensores eletromecânicos de segurança.\n\n4. Emissão de Laudo Técnico Conclusivo e ART.\n\nGarantimos um processo rápido que protege seus funcionários e evita multas e interdições trabalhistas na sua empresa.\n\nGostaria de agendar uma vistoria técnica preliminar com o Engenheiro Josnei? Se sim, me informe seu nome, empresa e telefone para contato!`;
      } else if (matchedTopic === "nr13") {
        replyText = `Olá! Sou a NORA, assistente virtual da JC EVOLUTION ENGENHARIA MECÂNICA.\n\nA inspeção NR-13 é obrigatória por lei e essencial para garantir que caldeiras, vasos de pressão, tubulações e compressores de ar comprimido operem com segurança extrema.\n\nO Engenheiro Josnei realiza:\n\n1. Teste hidrostático e exames por ultrassom de espessura de chapa.\n\n2. Calibração e aferição de manômetros e válvulas de segurança.\n\n3. Abertura e atualização do Livro de Registro de Segurança.\n\n4. Emissão de parecer técnico, laudo de conformidade e ART do CREA.\n\nEvite acidentes graves e multas severas de fiscalização regularizando seus vasos de pressão!\n\nMe informe seu nome, empresa e telefone para que eu possa agendar uma inspeção NR-13 com o Eng. Josnei!`;
      } else if (matchedTopic === "ponte") {
        replyText = `Olá! Sou a NORA, assistente virtual da JC EVOLUTION ENGENHARIA MECÂNICA.\n\nEquipamentos de elevação de carga como pontes rolantes, pórticos rolantes, monovias e guindastes exigem inspeções mecânicas anuais e laudos técnicos específicos assinado por engenheiro mecânico habilitado.\n\nO Eng. Josnei da Cunha realiza:\n\n1. Inspeção estrutural completa de vigas, soldas e caminhos de rolamento.\n\n2. Análise de fadiga de cabos de aço, ganchos e freios.\n\n3. Teste de carga dinâmico e estático.\n\n4. Emissão do laudo de capacidade de carga com ART.\n\nGostaria de agendar uma vistoria para as pontes rolantes da sua empresa? Forneça seu nome e telefone para contato que daremos andamento!`;
      } else if (matchedTopic === "estrutura") {
        replyText = `Olá! Sou a NORA, assistente virtual da JC EVOLUTION ENGENHARIA MECÂNICA.\n\nRealizamos o projeto, inspeção e emissão de laudos de conformidade técnica para estruturas metálicas diversas, mezaninos, e sistemas de proteção contra quedas, como as Linhas de Vida industriais (NR-35).\n\nGarantimos que todos os ancoragens estruturais suportem os esforços mecânicos calculados, fornecendo memória de cálculo detalhada, laudo pericial assinado e ART.\n\nQue tal receber uma proposta sem compromisso? Me diga seu nome, empresa e qual o seu WhatsApp!`;
      } else if (matchedTopic === "art") {
        replyText = `Olá! Sou a NORA.\n\nA Anotação de Responsabilidade Técnica (ART) é o selo de garantia legal que valida qualquer projeto, laudo, instalação ou inspeção mecânica perante o CREA e órgãos de fiscalização.\n\nO Eng. Josnei da Cunha (CREA/RN 2521304182) emite ART para uma vasta gama de serviços:\n\n- Inspeções de NR-12 e NR-13\n- Climatização e PMOC (Ar Condicionado)\n- Brinquedos de Buffet e Parques de Diversões\n- Linhas de Vida e Estruturas Metálicas\n- Caçambas estacionárias e maquinários agrícolas\n\nQual é o serviço mecânico para o qual você precisa de uma ART no momento? Se quiser, nos informe seu contato para conversarmos melhor!`;
      } else if (matchedTopic === "orcamento") {
        replyText = `Fico muito feliz em saber do seu interesse em trabalhar conosco! O Eng. Josnei elabora propostas comerciais personalizadas, de excelente custo-benefício e com prazos ágeis para Aparecida do Taboado - MS e região.\n\nPara que eu possa gerar o seu orçamento detalhado de forma rápida, por favor, me informe:\n\n1. Seu Nome completo\n\n2. Nome da sua Empresa ou Loteamento\n\n3. WhatsApp ou Telefone de contato\n\n4. E-mail\n\n5. Qual serviço você precisa (NR-12, NR-13, Pontes, ART, etc.)\n\nAssim que você preencher, nosso sistema registrará o lead e o Eng. Josnei entrará em contato direto via WhatsApp nas próximas horas!`;
      } else {
        replyText = `Olá! Seja muito bem-vindo à JC EVOLUTION ENGENHARIA MECÂNICA! Sou a NORA, assistente comercial virtual do Eng. Josnei da Cunha.\n\nEstou à sua disposição para ajudar a regularizar sua empresa, garantir a segurança dos seus colaboradores e evitar multas de fiscalização.\n\nComo posso te ajudar hoje? Nós somos especialistas em:\n\n- Inspeções de NR-13 (Caldeiras, Vasos de Pressão, Compressores)\n- Adequação de NR-12 (Segurança de Máquinas e Equipamentos)\n- Laudos estruturais de Pontes Rolantes e Elevação de Carga\n- Projetos de Linhas de Vida e Estruturas Metálicas\n- Emissão de ART para CREA e PMOC de Climatização\n\nFique à vontade para me fazer uma pergunta técnica ou solicitar um orçamento informando seus dados!`;
      }
      
      // Check if user provided contact info in their message to capture lead even in fallback!
      const phoneRegex = /(?:\(?\d{2}\)?\s*?\d{4,5}-?\d{4})/g;
      const phoneMatch = message.match(phoneRegex);
      if (phoneMatch && (msgLower.includes("orc") || msgLower.includes("inspec") || msgLower.includes("laudo") || msgLower.includes("art") || msgLower.includes("contato") || msgLower.includes("telefone") || msgLower.includes("whatsapp"))) {
        const extractedPhone = phoneMatch[0];
        const extractedName = message.split(/,|\n/)[0]?.substring(0, 30) || "Contato do Chat";
        replyText += `\n\n---CAPTURE_LEAD---\n{\n  "name": "${extractedName}",\n  "company": "Capturado via Chat Fallback",\n  "phone": "${extractedPhone}",\n  "email": "",\n  "service": "Inspeção Mecânica / ART"\n}\n---END_CAPTURE_LEAD---`;
      }
    }

    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Error in chatbot response:", error);
    res.status(500).json({ error: error.message || "Erro de comunicação com NORA - assistente virtual." });
  }
});

// Automations & Logs Endpoints
app.get("/api/automations", (req, res) => {
  const db = loadDb();
  res.json({
    automations: db.automations,
    logs: db.automationLogs
  });
});

app.put("/api/automations/:id", (req, res) => {
  const db = loadDb();
  const index = db.automations.findIndex((a: any) => a.id === req.params.id);
  if (index !== -1) {
    db.automations[index].enabled = req.body.enabled;
    saveDb(db);
    res.json(db.automations[index]);
  } else {
    res.status(404).json({ error: "Automação não encontrada" });
  }
});

app.post("/api/automations/clear-logs", (req, res) => {
  const db = loadDb();
  db.automationLogs = [];
  saveDb(db);
  res.json({ success: true });
});


// -------------------------------------------------------------
// Vite Dev Server Integration & Static File Serving
// -------------------------------------------------------------
async function startServer() {
  // Inicializa a sincronização de banco de dados com o Supabase (se configurado) em segundo plano para não travar o início do servidor
  initSupabaseSync().catch((err) => {
    console.error("Erro na sincronização em segundo plano do Supabase:", err);
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
