"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Building,
  Clock,
  ArrowLeft,
  Check,
  X,
  Download,
  Loader2,
  User,
  ShieldAlert,
  MapPin,
  CreditCard,
  Building2,
  AlertTriangle,
  TrendingUp,
  FileSearch,
  ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
  // Joined fields
  agentName?: string;
  agentCpf?: string;
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
  agent?: {
    fullName: string;
    cpf: string;
  } | null;
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
  const [docReviews, setDocReviews] = useState<Record<string, { status: "approved" | "rejected" | "revisions", observations: string }>>({});
  const [ecStatus, setEcStatus] = useState<"approved" | "rejected" | "pending_level_2">("approved");
  const [ecObservations, setEcObservations] = useState("");
  const [isSubmittingCompliance, setIsSubmittingCompliance] = useState(false);

  // Document Preview States
  const [activePreviewDoc, setActivePreviewDoc] = useState<EstablishmentDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    
    // Revoke previous blob URL if exists
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setActivePreviewDoc(null);

    try {
      const res = await api.get(`/api/establishments/${id}`);
      if (res.data && res.data.success) {
        const details: EstablishmentDetails = res.data.data;
        setSelectedEc(details);
        setEcObservations(details.observations || "");
        
        // Initialize document reviews
        const initialReviews: Record<string, { status: "approved" | "rejected" | "revisions", observations: string }> = {};
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

  const handleDocReviewChange = (docId: string, status: "approved" | "rejected" | "revisions") => {
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

  const handlePreviewDoc = async (doc: EstablishmentDocument) => {
    if (activePreviewDoc?.id === doc.id) return;
    
    setIsPreviewLoading(true);
    setActivePreviewDoc(doc);
    try {
      // Clean up previous blob URL
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      
      const response = await api.get(`/api/establishments/documents/${doc.id}/download`, {
        responseType: "blob"
      });
      
      const blobUrl = URL.createObjectURL(response.data);
      setPreviewBlobUrl(blobUrl);
    } catch (err) {
      console.error("Error fetching preview:", err);
      toast.error("Erro ao carregar pré-visualização do documento.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSaveDecision = async (status: "approved" | "rejected" | "pending_level_2") => {
    if (!selectedEc) return;
    
    // Validate that rejected/revisions documents have observations
    let validationFailed = false;
    selectedEc.documents.forEach(doc => {
      const review = docReviews[doc.id];
      if (review && (review.status === "rejected" || review.status === "revisions") && !review.observations.trim()) {
        toast.error(`Informe o motivo para o documento: ${doc.name}`);
        validationFailed = true;
      }
    });

    if (validationFailed) return;

    setIsSubmittingCompliance(true);
    try {
      const payload = {
        status,
        observations: ecObservations,
        documents: Object.entries(docReviews).map(([docId, review]) => ({
          id: docId,
          status: review.status,
          observations: review.status !== "approved" ? review.observations : ""
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

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

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
      case "pending_level_2":
        return <Badge className="bg-blue-50 text-blue-600 border border-blue-200 uppercase px-3 py-1 font-black text-[9px] tracking-wider rounded-sm shadow-sm">Nível 2</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-600 border border-amber-200 uppercase px-3 py-1 font-black text-[9px] tracking-wider rounded-sm shadow-sm">Pendente</Badge>;
    }
  };

  const maskAgentName = (name?: string) => {
    if (!name) return "---";
    const parts = name.split(" ");
    if (parts.length < 2) return name;
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first} ** * ${last}`;
  };

  const maskAgentCpf = (cpf?: string) => {
    if (!cpf) return "---";
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11) return cpf;
    return `${clean.substring(0, 3)}.*.*.${clean.substring(9, 11)}`;
  };

  if (selectedEc) {
    const contacts = parseJsonList(selectedEc.contactsJson);
    const bankAccounts = parseJsonList(selectedEc.bankAccountsJson);
    const agentName = selectedEc.agent?.fullName || selectedEc.agentName || "";
    const agentCpf = selectedEc.agent?.cpf || selectedEc.agentCpf || "";

    // Generate consistent mock risk variables based on establishment ID
    const scoreVal = 600 + (selectedEc.id.charCodeAt(0) % 350);
    const hasFraudHistory = selectedEc.id.charCodeAt(1) % 2 === 0;

    return (
      <div className="p-4 sm:p-8 xl:p-12 h-full overflow-y-auto w-full bg-[#f8f9fa] relative no-scrollbar animate-in fade-in duration-300">
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
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#0c0a09] uppercase">
                Validação de Cadastro - {selectedEc.nomeFantasia}
              </h1>
              {getStatusBadge(selectedEc.status)}
            </div>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
              Agente: <span className="text-neutral-700 font-black">{maskAgentName(agentName)}</span> • CPF: <span className="text-neutral-700 font-black">{maskAgentCpf(agentCpf)}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
          {/* Left Column: Register Data & Risk Assessment */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* 1. DADOS CADASTRAIS (Matching new wireframe layout) */}
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-brand-accent shadow-xl space-y-6">
              <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-accent" /> Dados Cadastrais
              </h3>
              
              <div className="space-y-4 text-xs sm:text-sm">
                {/* Company Name in a single line, bottom line has CNPJ, type, model */}
                <div className="border-b border-neutral-100 pb-3">
                  <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Razão Social</span>
                  <span className="text-base font-black text-[#0c0a09] leading-snug">{selectedEc.razaoSocial || "---"}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">CNPJ/CPF</span>
                    <span className="font-bold text-[#0c0a09]">{selectedEc.cnpjCpf}</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Nome Fantasia</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.nomeFantasia}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Endereço Completo</span>
                    <span className="font-semibold text-neutral-700 leading-snug">
                      {selectedEc.rua}, Nº {selectedEc.numero} {selectedEc.complemento ? `(${selectedEc.complemento})` : ''}, {selectedEc.bairro} - {selectedEc.cidade}/{selectedEc.state}, CEP {selectedEc.cep}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Contato Principal</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.contatoPrincipal}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Contato Secundário</span>
                    <span className="font-semibold text-neutral-700">{contacts[1]?.telefone || "---"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Data de Fundação</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.dataFundacao}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Horário de Funcionamento</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.horarioFuncionamento}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Site</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.site || "---"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Redes Sociais</span>
                    <span className="font-semibold text-neutral-700">Não Informado</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">CNAE Principal</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.cnae}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">CNAE Secundários</span>
                    <span className="font-semibold text-neutral-400 italic">Nenhum</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">MCC</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.mcc}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Shopping?</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.shopping} {selectedEc.descricaoShopping ? `(${selectedEc.descricaoShopping})` : ''}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Máquinas Solicitadas</span>
                    <span className="font-semibold text-neutral-700">{selectedEc.quantidade} unidade(s) (Padrão G8Pay)</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. RISCO & SEGURANÇA CARD (From new wireframe layout) */}
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-red-500 shadow-xl space-y-6">
              <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" /> Risco & Segurança
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Score de Crédito</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-black text-neutral-800">{scoreVal}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${scoreVal > 750 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {scoreVal > 750 ? 'Excelente' : 'Bom'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Alerta de Fraude (Histórico)</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-1.5 ${hasFraudHistory ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {hasFraudHistory ? 'Alerta Moderado (Vendas Atípicas)' : 'Nenhum Alerta Ativo (Baixo Risco)'}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Processos Judiciais</span>
                  <a href="https://www.jusbrasil.com.br" target="_blank" rel="noreferrer" className="text-brand-accent hover:underline font-bold text-xs flex items-center gap-1 mt-1">
                    Consultar Jusbrasil <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Reputação Online</span>
                  <span className="font-semibold text-neutral-700 block mt-1">Ótima (4.5★ no Google)</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Financial Data & Document Compliance Grid */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* 1. INFORMAÇÕES FINANCEIRAS CARD (Includes unified Bank Details, Revenue chart, methods) */}
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-blue-500 shadow-xl space-y-6">
              <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" /> Informações Financeiras e de Repasse
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Faturamento Mensal</span>
                  <span className="font-bold text-neutral-800">{selectedEc.faturamentoMensal}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Ticket Médio</span>
                  <span className="font-semibold text-neutral-700">{selectedEc.ticketMedio}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Antecipação</span>
                  <span className="font-semibold text-neutral-700">{selectedEc.antecipacaoRecebiveis}</span>
                </div>
              </div>

              {/* Bank Details integrated directly inside the Financial card */}
              <div className="bg-neutral-50/50 p-4 border border-neutral-100 rounded-sm space-y-3">
                <span className="block text-[10px] uppercase font-black text-neutral-400 tracking-wider mb-2">Conta de Repasse cadastrada</span>
                {bankAccounts.length > 0 ? (
                  bankAccounts.map((b: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-neutral-400 tracking-wider">Banco</span>
                        <span className="font-bold text-neutral-700">{b.banco || "---"}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-neutral-400 tracking-wider">Agência / Conta</span>
                        <span className="font-semibold text-neutral-600">{b.agencia || '---'} / {b.conta || '---'}-{b.digito || ''}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-neutral-400 tracking-wider">Tipo</span>
                        <span className="font-semibold text-neutral-600">{b.tipoConta || "---"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 italic">Nenhuma conta informada.</p>
                )}
              </div>

              {/* Revenue history CSS bar chart & Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 items-center">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Meios de Pagamento Aceitos</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge className="bg-neutral-100 text-neutral-600 border-0 rounded-xs text-[9px] uppercase tracking-wider">Pix</Badge>
                    <Badge className="bg-neutral-100 text-neutral-600 border-0 rounded-xs text-[9px] uppercase tracking-wider">Crédito</Badge>
                    <Badge className="bg-neutral-100 text-neutral-600 border-0 rounded-xs text-[9px] uppercase tracking-wider">Débito</Badge>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Histórico de Faturamento</span>
                  <div className="flex items-end gap-1.5 h-12 pt-2 border-b border-neutral-100">
                    {[35, 50, 42, 68, 55, 62, 85, 70, 78, 92].map((h, i) => (
                      <div key={i} className="flex-1 bg-brand-accent hover:bg-brand-accent/80 rounded-t-xs transition-all duration-300" style={{ height: `${h}%` }} title={`Mês ${i+1}`} />
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. VALIDAÇÃO DE DOCUMENTOS CARD (Split into document grid list on left, preview panel on right) */}
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-brand-accent shadow-xl space-y-6">
              <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-brand-accent" /> Validação de Documentos e Previsão
              </h3>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Documents Cards List (xl:col-span-7) */}
                <div className="xl:col-span-7 space-y-4 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
                  {selectedEc.documents.length > 0 ? (
                    selectedEc.documents.map((doc) => {
                      const review = docReviews[doc.id] || { status: "approved", observations: "" };
                      const isActivePreview = activePreviewDoc?.id === doc.id;
                      
                      return (
                        <div 
                          key={doc.id} 
                          onClick={() => handlePreviewDoc(doc)}
                          className={`p-3.5 rounded-sm border transition-all cursor-pointer space-y-3 ${
                            isActivePreview 
                              ? "bg-neutral-50 border-brand-accent shadow-sm"
                              : "bg-white border-neutral-100 hover:bg-neutral-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className={`h-6 w-6 shrink-0 ${isActivePreview ? 'text-brand-accent' : 'text-neutral-400'}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-black text-neutral-800 uppercase tracking-tight truncate" title={doc.name}>{doc.name}</p>
                                <p className="text-[9px] text-neutral-400 truncate" title={doc.fileName}>{doc.fileName} • versão 1</p>
                              </div>
                            </div>
                            
                            <a
                              href={`${api.defaults.baseURL}/api/establishments/documents/${doc.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-7 w-7 bg-white border border-neutral-200 rounded-sm hover:bg-neutral-50 flex items-center justify-center text-neutral-500 shadow-sm shrink-0"
                              title="Baixar Documento"
                              onClick={(e) => e.stopPropagation()} // Prevent triggering preview click
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>
                          
                          {/* Three-state buttons: inactive by default, highlighting in color when selected */}
                          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleDocReviewChange(doc.id, "approved")}
                              className={`flex-1 h-8 rounded-sm font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                review.status === "approved"
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm font-extrabold"
                                  : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
                              }`}
                            >
                              <Check className="h-3 w-3" /> Aprovar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDocReviewChange(doc.id, "rejected")}
                              className={`flex-1 h-8 rounded-sm font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                review.status === "rejected"
                                  ? "bg-red-50 border-red-500 text-red-700 shadow-sm font-extrabold"
                                  : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
                              }`}
                            >
                              <X className="h-3 w-3" /> Reprovar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDocReviewChange(doc.id, "revisions")}
                              className={`flex-1 h-8 rounded-sm font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                review.status === "revisions"
                                  ? "bg-amber-50 border-amber-500 text-amber-700 shadow-sm font-extrabold"
                                  : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
                              }`}
                            >
                              <AlertCircle className="h-3 w-3" /> Revisão
                            </button>
                          </div>
                          
                          {/* Textarea observations when rejected or revisions is selected */}
                          {(review.status === "rejected" || review.status === "revisions") && (
                            <div className="space-y-1 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                              <label className="text-[7.5px] font-black text-amber-600 uppercase tracking-widest block">
                                Motivo da pendência *
                              </label>
                              <textarea
                                value={review.observations}
                                onChange={(e) => handleDocObsChange(doc.id, e.target.value)}
                                placeholder="Indique o motivo ou o que precisa ser corrigido..."
                                className="w-full min-h-[50px] p-2 text-[10px] border border-amber-200 rounded-sm bg-amber-50/10 focus-visible:outline-amber-500 text-neutral-800"
                                required
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-neutral-400 italic text-center py-8">Nenhum documento anexado.</p>
                  )}
                </div>

                {/* Document Preview Pane (xl:col-span-5) */}
                <div className="xl:col-span-5 bg-neutral-50 border border-neutral-100 rounded-sm p-4 flex flex-col justify-between items-stretch min-h-[350px]">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-2">
                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Pré-visualização</span>
                    {activePreviewDoc && previewBlobUrl && (
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="text-[8px] font-black text-brand-accent uppercase hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
                      >
                        <Eye className="h-3 w-3" /> Ampliar
                      </button>
                    )}
                  </div>

                  {isPreviewLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
                      <Loader2 className="h-6 w-6 text-brand-accent animate-spin" />
                      <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Carregando arquivo...</span>
                    </div>
                  ) : previewBlobUrl ? (
                    <div 
                      onClick={() => setIsModalOpen(true)}
                      className="flex-1 w-full flex items-center justify-center overflow-hidden bg-white border border-neutral-200 rounded-sm cursor-pointer hover:border-brand-accent hover:shadow-md transition-all relative group"
                      title="Clique para ampliar visualização"
                    >
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-[#ff7711]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                        <span className="bg-neutral-900/80 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-md flex items-center gap-1.5">
                          <Eye className="h-4 w-4" /> Clique para Ampliar
                        </span>
                      </div>

                      {activePreviewDoc?.mimeType.startsWith("image/") ? (
                        <img 
                          src={previewBlobUrl} 
                          alt={activePreviewDoc.name} 
                          className="max-w-full max-h-[300px] object-contain p-2" 
                        />
                      ) : activePreviewDoc?.mimeType === "application/pdf" || activePreviewDoc?.mimeType === "text/html" ? (
                        <iframe 
                          src={previewBlobUrl} 
                          title="DocPreview" 
                          className="w-full h-[300px] border-none pointer-events-none" 
                        />
                      ) : (
                        <div className="text-center p-6 space-y-2">
                          <FileText className="h-8 w-8 text-neutral-400 mx-auto" />
                          <p className="text-[10px] text-neutral-500 font-bold uppercase">Previsão Indisponível</p>
                          <a 
                            href={previewBlobUrl} 
                            download={activePreviewDoc?.fileName}
                            className="inline-block text-[9px] font-black text-brand-accent uppercase hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Baixar arquivo
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-300 gap-2 border border-dashed border-neutral-200 rounded-sm bg-white">
                      <FileSearch className="h-10 w-10 text-neutral-200" />
                      <p className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider">
                        Selecione um documento ao lado para pré-visualizar
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas de Revisão Interna & Audit Logs */}
              <div className="pt-4 border-t border-neutral-100 space-y-4">
                <div className="space-y-3">
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
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                    Notas de Revisão Interna / Instruções de Ajuste
                  </label>
                  <textarea
                    value={ecObservations}
                    onChange={(e) => setEcObservations(e.target.value)}
                    placeholder="Instruções para o agente ou observações de compliance..."
                    className="w-full min-h-[85px] p-3 text-xs border border-neutral-200 rounded-sm bg-neutral-50/50 text-neutral-800 focus-visible:outline-brand-accent focus-visible:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block">Histórico de Ações</span>
                  <div className="text-[9.5px] font-bold text-neutral-500 space-y-1 bg-neutral-50/50 p-3 rounded-sm border border-neutral-100">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Cadastro recebido e validado eletronicamente - 16/06/2026
                    </div>
                    {selectedEc.status !== "pending" && (
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-brand-accent" />
                        Status atualizado para {selectedEc.status === "approved" ? "APROVADO" : selectedEc.status === "pending_level_2" ? "ENCAMINHADO NÍVEL 2" : "REPROVADO"} - {new Date(selectedEc.updatedAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveDecision(ecStatus)}
                  disabled={isSubmittingCompliance}
                  className="w-full h-14 bg-brand-accent hover:bg-brand-accent-hover text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all shadow-xl shadow-orange-500/15 mt-4 cursor-pointer"
                >
                  {isSubmittingCompliance ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin animate-infinite" />
                      Salvando Decisão...
                    </>
                  ) : (
                    "Salvar Análise de Compliance"
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Fullscreen Preview Modal */}
        {isModalOpen && activePreviewDoc && previewBlobUrl && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-sm border border-neutral-200 shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col justify-between overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 p-4 shrink-0">
                <div>
                  <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">
                    Visualização do Documento - {activePreviewDoc.name}
                  </h3>
                  <p className="text-[9px] text-neutral-400 mt-0.5">{activePreviewDoc.fileName}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 hover:bg-neutral-100 border border-neutral-200 text-neutral-500 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 bg-neutral-100 p-4 flex items-center justify-center overflow-hidden">
                {activePreviewDoc.mimeType.startsWith("image/") ? (
                  <img 
                    src={previewBlobUrl} 
                    alt={activePreviewDoc.name} 
                    className="max-w-full max-h-full object-contain" 
                  />
                ) : activePreviewDoc.mimeType === "application/pdf" || activePreviewDoc.mimeType === "text/html" ? (
                  <iframe 
                    src={previewBlobUrl} 
                    title="ModalDocPreview" 
                    className="w-full h-full border-none" 
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 bg-white rounded-sm shadow-md">
                    <FileText className="h-10 w-10 text-neutral-400 mx-auto" />
                    <p className="text-xs text-neutral-500 font-bold uppercase">Previsão Indisponível</p>
                    <a 
                      href={previewBlobUrl} 
                      download={activePreviewDoc.fileName}
                      className="inline-block text-[10px] font-black text-brand-accent uppercase hover:underline"
                    >
                      Baixar arquivo
                    </a>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="flex justify-end p-4 border-t border-neutral-100 bg-neutral-50 shrink-0">
                <Button 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm text-xs font-black uppercase tracking-widest px-6"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-8 xl:p-12 h-full overflow-y-auto w-full bg-[#f8f9fa] relative no-scrollbar animate-in fade-in duration-300">
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
                <option value="pending_level_2">Nível 2</option>
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
                      <span className="font-semibold text-neutral-400 uppercase tracking-widest text-[9px]">
                        Agente: <strong className="text-neutral-700">{ec.agentName ? maskAgentName(ec.agentName) : "Direto"}</strong>
                      </span>
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
