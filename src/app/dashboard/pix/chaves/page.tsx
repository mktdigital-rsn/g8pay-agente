"use client";

import React from "react";
import api from "@/lib/api";
import {
   ArrowLeft,
   Key,
   Copy,
   QrCode,
   Trash2,
   Plus,
   Smartphone,
   Mail,
   UserSquare2,
   Hash,
   ChevronRight,
   Share2,
   Check,
   X,
   Loader2,
   AlertCircle,
   CheckCircle2,
   ShieldCheck,
   Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MyPixKeysPage() {
   const [keys, setKeys] = React.useState<any[]>([]);
   const [isLoading, setIsLoading] = React.useState(true);
   const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
   const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
   const [copySuccess, setCopySuccess] = React.useState<string | null>(null);
   
   // Toast state
   const [toast, setToast] = React.useState<{ message: string, type: 'success' | 'error' } | null>(null);
   
   // Modal Workflow State
   const [step, setStep] = React.useState<'CREATE' | 'CONFIRM'>('CREATE');
   const [keyToConfirm, setKeyToConfirm] = React.useState("");
   const [confirmToken, setConfirmToken] = React.useState("");
   const [isConfirming, setIsConfirming] = React.useState(false);

   // New Key Form State
   const [newKeyType, setNewKeyType] = React.useState<string>("CPF");
   const [newKeyValue, setNewKeyValue] = React.useState("");
   const [isCreating, setIsCreating] = React.useState(false);

   const MAX_KEYS = 4;
   const keysReachedLimit = keys.length >= MAX_KEYS;

   const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
   };

   const fetchKeys = async () => {
      setIsLoading(true);
      try {
         const response = await api.get("/api/banco/pix/listar-chaves");
         if (Array.isArray(response.data)) {
            setKeys(response.data);
         }
      } catch (err) {
         console.error("Error fetching pix keys:", err);
      } finally {
         setIsLoading(false);
      }
   };

   React.useEffect(() => {
      fetchKeys();
   }, []);

   const handleDeleteKey = async (chave: string) => {
      if (!confirm(`Deseja realmente excluir a chave ${chave}?`)) return;
      
      setIsDeleting(chave);
      try {
         // FIXED: Correct endpoint and payload based on API inspection
         await api.post("/api/banco/pix/solicitar-exclusao-chave", { 
            chavePix: chave 
         });
         
         setKeys(prev => prev.filter(k => k.chave !== chave));
         showToast("Exclusão da chave solicitada com sucesso!");
      } catch (err: any) {
         console.error("Error deleting key:", err);
         showToast(err.response?.data?.message || "Erro ao solicitar exclusão da chave.", "error");
      } finally {
         setIsDeleting(null);
      }
   };

   const handleCopy = (val: string) => {
      navigator.clipboard.writeText(val);
      setCopySuccess(val);
      setTimeout(() => setCopySuccess(null), 2000);
   };

   const handleCreateKey = async () => {
      if (keysReachedLimit) {
         showToast("Limite de chaves atingido.", "error");
         return;
      }
      if (!newKeyValue && newKeyType !== "CHAVE_ALEATORIA") return;
      
      setIsCreating(true);
      try {
         let normalizedValue = newKeyValue;
         if (newKeyType === "CPF" || newKeyType === "CNPJ" || newKeyType === "CELULAR" || newKeyType === "TELEFONE") {
            normalizedValue = newKeyValue.replace(/\D/g, "");
         }

         const response = await api.post("/api/banco/pix/cadastrar-chave", {
            tipo: newKeyType,
            chave: normalizedValue
         });
         
         const result = response.data.result;

         if (result === "CONFIRM_KEY") {
            setKeyToConfirm(normalizedValue);
            setStep('CONFIRM');
            showToast("Chave registrada! Agora confirme a autoridade.");
         } else {
            setIsAddModalOpen(false);
            setNewKeyValue("");
            showToast("Chave Pix cadastrada com sucesso!");
            fetchKeys();
         }
      } catch (err: any) {
         console.error("Error creating key:", err);
         showToast(err.response?.data?.message || "Erro ao cadastrar chave.", "error");
      } finally {
         setIsCreating(false);
      }
   };

   const handleConfirmKey = async () => {
      if (!confirmToken) return;
      
      setIsConfirming(true);
      try {
         await api.post("/api/banco/pix/confirmar-autoridade", {
            chave: keyToConfirm,
            token: confirmToken
         });
         
         setIsAddModalOpen(false);
         setConfirmToken("");
         setStep('CREATE');
         showToast("Chave confirmada e ativa!");
         fetchKeys();
      } catch (err: any) {
         console.error("Error confirming key:", err);
         showToast(err.response?.data?.message || "Código inválido ou expirado.", "error");
      } finally {
         setIsConfirming(false);
      }
   };

   const toggleModal = (open: boolean) => {
      if (open && keysReachedLimit) return;
      setIsAddModalOpen(open);
      if (!open) {
         setStep('CREATE');
         setConfirmToken("");
         setNewKeyValue("");
      }
   };

   const getIconForType = (type: string) => {
      switch (type) {
         case "CPF":
         case "CNPJ":
            return UserSquare2;
         case "CELULAR":
         case "TELEFONE":
            return Smartphone;
         case "EMAIL":
            return Mail;
         case "CHAVE_ALEATORIA":
            return Hash;
         default:
            return Key;
      }
   };

   const getLabelForType = (type: string) => {
      switch (type) {
         case "CPF": return "CPF";
         case "CNPJ": return "CNPJ";
         case "CELULAR":
         case "TELEFONE": return "Celular";
         case "EMAIL": return "E-mail";
         case "CHAVE_ALEATORIA": return "Aleatória";
         default: return type;
      }
   };

   return (
      <div className="p-4 md:p-8 xl:p-10 flex flex-col min-[1268px]:flex-row gap-8 xl:gap-10 h-full overflow-y-auto w-full no-scrollbar font-sans bg-[#f8f9fa] relative">
         
         {/* Toast Notification */}
         {toast && (
            <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 duration-500`}>
               <div className={`flex items-center gap-3 px-6 py-4 rounded-md shadow-2xl ${toast.type === 'success' ? 'bg-[#0c0a09] border-[var(--brand-accent)] text-[var(--brand-accent)]' : 'bg-red-600 text-white'} border min-w-[320px]`}>
                  {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  <div className="flex-1">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Notificação G8</p>
                     <p className="text-sm font-black tracking-tight">{toast.message}</p>
                  </div>
                  <button onClick={() => setToast(null)} className="opacity-40 hover:opacity-100 transition-opacity">
                     <X className="h-4 w-4" />
                  </button>
               </div>
            </div>
         )}

         {/* Main Content Area */}
         <div className="flex-1 space-y-8 min-[1268px]:max-w-[calc(100%-420px)]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <Link href="/dashboard/pix">
                     <Button variant="ghost" size="icon" className="rounded-md hover:bg-neutral-100 h-11 w-11 border border-neutral-100 bg-white shadow-sm">
                        <ArrowLeft className="h-5 w-5 text-[var(--brand-accent)]" />
                     </Button>
                  </Link>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-transparent font-black px-3 py-0.5 rounded-sm text-[10px] uppercase tracking-widest leading-none">G8Pay &bull; Pix</Badge>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none">Minhas Chaves</span>
                     </div>
                     <h1 className="text-3xl font-black tracking-tighter text-[#0c0a09] flex items-center gap-3">
                        Gerenciar <span className="text-[var(--brand-accent)]">Chaves</span>
                     </h1>
                  </div>
               </div>
               
               <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                  <Button 
                     onClick={() => toggleModal(true)}
                     disabled={keysReachedLimit}
                     className={`w-full sm:w-auto h-14 rounded-md px-8 font-black flex items-center gap-3 shadow-lg transition-all active:scale-95 ${
                        keysReachedLimit 
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none' 
                        : 'bg-[var(--brand-accent)] hover:bg-orange-600 text-white shadow-orange-500/10'
                     }`}
                  >
                     <Plus className="h-6 w-6" />
                     {keysReachedLimit ? 'LIMITE ATINGIDO' : 'NOVA CHAVE'}
                  </Button>
                  {keysReachedLimit && (
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                        <Info className="h-3 w-3" /> Máximo de 4 chaves permitido
                     </p>
                  )}
               </div>
            </div>

            {/* Keys Area */}
            <div className="flex flex-col gap-4">
               {/* Progress indicator */}
               {!isLoading && keys.length > 0 && (
                  <div className="bg-white p-4 rounded-md border border-neutral-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                           {[...Array(MAX_KEYS)].map((_, i) => (
                              <div 
                                 key={i} 
                                 className={`h-1.5 w-6 rounded-full ${i < keys.length ? 'bg-[var(--brand-accent)]' : 'bg-neutral-100'}`} 
                              />
                           ))}
                        </div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                           {keys.length} de {MAX_KEYS} chaves utilizadas
                        </span>
                     </div>
                     {keysReachedLimit && (
                        <Badge className="bg-orange-50 text-[var(--brand-accent)] border-0 text-[9px] font-black uppercase tracking-tighter">Conta no Limite</Badge>
                     )}
                  </div>
               )}

               {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-md border border-dashed border-neutral-200 w-full">
                     <Loader2 className="w-10 h-10 text-[var(--brand-accent)] animate-spin" />
                     <p className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Verificando registros...</p>
                  </div>
               ) : keys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-20 space-y-6 bg-white rounded-md border border-neutral-200 text-center w-full">
                     <div className="w-20 h-20 bg-[var(--brand-accent)]/10 rounded-md flex items-center justify-center text-[var(--brand-accent)] shadow-sm">
                        <Key className="h-10 w-10 stroke-[1.5]" />
                     </div>
                     <div className="space-y-2">
                        <p className="text-[#0c0a09] font-black text-2xl tracking-tighter uppercase">Nenhuma chave</p>
                        <p className="text-neutral-400 font-bold text-xs uppercase tracking-widest max-w-[280px]">Cadastre uma chave para começar a receber depósitos instantâneos.</p>
                     </div>
                     <Button 
                        onClick={() => toggleModal(true)}
                        className="bg-[#0c0a09] text-white hover:bg-[var(--brand-accent)] rounded-md h-12 px-8 font-black text-[10px] uppercase tracking-widest shadow-xl transition-all"
                     >
                        CADASTRAR MINHA PRIMEIRA CHAVE
                     </Button>
                  </div>
               ) : (
                  keys.map((key, index) => {
                     const Icon = getIconForType(key.tipo);
                     const isThisKeyDeleting = isDeleting === key.chave;
                     const isThisKeyCopied = copySuccess === key.chave;

                     return (
                        <Card key={index} className="bg-white border border-neutral-100 rounded-md p-6 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all group flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden gap-6 w-full">
                           <div className="absolute top-0 left-0 w-1 h-full bg-[var(--brand-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                           <div className="flex items-center gap-6 z-10 w-full md:flex-1 min-w-0">
                              <div className="w-16 h-16 bg-[#f8f9fa] rounded-md flex items-center justify-center text-[#0c0a09] group-hover:bg-[var(--brand-accent)]/10 group-hover:text-[var(--brand-accent)] transition-colors border border-neutral-100/50 shrink-0">
                                 <Icon className="h-7 w-7 stroke-[2]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em] mb-1">{getLabelForType(key.tipo)}</p>
                                 <p className="text-base sm:text-lg md:text-xl font-black text-[var(--brand-accent)] font-mono tracking-tighter break-all leading-tight">
                                    {key.chave}
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-neutral-50 shrink-0">
                              <button 
                                 className="w-12 h-12 bg-neutral-50 rounded-md flex items-center justify-center text-neutral-400 hover:bg-[#0c0a09] hover:text-white transition-all active:scale-90"
                                 title="Exibir QR Code"
                              >
                                 <QrCode className="h-5 w-5" />
                              </button>

                              <button 
                                 onClick={() => handleCopy(key.chave)}
                                 className={`w-12 h-12 rounded-md flex items-center justify-center transition-all active:scale-90 ${isThisKeyCopied ? 'bg-green-500 text-white' : 'bg-neutral-50 text-neutral-400 hover:bg-[#0c0a09] hover:text-white'}`}
                                 title="Copiar Chave"
                              >
                                 {isThisKeyCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                              </button>

                              <button 
                                 onClick={() => handleDeleteKey(key.chave)}
                                 disabled={isThisKeyDeleting}
                                 className={`w-12 h-12 bg-neutral-50 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-90 ${isThisKeyDeleting ? 'opacity-50' : ''}`}
                                 title="Excluir Chave"
                              >
                                 {isThisKeyDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                              </button>
                              
                              <ChevronRight className="h-6 w-6 text-neutral-200 group-hover:text-[var(--brand-accent)] group-hover:translate-x-1 transition-all hidden md:block" />
                           </div>
                        </Card>
                     )
                  })
               )}
            </div>
         </div>

         {/* Side Column */}
         <div className="w-full min-[1268px]:w-[380px] shrink-0 space-y-8 pb-10">
            <Card className="rounded-md border-0 shadow-xl bg-[#0c0a09] p-10 text-white relative overflow-hidden group min-h-[300px] cursor-pointer border border-white/5">
               <div className="absolute bottom-0 right-0 w-48 h-48 bg-[var(--brand-accent)]/10 rounded-full -mr-24 -mb-24 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative z-10 space-y-8 flex flex-col h-full justify-between">
                  <div className="w-16 h-16 bg-white/5 rounded-md flex items-center justify-center text-[var(--brand-accent)] shadow-xl border border-white/5 group-hover:rotate-12 transition-transform shrink-0">
                     <Share2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-3xl font-black leading-tight tracking-tighter">Compartilhe sua chave e receba mais rápido</h3>
                     <p className="text-xs font-medium text-white/50 leading-relaxed uppercase tracking-widest">Aumente sua produtividade financeira</p>
                  </div>
                  <button className="flex items-center gap-3 text-xs font-black text-[var(--brand-accent)] uppercase tracking-[0.2em] group/btn">
                     COMPARTILHAR AGORA
                     <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-2 transition-transform" />
                  </button>
               </div>
            </Card>

            <div className="bg-[var(--brand-accent)]/10 rounded-md p-8 border border-orange-100/50 space-y-8 shadow-sm">
               <div className="flex items-center justify-between">
                  <h4 className="font-black text-[#0c0a09] uppercase tracking-[0.2em] text-[10px] leading-none">Portabilidade</h4>
                  <AlertCircle className="h-4 w-4 text-[var(--brand-accent)]" />
               </div>
               
               <div className="p-6 bg-white rounded-md border border-orange-100 shadow-sm space-y-4 group cursor-pointer hover:border-[var(--brand-accent)] transition-colors">
                  <p className="text-sm font-black text-[#0c0a09] tracking-tight uppercase">Manutenção de Dados</p>
                  <p className="text-[10px] font-bold text-neutral-400 leading-relaxed uppercase tracking-widest">Verifique se existem chaves vinculadas a outras instituições bancárias.</p>
                  <div className="flex items-center justify-between pt-2">
                     <Badge className="bg-orange-50 text-[var(--brand-accent)] border-0 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-sm">Pendente</Badge>
                     <button className="text-[10px] font-black text-[var(--brand-accent)] hover:underline uppercase tracking-widest">REVISAR</button>
                  </div>
               </div>
            </div>
         </div>

         {/* Multi-step Modal */}
         {isAddModalOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#0c0a09]/90 backdrop-blur-md animate-in fade-in duration-300">
               <Card className="w-full max-w-md bg-white rounded-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-0">
                  <div className="p-8 space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="space-y-1">
                           <h2 className="text-2xl font-black text-[#0c0a09] tracking-tighter uppercase">
                              {step === 'CREATE' ? 'Nova Chave Pix' : 'Confirmar Chave'}
                           </h2>
                           <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                              {step === 'CREATE' ? 'Cadastre um novo endereço' : 'Valide a autoridade da sua chave'}
                           </p>
                        </div>
                        <button 
                           onClick={() => toggleModal(false)}
                           className="p-2 hover:bg-neutral-100 rounded-md transition-all h-10 w-10 flex items-center justify-center"
                        >
                           <X className="h-5 w-5 text-neutral-400" />
                        </button>
                     </div>

                     {step === 'CREATE' ? (
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-[#0c0a09] uppercase tracking-widest ml-1">Tipo de Chave</label>
                              <Select value={newKeyType} onValueChange={(val) => setNewKeyType(val || "CPF")}>
                                 <SelectTrigger className="h-14 w-full bg-neutral-50 border-neutral-100 rounded-md font-bold text-sm focus:ring-0 focus:border-[var(--brand-accent)] transition-all px-4">
                                    <SelectValue placeholder="Selecione o tipo" />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-md border-0 shadow-2xl z-[60] bg-white">
                                    <SelectItem value="CPF" className="font-bold py-3">CPF</SelectItem>
                                    <SelectItem value="EMAIL" className="font-bold py-3">E-mail</SelectItem>
                                    <SelectItem value="CELULAR" className="font-bold py-3">Celular</SelectItem>
                                    <SelectItem value="CHAVE_ALEATORIA" className="font-bold py-3">Chave Aleatória</SelectItem>
                                    <SelectItem value="CNPJ" className="font-bold py-3">CNPJ</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-[#0c0a09] uppercase tracking-widest ml-1">
                                 {newKeyType === "CHAVE_ALEATORIA" ? "Nome para Identificação (Opcional)" : "Digite a Chave"}
                              </label>
                              <Input 
                                 placeholder={
                                    newKeyType === "CPF" ? "000.000.000-00" : 
                                    newKeyType === "EMAIL" ? "exemplo@email.com" : 
                                    newKeyType === "CELULAR" ? "(11) 98888-8888" :
                                    "Digite o valor aqui..."
                                 }
                                 value={newKeyValue}
                                 onChange={(e) => setNewKeyValue(e.target.value)}
                                 className="h-14 bg-neutral-50 border-neutral-100 rounded-md font-bold text-sm placeholder:text-neutral-300 focus:ring-0 focus:border-[var(--brand-accent)] transition-all"
                              />
                           </div>

                           <div className="flex flex-col gap-3 pt-4">
                              <Button 
                                 onClick={handleCreateKey}
                                 disabled={isCreating || (!newKeyValue && newKeyType !== "CHAVE_ALEATORIA")}
                                 className="h-14 bg-[var(--brand-accent)] hover:bg-orange-600 text-white rounded-md font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
                              >
                                 {isCreating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                                 CADASTRAR CHAVE
                              </Button>
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-md border border-orange-100">
                              <ShieldCheck className="h-8 w-8 text-[var(--brand-accent)]" />
                              <div>
                                 <p className="text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-widest leading-none mb-1">Passo de Segurança</p>
                                 <p className="text-xs font-bold text-[#0c0a09]">A chave <span className="text-[var(--brand-accent)]">{keyToConfirm}</span> precisa ser validada.</p>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-[#0c0a09] uppercase tracking-widest ml-1">Código de Confirmação (Token)</label>
                              <Input 
                                 placeholder="Digite o código aqui..."
                                 value={confirmToken}
                                 onChange={(e) => setConfirmToken(e.target.value)}
                                 className="h-14 bg-neutral-50 border-neutral-100 rounded-md font-bold text-sm placeholder:text-neutral-300 focus:ring-0 focus:border-[var(--brand-accent)] transition-all text-center tracking-[0.5em]"
                              />
                              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest text-center">O código foi enviado para o contato da chave.</p>
                           </div>

                           <div className="flex flex-col gap-3 pt-4">
                              <Button 
                                 onClick={handleConfirmKey}
                                 disabled={isConfirming || !confirmToken}
                                 className="h-14 bg-[#0c0a09] hover:bg-[#1c1917] text-white rounded-md font-black uppercase tracking-[0.2em] text-[11px] shadow-lg active:scale-95 transition-all disabled:opacity-50"
                              >
                                 {isConfirming ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
                                 CONFIRMAR AUTORIDADE
                              </Button>
                              <button 
                                 onClick={() => setStep('CREATE')}
                                 className="text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-widest hover:underline"
                              >
                                 Voltar e corrigir chave
                              </button>
                           </div>
                        </div>
                     )}

                     {step === 'CREATE' && (
                        <Button 
                           variant="ghost" 
                           onClick={() => toggleModal(false)}
                           className="h-12 w-full text-neutral-400 font-black uppercase tracking-widest text-[10px] hover:text-[#0c0a09] hover:bg-transparent"
                        >
                           Cancelar
                        </Button>
                     )}
                  </div>
               </Card>
            </div>
         )}
      </div>
   );
}
