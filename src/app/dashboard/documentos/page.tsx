"use client";

import React, { useState } from "react";
import {
  FolderOpen,
  FileText,
  Download,
  Search,
  BookOpen,
  ClipboardList,
  UserPlus,
  ArrowRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type DocumentItem = {
  title: string;
  category: "abertura" | "manual" | "processo";
  description: string;
  format: "PDF" | "DOCX" | "XLSX";
  size: string;
  downloadUrl?: string;
};

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"todos" | "abertura" | "manual" | "processo">("todos");

  const documentos: DocumentItem[] = [
    // Abertura de Contas
    {
      title: "Relação de Documentos G8Pay - V1.4",
      category: "abertura",
      description: "Lista de documentos obrigatórios para credenciamento e abertura de conta G8Pay.",
      format: "PDF",
      size: "162 KB",
      downloadUrl: "/documentos/RELAÇÃO DE DOCUMENTOS G8PAY - V1.4 29052026.pdf"
    },
    {
      title: "Ficha Cadastral de Abertura de Conta - E.C",
      category: "abertura",
      description: "Formulário impresso obrigatório para abertura manual de contas de estabelecimento comercial.",
      format: "PDF",
      size: "1.2 MB"
    },
    {
      title: "Termo de Condições de Abertura de Conta Digital",
      category: "abertura",
      description: "Contrato padrão de abertura de conta corrente e serviços de pagamento.",
      format: "PDF",
      size: "1.8 MB"
    },
    {
      title: "Declaração de Faturamento Mensal Estimado",
      category: "abertura",
      description: "Modelo de declaração de faturamento para empresas novas (sem histórico).",
      format: "DOCX",
      size: "450 KB"
    },
    {
      title: "Autorização de Domicílio Bancário / Dossiê",
      category: "abertura",
      description: "Termo de autorização de travas de recebíveis e liquidação bancária.",
      format: "PDF",
      size: "950 KB"
    },

    // Manuais
    {
      title: "Manual de Abertura de Contas para Clientes",
      category: "manual",
      description: "Guia passo a passo completo ilustrado para auxiliar os clientes a abrirem suas contas via aplicativo.",
      format: "PDF",
      size: "4.2 MB"
    },
    {
      title: "Manual do Agente Comercial G8Pay v2.0",
      category: "manual",
      description: "Manual operacional detalhado contendo regras de abordagem, taxas vigentes e uso do portal.",
      format: "PDF",
      size: "3.1 MB"
    },
    {
      title: "Guia Rápido de Instalação de Maquininhas Pro/Ultra",
      category: "manual",
      description: "Instruções de ativação, conexão de chip/Wi-Fi e primeiro uso dos terminais de POS.",
      format: "PDF",
      size: "1.5 MB"
    },
    {
      title: "Manual de Tratamento de Contestação de Vendas (Chargeback)",
      category: "manual",
      description: "Procedimento para envio de comprovantes e defesa de transações contestadas.",
      format: "PDF",
      size: "2.1 MB"
    },

    // Processos e Fluxogramas
    {
      title: "Fluxograma do Processo de Credenciamento de E.C",
      category: "processo",
      description: "Fluxograma sequencial mostrando as etapas desde a coleta de dados até a homologação final.",
      format: "PDF",
      size: "1.1 MB"
    },
    {
      title: "Manual de Processos e Políticas de Prevenção à Fraude",
      category: "processo",
      description: "Procedimentos de KYC (Conheça seu Cliente) e análise de perfil transacional para agentes.",
      format: "PDF",
      size: "2.8 MB"
    },
    {
      title: "Processo de Solicitação de Suporte e Assistência Técnica",
      category: "processo",
      description: "Manual de como abrir chamados de troca de bobina, manutenção de POS ou problemas de sinal.",
      format: "PDF",
      size: "980 KB"
    },
    {
      title: "Regulamento e Política Comercial de Comissões G8Pay",
      category: "processo",
      description: "Regras de repasse, percentuais de comissionamento por volume transacionado e cronograma.",
      format: "PDF",
      size: "1.4 MB"
    }
  ];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "abertura":
        return <Badge className="bg-orange-50 text-brand-accent border border-orange-100 hover:bg-orange-100/50 font-black text-[10px] uppercase tracking-wider rounded-sm">Abertura de Conta</Badge>;
      case "manual":
        return <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100/50 font-black text-[10px] uppercase tracking-wider rounded-sm">Manuais</Badge>;
      case "processo":
        return <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100/50 font-black text-[10px] uppercase tracking-wider rounded-sm">Processos</Badge>;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "abertura":
        return <UserPlus className="h-5 w-5 text-brand-accent" />;
      case "manual":
        return <BookOpen className="h-5 w-5 text-emerald-500" />;
      case "processo":
        return <ClipboardList className="h-5 w-5 text-indigo-500" />;
      default:
        return <FileText className="h-5 w-5 text-neutral-400" />;
    }
  };

  const filteredDocumentos = documentos.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === "todos" || doc.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#f8f9fa] min-h-screen w-full overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="p-2 sm:p-4 md:p-10 2xl:p-16 flex flex-col gap-6 md:gap-10 max-w-[1800px] mx-auto animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="space-y-3 px-2">
          <Badge variant="secondary" className="bg-orange-500/10 text-brand-accent border-0 px-4 py-1.5 font-black text-[11px] uppercase tracking-[0.2em] rounded-sm">
            Repositório Corporativo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09]">
            Biblioteca de <span className="text-brand-accent">Documentos</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-bold opacity-75">
            Acesse formulários de abertura de contas, fluxos de processos corporativos e manuais operacionais.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between px-2">
          
          {/* Search bar */}
          <div className="relative max-w-md w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-brand-accent transition-colors" />
            <Input
              type="text"
              placeholder="Pesquisar por título, manual ou palavra-chave..."
              className="pl-12 pr-4 h-12 bg-white border-neutral-200 focus:border-brand-accent focus:bg-white rounded-sm transition-all font-black text-sm text-[#0c0a09] placeholder:text-neutral-300 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Navigation/Filter Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {[
              { id: "todos", label: "Todos Documentos", icon: FolderOpen },
              { id: "abertura", label: "Abertura de Conta", icon: UserPlus },
              { id: "manual", label: "Manuais", icon: BookOpen },
              { id: "processo", label: "Processos & Fluxos", icon: ClipboardList }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`h-11 px-5 font-black text-xs uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? "bg-black text-white hover:bg-brand-accent hover:border-brand-accent shadow-md shadow-black/10 border-black"
                      : "bg-white border-neutral-200 text-[#0c0a09] hover:bg-neutral-50"
                  }`}
                >
                  <TabIcon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Document Cards Grid */}
        {filteredDocumentos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDocumentos.map((doc, idx) => (
              <Card
                key={idx}
                className="bg-white border border-neutral-100 p-8 rounded-sm shadow-xl flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Decorative hover gradient border top */}
                <div className={`absolute top-0 inset-x-0 h-1 transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                  doc.category === "abertura" ? "bg-orange-400" :
                  doc.category === "manual" ? "bg-emerald-400" : "bg-indigo-400"
                }`} />

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${
                      doc.category === "abertura" ? "bg-orange-50" :
                      doc.category === "manual" ? "bg-emerald-50" : "bg-indigo-50"
                    }`}>
                      {getCategoryIcon(doc.category)}
                    </div>
                    <Badge className="bg-neutral-100 text-neutral-500 border-0 text-[10px] font-black uppercase tracking-wider rounded-sm shrink-0">
                      {doc.format} &bull; {doc.size}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(doc.category)}
                    </div>
                    <h3 className="text-lg font-black text-[#0c0a09] leading-tight tracking-tight uppercase group-hover:text-brand-accent transition-colors duration-300">
                      {doc.title}
                    </h3>
                    <p className="text-xs font-bold text-neutral-400 leading-relaxed">
                      {doc.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-neutral-50 flex items-center justify-between gap-4 shrink-0">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">
                    Disponível Offline
                  </span>
                  <Button
                    onClick={() => {
                      if (doc.downloadUrl) {
                        window.open(doc.downloadUrl, "_blank");
                      } else {
                        toast.success(`Iniciando download de: ${doc.title}`);
                      }
                    }}
                    className="h-10 px-5 font-black text-xs uppercase tracking-widest bg-black hover:bg-brand-accent text-white rounded-sm transition-all whitespace-nowrap shrink-0 shadow-sm shadow-black/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border border-neutral-100 p-16 rounded-sm shadow-xl text-center space-y-6 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-neutral-50 text-neutral-300 rounded-full flex items-center justify-center mx-auto">
              <FolderOpen className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#0c0a09]">Nenhum documento encontrado</h3>
              <p className="text-sm text-neutral-400 font-bold leading-relaxed max-w-sm mx-auto">
                Não encontramos nenhum manual ou formulário que corresponda aos filtros e termo de pesquisa inseridos.
              </p>
            </div>
            <Button
              onClick={() => {
                setSearchTerm("");
                setActiveTab("todos");
              }}
              className="h-11 px-6 font-black text-xs uppercase tracking-widest bg-black hover:bg-brand-accent text-white rounded-sm transition-all whitespace-nowrap"
            >
              Limpar Filtros
            </Button>
          </Card>
        )}

      </div>
    </div>
  );
}
