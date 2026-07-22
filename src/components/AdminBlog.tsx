import React, { useState, useEffect } from "react";
import {
  Calendar, Sparkles, Trash2, FileText, PlusCircle, Check, AlertCircle, Clock, Eye, Image, Send, ArrowLeft, RefreshCw, Upload
} from "lucide-react";
import { BlogPost } from "../types";
import { compressImage } from "../lib/imageCompressor";

interface AdminBlogProps {
  blogPosts: BlogPost[];
  onRefreshBlog: () => void;
}

export default function AdminBlog({ blogPosts, onRefreshBlog }: AdminBlogProps) {
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  
  // Schedule date states
  const [generatePublishDate, setGeneratePublishDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [manualPublishDate, setManualPublishDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Manual Creation Form States
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("NR-12");
  const [newImageUrl, setNewImageUrl] = useState("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60");
  const [imageSourceType, setImageSourceType] = useState<"file" | "url">("url");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const limit = 10 * 1024 * 1024; // Increase limit because we compress it anyway!
      if (file.size > limit) {
        showToast("O arquivo é grande demais. Por favor envie um arquivo de no máximo 10MB.", "error");
        return;
      }
      try {
        // Compress the blog post image to max width/height of 800px, quality 0.75 (this gets it to around ~50-80KB)
        const base64 = await compressImage(file, 800, 0.75);
        setNewImageUrl(base64);
        showToast("Imagem do blog carregada e otimizada com sucesso!", "success");
      } catch (err) {
        console.error("Erro ao processar imagem:", err);
        showToast("Erro ao ler ou otimizar o arquivo de imagem.", "error");
      }
    }
  };

  // Simulated system date to test scheduling
  const [simulatedDate, setSimulatedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch posts with admin view (returns all posts, including scheduled ones)
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);

  const fetchAllAdminPosts = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/blog/posts?admin=true");
      if (response.ok) {
        const data = await response.json();
        setAllPosts(data);
      }
    } catch (error) {
      console.error("Error fetching admin blog list:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAdminPosts();
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: "", type: "" }), 5000);
  };

  // AI Generation
  const handleGenerateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setIsGenerating(true);
    showToast("A inteligência artificial está escrevendo e formatando seu artigo sofisticado...", "success");
    
    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: topicInput,
          publishDate: generatePublishDate
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha na geração");
      }

      setTopicInput("");
      showToast("Artigo técnico gerado com inteligência artificial e salvo com sucesso!", "success");
      fetchAllAdminPosts();
      onRefreshBlog();
    } catch (err: any) {
      showToast("Erro ao criar artigo com IA: " + err.message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showToast("Título e Conteúdo completo são obrigatórios.", "error");
      return;
    }

    try {
      const response = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          summary: newSummary || newContent.slice(0, 150) + "...",
          content: newContent,
          category: newCategory,
          publishDate: manualPublishDate,
          imageUrl: newImageUrl
        })
      });

      if (!response.ok) throw new Error("Falha ao salvar artigo");

      // Reset
      setNewTitle("");
      setNewSummary("");
      setNewContent("");
      setIsManualFormOpen(false);
      showToast("Artigo inserido e programado manualmente com sucesso!", "success");
      fetchAllAdminPosts();
      onRefreshBlog();
    } catch (err: any) {
      showToast("Erro ao salvar artigo: " + err.message, "error");
    }
  };

  // Delete article
  const handleDeletePost = async (id: string) => {
    if (!confirm("Deseja realmente deletar este artigo do blog? Esta ação não pode ser desfeita.")) return;

    try {
      const response = await fetch(`/api/blog/posts/${id}`, { method: "DELETE" });
      if (response.ok) {
        showToast("Artigo removido com sucesso!", "success");
        fetchAllAdminPosts();
        onRefreshBlog();
      } else {
        throw new Error();
      }
    } catch (error) {
      showToast("Erro ao deletar artigo.", "error");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-wider text-white uppercase flex items-center gap-2">
            <FileText className="text-emerald-500 w-8 h-8" />
            Workspace do Blog Técnico
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Painel exclusivo para o Desenvolvedor do site. Crie, gere artigos sofisticados e programe datas de publicação futuras.
          </p>
        </div>

        {/* Date simulator to test scheduling */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">Simulador de Data Atual</span>
            <p className="text-[11px] text-slate-300">Ajuste para testar se os posts agendados aparecem no site público.</p>
          </div>
          <input
            type="date"
            value={simulatedDate}
            onChange={(e) => setSimulatedDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-mono text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Notifications */}
      {statusMessage.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 transition-all border ${
          statusMessage.type === "error" ? "bg-red-950/40 border-red-900/60 text-red-200" : "bg-emerald-950/40 border-emerald-900/60 text-emerald-200"
        }`}>
          {statusMessage.type === "error" ? <AlertCircle className="w-5 h-5 shrink-0 text-red-400" /> : <Check className="w-5 h-5 shrink-0 text-emerald-400" />}
          <span className="text-xs font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Core Panels Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Generation and Creation */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* AI Generator Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Gerar com IA Inteligente (Gemini)</h3>
            </div>

            <form onSubmit={handleGenerateArticle} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">Tema / Tópico do Artigo</label>
                <input
                  type="text"
                  required
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="Ex: Como evitar multas na adequação da NR-12..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">Data de Publicação Programada</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    required
                    value={generatePublishDate}
                    onChange={(e) => setGeneratePublishDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 text-xs"
                    disabled={isGenerating}
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Selecione uma data futura para agendar o post. O post só aparecerá no site público a partir dessa data.
                </p>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !topicInput.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Gerando Artigo Sofisticado...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    Gerar Artigo Técnico
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Manual Writer trigger / form card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Escrever Artigo Manual</h3>
              </div>
              <button
                onClick={() => setIsManualFormOpen(!isManualFormOpen)}
                className="text-xs text-emerald-400 font-semibold hover:underline"
              >
                {isManualFormOpen ? "Ocultar" : "Expandir"}
              </button>
            </div>

            {isManualFormOpen ? (
              <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">Título do Artigo</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Escreva o título sofisticado do artigo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">Categoria</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="NR-12">NR-12 Máquinas</option>
                      <option value="NR-13">NR-13 Caldeiras</option>
                      <option value="ART">ART / CREA</option>
                      <option value="Legislação">Legislação</option>
                      <option value="Projetos">Projetos Mecânicos</option>
                      <option value="Segurança">Segurança do Trabalho</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">Data Agendada</label>
                    <input
                      type="date"
                      required
                      value={manualPublishDate}
                      onChange={(e) => setManualPublishDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">Resumo Curto (Atração)</label>
                  <input
                    type="text"
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="Escreva 1 ou 2 frases curtas de atração"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">Conteúdo do Artigo (Formatado em Parágrafos e Seções)</label>
                  <textarea
                    rows={8}
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Escreva o texto sofisticado aqui. Use letras maiúsculas para títulos de seções e deixe linhas em branco entre parágrafos. NÃO use hashtags (#) ou asteriscos (*)."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] block mb-2">Imagem do Artigo</span>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setImageSourceType("file")}
                      className={`py-1.5 text-center text-[10px] uppercase font-mono font-bold tracking-wider rounded border transition-all ${
                        imageSourceType === "file"
                          ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                      }`}
                    >
                      Upload de Arquivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSourceType("url")}
                      className={`py-1.5 text-center text-[10px] uppercase font-mono font-bold tracking-wider rounded border transition-all ${
                        imageSourceType === "url"
                          ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                      }`}
                    >
                      Inserir Link (URL)
                    </button>
                  </div>

                  {imageSourceType === "file" ? (
                    <div className="space-y-3">
                      <div className="border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-colors flex flex-col items-center justify-center gap-1.5 bg-slate-950/40 text-center relative">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-[11px] text-slate-300 font-medium">Selecione uma imagem do seu dispositivo</span>
                        <span className="text-[9px] text-slate-500">Formatos recomendados: JPG, PNG • Max 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      {newImageUrl && newImageUrl.startsWith("data:image") && (
                        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-2 rounded-xl">
                          <img src={newImageUrl} className="w-12 h-12 rounded object-cover" alt="Preview" referrerPolicy="no-referrer" />
                          <div className="flex-grow min-w-0">
                            <p className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Arquivo Carregado</p>
                            <p className="text-[9px] text-slate-500 truncate">Imagem própria em base64</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewImageUrl("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60")}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Link da imagem (Ex: https://images.unsplash.com/...)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Salvar e Agendar Artigo
                </button>
              </form>
            ) : (
              <p className="text-slate-400 text-xs">
                Clique em expandir para redigir manualmente um artigo técnico completo para postagem agendada.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Chronological Feed and Calendaring */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Todos os Artigos & Cronograma</h3>
              </div>
              <button
                onClick={fetchAllAdminPosts}
                disabled={isRefreshing}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Atualizar Lista
              </button>
            </div>

            {/* List of articles */}
            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
              {allPosts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Nenhum artigo cadastrado ainda no banco de dados.
                </div>
              ) : (
                allPosts.map((post) => {
                  const pubDate = post.publishDate || post.date;
                  const isScheduled = pubDate > simulatedDate;
                  
                  return (
                    <div
                      key={post.id}
                      className={`border p-4.5 rounded-xl transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        isScheduled 
                          ? "bg-slate-950/60 border-slate-800 border-dashed text-slate-400" 
                          : "bg-slate-950 border-slate-800 text-slate-100 hover:border-slate-700"
                      }`}
                    >
                      <div className="space-y-2 flex-grow">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 uppercase font-bold">
                            {post.category}
                          </span>
                          
                          {/* Publish Status Badge */}
                          {isScheduled ? (
                            <span className="bg-amber-950 text-amber-400 border border-amber-900/60 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                              <Calendar className="w-3 h-3" />
                              AGENDADO PARA {pubDate}
                            </span>
                          ) : (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                              <Check className="w-3 h-3" />
                              PUBLICADO ({pubDate})
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm font-sans tracking-tight text-white leading-snug">
                          {post.title}
                        </h4>
                        
                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-1">
                          {post.summary}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => {
                            const today = new Date().toISOString().split("T")[0];
                            if (pubDate > today) {
                              alert(`Este post está AGENDADO para publicação em ${pubDate}.\n\nEle só ficará visível no blog público quando a data de publicação for menor ou igual à data de hoje, ou se você simular essa data no controle superior do painel.`);
                            } else {
                              alert(`Este post está PUBLICADO e visível no site público desde ${pubDate}.`);
                            }
                          }}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                          title="Informações de Publicação"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-red-900 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          title="Excluir Artigo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Simulated schedule verification summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <h4 className="font-semibold text-white flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                Como funciona o Cronograma de Agendamento?
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Artigos com data de publicação posterior à data selecionada no <strong className="text-slate-300">Simulador de Data Atual</strong> (cima, à direita) ficam ocultos para os visitantes e marcados como <strong className="text-amber-400">Agendados</strong>.
              </p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                No momento em que o relógio ultrapassar a data programada, o artigo torna-se automaticamente <strong className="text-emerald-400">Publicado</strong> e disponível para leitura geral.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
