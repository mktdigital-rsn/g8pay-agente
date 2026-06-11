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
  Sparkles,
  Maximize2,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

interface AgentOnboardingProps {
  onBack: () => void;
}

export default function AgentOnboarding({ onBack }: AgentOnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signatureLink, setSignatureLink] = useState("");
  const [isMock, setIsMock] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<"personal" | "address" | "referral" | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Personal Data
    fullName: "",
    cpf: "",
    birthDate: "",
    email: "",
    whatsapp: "",
    password: "",
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

  const checkAndPrefillFromAppointment = async (cpfVal: string) => {
    try {
      const res = await api.get(`/api/agents/search-appointment?cpf=${encodeURIComponent(cpfVal)}`);
      if (res.data && res.data.success && res.data.data) {
        const appointment = res.data.data;
        toast.success(`Dados de agendamento comercial encontrados! Preenchendo dados...`);
        setFormData((prev) => ({
          ...prev,
          fullName: appointment.fullName || prev.fullName,
          email: appointment.email || prev.email,
          birthDate: appointment.birthDate || prev.birthDate,
          whatsapp: appointment.whatsapp || prev.whatsapp,
          cep: appointment.cep || prev.cep,
          street: appointment.street || prev.street,
          number: appointment.number || prev.number,
          complement: appointment.complement || prev.complement || "",
          neighborhood: appointment.neighborhood || prev.neighborhood,
          city: appointment.city || prev.city,
          state: appointment.state || prev.state,
        }));
      }
    } catch (err) {
      console.log("No appointment found for this CPF.");
    }
  };

  // Mask functions
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>, field: "cpf" | "referrerCpf") => {
    const raw = e.target.value;
    const v = raw.replace(/\D/g, "");
    let masked = "";
    
    if (field === "referrerCpf") {
      masked = v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .slice(0, 14);
    } else {
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
    }
    
    setFormData((prev) => ({ ...prev, [field]: masked }));

    const cleanVal = masked.replace(/\D/g, "");
    if (field === "cpf" && (cleanVal.length === 11 || cleanVal.length === 14)) {
      checkAndPrefillFromAppointment(masked);
    }
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
      if (!formData.password) {
        newErrors.password = "Senha é obrigatória.";
      } else if (formData.password.length < 6) {
        newErrors.password = "A senha deve ter no mínimo 6 caracteres.";
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
    } else if (step === 3) {
      if (formData.hasReferral) {
        if (!formData.referrerName.trim()) {
          newErrors.referrerName = "Nome do indicador é obrigatório.";
        }
        if (!formData.referrerCpf) {
          newErrors.referrerCpf = "CPF do indicador é obrigatório.";
        } else if (formData.referrerCpf.length < 14) {
          newErrors.referrerCpf = "CPF do indicador inválido.";
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post("/api/agents/onboarding", {
        fullName: formData.fullName,
        cpf: formData.cpf,
        email: formData.email,
        whatsapp: formData.whatsapp,
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        birthDate: formData.birthDate,
        password: formData.password,
        hasReferral: formData.hasReferral,
        referrerName: formData.referrerName,
        referrerCpf: formData.referrerCpf
      });

      const resData = response.data;

      if (!resData.success) {
        throw new Error(resData.error || "Erro ao realizar cadastro.");
      }

      const { agent, contractId, signatureLink, pdfUrl, isMock } = resData.data;

      // Save contract info to localStorage for dashboard retrieval
      const contractData = {
        agentId: agent.id,
        fullName: agent.fullName,
        cpf: agent.cpf,
        email: agent.email,
        whatsapp: agent.whatsapp,
        date: new Date().toLocaleDateString("pt-BR"),
        pdfPreviewUrl: pdfUrl,
        signatureLink: signatureLink,
        isMock: isMock
      };
      
      localStorage.setItem("signedContract", JSON.stringify(contractData));
      localStorage.setItem("agentId", agent.id);
      localStorage.setItem("userName", agent.fullName);
      localStorage.setItem("userEmail", agent.email);
      localStorage.setItem("userCpf", agent.cpf);
      localStorage.setItem("userWhatsapp", agent.whatsapp);

      // Set session expiration to 15 mins from now
      localStorage.setItem("sessionExpiresAt", (Date.now() + 900 * 1000).toString());
      localStorage.setItem("token", "bypass-token");
      localStorage.setItem("userToken", "bypass-user-token");

      toast.success("Cadastro e contrato gerados com sucesso!");
      
      setPdfPreviewUrl(pdfUrl);
      setSignatureLink(signatureLink);
      setIsMock(isMock);
      setFinished(true);
    } catch (error: any) {
      console.error("Error submitting onboarding:", error);
      const errMsg = error.response?.data?.error || error.message || "Falha ao processar o cadastro. Tente novamente.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
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
          className="w-full max-w-[700px] bg-[#18181b] border border-white/5 p-6 md:p-8 text-center rounded-[2px] shadow-2xl relative z-10 space-y-6"
        >
          <div className="relative flex justify-center">
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center relative"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 bg-brand-accent text-white p-1 rounded-full shadow-lg">
                <Sparkles className="h-4 w-4" />
              </div>
            </motion.div>
          </div>
 
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Cadastro e Contrato Gerados!</h2>
            <p className="text-neutral-200 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
              Parabéns, <strong>{formData.fullName}</strong>! Seu cadastro foi concluído com sucesso e o seu contrato de agente comercial autônomo G8Pay foi gerado.
            </p>
            
            {pdfPreviewUrl && (
              <div className="bg-[#141416] border border-white/5 p-5 rounded-sm max-w-xl mx-auto space-y-4">
                <div className="space-y-1 text-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-brand-accent">Termo de Adesão de Agente</h3>
                  <p className="text-[11px] text-neutral-400">
                    Você pode revisar o documento preenchido na janela abaixo antes de assinar.
                  </p>
                </div>

                {/* PDF Viewer IFrame with Expand Button */}
                <div className="w-full h-[320px] border border-white/10 rounded-sm overflow-hidden bg-neutral-950 relative group">
                  <iframe
                    src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-0"
                    title="Pré-visualização do Contrato"
                  />
                  <div className="absolute top-3 right-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="h-9 w-9 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full cursor-pointer flex items-center justify-center text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                      title="Expandir visualização"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {signatureLink && (
                  <>
                    <Button
                      onClick={() => window.open(signatureLink, "_blank")}
                      className="w-full h-14 text-sm font-black tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 rounded-[2px] transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 animate-pulse mt-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      ASSINAR CONTRATO DIGITALMENTE
                    </Button>
                    
                    {isMock && (
                      <p className="text-[10px] text-amber-500 font-medium text-center">
                        ⚠️ Modo de demonstração: o link acima abrirá o PDF preenchido localmente em tela cheia.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
 
            <p className="text-neutral-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed pt-2">
              Em breve nossa equipe entrará em contato via WhatsApp no número <strong className="text-brand-accent">{formData.whatsapp}</strong> para finalizar sua ativação.
            </p>
          </div>
 
          <div className="pt-2">
            <Button
              onClick={onBack}
              className="w-full h-14 text-sm font-black tracking-widest text-white bg-brand-accent hover:bg-brand-accent-hover rounded-[2px] transition-all shadow-xl shadow-brand-accent/20 cursor-pointer"
            >
              VOLTAR À TELA INICIAL
            </Button>
          </div>
        </motion.div>
 
        {/* Modal for PDF Fullscreen Preview */}
        <AnimatePresence>
          {isPreviewOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-5xl bg-[#18181b] border border-white/10 rounded-[2px] p-6 relative flex flex-col space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Visualização Completa do Contrato</h3>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-1.5 hover:bg-white/5 rounded-full transition-colors group cursor-pointer"
                  >
                    <X className="h-5 w-5 text-white/50 group-hover:text-white" />
                  </button>
                </div>
                
                <div className="w-full h-[75vh] border border-white/10 rounded-sm overflow-hidden bg-neutral-950">
                  <iframe
                    src={`${pdfPreviewUrl}#toolbar=1`}
                    className="w-full h-full border-0"
                    title="Pré-visualização Completa do Contrato"
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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
                    {/* CPF/CNPJ Highlighted Field */}
                    <div className="space-y-1.5 md:col-span-2 bg-brand-accent/[0.02] border border-brand-accent/20 rounded-sm p-4 relative group/cpf shadow-[0_0_15px_rgba(255,122,0,0.02)] transition-all hover:border-brand-accent/40">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-brand-accent flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-brand-accent animate-pulse" />
                          CPF / CNPJ
                        </label>
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-brand-accent/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          ⚡ Autocompletar
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) => {
                            handleCpfChange(e, "cpf");
                            if (errors.cpf) setErrors((prev) => { const c = { ...prev }; delete c.cpf; return c; });
                          }}
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all font-mono tracking-widest ${
                            errors.cpf 
                              ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" 
                              : "border-white/10 hover:border-brand-accent/40 focus-visible:border-brand-accent focus-visible:ring-brand-accent/20"
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                        Ao digitar seu CPF ou CNPJ, se houver um agendamento prévio, seus dados de cadastro e endereço serão preenchidos automaticamente.
                      </p>
                      {errors.cpf && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
                          {errors.cpf}
                        </motion.span>
                      )}
                    </div>

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
                          errors.fullName ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.fullName && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
                          {errors.fullName}
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
                          errors.birthDate ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.birthDate && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
                          {errors.birthDate}
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
                          errors.whatsapp ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.whatsapp && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
                          {errors.whatsapp}
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
                          errors.email ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.email && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
                          {errors.email}
                        </motion.span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Senha de Acesso</label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, password: e.target.value }));
                          if (errors.password) setErrors((prev) => { const c = { ...prev }; delete c.password; return c; });
                        }}
                        placeholder="Mínimo de 6 caracteres"
                        className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                          errors.password ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.password && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
                          {errors.password}
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
                    <p className="text-xs text-neutral-400">Insira seu endereço completo (digite o CEP para preenchimento automático).</p>
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
                            errors.cep ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                          }`}
                        />
                        {loading && (
                          <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-brand-accent" />
                        )}
                      </div>
                      {errors.cep && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
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
                          errors.street ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.street && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
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
                          errors.number ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.number && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
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
                          errors.neighborhood ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                        }`}
                      />
                      {errors.neighborhood && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
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
                          errors.city ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                        }`}
                        disabled
                      />
                      {errors.city && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
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
                          errors.state ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                        }`}
                        disabled
                      />
                      {errors.state && (
                        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
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
                              id="referrerName"
                              value={formData.referrerName}
                              onChange={(e) => {
                                setFormData((prev) => ({ ...prev, referrerName: e.target.value }));
                                if (errors.referrerName) setErrors((prev) => { const c = { ...prev }; delete c.referrerName; return c; });
                              }}
                              placeholder="Nome completo do padrinho"
                              className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                                errors.referrerName ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                              }`}
                            />
                            {errors.referrerName && (
                              <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
                                {errors.referrerName}
                              </motion.span>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">CPF do Indicador</label>
                            <Input
                              id="referrerCpf"
                              value={formData.referrerCpf}
                              onChange={(e) => {
                                handleCpfChange(e, "referrerCpf");
                                if (errors.referrerCpf) setErrors((prev) => { const c = { ...prev }; delete c.referrerCpf; return c; });
                              }}
                              placeholder="000.000.000-00"
                              className={`h-12 bg-white/[0.02] text-white rounded-[2px] transition-all ${
                                errors.referrerCpf ? "border-red-500/80 bg-red-500/[0.01] focus-visible:ring-red-500/30" : "border-white/10"
                              }`}
                            />
                            {errors.referrerCpf && (
                              <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-red-500 font-bold block mt-1">
                                {errors.referrerCpf}
                              </motion.span>
                            )}
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

                  <div className="space-y-6 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Component 1: Personal Summary */}
                    <div className="bg-[#141416] p-6 border border-white/5 rounded-sm space-y-4">
                      <h4 className="text-sm font-black uppercase text-brand-accent tracking-widest flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="flex items-center gap-2">
                          <User className="h-5 w-5" /> Dados Pessoais
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingSection(editingSection === "personal" ? null : "personal")}
                          className="text-[10px] text-neutral-400 hover:text-brand-accent transition-colors font-bold uppercase tracking-wider cursor-pointer"
                        >
                          {editingSection === "personal" ? "Cancelar" : "Editar"}
                        </button>
                      </h4>

                      {editingSection === "personal" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-left">
                          <div className="sm:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Nome completo</label>
                            <Input
                              value={formData.fullName}
                              onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                              className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">CPF / CNPJ</label>
                            <Input
                              value={formData.cpf}
                              onChange={(e) => handleCpfChange(e, "cpf")}
                              className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Data de Nascimento</label>
                            <Input
                              value={formData.birthDate}
                              onChange={(e) => handleDateChange(e)}
                              className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">WhatsApp</label>
                            <Input
                              value={formData.whatsapp}
                              onChange={(e) => handlePhoneChange(e)}
                              className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">E-mail</label>
                            <Input
                              value={formData.email}
                              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                              className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="sm:col-span-2 pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (!formData.fullName.trim()) return toast.error("Nome completo é obrigatório.");
                                const cleanVal = formData.cpf.replace(/\D/g, "");
                                if (cleanVal.length !== 11 && cleanVal.length !== 14) return toast.error("Documento (CPF ou CNPJ) inválido.");
                                if (formData.birthDate.length < 10) return toast.error("Data de nascimento inválida.");
                                if (!formData.email.trim() || !formData.email.includes("@")) return toast.error("E-mail inválido.");
                                if (formData.whatsapp.length < 15) return toast.error("WhatsApp inválido.");
                                setEditingSection(null);
                              }}
                              className="px-4 h-9 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold rounded-[2px] cursor-pointer"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Nome completo</span> 
                            <p className="text-lg font-black text-white tracking-tight mt-0.5">{formData.fullName}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">CPF / CNPJ</span> 
                            <p className="text-lg font-black text-white tracking-tight mt-0.5">{formData.cpf}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Data de Nascimento</span> 
                            <p className="text-base font-black text-white mt-0.5">{formData.birthDate}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">WhatsApp</span> 
                            <p className="text-base font-black text-white mt-0.5">{formData.whatsapp}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">E-mail</span> 
                            <p className="text-base font-black text-white mt-0.5">{formData.email}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Component 2: Address Summary */}
                    <div className="bg-[#141416] p-6 border border-white/5 rounded-sm space-y-4">
                      <h4 className="text-sm font-black uppercase text-brand-accent tracking-widest flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" /> Endereço
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingSection(editingSection === "address" ? null : "address")}
                          className="text-[10px] text-neutral-400 hover:text-brand-accent transition-colors font-bold uppercase tracking-wider cursor-pointer"
                        >
                          {editingSection === "address" ? "Cancelar" : "Editar"}
                        </button>
                      </h4>

                      {editingSection === "address" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-left">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">CEP</label>
                            <Input
                              value={formData.cep}
                              onChange={handleCepChange}
                              className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="sm:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Logradouro / Rua</label>
                            <Input
                              value={formData.street}
                              onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                              className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Número</label>
                            <Input
                              value={formData.number}
                              onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
                              className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Complemento</label>
                            <Input
                              value={formData.complement}
                              onChange={(e) => setFormData((prev) => ({ ...prev, complement: e.target.value }))}
                              className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bairro</label>
                            <Input
                              value={formData.neighborhood}
                              onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))}
                              className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                            />
                          </div>
                          <div className="sm:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Cidade</label>
                            <Input
                              value={formData.city}
                              disabled
                              className="h-10 bg-white/[0.02] border-white/10 text-white/50 rounded-[2px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">UF</label>
                            <Input
                              value={formData.state}
                              disabled
                              className="h-10 bg-white/[0.02] border-white/10 text-white/50 rounded-[2px]"
                            />
                          </div>
                          <div className="sm:col-span-3 pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (!formData.cep.trim()) return toast.error("CEP é obrigatório.");
                                if (!formData.street.trim()) return toast.error("Logradouro é obrigatório.");
                                if (!formData.number.trim()) return toast.error("Número é obrigatório.");
                                if (!formData.neighborhood.trim()) return toast.error("Bairro é obrigatório.");
                                if (!formData.city.trim()) return toast.error("Cidade é obrigatória.");
                                if (!formData.state.trim()) return toast.error("Estado é obrigatório.");
                                setEditingSection(null);
                              }}
                              className="px-4 h-9 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold rounded-[2px] cursor-pointer"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="sm:col-span-2">
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Logradouro</span> 
                            <p className="text-lg font-black text-white tracking-tight mt-0.5">{formData.street}, {formData.number} {formData.complement ? `- ${formData.complement}` : ""}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Bairro</span> 
                            <p className="text-base font-black text-white mt-0.5">{formData.neighborhood}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">CEP</span> 
                            <p className="text-base font-black text-white mt-0.5">{formData.cep}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Cidade / UF</span> 
                            <p className="text-base font-black text-white mt-0.5">{formData.city} - {formData.state}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Component 3: Indication Summary */}
                    <div className="bg-[#141416] p-6 border border-white/5 rounded-sm space-y-4">
                      <h4 className="text-sm font-black uppercase text-brand-accent tracking-widest flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="flex items-center gap-2">
                          <Users className="h-5 w-5" /> Canal de Entrada
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingSection(editingSection === "referral" ? null : "referral")}
                          className="text-[10px] text-neutral-400 hover:text-brand-accent transition-colors font-bold uppercase tracking-wider cursor-pointer"
                        >
                          {editingSection === "referral" ? "Cancelar" : "Editar"}
                        </button>
                      </h4>

                      {editingSection === "referral" ? (
                        <div className="space-y-4 text-sm text-left">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">Foi indicado por um consultor G8Pay?</label>
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, hasReferral: true }))}
                                className={`flex-1 h-11 border font-bold uppercase text-[10px] tracking-wider rounded-[2px] transition-all cursor-pointer ${
                                  formData.hasReferral
                                    ? "bg-brand-accent border-brand-accent text-white"
                                    : "bg-white/[0.02] border-white/10 text-neutral-400 hover:bg-white/[0.05]"
                                }`}
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, hasReferral: false }))}
                                className={`flex-1 h-11 border font-bold uppercase text-[10px] tracking-wider rounded-[2px] transition-all cursor-pointer ${
                                  !formData.hasReferral
                                    ? "bg-brand-accent border-brand-accent text-white"
                                    : "bg-white/[0.02] border-white/10 text-neutral-400 hover:bg-white/[0.05]"
                                }`}
                              >
                                Não
                              </button>
                            </div>
                          </div>

                          {formData.hasReferral && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-3">
                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Nome do Indicador</label>
                                <Input
                                  value={formData.referrerName}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, referrerName: e.target.value }))}
                                  className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">CPF do Indicador</label>
                                <Input
                                  value={formData.referrerCpf}
                                  onChange={(e) => handleCpfChange(e, "referrerCpf")}
                                  className="h-10 bg-white/[0.02] border-white/10 text-white rounded-[2px]"
                                />
                              </div>
                            </div>
                          )}

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (formData.hasReferral) {
                                  if (!formData.referrerName.trim()) return toast.error("Nome do indicador é obrigatório.");
                                  if (formData.referrerCpf.length < 14) return toast.error("CPF do indicador inválido.");
                                }
                                setEditingSection(null);
                              }}
                              className="px-4 h-9 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold rounded-[2px] cursor-pointer"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {formData.hasReferral ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="sm:col-span-2">
                                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Tipo de Indicação</span> 
                                <p className="text-emerald-400 font-black tracking-tight mt-0.5">Indicado por Parceiro</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Nome do Indicador</span> 
                                <p className="text-base font-black text-white mt-0.5">{formData.referrerName}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">CPF do Indicador</span> 
                                <p className="text-base font-black text-white mt-0.5">{formData.referrerCpf}</p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Tipo de Indicação</span> 
                              <p className="text-neutral-400 font-black mt-0.5">Sem indicação direta. (Conheceu a G8Pay de forma espontânea)</p>
                            </div>
                          )}
                        </>
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
              onClick={handleBack}
              className="h-12 bg-transparent border border-white/10 text-neutral-300 hover:text-white hover:bg-white/[0.02] hover:border-white/20 rounded-[2px] transition-all cursor-pointer px-6"
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
                disabled={loading || editingSection !== null}
                className="flex-1 h-12 font-black tracking-widest text-white bg-gradient-to-r from-brand-accent to-brand-secondary hover:brightness-110 rounded-[2px] transition-all cursor-pointer shadow-lg shadow-brand-accent/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    CONCLUINDO CADASTRO...
                  </>
                ) : editingSection !== null ? (
                  "SALVE AS ALTERAÇÕES PARA CONCLUIR"
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
