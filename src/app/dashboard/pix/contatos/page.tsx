"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Search, 
  Contact2,
  Star,
  Send,
  Trash2,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { currentBrand } from "@/config/brand";

export default function PixContatosPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/banco/pix/contatos");
      if (res.data) {
        setContacts(res.data);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
      toast.error("Erro ao carregar contatos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const confirmDelete = async () => {
    if (!contactToDelete) return;

    try {
      await api.delete("/api/banco/pix/remover-contato", {
        data: { chaveId: contactToDelete.id }
      });
      toast.success("Contato removido com sucesso!");
      setContactToDelete(null);
      fetchContacts();
    } catch (err: any) {
      console.error("Error deleting contact:", err);
      const msg = err.response?.data?.message || err.message || "Erro ao remover contato.";
      toast.error(msg);
    }
  };

  const handleSendPix = (c: any) => {
    router.push(`/dashboard/pix/pagar?type=key&key=${encodeURIComponent(c.chave)}&name=${encodeURIComponent(c.nome)}&bank=${encodeURIComponent(c.instituicao || "")}`);
  };

  const sortedContacts = [...contacts].sort((a, b) => 
    (a.nome || "").localeCompare(b.nome || "", "pt-BR")
  );

  const availableLetters = Array.from(
    new Set(
      contacts
        .map(c => (c.nome ? c.nome.charAt(0).toUpperCase() : ""))
        .filter(Boolean)
    )
  ).sort();

  const filteredContacts = sortedContacts.filter(c => {
    const matchesSearch = (c.nome?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.chave?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.instituicao?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const matchesLetter = selectedLetter 
      ? (c.nome?.charAt(0).toUpperCase() === selectedLetter) 
      : true;

    return matchesSearch && matchesLetter;
  });

  const favorites = [...contacts].slice(0, 4).sort((a, b) => 
    (a.nome || "").localeCompare(b.nome || "", "pt-BR")
  );

  return (
    <div className="bg-[#f8f9fa] rounded-[32px] p-6 md:p-10 border border-neutral-200/60 space-y-10 relative">
      {/* Background Decorativo */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[var(--brand-accent)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 relative z-10">
        <div className="flex items-start gap-4 w-full">
          <Link href="/dashboard/pix" className="mt-1">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-neutral-200/50 h-12 w-12 shrink-0 border border-neutral-200/80 bg-white shadow-sm transition-all">
               <ArrowLeft className="h-6 w-6 text-[var(--brand-accent)]" />
            </Button>
          </Link>
          <div className="space-y-4 flex-1">
             <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0 px-3 py-1 font-black text-[10px] uppercase tracking-[0.2em]">G8Pay • Pix</Badge>
             <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none uppercase flex items-center gap-3 flex-wrap">
               Favoritos & <span className="text-[var(--brand-accent)]">Contatos</span>
               <Contact2 className="h-10 w-10 text-[var(--brand-accent)] stroke-[2.5]" />
             </h1>
             <p className="text-sm md:text-base text-neutral-400 font-bold max-w-2xl">
               Gerencie seus contatos frequentes e realize transferências com apenas um clique.
             </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
        {/* Coluna Principal */}
        <main className="lg:col-span-8 space-y-10">
          {/* Campo de Busca Inteligente */}
          <div className="relative group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-[var(--brand-accent)] transition-colors" />
             <Input 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Pesquisar por nome, chave ou banco..." 
               className={
                 currentBrand.id !== "g8"
                   ? "h-16 bg-white/100 border border-neutral-200/80 rounded-2xl pl-16 pr-8 focus:ring-4 focus:ring-[var(--brand-accent)]/10 focus:border-[var(--brand-accent)] transition-all shadow-sm font-semibold text-lg text-neutral-800"
                   : "h-16 bg-white border border-neutral-200/80 rounded-2xl pl-16 pr-8 focus:ring-4 focus:ring-[var(--brand-accent)]/10 focus:border-[var(--brand-accent)] transition-all shadow-sm font-bold text-lg text-[#0c0a09]"
               }
             />
          </div>

          {/* Seção de Favoritos */}
          {favorites.length > 0 && (
            <div className="space-y-6">
               <h3 className="text-xs font-black text-[#0c0a09]/50 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                 <Star size={12} className="text-yellow-400 fill-yellow-400" />
                 Favoritos Frequentes
               </h3>
               <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                  {favorites.map(c => (
                     <div 
                       key={c.id} 
                       onClick={() => handleSendPix(c)}
                       className="flex flex-col items-center gap-3 group cursor-pointer shrink-0"
                     >
                        <div className="relative">
                           <div className="w-24 h-24 rounded-[28px] bg-white border border-neutral-200/50 group-hover:border-[var(--brand-accent)] group-hover:scale-105 p-1.5 transition-all shadow-md group-hover:shadow-orange-500/10">
                              <div className="w-full h-full rounded-[20px] bg-orange-500/5 flex items-center justify-center font-black text-2xl text-[var(--brand-accent)] overflow-hidden relative">
                                 {c.nome ? c.nome.charAt(0).toUpperCase() : "?"}
                              </div>
                           </div>
                           <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-white border-4 border-white shadow-md ring-white">
                              <Star className="h-2.5 w-2.5 fill-white" />
                           </div>
                        </div>
                        <div className="text-center w-24">
                           <p className="text-xs font-black text-[#0c0a09] truncate group-hover:text-[var(--brand-accent)] transition-colors uppercase">{c.nome}</p>
                           <p className="text-[9px] text-neutral-400 font-bold uppercase truncate">{c.instituicao || "PIX"}</p>
                        </div>
                     </div>
                  ))}
                </div>
             </div>
           )}

           {/* Lista Geral de Contatos */}
           <div className="space-y-6">
             <h3 className="text-xs font-black text-[#0c0a09]/50 uppercase tracking-[0.2em] px-2">Todos os Contatos</h3>

             {/* Filtro Alfabético Rápido (A-Z) */}
             {availableLetters.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 px-2">
                   <button
                     onClick={() => setSelectedLetter(null)}
                     className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                       !selectedLetter 
                         ? "bg-[var(--brand-accent)] text-white border-[var(--brand-accent)] shadow-md shadow-orange-500/10" 
                         : "bg-white text-neutral-400 border-neutral-200/60 hover:text-[var(--brand-accent)] hover:border-orange-200"
                     }`}
                   >
                      Todos
                   </button>
                   {availableLetters.map(letter => (
                      <button
                        key={letter}
                        onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                        className={`w-10 h-10 shrink-0 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center justify-center ${
                          selectedLetter === letter 
                            ? "bg-[var(--brand-accent)] text-white border-[var(--brand-accent)] shadow-md shadow-orange-500/10" 
                            : "bg-white text-neutral-400 border-neutral-200/60 hover:text-[var(--brand-accent)] hover:border-orange-200"
                        }`}
                      >
                         {letter}
                      </button>
                   ))}
                </div>
             )}

             {isLoading ? (
               <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200/50 shadow-sm">
                 <p className="text-neutral-400 font-black uppercase tracking-widest text-xs animate-pulse">Carregando contatos...</p>
               </div>
             ) : filteredContacts.length === 0 ? (
               <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200/50 shadow-sm space-y-3">
                 <p className="text-neutral-400 font-black uppercase tracking-widest text-sm">Nenhum contato encontrado</p>
                 <p className="text-xs text-neutral-400 font-medium leading-relaxed">Você pode salvar contatos ativando a caixinha "Salvar contato" ao realizar um Pix.</p>
               </div>
             ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
                    {filteredContacts.map(c => (
                       <div 
                         key={c.id} 
                         onClick={() => handleSendPix(c)}
                         className="relative p-5 xl:p-6 bg-white rounded-3xl border border-neutral-200/60 shadow-sm hover:shadow-md hover:border-orange-200/80 transition-all cursor-pointer group flex flex-row xl:flex-col items-center gap-4 xl:gap-3 justify-start xl:justify-between min-h-0 xl:min-h-[220px]"
                       >
                          {/* Avatar da Letra */}
                          <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-orange-500/5 border border-orange-100/50 flex items-center justify-center font-black text-xl text-[var(--brand-accent)] group-hover:scale-105 transition-transform shrink-0 xl:mb-1">
                             {c.nome ? c.nome.charAt(0).toUpperCase() : "?"}
                          </div>

                          {/* Informações do Contato */}
                          <div className="flex-1 flex flex-col xl:items-center text-left xl:text-center min-w-0">
                             <p className="font-black text-base text-[#0c0a09] leading-tight mb-1 xl:mb-2 group-hover:text-[var(--brand-accent)] transition-colors break-words max-w-full xl:max-w-[150px] uppercase line-clamp-1 xl:line-clamp-2">
                                {c.nome}
                             </p>
                             <div className="flex items-center xl:flex-col gap-2 xl:gap-1.5 flex-wrap">
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide truncate max-w-[140px]">
                                   {c.instituicao || "Instituição PIX"}
                                </p>
                                <div className="w-1 h-1 bg-neutral-200 rounded-full shrink-0 xl:hidden" />
                                <Badge variant="secondary" className="bg-[var(--brand-accent)]/5 text-[var(--brand-accent)] text-[8px] font-black tracking-widest uppercase py-0.5 px-2 border-0 shrink-0">
                                   PIX
                                </Badge>
                             </div>
                          </div>

                          {/* Botão de Opções (3 Pontinhos) */}
                          <div className="relative xl:absolute xl:top-3 xl:right-3 shrink-0">
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setActiveMenuId(activeMenuId === c.id ? null : c.id);
                               }}
                               className="h-8 w-8 rounded-xl text-neutral-400 hover:text-[var(--brand-accent)] hover:bg-neutral-100 transition-all flex items-center justify-center"
                               title="Opções"
                             >
                                <MoreVertical className="h-4 w-4" />
                             </Button>

                             {activeMenuId === c.id && (
                                <>
                                  {/* Backdrop invisível para fechar menu ao clicar fora */}
                                  <div 
                                    className="fixed inset-0 z-20 cursor-default" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                    }}
                                  />
                                  <div className="absolute right-0 top-9 w-40 bg-white border border-neutral-200/80 rounded-2xl shadow-xl py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         setActiveMenuId(null);
                                         handleSendPix(c);
                                       }}
                                       className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider text-neutral-700 hover:text-[var(--brand-accent)] hover:bg-neutral-50 transition-all flex items-center gap-2"
                                     >
                                        <Send className="h-3.5 w-3.5" />
                                        Enviar Pix
                                     </button>
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         setActiveMenuId(null);
                                         setContactToDelete(c);
                                       }}
                                       className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2"
                                     >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Excluir
                                     </button>
                                  </div>
                                </>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </main>

        {/* Coluna Lateral */}
        <aside className="lg:col-span-4 space-y-8">
           <div className="rounded-3xl border-0 bg-neutral-900 p-8 text-white relative overflow-hidden group shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-accent)]/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                 <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center p-4 group-hover:rotate-12 transition-transform duration-500">
                    <Star className="h-full w-full text-yellow-400 fill-yellow-400" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="font-black text-xl tracking-tight">Organize seus Pagamentos</h3>
                    <p className="text-xs font-bold text-white/50 px-2 leading-relaxed">Adicione seus contatos mais frequentes aos favoritos para fazer um Pix em menos de <span className="text-white font-black">5 segundos</span>.</p>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-3xl border border-neutral-200/60 shadow-sm space-y-6">
              <h4 className="font-black text-[#0c0a09]/50 uppercase tracking-widest text-[10px]">Busca Inteligente</h4>
              <div className="space-y-4">
                 <p className="text-xs text-neutral-400 font-bold leading-relaxed">Agora você pode buscar contatos também pelo Banco ou pelo final do CPF cadastrado.</p>
                 <button className="text-[10px] font-black text-[var(--brand-accent)] border-b-2 border-[var(--brand-accent)]/10 hover:border-[var(--brand-accent)] transition-colors pb-0.5 uppercase tracking-widest">Saber Mais</button>
              </div>
           </div>
        </aside>
      </div>

      <Dialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <DialogContent className="sm:max-w-[440px] p-8 md:p-10 overflow-hidden border-0 bg-white shadow-2xl rounded-[32px] gap-0">
          <div className="flex flex-col space-y-8 w-full">
            {/* Ícone de Alerta Centralizado */}
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 ring-8 ring-rose-500/5 mb-1 select-none">
              <Trash2 className="h-7 w-7 animate-bounce [animation-duration:2s]" />
            </div>

            {/* Título e Descrição */}
            <div className="text-center space-y-2.5">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-[#0c0a09]">
                Excluir Contato
              </DialogTitle>
              <DialogDescription className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                Essa ação é permanente e não poderá ser desfeita.
              </DialogDescription>
            </div>

            {/* Card com Detalhes do Contato */}
            {contactToDelete && (
              <div className="p-6 bg-gradient-to-r from-rose-500/5 to-rose-500/[0.02] border border-rose-100 rounded-2xl flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-[var(--brand-accent)] text-white flex items-center justify-center font-black text-2xl shadow-md shadow-rose-500/20 shrink-0">
                  {contactToDelete.nome ? contactToDelete.nome.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-black text-base text-[#0c0a09] truncate uppercase leading-tight">
                    {contactToDelete.nome}
                  </p>
                  <p className="text-[10px] text-rose-600/70 font-bold uppercase tracking-widest mt-1">
                    {contactToDelete.instituicao || "Instituição PIX"}
                  </p>
                </div>
              </div>
            )}

            {/* Rodapé com Botões de Ação */}
            <div className="flex flex-row gap-3 w-full">
              <Button
                variant="ghost"
                className="h-14 flex-1 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-500 hover:text-neutral-700 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border-0"
                onClick={() => setContactToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                className="h-14 flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02]"
                onClick={confirmDelete}
              >
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
