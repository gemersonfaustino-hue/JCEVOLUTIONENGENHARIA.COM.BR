import React, { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, Phone, Mail, FileText, MapPin, Check, Image, Sparkles, Upload, Trash2, AlertCircle, Lock, Users, UserPlus, PlusCircle, Building2 } from "lucide-react";
import { SiteSettings } from "../types";
import JCLogo from "./JCLogo";
import { compressImage } from "../lib/imageCompressor";
import { useToast } from "./Toast";

interface AdminSettingsProps {
  onSettingsSaved: () => void;
  user: { id: string; name: string; role: "engineer" | "admin"; email: string } | null;
  onUserUpdate: (updatedUser: any) => void;
}

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

export default function AdminSettings({ onSettingsSaved, user, onUserUpdate }: AdminSettingsProps) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>({
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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiCurating, setIsAiCurating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [activeSolutionsTab, setActiveSolutionsTab] = useState<string>("ART");

  const handleUpdateLandingPageField = (field: string, value: any) => {
    const currentContent = settings.landingPagesContent || DEFAULT_LANDING_PAGES_CONTENT;
    const updatedContent = {
      ...currentContent,
      [activeSolutionsTab]: {
        ...currentContent[activeSolutionsTab],
        [field]: value
      }
    };
    setSettings({
      ...settings,
      landingPagesContent: updatedContent
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setUploadError("");

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "application/pdf"];
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const isPDF = fileType === "application/pdf" || fileName.endsWith(".pdf");
    const isImage = fileType.startsWith("image/") || fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".svg");

    if (!isPDF && !isImage) {
      setUploadError("Por favor, envie um arquivo válido (.jpg, .png, .svg ou .pdf)");
      return;
    }

    try {
      // Compress the custom logo to a maximum width/height of 500px, quality 0.8
      const base64 = await compressImage(file, 500, 0.8);
      setSettings({
        ...settings,
        customLogoUrl: base64
      });
    } catch (err) {
      console.error("Erro ao comprimir logo:", err);
      setUploadError("Erro ao processar e comprimir arquivo.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveCustomLogo = () => {
    setSettings({
      ...settings,
      customLogoUrl: ""
    });
  };

  const processImageFile = async (file: File, field: keyof SiteSettings) => {
    if (!file) return;
    const isEngineer = field === "imgEngineer";
    // We accept up to 10MB since we compress it down on the client-side
    const limit = 10 * 1024 * 1024; 
    if (file.size > limit) {
      alert("O arquivo de imagem é muito grande. O limite máximo para upload é de 10MB.");
      return;
    }

    try {
      // Compress the image down! 
      // Engineer photo can be up to 800px, others up to 600px. Quality 0.75 is perfect and super small.
      const maxDim = isEngineer ? 800 : 600;
      const base64 = await compressImage(file, maxDim, 0.75);
      
      setSettings(prev => ({
        ...prev,
        [field]: base64
      }));
    } catch (err) {
      console.error("Erro ao comprimir imagem:", err);
      alert("Erro ao processar e otimizar imagem.");
    }
  };

  // Credentials states
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState<"engineer" | "admin">("engineer");
  const [newCrea, setNewCrea] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [credentialSuccess, setCredentialSuccess] = useState("");
  const [credentialError, setCredentialError] = useState("");
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (user?.id) {
      fetchUserCredentials();
      if (user.role === "admin") {
        fetchAllUsers();
      }
    }
  }, [user?.id]);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/auth/users");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.users) {
          setAllUsers(data.users);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar lista de usuários:", err);
    }
  };

  const fetchUserCredentials = async () => {
    try {
      const response = await fetch(`/api/auth/user/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setSelectedUserId(data.user.id || "");
          setNewName(data.user.name || "");
          setNewUsername(data.user.username || "");
          setNewEmail(data.user.email || "");
          setNewRole(data.user.role || "engineer");
          setNewCrea(data.user.crea || "");
        }
      }
    } catch (err) {
      console.error("Erro ao buscar credenciais do usuário:", err);
    }
  };

  const handleSelectUser = (u: any) => {
    setSelectedUserId(u.id);
    setNewName(u.name || "");
    setNewUsername(u.username || "");
    setNewEmail(u.email || "");
    setNewRole(u.role || "engineer");
    setNewCrea(u.crea || "");
    setNewPassword("");
    setConfirmPassword("");
    setCredentialError("");
    setCredentialSuccess("");
  };

  const handleStartNewUser = () => {
    setSelectedUserId("new");
    setNewName("");
    setNewUsername("");
    setNewEmail("");
    setNewRole("engineer");
    setNewCrea("");
    setNewPassword("");
    setConfirmPassword("");
    setCredentialError("");
    setCredentialSuccess("");
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialError("");
    setCredentialSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setCredentialError("As senhas não coincidem.");
      return;
    }

    if (selectedUserId === "new" && !newPassword) {
      setCredentialError("A senha é obrigatória para cadastrar um novo usuário.");
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setCredentialError("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    try {
      setIsUpdatingCredentials(true);
      
      if (selectedUserId === "new") {
        // Create new user
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newName,
            username: newUsername,
            email: newEmail,
            password: newPassword,
            role: newRole,
            crea: newRole === "engineer" ? newCrea : undefined
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCredentialSuccess("Novo proprietário cadastrado com sucesso!");
            if (user?.role === "admin") {
              fetchAllUsers();
            }
            if (data.user) {
              setSelectedUserId(data.user.id);
              setNewName(data.user.name || "");
              setNewUsername(data.user.username || "");
              setNewEmail(data.user.email || "");
              setNewRole(data.user.role || "engineer");
              setNewCrea(data.user.crea || "");
            }
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setCredentialSuccess(""), 4000);
          } else {
            setCredentialError(data.error || "Erro ao cadastrar.");
          }
        } else {
          const errorData = await response.json();
          setCredentialError(errorData.error || "Erro ao conectar com o servidor.");
        }
      } else {
        // Update existing user
        const response = await fetch("/api/auth/update-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUserId,
            newUsername,
            newEmail,
            newPassword,
            newName,
            newRole,
            newCrea
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCredentialSuccess(data.message || "Credenciais atualizadas com sucesso!");
            if (user?.role === "admin") {
              fetchAllUsers();
            }
            if (selectedUserId === user?.id) {
              onUserUpdate(data.user);
            }
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setCredentialSuccess(""), 4000);
          } else {
            setCredentialError(data.error || "Erro ao atualizar credenciais.");
          }
        } else {
          const errorData = await response.json();
          setCredentialError(errorData.error || "Erro ao conectar com o servidor.");
        }
      }
    } catch (err: any) {
      setCredentialError(err.message || "Erro de rede ao atualizar.");
    } finally {
      setIsUpdatingCredentials(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/site-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSaveSuccess(true);
        onSettingsSaved();
        showToast("Configurações do site salvas com sucesso!", "success");
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error("Erro de resposta do servidor ao salvar.");
      }
    } catch (err: any) {
      showToast("Erro ao salvar configurações: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm("Deseja redefinir as configurações e o logo para o padrão da JC Evolution Engenharia Mecânica?")) {
      setSettings({
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
        imgEngineer: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
        imgService1: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
        imgService2: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80",
        imgCardNr12: "https://images.unsplash.com/photo-1513828583848-7752706be29d?w=800&auto=format&fit=crop&q=80",
        imgCardNr13: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
        imgCardPontes: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80",
        imgCardLaudos: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
        imgCardEstruturas: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-sans notranslate" translate="no">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mr-2" />
        <span>Carregando configurações do site...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans notranslate" translate="no">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="text-emerald-500 w-5 h-5" />
          Configurações de Identidade do Site & Logo
        </h2>
        <p className="text-slate-400 text-xs">
          Gerencie o logo oficial, dados de contato e credenciais técnicas de engenharia da JC EVOLUTION ENGENHARIA MECÂNICA. Qualquer alteração aqui mudará o cabeçalho, rodapé e logo de todo o portal.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Form panel */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo style card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Opções de Logotipo
            </h3>

            <div className="grid sm:grid-cols-3 gap-4">
              <label className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                settings.logoType === "Flyer Gear"
                  ? "border-emerald-500 bg-emerald-950/20 text-white"
                  : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400"
              }`}>
                <input
                  type="radio"
                  name="logoType"
                  value="Flyer Gear"
                  checked={settings.logoType === "Flyer Gear"}
                  onChange={() => setSettings({ ...settings, logoType: "Flyer Gear" })}
                  className="sr-only"
                />
                <JCLogo type="Flyer Gear" className="w-12 h-12" />
                <span className="font-bold text-xs mt-3 block">Logo do Panfleto (Recomendado)</span>
                <span className="text-[10px] text-slate-500 mt-1">Estilo engrenagem do panfleto técnico</span>
              </label>

              <label className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                settings.logoType === "Standard Badge"
                  ? "border-emerald-500 bg-emerald-950/20 text-white"
                  : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400"
              }`}>
                <input
                  type="radio"
                  name="logoType"
                  value="Standard Badge"
                  checked={settings.logoType === "Standard Badge"}
                  onChange={() => setSettings({ ...settings, logoType: "Standard Badge" })}
                  className="sr-only"
                />
                <JCLogo type="Standard Badge" className="w-10 h-10" />
                <span className="font-bold text-xs mt-3 block">Badge Simples</span>
                <span className="text-[10px] text-slate-500 mt-1">Selo quadrado "JC" com listra verde</span>
              </label>

              <label className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                settings.logoType === "Custom Image"
                  ? "border-emerald-500 bg-emerald-950/20 text-white"
                  : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400"
              }`}>
                <input
                  type="radio"
                  name="logoType"
                  value="Custom Image"
                  checked={settings.logoType === "Custom Image"}
                  onChange={() => setSettings({ ...settings, logoType: "Custom Image" })}
                  className="sr-only"
                />
                <Image className="w-8 h-8 text-slate-400 mb-1" />
                <span className="font-bold text-xs mt-3 block">Imagem customizada</span>
                <span className="text-[10px] text-slate-500 mt-1">Use um endereço de imagem da internet</span>
              </label>
            </div>

            {settings.logoType === "Custom Image" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1.5">Logotipo Customizado (Upload de JPG, PNG ou PDF)</label>
                  
                  {settings.customLogoUrl ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 shrink-0 flex items-center justify-center">
                          {settings.customLogoUrl.startsWith("data:application/pdf") || settings.customLogoUrl.toLowerCase().endsWith(".pdf") ? (
                            <div className="flex flex-col items-center justify-center text-red-400 p-1 font-bold text-[9px] w-12 h-12">
                              <FileText className="w-6 h-6 text-red-500 mb-1" />
                              <span>PDF LOGO</span>
                            </div>
                          ) : (
                            <img
                              src={settings.customLogoUrl}
                              alt="Logo Preview"
                              className="w-12 h-12 object-contain rounded"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&auto=format&fit=crop&q=60";
                              }}
                            />
                          )}
                        </div>
                        <div className="text-left">
                          <span className="text-slate-200 font-semibold block">Logo selecionado com sucesso!</span>
                          <span className="text-slate-500 text-[10px] block font-mono">
                            {settings.customLogoUrl.startsWith("data:") 
                              ? "Arquivo local codificado" 
                              : "Endereço externo"}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleRemoveCustomLogo}
                        className="bg-red-950 hover:bg-red-900 text-red-400 border border-red-900/40 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover Logo
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                        dragActive
                          ? "border-emerald-500 bg-emerald-950/20 text-white"
                          : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400"
                      }`}
                      onClick={() => document.getElementById("logo-file-upload")?.click()}
                    >
                      <input
                        id="logo-file-upload"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Upload className={`w-8 h-8 mb-2 transition-transform ${dragActive ? "scale-110 text-emerald-400" : "text-slate-500"}`} />
                      <p className="font-bold text-xs text-slate-300">Arraste seu logotipo ou clique para buscar</p>
                      <p className="text-[10px] text-slate-500 mt-1">Formatos suportados: JPG, PNG ou PDF (Máx. 5MB)</p>
                    </div>
                  )}

                  {uploadError && (
                    <div className="bg-red-950/40 border border-red-800 text-red-400 text-[11px] rounded-lg p-2.5 mt-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-850/60 pt-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1.5">Ou use uma URL da internet</span>
                  <input
                    type="url"
                    value={settings.customLogoUrl || ""}
                    onChange={(e) => setSettings({ ...settings, customLogoUrl: e.target.value })}
                    placeholder="https://suaempresa.com.br/logo.png"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-850/60 pt-4 mt-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1.5">Ajuste de Escala (Tamanho da Foto): {settings.logoScale || 100}%</label>
                    <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-500 font-mono">Min</span>
                      <input
                        type="range"
                        min="40"
                        max="200"
                        step="5"
                        value={settings.logoScale || 100}
                        onChange={(e) => setSettings({ ...settings, logoScale: Number(e.target.value) })}
                        className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">Max</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1.5">Cor de Fundo da Foto na Fachada</label>
                    <select
                      value={settings.logoBg || "white"}
                      onChange={(e) => setSettings({ ...settings, logoBg: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    >
                      <option value="white">Fundo Branco (Recomendado para Cabeçalho)</option>
                      <option value="transparent">Fundo Transparente (Sem Fundo)</option>
                      <option value="dark">Fundo Azul Escuro (Original)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium block">Nome Principal da Marca</label>
                <input
                  type="text"
                  value={settings.logoText || ""}
                  onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 font-bold uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium block">Subtítulo / Especialidade</label>
                <input
                  type="text"
                  value={settings.logoSubtext || ""}
                  onChange={(e) => setSettings({ ...settings, logoSubtext: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 font-bold uppercase"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-400 font-medium block">Slogan da Empresa (Exibido no site)</label>
              <input
                type="text"
                value={settings.logoSlogan || ""}
                onChange={(e) => setSettings({ ...settings, logoSlogan: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Contact Details & Technical credentials card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              Dados do Engenheiro & Contato B2B
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Telefone / WhatsApp Comercial
                </label>
                <input
                  type="text"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium block flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  E-mail Oficial
                </label>
                <input
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium block flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Registro Profissional CREA
                  </label>
                  <input
                    type="text"
                    value={settings.crea || ""}
                    onChange={(e) => setSettings({ ...settings, crea: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium block flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    CNPJ da Empresa
                  </label>
                  <input
                    type="text"
                    value={settings.cnpj || ""}
                    onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Ex: 53.111.432/0001-36"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5 text-xs">
                  <label className="text-slate-400 font-medium block flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Cidade Sede
                  </label>
                  <input
                    type="text"
                    value={settings.city || ""}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-400 font-medium block">UF</label>
                  <input
                    type="text"
                    value={settings.state || ""}
                    onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 font-bold uppercase text-center"
                    maxLength={2}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Site Images Management Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-400" />
              Gerenciamento de Imagens do Website
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Personalize as fotos do seu portal. Você pode redefinir todas em lote de forma inteligente com IA usando palavras-chave industriais, escolher visuais pré-selecionados de nossa galeria de engenharia ou enviar fotos locais.
            </p>

            {/* Batch / Bulk Controls with AI */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3.5">
              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Curadoria Inteligente por IA (Lote)
              </h4>
              <p className="text-[11px] text-slate-400">
                Digite um tema de engenharia (ex: <code className="text-emerald-400 font-mono">soldagem</code>, <code className="text-emerald-400 font-mono">metalurgia</code>, <code className="text-emerald-400 font-mono">caldeiras</code>, <code className="text-emerald-400 font-mono">fábrica</code>) para que a Inteligência Artificial selecione instantaneamente as 8 melhores imagens do nosso catálogo de fotos profissionais:
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Ex: metalurgia, caldeiras, tornearia, estruturas"
                  id="bulk-image-keyword"
                  className="flex-grow bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  disabled={isAiCurating}
                  onClick={async () => {
                    const input = document.getElementById("bulk-image-keyword") as HTMLInputElement;
                    const kw = input?.value.trim() || "";
                    if (!kw) {
                      alert("Por favor, digite um tema ou palavra-chave para curadoria por IA.");
                      return;
                    }
                    if (confirm(`Deseja rodar a IA para selecionar as 8 imagens do site para o tema "${kw}"?`)) {
                      setIsAiCurating(true);
                      try {
                        const response = await fetch("/api/site-settings/ai-suggest-images", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ themeDescription: kw })
                        });
                        const data = await response.json();
                        if (response.ok && data.success && data.images) {
                          setSettings(prev => ({
                            ...prev,
                            ...data.images
                          }));
                          alert(`Sucesso! A IA selecionou 8 imagens profissionais de engenharia correspondentes ao tema "${kw}". Salve as alterações ao final!`);
                        } else {
                          alert(data.error || "Erro ao realizar curadoria visual.");
                        }
                      } catch (err: any) {
                        alert("Erro de rede ao conectar com a IA: " + err.message);
                      } finally {
                        setIsAiCurating(false);
                      }
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isAiCurating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processando IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Aplicar com IA (Lote)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[9px] text-slate-500 uppercase font-mono py-1">Exemplos Rápidos de IA:</span>
                {["metalurgia", "caldeiras", "soldagem", "estruturas", "torno"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={isAiCurating}
                    onClick={async () => {
                      const input = document.getElementById("bulk-image-keyword") as HTMLInputElement;
                      if (input) input.value = t;
                      setIsAiCurating(true);
                      try {
                        const response = await fetch("/api/site-settings/ai-suggest-images", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ themeDescription: t })
                        });
                        const data = await response.json();
                        if (response.ok && data.success && data.images) {
                          setSettings(prev => ({
                            ...prev,
                            ...data.images
                          }));
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsAiCurating(false);
                      }
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] px-2 py-0.5 rounded border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Controls */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-emerald-400" />
                Ajustar Uma a Uma (Galeria de Sugestões, Link ou Arquivo)
              </h4>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: "imgEngineer", label: "Imagem do Engenheiro (Hero)", default: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80", size: "800x600", suggestions: [
                    "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&auto=format&fit=crop&q=80"
                  ]},
                  { key: "imgService1", label: "Serviço 1: NR-13 Vasos e Caldeiras", default: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80", size: "800x600", suggestions: [
                    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1608930264188-755c3c0ef2d6?w=800&auto=format&fit=crop&q=80"
                  ]},
                  { key: "imgService2", label: "Serviço 2: NR-12 Máquinas", default: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80", size: "800x600", suggestions: [
                    "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1513828583848-7752706be29d?w=800&auto=format&fit=crop&q=80"
                  ]},
                  { key: "imgCardNr12", label: "Card Escopo: NR-12 Máquinas", default: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80", size: "300x200", suggestions: [
                    "https://images.unsplash.com/photo-1537462715879-360eeb61a0bc?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1513828583848-7752706be29d?w=800&auto=format&fit=crop&q=80"
                  ]},
                  { key: "imgCardNr13", label: "Card Escopo: NR-13 Vasos/Caldeiras", default: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80", size: "300x200", suggestions: [
                    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"
                  ]},
                  { key: "imgCardPontes", label: "Card Escopo: Pontes Rolantes", default: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=300&auto=format&fit=crop&q=80", size: "300x200", suggestions: [
                    "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=800&auto=format&fit=crop&q=80"
                  ]},
                  { key: "imgCardLaudos", label: "Card Escopo: Laudos com ART", default: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&auto=format&fit=crop&q=80", size: "300x200", suggestions: [
                    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80"
                  ]},
                  { key: "imgCardEstruturas", label: "Card Escopo: E. Metálicas", default: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=80", size: "300x200", suggestions: [
                    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1604174139037-3f43b710f2df?w=800&auto=format&fit=crop&q=80"
                  ]},
                ].map((img) => {
                  const currentValue = (settings as any)[img.key] || img.default;
                  const isCustom = !!(settings as any)[img.key] && (settings as any)[img.key] !== img.default;
                  return (
                    <div key={img.key} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-200 text-xs block truncate">{img.label}</span>
                          <span className="text-[9px] text-slate-500 font-mono shrink-0">{img.size}</span>
                        </div>
                        
                        {/* Preview */}
                        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                          <img
                            src={currentValue}
                            alt={img.label}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = img.default;
                            }}
                          />
                          {isCustom && (
                            <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-md font-bold shadow">
                              Personalizada
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Curated Recommendations Gallery Selection Row */}
                      <div className="space-y-1.5 text-left">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Selecione da Galeria de Engenharia:</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {img.suggestions.map((sugUrl, sIdx) => {
                            const isSelected = currentValue === sugUrl;
                            return (
                              <button
                                key={sIdx}
                                type="button"
                                title="Aplicar esta foto profissional da galeria"
                                onClick={() => {
                                  setSettings({
                                    ...settings,
                                    [img.key]: sugUrl
                                  });
                                }}
                                className={`relative aspect-video rounded overflow-hidden border transition-all ${
                                  isSelected 
                                    ? "border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.03]" 
                                    : "border-slate-800 hover:border-slate-500 grayscale-[40%] hover:grayscale-0"
                                }`}
                              >
                                <img
                                  src={sugUrl}
                                  alt="sugestão"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2 text-left pt-1">
                        {/* File Upload button & URL input */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => document.getElementById(`upload-input-${img.key}`)?.click()}
                            className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer w-1/2 justify-center"
                          >
                            <Upload className="w-3 h-3 text-emerald-400" />
                            Enviar Foto
                          </button>
                          
                          <input
                            id={`upload-input-${img.key}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                processImageFile(e.target.files[0], img.key as keyof SiteSettings);
                              }
                            }}
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setSettings({
                                ...settings,
                                [img.key]: img.default
                              });
                            }}
                            disabled={!isCustom}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 w-1/2 justify-center border ${
                              isCustom
                                ? "bg-red-950/40 hover:bg-red-900/40 text-red-400 border-red-900/30 cursor-pointer"
                                : "bg-slate-900/10 text-slate-600 border-slate-900/20 cursor-not-allowed"
                            }`}
                          >
                            <Trash2 className="w-3 h-3" />
                            Padrão
                          </button>
                        </div>

                        {/* URL input for custom images */}
                        <div>
                          <input
                            type="url"
                            value={(settings as any)[img.key] || ""}
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                [img.key]: e.target.value
                              });
                            }}
                            placeholder="Ou cole o link da imagem (https://...)"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-[10px] text-white focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* GERENCIAMENTO DE LOGOS DOS PARCEIROS (EMPRESAS QUE CONFIAM) */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Logos das Empresas Parceiras ("Empresas que Confiam")
            </h3>
            <p className="text-slate-400 text-xs">
              Adicione as logos das empresas que confiam em seus serviços para exibir no site público. Você pode adicionar novas fotos (locais ou links da web) e remover as existentes.
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(settings.partnerLogos || []).map((logo, idx) => (
                <div key={logo.id || idx} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex flex-col justify-between space-y-2">
                  <div className="relative aspect-[3/1] bg-white rounded-lg p-2 flex items-center justify-center border border-slate-800">
                    <img
                      src={logo.url}
                      alt={logo.name}
                      className="max-h-12 max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedLogos = (settings.partnerLogos || []).filter((_, i) => i !== idx);
                        setSettings({
                          ...settings,
                          partnerLogos: updatedLogos
                        });
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 transition-all shadow cursor-pointer"
                      title="Excluir Logo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={logo.name}
                      onChange={(e) => {
                        const updatedLogos = [...(settings.partnerLogos || [])];
                        updatedLogos[idx] = { ...updatedLogos[idx], name: e.target.value };
                        setSettings({
                          ...settings,
                          partnerLogos: updatedLogos
                        });
                      }}
                      placeholder="Nome da Empresa"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                </div>
              ))}
              
              {/* Form to add a new Partner Logo */}
              <div className="border-2 border-dashed border-slate-800 bg-slate-950/40 hover:bg-slate-950 p-4 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="font-bold text-slate-300 text-xs block">+ Novo Parceiro</span>
                  
                  {/* File Upload / Link options */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      id="new-partner-name"
                      placeholder="Nome do cliente (ex: Videplast)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-[10px] text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <input
                      type="text"
                      id="new-partner-url"
                      placeholder="URL da foto/logo (https://...)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-[10px] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById("new-partner-file")?.click()}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 text-[10px] font-bold px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer justify-center w-full"
                    >
                      <Upload className="w-3 h-3 text-emerald-400" />
                      Upload Logo
                    </button>
                    <input
                      id="new-partner-file"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          try {
                            const file = e.target.files[0];
                            const base64 = await compressImage(file, 400, 0.75);
                            const urlInput = document.getElementById("new-partner-url") as HTMLInputElement;
                            if (urlInput) {
                              urlInput.value = base64;
                              // Force update or trigger check
                              const nameInput = document.getElementById("new-partner-name") as HTMLInputElement;
                              if (nameInput && !nameInput.value) {
                                // Strip extension for default name
                                nameInput.value = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
                              }
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Erro ao comprimir imagem.");
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nameInput = document.getElementById("new-partner-name") as HTMLInputElement;
                    const urlInput = document.getElementById("new-partner-url") as HTMLInputElement;
                    const name = nameInput?.value.trim() || "";
                    const url = urlInput?.value.trim() || "";
                    if (!name || !url) {
                      alert("Por favor, preencha o nome do parceiro e selecione/digite uma URL para a logo.");
                      return;
                    }
                    const newPartner = {
                      id: "partner-" + Date.now(),
                      name,
                      url
                    };
                    const updatedLogos = [...(settings.partnerLogos || []), newPartner];
                    setSettings({
                      ...settings,
                      partnerLogos: updatedLogos
                    });
                    
                    // Clear inputs
                    if (nameInput) nameInput.value = "";
                    if (urlInput) urlInput.value = "";
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer w-full"
                >
                  <PlusCircle className="w-3 h-3" />
                  Adicionar Cliente
                </button>
              </div>
            </div>
            
            {(!settings.partnerLogos || settings.partnerLogos.length === 0) && (
              <p className="text-xs text-slate-400 italic bg-slate-950/30 p-4 rounded-xl border border-dashed border-slate-850 text-center">
                Nenhum parceiro customizado. O site continuará exibindo as 6 marcas padrão (Videplast, Prevemax, etc.) até que você adicione as suas próprias aqui.
              </p>
            )}
          </div>

          {/* EDIT SOLUTIONS/LANDING PAGES SECTION */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Editar Páginas de Soluções (SEO / Landing Pages)
            </h3>
            <p className="text-slate-400 text-xs">
              Personalize os textos, chamadas e entregáveis específicos de cada um dos seus serviços mecânicos exibidos no site.
            </p>

            {/* Solutions Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-850">
              {Object.keys(DEFAULT_LANDING_PAGES_CONTENT).map((tab) => {
                const isSelected = activeSolutionsTab === tab;
                const pageData = (settings.landingPagesContent || DEFAULT_LANDING_PAGES_CONTENT)[tab] || DEFAULT_LANDING_PAGES_CONTENT[tab];
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveSolutionsTab(tab)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Solution Editor Form */}
            {(() => {
              const currentLandingPage = (settings.landingPagesContent || DEFAULT_LANDING_PAGES_CONTENT)[activeSolutionsTab] || DEFAULT_LANDING_PAGES_CONTENT[activeSolutionsTab];
              return (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium block text-xs">Título da Página</label>
                    <input
                      type="text"
                      value={currentLandingPage.title || ""}
                      onChange={(e) => handleUpdateLandingPageField("title", e.target.value)}
                      placeholder="Título principal da página"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium block text-xs">Subtítulo / Chamada</label>
                    <input
                      type="text"
                      value={currentLandingPage.subtitle || ""}
                      onChange={(e) => handleUpdateLandingPageField("subtitle", e.target.value)}
                      placeholder="Uma frase curta de chamada"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium block text-xs">Descrição Detalhada</label>
                    <textarea
                      rows={3}
                      value={currentLandingPage.description || ""}
                      onChange={(e) => handleUpdateLandingPageField("description", e.target.value)}
                      placeholder="Descreva o serviço com foco técnico e apelo profissional..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                    />
                  </div>

                  {/* Service Items List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-400 font-medium block text-xs">Itens e Serviços Inclusos</label>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedItems = [...(currentLandingPage.items || []), "Novo item de serviço"];
                          handleUpdateLandingPageField("items", updatedItems);
                        }}
                        className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3 h-3" />
                        + Adicionar Item
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {(currentLandingPage.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const updatedItems = [...currentLandingPage.items];
                              updatedItems[idx] = e.target.value;
                              handleUpdateLandingPageField("items", updatedItems);
                            }}
                            className="flex-grow bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-300 focus:outline-none focus:border-emerald-500 text-xs font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updatedItems = currentLandingPage.items.filter((_, i) => i !== idx);
                              handleUpdateLandingPageField("items", updatedItems);
                            }}
                            className="p-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 text-red-400 rounded-lg transition-all cursor-pointer"
                            title="Excluir item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {(!currentLandingPage.items || currentLandingPage.items.length === 0) && (
                        <p className="text-[10px] text-slate-500 italic text-center py-2">
                          Nenhum item cadastrado. Adicione um acima.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all"
            >
              Resetar para Padrão JC
            </button>
 
            <button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/20"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Salvando configurações...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Dynamic Credentials Change Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 mt-6">
          {user?.role === "admin" && (
            <div className="space-y-2 pb-2 border-b border-slate-800/60">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Selecione o Usuário para Alterar ou Cadastrar
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {allUsers.map((u) => {
                  const isSelected = selectedUserId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 font-semibold shadow-sm shadow-emerald-500/10"
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.role === "admin" ? "bg-amber-400" : "bg-emerald-400"}`} />
                      {u.name} ({u.username})
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleStartNewUser}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedUserId === "new"
                      ? "bg-emerald-600 border-emerald-500 text-white font-semibold"
                      : "bg-slate-950/40 border-dashed border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Novo Usuário
                </button>
              </div>
            </div>
          )}

          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            {selectedUserId === "new"
              ? "Cadastrar Novo Usuário / Dono do Site"
              : `Alterar Credenciais de Acesso: ${newName || newUsername}`}
          </h3>
          <p className="text-slate-400 text-xs">
            {selectedUserId === "new"
              ? "Crie uma nova credencial com permissões personalizadas para o painel de gerenciamento ou blog."
              : "Modifique as credenciais de acesso, e-mail de contato, registro CREA ou defina uma nova senha."}
          </p>

          <form onSubmit={handleUpdateCredentials} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium block">Nome Completo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Eng. Josnei da Cunha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium block">Nome de Usuário (Login)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: josnei"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium block">E-mail de Login</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Ex: josnei.cunha@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {user?.role === "admin" ? (
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium block">Perfil / Função</label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="engineer">Engenheiro (Dono) - CRM, ERP e Mapa</option>
                    <option value="admin">Administrador (Gestão de Blog / Posts)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium block">Perfil / Função</label>
                  <input
                    type="text"
                    value={newRole === "engineer" ? "Engenheiro (Dono)" : "Administrador / Dev"}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2.5 px-3 text-slate-500 font-medium cursor-not-allowed"
                    disabled
                  />
                </div>
              )}
            </div>

            {newRole === "engineer" && (
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium block">Registro Profissional CREA</label>
                <input
                  type="text"
                  value={newCrea}
                  onChange={(e) => setNewCrea(e.target.value)}
                  placeholder="Ex: CREA/RN 2521304182"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium block">
                  {selectedUserId === "new" ? "Senha Secreta" : "Nova Senha (opcional)"}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={selectedUserId === "new" ? "Mínimo 4 caracteres" : "Deixe em branco para manter a atual"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required={selectedUserId === "new"}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium block">Confirmar Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a senha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required={selectedUserId === "new" || !!newPassword}
                />
              </div>
            </div>

            {credentialError && (
              <div className="bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-lg p-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{credentialError}</span>
              </div>
            )}

            {credentialSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs rounded-lg p-2.5 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{credentialSuccess}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUpdatingCredentials}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer"
              >
                {isUpdatingCredentials ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{selectedUserId === "new" ? "Cadastrando..." : "Salvando..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{selectedUserId === "new" ? "Cadastrar Usuário" : "Salvar Alterações"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-4 space-y-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Pré-visualização do Layout</span>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logo no Cabeçalho</h4>
              <p className="text-[10px] text-slate-500">Como aparece no topo da página do site</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <JCLogo
                type={settings.logoType || "Flyer Gear"}
                customLogoUrl={settings.customLogoUrl || ""}
                logoText={settings.logoText || "JC EVOLUTION"}
                logoSubtext={settings.logoSubtext || "MECÂNICA"}
                showText={true}
                isDarkText={true}
                logoScale={settings.logoScale}
                logoBg={settings.logoBg}
                className="w-10 h-10"
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logo do Menu Lateral</h4>
              <p className="text-[10px] text-slate-500">Como aparece no seu painel interno CRM/ERP</p>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <JCLogo
                  type={settings.logoType || "Flyer Gear"}
                  customLogoUrl={settings.customLogoUrl || ""}
                  logoText={settings.logoText || "JC EVOLUTION"}
                  logoSubtext={settings.logoSubtext || "MECÂNICA"}
                  showText={false}
                  logoScale={settings.logoScale}
                  logoBg={settings.logoBg}
                  className="w-8 h-8"
                />
                <div>
                  <h1 className="text-xs font-bold uppercase tracking-wider text-white">
                    <span>{(settings.logoText || "JC EVOLUTION").split(" ")[0]} {(settings.logoText || "JC EVOLUTION").split(" ")[1] || ""}</span>
                  </h1>
                  <p className="text-[9px] text-slate-400 font-mono">Painel do Engenheiro</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Slogan & Assinatura do Site</h4>
              <p className="text-[10px] text-slate-500">Exibido nas páginas internas e laudos técnicos</p>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-mono">Slogan Principal:</span>
                <span className="font-medium text-slate-300 mt-0.5">{settings.logoSlogan || "Laudos, Inspeções e Soluções em Engenharia Mecânica"}</span>
              </div>
              <div className="flex flex-col border-t border-slate-850 pt-2 mt-2">
                <span className="text-[10px] text-slate-500 font-mono">Rodapé de Contato:</span>
                <span className="text-slate-400 text-[10px] mt-0.5">
                  {settings.city || "Aparecida do Taboado"} - {settings.state || "MS"} • {settings.phone || "(49) 99832-5358"}
                </span>
                <span className="text-[9px] text-emerald-400 font-mono mt-0.5">
                  {settings.crea || "CREA/RN 2521304182"}
                  {settings.cnpj ? ` | CNPJ: ${settings.cnpj}` : " | CNPJ: 53.111.432/0001-36"}
                </span>
              </div>
            </div>
          </div>

          {saveSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs rounded-xl p-4 flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 shrink-0" />
              <span>Configurações salvas com sucesso! As alterações já estão ativas em todo o sistema.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
