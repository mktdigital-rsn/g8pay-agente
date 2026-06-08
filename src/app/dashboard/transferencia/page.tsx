"use client";

import React, { useState, useEffect } from "react";
import {
    ArrowRight,
    ChevronRight,
    Landmark,
    Star,
    Globe,
    ArrowRightLeft,
    FileText,
    PlusCircle,
    Settings,
    HelpCircle,
    MessageCircle,
    X,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Search,
    Fingerprint,
    Wallet,
    Building2,
    User,
    History,
    Smartphone,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAtomValue } from "jotai";
import { temporaryDeviceIdAtom } from "@/store/auth";
import { useRouter } from "next/navigation";
import { currentBrand } from "@/config/brand";

type Step = 'menu' | 'select_target' | 'form' | 'pin' | 'confirming' | 'success' | 'error';
type SearchMode = 'cpf' | 'account';

interface ReceiverInfo {
    name: string;
    taxNumber: string;
    agencia: string;
    conta: string;
    digito: string;
    bankName?: string;
    bankCode?: string;
    accountType?: "corrente" | "poupanca";
}

const COMMON_BANKS = [
    { code: "001", name: "Banco do Brasil" },
    { code: "033", name: "Santander" },
    { code: "104", name: "Caixa Econômica Federal" },
    { code: "237", name: "Bradesco" },
    { code: "341", name: "Itaú" },
    { code: "077", name: "Inter" },
    { code: "260", name: "Nubank" },
    { code: "422", name: "Banco Safra" },
    { code: "748", name: "Sicredi" },
    { code: "756", name: "Sicoob" },
];

