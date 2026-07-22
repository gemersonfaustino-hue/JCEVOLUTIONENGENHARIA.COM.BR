import React, { useState, useEffect } from "react";
import {
  Trash2, PlusCircle, Check, AlertCircle, Image, RefreshCw, Upload, Briefcase, Eye, AlertTriangle, X
} from "lucide-react";
import { Project } from "../types";
import { compressImage } from "../lib/imageCompressor";
import { useToast } from "./Toast";

export default function AdminProjects() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      showToast("Erro ao carregar as fotos da galeria.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`Preparando ${files.length} foto(s)...`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Processando foto ${i + 1} de ${files.length}: ${file.name}...`);

        // Compress image to max dimension of 1000px, quality 0.8 (perfect balance of high resolution and low size)
        const compressedBase64 = await compressImage(file, 1000, 0.8);

        setUploadProgress(`Enviando foto ${i + 1} de ${files.length}...`);

        const payload = {
          title: `Foto do Portfólio - ${new Date().toLocaleDateString("pt-BR")}`,
          client: "Galeria de Fotos",
          category: "Laudos e Inspeções Técnicas",
          location: "",
          date: "",
          description: "Foto adicionada via gerenciador de galeria rápida.",
          image: compressedBase64,
          tags: []
        };

        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Falha ao enviar a foto: ${file.name}`);
        }
      }

      showToast(`${files.length} foto(s) enviada(s) e comprimida(s) com sucesso!`, "success");
      fetchProjects();
    } catch (err: any) {
      console.error("Erro no envio:", err);
      showToast(err.message || "Ocorreu um erro ao processar ou enviar as fotos.", "error");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesUpload(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFilesUpload(e.dataTransfer.files);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const response = await fetch(`/api/projects/${projectToDelete}`, { method: "DELETE" });
      if (response.ok) {
        showToast("Foto removida da galeria com sucesso!", "success");
        setProjectToDelete(null);
        fetchProjects();
      } else {
        throw new Error("Erro na exclusão");
      }
    } catch (err) {
      showToast("Erro ao excluir a foto.", "error");
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100" id="admin-projects-root">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="text-emerald-500 w-5 h-5" />
            Galeria de Fotos do Portfólio
          </h2>
          <p className="text-slate-400 text-xs">
            Envie fotos dos seus laudos, inspeções e serviços diretamente para o site. Elas serão comprimidas de forma inteligente para carregar rápido.
          </p>
        </div>
        
        <div>
          <button
            onClick={fetchProjects}
            disabled={isRefreshing || isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold hover:border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar Galeria
          </button>
        </div>
      </div>

      {/* LOCAL TOAST CONTAINER REMOVED - USING GLOBAL TOAST INSTEAD */}

      {/* DRAG & DROP PHOTO UPLOADER */}
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center bg-slate-950/50 transition-all relative ${
          isUploading 
            ? "border-emerald-600/50 bg-emerald-950/10" 
            : "border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/30"
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          title=""
        />
        
        <div className="space-y-3 flex flex-col items-center justify-center py-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isUploading 
              ? "bg-emerald-500/20 text-emerald-400 animate-pulse" 
              : "bg-slate-900 border border-slate-800 text-slate-400 group-hover:scale-110"
          }`}>
            <Upload className="w-6 h-6" />
          </div>
          
          {isUploading ? (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-400 animate-pulse block">
                {uploadProgress}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Por favor, não feche esta página até concluir.
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-sm font-semibold text-slate-200 block">
                Arraste suas fotos aqui ou clique para selecionar
              </span>
              <span className="text-xs text-slate-500 block">
                Você pode selecionar múltiplas fotos de uma só vez (Formatos suportados: PNG, JPG, JPEG)
              </span>
              <span className="text-[10px] text-emerald-500/80 font-mono block font-semibold">
                ★ Compressão automática inteligente ativada (Sem fotos pesadas!)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* GALLERY MANAGEMENT GRID */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Image className="w-4 h-4 text-emerald-500" />
          Fotos Atuais na Galeria ({projects.length})
        </h3>
        
        {projects.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800/80 p-12 rounded-2xl text-center space-y-3">
            <Briefcase className="w-12 h-12 text-slate-700 mx-auto" />
            <h4 className="font-semibold text-slate-400 text-sm">Nenhuma foto na galeria</h4>
            <p className="text-xs text-slate-500">Arraste ou selecione fotos acima para começar a exibir seu trabalho no site.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {projects.map((proj) => (
              <div 
                key={proj.id} 
                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-emerald-500/40 shadow-lg transition-all duration-300"
              >
                <img 
                  src={proj.image} 
                  alt="Foto da Galeria" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay with Quick actions */}
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setLightboxUrl(proj.image)}
                    className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-white hover:text-emerald-400 transition-colors"
                    title="Visualizar Foto"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setProjectToDelete(proj.id)}
                    className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    title="Excluir Foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK LIGHTBOX MODAL */}
      {lightboxUrl && (
        <div 
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxUrl} 
              alt="Visualização Ampliada" 
              className="max-w-full max-h-[80vh] object-contain"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg border border-slate-850"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="bg-slate-950/80 px-4 py-2 text-center text-xs text-slate-400 border-t border-slate-900">
              Clique fora da imagem para fechar
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 text-red-400 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">Excluir Foto Permanentemente?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tem certeza que deseja remover esta foto da galeria do portfólio? Esta ação não pode ser desfeita e a imagem deixará de ser exibida no site público.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-lg shadow-red-950/30 cursor-pointer"
              >
                Excluir Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
