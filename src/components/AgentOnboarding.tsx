"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  User,
  MapPin,
  Users,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  Loader2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgentOnboardingProps {
  onBack: () => void;
}

export default function AgentOnboarding({ onBack }: AgentOnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Personal Data
    fullName: "",
    cpf: "",
    birthDate: "",
    email: "",
    whatsapp: "",
    // Step 2: Complementary Address Data
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    // Step 3: Referral Data
    hasReferral: false,
    referrerName: "",
    referrerCpf: ""
  });

  // Mask functions
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>, field: "cpf" | "referrerCpf") => {
    const raw = e.target.value;
    const masked = raw
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
    setFormData((prev) => ({ ...prev, [field]: masked }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = raw
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
    setFormData((prev) => ({ ...prev, whatsapp: masked }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = raw
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 10);
    setFormData((prev) => ({ ...prev, birthDate: masked }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.slice(0, 9);
    const masked = raw.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2");
    setFormData((prev) => ({ ...prev, cep: masked }));

    const cleanCep = masked.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || ""
          }));
          toast.success("Endereço preenchido com sucesso!");
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch (err) {
        toast.error("Erro ao buscar o CEP.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.cpf || !formData.birthDate || !formData.email || !formData.whatsapp) {
        toast.error("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
      if (formData.cpf.length < 14) {
        toast.error("CPF inválido.");
        return;
      }
      if (formData.birthDate.length < 10) {
        toast.error("Data de nascimento inválida.");
        return;
      }
    } else if (step === 2) {
      if (!formData.cep || !formData.street || !formData.number || !formData.neighborhood || !formData.city || !formData.state) {
        toast.error("Por favor, preencha todos os campos do endereço.");
        return;
      }
    } else if (step === 3) {
      if (formData.hasReferral) {
        if (!formData.referrerName || !formData.referrerCpf) {
          toast.error("Preencha o nome e o CPF do indicador.");
          return;
        }
        if (formData.referrerCpf.length < 14) {
          toast.error("CPF do indicador inválido.");
          return;
        }
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      onBack();
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API registration request
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    setFinished(true);
    toast.success("Cadastro realizado com sucesso!");
  };

  const stepsInfo = [
    { title: "Dados Pessoais", icon: User },
    { title: "Endereço", icon: MapPin },
    { title: "Indicação", icon: Users },
    { title: "Conclusão", icon: CheckCircle2 }
  ];

  if (finished) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#0c0a09] theme-g8">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[600px] bg-[#18181b] border border-white/5 p-8 md:p-12 text-center rounded-[2px] shadow-2xl relative z-10 space-y-8"
        >
          <div className="relative flex justify-center">
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center relative"
            >
              <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 bg-brand-accent text-white p-1 rounded-full">
                <Sparkles className="h-4 w-4" />
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tight">Cadastro Concluído!</h2>
            <p className="text-neutral-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              Parabéns, <strong>{formData.fullName}</strong>! Seus dados foram cadastrados em nossa base de agentes parceiros G8Pay.
            </p>
            <p className="text-neutral-500 text-xs max-w-sm mx-auto">
              Em breve nossa equipe entrará em contato via WhatsApp no número <strong>{formData.whatsapp}</strong> para finalizar sua ativação e envio de materiais.
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={onBack}
              className="w-full h-14 font-black tracking-widest text-white bg-brand-accent hover:bg-brand-accent-hover rounded-[2px] transition-all shadow-lg shadow-brand-accent/20"
            >
              VOLTAR À TELA INICIAL
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#0c0a09] theme-g8">
      {/* Background Blur Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[750px] bg-[#18181b] border border-white/5 rounded-[2px] overflow-hidden shadow-2xl relative z-10 flex flex-col md:min-h-[550px]"
      >
        {/* Onboarding Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-primary/10 to-transparent border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/5 rounded-full transition-colors group cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6 text-white/50 group-hover:text-white" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Torne-se um Agente</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">G8pay Negócios</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-neutral-400">Passo</span>
            <div className="text-2xl font-black text-brand-accent">{step} <span className="text-white/20 text-sm">/ 4</span></div>
          </div>
        </div>

        {/* Multi-Step Tracker */}
        <div className="px-6 md:px-8 py-4 bg-[#141416] border-b border-white/5 flex justify-between items-center overflow-x-auto no-scrollbar gap-4">
          {stepsInfo.map((info, idx) => {
            const Icon = info.icon;
            const isCompleted = step > idx + 1;
            const isActive = step === idx + 1;

            return (
              <div key={idx} className="flex items-center gap-2.5 min-w-max">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border font-bold text-xs ${
                    isCompleted
                      ? "bg-brand-accent/20 border-brand-accent text-brand-accent"
                      : isActive
                      ? "bg-brand-accent text-white border-brand-accent shadow-[0_0_10px_var(--brand-accent)]"
                      : "bg-[#18181b] border-white/10 text-neutral-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isActive ? "text-white" : "text-neutral-500"
                  }`}
                >
                  {info.title}
                </span>
                {idx < 3 && <div className="h-[1px] w-8 bg-white/5" />}
              </div>
            );
          })}
        </div>

        {/* Step Body */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 flex-1"
            >
              {step === 1 && (
                <div className="space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="text-lg font-bold text-white">Dados Pessoais</h3>
                    <p className="text-xs text-neutral-400">Preencha com suas informações de identificação.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Nome Completo</label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Insira seu nome completo"
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">CPF</label>
                      <Input
                        value={formData.cpf}
                        onChange={(e) => handleCpfChange(e, "cpf")}
                        placeholder="000.000.000-00"
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Data de Nascimento</label>
                      <Input
                        value={formData.birthDate}
                        onChange={handleDateChange}
                        placeholder="DD/MM/AAAA"
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">E-mail</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@exemplo.com"
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">WhatsApp</label>
                      <Input
                        value={formData.whatsapp}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="text-lg font-bold text-white">Dados Complementares</h3>
                    <p className="text-xs text-neutral-400">Insira seu endereço completo (digite o CEP para preenchimento automático).</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">CEP</label>
                      <div className="relative">
                        <Input
                          value={formData.cep}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                        />
                        {loading && (
                          <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-brand-accent" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Logradouro / Rua</label>
                      <Input
                        value={formData.street}
                        onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                        placeholder="Rua, Avenida, etc."
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Número</label>
                      <Input
                        value={formData.number}
                        onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
                        placeholder="123"
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Complemento</label>
                      <Input
                        value={formData.complement}
                        onChange={(e) => setFormData((prev) => ({ ...prev, complement: e.target.value }))}
                        placeholder="Apto, Bloco, etc. (Opcional)"
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bairro</label>
                      <Input
                        value={formData.neighborhood}
                        onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))}
                        placeholder="Bairro"
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Cidade</label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="Cidade"
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                        disabled
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">UF / Estado</label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                        placeholder="SP, RJ, etc."
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="text-lg font-bold text-white">Regra de Indicação</h3>
                    <p className="text-xs text-neutral-400">Nos conte se você está chegando por intermédio de um consultor G8Pay.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Você foi indicado por um agente ou consultor G8Pay?</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, hasReferral: true }))}
                        className={`flex-1 h-14 border font-bold uppercase text-xs tracking-wider rounded-[2px] transition-all cursor-pointer ${
                          formData.hasReferral
                            ? "bg-brand-accent border-brand-accent text-white"
                            : "bg-white/[0.02] border-white/10 text-neutral-400 hover:bg-white/[0.05]"
                        }`}
                      >
                        Sim, fui indicado
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, hasReferral: false }))}
                        className={`flex-1 h-14 border font-bold uppercase text-xs tracking-wider rounded-[2px] transition-all cursor-pointer ${
                          !formData.hasReferral
                            ? "bg-brand-accent border-brand-accent text-white"
                            : "bg-white/[0.02] border-white/10 text-neutral-400 hover:bg-white/[0.05]"
                        }`}
                      >
                        Não, conheci por conta própria
                      </button>
                    </div>

                    <AnimatePresence>
                      {formData.hasReferral && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 overflow-hidden"
                        >
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Nome do Indicador</label>
                            <Input
                              value={formData.referrerName}
                              onChange={(e) => setFormData((prev) => ({ ...prev, referrerName: e.target.value }))}
                              placeholder="Nome completo do padrinho"
                              className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">CPF do Indicador</label>
                            <Input
                              value={formData.referrerCpf}
                              onChange={(e) => handleCpfChange(e, "referrerCpf")}
                              placeholder="000.000.000-00"
                              className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="text-lg font-bold text-white">Confirmação dos Dados</h3>
                    <p className="text-xs text-neutral-400">Confira com calma todas as informações fornecidas.</p>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Component 1: Personal Summary */}
                    <div className="bg-[#141416] p-4 border border-white/5 rounded-sm space-y-2">
                      <h4 className="text-xs font-black uppercase text-brand-accent tracking-widest flex items-center gap-2">
                        <User className="h-4 w-4" /> Dados Pessoais
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-neutral-500">Nome:</span> <p className="text-white font-bold">{formData.fullName}</p></div>
                        <div><span className="text-neutral-500">CPF:</span> <p className="text-white font-bold">{formData.cpf}</p></div>
                        <div><span className="text-neutral-500">Data de Nasc.:</span> <p className="text-white font-bold">{formData.birthDate}</p></div>
                        <div><span className="text-neutral-500">WhatsApp:</span> <p className="text-white font-bold">{formData.whatsapp}</p></div>
                        <div className="col-span-2"><span className="text-neutral-500">E-mail:</span> <p className="text-white font-bold">{formData.email}</p></div>
                      </div>
                    </div>

                    {/* Component 2: Address Summary */}
                    <div className="bg-[#141416] p-4 border border-white/5 rounded-sm space-y-2">
                      <h4 className="text-xs font-black uppercase text-brand-accent tracking-widest flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Endereço
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="col-span-2"><span className="text-neutral-500">Logradouro:</span> <p className="text-white font-bold">{formData.street}, {formData.number} {formData.complement ? `- ${formData.complement}` : ""}</p></div>
                        <div><span className="text-neutral-500">Bairro:</span> <p className="text-white font-bold">{formData.neighborhood}</p></div>
                        <div><span className="text-neutral-500">CEP:</span> <p className="text-white font-bold">{formData.cep}</p></div>
                        <div><span className="text-neutral-500">Cidade:</span> <p className="text-white font-bold">{formData.city}</p></div>
                        <div><span className="text-neutral-500">UF / Estado:</span> <p className="text-white font-bold">{formData.state}</p></div>
                      </div>
                    </div>

                    {/* Component 3: Indication Summary */}
                    <div className="bg-[#141416] p-4 border border-white/5 rounded-sm space-y-2">
                      <h4 className="text-xs font-black uppercase text-brand-accent tracking-widest flex items-center gap-2">
                        <Users className="h-4 w-4" /> Canal de Entrada
                      </h4>
                      {formData.hasReferral ? (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="col-span-2"><span className="text-neutral-500">Forma:</span> <p className="text-emerald-400 font-bold">Indicado por Parceiro</p></div>
                          <div><span className="text-neutral-500">Indicador:</span> <p className="text-white font-bold">{formData.referrerName}</p></div>
                          <div><span className="text-neutral-500">CPF do Indicador:</span> <p className="text-white font-bold">{formData.referrerCpf}</p></div>
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-neutral-400">Sem indicação direta. (Conheceu a G8Pay de forma espontânea)</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-12 border-white/10 text-neutral-400 hover:text-white cursor-pointer px-6"
            >
              Voltar
            </Button>
            {step < 4 ? (
              <Button
                onClick={handleNext}
                className="flex-1 h-12 font-bold tracking-wider text-white bg-brand-accent hover:bg-brand-accent-hover rounded-[2px] transition-all cursor-pointer"
              >
                Avançar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-12 font-black tracking-widest text-white bg-gradient-to-r from-brand-accent to-brand-secondary hover:brightness-110 rounded-[2px] transition-all cursor-pointer shadow-lg shadow-brand-accent/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    CONCLUINDO CADASTRO...
                  </>
                ) : (
                  "CONFIRMAR E CONCLUIR"
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
