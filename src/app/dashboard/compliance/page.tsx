"use client";
import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search,
  Filter,
  CheckCircle2,
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
  ChevronLeft,
  ChevronRight
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

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("kanban");
  const [exportingType, setExportingType] = useState<"pdf" | "csv" | "xls" | null>(null);

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

  const normalizeText = (value?: string | null) =>
    (value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const parseDateAtStartOfDay = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
  };

  const parseDateAtEndOfDay = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1, 23, 59, 59, 999);
  };

  const filteredEstablishments = establishments.filter((ec) => {
    const statusMatches = !filterStatus || ec.status === filterStatus;
    const search = normalizeText(searchQuery);
    const agentSearch = normalizeText(filterAgent);
    const createdAt = new Date(ec.createdAt);
    const dateFromMatches = !filterDateFrom || createdAt >= parseDateAtStartOfDay(filterDateFrom);
    const dateToMatches = !filterDateTo || createdAt <= parseDateAtEndOfDay(filterDateTo);
    const searchMatches =
      !search ||
      [
        ec.nomeFantasia,
        ec.razaoSocial,
        ec.cnpjCpf,
        ec.agentName,
        ec.agentCpf,
        ec.agentId,
        ec.cidade,
        ec.state,
      ].some((field) => normalizeText(field).includes(search));
    const agentMatches =
      !agentSearch ||
      [ec.agentName, ec.agentCpf, ec.agentId].some((field) => normalizeText(field).includes(agentSearch));

    return statusMatches && searchMatches && agentMatches && dateFromMatches && dateToMatches;
  });

  const filterSummary = [
    filterStatus ? `status ${filterStatus}` : null,
    filterAgent ? `agente ${filterAgent}` : null,
    filterDateFrom ? `de ${filterDateFrom}` : null,
    filterDateTo ? `até ${filterDateTo}` : null,
    searchQuery ? `busca "${searchQuery}"` : null,
  ].filter(Boolean) as string[];

  function formatStatusLabel(status: Establishment["status"]) {
    switch (status) {
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Reprovado";
      case "pending_level_2":
        return "Nível 2";
      default:
        return "Pendente";
    }
  }

  const exportRows = filteredEstablishments.map((ec) => ({
    nomeFantasia: ec.nomeFantasia,
    razaoSocial: ec.razaoSocial || "---",
    cnpjCpf: ec.cnpjCpf,
    agente: ec.agentName || "Sem vínculo",
    agenteCpf: ec.agentCpf || "---",
    status: formatStatusLabel(ec.status),
    cidade: `${ec.cidade}/${ec.state}`,
    criadoEm: new Date(ec.createdAt).toLocaleDateString("pt-BR"),
    atualizadoEm: new Date(ec.updatedAt).toLocaleDateString("pt-BR"),
  }));

  const downloadFile = (content: BlobPart, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const loadLogoDataUrl = async () => {
    const response = await fetch("/logo_g8_white.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  const addPageFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.6);
    doc.line(40, pageHeight - 28, pageWidth - 40, pageHeight - 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text("Relatório de Compliance de Estabelecimentos Comerciais", 40, pageHeight - 16);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 40, pageHeight - 16, { align: "right" });
  };

  const handleExport = async (type: "pdf" | "csv" | "xls") => {
    if (!filteredEstablishments.length) {
      toast.error("Não há estabelecimentos para exportar com os filtros atuais.");
      return;
    }

    setExportingType(type);
    const toastId = toast.loading(`Preparando relatório ${type.toUpperCase()}...`);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filenameBase = `relatorio_compliance_ec_${timestamp}`;

      if (type === "pdf") {
        const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        const logoDataUrl = await loadLogoDataUrl();
        const pageWidth = doc.internal.pageSize.getWidth();

        if (logoDataUrl) {
          doc.addImage(logoDataUrl, "PNG", 40, 24, 96, 38);
        }

        doc.setTextColor(17, 24, 39);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Relatório de Compliance de E.C.", 150, 42);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 150, 58);
        doc.text(`Registros: ${filteredEstablishments.length}`, 150, 73);
        doc.text(`Período: ${filterDateFrom || "início"} até ${filterDateTo || "hoje"}`, 150, 88);

        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.6);
        doc.line(40, 104, pageWidth - 40, 104);

        autoTable(doc, {
          startY: 116,
          head: [[
            "Estabelecimento",
            "CNPJ/CPF",
            "Agente",
            "Status",
            "Cidade/UF",
            "Criado em",
            "Atualizado em",
          ]],
          body: exportRows.map((row) => [
            row.nomeFantasia,
            row.cnpjCpf,
            row.agente,
            row.status,
            row.cidade,
            row.criadoEm,
            row.atualizadoEm,
          ]),
          styles: { fontSize: 8, cellPadding: 4 },
          headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          margin: { left: 40, right: 40 },
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
          doc.setPage(pageNumber);
          addPageFooter(doc, pageNumber, totalPages);
        }

        doc.save(`${filenameBase}.pdf`);
      } else {
        const headers = [
          "Estabelecimento",
          "Razão Social",
          "CNPJ/CPF",
          "Agente",
          "CPF do Agente",
          "Status",
          "Cidade/UF",
          "Criado em",
          "Atualizado em",
        ];
        const rows = exportRows.map((row) =>
          [
            row.nomeFantasia,
            row.razaoSocial,
            row.cnpjCpf,
            row.agente,
            row.agenteCpf,
            row.status,
            row.cidade,
            row.criadoEm,
            row.atualizadoEm,
          ]
            .map((value) => escapeCsvValue(String(value)))
            .join(";")
        );
        const csvContent = [headers.map(escapeCsvValue).join(";"), ...rows].join("\n");
        downloadFile(
          `\uFEFF${csvContent}`,
          `${filenameBase}.${type}`,
          type === "csv" ? "text/csv;charset=utf-8;" : "application/vnd.ms-excel;charset=utf-8;"
        );
      }

      toast.success("Relatório exportado com sucesso!", { id: toastId });
    } catch (err) {
      console.error("Error exporting compliance report:", err);
      toast.error("Erro ao exportar relatório.", { id: toastId });
    } finally {
      setExportingType(null);
    }
  };
  
  // Compliance Review States for Selected E.C.
  const [docReviews, setDocReviews] = useState<Record<string, { status: "approved" | "rejected" | "revisions" | "pending", observations: string }>>({}); 
  const [ecStatus, setEcStatus] = useState<"approved" | "rejected" | "pending_level_2" | null>(null);
  const [ecObservations, setEcObservations] = useState("");
  const [isSubmittingCompliance, setIsSubmittingCompliance] = useState(false);
  // Document Preview States
  const [activePreviewDoc, setActivePreviewDoc] = useState<EstablishmentDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetchEstablishments = async (overrides?: {
    status?: string;
    search?: string;
    agent?: string;
    createdFrom?: string;
    createdTo?: string;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const effectiveStatus = overrides?.status ?? filterStatus;
      const effectiveSearch = overrides?.search ?? searchQuery;
      const effectiveAgent = overrides?.agent ?? filterAgent;
      const effectiveCreatedFrom = overrides?.createdFrom ?? filterDateFrom;
      const effectiveCreatedTo = overrides?.createdTo ?? filterDateTo;

      if (effectiveStatus) params.set("status", effectiveStatus);
      if (effectiveSearch) params.set("search", effectiveSearch);
      if (effectiveAgent) params.set("agent", effectiveAgent);
      if (effectiveCreatedFrom) params.set("createdFrom", effectiveCreatedFrom);
      if (effectiveCreatedTo) params.set("createdTo", effectiveCreatedTo);

      const queryString = params.toString();
      const res = await api.get(`/api/establishments${queryString ? `?${queryString}` : ""}`);
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
  }, []);
  const handleSelectEc = async (id: string) => {
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
        const initialReviews: Record<string, { status: "approved" | "rejected" | "revisions" | "pending", observations: string }> = {};
        details.documents.forEach(doc => {
          initialReviews[doc.id] = {
            status: "pending" as any,
            observations: doc.observations || ""
          };
        });
        setDocReviews(initialReviews);
        setEcStatus(details.status === "pending" ? null : details.status as any);
      }
    } catch (err: any) {
      console.error("Error loading E.C. details:", err);
      toast.error("Erro ao carregar detalhes do estabelecimento.");
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
        documents: Object.entries(docReviews)
          .filter(([_, review]) => review.status !== "pending")
          .map(([docId, review]) => ({
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
    return name.trim();
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
              Responsável: <span className="text-neutral-700 font-black">{agentName || "Sem vínculo"}</span> • CPF: <span className="text-neutral-700 font-black">{maskAgentCpf(agentCpf)}</span>
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
                  <InfoItem label="Agente Responsável" value={agentName || "Sem vínculo"} icon={User} className="sm:col-span-2" />
                  <InfoItem label="CPF do Agente" value={agentCpf ? maskAgentCpf(agentCpf) : "---"} icon={Hash} />
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 content-start">
                <InfoItem size="lg" label="Rua / Logradouro" value={`${selectedEc.rua}, Nº ${selectedEc.numero}`} icon={MapPin} className="sm:col-span-2" />
                <InfoItem size="lg" label="Complemento" value={selectedEc.complemento || "---"} icon={MapPin} />
                <InfoItem size="lg" label="Bairro" value={selectedEc.bairro} icon={MapPin} />
                <InfoItem size="lg" label="Cidade" value={selectedEc.cidade} icon={Map} />
                <InfoItem size="lg" label="Estado / UF" value={selectedEc.state} icon={Map} />
                <InfoItem size="lg" label="CEP" value={selectedEc.cep} icon={Hash} />
              </div>
            </Card>
          </div>
          {/* Right Column: Financial Data & Aligned Document Compliance */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* 1. INFORMAÇÕES FINANCEIRAS CARD (Includes banking details, revenue CSS chart, tags) */}
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
            {/* 2. RISCO & SEGURANÇA (movido para cá) */}
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
            {/* 3. CONTA DE REPASSE — card separado para preencher o espaço */}
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
              
              <div className="relative rounded-sm overflow-hidden border border-neutral-200 h-56 w-full bg-neutral-100 shadow-inner group">
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

        {/* ── Full-width: Validação de Documentos + Parecer Final ── */}
        <Card className="mt-8 p-6 md:p-8 bg-white border border-neutral-100 border-l-[6px] border-l-brand-accent shadow-xl space-y-6 pb-20">
          <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-wider border-b border-neutral-100 pb-4 flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-brand-accent" /> Validação de Documentos e Previsão
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
            {/* Documents Cards List */}
            <div className="xl:col-span-5 space-y-4 max-h-[520px] overflow-y-auto pr-2 scrollbar-thin">
              {selectedEc.documents.length > 0 ? (
                selectedEc.documents.map((doc) => {
                  const review = docReviews[doc.id] || { status: "pending", observations: "" };
                  const isActivePreview = activePreviewDoc?.id === doc.id;
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
                      {/* Three-state buttons — all gray by default */}
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDocReviewChange(doc.id, "approved")}
                          className={`flex-1 h-9 rounded-sm font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                            review.status === "approved"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                              : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
                          }`}
                        >
                          <Check className="h-3 w-3" /> Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDocReviewChange(doc.id, "rejected")}
                          className={`flex-1 h-9 rounded-sm font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                            review.status === "rejected"
                              ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                              : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
                          }`}
                        >
                          <X className="h-3 w-3" /> Reprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDocReviewChange(doc.id, "revisions")}
                          className={`flex-1 h-9 rounded-sm font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                            review.status === "revisions"
                              ? "bg-amber-50 border-amber-500 text-amber-700 shadow-sm"
                              : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
                          }`}
                        >
                          <AlertCircle className="h-3 w-3" /> Revisão
                        </button>
                      </div>
                      {(review.status === "rejected" || review.status === "revisions") && (
                        <div className="space-y-1 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[8px] font-black text-amber-600 uppercase tracking-widest block">
                            Motivo da pendência *
                          </label>
                          <textarea
                            value={review.observations}
                            onChange={(e) => handleDocObsChange(doc.id, e.target.value)}
                            placeholder="Indique o que precisa ser corrigido..."
                            className="w-full min-h-[50px] p-2 text-xs border border-amber-200 rounded-sm bg-amber-50/10 focus-visible:outline-amber-500 text-neutral-800"
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
          {/* Parecer Final */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-black text-[#0c0a09] uppercase tracking-widest">Parecer Final do Credenciamento</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEcStatus("approved")}
                  className={`h-12 rounded-sm font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                    ecStatus === "approved"
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                      : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
                  }`}
                >
                  <Check className="h-4 w-4" /> Aprovar E.C.
                </button>
                <button
                  type="button"
                  onClick={() => setEcStatus("rejected")}
                  className={`h-12 rounded-sm font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                    ecStatus === "rejected"
                      ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-500/10"
                      : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
                  }`}
                >
                  <X className="h-4 w-4" /> Reprovar E.C.
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">
                Notas de Revisão Interna / Instruções de Ajuste
              </label>
              <textarea
                value={ecObservations}
                onChange={(e) => setEcObservations(e.target.value)}
                placeholder="Instruções para o agente ou observações de compliance..."
                className="w-full min-h-[70px] p-3 text-sm border border-neutral-200 rounded-sm bg-neutral-50/50 text-neutral-800 focus-visible:outline-brand-accent focus-visible:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-black text-neutral-500 uppercase tracking-widest block">Histórico de Ações</span>
              <div className="text-xs font-bold text-neutral-500 space-y-2 bg-neutral-50/50 p-4 rounded-sm border border-neutral-100">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Cadastro recebido e validado eletronicamente - 16/06/2026
                </div>
                {selectedEc.status !== "pending" && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <AlertCircle className="h-4 w-4 shrink-0 text-brand-accent" />
                    Status atualizado para {selectedEc.status === "approved" ? "APROVADO" : selectedEc.status === "pending_level_2" ? "ENCAMINHADO NÍVEL 2" : "REPROVADO"} - {new Date(selectedEc.updatedAt).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={() => {
                if (!ecStatus) {
                  toast.error("Selecione um parecer final para o credenciamento.");
                  return;
                }
                handleSaveDecision(ecStatus);
              }}
              disabled={isSubmittingCompliance}
              className="w-full h-11 bg-brand-accent hover:bg-brand-accent-hover text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
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
        <Card className="p-5 bg-white border border-neutral-100 shadow-xl rounded-sm space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 px-4 h-12 rounded-sm xl:col-span-2">
              <Search className="h-5 w-5 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por Nome Fantasia, CNPJ, cidade ou agente..."
                className="bg-transparent border-none text-[#0c0a09] placeholder-neutral-400 text-xs font-bold uppercase tracking-wider focus-visible:outline-none flex-1"
              />
            </div>
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 px-4 h-12 rounded-sm xl:col-span-1">
              <User className="h-5 w-5 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                placeholder="Agente"
                className="bg-transparent border-none text-[#0c0a09] placeholder-neutral-400 text-xs font-bold uppercase tracking-wider focus-visible:outline-none flex-1"
              />
            </div>
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-sm px-4 h-12">
              <Filter className="h-4 w-4 text-neutral-400 shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none text-[#0c0a09] text-xs font-black uppercase tracking-wider focus-visible:outline-none cursor-pointer flex-1"
              >
                <option value="">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Reprovados</option>
                <option value="pending_level_2">Nível 2</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-sm px-4 h-12">
              <Calendar className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-transparent border-none text-[#0c0a09] text-xs font-black uppercase tracking-wider focus-visible:outline-none cursor-pointer flex-1"
                title="Data inicial"
              />
            </div>
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-sm px-4 h-12">
              <Calendar className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="bg-transparent border-none text-[#0c0a09] text-xs font-black uppercase tracking-wider focus-visible:outline-none cursor-pointer flex-1"
                title="Data final"
              />
            </div>
          </div>
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex border border-neutral-200 rounded-sm p-1 bg-neutral-50 shrink-0 h-12 items-center">
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`px-4 h-9 rounded-sm font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
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
                  className={`px-4 h-9 rounded-sm font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-800"
                  }`}
                >
                  Grade
                </button>
              </div>
              <div className="px-4 h-12 rounded-sm border border-neutral-200 bg-neutral-50 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-600">
                <span className="text-brand-accent">{filteredEstablishments.length}</span>
                <span>/</span>
                <span>{establishments.length}</span>
                <span className="text-neutral-400">registros</span>
              </div>
              {filterSummary.length > 0 && (
                <div className="hidden xl:flex px-4 h-12 rounded-sm border border-amber-200 bg-amber-50/60 items-center text-[10px] font-black uppercase tracking-widest text-amber-700 max-w-[42rem] truncate">
                  {filterSummary.join(" • ")}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => handleExport("pdf")}
                disabled={!!exportingType}
                className="h-12 bg-neutral-900 hover:bg-black text-white rounded-sm font-black text-[10px] uppercase tracking-widest px-4 cursor-pointer shadow-sm flex items-center gap-2"
              >
                {exportingType === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                PDF
              </Button>
              <Button
                type="button"
                onClick={() => handleExport("csv")}
                disabled={!!exportingType}
                className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-black text-[10px] uppercase tracking-widest px-4 cursor-pointer shadow-sm flex items-center gap-2"
              >
                {exportingType === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                CSV
              </Button>
              <Button
                type="button"
                onClick={() => handleExport("xls")}
                disabled={!!exportingType}
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-black text-[10px] uppercase tracking-widest px-4 cursor-pointer shadow-sm flex items-center gap-2"
              >
                {exportingType === "xls" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                XLS
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterAgent("");
                  setFilterStatus("");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  fetchEstablishments({
                    status: "",
                    search: "",
                    agent: "",
                    createdFrom: "",
                    createdTo: "",
                  });
                }}
                className="h-12 bg-white hover:bg-neutral-50 text-[#0c0a09] border border-neutral-200 rounded-sm font-black text-[10px] uppercase tracking-widest px-4 shadow-sm cursor-pointer"
              >
                Limpar
              </Button>
              <Button
                type="button"
                onClick={fetchEstablishments}
                className="h-12 bg-white hover:bg-neutral-50 text-[#0c0a09] border border-neutral-200 rounded-sm font-black text-[10px] uppercase tracking-widest px-6 shadow-sm cursor-pointer"
              >
                Atualizar
              </Button>
            </div>
          </div>
        </Card>
        {/* E.C. Listing table/cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-brand-accent animate-spin" />
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Carregando credenciamentos...</p>
          </div>
        ) : filteredEstablishments.length > 0 ? (
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
                <KanbanColumn
                  title="Pendentes"
                  count={filteredEstablishments.filter(e => e.status === "pending").length}
                  status="pending"
                  colorClass="border-t-amber-500 bg-amber-500/5"
                  accentColor="text-amber-600 bg-amber-50"
                  items={filteredEstablishments.filter(e => e.status === "pending")}
                  onSelect={handleSelectEc}
                  maskAgentName={maskAgentName}
                />
                <KanbanColumn
                  title="Em Análise Nível 2"
                  count={filteredEstablishments.filter(e => e.status === "pending_level_2").length}
                  status="pending_level_2"
                  colorClass="border-t-blue-500 bg-blue-500/5"
                  accentColor="text-blue-600 bg-blue-50"
                  items={filteredEstablishments.filter(e => e.status === "pending_level_2")}
                  onSelect={handleSelectEc}
                  maskAgentName={maskAgentName}
                />
                <KanbanColumn
                  title="Aprovados"
                  count={filteredEstablishments.filter(e => e.status === "approved").length}
                  status="approved"
                  colorClass="border-t-emerald-500 bg-emerald-500/5"
                  accentColor="text-emerald-600 bg-emerald-50"
                  items={filteredEstablishments.filter(e => e.status === "approved")}
                  onSelect={handleSelectEc}
                  maskAgentName={maskAgentName}
                />
                <KanbanColumn
                  title="Reprovados"
                  count={filteredEstablishments.filter(e => e.status === "rejected").length}
                  status="rejected"
                  colorClass="border-t-red-500 bg-red-500/5"
                  accentColor="text-red-600 bg-red-50"
                  items={filteredEstablishments.filter(e => e.status === "rejected")}
                  onSelect={handleSelectEc}
                  maskAgentName={maskAgentName}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredEstablishments.map((ec) => (
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
                          Responsável: <strong className="text-neutral-700">{ec.agentName ? maskAgentName(ec.agentName) : "Sem vínculo"}</strong>
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
          )
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
// Kanban Column component for CRM View
function KanbanColumn({
  title,
  count,
  colorClass,
  accentColor,
  items,
  onSelect,
  maskAgentName
}: {
  title: string;
  count: number;
  status: string;
  colorClass: string;
  accentColor: string;
  items: any[];
  onSelect: (id: string) => void;
  maskAgentName: (name?: string) => string;
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
                  <User className="h-3 w-3 text-neutral-400 shrink-0" />
                  <span className="truncate">Responsável: <strong className="text-neutral-600">{ec.agentName ? maskAgentName(ec.agentName) : "Sem vínculo"}</strong></span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-[9px] text-neutral-400 font-bold uppercase tracking-wider italic">
            Sem credenciamentos
          </div>
        )}
      </div>
    </div>
  );
}
