"use client";

import React, { useState } from "react";
import { 
  Plane, 
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AereoPage() {
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  return (
    <div className="bg-[#f8f9fa] rounded-[4px] p-6 md:p-10 border border-neutral-200/60 space-y-10 relative">
      {/* Background Decorativo */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[var(--brand-accent)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 relative z-10">
        <div className="space-y-4">
          <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0 px-3 py-1 font-black text-[10px] uppercase tracking-[0.2em]">Lazer & Turismo</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none uppercase flex items-center gap-3">
            Passagens <span className="text-[var(--brand-accent)]">Aéreas</span>
            <Plane className="h-10 w-10 text-[var(--brand-accent)] stroke-[2.5]" />
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-bold max-w-2xl">
            Pesquise e reserve voos nacionais e internacionais com tarifas exclusivas G8.
          </p>
        </div>
      </header>

      {/* Main Container - 100% WIDTH FOR MAXIMUM BEAUTY */}
      <div className="space-y-10 relative z-10 w-full">
        <div className="w-full space-y-8">
          <div className="relative w-full h-[85vh] min-h-[600px] bg-white border border-neutral-200/80 rounded-[8px] overflow-hidden shadow-sm">
            {isIframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 space-y-4">
                <div className="w-12 h-12 border-4 border-[var(--brand-accent)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-black uppercase tracking-widest text-[var(--brand-accent)] animate-pulse">
                  Conectando ao Portal de Passagens...
                </span>
              </div>
            )}
            <iframe
              src="https://airsearch-iframe.portaldaagencia.com.br/external/rsnbrasil"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
              onLoad={() => setIsIframeLoading(false)}
              title="Busca de Passagens Aéreas"
              allow="geolocation; microphone; camera"
            />
          </div>

          {/* Notícias sobre Turismo Section */}
          <div className="space-y-6 pt-8 border-t border-neutral-200 w-full">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-neutral-900 tracking-tight">
                Notícias sobre Turismo
              </h2>
              <p className="text-xs text-neutral-400 font-black uppercase tracking-widest">
                PoweredBy G1 - Turismo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              
              {/* News Card 1 */}
              <div className="bg-white border border-neutral-200 rounded-[4px] overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer w-full">
                <div className="h-44 bg-neutral-100 relative overflow-hidden flex items-center justify-center text-5xl">
                  🏝️
                  <div className="absolute inset-0 bg-neutral-900/10 group-hover:bg-neutral-900/0 transition-all duration-300" />
                </div>
                <div className="p-6 space-y-3">
                  <Badge className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-transparent font-black px-2.5 py-1 rounded-[2px] text-[9px] uppercase tracking-widest">Especial</Badge>
                  <h3 className="font-black text-[#0c0a09] text-base leading-snug group-hover:text-[var(--brand-accent)] transition-colors">
                    As 10 praias mais bonitas e isoladas das Maldivas para visitar in 2026
                  </h3>
                  <p className="text-sm text-neutral-500 font-medium line-clamp-2 leading-relaxed">
                    Confira o roteiro de luxo exclusivo preparado pela equipe G8 Elite Travel com suporte do Concierge Premium.
                  </p>
                  <div className="flex items-center gap-1 text-xs font-black text-[var(--brand-accent)] uppercase tracking-widest pt-2">
                    Ler Artigo <ChevronRight size={14} />
                  </div>
                </div>
              </div>

              {/* News Card 2 */}
              <div className="bg-white border border-neutral-200 rounded-[4px] overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer w-full">
                <div className="h-44 bg-neutral-100 relative overflow-hidden flex items-center justify-center text-5xl">
                  🛫
                  <div className="absolute inset-0 bg-neutral-900/10 group-hover:bg-neutral-900/0 transition-all duration-300" />
                </div>
                <div className="p-6 space-y-3">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-transparent font-black px-2.5 py-1 rounded-[2px] text-[9px] uppercase tracking-widest">G8 Lounge</Badge>
                  <h3 className="font-black text-[#0c0a09] text-base leading-snug group-hover:text-[var(--brand-accent)] transition-colors">
                    Novos Lounges VIP do G8 Bank inauguram em Paris (CDG) e Frankfurt
                  </h3>
                  <p className="text-sm text-neutral-500 font-medium line-clamp-2 leading-relaxed">
                    Clientes com o cartão digital G8 Lounge Premium terão entrada prioritária e gratuita nas novas salas parceiras.
                  </p>
                  <div className="flex items-center gap-1 text-xs font-black text-[var(--brand-accent)] uppercase tracking-widest pt-2">
                    Ler Artigo <ChevronRight size={14} />
                  </div>
                </div>
              </div>

              {/* News Card 3 */}
              <div className="bg-white border border-neutral-200 rounded-[4px] overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer w-full">
                <div className="h-44 bg-neutral-100 relative overflow-hidden flex items-center justify-center text-5xl">
                  🇪🇺
                  <div className="absolute inset-0 bg-neutral-900/10 group-hover:bg-neutral-900/0 transition-all duration-300" />
                </div>
                <div className="p-6 space-y-3">
                  <Badge className="bg-neutral-100 text-neutral-500 border-transparent font-black px-2.5 py-1 rounded-[2px] text-[9px] uppercase tracking-widest">Turismo</Badge>
                  <h3 className="font-black text-[#0c0a09] text-base leading-snug group-hover:text-[var(--brand-accent)] transition-colors">
                    Eurotrip 2026: Dicas de planejamento financeiro para sua viagem de férias
                  </h3>
                  <p className="text-sm text-neutral-500 font-medium line-clamp-2 leading-relaxed">
                    Como utilizar o cashback de cartões e o câmbio global do G8 Bank para economizar em hospedagens e passagens.
                  </p>
                  <div className="flex items-center gap-1 text-xs font-black text-[var(--brand-accent)] uppercase tracking-widest pt-2">
                    Ler Artigo <ChevronRight size={14} />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
