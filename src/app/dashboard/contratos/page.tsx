"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  Download,
  Calendar,
  User,
  Smartphone,
  Mail,
  Maximize2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { currentBrand } from "@/config/brand";

export default function ContratosPage() {
  const [contract, setContract] = useState<any>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  useEffect(() => {
    // Load signed contract from localStorage
    const signedContractStr = localStorage.getItem("signedContract");
    if (signedContractStr) {
      try {
        setContract(JSON.parse(signedContractStr));
      } catch (err) {
        console.error("Error parsing contract data:", err);
      }
    }
  }, []);

  return (
    <div className="bg-[#f8f9fa] min-h-screen w-full overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="p-4 md:p-10 2xl:p-16 flex flex-col gap-10 max-w-[1800px] mx-auto animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="space-y-3 px-2">
          <Badge variant="secondary" className="bg-orange-500/10 text-brand-accent border-0 px-4 py-1.5 font-black text-[11px] uppercase tracking-[0.2em] rounded-sm">
            Gestão de Documentos
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09]">
            Seus <span className="text-brand-accent">Contratos</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-bold opacity-75">
            Visualize e baixe seus termos de adesão e contratos comerciais com a G8Pay.
          </p>
        </div>

        {contract ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Contract metadata and details */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              <Card className="bg-white border border-neutral-100 p-8 rounded-sm shadow-xl space-y-8 flex-1">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-orange-50 text-brand-accent rounded-sm flex items-center justify-center">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#0c0a09] leading-snug">Termo de Adesão ao Programa de Agentes</h3>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Ref: G8-AC-2026</p>
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Status da Assinatura</span>
                    <Badge className="bg-emerald-50 text-emerald-600 border-0 px-4 py-1.5 font-black text-xs uppercase tracking-widest rounded-sm shadow-sm">
                      Assinado Digitalmente
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-neutral-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Agente Comercial</p>
                        <p className="text-sm font-bold text-[#0c0a09] truncate">{contract.fullName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-neutral-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Documento CPF</p>
                        <p className="text-sm font-bold text-[#0c0a09] font-mono">{contract.cpf}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-neutral-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">E-mail</p>
                        <p className="text-sm font-bold text-[#0c0a09] truncate">{contract.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-neutral-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">WhatsApp</p>
                        <p className="text-sm font-bold text-[#0c0a09]">{contract.whatsapp}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-neutral-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Assinado Em</p>
                        <p className="text-sm font-bold text-[#0c0a09]">{contract.date}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => window.open(contract.pdfPreviewUrl || contract.signatureLink, "_blank")}
                    className="flex-1 h-12 font-black text-xs uppercase tracking-widest bg-brand-accent hover:bg-brand-accent-hover text-white rounded-sm transition-all"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Contrato
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsFullscreenOpen(true)}
                    className="h-12 px-6 font-black text-xs uppercase tracking-widest border-neutral-200 text-[#0c0a09] hover:bg-neutral-50 rounded-sm transition-all shrink-0"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <div className="p-5 bg-amber-50 border border-amber-200/50 rounded-sm flex gap-3 text-brand-accent">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-black uppercase tracking-wider">Homologação Pendente</h5>
                  <p className="text-xs font-medium leading-relaxed">
                    Seu contrato está assinado e aguardando a validação final da nossa mesa de operações. Você receberá uma notificação no WhatsApp assim que o credenciamento for concluído.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: PDF Viewer */}
            <Card className="lg:col-span-7 bg-white border border-neutral-100 p-6 rounded-sm shadow-xl flex flex-col justify-between h-[650px] lg:h-auto">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4 shrink-0">
                <h4 className="font-black text-[#0c0a09] text-sm uppercase tracking-wider">Visualizador de Documento</h4>
                <button
                  onClick={() => setIsFullscreenOpen(true)}
                  className="p-2 text-neutral-400 hover:text-brand-accent hover:bg-neutral-50 rounded-full transition-all"
                  title="Visualizar em Tela Cheia"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 border border-neutral-200 rounded-sm overflow-hidden bg-neutral-900 relative">
                <iframe
                  src={`${contract.pdfPreviewUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-0"
                  title="Contrato Visualizador"
                />
              </div>
            </Card>

          </div>
        ) : (
          <Card className="bg-white border border-neutral-100 p-16 rounded-sm shadow-xl text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-neutral-50 text-neutral-300 rounded-full flex items-center justify-center mx-auto">
              <FileText className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#0c0a09]">Nenhum contrato assinado</h3>
              <p className="text-sm text-neutral-400 font-bold leading-relaxed max-w-md mx-auto">
                Você ainda não preencheu e assinou o seu termo de adesão. Por favor, volte à tela de cadastro para finalizar o seu onboarding.
              </p>
            </div>
            <Button
              onClick={() => window.location.href = "/"}
              className="h-12 px-8 font-black text-xs uppercase tracking-widest bg-black text-white hover:bg-brand-accent rounded-sm transition-all"
            >
              Ir para Onboarding
            </Button>
          </Card>
        )}

      </div>

      {/* Fullscreen Dialog Preview */}
      {contract && (
        <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh] bg-[#18181b] border-white/10 text-white flex flex-col p-6 rounded-sm">
            <DialogHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between shrink-0">
              <div>
                <DialogTitle className="text-xl font-black text-white tracking-tight">Termo de Adesão - Agente G8Pay</DialogTitle>
                <p className="text-xs text-neutral-400 font-bold mt-1 uppercase tracking-widest">
                  Assinado por {contract.fullName} em {contract.date}
                </p>
              </div>
              <Button
                onClick={() => window.open(contract.pdfPreviewUrl || contract.signatureLink, "_blank")}
                className="h-10 px-4 font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm mr-8"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </DialogHeader>

            <div className="flex-1 bg-neutral-950 rounded-sm overflow-hidden mt-4 border border-white/10">
              <iframe
                src={contract.pdfPreviewUrl}
                className="w-full h-full border-0"
                title="Fullscreen Contrato Visualizador"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
