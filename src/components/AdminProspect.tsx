import React, { useState } from "react";
import {
  Compass, Search, Sparkles, Building2, MapPin, Phone, Mail, FileText, Plus, Check, Map, ClipboardList,
  ChevronRight, ArrowRight, Loader2, Play, Users, Landmark, AlertCircle, MessageSquare, ExternalLink, Copy, X, Linkedin
} from "lucide-react";
import { Lead } from "../types";

interface AdminProspectProps {
  onAddLead: (leadData: Partial<Lead>) => void;
}

interface DecisionMaker {
  name: string;
  role: string;
  linkedin?: string;
}

interface ProspectResult {
  company: string;
  segment: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  potential: "Alto" | "Médio" | "Baixo";
  latOffset: number;
  lngOffset: number;
  requiredServices: string[];
  suggestedApproach: string;
  decisionMakers?: DecisionMaker[];
}

export default function AdminProspect({ onAddLead }: AdminProspectProps) {
  const [city, setCity] = useState("Aparecida do Taboado");
  const [state, setState] = useState("MS");
  const [neighborhood, setNeighborhood] = useState("");
  const [cep, setCep] = useState("79570-000");
  const [radius, setRadius] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const [prospects, setProspects] = useState<ProspectResult[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  // WhatsApp Outreach Generation States
  const [selectedProspect, setSelectedProspect] = useState<ProspectResult | null>(null);
  const [whatsappTemplates, setWhatsappTemplates] = useState<{ style: string; text: string }[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState(0);
  const [editedTemplateText, setEditedTemplateText] = useState("");
  const [copiedStatus, setCopiedStatus] = useState(false);

  const cleanPhoneForWhatsApp = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    return digits;
  };

  // Trigger Prospecção por IA
  const handleProspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProspects([]);
    setAddedIds([]);

    try {
      const response = await fetch("/api/prospect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, state, neighborhood, cep, radius })
      });

      if (!response.ok) throw new Error("Erro na prospecção B2B.");
      const data = await response.json();
      setProspects(data.prospects || []);
    } catch (err: any) {
      alert("Erro ao executar prospecção com IA: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Open WhatsApp Outreach Variations Tab/Modal
  const handleOpenWhatsAppTemplates = async (prospect: ProspectResult) => {
    setSelectedProspect(prospect);
    setIsLoadingTemplates(true);
    setWhatsappTemplates([]);
    setActiveTemplateTab(0);
    setEditedTemplateText("");
    setCopiedStatus(false);

    try {
      const contactName = prospect.contactPerson.split(" (")[0] || prospect.contactPerson;
      const response = await fetch("/api/crm/generate-whatsapp-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: contactName,
          leadCompany: prospect.company,
          leadService: prospect.requiredServices[0] || "NR-12",
          leadSector: prospect.segment
        })
      });

      if (!response.ok) throw new Error("Erro ao gerar abordagens variadas.");
      const data = await response.json();
      const loadedTemplates = data.templates || [];
      setWhatsappTemplates(loadedTemplates);
      if (loadedTemplates.length > 0) {
        setEditedTemplateText(loadedTemplates[0].text);
      }
    } catch (err: any) {
      console.warn("Error calling WhatsApp variations API, setting fallbacks:", err);
      const contactName = prospect.contactPerson.split(" (")[0] || prospect.contactPerson;
      const service = prospect.requiredServices[0] || "Inspeções e Engenharia NR-12/NR-13";
      
      const offlineTemplates = [
        {
          style: "Direta e Comercial",
          text: `Olá, ${contactName}! Tudo bem?\n\nAqui é o Engenheiro Mecânico Josnei da Cunha, proprietário da JC EVOLUTION ENGENHARIA MECÂNICA de Aparecida do Taboado - MS.\n\nEstou entrando em contato com você hoje pois vi que a ${prospect.company} possui demanda potencial para regularizações e laudos em ${service}.\n\nNosso escritório realiza vistorias técnicas completas com emissão rápida de laudos e recolhimento de ART junto ao CREA, permitindo que sua empresa opere com plena segurança jurídica e técnica.\n\nPodemos agendar uma breve conversa técnica nesta semana para analisarmos suas necessidades e fecharmos uma proposta ideal?\n\nEng. Josnei da Cunha | JC EVOLUTION ENGENHARIA MECÂNICA\nWhatsApp/Fone: (49) 99832-5358\nE-mail: josnei.cunha@gmail.com`
        },
        {
          style: "Consultiva e Técnica",
          text: `Olá, ${contactName}! Como vai?\n\nAqui é o Engenheiro Josnei da Cunha. Sou proprietário da JC EVOLUTION ENGENHARIA MECÂNICA de Aparecida do Taboado - MS.\n\nTenho acompanhado as operações do seu setor e gostaria de oferecer um diagnóstico prévio gratuito de 15 minutos para avaliar a conformidade técnica dos seus equipamentos de ${service}.\n\nA ideia é fazermos um bate-papo rápido e produtivo, onde posso apontar melhorias práticas e preventivas que elevam a confiabilidade da sua linha de produção sem comprometer sua rotina de trabalho.\n\nQual o melhor dia para conversarmos rapidamente no WhatsApp ou agendarmos uma visita de cortesia?\n\nEng. Josnei da Cunha | JC EVOLUTION ENGENHARIA MECÂNICA\nWhatsApp/Fone: (49) 99832-5358\nE-mail: josnei.cunha@gmail.com`
        },
        {
          style: "Foco em Segurança e Riscos",
          text: `Olá, ${contactName}! Tudo bem? Espero que sim.\n\nAqui é o Engenheiro Josnei da Cunha, da JC EVOLUTION ENGENHARIA MECÂNICA.\n\nEstou lhe contatando para conversarmos sobre a conformidade técnica em normas de segurança mecânica para ${service}.\n\nSabemos que a ausência de laudos atualizados de conformidade técnica (como NR-12 e NR-13) gera graves riscos de acidentes de trabalho, além de expor a empresa a autos de infração severos do Ministério do Trabalho e interdição do maquinário.\n\nNosso papel é resguardar sua responsabilidade civil e criminal, certificando toda a sua infraestrutura com ART profissional. Vamos marcar uma vistoria técnica de prevenção preventiva nesta semana?\n\nEng. Josnei da Cunha | JC EVOLUTION ENGENHARIA MECÂNICA\nWhatsApp/Fone: (49) 99832-5358\nE-mail: josnei.cunha@gmail.com`
        }
      ];
      setWhatsappTemplates(offlineTemplates);
      setEditedTemplateText(offlineTemplates[0].text);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTabChange = (index: number) => {
    setActiveTemplateTab(index);
    if (whatsappTemplates[index]) {
      setEditedTemplateText(whatsappTemplates[index].text);
    }
    setCopiedStatus(false);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(editedTemplateText);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  // Add Prospect to CRM as a Lead
  const handleAddProspectToCRM = (prospect: ProspectResult, idx: number) => {
    onAddLead({
      name: prospect.contactPerson,
      company: prospect.company,
      phone: prospect.phone,
      email: prospect.email,
      address: prospect.address,
      service: prospect.requiredServices[0] || "NR-12 – Segurança em Máquinas",
      value: prospect.potential === "Alto" ? 7500.00 : 3800.00,
      status: "Lead",
      outreachScript: prospect.suggestedApproach,
      latOffset: prospect.latOffset,
      lngOffset: prospect.lngOffset,
    });

    setAddedIds((prev) => [...prev, `prospect-${idx}`]);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Compass className="text-emerald-500 w-5 h-5 animate-spin-slow" />
          Prospecção Inteligente B2B por IA
        </h2>
        <p className="text-slate-400 text-xs">
          Selecione a região e utilize nossa IA para varrer o mercado comercial e industrial, identificando oportunidades qualificadas de laudos mecânicos e decisores no LinkedIn.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Selection panel */}
        <form onSubmit={handleProspectSubmit} className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Filtros de Região (Estilo FB)</span>
            <span className="bg-emerald-950 text-emerald-400 font-mono text-[9px] px-2 py-0.5 rounded border border-emerald-900 font-bold">
              Modo Multi-Cidades
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="text-slate-400 block font-medium">Cidade Central *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-8 pr-3 text-white focus:outline-none focus:border-emerald-500 font-bold"
                    placeholder="Cidade"
                    required
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Estado *</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 font-bold uppercase text-center"
                  placeholder="UF"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 block font-medium">Bairro / Zona Industrial</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Distrito Industrial"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 block font-medium">CEP aproximado</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="79570-000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Facebook Marketplace Styled Radius Selector */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Raio Circunvizinho</span>
                <span className="text-emerald-400 font-bold font-mono bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-900/60">
                  {radius} km
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>5 km</span>
                <span>50 km</span>
                <span>100 km</span>
                <span>200 km</span>
              </div>

              {/* Surrounding towns dynamically displayed based on selected radius */}
              <div className="pt-2 border-t border-slate-850 mt-1.5 space-y-1.5">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Cidades incluídas no raio:</span>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-slate-900 text-[10px] text-white px-2 py-0.5 rounded border border-slate-800 font-medium">
                    {city}
                  </span>
                  {parseInt(radius) >= 20 && (
                    <>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Santa Fé do Sul
                      </span>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Selvíria
                      </span>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Rubinéia
                      </span>
                    </>
                  )}
                  {parseInt(radius) >= 50 && (
                    <>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Paranaíba
                      </span>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Ilha Solteira
                      </span>
                    </>
                  )}
                  {parseInt(radius) >= 100 && (
                    <>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Jales
                      </span>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Três Lagoas
                      </span>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Andradina
                      </span>
                    </>
                  )}
                  {parseInt(radius) >= 150 && (
                    <>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Fernandópolis
                      </span>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Cassilândia
                      </span>
                    </>
                  )}
                  {parseInt(radius) >= 200 && (
                    <>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Votuporanga
                      </span>
                      <span className="bg-slate-900 text-[10px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950">
                        Araçatuba
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-1.5 mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                IA Mapeando Região...
              </>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5 text-yellow-300" />
                Iniciar Prospecção por IA
              </>
            )}
          </button>
        </form>

        {/* Results layout */}
        <div className="lg:col-span-8 space-y-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Oportunidades de Mercado Qualificadas ({prospects.length})</span>

          {isLoading && (
            <div className="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/20 space-y-4 flex flex-col items-center justify-center min-h-[350px]">
              <Compass className="w-12 h-12 text-emerald-500 animate-spin" />
              <div className="space-y-1.5 max-w-sm">
                <h4 className="font-bold text-white text-sm">Escaneando base de dados pública...</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  A assistente virtual NORA está cruzando endereços industriais, CNPJs ativos de cooperativas, silos e laticínios registrados na microrregião de {city} para mapear obrigatoriedades técnicas e capturar contatos do LinkedIn.
                </p>
              </div>
            </div>
          )}

          {!isLoading && prospects.length === 0 && (
            <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/10 flex flex-col items-center justify-center min-h-[350px] space-y-3">
              <Building2 className="w-10 h-10 text-slate-700 animate-pulse" />
              <div className="space-y-1 max-w-sm">
                <h4 className="font-bold text-slate-400 text-sm">Nenhum scan ativo</h4>
                <p className="text-slate-500 text-xs">
                  Preencha os filtros ao lado e clique em "Iniciar Prospecção por IA" para mapear oportunidades comerciais na região de Aparecida do Taboado.
                </p>
              </div>
            </div>
          )}

          {!isLoading && prospects.length > 0 && (
            <div className="space-y-4">
              {prospects.map((p, idx) => {
                const isAdded = addedIds.includes(`prospect-${idx}`);

                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-md flex flex-col md:flex-row justify-between gap-6 hover:border-emerald-500/30 transition-all group">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-bold text-white text-sm md:text-base flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          {p.company}
                        </h3>
                        <span className="bg-slate-800 text-[9px] text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-mono">
                          {p.segment}
                        </span>
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${
                          p.potential === "Alto" ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-blue-950 text-blue-400 border-blue-900"
                        }`}>
                          Potencial: {p.potential}
                        </span>
                      </div>

                      {/* Info lines */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-300 border-b border-slate-850 pb-3">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{p.address}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{p.phone} (Resp: {p.contactPerson})</span>
                        </p>
                      </div>

                      {/* Required services tags */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Obrigatoriedades Técnicas Identificadas</span>
                        <div className="flex flex-wrap gap-1.5">
                          {p.requiredServices.map((srv, sIdx) => (
                            <span key={sIdx} className="bg-slate-950 text-[10px] text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md">
                              {srv}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* KEY DECISION MAKERS / LINKEDIN PROFILES */}
                      {p.decisionMakers && p.decisionMakers.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-slate-850">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 font-mono uppercase">
                            <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            Decisor Chave Identificado por IA
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {p.decisionMakers.map((dm, dmIdx) => (
                              <div key={dmIdx} className="bg-gradient-to-br from-slate-950 to-slate-900 p-4 rounded-xl border border-slate-800/80 shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-4 group/dm">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-950/50 border border-blue-900/40 flex items-center justify-center text-blue-400 shrink-0 font-bold text-xs uppercase shadow-sm">
                                    {dm.name.substring(0, 2)}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-white group-hover/dm:text-blue-400 transition-colors">{dm.name}</p>
                                    <p className="text-[11px] text-slate-400 font-medium">{dm.role}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                                  {dm.linkedin && (
                                    <span className="text-[9px] font-mono text-slate-500 max-w-[180px] truncate sm:text-right block">
                                      {dm.linkedin.replace("https://", "")}
                                    </span>
                                  )}
                                  <a
                                    href={dm.linkedin || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(dm.name + " " + p.company)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all shadow-md shadow-blue-950/50"
                                  >
                                    <Linkedin className="w-3 h-3 text-white fill-white" />
                                    <span>Conectar no LinkedIn</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom Suggested outreach approach */}
                      <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 font-mono uppercase">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          Roteiro Prévio de Abordagem
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic">
                          {p.suggestedApproach}
                        </p>
                      </div>
                    </div>

                    {/* Right Action column */}
                    <div className="flex flex-col justify-between items-end md:w-48 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 space-y-4">
                      <div className="text-right space-y-1 w-full">
                        <p className="text-[10px] font-mono text-slate-500 uppercase">Estimativa Proposta</p>
                        <p className="font-mono font-bold text-white text-base">
                          R$ {p.potential === "Alto" ? "7.500,00" : "3.800,00"}
                        </p>
                      </div>

                      <div className="space-y-2 w-full">
                        <button
                          onClick={() => handleAddProspectToCRM(p, idx)}
                          disabled={isAdded}
                          className={`w-full font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                            isAdded
                              ? "bg-[#0e2d1d] text-emerald-400 border border-emerald-950 cursor-default"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-950"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              Adicionado ao CRM!
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Qualificar & Importar
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenWhatsAppTemplates(p)}
                          className="w-full font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          Gerar Abordagens WA
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* WHATSAPP VARIATIONS / OUTREACH TEMPLATES TAB OVERLAY MODAL */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Gerador de Mensagem WhatsApp</span>
                <h3 className="font-bold text-white text-base flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  {selectedProspect.company}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProspect(null)}
                className="text-slate-400 hover:text-white bg-slate-950/60 p-2 rounded-xl border border-slate-850 hover:border-slate-750 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {isLoadingTemplates ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-slate-400 font-medium">O Engenheiro Josnei está formulando 3 abordagens personalizadas com a IA...</p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Contato Destino</span>
                    <p className="text-white font-bold text-sm">
                      {selectedProspect.contactPerson} ({selectedProspect.phone})
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Serviço Foco: <span className="text-emerald-400 font-bold">{selectedProspect.requiredServices[0] || "Engenharia Mecânica"}</span>
                    </p>
                  </div>

                  {/* Tabs to select style */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Abas de Abordagem para o Josnei Escolher:</span>
                    <div className="grid grid-cols-3 bg-slate-950 p-1.5 rounded-xl border border-slate-850 gap-1">
                      {whatsappTemplates.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTabChange(idx)}
                          className={`py-2 px-2 text-[10px] font-bold rounded-lg transition-all text-center leading-tight ${
                            activeTemplateTab === idx
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                              : "text-slate-400 hover:text-white hover:bg-slate-900"
                          }`}
                        >
                          {t.style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text preview with inline edit box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Mensagem Final Pronta para Copiar (Como Engenheiro Josnei)</span>
                      <span className="text-[9px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850 font-bold font-mono">
                        Edição Livre Permitida
                      </span>
                    </div>

                    <textarea
                      value={editedTemplateText}
                      onChange={(e) => setEditedTemplateText(e.target.value)}
                      className="w-full h-56 bg-slate-950 border border-slate-850 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed font-sans resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer buttons */}
            {!isLoadingTemplates && (
              <div className="p-5 border-t border-slate-850 bg-slate-950/40 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCopyText}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs py-3 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  {copiedStatus ? (
                    <>
                      <Check className="w-4.5 h-4.5 text-emerald-400" />
                      Copiado com Sucesso!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      Copiar Abordagem
                    </>
                  )}
                </button>

                <a
                  href={`https://wa.me/${cleanPhoneForWhatsApp(selectedProspect.phone)}?text=${encodeURIComponent(editedTemplateText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-2 text-center"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  Abrir WhatsApp Agora
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
