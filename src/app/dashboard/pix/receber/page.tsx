"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  QrCode, 
  Copy, 
  Share2, 
  Download, 
  Diamond,
  Plus,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import axios from "axios";

export default function PixReceberPage() {
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<"setup" | "qr">("setup");
  const [userName, setUserName] = useState("---");
  const [userKey, setUserKey] = useState("---");
  const [keyType, setKeyType] = useState("CPF");
  const [pixPayload, setPixPayload] = useState("");
  const [pixImage, setPixImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasKeys, setHasKeys] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userToken = localStorage.getItem("userToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://g8api.bskpay.com.br";
        
        // 1. Get basic user info
        const userRes = await axios.get(`${apiUrl}/api/users/data`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userRes.data) {
          setUserName(userRes.data.name || userRes.data.nome || "Cliente");
        }

        // 2. Get real PIX keys
        const keysRes = await axios.get(`${apiUrl}/api/banco/pix/listar-chaves`, {
           headers: { 
             Authorization: `Bearer ${token}`,
             'userToken': userToken || ""
           }
        });

        if (Array.isArray(keysRes.data) && keysRes.data.length > 0) {
           const primaryKey = keysRes.data[0];
           setUserKey(primaryKey.chave || primaryKey.value);
           setKeyType(primaryKey.tipo || primaryKey.type || "CPF");
           setHasKeys(true);
        } else {
           setHasKeys(false);
           setUserKey("Nenhuma chave encontrada");
        }
      } catch (err) {
        console.error("Erro ao buscar dados do usuário ou chaves:", err);
        setHasKeys(false);
      }
    };
    fetchUserData();
  }, []);

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

  const generatePixPayload = async () => {
    setLoading(true);
    setPixImage("");
    setPixPayload("");
    const token = localStorage.getItem("token");
    const userToken = localStorage.getItem("userToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://g8api.bskpay.com.br";
    
    try {
        // EXACT flow from the mobile app (CronosBankService / gerar-copicola)
        const res = await axios.post(`${apiUrl}/api/banco/pix/gerar-copicola`, {
            valor: parseFloat((parseInt(value || "0") / 100).toFixed(2)),
            chave: userKey
        }, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'userToken': userToken || ""
            }
        });
        console.log(res, `res`)
        const data = res.data;
        console.log("PIX GENERATE RESPONSE:", data);

        // Map fields based on the actual console response seen: data.copicola and data.qrcode
        const rawValue = data.copicola || data.qrcode || data.qrcode_digitable || data.payload || data.emv || data.data || (typeof data === 'string' ? data : null);
        const base64Image = data.qrcode_base64 || data.base64 || data.image;

        if (rawValue || base64Image) {
            // Smart detection: if rawValue is a base64 image
            if (typeof rawValue === 'string' && rawValue.startsWith('data:')) {
                setPixImage(rawValue);
                // Try to find EMV in another field (like copicola)
                const possibleEmv = data.copicola || data.qrcode_digitable || data.payload || data.emv || data.data?.qrcode_digitable;
                if (possibleEmv && !possibleEmv.startsWith('data:')) setPixPayload(possibleEmv);
            } else {
                // rawValue is likely the EMV string (starts with 000201)
                if (rawValue && typeof rawValue === 'string') setPixPayload(rawValue);
                
                // If it's EMV, we still check for a separate image field
                const imgField = data.qrcode || data.qrcode_base64 || data.base64 || data.image;
                if (imgField && typeof imgField === 'string' && imgField.startsWith('data:')) {
                    setPixImage(imgField);
                }
            }
            setStep("qr");
        } else {
            alert("Erro ao processar o retorno do banco. Verifique suas chaves Pix.");
        }
    } catch (err) {
        console.error("Erro na API gerar-copicola:", err);
        alert("Ocorreu um erro ao gerar o QR Code. Certifique-se de que você possui uma chave Pix ativa.");
    } finally {
        setLoading(false);
    }
  };

  const handleCopyCode = () => {
     if (pixPayload) {
        navigator.clipboard.writeText(pixPayload);
        alert("Código Pix Copiado!");
     } else {
        alert("Código copia e cola não disponível. Use o QR Code.");
     }
  };

  const handleDownloadQR = () => {
    // If we have a base64 image from bank, download directly
    if (pixImage) {
        const link = document.createElement('a');
        link.href = pixImage;
        link.download = 'pix-qr-code.png';
        link.click();
        return;
    }
    
    // If we only have SVG, we can't easily download as PNG without canvas
    // But we can try to find the SVG element and download it
    const svg = document.querySelector('svg');
    if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const svgSize = svg.getBoundingClientRect();
        canvas.width = svgSize.width;
        canvas.height = svgSize.height;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = "pix-qr-code.png";
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const handleShare = async () => {
    let fileToShare: File | null = null;
    
    try {
        // 1. Get the image source (either from bank base64 or generated SVG)
        let imageUri = pixImage;
        if (!imageUri) {
            const svg = document.querySelector('svg');
            if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement("canvas");
                const svgSize = svg.getBoundingClientRect();
                canvas.width = svgSize.width;
                canvas.height = svgSize.height;
                const ctx = canvas.getContext("2d");
                
                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        ctx?.drawImage(img, 0, 0);
                        imageUri = canvas.toDataURL("image/png");
                        resolve(true);
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                });
            }
        }

        if (imageUri) {
            const blob = await (await fetch(imageUri)).blob();
            fileToShare = new File([blob], 'pix-recebimento.png', { type: 'image/png' });
        }

        // 2. Share via Web Share API
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [fileToShare!] })) {
            await navigator.share({
                files: [fileToShare!],
                title: 'Meu Pix - G8Pay',
                text: pixPayload ? `Pague via Pix: ${pixPayload}` : 'Pague via Pix usando o QR Code em anexo.'
            });
        } else if (navigator.share) {
            // Share only text if files not supported
            await navigator.share({
                title: 'Meu Pix - G8Pay',
                text: pixPayload || 'Pague via Pix usando o meu QR Code.'
            });
        } else {
            // Last fallback: Download the image
            handleDownloadQR();
            alert("Compartilhamento não suportado. O QR Code foi baixado para o seu dispositivo.");
        }
    } catch (err) {
        console.warn("Share failed:", err);
        handleDownloadQR();
    }
  };

  return (
    <div className="p-10 flex gap-10 h-full overflow-y-auto w-full no-scrollbar">
      {/* Main Content */}
      <div className="flex-1 space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/pix">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100 h-10 w-10">
                 <ArrowLeft className="h-6 w-6 text-[var(--brand-accent)]" />
              </Button>
            </Link>
            <div>
               <div className="flex items-center gap-2 mb-1">
                 <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-transparent font-black px-3 py-0.5 rounded-full text-[10px] uppercase tracking-widest">G8Pay &bull; Pix</Badge>
                 <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none">Receber Pagamento</span>
               </div>
               <h1 className="text-3xl font-black tracking-tighter text-[#0c0a09] flex items-center gap-3">
                 {step === "setup" ? "Quanto quer receber?" : "QR Code Gerado"}
                 <QrCode className="h-7 w-7 text-[var(--brand-accent)] stroke-[2]" />
               </h1>
            </div>
          </div>
        </div>

        {step === "setup" ? (
          <div className="bg-white rounded-[40px] p-12 border border-neutral-100 shadow-sm space-y-10 max-w-2xl relative overflow-hidden">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full blur-3xl -mr-16 -mt-16" />
             
             <div className="space-y-4 relative z-10">
                <h2 className="text-xl font-black text-[#0c0a09]">Valor a cobrar (opcional)</h2>
                <div className="relative group">
                   <Input 
                      value={formatCurrency(value)}
                      onChange={handleValueChange}
                      placeholder="R$ 0,00" 
                      className="h-24 bg-[#f8f9fa] border-neutral-100 focus:border-[var(--brand-accent)] hover:border-[var(--brand-accent)]/30 focus:ring-4 focus:ring-orange-500/5 rounded-2xl px-8 font-black text-5xl text-[var(--brand-accent)] placeholder:text-neutral-200 tracking-tighter transition-all"
                   />
                </div>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest px-2">Se deixar zerado, quem paga define o valor.</p>
             </div>

             <div className="space-y-4 relative z-10">
                <h2 className="text-xl font-black text-[#0c0a09]">Descrição (opcional)</h2>
                <Input 
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="Ex: Almoço de domingo" 
                   className="h-16 bg-[#f8f9fa] border-neutral-100 focus:border-[var(--brand-accent)] rounded-2xl px-6 text-[#0c0a09] font-black text-lg placeholder:text-neutral-300"
                />
             </div>

             <div className="p-6 bg-[var(--brand-accent)]/10 rounded-[24px] border border-yellow-100/50 flex items-center justify-between relative z-10">
                <div>
                   <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest leading-none mb-2">Chave Pix Selecionada</p>
                   <p className="font-black text-[#0c0a09] text-base">{userKey} ({keyType})</p>
                </div>
                {hasKeys ? (
                   <button className="text-[var(--brand-accent)] font-black text-[10px] uppercase tracking-widest underline hover:text-orange-600 transition-colors">Alterar</button>
                ) : (
                   <Link href="/dashboard/pix/chaves">
                      <Button size="sm" className="bg-[var(--brand-accent)] hover:bg-orange-600 text-white rounded-full font-black text-[9px] uppercase tracking-widest px-4 h-8">CADASTRAR</Button>
                   </Link>
                )}
             </div>

             <Button 
               disabled={loading || !hasKeys}
               onClick={generatePixPayload}
               className="w-full h-16 bg-[var(--brand-accent)] hover:bg-orange-600 text-white rounded-2xl font-black text-xl shadow-2xl shadow-[var(--brand-accent)]/20 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
             >
                {loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : "GERAR QR CODE"}
             </Button>

             {!hasKeys && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100/50 flex items-center gap-3 animate-bounce">
                   <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm">
                      <Plus className="h-4 w-4" />
                   </div>
                   <span className="text-[10px] text-red-500 font-black uppercase tracking-widest leading-tight">Você precisa cadastrar uma chave pix antes de continuar</span>
                </div>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl">
             <Card className="bg-white rounded-[40px] p-12 border border-neutral-100 shadow-sm flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
                <div className="p-6 bg-white rounded-[32px] shadow-2xl border border-neutral-50 relative group">
                   {pixImage ? (
                      <img src={pixImage} alt="Pix QR Code" className="w-[240px] h-[240px] object-contain" />
                   ) : (
                      <QRCodeSVG value={pixPayload} size={240} fgColor="#0c0a09" />
                   )}
                   <div className="absolute inset-0 flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]">
                      <button 
                        onClick={handleDownloadQR}
                        className="bg-[var(--brand-accent)] text-white p-4 rounded-full shadow-lg"
                      >
                         <Download className="h-6 w-6" />
                      </button>
                   </div>
                </div>
                <div className="text-center">
                   <p className="text-3xl font-black text-[#0c0a09] tracking-tighter">{formatCurrency(value) || "Valor em Aberto"}</p>
                   <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em] mt-1">{description || "Pagamento Sem Descrição"}</p>
                   {userName !== "---" && (
                      <p className="text-[10px] bg-neutral-100 px-3 py-1 rounded-full font-black text-neutral-500 uppercase mt-4 mx-auto w-fit">{userName}</p>
                   )}
                </div>
             </Card>

             <div className="space-y-6 flex flex-col justify-center">
                <Button 
                   disabled={!pixPayload}
                   onClick={handleCopyCode}
                   className="w-full h-16 bg-[#0c0a09] hover:bg-neutral-800 text-white rounded-2xl font-black text-lg flex items-center gap-4 transition-all active:scale-95 group disabled:opacity-50"
                >
                   <Copy className="h-6 w-6 text-[var(--brand-accent)] group-hover:scale-110 transition-transform" />
                   {pixPayload ? "COPIAR CÓDIGO PIX" : "CÓDIGO INDISPONÍVEL"}
                </Button>
                <Button 
                   onClick={handleShare}
                   className="w-full h-16 bg-white border-2 border-neutral-100 hover:border-[var(--brand-accent)]/20 hover:bg-neutral-50 text-[#0c0a09] rounded-2xl font-black text-lg flex items-center gap-4 transition-all active:scale-95"
                >
                   <Share2 className="h-6 w-6 text-[var(--brand-accent)]" />
                   COMPARTILHAR
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setStep("setup")}
                  className="w-full h-16 text-neutral-400 hover:text-[var(--brand-accent)] font-black uppercase tracking-widest text-[10px] flex items-center gap-3"
                >
                   <RefreshCw className="h-4 w-4" />
                   Gerar Novo QR Code
                </Button>
             </div>
          </div>
        )}
      </div>

      {/* Side Column */}
      <div className="w-[380px] shrink-0 space-y-8">
         <Card className="rounded-[40px] border-0 bg-[#0c0a09] p-10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-accent)]/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-6">
               <div className="w-16 h-16 bg-[var(--brand-accent)] rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20">
                  <Diamond className="h-8 w-8 text-white" />
               </div>
               <h3 className="text-2xl font-black leading-tight">G8Pay &bull; Business</h3>
               <p className="text-xs text-white/50 leading-relaxed font-bold uppercase tracking-wider">Aumente suas vendas aceitando Pix. Gestão completa de recebimentos em tempo real.</p>
               <Button className="w-full bg-white text-[#0c0a09] hover:bg-white/90 rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 shadow-xl shadow-black/20 transition-all active:scale-95">CONHECER AGORA</Button>
            </div>
         </Card>
      </div>
    </div>
  );
}
