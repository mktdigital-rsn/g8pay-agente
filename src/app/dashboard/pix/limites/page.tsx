
"use client";

import React, { useState } from "react";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  Smartphone,
  Gauge,
  Info,
  ChevronRight,
  Download,
  UploadCloud,
  FileText,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { toast } from "sonner";

export default function PixLimitesPage() {
  const [dayLimit, setDayLimit] = useState([5000]);
  const [nightLimit, setNightLimit] = useState([1000]);
  const [limits, setLimits] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fetchLimits = async () => {
      console.log("🔍 [LIMITS] Tentando buscar em /api/limits/buscar...");
      try {
        const res = await api.get("/api/limits/buscar");
        console.log("📦 [LIMITS] Conteúdo bruto da resposta:", res.data);
        
        // Estratégia de busca profunda no objeto (suporta flat, .data, ou .data.limites)
        const root = res.data;
        const nestedData = root?.data || root;
        const finalData = nestedData?.limites || nestedData;
        
        console.log("🎯 [LIMITS] Dados extraídos para mapeamento:", finalData);
        
        if (finalData) {
          setLimits(finalData);
          
          const dLimit = finalData.limiteDiurno ?? finalData.limite_diurno ?? finalData.limiteDiario;
          const nLimit = finalData.limiteNoturno ?? finalData.limite_noturno ?? finalData.nightLimit;
          
          if (dLimit !== undefined && dLimit !== null) {
            const val = Number(dLimit);
            console.log(`💰 [LIMITS] Aplicando Diurno: ${val}`);
            setDayLimit([val]);
          }
          
          if (nLimit !== undefined && nLimit !== null) {
            const val = Number(nLimit);
            console.log(`🌙 [LIMITS] Aplicando Noturno: ${val}`);
            setNightLimit([val]);
          }
        }
      } catch (err) {
        console.error("❌ [LIMITS] Falha total na requisição:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLimits();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    const payload = {
      limiteDiurno: Number(dayLimit[0]),
      limiteNoturno: Number(nightLimit[0]),
      limiteMesmoTitular: Number(limits?.limiteMesmoTitular || 5000)
    };

    console.log("📤 [LIMITS] Enviando atualização:", payload);
    try {
      await api.post("/api/limits/atualizar", payload);
      console.log("✨ [LIMITS] Limites atualizados com sucesso!");
      toast.success("Limites atualizados com sucesso!");
    } catch (err) {
      console.error("❌ [LIMITS] Erro na atualização:", err);
      toast.error("Erro ao atualizar limites. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  if (isLoading && !limits) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[var(--brand-accent)]/20 border-t-[var(--brand-accent)] rounded-full animate-spin" />
        <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando limites...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 xl:p-10 flex flex-col lg:flex-row gap-8 md:gap-10 h-full overflow-y-auto w-full no-scrollbar bg-[#f8f9fa] relative">
      {/* Main Content */}
      <div className="flex-1 space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/dashboard/pix">
              <button className="flex items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100 hover:shadow-lg h-12 w-12 md:h-14 md:w-14 transition-all group shrink-0">
                 <ArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-[var(--brand-accent)] group-hover:-translate-x-1 transition-transform" />
              </button>
            </Link>
            <div className="min-w-0">
               <div className="flex items-center gap-2 mb-1 flex-wrap">
                 <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-transparent font-black px-2 md:px-3 py-0.5 rounded-full text-[8px] md:text-[10px] uppercase tracking-widest leading-none">Segurança PIX</Badge>
                 <span className="text-[8px] md:text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none">Gestão de Valores</span>
               </div>
               <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-[#0c0a09] flex items-center gap-2 md:gap-3 uppercase group truncate">
                  Meus Limites
                  <Gauge className="h-6 w-6 md:h-8 md:w-8 text-[var(--brand-accent)] stroke-[2.5] group-hover:rotate-12 transition-transform duration-500 shrink-0" />
                </h1>
            </div>
          </div>
        </div>

        {/* Limits Controls Card */}
        <div className="bg-white rounded-lg p-6 md:p-8 border border-neutral-100 shadow-xl shadow-black/5 space-y-8">
           {/* Info Box */}
           <div className="bg-[var(--brand-accent)]/10 border border-orange-100 p-5 md:p-6 rounded-md flex flex-col sm:flex-row gap-4 items-start">
              <div className="bg-[var(--brand-accent)] p-2.5 rounded-md text-white shadow-lg shadow-orange-500/20 shrink-0">
                 <Info className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-[10px] md:text-xs font-black text-[#0c0a09] uppercase tracking-widest mb-1 leading-none">Sobre seus limites</p>
                 <p className="text-xs font-medium text-neutral-500 leading-relaxed font-sans">
                    Aumentos de limite levam de 24h a 48h para serem aprovados por questões de segurança. Reduções de limite são imediatas.
                 </p>
              </div>
           </div>

           {/* Limite Diário */}
           <div className="space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                    <h3 className="text-lg md:text-xl font-black text-[#0c0a09] tracking-tight">Limite Diário</h3>
                    <p className="text-[9px] md:text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Período: 06:00 às 20:00</p>
                 </div>
                 <div className="text-left sm:text-right">
                    <p className="text-2xl md:text-3xl font-black text-[var(--brand-accent)] font-mono tracking-tighter leading-none mb-1">{formatCurrency(dayLimit[0])}</p>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
                      Disponível: {formatCurrency(dayLimit[0] - (limits?.limiteDiarioUtilizado || limits?.limite_diario_utilizado || 0))}
                    </p>
                 </div>
              </div>
              <div className="px-2">
                 <Slider 
                   value={dayLimit} 
                   max={20000} 
                   step={100} 
                   onValueChange={setDayLimit}
                   className="[&_[role=slider]]:bg-[var(--brand-accent)] [&_[role=slider]]:border-[var(--brand-accent)] [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:shadow-xl [&_.relative]:h-1.5"
                 />
              </div>
           </div>

           <div className="h-px bg-neutral-100 w-full" />

           {/* Limite Noturno */}
           <div className="space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                    <div className="flex items-center gap-2">
                       <h3 className="text-lg md:text-xl font-black text-[#0c0a09] tracking-tight">Limite Noturno</h3>
                       <Badge className="bg-[#0c0a09] text-white rounded-sm px-2 py-0.5 text-[7px] md:text-[8px] font-black tracking-widest">ATIVO</Badge>
                    </div>
                    <p className="text-[9px] md:text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Período: 20:00 às 06:00</p>
                 </div>
                 <div className="text-left sm:text-right">
                    <p className="text-2xl md:text-3xl font-black text-[var(--brand-accent)] font-mono tracking-tighter leading-none mb-1">{formatCurrency(nightLimit[0])}</p>
                    <p className="text-[8px] md:text-[9px] text-[var(--brand-accent)] font-black uppercase tracking-widest opacity-60">Máximo Sugerido</p>
                 </div>
              </div>
              <div className="px-2">
                 <Slider 
                   value={nightLimit} 
                   max={5000} 
                   step={50} 
                   onValueChange={setNightLimit}
                   className="[&_[role=slider]]:bg-[var(--brand-accent)] [&_[role=slider]]:border-[var(--brand-accent)] [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:shadow-xl [&_.relative]:h-1.5"
                 />
              </div>
           </div>

           <div className="h-px bg-neutral-100 w-full" />

           {/* Aditional Safety Controls */}
           <div className="space-y-6">
              <h3 className="text-base md:text-lg font-black text-[#0c0a09] uppercase tracking-widest">Opções de Segurança</h3>
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                 {[
                   { icon: ShieldCheck, title: "Lista de Confiança", desc: "Contatos que não precisam de limites rígidos", active: true },
                   { icon: Clock, title: "Horário Noturno", desc: "Defina quando seu limite noturno começa", active: false },
                   { icon: Smartphone, title: "Biometria Ativa", desc: "Pedir biometria para todos os Pix acima de R$ 500", active: true },
                 ].map((item, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 md:p-6 bg-neutral-50 rounded-md border border-neutral-100 hover:bg-white hover:shadow-lg transition-all group cursor-pointer">
                      <div className="flex items-center gap-4 min-w-0">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-md flex items-center justify-center text-[var(--brand-accent)] shadow-sm group-hover:scale-105 transition-all shrink-0">
                            <item.icon className="h-5 w-5" />
                         </div>
                         <div className="min-w-0">
                            <p className="font-black text-sm md:text-base text-[#0c0a09] leading-tight tracking-tight truncate">{item.title}</p>
                            <p className="text-[8px] md:text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5 truncate">{item.desc}</p>
                         </div>
                      </div>
                      <Switch checked={item.active} className="data-[state=checked]:bg-[var(--brand-accent)] w-9 h-5 shrink-0" />
                   </div>
                 ))}
              </div>
           </div>

            <div className="h-px bg-neutral-100 w-full" />

            {/* Document Upload Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base md:text-lg font-black text-[#0c0a09] uppercase tracking-widest">Aumento de Limite Especial</h3>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Comprovação de Renda para Upgrades acima de R$ 20.000</p>
                </div>
                <Badge className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0 text-[8px] font-black uppercase tracking-widest px-3 py-1">Recomendado</Badge>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-neutral-200 rounded-lg p-10 flex flex-col items-center justify-center gap-4 hover:border-[var(--brand-accent)] hover:bg-orange-50/50 transition-all cursor-pointer overflow-hidden text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 bg-white rounded-md shadow-xl flex items-center justify-center text-neutral-300 group-hover:text-[var(--brand-accent)] group-hover:scale-110 transition-all relative z-10">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div className="relative z-10 space-y-2">
                  <p className="font-black text-sm text-[#0c0a09] uppercase tracking-tight">Arraste ou clique para anexar</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">PDF, JPG ou PNG (Máx. 10MB)</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newFiles = files.map(f => ({ name: f.name, size: (f.size / 1024 / 1024).toFixed(2), type: f.type }));
                    setAttachedFiles([...attachedFiles, ...newFiles]);
                    toast.success(`${files.length} documento(s) anexado(s) com sucesso!`);
                  }}
                />
              </div>

              {attachedFiles.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Documentos Selecionados ({attachedFiles.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-md border border-neutral-100 shadow-sm group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-sm flex items-center justify-center text-[var(--brand-accent)]">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-[#0c0a09] truncate max-w-[120px] uppercase tracking-tight">{file.name}</p>
                            <p className="text-[9px] font-bold text-neutral-400 uppercase">{file.size} MB</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttachedFiles(attachedFiles.filter((_, i) => i !== idx));
                          }}
                          className="p-2 text-neutral-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="w-full h-14 md:h-16 bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] hover:from-[#ea580c] hover:to-[var(--brand-accent)] text-white rounded-md font-black text-sm md:text-base uppercase tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95 font-sans"
            >
               {isLoading ? "Salvando..." : (attachedFiles.length > 0 ? "Enviar Solicitação com Anexos" : "Salvar Alterações")}
            </Button>
        </div>
      </div>

      {/* Side Column */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-6 pb-10">
        <Card className="rounded-md border-0 shadow-2xl bg-[var(--brand-accent)] p-6 md:p-8 text-white relative overflow-hidden group min-h-[260px] flex flex-col justify-between">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
           <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-md flex items-center justify-center backdrop-blur-md">
                 <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-black leading-tight tracking-tighter uppercase">Seguro Pix Elite</h3>
              <p className="text-[11px] md:text-xs font-medium text-white/90 leading-relaxed font-sans">Proteção contra coação e golpes digitais. Mensalidades a partir de R$ 9,90.</p>
           </div>
           <button className="relative z-10 text-[9px] font-black border-b-2 border-white uppercase tracking-[0.2em] self-start pb-1 hover:text-white/70 transition-colors">Saber Mais</button>
        </Card>

        <div className="p-6 md:p-8 bg-white rounded-md border border-neutral-100 shadow-xl shadow-black/5 space-y-6">
           <div className="flex items-center justify-between">
              <h4 className="font-black text-[#0c0a09] uppercase tracking-widest text-[9px] md:text-[10px]">Histórico Recente</h4>
              <button className="text-[8px] font-black text-[var(--brand-accent)] uppercase tracking-widest hover:underline">Ver Todos</button>
           </div>
           <div className="space-y-6">
              <div className="flex gap-4">
                 <div className="w-1 bg-[var(--brand-accent)] rounded-full" />
                 <div className="space-y-1">
                    <p className="text-xs font-black text-[#0c0a09] tracking-tight uppercase">Aumento de Limite</p>
                    <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest font-sans">02 Fev, 14:12</p>
                    <Badge variant="outline" className="mt-2 text-[7px] font-black uppercase text-blue-500 border-blue-100 bg-blue-50/50 px-2 rounded-sm">Em Análise</Badge>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
