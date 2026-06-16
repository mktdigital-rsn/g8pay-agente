"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Search, 
  MapPin, 
  CreditCard, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeft, 
  FileText, 
  Eye, 
  Download, 
  TrendingUp, 
  DollarSign, 
  HelpCircle,
  Briefcase
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Establishment = {
  id: string;
  agentId: string;
  tipoEstabelecimento: string;
  cnpjCpf: string;
  razaoSocial?: string;
  tipoEmpresa: string;
  nomeFantasia: string;
  contatoPrincipal: string;
  dataFundacao: string;
  horarioFuncionamento: string;
  site?: string;
  shopping: string;
  descricaoShopping?: string;
  mcc: string;
  cnae: string;
  faturamentoMensal: string;
  ticketMedio: string;
  antecipacaoRecebiveis: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  state: string;
  quantidade: string;
  contactsJson: string;
  bankAccountsJson: string;
  status: "pending" | "approved" | "rejected" | "pending_level_2";
  observations?: string;
  createdAt: string;
  updatedAt: string;
};

type EstablishmentDocument = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  status: "pending" | "approved" | "rejected" | "revisions";
  observations?: string;
};

type EstablishmentDetails = Establishment & {
  documents: EstablishmentDocument[];
};

export default function MeusClientesPage() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEc, setSelectedEc] = useState<EstablishmentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const fetchMyEstablishments = async () => {
    setLoading(true);
    try {
      const agentId = localStorage.getItem("agentId");
      if (!agentId) {
        toast.error("Agente não identificado. Faça login novamente.");
        setLoading(false);
        return;
      }
      
      let url = `/api/establishments?agentId=${agentId}`;
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const res = await api.get(url);
      if (res.data && res.data.success) {
        setEstablishments(res.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching my establishments:", err);
      toast.error("Erro ao carregar lista de estabelecimentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEstablishments();
  }, [filterStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMyEstablishments();
  };

  const handleSelectEc = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/api/establishments/${id}`);
      if (res.data && res.data.success) {
        setSelectedEc(res.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching establishment details:", err);
      toast.error("Erro ao carregar detalhes do estabelecimento.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const parseJsonList = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr) || [];
    } catch (e) {
      return [];
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase px-2 py-0.5 font-black text-[8px] tracking-wider rounded-sm shadow-sm">Aprovado</Badge>;
      case "rejected":
        return <Badge className="bg-red-50 text-red-600 border border-red-200 uppercase px-2 py-0.5 font-black text-[8px] tracking-wider rounded-sm shadow-sm">Correções Pendentes</Badge>;
      case "pending_level_2":
        return <Badge className="bg-blue-50 text-blue-600 border border-blue-200 uppercase px-2 py-0.5 font-black text-[8px] tracking-wider rounded-sm shadow-sm">Em Análise Nível 2</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-600 border border-amber-200 uppercase px-2 py-0.5 font-black text-[8px] tracking-wider rounded-sm shadow-sm">Pendente</Badge>;
    }
  };

  const getDocStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">
            <CheckCircle2 className="h-3 w-3" /> Aprovado
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded-sm border border-red-100">
            <XCircle className="h-3 w-3" /> Reprovado
          </span>
        );
      case "revisions":
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-100">
            <AlertCircle className="h-3 w-3" /> Solicitar Revisão
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black text-neutral-400 uppercase bg-neutral-50 px-2 py-0.5 rounded-sm border border-neutral-100">
            <Clock className="h-3 w-3" /> Aguardando Análise
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-8 xl:p-12 h-full overflow-y-auto w-full bg-[#f8f9fa] no-scrollbar">
      {selectedEc ? (
        // Detailed client monitoring view
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedEc(null)}
              className="h-10 w-10 p-0 rounded-full border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#0c0a09]">{selectedEc.nomeFantasia}</h1>
                {getStatusBadge(selectedEc.status)}
              </div>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
                Acompanhamento do Cliente • CNPJ/CPF: {selectedEc.cnpjCpf}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Data cards */}
            <div className="lg:col-span-8 space-y-8">
              {/* Cadastral Card */}
              <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-brand-accent shadow-xl space-y-6">
                <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-brand-accent" /> Dados Cadastrais
                </h3>
                
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="border-b border-neutral-50 pb-2">
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Razão Social</span>
                    <span className="font-bold text-[#0c0a09]">{selectedEc.razaoSocial || "---"}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">CNPJ/CPF</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.cnpjCpf}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Tipo Estabelecimento</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.tipoEstabelecimento}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Tipo de Empresa</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.tipoEmpresa}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Contato Principal</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.contatoPrincipal}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Data de Fundação</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.dataFundacao}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Horário de Funcionamento</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.horarioFuncionamento}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Site</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.site || "---"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">CNAE Principal</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.cnae}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">MCC</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.mcc}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Localizado em Shopping?</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.shopping} {selectedEc.descricaoShopping ? `(${selectedEc.descricaoShopping})` : ''}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Máquinas Solicitadas</span>
                      <span className="font-semibold text-neutral-700">{selectedEc.quantidade} unidade(s)</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Financial & Bank accounts */}
              <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-emerald-500 shadow-xl space-y-6">
                <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-500" /> Informações Financeiras e Bancárias
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm border-b border-neutral-100 pb-4">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Faturamento Mensal</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.faturamentoMensal}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Ticket Médio</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.ticketMedio}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Antecipação de Recebíveis</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.antecipacaoRecebiveis}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="block text-[10px] uppercase font-black text-neutral-400 tracking-wider">Contas Bancárias de Repasse</span>
                  {parseJsonList(selectedEc.bankAccountsJson).map((b: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-sm border border-neutral-100 bg-neutral-50/50 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-neutral-400 tracking-wider">Banco</span>
                        <span className="font-bold text-neutral-700">{b.banco || "---"}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-neutral-400 tracking-wider">Agência / Conta</span>
                        <span className="font-semibold text-neutral-600">{b.agencia || '---'} / {b.conta || '---'}-{b.digito || ''}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-neutral-400 tracking-wider">Tipo de Conta</span>
                        <span className="font-semibold text-neutral-600">{b.tipoConta || "---"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Address card */}
              <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-blue-500 shadow-xl space-y-6">
                <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" /> Endereço de Instalação
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="sm:col-span-2">
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Logradouro</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.rua}, Nº {selectedEc.numero} {selectedEc.complemento ? `(${selectedEc.complemento})` : ''}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Bairro</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.bairro}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Cidade/UF</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.cidade} - {selectedEc.state}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">CEP</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.cep}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Status & Document checklist */}
            <div className="lg:col-span-4 space-y-8">
              {/* Compliance Observations */}
              {selectedEc.observations && (
                <Card className="p-6 bg-red-50 border border-red-100 rounded-sm shadow-md space-y-3">
                  <h4 className="text-xs font-black text-red-700 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> Observações do Compliance
                  </h4>
                  <p className="text-xs text-red-900 leading-relaxed italic">
                    "{selectedEc.observations}"
                  </p>
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                    Por favor, providencie os ajustes solicitados nos documentos abaixo.
                  </p>
                </Card>
              )}

              {/* Documents Status */}
              <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-brand-accent shadow-xl space-y-6">
                <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-accent" /> Status dos Documentos
                </h3>

                <div className="space-y-4">
                  {selectedEc.documents && selectedEc.documents.length > 0 ? (
                    selectedEc.documents.map((doc) => (
                      <div key={doc.id} className="p-4 rounded-sm border border-neutral-100 bg-neutral-50/50 space-y-2">
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-neutral-800 truncate" title={doc.name}>
                              {doc.name}
                            </p>
                            <p className="text-[10px] text-neutral-400 truncate mt-0.5" title={doc.fileName}>
                              {doc.fileName}
                            </p>
                          </div>
                          <a 
                            href={`${api.defaults.baseURL}/api/establishments/documents/${doc.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-7 w-7 border border-neutral-200 hover:bg-neutral-100 rounded-sm flex items-center justify-center text-neutral-500 shadow-sm shrink-0"
                            title="Baixar Arquivo"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {getDocStatusBadge(doc.status)}
                        </div>

                        {doc.observations && (
                          <div className="text-[10px] text-red-600 bg-red-50/50 p-2 border-l-2 border-red-500 rounded-r-xs mt-2">
                            <strong>Ajuste necessário:</strong> {doc.observations}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-400 italic font-semibold text-center py-4">Nenhum documento anexado.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        // E.C. Listing Screen for Agent
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-[#0c0a09]">MEUS CLIENTES E.C.</h1>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
              Monitore os credenciamentos comerciais solicitados por você
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <MetricCard 
              title="Total de Clientes" 
              value={establishments.length} 
              icon={<Building2 className="h-5 w-5 text-neutral-600" />} 
            />
            <MetricCard 
              title="Aprovados" 
              value={establishments.filter(e => e.status === "approved").length} 
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} 
              colorClass="border-l-emerald-500"
            />
            <MetricCard 
              title="Aguardando Análise" 
              value={establishments.filter(e => e.status === "pending" || e.status === "pending_level_2").length} 
              icon={<Clock className="h-5 w-5 text-amber-500" />} 
              colorClass="border-l-amber-500"
            />
            <MetricCard 
              title="Com Pendências" 
              value={establishments.filter(e => e.status === "rejected").length} 
              icon={<XCircle className="h-5 w-5 text-red-600" />} 
              colorClass="border-l-red-500"
            />
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-neutral-100 rounded-sm shadow-sm">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por Nome Fantasia ou CNPJ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 border border-neutral-200 focus-visible:outline-neutral-800 rounded-sm text-sm text-[#0c0a09] bg-neutral-50/50"
                />
              </div>
              <Button type="submit" className="h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm text-xs font-black uppercase tracking-widest px-6 shadow-md">
                Buscar
              </Button>
            </form>

            <div className="flex gap-2">
              <FilterButton active={filterStatus === ""} onClick={() => setFilterStatus("")} label="Todos" />
              <FilterButton active={filterStatus === "pending"} onClick={() => setFilterStatus("pending")} label="Pendentes" />
              <FilterButton active={filterStatus === "approved"} onClick={() => setFilterStatus("approved")} label="Aprovados" />
              <FilterButton active={filterStatus === "rejected"} onClick={() => setFilterStatus("rejected")} label="Pendências" />
            </div>
          </div>

          {/* Client list grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-accent"></div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Buscando estabelecimentos...</p>
            </div>
          ) : establishments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {establishments.map((ec) => (
                <Card key={ec.id} className="p-6 bg-white border border-neutral-100 hover:border-neutral-200 transition-all duration-300 shadow-md hover:shadow-xl rounded-sm flex flex-col justify-between gap-6 relative overflow-hidden group">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      {getStatusBadge(ec.status)}
                      <span className="text-[10px] text-neutral-400 font-bold uppercase">
                        {new Date(ec.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-neutral-800 uppercase tracking-tight leading-tight truncate group-hover:text-brand-accent transition-colors">
                        {ec.nomeFantasia}
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-semibold truncate mt-0.5">
                        {ec.razaoSocial || "---"}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-neutral-600 pt-2 border-t border-neutral-50">
                      <div className="flex justify-between">
                        <span className="text-neutral-400 uppercase font-bold text-[9px] tracking-wider">CNPJ/CPF:</span>
                        <span className="font-semibold">{ec.cnpjCpf}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400 uppercase font-bold text-[9px] tracking-wider">Cidade/UF:</span>
                        <span className="font-semibold">{ec.cidade} - {ec.state}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400 uppercase font-bold text-[9px] tracking-wider">Maquininhas:</span>
                        <span className="font-bold text-[#0c0a09]">{ec.quantidade} u.</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSelectEc(ec.id)}
                    className="w-full h-10 bg-neutral-50 hover:bg-neutral-900 hover:text-white border border-neutral-200 text-[#0c0a09] rounded-sm text-[10px] font-black uppercase tracking-widest transition-all mt-2 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Eye className="h-4 w-4" /> Detalhes & Status
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-16 border border-dashed border-neutral-200 rounded-sm text-center bg-white shadow-sm flex flex-col items-center justify-center gap-4">
              <Building2 className="h-12 w-12 text-neutral-300" />
              <div>
                <p className="text-sm font-black text-neutral-800 uppercase tracking-wide">Nenhum estabelecimento encontrado</p>
                <p className="text-xs text-neutral-400 mt-1">Cadastre novos estabelecimentos comerciais no menu "Cadastro &gt; E.C".</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-components
function MetricCard({ title, value, icon, colorClass = "border-l-neutral-400" }: { title: string; value: number; icon: React.ReactNode; colorClass?: string }) {
  return (
    <Card className={`p-6 bg-white border border-neutral-100 border-l-[6px] ${colorClass} shadow-md flex items-center justify-between`}>
      <div className="space-y-1">
        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">{title}</span>
        <span className="text-2xl font-black text-neutral-800">{value}</span>
      </div>
      <div className="p-3 bg-neutral-50 rounded-sm border border-neutral-100">
        {icon}
      </div>
    </Card>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 px-5 text-xs font-black uppercase tracking-widest rounded-sm border-2 transition-all cursor-pointer shadow-sm ${
        active 
          ? "bg-neutral-900 border-neutral-900 text-white" 
          : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-500"
      }`}
    >
      {label}
    </button>
  );
}
