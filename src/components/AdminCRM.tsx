import React, { useState } from "react";
import {
  Users, CheckCircle, ChevronRight, ArrowRight, ArrowLeft, Plus, Trash2, Edit2, FileText, Camera, Shield,
  Phone, Mail, MapPin, DollarSign, Sparkles, AlertCircle, RefreshCw, X, FilePlus, PlaySquare, Workflow,
  Copy, MessageSquare, History, Save, Check
} from "lucide-react";
import { Lead, ServiceOrder } from "../types";

interface AdminCRMProps {
  leads: Lead[];
  serviceOrders?: ServiceOrder[];
  onAddLead: (leadData: Partial<Lead>) => void;
  onUpdateLead: (id: string, updatedData: Partial<Lead>) => void;
  onDeleteLead: (id: string) => void;
  onCreateOSFromLead: (lead: Lead) => void;
}

export default function AdminCRM({ leads, serviceOrders = [], onAddLead, onUpdateLead, onDeleteLead, onCreateOSFromLead }: AdminCRMProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddingLead, setIsAddingLead] = useState<boolean>(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [newNote, setNewNote] = useState("");
  const [showProposal, setShowProposal] = useState(false);
  const [propValue, setPropValue] = useState<number>(0);
  const [propPayment, setPropPayment] = useState("50% de entrada + 50% na emissão do laudo e ART");
  const [propDeadline, setPropDeadline] = useState("10 dias úteis a partir da aprovação e vistoria");
  const [propValidity, setPropValidity] = useState("15 dias");

  // Edit Lead / Budget State
  const [isEditingLead, setIsEditingLead] = useState<boolean>(false);
  const [editLeadData, setEditLeadData] = useState<Partial<Lead>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedLead) {
      setPropValue(selectedLead.value);
      if (!isEditingLead) {
        setEditLeadData({
          company: selectedLead.company,
          name: selectedLead.name,
          phone: selectedLead.phone,
          email: selectedLead.email,
          service: selectedLead.service,
          value: selectedLead.value,
          status: selectedLead.status,
          address: selectedLead.address,
        });
      }
    }
  }, [selectedLead]);

  const handleStartEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditLeadData({
      company: lead.company,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      service: lead.service,
      value: lead.value,
      status: lead.status,
      address: lead.address,
    });
    setIsEditingLead(true);
  };

  const handleSaveEditLead = () => {
    if (!selectedLead) return;
    onUpdateLead(selectedLead.id, editLeadData);
    const updated = { ...selectedLead, ...editLeadData };
    setSelectedLead(updated as Lead);
    setIsEditingLead(false);
    if (editLeadData.value !== undefined) {
      setPropValue(Number(editLeadData.value) || 0);
    }
    setSaveSuccessMessage("Informações do orçamento atualizadas com sucesso!");
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleSaveProposalValue = () => {
    if (!selectedLead) return;
    const numValue = Number(propValue) || 0;
    onUpdateLead(selectedLead.id, { value: numValue });
    setSelectedLead({ ...selectedLead, value: numValue });
    setSaveSuccessMessage("Valor do orçamento atualizado no CRM com sucesso!");
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedLead) return;
    const dateStr = new Date().toLocaleDateString("pt-BR");
    const formattedNote = `[${dateStr}] ${newNote.trim()}`;
    const currentNotes = selectedLead.notes || [];
    const updatedNotes = [...currentNotes, formattedNote];
    
    onUpdateLead(selectedLead.id, { notes: updatedNotes });
    setSelectedLead({ ...selectedLead, notes: updatedNotes });
    setNewNote("");
  };

  // Formatting and Action Helpers
  const cleanPhoneForWhatsApp = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    return digits;
  };

  const handleCopyPitch = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // New Lead Form State
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadCompany, setNewLeadCompany] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadService, setNewLeadService] = useState("NR-12 – Segurança em Máquinas");
  const [newLeadValue, setNewLeadValue] = useState("");
  const [newLeadAddress, setNewLeadAddress] = useState("");

  // Funnel columns
  const funnelStages: Lead["status"][] = ["Lead", "Contato", "Orçamento", "Negociação", "Fechado", "Execução", "Concluído"];

  const getStageColor = (stage: Lead["status"]) => {
    switch (stage) {
      case "Lead": return "bg-slate-800 text-slate-300 border-slate-700";
      case "Contato": return "bg-blue-950 text-blue-300 border-blue-900";
      case "Orçamento": return "bg-amber-950 text-amber-300 border-amber-900";
      case "Negociação": return "bg-orange-950 text-orange-300 border-orange-900";
      case "Fechado": return "bg-violet-950 text-violet-300 border-violet-900";
      case "Execução": return "bg-cyan-950 text-cyan-300 border-cyan-900";
      case "Concluído": return "bg-emerald-950 text-emerald-300 border-emerald-900";
    }
  };

  // Handle move lead in funnel
  const handleMoveLead = (lead: Lead, direction: "forward" | "backward") => {
    const currentIndex = funnelStages.indexOf(lead.status);
    let nextIndex = currentIndex;
    if (direction === "forward" && currentIndex < funnelStages.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === "backward" && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex !== currentIndex) {
      onUpdateLead(lead.id, { status: funnelStages[nextIndex] });
      // Update selected lead details if open
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead({ ...selectedLead, status: funnelStages[nextIndex] });
      }
    }
  };

  // Handle Add Lead
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadCompany) return;

    onAddLead({
      name: newLeadName,
      company: newLeadCompany,
      phone: newLeadPhone,
      email: newLeadEmail,
      service: newLeadService,
      value: parseFloat(newLeadValue) || 0,
      address: newLeadAddress || "Aparecida do Taboado - MS",
      status: "Lead"
    });

    // Reset Form
    setNewLeadName("");
    setNewLeadCompany("");
    setNewLeadPhone("");
    setNewLeadEmail("");
    setNewLeadService("NR-12 – Segurança em Máquinas");
    setNewLeadValue("");
    setNewLeadAddress("");
    setIsAddingLead(false);
  };

  // Generate Outreach Script with Gemini API
  const handleGenerateOutreachScript = async (lead: Lead) => {
    setIsGeneratingScript(true);
    try {
      const response = await fetch("/api/crm/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: lead.name,
          leadCompany: lead.company,
          leadService: lead.service
        })
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      
      onUpdateLead(lead.id, { outreachScript: data.text });
      setSelectedLead({ ...lead, outreachScript: data.text });
    } catch (err) {
      alert("Erro ao conectar à IA para gerar abordagem comercial.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-emerald-500 w-5 h-5" />
            CRM - Pipeline de Vendas JC EVOLUTION ENGENHARIA MECÂNICA
          </h2>
          <p className="text-slate-400 text-xs">
            Acompanhe a atração, contato, orçamento e andamento dos contratos de engenharia mecânica.
          </p>
        </div>

        <button
          onClick={() => setIsAddingLead(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          Novo Lead / Orçamento
        </button>
      </div>

      {/* CRM Funnel Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 overflow-x-auto pb-4">
        {funnelStages.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.status === stage);
          const stageTotal = stageLeads.reduce((acc, lead) => acc + lead.value, 0);

          return (
            <div key={stage} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col min-w-[200px] h-[500px]">
              {/* Header column */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${getStageColor(stage)} uppercase`}>
                    {stage}
                  </span>
                  <span className="text-slate-500 text-xs font-semibold">{stageLeads.length}</span>
                </div>
                <p className="text-[10px] font-mono text-emerald-400">
                  R$ {stageTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
              </div>

              {/* Cards wrapper */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {stageLeads.length === 0 ? (
                  <div className="h-full border border-dashed border-slate-800/60 rounded-xl flex items-center justify-center p-4 text-center">
                    <span className="text-[10px] font-mono text-slate-600 uppercase">Sem leads</span>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all cursor-pointer shadow hover:shadow-lg relative group"
                    >
                      <h4 className="font-bold text-white text-xs truncate leading-tight">{lead.company}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{lead.name}</p>
                      <p className="text-[10px] text-emerald-500 font-mono mt-2 flex items-center justify-between">
                        <span>R$ {lead.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
                        <span className="text-[9px] text-slate-500">{lead.service.split(" – ")[0]}</span>
                      </p>

                      {/* Quick Move Funnel & Edit Buttons */}
                      <div className="flex items-center justify-between gap-1 mt-3 pt-2.5 border-t border-slate-850 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartEditLead(lead); }}
                          className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                          title="Editar Orçamento e Informações"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                          <span>Editar</span>
                        </button>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveLead(lead, "backward"); }}
                            className="w-5 h-5 bg-slate-850 hover:bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-slate-300 text-[10px]"
                            disabled={stage === "Lead"}
                            title="Mover para estágio anterior"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveLead(lead, "forward"); }}
                            className="w-5 h-5 bg-slate-850 hover:bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-slate-300 text-[10px]"
                            disabled={stage === "Concluído"}
                            title="Mover para próximo estágio"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Slide-over Modal */}
      {isAddingLead && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleFormSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Novo Lead / Simulação de Orçamento</h3>
              <button type="button" onClick={() => setIsAddingLead(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Nome do Cliente *</label>
                <input
                  type="text"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Empresa ou Condomínio *</label>
                <input
                  type="text"
                  value={newLeadCompany}
                  onChange={(e) => setNewLeadCompany(e.target.value)}
                  placeholder="Ex: Metalúrgica MS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Celular / WhatsApp</label>
                <input
                  type="text"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  placeholder="(67) 99999-9999"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">E-mail</label>
                <input
                  type="email"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-slate-400 block font-medium">Serviço Solicitado</label>
                <select
                  value={newLeadService}
                  onChange={(e) => setNewLeadService(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option>NR-12 – Segurança em Máquinas</option>
                  <option>NR-13 – Inspeção de Caldeira</option>
                  <option>Laudos Técnicos</option>
                  <option>ART</option>
                  <option>Inspeção de Pontes Rolantes</option>
                  <option>Estruturas Metálicas e Linhas de Vida</option>
                  <option>Consultoria</option>
                </select>
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-slate-400 block font-medium">Endereço da Obra</label>
                <input
                  type="text"
                  value={newLeadAddress}
                  onChange={(e) => setNewLeadAddress(e.target.value)}
                  placeholder="Ex: Distrito Industrial, Aparecida do Taboado - MS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Valor Estimado do Contrato (R$)</label>
                <input
                  type="number"
                  value={newLeadValue}
                  onChange={(e) => setNewLeadValue(e.target.value)}
                  placeholder="Ex: 4500"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-800 justify-end">
              <button
                type="button"
                onClick={() => setIsAddingLead(false)}
                className="bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-750 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Cadastrar Lead
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lead Details Drawer Overlay */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end z-50">
          <div className="bg-slate-900 border-l border-slate-800 max-w-lg w-full h-full p-6 overflow-y-auto space-y-6 flex flex-col justify-between shadow-2xl relative animate-slide-in">
            <div>
              {/* Close button */}
              <button
                onClick={() => setSelectedLead(null)}
                className="absolute top-4 right-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 w-8 h-8 rounded-full flex items-center justify-center text-white"
              >
                ✕
              </button>

              {/* Feedback Success Toast inside Drawer */}
              {saveSuccessMessage && (
                <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl flex items-center gap-2 text-emerald-300 text-xs shadow-lg mt-4 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              <div className="flex justify-between items-start mt-4">
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border uppercase inline-block ${getStageColor(selectedLead.status)}`}>
                    {selectedLead.status}
                  </span>
                  <h3 className="font-bold text-xl text-white font-sans">{selectedLead.company}</h3>
                  <p className="text-slate-400 text-xs">Cadastrado em {selectedLead.date}</p>
                </div>

                {!isEditingLead && (
                  <button
                    onClick={() => handleStartEditLead(selectedLead)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow shadow-emerald-950"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar Dados
                  </button>
                )}
              </div>

              {/* Lead information ledger OR Edit Form */}
              {isEditingLead ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 my-6 space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                      <Edit2 className="w-4 h-4" />
                      Editar Orçamento e Informações
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {selectedLead.id}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium block">Empresa / Condomínio *</label>
                      <input
                        type="text"
                        value={editLeadData.company || ""}
                        onChange={(e) => setEditLeadData({ ...editLeadData, company: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-750 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium block">Nome do Contato *</label>
                      <input
                        type="text"
                        value={editLeadData.name || ""}
                        onChange={(e) => setEditLeadData({ ...editLeadData, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-750 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-emerald-400 font-bold block">Valor do Orçamento (R$) *</label>
                        <input
                          type="number"
                          value={editLeadData.value ?? 0}
                          onChange={(e) => setEditLeadData({ ...editLeadData, value: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg py-2 px-3 text-emerald-300 font-mono font-bold text-sm focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium block">Estágio no Funil</label>
                        <select
                          value={editLeadData.status || "Lead"}
                          onChange={(e) => setEditLeadData({ ...editLeadData, status: e.target.value as Lead["status"] })}
                          className="w-full bg-slate-900 border border-slate-750 rounded-lg py-2 px-2.5 text-white focus:outline-none focus:border-emerald-500"
                        >
                          {funnelStages.map((stg) => (
                            <option key={stg} value={stg}>{stg}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium block">Serviço Solicitado</label>
                      <input
                        type="text"
                        value={editLeadData.service || ""}
                        onChange={(e) => setEditLeadData({ ...editLeadData, service: e.target.value })}
                        placeholder="Ex: NR-12 – Segurança em Máquinas"
                        className="w-full bg-slate-900 border border-slate-750 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium block">Telefone / WhatsApp</label>
                        <input
                          type="text"
                          value={editLeadData.phone || ""}
                          onChange={(e) => setEditLeadData({ ...editLeadData, phone: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-750 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium block">E-mail</label>
                        <input
                          type="email"
                          value={editLeadData.email || ""}
                          onChange={(e) => setEditLeadData({ ...editLeadData, email: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-750 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium block">Endereço / Local da Obra</label>
                      <input
                        type="text"
                        value={editLeadData.address || ""}
                        onChange={(e) => setEditLeadData({ ...editLeadData, address: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-750 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-800 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingLead(false)}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditLead}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow shadow-emerald-950"
                    >
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-b border-slate-800/80 my-6 py-4 space-y-3.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span><strong className="text-slate-400">Contato:</strong> {selectedLead.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span><strong className="text-slate-400">Telefone:</strong> {selectedLead.phone || "Não informado"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span><strong className="text-slate-400">E-mail:</strong> {selectedLead.email || "Não informado"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span><strong className="text-slate-400">Local da Obra:</strong> {selectedLead.address}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>
                        <strong className="text-slate-400">Valor Proposta:</strong>{" "}
                        <span className="text-emerald-400 font-mono font-bold text-base">
                          R$ {selectedLead.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleStartEditLead(selectedLead)}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="w-3 h-3" /> Alterar Valor
                    </button>
                  </div>
                </div>
              )}

              {/* Outreach Pitch Auto Generator Panel */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Abordagem Comercial da IA
                  </h4>
                  <button
                    onClick={() => handleGenerateOutreachScript(selectedLead)}
                    disabled={isGeneratingScript}
                    className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-950/40 border border-emerald-900/30 px-2.5 py-1 rounded-md"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingScript ? "animate-spin" : ""}`} />
                    Gerar Script de Venda
                  </button>
                </div>

                {selectedLead.outreachScript ? (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-850 leading-relaxed italic whitespace-pre-wrap">
                      {selectedLead.outreachScript}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyPitch(selectedLead.outreachScript || "")}
                        className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 font-semibold text-[10px] py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? "Copiado!" : "Copiar Texto"}
                      </button>
                      <a
                        href={`https://wa.me/${cleanPhoneForWhatsApp(selectedLead.phone || "")}?text=${encodeURIComponent(selectedLead.outreachScript)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-950"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Enviar WhatsApp
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Nenhum roteiro de vendas gerado ainda. Clique para que a inteligência artificial analise este lead e sugira uma abordagem ideal de Whatsapp/Ligação.
                  </p>
                )}
              </div>

              {/* Documents ledger */}
              <div className="space-y-2 mt-6">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Documentos & Relatórios</span>
                {selectedLead.documents && selectedLead.documents.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedLead.documents.map((doc, idx) => (
                      <span key={idx} className="bg-slate-950 text-[10px] text-slate-300 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-red-400" />
                        <span className="truncate">{doc}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">Nenhum anexo adicionado.</p>
                )}
              </div>

              {/* Histórico de Follow-up (Notas) */}
              <div className="space-y-3 mt-6 pt-6 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Histórico de Contatos & Notas</span>
                
                {/* Notes List */}
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {selectedLead.notes && selectedLead.notes.length > 0 ? (
                    selectedLead.notes.map((note, idx) => (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[11px] text-slate-300 leading-normal">
                        {note}
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">Nenhum registro de contato ou observação adicionado.</p>
                  )}
                </div>

                {/* Add Note Form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar nota (ex: ligou interessado)..."
                    className="flex-grow bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddNote();
                    }}
                  />
                  <button
                    onClick={handleAddNote}
                    className="bg-emerald-650 hover:bg-emerald-600 text-white font-semibold text-[10px] px-3.5 py-1.5 rounded-lg border border-emerald-800 transition-colors"
                  >
                    Gravar
                  </button>
                </div>
              </div>

              {/* Histórico de Interações (Ordens de Serviço) */}
              <div className="space-y-3 mt-6 pt-6 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Histórico de Interações (OS)</span>
                </div>

                <div className="space-y-3">
                  {serviceOrders.filter(os => os.leadId === selectedLead.id).length > 0 ? (
                    serviceOrders.filter(os => os.leadId === selectedLead.id).map((os) => {
                      const totalChecklist = os.checklist?.length || 0;
                      const completedChecklist = os.checklist?.filter(c => c.checked).length || 0;
                      const percent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

                      let statusBadge = "bg-amber-950 text-amber-300 border-amber-900";
                      if (os.status === "Em Andamento") statusBadge = "bg-blue-950 text-blue-300 border-blue-900";
                      if (os.status === "Concluído") statusBadge = "bg-emerald-950 text-emerald-300 border-emerald-900";

                      return (
                        <div key={os.id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="text-[11px] font-bold text-white leading-tight">{os.title}</p>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {os.id} | Responsável: {os.engineer || "Não designado"}</p>
                            </div>
                            <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${statusBadge} shrink-0`}>
                              {os.status}
                            </span>
                          </div>

                          {/* Progress bar and dates */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                              <span>Checklist: {completedChecklist}/{totalChecklist} ({percent}%)</span>
                              <span>Início: {os.startDate ? new Date(os.startDate).toLocaleDateString("pt-BR") : "-"}</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1">
                              <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">Nenhuma ordem de serviço histórica encontrada para este lead.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions of Drawer */}
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2 bg-slate-900">
              <button
                onClick={() => setShowProposal(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow shadow-emerald-950"
              >
                <FileText className="w-4 h-4" />
                Visualizar Proposta Comercial (PDF)
              </button>

              {/* If lead status is Fechado or Execução, show 'Create OS' option */}
              {(selectedLead.status === "Fechado" || selectedLead.status === "Execução") && (
                <button
                  onClick={() => {
                    onCreateOSFromLead(selectedLead);
                    setSelectedLead(null);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Workflow className="w-4 h-4" />
                  Gerar Ordem de Serviço Operacional (OS)
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja arquivar/deletar o lead ${selectedLead.company}?`)) {
                      onDeleteLead(selectedLead.id);
                      setSelectedLead(null);
                    }
                  }}
                  className="bg-red-950 hover:bg-red-900 border border-red-900/40 text-red-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="flex-grow bg-slate-800 text-slate-300 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-750 transition-colors"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* proposal modal */}
      {showProposal && selectedLead && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-3xl p-6 md:p-8 space-y-6 shadow-2xl relative border border-slate-200 print:p-0 print:border-none print:shadow-none print:rounded-none">
            {/* Modal actions, hidden during print */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="text-emerald-600 w-5 h-5" />
                <h3 className="font-bold text-slate-800 text-sm md:text-base">Editar e Emitir Proposta Comercial</h3>
              </div>
              <button
                onClick={() => setShowProposal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Editable Fields Panel, hidden during print */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs space-y-3 print:hidden">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-700 font-bold block">Valor do Serviço (R$)</label>
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={propValue}
                      onChange={(e) => setPropValue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 font-semibold font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveProposalValue}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                      title="Atualizar valor no CRM"
                    >
                      <Save className="w-3 h-3" />
                      Salvar
                    </button>
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-semibold block">Condições de Pagamento</label>
                  <input
                    type="text"
                    value={propPayment}
                    onChange={(e) => setPropPayment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold block">Validade</label>
                  <input
                    type="text"
                    value={propValidity}
                    onChange={(e) => setPropValidity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1 md:col-span-4">
                  <label className="text-slate-500 font-semibold block">Prazo de Execução</label>
                  <input
                    type="text"
                    value={propDeadline}
                    onChange={(e) => setPropDeadline(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Printable Proposal Document Body */}
            <div className="space-y-6 font-serif text-slate-800 max-h-[450px] overflow-y-auto p-4 border border-slate-100 rounded-lg bg-white print:max-h-none print:overflow-visible print:p-0 print:border-none">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900">JC EVOLUTION ENGENHARIA MECÂNICA</h1>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Laudos, Inspeções e Soluções com ART</p>
                  <p className="text-[10px] text-slate-600 font-sans mt-2">
                    Aparecida do Taboado - MS | (49) 99832-5358 | josnei.cunha@gmail.com
                  </p>
                </div>
                <div className="text-right text-xs font-sans">
                  <p className="font-bold font-mono text-slate-800">PROPOSTA Nº {selectedLead.id.toUpperCase()}</p>
                  <p className="text-slate-500 mt-1">{new Date().toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-1 text-xs">
                <p className="font-bold font-sans text-slate-900 text-[11px] uppercase tracking-wider text-slate-500">Destinatário / Solicitante</p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 font-sans">
                  <p><strong className="text-slate-700">Empresa:</strong> {selectedLead.company}</p>
                  <p><strong className="text-slate-700">A/C Sr(a):</strong> {selectedLead.name}</p>
                  <p><strong className="text-slate-700">Local da Execução:</strong> {selectedLead.address}</p>
                  {selectedLead.phone && <p><strong className="text-slate-700">Telefone:</strong> {selectedLead.phone}</p>}
                </div>
              </div>

              {/* Scope of Work */}
              <div className="space-y-2">
                <p className="font-bold font-sans text-slate-900 text-[11px] uppercase tracking-wider text-slate-500">1. Objeto e Escopo de Trabalho</p>
                <p className="text-xs leading-relaxed text-justify">
                  Esta proposta comercial visa a prestação de serviços de Engenharia Mecânica especializada para a execução de: <strong className="font-sans text-slate-900">{selectedLead.service}</strong>.
                </p>
                <p className="text-xs leading-relaxed text-justify">
                  O escopo abrange todas as vistorias de campo necessárias, testes não destrutivos de praxe, verificação física de conformidade legal pelas normas vigentes (como NR-12 e NR-13), compilação dos relatórios técnicos de engenharia com fotos das não-conformidades encontradas e soluções recomendadas, e emissão de Anotação de Responsabilidade Técnica (ART) registrada junto ao conselho regional (CREA).
                </p>
              </div>

              {/* Commercial Conditions */}
              <div className="space-y-2">
                <p className="font-bold font-sans text-slate-900 text-[11px] uppercase tracking-wider text-slate-500">2. Valores e Condições Comerciais</p>
                <table className="w-full text-xs font-sans border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700">
                      <th className="border border-slate-200 p-2 text-left">Item / Serviço</th>
                      <th className="border border-slate-200 p-2 text-right w-36">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 p-2">
                        {selectedLead.service} com ART e laudos inclusos
                      </td>
                      <td className="border border-slate-200 p-2 text-right font-mono font-bold text-slate-900">
                        R$ {propValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs font-sans">
                  <div>
                    <strong className="text-slate-700">Condições de Pagamento:</strong>
                    <p className="text-slate-600 mt-0.5">{propPayment}</p>
                  </div>
                  <div>
                    <strong className="text-slate-700">Prazo de Execução:</strong>
                    <p className="text-slate-600 mt-0.5">{propDeadline}</p>
                  </div>
                  <div>
                    <strong className="text-slate-700">Validade desta Proposta:</strong>
                    <p className="text-slate-600 mt-0.5">{propValidity}</p>
                  </div>
                </div>
              </div>

              {/* Obligations */}
              <div className="space-y-2">
                <p className="font-bold font-sans text-slate-900 text-[11px] uppercase tracking-wider text-slate-500">3. Obrigações das Partes</p>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1 text-justify">
                  <li><strong>Contratada:</strong> Garantir a execução dos serviços de acordo com as normas de segurança brasileiras (ABNT, NR-12 e NR-13), disponibilizar engenheiro devidamente registrado para supervisão e emitir as devidas ARTs.</li>
                  <li><strong>Contratante:</strong> Garantir livre acesso aos equipamentos, disponibilizar operador para manobras de teste e fornecer dados de prontuário técnico se existentes.</li>
                </ul>
              </div>

              {/* Signature */}
              <div className="pt-12 flex justify-between items-end text-xs font-sans">
                <div className="text-center w-64 border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-800">Eng. Mecânico Josnei da Cunha</p>
                  <p className="text-slate-500 text-[11px]">CREA/RN 2521304182 | CNPJ 53.111.432/0001-36</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">JC Evolution Engenharia Mecânica</p>
                </div>
                <div className="text-center w-64 border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-800">Aceite do Cliente</p>
                  <p className="text-slate-500 text-[11px]">{selectedLead.company}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Data de Aprovação: ___/___/______</p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions, hidden during print */}
            <div className="flex gap-2 pt-4 border-t border-slate-200 justify-end print:hidden">
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow shadow-emerald-950"
              >
                <FileText className="w-4 h-4" />
                Imprimir / Salvar PDF
              </button>
              <button
                onClick={() => setShowProposal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4.5 py-2.5 rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
