"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  FileClock,
  RefreshCw,
  Search,
  TrendingUp,
  UserCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoanKind = "personal" | "consigned" | "financing";
type LoanStatus = "pending" | "approved" | "rejected" | "cancelled";

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
    pending: { label: "Pendente", helper: "Em análise", className: "bg-amber-50 text-amber-700 border-amber-200", icon: FileClock },
    approved: { label: "Aprovada", helper: "Crédito aprovado", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    rejected: { label: "Reprovada", helper: "Análise recusada", className: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
    cancelled: { label: "Cancelada", helper: "Solicitação encerrada", className: "bg-neutral-100 text-neutral-600 border-neutral-200", icon: XCircle },
  } satisfies Record<LoanStatus, { label: string; helper: string; className: string; icon: LucideIcon }>;

  return map[status];
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

  const refresh = () => {
    setIsRefreshing(true);
    setRequests(readRequests().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setTimeout(() => setIsRefreshing(false), 250);
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setRequests(readRequests().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    };

    window.addEventListener("storage", handleStorage);
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
    const totalAmount = filteredRequests.reduce((sum, item) => sum + item.amount, 0);
    return {
      total: filteredRequests.length,
      pending: filteredRequests.filter((item) => item.status === "pending").length,
      approved: filteredRequests.filter((item) => item.status === "approved").length,
      totalAmount,
    };
  }, [filteredRequests]);

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#f8f9fa] text-[#0c0a09]">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-8 p-3 sm:p-5 md:p-10 2xl:p-14">
        <section className="rounded-[8px] bg-white p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Badge className="rounded-[4px] border-0 bg-orange-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-brand-accent">
                Compliance • Crédito
              </Badge>
              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">Análise de crédito dos agentes</h1>
              <p className="mt-4 max-w-3xl text-base font-bold leading-relaxed text-neutral-500">
                Acompanhe as solicitações de empréstimo enviadas pelos agentes. A integração real com a API será plugada aqui quando o backend estiver pronto.
              </p>
            </div>
            <Button onClick={refresh} className="h-12 rounded-[8px] bg-[#0c0a09] px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-neutral-800">
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar lista
            </Button>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            <MetricCard title="Solicitações" value={String(metrics.total)} icon={CreditCard} />
            <MetricCard title="Em análise" value={String(metrics.pending)} icon={FileClock} />
            <MetricCard title="Volume solicitado" value={formatCurrency(metrics.totalAmount)} icon={TrendingUp} />
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
                ["pending", "Pendentes"],
                ["approved", "Aprovados"],
                ["rejected", "Reprovados"],
                ["cancelled", "Cancelados"],
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
            <div className="mt-8 grid gap-4">
              {filteredRequests.map((request) => {
                const meta = statusMeta(request.status);
                const Icon = meta.icon;
                return (
                  <article key={request.id} className="rounded-[8px] border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-center">
                      <div className="flex gap-4">
                        <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-orange-50 text-brand-accent md:flex">
                          <UserCircle className="h-7 w-7" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-black tracking-tight">{request.agentName || "Agente sem nome"}</h3>
                            <Badge className={`rounded-[4px] border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${meta.className}`}>
                              <Icon className="mr-1.5 h-3.5 w-3.5" />
                              {meta.label}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm font-bold text-neutral-500">
                            CPF {request.cpf || "---"} • {request.email || "---"} • {request.whatsapp || "---"}
                          </p>
                          <p className="mt-3 text-xs font-black uppercase tracking-widest text-neutral-400">
                            {typeLabel(request.type)} • Pedido em {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                        <InfoBox label="Valor" value={formatCurrency(request.amount)} />
                        <InfoBox label="Prazo" value={`${request.termMonths} meses`} />
                        <InfoBox label="Parcela" value={formatCurrency(request.monthlyPayment)} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-[8px] border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-orange-50 text-brand-accent">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[7px] border border-neutral-100 bg-neutral-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">{label}</p>
      <p className="mt-2 text-sm font-black text-[#0c0a09]">{value}</p>
    </div>
  );
}
