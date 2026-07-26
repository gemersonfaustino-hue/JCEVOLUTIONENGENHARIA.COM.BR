/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Compass, Shield, Landmark, Users, LayoutDashboard, Map, Network, ArrowLeft, Bot, Sparkles, Building2, Terminal,
  FileText, Lock, User, X, AlertCircle, Settings, Mail, Briefcase
} from "lucide-react";
import { Lead, Transaction, ServiceOrder, BlogPost, SiteSettings } from "./types";
import PublicWebsite from "./components/PublicWebsite";
import AdminCRM from "./components/AdminCRM";
import AdminERP from "./components/AdminERP";
import AdminProspect from "./components/AdminProspect";
import AdminDashboard from "./components/AdminDashboard";
import InteractiveMap from "./components/InteractiveMap";
import AdminBlog from "./components/AdminBlog";
import AdminProjects from "./components/AdminProjects";
import AdminSettings from "./components/AdminSettings";
import JCLogo from "./components/JCLogo";
import ResilientImage from "./components/ResilientImage";
import ErrorBoundary from "./components/ErrorBoundary";
import { supabase, supabaseAnonKey } from "./lib/supabase";
import { useToast } from "./components/Toast";

export default function App() {
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<"public" | "admin">("public");
  const [adminTab, setAdminTab] = useState<"dashboard" | "crm" | "erp" | "prospect" | "map" | "blog" | "projects" | "settings">("dashboard");

  // User auth state
  const [user, setUser] = useState<{ id: string; name: string; role: "engineer" | "admin"; email: string; crea?: string } | null>(() => {
    const saved = localStorage.getItem("jc_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration state
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"engineer" | "admin">("engineer");
  const [regCrea, setRegCrea] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setRegisterSuccess("");
    setLoginLoading(true);

    try {
      const isSupabaseConfigured = !supabaseAnonKey.includes("placeholder");
      if (isSupabaseConfigured) {
        console.log("Tentando cadastrar usuário via Supabase Auth...");
        const { data, error } = await supabase.auth.signUp({
          email: regEmail,
          password: regPassword,
          options: {
            data: {
              name: regName,
              username: regUsername,
              role: regRole,
              crea: regRole === "engineer" ? regCrea : undefined
            }
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          setRegisterSuccess("Usuário cadastrado com sucesso via Supabase Auth! Você já pode fazer login.");
          setLoginUsername(regUsername);
          setRegName("");
          setRegUsername("");
          setRegEmail("");
          setRegPassword("");
          setRegCrea("");
          setRegRole("engineer");
          
          setTimeout(() => {
            setIsRegisterMode(false);
            setRegisterSuccess("");
          }, 3000);
          return;
        }
      }

      // Fallback para API local
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          email: regEmail,
          password: regPassword,
          role: regRole,
          crea: regRole === "engineer" ? regCrea : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao cadastrar usuário");
      }

      setRegisterSuccess("Usuário cadastrado com sucesso! Você já pode fazer login.");
      setLoginUsername(regUsername);
      
      // Clear fields
      setRegName("");
      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
      setRegCrea("");
      setRegRole("engineer");
      
      setTimeout(() => {
        setIsRegisterMode(false);
        setRegisterSuccess("");
      }, 3000);
    } catch (err: any) {
      setLoginError(err.message || "Erro ao cadastrar");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const isSupabaseConfigured = !supabaseAnonKey.includes("placeholder");
      if (isSupabaseConfigured) {
        console.log("Tentando login via Supabase Auth...");
        // Se for username, tentamos normalizar ou usar padrão
        const emailToLogin = loginUsername.includes("@") ? loginUsername : `${loginUsername}@jcengenharia.com`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToLogin,
          password: loginPassword
        });

        if (!error && data.user) {
          const loggedUser = {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Usuário",
            role: (data.user.user_metadata?.role as "engineer" | "admin") || "engineer",
            email: data.user.email || "",
            crea: data.user.user_metadata?.crea
          };

          setUser(loggedUser);
          localStorage.setItem("jc_user", JSON.stringify(loggedUser));
          setShowLoginModal(false);
          setLoginUsername("");
          setLoginPassword("");
          
          setCurrentView("admin");
          if (loggedUser.role === "admin") {
            setAdminTab("blog");
          } else {
            setAdminTab("dashboard");
          }
          return;
        } else if (error) {
          console.warn("Erro no Supabase Auth (tentando fallback local):", error.message);
        }
      }

      // Fallback para API local
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Credenciais inválidas");
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem("jc_user", JSON.stringify(data.user));
      setShowLoginModal(false);
      setLoginUsername("");
      setLoginPassword("");
      
      // Route based on role
      setCurrentView("admin");
      if (data.user.role === "admin") {
        setAdminTab("blog");
      } else {
        setAdminTab("dashboard");
      }
    } catch (err: any) {
      setLoginError(err.message || "Erro ao efetuar login");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    const isSupabaseConfigured = !supabaseAnonKey.includes("placeholder");
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem("jc_user");
    setCurrentView("public");
  };

  // App Centralized States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
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
  });

  // Fetch all resources on mount
  const fetchAllData = async () => {
    console.log("[App] Carregando dados do servidor local...");
    try {
      const [leadsRes, txRes, osRes, blogRes, settingsRes] = await Promise.all([
        fetch("/api/crm/leads"),
        fetch("/api/erp/transactions"),
        fetch("/api/erp/os"),
        fetch("/api/blog/posts"),
        fetch("/api/site-settings")
      ]);

      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (osRes.ok) setServiceOrders(await osRes.json());
      if (blogRes.ok) setBlogPosts(await blogRes.json());
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSiteSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error loading application dataset:", error);
    }
  };

  const handleRefreshSettings = async () => {
    try {
      const response = await fetch("/api/site-settings");
      if (response.ok) {
        const data = await response.json();
        setSiteSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error refreshing site settings:", error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // -------------------------------------------------------------
  // CRM API Operations
  // -------------------------------------------------------------
  const handleAddLead = async (leadData: Partial<Lead>) => {
    try {
      const response = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData)
      });
      if (response.ok) {
        const newLead = await response.json();
        setLeads((prev) => [...prev, newLead]);
        const txRes = await fetch("/api/erp/transactions");
        if (txRes.ok) setTransactions(await txRes.json());
        showToast(`Lead "${newLead.name || 'Novo Lead'}" cadastrado com sucesso!`, "success");
      } else {
        showToast("Erro ao criar lead no sistema.", "error");
      }
    } catch (error) {
      console.error("Error adding lead:", error);
      showToast("Falha de conexão ao criar lead.", "error");
    }
  };

  const handleUpdateLead = async (id: string, updatedData: Partial<Lead>) => {
    try {
      const response = await fetch(`/api/crm/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const updatedLead = await response.json();
        setLeads((prev) => prev.map((l) => (l.id === id ? updatedLead : l)));
        showToast("Lead atualizado com sucesso!", "success");
      } else {
        showToast("Erro ao atualizar o lead.", "error");
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      showToast("Falha de conexão ao atualizar o lead.", "error");
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const response = await fetch(`/api/crm/leads/${id}`, { method: "DELETE" });
      if (response.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        showToast("Lead removido com sucesso!", "success");
      } else {
        showToast("Erro ao excluir o lead.", "error");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      showToast("Falha de conexão ao excluir o lead.", "error");
    }
  };

  // -------------------------------------------------------------
  // ERP Finance API Operations
  // -------------------------------------------------------------
  const handleAddTransaction = async (txData: Partial<Transaction>) => {
    try {
      const response = await fetch("/api/erp/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txData)
      });
      if (response.ok) {
        const newTx = await response.json();
        setTransactions((prev) => [...prev, newTx]);
        showToast("Transação financeira registrada com sucesso!", "success");
      } else {
        showToast("Erro ao registrar transação.", "error");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      showToast("Falha ao registrar transação financeira.", "error");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/erp/transactions/${id}`, { method: "DELETE" });
      if (response.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        showToast("Transação excluída com sucesso!", "success");
      } else {
        showToast("Erro ao excluir transação.", "error");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showToast("Falha ao excluir transação financeira.", "error");
    }
  };

  // -------------------------------------------------------------
  // ERP Operational OS API Operations
  // -------------------------------------------------------------
  const handleUpdateOS = async (id: string, updatedData: Partial<ServiceOrder>) => {
    try {
      const response = await fetch(`/api/erp/os/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const updatedOs = await response.json();
        setServiceOrders((prev) => prev.map((o) => (o.id === id ? updatedOs : o)));
        showToast("Ordem de serviço atualizada com sucesso!", "success");
      } else {
        showToast("Erro ao salvar ordem de serviço.", "error");
      }
    } catch (error) {
      console.error("Error updating service order:", error);
      showToast("Falha ao atualizar ordem de serviço.", "error");
    }
  };

  const handleCreateOSFromLead = async (lead: Lead) => {
    const isNR12 = lead.service.includes("NR-12");
    const defaultChecklist = isNR12
      ? [
          { item: "Mapeamento e inventário de máquinas de segurança", checked: true },
          { item: "Análise preliminar de riscos individuais de operação", checked: false },
          { item: "Validação elétrica redundante de painéis", checked: false },
          { item: "Emissão final de laudo de conformidade NR-12 com ART", checked: false }
        ]
      : [
          { item: "Vistoria mecânica preliminar de campo", checked: true },
          { item: "Inspeção visual e ensaio de ultrassom de chapas", checked: false },
          { item: "Calibração e teste de vedação de válvulas", checked: false },
          { item: "Emissão de laudo técnico qualificado e ART", checked: false }
        ];

    const osPayload = {
      leadId: lead.id,
      title: `Ordem de Serviço - ${lead.company} (${lead.service})`,
      checklist: defaultChecklist,
      startDate: new Date().toISOString().split("T")[0]
    };

    try {
      const response = await fetch("/api/erp/os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(osPayload)
      });

      if (response.ok) {
        const newOs = await response.json();
        setServiceOrders((prev) => [...prev, newOs]);
        showToast("Ordem de serviço gerada e enviada ao ERP com sucesso!", "success");
        setAdminTab("erp");
      } else {
        showToast("Erro ao gerar ordem de serviço.", "error");
      }
    } catch (error) {
      console.error("Error generating OS from lead:", error);
      showToast("Falha ao gerar ordem de serviço.", "error");
    }
  };

  // -------------------------------------------------------------
  // Blog Refresh
  // -------------------------------------------------------------
  const handleRefreshBlog = async () => {
    try {
      const response = await fetch("/api/blog/posts");
      if (response.ok) {
        setBlogPosts(await response.json());
      }
    } catch (error) {
      console.error("Error refreshing blog list:", error);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* PUBLIC CLIENT PORTAL OR ADMIN WORKSPACE SWITCHER */}
      {currentView === "public" ? (
        <PublicWebsite
          blogPosts={blogPosts}
          onAddLead={handleAddLead}
          onRefreshBlog={handleRefreshBlog}
          user={user}
          onLogout={handleLogout}
          siteSettings={siteSettings}
          onEnterAdmin={() => {
            if (user) {
              setCurrentView("admin");
              if (user.role === "admin") {
                setAdminTab("blog");
              } else {
                setAdminTab("dashboard");
              }
            } else {
              setShowLoginModal(true);
            }
          }}
        />
      ) : (
        <div className="flex h-screen overflow-hidden bg-slate-950">
          {/* Side navigation for Admin Console */}
          <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 font-sans h-full">
            {/* Logo area - fixed at top */}
            <div className="p-5 pb-2 shrink-0">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <JCLogo
                  type={siteSettings.logoType}
                  customLogoUrl={siteSettings.customLogoUrl}
                  logoText={siteSettings.logoText}
                  logoSubtext={siteSettings.logoSubtext}
                  showText={true}
                  logoScale={siteSettings.logoScale}
                  logoBg={siteSettings.logoBg}
                  className="w-11 h-11"
                />
              </div>
            </div>

            {/* Navigation items - scrollable container */}
            <div className="flex-1 overflow-y-auto px-5 py-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:bg-transparent">
              <nav className="space-y-1.5 text-xs">
                {user?.role === "engineer" && (
                  <>
                    <button
                      onClick={() => setAdminTab("dashboard")}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                        adminTab === "dashboard" ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Painel de Indicadores
                    </button>
                    <button
                      onClick={() => setAdminTab("crm")}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                        adminTab === "crm" ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      CRM - Funil Vendas
                    </button>
                    <button
                      onClick={() => setAdminTab("erp")}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                        adminTab === "erp" ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                      ERP - Gestão & OS
                    </button>
                    <button
                      onClick={() => setAdminTab("prospect")}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                        adminTab === "prospect" ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      <Compass className="w-4 h-4" />
                      Prospecção por IA
                    </button>
                    <button
                      onClick={() => setAdminTab("map")}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                        adminTab === "map" ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      <Map className="w-4 h-4" />
                      Mapa Inteligente
                    </button>
                  </>
                )}

                {/* Shared Blog Management - Accessible by both Engineer and Admin */}
                <button
                  onClick={() => setAdminTab("blog")}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    adminTab === "blog" ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Gerenciamento de Blog
                </button>

                {/* Shared Projects Gallery Editor */}
                <button
                  onClick={() => setAdminTab("projects")}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    adminTab === "projects" ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Galeria de Projetos
                </button>

                {/* Shared Settings & Logo - Accessible by both Engineer and Admin */}
                <button
                  onClick={() => setAdminTab("settings")}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    adminTab === "settings" ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40" : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Configurações Site & Logo
                </button>
              </nav>
            </div>

            {/* Bottom credentials / Back to Website button - fixed at bottom */}
            <div className="p-5 border-t border-slate-800 space-y-2 text-xs bg-slate-900 shrink-0">
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center gap-3">
                <ResilientImage
                  src={user?.role === "engineer" ? (siteSettings?.imgEngineer || "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80") : undefined}
                  fallbackSrc="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80"
                  fallbackType={user?.role === "engineer" ? "engineer" : "user"}
                  alt={user?.name || "Usuário"}
                  containerClassName="w-10 h-10 rounded-full shrink-0 overflow-hidden border border-slate-700 bg-slate-900"
                  className="w-full h-full object-cover"
                  iconSize="sm"
                  maxRetries={4}
                  baseDelayMs={1000}
                />
                <div className="overflow-hidden">
                  <p className="text-[10px] font-mono text-slate-500 uppercase truncate">Profissional Conectado</p>
                  <p className="font-bold text-white text-[11px] truncate mt-0.5">{user?.name || "Convidado"}</p>
                  {user?.crea && (
                    <p className="text-[9px] text-emerald-400 font-mono truncate">CREA: {user.crea}</p>
                  )}
                  {user?.role === "admin" && (
                    <p className="text-[9px] text-teal-400 font-mono truncate">ADMIN / DEVELOPER</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCurrentView("public")}
                  className="flex items-center justify-center gap-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl py-2 transition-colors font-semibold cursor-pointer"
                  title="Voltar ao Site"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1 bg-slate-950 hover:bg-red-950 border border-slate-800 text-slate-400 hover:text-red-300 hover:border-red-900 rounded-xl py-2 transition-all font-semibold cursor-pointer"
                >
                  Sair
                </button>
              </div>
            </div>
          </aside>

          {/* Admin Main workspace panels */}
          <main className="flex-grow overflow-y-auto bg-slate-950 p-8">
            {user?.role === "engineer" && (
              <>
                {adminTab === "dashboard" && (
                  <ErrorBoundary fallbackTitle="Erro ao carregar o Painel Geral (Dashboard)">
                    <AdminDashboard
                      leads={leads}
                      transactions={transactions}
                      serviceOrders={serviceOrders}
                      onSelectTab={(tab) => setAdminTab(tab as any)}
                    />
                  </ErrorBoundary>
                )}

                {adminTab === "crm" && (
                  <ErrorBoundary fallbackTitle="Erro ao carregar o CRM de Clientes">
                    <AdminCRM
                      leads={leads}
                      serviceOrders={serviceOrders}
                      onAddLead={handleAddLead}
                      onUpdateLead={handleUpdateLead}
                      onDeleteLead={handleDeleteLead}
                      onCreateOSFromLead={handleCreateOSFromLead}
                    />
                  </ErrorBoundary>
                )}

                {adminTab === "erp" && (
                  <ErrorBoundary fallbackTitle="Erro ao carregar o módulo Financeiro / ERP">
                    <AdminERP
                      transactions={transactions}
                      serviceOrders={serviceOrders}
                      onAddTransaction={handleAddTransaction}
                      onDeleteTransaction={handleDeleteTransaction}
                      onUpdateOS={handleUpdateOS}
                    />
                  </ErrorBoundary>
                )}

                {adminTab === "prospect" && (
                  <ErrorBoundary fallbackTitle="Erro ao carregar a Prospecção Inteligente IA">
                    <AdminProspect
                      onAddLead={handleAddLead}
                    />
                  </ErrorBoundary>
                )}

                {adminTab === "map" && (
                  <ErrorBoundary fallbackTitle="Erro ao carregar o Mapa Interativo de Obras">
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Map className="text-emerald-500 w-5 h-5" />
                          Mapa Inteligente de Projetos e Vistorias
                        </h2>
                        <p className="text-slate-400 text-xs">
                          Plotagem geográfica em tempo real das obras, laudos vigentes e propostas enviadas na região.
                        </p>
                      </div>
                      <InteractiveMap
                        leads={leads}
                        serviceOrders={serviceOrders}
                        onSelectLead={(lead) => {
                          setAdminTab("crm");
                        }}
                      />
                    </div>
                  </ErrorBoundary>
                )}
              </>
            )}

            {/* Shared Tabs (Blog and Settings) - Rendered for any authenticated user */}
            {adminTab === "blog" && (
              <ErrorBoundary fallbackTitle="Erro ao carregar o Gerenciador do Blog">
                <AdminBlog
                  blogPosts={blogPosts}
                  onRefreshBlog={fetchAllData}
                />
              </ErrorBoundary>
            )}

            {adminTab === "projects" && (
              <ErrorBoundary fallbackTitle="Erro ao carregar o Gerenciador da Galeria de Projetos">
                <AdminProjects />
              </ErrorBoundary>
            )}

            {adminTab === "settings" && (
              <ErrorBoundary fallbackTitle="Erro ao carregar as Configurações do Site e Logo">
                <AdminSettings
                  onSettingsSaved={handleRefreshSettings}
                  user={user}
                  onUserUpdate={(updatedUser) => {
                    setUser(updatedUser);
                    localStorage.setItem("jc_user", JSON.stringify(updatedUser));
                  }}
                />
              </ErrorBoundary>
            )}
          </main>
        </div>
      )}

      {/* SECURE POPUP LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D2B4D] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl font-sans text-slate-200">
            <button
              onClick={() => {
                setShowLoginModal(false);
                setIsRegisterMode(false);
                setLoginError("");
                setRegisterSuccess("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex w-12 h-12 bg-slate-900 border border-emerald-500 rounded-xl items-center justify-center font-bold text-xl text-white">
                J<span className="text-emerald-400">C</span>
              </div>
              <h3 className="text-lg font-display tracking-widest text-white uppercase mt-2">
                {isRegisterMode ? "Cadastrar Novo Usuário" : "Área Restrita JC EVOLUTION ENGENHARIA MECÂNICA"}
              </h3>
              <p className="text-xs text-slate-300">
                {isRegisterMode 
                  ? "Crie uma credencial personalizada para o dono ou administrador do site." 
                  : "Autenticação obrigatória para acessar as ferramentas de gestão e blog."}
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-900 rounded-xl text-red-200 text-xs text-center flex items-center gap-2 justify-center">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            {registerSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-900 rounded-xl text-emerald-200 text-xs text-center flex items-center gap-2 justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span>{registerSuccess}</span>
              </div>
            )}

            {!isRegisterMode ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Usuário ou E-mail</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Nome de usuário ou e-mail"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Senha Secreta</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md mt-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                  {loginLoading ? "Autenticando..." : "Entrar no Workspace"}
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setLoginError("");
                      setRegisterSuccess("");
                    }}
                    className="text-emerald-400 hover:text-emerald-300 underline transition-colors cursor-pointer"
                  >
                    Criar conta para o dono do site
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegister} className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ex: Eng. Josnei da Cunha"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Nome de Usuário</label>
                  <div className="relative">
                    <Terminal className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Ex: josnei"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="Ex: josnei.cunha@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Senha Secreta</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Perfil / Função</label>
                  <select
                    value={regRole}
                    onChange={(e: any) => setRegRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="engineer">Engenheiro (Dono) - Acesso CRM, ERP e Mapa</option>
                    <option value="admin">Administrador (Gestão de Blog / Posts)</option>
                  </select>
                </div>

                {regRole === "engineer" && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Registro CREA</label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={regCrea}
                        onChange={(e) => setRegCrea(e.target.value)}
                        placeholder="Ex: CREA/RN 2521304182"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md mt-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                  {loginLoading ? "Cadastrando..." : "Confirmar Cadastro"}
                </button>

                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(false);
                      setLoginError("");
                      setRegisterSuccess("");
                    }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Voltar para o Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
