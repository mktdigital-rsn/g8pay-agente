"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Eye,
  FileClock,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

type LoanKind = "personal" | "consigned" | "financing";
type LoanStatus = "PENDENTE" | "APROVADA" | "REPROVADA" | "CANCELADA";

type LoanRequest = {
  id: string;
  agentId: string;
  agentName: string;
  cpf: string;
  email: string;
  whatsapp: string;
  type: LoanKind;
  amount: number;
  termMonths: number;
  monthlyPayment: number;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "g8_agent_credit_requests";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function readRequests(): LoanRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function statusMeta(status: LoanStatus) {
  const map = {
    PENDENTE: { label: "Pendente", helper: "Em análise", className: "bg-amber-50 text-amber-700 border-amber-200", icon: FileClock },
    APROVADA: { label: "Aprovada", helper: "Crédito aprovado", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    REPROVADA: { label: "Reprovada", helper: "Análise recusada", className: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
    CANCELADA: { label: "Cancelada", helper: "Solicitação encerrada", className: "bg-neutral-100 text-neutral-600 border-neutral-200", icon: XCircle },
  } satisfies Record<LoanStatus, { label: string; helper: string; className: string; icon: LucideIcon }>;

  return map[status];
}

function creditSla(createdAt: string, status: LoanStatus) {
  if (status !== "PENDENTE") return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  const days = Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
  const level = days >= 5 ? "Crítico" : days >= 3 ? "Médio" : "Baixo";
  const className = days >= 5 ? "border-red-200 bg-red-50 text-red-700" : days >= 3 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return { days, level, className };
}


function normalizeStatus(status: unknown): LoanStatus {
  const value = String(status || "").toUpperCase();
  if (value === "APROVADA" || value === "REPROVADA" || value === "CANCELADA") return value;
  return "PENDENTE";
}

function normalizeRequest(item: Partial<LoanRequest> & Record<string, unknown>): LoanRequest {
  return {
    id: String(item.id || crypto.randomUUID()),
    agentId: String(item.agentId || item.agenteId || ""),
    agentName: String(item.agentName || item.name || item.nome || "Agente sem nome"),
    cpf: String(item.cpf || item.taxNumber || ""),
    email: String(item.email || ""),
    whatsapp: String(item.whatsapp || item.phoneNumber || ""),
    type: (item.type as LoanKind) || "personal",
    amount: Number(item.amount || item.valor || 0),
    termMonths: Number(item.termMonths || 12),
    monthlyPayment: Number(item.monthlyPayment || 0),
    status: normalizeStatus(item.status),
    createdAt: String(item.createdAt || new Date().toISOString()),
    updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString()),
  };
}

function getResponseStatus(error: unknown) {
  return (error as { response?: { status?: number } })?.response?.status;
}

function typeLabel(type: LoanKind) {
  const map = {
    personal: "Empréstimo pessoal",
    consigned: "Consignado",
    financing: "Financiamento",
  };
  return map[type] || "Crédito";
}

export default function AdminLoanRequestsPage() {
  const [requests, setRequests] = useState<LoanRequest[]>(() =>
    readRequests().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LoanStatus>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.get("/api/carta-credito/admin");
      const data: LoanRequest[] = Array.isArray(response.data?.data) ? response.data.data.map(normalizeRequest) : [];
      setRequests(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      if (getResponseStatus(error)) {
        console.warn("API de crédito retornou erro:", error);
        setRequests([]);
        return;
      }
      console.warn("API de crédito indisponível, usando fallback local:", error);
      setRequests(readRequests().map(normalizeRequest).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setRequests(readRequests().map(normalizeRequest).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    };

    window.addEventListener("storage", handleStorage);
    void refresh();
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const filteredRequests = useMemo(() => {
    const search = query.trim().toLowerCase();
    return requests.filter((request) => {
      const statusMatches = statusFilter === "all" || request.status === statusFilter;
      const searchMatches = !search || [
        request.agentName,
        request.cpf,
        request.email,
        request.whatsapp,
        request.agentId,
        typeLabel(request.type),
      ].some((value) => String(value || "").toLowerCase().includes(search));

      return statusMatches && searchMatches;
    });
  }, [query, requests, statusFilter]);

  const metrics = useMemo(() => {
    const totalAmount = requests.reduce((sum, item) => sum + item.amount, 0);
    const approvedRequests = requests.filter((item) => item.status === "APROVADA");
    const pendingRequests = requests.filter((item) => item.status === "PENDENTE");
    const slaCounts = pendingRequests.reduce((acc, item) => {
      const sla = creditSla(item.createdAt, item.status);
      if (sla?.level === "Baixo") acc.low += 1;
      if (sla?.level === "Médio") acc.medium += 1;
      if (sla?.level === "Crítico") acc.critical += 1;
      return acc;
    }, { low: 0, medium: 0, critical: 0 });
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "PENDENTE").length,
      approved: approvedRequests.length,
      approvedAmount: approvedRequests.reduce((sum, item) => sum + item.amount, 0),
      totalAmount,
      slaCounts,
    };
  }, [requests]);

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#f8f9fa] text-[#0c0a09]">
      <div className="mx-auto flex max-w-[1900px] flex-col gap-6 p-2 sm:p-4 md:p-6 2xl:p-8">
        <section className="rounded-[8px] bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Badge className="rounded-[4px] border-0 bg-orange-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-brand-accent">
                Compliance • Crédito
              </Badge>
              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">Análise de crédito dos agentes</h1>
              <p className="mt-4 max-w-3xl text-base font-bold leading-relaxed text-neutral-500">
                Acompanhe as solicitações de empréstimo enviadas pelos agentes e o status retornado pela análise de crédito.
              </p>
            </div>
            <Button onClick={() => void refresh()} className="h-12 rounded-[8px] bg-[#0c0a09] px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-neutral-800">
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar lista
            </Button>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Solicitações" value={String(metrics.total)} icon={CreditCard} tone="blue" />
            <MetricCard title="Em análise" value={String(metrics.pending)} icon={FileClock} tone="amber" />
            <MetricCard title="Volume solicitado" value={formatCurrency(metrics.totalAmount)} icon={TrendingUp} tone="orange" />
            <MetricCard
              title="Volume aprovado"
              value={formatCurrency(metrics.approvedAmount)}
              helper={metrics.approved === 1 ? "1 solicitação aprovada" : `${metrics.approved} solicitações aprovadas`}
              icon={CheckCircle2}
              tone="green"
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <MetricCard title="SLA baixo" value={String(metrics.slaCounts.low)} helper="Solicitações dentro do prazo inicial" icon={CheckCircle2} tone="green" />
            <MetricCard title="SLA médio" value={String(metrics.slaCounts.medium)} helper="Solicitações em atenção desde D+3" icon={FileClock} tone="amber" />
            <MetricCard title="SLA crítico" value={String(metrics.slaCounts.critical)} helper="Solicitações pendentes desde D+5" icon={AlertCircle} tone="orange" />
          </div>
        </section>

        <section className="rounded-[8px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por agente, CPF, e-mail, telefone ou tipo de crédito"
                className="h-14 rounded-[8px] border-neutral-200 bg-white pl-12 text-sm font-bold"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "Todos"],
                ["PENDENTE", "Pendentes"],
                ["APROVADA", "Aprovados"],
                ["REPROVADA", "Reprovados"],
                ["CANCELADA", "Cancelados"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value as "all" | LoanStatus)}
                  className={`h-11 rounded-[7px] border px-4 text-[11px] font-black uppercase tracking-widest transition ${
                    statusFilter === value
                      ? "border-[#0c0a09] bg-[#0c0a09] text-white"
                      : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="mt-8 rounded-[8px] border border-dashed border-neutral-200 py-14 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-brand-accent" />
              <h3 className="mt-4 text-xl font-black">Nenhuma solicitação encontrada</h3>
              <p className="mt-3 text-sm font-bold text-neutral-500">Quando agentes solicitarem crédito, o acompanhamento aparece aqui.</p>
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-[8px] border border-neutral-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1840px] table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[300px]" />
                    <col className="w-[190px]" />
                    <col className="w-[320px]" />
                    <col className="w-[210px]" />
                    <col className="w-[210px]" />
                    <col className="w-[230px]" />
                    <col className="w-[190px]" />
                    <col className="w-[140px]" />
                    <col className="w-[190px]" />
                    <col className="w-[150px]" />
                    <col className="w-[110px]" />
                  </colgroup>
                  <thead className="bg-neutral-50">
                    <tr className="border-b border-neutral-200">
                      <TableHead>Agente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Pedido em</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead className="text-center">Detalhes</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => {
                      const meta = statusMeta(request.status);
                      const Icon = meta.icon;
                      const sla = creditSla(request.createdAt, request.status);
                      return (
                        <tr key={request.id} className="border-b border-neutral-100 last:border-0">
                          <TableCell>
                            <p className="whitespace-nowrap text-sm font-black text-[#0c0a09]">{request.agentName || "Agente sem nome"}</p>
                          </TableCell>
                          <TableCell>{request.cpf || "---"}</TableCell>
                          <TableCell>{request.email || "---"}</TableCell>
                          <TableCell>{request.whatsapp || "---"}</TableCell>
                          <TableCell>
                            <Badge className={`rounded-[4px] border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${meta.className}`}>
                              <Icon className="mr-1.5 h-3.5 w-3.5" />
                              {meta.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{typeLabel(request.type)}</TableCell>
                          <TableCell>{formatCurrency(request.amount)}</TableCell>
                          <TableCell>{request.termMonths} meses</TableCell>
                          <TableCell>{formatCurrency(request.monthlyPayment)}</TableCell>
                          <TableCell>{new Date(request.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>{sla ? <Badge className={`rounded-[4px] border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${sla.className}`}>{sla.level} • D+{sla.days}</Badge> : <span className="text-neutral-400">---</span>}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                              className="h-9 w-9 rounded-[7px] border-neutral-200 p-0 text-neutral-600 hover:border-brand-accent hover:text-brand-accent"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      <CreditDetailsDialog request={selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)} />
    </div>
  );
}

function MetricCard({ title, value, helper, icon: Icon, tone }: { title: string; value: string; helper?: string; icon: LucideIcon; tone: "blue" | "amber" | "orange" | "green" }) {
  const toneClasses = {
    blue: "border-l-sky-400 bg-sky-50/30",
    amber: "border-l-amber-400 bg-amber-50/30",
    orange: "border-l-brand-accent bg-orange-50/30",
    green: "border-l-emerald-400 bg-emerald-50/30",
  }[tone];

  return (
    <div className={`relative min-h-[132px] min-w-0 rounded-[8px] border border-neutral-200 border-l-4 p-5 shadow-sm xl:p-6 ${toneClasses}`}>
      <p className="max-w-[72%] text-[11px] font-black uppercase leading-relaxed tracking-[0.2em] text-neutral-400">{title}</p>
      <p className="mt-5 whitespace-nowrap text-2xl font-black tracking-tight xl:text-3xl">{value}</p>
      {helper ? <p className="mt-2 max-w-[72%] text-xs font-bold leading-relaxed text-neutral-500">{helper}</p> : null}
      <span className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-brand-accent shadow-sm xl:right-6 xl:top-6">
        <Icon className="h-6 w-6" />
      </span>
    </div>
  );
}

function TableHead({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <th className={`whitespace-nowrap px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400 ${className}`}>
      {children}
    </th>
  );
}

function TableCell({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <td className={`whitespace-nowrap px-5 py-4 align-middle text-sm font-bold text-neutral-700 ${className}`}>
      {children}
    </td>
  );
}

function CreditDetailsDialog({
  request,
  onOpenChange,
}: {
  request: LoanRequest | null;
  onOpenChange: (open: boolean) => void;
}) {
  const meta = request ? statusMeta(request.status) : null;
  const Icon = meta?.icon;

  return (
    <Dialog open={Boolean(request)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[8px] border-neutral-200 p-0">
        {request && meta && Icon ? (
          <div>
            <DialogHeader className="border-b border-neutral-100 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-[#0c0a09]">
                    {request.agentName || "Agente sem nome"}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-sm font-bold text-neutral-500">
                    Solicitação de {typeLabel(request.type).toLowerCase()}
                  </DialogDescription>
                </div>
                <Badge className={`rounded-[4px] border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${meta.className}`}>
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {meta.label}
                </Badge>
              </div>
            </DialogHeader>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <DetailItem label="Valor solicitado" value={formatCurrency(request.amount)} />
              <DetailItem label="Parcela estimada" value={formatCurrency(request.monthlyPayment)} />
              <DetailItem label="Prazo" value={`${request.termMonths} meses`} />
              <DetailItem label="Status" value={meta.helper} />
              <DetailItem label="SLA da análise" value={creditSla(request.createdAt, request.status) ? `${creditSla(request.createdAt, request.status)?.level} • D+${creditSla(request.createdAt, request.status)?.days}` : request.status === "PENDENTE" ? "Sem SLA" : "Encerrado"} />
              <DetailItem label="CPF" value={request.cpf || "---"} />
              <DetailItem label="E-mail" value={request.email || "---"} />
              <DetailItem label="WhatsApp" value={request.whatsapp || "---"} />
              <DetailItem label="ID do agente" value={request.agentId || "---"} />
              <DetailItem label="Criado em" value={new Date(request.createdAt).toLocaleString("pt-BR")} />
              <DetailItem label="Atualizado em" value={new Date(request.updatedAt).toLocaleString("pt-BR")} />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[7px] border border-neutral-100 bg-neutral-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-[#0c0a09]">{value}</p>
    </div>
  );
}
