import React from "react";
import { FileText } from "lucide-react";

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
            src={customLogoUrl}
            alt="JC Logo"
            className="object-contain rounded-sm max-w-full max-h-full"
            style={{ transform: `scale(${(logoScale || 100) / 100})`, transformOrigin: "center", width: "100%", height: "100%" }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              // fallback if URL fails
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&auto=format&fit=crop&q=60";
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

  // DEFAULT: "Flyer Gear" - Styled matching the physical flyer
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${className} shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          {/* Subtle glow / shadow background layer for a premium look */}
          <circle cx="50" cy="50" r="48" fill="rgba(16, 185, 129, 0.02)" />

          {/* Left Gear (Teal/Emerald and White) */}
          <g className="text-emerald-500">
            {/* Gear body ring */}
            <circle cx="33" cy="50" r="22" stroke="currentColor" strokeWidth="5.5" />
            <circle cx="33" cy="50" r="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" className="opacity-60" />
            
            {/* Thick professional gear teeth (trapezoidal/rectangular) */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <path
                key={angle}
                d="M 33 24 L 33 16"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="butt"
                transform={`rotate(${angle} 33 50)`}
              />
            ))}
          </g>

          {/* Elegant Lowercase 'j' with mint/emerald shadow/offset as in the high-res screenshot */}
          {/* Background offset/outline of J (emerald-400) */}
          <path
            d="M 52 24 L 62 24 L 62 64 C 62 73 56 78 47 78 C 42 78 37 76 34 72 L 40 66 C 42 68 44 70 47 70 C 51 70 53 68 53 64 L 53 32 L 48 32 L 48 24 Z"
            fill="#10b981"
            transform="translate(-1, 1)"
            className="opacity-90"
          />
          {/* Main White Body of J */}
          <path
            d="M 52 24 L 62 24 L 62 64 C 62 73 56 78 47 78 C 42 78 37 76 34 72 L 40 66 C 42 68 44 70 47 70 C 51 70 53 68 53 64 L 53 32 L 48 32 L 48 24 Z"
            fill={primaryColor}
          />

          {/* Elegant 'C' on the right side */}
          {/* C Body: Outer Arc and Inner Arc */}
          <path
            d="M 83 36 C 79 30 72 26 63 26 C 49 26 39 37 39 51 C 39 65 49 76 63 76 C 72 76 79 72 83 66 L 76 60 C 73 64 69 67 63 67 C 54 67 48 60 48 51 C 48 42 54 35 63 35 C 69 35 73 38 76 42 Z"
            fill={primaryColor}
          />

          {/* Technical target crosshair overlay inside the 'C' center (centered around 63, 51) */}
          <circle cx="63" cy="51" r="13" stroke={primaryColor} strokeWidth="1.5" />
          <circle cx="63" cy="51" r="4.5" stroke={primaryColor} strokeWidth="1.2" />
          <line x1="46" y1="51" x2="80" y2="51" stroke={primaryColor} strokeWidth="1.2" />
          <line x1="63" y1="34" x2="63" y2="68" stroke={primaryColor} strokeWidth="1.2" />
          {/* Center tiny square target mark */}
          <rect x="62" y="50" width="2" height="2" fill="#10b981" />
        </svg>
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
