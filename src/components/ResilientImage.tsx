import React, { useState, useEffect, useRef } from "react";
import { User, HardHat, Shield, ImageOff, RefreshCw } from "lucide-react";

export interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  fallbackSrc?: string;
  fallbackType?: "engineer" | "user" | "generic";
  maxRetries?: number;
  baseDelayMs?: number;
  className?: string;
  containerClassName?: string;
  showRetryIndicator?: boolean;
  iconSize?: "sm" | "md" | "lg" | "xl";
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt = "Imagem",
  fallbackSrc,
  fallbackType = "generic",
  maxRetries = 4,
  baseDelayMs = 1000,
  className = "w-full h-full object-cover",
  containerClassName = "w-full h-full",
  showRetryIndicator = false,
  iconSize = "md",
  onError: userOnError,
  onLoad: userOnLoad,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [hasTriedFallback, setHasTriedFallback] = useState<boolean>(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to generate cache-busting URL for exponential retries
  const getRetryUrl = (originalUrl: string, attempt: number) => {
    try {
      const url = new URL(originalUrl, window.location.href);
      url.searchParams.set("_retry", attempt.toString());
      url.searchParams.set("_t", Date.now().toString());
      return url.toString();
    } catch {
      const separator = originalUrl.includes("?") ? "&" : "?";
      return `${originalUrl}${separator}_retry=${attempt}&_t=${Date.now()}`;
    }
  };

  // Reset state when `src` or `fallbackSrc` prop changes
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!src || src.trim() === "") {
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasTriedFallback(true);
        setIsLoading(true);
        setIsError(false);
      } else {
        setIsError(true);
        setIsLoading(false);
      }
      return;
    }

    setCurrentSrc(src);
    setIsLoading(true);
    setIsError(false);
    setRetryCount(0);
    setIsRetrying(false);
    setHasTriedFallback(false);
  }, [src, fallbackSrc]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (userOnError) {
      userOnError(e);
    }

    // Check if we can retry with exponential backoff
    if (retryCount < maxRetries && currentSrc && !hasTriedFallback) {
      const nextAttempt = retryCount + 1;
      // Exponential delay: baseDelayMs * 2^(retryCount) => 1s, 2s, 4s, 8s...
      const delay = baseDelayMs * Math.pow(2, retryCount);

      setIsRetrying(true);
      setIsLoading(true);

      timeoutRef.current = setTimeout(() => {
        setRetryCount(nextAttempt);
        setCurrentSrc(getRetryUrl(src || currentSrc, nextAttempt));
        setIsRetrying(false);
      }, delay);
    } else if (fallbackSrc && !hasTriedFallback) {
      // Try fallback image URL if available
      setHasTriedFallback(true);
      setRetryCount(0);
      setIsRetrying(false);
      setIsLoading(true);
      setCurrentSrc(fallbackSrc);
    } else {
      // Max retries reached or no fallback URL available
      setIsLoading(false);
      setIsError(true);
      setIsRetrying(false);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    setIsError(false);
    setIsRetrying(false);
    if (userOnLoad) {
      userOnLoad(e);
    }
  };

  const manualRetry = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsError(false);
    setIsLoading(true);
    setRetryCount(0);
    setHasTriedFallback(false);
    if (src) {
      setCurrentSrc(getRetryUrl(src, Date.now() % 1000));
    }
  };

  // Render Fallback Icon UI when image fails completely after all retries
  const renderFallbackIcon = () => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-8 h-8",
      lg: "w-12 h-12",
      xl: "w-16 h-16",
    }[iconSize];

    if (fallbackType === "engineer") {
      return (
        <div className="w-full h-full min-h-[140px] bg-slate-900 border border-slate-700/50 rounded-xl flex flex-col items-center justify-center p-4 text-center select-none shadow-inner">
          <div className="w-12 h-12 rounded-full bg-[#155E54]/20 border border-[#155E54]/40 flex items-center justify-center text-emerald-400 mb-2 shadow-sm">
            <HardHat className={sizeClasses} />
          </div>
          <span className="text-xs font-bold text-slate-100">Eng. Josnei da Cunha</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5">Responsável Técnico</span>
          <button
            type="button"
            onClick={manualRetry}
            className="mt-2 text-[10px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer bg-slate-800/90 px-2.5 py-1 rounded border border-slate-700"
            title="Tentar recarregar foto"
          >
            <RefreshCw className="w-3 h-3" /> Recarregar Foto
          </button>
        </div>
      );
    }

    if (fallbackType === "user") {
      return (
        <div className="w-full h-full min-h-[36px] bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-300">
          <User className={sizeClasses} />
        </div>
      );
    }

    return (
      <div className="w-full h-full min-h-[80px] bg-slate-900 border border-slate-800 rounded-lg flex flex-col items-center justify-center p-3 text-slate-400">
        <ImageOff className={`${sizeClasses} mb-1 opacity-60`} />
        <span className="text-[10px] font-mono text-slate-500">Imagem Indisponível</span>
        <button
          type="button"
          onClick={manualRetry}
          className="mt-1 text-[10px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-2.5 h-2.5" /> Re-tentar
        </button>
      </div>
    );
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Loading / Retry Skeleton state */}
      {isLoading && !isError && (
        <div className="absolute inset-0 z-10 bg-slate-800/80 backdrop-blur-xs animate-pulse flex flex-col items-center justify-center p-2">
          {retryCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-slate-950/90 px-2 py-1 rounded border border-emerald-500/30 shadow-md">
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
              <span>Reconectando ({retryCount}/{maxRetries})...</span>
            </div>
          )}
        </div>
      )}

      {/* Render Image or Error Placeholder */}
      {!isError && currentSrc ? (
        <img
          {...props}
          src={currentSrc}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          referrerPolicy="no-referrer"
        />
      ) : (
        renderFallbackIcon()
      )}

      {/* Small badge if retrying in background */}
      {showRetryIndicator && isRetrying && (
        <div className="absolute top-2 right-2 z-20 bg-slate-950/90 text-emerald-400 text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1 shadow">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
          <span>Tentativa {retryCount}</span>
        </div>
      )}
    </div>
  );
};

export default ResilientImage;
