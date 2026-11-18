import React from "react";
import { FileText } from "lucide-react";

const DEFAULT_LOGO_URL = "/jc_logo.jpg";

interface JCLogoProps {
  type?: string;
  customLogoUrl?: string;
  className?: string;
  showText?: boolean;
  logoText?: string;
  logoSubtext?: string;
  isDarkText?: boolean;
  logoScale?: number;
  logoBg?: "white" | "transparent" | "dark";
}

export default function JCLogo({
  type = "Flyer Gear",
  customLogoUrl = "",
  className = "w-10 h-10",
  showText = false,
  logoText = "JC EVOLUTION",
  logoSubtext = "MECÂNICA",
  isDarkText = false,
  logoScale = 100,
  logoBg
}: JCLogoProps) {
  const primaryColor = isDarkText ? "#0D2B4D" : "#FFFFFF";
  const textClass = isDarkText ? "text-[#0D2B4D]" : "text-white";
  const subtextClass = isDarkText ? "text-[#155E54] font-bold" : "text-emerald-400 font-black";
  const lineClass = isDarkText ? "bg-[#155E54]" : "bg-emerald-500";
  const activeLogoSrc = customLogoUrl || DEFAULT_LOGO_URL;

  if (type === "Custom Image" && customLogoUrl) {
    const isPdf = customLogoUrl.startsWith("data:application/pdf") || customLogoUrl.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      return (
        <div className="flex items-center gap-3">
          <div className={`${className} bg-red-950/40 border border-red-800 rounded-lg flex flex-col items-center justify-center p-1 text-red-400 font-sans font-bold text-[8px] shrink-0 shadow-md`}>
            <FileText className="w-4 h-4 text-red-500 mb-0.5" />
            <span>PDF LOGO</span>
          </div>
          {showText && (
            <div className="text-left">
              <h1 className={`text-sm font-black tracking-tight ${textClass} uppercase`}>{logoText}</h1>
              <p className={`text-[9px] font-bold tracking-widest ${subtextClass} font-mono uppercase`}>{logoSubtext}</p>
            </div>
          )}
        </div>
      );
    }

    // Determine background style based on logoBg or isDarkText fallback
    let bgClasses = "bg-white border-slate-200/60";
    if (logoBg === "transparent") {
      bgClasses = "bg-transparent border-transparent shadow-none";
    } else if (logoBg === "dark") {
      bgClasses = "bg-slate-900 border-slate-700/30";
    } else if (logoBg === "white") {
      bgClasses = "bg-white border-slate-200/60 shadow-sm";
    } else {
      // Fallback
      bgClasses = isDarkText ? "bg-white border-slate-200/60 shadow-sm" : "bg-slate-900 border-slate-700/30";
    }

    return (
      <div className="flex items-center gap-3">
        <div className={`${bgClasses} border p-1 rounded-md shrink-0 flex items-center justify-center overflow-hidden`} style={{ width: "3.5rem", height: "3.5rem" }}>
          <img
            src={activeLogoSrc}
            alt={logoText || "JC Logo"}
            className="object-contain rounded-sm max-w-full max-h-full"
            style={{ transform: `scale(${(logoScale || 100) / 100})`, transformOrigin: "center", width: "100%", height: "100%" }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/jc_logo.jpg";
            }}
          />
        </div>
        {showText && (
          <div className="text-left flex flex-col justify-center">
            <h1 className={`text-base font-black tracking-tight ${textClass} uppercase leading-tight`}>{logoText}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-[1px] w-4 ${lineClass}`} />
              <p className={`text-[9px] font-black tracking-widest ${subtextClass} font-mono uppercase leading-none`}>{logoSubtext}</p>
              <span className={`h-[1px] w-4 ${lineClass}`} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === "Standard Badge") {
    return (
      <div className="flex items-center gap-3">
        <div className={`relative ${className} bg-slate-900 border border-emerald-500 rounded-lg flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-md`}>
          J<span className="text-emerald-400">C</span>
          <div className="absolute -bottom-0.5 w-full h-0.5 bg-emerald-500" />
        </div>
        {showText && (
          <div className="text-left flex flex-col justify-center">
            <h1 className={`text-base font-black tracking-tight ${textClass} uppercase leading-tight`}>{logoText}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-[1px] w-4 ${lineClass}`} />
              <p className={`text-[9px] font-black tracking-widest ${subtextClass} font-mono uppercase leading-none`}>{logoSubtext}</p>
              <span className={`h-[1px] w-4 ${lineClass}`} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT & "Flyer Gear": High-Resolution 3D Metallic JC Evolution Logo Emblem
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${className} shrink-0 flex items-center justify-center overflow-hidden`}>
        <img
          src={activeLogoSrc}
          alt={logoText || "JC Evolution Engenharia Mecânica"}
          className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.16)] transition-transform duration-200 hover:scale-105"
          style={{
            transform: logoScale && logoScale !== 100 ? `scale(${logoScale / 100})` : undefined,
            transformOrigin: "center"
          }}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/jc_logo.jpg";
          }}
        />
      </div>

      {showText && (
        <div className="text-left flex flex-col justify-center">
          <h1 className={`text-base font-black tracking-tight ${textClass} uppercase leading-tight`}>{logoText}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-[1px] w-4 ${lineClass}`} />
            <p className={`text-[9px] font-black tracking-widest ${subtextClass} font-mono uppercase leading-none`}>{logoSubtext}</p>
            <span className={`h-[1px] w-4 ${lineClass}`} />
          </div>
        </div>
      )}
    </div>
  );
}
