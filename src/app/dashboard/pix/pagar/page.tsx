"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import jsQR from "jsqr";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  Diamond,
  Calendar as CalendarIcon,
  AlertTriangle,
  ArrowLeft,
  Clock,
  QrCode,
  Smartphone,
  Mail,
  UserSquare2,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Building2, Fingerprint, CheckCircle2, Download, Smartphone as SmartphoneIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import { temporaryDeviceIdAtom, balanceAtom, isBalanceLoadingAtom } from "@/store/auth";

function PixPagarContent() {
  const searchParams = useSearchParams();
  const temporaryDeviceId = useAtomValue(temporaryDeviceIdAtom);
  const typeParam = searchParams.get("type") || "key";
  const type = typeParam.toLowerCase() === "celular" ? "phone" : typeParam.toLowerCase();
  const urlKey = searchParams.get("key") || "";
  const urlName = searchParams.get("name") || "";
  const urlBank = searchParams.get("bank") || "";

  const [value, setValue] = useState("");
  const [date, setDate] = useState("");
  const [pixCode, setPixCode] = useState(urlKey);
  const [identifier, setIdentifier] = useState(urlKey);
  const [step, setStep] = useState<"input" | "confirm" | "sms" | "success">("input");
  const [smsCode, setSmsCode] = useState("");
  const [isLoadingTransfer, setIsLoadingTransfer] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const [recipientName, setRecipientName] = useState(urlName.trim());
  const [recipientBank, setRecipientBank] = useState(urlBank);
  const [recipientDocument, setRecipientDocument] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const balanceValue = useAtomValue(balanceAtom);
  const isBalanceLoading = useAtomValue(isBalanceLoadingAtom);
  const [userPhone, setUserPhone] = useState("");
  const [pinId, setPinId] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [uuid, setUuid] = useState("");
  const [endToEndId, setEndToEndId] = useState("");
  const [saveContact, setSaveContact] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSearching(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      const image = new window.Image();
      image.src = imageData;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          setIsSearching(false);
          return;
        }
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, image.width, image.height);

        try {
          const imageDataObj = context.getImageData(0, 0, image.width, image.height);
          const code = jsQR(imageDataObj.data, imageDataObj.width, imageDataObj.height);

          if (code) {
            console.log("✅ [QRCODE DECODER]: Found", code.data);
            setPixCode(code.data);
            toast.success("QR Code lido com sucesso!");
          } else {
            toast.error("Não foi possível encontrar um QR Code nesta imagem.");
          }
        } catch (err) {
          console.error("❌ [QRCODE DECODER ERROR]:", err);
          toast.error("Erro ao processar imagem do QR Code.");
        } finally {
          setIsSearching(false);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);

    // Fetch User Profile to get the correct phone number
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/users/data");

        if (res.data) {
          const phone = res.data.phone || res.data.celular || "";
          setUserPhone(phone);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };
    fetchProfile();

    fetchProfile();
  }, []);

  useEffect(() => {
    // 1. Monitor manual input for keys (from identifier)
    if (identifier.length >= 8 && !urlKey && (type !== "qrcode" && type !== "copia_cola")) {
      const delayDebounceFn = setTimeout(() => {
        performSearch(identifier);
      }, 1500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [identifier]);

  useEffect(() => {
    // 2. Monitor pixCode (Copia e Cola / QR Code)
    if (pixCode.length > 10 && (type === "qrcode" || type === "copia_cola")) {
      handleDecodePix(pixCode);
    }
  }, [pixCode]);

  const performSearch = async (keyToSearch: string) => {
    if (!keyToSearch) return;
    setIsSearching(true);
    // Formatting logic inside the search to ensure correct format (phone prefixes, etc.)
    let key = keyToSearch.trim();
    if (!key.includes("@")) {
      key = key.replace(/\D/g, "");
      // Remover o prefixo 55 se estiver presente (quando for phone)
      if (type === "phone" && key.startsWith("55") && (key.length === 12 || key.length === 13)) {
        key = key.substring(2);
      }
    }

    try {
      const response = await api.get(`/api/banco/pix/buscar-dados-contato/${encodeURIComponent(key)}`);
      if (response.data) {
        updateRecipientData(response.data);
      }
    } catch (err) {
      console.error("Lookup error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDecodePix = async (emvCode: string) => {
    const cleanCode = emvCode.trim();
    if (!cleanCode) return;

    setIsSearching(true);
    try {
      console.log("🔍 Decodificando Pix Copia e Cola via API Oficial...");
      const res = await api.post("/api/banco/pix/buscar-copicola", { payload: cleanCode });

      if (res.data) {
        console.log("✅ PIX COPIACOLA SUCCESS:", res.data);
        const data = res.data.data || res.data;
        updateRecipientData(data);

        // Extract value from various possible fields
        const val = data.valor || data.amount || data.value || data.transactionAmount || 0;
        if (val > 0) {
          setValue(String(Math.round(val * 100)));
        }
      }
    } catch (err: any) {
      console.error("❌ PIX COPIACOLA FAILED:", err.response?.data || err.message);
      toast.error("Erro ao processar código Pix Copia e Cola.");
    } finally {
      setIsSearching(false);
    }
  };

  const updateRecipientData = (data: any) => {
    console.log("🔍 [RECIPENT DATA UPDATE]:", data);
    setSearchResult(data);
    setRecipientName((data.nome || data.name || data.recebedorNome || data.beneficiario || "").trim());
    setRecipientBank((data.instituicao || data.bank || data.recebedorInstituicao || data.instituicaoNome || "").trim());
    setRecipientDocument((data.cpfcnpj || data.documento || data.taxNumber || "").trim());

    // Aggressive ID capture
    const foundId = data.qrcodeId || data.id_payment || data.idPayment || data.uuid || data.endToEndId || data.txid || data.id || "";
    if (foundId) setUuid(foundId);
    if (data.endToEndIdInterno) setEndToEndId(data.endToEndIdInterno);
  };

  useEffect(() => {
    // Initial search if we came via URL (already has urlKey)
    if (urlKey && !urlName) {
      if (type === "qrcode" || type === "copia_cola") {
        handleDecodePix(urlKey);
      } else {
        performSearch(urlKey);
      }
    }
  }, [urlKey]);

  const formatCurrency = (val: string) => {
    const cleanValue = val.replace(/\D/g, "");
    if (!cleanValue) return "";
    const numberValue = parseInt(cleanValue) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numberValue);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setValue(rawValue);
  };

  const currentAmount = value ? parseInt(value.replace(/\D/g, "")) / 100 : 0;
  const hasInsufficientBalance = balanceValue <= 0;
  const amountExceedsBalance = currentAmount > 0 && currentAmount > balanceValue;
  const balanceFormatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balanceValue);

  const formatIdentifier = (val: string, type: string) => {
    const cleanValue = val.replace(/\D/g, "");

    if (type === "phone") {
      let v = cleanValue;
      if (v.length > 11) v = v.substring(0, 11);

      if (v.length > 10) {
        return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
      } else if (v.length > 6) {
        return `(${v.substring(0, 2)}) ${v.substring(2, 6)}-${v.substring(6)}`;
      } else if (v.length > 2) {
        return `(${v.substring(0, 2)}) ${v.substring(2)}`;
      } else if (v.length > 0) {
        return `(${v}`;
      }
      return v;
    }

    if (type === "cpf_cnpj" || type === "cpf" || type === "cnpj") {
      const v = cleanValue;
      if (v.length <= 11) {
        if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
        if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
        if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
        return v;
      } else {
        const c = v.substring(0, 14);
        if (c.length > 12) return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5");
        if (c.length > 8) return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, "$1.$2.$3/$4");
        if (c.length > 5) return c.replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3");
        if (c.length > 2) return c.replace(/(\d{2})(\d{1,3})/, "$1.$2");
        return c;
      }
    }

    return val;
  };



  const handleRequestSms = async () => {
    if (!temporaryDeviceId) {
      toast.error("Aguarde concluir o login com QR antes de realizar pagamentos.");
      return;
    }

    setIsLoadingTransfer(true);
    try {
      console.log(`📩 [SMS REQUEST] Enviando solicitação de PIN...`);

      const amountNum = parseFloat(value.replace(/\D/g, "")) / 100;
      const amountStr = amountNum.toFixed(2);

      const res = await api.post("/api/users/solicitar-pin", {
        amount: amountStr,
        deviceId: temporaryDeviceId
      });

      if (res.data) {
        console.log("✅ [SMS REQUEST SUCCESS]:", res.data);
        const data = res.data.data || res.data;
        setPinId(data.pinId || data.id || "");
        setStep("sms");
        toast.success("Código enviado com sucesso!");
      }
    } catch (err: any) {
      console.error("❌ [SMS REQUEST ERROR]:", err.response?.status, err.response?.data || err.message);
      toast.error("Erro ao solicitar código de segurança.");
    } finally {
      setIsLoadingTransfer(false);
    }
  };

  const handleFinalizeTransfer = async () => {
    if (smsCode.length < 5) {
      toast.error("Digite o código de 5 dígitos recebido.");
      return;
    }

    if (!temporaryDeviceId) {
      toast.error("Aguarde concluir o login com QR antes de realizar pagamentos.");
      return;
    }

    setIsLoadingTransfer(true);

    // Função para buscar o ID real no extrato (Sync de Comprovante)
    const searchWithRetry = async (targetValue: number, attempts = 0) => {
      const maxAttempts = 5;
      try {
        console.log(`🔍 [SYNC COMPROVANTE] Tentativa ${attempts + 1}/${maxAttempts} para valor R$ ${targetValue}...`);
        const extratoRes = await api.get("/api/banco/extrato/buscar");
        const items = extratoRes.data.transacoes || extratoRes.data.data?.transacoes || [];

        // Procura um item que bata com o valor (margem de erro de 1 centavo)
        const match = items.find((item: any) => {
          const itemVal = Math.abs(parseFloat(String(item.valor).replace(/[R$\s]/g, "").replace(",", ".")));
          return Math.abs(itemVal - targetValue) < 0.01;
        });

        if (match && (match.idDoBancoLiquidante || match.id || match.id_transaction)) {
          const finalId = match.idDoBancoLiquidante || match.id || match.id_transaction;
          console.log("✅ [SYNC COMPROVANTE] ID REAL LOCALIZADO:", finalId);
          setTransactionId(finalId);
          return true;
        } else if (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 3000));
          return searchWithRetry(targetValue, attempts + 1);
        }
      } catch (e) {
        console.error("❌ [SYNC COMPROVANTE ERROR]:", e);
        if (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 3000));
          return searchWithRetry(targetValue, attempts + 1);
        }
      }
      return false;
    };

    try {
      // 1. PIN Validation as per Guide Step 3
      console.log("🛡️ [VALIDAR PIN REQUEST]:", { pin: smsCode, pinId: pinId });

      try {
        await api.post("/api/users/validar-pin", {
          pin: smsCode,
          pinId: pinId,
          deviceId: temporaryDeviceId
        });
        console.log("✅ [VALIDAR PIN SUCCESS]");
      } catch (err: any) {
        console.error("❌ [VALIDAR PIN ERROR]:", err.response?.status, err.response?.data);
        throw err;
      }
      let endpoint = "/api/banco/pix/transferir";
      const rawChave = pixCode || identifier || "";
      let finalChave = rawChave;
      if (!rawChave.includes("@")) {
        finalChave = rawChave.replace(/\D/g, "");
        if (type === "phone" && finalChave.startsWith("55") && (finalChave.length === 12 || finalChave.length === 13)) {
          finalChave = finalChave.substring(2);
        }
      }

      const txAmount = parseFloat(value.replace(/\D/g, "")) / 100;

      let payload: any = {
        chave: finalChave,
        valor: txAmount,
        agendadoPara: null,
        uuid: uuid || crypto.randomUUID(),
        endToEndIdInterno: endToEndId || crypto.randomUUID(),
        chavePixTypeHint: type === "phone" ? "phone" : null,
        pin: smsCode,
        deviceId: temporaryDeviceId
      };

      if (type === "qrcode" || type === "copia_cola") {
        endpoint = "/api/banco/pix/pagar-copicola";

        // Use data exactly as structured in the decoding step response
        const qrId = searchResult?.qrcodeId || searchResult?.qrCodeId || searchResult?.id || "";
        const txAmount = parseFloat(value.replace(/\D/g, "")) / 100;
        const internalId = endToEndId || crypto.randomUUID();

        payload = {
          endToEndId: searchResult?.endToEndId || qrId, // Use EndToEndId if available
          chavePix: searchResult?.chavePix || "",
          qrcodeId: qrId,
          qrCodeType: searchResult?.qrCodeType || "STATIC",
          receiverConciliationId: searchResult?.receiverConciliationId || qrId,
          amount: txAmount,
          endToEndIdInterno: internalId,
          deviceId: temporaryDeviceId,
          pin: smsCode,
        };
      }

      console.log(`🚀 [PAYLOAD]:`, payload);

      const res = await api.post(`${endpoint}`, payload);

      if (res.data) {
        console.log("✅ [SUCCESS]:", res.data);
        const apiData = res.data.data || res.data;
        const realId = apiData.idLiquidante || apiData.codigoDeIdentificacao || apiData.itemId || apiData.idDoBancoLiquidante || apiData.id;

        setTransactionId(realId || "");
        setStep("success");
        toast.success("Transferência realizada com sucesso!");

        if (saveContact) {
          try {
            await api.post("/api/banco/pix/cadastrar-contato", {
              nome: recipientName,
              chave: finalChave,
              instituicao: recipientBank || ""
            });
            console.log("✅ Contact saved successfully");
          } catch (e) {
            console.error("❌ Error saving contact:", e);
          }
        }

        // Inicia a busca pelo ID real no extrato em background
        searchWithRetry(txAmount);
      }
    } catch (err: any) {
      console.error("❌ [API ERROR]:", err.response?.status, err.response?.data || err.message);
      const msg = err.response?.data?.message || err.response?.data?.mensagem || "Erro ao realizar transferência.";
      toast.error(`Erro ${err.response?.status || ''}: ${msg}`);
    } finally {
      setIsLoadingTransfer(false);
    }
  };

  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const handlePrintReceipt = async (attempts = 0) => {
    if (!transactionId) {
      toast.error("ID da transação não localizado.");
      return;
    }

    setIsDownloadingReceipt(true);
    try {
      console.log(`📄 [RECEIPT] Tentativa ${attempts + 1} de gerar comprovante para ${transactionId}...`);
      const response = await api.get(`/api/banco/extrato/imprimir-item/${transactionId}`, {
        responseType: 'blob'
      });

      if (response.data.size === 0) {
        if (attempts < 3) {
          toast.info("O comprovante está sendo gerado pelo banco. Aguarde alguns instantes...");
          setTimeout(() => handlePrintReceipt(attempts + 1), 3000);
          return;
        }
        toast.info("O comprovante ainda está sendo processado. Tente novamente em alguns segundos no extrato.");
        setIsDownloadingReceipt(false);
        return;
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comprovante_pix_${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setIsDownloadingReceipt(false);
      toast.success("Comprovante baixado com sucesso!");
    } catch (err) {
      console.error("❌ [RECEIPT ERROR]:", err);
      toast.error("Erro ao gerar comprovante. Verifique o extrato.");
      setIsDownloadingReceipt(false);
    }
  };

  const getPageInfo = () => {
    switch (type) {
      case "qrcode":
        return { title: "Escanear QR Code", icon: QrCode, placeholder: "Aponte a câmera..." };
      case "phone":
        return { title: "Pagar via Celular", icon: Smartphone, placeholder: "(00) 00000-0000" };
      case "email":
        return { title: "Pagar via E-mail", icon: Mail, placeholder: "exemplo@email.com" };
      case "cpf_cnpj":
      case "cpf":
      case "cnpj":
        return { title: "Pagar via CPF/CNPJ", icon: UserSquare2, placeholder: "000.000.000-00" };
      case "copia_cola":
        return { title: "Pix Copia e Cola", icon: Copy, placeholder: "Cole o código Pix completo aqui" };
      default:
        return { title: "Pagar via Chave Pix", icon: Diamond, placeholder: "Insira a chave Pix" };
    }
  };

  const info = getPageInfo();

  return (
    <div className="p-10 flex gap-10 h-full overflow-y-auto w-full no-scrollbar">
      <div className="flex-1 space-y-8 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={step === "input" ? "/dashboard/pix" : "#"} onClick={(e) => {
              if (step !== "input" && step !== "success") {
                e.preventDefault();
                if (step === "confirm") setStep("input");
                else if (step === "sms") setStep("confirm");
              }
            }}>
              <Button variant="ghost" size="icon" className="rounded-sm hover:bg-neutral-100 h-12 w-12">
                <ArrowLeft className="h-6 w-6 text-[var(--brand-accent)]" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-transparent font-black px-2 py-0.5 rounded-[5px] text-[10px] uppercase tracking-widest leading-none">G8Pay &bull; Pix</Badge>
                <span className="text-[10px] text-[#0c0a09] font-bold uppercase tracking-widest leading-none opacity-60">
                  {step === "confirm" ? "Confirmação" : step === "sms" ? "Segurança" : step === "success" ? "Comprovante" : "Indicação de Pagamento"}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[#0c0a09] flex items-center gap-3 uppercase">
                {step === "confirm" ? "Confirme os dados" : step === "sms" ? "Validação SMS" : step === "success" ? "Transferência Realizada" : info.title}
                <info.icon className="h-7 w-7 text-[var(--brand-accent)]" />
              </h1>
            </div>
          </div>
        </div>

        {step === "input" ? (
          <div className="space-y-8 max-w-2xl bg-white p-10 rounded-[5px] shadow-xl shadow-black/5 border border-neutral-100">
            {!isBalanceLoading && hasInsufficientBalance && (
              <div className="flex items-center gap-4 p-6 bg-rose-500/5 rounded-[5px] border border-rose-100 animate-in fade-in slide-in-from-top-2">
                <div className="w-12 h-12 bg-rose-500 rounded-sm flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1">Atenção: Sem Saldo</p>
                  <p className="text-[11px] font-bold text-rose-500/80 leading-tight">Você não possui saldo disponível para realizar transações hoje. <br />Saldo atual: <span className="font-black text-rose-600">{balanceFormatted}</span></p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 p-5 bg-[var(--brand-accent)]/10 rounded-[5px] border border-neutral-100/50">
              <div className="w-10 h-10 bg-white rounded-[5px] flex items-center justify-center text-[var(--brand-accent)] shadow-sm">
                <info.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none mb-1 opacity-60">Você está pagando via</p>
                <p className="font-black text-[#0c0a09] uppercase text-xs tracking-tight">{info.title.split("via ")[1] || info.title}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-[#0c0a09] uppercase tracking-widest">Dados da Transação</h2>
              </div>

              {type === "qrcode" ? (
                <div className="space-y-6">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-neutral-200 rounded-[5px] flex flex-col items-center justify-center gap-4 hover:border-[var(--brand-accent)] transition-colors cursor-pointer group bg-neutral-50/50"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    {pixCode ? (
                      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="bg-white p-6 rounded-2xl shadow-xl shadow-orange-500/10 border border-orange-100/50 relative group">
                          <QRCodeSVG value={pixCode} size={140} level="H" includeMargin={false} />
                          <div className="absolute inset-0 bg-[var(--brand-accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                            <span className="bg-white px-3 py-1.5 rounded-full text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-widest shadow-sm">Alterar Arquivo</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-widest bg-[var(--brand-accent)]/10 px-4 py-1.5 rounded-full border border-orange-100">Código Detectado com Sucesso</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-white rounded-[5px] flex items-center justify-center text-neutral-400 group-hover:text-[var(--brand-accent)] shadow-sm">
                          <QrCode className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-[#0c0a09] uppercase">Anexe o arquivo QRCODE</p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Clique para Procurar</span>
                            <ChevronRight className="h-3 w-3 text-neutral-300" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <Input
                    value={pixCode}
                    onChange={(e) => setPixCode(e.target.value)}
                    placeholder="Digite ou cole o código"
                    readOnly={!!urlKey}
                    className={`h-14 bg-neutral-50/50 border-neutral-100 focus:border-[var(--brand-accent)] rounded-[5px] px-6 text-[var(--brand-accent)] font-black text-xl placeholder:text-neutral-300 shadow-sm ${urlKey ? 'cursor-not-allowed opacity-80' : ''}`}
                  />
                </div>
              ) : type === "copia_cola" ? (
                <div className="space-y-4">
                  <Textarea
                    placeholder={info.placeholder}
                    value={pixCode}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPixCode(e.target.value)}
                    readOnly={!!urlKey}
                    className={`min-h-[120px] font-black text-xl text-[var(--brand-accent)] rounded-md border-neutral-100 bg-neutral-50/50 ${urlKey ? 'cursor-not-allowed opacity-80' : ''}`}
                  />
                  <p className="text-[9px] text-neutral-400 font-bold text-right uppercase tracking-widest opacity-60">Cole o código Pix completo para processar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    value={type === "email" ? identifier : formatIdentifier(identifier, type)}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={info.placeholder}
                    readOnly={!!urlKey}
                    className={`h-14 bg-neutral-50/50 border-neutral-100 focus:border-[var(--brand-accent)] rounded-[5px] px-6 text-[var(--brand-accent)] font-black text-xl placeholder:text-neutral-300 shadow-sm ${urlKey ? 'cursor-not-allowed opacity-80' : ''}`}
                  />
                  {!urlKey && (
                    <button className="flex items-center gap-2 group text-[var(--brand-accent)] px-1 translate-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest border-b-2 border-transparent group-hover:border-[var(--brand-accent)]">Buscar nos Meus Contatos</span>
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              )}

              {(isSearching || recipientName) && (
                <div className="bg-[var(--brand-accent)]/10 p-5 rounded-[5px] border border-orange-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-[5px] flex items-center justify-center shrink-0 border border-neutral-100 shadow-sm">
                      <Image
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent((recipientName || 'G8').trim())}`}
                        alt="Avatar"
                        width={40}
                        height={40}
                        className="rounded-sm"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-black uppercase text-[var(--brand-accent)] tracking-widest leading-none">Dados do Recebedor</p>
                      <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-tighter leading-tight">
                        {isSearching ? "Buscando informações..." : recipientName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                        <div className="flex items-center gap-1.5 opacity-60">
                          <Building2 className="h-3 w-3 text-[var(--brand-accent)]" />
                          <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{isSearching ? "..." : (recipientBank || "Instituição não informada")}</p>
                        </div>
                        {recipientDocument && (
                          <div className="flex items-center gap-1.5 opacity-60">
                            <UserSquare2 className="h-3 w-3 text-[var(--brand-accent)]" />
                            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{recipientDocument}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-neutral-100" />

            {(!(searchResult?.valor > 0 || searchResult?.amount > 0 || searchResult?.value > 0 || searchResult?.transactionAmount > 0)) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-[#0c0a09] uppercase tracking-widest">Qual o Valor?</h2>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] leading-none mb-1">Saldo Disponível</span>
                    <span className={`text-base font-black tracking-tight leading-none ${balanceValue <= 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{balanceFormatted}</span>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    value={formatCurrency(value)}
                    onChange={handleValueChange}
                    placeholder="R$ 0,00"
                    className={`h-16 bg-neutral-50/50 border-2 ${amountExceedsBalance ? 'border-rose-300 focus:border-rose-500' : 'border-neutral-100 focus:border-[var(--brand-accent)]'} rounded-[5px] px-8 font-black text-4xl text-[var(--brand-accent)] placeholder:text-neutral-200 tracking-tighter shadow-sm transition-colors`}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <Badge className="bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)] rounded-[5px] px-2 py-0.5 font-black text-[9px] tracking-widest uppercase">BRL</Badge>
                  </div>
                </div>
                {amountExceedsBalance && (
                  <div className="flex items-center gap-2 text-rose-500 animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-black uppercase tracking-tight">O valor informado excede seu saldo disponível de {balanceFormatted}</p>
                  </div>
                )}
              </div>
            )}

            <Separator className="bg-neutral-100" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-[#0c0a09] uppercase tracking-widest">Para Quando?</h2>
                <Badge variant="outline" className="rounded-sm border-neutral-200 text-neutral-400 font-bold px-2 py-1 flex items-center gap-1.5 bg-neutral-50 shadow-sm text-[9px] uppercase tracking-widest">
                  <Clock className="h-3 w-3" />
                  Liquidação Imediata
                </Badge>
              </div>
              <div className="relative group">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 bg-neutral-50/50 border-neutral-100 focus:border-[var(--brand-accent)] rounded-md px-6 text-[var(--brand-accent)] font-black text-base appearance-none cursor-pointer hover:bg-neutral-50 transition-colors shadow-sm"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-300">
                  <CalendarIcon className="h-4 w-4" />
                </div>
              </div>
            </div>

            <Button
              onClick={async () => {
                if (!recipientName && !isSearching) {
                  if (type === "qrcode" || type === "copia_cola") await handleDecodePix(pixCode);
                  else await performSearch(identifier);
                  if (!recipientName) {
                    toast.error("Recebedor não localizado. Verifique a chave ou o código.");
                    return;
                  }
                }
                if (parseFloat(value.replace(/\D/g, "")) <= 0) {
                  toast.error("O valor deve ser maior que zero.");
                  return;
                }
                if (amountExceedsBalance) {
                  toast.error("Saldo insuficiente para esta transferência.");
                  return;
                }
                setStep("confirm");
              }}
              disabled={isSearching || hasInsufficientBalance || amountExceedsBalance}
              className={`w-full h-14 text-white rounded-[5px] font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 group ${hasInsufficientBalance || amountExceedsBalance
                  ? 'bg-neutral-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] hover:from-[#ea580c] hover:to-[var(--brand-accent)] shadow-orange-200/30'
                }`}
            >
              {isSearching ? "VALIDANDO DADOS..." : hasInsufficientBalance && !isBalanceLoading ? "SEM SALDO EM CONTA" : amountExceedsBalance ? "VALOR ACIMA DO SALDO" : "PRÓXIMO PASSO"}
              {!hasInsufficientBalance && !amountExceedsBalance && <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </div>
        ) : step === "confirm" ? (
          <div className="space-y-8 max-w-2xl bg-white p-12 rounded-[5px] shadow-xl shadow-black/5 border border-neutral-100">
            <div className="space-y-8">
              <div className="p-10 bg-[var(--brand-accent)]/10 rounded-[5px] border border-neutral-100 space-y-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest leading-none mb-3 opacity-60">Recebedor</p>
                    <p className="text-3xl font-black text-[#0c0a09] uppercase tracking-tighter">
                      {isSearching ? "Buscando..." : (recipientName || "Não Informado")}
                    </p>
                  </div>
                  <Badge className="bg-[#0c0a09] text-white px-4 py-1.5 font-black text-[11px] uppercase tracking-widest rounded-[5px]">{type?.toUpperCase()}</Badge>
                </div>

                <Separator className="bg-neutral-200/30" />

                <div className="grid grid-cols-1 gap-8">
                  <div className="max-w-full overflow-hidden">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none mb-2 opacity-60">Chave Pix</p>
                    <p className="text-xl font-black text-[#0c0a09] font-mono break-all leading-tight tracking-tight bg-white/50 p-4 rounded-xl border border-black/5">
                      {pixCode || identifier}
                    </p>
                  </div>
                  <div className="space-y-8">
                    {recipientDocument && (
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none mb-2 opacity-60">Documento</p>
                        <p className="text-xl font-black text-[#0c0a09] tracking-tighter">{recipientDocument}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none mb-2 opacity-60">Instituição</p>
                      <p className="text-sm font-black text-[#0c0a09] uppercase tracking-tight leading-relaxed">
                        {isSearching ? "Buscando..." : (recipientBank || "Instituição não informada")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-200/30">
                  <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest leading-none mb-3 opacity-60">Valor Total</p>
                  <p className="text-6xl font-black text-[var(--brand-accent)] tracking-tighter">{formatCurrency(value)}</p>
                </div>
              </div>

              <div className="bg-[#fff9e6] border border-[#ffecb3] p-6 rounded-[5px] flex gap-5 items-center">
                <div className="w-10 h-10 rounded-[5px] bg-[#ff9800] flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-500/20">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <p className="text-xs font-black text-[#855e00] uppercase tracking-tight leading-relaxed">
                  Confirme atentamente os dados do recebedor e o valor antes de confirmar o pagamento via SMS.
                </p>
              </div>

              <div 
                onClick={() => setSaveContact(!saveContact)}
                className="flex items-center gap-3 p-4 bg-orange-50 rounded-[5px] border border-orange-100 group cursor-pointer"
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${saveContact ? 'bg-[var(--brand-accent)] border-[var(--brand-accent)]' : 'border-neutral-200 bg-white'}`}>
                  {saveContact && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Salvar este contato para futuras transações</span>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleRequestSms}
                  disabled={isLoadingTransfer}
                  className="w-full h-20 bg-[#0c0a09] hover:bg-[var(--brand-accent)] text-white rounded-[5px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-black/20 transition-all active:scale-95"
                >
                  {isLoadingTransfer ? "PROCESSANDO..." : "AUTORIZAR COM SMS"}
                </Button>
              </div>
            </div>
          </div>
        ) : step === "sms" ? (
          <div className="space-y-8 max-w-2xl bg-white p-12 rounded-sm shadow-xl shadow-black/5 border border-neutral-100 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-[var(--brand-accent)]/10 rounded-sm flex items-center justify-center text-[var(--brand-accent)] mb-4">
              <Smartphone className="h-10 w-10 animate-bounce" />
            </div>
            <div className="space-y-4 mb-10">
              <h2 className="text-4xl font-black text-[#0c0a09] uppercase tracking-tighter">Validação de Segurança</h2>
              <p className="text-base font-bold text-neutral-400 uppercase tracking-widest">
                Enviamos um código para o seu celular.
              </p>
            </div>

            <div className="w-full max-w-xs space-y-6">
              <Input
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").substring(0, 6))}
                placeholder="0 0 0 0 0"
                className="h-20 text-center font-black text-4xl tracking-[0.5em] border-2 border-neutral-100 rounded-[5px] focus:border-[var(--brand-accent)] bg-neutral-50/50 text-[#0c0a09]"
              />
              <div className="flex flex-col gap-4">
                <Button
                  disabled={smsCode.length < 5 || isLoadingTransfer}
                  onClick={handleFinalizeTransfer}
                  className="w-full h-16 bg-[#0c0a09] hover:bg-[var(--brand-accent)] text-white rounded-[5px] font-black text-base uppercase tracking-widest shadow-xl shadow-black/10 transition-all disabled:opacity-50"
                >
                  {isLoadingTransfer ? "PROCESSANDO..." : "CONFIRMAR TRANSFERÊNCIA"}
                </Button>
                <button className="text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-widest hover:underline">Reenviar Código em 00:59</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10 max-w-2xl bg-white p-12 rounded-sm shadow-2xl shadow-black/5 border border-neutral-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-green-50 rounded-sm flex items-center justify-center text-green-500 mb-2 border-4 border-white shadow-xl">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-[#0c0a09] uppercase tracking-tighter">Pix Enviado com Sucesso!</h2>
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">A transferência foi processada e já está na conta do recebedor.</p>
            </div>

            <div className="w-full bg-[#f9f9f9] rounded-[5px] p-8 space-y-8 relative overflow-hidden border border-neutral-100">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Diamond className="h-24 w-24" />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center border-b border-neutral-200 pb-4">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Valor da Transferência</span>
                  <span className="text-4xl font-black text-[var(--brand-accent)] tracking-tighter">{formatCurrency(value)}</span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Para quem enviou</p>
                    <p className="text-base font-black text-[#0c0a09] uppercase leading-none">{recipientName}</p>
                    <p className="text-[11px] font-bold text-neutral-500 uppercase">{recipientBank}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-[#0c0a09] uppercase tracking-widest">Data e Hora</p>
                      <p className="text-sm font-medium text-neutral-500 uppercase">{new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black text-[#0c0a09] uppercase tracking-widest">ID da Transação</p>
                      <p className="text-sm font-medium text-neutral-500 font-mono break-all">{transactionId || "G8PAY329KXM0"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full flex flex-row gap-4 items-center">
              <Button
                onClick={() => handlePrintReceipt()}
                disabled={isDownloadingReceipt}
                className="flex-1 h-20 bg-[var(--brand-accent)] hover:bg-orange-600 text-white rounded-md font-black text-lg shadow-lg shadow-[var(--brand-accent)]/20 transition-all active:scale-95 flex items-center justify-center gap-4"
              >
                <Download className={`h-8 w-8 ${isDownloadingReceipt ? 'animate-bounce' : ''}`} />
                {isDownloadingReceipt ? "BAIXANDO..." : "BAIXAR COMPROVANTE"}
              </Button>
              <Link href="/dashboard/pix" className="flex-1">
                <Button variant="outline" className="w-full h-20 border-2 border-neutral-100 hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] text-neutral-600 rounded-md font-black text-lg uppercase tracking-tighter">
                  VOLTAR PARA ÁREA PIX
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="w-[380px] shrink-0 space-y-8">
        <Card className="rounded-md border-0 shadow-2xl shadow-black/10 bg-[var(--brand-accent)] overflow-hidden relative group cursor-pointer h-[400px]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="p-10 space-y-4 relative z-10 text-white">
            <h3 className="text-3xl font-black leading-tight max-w-[220px] uppercase">
              Seu PIX mais rápido
            </h3>
            <p className="text-sm font-medium text-white/80 leading-relaxed max-w-[200px]">
              Use chaves salvas e favoritos para transferir em segundos.
            </p>
            <button className="text-[10px] font-black text-white border-b-2 border-white pb-0.5 mt-8 hover:text-white/70 transition-colors uppercase tracking-widest">
              SAIBA MAIS
            </button>
          </div>
          <div className="absolute bottom-0 right-0 w-[240px] h-[300px] flex items-end justify-end pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-accent)] to-transparent z-10" />
            <Diamond className="h-48 w-48 text-white/5 -mb-10 -mr-10 rotate-12" />
          </div>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-black text-[#0c0a09] uppercase tracking-tight">Ajuda</h2>
          <div className="flex gap-4">
            <button className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-md hover:shadow-xl transition-all border border-neutral-100 group">
              <div className="w-10 h-10 bg-[var(--brand-accent)]/10 rounded-md flex items-center justify-center mb-4 text-[var(--brand-accent)] group-hover:scale-110 transition-all">
                <HelpCircle className="h-5 w-5" />
              </div>
              <span className="font-black text-[9px] text-[#0c0a09] uppercase tracking-widest">Suporte</span>
            </button>
            <button className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-md hover:shadow-xl transition-all border border-neutral-100 group">
              <div className="w-10 h-10 bg-[var(--brand-accent)] rounded-md flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-all">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="font-black text-[9px] text-[#0c0a09] uppercase tracking-widest">Chat 09h as 17h</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PixPagarPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Carregando...</div>}>
      <PixPagarContent />
    </Suspense>
  );
}
