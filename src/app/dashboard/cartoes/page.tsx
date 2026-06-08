"use client";

import React, { useState } from "react";
import { currentBrand } from "@/config/brand";
import {
   CreditCard,
   ShieldCheck,
   Eye,
   EyeOff,
   Lock,
   Smartphone,
   Plus,
   ChevronRight,
   Settings2,
   AlertCircle,
   Copy,
   Info,
   ArrowRight,
   Loader2,
   CheckCircle2,
   History,
   CreditCard as CardIcon,
   Package,
   CreditCardIcon,
   Search,
   PlusCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
   DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CartoesPage() {
   const [showNumbers, setShowNumbers] = useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [step, setStep] = useState(1);
   const [newCardNickname, setNewCardNickname] = useState("");
   const [isModalOpen, setIsModalOpen] = useState(false);

   // Começa vazio para mostrar o "Estado Vazio" solicitado
   const [cards, setCards] = useState<any[]>([]);

   const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Copiado para a área de transferência!");
   };

   const handleGenerateCard = () => {
      setIsCreating(true);
      setTimeout(() => {
         const newCard = {
            id: Math.random().toString(),
            type: "virtual",
            label: newCardNickname || "Novo Cartão Virtual",
            number: `4532 ${Math.floor(1000 + Math.random() * 9000)} **** ****`,
            expiry: "12/31",
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            active: true,
            limit: 1000.00,
            spend: 0
         };
         setCards([newCard, ...cards]);
         setStep(2);
         setIsCreating(false);
         toast.success("Cartão virtual gerado com sucesso!");
      }, 2000);
   };

   const resetModal = () => {
      setIsModalOpen(false);
      setTimeout(() => {
         setStep(1);
         setNewCardNickname("");
      }, 300);
   };

   return (
      <div className="p-8 md:p-12 space-y-12 max-w-[1400px] mx-auto min-h-screen bg-[#f8f9fa] relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

         {/* Header Area */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div className="space-y-4">
               <Badge variant="secondary" className="bg-orange-600/10 text-orange-600 border-0 px-3 py-1 font-black text-[10px] uppercase tracking-[0.2em]">Gestão de Cartões</Badge>
               <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none uppercase">
                  Meus <span className="text-orange-600">CARTÕES</span>
               </h1>
               <p className="text-sm md:text-base text-neutral-400 font-bold max-w-2xl">
                  Gerencie seus cartões físicos e virtuais com segurança absoluta.
               </p>
            </div>

            <div className="flex gap-4">
               <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger className="h-14 px-8 bg-[#0c0a09] hover:bg-neutral-800 text-white rounded-sm font-black uppercase tracking-widest text-xs transition-all shadow-xl group flex items-center">
                     <Plus className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform text-white" />
                     Novo Cartão Virtual
                  </DialogTrigger>
                  <DialogContent className={`sm:max-w-[450px] p-0 overflow-hidden border-0 bg-white shadow-2xl ${currentBrand.themeClass}`}>
                     {step === 1 ? (
                        <div className="p-8 space-y-8">
                           <div className="space-y-2">
                              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Novo Cartão Virtual</DialogTitle>
                              <DialogDescription className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">
                                 Segurança máxima para suas compras online.
                              </DialogDescription>
                           </div>

                           <div className="space-y-6">
                              <div className="space-y-3">
                                 <Label htmlFor="nickname" className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Apelido do Cartão</Label>
                                 <Input
                                    id="nickname"
                                    placeholder="Ex: Compras Amazon"
                                    className="h-14 border-neutral-100 bg-neutral-50 rounded-sm font-bold focus:ring-orange-600/20 focus:border-orange-600/30 transition-all"
                                    value={newCardNickname}
                                    onChange={(e) => setNewCardNickname(e.target.value)}
                                 />
                              </div>

                              <div className="p-6 bg-orange-50 rounded-sm border border-orange-100 flex items-start gap-4">
                                 <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center shrink-0 shadow-sm">
                                    <ShieldCheck className="h-5 w-5 text-orange-600" />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-xs font-black text-orange-600 uppercase tracking-tight">Proteção Total</p>
                                    <p className="text-[10px] text-orange-800/60 font-bold leading-relaxed">
                                       Este cartão poderá ser excluído a qualquer momento após o uso.
                                    </p>
                                 </div>
                              </div>
                           </div>

                           <DialogFooter className="sm:justify-start gap-3">
                              <Button
                                 className="h-14 flex-1 bg-[#0c0a09] hover:bg-neutral-800 text-white rounded-sm font-black uppercase tracking-widest text-xs shadow-xl disabled:opacity-50"
                                 onClick={handleGenerateCard}
                                 disabled={isCreating}
                              >
                                 {isCreating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                 ) : (
                                    "Confirmar Geração"
                                 )}
                              </Button>
                              <Button
                                 variant="outline"
                                 className="h-14 flex-1 border-neutral-100 text-neutral-400 font-black uppercase tracking-widest text-xs rounded-sm"
                                 onClick={() => setIsModalOpen(false)}
                              >
                                 Cancelar
                              </Button>
                           </DialogFooter>
                        </div>
                     ) : (
                        <div className="p-12 text-center space-y-8 animate-in fade-in zoom-in duration-300">
                           <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                              <CheckCircle2 className="h-10 w-10" />
                           </div>
                           <div className="space-y-2">
                              <h3 className="text-2xl font-black uppercase tracking-tight">Cartão Gerado!</h3>
                              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                                 Seu novo cartão virtual já está pronto para uso.
                              </p>
                           </div>
                           <Button
                              className="w-full h-14 bg-[#0c0a09] hover:bg-neutral-800 text-white rounded-sm font-black uppercase tracking-widest text-xs"
                              onClick={resetModal}
                           >
                              Entendido
                           </Button>
                        </div>
                     )}
                  </DialogContent>
               </Dialog>
               <Button className="h-14 px-8 bg-[#0c0a09] hover:bg-neutral-800 text-white rounded-sm font-black uppercase tracking-widest text-xs transition-all shadow-xl group flex items-center">
                  <CreditCard className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform text-white" />
                  Solicitar Cartão Físico
               </Button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-12">

               {/* Cards Section */}
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                     <h2 className="text-xl font-black text-[#0c0a09] uppercase tracking-tight flex items-center gap-3">
                        <CreditCardIcon className="h-5 w-5 text-orange-600" />
                        Cartões Ativos
                     </h2>
                     {cards.length > 0 && (
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-neutral-100 px-2 py-1 rounded">
                           {cards.length} {cards.length === 1 ? 'Cartão' : 'Cartões'}
                        </span>
                     )}
                  </div>

                  {cards.length === 0 ? (
                     <div className="w-full bg-white border-2 border-dashed border-neutral-200 rounded-sm p-16 text-center space-y-6 group hover:border-orange-200 transition-all cursor-pointer" onClick={() => setIsModalOpen(true)}>
                        <div className="mx-auto w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300 group-hover:scale-110 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all duration-500">
                           <CreditCard className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-[#0c0a09] uppercase tracking-tight">Nenhum cartão ativo</h3>
                           <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest">Toque para solicitar o seu primeiro cartão.</p>
                        </div>
                        <Button variant="ghost" className="text-orange-600 font-black uppercase tracking-widest text-[10px] group-hover:underline">
                           Começar agora <ArrowRight className="h-3 w-3 ml-2" />
                        </Button>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {cards.map((card) => (
                           <div key={card.id} className="space-y-6">
                              <div className={`aspect-[1.586/1] w-full rounded-md p-8 relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer shadow-2xl ${card.type === "virtual"
                                 ? "bg-gradient-to-br from-neutral-900 to-black text-white"
                                 : "bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-orange-600/30 shadow-xl"
                                 }`}>
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-20" />
                                 <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                       <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md">
                                          <CreditCard className="h-6 w-6" />
                                       </div>
                                       <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{card.label}</span>
                                    </div>
                                    <div className="space-y-4">
                                       <button onClick={(e) => { e.stopPropagation(); setShowNumbers(!showNumbers); }} className="flex items-center gap-3 group">
                                          <span className="text-xl md:text-2xl font-black font-mono tracking-[0.15em] lg:tracking-[0.2em]">
                                             {showNumbers ? card.number : card.number.replace(/\d/g, "*").replace(/\s/g, " ")}
                                          </span>
                                          {showNumbers ? <EyeOff className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-all" /> : <Eye className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-all" />}
                                       </button>
                                       <div className="flex gap-8">
                                          <div className="space-y-1">
                                             <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Valid Thru</p>
                                             <p className="text-sm font-black font-mono">{card.expiry}</p>
                                          </div>
                                          <div className="space-y-1">
                                             <p className="text-[8px] font-black uppercase tracking-widest opacity-40">CVV</p>
                                             <p className="text-sm font-black font-mono">{showNumbers ? card.cvv : "***"}</p>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                       <span className="text-lg font-black tracking-tighter">G8 Bank</span>
                                       <div className="flex items-center">
                                          <div className="w-8 h-8 rounded-full bg-[#eb001b] z-10" />
                                          <div className="w-8 h-8 rounded-full bg-[#f79e1b] -ml-4 opacity-90" />
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex gap-3">
                                 <Button variant="outline" className="flex-1 h-12 border-neutral-200 text-neutral-400 hover:text-orange-600 hover:border-orange-200 bg-white font-black text-[10px] uppercase tracking-widest rounded-sm" onClick={() => copyToClipboard(card.number)}>
                                    <Copy className="h-4 w-4 mr-2" /> Copiar Dados
                                 </Button>
                                 <Button variant="outline" className="flex-1 h-12 border-neutral-200 text-neutral-400 hover:text-red-600 hover:border-red-200 bg-white font-black text-[10px] uppercase tracking-widest rounded-sm">
                                    <Lock className="h-4 w-4 mr-2" /> Bloquear
                                 </Button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* Quick Actions Grid */}
               <div className="space-y-6">
                  <h2 className="text-xl font-black text-[#0c0a09] uppercase tracking-tight flex items-center gap-3">
                     <Smartphone className="h-5 w-5 text-orange-600" />
                     Ações Rápidas
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                     {[
                        { icon: Smartphone, title: "Apple Pay", desc: "Digital", action: "Adicionar" },
                        { icon: ShieldCheck, title: "Segurança", desc: "Bloqueio", action: "Configurar" },
                        { icon: Settings2, title: "Fatura", desc: "Ciclo", action: "Ver data" },
                        { icon: History, title: "Histórico", desc: "Recent", action: "Ver tudo" }
                     ].map((item, i) => (
                        <Card key={i} className="p-6 bg-white border border-neutral-100 rounded-sm hover:border-orange-100 transition-all cursor-pointer group shadow-sm shadow-black/[0.01]">
                           <div className="flex flex-col gap-4">
                              <div className="w-10 h-10 bg-orange-50 rounded-sm flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                 <item.icon className="h-5 w-5" />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-[#0c0a09] uppercase tracking-tight">{item.title}</p>
                                 <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{item.desc}</p>
                              </div>
                              <button className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                 {item.action} <ChevronRight className="h-3 w-3" />
                              </button>
                           </div>
                        </Card>
                     ))}
                  </div>
               </div>

               {/* Recent Activity Section */}
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                     <h2 className="text-xl font-black text-[#0c0a09] uppercase tracking-tight flex items-center gap-3">
                        <History className="h-5 w-5 text-orange-600" />
                        Atividade Recente
                     </h2>
                     <button className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline">Ver tudo</button>
                  </div>
                  <div className="bg-white border border-neutral-100 rounded-sm overflow-hidden shadow-sm shadow-black/[0.01]">
                     {[
                        { title: "Compra Amazon", date: "Hoje, 14:20", amount: "- R$ 150,00", type: "virtual" },
                        { title: "Pagamento de Fatura", date: "Ontem, 09:15", amount: "- R$ 1.200,00", type: "invoice" },
                        { title: "Estorno Crédito", date: "24 Abr, 11:30", amount: "+ R$ 45,00", type: "refund" }
                     ].map((activity, i) => (
                        <div key={i} className="p-5 flex items-center justify-between hover:bg-neutral-50 transition-all border-b last:border-0 border-neutral-50 group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                                 {activity.type === 'virtual' ? <Smartphone className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-[#0c0a09] uppercase tracking-tight">{activity.title}</p>
                                 <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{activity.date}</p>
                              </div>
                           </div>
                           <p className={`text-sm font-black font-mono ${activity.amount.startsWith('-') ? 'text-[#0c0a09]' : 'text-emerald-500'}`}>
                              {activity.amount}
                           </p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Sidebar Information Area */}
            <div className="lg:col-span-4 space-y-8">
               <Card className="p-10 bg-white border border-neutral-100 rounded-sm shadow-xl shadow-black/[0.02] space-y-10">
                  <div className="space-y-4">
                     <div className="w-12 h-12 bg-green-50 rounded-sm flex items-center justify-center text-green-500">
                        <ShieldCheck className="h-6 w-6" />
                     </div>
                     <h3 className="text-2xl font-black text-[#0c0a09] uppercase tracking-tight leading-tight">Segurança Ativada</h3>
                     <p className="text-sm text-neutral-500 font-medium leading-relaxed">
                        Seus cartões G8 contam com proteção contra clonagem e seguros integrados para sua tranquilidade total.
                     </p>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-neutral-50">
                     <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-neutral-400">
                           <span>Limite de Crédito</span>
                           <span className="text-[#0c0a09]">R$ 13.500,00</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                           <div className="h-full bg-orange-600 w-[24%]" />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                           <span>Usado: R$ 3.240,00</span>
                           <span>Disponível: R$ 10.260,00</span>
                        </div>
                     </div>

                     <div className="space-y-4 pt-6 border-t border-dashed border-neutral-100">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-neutral-400">
                           <span>Limite Virtual</span>
                           <span className="text-[#0c0a09]">R$ 1.500,00</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                           <div className="h-full bg-neutral-900 w-[10%]" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <Button className="w-full h-14 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-sm font-black text-[10px] uppercase tracking-widest border border-orange-100 transition-all shadow-sm">
                        Ver minha fatura <ArrowRight className="h-4 w-4 ml-2" />
                     </Button>
                     <Button variant="ghost" className="w-full h-12 text-neutral-400 hover:text-orange-600 font-black text-[9px] uppercase tracking-widest">
                        Ajustar Limite Manualmente
                     </Button>
                  </div>
               </Card>

               <div className="p-8 bg-neutral-900 rounded-sm text-white relative overflow-hidden group cursor-pointer">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                  <div className="relative z-10 space-y-4">
                     <Badge className="bg-orange-600 text-white border-0 px-3 py-1 font-black text-[9px] uppercase tracking-widest leading-none">Indicação</Badge>
                     <h2 className="text-xl font-black uppercase leading-tight">Ganhe mais limite indicando amigos.</h2>
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Saiba como em nosso regulamento.</p>
                  </div>
               </div>

               <div className="p-6 bg-white border border-neutral-100 rounded-sm flex items-center gap-4 group cursor-pointer hover:border-orange-100 transition-all">
                  <div className="w-10 h-10 bg-neutral-50 rounded-sm flex items-center justify-center text-neutral-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                     <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                     <p className="text-xs font-black text-[#0c0a09] uppercase tracking-tight">Precisa de Ajuda?</p>
                     <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Suporte G8: 09h as 17h</p>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto text-neutral-300 group-hover:text-orange-600 transition-all" />
               </div>
            </div>
         </div>
      </div>
   );
}