export default function TransferenciaPage() {
    const router = useRouter();
    const temporaryDeviceId = useAtomValue(temporaryDeviceIdAtom);
    const [step, setStep] = useState<Step>('menu');
    const [searchMode, setSearchMode] = useState<SearchMode>('cpf');
    const [isLoading, setIsLoading] = useState(false);
    const [balance, setBalance] = useState("R$ 0,00");

    // Form States
    const [targetCpf, setTargetCpf] = useState("");
    const [targetAgencia, setTargetAgencia] = useState("");
    const [targetConta, setTargetConta] = useState("");
    const [targetDigito, setTargetDigito] = useState("");
    const [amount, setAmount] = useState("");
    const [pin, setPin] = useState("");
    const [pinId, setPinId] = useState("");

    // Result States
    const [receiver, setReceiver] = useState<ReceiverInfo | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [transferType, setTransferType] = useState<"G8" | "TED">("G8");
    const [saveAsFavorite, setSaveAsFavorite] = useState(false);

    // TED Specific States
    const [targetBankCode, setTargetBankCode] = useState("");
    const [targetAccountType, setTargetAccountType] = useState<"corrente" | "poupanca">("corrente");
    const [targetReceiverName, setTargetReceiverName] = useState("");
    const [targetDocument, setTargetDocument] = useState("");
    const [favorites, setFavorites] = useState<any[]>([]);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await api.get("/api/banco/saldo/getSaldo");
                if (res.data && typeof res.data.valor !== 'undefined') {
                    setBalance(new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                    }).format(res.data.valor));
                }
            } catch (err) {
                console.error("Error fetching balance:", err);
            }
        };
        const fetchFavorites = async () => {
            try {
                const res = await api.get("/api/banco/pix/contatos");
                if (res.data) {
                    setFavorites(res.data);
                }
            } catch (err) {
                console.error("Error fetching favorites:", err);
            }
        };
        fetchBalance();
        fetchFavorites();
    }, []);

    const formatCurrency = (val: string | number) => {
        const cleanValue = String(val).replace(/\D/g, "");
        if (!cleanValue) return "R$ 0,00";
        const numberValue = parseInt(cleanValue) / 100;
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(numberValue);
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        setAmount(rawValue);
    };



    const handleLookup = async () => {
        setIsLoading(true);
        setErrorMessage("");
        try {
            let res;
            if (transferType === 'G8') {
                if (searchMode === 'cpf') {
                    const tax = targetCpf.replace(/\D/g, "");
                    res = await api.post('/api/banco/pagamentos/consultar-conta-cpf', { taxNumber: tax });
                    const data = res.data?.data || res.data;
                    if (!data || (!data.name && !data.nome)) {
                        throw new Error("Conta não encontrada.");
                    }
                    setReceiver({
                        name: data.name || data.nome,
                        taxNumber: data.taxNumber || data.documento || tax,
                        agencia: data.agencia || "0001",
                        conta: data.conta || "",
                        digito: data.digito || ""
                    });
                } else {
                    res = await api.post('/api/banco/pagamentos/cadastrar-chave', {
                        agencia: targetAgencia,
                        conta: targetConta,
                        digito: targetDigito
                    });
                    const data = res.data?.data || res.data;
                    if (!data || (!data.name && !data.nome)) {
                        throw new Error("Dados da conta inválidos.");
                    }
                    setReceiver({
                        name: data.name || data.nome,
                        taxNumber: data.taxNumber || data.documento || "",
                        agencia: targetAgencia,
                        conta: targetConta,
                        digito: targetDigito
                    });
                }
                setStep('form');
            } else {
                // TED Mode: Local validation only since we don't have a lookup for external banks yet
                if (!targetBankCode || !targetAgencia || !targetConta || !targetReceiverName || !targetDocument) {
                    throw new Error("Preencha todos os campos obrigatórios.");
                }
                
                const selectedBank = COMMON_BANKS.find(b => b.code === targetBankCode);

                setReceiver({
                    name: targetReceiverName,
                    taxNumber: targetDocument.replace(/\D/g, ""),
                    agencia: targetAgencia,
                    conta: targetConta,
                    digito: targetDigito,
                    bankCode: targetBankCode,
                    bankName: selectedBank?.name || "Banco " + targetBankCode,
                    accountType: targetAccountType
                });
                setStep('form');
            }
        } catch (err: any) {
            console.error("Lookup error:", err);
            setErrorMessage(err.response?.data?.message || err.message || "Erro ao consultar beneficiário.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestPin = async () => {
        if (!temporaryDeviceId) {
            setErrorMessage("Aguarde concluir o login com QR antes de realizar pagamentos.");
            return;
        }

        setIsLoading(true);
        try {
            const amountNum = parseInt(amount) / 100;
            const amountStr = amountNum.toFixed(2);

            const res = await api.post('/api/users/solicitar-pin', {
                amount: amountStr,
                deviceId: temporaryDeviceId
            });
            if (res.data) {
                const data = res.data.data || res.data;
                setPinId(data.pinId || data.id || "");
                setStep('pin');
            }
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || "Erro ao solicitar PIN.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalize = async () => {
        setIsLoading(true);
        setStep('confirming');

        const finalizeSuccess = (finalId: string) => {
            setTransactionId(finalId);
            setStep('success');
            setIsLoading(false);
            toast.success("Transferência realizada com sucesso!");
        };

        const searchWithRetry = async (attempts = 0) => {
            const maxAttempts = 8; // Dá uns 20-30 segundos de busca
            try {
                console.log(`🔍 [TRANSFERENCIA SYNC] Tentativa ${attempts + 1}/${maxAttempts}...`);
                const extratoRes = await api.get("/api/banco/extrato/buscar");
                const items = extratoRes.data.transacoes || extratoRes.data.data?.transacoes || [];
                
                const targetVal = Math.abs(parseInt(amount) / 100);

                const match = items.find((item: any) => {
                    const itemVal = Math.abs(parseFloat(String(item.valor).replace(/[R$\s]/g, "").replace(",", ".")));
                    return Math.abs(itemVal - targetVal) < 0.01;
                });

                if (match && (match.idDoBancoLiquidante || match.id || match.id_transaction)) {
                    const finalId = match.idDoBancoLiquidante || match.id || match.id_transaction;
                    finalizeSuccess(finalId);
                } else if (attempts < maxAttempts) {
                    setTimeout(() => searchWithRetry(attempts + 1), 3000);
                } else {
                    setErrorMessage("Não conseguimos confirmar a transação. Verifique seu extrato em instantes.");
                    setStep('error');
                    setIsLoading(false);
                }
            } catch (e) {
                if (attempts < maxAttempts) {
                    setTimeout(() => searchWithRetry(attempts + 1), 3000);
                } else {
                    setErrorMessage("Erro de conexão ao validar transferência. Verifique seu extrato.");
                    setStep('error');
                    setIsLoading(false);
                }
            }
        };

        try {
            // 1. Explicitly validate PIN before transfer
            await api.post("/api/users/validar-pin", {
                pin: pin,
                pinId: pinId,
                deviceId: temporaryDeviceId
            });

            if (transferType === 'G8') {
                const payload = {
                    taxNumber: receiver?.taxNumber,
                    recebedorAgencia: receiver?.agencia,
                    recebedorConta: receiver?.conta,
                    recebedorDigito: receiver?.digito,
                    valor: parseInt(amount) / 100,
                    pin: pin,
                    deviceId: temporaryDeviceId
                };

                const res = await api.post('/api/banco/pagamentos/transferencia-interna', payload);
                const raw = res.data?.data || res.data;
                const directId = raw?.id || raw?.transactionId || raw?.id_transaction || raw?.idDoBancoLiquidante;
                
                if (directId) {
                    finalizeSuccess(directId);
                } else {
                    // Only polling if the request was 200 OK but the ID didn't come back (async backend)
                    searchWithRetry();
                }
            } else {
                // TED Flow
                const tedPayload = {
                    amount: parseInt(amount) / 100,
                    saveAsFavorite: saveAsFavorite,
                    deviceId: temporaryDeviceId,
                    receiver: {
                        type: receiver?.accountType || "corrente",
                        document: receiver?.taxNumber,
                        bank_code: receiver?.bankCode,
                        agency: receiver?.agencia,
                        account_number: receiver?.conta,
                        account_digit: receiver?.digito,
                        name: receiver?.name
                    }
                };

                const res = await api.post('/api/banco/pagamentos/ted', tedPayload);
                const raw = res.data?.data || res.data;
                
                // The API spec says success is in raw.success and ID in raw.idTransaction
                if (raw?.success || raw?.idTransaction) {
                    finalizeSuccess(raw?.idTransaction || "TED_PENDING");
                } else {
                    setErrorMessage(raw?.message || "Erro inesperado ao processar TED.");
                    setStep('error');
                    setIsLoading(false);
                }
            }
        } catch (err: any) {
            console.error("❌ [TRANSFERÊNCIA ERROR]:", err.response?.status, err.response?.data || err.message);
            
            setErrorMessage(err.response?.data?.message || "Transação recusada. Verifique os dados ou seu saldo.");
            setStep('error');
            setIsLoading(false);
        }
    };

    const resetFlow = () => {
        setStep('menu');
        setReceiver(null);
        setAmount("");
        setPin("");
        setErrorMessage("");
        setTargetCpf("");
        setTargetAgencia("");
        setTargetConta("");
        setTargetDigito("");
        setTargetBankCode("");
        setTargetReceiverName("");
        setTargetDocument("");
        setSaveAsFavorite(false);
    };

    const handlePrintReceipt = async () => {
        if (!transactionId) {
            toast.error("ID da transação não localizado.");
            return;
        }

        try {
            const response = await api.get(`/api/banco/extrato/imprimir-item/${transactionId}`, {
                responseType: 'blob'
            });

            if (response.data.size === 0) {
                toast.info("O comprovante está sendo processado. Tente novamente em 5 segundos.");
                return;
            }

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `comprovante_transferencia_${transactionId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("❌ [RECEIPT ERROR]:", err);
            toast.error("Erro ao gerar comprovante. Verifique o extrato.");
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-[#0c0a09] p-4 md:p-8 xl:p-12 overflow-y-auto relative">
            {/* Background Decor */}
            <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-[1440px] mx-auto space-y-12 relative z-10 px-4 md:px-0 pb-32">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div className="space-y-1">
                        <Badge className="bg-brand-accent/10 text-brand-accent border-0 text-[10px] font-black tracking-[0.3em] uppercase px-3 py-1 mb-2">{currentBrand.name} Transactional</Badge>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-[#0c0a09]">
                            Transferir <span className="text-brand-accent">RECURSOS</span>
                        </h1>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Area */}
                    <main className="lg:col-span-8 space-y-8">
                        <AnimatePresence mode="wait">
                            {step === 'menu' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                >
                                    <TransferOption
                                        icon={Landmark}
                                        title={`Entre Contas ${currentBrand.shortName}`}
                                        description={`Transferência instantânea e grátis para clientes ${currentBrand.bankName}`}
                                        onClick={() => setStep('select_target')}
                                        premium
                                    />
                                    <TransferOption
                                        icon={ArrowRightLeft}
                                        title="TED"
                                        description="Para outros bancos. Disponível em dias úteis até as 17h."
                                        badge="SÓ RECEBIMENTOS"
                                        onClick={() => {
                                            setTransferType('TED');
                                            setStep('select_target');
                                        }}
                                    />
                                    <div className="md:col-span-2">
                                        <h2 className="text-[12px] font-black text-[#0c0a09] uppercase tracking-[0.2em] mb-6">Serviços Adicionais</h2>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                            <SimpleAction icon={History} label="Extrato" onClick={() => router.push('/dashboard/extrato')} />
                                            <SimpleAction icon={Star} label="Favoritos" badge="Em breve" />
                                            <SimpleAction icon={Globe} label="Exterior" badge="Em breve" />
                                            <SimpleAction icon={Search} label="Comprovantes" onClick={() => router.push('/dashboard/comprovantes')} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'select_target' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-6"
                                >
                                    <Card className="bg-white border-0 p-10 rounded-md shadow-2xl shadow-black/5">
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-xl font-black uppercase tracking-widest text-brand-accent">
                                                {transferType === 'G8' ? `Transferência ${currentBrand.shortName}` : 'Transferência via TED'}
                                            </h2>
                                            <button onClick={resetFlow} className="text-[#0c0a09]/30 hover:text-[#0c0a09] transition-colors"><X size={20} /></button>
                                        </div>

                                        {transferType === 'G8' ? (
                                            <div className="flex gap-4 mb-8">
                                                <button
                                                    onClick={() => setSearchMode('cpf')}
                                                    className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest rounded-sm transition-all ${searchMode === 'cpf' ? 'bg-brand-accent text-white shadow-xl shadow-brand-accent/20 scale-105' : 'bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/5'}`}
                                                >
                                                    CPF / CNPJ
                                                </button>
                                                <button
                                                    disabled
                                                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest rounded-sm transition-all bg-brand-accent/10 text-brand-accent/40 cursor-not-allowed opacity-60"
                                                >
                                                    Agência e Conta (Em breve)
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-6 mb-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#0c0a09]/70">Banco Destino</label>
                                                        <select 
                                                            value={targetBankCode}
                                                            onChange={(e) => setTargetBankCode(e.target.value)}
                                                            className="w-full h-14 bg-brand-accent/10 border-neutral-100 rounded-sm font-bold text-brand-accent px-4 appearance-none focus:outline-none"
                                                        >
                                                            <option value="" className="text-neutral-400">Selecione o banco</option>
                                                            {COMMON_BANKS.map(b => (
                                                                <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#0c0a09]/70">Tipo de Conta</label>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => setTargetAccountType('corrente')}
                                                                className={`flex-1 h-14 font-black text-[9px] uppercase tracking-widest rounded-sm border-2 transition-all ${targetAccountType === 'corrente' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-neutral-400 border-neutral-100 hover:border-brand-accent/20'}`}
                                                            >
                                                                Corrente
                                                            </button>
                                                            <button 
                                                                onClick={() => setTargetAccountType('poupanca')}
                                                                className={`flex-1 h-14 font-black text-[9px] uppercase tracking-widest rounded-sm border-2 transition-all ${targetAccountType === 'poupanca' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-neutral-400 border-neutral-100 hover:border-brand-accent/20'}`}
                                                            >
                                                                Poupança
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#0c0a09]/70">Nome Completo do Favorecido</label>
                                                    <Input 
                                                        value={targetReceiverName} 
                                                        onChange={(e) => setTargetReceiverName(e.target.value)} 
                                                        placeholder="Ex: Pedro Henrique Marques" 
                                                        className="h-14 bg-brand-accent/10 border-neutral-100 rounded-sm font-bold text-brand-accent" 
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#0c0a09]/70">CPF ou CNPJ</label>
                                                    <Input 
                                                        value={targetDocument} 
                                                        onChange={(e) => setTargetDocument(e.target.value)} 
                                                        placeholder="000.000.000-00" 
                                                        className="h-14 bg-brand-accent/10 border-neutral-100 rounded-sm font-bold text-brand-accent" 
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {(transferType === 'G8' || transferType === 'TED') && (
                                            <div className="space-y-6">
                                                {transferType === 'G8' ? (
                                                    searchMode === 'cpf' ? (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#0c0a09]/70">Insira o Documento</label>
                                                            <Input
                                                                placeholder="000.000.000-00"
                                                                value={targetCpf}
                                                                onChange={(e) => setTargetCpf(e.target.value)}
                                                                className="h-16 bg-brand-accent/10 border-neutral-100 rounded-sm text-xl font-mono focus:border-brand-accent transition-all text-brand-accent font-bold"
                                                            />
                                                        </div>
                                                    ) : null
                                                ) : null}

                                                {(transferType === 'TED' || (transferType === 'G8' && searchMode === 'account')) && (
                                                    <div className="grid grid-cols-12 gap-4">
                                                        <div className="col-span-4 space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#0c0a09]/70">Agência</label>
                                                            <Input value={targetAgencia} onChange={(e) => setTargetAgencia(e.target.value)} placeholder="0001" className="h-14 bg-brand-accent/10 border-neutral-100 rounded-sm font-mono font-bold text-brand-accent" />
                                                        </div>
                                                        <div className="col-span-6 space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#0c0a09]/70">Conta</label>
                                                            <Input value={targetConta} onChange={(e) => setTargetConta(e.target.value)} placeholder="12345" className="h-14 bg-brand-accent/10 border-neutral-100 rounded-sm font-mono font-bold text-brand-accent" />
                                                        </div>
                                                        <div className="col-span-2 space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#0c0a09]/70">Díg.</label>
                                                            <Input value={targetDigito} onChange={(e) => setTargetDigito(e.target.value)} placeholder="0" className="h-14 bg-brand-accent/10 border-neutral-100 rounded-sm font-mono text-center font-bold text-brand-accent" />
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {transferType === 'TED' && (
                                                    <div className="flex items-center gap-3 p-4 bg-brand-accent/5 rounded-sm border border-brand-accent/10 group cursor-pointer" onClick={() => setSaveAsFavorite(!saveAsFavorite)}>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${saveAsFavorite ? 'bg-brand-accent border-brand-accent' : 'border-neutral-200'}`}>
                                                            {saveAsFavorite && <CheckCircle2 size={12} className="text-white" />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Salvar como contato favorito</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}


                                        {errorMessage && <p className="mt-4 text-xs font-bold text-rose-500 flex items-center gap-2"><AlertCircle size={14} /> {errorMessage}</p>}

                                        <Button
                                            onClick={handleLookup}
                                            disabled={isLoading}
                                            className="w-full h-16 mt-8 bg-brand-accent text-white hover:bg-brand-accent-hover rounded-sm font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-xl shadow-brand-accent/20"
                                        >
                                            {isLoading ? "Consultando..." : "Continuar"}
                                        </Button>
                                    </Card>
                                </motion.div>
                            )}

                            {step === 'form' && receiver && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-6"
                                >
                                    <Card className="bg-white border-neutral-100 p-8 rounded-md shadow-2xl shadow-black/5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4">
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-0 font-black text-[8px] uppercase tracking-widest">Confirmação de Dados</Badge>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="flex items-center gap-6 p-6 bg-brand-accent/10 rounded-md border border-brand-accent/20 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl -mr-12 -mt-12" />
                                                <div className="w-16 h-16 bg-brand-accent rounded-md flex items-center justify-center text-white shadow-lg shadow-brand-accent/20 group-hover:scale-105 transition-transform">
                                                    <User size={32} />
                                                </div>
                                                <div className="relative z-10 flex-1">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-accent mb-1">DADOS DO RECEBEDOR</p>
                                                    <p className="text-2xl font-black tracking-tighter text-[#0c0a09] leading-tight">{receiver.name}</p>
                                                    <p className="text-[12px] font-mono text-[#0c0a09]/50 uppercase mt-1 font-bold">
                                                        {transferType === 'G8' ? currentBrand.bankName : receiver.bankName} • AG {receiver.agencia} • CC {receiver.conta}-{receiver.digito}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[13px] font-black uppercase tracking-[0.15em] text-[#0c0a09] block ml-1">Quanto deseja transferir?</label>
                                                <div className="relative group">
                                                    <Input
                                                        value={formatCurrency(amount)}
                                                        onChange={handleValueChange}
                                                        placeholder="R$ 0,00"
                                                        className="h-24 bg-white border-2 border-neutral-100 rounded-sm px-8 text-4xl font-black font-mono focus:ring-4 focus:ring-brand-accent/10 focus:border-brand-accent transition-all text-[#0c0a09] placeholder:text-neutral-100"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-6 pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setStep('select_target')}
                                                    className="h-16 flex-1 border-2 border-neutral-100 bg-white text-[#0c0a09] font-black uppercase text-[12px] tracking-[0.2em] hover:bg-neutral-50 hover:border-neutral-200 transition-all rounded-sm shadow-sm"
                                                >
                                                    Voltar
                                                </Button>
                                                <Button
                                                    onClick={handleRequestPin}
                                                    disabled={!amount || parseInt(amount) <= 0 || isLoading}
                                                    className="h-16 flex-[2] bg-brand-accent text-white hover:bg-brand-accent-hover rounded-sm font-black uppercase text-sm tracking-[0.2em] transition-all shadow-xl shadow-brand-accent/20 active:scale-95"
                                                >
                                                    Próximo
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}

                            {step === 'pin' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="max-w-xl mx-auto w-full"
                                >
                                    <Card className="bg-white border-0 p-10 md:p-16 rounded-[5px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] text-center flex flex-col items-center">
                                        <div className="w-24 h-24 bg-brand-accent/10 rounded-[5px] flex items-center justify-center text-brand-accent mb-8 shadow-sm">
                                            <Smartphone className="h-12 w-12 animate-pulse" />
                                        </div>

                                        <div className="space-y-4 mb-12">
                                            <h2 className="text-4xl font-black text-[#0c0a09] uppercase tracking-tighter">Validação de Segurança</h2>
                                            <p className="text-base font-bold text-[#0c0a09]/30 uppercase tracking-[0.1em]">
                                                Confirme seu código PIN para validar a transferência de <span className="text-brand-accent font-black">{formatCurrency(amount)}</span>
                                            </p>
                                        </div>

                                        <div className="w-full max-w-sm space-y-8">
                                            <Input
                                                type="text"
                                                maxLength={6}
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").substring(0, 6))}
                                                placeholder="0 0 0 0"
                                                className="h-24 text-center font-black text-5xl tracking-[0.5em] border-2 border-neutral-100 rounded-[5px] focus:border-brand-accent bg-[#f8f9fa] shadow-inner text-[#0c0a09]"
                                                autoFocus
                                            />

                                            <div className="flex flex-col gap-6">
                                                <Button
                                                    disabled={pin.length < 4 || isLoading}
                                                    onClick={handleFinalize}
                                                    className="w-full h-20 bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-secondary hover:to-brand-accent text-white rounded-[5px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-black/20 transition-all active:scale-95"
                                                >
                                                    {isLoading ? "PROCESSANDO..." : "CONFIRMAR TRANSFERÊNCIA"}
                                                </Button>

                                                <button
                                                    onClick={() => setStep('form')}
                                                    className="text-[11px] font-black text-brand-accent uppercase tracking-[0.2em] hover:underline"
                                                >
                                                    Alterar valor da transferência
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}

                            {step === 'confirming' && (
                                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                    <div className="h-12 w-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
                                    <p className="font-black uppercase tracking-[0.3em] text-[10px] text-[#0c0a09]/50">Processando sua transferência...</p>
                                </div>
                            )}

                            {step === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="max-w-lg mx-auto"
                                >
                                    <Card className="bg-brand-accent border-0 p-1 rounded-md shadow-2xl">
                                        <div className="bg-white p-10 rounded-md space-y-8 text-center">
                                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-4">
                                                <CheckCircle2 size={48} strokeWidth={3} />
                                            </div>
                                            <div className="space-y-1">
                                                <h2 className="text-3xl font-black tracking-tighter text-[#0c0a09]">SUCESSO!</h2>
                                                <p className="text-[#0c0a09]/40 text-xs font-bold uppercase tracking-widest">Dinheiro enviado para {receiver?.name}</p>
                                            </div>

                                            <div className="border-y border-neutral-100 py-6 space-y-4">
                                                <div className="flex justify-between items-center text-[10px] uppercase font-black">
                                                    <span className="text-[#0c0a09]/30">Valor</span>
                                                    <span className="text-xl text-brand-accent">{formatCurrency(amount)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] uppercase font-black">
                                                    <span className="text-[#0c0a09]/30">Protocolo</span>
                                                    <span className="text-[#0c0a09]/50">{transactionId.slice(0, 16).toUpperCase()}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={handlePrintReceipt}
                                                    className="h-12 border-neutral-100 bg-white rounded-sm font-black text-[10px] uppercase hover:bg-neutral-50 shadow-sm"
                                                >
                                                    Comprovante
                                                </Button>
                                                <Button onClick={resetFlow} className="h-12 bg-[#0c0a09] hover:bg-brand-accent-hover text-white rounded-sm font-black text-[9px] uppercase shadow-lg shadow-black/10">Voltar p/ área de transferência</Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}

                            {step === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="max-w-md mx-auto"
                                >
                                    <Card className="bg-rose-500/5 border-rose-500/10 p-10 rounded-md text-center space-y-6 shadow-2xl shadow-rose-500/5">
                                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
                                            <AlertCircle size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">Ops! Algo falhou</h2>
                                            <p className="text-sm text-[#0c0a09]/50 font-medium">{errorMessage}</p>
                                        </div>
                                        <Button onClick={() => setStep('form')} className="w-full h-14 bg-rose-500 text-white hover:bg-rose-600 font-black uppercase shadow-lg shadow-rose-500/20">Tentar Novamente</Button>
                                        <button onClick={resetFlow} className="text-[10px] font-black uppercase tracking-widest text-[#0c0a09]/30 hover:underline">Voltar ao início</button>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>

                    {/* Sidebar Area */}
                    <aside className="lg:col-span-4 space-y-8">
                        {/* Balance Card */}
                        <div className="bg-brand-accent/5 border border-brand-accent/10 p-8 rounded-md space-y-4 shadow-xl shadow-brand-accent/5 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                            <div className="flex items-center gap-3 text-muted-foreground relative z-10 font-black">
                                <Wallet size={16} className="text-brand-accent" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Saldo Disponível</span>
                            </div>
                            <p className="text-4xl font-black font-mono tracking-tighter text-foreground relative z-10">{balance}</p>
                        </div>

                        {/* Recent Favorites */}
                        <div className="space-y-6">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#0c0a09]">Favoritos Rápidos</h3>
                            <div className="space-y-4">
                                {favorites.slice(0, 3).map((c) => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => {
                                            if (c.chave) {
                                                const cleanChave = c.chave.replace(/\D/g, "");
                                                if (cleanChave.length === 11 || cleanChave.length === 14) {
                                                    setTransferType('G8');
                                                    setTargetCpf(c.chave);
                                                    setStep('select_target');
                                                    toast.info(`Preenchido dados para: ${c.nome}`);
                                                } else {
                                                    router.push(`/dashboard/pix/pagar?type=key&key=${encodeURIComponent(c.chave)}&name=${encodeURIComponent(c.nome)}&bank=${encodeURIComponent(c.instituicao || "")}`);
                                                }
                                            }
                                        }}
                                        className="flex items-center justify-between p-5 bg-white rounded-md border border-neutral-100 hover:border-brand-accent/30 hover:shadow-2xl transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-brand-accent/10 overflow-hidden group-hover:ring-4 ring-brand-accent/10 transition-all border border-brand-accent/10 p-1 flex items-center justify-center font-black text-brand-accent">
                                                {c.nome ? c.nome.charAt(0).toUpperCase() : "?"}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[12px] font-black text-[#0c0a09] truncate max-w-[150px]">{c.nome}</p>
                                                <p className="text-[10px] text-[#0c0a09]/30 font-bold uppercase tracking-wider truncate max-w-[150px]">{c.instituicao || "PIX"}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-[#0c0a09]/20 group-hover:text-brand-accent group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                                {favorites.length === 0 && (
                                    <div className="text-center py-6 bg-white border border-neutral-100 rounded-md">
                                        <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">Nenhum favorito salvo</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Security Info */}
                        <div className="p-8 bg-brand-accent/10 rounded-md border border-brand-accent/10 space-y-4 shadow-xl shadow-black/5">
                            <div className="flex items-center gap-2 text-brand-accent">
                                <ShieldCheck size={20} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Segurança {currentBrand.shortName}</span>
                            </div>
                            <p className="text-[11px] text-[#0c0a09]/60 font-medium leading-relaxed">Suas transferências internas são protegidas por criptografia de ponta e validação via PIN.</p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function TransferOption({
    icon: Icon,
    title,
    description,
    onClick,
    premium = false,
    disabled = false,
    badge
}: {
    icon: any,
    title: string,
    description: string,
    onClick: () => void,
    premium?: boolean,
    disabled?: boolean,
    badge?: string
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full group p-8 rounded-md text-left transition-all relative overflow-hidden flex flex-col justify-between h-[240px] border ${premium
                    ? 'bg-gradient-to-br from-brand-accent to-brand-secondary border-0 text-white shadow-xl shadow-brand-accent/10 active:scale-[0.98]'
                    : disabled
                        ? 'bg-neutral-50 border-neutral-100 opacity-40 cursor-not-allowed grayscale'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800 hover:bg-brand-accent/5 hover:shadow-xl hover:border-brand-accent/20 active:scale-[0.98]'
                }`}
        >
            {/* Background elements */}
            {premium ? (
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl transition-transform duration-1000 group-hover:scale-150" />
            ) : (
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full -mr-16 -mt-16 blur-3xl transition-transform duration-1000 group-hover:scale-150" />
            )}

            <div className={`w-14 h-14 rounded-md flex items-center justify-center mb-6 transition-transform group-hover:rotate-6 ${premium 
                ? 'bg-white/20 text-white' 
                : 'bg-brand-accent/5 text-brand-accent border border-brand-accent/10 shadow-sm'
                }`}>
                <Icon size={28} strokeWidth={2.5} />
            </div>

            <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                    <h3 className={`text-xl font-black tracking-tight ${premium ? 'text-white' : 'text-foreground'}`}>{title}</h3>
                    {disabled && <Badge className="bg-[#0c0a09]/10 text-[#0c0a09] text-[8px] font-black uppercase border-0">Breve</Badge>}
                    {badge && (
                        <Badge className={`${premium 
                            ? 'bg-white/25 text-white border-0' 
                            : 'bg-brand-accent/10 text-brand-accent border-0'} text-[8px] font-black uppercase tracking-widest`}>
                            {badge}
                        </Badge>
                    )}
                </div>
                <p className={`text-[11px] font-black leading-relaxed ${premium ? 'text-white/85' : 'text-muted-foreground'}`}>
                    {description}
                </p>
            </div>

            <div className={`flex items-center gap-2 mt-4 font-black uppercase text-[9px] tracking-[0.2em] transform translate-x-0 group-hover:translate-x-2 transition-transform ${premium ? 'text-white' : 'text-brand-accent'
                }`}>
                {disabled ? 'Indisponível' : 'Começar'} <ArrowRight size={14} />
            </div>
        </button>
    );
}

function SimpleAction({ icon: Icon, label, onClick, badge }: { icon: any, label: string, onClick?: () => void, badge?: string }) {
    return (
        <button 
            onClick={onClick}
            disabled={!!badge}
            className={`flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-sm transition-all relative overflow-hidden group w-full ${!!badge ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:bg-brand-accent/5 hover:border-brand-accent/20 hover:shadow-xl hover:shadow-brand-accent/5 hover:scale-[1.03] active:scale-[0.98]'}`}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full -mr-16 -mt-16 blur-3xl transition-transform duration-1000 group-hover:scale-125" />
            
            {badge && (
                <Badge className="absolute top-2 left-2 bg-brand-accent/10 text-brand-accent border-0 text-[7px] font-black uppercase tracking-tight px-1.5 py-0 z-20">
                    {badge}
                </Badge>
            )}

            <div className="w-10 h-10 bg-brand-accent/5 rounded-sm flex items-center justify-center text-brand-accent mb-3 group-hover:scale-110 group-hover:bg-brand-accent/10 transition-all relative z-10">
                <Icon size={18} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-foreground relative z-10">{label}</span>
        </button>
    );
}
