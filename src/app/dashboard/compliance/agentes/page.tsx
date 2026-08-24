"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Building2,
  Clock,
  Download,
  ExternalLink,
  Edit2,
  Filter,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Loader2,
  Search,
  Shield,
  Store,
  X,
  Users,
} from "lucide-react";

type AgentCrmRecord = {
  agentId: string;
  fullName: string;
  cpf: string;
  email?: string;
  whatsapp?: string;
  status?: string;
  birthDate?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  bankNumber?: string;
  accountBranch?: string;
  accountNumber?: string;
  hasReferral?: boolean;
  referrerName?: string;
  referrerCpf?: string;
  contractStatus: "signed" | "pending";
  contractTitle?: string | null;
  contractSignedAt?: string | null;
  totalEstablishments: number;
  approvedEstablishments: number;
  pendingEstablishments: number;
  rejectedEstablishments: number;
  latestEstablishmentName?: string;
  latestEstablishmentStatus?: string;
  latestActivityAt?: string;
  source?: "api" | "fallback";
  establishments?: AgentEstablishmentRecord[];
};

type AgentEstablishmentRecord = {
  id: string;
  nomeFantasia: string;
  cnpjCpf: string;
  status: string;
  city?: string;
  state?: string;
  createdAt: string;
  updatedAt: string;
};

type EstablishmentRecord = {
  id: string;
  agentId: string;
  agentName?: string;
  agentCpf?: string;
  cnpjCpf: string;
  nomeFantasia: string;
  status: string;
  city?: string;
  state?: string;
  createdAt: string;
  updatedAt: string;
};

type AgentEditForm = {
  fullName: string;
  cpf: string;
  email: string;
  whatsapp: string;
  birthDate: string;
  status: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  bankNumber: string;
  accountBranch: string;
  accountNumber: string;
  hasReferral: string;
  referrerName: string;
  referrerCpf: string;
};

function normalizeText(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatDate(value?: string | null) {
  if (!value) return "---";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("pt-BR");
}

function toUpperText(value?: string | null) {
  return (value || "---").toUpperCase();
}

function maskCpf(value?: string | null) {
  if (!value) return "---";
  const clean = value.replace(/\D/g, "");
  if (clean.length !== 11) return value;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

function statusLabel(contractStatus: AgentCrmRecord["contractStatus"]) {
  return contractStatus === "signed" ? "Contrato assinado" : "Contrato pendente";
}

function statusBadge(contractStatus: AgentCrmRecord["contractStatus"]) {
  return contractStatus === "signed" ? (
    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm px-3 py-1 font-black text-[9px] uppercase tracking-widest">
      Assinado
    </Badge>
  ) : (
    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 rounded-sm px-3 py-1 font-black text-[9px] uppercase tracking-widest">
      Pendente
    </Badge>
  );
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function formatDateForDisplay(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function normalizeDateForApi(value?: string | null) {
  if (!value) return "";

  const trimmed = value.trim();
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month}-${day}`;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;

  return parsed.toISOString().slice(0, 10);
}

function translateAgentStatus(value?: string | null) {
  const normalized = (value || "").trim().toLowerCase();
  const map: Record<string, string> = {
    pending: "Pendente",
    active: "Ativo",
    inactive: "Inativo",
    suspended: "Suspenso",
    approved: "Aprovado",
    rejected: "Reprovado",
  };

  return map[normalized] || value || "---";
}

function buildAgentEditForm(agent: Partial<AgentCrmRecord>): AgentEditForm {
  return {
    fullName: agent.fullName || "",
    cpf: agent.cpf || "",
    email: agent.email || "",
    whatsapp: agent.whatsapp || "",
    birthDate: formatDateForDisplay(agent.birthDate),
    status: agent.status || "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    bankNumber: "",
    accountBranch: "",
    accountNumber: "",
    hasReferral: "",
    referrerName: "",
    referrerCpf: "",
  };
}

function AgentMetric({
  label,
  value,
  interactive = false,
  onClick,
}: {
  label: string;
  value: string;
  interactive?: boolean;
  onClick?: () => void;
}) {
  const sharedClasses =
    "rounded-[2px] border bg-white p-4 shadow-sm min-w-0 flex flex-col items-center justify-center text-center transition-all";

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${sharedClasses} border-neutral-100 cursor-pointer hover:border-brand-accent hover:shadow-md hover:-translate-y-[1px]`}
      >
        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.14em] text-neutral-400">{label}</p>
        <p className="mt-2 text-lg font-black text-[#0c0a09] leading-none break-words">{value}</p>
      </button>
    );
  }

  return (
    <div className={`${sharedClasses} border-neutral-100`}>
      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.14em] text-neutral-400">{label}</p>
      <p className="mt-2 text-lg font-black text-[#0c0a09] leading-none break-words">{value}</p>
    </div>
  );
}

