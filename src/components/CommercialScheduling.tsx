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
import api from "@/lib/api";
import { currentBrand } from "@/config/brand";

const YellowTriangleRedQuestion = () => (
  <svg 
    viewBox="0 0 24 24" 
    className="h-3.5 w-3.5 shrink-0 inline-block mr-1.5 align-middle"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 3L2 21H22L12 3Z" 
      fill="#F59E0B"
    />
    <text 
      x="12" 
      y="17.5" 
      fill="#EF4444"
      fontSize="14" 
      fontWeight="900" 
      textAnchor="middle"
      fontFamily="sans-serif"
    >?</text>
  </svg>
);

interface CommercialSchedulingProps {
  onBack: () => void;
}

export default function CommercialScheduling({ onBack }: CommercialSchedulingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const isEmbeddable = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL || "";
    return (
      url.includes("calendar.google.com/calendar/appointments/schedules/") ||
      url.includes("calendar.google.com/appointments/schedules/") ||
      url.includes("calendar.app.google") ||
      url.includes("calendly.com")
    );
  }, []);

  const embedUrl = useMemo(() => {
    let url = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL || "";
    if ((url.includes("calendar.google.com") || url.includes("calendar.app.google")) && !url.includes("gv=true")) {
      url = url.includes("?") ? `${url}&gv=true` : `${url}?gv=true`;
    }
    return url;
  }, []);

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
    const v = raw.replace(/\D/g, "");
    let masked = "";
    if (v.length <= 11) {
      masked = v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .slice(0, 14);
    } else {
      masked = v
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})/, "$1-$2")
        .slice(0, 18);
    }
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
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = "Nome completo é obrigatório.";
      }
      if (!formData.cpf) {
        newErrors.cpf = "CPF ou CNPJ é obrigatório.";
      } else {
        const cleanVal = formData.cpf.replace(/\D/g, "");
        if (cleanVal.length !== 11 && cleanVal.length !== 14) {
          newErrors.cpf = "Documento (CPF ou CNPJ) inválido.";
        }
      }
      if (!formData.birthDate) {
        newErrors.birthDate = "Data de nascimento é obrigatória.";
      } else if (formData.birthDate.length < 10) {
        newErrors.birthDate = "Data de nascimento inválida.";
      }
      if (!formData.email.trim()) {
        newErrors.email = "E-mail é obrigatório.";
      } else if (!formData.email.includes("@")) {
        newErrors.email = "E-mail inválido.";
      }
      if (!formData.whatsapp) {
        newErrors.whatsapp = "WhatsApp é obrigatório.";
      } else if (formData.whatsapp.length < 15) { // (00) 00000-0000 has 15 chars
        newErrors.whatsapp = "WhatsApp inválido.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        const firstErrorField = Object.keys(newErrors)[0];
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.focus();
        }
        return;
      }
    } else if (step === 2) {
      if (!formData.cep) {
        newErrors.cep = "CEP é obrigatório.";
      }
      if (!formData.street.trim()) {
        newErrors.street = "Logradouro é obrigatório.";
      }
      if (!formData.number.trim()) {
        newErrors.number = "Número é obrigatório.";
      }
      if (!formData.neighborhood.trim()) {
        newErrors.neighborhood = "Bairro é obrigatório.";
      }
      if (!formData.city.trim()) {
        newErrors.city = "Cidade é obrigatória.";
      }
      if (!formData.state.trim()) {
        newErrors.state = "Estado é obrigatório.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        const firstErrorField = Object.keys(newErrors)[0];
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.focus();
        }
        return;
      }
    }

    setErrors({});
    setStep(step + 1);
  };

  const handleBack = () => {
    setErrors({});
    if (step === 1) {
      onBack();
    } else {
      setStep(step - 1);
    }
  };

  const handleScheduleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName,
        cpf: formData.cpf,
        birthDate: formData.birthDate,
        email: formData.email,
        whatsapp: formData.whatsapp,
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        selectedDate: formData.selectedDate || null,
        selectedTime: formData.selectedTime || null
      };

      const response = await api.post("/api/appointments", payload);
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || "Erro ao salvar agendamento.");
      }
      
      setLoading(false);
      
      // Redirect or open Google Calendar schedule URL in new tab ONLY if not embedded
      if (!isEmbeddable) {
        const calendarUrl = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL || "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3d5Hw6Wd_Wf0J9c5bLqQ4X9M1P4s8xR-9kY5w=";
        window.open(calendarUrl, "_blank");
      }

      setFinished(true);
      toast.success(isEmbeddable ? "Agendamento concluído com sucesso!" : "Cadastro salvo! Agendamento aberto no Google Agenda.");
    } catch (err: any) {
      console.error("Error saving appointment:", err);
      toast.error(err.response?.data?.error || err.message || "Erro ao salvar o agendamento no servidor.");
      setLoading(false);
    }
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
          className="w-full max-w-[750px] bg-[#18181b] border border-white/5 p-16 md:p-20 text-center rounded-[2px] shadow-2xl relative z-10 space-y-10"
        >
          {/* Logotipo do G8Pay acima */}
          <div className="flex justify-center mb-5">
            <img src={currentBrand.logoWhite} alt={`${currentBrand.name} Logo`} className="h-14 md:h-16 object-contain" />
          </div>

          <div className="relative flex justify-center">
            <div className="w-32 h-32 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-20 w-20 text-emerald-500 animate-pulse" />
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight">Agendamento Confirmado!</h2>
            <p className="text-neutral-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Sua reunião de demonstração comercial foi agendada com sucesso para falar com nossa equipe comercial.
            </p>
            
            <div className="bg-[#141416] border border-white/5 p-8 rounded-sm max-w-xl mx-auto space-y-6 text-left">
              <div className="flex items-start gap-5 text-base">
                <Video className="h-7 w-7 text-brand-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-[12px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">Página de Agendamento Oficial (Google Calendar)</span>
                  <a href={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL || "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0OKuT4pGjOxw8Smyi6RAkxRMVGEWMw9iK_5JbnolhiqHX8zspaM-Czcl6tPCIGXPpPfMkiWhf6"} target="_blank" rel="noreferrer" className="text-brand-accent hover:underline inline-flex items-center gap-1.5 font-black text-lg">
                    Abrir Página de Agendamentos <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="h-[1px] bg-white/5" />
              <div className="flex items-start gap-5 text-base">
                <Mail className="h-7 w-7 text-neutral-400 shrink-0 mt-0.5" />
                <p className="text-neutral-300 leading-relaxed text-sm md:text-base">
                  Se a nova aba não abriu ou você a fechou sem querer, use o link acima para escolher o dia e hora para falar com a equipe <strong className="text-white">mktdigital.rsn@gmail.com</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Button
              onClick={onBack}
              className="w-full h-20 text-lg font-black tracking-widest text-white bg-brand-accent hover:bg-brand-accent-hover rounded-[2px] transition-all shadow-xl shadow-brand-accent/20 cursor-pointer"
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
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, fullName: e.target.value }));
                          if (errors.fullName) setErrors((prev) => { const c = { ...prev }; delete c.fullName; return c; });
                        }}
                        placeholder="Insira seu nome completo"
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                          errors.fullName ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.fullName && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.fullName}
                        </motion.span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">CPF / CNPJ</label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => {
                          handleCpfChange(e);
                          if (errors.cpf) setErrors((prev) => { const c = { ...prev }; delete c.cpf; return c; });
                        }}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all font-mono ${
                          errors.cpf ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.cpf && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.cpf}
                        </motion.span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Data de Nascimento</label>
                      <Input
                        id="birthDate"
                        value={formData.birthDate}
                        onChange={(e) => {
                          handleDateChange(e);
                          if (errors.birthDate) setErrors((prev) => { const c = { ...prev }; delete c.birthDate; return c; });
                        }}
                        placeholder="DD/MM/AAAA"
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                          errors.birthDate ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.birthDate && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.birthDate}
                        </motion.span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">E-mail</label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, email: e.target.value }));
                          if (errors.email) setErrors((prev) => { const c = { ...prev }; delete c.email; return c; });
                        }}
                        placeholder="contato@exemplo.com"
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                          errors.email ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.email && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.email}
                        </motion.span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">WhatsApp</label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => {
                          handlePhoneChange(e);
                          if (errors.whatsapp) setErrors((prev) => { const c = { ...prev }; delete c.whatsapp; return c; });
                        }}
                        placeholder="(00) 00000-0000"
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                          errors.whatsapp ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.whatsapp && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.whatsapp}
                        </motion.span>
                      )}
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
                          id="cep"
                          value={formData.cep}
                          onChange={(e) => {
                            handleCepChange(e);
                            if (errors.cep) setErrors((prev) => { const c = { ...prev }; delete c.cep; return c; });
                          }}
                          placeholder="00000-000"
                          className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                            errors.cep ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                          }`}
                        />
                        {loading && (
                          <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-brand-accent" />
                        )}
                      </div>
                      {errors.cep && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.cep}
                        </motion.span>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Logradouro / Rua</label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, street: e.target.value }));
                          if (errors.street) setErrors((prev) => { const c = { ...prev }; delete c.street; return c; });
                        }}
                        placeholder="Rua, Avenida, etc."
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                          errors.street ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.street && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.street}
                        </motion.span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Número</label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, number: e.target.value }));
                          if (errors.number) setErrors((prev) => { const c = { ...prev }; delete c.number; return c; });
                        }}
                        placeholder="123"
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                          errors.number ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.number && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.number}
                        </motion.span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Complemento</label>
                      <Input
                        id="complement"
                        value={formData.complement}
                        onChange={(e) => setFormData((prev) => ({ ...prev, complement: e.target.value }))}
                        placeholder="Apto, Bloco, etc. (Opcional)"
                        className="h-12 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bairro</label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, neighborhood: e.target.value }));
                          if (errors.neighborhood) setErrors((prev) => { const c = { ...prev }; delete c.neighborhood; return c; });
                        }}
                        placeholder="Bairro"
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                          errors.neighborhood ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.neighborhood && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.neighborhood}
                        </motion.span>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Cidade</label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, city: e.target.value }));
                          if (errors.city) setErrors((prev) => { const c = { ...prev }; delete c.city; return c; });
                        }}
                        placeholder="Cidade"
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                          errors.city ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                        }`}
                        disabled
                      />
                      {errors.city && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.city}
                        </motion.span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">UF / Estado</label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, state: e.target.value }));
                          if (errors.state) setErrors((prev) => { const c = { ...prev }; delete c.state; return c; });
                        }}
                        placeholder="SP, RJ, etc."
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                          errors.state ? "border-amber-500/80 bg-amber-500/[0.01] focus-visible:ring-amber-500/30" : "border-white/10"
                        }`}
                        disabled
                      />
                      {errors.state && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-amber-500 font-bold flex items-center mt-1">
                          <YellowTriangleRedQuestion />
                          {errors.state}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="text-lg font-bold text-white">Agendamento Comercial</h3>
                    <p className="text-xs text-neutral-400 text-brand-accent">
                      {isEmbeddable 
                        ? "Escolha o melhor dia e horário diretamente no painel abaixo." 
                        : "Selecione o melhor dia e horário no Google Agenda oficial."}
                    </p>
                  </div>

                  {isEmbeddable ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full bg-white border border-white/10 rounded-sm overflow-hidden h-[550px] relative"
                    >
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        className="w-full h-full"
                        allow="camera; microphone; geolocation"
                      />
                    </motion.div>
                  ) : (
                    <div className="bg-[#141416] border border-white/5 p-8 rounded-sm space-y-6 text-center max-w-xl mx-auto">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                          <Calendar className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-base font-black text-white">Integração Google Calendar</h4>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                          Ao clicar em confirmar, salvaremos seu contato comercial no sistema da G8Pay e abriremos a tela oficial de agendamentos da conta <strong className="text-white">mktdigital.rsn@gmail.com</strong> para você escolher o dia e hora de sua preferência.
                        </p>
                      </div>

                      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm text-left text-xs space-y-2">
                        <p className="text-neutral-500 uppercase font-black tracking-widest text-[9px]">Dados do Lead:</p>
                        <p className="text-neutral-300">Contato: <strong className="text-white">{formData.fullName}</strong></p>
                        <p className="text-neutral-300">E-mail: <strong className="text-white">{formData.email}</strong></p>
                        <p className="text-neutral-300">WhatsApp: <strong className="text-white">{formData.whatsapp}</strong></p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
            <Button
              onClick={handleBack}
              className="h-12 bg-transparent border border-white/10 text-neutral-300 hover:text-white hover:bg-white/[0.02] hover:border-white/20 rounded-[2px] transition-all cursor-pointer px-6"
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
                    {isEmbeddable ? "CONCLUINDO..." : "SALVANDO AGENDAMENTO..."}
                  </>
                ) : (
                  isEmbeddable ? "CONFIRMAR E CONCLUIR" : "AGENDAR REUNIÃO"
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
