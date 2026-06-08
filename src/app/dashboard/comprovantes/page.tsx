"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    FileText,
    ArrowRightLeft,
    CreditCard,
    Smartphone,
    ChevronRight,
    PieChart as PieIcon,
    ArrowLeft,
    Clock,
    Search,
    Landmark,
    Droplets,
    Car,
    Phone,
    Banknote,
    BadgeCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["var(--brand-accent)", "#3b82f6", "#10b981", "#ef4444", "#a855f7"];

export default function ComprovantesPage() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    useEffect(() => {
        const fetchExtrato = async () => {
            try {
                const response = await api.get("/api/banco/extrato/buscar");
                if (response.data) {
                    const rawItems = response.data.data || response.data.transacoes || [];
                    setItems(Array.isArray(rawItems) ? rawItems : []);
                }
            } catch (err) {
                console.error("Error fetching extrato for chart:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchExtrato();
    }, []);

    const chartData = useMemo(() => {
        const distribution: { [key: string]: number } = {
            "PIX": 0,
            "BOLETO": 0,
            "TED/DOC": 0,
            "INTERNA": 0,
            "TARIFA": 0
        };

        items.forEach(item => {
            const m = item.metodoFormatado?.toUpperCase() || "";
            const val = Math.abs(item.valor || 0);

            if (m.includes("PIX")) distribution["PIX"] += val;
            else if (m.includes("BOLETO") || m.includes("PAGAMENTO")) distribution["BOLETO"] += val;
            else if (m.includes("TED") || m.includes("TRANSFERENCIA")) {
                if (item.metodo === "TRANSFERENCIA_INTERNA") distribution["INTERNA"] += val;
                else distribution["TED/DOC"] += val;
            }
            else if (m.includes("TARIFA")) distribution["TARIFA"] += val;
        });

        return Object.entries(distribution)
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({ name, value }));
    }, [items]);

    const categories: {
        id: string;
        title: string;
        icon: any;
        color: string;
        badge?: string;
        submenus: { id: string; label: string; href?: string; badge?: string; disabled?: boolean }[];
    }[] = [
            {
                id: "transferencias",
                title: "Transferências",
                icon: ArrowRightLeft,
                color: "bg-orange-500",
                submenus: [
                    { id: "interna", label: "Contas G8", href: "/dashboard/comprovantes/interna" },
                    { id: "ted", label: "Outros bancos", badge: "Em breve", disabled: true }
                ]
            },
            {
                id: "pagamentos",
                title: "Pagamentos",
                icon: CreditCard,
                color: "bg-blue-500",
                submenus: [
                    { id: "boleto", label: "Boleto de cobrança", href: "/dashboard/comprovantes/boleto" },
                    { id: "consumo", label: "Água, Luz, Telefone e Gás", badge: "Em breve", disabled: true },
                    { id: "veiculos", label: "Débito de Veículos", badge: "Em breve", disabled: true }
                ]
            },
            {
                id: "recargas",
                title: "Recargas",
                icon: Smartphone,
                color: "bg-emerald-500",
                badge: "Em breve",
                submenus: [
                    { id: "celular", label: "Recarga de Celular", badge: "Em breve", disabled: true }
                ]
            },
            {
                id: "pix",
                title: "Pix",
                icon: Smartphone,
                color: "bg-purple-500",
                submenus: [
                    { id: "pix_all", label: "Extrato Pix completo", href: "/dashboard/pix/extrato?title=Comprovantes PIX" }
                ]
            }
        ];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 xl:p-12 overflow-y-auto no-scrollbar">
            <div className="max-w-[1440px] mx-auto space-y-12 pb-20">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <Badge className="bg-orange-600/10 text-orange-600 border-0 text-[10px] font-black tracking-[0.3em] uppercase px-3 py-1 mb-2">Central de Documentos</Badge>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-[#0c0a09]">
                            Área de <span className="text-orange-600">COMPROVANTES</span>
                        </h1>
                        <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest mt-2">Consulte, baixe e compartilhe suas confirmações de pagamento.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Total Movimentado</span>
                            <span className="text-2xl font-black text-[#0c0a09] font-mono leading-none">
                                {formatCurrency(items.reduce((acc, i) => acc + Math.abs(i.valor || 0), 0))}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: Category Cards */}
                    <div className="lg:col-span-12 flex flex-wrap justify-center gap-8 w-full">
                        {categories.map((cat) => (
                            <React.Fragment key={cat.id}>
                                <button
                                    key={cat.id}
                                    onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                                    className={`group w-full max-w-md p-8 rounded-md text-center transition-all relative overflow-hidden flex flex-col items-center justify-between h-[220px] bg-white border-2 border-neutral-100/50 hover:border-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/5 active:scale-[0.98] ${expandedCategory === cat.id ? 'ring-2 ring-orange-500 border-transparent shadow-xl' : ''}`}
                                >
                                    <div className={`absolute top-0 right-0 w-32 h-32 ${cat.color} opacity-[0.03] rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000`} />

                                    {cat.badge && (
                                        <div className="absolute top-6 right-6 z-20">
                                            <Badge className="bg-amber-100 text-amber-600 border-amber-200 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-sm">{cat.badge}</Badge>
                                        </div>
                                    )}

                                    <div className={`w-14 h-14 rounded-md flex items-center justify-center mb-4 transition-transform group-hover:rotate-6 bg-neutral-50 text-[#0c0a09]/30 group-hover:bg-orange-500 group-hover:text-white`}>
                                        <cat.icon size={28} strokeWidth={2.5} />
                                    </div>

                                    <div className="space-y-1 relative z-10">
                                        <h3 className="text-xl font-black tracking-tighter text-[#0c0a09] uppercase leading-tight">{cat.title}</h3>
                                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                                            {cat.submenus.length > 1 ? ` ${cat.submenus.length} canais disponíveis` : `${cat.submenus.length} Canal disponível`}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-center gap-2 mt-4 font-black uppercase text-[9px] tracking-[0.2em] text-neutral-300 group-hover:text-orange-500 transition-colors w-full">
                                        Explorar <ChevronRight size={14} className={`transition-transform ${expandedCategory === cat.id ? 'rotate-90' : ''}`} />
                                    </div>
                                </button>

                                {/* Mobile Accordion View */}
                                <div className="xl:hidden col-span-full">
                                    <AnimatePresence>
                                        {expandedCategory === cat.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden mb-4"
                                            >
                                                <div className="p-4 bg-white border-2 border-orange-100 rounded-md shadow-inner grid grid-cols-1 gap-3">
                                                    {cat.submenus.map(sub => (
                                                        <button
                                                            key={sub.id}
                                                            disabled={sub.disabled}
                                                            onClick={() => sub.href && router.push(sub.href)}
                                                            className={`p-4 flex items-center justify-between rounded-sm border border-neutral-50 hover:bg-neutral-50 transition-all group ${sub.disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-orange-200 shadow-sm'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-sm bg-neutral-50 flex items-center justify-center text-neutral-300 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                                    <FileText size={18} />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-xs font-black text-[#0c0a09] uppercase tracking-widest">{sub.label}</p>
                                                                </div>
                                                            </div>
                                                            {!sub.disabled && <ChevronRight size={16} className="text-neutral-200 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Desktop Submenu View */}
                    <div className="hidden xl:block xl:col-span-12">
                        <AnimatePresence>
                            {expandedCategory && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -20, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-8 bg-white border-2 border-neutral-100 rounded-md shadow-inner grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {categories.find(c => c.id === expandedCategory)?.submenus.map(sub => (
                                            <button
                                                key={sub.id}
                                                disabled={sub.disabled}
                                                onClick={() => sub.href && router.push(sub.href)}
                                                className={`p-5 flex items-center justify-between rounded-sm border border-neutral-50 hover:bg-neutral-50 transition-all group ${sub.disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-orange-200 shadow-sm'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-sm bg-neutral-50 flex items-center justify-center text-neutral-300 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs font-black text-[#0c0a09] uppercase tracking-widest">{sub.label}</p>
                                                        {sub.badge && <span className="text-[10px] font-black text-neutral-600 bg-amber-200/20 uppercase tracking-tighter">{sub.badge}</span>}
                                                    </div>
                                                </div>
                                                {!sub.disabled && <ChevronRight size={16} className="text-neutral-200 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Distribution Chart */}
                    <div className="lg:col-span-7 flex">
                        <Card className="bg-white border-2 border-neutral-100 rounded-md p-8  space-y-8 shadow-sm flex-1 flex flex-col">
                            <div className="flex items-center justify-between shrink-0">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-neutral-300 font-black uppercase tracking-[0.4em]">Visão Geral</p>
                                    <h4 className="text-2xl font-black text-[#0c0a09] tracking-tighter uppercase">DISTRIBUIÇÃO DE <span className="text-orange-600">MÉTODO</span></h4>
                                </div>
                                <div className="w-12 h-12 bg-orange-50 rounded-md flex items-center justify-center text-orange-600">
                                    <PieIcon size={24} />
                                </div>
                            </div>

                            <div className="flex-1 min-h-[400px] w-full flex flex-col justify-center">
                                {isLoading ? (
                                    <div className="h-full w-full flex items-center justify-center bg-neutral-50 rounded-md animate-pulse">
                                        <div className="h-20 w-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={110}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {chartData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'black', fontSize: '12px' }}
                                                formatter={(value: any) => formatCurrency(value)}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '40px', fontSize: '10px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center text-neutral-300 space-y-4">
                                        <PieIcon size={48} className="opacity-10" />
                                        <p className="text-xs font-black uppercase tracking-widest">Sem dados para o período</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Quick Stats / Info */}
                    <div className="lg:col-span-5 space-y-6 flex flex-col">
                        <Card className="bg-[#0c0a09] border-0 rounded-md p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <BadgeCheck className="text-orange-500" size={20} />
                                    <h5 className="font-black uppercase tracking-widest text-xs">Sistema de Autenticação G8</h5>
                                </div>
                                <p className="text-3xl font-black tracking-tighter leading-tight italic">Documentos com <span className="text-orange-500">VALOR JURÍDICO</span> e integridade garantida.</p>
                                <div className="pt-4 flex flex-col gap-4 border-t border-white/5">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                                        <span>Exportação ativa</span>
                                        <span className="text-orange-500">PDF • CSV • XLS</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                                        <span>Segurança</span>
                                        <span className="text-orange-500">Criptografia Ponta-a-Ponta</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border-2 border-neutral-100 rounded-md p-6 space-y-2">
                                <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Tempo de Guarda</p>
                                <p className="text-xl font-black text-[#0c0a09] tracking-tighter uppercase leading-none">Ilimitado</p>
                            </div>
                            <div className="bg-white border-2 border-neutral-100 rounded-md p-6 space-y-2 text-right">
                                <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Disponibilidade</p>
                                <p className="text-sm font-black text-emerald-500 tracking-tighter uppercase leading-none italic">Online 09h as 17h</p>
                            </div>
                        </div>

                        <Card className="bg-orange-500 border-0 rounded-md p-8 text-white flex items-center justify-between group cursor-pointer hover:bg-orange-600 transition-all active:scale-95 shadow-xl shadow-orange-500/20">
                            <div className="space-y-1">
                                <h4 className="text-xl font-black uppercase tracking-tighter leading-none">Precisa de Ajuda?</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Suporte G8: 09h as 17h</p>
                            </div>
                            <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}

