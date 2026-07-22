import React, { useState, useEffect } from "react";
import {
  BarChart3, Users, Landmark, FileText, Settings, Play, Check, AlertCircle, ToggleLeft, ToggleRight,
  ShieldAlert, RefreshCw, Trash2, Shield, TrendingUp, Clock, Bot, Sparkles, Zap
} from "lucide-react";
import { Lead, Transaction, ServiceOrder, Automation, AutomationLog } from "../types";

interface AdminDashboardProps {
  leads: Lead[];
  transactions: Transaction[];
  serviceOrders: ServiceOrder[];
  onSelectTab: (tab: string) => void;
}

export default function AdminDashboard({ leads, transactions, serviceOrders, onSelectTab }: AdminDashboardProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isLoadingAuto, setIsLoadingAuto] = useState(false);

  // Load automations and logs
  const fetchAutomations = async () => {
    setIsLoadingAuto(true);
    try {
      const response = await fetch("/api/automations");
      if (response.ok) {
        const data = await response.json();
        setAutomations(data.automations || []);
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching automations:", error);
    } finally {
      setIsLoadingAuto(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  // Toggle automation enabled
  const handleToggleAutomation = async (id: string, currentlyEnabled: boolean) => {
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentlyEnabled })
      });
      if (response.ok) {
        setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !currentlyEnabled } : a));
      }
    } catch (error) {
      console.error("Error toggling automation:", error);
    }
  };

  // Clear automation logs
  const handleClearLogs = async () => {
    try {
      const response = await fetch("/api/automations/clear-logs", { method: "POST" });
      if (response.ok) {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error clearing logs:", error);
    }
  };

  // General counts
  const totalLeadsCount = leads.length;
  const activeObrasCount = serviceOrders.filter(o => o.status === "Em Andamento").length;
  const completedObrasCount = serviceOrders.filter(o => o.status === "Concluído").length;
  
  // Conversion Rate (Closed / Executing / Completed / total)
  const convertedLeads = leads.filter(l => ["Fechado", "Execução", "Concluído"].includes(l.status)).length;
  const conversionRate = totalLeadsCount > 0 ? Math.round((convertedLeads / totalLeadsCount) * 100) : 0;

  // Faturamento (sum of paid transactions + closed leads value)
  const totalFaturamento = transactions.filter(t => t.type === "receivable" && t.status === "pago").reduce((acc, t) => acc + t.value, 0);

  // Revenue by Category calculation
  const nr12Value = leads.filter(l => l.service.includes("NR-12")).reduce((acc, l) => acc + l.value, 0);
  const nr13Value = leads.filter(l => l.service.includes("NR-13")).reduce((acc, l) => acc + l.value, 0);
  const artValue = leads.filter(l => l.service.includes("ART")).reduce((acc, l) => acc + l.value, 0);
  const otherValue = leads.filter(l => !l.service.includes("NR-12") && !l.service.includes("NR-13") && !l.service.includes("ART")).reduce((acc, l) => acc + l.value, 0);
  const totalServicesValue = nr12Value + nr13Value + artValue + otherValue || 1;

  // Percentage shares for visual bar graph
  const nr12Share = Math.round((nr12Value / totalServicesValue) * 100) || 0;
  const nr13Share = Math.round((nr13Value / totalServicesValue) * 100) || 0;
  const artShare = Math.round((artValue / totalServicesValue) * 100) || 0;
  const otherShare = Math.round((otherValue / totalServicesValue) * 100) || 0;

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-emerald-500 w-5 h-5" />
          Workspace - Painel de Controle JC EVOLUTION ENGENHARIA MECÂNICA
        </h2>
        <p className="text-slate-400 text-xs">
          Indicadores operacionais chaves (KPIs), automações e rastreamento de logs automáticos.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Leads */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1 shadow">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Leads Ativos</span>
          <p className="text-2xl font-bold text-white font-mono">{totalLeadsCount}</p>
          <button onClick={() => onSelectTab("crm")} className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 mt-2">
            Ver CRM Pipeline →
          </button>
        </div>

        {/* Conversion Rate */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1 shadow">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Taxa Conversão</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{conversionRate}%</p>
          <p className="text-[9px] text-slate-400 leading-tight mt-2">Leads qualificados convertidos</p>
        </div>

        {/* Faturamento */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1 shadow">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Faturamento Total</span>
          <p className="text-2xl font-bold text-white font-mono">
            R$ {totalFaturamento.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </p>
          <button onClick={() => onSelectTab("erp")} className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 mt-2">
            Ver Fluxo Caixa →
          </button>
        </div>

        {/* Active Obras */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1 shadow">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Obras/OS Ativas</span>
          <p className="text-2xl font-bold text-blue-400 font-mono">{activeObrasCount}</p>
          <button onClick={() => onSelectTab("erp")} className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 mt-2">
            Ver OS Operacional →
          </button>
        </div>

        {/* Issued ARTs */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1 shadow col-span-2 md:col-span-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">ARTs Emitidas</span>
          <p className="text-2xl font-bold text-violet-400 font-mono">{completedObrasCount}</p>
          <p className="text-[9px] text-slate-400 leading-tight mt-2">Laudos finalizados com responsabilidade</p>
        </div>
      </div>

      {/* Main statistics layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Visual pipeline distributions (Custom SVG graphs) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm">Faturamento por Categoria (Propostas)</h3>
            <span className="text-[10px] font-mono text-slate-400">Distribuição Estimada</span>
          </div>

          <div className="space-y-4">
            {/* NR-12 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">Adequações NR-12</span>
                <span className="text-slate-400 font-mono">R$ {nr12Value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} ({nr12Share}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${nr12Share}%` }} />
              </div>
            </div>

            {/* NR-13 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">Inspeções Caldeiras NR-13</span>
                <span className="text-slate-400 font-mono">R$ {nr13Value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} ({nr13Share}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full transition-all" style={{ width: `${nr13Share}%` }} />
              </div>
            </div>

            {/* ART */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">Emissão de ARTs</span>
                <span className="text-slate-400 font-mono">R$ {artValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} ({artShare}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div className="bg-violet-500 h-full transition-all" style={{ width: `${artShare}%` }} />
              </div>
            </div>

            {/* Outros */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">Consultoria / Outros</span>
                <span className="text-slate-400 font-mono">R$ {otherValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} ({otherShare}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div className="bg-slate-700 h-full transition-all" style={{ width: `${otherShare}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Automation Triggers Panel */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                Automações Inteligentes de Fluxo de Trabalho
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">Motor Ativo</span>
            </div>

            <div className="space-y-2 text-xs">
              {automations.map((auto) => (
                <div key={auto.id} className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded-md">
                        Trigger: {auto.event}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {auto.actions.map((act, idx) => (
                        <span key={idx} className="bg-slate-900 text-[9px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950/40 font-mono">
                          ✓ {act}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleAutomation(auto.id, auto.enabled)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {auto.enabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Automation Trigger Logs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-emerald-500" />
            Logs de Automações e Disparos
          </h3>
          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="text-[10px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-950/35 border border-red-950/30 px-2.5 py-1 rounded-md"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar Histórico
          </button>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 font-mono text-[11px]">
          {logs.length === 0 ? (
            <div className="text-center py-6 text-slate-600 italic">
              Nenhum disparo de automação registrado ainda.
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-start gap-4">
                <span className="text-slate-500 shrink-0 select-none">
                  {new Date(log.time).toLocaleTimeString()}
                </span>
                <div className="space-y-1.5 flex-grow">
                  <span className="bg-[#0f2d1d] text-emerald-400 border border-emerald-950/60 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                    {log.event}
                  </span>
                  <p className="text-slate-300 leading-relaxed font-sans">{log.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
