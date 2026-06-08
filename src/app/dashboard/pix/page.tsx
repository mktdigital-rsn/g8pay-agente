"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    QrCode,
    Smartphone,
    Mail,
    UserSquare2,
    Copy,
    ArrowDownToLine,
    Contact2,
    Key,
    FileText,
    Gauge,
    Bell,
    AlertCircle,
    HelpCircle,
    MessageCircle,
    Diamond,
    ArrowRight,
    X,
    Fingerprint
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { currentBrand } from "@/config/brand";

const PixIcon = (props: any) => (
    <svg {...props} viewBox="0 0 100 100" fill="currentColor">
        <rect x="35" y="5" width="30" height="30" rx="6" transform="rotate(45 50 20)" />
        <rect x="35" y="65" width="30" height="30" rx="6" transform="rotate(45 50 80)" />
        <rect x="5" y="35" width="30" height="30" rx="6" transform="rotate(45 20 50)" />
        <rect x="65" y="35" width="30" height="30" rx="6" transform="rotate(45 80 50)" />
    </svg>
);

export default function PixPage() {
    const router = useRouter();
    const [pixKey, setPixKey] = React.useState("");
    const [keyType, setKeyType] = React.useState<string | null>(null);

    const validateCPF = (cpf: string) => {
        const cleanCPF = cpf.replace(/\D/g, "");
        if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;
        let sum = 0;
        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
        let rest = (sum * 10) % 11;
        if ((rest === 10) || (rest === 11)) rest = 0;
        if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;
        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
        rest = (sum * 10) % 11;
        if ((rest === 10) || (rest === 11)) rest = 0;
        if (rest !== parseInt(cleanCPF.substring(10, 11))) return false;
        return true;
    };

    const handleKeyChange = (val: string) => {
        setPixKey(val);
        if (!val) {
            setKeyType(null);
            return;
        }

        // Smart Detection logic (Matches backend/mobile logic)
        const clean = val.replace(/\D/g, "");
        if (val.includes("@")) {
            setKeyType("EMAIL");
        } else if (clean.length === 11 && validateCPF(clean)) {
            setKeyType("CPF");
        } else if (clean.length === 10 || clean.length === 11) {
            setKeyType("PHONE");
        } else if (clean.length === 14) {
            setKeyType("CNPJ");
        } else if (val.length > 20) {
            setKeyType("CHAVE_ALEATORIA");
        } else {
            setKeyType(null);
        }
    };


    const handleContinue = () => {
        const type = keyType || "generic";
        router.push(`/dashboard/pix/pagar?type=${type.toLowerCase()}&key=${encodeURIComponent(pixKey)}`);
    };

    const pagarActions = [
        { icon: QrCode, label: "QRCODE", href: "/dashboard/pix/pagar?type=qrcode" },
        { icon: Copy, label: "Pix Copia e Cola", href: "/dashboard/pix/pagar?type=copia_cola" },
    ];

    const outrosActions = [
        { icon: Contact2, label: "Contatos", href: "/dashboard/pix/contatos" },
        { icon: Key, label: "Minhas Chaves", href: "/dashboard/pix/chaves" },
        { icon: FileText, label: "Extrato", href: "/dashboard/pix/extrato" },
        { icon: Gauge, label: "Limites", href: "/dashboard/pix/limites" },
    ];

    return (
        <div className="p-4 md:p-8 xl:p-12 flex flex-col xl:flex-row gap-8 xl:gap-12 h-full overflow-y-auto w-full no-scrollbar bg-[#f8f9fa] relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--brand-accent)]/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

            {/* Main Content Area */}
            <div className="flex-1 space-y-12 relative z-10">
                {/* Header Section */}
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none">
                        Área <span className="text-[var(--brand-accent)]">PIX</span>
                    </h1>
                </div>


                {/* Main Action Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Input & Main Options */}
                    <div className="lg:col-span-9 space-y-10">
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-[#0c0a09] tracking-tight uppercase tracking-[0.1em]">Como você quer transferir?</h2>

                            <Card className="p-8 rounded-sm border border-orange-100 shadow-xl shadow-orange-100/20 bg-orange-50 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.05),transparent)]" />
                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-center gap-4 text-orange-600">
                                        <div className="w-10 h-10 bg-orange-600/10 rounded-sm flex items-center justify-center">
                                            <Key className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black uppercase tracking-widest text-[10px]">Chave Imediata</span>
                                            <span className="text-[9px] font-bold text-orange-600/60 uppercase tracking-widest">Pague Agora via PIX</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1 group">
                                            <Input
                                                placeholder="CPF/CNPJ, E-mail, Celular ou Chave..."
                                                value={pixKey}
                                                onChange={(e) => handleKeyChange(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleContinue(); }}
                                                className={
                                                    currentBrand.id !== "g8"
                                                        ? "h-14 bg-white border-2 border-[var(--brand-accent-light)] focus:border-[var(--brand-accent)] rounded-sm pl-6 pr-12 font-semibold text-sm focus:ring-2 focus:ring-[var(--brand-accent-light)] transition-all text-neutral-800 placeholder:text-neutral-400 shadow-sm"
                                                        : "h-14 bg-white border border-orange-100 rounded-sm pl-6 pr-12 font-black text-sm focus:ring-4 focus:ring-orange-100 transition-all text-[#0c0a09] placeholder:text-neutral-400 shadow-sm"
                                                }
                                            />
                                            {pixKey && (
                                                <button
                                                    onClick={() => { setPixKey(""); }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-300 hover:text-orange-600 transition-colors"
                                                >
                                                    <X size={20} />
                                                </button>
                                            )}
                                        </div>
                                        <Button
                                            disabled={!keyType}
                                            onClick={handleContinue}
                                            className="h-14 px-8 bg-[#0c0a09] hover:bg-[#1a1715] text-white rounded-sm font-black uppercase tracking-widest text-[10px] shadow-xl shadow-black/20 transition-all active:scale-95 disabled:opacity-30 flex items-center gap-3 shrink-0"
                                        >
                                            Buscar <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link href="/dashboard/pix/contatos" className="flex items-center gap-4 p-6 bg-white border border-orange-100 rounded-sm hover:bg-orange-50 hover:shadow-xl hover:shadow-orange-100/20 transition-all group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.03),transparent)]" />
                                    <div className="w-12 h-12 bg-orange-50 rounded-sm flex items-center justify-center text-orange-600 group-hover:scale-110 group-hover:bg-orange-100 transition-all relative z-10">
                                        <Contact2 className="h-6 w-6" />
                                    </div>
                                    <div className="text-left relative z-10">
                                        <span className="block font-black text-orange-700 text-sm uppercase tracking-tight leading-none mb-1">Escolher contato</span>
                                        <span className="text-[9px] text-orange-600/60 font-black uppercase tracking-widest">Seus favoritos</span>
                                    </div>
                                </Link>
                                <button disabled className="flex items-center gap-4 p-6 bg-neutral-50 rounded-xl border border-neutral-100 transition-all opacity-40 cursor-not-allowed group relative grayscale">
                                    <div className="w-12 h-12 bg-neutral-200 rounded-xl flex items-center justify-center text-neutral-400">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-black text-neutral-400 text-sm uppercase tracking-tight leading-none mb-1">Agência e conta</span>
                                        <span className="text-[9px] text-neutral-400 font-black uppercase tracking-widest opacity-60">Em desenvolvimento</span>
                                    </div>
                                    <Badge className="absolute right-6 top-1/2 -translate-y-1/2 bg-neutral-300 text-neutral-600 border-0 text-[8px] font-black rounded-full px-2 py-1 uppercase tracking-[0.2em]">Breve</Badge>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {/* Top Interactive Row: Mais Opções & Suporte */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                {/* Mais Opções Section */}
                                <div className="md:col-span-7 space-y-6">
                                    <h2 className="text-xl font-black text-[#0c0a09] tracking-tight uppercase tracking-[0.1em]">Mais opções</h2>
                                    <div className="grid grid-cols-3 gap-4">
                                        {pagarActions.map((action) => (
                                            <PixAction key={action.label} icon={action.icon} label={action.label} href={action.href} />
                                        ))}
                                        <PixAction icon={QrCode} label="Cobrar" href="/dashboard/pix/receber" />
                                    </div>
                                </div>

                                {/* Suporte Section */}
                                <div className="md:col-span-5 space-y-6">
                                    <h2 className="text-xl font-black text-[#0c0a09] tracking-tight uppercase tracking-[0.1em]">Suporte G8</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <PixAction icon={HelpCircle} label="Suporte" href="https://wa.me/5551996297077" />
                                        <PixAction icon={MessageCircle} label="Chat 09h as 17h" href="https://wa.me/5551996297077" customColor="bg-[#0c0a09]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Others Section */}
                        <div className="space-y-8">
                            <h2 className="text-xl font-black text-[#0c0a09] tracking-tight uppercase tracking-[0.1em]">Gestão & Segurança</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-6">
                                {outrosActions.map((action) => (
                                    <PixAction key={action.label} icon={action.icon} label={action.label} href={action.href} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Promo */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Banner Card Premium */}
                        <Card className="rounded-md border border-orange-100 shadow-xl shadow-orange-100/10 bg-orange-50 overflow-hidden relative group cursor-pointer h-[380px]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000 -mr-20 -mt-20" />
                            <div className="p-8 space-y-4 relative z-10 text-[#0c0a09]">
                                <Badge className="bg-orange-600/10 text-orange-600 border-0 text-[8px] font-black tracking-[0.3em] backdrop-blur-md mb-1">G8 PREMIUM</Badge>
                                <h3 className="text-xl font-black leading-tight max-w-[180px] text-orange-700">
                                    Experiência que te move.
                                </h3>
                                <p className="text-xs font-bold text-orange-600/60 leading-relaxed max-w-[160px]">
                                    Benefícios exclusivos para o seu dia a dia.
                                </p>
                                <Button className="bg-orange-600 text-white hover:bg-orange-700 px-6 h-9 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl shadow-orange-600/20 mt-2 active:scale-95 transition-all">
                                    Explorar Agora
                                </Button>
                            </div>

                            <div className="absolute bottom-0 right-0 w-full h-[220px] flex items-end justify-end translate-y-8 group-hover:translate-y-2 transition-transform duration-700">
                                <Image
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky&backgroundColor=ffedd5&radius=50"
                                    alt="Benefit"
                                    width={200}
                                    height={200}
                                    className="object-contain relative z-10 scale-110 drop-shadow-2xl"
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}


function PixAction({
    icon: Icon,
    label,
    href,
    customColor
}: {
    icon: any,
    label: string,
    href: string,
    customColor?: string
}) {
    const content = (
        <div className={`flex flex-col items-center justify-center w-full min-h-[160px] ${customColor || 'bg-white border border-orange-100'} rounded-sm hover:bg-orange-50 hover:shadow-xl hover:shadow-orange-100/20 hover:scale-[1.03] transition-all group cursor-pointer p-6 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.03),transparent)]" />
            <div className={`w-12 h-12 flex items-center justify-center mb-4 ${customColor ? 'text-white bg-white/20' : 'text-orange-600 bg-orange-50'} rounded-sm group-hover:scale-110 group-hover:bg-orange-100 transition-all relative z-10`}>
                <Icon className="h-6 w-6 stroke-[2.5]" />
            </div>
            <span className={`text-[11px] font-black ${customColor ? 'text-white' : 'text-orange-700'} text-center px-1 uppercase tracking-widest leading-tight relative z-10`}>{label}</span>
        </div>
    );

    if (href === "#") return content;

    return (
        <Link href={href}>
            {content}
        </Link>
    );
}
