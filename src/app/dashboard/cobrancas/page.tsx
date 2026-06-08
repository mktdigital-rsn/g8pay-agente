"use client";

import React, { useMemo, useState, useEffect } from "react";
import api from "@/lib/api";
import {
    Banknote,
    Search,
    Download,
    Plus,
    FileText,
    Calendar,
    Filter,
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    ChevronRight,
    ArrowLeft,
    PlusCircle,
    CalendarDays,
    ArrowUpDown,
    Send,
    Loader2,
    FileSpreadsheet,
    FileBox,
    RotateCw,
    TrendingUp,
    AlertTriangle,
    PieChart as PieChartIcon,
    Diamond,
    Building2,
    Fingerprint,
    Printer,
    Layers
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAtom, useAtomValue } from "jotai";
import { cobrancaDataAtom } from "@/store/pagamentos";
import { userAtom } from "@/store/auth";
import { currentBrand } from "@/config/brand";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BoletoItem {
    id: string;
    itemId?: string;
    uuid?: string;
    idDoBancoLiquidante?: string;
    amount: number;
    expirationDate: string;
    paidAt: string | null;
    status: string;
    ourNumber: string;
    payer: {
        name: string;
        document: string;
        email?: string;
    };
    createdAt?: string;
    urlBoleto?: string;
    html?: string;
    boletoHtml?: string;
}