export default function ComplianceAgentsPage() {
  const [agents, setAgents] = useState<AgentCrmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"api" | "fallback" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contractFilter, setContractFilter] = useState<"all" | "signed" | "pending">("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [isEstablishmentsModalOpen, setIsEstablishmentsModalOpen] = useState(false);
  const [isAgentEditModalOpen, setIsAgentEditModalOpen] = useState(false);
  const [isAgentEditLoading, setIsAgentEditLoading] = useState(false);
  const [isSavingAgentEdit, setIsSavingAgentEdit] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentCrmRecord | null>(null);
  const [agentEditForm, setAgentEditForm] = useState<AgentEditForm | null>(null);

  const normalizeApiAgent = (raw: Record<string, unknown>): AgentCrmRecord => ({
    agentId: String(raw.agentId || raw.id || ""),
    fullName: String(raw.fullName || raw.name || raw.agentName || "Agente sem nome"),
    cpf: String(raw.cpf || raw.agentCpf || "---"),
    email: String(raw.email || ""),
    whatsapp: String(raw.whatsapp || ""),
    birthDate: raw.birthDate ? String(raw.birthDate) : undefined,
    cep: raw.cep ? String(raw.cep) : undefined,
    street: raw.street ? String(raw.street) : undefined,
    number: raw.number ? String(raw.number) : undefined,
    complement: raw.complement ? String(raw.complement) : undefined,
    neighborhood: raw.neighborhood ? String(raw.neighborhood) : undefined,
    status: String(raw.status || (raw.contractStatus === "signed" ? "active" : "pending")),
    bankNumber: raw.bankNumber ? String(raw.bankNumber) : undefined,
    accountBranch: raw.accountBranch ? String(raw.accountBranch) : undefined,
    accountNumber: raw.accountNumber ? String(raw.accountNumber) : undefined,
    hasReferral: typeof raw.hasReferral === "boolean" ? raw.hasReferral : undefined,
    referrerName: raw.referrerName ? String(raw.referrerName) : undefined,
    referrerCpf: raw.referrerCpf ? String(raw.referrerCpf) : undefined,
    contractStatus: raw.contractStatus === "signed" ? "signed" : "pending",
    contractTitle: raw.contractTitle ? String(raw.contractTitle) : raw.title ? String(raw.title) : null,
    contractSignedAt: raw.contractSignedAt ? String(raw.contractSignedAt) : raw.signedAt ? String(raw.signedAt) : null,
    totalEstablishments: Number(raw.totalEstablishments || raw.establishmentsCount || 0),
    approvedEstablishments: Number(raw.approvedEstablishments || 0),
    pendingEstablishments: Number(raw.pendingEstablishments || 0),
    rejectedEstablishments: Number(raw.rejectedEstablishments || 0),
    city: raw.city ? String(raw.city) : undefined,
    state: raw.state ? String(raw.state) : undefined,
    latestEstablishmentName: raw.latestEstablishmentName ? String(raw.latestEstablishmentName) : raw.latestEcName ? String(raw.latestEcName) : undefined,
    latestEstablishmentStatus: raw.latestEstablishmentStatus ? String(raw.latestEstablishmentStatus) : raw.latestEcStatus ? String(raw.latestEcStatus) : undefined,
    latestActivityAt: raw.latestActivityAt ? String(raw.latestActivityAt) : raw.updatedAt ? String(raw.updatedAt) : raw.createdAt ? String(raw.createdAt) : undefined,
    source: "api",
    establishments: Array.isArray(raw.establishments)
      ? (raw.establishments as AgentEstablishmentRecord[])
      : [],
  });

  const buildFallbackDataset = async (rows: EstablishmentRecord[]) => {
    const grouped = new Map<string, EstablishmentRecord[]>();
    rows.forEach((row) => {
      const list = grouped.get(row.agentId) || [];
      list.push(row);
      grouped.set(row.agentId, list);
    });

    const agentsFromEstablishments = await Promise.all(
      Array.from(grouped.entries()).map(async ([agentId, establishmentRows]) => {
        const sortedEstablishments = [...establishmentRows].sort(
          (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
        const latest = sortedEstablishments[0];

        let contractStatus: AgentCrmRecord["contractStatus"] = "pending";
        let contractTitle: string | null = null;
        let contractSignedAt: string | null = null;

        try {
          const contractRes = await api.get(`/api/contracts?agentId=${agentId}`);
          const contractList: Array<{
            status?: string;
            title?: string;
            signedAt?: string | null;
            updatedAt?: string;
            createdAt?: string;
          }> = Array.isArray(contractRes.data?.data) ? contractRes.data.data : [];
          if (contractList.length > 0) {
            const [contract] = [...contractList].sort(
              (a, b) =>
                new Date(b.updatedAt || b.createdAt || 0).getTime() -
                new Date(a.updatedAt || a.createdAt || 0).getTime()
            );
            contractStatus = contract?.status === "signed" ? "signed" : "pending";
            contractTitle = contract?.title || null;
            contractSignedAt = contract?.signedAt || null;
          }
        } catch (err) {
          console.warn(`Não foi possível carregar contrato do agente ${agentId}:`, err);
        }

        return {
          agentId,
          fullName: latest?.agentName || "Agente sem nome",
          cpf: latest?.agentCpf || "---",
          email: undefined,
          whatsapp: undefined,
          contractStatus,
          contractTitle,
          contractSignedAt,
          totalEstablishments: establishmentRows.length,
          approvedEstablishments: establishmentRows.filter((item) => item.status === "approved").length,
          pendingEstablishments: establishmentRows.filter((item) => item.status === "pending").length,
          rejectedEstablishments: establishmentRows.filter((item) => item.status === "rejected").length,
          city: latest?.city,
          state: latest?.state,
          latestEstablishmentName: latest?.nomeFantasia,
          latestEstablishmentStatus: latest?.status,
          latestActivityAt: latest?.updatedAt || latest?.createdAt,
          establishments: establishmentRows.map((establishment) => ({
            id: establishment.id,
            nomeFantasia: establishment.nomeFantasia,
            cnpjCpf: establishment.cnpjCpf,
            status: establishment.status,
            city: establishment.city,
            state: establishment.state,
            createdAt: establishment.createdAt,
            updatedAt: establishment.updatedAt,
          })),
          source: "fallback" as const,
        };
      })
    );

    return agentsFromEstablishments.sort(
      (a, b) => new Date(b.latestActivityAt || "").getTime() - new Date(a.latestActivityAt || "").getTime()
    );
  };

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      try {
        const apiRes = await api.get("/api/agents/admin");
        if (apiRes.data?.success && Array.isArray(apiRes.data.data)) {
          const normalized = apiRes.data.data.map(normalizeApiAgent);
          setAgents(normalized);
          setSource("api");
          return;
        }
      } catch (err) {
        console.warn("Endpoint /api/agents/admin indisponível, usando fallback do compliance.", err);
      }

      const ecRes = await api.get("/api/establishments");
      if (!ecRes.data?.success || !Array.isArray(ecRes.data.data)) {
        throw new Error("Não foi possível carregar os agentes.");
      }

      const fallback = await buildFallbackDataset(ecRes.data.data as EstablishmentRecord[]);
      setAgents(fallback);
      setSource("fallback");
    } catch (err) {
      console.error("Erro ao carregar agentes:", err);
      toast.error("Não foi possível carregar a lista de agentes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const filteredAgents = useMemo(() => {
    const search = normalizeText(searchQuery);

    return agents.filter((agent) => {
      const contractMatches = contractFilter === "all" || agent.contractStatus === contractFilter;
      const searchMatches =
        !search ||
        [
          agent.fullName,
          agent.cpf,
          agent.email,
          agent.whatsapp,
          agent.agentId,
          agent.city,
          agent.state,
          agent.latestEstablishmentName,
        ].some((field) => normalizeText(field).includes(search));

      return contractMatches && searchMatches;
    });
  }, [agents, searchQuery, contractFilter]);

  useEffect(() => {
    if (filteredAgents.length === 0) {
      setSelectedAgentId("");
      return;
    }

    const stillVisible = filteredAgents.some((agent) => agent.agentId === selectedAgentId);
    if (!stillVisible) {
      setSelectedAgentId(filteredAgents[0].agentId);
    }
  }, [filteredAgents, selectedAgentId]);

  const selectedAgent = filteredAgents.find((agent) => agent.agentId === selectedAgentId) || filteredAgents[0] || null;

  const closeAgentEditModal = useCallback(() => {
    setIsAgentEditModalOpen(false);
    setIsAgentEditLoading(false);
    setIsSavingAgentEdit(false);
    setEditingAgent(null);
    setAgentEditForm(null);
  }, []);

  const openAgentEditModal = useCallback(async (agentId: string) => {
    const fallbackAgent = agents.find((agent) => agent.agentId === agentId) || null;
    setEditingAgent(fallbackAgent);
    setAgentEditForm(buildAgentEditForm(fallbackAgent || {}));
    setIsAgentEditModalOpen(true);
    setIsAgentEditLoading(true);

    try {
      const response = await api.get(`/api/agents/${agentId}`);
      const payload = response.data?.data || response.data?.agent || null;
      if (payload) {
        const normalized = normalizeApiAgent(payload);
        setEditingAgent(normalized);
        setAgentEditForm(buildAgentEditForm(normalized));
      }
    } catch (err) {
      console.warn("Não foi possível carregar o agente para edição:", err);
      toast.error("Não foi possível carregar os dados completos do agente.");
    } finally {
      setIsAgentEditLoading(false);
    }
  }, [agents]);

  const updateAgentEditField = useCallback(<K extends keyof AgentEditForm>(field: K, value: AgentEditForm[K]) => {
    setAgentEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const handleSaveAgentEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingAgent || !agentEditForm) return;

    setIsSavingAgentEdit(true);
    const toastId = toast.loading("Salvando agente...");

    try {
      const response = await api.patch(`/api/agents/${editingAgent.agentId}`, {
        fullName: agentEditForm.fullName,
        cpf: agentEditForm.cpf,
        email: agentEditForm.email,
        whatsapp: agentEditForm.whatsapp,
        birthDate: normalizeDateForApi(agentEditForm.birthDate) || undefined,
        status: agentEditForm.status,
        cep: agentEditForm.cep,
        street: agentEditForm.street,
        number: agentEditForm.number,
        complement: agentEditForm.complement || undefined,
        neighborhood: agentEditForm.neighborhood,
        city: agentEditForm.city,
        state: agentEditForm.state,
        bankNumber: agentEditForm.bankNumber || undefined,
        accountBranch: agentEditForm.accountBranch || undefined,
        accountNumber: agentEditForm.accountNumber || undefined,
        hasReferral: agentEditForm.hasReferral === "true",
        referrerName: agentEditForm.referrerName || undefined,
        referrerCpf: agentEditForm.referrerCpf || undefined,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Não foi possível salvar o agente.");
      }

      toast.success("Agente atualizado com sucesso.", { id: toastId });
      closeAgentEditModal();
      await loadAgents();
    } catch (err: any) {
      console.error("Erro ao salvar agente:", err);
      toast.error(err.response?.data?.error || err.message || "Não foi possível salvar as alterações.", { id: toastId });
    } finally {
      setIsSavingAgentEdit(false);
    }
  };

  const summary = useMemo(() => {
    const signed = agents.filter((agent) => agent.contractStatus === "signed").length;
    const pending = agents.filter((agent) => agent.contractStatus === "pending").length;
    const ecTotal = agents.reduce((acc, agent) => acc + agent.totalEstablishments, 0);
    const ecPending = agents.reduce((acc, agent) => acc + agent.pendingEstablishments, 0);

    return { signed, pending, ecTotal, ecPending };
  }, [agents]);

  const exportFilteredCsv = () => {
    if (!filteredAgents.length) {
      toast.error("Não há agentes para exportar com os filtros atuais.");
      return;
    }

    setExporting(true);
    try {
      const headers = [
        "Agente",
        "CPF",
        "Status do Contrato",
        "Qtd. E.C.",
        "E.C. Aprovados",
        "E.C. Pendentes",
        "Cidade/UF",
        "Última atividade",
      ];

      const rows = filteredAgents.map((agent) =>
        [
          agent.fullName,
          agent.cpf,
          statusLabel(agent.contractStatus),
          String(agent.totalEstablishments),
          String(agent.approvedEstablishments),
          String(agent.pendingEstablishments),
          `${agent.city || "---"}/${agent.state || "--"}`,
          formatDate(agent.latestActivityAt),
        ]
          .map((value) => csvEscape(value))
          .join(";")
      );

      const csv = [headers.map(csvEscape).join(";"), ...rows].join("\n");
      const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio_agentes_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Relatório exportado com sucesso.");
    } catch (err) {
      console.error("Erro ao exportar agentes:", err);
      toast.error("Não foi possível exportar o relatório.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f8f9fa] text-[#0c0a09] p-4 md:p-8 xl:p-10">
      <div className="max-w-[1800px] mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-100 bg-white text-[10px] font-black uppercase tracking-[0.18em] text-brand-accent shadow-sm">
              <Shield className="h-3.5 w-3.5" />
              Compliance • Agentes
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
                CRM de Agentes
              </h1>
              <p className="text-sm text-neutral-500 font-medium max-w-2xl">
                Visualize os agentes vinculados, o status do contrato e o volume de E.C. credenciados em uma visão pensada para operação e acompanhamento.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => void loadAgents()}
              className="h-11 px-4 rounded-[2px] border-neutral-200 bg-white text-[#0c0a09] font-black uppercase tracking-widest hover:bg-neutral-50"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={exportFilteredCsv}
              disabled={exporting || filteredAgents.length === 0}
              className="h-11 px-4 rounded-[2px] bg-brand-accent hover:bg-brand-accent-hover text-white font-black uppercase tracking-widest"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AgentMetric label="Agentes visíveis" value={String(filteredAgents.length)} />
          <AgentMetric label="Contratos assinados" value={String(summary.signed)} />
          <AgentMetric label="Contratos pendentes" value={String(summary.pending)} />
          <AgentMetric label="E.C. cadastrados" value={String(summary.ecTotal)} />
        </div>

        <Card className="p-4 md:p-5 bg-white border border-neutral-100 shadow-xl rounded-[18px]">
          <div className="grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por agente, CPF, e-mail, cidade ou E.C."
                className="h-11 pl-10 bg-neutral-50 border-neutral-200 rounded-[6px] text-sm font-medium"
              />
            </div>

            <div className="flex flex-nowrap items-center gap-2 md:gap-3 overflow-x-auto xl:overflow-visible">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400 shrink-0 whitespace-nowrap">
                <Filter className="h-4 w-4" />
                Contrato
              </div>
              {(["all", "signed", "pending"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setContractFilter(value)}
                  className={`h-10 px-4 rounded-[10px] border text-[10px] font-black uppercase tracking-[0.16em] transition-all shrink-0 whitespace-nowrap ${
                    contractFilter === value
                      ? "bg-[#0c0a09] text-white border-[#0c0a09]"
                      : "bg-white text-neutral-500 border-neutral-200 hover:border-brand-accent hover:text-brand-accent"
                  }`}
                >
                  {value === "all" ? "Todos" : value === "signed" ? "Assinados" : "Pendentes"}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {!loading && source === "fallback" && (
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 px-1">
            Fonte de dados consolidada a partir dos E.C. já cadastrados.
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-4">
            {loading ? (
              <Card className="p-10 bg-white border border-neutral-100 shadow-xl text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-neutral-50 flex items-center justify-center">
                  <RefreshCcw className="h-6 w-6 text-brand-accent animate-spin" />
                </div>
                <p className="mt-4 text-sm font-bold text-neutral-500 uppercase tracking-widest">Carregando agentes...</p>
              </Card>
            ) : filteredAgents.length === 0 ? (
              <Card className="p-10 bg-white border border-neutral-100 shadow-xl text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-black text-[#0c0a09]">Nenhum agente encontrado</h3>
                <p className="mt-2 text-sm text-neutral-500 font-medium">
                  Ajuste os filtros ou limpe a busca para ver outros resultados.
                </p>
              </Card>
            ) : (
              filteredAgents.map((agent) => {
                const isSelected = selectedAgentId === agent.agentId;

                return (
                  <div key={agent.agentId} className={`w-full text-left transition-all ${isSelected ? "scale-[0.995]" : ""}`}>
                    <Card
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAgentId(agent.agentId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedAgentId(agent.agentId);
                        }
                      }}
                      className={`p-5 bg-white border shadow-xl hover:-translate-y-[1px] transition-all ${
                        isSelected ? "border-brand-accent ring-2 ring-brand-accent/10" : "border-neutral-100 hover:border-neutral-200"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg md:text-xl font-black text-[#0c0a09] tracking-tight uppercase">
                              {toUpperText(agent.fullName)}
                            </h3>
                            {statusBadge(agent.contractStatus)}
                          </div>
                          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
                            <span className="px-2.5 py-1 rounded-full bg-neutral-50 border border-neutral-100">
                              CPF {maskCpf(agent.cpf)}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-neutral-50 border border-neutral-100">
                              ID {agent.agentId.slice(0, 8)}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-neutral-50 border border-neutral-100">
                              {agent.city || "---"} / {agent.state || "--"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full max-w-[420px] ml-auto">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void openAgentEditModal(agent.agentId);
                              }}
                              className="inline-flex items-center gap-2 rounded-[2px] border border-neutral-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600 transition-all hover:border-brand-accent hover:text-brand-accent"
                              aria-label={`Editar agente ${agent.fullName}`}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Editar
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAgentId(agent.agentId);
                                setIsEstablishmentsModalOpen(true);
                              }}
                              className="rounded-[2px] bg-neutral-50 border border-neutral-100 p-4 min-w-0 flex flex-col items-center justify-center text-center transition-all hover:border-brand-accent hover:bg-brand-accent/5"
                              aria-label={`Ver E.C. vinculados de ${agent.fullName}`}
                            >
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-400">E.C.</p>
                              <p className="mt-2 text-lg font-black leading-none">{agent.totalEstablishments}</p>
                            </button>
                            <div className="rounded-[2px] bg-emerald-50 border border-emerald-100 p-4 min-w-0 flex flex-col items-center justify-center text-center">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">Aprovados</p>
                              <p className="mt-2 text-lg font-black text-emerald-700 leading-none">{agent.approvedEstablishments}</p>
                            </div>
                            <div className="rounded-[2px] bg-amber-50 border border-amber-100 p-4 min-w-0 flex flex-col items-center justify-center text-center">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-700">Pendentes</p>
                              <p className="mt-2 text-lg font-black text-amber-700 leading-none">{agent.pendingEstablishments}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-4 xl:sticky xl:top-6 self-start">
            <Card className="p-6 md:p-8 bg-white border border-neutral-100 shadow-2xl space-y-6">
              {selectedAgent ? (
                <>
                  <div className="space-y-4 pb-6 border-b border-neutral-100">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-[10px] font-black uppercase tracking-[0.18em] text-brand-accent">
                          <Users className="h-3.5 w-3.5" />
                          Ficha do Agente
                        </div>
                        <h2 className="mt-3 text-2xl font-black tracking-tight text-[#0c0a09] uppercase">
                          {toUpperText(selectedAgent.fullName)}
                        </h2>
                        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-neutral-400">
                          {selectedAgent.agentId}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {statusBadge(selectedAgent.contractStatus)}
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
                          {source === "api" ? "Fonte API" : "Fonte consolidada"}
                        </div>
                        <button
                          type="button"
                          onClick={() => void openAgentEditModal(selectedAgent.agentId)}
                          className="inline-flex items-center gap-2 rounded-[2px] border border-neutral-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600 transition-all hover:border-brand-accent hover:text-brand-accent"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Editar agente
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AgentMetric label="Situação do contrato" value={statusLabel(selectedAgent.contractStatus)} />
                    <AgentMetric
                      label="E.C. vinculados"
                      value={String(selectedAgent.totalEstablishments)}
                      interactive
                      onClick={() => setIsEstablishmentsModalOpen(true)}
                    />
                    <AgentMetric label="Última atividade" value={formatDate(selectedAgent.latestActivityAt)} />
                    <AgentMetric label="Contrato assinado em" value={formatDate(selectedAgent.contractSignedAt)} />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-accent border-b border-orange-100 pb-2">
                      Contato & local
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <InfoLine icon={Phone} label="WhatsApp" value={selectedAgent.whatsapp || "---"} />
                      <InfoLine icon={Mail} label="E-mail" value={selectedAgent.email || "---"} />
                      <InfoLine icon={MapPin} label="Cidade/UF" value={`${selectedAgent.city || "---"} / ${selectedAgent.state || "--"}`} />
                      <InfoLine icon={Building2} label="Último E.C." value={selectedAgent.latestEstablishmentName || "---"} />
                      <InfoLine icon={Clock} label="Status do último E.C." value={selectedAgent.latestEstablishmentStatus || "---"} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-accent border-b border-orange-100 pb-2">
                      Estabelecimentos
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <MiniStat label="Aprovados" value={selectedAgent.approvedEstablishments} tone="emerald" />
                      <MiniStat label="Pendentes" value={selectedAgent.pendingEstablishments} tone="amber" />
                      <MiniStat label="Reprovados" value={selectedAgent.rejectedEstablishments} tone="red" />
                    </div>
                  </div>

                  <div className="rounded-[2px] border border-neutral-100 bg-neutral-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-black uppercase tracking-[0.18em]">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Próxima ação recomendada
                    </div>
                    <p className="text-sm font-medium text-neutral-600 leading-relaxed">
                      {selectedAgent.contractStatus === "signed"
                        ? "Contrato ativo. O agente pode continuar credenciando E.C. normalmente."
                        : "Contrato pendente. O ideal é acompanhar o agente até a finalização da assinatura."}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-black text-[#0c0a09]">Selecione um agente</h3>
                  <p className="text-sm text-neutral-500 font-medium">
                    Clique em um cartão para ver o resumo do CRM, contrato e estabelecimentos vinculados.
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-[#0c0a09] text-white border border-white/5 shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,119,17,0.2),transparent_45%)]" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[2px] bg-white/5 border border-white/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-brand-accent" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight">Visão operacional</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">CRM para gestão de parceiros</p>
                  </div>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                  Esta tela consolida contratos, E.C. credenciados e status de acompanhamento para tornar a operação mais previsível e rápida.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {isAgentEditModalOpen && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-white rounded-[18px] shadow-2xl border border-neutral-100 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between gap-4 p-6 border-b border-neutral-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">Editar agente</p>
                  <h3 className="mt-1 text-2xl md:text-3xl font-black text-[#0c0a09] uppercase">
                    {editingAgent ? toUpperText(editingAgent.fullName) : "Carregando agente"}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-neutral-500">
                    {editingAgent?.agentId || "Obtendo dados completos..."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAgentEditModal}
                  className="h-10 w-10 rounded-full border border-neutral-200 text-neutral-500 hover:text-[#0c0a09] hover:border-neutral-300 hover:bg-neutral-50 flex items-center justify-center transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAgentEdit} className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-8">
                  {isAgentEditLoading && !agentEditForm ? (
                    <div className="py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-accent mx-auto" />
                      <p className="mt-4 text-sm font-bold text-neutral-500 uppercase tracking-widest">Carregando cadastro completo...</p>
                    </div>
                  ) : agentEditForm ? (
                    <>
                      <div className="rounded-[14px] border border-neutral-100 bg-neutral-50/70 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">Dados cadastrais</p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Nome completo</label>
                            <Input value={agentEditForm.fullName} onChange={(e) => updateAgentEditField("fullName", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">CPF</label>
                            <Input value={agentEditForm.cpf} onChange={(e) => updateAgentEditField("cpf", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">E-mail</label>
                            <Input value={agentEditForm.email} onChange={(e) => updateAgentEditField("email", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">WhatsApp</label>
                            <Input value={agentEditForm.whatsapp} onChange={(e) => updateAgentEditField("whatsapp", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Data de nascimento</label>
                            <Input value={agentEditForm.birthDate} onChange={(e) => updateAgentEditField("birthDate", e.target.value)} placeholder="DD/MM/AAAA" className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Status</label>
                            <select
                              value={agentEditForm.status}
                              onChange={(e) => updateAgentEditField("status", e.target.value)}
                              className="h-12 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm font-medium text-[#0c0a09] outline-none focus:border-brand-accent"
                            >
                              <option value="">Selecione um status</option>
                              <option value="pending">Pendente</option>
                              <option value="active">Ativo</option>
                              <option value="inactive">Inativo</option>
                              <option value="suspended">Suspenso</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[14px] border border-neutral-100 bg-neutral-50/70 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">Endereço</p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">CEP</label>
                            <Input value={agentEditForm.cep} onChange={(e) => updateAgentEditField("cep", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Rua</label>
                            <Input value={agentEditForm.street} onChange={(e) => updateAgentEditField("street", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Número</label>
                            <Input value={agentEditForm.number} onChange={(e) => updateAgentEditField("number", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Complemento</label>
                            <Input value={agentEditForm.complement} onChange={(e) => updateAgentEditField("complement", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Bairro</label>
                            <Input value={agentEditForm.neighborhood} onChange={(e) => updateAgentEditField("neighborhood", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Cidade</label>
                            <Input value={agentEditForm.city} onChange={(e) => updateAgentEditField("city", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Estado / UF</label>
                            <Input value={agentEditForm.state} onChange={(e) => updateAgentEditField("state", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[14px] border border-neutral-100 bg-neutral-50/70 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">Repasse & indicação</p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Banco</label>
                            <Input value={agentEditForm.bankNumber} onChange={(e) => updateAgentEditField("bankNumber", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Agência</label>
                            <Input value={agentEditForm.accountBranch} onChange={(e) => updateAgentEditField("accountBranch", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Conta</label>
                            <Input value={agentEditForm.accountNumber} onChange={(e) => updateAgentEditField("accountNumber", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Tem indicação?</label>
                            <select
                              value={agentEditForm.hasReferral}
                              onChange={(e) => updateAgentEditField("hasReferral", e.target.value)}
                              className="h-12 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm font-medium text-[#0c0a09] outline-none focus:border-brand-accent"
                            >
                              <option value="">Sem informação</option>
                              <option value="true">Sim</option>
                              <option value="false">Não</option>
                            </select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Nome do indicador</label>
                            <Input value={agentEditForm.referrerName} onChange={(e) => updateAgentEditField("referrerName", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">CPF do indicador</label>
                            <Input value={agentEditForm.referrerCpf} onChange={(e) => updateAgentEditField("referrerCpf", e.target.value)} className="h-12 bg-white border-neutral-200 rounded-[6px]" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="border-t border-neutral-100 p-4 md:p-6 bg-white flex items-center justify-end gap-3">
                  <Button type="button" variant="outline" onClick={closeAgentEditModal} className="h-11 px-5 rounded-[2px] border-neutral-200 font-black uppercase tracking-widest">
                    Cancelar
                  </Button>
                  <Button type="submit" className="h-11 px-5 rounded-[2px] bg-brand-accent hover:bg-brand-accent-hover text-white font-black uppercase tracking-widest" disabled={isSavingAgentEdit || isAgentEditLoading || !agentEditForm}>
                    {isSavingAgentEdit ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </span>
                    ) : (
                      "Salvar alterações"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEstablishmentsModalOpen && selectedAgent && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-[18px] shadow-2xl border border-neutral-100 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between gap-4 p-6 border-b border-neutral-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">E.C. do Agente</p>
                  <h3 className="mt-1 text-2xl font-black text-[#0c0a09] uppercase">{toUpperText(selectedAgent.fullName)}</h3>
                  <p className="mt-1 text-sm font-medium text-neutral-500">
                    {selectedAgent.totalEstablishments} estabelecimentos vinculados
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEstablishmentsModalOpen(false)}
                  className="h-10 w-10 rounded-full border border-neutral-200 text-neutral-500 hover:text-[#0c0a09] hover:border-neutral-300 hover:bg-neutral-50 flex items-center justify-center transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3">
                {selectedAgent.establishments && selectedAgent.establishments.length > 0 ? (
                  selectedAgent.establishments.map((establishment) => (
                    <div
                      key={establishment.id}
                      className="rounded-[12px] border border-neutral-100 bg-neutral-50/70 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-black text-[#0c0a09] uppercase break-words">
                            {toUpperText(establishment.nomeFantasia)}
                          </p>
                          <Badge className="bg-white text-neutral-600 border border-neutral-200 rounded-full px-2.5 py-1 font-black text-[8px] uppercase tracking-widest">
                            {establishment.status}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.14em]">
                          {establishment.cnpjCpf} {establishment.city || establishment.state ? `• ${[establishment.city, establishment.state].filter(Boolean).join("/")}` : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs font-bold text-neutral-500 uppercase tracking-[0.14em]">
                        <p>Criado em {formatDate(establishment.createdAt)}</p>
                        <p>Atualizado em {formatDate(establishment.updatedAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[12px] border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
                    <p className="text-sm font-bold text-neutral-500">
                      Esse agente ainda não possui E.C. credenciado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[2px] border border-neutral-100 bg-white p-4">
      <div className="w-9 h-9 rounded-[2px] bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-brand-accent" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-400">{label}</p>
        <p className="text-sm font-bold text-[#0c0a09] break-words">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "red";
}) {
  const toneClasses =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : "bg-red-50 text-red-700 border-red-100";

  return (
    <div className={`rounded-[2px] border p-3 ${toneClasses}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}
