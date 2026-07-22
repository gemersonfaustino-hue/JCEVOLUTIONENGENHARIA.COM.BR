import React from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert, Database } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearCache = () => {
    if (confirm("Deseja limpar os dados do navegador? Isso pode resolver inconsistências de estado armazenado.")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-900 border-2 border-red-500/30 rounded-2xl p-6 md:p-8 space-y-6 max-w-3xl mx-auto my-8 font-sans shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {this.props.fallbackTitle || "Ops! Ocorreu um erro ao carregar este componente"}
              </h3>
              <p className="text-slate-400 text-xs">
                O painel encontrou uma exceção não tratada durante a renderização. Não se preocupe, o restante do portal continua seguro.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>DETALHES DO ERRO:</span>
            </div>
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto bg-slate-950 p-2 rounded max-h-48 border border-red-950/20">
              {this.state.error?.toString()}
            </pre>
            {this.state.errorInfo?.componentStack && (
              <details className="mt-2 text-[10px] text-slate-500 font-mono">
                <summary className="cursor-pointer hover:text-slate-300 transition-colors select-none">
                  Ver pilha de renderização do componente
                </summary>
                <pre className="mt-2 p-2 bg-slate-950 rounded border border-slate-900 overflow-x-auto whitespace-pre max-h-32">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md hover:shadow-emerald-500/10 flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Painel
            </button>

            <button
              onClick={this.handleClearCache}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              Limpar Cache e Sair
            </button>

            <a
              href="/"
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 font-medium text-xs rounded-xl flex items-center gap-2 transition-all"
            >
              <Home className="w-4 h-4" />
              Voltar ao Início
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
