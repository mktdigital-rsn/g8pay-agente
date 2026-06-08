"use client";

import React, { useState } from "react";
import { 
  CalendarClock, 
  Search, 
  Filter, 
  ChevronRight, 
  Trash2, 
  Pencil, 
  ArrowRight,
  Clock,
  Calendar,
  Wallet,
  ArrowUpRight,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

type PaymentType = "pix" | "transfer" | "boleto" | "ted";

interface Agendamento {
  id: string;
  type: PaymentType;
  beneficiario: string;
  valor: number;
  data: string;
  status: "pending" | "failed";
  category?: string;
}

const MOCK_AGENDAMENTOS: Agendamento[] = [
  { id: "1", type: "pix", beneficiario: "Mercado Central LTDA", valor: 450.00, data: "2026-04-20", status: "pending", category: "Alimentação" },
  { id: "2", type: "boleto", beneficiario: "Condomínio Ed. Solar", valor: 1250.80, data: "2026-04-25", status: "pending", category: "Aluguel" },
  { id: "3", type: "transfer", beneficiario: "Ana Beatriz Silva", valor: 1500.00, data: "2026-05-02", status: "pending", category: "Outros" },
  { id: "4", type: "ted", beneficiario: "Investimentos S.A.", valor: 5000.00, data: "2026-04-18", status: "pending", category: "Marketing" },
];

const CATEGORIES = [
  "Alimentação",
  "Aluguel",
  "Compras",
  "Contabilidade",
  "Contas de consumo",
  "Despesas pessoais",
  "Empréstimo",
  "Estornos",
  "Faturas",
  "Impostos e encargos",
  "Marketing",
  "Outros",
  "Pagamento de fornecedor",
  "Pagamento de funcionários",
  "Retirada para própria conta PF",
  "Saque",
  "Transporte e mobilidade"
];

function StatusBadge({ valor }: { valor: number }) {
  if (valor >= 5000) {
    return (
      <Badge className="bg-purple-600/10 text-purple-600 border-0 px-2 py-0 h-5 font-black text-[9px] uppercase tracking-widest rounded-sm flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse" />
        ANALISE ESPECIAL
      </Badge>
    );
  }
  if (valor >= 1000) {
    return (
      <Badge className="bg-rose-600/10 text-rose-600 border-0 px-2 py-0 h-5 font-black text-[9px] uppercase tracking-widest rounded-sm flex items-center gap-1">
        <Clock className="h-3 w-3" />
        ALTA PRIORIDADE
      </Badge>
    );
  }
  return (
    <Badge className="bg-orange-600/10 text-orange-600 border-0 px-2 py-0 h-5 font-black text-[9px] uppercase tracking-widest rounded-sm flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" />
      AGENDADO
    </Badge>
  );
}

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(MOCK_AGENDAMENTOS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"todos" | "pix" | "transfer" | "boleto" | "ted">("todos");
  const [isAdding, setIsAdding] = useState(false);
  const [newAgendamento, setNewAgendamento] = useState<{
    type: PaymentType;
    beneficiario: string;
    valor: string;
    data: string;
    pixKey?: string;
    agency?: string;
    account?: string;
    bank?: string;
    barcode?: string;
    category?: string;
  }>({
    type: "pix",
    beneficiario: "",
    valor: "",
    data: "",
    pixKey: "",
    agency: "",
    account: "",
    bank: "",
    barcode: "",
    category: "Outros",
  });
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = agendamentos.filter(ag => {
    const matchesSearch = ag.beneficiario.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "todos" || ag.type === activeTab;
    
    let matchesDate = true;
    if (dateRange.start) {
      matchesDate = matchesDate && new Date(ag.data) >= new Date(dateRange.start);
    }
    if (dateRange.end) {
      matchesDate = matchesDate && new Date(ag.data) <= new Date(dateRange.end);
    }

    return matchesSearch && matchesTab && matchesDate;
  });

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este agendamento?")) {
      setAgendamentos(prev => prev.filter(ag => ag.id !== id));
      toast.success("Agendamento excluído com sucesso.");
    }
  };

  const handleEdit = (ag: Agendamento) => {
    setNewAgendamento({
      type: ag.type,
      beneficiario: ag.beneficiario,
      valor: formatBRL((ag.valor * 100).toFixed(0)),
      data: ag.data,
      pixKey: "",
      agency: "",
      account: "",
      bank: "",
      barcode: "",
    });
    setEditingId(ag.id);
    setIsAdding(true);
  };

  const handleAdd = () => {
    if (!newAgendamento.beneficiario || !newAgendamento.valor || !newAgendamento.data) {
      return toast.error("Preencha todos os campos.");
    }

    if (editingId) {
      setAgendamentos(prev => prev.map(a => a.id === editingId ? {
        ...a,
        type: newAgendamento.type,
        beneficiario: newAgendamento.beneficiario,
        valor: parseFloat(newAgendamento.valor.replace(/[^0-9,]/g, '').replace(',', '.')),
        data: newAgendamento.data,
        category: newAgendamento.category || "Outros"
      } : a));
      toast.success("Agendamento atualizado com sucesso!");
    } else {
      const ag: Agendamento = {
        id: Math.random().toString(36).substr(2, 9),
        type: newAgendamento.type,
        beneficiario: newAgendamento.beneficiario,
        valor: parseFloat(newAgendamento.valor.replace(/[^0-9,]/g, '').replace(',', '.')),
        data: newAgendamento.data,
        status: "pending",
        category: newAgendamento.category || "Outros"
      };
      setAgendamentos([ag, ...agendamentos]);
      toast.success("Pagamento agendado com sucesso!");
    }
    
    setIsAdding(false);
    setEditingId(null);
    setNewAgendamento({ 
      type: "pix", 
      beneficiario: "", 
      valor: "", 
      data: "",
      pixKey: "",
      agency: "",
      account: "",
      bank: "",
      barcode: "",
    });
  };

  const formatBRL = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    const numberValue = parseFloat(cleanValue) / 100;
    if (isNaN(numberValue)) return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numberValue);
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBRL(e.target.value);
    setNewAgendamento({ ...newAgendamento, valor: formatted });
  };

  return (
    <div className="p-8 md:p-12 space-y-10 max-w-[1400px] mx-auto min-h-screen bg-[#f8f9fa] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-4">
          <Badge variant="secondary" className="bg-orange-600/10 text-orange-600 border-0 px-3 py-1 font-black text-[10px] uppercase tracking-[0.2em]">Gestão Transacional</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none uppercase">
            Seus <span className="text-orange-600">AGENDAMENTOS</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-bold max-w-2xl">
            Visualize, edite ou crie novas programações de pagamento com facilidade.
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingId(null);
            setNewAgendamento({ 
              type: "pix", 
              beneficiario: "", 
              valor: "", 
              data: "",
              pixKey: "",
              agency: "",
              account: "",
              bank: "",
              barcode: "",
              category: "Outros",
            });
            setIsAdding(true);
          }}
          className="h-14 px-8 bg-black hover:bg-orange-600 text-white rounded-sm font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-orange-600/20 group"
        >
          <CalendarClock className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Filters and List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col gap-6 bg-white p-6 rounded-sm border border-neutral-100 shadow-sm relative z-20">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                <Input 
                  placeholder="Buscar por beneficiário..." 
                  className="pl-12 h-12 bg-neutral-50 border-neutral-100 rounded-sm font-bold text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-sm w-full md:w-auto overflow-x-auto no-scrollbar">
                {(["todos", "pix", "transfer", "boleto", "ted"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all whitespace-nowrap ${
                      activeTab === tab ? "bg-white text-orange-600 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-4 border-t border-neutral-50">
              <div className="flex items-center gap-2 shrink-0">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-[13px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Filtrar por Período</span>
              </div>
              <div className="flex flex-wrap xl:flex-nowrap items-center gap-4 flex-1">
                <div className="w-full m:w-30 md:w-36 lg:w-50  relative my-2">
                  <span className="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-widest z-10">De</span>
                  <Input 
                    type="date"
                    className="h-12 bg-neutral-50 border-neutral-100 rounded-sm font-black text-sm px-4 focus:bg-white focus:border-[var(--brand-accent)] transition-all w-full"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <div className="w-full sm:w-30 md:w-36 lg:w-50 relative">
                  <span className="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-widest z-10">Até</span>
                  <Input 
                    type="date"
                    className="h-12 bg-neutral-50 border-neutral-100 rounded-sm font-black text-sm px-4 focus:bg-white focus:border-[var(--brand-accent)] transition-all w-full"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
                {(dateRange.start || dateRange.end) && (
                  <button 
                    onClick={() => setDateRange({ start: "", end: "" })}
                    className="flex items-center gap-2 px-4 h-12 text-red-500 hover:bg-red-50 rounded-sm transition-colors font-black text-[10px] uppercase tracking-widest whitespace-nowrap"
                  >
                    <X className="h-4 w-4" />
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filtered.map((ag) => (
              <Card key={ag.id} className="p-6 bg-white border border-neutral-100 rounded-sm hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/10 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/40 rounded-full -mr-16 -mt-16 blur-3xl transition-transform duration-1000 group-hover:scale-150" />
                
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 min-w-max md:min-w-0 pb-2 md:pb-0">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-orange-50 rounded-sm flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shadow-sm border border-orange-100/50">
                      {ag.type === "pix" && <Smartphone className="h-6 w-6" />}
                      {ag.type === "transfer" && <ArrowUpRight className="h-6 w-6" />}
                      {ag.type === "boleto" && <Wallet className="h-6 w-6" />}
                      {ag.type === "ted" && <ArrowUpRight className="h-6 w-6 group-hover:rotate-45" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest opacity-60">{ag.type}</span>
                        <div className="w-1 h-1 bg-orange-200 rounded-full" />
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{ag.category}</span>
                        <div className="w-1 h-1 bg-orange-200 rounded-full" />
                        <StatusBadge valor={ag.valor} />
                      </div>
                      <h3 className="text-lg font-black text-[#0c0a09] uppercase tracking-tight">{ag.beneficiario}</h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Valor</p>
                      <p className="text-xl font-black text-[#0c0a09] font-mono leading-none">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ag.valor)}
                      </p>
                    </div>
                    <div className="text-right border-l border-neutral-100 pl-8">
                      <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Data</p>
                      <div className="flex items-center gap-2 text-orange-600">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs font-black uppercase tracking-widest">{new Date(ag.data).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleEdit(ag)}
                        className="w-10 h-10 flex items-center justify-center bg-neutral-50 hover:bg-orange-50 text-neutral-300 hover:text-orange-600 rounded-sm transition-all border border-neutral-100 hover:border-orange-200"
                       >
                          <Pencil className="h-4 w-4" />
                       </button>
                       <button 
                        onClick={() => handleDelete(ag.id)}
                        className="w-10 h-10 flex items-center justify-center bg-neutral-50 hover:bg-red-50 text-neutral-300 hover:text-red-600 rounded-sm transition-all border border-neutral-100 hover:border-red-200"
                       >
                          <Trash2 className="h-4 w-4" />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            ))}

            {filtered.length === 0 && (
              <div className="py-20 text-center bg-white rounded-sm border border-neutral-100 border-dashed">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-200 mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">Nenhum agendamento encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-8 bg-orange-600 text-white rounded-sm border-0 shadow-2xl shadow-orange-600/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 bg-white/10 rounded-sm flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">Total Programado</h3>
                <p className="text-4xl font-black font-mono tracking-tighter">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(filtered.reduce((acc, ag) => acc + ag.valor, 0))}
                </p>
              </div>
              <p className="text-xs font-bold text-white/60 leading-relaxed uppercase tracking-widest">
                Transações agendadas são processadas automaticamente no dia escolhido, desde que haja saldo disponível.
              </p>
            </div>
          </Card>

          <Card className="p-8 bg-white border border-neutral-100 rounded-sm shadow-sm space-y-6">
             <div className="flex items-center gap-3">
               <AlertCircle className="h-5 w-5 text-orange-600" />
               <span className="text-xs font-black text-orange-700 uppercase tracking-widest">Regras de Agendamento</span>
             </div>
             <div className="space-y-4">
               {[
                 { title: "Limite Diário", text: "Agendamentos consomem o limite do dia da execução." },
                 { title: "Horário", text: "Processamento ocorre às 10:00h do dia agendado." },
                 { title: "Saldo", text: "Caso não haja saldo, a transação será cancelada." }
               ].map((item, i) => (
                 <div key={i} className="space-y-1">
                   <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{item.title}</p>
                   <p className="text-xs font-bold text-neutral-700">{item.text}</p>
                 </div>
               ))}
             </div>
          </Card>
        </div>
      </div>

      {/* Modal Novo Agendamento */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 md:p-12 bg-[#0c0a09]/90 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-lg bg-white rounded-sm shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-sm flex items-center justify-center text-orange-600">
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-[#0c0a09] uppercase tracking-tight">
                    {editingId ? "Editar Agendamento" : "Novo Agendamento"}
                  </h2>
                  <p className="text-[9px] font-black text-orange-600 uppercase tracking-[0.2em]">Programação transacional</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="p-2 rounded-sm hover:bg-neutral-50 transition-colors text-neutral-400"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6  space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* Radio Select Tipo */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Tipo de Pagamento</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["pix", "transfer", "boleto", "ted"] as PaymentType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewAgendamento({ ...newAgendamento, type })}
                      className={`flex flex-col items-center justify-center p-4 rounded-sm border transition-all ${
                        newAgendamento.type === type 
                        ? "border-orange-600 bg-orange-50 text-orange-700 shadow-sm" 
                        : "border-neutral-100 bg-neutral-50 text-neutral-400 hover:border-orange-200"
                      }`}
                    >
                      {type === "pix" && <Smartphone className="h-5 w-5 mb-2" />}
                      {type === "transfer" && <ArrowUpRight className="h-5 w-5 mb-2" />}
                      {type === "boleto" && <Wallet className="h-5 w-5 mb-2" />}
                      {type === "ted" && <ArrowUpRight className="h-5 w-5 mb-2 group-hover:rotate-45" />}
                      <span className="text-[9px] font-black uppercase tracking-widest">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Categoria da Transação</label>
                    <select
                      value={newAgendamento.category}
                      onChange={(e) => setNewAgendamento({ ...newAgendamento, category: e.target.value })}
                      className="w-full h-14 bg-neutral-50 border border-neutral-100 rounded-sm font-black text-sm px-4 focus:bg-white focus:border-[var(--brand-accent)] transition-all outline-none appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Beneficiário / Empresa</label>
                  <Input 
                    placeholder="Nome completo ou Razão Social"
                    className="h-14 bg-neutral-50 border-neutral-100 rounded-sm font-black text-sm px-4 focus:bg-white focus:border-[var(--brand-accent)] transition-all"
                    value={newAgendamento.beneficiario}
                    onChange={(e) => setNewAgendamento({ ...newAgendamento, beneficiario: e.target.value })}
                  />
                </div>

                {/* DYNAMIC FIELDS START */}
                {newAgendamento.type === "pix" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Chave PIX</label>
                    <Input 
                      placeholder="CPF, CNPJ, E-mail, Celular ou Chave Aleatória"
                      className="h-14 bg-neutral-50 border-neutral-100 rounded-sm font-black text-sm px-4 focus:bg-white focus:border-[var(--brand-accent)] transition-all"
                      value={newAgendamento.pixKey}
                      onChange={(e) => setNewAgendamento({ ...newAgendamento, pixKey: e.target.value })}
                    />
                  </div>
                )}

                {(newAgendamento.type === "transfer" || newAgendamento.type === "ted") && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {newAgendamento.type === "ted" && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Banco Destino</label>
                        <Input 
                          placeholder="Ex: 001 - Banco do Brasil"
                          className="h-14 bg-neutral-50 border-neutral-100 rounded-sm font-black text-sm px-4 focus:bg-white focus:border-[var(--brand-accent)] transition-all"
                          value={newAgendamento.bank}
                          onChange={(e) => setNewAgendamento({ ...newAgendamento, bank: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Agência</label>
                        <Input 
                          placeholder="0001"
                          className="h-14 bg-neutral-50 border-neutral-100 rounded-sm font-black text-sm px-4 focus:bg-white focus:border-[var(--brand-accent)] transition-all"
                          value={newAgendamento.agency}
                          onChange={(e) => setNewAgendamento({ ...newAgendamento, agency: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Conta Corrente</label>
                        <Input 
                          placeholder="00000000-0"
                          className="h-14 bg-neutral-50 border-neutral-100 rounded-sm font-black text-sm px-4 focus:bg-white focus:border-[var(--brand-accent)] transition-all"
                          value={newAgendamento.account}
                          onChange={(e) => setNewAgendamento({ ...newAgendamento, account: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {newAgendamento.type === "boleto" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Linha Digitável / Código de Barras</label>
                    <Input 
                      placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                      className="h-14 bg-neutral-50 border-neutral-100 rounded-sm font-black text-sm px-4 focus:bg-white focus:border-[var(--brand-accent)] transition-all"
                      value={newAgendamento.barcode}
                      onChange={(e) => setNewAgendamento({ ...newAgendamento, barcode: e.target.value })}
                    />
                  </div>
                )}
                {/* DYNAMIC FIELDS END */}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Valor do Pagamento</label>
                    <Input 
                      placeholder="R$ 0,00"
                      className="h-14 bg-neutral-50 border-neutral-100 rounded-sm font-black text-sm px-4 focus:bg-white focus:border-[var(--brand-accent)] transition-all font-mono"
                      value={newAgendamento.valor}
                      onChange={handleValorChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Data do Pagamento</label>
                    <Input 
                      type="date"
                      className="h-14 bg-neutral-50 border-neutral-100 rounded-sm font-bold"
                      value={newAgendamento.data}
                      onChange={(e) => setNewAgendamento({ ...newAgendamento, data: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  onClick={handleAdd}
                  className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-sm font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-orange-600/20"
                >
                  {editingId ? "Salvar Alterações" : "Confirmar Agendamento"} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  variant="outline"
                  className="px-8 h-14 border-neutral-100 text-neutral-400 hover:bg-neutral-50 font-black uppercase tracking-[0.2em] text-[10px]"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