export default function GestaoCobrancasPage() {
    const router = useRouter();
    const [cobrancaData, setCobrancaData] = useAtom(cobrancaDataAtom);
    const [view, setView] = useState<"list" | "create">("list");

    // --- List View States ---
    const [items, setItems] = useState<BoletoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [chartPeriod, setChartPeriod] = useState<"day" | "week" | "month">("week");

    // Removed default auto-filling for start/end date to not hide future boletos
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [statusFilter, setStatusFilter] = useState("TODOS");
    const [exportingType, setExportingType] = useState<'pdf' | 'xls' | 'csv' | null>(null);
    const [selectedBoleto, setSelectedBoleto] = useState<BoletoItem | null>(null);

    // --- Create View States ---
    const [inputValue, setInputValue] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const VALOR_MINIMO = 30;

    const user = useAtomValue(userAtom);
    const isPJ = useMemo(() => {
        const raw = user?.taxNumber?.replace(/\D/g, "") || "";
        return raw.length === 14;
    }, [user]);

    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
        setMounted(true);
    }, []);

    const maskBRL = (value: string) => {
        const cleanValue = value.replace(/\D/g, "");
        if (!cleanValue) return "";
        const floatValue = parseFloat(cleanValue) / 100;
        return new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(floatValue);
    };

    const resolveBoletoStatus = (item: BoletoItem) => {
        if (item.status === 'paid' || item.paidAt) return 'PAGO';
        if (item.status === 'manual_cancellation') return 'CANCELADO';

        if (item.expirationDate) {
            const expDate = new Date(item.expirationDate + 'T00:00:00'); // enforce local day calculation
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (expDate < today) {
                return 'VENCIDO';
            }
        }
        return 'PENDENTE';
    };

    // Fetch Boletos / Cobranças
    useEffect(() => {
        if (view === "list") {
            const fetchCobrancas = async () => {
                setIsLoading(true);
                try {
                    // We fetch pages to make sure we have all relevant boletos to construct the dashboard correctly.
                    const [resPage1, resPage2] = await Promise.all([
                        api.get("/api/banco/pagamentos/listar-boletos?page=1").catch(() => null),
                        api.get("/api/banco/pagamentos/listar-boletos?page=2").catch(() => null)
                    ]);

                    const items1 = resPage1?.data?.data?.items || [];
                    const items2 = resPage2?.data?.data?.items || [];

                    const allItems: BoletoItem[] = [...items1, ...items2];
                    setItems(allItems);
                } catch (err) {
                    console.error("Error fetching cobrancas:", err);
                    toast.error("Erro ao requistar dados de boletos.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCobrancas();
        }
    }, [view]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
    };

    const dateFilteredItems = useMemo(() => {
        return items.filter(item => {
            const nomeStr = item.payer?.name?.toLowerCase() || '';
            const docStr = item.payer?.document?.toLowerCase() || '';
            const codeStr = item.ourNumber?.toLowerCase() || '';

            const matchesSearch =
                nomeStr.includes(searchTerm.toLowerCase()) ||
                docStr.includes(searchTerm.toLowerCase()) ||
                codeStr.includes(searchTerm.toLowerCase());

            let matchesDate = true;
            if (startDate || endDate) {
                // Determine item date (use expirationDate if createdAt is absent)
                let isoDate = item.createdAt ? item.createdAt.split('T')[0] : item.expirationDate;
                if (!isoDate) isoDate = "2000-01-01"; // Fallback

                if (startDate && isoDate < startDate) matchesDate = false;
                if (endDate && isoDate > endDate) matchesDate = false;
            }

            return matchesSearch && matchesDate;
        });
    }, [items, searchTerm, startDate, endDate]);

    const searchedPayer = useMemo(() => {
        if (!searchTerm || searchTerm.length < 11) return null;

        const cleanSearch = searchTerm.replace(/\D/g, "");
        if (cleanSearch.length !== 11 && cleanSearch.length !== 14) return null;

        const match = items.find(item =>
            item.payer?.document?.replace(/\D/g, "") === cleanSearch
        );

        if (match) {
            return {
                name: match.payer.name,
                document: match.payer.document
            };
        }
        return null;
    }, [searchTerm, items]);

    const totals = useMemo(() => {
        let aReceber = 0;
        let pagos = 0;
        let cancelados = 0;
        let vencidos = 0;
        let total = 0;

        dateFilteredItems.forEach(item => {
            const valor = item.amount / 100; // API is in cents
            const status = resolveBoletoStatus(item);

            total += valor;
            if (status === 'PAGO') pagos += valor;
            else if (status === 'CANCELADO') cancelados += valor;
            else if (status === 'VENCIDO') vencidos += valor;
            else if (status === 'PENDENTE') aReceber += valor;
        });

        return { aReceber, pagos, cancelados, vencidos, total };
    }, [dateFilteredItems]);

    const filteredItems = useMemo(() => {
        return dateFilteredItems.filter(item => {
            const itemStatus = resolveBoletoStatus(item);
            return statusFilter === "TODOS" || itemStatus === statusFilter;
        }).sort((a, b) => {
            const d1 = a.expirationDate ? new Date(a.expirationDate).getTime() : 0;
            const d2 = b.expirationDate ? new Date(b.expirationDate).getTime() : 0;
            return d2 - d1;
        });
    }, [dateFilteredItems, statusFilter]);

    const areaChartData = useMemo(() => {
        const refDate = endDate ? new Date(endDate + 'T12:00:00') : new Date();
        const groups: any[] = [];

        const calcDay = (d: Date, dayName: string) => {
            let faturado = 0;
            let pago = 0;
            const targetDateStr = d.toISOString().split('T')[0];

            dateFilteredItems.forEach(item => {
                let dtStr = item.createdAt ? item.createdAt.split('T')[0] : item.expirationDate;
                if (!dtStr) return;

                if (dtStr === targetDateStr) {
                    const val = item.amount / 100;
                    const status = resolveBoletoStatus(item);
                    faturado += val;
                    if (status === 'PAGO') pago += val;
                }
            });
            return { name: dayName, Faturado: faturado, Pago: pago };
        };

        if (chartPeriod === "week") {
            const daysArr = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(refDate);
                d.setDate(refDate.getDate() - i);
                groups.push(calcDay(d, daysArr[d.getDay()]));
            }
        } else if (chartPeriod === "month") {
            const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
            const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();

            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(refDate.getFullYear(), refDate.getMonth(), i);
                const dayStr = `${String(d.getDate()).padStart(2, '0')}`;
                groups.push(calcDay(d, dayStr));
            }
        } else if (chartPeriod === "day") {
            groups.push(calcDay(refDate, "Hoje"));
        }

        return groups;
    }, [dateFilteredItems, chartPeriod, endDate]);

    const pieChartData = useMemo(() => {
        return [
            { name: "A Receber", value: totals.aReceber, color: "#2563eb" }, // blue-600
            { name: "Pagos", value: totals.pagos, color: "#059669" }, // emerald-600
            { name: "Vencidos", value: totals.vencidos, color: "#dc2626" }, // red-600
            { name: "Cancelados", value: totals.cancelados, color: "#52525b" }, // zinc-600
        ].filter(d => d.value > 0);
    }, [totals]);

    // --- REAL EXPORT LOGIC ---
    const handleExport = async (type: 'pdf' | 'xls' | 'csv') => {
        setExportingType(type);
        const toastId = toast.loading(`Preparando exportação (${type.toUpperCase()})...`);

        try {
            const dataToExport = filteredItems.map(i => {
                const statusStr = resolveBoletoStatus(i);
                return {
                    pagador: i.payer?.name || "Desconhecido",
                    documento: i.payer?.document || "-",
                    codigo: i.ourNumber || "-",
                    status: statusStr === "PENDENTE" ? "A RECEBER" : statusStr,
                    valor: formatCurrency(i.amount / 100),
                    vencimento: i.expirationDate ? i.expirationDate.split('-').reverse().join('/') : "-"
                }
            });

            if (type === "csv" || type === "xls") {
                const headers = ["Pagador", "Documento", "Codigo", "Status", "Valor", "Vencimento"];
                const csvContent = [
                    headers.join(";"),
                    ...dataToExport.map(row => Object.values(row).join(";"))
                ].join("\n");

                const blob = new Blob(["\uFEFF" + csvContent], { type: type === "csv" ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `relatorio_g8_boletos_${new Date().getTime()}.${type}`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (type === "pdf") {
                const doc = new jsPDF();

                try {
                    const img = new window.Image();
                    img.src = '/logo_g8_white.png'; // Updated to the dark/colored logo for white background
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });
                    doc.addImage(img, 'PNG', 14, 14, 25, 8);
                } catch (e) {
                    console.error("Erro ao carregar logo", e);
                }

                doc.setTextColor(30, 30, 30);
                doc.setFontSize(18);
                doc.text("Relatório de Gestão de Boletos", 50, 18);

                doc.setFontSize(10);
                doc.text(`Filtro Atual: ${statusFilter} | Data: ${new Date().toLocaleDateString()}`, 50, 24);

                autoTable(doc, {
                    startY: 35,
                    head: [["Pagador", "Documento", "Codigo", "Status", "Valor", "Vencimento"]],
                    body: dataToExport.map(Object.values),
                    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
                    alternateRowStyles: { fillColor: [245, 245, 245] }
                });

                doc.save(`relatorio_g8_boletos_${new Date().getTime()}.pdf`);
            }

            toast.dismiss(toastId);
            toast.success("Exportação concluída!");
        } catch (err) {
            console.error("Export failure:", err);
            toast.dismiss(toastId);
            toast.error("Erro ao exportar dados.");
        } finally {
            setExportingType(null);
        }
    };

    const handlePrint = async (boleto: BoletoItem) => {
        const id = boleto.id || boleto.itemId || boleto.uuid;
        if (!id) {
            toast.error("Identificador de boleto não encontrado.");
            return;
        }

        const toastId = toast.loading("Gerando boleto para impressão...");
        try {
            const response = await api.get(`/api/banco/pagamentos/imprimir-boleto/${id}`, {
                responseType: 'text',
                transformResponse: [(data) => data]
            });

            toast.dismiss(toastId);
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                      <head>
                        <title>Impressão G8 Pay</title>
                        <style>
                          @media print {
                            @page { margin: 0; }
                            body { margin: 1cm; }
                            .no-print { display: none !important; }
                          }
                          body { font-family: sans-serif; margin: 0; padding: 0; background: #fff; }
                          .print-header {
                            background: #f8f9fa;
                            padding: 15px;
                            text-align: center;
                            border-bottom: 1px solid #eee;
                          }
                          .btn-print {
                            padding: 10px 25px;
                            background: #000;
                            color: #fff;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-weight: bold;
                            text-transform: uppercase;
                            font-size: 11px;
                            letter-spacing: 1px;
                          }
                        </style>
                      </head>
                      <body>
                        <div class="print-header no-print">
                          <button class="btn-print" onclick="window.print()">Clique aqui para imprimir</button>
                        </div>
                        <div style="padding: 20px;">
                          ${response.data}
                        </div>
                      </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            }
        } catch (err) {
            console.error("Print fetch failed:", err);
            toast.dismiss(toastId);
            toast.error("Erro ao carregar o boleto para impressão.");
        }
    };

    const handleNext = () => {
        const rawValue = inputValue.replace(/\./g, "").replace(",", ".");
        const valor = parseFloat(rawValue);
        if (isNaN(valor) || valor < VALOR_MINIMO) {
            setFormError(`O valor mínimo para cobrança é ${formatCurrency(VALOR_MINIMO)}`);
            return;
        }
        setFormError(null);
        setCobrancaData({ ...cobrancaData, valor });
        router.push("/dashboard/cobrancas/pagador");
    };

    if (view === "create") {
        return (
            <div className="p-4 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-7xl mx-auto">
                <div className="flex items-center gap-6">
                    <Button variant="outline" size="icon" onClick={() => setView("list")} className="h-12 w-12 rounded-sm border-neutral-100"><ArrowLeft className="h-6 w-6 text-[var(--brand-accent)]" /></Button>
                    <div>
                        <Badge className="bg-[var(--brand-accent)] text-white border-0 px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-sm mb-2 shadow-lg shadow-orange-500/20">Novo Título</Badge>
                        <h1 className="text-3xl md:text-5xl font-black text-[#0c0a09] tracking-tighter uppercase leading-none">Gerar Boleto</h1>
                    </div>
                </div>
                <Card className="border-0 shadow-2xl bg-white overflow-hidden rounded-sm">
                    <CardHeader className="bg-[var(--brand-accent)] p-8 md:p-12 relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-sm flex items-center justify-center border border-white/30 shadow-xl"><Banknote className="h-8 w-8" /></div>
                            <div>
                                <CardTitle className="text-3xl font-black uppercase tracking-tighter">Definição de Valor</CardTitle>
                                <CardDescription className="text-white/80 font-black uppercase text-[10px] tracking-[0.2em]">Passo 01 de 02 &bull; Registro Bancário</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 md:p-16 space-y-12">
                        <div className="space-y-6">
                            <label className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--brand-accent)] block text-center">Informe o valor total da cobrança</label>
                            <div className="relative group max-w-lg mx-auto">
                                <div className="absolute inset-0 bg-orange-500/5 rounded-sm scale-105 group-focus-within:scale-110 transition-transform blur-xl" />
                                <div className="relative bg-white border-2 border-neutral-100 group-focus-within:border-[var(--brand-accent)] rounded-sm overflow-hidden flex items-center px-8 py-6 transition-all">
                                    <span className="text-2xl font-black text-[var(--brand-accent)] mr-4">R$</span>
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(maskBRL(e.target.value))}
                                        placeholder="0,00"
                                        className="w-full bg-transparent text-5xl md:text-6xl font-black text-[#0c0a09] placeholder:text-neutral-100 focus:outline-none font-mono tracking-tighter"
                                    />
                                </div>
                            </div>
                            {formError && <div className="flex items-center justify-center gap-3 text-red-500 font-black text-xs uppercase tracking-widest animate-bounce"><AlertCircle className="h-4 w-4" />{formError}</div>}
                        </div>
                        <div className="max-w-lg mx-auto w-full">
                            <Button onClick={handleNext} className="w-full h-16 bg-[#0c0a09] hover:bg-[var(--brand-accent)] text-white rounded-sm text-lg font-black uppercase tracking-[0.2em] transition-all group shadow-2xl relative overflow-hidden">
                                <span className="relative z-10">Continuar</span>
                                <Send className="ml-4 h-5 w-5 relative z-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                                <div className="absolute inset-0 bg-[var(--brand-accent)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 flex flex-col gap-8 h-full overflow-y-auto w-full no-scrollbar bg-[#f8f9fa] animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-2">
                <div className="space-y-1">
                    <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0 px-3 py-1 font-black text-[10px] uppercase tracking-[0.25em] rounded-sm">Gestão Comercial</Badge>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none uppercase">Gestão de <span className="text-[var(--brand-accent)]">Boletos</span></h1>
                    <p className="text-sm text-neutral-400 font-bold italic">Acompanhe seu fluxo de caixa e emissão de cobranças em tempo real.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Button
                        onClick={() => setView("create")}
                        disabled={!isPJ}
                        className={cn(
                            "h-12 md:h-14 rounded-sm px-8 font-black text-xs md:text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all group",
                            !isPJ ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none" : "bg-[#0c0a09] hover:bg-[var(--brand-accent)] text-white active:scale-95"
                        )}
                    >
                        <PlusCircle className={cn("h-5 w-5 transition-transform", isPJ && "group-hover:rotate-90")} />
                        Gerar Novo Boleto
                    </Button>
                    {!isPJ && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Somente para usuários PJ</p>}
                </div>
            </div>

            {/* Top Cards (Metrics Funnels) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: "A Receber", val: totals.aReceber, status: "PENDENTE", color: "bg-blue-600", icon: Clock },
                    { label: "Pagos", val: totals.pagos, status: "PAGO", color: "bg-emerald-600", icon: CheckCircle2 },
                    { label: "Cancelados", val: totals.cancelados, status: "CANCELADO", color: "bg-zinc-500", icon: XCircle },
                    { label: "Vencidos", val: totals.vencidos, status: "VENCIDO", color: "bg-red-500", icon: AlertCircle },
                    { label: "Total Geral", val: totals.total, status: "TODOS", color: "bg-indigo-700", icon: ArrowUpRight },
                ].map((card, i) => (
                    <Card key={i} className={cn("border-0 rounded-sm p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all min-h-[140px]", card.color)}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                        <div className="flex justify-between items-start relative z-10">
                            <card.icon className="h-6 w-6 text-white/50" />
                            <Badge className="bg-white/20 text-white border-0 text-[8px] font-black uppercase tracking-widest">Live</Badge>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] text-white/60 font-black uppercase tracking-[0.2em] mb-1">{card.label}</p>
                            <p className="text-xl md:text-2xl font-black text-white font-mono tracking-tighter truncate leading-none">{isLoading ? "..." : formatCurrency(card.val)}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* SÍNTESE EXECUTIVA E KPIs DE RISCO */}
            <div className="bg-white rounded-sm p-6 border border-neutral-100 shadow-sm space-y-6">
                <h4 className="text-[11px] font-black text-[#0c0a09] uppercase tracking-[0.3em] border-b border-neutral-100 pb-2 flex justify-between items-center">
                    <span>Síntese Executiva e KPIs de Risco</span>
                    {searchedPayer && (
                        <span className="text-[var(--brand-accent)] text-[16px] animate-in fade-in slide-in-from-right-4 duration-500">
                            {searchedPayer.name} / {searchedPayer.document}
                        </span>
                    )}
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Total Geral (Wide) */}
                    <Card className="lg:col-span-3 border-2 border-neutral-100 rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-center gap-4 bg-gradient-to-r from-neutral-50 to-white">
                        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-6 w-6 text-neutral-400" />
                        </div>
                        <div className="text-center sm:text-left">
                            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em]">Total Geral de Emissão</p>
                            <p className="text-4xl md:text-5xl font-black text-[#0c0a09] tracking-tighter">{isLoading ? "..." : formatCurrency(totals.total)}</p>
                        </div>
                    </Card>

                    {/* KPIs: Vencidos e Liquidez */}
                    <Card className="border border-red-100 bg-red-50/50 rounded-sm p-6 flex items-start gap-4 lg:col-span-2">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">Risco Vencidos (Inadimplência)</p>
                            <p className="text-4xl font-black text-red-600 tracking-tighter">
                                {isLoading ? "..." : `${totals.total > 0 ? ((totals.vencidos / totals.total) * 100).toFixed(1) : "0.0"}%`}
                            </p>
                            <p className="text-[10px] font-bold text-red-500/80 bg-red-100 px-2 py-0.5 rounded-sm inline-block uppercase mt-1">
                                Volume: {isLoading ? "..." : formatCurrency(totals.vencidos)}
                            </p>
                        </div>
                    </Card>

                    <Card className="border border-emerald-100 bg-emerald-50/50 rounded-sm p-6 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <PieChartIcon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">Taxa de Liquidez</p>
                            <p className="text-3xl font-black text-emerald-600 tracking-tighter">{isLoading ? "..." : `${totals.total > 0 ? ((totals.pagos / totals.total) * 100).toFixed(1) : "0"}%`}</p>
                            <p className="text-[9px] font-bold text-neutral-400 mt-1 uppercase">Conversão Efetiva</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* DETALHAMENTO E ANÁLISE DE FLUXO */}
            <div className="bg-white rounded-sm p-6 border border-neutral-100 shadow-sm space-y-6">
                <h4 className="text-[11px] font-black text-[#0c0a09] uppercase tracking-[0.3em] border-b border-neutral-100 pb-2 flex justify-between items-center">
                    <span>Detalhamento e Análise de Fluxo</span>
                    {searchedPayer && (
                        <span className="text-[var(--brand-accent)] text-[16px] animate-in fade-in slide-in-from-right-4 duration-500">
                            {searchedPayer.name} / {searchedPayer.document}
                        </span>
                    )}
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Pie Chart / Funnel */}
                    <div className="h-[300px] flex flex-col justify-center border border-neutral-100 rounded-sm p-4 bg-neutral-50/30">
                        {mounted && !isLoading && totals.total > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(val: any) => formatCurrency(Number(val))}
                                        contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'black', fontSize: '12px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-neutral-300 text-xs font-bold uppercase tracking-widest">Sem dados para análise</div>
                        )}
                    </div>

                    {/* Area Chart / Volume */}
                    <div className="h-[300px] border border-neutral-100 rounded-sm p-4 flex flex-col justify-center relative bg-neutral-50/30">
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <Tabs value={chartPeriod} onValueChange={(val: any) => {
                                setChartPeriod(val);
                                const refDate = endDate ? new Date(endDate + 'T12:00:00') : new Date();
                                if (val === "day") {
                                    setStartDate(refDate.toISOString().split('T')[0]);
                                } else if (val === "week") {
                                    const start = new Date(refDate);
                                    start.setDate(refDate.getDate() - 7);
                                    setStartDate(start.toISOString().split('T')[0]);
                                } else if (val === "month") {
                                    const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
                                    const end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
                                    setStartDate(start.toISOString().split('T')[0]);
                                    setEndDate(end.toISOString().split('T')[0]);
                                }
                            }} className="w-fit">
                                <TabsList className="bg-white rounded-sm p-0.5 h-8 gap-1 border border-neutral-200">
                                    <TabsTrigger value="day" className="rounded-sm h-full px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-neutral-100 data-[state=active]:text-[var(--brand-accent)]">Dia</TabsTrigger>
                                    <TabsTrigger value="week" className="rounded-sm h-full px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-neutral-100 data-[state=active]:text-[var(--brand-accent)]">Semana</TabsTrigger>
                                    <TabsTrigger value="month" className="rounded-sm h-full px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-neutral-100 data-[state=active]:text-[var(--brand-accent)]">Mês</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        {mounted && !isLoading && filteredItems.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={areaChartData} margin={{ top: 30, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorFaturado" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--brand-accent)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--brand-accent)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorPago" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} tickFormatter={(val) => `R$ ${val}`} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'black', fontSize: '12px' }} formatter={(value: any) => formatCurrency(Number(value))} />
                                    <Area type="monotone" dataKey="Faturado" stroke="var(--brand-accent)" fillOpacity={1} fill="url(#colorFaturado)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="Pago" stroke="#059669" fillOpacity={1} fill="url(#colorPago)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-neutral-300 text-xs font-bold uppercase tracking-widest mt-6">Sem dados para análise</div>
                        )}
                    </div>
                </div>
            </div>

            {/* List and Filters */}
            <div className="bg-white rounded-sm p-4 md:p-8 border border-neutral-100 shadow-sm space-y-8">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col min-[1350px]:flex-row items-center justify-between gap-6 pb-6 border-b border-neutral-50 text-neutral-400 font-bold"
                        style={{
                            flexDirection: mounted && window.innerWidth >= 1350 ? 'column' : undefined,
                            justifyContent: mounted && window.innerWidth >= 1350 ? 'center' : undefined
                        } as any}>
                        <Tabs value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)} className="w-full lg:w-auto">
                            <TabsList className="bg-neutral-50 rounded-sm p-0.5 h-12 gap-1 border border-neutral-100 w-full lg:w-auto overflow-x-auto no-scrollbar">
                                <TabsTrigger value="TODOS" className="rounded-sm h-full px-6 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[var(--brand-accent)]">Todos</TabsTrigger>
                                <TabsTrigger value="PENDENTE" className="rounded-sm h-full px-6 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600">A Receber</TabsTrigger>
                                <TabsTrigger value="PAGO" className="rounded-sm h-full px-6 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600">Pagos</TabsTrigger>
                                <TabsTrigger value="VENCIDO" className="rounded-sm h-full px-6 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-red-600">Vencidos</TabsTrigger>
                                <TabsTrigger value="CANCELADO" className="rounded-sm h-full px-6 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-zinc-500">Cancelados</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="flex items-center gap-1 bg-neutral-50 rounded-sm p-1 border border-neutral-100 h-12 shadow-inner">
                            <div className="relative group">
                                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-hover:text-[var(--brand-accent)]" />
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-full w-[140px] bg-transparent border-0 pl-10 text-[10px] font-black focus-visible:ring-0 cursor-pointer" />
                            </div>
                            <span className="text-neutral-300 font-bold px-1">/</span>
                            <div className="relative group">
                                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-hover:text-[var(--brand-accent)]" />
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-full w-[140px] bg-transparent border-0 pl-10 text-[10px] font-black focus-visible:ring-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col min-[1220px]:flex-row items-center justify-between gap-6"
                        style={{
                            flexDirection: mounted && window.innerWidth >= 1350 ? 'column' : undefined,
                            justifyContent: mounted && window.innerWidth >= 1350 ? 'center' : undefined
                        } as any}>
                        <div className="relative max-w-2xl w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                            <Input placeholder="Buscar por nome, CPF/CNPJ ou código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-14 bg-neutral-50 border-neutral-100 font-bold focus:border-[var(--brand-accent)] rounded-sm shadow-inner" />
                        </div>
                        <div className="flex items-center gap-3 shrink-0"><p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mr-2">Exportar:</p>
                            <Button onClick={() => handleExport('pdf')} disabled={!!exportingType} className="h-12 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-widest rounded-sm px-5 flex items-center gap-2 shadow-lg active:scale-95 transition-all outline-none">{exportingType === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBox className="h-4 w-4" />} PDF</Button>
                            <Button onClick={() => handleExport('csv')} disabled={!!exportingType} className="h-12 bg-neutral-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-sm px-5 flex items-center gap-2 shadow-lg active:scale-95 transition-all outline-none">{exportingType === 'csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-400" />} CSV</Button>
                            <Button onClick={() => handleExport('xls')} disabled={!!exportingType} className="h-12 bg-neutral-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-sm px-5 flex items-center gap-2 shadow-lg active:scale-95 transition-all outline-none">{exportingType === 'xls' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-400" />} XLS</Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="hidden sm:grid grid-cols-12 px-6 pb-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] gap-4">
                        <span className="col-span-4 flex items-center gap-2 px-2">Pagador / Título</span>
                        <span className="col-span-2 text-center">Nº do Boleto</span>
                        <span className="col-span-2 flex items-center justify-center gap-2">Status</span>
                        <span className="col-span-2 text-right">Valor Líquido</span>
                        <span className="col-span-2 text-right">Vencimento</span>
                    </div>

                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="py-20 flex justify-center text-neutral-400 uppercase font-black text-[10px] tracking-widest w-full items-center"><Loader2 className="h-5 w-5 animate-spin mr-3" /> Carregando dados...</div>
                        ) : filteredItems.length === 0 ? (
                            <div className="py-20 text-center bg-neutral-50/50 rounded-sm border border-dashed border-neutral-200">
                                <p className="text-neutral-500 font-black uppercase text-[10px] tracking-[0.2em]">Nenhum boleto localizado</p>
                            </div>
                        ) : (
                            filteredItems.map((i, idx) => {
                                const statusStr = resolveBoletoStatus(i);

                                // Format the date nicely
                                let displayDate = "-";
                                if (i.expirationDate) {
                                    const parts = i.expirationDate.split('-'); // YYYY-MM-DD
                                    if (parts.length === 3) displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                                }

                                return (
                                    <div key={idx}
                                        onClick={() => setSelectedBoleto(i)}
                                        className="grid grid-cols-1 sm:grid-cols-12 items-center px-6 py-5 bg-white hover:bg-neutral-50/80 rounded-sm border border-neutral-100 hover:border-[var(--brand-accent)]/20 transition-all cursor-pointer group gap-4 shadow-sm hover:shadow-md animate-in fade-in slide-in-from-right-4 duration-300"
                                        style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className="col-span-4 flex items-center gap-5">
                                            <div className={cn("w-12 h-12 rounded-sm flex items-center justify-center transition-all group-hover:scale-110 shadow-inner", statusStr === "PAGO" ? "bg-emerald-50 text-emerald-500" : statusStr === "VENCIDO" ? "bg-red-50 text-red-500" : statusStr === "CANCELADO" ? "bg-zinc-50 text-zinc-500" : "bg-blue-50 text-blue-500")}>
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-sm text-[#0c0a09] uppercase truncate tracking-tight">{i.payer?.name || "Desconhecido"}</p>
                                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest truncate">{i.payer?.document || "S/N"}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <p className="text-[11px] font-black text-neutral-500 font-mono tracking-tighter">{i.ourNumber || "-"}</p>
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <Badge className={cn("px-4 py-1.5 font-black text-[9px] uppercase tracking-[0.1em] rounded-sm border-0 shadow-sm transition-colors", statusStr === "PAGO" ? "bg-emerald-500 text-white" : statusStr === "VENCIDO" ? "bg-red-500 text-white" : statusStr === "CANCELADO" ? "bg-zinc-500 text-white" : "bg-blue-600 text-white")}>
                                                {statusStr === "PENDENTE" ? "A RECEBER" : statusStr}
                                            </Badge>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <p className="font-black text-[#0c0a09] font-mono text-lg tracking-tighter">{formatCurrency(i.amount / 100)}</p>
                                        </div>
                                        <div className="col-span-2 text-right flex items-center justify-end gap-3">
                                            <div className="text-right">
                                                <p className="text-xs font-black text-[#0c0a09] group-hover:text-[var(--brand-accent)] transition-colors">{displayDate}</p>
                                                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">{statusStr === "PAGO" && i.paidAt ? "Liquidado" : "Vencimento"}</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-neutral-200 group-hover:text-[var(--brand-accent)] group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Detail Modal Overlay */}
            {selectedBoleto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#0c0a09]/90 backdrop-blur-md animate-in fade-in duration-500 overflow-y-auto">
                    <Card className="w-full max-w-[480px] 2xl:max-w-2xl bg-white rounded-sm overflow-hidden shadow-2xl relative border-white/20 animate-in zoom-in-95 duration-300 my-auto">
                        <button
                            onClick={() => setSelectedBoleto(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-50 hover:bg-neutral-100 transition-all z-20 hover:rotate-90"
                        >
                            <ArrowLeft className="h-5 w-5 rotate-180 text-neutral-400" />
                        </button>

                        <div className="relative">
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-neutral-50 to-white" />

                            <div className="p-5 md:p-6 2xl:p-10 space-y-4 2xl:space-y-8 relative z-10">
                                <div className="text-center space-y-3 2xl:space-y-5">
                                    <div className="relative inline-block">
                                        <div className="absolute -inset-4 bg-[var(--brand-accent)]/10 rounded-full blur-xl" />
                                        <div className="w-14 h-14 2xl:w-20 2xl:h-20 bg-[#0c0a09] rounded-sm flex items-center justify-center text-[var(--brand-accent)] mx-auto shadow-2xl relative border border-white/5">
                                            <Diamond className="h-7 w-7 2xl:h-10 2xl:w-10 fill-[var(--brand-accent)]/20" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl 2xl:text-2xl font-black text-[#0c0a09] tracking-tighter uppercase font-sans">Detalhes do Boleto</h2>
                                        <div className="flex items-center justify-center gap-2 mt-1">
                                            <CheckCircle2 className="h-3 w-3 2xl:h-4 2xl:w-4 text-green-500" />
                                            <p className="text-[10px] 2xl:text-xs text-neutral-400 font-black uppercase tracking-[0.2em]">Registro Validado G8 PAY</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div className="md:col-span-2 text-center py-4 2xl:py-8 bg-neutral-50 rounded-sm border border-neutral-100 flex flex-col justify-center">
                                        <p className="text-[10px] 2xl:text-xs text-neutral-400 font-black uppercase tracking-[0.3em] mb-2">Valor Nominal</p>
                                        <p className="text-2xl 2xl:text-3xl font-black text-[var(--brand-accent)] font-mono tracking-tighter leading-none">
                                            {formatCurrency(selectedBoleto.amount / 100)}
                                        </p>
                                    </div>

                                    <div className="md:col-span-3 p-4 2xl:p-5 rounded-sm bg-neutral-50 border border-neutral-100 flex flex-col justify-center space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Fingerprint className="h-3 w-3 text-[var(--brand-accent)]" />
                                            <p className="text-[10px] 2xl:text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-accent)]">Nosso Número / ID</p>
                                        </div>
                                        <p className="text-[10px] 2xl:text-xs font-mono font-bold break-all leading-relaxed text-[#0c0a09]/70">{selectedBoleto.ourNumber || selectedBoleto.id}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 2xl:gap-8">
                                    {/* Receiver Card (User) */}
                                    <div className="space-y-4 2xl:space-y-5 p-4 2xl:p-6 rounded-sm bg-neutral-50/80 border border-neutral-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 className="h-3 w-3 2xl:h-4 2xl:w-4 text-neutral-400" />
                                            <p className="text-[10px] 2xl:text-xs text-neutral-400 font-black uppercase tracking-widest">Beneficiário</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-black text-[#0c0a09] truncate text-sm 2xl:text-base uppercase">{user?.name || user?.nome || "SUA EMPRESA"}</p>
                                            <p className="text-[11px] 2xl:text-xs text-neutral-500 font-mono font-bold opacity-70">
                                                {user?.taxNumber || "---"}
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-neutral-200/50 space-y-1.5 2xl:space-y-3">
                                            <div className="flex justify-between items-center text-[11px] 2xl:text-xs">
                                                <span className="text-neutral-400 font-bold">Instituição</span>
                                                <span className="font-black text-[#0c0a09] uppercase truncate ml-2 text-right">G8 BANK (382)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payer Card */}
                                    <div className="space-y-4 2xl:space-y-5 p-4 2xl:p-6 rounded-sm bg-neutral-50/80 border border-neutral-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 className="h-3 w-3 2xl:h-4 2xl:w-4 text-neutral-400" />
                                            <p className="text-[10px] 2xl:text-xs text-neutral-400 font-black uppercase tracking-widest">Pagador</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-black text-[#0c0a09] truncate text-sm 2xl:text-base uppercase">{selectedBoleto.payer?.name || "PAGADOR"}</p>
                                            <p className="text-[11px] 2xl:text-xs text-neutral-500 font-mono font-bold opacity-70">
                                                {selectedBoleto.payer?.document || "---"}
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-neutral-200/50 space-y-1.5 2xl:space-y-3">
                                            <div className="flex justify-between items-center text-[11px] 2xl:text-xs">
                                                <span className="text-neutral-400 font-bold">Email</span>
                                                <span className="font-black text-[#0c0a09] truncate ml-2 text-right lowercase">{selectedBoleto.payer?.email || "não informado"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5 pt-2">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-[10px] 2xl:text-xs text-neutral-400 font-black uppercase tracking-widest mb-1">Status Atual</p>
                                            <Badge className={cn(
                                                "border-0 px-3 py-0.5 font-black text-xs 2xl:text-sm uppercase tracking-widest rounded-sm",
                                                resolveBoletoStatus(selectedBoleto) === 'PAGO' ? 'bg-emerald-500 text-white' :
                                                    resolveBoletoStatus(selectedBoleto) === 'VENCIDO' ? 'bg-red-500 text-white' :
                                                        'bg-blue-600 text-white'
                                            )}>
                                                {resolveBoletoStatus(selectedBoleto) === 'PENDENTE' ? 'A RECEBER' : resolveBoletoStatus(selectedBoleto)}
                                            </Badge>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] 2xl:text-xs text-neutral-400 font-black uppercase tracking-widest mb-1">Data Vencimento</p>
                                            <p className="text-sm 2xl:text-base font-black text-[#0c0a09]">
                                                {selectedBoleto.expirationDate ? selectedBoleto.expirationDate.split('-').reverse().join('/') : "--/--/----"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button
                                        onClick={() => selectedBoleto && handlePrint(selectedBoleto)}
                                        className="flex-1 h-12 2xl:h-16 bg-[#0c0a09] text-white hover:bg-black rounded-sm font-black uppercase tracking-widest text-[11px] 2xl:text-sm transition-all shadow-xl shadow-black/10 flex flex-col items-center justify-center py-2 group active:scale-95"
                                    >
                                        <Printer className={`h-5 w-5 2xl:h-6 2xl:w-6 mb-1 group-hover:scale-110 transition-transform ${
                                            currentBrand.id !== "g8" ? "text-white" : "text-[var(--brand-accent)]"
                                        }`} />
                                        Salvar PDF ou Imprimir
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedBoleto(null)}
                                        className="h-12 2xl:h-16 border-neutral-100 rounded-sm font-black uppercase tracking-widest text-[11px] 2xl:text-sm px-8 active:scale-95 text-neutral-400 hover:text-black"
                                    >
                                        Fechar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
