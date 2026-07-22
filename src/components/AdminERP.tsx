import React, { useState } from "react";
import {
  DollarSign, Wrench, Calendar, ClipboardCheck, CheckCircle2, ChevronRight, Play, Check, FileText, Camera, Shield,
  QrCode, Scale, BarChart3, Clock, UserCheck, Plus, Trash2, X, Download, Landmark, Signature, CheckSquare
} from "lucide-react";
import { Transaction, ServiceOrder } from "../types";

interface AdminERPProps {
  transactions: Transaction[];
  serviceOrders: ServiceOrder[];
  onAddTransaction: (txData: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateOS: (id: string, updatedData: Partial<ServiceOrder>) => void;
}

export default function AdminERP({ transactions, serviceOrders, onAddTransaction, onDeleteTransaction, onUpdateOS }: AdminERPProps) {
  const [activeSubTab, setActiveSubTab] = useState<"financeiro" | "operacional">("financeiro");
  
  // Finance states
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [newTxDesc, setNewTxDesc] = useState("");
  const [newTxType, setNewTxType] = useState<"receivable" | "payable">("receivable");
  const [newTxValue, setNewTxValue] = useState("");
  const [newTxCategory, setNewTxCategory] = useState<Transaction["category"]>("PIX");
  const [newTxStatus, setNewTxStatus] = useState<Transaction["status"]>("pago");
  
  // PIX QR Code State
  const [activePixTx, setActivePixTx] = useState<Transaction | null>(null);

  // OS Active Checklist State
  const [activeOS, setActiveOS] = useState<ServiceOrder | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureName, setSignatureName] = useState("");

  // Photo uploading simulation
  const [uploadingPhotoOS, setUploadingPhotoOS] = useState<string | null>(null);

  // Financial calculations
  const totalReceivables = transactions.filter(t => t.type === "receivable" && t.status === "pago").reduce((acc, t) => acc + t.value, 0);
  const pendingReceivables = transactions.filter(t => t.type === "receivable" && t.status === "pendente").reduce((acc, t) => acc + t.value, 0);
  const totalPayables = transactions.filter(t => t.type === "payable" && t.status === "pago").reduce((acc, t) => acc + t.value, 0);
  const netBalance = totalReceivables - totalPayables;

