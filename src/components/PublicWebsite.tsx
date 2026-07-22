import React, { useState, useEffect, useRef } from "react";
import {
  Shield, CheckCircle, Flame, FileText, Layout, PenTool, ClipboardList, Eye, Wrench, AlertTriangle, HelpCircle,
  Phone, Mail, MapPin, Send, MessageSquare, ChevronRight, ChevronLeft, User, Calendar, BookOpen, Sparkles, AlertCircle, Bot,
  Building, Paperclip, Menu, X, Linkedin, Instagram, ZoomIn
} from "lucide-react";
import { BlogPost, Lead, SiteSettings, Project } from "../types";
import JCLogo from "./JCLogo";

interface PublicWebsiteProps {
  blogPosts: BlogPost[];
  onAddLead: (leadData: Partial<Lead>) => void;
  onRefreshBlog: () => void;
  onEnterAdmin: () => void;
  user: { id: string; name: string; role: "engineer" | "admin"; email: string } | null;
  onLogout: () => void;
  siteSettings?: SiteSettings;
}

// Client logo helper component with lazy loading and beautiful fallback
function ClientLogo({ client }: { client: { name: string; type: string; logoUrl: string } }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-full bg-white border border-slate-200/85 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 group h-28">
      <div className="w-full flex items-center justify-center mb-1 h-12">
        {!imageError ? (
          <img
            src={client.logoUrl}
            alt={`${client.name} Logo`}
            className="max-h-11 max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-black tracking-tight text-[#0D2B4D] group-hover:text-emerald-600 transition-colors duration-300 uppercase">
              {client.name}
            </span>
          </div>
        )}
      </div>
      <span className="text-[8px] text-slate-400 font-mono mt-1 block uppercase tracking-widest leading-none">
        {client.type}
      </span>
    </div>
  );
}

