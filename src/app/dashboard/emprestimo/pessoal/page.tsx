"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  FileClock,
  FileText,
  Lock,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Star,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
const MONTHLY_RATE = 0.0249;

const productCards = [
  {
    type: "personal" as const,
    title: "Pessoal",
    label: "Ativo",
    description: "Solicite análise informando apenas o valor.",
    icon: CreditCard,
    active: true,
  },
  {
    type: "consigned" as const,
    title: "Consignado",
    label: "Em breve",
    description: "Condições especiais para parcelas previsíveis.",
    icon: Lock,
    active: false,
  },
  {
    type: "financing" as const,
    title: "Financiamento",
    label: "Em breve",
    description: "Crédito estruturado para projetos maiores.",
    icon: BriefcaseBusiness,
    active: false,
  },
];

const supportCards = [
  { title: "Dados 100% blindados", description: "Sua paz de espírito é nossa prioridade.", icon: ShieldCheck },
  { title: "Retorno expresso", description: "Análise acompanhada para respeitar o seu tempo.", icon: RotateCw },
  { title: "Taxas sob medida", description: "Condições pensadas para o seu perfil de agente.", icon: Star },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function firstName(name: string) {
  return (name || "Cliente").trim().split(/\s+/)[0] || "Cliente";
}

function calculateMonthlyPayment(amount: number, termMonths: number) {
  const factor = Math.pow(1 + MONTHLY_RATE, termMonths);
  return (amount * MONTHLY_RATE * factor) / (factor - 1);
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

function writeRequests(requests: LoanRequest[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
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
    agentName: String(item.agentName || item.name || item.nome || ""),
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

export default function PersonalLoanPage() {
  const [amount, setAmount] = useState(17000);
  const [termMonths, setTermMonths] = useState(12);
  const [selectedType, setSelectedType] = useState<LoanKind>("personal");
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState({
    agentId: "",
    name: "Cliente",
    cpf: "",
    email: "",
    whatsapp: "",
  });

  const monthlyPayment = useMemo(() => calculateMonthlyPayment(amount, termMonths), [amount, termMonths]);

  const visibleRequests = useMemo(
    () => requests.filter((request) => !user.agentId || request.agentId === user.agentId),
    [requests, user.agentId]
  );

  const refreshRequests = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.get("/api/carta-credito/agent");
      const data: LoanRequest[] = Array.isArray(response.data?.data) ? response.data.data.map(normalizeRequest) : [];
      setRequests(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      if (getResponseStatus(error)) {
        console.warn("API de crédito retornou erro:", error);
        setRequests([]);
        return;
      }
      console.warn("API de crédito indisponível, usando fallback local:", error);
      setRequests(readRequests().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const agentId = window.localStorage.getItem("agentId") || "";
    setUser({
      agentId,
      name: window.localStorage.getItem("userName") || "Cliente",
      cpf: window.localStorage.getItem("userCpf") || "",
      email: window.localStorage.getItem("userEmail") || "",
      whatsapp: window.localStorage.getItem("userWhatsapp") || "",
    });
    void refreshRequests();
  }, []);

  const handleSubmit = async () => {
    if (selectedType !== "personal") {
      toast.info("Esse produto ainda está em preparação.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const nextRequest: LoanRequest = {
        id: crypto.randomUUID(),
        agentId: user.agentId || "agent-local",
        agentName: user.name,
        cpf: user.cpf,
        email: user.email,
        whatsapp: user.whatsapp,
        type: selectedType,
        amount,
        termMonths,
        monthlyPayment,
        status: "PENDENTE",
        createdAt: now,
        updatedAt: now,
      };

      try {
        const response = await api.post("/api/carta-credito/agent", {
          amount,
          termMonths,
          monthlyPayment,
          type: selectedType,
        });
        const created = normalizeRequest(response.data?.data || response.data || nextRequest);
        setRequests((current) => [created, ...current]);
      } catch (error) {
        if (getResponseStatus(error)) {
          console.warn("API de crédito retornou erro ao criar solicitação:", error);
          toast.error("Não foi possível enviar a solicitação agora.");
          return;
        }
        console.warn("API de crédito indisponível, salvando fallback local:", error);
        const nextRequests = [nextRequest, ...readRequests()];
        writeRequests(nextRequests);
        setRequests(nextRequests);
      }
      toast.success("Solicitação enviada para análise de crédito.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRequest = async (id: string) => {
    try {
      const response = await api.post(`/api/carta-credito/agent/${encodeURIComponent(id)}/cancelar`);
      const canceled = normalizeRequest(response.data?.data || response.data);
      setRequests((current) => current.map((request) => request.id === id ? canceled : request));
    } catch (error) {
      if (getResponseStatus(error)) {
        console.warn("API de crédito retornou erro ao cancelar solicitação:", error);
        toast.error("Não foi possível cancelar essa solicitação.");
        return;
      }
      console.warn("API de crédito indisponível, cancelando fallback local:", error);
      const nextRequests = readRequests().map((request) =>
        request.id === id && request.status === "PENDENTE"
          ? { ...request, status: "CANCELADA" as const, updatedAt: new Date().toISOString() }
          : request
      );
      writeRequests(nextRequests);
      setRequests(nextRequests);
    }
    toast.success("Solicitação cancelada.");
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#f8f9fa] text-[#0c0a09]">
      <div className="flex max-w-450 flex-col gap-8">
        <section className="grid gap-8 rounded-[8px] border border-neutral-200 bg-white p-6 shadow-sm md:p-10 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-9">
            <div className="space-y-5">
              <Badge className="rounded-1 border-0 bg-orange-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-brand-accent">
                Empréstimo online
              </Badge>
              <div>
                <h1 className="max-w-225 text-4xl font-black leading-[0.98] tracking-tight text-[#0c0a09] md:text-6xl 2xl:text-7xl">
                  <span className="block text-brand-accent">{firstName(user.name).toUpperCase()}!</span>
                  Chegou a hora de transformar seus planos em realidade.
                </h1>
                <p className="mt-6 max-w-3xl text-base font-bold leading-relaxed text-neutral-500 md:text-xl">
                  Com o G8, você conta com uma análise rápida, segura e sem burocracia.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-accent">Produtos</p>
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">Opções de crédito G8</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {productCards.map((product) => {
                  const Icon = product.icon;
                  const isSelected = selectedType === product.type;
                  return (
                    <button
                      key={product.type}
                      type="button"
                      onClick={() => setSelectedType(product.type)}
                      className={`min-h-[170px] rounded-[8px] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        isSelected ? "border-brand-accent ring-2 ring-brand-accent/10" : "border-neutral-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-neutral-100 bg-white text-brand-accent shadow-sm">
                          <Icon className="h-5 w-5" />
                        </span>
                        <Badge className={`rounded-[4px] border-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                          product.active ? "bg-brand-accent text-white" : "bg-blue-50 text-blue-700"
                        }`}>
                          {product.label}
                        </Badge>
                      </div>
                      <h3 className="mt-8 text-xl font-black tracking-tight">{product.title}</h3>
                      <p className="mt-3 text-sm font-bold leading-relaxed text-neutral-500">{product.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {supportCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="min-h-[170px] rounded-[8px] border border-neutral-200 bg-white p-6 text-center shadow-sm">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] border border-neutral-100 bg-white text-brand-accent shadow-md">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-8 text-sm font-black uppercase tracking-wide">{card.title}</h3>
                    <p className="mx-auto mt-5 max-w-[220px] text-xs font-bold leading-relaxed text-neutral-500">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="h-fit rounded-[10px] border border-neutral-200 bg-white p-5 shadow-xl shadow-neutral-200/70 md:p-7 xl:sticky xl:top-6">
            <div className="mb-9 flex items-start justify-between gap-4">
              <h2 className="text-3xl font-black tracking-tight">Quanto você precisa?</h2>
              <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-orange-50 text-brand-accent">
                <Sparkles className="h-6 w-6" />
              </span>
            </div>

            <div className="rounded-[10px] border border-neutral-200 bg-neutral-50 p-4">
              <label className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500">Valor desejado</label>
              <div className="mt-4 rounded-[8px] border border-neutral-200 bg-white px-5 py-4 text-4xl font-black tracking-tight">
                {formatCurrency(amount)}
              </div>
            </div>

            <div className="mt-7 space-y-4">
              <input
                type="range"
                min={1000}
                max={50000}
                step={500}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="credit-slider w-full"
              />
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-neutral-500">
                <span>R$ 1 mil</span>
                <span>Seu sonho</span>
                <span>R$ 50 mil</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500">Prazo</p>
                  <p className="mt-2 text-2xl font-black text-brand-accent">{termMonths} meses</p>
                </div>
                <Badge className="rounded-[4px] border-0 bg-[#0c0a09] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Até 48x</Badge>
              </div>
              <input
                type="range"
                min={6}
                max={48}
                step={1}
                value={termMonths}
                onChange={(event) => setTermMonths(Number(event.target.value))}
                className="credit-slider w-full"
              />
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-neutral-500">
                <span>6 meses</span>
                <span>48 meses</span>
              </div>
            </div>

            <div className="mt-8 rounded-[10px] bg-neutral-100 p-6 text-center">
              <p className="text-sm font-black text-neutral-500">Parcela mensal aproximada</p>
              <p className="mt-4 text-sm font-black text-brand-accent">{termMonths}x</p>
              <p className="mt-1 text-4xl font-black tracking-tight text-brand-accent md:text-5xl">{formatCurrency(monthlyPayment)}</p>
              <div className="my-5 h-px bg-neutral-200" />
              <p className="text-xs font-bold leading-relaxed text-neutral-500">
                Estamos considerando uma taxa inicial simulada. A aprovação e as condições finais dependem da análise de crédito.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-7 h-16 w-full rounded-[8px] bg-brand-accent text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-orange-200 hover:bg-brand-accent-hover"
            >
              <ArrowRight className="mr-3 h-5 w-5" />
              SIMULAR AGORA
            </Button>
          </aside>
        </section>

        <section className="rounded-[8px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-accent">Acompanhamento</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Suas solicitações</h2>
            </div>
            <Button
              onClick={refreshRequests}
              className="h-12 rounded-[8px] bg-[#0c0a09] px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-neutral-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {visibleRequests.length === 0 ? (
            <div className="mt-8 rounded-[8px] border border-dashed border-neutral-200 bg-white py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-brand-accent" />
              <h3 className="mt-4 text-xl font-black">Nenhuma solicitação ainda</h3>
              <p className="mt-3 text-sm font-bold text-neutral-500">Simule um valor e solicite a análise para acompanhar tudo por aqui.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4">
              {visibleRequests.map((request) => {
                const meta = statusMeta(request.status);
                const Icon = meta.icon;
                return (
                  <div key={request.id} className="grid gap-4 rounded-[8px] border border-neutral-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className={`rounded-[4px] border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${meta.className}`}>
                            <Icon className="mr-1.5 h-3.5 w-3.5" />
                            {meta.label}
                          </Badge>
                          <span className="text-xs font-black uppercase tracking-widest text-neutral-400">{meta.helper}</span>
                        </div>
                        <h3 className="mt-4 text-xl font-black">{formatCurrency(request.amount)} em {request.termMonths} meses</h3>
                        <p className="mt-1 text-sm font-bold text-neutral-500">
                          Parcela estimada de {formatCurrency(request.monthlyPayment)} • Criada em {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      disabled={request.status !== "PENDENTE"}
                      onClick={() => void cancelRequest(request.id)}
                      className="h-11 rounded-[6px] border-neutral-200 text-xs font-black uppercase tracking-widest disabled:opacity-40"
                    >
                      Cancelar solicitação
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        .credit-slider {
          accent-color: #ff6b00;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
