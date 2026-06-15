"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Eye,
  Building,
  Clock,
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  Download,
  Loader2,
  User,
  ShieldAlert,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { currentBrand } from "@/config/brand";

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
  status: "pending" | "approved" | "rejected";
  observations?: string;
  createdAt: string;
  updatedAt: string;
};

type EstablishmentDocument = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  status: "pending" | "approved" | "rejected";
  observations?: string;
};

type EstablishmentDetails = Establishment & {
  documents: EstablishmentDocument[];
};

export default function CompliancePage() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEc, setSelectedEc] = useState<EstablishmentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  
  // Compliance Review States for Selected E.C.
  const [docReviews, setDocReviews] = useState<Record<string, { status: "approved" | "rejected", observations: string }>>({});
  const [ecStatus, setEcStatus] = useState<"approved" | "rejected">("approved");
  const [ecObservations, setEcObservations] = useState("");
  const [isSubmittingCompliance, setIsSubmittingCompliance] = useState(false);

  const fetchEstablishments = async () => {
    setLoading(true);
    try {
      let url = "/api/establishments";
      const params = [];
      if (filterStatus) params.push(`status=${filterStatus}`);
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      
      const res = await api.get(url);
      if (res.data && res.data.success) {
        setEstablishments(res.data.data);
      }
    } catch (err: any) {
      console.error("Error loading establishments:", err);
      toast.error("Erro ao carregar lista de estabelecimentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstablishments();
  }, [filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEstablishments();
  };

  const handleSelectEc = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/api/establishments/${id}`);
      if (res.data && res.data.success) {
        const details: EstablishmentDetails = res.data.data;
        setSelectedEc(details);
        setEcObservations(details.observations || "");
        
        // Initialize document reviews
        const initialReviews: Record<string, { status: "approved" | "rejected", observations: string }> = {};
        details.documents.forEach(doc => {
          initialReviews[doc.id] = {
            status: doc.status === "pending" ? "approved" : doc.status,
            observations: doc.observations || ""
          };
        });
        setDocReviews(initialReviews);
        setEcStatus(details.status === "pending" ? "approved" : details.status as any);
      }
    } catch (err: any) {
      console.error("Error loading E.C. details:", err);
      toast.error("Erro ao carregar detalhes do estabelecimento.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDocReviewChange = (docId: string, status: "approved" | "rejected") => {
    setDocReviews(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        status
      }
    }));
  };

  const handleDocObsChange = (docId: string, obs: string) => {
    setDocReviews(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        observations: obs
      }
    }));
  };

  const handleSubmitCompliance = async () => {
    if (!selectedEc) return;
    
    setIsSubmittingCompliance(true);
    try {
      const payload = {
        status: ecStatus,
        observations: ecObservations,
        documents: Object.entries(docReviews).map(([docId, review]) => ({
          id: docId,
          status: review.status,
          observations: review.status === "rejected" ? review.observations : ""
        }))
      };

      const res = await api.post(`/api/establishments/${selectedEc.id}/compliance`, payload);
      if (res.data && res.data.success) {
        toast.success("Análise de compliance salva com sucesso!");
        setSelectedEc(null);
        fetchEstablishments();
      } else {
        throw new Error(res.data?.error || "Erro ao salvar compliance.");
      }
    } catch (err: any) {
      console.error("Error saving compliance review:", err);
      toast.error(err.response?.data?.error || err.message || "Erro ao conectar com o servidor.");
    } finally {
      setIsSubmittingCompliance(false);
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
        return <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase px-3 py-1 font-black text-[9px] tracking-wider rounded-sm shadow-sm">Aprovado</Badge>;
      case "rejected":
        return <Badge className="bg-red-50 text-red-600 border border-red-200 uppercase px-3 py-1 font-black text-[9px] tracking-wider rounded-sm shadow-sm">Reprovado</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-600 border border-amber-200 uppercase px-3 py-1 font-black text-[9px] tracking-wider rounded-sm shadow-sm">Pendente</Badge>;
    }
  };

  if (selectedEc) {
    const contacts = parseJsonList(selectedEc.contactsJson);
    const bankAccounts = parseJsonList(selectedEc.bankAccountsJson);

    return (
      <div className="p-2 sm:p-4 md:p-8 xl:p-12 h-full overflow-y-auto w-full bg-[#f8f9fa] relative no-scrollbar animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => setSelectedEc(null)}
            className="h-10 w-10 p-0 rounded-full border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tighter text-[#0c0a09]">{selectedEc.nomeFantasia}</h1>
              {getStatusBadge(selectedEc.status)}
            </div>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Análise de Compliance • CNPJ/CPF: {selectedEc.cnpjCpf}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
          {/* Left Side: E.C. Information Details */}
          <div className="lg:col-span-8 space-y-8">
            {/* Basic Info Card */}
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-brand-accent shadow-xl space-y-6">
              <h3 className="text-base font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                <Building className="h-5 w-5 text-brand-accent" /> Dados Cadastrais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <InfoItem label="Razão Social" value={selectedEc.razaoSocial || "---"} />
                <InfoItem label="CNPJ/CPF" value={selectedEc.cnpjCpf} />
                <InfoItem label="Tipo Estabelecimento" value={selectedEc.tipoEstabelecimento} />
                <InfoItem label="Tipo de Empresa" value={selectedEc.tipoEmpresa} />
                <InfoItem label="Contato Principal" value={selectedEc.contatoPrincipal} />
                <InfoItem label="Data de Fundação" value={selectedEc.dataFundacao} />
                <InfoItem label="Horário de Funcionamento" value={selectedEc.horarioFuncionamento} />
                <InfoItem label="Site" value={selectedEc.site || "---"} />
                <InfoItem label="Localizado em Shopping" value={selectedEc.shopping} />
                {selectedEc.shopping === "Sim" && (
                  <InfoItem label="Descrição Shopping" value={selectedEc.descricaoShopping || "---"} />
                )}
                <InfoItem label="MCC" value={selectedEc.mcc} />
                <InfoItem label="CNAE" value={selectedEc.cnae} />
                <InfoItem label="Máquinas Solicitadas" value={`${selectedEc.quantidade} unidade(s)`} />
              </div>
            </Card>

            {/* Financial Info Card */}
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-blue-500 shadow-xl space-y-6">
              <h3 className="text-base font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" /> Informações Financeiras
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                <InfoItem label="Faturamento Mensal" value={selectedEc.faturamentoMensal} />
                <InfoItem label="Ticket Médio" value={selectedEc.ticketMedio} />
                <InfoItem label="Antecipação de Recebíveis" value={selectedEc.antecipacaoRecebiveis} />
              </div>
            </Card>

            {/* Address Info Card */}
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-amber-500 shadow-xl space-y-6">
              <h3 className="text-base font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-500" /> Endereço de Instalação
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                <div className="sm:col-span-2">
                  <InfoItem label="Rua / Logradouro" value={`${selectedEc.rua}, Nº ${selectedEc.numero}`} />
                </div>
                <InfoItem label="Complemento" value={selectedEc.complemento || "---"} />
                <InfoItem label="Bairro" value={selectedEc.bairro} />
                <InfoItem label="Cidade/UF" value={`${selectedEc.cidade} - ${selectedEc.state}`} />
                <InfoItem label="CEP" value={selectedEc.cep} />
              </div>
            </Card>

            {/* Contacts list Card */}
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-green-500 shadow-xl space-y-6">
              <h3 className="text-base font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-green-500" /> Contatos Responsáveis
              </h3>
              <div className="space-y-4">
                {contacts.length > 0 ? (
                  contacts.map((c: any, index: number) => (
                    <div key={index} className="p-5 bg-neutral-50 rounded-sm border border-neutral-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <InfoItem label="Nome" value={c.nome || "---"} />
                      <InfoItem label="CPF" value={c.cpf || "---"} />
                      <InfoItem label="E-mail" value={c.email || "---"} />
                      <InfoItem label="Cargo / Responsabilidade" value={`${c.funcao || '---'} (${c.tipoResponsavel || 'Sócio'})`} />
                      <InfoItem label="Telefone" value={c.telefone || "---"} />
                      <InfoItem label="Nascimento" value={c.dataNascimento || "---"} />
                      <InfoItem label="Nacionalidade" value={c.nacionalidade || "---"} />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 font-bold uppercase italic">Nenhum contato cadastrado.</p>
                )}
              </div>
            </Card>

            {/* Bank details Card */}
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-indigo-600 shadow-xl space-y-6">
              <h3 className="text-base font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-600" /> Contas Bancárias cadastradas
              </h3>
              <div className="space-y-4">
                {bankAccounts.length > 0 ? (
                  bankAccounts.map((b: any, index: number) => (
                    <div key={index} className="p-5 bg-neutral-50 rounded-sm border border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <InfoItem label="Banco" value={b.banco || "---"} />
                      <InfoItem label="Agência / Conta" value={`${b.agencia || '---'} / ${b.conta || '---'}-${b.digito || ''}`} />
                      <InfoItem label="Tipo de Conta" value={b.tipoConta || "---"} />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 font-bold uppercase italic">Nenhuma conta bancária cadastrada.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Side: Documents compliance validation */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-brand-accent shadow-xl space-y-6 sticky top-6">
              <h3 className="text-base font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-brand-accent" /> Validação de Documentos
              </h3>
              
              <div className="space-y-6">
                {selectedEc.documents.length > 0 ? (
                  selectedEc.documents.map((doc) => {
                    const review = docReviews[doc.id] || { status: "approved", observations: "" };
                    return (
                      <div key={doc.id} className="p-4 rounded-sm border border-neutral-100 bg-neutral-50/50 space-y-3">
                        <div className="flex items-start justify-between gap-4 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText className="h-8 w-8 text-neutral-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-[#0c0a09] uppercase tracking-wider truncate" title={doc.name}>{doc.name}</p>
                              <p className="text-[10px] text-neutral-400 truncate w-full" title={doc.fileName}>{doc.fileName}</p>
                            </div>
                          </div>
                          
                          {/* Download Button */}
                          <a
                            href={`${api.defaults.baseURL}/api/establishments/documents/${doc.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 w-8 bg-white border border-neutral-200 rounded-sm hover:bg-neutral-50 flex items-center justify-center text-neutral-500 shadow-sm shrink-0"
                            title="Visualizar / Baixar Documento"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                        
                        {/* Approval Toggle */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDocReviewChange(doc.id, "approved")}
                            className={`flex-1 h-9 rounded-sm font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                              review.status === "approved"
                                ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                                : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" /> Aprovado
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDocReviewChange(doc.id, "rejected")}
                            className={`flex-1 h-9 rounded-sm font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                              review.status === "rejected"
                                ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                                : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
                            }`}
                          >
                            <X className="h-3.5 w-3.5" /> Reprovado
                          </button>
                        </div>
                        
                        {/* Observations for Rejected Documents */}
                        {review.status === "rejected" && (
                          <div className="space-y-1 animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-red-600 uppercase tracking-widest">Motivo da Reprovação *</label>
                            <textarea
                              value={review.observations}
                              onChange={(e) => handleDocObsChange(doc.id, e.target.value)}
                              placeholder="Descreva o motivo (Ex: RG ilegível, CPF divergente...)"
                              className="w-full min-h-[60px] p-2 text-xs border border-red-200 rounded-sm bg-red-50/10 focus-visible:outline-red-500 text-[#0c0a09]"
                              required
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-neutral-400 font-bold uppercase italic text-center py-4">Nenhum documento foi anexado por este E.C.</p>
                )}
                
                <div className="h-[1px] bg-neutral-100 my-6" />

                {/* Final Compliance decision */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-[#0c0a09] uppercase tracking-widest">Parecer Final do Credenciamento</h4>
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setEcStatus("approved")}
                      className={`flex-1 h-12 rounded-sm font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                        ecStatus === "approved"
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
                      }`}
                    >
                      <Check className="h-4 w-4" /> Aprovar E.C.
                    </button>
                    <button
                      type="button"
                      onClick={() => setEcStatus("rejected")}
                      className={`flex-1 h-12 rounded-sm font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                        ecStatus === "rejected"
                          ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20"
                          : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
                      }`}
                    >
                      <X className="h-4 w-4" /> Reprovar E.C.
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Observações Finais / Instruções de Ajuste</label>
                    <textarea
                      value={ecObservations}
                      onChange={(e) => setEcObservations(e.target.value)}
                      placeholder="Instruções para o agente ou observações de compliance..."
                      className="w-full min-h-[100px] p-3 text-xs border border-neutral-200 rounded-sm bg-neutral-50/50 text-[#0c0a09] focus-visible:outline-brand-accent focus-visible:bg-white transition-all"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitCompliance}
                    disabled={isSubmittingCompliance}
                    className="w-full h-14 bg-brand-accent hover:bg-brand-accent-hover text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all shadow-xl shadow-orange-500/15 mt-4 cursor-pointer"
                  >
                    {isSubmittingCompliance ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando Decisão...
                      </>
                    ) : (
                      "Salvar Análise de Compliance"
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-8 xl:p-12 h-full overflow-y-auto w-full bg-[#f8f9fa] relative no-scrollbar animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

      <div className="space-y-8 relative z-10">
        {/* Page Header */}
        <div className="space-y-3 px-2">
          <Badge variant="secondary" className="bg-orange-500/10 text-brand-accent border-0 px-4 py-1.5 font-black text-[11px] uppercase tracking-[0.2em] rounded-sm">
            Compliance
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09]">
            Validação de <span className="text-brand-accent">Estabelecimentos</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-bold opacity-75">
            Analise e homologue os credenciamentos e documentos enviados pelos agentes.
          </p>
        </div>

        {/* Filters and search section */}
        <Card className="p-5 bg-white border border-neutral-100 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-sm">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 px-4 h-12 rounded-sm flex-1 min-w-0">
            <Search className="h-5 w-5 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Nome Fantasia, CNPJ ou Agente..."
              className="bg-transparent border-none text-[#0c0a09] placeholder-neutral-400 text-xs font-bold uppercase tracking-wider focus-visible:outline-none flex-1"
            />
            <Button type="submit" className="h-8 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-sm text-[9px] font-black uppercase tracking-widest px-4 cursor-pointer shadow-lg shadow-orange-500/10">Buscar</Button>
          </form>

          <div className="flex gap-4 shrink-0">
            {/* Status filters */}
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-sm px-4 h-12">
              <Filter className="h-4 w-4 text-neutral-400 shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none text-[#0c0a09] text-xs font-black uppercase tracking-wider focus-visible:outline-none cursor-pointer"
              >
                <option value="">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Reprovados</option>
              </select>
            </div>
            
            <Button onClick={fetchEstablishments} className="h-12 bg-white hover:bg-neutral-50 text-[#0c0a09] border border-neutral-200 rounded-sm font-black text-xs uppercase tracking-widest px-6 shadow-sm cursor-pointer">
              Atualizar
            </Button>
          </div>
        </Card>

        {/* E.C. Listing table/cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-brand-accent animate-spin" />
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Carregando credenciamentos...</p>
          </div>
        ) : establishments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {establishments.map((ec) => (
              <Card
                key={ec.id}
                onClick={() => handleSelectEc(ec.id)}
                className="bg-white border border-neutral-100 shadow-xl rounded-sm hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-black text-[#0c0a09] text-xl leading-tight hover:text-brand-accent transition-colors" title={ec.nomeFantasia}>{ec.nomeFantasia}</h3>
                      <p className="text-[10px] text-neutral-400 font-mono">{ec.cnpjCpf}</p>
                    </div>
                    {getStatusBadge(ec.status)}
                  </div>
                  
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex items-center gap-2.5 text-neutral-500">
                      <Building className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
                      <span className="font-bold">{ec.tipoEmpresa} • {ec.tipoEstabelecimento}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-neutral-500">
                      <MapPin className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
                      <span className="font-semibold truncate">{ec.cidade} - {ec.state}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-neutral-500">
                      <Clock className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
                      <span className="font-semibold">Cadastrado em {new Date(ec.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-neutral-500">
                      <User className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
                      <span className="font-semibold text-neutral-400 uppercase tracking-widest text-[9px]">Agente: <strong className="text-neutral-700">{ec.agentId === "unknown-agent" ? "Direto" : "Código " + ec.agentId.substring(0, 8)}</strong></span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between group">
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Visualizar Credenciamento</span>
                  <div className="flex items-center gap-1 text-[var(--brand-accent)] font-black text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    Abrir <Eye className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-16 text-center space-y-6 max-w-xl mx-auto shadow-xl">
            <div className="w-16 h-16 bg-neutral-50 text-neutral-300 rounded-full flex items-center justify-center mx-auto">
              <Building className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-[#0c0a09]">Nenhum credenciamento encontrado</h3>
              <p className="text-sm text-neutral-400 font-bold leading-relaxed">
                Não existem estabelecimentos comerciais registrados com os filtros selecionados.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">{label}</p>
      <p className="font-bold text-[#0c0a09] leading-snug">{value}</p>
    </div>
  );
}