// Helper component to render beautiful formatted bot/AI chat responses
function FormattedMessage({ text }: { text: string }) {
  // Split blocks by double (or more) newlines to identify paragraphs and separated lists
  const blocks = text.split(/\n\n+/);

  const renderInlineStyles = (line: string) => {
    // Split on **bold** text patterns
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-emerald-400">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {blocks.map((block, bIdx) => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return null;

        const lines = trimmedBlock.split('\n');

        // Check if this block is list-like
        const isBulletList = lines.every(line => /^\s*[\-\*\•]\s+/.test(line));
        const isNumberedList = lines.every(line => /^\s*\d+\.\s+/.test(line));
        const hasAnyListItems = lines.some(line => /^\s*([\-\*\•]|\d+\.)\s+/.test(line));

        if (lines.length > 1 && (isBulletList || isNumberedList || hasAnyListItems)) {
          return (
            <ul key={bIdx} className="space-y-3 pl-0.5 my-2">
              {lines.map((line, lIdx) => {
                const isItem = /^\s*([\-\*\•]|\d+\.)\s+(.*)/.exec(line);
                if (isItem) {
                  const marker = isItem[1];
                  const rest = isItem[2];
                  const isNum = /^\d+\./.test(marker);
                  return (
                    <li key={lIdx} className="flex items-start gap-2.5 text-slate-200 text-sm leading-relaxed">
                      {isNum ? (
                        <span className="font-mono font-bold text-[10px] text-emerald-400 shrink-0 bg-emerald-950/80 border border-emerald-900/40 px-1.5 py-0.5 rounded-md min-w-[20px] text-center mt-0.5">
                          {marker.replace('.', '')}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold shrink-0 mt-0.5 text-base leading-none">•</span>
                      )}
                      <span className="flex-1 mt-0.5">{renderInlineStyles(rest)}</span>
                    </li>
                  );
                }
                return (
                  <li key={lIdx} className="text-slate-200 text-sm leading-relaxed pl-5">
                    {renderInlineStyles(line)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Single list item block
        const singleItemMatch = /^\s*([\-\*\•]|\d+\.)\s+(.*)/.exec(trimmedBlock);
        if (singleItemMatch) {
          const marker = singleItemMatch[1];
          const rest = singleItemMatch[2];
          const isNum = /^\d+\./.test(marker);
          return (
            <div key={bIdx} className="flex items-start gap-2.5 text-slate-200 text-sm leading-relaxed pl-0.5 my-1">
              {isNum ? (
                <span className="font-mono font-bold text-[10px] text-emerald-400 shrink-0 bg-emerald-950/80 border border-emerald-900/40 px-1.5 py-0.5 rounded-md min-w-[20px] text-center mt-0.5">
                  {marker.replace('.', '')}
                </span>
              ) : (
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5 text-base leading-none">•</span>
              )}
              <span className="flex-1 mt-0.5">{renderInlineStyles(rest)}</span>
            </div>
          );
        }

        // Normal paragraph
        return (
          <p key={bIdx} className="text-slate-200 text-sm leading-relaxed">
            {renderInlineStyles(trimmedBlock)}
          </p>
        );
      })}
    </div>
  );
}

export default function PublicWebsite({
  blogPosts,
  onAddLead,
  onRefreshBlog,
  onEnterAdmin,
  user,
  onLogout,
  siteSettings = {
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
    state: "MS"
  }
}: PublicWebsiteProps) {
  const [activeTab, setActiveTab] = useState<"home" | "servicos" | "projetos" | "landing" | "blog" | "contato">("home");
  const [selectedProjectCat, setSelectedProjectCat] = useState("Todos");
  const [activeLanding, setActiveLanding] = useState<string>("ART");
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomedLogo, setZoomedLogo] = useState<{ url?: string; name: string; isSvg: boolean; svg?: React.ReactNode } | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const galleryImages = projects.length > 0
    ? projects.map(p => p.image)
    : [
        siteSettings.imgCardNr12 || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
        siteSettings.imgCardNr13 || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
        siteSettings.imgCardLaudos || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80",
        siteSettings.imgCardPontes || "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80",
        siteSettings.imgCardEstruturas || "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
        siteSettings.imgService1 || "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80",
        siteSettings.imgService2 || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
      ];

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null ? (prev === 0 ? galleryImages.length - 1 : prev - 1) : null));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null ? (prev === galleryImages.length - 1 ? 0 : prev + 1) : null));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, galleryImages]);


  const filteredProjects = selectedProjectCat === "Todos"
    ? projects
    : projects.filter(p => p.category === selectedProjectCat);

  // Interactive Consultation Form State
  const [consultName, setConsultName] = useState("");
  const [consultEmail, setConsultEmail] = useState("");
  const [consultPhone, setConsultPhone] = useState("");
  const [consultService, setConsultService] = useState("NR-12 – Segurança em Máquinas");
  const [consultMsg, setConsultMsg] = useState("");
  const [consultFileName, setConsultFileName] = useState("");
  const [consultSuccess, setConsultSuccess] = useState(false);
  const [isSubmittingConsult, setIsSubmittingConsult] = useState(false);

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultName.trim()) return;

    setIsSubmittingConsult(true);
    setTimeout(() => {
      onAddLead({
        name: consultName,
        company: "Contato via Site",
        phone: consultPhone || "Pendente",
        email: consultEmail || "Pendente",
        service: consultService,
        status: "Lead",
        value: 1500.00,
        address: `${siteSettings.city} - ${siteSettings.state}`,
      });
      setIsSubmittingConsult(false);
      setConsultSuccess(true);
      
      // Clear fields
      setConsultName("");
      setConsultEmail("");
      setConsultPhone("");
      setConsultMsg("");
      setConsultFileName("");
    }, 1000);
  };

  const getWhatsAppLink = () => {
    const phoneNum = siteSettings?.phone || "(49) 99832-5358";
    const cleaned = phoneNum.replace(/\D/g, "");
    const formattedPhone = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const text = encodeURIComponent("Olá Eng. Josnei! Acessei o site da JC EVOLUTION ENGENHARIA MECÂNICA e gostaria de solicitar um orçamento e mais informações sobre laudos, inspeções e emissão de ART.");
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  const getEmailLink = () => {
    const emailAddr = siteSettings?.email || "josnei.cunha@gmail.com";
    const subject = encodeURIComponent("Solicitação de Orçamento / Informações - JC EVOLUTION ENGENHARIA MECÂNICA");
    const body = encodeURIComponent(`Olá Eng. Josnei da Cunha,

Gostaria de solicitar um orçamento e mais informações sobre os serviços de Engenharia Mecânica da JC EVOLUTION ENGENHARIA MECÂNICA (Laudos, ART, PMOC, Inspeções NR-12 e NR-13).

Meus dados para contato:
Nome: 
Empresa: 
Cidade: 
Telefone: 

Aguardando retorno.`);
    return `mailto:${emailAddr}?subject=${subject}&body=${body}`;
  };

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Olá! Sou NORA - assistente virtual da JC EVOLUTION ENGENHARIA MECÂNICA. Como posso ajudar você hoje com laudos, inspeções (NR-12/NR-13) ou emissão de ART?" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatLoading]);

  // Handle Commercial Chat
  const handleSendChatMessage = async (e?: React.FormEvent, directMessage?: string) => {
    if (e) e.preventDefault();
    const userText = directMessage || chatMessage;
    if (!userText.trim()) return;

    if (!directMessage) {
      setChatMessage("");
    }

    const updatedHistory = [...chatHistory];
    const lastItem = updatedHistory[updatedHistory.length - 1];
    if (lastItem && lastItem.role === "user" && lastItem.text === userText) {
      // Avoid double adding
    } else {
      updatedHistory.push({ role: "user", text: userText });
      setChatHistory(updatedHistory);
    }

    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          chatHistory: updatedHistory.map(h => ({ role: h.role === "user" ? "user" : "model", text: h.text }))
        })
      });

      if (!response.ok) throw new Error("Erro no servidor de IA.");
      const data = await response.json();
      
      // Check for lead capture structured data
      let responseText = data.text;
      const captureRegex = /---CAPTURE_LEAD---([\s\S]*?)---END_CAPTURE_LEAD---/;
      const match = responseText.match(captureRegex);

      if (match && match[1]) {
        try {
          const leadData = JSON.parse(match[1].trim());
          // Save the captured lead to backend
          onAddLead({
            name: leadData.name,
            company: leadData.company || "Captura por Chatbot",
            phone: leadData.phone,
            email: leadData.email || "",
            service: leadData.service || "ART / Consulta",
            status: "Lead",
            value: 1200.00, // standard consultation value
          });
          
          // Clear the tags from visual response
          responseText = responseText.replace(captureRegex, "").trim() + "\n\n*(✓ Seus dados foram salvos! Nossa equipe entrará em contato em breve)*";
        } catch (err) {
          console.error("Error parsing lead from chat response", err);
        }
      }

      setChatHistory((prev) => [...prev, { role: "bot", text: responseText }]);
    } catch (err: any) {
      setChatHistory((prev) => [...prev, { role: "bot", text: "Desculpe, estou com dificuldades para me conectar à central. Ligue diretamente para nós em (49) 99832-5358!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Predefined service landing page content
  const DEFAULT_LANDING_PAGES_CONTENT: Record<string, { title: string; subtitle: string; description: string; items: string[]; norm?: string }> = {
    "ART": {
      title: "Emissão de ART de Engenharia Mecânica",
      subtitle: "Anotação de Responsabilidade Técnica ágil e em conformidade legal",
      description: "A ART é o selo de garantia de que seus equipamentos e sistemas mecânicos estão sob responsabilidade de um Engenheiro habilitado. Essencial para conformidade com o CREA, prefeitura, bombeiros e seguradoras.",
      items: [
        "ART para climatização e exaustão industrial",
        "ART para vasos de pressão, compressores e caldeiras",
        "ART para brinquedos de playground e áreas de lazer",
        "ART para pontes rolantes, talhas e pórticos de carga",
        "Acervo técnico do CREA-MS garantido"
      ]
    },
    "Laudos Técnicos": {
      title: "Laudos Técnicos de Engenharia",
      subtitle: "Diagnósticos mecânicos rigorosos para amparo legal e fiscal",
      description: "Emissão de relatórios fotográficos, medições e ensaios técnicos estruturados com parecer de engenharia qualificado. Amparo legal e segurança operacional total para sua indústria ou condomínio.",
      items: [
        "Laudo de integridade física de máquinas industriais",
        "Laudo técnico de elevadores e escadas rolantes",
        "Laudo de estruturas metálicas e exaustores prediais",
        "Pareceres técnicos em processos judiciais"
      ]
    },
    "Regularização de Imóveis": {
      title: "Regularização Técnica Predial",
      subtitle: "Habite-se, vistorias de segurança e conformidade de equipamentos",
      description: "Vistorias detalhadas para garantir que os equipamentos de uso comum e estruturas mecânicas prediais estão em pleno acordo com as normas municipais e estaduais para emissão de Habite-se.",
      items: [
        "Vistoria em sistemas de exaustão e ventilação de cozinhas",
        "ART mecânica predial para elevadores e portões automáticos",
        "Relatório de conservação mecânica geral",
        "Regularização de playground e parquinhos residenciais"
      ]
    },
    "Projetos Elétricos": {
      title: "Projetos Elétricos de Força e Comando",
      subtitle: "Adequação de painéis e alimentação de maquinário pesado",
      description: "Soluções integradas de alimentação elétrica de potência e comando para máquinas industriais, garantindo que o sistema de segurança (NR-12) funcione em redundância perfeita.",
      items: [
        "Projetos elétricos industriais e de subestações",
        "Esquemas elétricos com dispositivos de parada de emergência",
        "Adequação de painéis elétricos conforme NR-12 e NBR-5410",
        "ART de instalações elétricas industriais"
      ]
    },
    "Projetos Estruturais": {
      title: "Cálculo e Projetos Estruturais",
      subtitle: "Dimensionamento e estabilidade de estruturas metálicas complexas",
      description: "Dimensionamento avançado de estruturas industriais, mezaninos, galpões e linhas de vida utilizando ferramentas de CAD 3D de alta precisão para garantir conformidade estrutural e segurança operacional.",
      items: [
        "Cálculo estrutural de mezaninos, galpões e passarelas metálicas",
        "Projeto e dimensionamento de linhas de vida para trabalho em altura",
        "Inspeção visual e ensaios não destrutivos em soldas",
        "Emissão de relatório de capacidade de carga de vigas e pilares"
      ]
    },
    "Engenharia Mecânica": {
      title: "Consultoria Geral em Engenharia Mecânica",
      subtitle: "Eficiência mecânica, segurança em máquinas e adequação de processos",
      description: "Consultoria integral oferecida pelo Eng. Josnei da Cunha para otimização de frotas, compressores de ar industriais, sistemas térmicos, caldeiras e pontes rolantes de elevação de carga.",
      items: [
        "Elaboração de PMOC (Plano de Manutenção de Ar Condicionado)",
        "Inspeção de tanques e geradores diesel de energia",
        "Assessoria de montagem e startup industrial",
        "Adequação de processos mecânicos à NR-12 e NR-13"
      ]
    },
    "Consultoria": {
      title: "Consultoria Técnica Especializada",
      subtitle: "Suporte corporativo contínuo para redução de riscos industriais",
      description: "Evite interdições, multas pesadas de órgãos fiscalizadores e garanta a integridade física de seus colaboradores através de uma consultoria periódica de segurança mecânica e conformidade técnica.",
      items: [
        "Auditoria de conformidade de NR-12 e NR-13 nas fábricas",
        "Cronograma anual de vistorias obrigatórias prediais",
        "Treinamento corporativo de segurança em pontes rolantes",
        "Assessoria técnica em compras de novos maquinários industriais"
      ]
    }
  };

  const landingPagesContent = siteSettings?.landingPagesContent || DEFAULT_LANDING_PAGES_CONTENT;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-[#155E54] selection:text-white">
      {/* Top Technical Contact Strip */}
      <div className="bg-[#031D33] text-slate-300 py-2.5 px-6 border-b border-slate-900/10 text-xs tracking-wide">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>JC EVOLUTION ENGENHARIA MECÂNICA</span>
          </div>
          <div className="flex items-center gap-5 font-medium text-[11px] text-slate-300">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{siteSettings.phone}</span>
            </a>
            <span className="hidden sm:inline text-slate-600">|</span>
            <a
              href={getEmailLink()}
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{siteSettings.email}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Sticky White Header Navigation */}
      <header className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 z-40 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <JCLogo
              type={siteSettings.logoType}
              customLogoUrl={siteSettings.customLogoUrl}
              logoText={siteSettings.logoText}
              logoSubtext={siteSettings.logoSubtext}
              showText={true}
              isDarkText={true}
              logoScale={siteSettings.logoScale}
              logoBg={siteSettings.logoBg}
              className="w-12 h-12 md:w-14 md:h-14"
            />
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4 py-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="#0D2B4D" strokeWidth="2.5" className="w-5 h-5 text-[#0D2B4D] shrink-0 opacity-80 animate-pulse">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "home"
                  ? "text-[#155E54] border-b-2 border-[#155E54] pb-1 rounded-none"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Início
            </button>
            <button
              onClick={() => setActiveTab("servicos")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "servicos"
                  ? "text-[#155E54] border-b-2 border-[#155E54] pb-1 rounded-none"
                  : "text-slate-600 hover:text-slate-955"
              }`}
            >
              Serviços
            </button>
            <button
              onClick={() => setActiveTab("projetos")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "projetos"
                  ? "text-[#155E54] border-b-2 border-[#155E54] pb-1 rounded-none"
                  : "text-slate-600 hover:text-slate-955"
              }`}
            >
              Projetos
            </button>
            <button
              onClick={() => setActiveTab("landing")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "landing"
                  ? "text-[#155E54] border-b-2 border-[#155E54] pb-1 rounded-none"
                  : "text-slate-600 hover:text-slate-955"
              }`}
            >
              Soluções Especializadas
            </button>
            <button
              onClick={() => setActiveTab("blog")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "blog"
                  ? "text-[#155E54] border-b-2 border-[#155E54] pb-1 rounded-none"
                  : "text-slate-600 hover:text-slate-955"
              }`}
            >
              Blog Técnico
            </button>
            <button
              onClick={() => setActiveTab("contato")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "contato"
                  ? "text-[#155E54] border-b-2 border-[#155E54] pb-1 rounded-none"
                  : "text-slate-600 hover:text-slate-955"
              }`}
            >
              Contato
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("contato")}
              className="hidden sm:inline-flex bg-[#0D2B4D] hover:bg-[#155E54] text-white font-bold text-[11px] tracking-wider uppercase px-5 py-2.5 rounded-md transition-all shadow-md cursor-pointer"
            >
              Consultar Engenheiro
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors focus:outline-none"
              title="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-6 py-4 space-y-2 shadow-inner animate-fade-in">
            <button
              onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "home" ? "bg-emerald-50 text-[#155E54]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Início
            </button>
            <button
              onClick={() => { setActiveTab("servicos"); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "servicos" ? "bg-emerald-50 text-[#155E54]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Serviços
            </button>
            <button
              onClick={() => { setActiveTab("projetos"); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "projetos" ? "bg-emerald-50 text-[#155E54]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Projetos
            </button>
            <button
              onClick={() => { setActiveTab("landing"); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "landing" ? "bg-emerald-50 text-[#155E54]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Soluções Especializadas
            </button>
            <button
              onClick={() => { setActiveTab("blog"); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "blog" ? "bg-emerald-50 text-[#155E54]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Blog Técnico
            </button>
            <button
              onClick={() => { setActiveTab("contato"); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "contato" ? "bg-emerald-50 text-[#155E54]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Contato
            </button>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center bg-[#155E54] hover:bg-[#1C7F72] text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                WhatsApp do Engenheiro
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Sections */}
      <main className="flex-grow">
        {/* HOME SECTION */}
        {activeTab === "home" && (
          <div className="bg-slate-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 px-6 bg-gradient-to-r from-[#031D33] via-[#0B2545] to-[#134074] text-white">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
              <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative">
                <div className="lg:col-span-7 space-y-6">
                  <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono tracking-widest uppercase font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    Engenharia Mecânica de Segurança & ARTs
                  </span>
                  
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-normal tracking-wide text-white leading-tight uppercase">
                    ENGENHARIA MECÂNICA DE PRECISÃO:<br />
                    <span className="text-[#00c4a7] font-sans font-black block mt-1 tracking-tight">SEGURANÇA E CONFORMIDADE</span>
                    PARA SUA EMPRESA
                  </h2>
                  
                  <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl font-sans font-normal opacity-90">
                    Garanta a integridade jurídica e operacional da sua empresa através de laudos técnicos de engenharia mecânica, inspeções periódicas de vasos de pressão (NR-13), adequações de máquinas (NR-12) e emissão de ART com velocidade, precisão e validade nacional.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      onClick={() => setActiveTab("contato")}
                      className="bg-[#155E54] hover:bg-[#1C7F72] text-white font-bold text-xs px-8 py-3.5 rounded-lg tracking-wider uppercase transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      Solicitar Inspeção/Laudo
                    </button>
                    <button
                      onClick={() => setActiveTab("servicos")}
                      className="border border-slate-400/40 hover:border-white text-white font-bold text-xs px-6 py-3.5 rounded-lg tracking-wider uppercase transition-all hover:bg-white/5 cursor-pointer"
                    >
                      Conhecer Serviços
                    </button>
                  </div>
                </div>

                {/* Right Column: Hero photo of engineer working */}
                <div className="lg:col-span-5 relative flex items-center justify-center pt-8 lg:pt-0">
                  <div className="w-full relative z-10 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-2xl overflow-hidden shadow-2xl p-2">
                    <img
                      src={siteSettings?.imgEngineer || "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80"}
                      alt="Engenheiro JC EVOLUTION ENGENHARIA MECÂNICA"
                      className="w-full h-[320px] object-cover rounded-xl filter contrast-115 brightness-95"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-2 bottom-2 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-5 rounded-b-xl">
                      <p className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">Responsável Técnico</p>
                      <p className="text-base font-bold text-white mt-1">Eng. Josnei da Cunha</p>
                      <p className="text-[10px] text-slate-300 font-mono mt-0.5">{siteSettings.crea} | CNPJ: {siteSettings.cnpj || "53.111.432/0001-36"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Grid Section Below Hero (Light Background) */}
            <section className="py-16 px-6 max-w-7xl mx-auto space-y-12">
              <div className="border-b border-slate-200 pb-6">
                <h3 className="text-2xl font-display text-slate-900 tracking-wide uppercase">Destaques Operacionais & Inspeções</h3>
                <p className="text-slate-500 text-xs mt-1">Garantia total de conformidade mecânica em Aparecida do Taboado - MS e Região.</p>
              </div>

              <div className="grid lg:grid-cols-12 gap-10 items-start">
                {/* Left Side: Columns 1 to 7 */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Large Card 1: LAUDOS TÉCNICOS */}
                  <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={siteSettings?.imgService1 || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80"}
                        alt="Pressure Vessel"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D2B4D]/90 via-transparent to-transparent" />
                      <div className="absolute bottom-5 left-6 text-white space-y-1">
                        <span className="bg-[#155E54] text-[10px] font-mono uppercase tracking-widest font-bold px-2.5 py-1 rounded">
                          NR-13 VIGENTE
                        </span>
                        <h4 className="text-2xl font-display tracking-wide uppercase mt-1">Laudos Técnicos e Vasos de Pressão</h4>
                        <p className="text-slate-200 text-xs opacity-90 max-w-md font-sans">Prontuários e inspeções completas de compressores de ar e vasos acumuladores.</p>
                      </div>
                    </div>
                    <div className="p-6 flex justify-between items-center bg-white">
                      <span className="text-xs text-slate-500 font-mono">Assinado por Eng. Mecânico com ART</span>
                      <button
                        onClick={() => { setActiveTab("landing"); setActiveLanding("Laudos Técnicos"); }}
                        className="text-xs font-bold uppercase tracking-wider text-[#155E54] hover:text-[#1C7F72] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Ver Detalhes <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Large Card 2: NR-12 & NR-13 */}
                  <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={siteSettings?.imgService2 || "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80"}
                        alt="NR-12 Adequações"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D2B4D]/90 via-transparent to-transparent" />
                      <div className="absolute bottom-5 left-6 text-white space-y-1">
                        <span className="bg-[#0D2B4D] text-[10px] font-mono uppercase tracking-widest font-bold px-2.5 py-1 rounded">
                          NR-12 SEGURANÇA
                        </span>
                        <h4 className="text-2xl font-display tracking-wide uppercase mt-1">NR-12 & Inspeção de Equipamentos</h4>
                        <p className="text-slate-200 text-xs opacity-90 max-w-md font-sans">Análise completa de riscos mecânicos e proteção de máquinas industriais.</p>
                      </div>
                    </div>
                    <div className="p-6 flex justify-between items-center bg-white">
                      <span className="text-xs text-slate-500 font-mono">Laudo e ART de conformidade para indústrias</span>
                      <button
                        onClick={() => { setActiveTab("landing"); setActiveLanding("Engenharia Mecânica"); }}
                        className="text-xs font-bold uppercase tracking-wider text-[#155E54] hover:text-[#1C7F72] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Ver Detalhes <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Columns 8 to 12 (RECEBA UMA CONSULTORIA TÉCNICA) */}
                <div id="consultoria-form-block" className="lg:col-span-5 bg-[#0D2B4D] text-white rounded-xl p-6 shadow-xl border border-slate-700/40">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#155E54]/40 flex items-center justify-center text-emerald-400">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-display tracking-wider uppercase text-slate-300 leading-none">Receba uma</h4>
                      <h3 className="text-lg font-black tracking-tight text-[#00c4a7] mt-0.5 leading-none font-sans">CONSULTORIA TÉCNICA</h3>
                    </div>
                  </div>

                  {consultSuccess ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-5 text-center space-y-3 animate-fade-in py-12">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-white text-sm">Solicitação Enviada!</h5>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Olá! O Engenheiro Josnei recebeu sua solicitação. Seus dados foram salvos com sucesso na nossa central de atendimento e entraremos em contato em breve.
                      </p>
                      <button
                        onClick={() => setConsultSuccess(false)}
                        className="text-[10px] font-mono text-emerald-400 hover:underline pt-2 uppercase tracking-wider cursor-pointer"
                      >
                        Enviar Outro Pedido
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleConsultSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-300 mb-1 font-semibold tracking-wider">Seu Nome Completo *</label>
                        <input
                          type="text"
                          required
                          value={consultName}
                          onChange={(e) => setConsultName(e.target.value)}
                          placeholder="Ex: João da Silva"
                          className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-slate-300 mb-1 font-semibold tracking-wider">E-mail Comercial</label>
                          <input
                            type="email"
                            value={consultEmail}
                            onChange={(e) => setConsultEmail(e.target.value)}
                            placeholder="contato@empresa.com"
                            className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-slate-300 mb-1 font-semibold tracking-wider">WhatsApp / Celular *</label>
                          <input
                            type="tel"
                            required
                            value={consultPhone}
                            onChange={(e) => setConsultPhone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-300 mb-1 font-semibold tracking-wider">Serviço Necessário</label>
                        <select
                          value={consultService}
                          onChange={(e) => setConsultService(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="NR-12 – Segurança em Máquinas">NR-12 – Segurança em Máquinas</option>
                          <option value="NR-13 – Vasos de Pressão / Caldeiras">NR-13 – Vasos de Pressão / Caldeiras</option>
                          <option value="Pontes Rolantes & Pórticos">Pontes Rolantes & Pórticos</option>
                          <option value="Laudos Técnicos e ART">Laudos Técnicos e ART</option>
                          <option value="Projetos de Climatização / PMOC">Projetos de Climatização / PMOC</option>
                          <option value="Estruturas Metálicas / Linhas de Vida">Estruturas Metálicas / Linhas de Vida</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-300 mb-1 font-semibold tracking-wider">Anexar Documentos / Croquis</label>
                        <div className="relative border border-dashed border-slate-600 hover:border-emerald-500 bg-slate-950/50 rounded-lg p-3 text-center cursor-pointer group transition-colors">
                          <input
                            type="file"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setConsultFileName(e.target.files[0].name);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                            <span className="text-[10px] text-slate-400">
                              {consultFileName || "Selecione ou arraste arquivos (PDF/Imagens)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-300 mb-1 font-semibold tracking-wider">Descrição das Suas Dúvidas / Escopo</label>
                        <textarea
                          value={consultMsg}
                          onChange={(e) => setConsultMsg(e.target.value)}
                          placeholder="Descreva brevemente suas máquinas ou equipamentos..."
                          rows={2}
                          className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingConsult}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-lg uppercase tracking-wider transition-all shadow shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingConsult ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processando...
                          </span>
                        ) : (
                          <span>Solicitar Orçamento</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Row of 5 category cards */}
              <div className="pt-16 space-y-8">
                <div className="border-b border-slate-200 pb-4">
                  <h4 className="text-xl font-display text-[#0D2B4D] uppercase tracking-wider">Escopo de Atendimento e Laudos com ART</h4>
                  <p className="text-xs text-slate-500 font-sans">Especialidades regulamentadas e prontas para auditorias ministeriais ou fiscais.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Category 1: NR-12 (Segurança) */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between">
                    <div className="p-4 space-y-3 flex-grow">
                      <div className="w-10 h-10 rounded-full bg-[#0D2B4D]/10 border border-[#0D2B4D]/25 flex items-center justify-center text-[#0D2B4D] mx-auto group-hover:bg-[#155E54] group-hover:text-white transition-all">
                        <Shield className="w-4.5 h-4.5" />
                      </div>
                      <img
                        src={siteSettings?.imgCardNr12 || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80"}
                        alt="Adequação NR-12"
                        className="w-full h-24 object-cover rounded-lg filter contrast-110"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[10px] text-center text-slate-500 font-mono">NR-12 (SEGURANÇA)</p>
                    </div>
                    <div className="bg-[#0D2B4D] p-2 text-center group-hover:bg-[#155E54] transition-colors mt-auto">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white">NR-12 Máquinas</span>
                    </div>
                  </div>

                  {/* Category 2: NR-13 (Caldeiras/Vasos) */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between">
                    <div className="p-4 space-y-3 flex-grow">
                      <div className="w-10 h-10 rounded-full bg-[#0D2B4D]/10 border border-[#0D2B4D]/25 flex items-center justify-center text-[#0D2B4D] mx-auto group-hover:bg-[#155E54] group-hover:text-white transition-all">
                        <Flame className="w-4.5 h-4.5" />
                      </div>
                      <img
                        src={siteSettings?.imgCardNr13 || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&auto=format&fit=crop&q=80"}
                        alt="NR-13 Caldeiras"
                        className="w-full h-24 object-cover rounded-lg filter contrast-110"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[10px] text-center text-slate-500 font-mono">NR-13 (VASOS/CALDEIRAS)</p>
                    </div>
                    <div className="bg-[#0D2B4D] p-2 text-center group-hover:bg-[#155E54] transition-colors mt-auto">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white">NR-13 Vasos</span>
                    </div>
                  </div>

                  {/* Category 3: PONTES ROLANTES */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between">
                    <div className="p-4 space-y-3 flex-grow">
                      <div className="w-10 h-10 rounded-full bg-[#0D2B4D]/10 border border-[#0D2B4D]/25 flex items-center justify-center text-[#0D2B4D] mx-auto group-hover:bg-[#155E54] group-hover:text-white transition-all">
                        <Wrench className="w-4.5 h-4.5" />
                      </div>
                      <img
                        src={siteSettings?.imgCardPontes || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&auto=format&fit=crop&q=80"}
                        alt="Pontes Rolantes"
                        className="w-full h-24 object-cover rounded-lg filter contrast-110"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[10px] text-center text-slate-500 font-mono">PONTES ROLANTES</p>
                    </div>
                    <div className="bg-[#0D2B4D] p-2 text-center group-hover:bg-[#155E54] transition-colors mt-auto">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white">Pontes Rolantes</span>
                    </div>
                  </div>

                  {/* Category 4: LAUDOS TÉCNICOS S ART */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between">
                    <div className="p-4 space-y-3 flex-grow">
                      <div className="w-10 h-10 rounded-full bg-[#0D2B4D]/10 border border-[#0D2B4D]/25 flex items-center justify-center text-[#0D2B4D] mx-auto group-hover:bg-[#155E54] group-hover:text-white transition-all">
                        <ClipboardList className="w-4.5 h-4.5" />
                      </div>
                      <img
                        src={siteSettings?.imgCardLaudos || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&auto=format&fit=crop&q=80"}
                        alt="Laudos Técnicos"
                        className="w-full h-24 object-cover rounded-lg filter contrast-110"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[10px] text-center text-slate-500 font-mono">LAUDOS TÉCNICOS</p>
                    </div>
                    <div className="bg-[#0D2B4D] p-2 text-center group-hover:bg-[#155E54] transition-colors mt-auto">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white">Laudos com ART</span>
                    </div>
                  </div>

                  {/* Category 5: ESTRUTURAS METÁLICAS */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between">
                    <div className="p-4 space-y-3 flex-grow">
                      <div className="w-10 h-10 rounded-full bg-[#0D2B4D]/10 border border-[#0D2B4D]/25 flex items-center justify-center text-[#0D2B4D] mx-auto group-hover:bg-[#155E54] group-hover:text-white transition-all">
                        <Building className="w-4.5 h-4.5" />
                      </div>
                      <img
                        src={siteSettings?.imgCardEstruturas || "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=80"}
                        alt="Estruturas Metálicas"
                        className="w-full h-24 object-cover rounded-lg filter contrast-110"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[10px] text-center text-slate-500 font-mono">ESTRUTURAS METÁLICAS</p>
                    </div>
                    <div className="bg-[#0D2B4D] p-2 text-center group-hover:bg-[#155E54] transition-colors mt-auto">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white">E. Metálicas</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TMX PARTNERSHIP SECTION */}
            <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-200">
              {/* TMX Strategic Partnership */}
              <div className="bg-gradient-to-r from-[#031D33] to-[#0D2B4D] text-white rounded-2xl p-8 shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                
                <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
                  <div className="lg:col-span-4 space-y-4 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-[#155E54]/30 border border-[#155E54]/50 px-3 py-1 rounded-full text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-semibold">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      Parceria Estratégica Homologada
                    </div>
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl font-mono shadow-md">
                        TMX
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white leading-none font-sans tracking-wide uppercase">TMX SOLUÇÕES</h4>
                        <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-semibold mt-1 block">Soluções Completas para a Indústria</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed font-sans">
                      Especialistas em engenharia, manutenção industrial e infraestrutura elétrica, integrando perícia eletroeletrônica às nossas vistorias e laudos mecânicos sob medida.
                    </p>
                  </div>

                  <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
                    {[
                      {
                        title: "⚡ ENGENHARIA ELÉTRICA",
                        desc: "Subestações de Energia Elétrica",
                        items: [
                          "Manutenção preventiva e corretiva",
                          "Ensaios e inspeções térmicas",
                          "Projetos e ampliações industriais",
                          "Migração para o Mercado Livre de Energia"
                        ]
                      },
                      {
                        title: "🔋 FATOR DE POTÊNCIA",
                        desc: "Correção de Perdas Reativas",
                        items: [
                          "Dimensionamento de Bancos de Capacitores",
                          "Projeto elétrico de estabilidade",
                          "Instalação e retrofitting físico",
                          "Comissionamento técnico e homologação"
                        ]
                      },
                      {
                        title: "🛡️ SPDA & ATERRAMENTO",
                        desc: "Proteção contra Descargas Atmosféricas",
                        items: [
                          "Projetos estruturais de para-raios",
                          "Inspeções e laudos conforme NBR 5419",
                          "Medições de resistência de aterramento",
                          "Emissão de laudos técnicos conclusivos"
                        ]
                      },
                      {
                        title: "💡 PROJETOS ELÉTRICOS",
                        desc: "Força, Comando e NR-12",
                        items: [
                          "Projetos unifilares e multifilares",
                          "Diagramas de intertravamento de segurança",
                          "Adequação de painéis elétricos industriais",
                          "Esquemas elétricos para maquinário pesado"
                        ]
                      }
                    ].map((serv, sidx) => (
                      <div key={sidx} className="bg-slate-900/50 border border-slate-800 hover:border-slate-700/50 rounded-xl p-4 transition-all">
                        <h5 className="font-bold text-xs text-emerald-400 font-sans tracking-wider leading-none uppercase mb-1">{serv.title}</h5>
                        <p className="text-[10px] text-slate-300 font-semibold mb-2 font-mono">{serv.desc}</p>
                        <ul className="space-y-1 text-[9.5px] text-slate-400 font-sans">
                          {serv.items.map((item, iidx) => (
                            <li key={iidx} className="flex items-start gap-1.5 leading-tight">
                              <CheckCircle className="w-3 h-3 text-[#00c4a7] shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* PROJETOS SECTION */}
        {activeTab === "projetos" && (
          <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-emerald-600 font-mono text-[10px] tracking-widest uppercase font-semibold">Galeria de Engenharia</span>
              <h2 className="text-3xl font-sans font-bold tracking-tight text-[#0D2B4D]">Projetos Realizados</h2>
            </div>

            {/* Photos-Only Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((imgSrc, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className="relative group overflow-hidden bg-slate-100 border border-slate-200 rounded-xl cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 aspect-[4/3]"
                  id={`project-photo-${idx}`}
                >
                  <img
                    src={imgSrc}
                    alt={`Projeto Realizado ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle dark overlay on hover to indicate interactive click */}
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="bg-[#0D2B4D]/90 text-white rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg transform translate-y-2 group-hover:translate-y-0">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SERVICES SECTION */}
        {activeTab === "servicos" && (
          <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-emerald-600 font-mono text-[10px] tracking-widest uppercase font-semibold">Portfólio Operacional</span>
              <h2 className="text-3xl font-sans font-bold tracking-tight text-[#0D2B4D]">Nossos Principais Serviços Mecânicos</h2>
              <p className="text-slate-600 text-sm">
                Conheça as áreas de especialização em conformidade e engenharia lideradas pelo Eng. Josnei da Cunha.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* NR-12 */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-emerald-500/50 transition-all shadow-lg group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-sans flex items-center gap-1.5">
                    NR-12: Segurança de Máquinas
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Inventário completo de máquinas do parque industrial, análise criteriosa de riscos, propostas de intertravamento físico e emissão de laudo técnico de adequação com ART.
                  </p>
                </div>
                <button onClick={() => { setActiveTab("landing"); setActiveLanding("Engenharia Mecânica"); }} className="text-emerald-400 text-xs font-semibold flex items-center gap-1 hover:text-emerald-300 transition-colors">
                  Saiba mais <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* NR-13 */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-emerald-500/50 transition-all shadow-lg group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-sans flex items-center gap-1.5">
                    NR-13: Caldeiras & Vasos
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Inspeção obrigatória anual de caldeiras de vapor, compressores de ar industriais, reservatórios de CO2, tanques de gás e emissão de prontuários com testes hidrostáticos periódicos.
                  </p>
                </div>
                <button onClick={() => { setActiveTab("landing"); setActiveLanding("Engenharia Mecânica"); }} className="text-emerald-400 text-xs font-semibold flex items-center gap-1 hover:text-emerald-300 transition-colors">
                  Saiba mais <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Pontes rolantes */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-emerald-500/50 transition-all shadow-lg group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-sans flex items-center gap-1.5">
                    Pontes Rolantes & Pórticos
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Inspeções mecânicas estruturais de pontas e pórticos rolantes industriais de movimentação de cargas, atestando capacidades técnicas máximas e integridade física de cabos de aço.
                  </p>
                </div>
                <button onClick={() => { setActiveTab("landing"); setActiveLanding("Laudos Técnicos"); }} className="text-emerald-400 text-xs font-semibold flex items-center gap-1 hover:text-emerald-300 transition-colors">
                  Saiba mais <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Linhas de Vida */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-emerald-500/50 transition-all shadow-lg group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-sans flex items-center gap-1.5">
                    Estruturas & Linhas de Vida
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Projetos estruturais, análise de força estática e certificação técnica de linhas de vida horizontais e verticais em telhados industriais, mezaninos e pontos de ancoragem (NR-35).
                  </p>
                </div>
                <button onClick={() => { setActiveTab("landing"); setActiveLanding("Projetos Estruturais"); }} className="text-emerald-400 text-xs font-semibold flex items-center gap-1 hover:text-emerald-300 transition-colors">
                  Saiba mais <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* ART */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-emerald-500/50 transition-all shadow-lg group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-sans flex items-center gap-1.5">
                    Emissão de ARTs
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Emissão rápida de Anotação de Responsabilidade Técnica (ART) junto ao CREA para brinquedos de playground, geradores, exaustores, sistemas de ar condicionado (PMOC), entre outros.
                  </p>
                </div>
                <button onClick={() => { setActiveTab("landing"); setActiveLanding("ART"); }} className="text-emerald-400 text-xs font-semibold flex items-center gap-1 hover:text-emerald-300 transition-colors">
                  Saiba mais <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Consultoria Técnica */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-emerald-500/50 transition-all shadow-lg group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-sans flex items-center gap-1.5">
                    Consultoria de Segurança
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Assessoria continuada para indústrias, com auditorias periódicas, orientações para eliminação de multas do MTE, treinamento de pessoal e acompanhamento pericial em ações trabalhistas.
                  </p>
                </div>
                <button onClick={() => { setActiveTab("landing"); setActiveLanding("Consultoria"); }} className="text-emerald-400 text-xs font-semibold flex items-center gap-1 hover:text-emerald-300 transition-colors">
                  Saiba mais <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SOLUÇÕES LANDING PAGES SECTION */}
        {activeTab === "landing" && (
          <section className="py-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-12 gap-10">
            {/* Sidebar of landings selector */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl h-fit space-y-2">
              <span className="text-[10px] font-mono text-slate-500 block px-3 uppercase tracking-wider mb-2">Selecione uma Solução</span>
              {Object.keys(landingPagesContent).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveLanding(key)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeLanding === key ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <span>{key}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>

            {/* Selected Landing Page Main Layout */}
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-8 space-y-6 relative overflow-hidden min-h-[500px]">
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono px-3 py-1 rounded-full border border-emerald-800/40 uppercase tracking-widest font-semibold inline-block">
                  Página Otimizada para SEO
                </span>
                <h2 className="text-2xl md:text-3xl font-sans font-bold text-white tracking-tight mt-4">
                  {landingPagesContent[activeLanding]?.title}
                </h2>
                <p className="text-emerald-400 text-xs font-medium font-sans mt-1.5">
                  {landingPagesContent[activeLanding]?.subtitle}
                </p>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed border-t border-slate-800/80 pt-4">
                {landingPagesContent[activeLanding]?.description}
              </p>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Itens inclusos neste escopo:</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {landingPagesContent[activeLanding]?.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-start gap-2">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-300 leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to action card for Landing Page */}
              <div className="bg-[#0d2b4d] border border-emerald-900/40 p-5 rounded-xl mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-white text-sm">Fale com o Engenheiro Josnei</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed max-w-sm">
                    Tire dúvidas técnicas imediatas e faça uma simulação de custos para o serviço de {activeLanding}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsChatOpen(true);
                    const initMessage = `Olá! Tenho interesse no serviço de ${activeLanding}.`;
                    setChatHistory((prev) => {
                      const lastItem = prev[prev.length - 1];
                      if (lastItem && lastItem.role === "user" && lastItem.text === initMessage) {
                        return prev;
                      }
                      return [...prev, { role: "user", text: initMessage }];
                    });
                    handleSendChatMessage(undefined, initMessage);
                    setActiveTab("contato");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-colors shadow flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Iniciar Chat de Atendimento
                </button>
              </div>
            </div>
          </section>
        )}

        {/* BLOG TECHNICAL SECTION */}
        {activeTab === "blog" && (
          <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
              <div className="space-y-3">
                <span className="text-emerald-600 font-mono text-[10px] tracking-widest uppercase font-semibold">Informativos Técnicos</span>
                <h2 className="text-3xl font-sans font-bold tracking-tight text-[#0D2B4D]">Nosso Blog de Engenharia</h2>
                <p className="text-slate-600 text-sm">
                  Artigos explicativos sobre conformidades regulatórias e inovações do setor mecânico de segurança.
                </p>
              </div>

              {/* Public Blog Header Badge */}
              <div className="text-right text-xs font-mono text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-lg">
                Informativo Técnico & Normas
              </div>
            </div>

            {/* List of Articles */}
            <div className="grid md:grid-cols-2 gap-8">
              {blogPosts.map((post) => (
                <div key={post.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg hover:border-emerald-500/40 transition-all group flex flex-col justify-between">
                  <div>
                    <img src={post.imageUrl} className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={post.title} referrerPolicy="no-referrer" />
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                        <span className="bg-slate-850 px-2.5 py-1 rounded-full text-emerald-400 font-bold border border-slate-700/60 uppercase">
                          {post.category}
                        </span>
                        <span>{post.date}</span>
                      </div>
                      <h3 className="font-sans font-bold text-lg text-white group-hover:text-emerald-400 transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                        {post.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex justify-between items-center border-t border-slate-800/60 mt-4">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-emerald-500" />
                      {post.author}
                    </span>
                    <button
                      onClick={() => setSelectedArticle(post)}
                      className="bg-slate-850 hover:bg-slate-800 border border-slate-700 px-4.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                    >
                      Ler Artigo Completo
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Read Article Modal */}
            {selectedArticle && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden relative shadow-2xl">
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="absolute top-4 right-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors z-10"
                  >
                    ✕
                  </button>

                  {/* Header image */}
                  <img src={selectedArticle.imageUrl} className="w-full h-52 object-cover opacity-80" alt={selectedArticle.title} referrerPolicy="no-referrer" />

                  <div className="p-6 md:p-8 overflow-y-auto space-y-4">
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                      <span className="bg-slate-850 px-2.5 py-1 rounded-full text-emerald-400 font-bold border border-slate-700/60 uppercase">
                        {selectedArticle.category}
                      </span>
                      <span>{selectedArticle.date}</span>
                      <span>Autor: {selectedArticle.author}</span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold font-sans text-white leading-tight">
                      {selectedArticle.title}
                    </h2>

                    <div className="text-slate-300 text-xs md:text-sm leading-relaxed space-y-4 font-sans whitespace-pre-line border-t border-slate-800 pt-6">
                      {selectedArticle.content}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-colors"
                    >
                      Fechar Leitura
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* CONTACT SECTION WITH CHATBOT INTELLIGENT COMPONENT */}
        {activeTab === "contato" && (
          <section className="py-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-start">
            {/* Direct Contact info */}
            <div className="lg:col-span-5 space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
              <div className="space-y-3">
                <span className="text-emerald-500 font-mono text-[10px] tracking-widest uppercase font-semibold">Atendimento Direto</span>
                <h2 className="text-2xl font-sans font-bold tracking-tight text-white">Canais de Atendimento</h2>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Entre em contato com o Eng. Josnei da Cunha para esclarecer dúvidas sobre conformidades mecânicas, orçamentos rápidos de ARTs ou visitas técnicas.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-950/40 border border-emerald-900/40 p-4 rounded-xl flex items-center gap-3.5 hover:bg-emerald-950/60 transition-colors group"
                >
                  <Phone className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">WhatsApp & Celular</p>
                    <p className="font-bold text-white text-sm">{siteSettings?.phone || "(49) 99832-5358"}</p>
                  </div>
                </a>

                <a
                  href={getEmailLink()}
                  className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 hover:bg-slate-900/80 hover:border-emerald-900/30 transition-colors group"
                >
                  <Mail className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  <div>
                    <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">E-mail Comercial</p>
                    <p className="font-bold text-white text-sm">{siteSettings?.email || "josnei.cunha@gmail.com"}</p>
                  </div>
                </a>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">Localização Base</p>
                    <p className="font-bold text-white text-sm">Aparecida do Taboado - MS</p>
                  </div>
                </div>

                <a
                  href="https://www.linkedin.com/in/josnei-da-cunha-8b88a184/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 hover:bg-slate-900/80 hover:border-blue-950/30 transition-colors group"
                >
                  <Linkedin className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <div>
                    <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">LinkedIn Profissional</p>
                    <p className="font-bold text-white text-sm">Eng. Josnei da Cunha</p>
                  </div>
                </a>

                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 hover:bg-slate-900/80 hover:border-pink-950/30 transition-colors group"
                >
                  <Instagram className="w-5 h-5 text-slate-400 group-hover:text-pink-400 transition-colors" />
                  <div>
                    <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">Instagram Oficial</p>
                    <p className="font-bold text-white text-sm">@jcevolutionengenharia</p>
                  </div>
                </a>
              </div>

              <div className="border-t border-slate-800 pt-6 space-y-3">
                <h4 className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">Credenciais da Empresa & Habilitação</h4>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center grid grid-cols-2 gap-4 divide-x divide-slate-800">
                  <div>
                    <p className="font-bold text-emerald-400 text-sm">{siteSettings.crea || "CREA/RN: 2521304182"}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Visto para atuação em MS</p>
                  </div>
                  <div className="pl-4">
                    <p className="font-bold text-emerald-400 text-sm">CNPJ: {siteSettings.cnpj || "53.111.432/0001-36"}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Situação Cadastral Ativa</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Chatbot comercial interface */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col h-[550px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Chatbot Header */}
              <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800/40 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                      NORA - assistente virtual
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    </h3>
                    <p className="text-[10px] text-slate-400">Esclareça dúvidas e simule propostas mecânicas</p>
                  </div>
                </div>
              </div>

              {/* Chat messages stream */}
              <div className="flex-grow p-6 overflow-y-auto space-y-5">
                {chatHistory.map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-3 ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                    
                    {/* Bot Avatar on Left */}
                    {item.role === "bot" && (
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-emerald-900/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed font-sans shadow-md ${
                      item.role === "user"
                        ? "bg-emerald-600 text-white border border-emerald-500/20"
                        : "bg-slate-900/90 border border-slate-800 text-slate-100"
                    }`}>
                      {item.role === "user" ? (
                        <div className="whitespace-pre-line text-sm leading-relaxed">{item.text}</div>
                      ) : (
                        <FormattedMessage text={item.text} />
                      )}
                    </div>

                    {/* User Avatar on Right */}
                    {item.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 shadow-sm">
                        <User className="w-4 h-4" />
                      </div>
                    )}

                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex items-start gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-emerald-900/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      NORA está digitando...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message inputs form */}
              <form onSubmit={handleSendChatMessage} className="bg-slate-900 border-t border-slate-800 p-4 flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Pergunte sobre NR-12, NR-13, ARTs, ou dê seus dados para simular orçamento..."
                  className="flex-grow bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatMessage.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900/80 py-8 px-6 text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <JCLogo
              type={siteSettings.logoType}
              customLogoUrl={siteSettings.customLogoUrl}
              logoText={siteSettings.logoText}
              logoSubtext={siteSettings.logoSubtext}
              showText={true}
              logoScale={siteSettings.logoScale}
              logoBg={siteSettings.logoBg}
              className="w-10 h-10"
            />
            <div className="border-l border-slate-800 pl-3">
              <p className="text-[10px] font-mono text-slate-400">
                {siteSettings.crea}
                <span className="mx-1.5 opacity-40">|</span>
                CNPJ: {siteSettings.cnpj || "53.111.432/0001-36"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-[10px] uppercase font-mono tracking-wider">
            <span>{siteSettings.city} - {siteSettings.state}</span>
            <span className="hidden md:inline">•</span>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {siteSettings.phone}
            </a>
            <span className="hidden md:inline">•</span>
            <a
              href={getEmailLink()}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {siteSettings.email}
            </a>
          </div>

          {/* Dynamic Access Options moved to footer for high security & clean user interface */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onEnterAdmin}
                  className="bg-emerald-900/30 hover:bg-emerald-800/40 border border-emerald-800/40 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 shadow-sm"
                >
                  <Shield className="w-3 h-3" />
                  {user.role === "engineer" ? "Painel Josnei" : "Workspace Dev"}
                </button>
                <button
                  onClick={onLogout}
                  className="bg-slate-900 border border-slate-800 hover:bg-red-950/45 hover:text-red-400 hover:border-red-900/40 px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold text-slate-500 transition-all"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={onEnterAdmin}
                className="bg-slate-950 border border-slate-900 hover:bg-slate-900 hover:text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold text-slate-600 transition-all flex items-center gap-1"
              >
                <Shield className="w-3 h-3" />
                Painel Interno
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-900/60 mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[10px] font-mono text-slate-500">
            © 2026 {siteSettings.logoText}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/josnei-da-cunha-8b88a184/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-blue-400 transition-colors"
              title="LinkedIn Profissional"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-pink-400 transition-colors"
              title="Instagram Oficial"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>

      {/* LIGHTBOX MODAL */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm p-4 select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white rounded-full p-2.5 transition-all duration-300 z-50 border border-white/10"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null ? (prev === 0 ? galleryImages.length - 1 : prev - 1) : null));
            }}
            className="absolute left-4 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white rounded-full p-3 transition-all duration-300 z-50 border border-white/10"
            title="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Active Image */}
          <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={galleryImages[lightboxIndex]}
              alt={`Projeto Realizado Ampliado ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/75 text-xs font-mono">
              {lightboxIndex + 1} / {galleryImages.length}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null ? (prev === galleryImages.length - 1 ? 0 : prev + 1) : null));
            }}
            className="absolute right-4 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white rounded-full p-3 transition-all duration-300 z-50 border border-white/10"
            title="Próximo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* ZOOMED LOGO LIGHTBOX MODAL */}
      {zoomedLogo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-md p-4 select-none transition-all duration-300"
          onClick={() => setZoomedLogo(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setZoomedLogo(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white rounded-full p-2.5 transition-all duration-300 z-50 border border-white/10"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Container Card */}
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl p-8 md:p-12 shadow-2xl border border-white/10 flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-h-[55vh] flex items-center justify-center p-4">
              {zoomedLogo.isSvg ? (
                // For custom inline SVGs: render them nicely inside a scaled box
                <div className="w-full max-w-md h-auto flex items-center justify-center scale-150 transform transition-transform duration-300">
                  {zoomedLogo.svg}
                </div>
              ) : (
                // For user uploaded base64/url images: render them colorfully and in full resolution
                <img
                  src={zoomedLogo.url}
                  alt={zoomedLogo.name}
                  className="max-w-full max-h-[50vh] object-contain transition-all duration-300 transform scale-100 hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60";
                  }}
                />
              )}
            </div>
            
            {/* Logo details */}
            <div className="mt-8 text-center space-y-1">
              <span className="text-[#155E54] font-mono text-[10px] tracking-widest uppercase font-bold">Empresa Parceira</span>
              <h4 className="text-xl font-bold text-slate-800 uppercase tracking-wide">{zoomedLogo.name}</h4>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
