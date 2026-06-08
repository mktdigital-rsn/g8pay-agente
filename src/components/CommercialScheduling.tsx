"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  Phone,
  Mail,
  Loader2,
  ArrowRight,
  Clock,
  Video,
  ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CommercialSchedulingProps {
  onBack: () => void;
}

export default function CommercialScheduling({ onBack }: CommercialSchedulingProps) {
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
    // Step 3: Selected Schedule Details
    selectedDate: "",
    selectedTime: ""
  });

  // Calendar dates generation (Next 14 business days)
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    let count = 0;
    
    // Scan next 30 calendar days to extract 14 business days
    for (let i = 1; i <= 30; i++) {
      if (count >= 14) break;
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      const dayOfWeek = futureDate.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(futureDate);
        count++;
      }
    }
    return dates;
  }, []);

  const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

  // Mask functions
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = raw
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
    setFormData((prev) => ({ ...prev, cpf: masked }));
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

  const handleScheduleSubmit = async () => {
    if (!formData.selectedDate || !formData.selectedTime) {
      toast.error("Por favor, selecione o dia e o horário do agendamento.");
      return;
    }
    setLoading(true);
    // Simulate booking save
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    setFinished(true);
    toast.success("Reunião agendada com sucesso!");
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(date);
  };

  if (finished) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#0c0a09] theme-g8">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[650px] bg-[#18181b] border border-white/5 p-8 md:p-12 text-center rounded-[2px] shadow-2xl relative z-10 space-y-8"
        >
          <div className="relative flex justify-center">
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-brand-accent/30 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-brand-accent" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tight">Agendamento Confirmado!</h2>
            <p className="text-neutral-300 text-sm md:text-base max-w-lg mx-auto">
              Sua reunião de demonstração comercial foi agendada com sucesso para <strong>{formatDisplayDate(formData.selectedDate)}</strong> às <strong>{formData.selectedTime}h</strong>.
            </p>
            
            <div className="bg-[#141416] border border-white/5 p-5 rounded-sm max-w-md mx-auto space-y-3 text-left">
              <div className="flex items-center gap-3 text-xs">
                <Video className="h-5 w-5 text-brand-accent shrink-0" />
                <div>
                  <span className="text-neutral-500 block">Link da Reunião (Google Meet):</span>
                  <a href="https://meet.google.com/new" target="_blank" rel="noreferrer" className="text-brand-accent hover:underline inline-flex items-center gap-1 font-bold">
                    meet.google.com/g8pay-agendamento <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="h-[1px] bg-white/5" />
              <div className="flex items-center gap-3 text-xs">
                <Mail className="h-5 w-5 text-neutral-400 shrink-0" />
                <p className="text-neutral-400">
                  Um convite de calendário foi enviado para <strong>{formData.email}</strong> e a conta de destino <strong>mktdigital.rsn@gmail.com</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={onBack}
              className="w-full h-14 font-black tracking-widest text-white bg-brand-accent hover:bg-brand-accent-hover rounded-[2px] transition-all shadow-lg"
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
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[800px] bg-[#18181b] border border-white/5 rounded-[2px] overflow-hidden shadow-2xl relative z-10 flex flex-col md:min-h-[550px]"
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
              <h2 className="text-xl font-black text-white tracking-tight">Agendamento Comercial</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">G8pay Comercial</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-neutral-400">Passo</span>
            <div className="text-2xl font-black text-brand-accent">{step} <span className="text-white/20 text-sm">/ 3</span></div>
          </div>
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
                    <p className="text-xs text-neutral-400">Preencha com seus dados para darmos início ao contato comercial.</p>
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
                        onChange={handleCpfChange}
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
                    <p className="text-xs text-neutral-400">Insira seu endereço completo (digite o CEP para busca automática).</p>
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
                <div className="space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="text-lg font-bold text-white">Agendar Data e Horário</h3>
                    <p className="text-xs text-neutral-400 text-brand-accent">Selecione uma data comercial e horário com mktdigital.rsn@gmail.com</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date Picker Grid */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-brand-accent" /> Escolha o Dia
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                        {availableDates.map((date, idx) => {
                          const isoDate = date.toISOString().split("T")[0];
                          const isSelected = formData.selectedDate === isoDate;
                          const formattedLabel = date.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short"
                          });
                          const weekdayLabel = date.toLocaleDateString("pt-BR", {
                            weekday: "short"
                          }).replace(".", "");

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, selectedDate: isoDate }))}
                              className={`p-3 border rounded-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-brand-accent border-brand-accent text-white shadow-md shadow-brand-accent/20"
                                  : "bg-white/[0.02] border-white/10 text-neutral-300 hover:border-brand-accent/50"
                              }`}
                            >
                              <span className="text-[10px] uppercase font-semibold text-neutral-400 group-hover:text-white leading-none">
                                {weekdayLabel}
                              </span>
                              <span className="text-base font-black mt-1">
                                {formattedLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots List */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-brand-accent" /> Horários Disponíveis
                      </label>
                      {formData.selectedDate ? (
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map((time, idx) => {
                            const isSelected = formData.selectedTime === time;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, selectedTime: time }))}
                                className={`p-3 border text-sm font-bold rounded-sm text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-brand-accent border-brand-accent text-white shadow-md"
                                    : "bg-white/[0.02] border-white/10 text-neutral-300 hover:border-brand-accent/50"
                                }`}
                              >
                                {time} h
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center border border-dashed border-white/10 text-center p-4 bg-white/[0.01]">
                          <span className="text-xs text-neutral-500 font-bold">Por favor, selecione primeiro um dia no calendário ao lado.</span>
                        </div>
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
            {step < 3 ? (
              <Button
                onClick={handleNext}
                className="flex-1 h-12 font-bold tracking-wider text-white bg-brand-accent hover:bg-brand-accent-hover rounded-[2px] transition-all cursor-pointer"
              >
                Avançar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleScheduleSubmit}
                disabled={loading}
                className="flex-1 h-12 font-black tracking-widest text-white bg-gradient-to-r from-brand-accent to-brand-secondary hover:brightness-110 rounded-[2px] transition-all cursor-pointer shadow-lg shadow-brand-accent/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    SALVANDO AGENDAMENTO...
                  </>
                ) : (
                  "AGENDAR REUNIÃO"
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