  // Add Transaction Form
  const handleAddTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxDesc || !newTxValue) return;

    onAddTransaction({
      description: newTxDesc,
      type: newTxType,
      value: parseFloat(newTxValue) || 0,
      category: newTxCategory,
      status: newTxStatus,
      date: new Date().toISOString().split("T")[0]
    });

    setNewTxDesc("");
    setNewTxValue("");
    setNewTxCategory("PIX");
    setNewTxStatus("pago");
    setIsAddingTx(false);
  };

  // Toggle OS checklist item
  const handleToggleChecklist = (osId: string, itemIdx: number) => {
    const os = serviceOrders.find(o => o.id === osId);
    if (!os) return;

    const newChecklist = [...os.checklist];
    newChecklist[itemIdx] = { ...newChecklist[itemIdx], checked: !newChecklist[itemIdx].checked };

    // Calculate OS Status
    const allChecked = newChecklist.every(item => item.checked);
    const updatedStatus = allChecked ? "Concluído" as const : "Em Andamento" as const;

    onUpdateOS(osId, { checklist: newChecklist, status: updatedStatus });
    if (activeOS && activeOS.id === osId) {
      setActiveOS({ ...activeOS, checklist: newChecklist, status: updatedStatus });
    }
  };

  // Digital Signature Submitter
  const handleSignOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOS || !signatureName) return;

    onUpdateOS(activeOS.id, { signature: signatureName, status: "Concluído" });
    setActiveOS({ ...activeOS, signature: signatureName, status: "Concluído" });
    setIsSigning(false);
    setSignatureName("");
  };

  // Photo upload simulator
  const handleSimulatePhotoUpload = (osId: string) => {
    const randomPhotos = [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=60"
    ];
    const chosenPhoto = randomPhotos[Math.floor(Math.random() * randomPhotos.length)];
    onUpdateOS(osId, { photoUrl: chosenPhoto });
    if (activeOS && activeOS.id === osId) {
      setActiveOS({ ...activeOS, photoUrl: chosenPhoto });
    }
    alert("Foto de campo carregada com sucesso!");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Tab select header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Landmark className="text-emerald-500 w-5 h-5" />
            ERP - Gestão Integrada JC EVOLUTION ENGENHARIA MECÂNICA
          </h2>
          <p className="text-slate-400 text-xs">
            Controle financeiro administrativo e acompanhamento operacional técnico de ordens de serviço (OS).
          </p>
        </div>

        <div className="bg-slate-900 p-1 rounded-xl flex border border-slate-800">
          <button
            onClick={() => setActiveSubTab("financeiro")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === "financeiro" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Módulo Financeiro
          </button>
          <button
            onClick={() => setActiveSubTab("operacional")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === "operacional" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Módulo Operacional
          </button>
        </div>
      </div>

      {/* FINANCE TAB CONTENT */}
      {activeSubTab === "financeiro" && (
        <div className="space-y-6">
          {/* Finance cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1 shadow">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Recebido (Faturado)</span>
              <p className="text-2xl font-bold text-emerald-400 font-mono">
                R$ {totalReceivables.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1 shadow">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Pendente (A Receber)</span>
              <p className="text-2xl font-bold text-amber-500 font-mono">
                R$ {pendingReceivables.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1 shadow">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Despesas (Contas a Pagar)</span>
              <p className="text-2xl font-bold text-rose-500 font-mono">
                R$ {totalPayables.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-[#0e2d1d] border border-emerald-950 p-5 rounded-2xl space-y-1 shadow">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">Fluxo de Caixa Líquido</span>
              <p className="text-2xl font-bold text-white font-mono">
                R$ {netBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Extrato de Contas e Fluxo de Caixa</h3>
              <button
                onClick={() => setIsAddingTx(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Registrar Lançamento
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-mono uppercase tracking-wider">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/40 text-slate-300">
                      <td className="py-3.5 px-4 font-mono">{tx.date}</td>
                      <td className="py-3.5 px-4 font-bold">{tx.description}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-850 px-2.5 py-1 rounded border border-slate-800 text-[10px] text-slate-400 font-mono">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.status === "pago" ? (
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/30 text-[9px] px-2 py-0.5 rounded-full font-mono uppercase">
                            Pago
                          </span>
                        ) : (
                          <button
                            onClick={() => setActivePixTx(tx)}
                            className="bg-amber-950 text-amber-400 border border-amber-900/30 text-[9px] px-2 py-0.5 rounded-full font-mono uppercase hover:bg-amber-900/50 flex items-center gap-1 transition-colors"
                          >
                            <QrCode className="w-3 h-3" />
                            Pendente / Cobrar PIX
                          </button>
                        )}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${tx.type === "receivable" ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.type === "receivable" ? "+" : "-"} R$ {tx.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OPERATIONAL TAB CONTENT (SERVICE ORDERS, CHECKLISTS, DIGITAL SIGNATURE) */}
      {activeSubTab === "operacional" && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* OS list panel */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Ordens de Serviço Ativas</span>
            
            <div className="space-y-3">
              {serviceOrders.length === 0 ? (
                <div className="border border-dashed border-slate-800 p-8 rounded-2xl text-center">
                  <p className="text-slate-500 text-xs">Nenhuma OS em andamento no momento.</p>
                </div>
              ) : (
                serviceOrders.map((os) => {
                  const checkedCount = os.checklist.filter(c => c.checked).length;
                  const pct = Math.round((checkedCount / os.checklist.length) * 100) || 0;

                  return (
                    <div
                      key={os.id}
                      onClick={() => setActiveOS(os)}
                      className={`border p-5 rounded-2xl cursor-pointer transition-all ${
                        activeOS?.id === os.id ? "bg-slate-900 border-emerald-500" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase inline-block ${
                            os.status === "Concluído" ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-blue-950 text-blue-400 border-blue-900"
                          }`}>
                            {os.status}
                          </span>
                          <h4 className="font-bold text-white text-xs mt-2">{os.title}</h4>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5 mt-4">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Checklist Inspeção de Campo</span>
                          <span>{pct}% ({checkedCount}/{os.checklist.length})</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* OS Active Checklist Detail Board */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 min-h-[450px] flex flex-col justify-between">
            {activeOS ? (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block mb-1">Painel Técnico da OS</span>
                  <h3 className="font-bold text-white text-base leading-tight">{activeOS.title}</h3>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">Engenheiro Responsável: {activeOS.engineer}</p>
                </div>

                {/* Checklist Checklist list */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardCheck className="w-4.5 h-4.5 text-emerald-400" />
                    Etapas de Campo e Calibração
                  </h4>
                  <div className="space-y-2">
                    {activeOS.checklist.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleToggleChecklist(activeOS.id, idx)}
                        className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-xl p-3 text-left transition-colors flex items-center gap-3 group"
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          item.checked ? "bg-emerald-600 border-emerald-500 text-white" : "border-slate-700 bg-slate-950 group-hover:border-emerald-500/50"
                        }`}>
                          {item.checked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-xs ${item.checked ? "text-slate-500 line-through" : "text-slate-200"}`}>{item.item}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photos upload mock */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4.5 h-4.5 text-emerald-400" />
                    Evidências Fotográficas do Laudo
                  </h4>
                  <div className="flex gap-4 items-center">
                    {activeOS.photoUrl ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-800 shadow">
                        <img src={activeOS.photoUrl} className="w-full h-full object-cover" alt="Inspeção" />
                        <button
                          onClick={() => onUpdateOS(activeOS.id, { photoUrl: "" })}
                          className="absolute top-1 right-1 bg-slate-950/80 rounded-full w-5 h-5 flex items-center justify-center text-xs text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSimulatePhotoUpload(activeOS.id)}
                        className="w-20 h-20 border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-emerald-400 transition-colors bg-slate-900/50 text-[10px] font-mono gap-1"
                      >
                        <Camera className="w-5 h-5" />
                        Subir Foto
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono leading-relaxed max-w-sm">
                      Anexe fotos reais tiradas pelo celular durante as vistorias de máquinas (NR-12) ou testes de pressão de caldeiras (NR-13) para amparo documental.
                    </span>
                  </div>
                </div>

                {/* Digital Signature Simulation */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Signature className="w-4.5 h-4.5 text-emerald-400" />
                    Assinatura Digital de Entrega Técnica
                  </h4>
                  {activeOS.signature ? (
                    <div className="bg-[#0e2d1d] border border-emerald-950 p-4 rounded-xl flex items-center gap-3.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-[10px] font-mono text-slate-400">ASSINADO DIGITALMENTE POR</p>
                        <p className="font-bold text-white text-xs">{activeOS.signature}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {isSigning ? (
                        <form onSubmit={handleSignOS} className="flex gap-2">
                          <input
                            type="text"
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder="Escreva seu nome para assinatura (ex: Eng. Josnei da Cunha)..."
                            className="flex-grow bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors"
                          >
                            Assinar OS
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setIsSigning(true)}
                          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          <Signature className="w-4 h-4 text-slate-400" />
                          Liberar Termo de Assinatura
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
                <CheckSquare className="w-10 h-10 text-slate-700 animate-pulse" />
                <h4 className="font-bold text-slate-400 text-sm">Selecione uma Ordem de Serviço</h4>
                <p className="text-slate-500 text-xs max-w-sm">
                  Clique em um dos contratos ativos do painel lateral para acessar checklists de conformidade, carregar evidências fotográficas e registrar a assinatura digital.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction PIX Invoice Simulation Modal */}
      {activePixTx && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActivePixTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <div className="space-y-1.5 pt-4">
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/40 text-[9px] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold inline-block">
                Cobrança de Engenharia por PIX
              </span>
              <h3 className="font-bold text-white text-base leading-snug">{activePixTx.description}</h3>
              <p className="text-emerald-400 font-mono font-bold text-xl mt-2">
                R$ {activePixTx.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Mock QR Code vector image */}
            <div className="bg-white p-4 rounded-xl w-44 h-44 mx-auto flex items-center justify-center shadow-md border border-slate-200">
              <div className="w-full h-full border-4 border-slate-900 relative p-1 flex flex-wrap items-center justify-center">
                <div className="absolute inset-1 border border-slate-900" />
                {/* Visual blocks */}
                <div className="w-8 h-8 bg-slate-900 absolute top-2 left-2" />
                <div className="w-8 h-8 bg-slate-900 absolute top-2 right-2" />
                <div className="w-8 h-8 bg-slate-900 absolute bottom-2 left-2" />
                <div className="w-4 h-4 bg-emerald-500 absolute" />
                <div className="w-12 h-2 bg-slate-900 absolute top-14 left-10" />
                <div className="w-2 h-12 bg-slate-900 absolute top-10 left-16" />
                <div className="w-8 h-8 border-2 border-slate-900 absolute bottom-4 right-4 flex items-center justify-center">
                  <div className="w-3 h-3 bg-slate-900" />
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-xl text-left border border-slate-850">
              <p className="text-[10px] font-mono text-slate-400">CHAVE PIX CNPJ / COPIA E COLA</p>
              <p className="text-[10px] font-mono text-slate-300 break-all bg-slate-900 p-2 rounded-md border border-slate-800">
                00.000.000/0001-00-jc-engenharia-mecanica-aparecida-do-taboado-ms-val-{activePixTx.value}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert("Chave PIX copiada para área de transferência!");
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs py-2.5 rounded-lg transition-colors"
              >
                Copiar Chave PIX
              </button>
              <button
                onClick={() => {
                  onAddTransaction({
                    ...activePixTx,
                    status: "pago",
                    date: new Date().toISOString().split("T")[0]
                  });
                  // Remove old unpaid receivable
                  onDeleteTransaction(activePixTx.id);
                  setActivePixTx(null);
                  alert("Cobrança quitada via PIX com sucesso!");
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
