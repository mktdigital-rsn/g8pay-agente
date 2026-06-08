"use client";

import React, { useState } from "react";
import { 
  Search, 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronRight, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Smartphone,
  ExternalLink,
  LifeBuoy
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    category: "PIX",
    questions: [
      { q: "Qual meu limite diário para Pix?", a: "Seu limite diário padrão é definido com base no seu perfil de uso. Você pode gerenciar e solicitar alterações na tela de Limites Pix." },
      { q: "Quanto tempo demora para um Pix ser creditado?", a: "O Pix é instantâneo e deve ser creditado em poucos segundos na conta de destino." }
    ]
  },
  {
    category: "Segurança",
    questions: [
      { q: "O que fazer em caso de perda do celular?", a: "Entre em contato imediatamente com nossa central para bloquear o acesso à sua conta e senhas." },
      { q: "Como habilitar a biometria?", a: "Você pode habilitar o reconhecimento facial ou digital nas configurações de segurança do aplicativo mobile." }
    ]
  },
  {
    category: "Cartões",
    questions: [
      { q: "Como desbloquear meu cartão?", a: "Você pode realizar o desbloqueio diretamente pelo aplicativo G8 Pay na seção de Cartões." },
      { q: "Quais são as taxas do cartão Platinum?", a: "Nossa conta Platinum é isenta de anuidade para clientes com investimentos ou movimentação ativa." }
    ]
  }
];

export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="p-4 md:p-10 space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto">
      {/* Search Header */}
      <div className="bg-[#0c0a09] rounded-sm p-10 md:p-20 text-center space-y-8 relative overflow-hidden border border-white/5 shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand-accent)]/10 rounded-full blur-[100px] -mr-48 -mt-48" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -ml-32 -mb-32 opacity-30" />
         
         <div className="relative z-10 space-y-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white/5 rounded-sm flex items-center justify-center text-primary shadow-2xl">
                <LifeBuoy className="h-8 w-8 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight">Como podemos te ajudar?</h1>
            <p className="text-white/40 max-w-2xl mx-auto text-sm md:text-base font-medium">Encontre respostas rápidas para suas dúvidas ou entre em contato com nosso time de especialistas.</p>
            
            <div className="max-w-2xl mx-auto relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Pesquise por temas como 'Pix', 'Limites', 'Cartão'..." 
                className="bg-white/5 border-white/10 h-16 pl-16 rounded-sm text-lg font-medium focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
         </div>
      </div>

      {/* Main Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { icon: Smartphone, label: "Pix", count: 12 },
           { icon: CreditCard, label: "Cartões", count: 8 },
           { icon: ShieldCheck, label: "Segurança", count: 15 },
           { icon: FileText, label: "Taxas & Contratos", count: 5 },
         ].map((cat, i) => (
           <Card key={i} className="bg-white border-neutral-100 p-8 rounded-sm hover:shadow-2xl hover:-translate-y-1 transition-all group cursor-pointer">
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-14 h-14 bg-neutral-50 rounded-sm flex items-center justify-center text-neutral-400 group-hover:text-primary transition-colors">
                    <cat.icon className="h-7 w-7" />
                 </div>
                 <h3 className="font-black text-[#0c0a09] uppercase tracking-widest text-sm">{cat.label}</h3>
                 <Badge variant="outline" className="text-[9px] font-black text-neutral-300 group-hover:text-primary border-neutral-100 group-hover:border-primary/20">{cat.count} ARTIGOS</Badge>
              </div>
           </Card>
         ))}
      </div>

      {/* FAQs */}
      <div className="space-y-8">
        <h2 className="text-2xl font-black text-[#0c0a09] uppercase tracking-tighter flex items-center gap-3">
          Principais Dúvidas
          <HelpCircle className="h-6 w-6 text-primary" />
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <div className="space-y-6">
              {faqs.map((group, i) => i % 2 === 0 && (
                <div key={i} className="space-y-4">
                   <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-2">{group.category}</h3>
                   {group.questions.map((q, j) => (
                     <div key={j} className="bg-white border border-neutral-100 p-6 rounded-sm hover:border-primary/20 transition-all group cursor-pointer flex justify-between items-start gap-4">
                        <div className="space-y-2">
                           <p className="font-black text-[#0c0a09] text-sm uppercase leading-tight tracking-tight group-hover:text-primary transition-colors">{q.q}</p>
                           <p className="text-xs text-neutral-500 font-medium leading-relaxed font-sans">{q.a}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-200 group-hover:translate-x-1 transition-all shrink-0" />
                     </div>
                   ))}
                </div>
              ))}
           </div>
           <div className="space-y-6">
              {faqs.map((group, i) => i % 2 !== 0 && (
                <div key={i} className="space-y-4">
                   <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-2">{group.category}</h3>
                   {group.questions.map((q, j) => (
                     <div key={j} className="bg-white border border-neutral-100 p-6 rounded-sm hover:border-primary/20 transition-all group cursor-pointer flex justify-between items-start gap-4">
                        <div className="space-y-2">
                           <p className="font-black text-[#0c0a09] text-sm uppercase leading-tight tracking-tight group-hover:text-primary transition-colors">{q.q}</p>
                           <p className="text-xs text-neutral-500 font-medium leading-relaxed font-sans">{q.a}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-200 group-hover:translate-x-1 transition-all shrink-0" />
                     </div>
                   ))}
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Contact Channels */}
      <div className="bg-neutral-50 border border-neutral-100 rounded-sm p-10 mt-20">
         <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-[#0c0a09] uppercase tracking-tighter">Ainda precisa de ajuda?</h3>
               <p className="text-sm text-neutral-500 font-medium">Estamos disponíveis através dos canais abaixo.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
               <Button 
                onClick={() => window.open("https://wa.me/5551996297077", "_blank")}
                className="bg-[#0c0a09] text-white rounded-sm font-black uppercase tracking-widest h-14 px-8 flex items-center gap-3 active:scale-95 transition-all shadow-xl shadow-black/10"
               >
                 <MessageCircle className="h-5 w-5 text-primary" />
                 Conversar agora
               </Button>
               <Button 
                variant="outline" 
                onClick={() => window.open("https://wa.me/5551996297077", "_blank")}
                className="border-neutral-200 rounded-sm font-black uppercase tracking-widest h-14 px-8 flex items-center gap-3 active:scale-95 transition-all text-neutral-400"
               >
                 <Phone className="h-5 w-5 text-primary" />
                 +55 51 99629-7077
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}
