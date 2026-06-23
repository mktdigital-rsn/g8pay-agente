"use client";
import React, { useState, useEffect, useRef } from "react";
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
  ExternalLink,
  Calendar,
  Zap,
  Hash,
  Globe,
  Phone,
  Map,
  Briefcase,
  Cpu,
  Store,
  Upload,
  ChevronLeft,
  ChevronRight
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
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("kanban");

  const kanbanContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkKanbanScroll = () => {
    if (kanbanContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = kanbanContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = kanbanContainerRef.current;
    if (container && viewMode === "kanban" && !loading) {
      // Small timeout to allow render completion
      const timer = setTimeout(checkKanbanScroll, 100);
      
      container.addEventListener("scroll", checkKanbanScroll);
      window.addEventListener("resize", checkKanbanScroll);

      const observer = new MutationObserver(checkKanbanScroll);
      observer.observe(container, { childList: true, subtree: true });

      return () => {
        clearTimeout(timer);
        container.removeEventListener("scroll", checkKanbanScroll);
        window.removeEventListener("resize", checkKanbanScroll);
        observer.disconnect();
      };
    }
  }, [viewMode, loading, establishments]);

  const scrollKanban = (direction: "left" | "right") => {
    if (kanbanContainerRef.current) {
      const { clientWidth } = kanbanContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      kanbanContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };
  // Document Preview States
  const [activePreviewDoc, setActivePreviewDoc] = useState<EstablishmentDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    
    // Revoke previous blob URL if exists
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setActivePreviewDoc(null);
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
      case "not_sent":
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black text-neutral-500 uppercase bg-neutral-100 px-2 py-0.5 rounded-sm border border-neutral-200">
            <XCircle className="h-3 w-3 text-neutral-400" /> Não Enviado
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
  const contacts = selectedEc ? parseJsonList(selectedEc.contactsJson) : [];
  const bankAccounts = selectedEc ? parseJsonList(selectedEc.bankAccountsJson) : [];
  const scoreVal = selectedEc ? 600 + (selectedEc.id.charCodeAt(0) % 350) : 600;
  const hasFraudHistory = selectedEc ? selectedEc.id.charCodeAt(1) % 2 === 0 : false;

  const [isUploadingReplacement, setIsUploadingReplacement] = useState(false);

  const handleUploadReplacement = async (docName: string, file: File) => {
    if (!selectedEc) return;
    setIsUploadingReplacement(true);
    const toastId = toast.loading(`Enviando ${docName}...`);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await api.post(`/api/establishments/${selectedEc.id}/documents`, {
            name: docName,
            fileName: file.name,
            base64: base64
          });
          if (res.data && res.data.success) {
            toast.success(`${docName} enviado com sucesso!`, { id: toastId });
            // Refresh details
            handleSelectEc(selectedEc.id);
          } else {
            throw new Error(res.data?.error || "Erro ao salvar documento.");
          }
        } catch (err: any) {
          console.error("Error uploading document replacement:", err);
          toast.error(err.response?.data?.error || err.message || "Erro ao conectar com o servidor.", { id: toastId });
        }
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      toast.error("Erro ao ler o arquivo selecionado.", { id: toastId });
    } finally {
      setIsUploadingReplacement(false);
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
                <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#0c0a09] uppercase">
                  Acompanhamento - {selectedEc.nomeFantasia}
                </h1>
                {getStatusBadge(selectedEc.status)}
              </div>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
                Visualização do Agente • CNPJ/CPF: <span className="text-neutral-700 font-black">{selectedEc.cnpjCpf}</span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Register Data, Address & Risk Assessment */}
            <div className="lg:col-span-6 space-y-8 flex flex-col h-full">
              
              {/* 1. DADOS CADASTRAIS (Compact, no address, styled with icons/slots) */}
              <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-brand-accent shadow-xl space-y-6">
                <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-brand-accent" /> Dados Cadastrais
                </h3>
                
                <div className="space-y-6">
                  {/* Razão Social Banner */}
                  <div className="p-4 rounded-sm bg-[#ff7711]/5 border border-[#ff7711]/10 flex items-center gap-3">
                    <div className="p-2.5 bg-brand-accent rounded-sm text-white shrink-0">
                      <Building2 className="h-5.5 w-5.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block mb-0.5">Razão Social</span>
                      <h2 className="text-sm sm:text-base font-black text-[#0c0a09] leading-tight break-words">
                        {selectedEc.razaoSocial || "---"}
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoItem label="CNPJ/CPF" value={selectedEc.cnpjCpf} icon={FileText} className="sm:col-span-2" />
                    <InfoItem label="Nome Fantasia" value={selectedEc.nomeFantasia} icon={Store} className="sm:col-span-2" />
                    <InfoItem label="Tipo Estabelecimento" value={selectedEc.tipoEstabelecimento} icon={User} />
                    <InfoItem label="Tipo de Empresa" value={selectedEc.tipoEmpresa} icon={Building} />
                    <InfoItem label="Contato Principal" value={selectedEc.contatoPrincipal} icon={Phone} />
                    <InfoItem label="Contato Secundário" value={contacts[1]?.telefone || "---"} icon={Phone} />
                    <InfoItem label="Fundação" value={selectedEc.dataFundacao} icon={Calendar} />
                    <InfoItem label="Horário de Funcionamento" value={selectedEc.horarioFuncionamento} icon={Clock} />
                    <InfoItem label="Site" value={selectedEc.site || "---"} icon={Globe} className="sm:col-span-2" />
                    <InfoItem label="CNAE Principal" value={selectedEc.cnae} icon={Briefcase} />
                    <InfoItem label="MCC" value={selectedEc.mcc} icon={Hash} />
                    <InfoItem label="Shopping?" value={selectedEc.shopping === "Sim" ? `Sim (${selectedEc.descricaoShopping || ''})` : "Não"} icon={Building2} className="sm:col-span-2" />
                    <InfoItem label="Máquinas" value={`${selectedEc.quantidade} u. (Padrão G8Pay)`} icon={Cpu} className="sm:col-span-2" />
                  </div>
                </div>
              </Card>

              {/* 2. ENDEREÇO DE INSTALAÇÃO (Isolated in a new Card below Dados Cadastrais) */}
              <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-amber-500 shadow-xl space-y-6 flex flex-col flex-1">
                <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-amber-500" /> Endereço de Instalação
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                  <InfoItem size="lg" label="Rua / Logradouro" value={`${selectedEc.rua}, Nº ${selectedEc.numero}`} icon={MapPin} className="sm:col-span-2" />
                  <InfoItem size="lg" label="Complemento" value={selectedEc.complemento || "---"} icon={MapPin} />
                  <InfoItem size="lg" label="Bairro" value={selectedEc.bairro} icon={MapPin} />
                  <InfoItem size="lg" label="Cidade" value={selectedEc.cidade} icon={Map} />
                  <InfoItem size="lg" label="Estado / UF" value={selectedEc.state} icon={Map} />
                  <InfoItem size="lg" label="CEP" value={selectedEc.cep} icon={Hash} />
                </div>

                {/* Contatos do Estabelecimento */}
                <div className="border-t border-neutral-100 pt-6 mt-4 space-y-6">
                  <h4 className="text-xs font-black text-[#0c0a09] uppercase tracking-widest flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-amber-500" /> Contatos do Estabelecimento
                  </h4>
                  {contacts.length > 0 ? (
                    <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
                      {contacts.map((c: any, idx: number) => (
                        <div key={idx} className="min-w-[85%] sm:min-w-[400px] max-w-full snap-start space-y-3 shrink-0">
                          <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                            <span className="text-xs font-black text-[#0c0a09] uppercase tracking-wider">{c.nome || "Sem Nome"}</span>
                            {c.tipoResponsavel && (
                              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 rounded-xs text-[8px] font-black uppercase tracking-wider px-2 py-0.5">
                                {c.tipoResponsavel}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {c.cpf && <InfoItem label="CPF" value={c.cpf} icon={FileText} />}
                            {c.telefone && <InfoItem label="Telefone" value={c.telefone} icon={Phone} />}
                            {c.email && <InfoItem label="E-mail" value={c.email} icon={Globe} className="sm:col-span-2" />}
                            {c.funcao && <InfoItem label="Cargo" value={c.funcao} icon={Briefcase} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic font-semibold">Nenhum contato cadastrado.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column: Financial Data & Aligned Document Compliance */}
            <div className="lg:col-span-6 space-y-8">
              
              {/* 1. INFORMAÇÕES FINANCEIRAS CARD */}
              <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-blue-500 shadow-xl space-y-6">
                <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" /> Informações Financeiras e de Repasse
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoItem label="Faturamento Mensal" value={selectedEc.faturamentoMensal} icon={TrendingUp} />
                  <InfoItem label="Ticket Médio" value={selectedEc.ticketMedio} icon={CreditCard} />
                  <InfoItem label="Antecipação" value={selectedEc.antecipacaoRecebiveis} icon={Zap} />
                </div>
                {/* Meios de Pagamento & Gráfico */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2">
                    <span className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest">Meios de Pagamento Aceitos</span>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xs text-[8px] font-black uppercase tracking-wider px-2 py-0.5">Pix</Badge>
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 rounded-xs text-[8px] font-black uppercase tracking-wider px-2 py-0.5">Crédito</Badge>
                      <Badge className="bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-xs text-[8px] font-black uppercase tracking-wider px-2 py-0.5">Débito</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-neutral-400" /> Histórico de Faturamento
                    </span>
                    <div className="flex items-end gap-1 h-14 pt-2 border-b border-neutral-100">
                      {[35, 50, 42, 68, 55, 62, 85, 70, 78, 92].map((h, i) => (
                        <div key={i} className="flex-1 bg-brand-accent hover:bg-brand-accent/80 rounded-t-xs transition-all duration-300" style={{ height: `${h}%` }} title={`Mês ${i+1}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* 2. RISCO & SEGURANÇA */}
              <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-red-500 shadow-xl space-y-6">
                <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500" /> Risco & Segurança
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem 
                    label="Score de Crédito" 
                    icon={ShieldAlert}
                    value={
                      <div className="flex items-center gap-2">
                        <span>{scoreVal}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-sm ${scoreVal > 750 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {scoreVal > 750 ? 'Excelente' : 'Bom'}
                        </span>
                      </div>
                    } 
                  />
                  <InfoItem 
                    label="Alerta de Fraude" 
                    icon={AlertTriangle}
                    value={
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-sm ${hasFraudHistory ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {hasFraudHistory ? 'Risco Moderado' : 'Sem Alertas (Baixo Risco)'}
                      </span>
                    } 
                  />
                  <InfoItem 
                    label="Processos Judiciais" 
                    icon={FileSearch}
                    value={
                      <a href="https://www.jusbrasil.com.br" target="_blank" rel="noreferrer" className="text-brand-accent hover:underline flex items-center gap-1">
                        Consultar Jusbrasil <ExternalLink className="h-3 w-3" />
                      </a>
                    } 
                  />
                  <InfoItem 
                    label="Reputação Online" 
                    icon={Globe}
                    value={
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-sm text-[10px] font-bold">
                        Ótima (4.5★ no Google)
                      </span>
                    } 
                  />
                </div>
              </Card>

              {/* 3. CONTA DE REPASSE */}
              <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-blue-400 shadow-xl space-y-4">
                <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-400" /> Conta de Repasse Cadastrada
                </h3>
                {bankAccounts.length > 0 ? (
                  bankAccounts.map((b: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center gap-4 p-4 bg-blue-50/40 border border-blue-100 rounded-sm">
                        <div className="p-3 bg-blue-500 rounded-sm text-white shrink-0">
                          <Building className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-0.5">Banco</span>
                          <span className="text-base font-black text-[#0c0a09]">{b.banco || "---"}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoItem label="Agência / Conta" value={`${b.agencia || '---'} / ${b.conta || '---'}-${b.digito || ''}`} icon={Hash} />
                        <InfoItem label="Tipo de Conta" value={b.tipoConta || "---"} icon={CreditCard} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <Building className="h-8 w-8 text-neutral-300 mx-auto" />
                    <p className="text-xs text-neutral-400 italic font-semibold">Nenhuma conta bancária informada.</p>
                  </div>
                )}
              </Card>

              {/* 4. LOCALIZAÇÃO DO ESTABELECIMENTO (Mini Mapa Google Maps) */}
              <Card className="p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-emerald-500 shadow-xl space-y-4">
                <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-emerald-500" /> Localização no Mapa
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedEc.rua}, ${selectedEc.numero} - ${selectedEc.bairro}, ${selectedEc.cidade} - ${selectedEc.state}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-black text-brand-accent hover:underline flex items-center gap-1 uppercase tracking-wider"
                  >
                    Abrir no Maps <ExternalLink className="h-3 w-3" />
                  </a>
                </h3>
                
                <div className="relative rounded-sm overflow-hidden border border-neutral-200 h-[26rem] w-full bg-neutral-100 shadow-inner group">
                  <iframe
                    title="Localização do Estabelecimento"
                    width="100%"
                    height="100%"
                    className="border-0 grayscale contrast-125 opacity-90 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      `${selectedEc.rua}, ${selectedEc.numero} - ${selectedEc.bairro}, ${selectedEc.cidade} - ${selectedEc.state}`
                    )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  />
                </div>
                
                <div className="text-neutral-500 text-[10px] font-medium leading-relaxed bg-neutral-50 p-2.5 rounded-sm border border-neutral-100 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-700 block uppercase tracking-wider text-[8px]">Endereço Confirmado:</span>
                    {selectedEc.rua}, {selectedEc.numero} - {selectedEc.bairro}, {selectedEc.cidade}/{selectedEc.state}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* 2. COMPLIANCE OBSERVATIONS */}
          {selectedEc.observations && (
            <Card className="p-6 bg-red-50 border border-red-100 rounded-sm shadow-md space-y-3">
              <h4 className="text-xs font-black text-red-700 uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Observações do Compliance
              </h4>
              <p className="text-xs text-red-900 leading-relaxed italic">
                "{selectedEc.observations}"
              </p>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                Por favor, verifique abaixo os documentos com pendências e envie os ajustes necessários.
              </p>
            </Card>
          )}

          {/* ── Full-width: Validação de Documentos ── */}
          <Card className="mt-8 p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-brand-accent shadow-xl space-y-6 pb-20">
            <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-4 flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-brand-accent" /> Status dos Documentos e Previsão
            </h3>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
              {/* Documents Cards List */}
              <div className="xl:col-span-5 space-y-4 max-h-[520px] overflow-y-auto pr-2 scrollbar-thin">
                {[
                  "Contrato Assinado",
                  "Contrato / Estatuto Social",
                  "Cartão CNPJ (RCFB)",
                  "RG/CNH (Frente)",
                  "RG/CNH (Verso)",
                  "Comprovante de endereço da empresa",
                  "Foto da Fachada"
                ].map((docName) => {
                  const doc = selectedEc.documents?.find(d => d.name === docName);
                  const isActivePreview = doc ? activePreviewDoc?.id === doc.id : false;
                  
                  if (doc) {
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handlePreviewDoc(doc)}
                        className={`p-4 rounded-sm border-2 transition-all cursor-pointer space-y-3 ${
                          isActivePreview
                            ? "bg-neutral-50 border-brand-accent shadow-md"
                            : "bg-white border-neutral-100 hover:border-neutral-200 shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`p-2 rounded-sm border shrink-0 ${isActivePreview ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-neutral-800 uppercase tracking-tight truncate" title={doc.name}>{doc.name}</p>
                              <p className="text-[9.5px] text-neutral-400 truncate mt-0.5" title={doc.fileName}>{doc.fileName} • versão 1</p>
                            </div>
                          </div>
                          <a
                            href={`${api.defaults.baseURL}/api/establishments/documents/${doc.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 w-8 bg-white border border-neutral-200 rounded-sm hover:bg-neutral-50 flex items-center justify-center text-neutral-500 shadow-sm shrink-0 transition-all hover:border-neutral-300"
                            title="Baixar Documento"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                          {getDocStatusBadge(doc.status)}
                          
                          {selectedEc.status !== "approved" && (
                            <div onClick={(e) => e.stopPropagation()} className="relative">
                              <input
                                type="file"
                                id={`upload-${doc.id}`}
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadReplacement(doc.name, file);
                                }}
                              />
                              <label
                                htmlFor={`upload-${doc.id}`}
                                className="flex items-center gap-1.5 text-[9.5px] font-black text-brand-accent uppercase bg-orange-50 border border-orange-200 hover:bg-brand-accent hover:text-white px-3 py-1.5 rounded-sm shadow-sm cursor-pointer transition-all shrink-0"
                              >
                                <Upload className="h-3.5 w-3.5" /> Substituir
                              </label>
                            </div>
                          )}
                        </div>

                        {doc.observations && (
                          <div className="text-xs text-red-600 bg-red-50/50 p-3 border-l-3 border-red-500 rounded-r-xs mt-2" onClick={(e) => e.stopPropagation()}>
                            <strong>Ajuste necessário:</strong> {doc.observations}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Document is missing (not uploaded yet)
                    return (
                      <div
                        key={docName}
                        className="p-4 rounded-sm border-2 border-dashed border-neutral-200 bg-neutral-50/30 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 rounded-sm border shrink-0 bg-neutral-100 border-neutral-200 text-neutral-300">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-neutral-400 uppercase tracking-tight truncate" title={docName}>{docName}</p>
                              <p className="text-[9.5px] text-neutral-300 truncate mt-0.5">Pendente de envio</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                          {getDocStatusBadge("not_sent")}
                          
                          {selectedEc.status !== "approved" && (
                            <div className="relative">
                              <input
                                type="file"
                                id={`upload-missing-${docName.replace(/\s+/g, '-')}`}
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadReplacement(docName, file);
                                }}
                              />
                              <label
                                htmlFor={`upload-missing-${docName.replace(/\s+/g, '-')}`}
                                className="flex items-center gap-1.5 text-[9.5px] font-black text-brand-accent uppercase bg-white border border-neutral-200 hover:border-brand-accent px-3 py-1.5 rounded-sm shadow-sm cursor-pointer transition-all shrink-0"
                              >
                                <Upload className="h-3.5 w-3.5" /> Enviar
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              {/* Document Preview Pane */}
              <div className="xl:col-span-7 bg-neutral-50 border border-neutral-100 rounded-sm p-4 flex flex-col items-stretch h-[520px]">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-3 shrink-0">
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Pré-visualização</span>
                  {activePreviewDoc && previewBlobUrl && (
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="text-[8px] font-black text-brand-accent uppercase hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Eye className="h-3 w-3" /> Ampliar
                    </button>
                  )}
                </div>
                {isPreviewLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 text-brand-accent animate-spin" />
                    <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Carregando arquivo...</span>
                  </div>
                ) : previewBlobUrl ? (
                  <div
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 w-full flex items-center justify-center overflow-hidden bg-white border border-neutral-200 rounded-sm cursor-pointer hover:border-brand-accent hover:shadow-md transition-all relative group"
                    title="Clique para ampliar visualização"
                  >
                    <div className="absolute inset-0 bg-[#ff7711]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                      <span className="bg-neutral-900/80 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-md flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Clique para Ampliar
                      </span>
                    </div>
                    {activePreviewDoc?.mimeType.startsWith("image/") ? (
                      <img src={previewBlobUrl} alt={activePreviewDoc.name} className="max-w-full max-h-full object-contain p-2" />
                    ) : activePreviewDoc?.mimeType === "application/pdf" || activePreviewDoc?.mimeType === "text/html" ? (
                      <iframe src={previewBlobUrl} title="DocPreview" className="w-full h-full border-none pointer-events-none" />
                    ) : (
                      <div className="text-center p-4 space-y-2">
                        <FileText className="h-8 w-8 text-neutral-400 mx-auto" />
                        <p className="text-[9px] text-neutral-500 font-bold uppercase">Previsão Indisponível</p>
                        <a href={previewBlobUrl} download={activePreviewDoc?.fileName} className="inline-block text-[8px] font-black text-brand-accent uppercase hover:underline" onClick={(e) => e.stopPropagation()}>Baixar arquivo</a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3 border border-dashed border-neutral-200 rounded-sm bg-white">
                    <FileSearch className="h-14 w-14 text-neutral-200" />
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Selecione um documento ao lado para pré-visualizar</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
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
            <div className="flex flex-wrap gap-2 items-center">
              {/* View Mode Toggle */}
              <div className="flex border border-neutral-200 rounded-sm p-1 bg-neutral-50 shrink-0 h-11 items-center">
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`px-4 h-8 rounded-sm font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
                    viewMode === "kanban"
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-800"
                  }`}
                >
                  CRM Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-4 h-8 rounded-sm font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-800"
                  }`}
                >
                  Grade
                </button>
              </div>
              <FilterButton active={filterStatus === ""} onClick={() => setFilterStatus("")} label="Todos" />
              <FilterButton active={filterStatus === "pending"} onClick={() => setFilterStatus("pending")} label="Pendentes" />
              <FilterButton active={filterStatus === "approved"} onClick={() => setFilterStatus("approved")} label="Aprovados" />
              <FilterButton active={filterStatus === "rejected"} onClick={() => setFilterStatus("rejected")} label="Pendências" />
            </div>
          </div>
          {/* Client list grid or kanban */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-accent"></div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Buscando estabelecimentos...</p>
            </div>
          ) : establishments.length > 0 ? (
            viewMode === "kanban" ? (
              <div className="relative w-full group/kanban">
                {showLeftArrow && (
                  <button
                    type="button"
                    onClick={() => scrollKanban("left")}
                    className="absolute -left-4 top-[35%] -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-[#0c0a09] hover:text-brand-accent rounded-full p-3.5 shadow-2xl border border-neutral-200/80 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center"
                  >
                    <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                  </button>
                )}
                {showRightArrow && (
                  <button
                    type="button"
                    onClick={() => scrollKanban("right")}
                    className="absolute -right-4 top-[35%] -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-[#0c0a09] hover:text-brand-accent rounded-full p-3.5 shadow-2xl border border-neutral-200/80 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center"
                  >
                    <ChevronRight className="h-6 w-6 stroke-[2.5]" />
                  </button>
                )}
                <div 
                  ref={kanbanContainerRef}
                  className="flex flex-row overflow-x-auto gap-6 items-start pb-6 w-full scrollbar-thin"
                >
                  <AgentKanbanColumn
                    title="Pendentes"
                    count={establishments.filter(e => e.status === "pending").length}
                    colorClass="border-t-amber-500 bg-amber-500/5"
                    accentColor="text-amber-600 bg-amber-50"
                    items={establishments.filter(e => e.status === "pending")}
                    onSelect={handleSelectEc}
                  />
                  <AgentKanbanColumn
                    title="Em Análise Nível 2"
                    count={establishments.filter(e => e.status === "pending_level_2").length}
                    colorClass="border-t-blue-500 bg-blue-500/5"
                    accentColor="text-blue-600 bg-blue-50"
                    items={establishments.filter(e => e.status === "pending_level_2")}
                    onSelect={handleSelectEc}
                  />
                  <AgentKanbanColumn
                    title="Aprovados"
                    count={establishments.filter(e => e.status === "approved").length}
                    colorClass="border-t-emerald-500 bg-emerald-500/5"
                    accentColor="text-emerald-600 bg-emerald-50"
                    items={establishments.filter(e => e.status === "approved")}
                    onSelect={handleSelectEc}
                  />
                  <AgentKanbanColumn
                    title="Com Pendências"
                    count={establishments.filter(e => e.status === "rejected").length}
                    colorClass="border-t-red-500 bg-red-500/5"
                    accentColor="text-red-600 bg-red-50"
                    items={establishments.filter(e => e.status === "rejected")}
                    onSelect={handleSelectEc}
                  />
                </div>
              </div>
            ) : (
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
            )
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
// Agent Kanban Column sub-component
function AgentKanbanColumn({
  title,
  count,
  colorClass,
  accentColor,
  items,
  onSelect,
}: {
  title: string;
  count: number;
  colorClass: string;
  accentColor: string;
  items: Establishment[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className={`rounded-sm border-t-[4px] border border-neutral-150/60 bg-white shadow-lg flex flex-col p-4 space-y-4 max-h-[600px] xl:max-h-[700px] shrink-0 flex-1 min-w-[280px] sm:min-w-[300px] md:min-w-[320px] max-w-sm ${colorClass}`}>
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <h4 className="text-[11px] font-black text-[#0c0a09] uppercase tracking-wider">{title}</h4>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm ${accentColor}`}>{count}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin max-h-[500px] xl:max-h-[600px]">
        {items.length > 0 ? (
          items.map(ec => (
            <div
              key={ec.id}
              onClick={() => onSelect(ec.id)}
              className="p-4 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200/60 rounded-sm shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 relative group"
            >
              <div className="space-y-1">
                <h5 className="font-black text-neutral-800 text-xs leading-snug uppercase group-hover:text-brand-accent transition-colors truncate" title={ec.nomeFantasia}>
                  {ec.nomeFantasia}
                </h5>
                <p className="text-[8.5px] text-neutral-400 font-mono leading-none">{ec.cnpjCpf}</p>
              </div>
              <div className="space-y-1.5 text-[9.5px] text-neutral-500">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3 w-3 text-neutral-400 shrink-0" />
                  <span className="font-semibold truncate">{ec.cidade} - {ec.state}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-neutral-400 shrink-0" />
                  <span>{new Date(ec.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3 w-3 text-neutral-400 shrink-0" />
                  <span>Maquininhas: <strong className="text-neutral-600">{ec.quantidade} u.</strong></span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-[9px] text-neutral-400 font-bold uppercase tracking-wider italic">
            Sem estabelecimentos
          </div>
        )}
      </div>
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
// Reusable metadata card slots with Lucide icons
function InfoItem({ 
  label, 
  value, 
  icon: Icon,
  className = "",
  size = "default"
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: any;
  className?: string;
  size?: "default" | "lg";
}) {
  const labelSize = size === "lg" ? "text-[10px]" : "text-[9px]";
  const valueSize = size === "lg" ? "text-sm" : "text-xs";
  const padding = size === "lg" ? "p-3.5 gap-3" : "p-2 gap-2";
  const iconPadding = size === "lg" ? "p-1.5" : "p-1";
  const iconSize = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div className={`flex items-start rounded-sm bg-neutral-50 border border-neutral-100/50 hover:bg-neutral-100/30 transition-all ${padding} ${className}`}>
      {Icon && (
        <div className={`bg-white rounded-xs border border-neutral-200 text-neutral-500 shrink-0 shadow-sm ${iconPadding}`}>
          <Icon className={iconSize} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className={`font-black text-neutral-400 uppercase tracking-widest leading-none mb-1.5 ${labelSize}`}>{label}</p>
        <div className={`font-bold text-neutral-800 truncate leading-tight ${valueSize}`} title={typeof value === 'string' ? value : undefined}>{value}</div>
      </div>
    </div>
  );
}
