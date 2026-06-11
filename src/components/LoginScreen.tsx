"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  User,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Smartphone,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { temporaryDeviceIdAtom } from "@/store/auth";
import { useAtom } from "jotai";
import api from "@/lib/api";
import { toast } from "sonner";
import { currentBrand } from "@/config/brand";

type LoginStep = "identifier" | "password";
type ChallengeStatus = "PENDING" | "APPROVED" | "EXPIRED";

type ChallengeResponse = {
  success: boolean;
  data: {
    token: string;
    qrcode: string;
    status: ChallengeStatus;
    expiresAt: string;
  };
  message: string | null;
};

type ChallengeStatusResponse = {
  success: boolean;
  data: {
    status: ChallengeStatus;
    expiresAt: string;
  };
  message: string | null;
};

type LoginResponse = {
  accessToken?: string;
  userToken?: string;
};

interface LoginScreenProps {
  onBecomeAgent: () => void;
  onCommercialSchedule: () => void;
}

export default function LoginScreen({ onBecomeAgent, onCommercialSchedule }: LoginScreenProps) {
  const [, setTemporaryDeviceId] = useAtom(temporaryDeviceIdAtom);
  const [step, setStep] = useState<LoginStep>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [challengeQrCode, setChallengeQrCode] = useState("");
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>("PENDING");
  const [challengeExpiresAt, setChallengeExpiresAt] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const [hasFinalized, setHasFinalized] = useState(false);
  const [progress, setProgress] = useState(0);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (challengeStatus === "APPROVED") {
      setProgress(0);
      const duration = 15000; // 15 seconds
      const intervalTime = 100; // every 100ms
      const stepVal = 100 / (duration / intervalTime);

      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return Math.min(prev + stepVal, 100);
        });
      }, intervalTime);

      return () => clearInterval(timer);
    }
  }, [challengeStatus]);

  const cleanIdentifier = useMemo(() => {
    const isEmail = identifier.includes("@");
    return isEmail ? identifier.trim().toLowerCase() : identifier.replace(/\D/g, "");
  }, [identifier]);

  const handleIdentifierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setStep("password");
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) {
      toast.error("Por favor, informe sua senha de acesso.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        cpf: cleanIdentifier,
        password: password,
      };

      const response = await api.post("/api/agents/login", payload);

      if (response.data && response.data.success) {
        const { accessToken, userToken, agent } = response.data;
        
        localStorage.setItem("token", accessToken || "bypass-token");
        localStorage.setItem("userToken", userToken || "bypass-user-token");
        localStorage.setItem("agentId", agent.id);
        localStorage.setItem("userName", agent.fullName);
        localStorage.setItem("userEmail", agent.email);
        localStorage.setItem("userCpf", agent.cpf);
        localStorage.setItem("userWhatsapp", agent.whatsapp);

        // Try getting contract from API to update local signedContract
        try {
          const contractRes = await api.get(`/api/contracts?agentId=${agent.id}`);
          if (contractRes.data && contractRes.data.success && contractRes.data.data.length > 0) {
            const apiContract = contractRes.data.data[0];
            const contractData = {
              agentId: agent.id,
              fullName: agent.fullName,
              cpf: agent.cpf,
              email: agent.email,
              whatsapp: agent.whatsapp,
              date: new Date(apiContract.createdAt).toLocaleDateString("pt-BR"),
              pdfPreviewUrl: `${api.defaults.baseURL}/api/contracts/${apiContract.id}/download`,
              signatureLink: apiContract.signatureLink,
              isMock: !apiContract.signatureLink?.includes("d4sign")
            };
            localStorage.setItem("signedContract", JSON.stringify(contractData));
          } else {
            // Fallback metadata
            const contractData = {
              agentId: agent.id,
              fullName: agent.fullName,
              cpf: agent.cpf,
              email: agent.email,
              whatsapp: agent.whatsapp,
              date: new Date().toLocaleDateString("pt-BR")
            };
            localStorage.setItem("signedContract", JSON.stringify(contractData));
          }
        } catch (cErr) {
          console.warn("Could not load signed contract on login:", cErr);
        }
        
        // Set session expiration to 15 mins from now
        localStorage.setItem("sessionExpiresAt", (Date.now() + 900 * 1000).toString());

        toast.success(`Bem-vindo de volta, ${agent.fullName}! Redirecionando...`);

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 800);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Não foi possível realizar o login. CPF/CNPJ ou senha inválidos.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartFlow = () => {
    setPassword("");
    setStep("identifier");
    setIsLoading(false);
  };

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, []);

  const statusLabel =
    challengeStatus === "APPROVED"
      ? "Desafio aprovado"
      : challengeStatus === "EXPIRED"
        ? "Desafio expirado"
        : "Aguardando aprovação no app";

  const formattedExpiresAt = useMemo(() => {
    if (!challengeExpiresAt) return "";

    const parsedDate = new Date(challengeExpiresAt);
    if (Number.isNaN(parsedDate.getTime())) return challengeExpiresAt;

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(parsedDate);
  }, [challengeExpiresAt]);

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#0c0a09] ${currentBrand.themeClass}`}>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[500px] lg:max-w-[1000px] 2xl:max-w-[1400px] grid lg:grid-cols-2 bg-[#18181b] border border-white/5 rounded-[2px] overflow-hidden shadow-2xl relative z-10 min-h-[500px] lg:min-h-[600px] 2xl:min-h-[800px]"
      >
        <div 
          className="hidden md:flex flex-col justify-between p-16 bg-cover bg-center relative overflow-hidden"
          style={{ backgroundImage: "url('/g8pay_commercial.png')" }}
        >
          {/* Overlay to ensure readability and blend with G8 brand */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/85 to-black/35 z-0" />
          
          <div className="relative z-10">
            {currentBrand.id === "g8" ? (
              <Image src={currentBrand.logoWhite} alt={`${currentBrand.name} Logo`} width={160} height={60} className="object-contain 2xl:scale-125 origin-left brightness-0 invert drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]" />
            ) : (
              <div className="flex items-center gap-3.5 select-none animate-in fade-in duration-300 scale-125 md:scale-150 2xl:scale-[1.75] origin-left">
                <img 
                  src={currentBrand.logoWhite} 
                  alt={`${currentBrand.name} Logo`} 
                  className={`${
                    currentBrand.id === "galapagos" 
                      ? "h-10" 
                      : (currentBrand.id === "fiscomoney" || currentBrand.id === "advogado10x")
                      ? "h-[60px]"
                      : "h-16"
                  } w-auto object-contain brightness-100`} 
                />
                {currentBrand.id === "galapagos" && (
                  <div className="flex flex-col justify-center text-left">
                    <span className="text-[17px] font-semibold tracking-wide leading-none text-white font-sans">
                      {currentBrand.name.split(" ")[0]}
                    </span>
                    <span className="text-[8px] font-black tracking-[0.38em] uppercase text-white mt-1.5 leading-none">
                      {(currentBrand.name.split(" ")[1] || "Capital").toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-8 2xl:space-y-12 relative z-10">
            <div className="space-y-5 2xl:space-y-8">
              <div className="inline-flex items-center rounded-[2px] px-3 py-1 text-[11px] 2xl:text-xs font-bold uppercase tracking-widest w-fit bg-white/5 text-white/70 border border-white/10">
                Cadastro de Agentes
              </div>
              <h1 className="text-5xl 2xl:text-7xl font-black tracking-tighter text-white leading-[1.05]">
                Cadastro <br />
                <span className="text-primary italic">de Agentes.</span>
              </h1>
              <p className="text-neutral-300 text-sm 2xl:text-lg font-medium leading-relaxed max-w-[300px] 2xl:max-w-[450px]">
                Te ajudamos a gerenciar seu capital de forma inteligente e segura através da nossa tecnologia de ponta.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-200/20 border border-amber-500/20 rounded-sm inline-flex items-center gap-3 text-white 2xl:gap-5 shadow-lg shadow-amber-400/10 w-fit relative z-10">
            <ShieldCheck className={`h-4 w-4 2xl:h-6 2xl:w-6 opacity-90 ${currentBrand.id === "galapagos" ? "text-green-500" : ""}`} />
            <span className="text-[9px] 2xl:text-xs font-bold uppercase tracking-[0.2em] leading-none">SSL SECURE PROTOCOL</span>
          </div>
        </div>

        <div className="p-8 md:p-16 flex flex-col justify-center relative bg-[#0c0a09]">
          <AnimatePresence mode="wait">
            {step === "identifier" && (
              <motion.div
                key="step-id"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-10 2xl:space-y-16 mt-12 lg:mt-0"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">Identificação</h2>
                  <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest">
                    Use seu CPF, CNPJ ou E-mail
                  </p>
                </div>

                <form onSubmit={handleIdentifierSubmit} className="space-y-6 2xl:space-y-10">
                  <div className="space-y-2 2xl:space-y-4">
                    <label className="text-[10px] 2xl:text-xs font-black uppercase tracking-widest text-brand-accent ml-1">Acessar com</label>
                    <div className="relative group">
                      <User className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 2xl:h-7 2xl:w-7 text-white/20 transition-colors ${
                        currentBrand.id === "galapagos"
                          ? "group-focus-within:text-white"
                          : "group-focus-within:text-brand-accent"
                      }`} />
                      <Input
                        placeholder="000.000.000-00"
                        className="pl-14 2xl:pl-20 h-16 2xl:h-24 bg-white/[0.02] border-white/10 focus:border-brand-accent/50 focus:bg-white/[0.04] transition-all text-white font-bold text-xl 2xl:text-3xl rounded-[2px] placeholder:text-white/5 shadow-inner"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className={`w-full h-16 2xl:h-24 text-sm 2xl:text-xl font-black transition-all text-white cursor-pointer rounded-[2px] tracking-widest shadow-xl ${
                      currentBrand.id === "galapagos"
                        ? "bg-blue-500 hover:bg-blue-400 shadow-blue-500/10"
                        : "bg-brand-accent hover:bg-brand-accent-hover shadow-brand-accent/20"
                    }`}
                    disabled={!identifier}
                  >
                    AVANÇAR PARA SENHA
                    <ArrowRight className="h-4 w-4 2xl:h-6 2xl:w-6 ml-3" />
                  </Button>

                  <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                    <Button
                      type="button"
                      onClick={onBecomeAgent}
                      className="w-full h-14 text-xs font-black tracking-wider text-white bg-brand-accent hover:bg-brand-accent-hover transition-all rounded-[2px] cursor-pointer shadow-lg shadow-brand-accent/15"
                    >
                      TORNE-SE AGENTE
                    </Button>
                    <Button
                      type="button"
                      onClick={onCommercialSchedule}
                      className="w-full h-14 text-xs font-black tracking-wider text-brand-accent border border-brand-accent/30 hover:border-brand-accent hover:bg-brand-accent/5 bg-transparent transition-all rounded-[2px] cursor-pointer"
                    >
                      AGENDAMENTO COMERCIAL
                    </Button>
                  </div>
                </form>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <button className="text-[10px] 2xl:text-xs font-black text-neutral-400 uppercase tracking-widest hover:text-white transition-colors">Dificuldade em acessar?</button>
                  <button className="text-[10px] 2xl:text-xs font-black text-brand-accent uppercase tracking-widest hover:underline">Solicitar Acesso</button>
                </div>
              </motion.div>
            )}

            {step === "password" && (
              <motion.div
                key="step-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-10 2xl:space-y-16 mt-12 lg:mt-0"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setStep("identifier")}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    type="button"
                  >
                    <ChevronLeft className="h-6 w-6 text-white/50" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-black text-white">Senha de Acesso</h2>
                    <p className="text-white/40 text-sm font-medium">{cleanIdentifier || "Identificação pendente"}</p>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-accent ml-1">Senha de Acesso</label>
                    <Input
                      type="password"
                      placeholder="Digite sua senha de acesso"
                      className="h-16 bg-white/[0.02] border-white/10 focus:border-brand-accent/50 focus:bg-white/[0.04] transition-all text-white font-bold text-lg rounded-[2px]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    className={`w-full h-16 text-lg font-black text-white rounded-[2px] shadow-lg cursor-pointer transition-all ${
                      currentBrand.id === "galapagos"
                        ? "bg-blue-500 hover:bg-blue-400"
                        : "bg-brand-accent hover:bg-brand-accent-hover"
                    }`}
                    disabled={isLoading || !password}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2 justify-center w-full">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Aguarde um instante...
                      </span>
                    ) : (
                      "ENTRAR E ACESSAR"
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
