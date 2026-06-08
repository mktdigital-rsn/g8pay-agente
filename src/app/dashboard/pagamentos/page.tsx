"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Barcode,
  QrCode,
  Calendar,
  History,
  FileText,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building2,
  HelpCircle,
  MessageCircle,
  Diamond,
  ArrowRight,
  Search,
  AlertCircle,
  ArrowLeft,
  Download,
  CheckCircle2,
  Fingerprint,
  AlertTriangle,
  Clock,
  X,
  ChevronRight,
  ReceiptText,
  CalendarClock,
  ListChecks,
  Eye,
  Ban,
  Pencil,
  Trash2,
  Loader2,
  Fuel,
  Home,
  BookOpen,
  Heart,
  MoreHorizontal,
  Dumbbell,
  Plane,
  Zap,
  Users,
  TrendingUp,
  Banknote,
  Briefcase,
  Wallet,
  Landmark,
  RotateCw,
  UserSquare2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { temporaryDeviceIdAtom } from "@/store/auth";

/* ──── Mock data for sections ──── */
const mockAgendamentos = [
  { id: 1, beneficiario: "CDHU SP", valor: "R$ 485,00", data: "20/04/2026", status: "Agendado", barcode: "0001.0001 00001.000001..." },
  { id: 2, beneficiario: "ENEL DISTRIBUIÇÃO", valor: "R$ 312,45", data: "25/04/2026", status: "Agendado", barcode: "8366.0000 00312.450001..." },
  { id: 3, beneficiario: "SABESP", valor: "R$ 89,70", data: "28/04/2026", status: "Agendado", barcode: "8269.0000 00089.700001..." },
];

const mockHistorico = [
  { id: 1, beneficiario: "VIVO TELECOMUNICAÇÕES", valor: "R$ 149,90", data: "10/04/2026", status: "Pago" },
  { id: 2, beneficiario: "PREFEITURA DE SÃO PAULO - IPTU", valor: "R$ 1.250,00", data: "08/04/2026", status: "Pago" },
  { id: 3, beneficiario: "CLARO S.A.", valor: "R$ 99,90", data: "05/04/2026", status: "Pago" },
  { id: 4, beneficiario: "TIM CELULAR S.A.", valor: "R$ 65,00", data: "01/04/2026", status: "Pago" },
  { id: 5, beneficiario: "ELETROPAULO - ENEL", valor: "R$ 278,33", data: "28/03/2026", status: "Pago" },
];

const mockComprovantes = [
  { id: "REC-2026041501", beneficiario: "VIVO TELECOMUNICAÇÕES", valor: "R$ 149,90", data: "10/04/2026" },
  { id: "REC-2026040801", beneficiario: "PREFEITURA DE SÃO PAULO", valor: "R$ 1.250,00", data: "08/04/2026" },
  { id: "REC-2026040502", beneficiario: "CLARO S.A.", valor: "R$ 99,90", data: "05/04/2026" },
];

const CATEGORY_MAP: Record<string, { label: string, icon: any }> = {
  "ALIMENTACAO": { label: "Alimentação", icon: Fuel },
  "ALUGUEL": { label: "Aluguel", icon: Home },
  "COMPRAS": { label: "Compras", icon: CreditCard },
  "CONTABILIDADE": { label: "Contabilidade", icon: Briefcase },
  "CONSUMO": { label: "Contas de consumo", icon: Zap },
  "PESSOAIS": { label: "Despesas pessoais", icon: Heart },
  "EMPRESTIMO": { label: "Empréstimo", icon: Landmark },
  "ESTORNOS": { label: "Estornos", icon: RotateCw },
  "FATURAS": { label: "Faturas", icon: ReceiptText },
  "IMPOSTOS": { label: "Impostos e encargos", icon: Landmark },
  "MARKETING": { label: "Marketing", icon: TrendingUp },
  "OUTROS": { label: "Outros", icon: MoreHorizontal },
  "FORNECEDOR": { label: "Pagamento de fornecedor", icon: Building2 },
  "FUNCIONARIOS": { label: "Pagamento de funcionários", icon: Users },
  "SAQUE": { label: "Saque", icon: Banknote },
  "TRANSPORTE": { label: "Transporte e mobilidade", icon: Plane },
};

const CATEGORIES = Object.keys(CATEGORY_MAP);

