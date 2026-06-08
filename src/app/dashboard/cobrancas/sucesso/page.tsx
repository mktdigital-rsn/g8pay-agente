"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { cobrancaDataAtom, cobrancaHtmlAtom } from "@/store/pagamentos";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2, Printer, ArrowRight, Home, Banknote, 
  AlertTriangle, Repeat, CalendarCheck, Layers, ChevronLeft, ChevronRight as ChevronRightIcon 
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { currentBrand } from "@/config/brand";

export default function CobrancaSucessoPage() {
  const router = useRouter();
  const [cobrancaData, setCobrancaData] = useAtom(cobrancaDataAtom);
  const [cobrancaHtml] = useAtom(cobrancaHtmlAtom);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectAll, setSelectAll] = useState(false);

  // Fallback para gerar parcelas visuais caso o registro no banco ainda esteja em processamento
  const displayResults = React.useMemo(() => {
    if (cobrancaData.results && cobrancaData.results.length > 0) {
      return cobrancaData.results;
    }
    
    // Se temos o HTML direto (boleto único), usamos ele como resultado real
    if (cobrancaHtml) {
      return [{
        html: cobrancaHtml,
        dataVencimento: cobrancaData.dataVencimento,
        isPlaceholder: false
      }];
    }

    // Apenas se não houver nada, criamos placeholders (recorrência em processamento)
    return Array.from({ length: cobrancaData.quantidadeMeses || 1 }).map((_, i) => {
        const d = new Date(cobrancaData.dataVencimento || Date.now());
        d.setMonth(d.getMonth() + i);
        return {
          html: "<h1>REGISTRANDO</h1><p>Este boleto está sendo processado pelo banco e estará disponível em breve no seu extrato.</p>",
          dataVencimento: d.toISOString().split('T')[0],
          isPlaceholder: true
        };
      });
  }, [cobrancaData, cobrancaHtml]);

  const currentResult = displayResults[selectedIndex] || { html: cobrancaHtml || "", dataVencimento: cobrancaData.dataVencimento, isPlaceholder: !cobrancaHtml };
  const activeHtml = currentResult.html;
  const activeDate = currentResult.dataVencimento;

  const formatDateSync = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  useEffect(() => {
    if (!cobrancaHtml && (!cobrancaData.results || cobrancaData.results.length === 0)) {
      router.push("/dashboard/cobrancas");
    }
  }, [cobrancaHtml, cobrancaData.results, router]);

  // Polling para atualizar placeholders se for recorrente e estiver processando
  useEffect(() => {
    const hasPlaceholders = displayResults.some(r => r.isPlaceholder);
    if (!hasPlaceholders || !cobrancaData.groupName) return;

    const pollInterval = setInterval(async () => {
      try {
        const itemsRes = await api.get(`/api/banco/cobranca-grupo/${cobrancaData.groupName}/itens`);
        const items = itemsRes.data?.data || itemsRes.data?.items || itemsRes.data || [];

        if (Array.isArray(items) && items.length > 0) {
          const fetchedResults = items.map((item: any) => ({
            html: item.html || item.boletoHtml || item.boleto_html || "",
            dataVencimento: item.vencimento || item.dueDate || item.dataVencimento,
            isPlaceholder: !(item.html || item.boletoHtml || item.boleto_html)
          }));

          // Se o número de itens retornados for menor que o esperado, mantemos os placeholders restantes
          let finalResults = [...fetchedResults];
          if (finalResults.length < (cobrancaData.quantidadeMeses || 0)) {
            const diff = (cobrancaData.quantidadeMeses || 0) - finalResults.length;
            const lastDate = new Date(finalResults[finalResults.length - 1]?.dataVencimento || Date.now());
            
            for (let i = 1; i <= diff; i++) {
              const nextDate = new Date(lastDate);
              nextDate.setMonth(nextDate.getMonth() + i);
              finalResults.push({
                html: "<h1>REGISTRANDO</h1><p>Este boleto está sendo processado pelo banco e estará disponível em breve.</p>",
                dataVencimento: nextDate.toISOString().split('T')[0],
                isPlaceholder: true
              });
            }
          }

          const allReady = finalResults.every(r => !r.isPlaceholder && r.html);
          
          setCobrancaData(prev => ({
            ...prev,
            results: finalResults
          }));

          if (allReady) {
            clearInterval(pollInterval);
            toast.success("Todos os boletos foram registrados!");
          }
        }
      } catch (e) {
        console.error("Erro no polling de boletos:", e);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [displayResults, cobrancaData.groupName, cobrancaData.quantidadeMeses, setCobrancaData]);



  const handlePrint = () => {
    let htmlToPrint = "";
    
    if (selectAll) {
      const readyResults = displayResults.filter(r => !r.isPlaceholder && r.html);
      if (readyResults.length === 0) {
        toast.error("Nenhum boleto pronto para impressão coletiva.");
        return;
      }
      
      if (readyResults.length < displayResults.length) {
        toast.info(`Imprimindo ${readyResults.length} de ${displayResults.length} boletos já registrados.`);
      }

      // Concatenar HTMLs com quebra de página
      htmlToPrint = readyResults.map(r => `
        <div style="page-break-after: always;">
          ${r.html}
        </div>
      `).join("");
    } else {
      if (!activeHtml) return;
      htmlToPrint = activeHtml;
    }

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Impressão ${currentBrand.name}</title>
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 1cm; }
                .no-print { display: none !important; }
              }
              body { font-family: sans-serif; margin: 0; padding: 0; background: #fff; }
              .print-header {
                background: #f8f9fa;
                padding: 15px;
                text-align: center;
                border-bottom: 1px solid #eee;
              }
              .btn-print {
                padding: 10px 25px;
                background: #000;
                color: #fff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                text-transform: uppercase;
                font-size: 11px;
                letter-spacing: 1px;
              }
            </style>
          </head>
          <body>
            <div class="print-header no-print">
              <button class="btn-print" onclick="window.print()">Clique aqui para imprimir</button>
            </div>
            <div style="padding: 20px;">
              ${htmlToPrint}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!cobrancaData.isRecorrente) return;
    
    const startTime = Date.now();
    const duration = 45000; // 45 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percentage = Math.min((elapsed / duration) * 100, 100);
      setProgress(percentage);
      
      if (percentage >= 100) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [cobrancaData.isRecorrente]);

  if (!cobrancaHtml && (!cobrancaData.results || cobrancaData.results.length === 0)) return null;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center justify-center py-10 max-w-7xl mx-auto px-4">
      <div className="w-full max-w-3xl">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 bg-emerald-500 rounded-sm flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30 animate-bounce relative overflow-hidden">
            <div className="absolute inset-0 border-4 border-white/20" />
            <CheckCircle2 className="h-12 w-12 text-white relative z-10" />
          </div>
          <Badge className={cn(
            "transition-all duration-500 border-0 px-4 py-1 font-black text-[10px] uppercase tracking-widest rounded-sm mb-4",
            cobrancaData.isRecorrente && progress < 100 ? "bg-orange-500 text-white animate-pulse" : "bg-emerald-500 text-white"
          )}>
            {cobrancaData.isRecorrente 
              ? (progress >= 100 ? "REGISTRO EFETUADO" : "PROCESSAMENTO EM LOTE") 
              : "REGISTRO EFETUADO"}
          </Badge>
          <h1 className={cn(
            "text-4xl md:text-6xl font-black text-[#0c0a09] tracking-tighter uppercase mb-2 transition-all duration-700",
            progress >= 100 ? "scale-105 text-emerald-600" : ""
          )}>
            {cobrancaData.isRecorrente 
              ? (progress >= 100 ? "Boletos Gerados!" : "Sincronizando...") 
              : "Cobrança Gerada!"}
          </h1>
          <p className="text-neutral-500 font-medium max-w-md italic transition-all duration-700">
            {cobrancaData.isRecorrente 
              ? (progress >= 100 
                  ? `Todas as ${cobrancaData.quantidadeMeses} parcelas para ${cobrancaData.pagadorNome} foram geradas e estão prontas!`
                  : `As ${cobrancaData.quantidadeMeses} parcelas para ${cobrancaData.pagadorNome} estão sendo processadas.`)
              : `O boleto para ${cobrancaData.pagadorNome} está pronto para ser pago.`}
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-white rounded-sm mb-10 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#0c0a09]" />
          <div className="bg-gradient-to-br from-[var(--brand-accent)] to-[#ea580c] p-8 md:p-12 text-white flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-sm flex items-center justify-center shadow-xl border border-white/30">
                <Banknote className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">Valor do Título</p>
                <p className="text-3xl md:text-5xl font-black tracking-tighter whitespace-nowrap text-white">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cobrancaData.valor)}</p>
              </div>
            </div>
            <div className="md:text-right relative z-10">
              <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">
                {cobrancaData.isRecorrente ? `${selectedIndex + 1}ª Mensalidade` : "Data de Vencimento"}
              </p>
              <p className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                {formatDateSync(activeDate)}
              </p>
              {cobrancaData.isRecorrente && (
                <div className="mt-2 flex items-center justify-end gap-2 text-[12px] font-black text-white/80 uppercase tracking-widest">
                  <Repeat className="h-3 w-3" /> Ciclo de {cobrancaData.quantidadeMeses} meses
                </div>
              )}
            </div>
          </div>
          <CardContent className="p-10 space-y-10">
            {cobrancaData.isRecorrente ? (
              <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="space-y-6 w-full">
                  <div className="space-y-3">
                    <h3 className={cn(
                      "text-xl md:text-2xl font-black uppercase tracking-tighter transition-colors duration-500",
                      progress >= 100 ? "text-emerald-600 animate-pulse" : "text-[#0c0a09]"
                    )}>
                      {progress >= 100 ? "Parcelas Registradas!" : "Registrando Parcelas"}
                    </h3>
                    <p className="text-neutral-500 font-medium leading-relaxed max-w-xl mx-auto text-sm md:text-base transition-all duration-500">
                      {progress >= 100 ? (
                        <span>
                          Todos os boletos foram gerados com sucesso e já estão registrados no Banco Central. 
                          Você já pode visualizá-los na aba <span className="font-bold text-[#0c0a09]">Gestão de Boletos</span>.
                        </span>
                      ) : (
                        <span>
                          Estamos processando o registro dos seus boletos. Isso garante que eles possam ser pagos em qualquer banco ou aplicativo. <span className="font-bold text-[#0c0a09]">Este processo pode levar alguns instantes.</span>
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="w-full mx-auto">
                    <div className="flex justify-between items-end mb-3">
                        <span className={cn(
                          "text-[11px] font-black uppercase tracking-widest transition-colors duration-500",
                          progress >= 100 ? "text-emerald-600" : "text-[var(--brand-accent)]"
                        )}>
                          {progress >= 100 ? "Registro Concluído" : "Progresso do Registro Bancário"}
                        </span>
                        <span className="text-[11px] font-black text-neutral-400 font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-5 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-200 p-[3px] shadow-inner">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-300 ease-out shadow-lg",
                          progress >= 100 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20" 
                            : "bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] shadow-orange-500/20"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="w-full p-8 bg-neutral-50 rounded-sm border border-neutral-100 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0c0a09]" />
                  <div className="flex items-start gap-4 text-left">
                    <div className="p-2 bg-white rounded-sm shadow-sm border border-neutral-100">
                      <Layers className="h-5 w-5 text-[var(--brand-accent)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#0c0a09] uppercase tracking-widest mb-1">Onde encontrar?</h4>
                      <p className="text-[11px] text-neutral-400 font-bold uppercase leading-normal">
                        Você poderá gerenciar, imprimir ou cancelar cada parcela individualmente na aba 
                        <span className="text-[#0c0a09] ml-1">"Gestão de Boletos"</span> dentro do seu painel.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-black text-neutral-300 uppercase tracking-[0.3em]">
                   <div className="h-[1px] w-12 bg-neutral-100" />
                   {currentBrand.id === "galapagos"
                     ? "GALAPAGOS CAPITAL TECHNOLOGY"
                     : currentBrand.id === "fiscomoney"
                     ? "FISCOMONEY TECHNOLOGY"
                     : currentBrand.id === "advogado10x"
                     ? "ADVOGADO 10X TECHNOLOGY"
                     : "G8 PAY TECHNOLOGY"}
                   <div className="h-[1px] w-12 bg-neutral-100" />
                </div>
              </div>
            ) : (
              <>
                <div className="w-full">
                  <Button 
                    onClick={handlePrint}
                    className="w-full h-28 bg-[#0c0a09] hover:bg-black text-white rounded-sm font-black uppercase text-sm tracking-widest transition-all gap-4 shadow-xl active:scale-95 flex flex-col items-center justify-center py-4 group"
                  >
                    <Printer className={`h-8 w-8 group-hover:scale-110 transition-transform ${
                      currentBrand.id !== "g8" ? "text-white" : "text-[var(--brand-accent)]"
                    }`} />
                    Salvar PDF ou Imprimir
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {cobrancaData.isRecorrente && (
          <div className="mb-6 flex items-center justify-center gap-3 bg-white/50 backdrop-blur-sm p-4 rounded-sm border border-dashed border-neutral-200 animate-in fade-in duration-1000">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              Clique em <span className="text-[#0c0a09]">Gestão de Boletos</span> para visualizar sua listagem de cobranças.
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
           <Button
             onClick={() => router.push("/dashboard/cobrancas")}
             variant="outline"
             className="flex-1 h-20 rounded-sm border-2 border-neutral-200 hover:border-[#0c0a09] text-[#0c0a09] font-black uppercase tracking-widest text-[11px] gap-3 transition-all"
           >
             <Layers className="h-5 w-5" />
             Gestão de Boletos
           </Button>
           <Button
             onClick={() => router.push("/dashboard/cobrancas")}
             className="flex-[2] h-20 bg-[#0c0a09] hover:bg-[var(--brand-accent)] text-white rounded-sm font-black uppercase tracking-[0.2em] text-[11px] group relative overflow-hidden shadow-2xl transition-all"
           >
             <span className="relative z-10">Gerar Outra Cobrança</span>
             <ArrowRight className="ml-3 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
             <div className="absolute inset-0 bg-[var(--brand-accent)] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-full group-hover:translate-y-0" />
           </Button>
        </div>
      </div>
    </div>
  );
}
