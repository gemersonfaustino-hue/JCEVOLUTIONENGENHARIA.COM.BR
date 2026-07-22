import React, { useState } from "react";
import { MapPin, Search, Compass, Info, Building, Briefcase, FileText, DollarSign, Camera } from "lucide-react";
import { Lead, ServiceOrder } from "../types";

interface InteractiveMapProps {
  leads: Lead[];
  serviceOrders: ServiceOrder[];
  onSelectLead?: (lead: Lead) => void;
}

export default function InteractiveMap({ leads, serviceOrders, onSelectLead }: InteractiveMapProps) {
  const [selectedItem, setSelectedItem] = useState<{ type: "lead" | "os"; data: any } | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Center of Aparecida do Taboado (mock canvas grid coordinates)
  // Latitude around -20.0862, Longitude around -51.0911
  // We'll map offsets (latOffset, lngOffset) to a 1000x600 grid
  const width = 1000;
  const height = 600;

  // Center point
  const cx = width / 2;
  const cy = height / 2;

  // Scale factor to convert offsets to grid pixels
  const scale = 5000;

  // Process items to plot on the map
  const mapItems = [
    ...leads.map((lead) => {
      // Find matching OS
      const hasOS = serviceOrders.find((o) => o.leadId === lead.id);
      
      let markerColor = "bg-yellow-500 ring-yellow-400"; // 🟡 Lead
      let pinType: "cliente" | "lead" | "obra" | "proposta" = "lead";

      if (lead.status === "Concluído") {
        markerColor = "bg-emerald-500 ring-emerald-400"; // 🟢 Cliente
        pinType = "cliente";
      } else if (hasOS && hasOS.status === "Em Andamento") {
        markerColor = "bg-blue-500 ring-blue-400"; // 🔵 Obra (Active Project)
        pinType = "obra";
      } else if (lead.status === "Orçamento" || lead.status === "Negociação") {
        markerColor = "bg-rose-500 ring-rose-400"; // 🔴 Proposta enviada
        pinType = "proposta";
      } else if (lead.status === "Execução") {
        markerColor = "bg-blue-500 ring-blue-400"; // 🔵 Obra / Execução
        pinType = "obra";
      }

      return {
        id: `lead-${lead.id}`,
        type: "lead" as const,
        pinType,
        x: cx + lead.lngOffset * scale,
        y: cy + lead.latOffset * scale,
        title: lead.company,
        subtitle: lead.name,
        service: lead.service,
        status: lead.status,
        color: markerColor,
        data: lead,
      };
    }),
  ];

  const filteredItems = mapItems.filter((item) => {
    if (filterType === "all") return true;
    return item.pinType === filterType;
  });

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative h-[650px] flex flex-col md:flex-row">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between z-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Compass className="text-emerald-500 w-6 h-6 animate-spin-slow" />
            <h3 className="font-sans font-bold text-lg text-white">Mapa Inteligente</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6 font-sans">
            Monitoramento regional de clientes, propostas e obras ativas em Aparecida do Taboado - MS.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block mb-2">Filtrar Marcadores</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors flex items-center gap-1.5 ${
                    filterType === "all" ? "bg-slate-800 text-white" : "bg-slate-900/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  Todos ({mapItems.length})
                </button>
                <button
                  onClick={() => setFilterType("cliente")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors flex items-center gap-1.5 ${
                    filterType === "cliente" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" : "bg-slate-900/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  🟢 Clientes
                </button>
                <button
                  onClick={() => setFilterType("lead")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors flex items-center gap-1.5 ${
                    filterType === "lead" ? "bg-yellow-950/40 text-yellow-400 border border-yellow-900/40" : "bg-slate-900/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  🟡 Leads
                </button>
                <button
                  onClick={() => setFilterType("obra")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors flex items-center gap-1.5 ${
                    filterType === "obra" ? "bg-blue-950/40 text-blue-400 border border-blue-900/40" : "bg-slate-900/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  🔵 Obras
                </button>
                <button
                  onClick={() => setFilterType("proposta")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors flex items-center gap-1.5 ${
                    filterType === "proposta" ? "bg-rose-950/40 text-rose-400 border border-rose-900/40" : "bg-slate-900/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  🔴 Propostas
                </button>
              </div>
            </div>

            {/* Scale indicator */}
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Status Regional</span>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Atuação</span>
                <span className="text-emerald-400 font-medium">Aparecida do Taboado, MS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-950/50"></span>
            <span>🟢 Clientes Contratados</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500 ring-4 ring-yellow-950/50"></span>
            <span>🟡 Leads Cadastrados</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-950/50"></span>
            <span>🔵 Obras em Andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-950/50"></span>
            <span>🔴 Propostas Enviadas</span>
          </div>
        </div>
      </div>

      {/* Map Stage */}
      <div className="flex-1 relative overflow-hidden bg-slate-950/50 flex items-center justify-center">
        {/* Abstract/Stylized Map Background Grid */}
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Custom SVG Stylized Map */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full object-cover transition-transform duration-500 pointer-events-none select-none"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Paraná River (Rio Paraná - typical boundary for Aparecida do Taboado region) */}
          <path
            d="M -100,500 C 200,450 400,550 700,500 C 850,480 1000,560 1100,580 L 1100,700 L -100,700 Z"
            fill="#1e3a5f"
            opacity="0.3"
          />
          <text x="800" y="550" fill="#2563eb" fontSize="12" fontFamily="sans-serif" className="opacity-40 tracking-widest font-bold">
            RIO PARANÁ
          </text>

          {/* Major Roads (MS-316 & Av. Pres. Vargas) */}
          <path d="M 0,300 C 300,280 600,320 1000,290" stroke="#334155" strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M 500,0 L 500,600" stroke="#334155" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M 150,0 C 200,200 150,400 200,600" stroke="#334155" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.3" />

          {/* Road Labels */}
          <text x="50" y="285" fill="#64748b" fontSize="10" fontFamily="monospace" className="opacity-80">
            RODOVIA MS-316
          </text>
          <text x="515" y="50" fill="#64748b" fontSize="10" fontFamily="monospace" className="opacity-80" transform="rotate(90, 515, 50)">
            AV. PRESIDENTE VARGAS
          </text>

          {/* Industrial Districts (Distrito Industrial) */}
          <rect x="720" y="80" width="200" height="150" rx="10" fill="#1e293b" opacity="0.4" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
          <text x="735" y="105" fill="#94a3b8" fontSize="11" fontFamily="sans-serif" className="opacity-60 font-semibold tracking-wider">
            DISTRITO INDUSTRIAL I
          </text>

          <rect x="100" y="80" width="180" height="130" rx="10" fill="#1e293b" opacity="0.4" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
          <text x="115" y="105" fill="#94a3b8" fontSize="11" fontFamily="sans-serif" className="opacity-60 font-semibold tracking-wider">
            DISTRITO INDUSTRIAL II
          </text>

          {/* Area Rural/Agronegócio */}
          <circle cx="850" cy="400" r="100" fill="#065f46" opacity="0.1" />
          <text x="800" y="400" fill="#059669" fontSize="10" fontFamily="sans-serif" className="opacity-40 font-semibold tracking-wider">
            ÁREA DE COOPERATIVAS / AGRICULTURA
          </text>

          <circle cx="200" cy="420" r="90" fill="#065f46" opacity="0.1" />

          {/* Center City Grid Lines (Centro de Aparecida do Taboado) */}
          <circle cx="500" cy="300" r="60" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
          <circle cx="500" cy="300" r="140" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" opacity="0.2" />
          <circle cx="500" cy="300" r="240" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" opacity="0.1" />
          <text x="460" y="270" fill="#94a3b8" fontSize="11" fontFamily="sans-serif" className="opacity-40 font-bold">
            CENTRO URBANO
          </text>
        </svg>

        {/* Map Interactive Nodes (HTML overlay) */}
        <div className="absolute inset-0 pointer-events-none">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem({ type: "lead", data: item.data })}
              className="absolute group pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-20"
              style={{ left: `${item.x}px`, top: `${item.y}px` }}
            >
              <div className="relative">
                {/* Ping wave effect for active/high potential markers */}
                {(item.pinType === "cliente" || item.status === "Execução" || item.data.value > 5000) && (
                  <span className={`absolute inline-flex h-8 w-8 rounded-full opacity-40 animate-ping -left-2.5 -top-2.5 ${
                    item.pinType === "cliente" ? "bg-emerald-400" :
                    item.pinType === "obra" ? "bg-blue-400" :
                    item.pinType === "proposta" ? "bg-rose-400" : "bg-yellow-400"
                  }`}></span>
                )}
                <div className={`w-3.5 h-3.5 rounded-full ${item.color} shadow-lg ring-4 border border-slate-950`} />
              </div>

              {/* Tooltip on Hover */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900 border border-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none font-sans">
                <p className="font-bold">{item.title}</p>
                <p className="text-slate-400">{item.service}</p>
                <p className="text-emerald-400 mt-0.5 font-mono">R$ {item.data.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Map Controls */}
        <div className="absolute right-4 bottom-4 bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex gap-1 shadow-lg z-20">
          <button
            onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.15))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-lg font-bold"
            title="Afastar"
          >
            -
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-mono"
            title="Redefinir Zoom"
          >
            1x
          </button>
          <button
            onClick={() => setZoomLevel(Math.min(1.8, zoomLevel + 0.15))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-lg font-bold"
            title="Aproximar"
          >
            +
          </button>
        </div>

        {/* Node Detail Overlay Drawer */}
        {selectedItem && (
          <div className="absolute left-4 right-4 bottom-4 md:left-auto md:right-4 md:top-4 md:bottom-auto w-auto md:w-96 bg-slate-900/95 backdrop-blur border border-emerald-900/40 rounded-xl p-5 shadow-2xl z-30 font-sans transition-all">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-800/40 uppercase">
                  {selectedItem.data.status}
                </span>
                <h4 className="font-bold text-white text-base mt-1.5 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-400" />
                  {selectedItem.data.company}
                </h4>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 my-4 border-t border-b border-slate-800 py-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <span><strong className="text-slate-400">Responsável:</strong> {selectedItem.data.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span><strong className="text-slate-400">Serviço:</strong> {selectedItem.data.service}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span><strong className="text-slate-400">Endereço:</strong> {selectedItem.data.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  <strong className="text-slate-400">Valor Proposta:</strong>{" "}
                  <span className="text-emerald-400 font-mono font-medium">
                    R$ {selectedItem.data.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </span>
              </div>
            </div>

            {selectedItem.data.documents && selectedItem.data.documents.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Documentos & ARTs</span>
                <div className="flex flex-wrap gap-1">
                  {selectedItem.data.documents.map((doc: string, idx: number) => (
                    <span key={idx} className="bg-slate-800 text-[10px] text-slate-300 px-2 py-1 rounded border border-slate-700/50 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-red-400" />
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.data.photos && selectedItem.data.photos.length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1.5">Fotos da Vistoria</span>
                <div className="flex gap-2">
                  {selectedItem.data.photos.map((ph: string, idx: number) => (
                    <img key={idx} src={ph} className="w-14 h-14 object-cover rounded border border-slate-700 hover:scale-105 transition-transform cursor-pointer" alt="Vistoria" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onSelectLead) onSelectLead(selectedItem.data);
                }}
                className="flex-1 bg-emerald-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5"
              >
                Abrir Detalhes no CRM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