export default function PagamentosPage() {
  const router = useRouter();
  const temporaryDeviceId = useAtomValue(temporaryDeviceIdAtom);

  // State Machine
  const [step, setStep] = useState<"landing" | "review" | "sms" | "success">("landing");

  // Section modals
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Data State
  const [barcode, setBarcode] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);
  const [boletoData, setBoletoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  // Security State
  const [smsCode, setSmsCode] = useState("");
  const [pinId, setPinId] = useState("");
  const [transactionId, setTransactionId] = useState("");

  // Real History State
  const [pagamentosHistory, setPagamentosHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [paymentMode, setPaymentMode] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [agendamentos, setAgendamentos] = useState(mockAgendamentos);
  const [editingAgendamento, setEditingAgendamento] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("OUTROS");

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await api.get("/api/banco/saldo/getSaldo");
        if (res.data) {
          setUserBalance(res.data.valor || 0);
        }
      } catch (err) {
        console.error("Erro ao buscar saldo:", err);
      }
    };
    fetchBalance();
    fetchHistory(); // Busca o histórico em background logo na entrada
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get("/api/banco/extrato/buscar");
      const items = res.data.transacoes || res.data.data?.transacoes || res.data.data || [];

      // Filtro inteligente para Boletos/Pagamentos
      const filtered = (Array.isArray(items) ? items : []).filter((item: any) =>
        item.metodo === "PAGAMENTO_BOLETO" ||
        item.metodo === "PAGAMENTO" ||
        String(item.metodoFormatado || "").toUpperCase().includes("BOLETO") ||
        String(item.metodoFormatado || "").toUpperCase().includes("PAGAMENTO")
      );

      setPagamentosHistory(filtered);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
      // Silencioso se der erro na carga inicial
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handlers
  const handleConsultBoleto = async () => {
    if (!barcode || barcode.length < 10) {
      toast.error("Por favor, insira um código de barras válido.");
      return;
    }

    if (!temporaryDeviceId) {
      toast.error("Aguarde concluir o login com QR antes de realizar pagamentos.");
      return;
    }

    setIsConsulting(true);
    try {
      const res = await api.post("/api/banco/pagamentos/consultar-boleto", {
        linhaDigitavel: barcode.replace(/\D/g, ""),
        deviceId: temporaryDeviceId
      });

      if (res.data) {
        const rawData = res.data.data || res.data;
        const details = rawData.data || rawData;

        // Helper para formatar data YYYY-MM-DD para DD/MM/YYYY
        const formatDate = (dateStr: string) => {
          if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes("-")) return dateStr;
          const parts = dateStr.split("-");
          if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
          return dateStr;
        };

        const normalized = {
          ...details,
          beneficiario: details.beneficiaryLegalName || details.beneficiario || details.nomeBeneficiario || "NÃO IDENTIFICADO",
          vencimento: formatDate(details.expirationDate || details.vencimento || details.dataVencimento || "---"),
          valor: details.totalAmount || details.nominalAmount || details.valor || details.valorTotal || 0,
          linhaDigitavel: details.digitableLine || details.linhaDigitavel || details.barcode || barcode.replace(/\D/g, ""),
          bancoBeneficiario: details.beneficiaryBankCode || details.bankName || details.bank || "",
          documentoBeneficiario: details.beneficiaryDocumentNumber || details.documentoBeneficiario || "",
          pagadorNome: details.payerLegalName || details.nomePagador || ""
        };

        setBoletoData(normalized);
        setStep("review");
        toast.success("Boleto consultado com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro ao consultar boleto:", err);
      toast.error(err.response?.data?.message || "Erro ao localizar boleto. Verifique os dados.");
    } finally {
      setIsConsulting(false);
    }
  };

  const handleRequestSms = async () => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/users/solicitar-pin", {
        amount: String(boletoData?.valorTotal || boletoData?.valor || "0"),
        deviceId: temporaryDeviceId
      });

      if (res.data) {
        setPinId(res.data.pinId || res.data.id || "");
        setStep("sms");
        toast.success("Código de segurança enviado por SMS.");
      }
    } catch (err) {
      toast.error("Erro ao solicitar código de segurança.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizePayment = async () => {
    if (smsCode.length < 5) {
      toast.error("Digite o código recebido.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Validar PIN
      await api.post("/api/users/validar-pin", {
        pin: smsCode,
        pinId: pinId,
        deviceId: temporaryDeviceId
      });

      // 2. Efetivar Pagamento
      const res = await api.post("/api/banco/pagamentos/pagar-boleto", {
        linhaDigitavel: boletoData?.linhaDigitavel || barcode.replace(/\D/g, ""),
        deviceId: temporaryDeviceId
      });

      if (res.data) {
        console.log("🔍 [BOLETO RESPONSE]:", res.data);

        // 1. Varredura profunda para capturar id_transaction (Cronos style)
        const getNestedId = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;
          
          // Busca direta
          const found = obj.id_transaction || obj.idDoBancoLiquidante || obj.transactionId || obj.id || obj.transaction_id || obj.auth || obj.nsu;
          if (found) return String(found);

          // Busca em profundidade de um nível (comum em wrappers)
          for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object') {
              const nested = obj[key].id_transaction || obj[key].idDoBancoLiquidante || obj[key].transactionId || obj[key].id || obj[key].nsu;
              if (nested) return String(nested);
            }
          }

          return null;
        };

        const directId = getNestedId(res.data);

        const finalizeSuccess = (finalId: string) => {
          setTransactionId(finalId);
          setStep("success");
          setIsLoading(false);
          toast.success("Pagamento realizado com sucesso!");
          console.log("✅ Pagamento finalizado com ID capturado:", finalId);
        };

        if (directId) {
          finalizeSuccess(directId);
        } else {
          // Redireciona IMEDIATAMENTE para o sucesso, sem prender o usuário no PIN
          // A busca pelo ID real continuará na tela de sucesso
          setTransactionId(""); // Indica que ainda estamos buscando o ID real
          setStep("success");
          setIsLoading(false);
          toast.success("Pagamento aceito!");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao processar pagamento.");
      setIsLoading(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!transactionId || transactionId.startsWith("PAG")) {
      toast.error("Processando dados do banco. Tente novamente em 5 segundos.");
      return;
    }

    toast.info("Gerando comprovante...");

    try {
      const response = await api.get(`/api/banco/extrato/imprimir-item/${transactionId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comprovante_pagamento_${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Comprovante gerado com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar comprovante.");
    }
  };

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  return (
    <div className="p-4 md:p-8 xl:p-12 flex flex-col xl:flex-row gap-8 xl:gap-12 h-full overflow-y-auto w-full no-scrollbar bg-[#f8f9fa] relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--brand-accent)]/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

      <div className="flex-1 space-y-12 relative z-10">
        {/* Step-based Content */}
        {step === "landing" && (
          <>
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-orange-600/10 text-orange-600 border-0 px-3 py-1 font-black text-[10px] uppercase tracking-[0.2em]">Serviços Financeiros</Badge>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none uppercase">
                Área <span className="text-orange-600">PAGAMENTOS</span>
              </h1>
              <p className="text-sm md:text-base text-neutral-400 font-bold max-w-2xl">
                Pague boletos, tributos e contas de consumo com rapidez e segurança G8 Bank.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-12">
                {/* Boleto input card */}
                <div className="bg-orange-50 p-8 md:p-12 rounded-sm border border-neutral-100 shadow-2xl shadow-black/[0.03] space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-accent)]/5 rounded-full blur-3xl -mr-32 -mt-32" />

                  <div className="space-y-2 relative z-10">
                    <h2 className="text-2xl font-black text-[#0c0a09] tracking-tight">Pagar novo boleto</h2>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest leading-loose">Cole a linha digitável ou escaneie o código</p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 md:gap-4 relative z-10 items-stretch">
                    <div className="flex-[4] relative group/input">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within/input:text-[var(--brand-accent)] transition-colors">
                        <Barcode className="h-6 w-6" />
                      </div>
                      <Input
                        id="barcode-input"
                        placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                        className="h-16 pl-16 bg-neutral-50 border-neutral-200 rounded-sm text-sm font-black tracking-widest focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)]/30 transition-all placeholder:text-neutral-300 text-[#0c0a09]"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleConsultBoleto}
                      disabled={isConsulting}
                      className="flex-1 h-16 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-sm font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-xl shadow-orange-600/20"
                    >
                      {isConsulting ? "PROCESSANDO..." : "CONFERIR"}
                      {!isConsulting && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 relative z-10">
                    <div
                      onClick={() => setActiveSection("historico")}
                      className="p-6 bg-white border border-orange-100 rounded-sm hover:bg-orange-50 hover:shadow-xl hover:shadow-orange-100/20 transition-all group/rec cursor-pointer flex items-center gap-6"
                    >
                      <div className="w-14 h-14 bg-orange-50 rounded-sm flex items-center justify-center text-orange-600 group-hover/rec:scale-110 transition-transform">
                        <History className="h-7 w-7 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-orange-700 uppercase tracking-widest">Recentes</span>
                        <span className="text-[10px] font-bold text-orange-600/40 mt-1">Re-pague uma conta</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-orange-200 ml-auto group-hover/rec:text-orange-600 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Gestão de Contas */}
                <div className="space-y-6 text-center md:text-left">
                  <h2 className="text-xl font-black text-[#0c0a09] tracking-tight uppercase tracking-[0.1em]">Gestão de Contas</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {[
                      { icon: CalendarClock, label: "Agendamentos", key: "agendamentos", count: agendamentos.length },
                      { icon: ListChecks, label: "Histórico", key: "historico", count: pagamentosHistory.length },
                      { icon: ShieldCheck, label: "DDA", key: "dda", count: 0 },

                    ].map((opt, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (opt.key === "agendamentos") router.push("/dashboard/agendamentos");
                          else setActiveSection(opt.key);
                        }}
                        className="flex flex-col items-center justify-center w-full min-h-[160px] bg-white border border-orange-100 rounded-sm hover:bg-orange-50 hover:shadow-xl hover:shadow-orange-100/20 hover:scale-[1.03] transition-all group cursor-pointer p-6 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/40 rounded-full -mr-16 -mt-16 blur-3xl transition-transform duration-1000 group-hover:scale-150" />
                        {opt.key === "dda" && (
                          <Badge className="absolute top-2 left-2 bg-neutral-200 text-neutral-500 border-0 text-[7px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 z-20">Em breve</Badge>
                        )}
                        {opt.count > 0 && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-orange-50 rounded-sm flex items-center justify-center shadow-md border border-orange-100">
                            <span className="text-[9px] font-black text-orange-600">{opt.count}</span>
                          </div>
                        )}
                        <div className="w-12 h-12 flex items-center justify-center mb-4 text-orange-600 bg-orange-50 rounded-sm group-hover:scale-110 group-hover:bg-orange-100 transition-all relative z-10">
                          <opt.icon className="h-6 w-6 stroke-[2.5]" />
                        </div>
                        <span className="text-[11px] font-black text-orange-700 text-center px-1 uppercase tracking-widest leading-tight relative z-10">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar / DDA Card */}
              <div className="lg:col-span-4 space-y-10">
                <Card className="rounded-sm border border-orange-100 shadow-xl shadow-orange-100/10 bg-orange-50 p-10 space-y-8 relative overflow-hidden group cursor-pointer">
                  <div className="absolute -top-32 -right-32 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
                  <div className="relative z-10 space-y-6">
                    <Badge className="bg-orange-600 text-white border-0 px-3 py-1 font-black text-[10px] uppercase tracking-widest">Segurança G8</Badge>
                    <h3 className="text-3xl font-black text-orange-700 leading-tight">
                      Evite fraudes <br />
                      no seu <span className="text-orange-600">DDA.</span>
                    </h3>
                    <p className="text-sm text-orange-600/50 leading-relaxed font-medium">
                      Ative o Débito Direto Autorizado e visualize todos os boletos emitidos no seu CPF automaticamente.
                    </p>
                    <Button
                      disabled
                      className="w-full h-14 bg-neutral-200 text-neutral-400 rounded-sm font-black text-[10px] uppercase tracking-widest transition-all cursor-not-allowed group/dda"
                    >
                      <span className="flex items-center gap-2">
                        Ativar DDA <Badge className="bg-neutral-300 text-neutral-500 border-0 text-[8px] font-black">Em breve</Badge>
                      </span>
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-orange-100 space-y-4 relative z-10">
                    {[
                      { icon: ShieldCheck, text: "Proteção contra boletos falsos" },
                      { icon: Eye, text: "Visualize antes de pagar" },
                      { icon: Ban, text: "Bloqueie cobranças indevidas" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-orange-600 shrink-0" />
                        <span className="text-xs font-bold text-orange-600/40">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Horário info */}
                <div className="p-6 bg-orange-50  border border-neutral-100 rounded-sm shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-600" />
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-xs font-black text-[#0c0a09] uppercase tracking-widest">Horários de pagamento</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-400">Boletos</span>
                      <span className="text-xs font-black text-[#0c0a09]">Até 17h</span>
                    </div>
                    <Separator className="bg-neutral-50" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-400">Tributos</span>
                      <span className="text-xs font-black text-[#0c0a09]">Até 17h</span>
                    </div>
                    <Separator className="bg-neutral-50" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-400">Convênios</span>
                      <span className="text-xs font-black text-[#0c0a09]">Até 17h</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-neutral-300 leading-normal">
                    Pagamentos fora do horário serão processados no próximo dia útil.
                  </p>
                </div>
              </div>
            </div>



            {/* ──── Section Overlay: Histórico ──── */}
            {activeSection === "historico" && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#0c0a09]/90 backdrop-blur-md animate-in fade-in duration-300">
                <div className="w-full max-w-3xl bg-white rounded-sm shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between p-8 border-b border-neutral-100 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[var(--brand-accent)]/10 rounded-sm flex items-center justify-center text-[var(--brand-accent)]">
                        <ListChecks className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-[#0c0a09] uppercase tracking-tight">Histórico de Pagamentos</h2>
                        <p className="text-[10px] font-bold text-[var(--brand-accent)] uppercase tracking-[0.2em] animate-pulse">
                          {isLoadingHistory ? "Sincronizando com o banco..." : `${pagamentosHistory.length} pagamentos encontrados`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setActiveSection(null)} className="p-2 rounded-sm hover:bg-neutral-50 transition-colors">
                      <X className="h-5 w-5 text-neutral-400" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-3 no-scrollbar">
                    {isLoadingHistory ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-orange-50/50 rounded-sm border border-orange-100/50 animate-pulse">
                          <div className="w-2 h-2 bg-[var(--brand-accent)] rounded-full animate-bounce" />
                          <p className="text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-widest">Aguarde um instante, estamos processando...</p>
                        </div>
                        {Array(5).fill(0).map((_, i) => (
                          <div key={i} className="p-5 bg-neutral-50 rounded-sm border border-neutral-100 flex items-center justify-between opacity-60">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 bg-neutral-200 rounded-sm animate-pulse" />
                              <div className="space-y-2 flex-1">
                                <div className="h-4 bg-neutral-200 rounded-sm w-3/4 animate-pulse" />
                                <div className="h-3 bg-neutral-200 rounded-sm w-1/4 animate-pulse" />
                              </div>
                            </div>
                            <div className="w-20 h-6 bg-neutral-200 rounded-sm animate-pulse" />
                          </div>
                        ))}
                      </div>
                    ) : pagamentosHistory.length === 0 ? (
                      <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-200">
                          <History className="h-8 w-8" />
                        </div>
                        <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Nenhum pagamento localizado</p>
                      </div>
                    ) : (
                      pagamentosHistory.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const id = item.idDoBancoLiquidante || item.id_transaction || item.id || item.nsu;
                            if (id) {
                              // Mapeia os dados do histórico para o formato que a tela de sucesso espera
                              setBoletoData({
                                beneficiario: item.beneficiario || item.RecebinteNome || "PAGAMENTO BOLETO",
                                valor: Math.abs(item.valor),
                                vencimento: item.dataDaTransacaoFormatada || item.data,
                                dataPagamento: item.dataDaTransacaoFormatada || item.data,
                                bancoBeneficiario: item.metodoFormatado,
                                pagadorNome: "---"
                              });
                              setTransactionId(id);
                              setStep("success");
                              setActiveSection(null); // Fecha o modal de histórico
                            }
                          }}
                          className="p-5 bg-neutral-50 rounded-sm border border-neutral-100 flex items-center justify-between group hover:shadow-lg hover:border-[var(--brand-accent)]/20 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-green-50 rounded-sm flex items-center justify-center text-green-500 shrink-0">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-[#0c0a09] uppercase tracking-tight truncate">
                                {item.beneficiario || item.RecebinteNome || "PAGAMENTO BOLETO"}
                              </p>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                {item.dataDaTransacaoFormatada || item.data}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-4 flex items-center gap-4">
                            <p className="text-base font-black text-[#0c0a09] font-mono tracking-tight">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(item.valor))}
                            </p>
                            <ChevronRight className="h-4 w-4 text-neutral-200 group-hover:text-[var(--brand-accent)] transition-colors" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ──── Section Overlay: DDA ──── */}
            {activeSection === "dda" && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#0c0a09]/90 backdrop-blur-md animate-in fade-in duration-300">
                <div className="w-full max-w-xl bg-white rounded-sm shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                  <div className="flex items-center justify-between p-8 border-b border-neutral-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-sm flex items-center justify-center text-green-500">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl font-black text-[#0c0a09] uppercase tracking-tight">Débito Direto Autorizado</h2>
                    </div>
                    <button onClick={() => setActiveSection(null)} className="p-2 rounded-sm hover:bg-neutral-50 transition-colors">
                      <X className="h-5 w-5 text-neutral-400" />
                    </button>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="p-6 bg-[var(--brand-accent)]/10 rounded-sm border border-orange-100 space-y-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-[var(--brand-accent)]" />
                        <span className="text-xs font-black text-[#0c0a09] uppercase tracking-widest">O que é DDA?</span>
                      </div>
                      <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                        O DDA permite que você visualize todos os boletos emitidos no seu CPF/CNPJ diretamente no internet banking, antes mesmo de recebê-los fisicamente. Isso evita fraudes e pagamentos duplicados.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {[
                        { icon: ShieldCheck, title: "Segurança total", desc: "Todos os boletos são verificados pelo sistema bancário nacional." },
                        { icon: Eye, title: "Visualização completa", desc: "Veja valor, beneficiário e data de vencimento antes de pagar." },
                        { icon: Ban, title: "Bloqueio de fraudes", desc: "Identifique e bloqueie cobranças indevidas automaticamente." },
                      ].map((feat, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-neutral-50 rounded-sm border border-neutral-100">
                          <div className="w-8 h-8 bg-green-50 rounded-sm flex items-center justify-center text-green-500 shrink-0 mt-0.5">
                            <feat.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#0c0a09] uppercase tracking-tight">{feat.title}</p>
                            <p className="text-xs font-medium text-neutral-400 leading-relaxed mt-1">{feat.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      disabled
                      className="w-full h-14 bg-neutral-200 text-neutral-400 rounded-sm font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10 transition-all cursor-not-allowed"
                    >
                      Ativar DDA na minha conta <Badge className="ml-2 bg-neutral-300 text-neutral-500 border-0 text-[8px] font-black">Em breve</Badge>
                    </Button>
                  </div>
                </div>
              </div>
            )}


          </>
        )}

        {step === "review" && boletoData && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setStep("landing")} className="rounded-sm h-12 w-12 hover:bg-neutral-100">
                <ArrowLeft className="h-6 w-6 text-[var(--brand-accent)]" />
              </Button>
              <h2 className="text-3xl font-black text-[#0c0a09] tracking-tighter uppercase">Confirme os dados</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              <div className="md:col-span-8 space-y-8">
                <div className="bg-white p-10 rounded-sm border border-neutral-100 shadow-2xl space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mb-2 opacity-60">Beneficiário</p>
                      <h3 className="text-2xl font-black text-[#0c0a09] uppercase leading-tight">{boletoData.beneficiario}</h3>
                      {boletoData.documentoBeneficiario && (
                        <p className="text-[11px] font-bold text-neutral-500 mt-1">{boletoData.documentoBeneficiario}</p>
                      )}
                      {boletoData.bancoBeneficiario && (
                        <p className="text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-[0.1em] mt-2 opacity-80 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {boletoData.bancoBeneficiario}
                        </p>
                      )}
                    </div>
                    <div className="w-16 h-16 bg-[var(--brand-accent)]/10 rounded-sm flex items-center justify-center text-[var(--brand-accent)] shrink-0">
                      <Building2 className="h-8 w-8" />
                    </div>
                  </div>

                  <Separator className="bg-neutral-100" />

                  {boletoData.pagadorNome && (
                    <>
                      <div className="space-y-1">
                        <p className="text-[11px] text-[#0c0a09] font-bold uppercase tracking-widest">Pagador</p>
                        <p className="text-sm font-medium text-neutral-500 uppercase">{boletoData.pagadorNome}</p>
                      </div>
                      <Separator className="bg-neutral-100" />
                    </>
                  )}

                  {/* Payment Date Section */}
                  <div className="p-6 bg-neutral-50 rounded-sm border border-neutral-100 space-y-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-[#0c0a09] uppercase tracking-widest">Quando pagar?</p>
                      <div className="flex items-center bg-white rounded-sm border border-neutral-200 p-1 gap-1">
                        <button
                          onClick={() => { setPaymentMode("now"); setScheduleDate(""); }}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-sm font-black text-[9px] uppercase tracking-widest transition-all ${paymentMode === "now"
                            ? "bg-[#0c0a09] text-white shadow-md"
                            : "text-neutral-400 hover:text-[#0c0a09]"
                            }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Agora
                        </button>
                        <button
                          onClick={() => setPaymentMode("schedule")}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-sm font-black text-[9px] uppercase tracking-widest transition-all ${paymentMode === "schedule"
                            ? "bg-[#0c0a09] text-white shadow-md"
                            : "text-neutral-400 hover:text-[#0c0a09]"
                            }`}
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                          Agendar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-4 bg-white rounded-sm border border-neutral-100">
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Vencimento</p>
                        <p className="text-lg font-black text-[#0c0a09] tracking-tight">{boletoData.vencimento}</p>
                      </div>
                      <div className={`p-4 rounded-sm border-2 transition-colors ${paymentMode === "schedule" && !scheduleDate
                        ? "bg-[var(--brand-accent)]/5 border-[var(--brand-accent)]/30"
                        : "bg-white border-neutral-100"
                        }`}>
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Data de Pagamento</p>
                        <p className={`text-lg font-black tracking-tight ${paymentMode === "now" ? "text-[#0c0a09]" : scheduleDate ? "text-[var(--brand-accent)]" : "text-[var(--brand-accent)]/40"
                          }`}>
                          {paymentMode === "now" ? "Hoje" : scheduleDate ? new Date(scheduleDate + "T12:00:00").toLocaleDateString("pt-BR") : "Selecione →"}
                        </p>
                      </div>
                    </div>

                    {paymentMode === "schedule" && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                        <div className="flex items-center gap-4 p-4 bg-white rounded-sm border-2 border-[#0c0a09] relative">
                          <div className="w-10 h-10 bg-[#0c0a09] rounded-sm flex items-center justify-center shrink-0">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <Input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                            className="h-12 bg-transparent border-0 px-0 text-[#0c0a09] font-black text-lg focus:ring-0 focus-visible:ring-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Motivo do Pagamento (Opcional)</label>
                      <Select 
                        value={selectedCategory} 
                        onValueChange={(val) => setSelectedCategory(val || "OUTROS")}
                      >
                        <SelectTrigger size="xl" className="w-full bg-white border-neutral-200 shadow-sm focus:border-[var(--brand-accent)] group transition-all">
                          <SelectValue placeholder="Selecione o motivo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => {
                            const Icon = CATEGORY_MAP[cat].icon;
                            return (
                              <SelectItem key={cat} value={cat}>
                                <div className="flex items-center gap-3 py-1">
                                  <div className="w-8 h-8 rounded-sm bg-neutral-50 flex items-center justify-center text-neutral-400 group-focus:bg-[var(--brand-accent)]/10 group-focus:text-[var(--brand-accent)] transition-colors">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <span className="font-black text-[11px] uppercase tracking-widest">{CATEGORY_MAP[cat].label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-8 bg-[var(--brand-accent)]/10 rounded-sm border border-orange-100">
                    <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mb-3 opacity-60">Valor do Pagamento</p>
                    <p className="text-5xl font-black text-[var(--brand-accent)] font-mono tracking-tighter">
                      {formatCurrency(boletoData.valor)}
                    </p>
                  </div>

                  {userBalance !== null && boletoData.valor > userBalance && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-sm">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Atenção: Seu saldo atual ({formatCurrency(userBalance)}) é insuficiente para esta conta.</p>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      if (paymentMode === "schedule") {
                        if (!scheduleDate) {
                          toast.error("Selecione uma data para o agendamento.");
                          return;
                        }
                        // Add to scheduled payments
                        const newAgendamento = {
                          id: agendamentos.length + 1,
                          beneficiario: boletoData.beneficiario,
                          valor: formatCurrency(boletoData.valor),
                          data: new Date(scheduleDate + "T12:00:00").toLocaleDateString("pt-BR"),
                          status: "Agendado",
                          barcode: boletoData.linhaDigitavel?.substring(0, 30) + "..."
                        };
                        setAgendamentos(prev => [...prev, newAgendamento]);
                        toast.success(`Pagamento agendado para ${newAgendamento.data}!`);
                        setStep("landing");
                        setBarcode("");
                        setBoletoData(null);
                        setPaymentMode("now");
                        setScheduleDate("");
                        return;
                      }
                      handleRequestSms();
                    }}
                    disabled={isLoading || (userBalance !== null && boletoData.valor > userBalance) || (paymentMode === "schedule" && !scheduleDate)}
                    className={`w-full h-20 rounded-sm font-black text-lg uppercase tracking-widest shadow-2xl transition-all ${userBalance !== null && boletoData.valor > userBalance
                      ? "bg-red-500/10 text-red-500 border border-red-200 cursor-not-allowed hover:bg-red-500/10 shadow-none"
                      : paymentMode === "schedule"
                        ? "bg-[#0c0a09] hover:bg-[var(--brand-accent)] text-white shadow-black/10"
                        : "bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] hover:from-[#ea580c] hover:to-[var(--brand-accent)] text-white shadow-black/20"
                      }`}
                  >
                    {isLoading ? "PROCESSANDO..." : (
                      userBalance !== null && boletoData.valor > userBalance
                        ? "Saldo insuficiente"
                        : paymentMode === "schedule"
                          ? <><CalendarClock className="h-5 w-5 mr-3" /> AGENDAR PAGAMENTO</>
                          : "AUTORIZAR PAGAMENTO"
                    )}
                  </Button>
                </div>
              </div>

              <div className="md:col-span-4 space-y-6">
                <div className="p-8 bg-white border border-neutral-100 rounded-sm shadow-xl space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--brand-accent)]" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#fff9e6] rounded-sm flex items-center justify-center text-[var(--brand-accent)] shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h4 className="text-xs font-black text-[#0c0a09] uppercase tracking-widest">Aviso Importante</h4>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-neutral-500 leading-relaxed">
                      Certifique-se de que os dados acima correspondam ao boleto que você deseja pagar.
                    </p>
                    <div className="p-4 bg-neutral-50 rounded-sm border border-neutral-100 flex gap-3">
                      <Clock className="h-4 w-4 text-[var(--brand-accent)] shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-neutral-400 leading-normal uppercase">
                        Pagamentos após as <span className="text-[var(--brand-accent)]">20h</span> serão liquidados no próximo dia útil.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "sms" && (
          <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-10 py-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-[var(--brand-accent)]/10 rounded-[4px] flex items-center justify-center text-[var(--brand-accent)] shadow-xl relative group">
              <Smartphone className="h-10 w-10 animate-bounce text-[var(--brand-accent)]" />
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl font-black text-[#0c0a09] uppercase tracking-tighter">Validação de Segurança</h2>
              <p className="text-base font-bold text-neutral-400 uppercase tracking-widest leading-relaxed px-10">
                Enviamos um código para o seu celular cadastrado.
              </p>
            </div>

            <div className="w-full max-w-xs space-y-8">
              <Input
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").substring(0, 6))}
                className="h-20 text-center font-black text-4xl tracking-[0.5em] border-2 border-neutral-100 rounded-sm focus:border-[var(--brand-accent)] bg-white shadow-2xl text-[#0c0a09]"
                placeholder="0 0 0 0 0"
              />
              <div className="flex flex-col gap-4 w-full">
                <Button
                  onClick={handleFinalizePayment}
                  disabled={isLoading || smsCode.length < 5}
                  className="w-full h-16 bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] hover:from-[#ea580c] hover:to-[var(--brand-accent)] text-white rounded-sm font-black text-base uppercase tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? "PROCESSANDO..." : "CONFIRMAR PAGAMENTO"}
                </Button>
                <button className="text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-widest hover:underline transition-colors py-2">
                  Reenviar código em 00:59
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <SuccessStep 
            boletoData={boletoData} 
            transactionId={transactionId} 
            setTransactionId={setTransactionId}
            handlePrintReceipt={handlePrintReceipt}
            onNewPayment={() => {
              setStep("landing");
              setBoletoData(null);
              setBarcode("");
              setSmsCode("");
              setTransactionId("");
            }}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  );
}

// --- Componente Auxiliar para Tela de Sucesso com busca em background ---
function SuccessStep({ boletoData, transactionId, setTransactionId, handlePrintReceipt, onNewPayment, formatCurrency }: any) {
  const [isSyncing, setIsSyncing] = useState(!transactionId);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      let attempts = 0;
      const maxAttempts = 10; // Mais fôlego para o background

      const searchWithRetry = async () => {
        attempts++;
        try {
          console.log(`[SYNC SUCCESS] Tentativa ${attempts}...`);
          const extratoRes = await api.get("/api/banco/extrato/buscar");
          const items = extratoRes.data.transacoes || extratoRes.data.data?.transacoes || [];
          
          const targetVal = Math.abs(parseFloat(String(boletoData.valorTotal || boletoData.valor).replace(/[R$\s]/g, "").replace(",", ".")));

          const match = items.find((item: any) => {
            const itemVal = Math.abs(parseFloat(String(item.valor).replace(/[R$\s]/g, "").replace(",", ".")));
            return Math.abs(itemVal - targetVal) < 0.01;
          });

          if (match && (match.idDoBancoLiquidante || match.id_transaction || match.id || match.nsu)) {
            const finalId = match.idDoBancoLiquidante || match.id_transaction || match.id || match.nsu;
            setTransactionId(finalId);
            setIsSyncing(false);
          } else if (attempts < maxAttempts) {
            setTimeout(searchWithRetry, 3000);
          } else {
            setSyncError(true);
            setIsSyncing(false);
          }
        } catch (e) {
          if (attempts < maxAttempts) setTimeout(searchWithRetry, 3000);
          else {
            setSyncError(true);
            setIsSyncing(false);
          }
        }
      };
      
      searchWithRetry();
    } else {
      setIsSyncing(false);
    }
  }, [transactionId, boletoData, setTransactionId]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center space-y-10 py-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-2xl relative border-4 border-white">
        <CheckCircle2 className="h-12 w-12" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-[#0c0a09] tracking-tighter uppercase">Pagamento Realizado!</h2>
        <p className="text-base font-bold text-neutral-400 uppercase tracking-widest">Sua conta foi liquidada com sucesso.</p>
      </div>

      <div className="w-full bg-white rounded-sm border border-neutral-100 p-10 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16" />

        <div className="space-y-8 relative z-10">
          <div className="flex flex-col items-center border-b border-neutral-50 pb-8 text-center">
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 opacity-60">Valor Total Pago</span>
            <span className="text-5xl font-black text-[var(--brand-accent)] tracking-tighter">{formatCurrency(boletoData?.valor)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Beneficiário</p>
                <p className="text-sm font-black text-[#0c0a09] uppercase leading-tight">{boletoData?.beneficiario}</p>
                {boletoData?.documentoBeneficiario && (
                  <p className="text-[11px] font-medium text-neutral-500">{boletoData.documentoBeneficiario}</p>
                )}
                {boletoData?.bancoBeneficiario && (
                  <p className="text-[11px] font-bold text-[var(--brand-accent)] uppercase mt-1 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {boletoData.bancoBeneficiario}
                  </p>
                )}
              </div>

              <div className="space-y-1 pt-6 border-t border-neutral-50">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Pagador</p>
                <p className="text-sm font-black text-[#0c0a09] uppercase">{boletoData?.pagadorNome || "NOME NÃO INFORMADO"}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Vencimento</p>
                  <p className="text-sm font-black text-[#0c0a09]">{boletoData?.vencimento}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Data Pagamento</p>
                  <p className="text-sm font-black text-[#0c0a09]">{boletoData?.dataPagamento || new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-1 pt-6 border-t border-neutral-50">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Autenticação</p>
                {isSyncing ? (
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Sincronizando ID...</span>
                  </div>
                ) : syncError ? (
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-tight">ID disponível no extrato</p>
                ) : (
                  <p className="text-[11px] font-black text-neutral-400 font-mono break-all leading-relaxed uppercase">{transactionId}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex gap-4 pt-10">
        <Button 
          onClick={handlePrintReceipt} 
          disabled={isSyncing}
          className="flex-[2] h-20 bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] hover:from-[#ea580c] hover:to-[var(--brand-accent)] text-white rounded-sm font-black text-lg uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-70"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              GERANDO...
            </>
          ) : (
            <>
              <Download className="h-6 w-6" />
              COMPROVANTE
            </>
          )}
        </Button>
        <Button
          onClick={onNewPayment}
          variant="outline"
          className="flex-1 h-20 border-2 border-neutral-200 text-neutral-400 rounded-sm font-black text-lg uppercase tracking-widest hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] transition-all"
        >
          NOVO PAGAMENTO
        </Button>
      </div>
    </div>
  );
}

