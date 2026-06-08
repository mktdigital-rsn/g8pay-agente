"use client";

import React, { useState } from "react";
import {
   Smartphone,
   Clock,
   ArrowLeft,
   CheckCircle2,
   ChevronRight,
   User,
   Zap,
   Phone,
   Wallet,
   QrCode,
   History,
   Star,
   Info,
   ArrowRight,
   Loader2,
   Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";
import api from "@/lib/api";
import { useAtomValue } from "jotai";
import { temporaryDeviceIdAtom, balanceAtom } from "@/store/auth";

interface Operadora {
   providerId: number;
   name: string;
   category: number;
   tipoRecarga: string;
   maxValue: number;
   minValue: number;
   logo: string;
}

interface ValorRecarga {
   productName: string;
   code: number;
   checkSum: number;
   detail: string;
   dueProduct: number;
   maxValue: number;
   minValue: number;
}

interface RecargaRequest {
   number: string;
   stateCode: number;
   amount: number;
   providerId: number;
   productCode: number;
   checkSum: number;
   deviceId: string;
}

export default function RecargasPage() {
   const temporaryDeviceId = useAtomValue(temporaryDeviceIdAtom);
   const balanceValue = useAtomValue(balanceAtom);
   const [step, setStep] = useState(1);
   const [phoneNumber, setPhoneNumber] = useState("");
   const [operators, setOperators] = useState<Operadora[]>([]);
   const [selectedOperator, setSelectedOperator] = useState<Operadora | null>(null);
   const [rechargeValues, setRechargeValues] = useState<ValorRecarga[]>([]);
   const [selectedValue, setSelectedValue] = useState<ValorRecarga | null>(null);
   const [paymentMethod, setPaymentMethod] = useState<"balance" | "pix" | null>("balance");
   const [isProcessing, setIsProcessing] = useState(false);
   const [isLoadingOperators, setIsLoadingOperators] = useState(true);
   const [isLoadingValues, setIsLoadingValues] = useState(false);

   const [pin, setPin] = useState("");
   const [pinId, setPinId] = useState("");
   const [showPinInput, setShowPinInput] = useState(false);

   const maskPhone = (val: string) => {
      let v = val.replace(/\D/g, "");
      if (v.length > 11) v = v.substring(0, 11);

      if (v.length > 10) {
         return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      } else if (v.length > 6) {
         return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      } else if (v.length > 2) {
         return v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
      }
      return v;
   };

   const handlePhoneChange = (val: string) => {
      setPhoneNumber(maskPhone(val));
   };

   // Load operators on mount
   React.useEffect(() => {
      const fetchOperators = async () => {
         try {
            const res = await api.get("/api/banco/recarga/operadoras");
            setOperators(res.data);
         } catch (err) {
            console.error("Error fetching operators:", err);
            toast.error("Erro ao carregar operadoras");
         } finally {
            setIsLoadingOperators(false);
         }
      };
      fetchOperators();
   }, []);

   const handleNext = async () => {
      if (step === 1) {
         if (!phoneNumber || !selectedOperator) {
            toast.error("Informe o número e selecione a operadora");
            return;
         }

         const cleanNumber = phoneNumber.replace(/\D/g, "");
         if (cleanNumber.length < 10) {
            toast.error("Número de celular inválido");
            return;
         }

         setIsLoadingValues(true);
         try {
            const stateCode = parseInt(cleanNumber.substring(0, 2));
            const number = cleanNumber.substring(2);

            const res = await api.post("/api/banco/recarga/valores", {
               number,
               stateCode
            });

            if (res.data && res.data.length > 0) {
               setRechargeValues(res.data);
               setStep(2);
            } else {
               toast.error("Nenhum valor disponível para este número");
            }
         } catch (err) {
            console.error("Error fetching recharge values:", err);
            toast.error("Erro ao consultar valores de recarga");
         } finally {
            setIsLoadingValues(false);
         }
         return;
      }

      if (step === 2 && !selectedValue) {
         toast.error("Selecione um valor para recarga");
         return;
      }
      setStep(step + 1);
   };

   const handleBack = () => {
      if (showPinInput) {
         setShowPinInput(false);
         setPin("");
         return;
      }
      setStep(step - 1);
   };

   const handleRequestPin = async () => {
      if (!paymentMethod) {
         toast.error("Selecione uma forma de pagamento");
         return;
      }

      if (paymentMethod === "balance" && balanceValue < (selectedValue?.maxValue || 0)) {
         toast.error("Saldo insuficiente para realizar a recarga");
         return;
      }

      setIsProcessing(true);
      try {
         const res = await api.post("/api/users/solicitar-pin", {
            amount: selectedValue?.maxValue.toFixed(2),
            deviceId: temporaryDeviceId
         });

         if (res.data) {
            const data = res.data.data || res.data;
            setPinId(data.pinId || data.id || "");
            setShowPinInput(true);
            toast.success("PIN de segurança solicitado!");
         }
      } catch (err) {
         console.error("Error requesting PIN:", err);
         toast.error("Erro ao solicitar PIN de segurança");
      } finally {
         setIsProcessing(false);
      }
   };

   const handleFinish = async () => {
      if (!pin || pin.length < 4) {
         toast.error("Digite o PIN de segurança");
         return;
      }

      setIsProcessing(true);
      try {
         // 1. Validate PIN
         await api.post("/api/users/validar-pin", {
            pin,
            pinId,
            deviceId: temporaryDeviceId
         });

         // 2. Effect Recharge
         const cleanNumber = phoneNumber.replace(/\D/g, "");
         const stateCode = parseInt(cleanNumber.substring(0, 2));
         const number = cleanNumber.substring(2);

         const payload: RecargaRequest = {
            number,
            stateCode,
            amount: selectedValue!.maxValue,
            providerId: selectedOperator!.providerId,
            productCode: selectedValue!.code,
            checkSum: selectedValue!.checkSum,
            deviceId: temporaryDeviceId || ""
         };

         const res = await api.post("/api/banco/recarga/confirmar", payload);

         if (res.data.success) {
            setStep(4);
            toast.success("Recarga realizada com sucesso!");
         } else {
            toast.error(res.data.message || "Erro ao realizar recarga");
         }
      } catch (err: any) {
         console.error("Error finalizing recharge:", err);
         const msg = err.response?.data?.message || err.response?.data?.mensagem || "Erro ao processar recarga";
         toast.error(msg);
      } finally {
         setIsProcessing(false);
      }
   };

   return (
      <div className="p-8 md:p-12 space-y-12 max-w-[1400px] mx-auto min-h-screen bg-[#f8f9fa] relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div className="space-y-4">
               <Badge variant="secondary" className="bg-orange-600/10 text-orange-600 border-0 px-3 py-1.5 font-black text-[10px] uppercase tracking-[0.2em]">Serviços Pré-pagos</Badge>
               <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none uppercase">
                  Recarga de <span className="text-orange-600">CELULAR</span>
               </h1>
               <p className="text-sm md:text-base text-neutral-400 font-bold max-w-2xl">
                  Recarregue créditos de forma instantânea para qualquer operadora do Brasil.
               </p>
            </div>

            <div className="flex gap-4">
               <Button variant="outline" className="h-14 px-8 border-neutral-200 text-neutral-400 font-black uppercase tracking-widest text-[10px] rounded-sm hover:bg-white hover:text-orange-600 transition-all">
                  <History className="h-4 w-4 mr-2" /> Histórico
               </Button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
            {/* Main Flow Area */}
            <div className="lg:col-span-8">
               <Card className="bg-white border border-neutral-100 rounded-sm shadow-xl shadow-black/[0.02] overflow-hidden">
                  {/* Step Indicator */}
                  <div className="bg-neutral-50 px-8 py-4 border-b border-neutral-100 flex justify-between items-center">
                     <div className="flex gap-2">
                        {[1, 2, 3].map((s) => (
                           <div key={s} className={`w-8 h-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-orange-600' : 'bg-neutral-200'}`} />
                        ))}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        Passo {step > 3 ? 3 : step} de 3
                     </span>
                  </div>

                  <div className="p-10">
                     {step === 1 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <div className="space-y-6">
                              <h2 className="text-2xl font-black text-[#0c0a09] uppercase tracking-tight">Informações de Contato</h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Número do Celular</Label>
                                    <div className="relative">
                                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300" />
                                       <Input
                                          placeholder="(00) 00000-0000"
                                          className="h-14 pl-12 border-neutral-100 bg-neutral-50 rounded-sm font-bold focus:ring-orange-600/20 focus:border-orange-600/30 transition-all text-lg"
                                          value={phoneNumber}
                                          onChange={(e) => handlePhoneChange(e.target.value)}
                                       />
                                    </div>
                                 </div>
                                 <div className="p-6 bg-orange-50 rounded-sm border border-orange-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center shrink-0 shadow-sm">
                                       <User className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1">Dica G8</p>
                                       <p className="text-[11px] text-orange-800/70 font-bold uppercase tracking-tight">Recarregue para contatos salvos.</p>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-6">
                              <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest">Selecione a Operadora</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                 {isLoadingOperators ? (
                                    Array(5).fill(0).map((_, i) => (
                                       <div key={i} className="h-32 bg-neutral-100 animate-pulse rounded-sm" />
                                    ))
                                 ) : (
                                    operators.map((op) => (
                                       <button
                                          key={op.providerId}
                                          onClick={() => setSelectedOperator(op)}
                                          className={`p-6 rounded-sm border-2 transition-all flex flex-col items-center gap-4 group ${selectedOperator?.providerId === op.providerId ? 'border-orange-600 bg-orange-50/50' : 'border-neutral-100 bg-white hover:border-neutral-200'}`}
                                       >
                                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform overflow-hidden p-2">
                                             {op.logo ? (
                                                <img src={op.logo} alt={op.name} className="w-full h-full object-contain" />
                                             ) : (
                                                <div className="bg-orange-600 w-full h-full flex items-center justify-center text-white font-black">{op.name[0]}</div>
                                             )}
                                          </div>
                                          <span className={`text-[10px] font-black uppercase tracking-widest ${selectedOperator?.providerId === op.providerId ? 'text-orange-600' : 'text-neutral-400'}`}>{op.name}</span>
                                       </button>
                                    ))
                                 )}
                              </div>
                           </div>

                           <div className="pt-6">
                              <Button
                                 onClick={handleNext}
                                 disabled={isLoadingValues}
                                 className="h-16 px-12 bg-[#0c0a09] hover:bg-neutral-800 text-white rounded-sm font-black uppercase tracking-widest text-xs transition-all shadow-xl w-full sm:w-auto"
                              >
                                 {isLoadingValues ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : null}
                                 Próximo Passo <ArrowRight className="h-4 w-4 ml-3" />
                              </Button>
                           </div>
                        </div>
                     )}

                     {step === 2 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                           <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                 <h2 className="text-2xl font-black text-[#0c0a09] uppercase tracking-tight">Escolha o Valor</h2>
                                 <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Recarga para {phoneNumber} ({selectedOperator?.name.toUpperCase()})</p>
                              </div>
                              <Button variant="ghost" onClick={handleBack} className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-orange-600">
                                 Alterar Dados
                              </Button>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                              {rechargeValues.map((val, idx) => (
                                 <button
                                    key={val.maxValue}
                                    onClick={() => setSelectedValue(val)}
                                    className={`p-8 rounded-sm border-2 text-left transition-all relative group overflow-hidden ${selectedValue && selectedValue.maxValue === val.maxValue ? 'border-orange-600 bg-orange-50/50' : 'border-neutral-100 bg-white hover:border-neutral-200'}`}
                                 >
                                    <div className="space-y-1 relative z-10">
                                       <p className="text-3xl font-black text-[#0c0a09] tracking-tighter">{val.productName}</p>
                                       <Badge className="bg-emerald-50 text-emerald-600 border-0 font-black text-[9px] uppercase tracking-widest py-0.5">{val.detail}</Badge>
                                    </div>
                                    <div className={`absolute bottom-0 right-0 p-4 transition-all ${selectedValue && selectedValue.maxValue === val.maxValue ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                       <CheckCircle2 className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                                 </button>
                              ))}
                           </div>

                           <div className="pt-6 flex flex-col sm:flex-row gap-4">
                              <Button
                                 onClick={handleNext}
                                 className="h-16 px-12 bg-[#0c0a09] hover:bg-neutral-800 text-white rounded-sm font-black uppercase tracking-widest text-xs transition-all shadow-xl"
                              >
                                 Escolher Pagamento <ArrowRight className="h-4 w-4 ml-3" />
                              </Button>
                              <Button variant="ghost" onClick={handleBack} className="h-16 px-8 text-neutral-400 font-black uppercase tracking-widest text-[10px]">
                                 Voltar
                              </Button>
                           </div>
                        </div>
                     )}

                     {step === 3 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                           <div className="space-y-6">
                              <h2 className="text-2xl font-black text-[#0c0a09] uppercase tracking-tight">Resumo e Pagamento</h2>
                              <div className="p-8 bg-neutral-900 rounded-sm text-white grid grid-cols-1 md:grid-cols-3 gap-8">
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Número</p>
                                    <p className="text-xl font-black font-mono">{phoneNumber}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Operadora</p>
                                    <p className="text-xl font-black uppercase tracking-tight">{selectedOperator?.name}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Valor Total</p>
                                    <p className="text-3xl font-black tracking-tighter text-orange-500">R$ {selectedValue?.maxValue.toFixed(2)}</p>
                                 </div>
                              </div>
                           </div>

                           {!showPinInput ? (
                              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                 <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest">Forma de Pagamento</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <button
                                       onClick={() => setPaymentMethod("balance")}
                                       className={`p-8 rounded-sm border-2 text-left transition-all flex items-center gap-6 group ${paymentMethod === "balance" ? 'border-orange-600 bg-orange-50/50' : 'border-neutral-100 bg-white hover:border-neutral-200'}`}
                                    >
                                       <div className="w-14 h-14 bg-neutral-50 rounded-lg flex items-center justify-center text-neutral-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                                          <Wallet className="h-7 w-7" />
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-[#0c0a09] uppercase tracking-tight">Saldo Conta G8</p>
                                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Disponível: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balanceValue)}</p>
                                       </div>
                                    </button>
                                    <button
                                       onClick={() => setPaymentMethod("pix")}
                                       className={`p-8 rounded-sm border-2 text-left transition-all flex items-center gap-6 group ${paymentMethod === 'pix' ? 'border-orange-600 bg-orange-50/50' : 'border-neutral-100 bg-white hover:border-neutral-200'}`}
                                    >
                                       <div className="w-14 h-14 bg-neutral-50 rounded-lg flex items-center justify-center text-neutral-400">
                                          <QrCode className="h-7 w-7" />
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-[#0c0a09] uppercase tracking-tight">PIX Instantâneo</p>
                                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Liberado</p>
                                       </div>
                                    </button>
                                 </div>

                                 <div className="pt-6 flex flex-col sm:flex-row gap-4">
                                    <Button
                                       onClick={handleRequestPin}
                                       disabled={!paymentMethod || isProcessing}
                                       className="h-16 px-12 bg-orange-600 hover:bg-orange-700 text-white rounded-sm font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50"
                                    >
                                       {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Solicitar PIN de Segurança"}
                                    </Button>
                                    <Button variant="ghost" onClick={handleBack} className="h-16 px-8 text-neutral-400 font-black uppercase tracking-widest text-[10px]">
                                       Voltar
                                    </Button>
                                 </div>
                              </div>
                           ) : (
                              <div className="space-y-8 animate-in zoom-in-95 duration-300">
                                 <div className="p-8 bg-orange-50 border border-orange-100 rounded-sm space-y-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 bg-orange-600 rounded-sm flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
                                          <Lock className="h-6 w-6" />
                                       </div>
                                       <div>
                                          <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest">Validação de Segurança</h3>
                                          <p className="text-[10px] text-orange-700 font-bold uppercase tracking-tight opacity-70">Enviamos um código para o seu dispositivo vinculado.</p>
                                       </div>
                                    </div>

                                    <div className="space-y-3">
                                       <Label className="text-[10px] font-black uppercase tracking-widest text-orange-900/60">Digite o PIN recebido</Label>
                                       <Input
                                          type="text"
                                          maxLength={6}
                                          placeholder="000000"
                                          className="h-16 border-orange-200 bg-white rounded-sm font-black text-3xl tracking-[0.5em] text-center text-orange-600 focus:ring-orange-600/20 focus:border-orange-600/40 transition-all"
                                          value={pin}
                                          onChange={(e) => setPin(e.target.value)}
                                       />
                                    </div>
                                 </div>

                                 <div className="pt-6 flex flex-col sm:flex-row gap-4">
                                    <Button
                                       onClick={handleFinish}
                                       disabled={pin.length < 4 || isProcessing}
                                       className="h-16 px-12 bg-[#0c0a09] hover:bg-neutral-800 text-white rounded-sm font-black uppercase tracking-widest text-xs transition-all shadow-xl disabled:opacity-50"
                                    >
                                       {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : null}
                                       Confirmar Recarga
                                    </Button>
                                    <Button variant="ghost" onClick={handleBack} className="h-16 px-8 text-neutral-400 font-black uppercase tracking-widest text-[10px]">
                                       Alterar Pagamento
                                    </Button>
                                 </div>
                              </div>
                           )}
                        </div>
                     )}

                     {step === 4 && (
                        <div className="p-12 text-center space-y-10 animate-in fade-in zoom-in duration-500">
                           <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
                              <CheckCircle2 className="h-12 w-12" />
                           </div>
                           <div className="space-y-3">
                              <h2 className="text-4xl font-black text-[#0c0a09] uppercase tracking-tighter">Recarga Realizada!</h2>
                              <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest max-w-sm mx-auto">
                                 O valor de R$ {selectedValue?.maxValue.toFixed(2)} já foi enviado para o número {phoneNumber}.
                              </p>
                           </div>
                           <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                              <Button
                                 onClick={() => window.location.reload()}
                                 className="h-14 px-10 bg-[#0c0a09] hover:bg-neutral-800 text-white rounded-sm font-black uppercase tracking-widest text-xs shadow-xl"
                              >
                                 Nova Recarga
                              </Button>
                              <Link href="/dashboard">
                                 <Button variant="outline" className="h-14 px-10 border-neutral-200 text-neutral-400 font-black uppercase tracking-widest text-xs rounded-sm">
                                    Voltar ao Início
                                 </Button>
                              </Link>
                           </div>
                        </div>
                     )}
                  </div>
               </Card>
            </div>

            {/* Sidebar Info Area */}
            <div className="lg:col-span-4 space-y-8">
               <Card className="p-10 bg-white border border-neutral-100 rounded-sm shadow-xl shadow-black/[0.02] space-y-10">
                  <div className="space-y-6">
                     <h3 className="text-xl font-black text-[#0c0a09] uppercase tracking-tight flex items-center gap-3">
                        <Star className="h-5 w-5 text-orange-600" />
                        Favoritos
                     </h3>
                     <div className="space-y-4">
                        {[
                           { name: "Meu Celular", number: "(11) 99887-7665", op: "Vivo" },
                           { name: "Mãe", number: "(11) 98765-4321", op: "Tim" },
                           { name: "Escritório", number: "(11) 91234-5678", op: "Claro" }
                        ].map((fav, i) => (
                           <button key={i} className="w-full p-4 bg-neutral-50 rounded-sm flex items-center gap-4 hover:bg-orange-50 transition-all group text-left">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-neutral-300 group-hover:text-orange-600 transition-all shadow-sm">
                                 <User className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                 <p className="text-[10px] font-black text-[#0c0a09] uppercase tracking-tight">{fav.name}</p>
                                 <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{fav.number} • {fav.op}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-orange-600" />
                           </button>
                        ))}
                     </div>
                     <Button variant="ghost" className="w-full text-orange-600 font-black uppercase tracking-widest text-[9px]">
                        Ver todos os favoritos
                     </Button>
                  </div>

                  <Separator className="bg-neutral-100" />


               </Card>

               <a
                  href="https://wa.me/5551996297077"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-8 bg-[#0c0a09] rounded-sm text-white relative overflow-hidden group cursor-pointer block"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                  <div className="relative z-10 space-y-4">
                     <Badge className="bg-orange-600 text-white border-0 px-3 py-1 font-black text-[9px] uppercase tracking-widest leading-none">Suporte G8</Badge>
                     <h2 className="text-xl font-black uppercase leading-tight">Fale com nosso time via WhatsApp.</h2>
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Disponível: às 17:00</p>
                  </div>
               </a>

               <Link
                  href="/dashboard/ajuda"
                  className="p-6 bg-white border border-neutral-100 rounded-sm flex items-center gap-4 group cursor-pointer hover:border-orange-100 transition-all"
               >
                  <div className="w-10 h-10 bg-neutral-50 rounded-sm flex items-center justify-center text-neutral-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                     <Info className="h-5 w-5" />
                  </div>
                  <div>
                     <p className="text-xs font-black text-[#0c0a09] uppercase tracking-tight">Ajuda com Recarga?</p>
                     <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Veja as dúvidas frequentes</p>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto text-neutral-300 group-hover:text-orange-600 transition-all" />
               </Link>
            </div>
         </div>
      </div>
   );
}
