"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  UserCheck,
  Users,
  Copy,
  ExternalLink,
  CheckCircle2,
  Download,
  HelpCircle,
  Briefcase,
  Calendar,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { currentBrand } from "@/config/brand";

export default function DashboardHome() {
  const [userName, setUserName] = useState("Agente G8Pay");
  const [agentData, setAgentData] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Load from localStorage if present
    const localName = localStorage.getItem("userName");
    const signedContractStr = localStorage.getItem("signedContract");

    if (localName) {
      setUserName(localName);
    }

    if (signedContractStr) {
      try {
        const contract = JSON.parse(signedContractStr);
        setAgentData(contract);
        if (contract.fullName) {
          setUserName(contract.fullName);
        }
      } catch (err) {
        console.error("Error parsing contract data:", err);
      }
    }
  }, []);

  const handleCopyReferral = () => {
    const referralLink = `${window.location.origin}/?ref=${agentData?.cpf || "g8-agent"}`;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Link de indicação copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const cleanFirstName = (name: string) => {
    return name.split(" ")[0] || "Agente";
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen w-full overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="p-2 sm:p-4 md:p-10 2xl:p-16 flex flex-col gap-6 md:gap-10 max-w-[1800px] mx-auto animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 px-2">
          <div className="space-y-3">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 px-4 py-1.5 font-black text-[11px] uppercase tracking-[0.2em] rounded-sm">
              Agente Verificado
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09]">
              Olá, <span className="text-brand-accent">{cleanFirstName(userName)}</span>!
            </h1>
            <p className="text-sm md:text-base text-neutral-400 font-bold opacity-75">
              Seja bem-vindo ao seu painel de controle de agente G8Pay.
            </p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button
              onClick={handleCopyReferral}
              className="w-full sm:w-auto rounded-sm h-12 px-8 font-black text-xs uppercase tracking-widest bg-black text-white hover:bg-brand-accent transition-all active:scale-95 shadow-md"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link de Indicação
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card className="bg-white border border-neutral-100 p-8 rounded-sm shadow-xl hover:-translate-y-1 transition-transform duration-300 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Status do Agente</p>
              <h3 className="text-2xl font-black text-[#0c0a09]">Ativo & Operacional</h3>
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="h-4 w-4" /> Cadastro Homologado
              </p>
            </div>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-sm flex items-center justify-center">
              <UserCheck className="h-7 w-7" />
            </div>
          </Card>

          <Card className="bg-white border border-neutral-100 p-8 rounded-sm shadow-xl hover:-translate-y-1 transition-transform duration-300 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Contratos Registrados</p>
              <h3 className="text-2xl font-black text-[#0c0a09]">{agentData ? "1 Assinado" : "Nenhum contrato"}</h3>
              <p className="text-xs text-neutral-400 font-bold mt-2">
                {agentData ? `Último termo: ${agentData.date}` : "Aguardando onboarding"}
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-sm flex items-center justify-center">
              <FileText className="h-7 w-7" />
            </div>
          </Card>

          <Card className="bg-white border border-neutral-100 p-8 rounded-sm shadow-xl hover:-translate-y-1 transition-transform duration-300 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Total de Indicações</p>
              <h3 className="text-2xl font-black text-[#0c0a09]">0 Cadastros</h3>
              <p className="text-xs text-neutral-400 font-bold mt-2">
                Indique comerciantes e ganhe comissões
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-sm flex items-center justify-center">
              <Users className="h-7 w-7" />
            </div>
          </Card>

        </div>

        {/* Detail Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Contract Box */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-2xl font-black tracking-tighter text-[#0c0a09] px-2">Seu Contrato de Adesão</h2>
            
            {agentData ? (
              <Card className="bg-white border border-neutral-100 p-8 rounded-sm shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-brand-accent rounded-sm flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-[#0c0a09] text-lg leading-snug">Termo de Adesão ao Programa de Agentes Comerciais Autônomos G8Pay</h4>
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">G8Pay Agentes • PDF Assinado Digitalmente</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-0 px-4 py-2 font-black text-xs uppercase tracking-widest rounded-sm self-start sm:self-auto shrink-0 shadow-sm">
                    ATIVO / VIGENTE
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Titular do Contrato</p>
                    <p className="font-bold text-[#0c0a09]">{agentData.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">CPF</p>
                    <p className="font-bold text-[#0c0a09] font-mono">{agentData.cpf}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Data de Assinatura</p>
                    <p className="font-bold text-[#0c0a09]">{agentData.date}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4 border-t border-neutral-100">
                  <Button
                    onClick={() => window.open(agentData.pdfPreviewUrl || agentData.signatureLink, "_blank")}
                    className="h-12 px-6 font-black text-xs uppercase tracking-widest bg-brand-accent hover:bg-brand-accent-hover text-white rounded-sm transition-all"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Visualizar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (agentData.signatureLink) {
                        window.open(agentData.signatureLink, "_blank");
                      } else {
                        toast.error("Link de assinatura não disponível.");
                      }
                    }}
                    className="h-12 px-6 font-black text-xs uppercase tracking-widest border-neutral-200 text-[#0c0a09] hover:bg-neutral-50 rounded-sm transition-all"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Portal D4Sign
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="bg-white border border-neutral-100 p-12 rounded-sm shadow-xl text-center space-y-6">
                <div className="w-16 h-16 bg-neutral-50 text-neutral-300 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-black text-[#0c0a09]">Nenhum contrato ativo encontrado</h3>
                  <p className="text-sm text-neutral-400 font-bold leading-relaxed">
                    Você ainda não gerou ou assinou um contrato de adesão nesta sessão. Complete o processo de onboarding para visualizar seu termo de agente.
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

            {/* Quick Referral Info */}
            <Card className="bg-gradient-to-br from-[#1a1715] to-[#0c0a09] text-white p-8 rounded-sm shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-accent/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center">
                    <Award className="h-6 w-6 text-brand-accent" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl tracking-tight text-white">Ganhe por indicação de parceiros!</h3>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Programa de Afiliados G8Pay</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-300 font-medium max-w-xl leading-relaxed">
                  Indique comerciantes e empresários para utilizarem as maquininhas e soluções de pagamento da G8Pay. Você recebe comissões recorrentes sobre o volume transacionado por cada indicação homologada.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-sm px-4 h-12 flex items-center justify-between flex-1 min-w-0">
                    <span className="text-xs font-mono font-bold text-neutral-400 truncate pr-4">
                      {typeof window !== "undefined" ? `${window.location.origin}/?ref=${agentData?.cpf || "g8-agent"}` : "link-indicacao"}
                    </span>
                    <button
                      onClick={handleCopyReferral}
                      className="text-brand-accent hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Sidebar info */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-2xl font-black tracking-tighter text-[#0c0a09] px-2">Suporte & Dúvidas</h2>
            
            <Card className="bg-white border border-neutral-100 p-8 rounded-sm shadow-xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-50 text-neutral-400 rounded-sm flex items-center justify-center shrink-0">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-[#0c0a09] text-base leading-snug">Canais de Atendimento</h4>
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mt-1">Segunda a Sexta (09h às 17h)</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="p-4 bg-neutral-50 rounded-sm border border-neutral-100 flex items-center justify-between group cursor-pointer hover:bg-neutral-100/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Suporte WhatsApp</p>
                    <p className="text-sm font-black text-[#0c0a09]">+55 (51) 9629-7077</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-300 group-hover:text-brand-accent transition-colors" />
                </div>

                <div className="p-4 bg-neutral-50 rounded-sm border border-neutral-100 flex items-center justify-between group cursor-pointer hover:bg-neutral-100/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">E-mail de Suporte</p>
                    <p className="text-sm font-black text-[#0c0a09]">sac@g8pay.com.br</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-300 group-hover:text-brand-accent transition-colors" />
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200/50 p-5 rounded-sm space-y-2">
                <h5 className="text-xs font-black text-brand-accent uppercase tracking-wider">Regras de Comissão</h5>
                <p className="text-xs text-brand-accent font-medium leading-relaxed">
                  As comissões são pagas mensalmente no dia 10 de cada mês diretamente na sua conta corrente G8Pay. Consulte os limites de saque e resgate no seu perfil.
                </p>
              </div>
            </Card>

            <Card className="bg-white border border-neutral-100 p-8 rounded-sm shadow-xl space-y-4">
              <h4 className="font-black text-[#0c0a09] text-base uppercase tracking-wider">Guia do Agente G8Pay</h4>
              <p className="text-xs text-neutral-400 font-bold leading-relaxed">
                Baixe o material de apoio para agentes comerciais contendo tabelas de taxas, lâminas de produtos e manuais de onboarding do cliente.
              </p>
              <Button
                variant="outline"
                className="w-full h-12 font-black text-xs uppercase tracking-widest border-neutral-200 text-[#0c0a09] hover:bg-neutral-50 rounded-sm transition-all"
              >
                Download Kit de Vendas
              </Button>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
