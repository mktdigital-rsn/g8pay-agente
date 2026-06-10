"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Fingerprint,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  CreditCard,
  Copy,
  CheckCircle2,
  Building,
  Key,
  Smartphone,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import api from "@/lib/api";
import { currentBrand } from "@/config/brand";

export default function ContaPage() {
  const [userData, setUserData] = useState<any>(null);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      // Fetch details from localStorage fallback for bypass/demo mode
      const localName = typeof window !== "undefined" ? localStorage.getItem("userName") : null;
      const signedContractStr = typeof window !== "undefined" ? localStorage.getItem("signedContract") : null;
      let initialName = localName || "Agente G8Pay";
      let initialEmail = "agente@g8pay.com";
      let initialCpf = "000.000.000-00";

      if (signedContractStr) {
        try {
          const contract = JSON.parse(signedContractStr);
          if (contract.fullName) initialName = contract.fullName;
          if (contract.email) initialEmail = contract.email;
          if (contract.cpf) initialCpf = contract.cpf;
        } catch (err) {}
      }

      const mockUser = {
        name: initialName,
        email: initialEmail,
        taxNumber: initialCpf,
        status: "CONTA_APROVADA",
        accountBranch: "0001",
        accountNumber: "12345-6",
        bankNumber: "389"
      };

      setUserData(mockUser);
      setBalanceData({ valor: 0 });

      try {
        const [userRes, balanceRes] = await Promise.all([
          api.get("/api/users/data").catch(() => null),
          api.get("/api/banco/saldo/getSaldo").catch(() => null)
        ]);

        if (userRes && userRes.data) {
          setUserData(userRes.data.data || userRes.data);
        }

        if (balanceRes && balanceRes.data) {
          setBalanceData(balanceRes.data.data || balanceRes.data);
        }
      } catch (err) {
        console.error("Error fetching account data from api, using local storage fallbacks:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado para a área de transferência");
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  return (
    <div className="p-4 md:p-10 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="relative group overflow-hidden bg-white border border-neutral-100 rounded-sm p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform group-hover:scale-125 duration-1000" />

        <div className="relative">
          <Avatar className="h-32 w-32 md:h-48 md:w-48 border-4 border-white shadow-2xl rounded-sm">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.name}`} />
            <AvatarFallback className="bg-primary text-white text-5xl font-black">{userData?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-sm shadow-xl border-4 border-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
          <div className="space-y-1">
            <Badge className="bg-primary text-white border-0 px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-sm">
              {userData?.status === "CONTA_APROVADA" ? "Conta Platinum Digital" : userData?.status || "Conta Digital"}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-[#0c0a09] tracking-tighter uppercase">{userData?.name}</h1>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-sm border border-neutral-100">
              <Mail className="h-4 w-4 text-neutral-400" />
              <span className="text-sm font-bold text-neutral-500">{userData?.email}</span>
            </div>
            <div className="flex items-center gap-2 bg-brand-accent/10 px-4 py-2 rounded-sm border border-brand-accent/20">
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Saldo:</span>
              <span className="text-sm font-black text-brand-accent font-mono">{formatCurrency(balanceData?.valor)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Visual Bank Card */}
            <div className="relative h-64 bg-gradient-to-br from-[#1a1715] to-[#0c0a09] rounded-sm p-8 text-white shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -ml-16 -mb-16 opacity-50" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">PLATINUM</p>
                    {currentBrand.id === "g8" ? (
                      <img src={currentBrand.logoWhite} className="h-6 object-contain brightness-0 invert" />
                    ) : (
                      <div className="flex items-center gap-1.5 select-none">
                        <img src={currentBrand.logoWhite} className="h-6 w-auto object-contain brightness-100" />
                        <span className="text-[9px] font-extrabold tracking-wider uppercase text-white font-sans">{currentBrand.name.split(" ")[0]}</span>
                      </div>
                    )}
                  </div>
                  <CreditCard className="h-8 w-8 text-primary opacity-80" />
                </div>

                <div className="space-y-4">
                  <p className="text-xl font-black tracking-[0.2em] font-mono text-white/90">••••  ••••  ••••  {userData?.accountNumber?.slice(-4) || '8829'}</p>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Titular</p>
                      <p className="text-xs font-black uppercase text-white/80">
                        {userData?.name?.split(' ')[0]} {userData?.name?.split(' ').slice(1).map(() => '****').join(' ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">EXP</p>
                      <p className="text-xs font-black text-neutral-300">12/30</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details Card */}
            <div className="bg-white p-8 rounded-sm border border-neutral-100 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary">
                    <Building className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm  font-black text-[#0c0a09] uppercase tracking-tight">Dados da Conta</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-primary/80 text-brand-accent font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-primary/5 active:scale-95 transition-all"
                  onClick={() => {
                    const msg = `Esta é minha conta no ${currentBrand.bankName}:\n\nNome: ${userData?.name}\nCPF/CNPJ: ${userData?.taxNumber}\nBanco: ${userData?.bankNumber || currentBrand.bankCode} - ${currentBrand.name}\nAgência: ${userData?.accountBranch || '0001'}\nConta: ${userData?.accountNumber}`;
                    navigator.clipboard.writeText(msg);
                    toast.success("Dados da conta formatados para compartilhamento!");
                  }}
                >
                  Compartilhar
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-sm border border-neutral-100 group cursor-pointer" onClick={() => handleCopy(userData?.bankNumber || currentBrand.bankCode, 'bank')}>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Banco</p>
                    <p className="text-sm font-black text-[#0c0a09]">{userData?.bankNumber || currentBrand.bankCode} - {currentBrand.bankName}</p>
                  </div>
                  <Copy className="h-4 w-4 text-neutral-300 group-hover:text-primary transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-sm border border-neutral-100 group cursor-pointer" onClick={() => handleCopy(userData?.accountBranch || '0001', 'agency')}>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Agência</p>
                      <p className="text-sm font-black text-[#0c0a09]">{userData?.accountBranch || '0001'}</p>
                    </div>
                    {copiedField === 'agency' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-neutral-300 group-hover:text-primary transition-colors" />}
                  </div>
                  <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-sm border border-neutral-100 group cursor-pointer" onClick={() => handleCopy(userData?.accountNumber, 'account')}>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Conta</p>
                      <p className="text-sm font-black text-[#0c0a09]">{userData?.accountNumber}</p>
                    </div>
                    {copiedField === 'account' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-neutral-300 group-hover:text-primary transition-colors" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Details Card */}
            <div className="bg-white p-8 rounded-sm border border-neutral-100 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-[#0c0a09] uppercase tracking-tighter">Dados Pessoais</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-sm border border-neutral-100 group cursor-pointer" onClick={() => handleCopy(userData?.taxNumber, 'doc')}>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Documento (CPF/CNPJ)</p>
                    <p className="text-sm font-black text-[#0c0a09]">{userData?.taxNumber}</p>
                  </div>
                  {copiedField === 'doc' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-neutral-300 group-hover:text-primary transition-colors" />}
                </div>

                <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-sm border border-neutral-100">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Mãe / Data Nasc.</p>
                    <p className="text-xs font-black text-[#0c0a09] uppercase tracking-tight">{userData?.motherName || '---'} &bull; {userData?.formatedBirthDate || '---'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Quick Actions / Configuration */}
            <div className="bg-white p-8 rounded-sm border border-neutral-100 shadow-xl space-y-8">
              <h3 className="text-lg font-black text-[#0c0a09] uppercase tracking-widest">Segurança e Acesso</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: Key, title: "Alterar Senha de Acesso", desc: "Mantenha sua conta sempre protegida" },
                  { icon: Smartphone, title: "Novo Token de Segurança", desc: "Configure seu dispositivo principal" },
                  { icon: ShieldCheck, title: "Limites de Transação", desc: "Gerencie seus limites diários e noturnos" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-sm border border-transparent hover:border-neutral-100 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neutral-50 rounded-sm flex items-center justify-center text-neutral-400 group-hover:text-primary transition-colors">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#0c0a09] uppercase tracking-tight">{item.title}</p>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Box */}
            <div className="bg-neutral-900 border border-white/5 rounded-sm p-10 text-white relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="space-y-6 relative z-10">
                <div className="w-16 h-16 bg-white/5 rounded-sm flex items-center justify-center text-primary">
                  <Info className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Precisa de Ajuda?</h3>
                  <p className="text-sm text-white/50 font-medium leading-relaxed font-sans">Nossa equipe de suporte especializado está disponível das 09h as 17h para te auxiliar em qualquer dúvida ou problema.</p>
                </div>
                <Button className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-sm font-black uppercase tracking-widest h-14 px-10">
                  Falar com Atendimento
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
