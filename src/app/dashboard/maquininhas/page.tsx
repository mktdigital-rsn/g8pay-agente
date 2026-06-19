"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { currentBrand } from "@/config/brand";
import {
  CreditCard,
  Store,
  Truck,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Wifi,
  Smartphone,
  AlertCircle,
  ChevronRight,
  MapPin,
  Package,
  Clock,
  Star,
  TrendingUp,
  Loader2,
  FileText,
  FileUp,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type MaquininhaModel = {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: string;
  taxRate: string;
  icon: React.ElementType;
  popular?: boolean;
  color: string;
  revenueLabel: string;
};

const modelos: MaquininhaModel[] = [
  {
    id: "g8-smart",
    name: currentBrand.id === "g8" ? "G8 Smart" : `${currentBrand.shortName} Smart`,
    description: "Compacta e inteligente. Ideal para o dia a dia.",
    features: ["Wi-Fi + Chip 4G", "NFC Contactless", "Bateria 12h", "Impressão rápida"],
    price: "R$ 89,90 / mês",
    taxRate: "1,99%",
    icon: Smartphone,
    color: "from-orange-500 to-amber-500",
    revenueLabel: "Até R$ 20 mil / mês",
  },
  {
    id: "g8-pro",
    name: currentBrand.id === "g8" ? "G8 Pro" : `${currentBrand.shortName} Pro`,
    description: "Para alto volume de vendas. Tela touch de 5.5 polegadas.",
    features: ["Android integrado", "Tela 5.5\" HD", "4G + Wi-Fi + Bluetooth", "Impressão térmica"],
    price: "R$ 89,90 / mês",
    taxRate: "1,49%",
    icon: CreditCard,
    popular: true,
    color: "from-[var(--brand-accent)] to-[#ea580c]",
    revenueLabel: "Até R$ 500 mil / mês",
  },
  {
    id: "g8-ultra",
    name: currentBrand.id === "g8" ? "G8 Ultra" : `${currentBrand.shortName} Ultra`,
    description: "A mais completa. Gestão total no seu ponto de venda.",
    features: ["PDV completo", "Tela 7\" touch", "Câmera QR", "Relatórios avançados"],
    price: "R$ 89,90 / mês",
    taxRate: "0,99%",
    icon: Store,
    color: "from-zinc-800 to-zinc-900",
    revenueLabel: "Acima de R$ 500 mil / mês",
  },
];

type FormStep = "select" | "form" | "documents" | "confirm" | "success";

export default function MaquininhasPage() {
  const [step, setStep] = useState<FormStep>("form");
  const [selectedModel, setSelectedModel] = useState<MaquininhaModel | null>(modelos[1]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document State
  const [attachedDocs, setAttachedDocs] = useState<string[]>([]);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    // Informações Básicas
    tipoEstabelecimento: "",
    cnpjCpf: "",
    razaoSocial: "",
    tipoEmpresa: "",
    nomeFantasia: "",
    contatoPrincipal: "",
    dataFundacao: "",
    horarioFuncionamento: "",
    site: "",
    shopping: "Não",
    descricaoShopping: "",
    mcc: "",
    cnae: "",

    // Informações Financeiras
    faturamentoMensal: "",
    ticketMedio: "",
    antecipacaoRecebiveis: "",

    // Endereço
    tipoEndereco: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    pais: "Brasil",

    // Quantidade
    quantidade: "1",

    // Dynamic Lists
    contatos: [{ nome: "", cpf: "", email: "", tipoResponsavel: "", dataNascimento: "", nacionalidade: "Brasileira", funcao: "", telefone: "" }],
    contasBancarias: [{ tipoConta: "Conta Corrente", banco: "", agencia: "", conta: "", digito: "" }],
    // Document objects to store file info
    documents: {} as Record<string, { name: string, url: string }[]>
  });

  const [bancosList, setBancosList] = useState<{ code: string, name: string }[]>([
    { code: currentBrand.bankCode, name: currentBrand.bankName },
    { code: "382", name: "FIDUCIA I S.C.M. S/A" },
    { code: "001", name: "Banco do Brasil" },
    { code: "033", name: "Santander" },
    { code: "104", name: "Caixa Econômica Federal" },
    { code: "237", name: "Bradesco" },
    { code: "341", name: "Itaú Unibanco" },
  ]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("https://brasilapi.com.br/api/banks/v1");
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data
            .filter(b => b.code && b.name)
            .map(b => ({
              code: String(b.code).padStart(3, '0'),
              name: b.name
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          // Ensure dynamic brand bank and Fiducia are at the top
          const important = [
            { code: currentBrand.bankCode, name: currentBrand.bankName },
            { code: "382", name: "FIDUCIA I S.C.M. S/A" }
          ];

          const filtered = formatted.filter(b => b.code !== currentBrand.bankCode && b.code !== "382");
          setBancosList([...important, ...filtered]);
        }
      } catch (err) {
        console.error("Erro ao buscar bancos:", err);
      }
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    // Scroll all potential scrollable elements/containers to the top
    const containers = document.querySelectorAll(".maquininhas-container, .overflow-y-auto, main");
    containers.forEach(el => {
      el.scrollTop = 0;
    });
    window.scrollTo(0, 0);
  }, [step]);

  const normalizeFileName = (type: string, originalName: string) => {
    const extension = originalName.split('.').pop();
    const cleanType = type.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `${cleanType}.${extension}`;
  };

  const maskCpfCnpj = (val: string) => {
    const v = val.replace(/\D/g, "");
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4").substring(0, 14);
    }
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5").substring(0, 18);
  };

  const handleCnpjLookup = async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    if (cleanCnpj.length === 14) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
        const data = await res.json();
        if (data && !data.message) {
          // Parse tipoEmpresa based on porte, opcao_pelo_mei, natureza_juridica
          let parsedTipoEmpresa = "";
          if (data.opcao_pelo_mei === true) {
            parsedTipoEmpresa = "MEI";
          } else if (data.natureza_juridica && (data.natureza_juridica.toLowerCase().includes("limitada") || data.natureza_juridica.toLowerCase().includes("ltda"))) {
            parsedTipoEmpresa = "LTDA";
          } else if (data.natureza_juridica && (data.natureza_juridica.toLowerCase().includes("anônima") || data.natureza_juridica.toLowerCase().includes("s/a") || data.natureza_juridica.toLowerCase().includes("s.a."))) {
            parsedTipoEmpresa = "S.A.";
          } else if (data.porte === "MICRO EMPRESA" || data.codigo_porte === 1) {
            parsedTipoEmpresa = "ME";
          } else if (data.porte === "EMPRESA DE PEQUENO PORTE" || data.codigo_porte === 3) {
            parsedTipoEmpresa = "EPP";
          }

          // Phone numbers
          let parsedPhone = "";
          if (data.ddd_telefone_1) {
            parsedPhone = maskPhone(data.ddd_telefone_1);
          } else if (data.ddd_telefone_2) {
            parsedPhone = maskPhone(data.ddd_telefone_2);
          }

          // Parse capital social to faturamentoMensal
          let parsedFaturamento = "";
          if (data.capital_social) {
            parsedFaturamento = new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(data.capital_social);
          }

          setFormData(prev => ({
            ...prev,
            tipoEstabelecimento: "Pessoa Jurídica",
            razaoSocial: data.razao_social || prev.razaoSocial,
            nomeFantasia: data.nome_fantasia || data.razao_social || prev.nomeFantasia,
            tipoEmpresa: parsedTipoEmpresa || prev.tipoEmpresa,
            contatoPrincipal: parsedPhone || prev.contatoPrincipal,
            dataFundacao: data.data_inicio_atividade || prev.dataFundacao,
            mcc: data.codigo_municipio ? String(data.codigo_municipio) : (data.codigo_municipio_ibge ? String(data.codigo_municipio_ibge) : prev.mcc),
            cnae: data.cnae_fiscal ? String(data.cnae_fiscal) : prev.cnae,
            faturamentoMensal: parsedFaturamento || prev.faturamentoMensal,
            tipoEndereco: "Comercial",
            cep: data.cep ? maskCep(data.cep) : prev.cep,
            rua: data.logradouro || prev.rua,
            numero: data.numero || prev.numero,
            complemento: data.complemento || prev.complemento,
            bairro: data.bairro || prev.bairro,
            cidade: data.municipio || prev.cidade,
            estado: data.uf || prev.estado
          }));
          toast.success("Dados da empresa importados com sucesso!");
        }
      } catch (err) {
        console.error("Erro ao buscar CNPJ:", err);
      }
    }
  };

  const maskCep = (val: string) => {
    return val.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2").substring(0, 9);
  };

  const maskPhone = (val: string) => {
    const v = val.replace(/\D/g, "");
    if (v.length > 10) {
      return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").substring(0, 15);
    }
    return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3").substring(0, 14);
  };

  const maskCurrency = (val: string) => {
    const v = val.replace(/\D/g, "");
    if (!v) return "";
    const value = parseInt(v) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    updateField("cep", maskCep(cep));

    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        // Try internal bankwhitelabel API first
        const res = await api.get(`/api/banco/util/buscar-cep/${cleanCep}`).catch(() => null);

        let data = res?.data?.data || res?.data;

        // Fallback to ViaCEP if internal fails or returns no data
        if (!data || !data.logradouro) {
          const viaRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          data = await viaRes.json();
        }

        if (data && !data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro || data.rua || prev.rua,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || data.cidade || prev.cidade,
            estado: data.uf || data.estado || prev.estado
          }));
          toast.success("Endereço preenchido automaticamente!");
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (docType: string, file: File) => {
    const normalizedName = normalizeFileName(docType, file.name);
    const fakeUrl = URL.createObjectURL(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData(prev => {
        const currentDocs = prev.documents[docType] || [];
        const maxFiles = docType === "Foto da Fachada" ? 3 : 1;

        if (currentDocs.length >= maxFiles) {
          toast.error(`Limite de arquivos para ${docType} atingido.`);
          return prev;
        }

        return {
          ...prev,
          documents: {
            ...prev.documents,
            [docType]: [...currentDocs, { name: normalizedName, url: fakeUrl, base64 }]
          }
        };
      });
    };
    reader.readAsDataURL(file);

    if (!attachedDocs.includes(docType)) {
      setAttachedDocs(prev => [...prev, docType]);
    }
    toast.success(`${docType} anexado como ${normalizedName}!`);
  };

  const removeDoc = (docType: string, index: number) => {
    setFormData(prev => {
      const newDocs = [...(prev.documents[docType] || [])];
      newDocs.splice(index, 1);

      const newDocuments = { ...prev.documents, [docType]: newDocs };

      if (newDocs.length === 0) {
        setAttachedDocs(prevAttached => prevAttached.filter(d => d !== docType));
      }

      return { ...prev, documents: newDocuments };
    });
  };

  const addContato = () => {
    setFormData(prev => ({
      ...prev,
      contatos: [...prev.contatos, { nome: "", cpf: "", email: "", tipoResponsavel: "", dataNascimento: "", nacionalidade: "Brasileira", funcao: "", telefone: "" }]
    }));
  };

  const removeContato = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contatos: prev.contatos.filter((_, i) => i !== index)
    }));
  };

  const updateContato = (index: number, field: string, value: string) => {
    const newContatos = [...formData.contatos];
    newContatos[index] = { ...newContatos[index], [field]: value };
    setFormData(prev => ({ ...prev, contatos: newContatos }));
  };

  const addConta = () => {
    setFormData(prev => ({
      ...prev,
      contasBancarias: [...prev.contasBancarias, { tipoConta: "Conta Corrente", banco: "", agencia: "", conta: "", digito: "" }]
    }));
  };

  const removeConta = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contasBancarias: prev.contasBancarias.filter((_, i) => i !== index)
    }));
  };

  const updateConta = (index: number, field: string, value: string) => {
    const newContas = [...formData.contasBancarias];
    newContas[index] = { ...newContas[index], [field]: value };
    setFormData(prev => ({ ...prev, contasBancarias: newContas }));
  };

  const handleSelectModel = (model: MaquininhaModel) => {
    setSelectedModel(model);
    setStep("form");
  };

  const handleSubmitForm = () => {
    // Validate required fields (Strict)
    const required = [
      "tipoEstabelecimento", "cnpjCpf", "tipoEmpresa", "nomeFantasia",
      "contatoPrincipal", "mcc", "cnae", "cep", "rua", "numero",
      "bairro", "cidade", "estado"
    ];

    const missing = required.filter((f) => !formData[f as keyof typeof formData]);

    if (missing.length > 0) {
      toast.error(`Campos obrigatórios pendentes: ${missing.length}. Por favor, preencha todos os campos marcados com *.`, {
        description: "Verifique os dados básicos e de endereço."
      });
      return;
    }

    // Validate dynamic lists
    const contactMissing = formData.contatos.some(c => !c.nome || !c.cpf || !c.telefone);
    if (contactMissing) {
      toast.error("Preencha os dados obrigatórios de todos os contatos.");
      return;
    }

    const bankMissing = formData.contasBancarias.some(b => !b.banco || !b.agencia || !b.conta);
    if (bankMissing) {
      toast.error("Preencha os dados bancários completos.");
      return;
    }

    setStep("confirm");
  };

  const handleSubmitDocuments = () => {
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const agentId = localStorage.getItem("agentId") || "unknown-agent";
      const payload = {
        ...formData,
        agentId,
      };

      const response = await api.post("/api/establishments", payload);
      if (response.data && response.data.success) {
        toast.success("Solicitação enviada com sucesso!");
        setStep("success");
      } else {
        throw new Error(response.data?.error || "Erro ao salvar estabelecimento.");
      }
    } catch (err: any) {
      console.error("Error saving E.C.:", err);
      
      const serverError = err.response?.data?.error || "";
      const localError = err.message || "";
      const fullErrorText = `${serverError} ${localError}`;
      
      let errMsg = "Ocorreu um erro ao processar o credenciamento do estabelecimento. Verifique os dados e tente novamente.";
      
      if (fullErrorText.includes("UNIQUE constraint failed") || fullErrorText.includes("SQLITE_CONSTRAINT_UNIQUE")) {
        errMsg = "Este CNPJ/CPF já está cadastrado para outro estabelecimento comercial.";
      } else if (fullErrorText.includes("NOT NULL constraint failed") || fullErrorText.includes("SQLITE_CONSTRAINT_NOTNULL")) {
        errMsg = "Por favor, preencha todos os campos obrigatórios e envie os documentos solicitados.";
      } else if (fullErrorText.includes("FOREIGN KEY constraint failed") || fullErrorText.includes("SQLITE_CONSTRAINT_FOREIGNKEY")) {
        errMsg = "Erro de consistência de dados (Agente responsável não encontrado).";
      } else if (fullErrorText.includes("Network Error") || fullErrorText.includes("Failed to fetch")) {
        errMsg = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
      } else if (serverError && !serverError.includes("insert into") && !serverError.includes("constraint") && !serverError.includes("values")) {
        errMsg = serverError;
      }
      
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep("form");
    setSelectedModel(modelos[1]);
    setFormData({
      tipoEstabelecimento: "",
      cnpjCpf: "",
      razaoSocial: "",
      tipoEmpresa: "",
      nomeFantasia: "",
      contatoPrincipal: "",
      dataFundacao: "",
      horarioFuncionamento: "",
      site: "",
      shopping: "Não",
      descricaoShopping: "",
      mcc: "",
      cnae: "",
      faturamentoMensal: "",
      ticketMedio: "",
      antecipacaoRecebiveis: "",
      tipoEndereco: "",
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      pais: "Brasil",
      quantidade: "1",
      contatos: [{ nome: "", cpf: "", email: "", tipoResponsavel: "", dataNascimento: "", nacionalidade: "Brasileira", funcao: "", telefone: "" }],
      contasBancarias: [{ tipoConta: "Conta Corrente", banco: "", agencia: "", conta: "", digito: "" }],
      documents: {}
    });
  };

  return (
    <div className="p-2 sm:p-4 md:p-8 xl:p-12 flex flex-col gap-6 md:gap-8 h-full overflow-y-auto w-full no-scrollbar bg-[#f8f9fa] relative maquininhas-container">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--brand-accent)]/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

      <div className="flex-1 space-y-12 relative z-10">
        {/* Header */}
        <div className="space-y-3 px-2">
          <Badge variant="secondary" className="bg-orange-500/10 text-brand-accent border-0 px-4 py-1.5 font-black text-[11px] uppercase tracking-[0.2em] rounded-sm">
            Credenciamento
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09]">
            Cadastro de <span className="text-brand-accent">Estabelecimento</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-bold opacity-75">
            Credencie novos estabelecimentos comerciais para as maquininhas G8Pay.
          </p>
        </div>

        {/* Step: Select Model */}
        {step === "select" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Metrics row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Zap, label: "Taxa a partir de", value: "0,99%", sub: "no débito" },
                { icon: Clock, label: "Receba em", value: "1 dia útil", sub: "D+1 automático" },
                { icon: Shield, label: "Segurança", value: "Certificado PCI", sub: "nível máximo" },
              ].map((metric, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-sm border border-neutral-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-[var(--brand-accent)]/20 transition-all"
                >
                  <div className="w-12 h-12 bg-[var(--brand-accent)]/10 rounded-sm flex items-center justify-center text-[var(--brand-accent)] shrink-0 group-hover:scale-110 transition-transform">
                    <metric.icon className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest">{metric.label}</p>
                    <p className="text-xl font-black text-[#0c0a09] tracking-tight leading-tight">{metric.value}</p>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{metric.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Models grid */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#0c0a09] tracking-tight uppercase tracking-[0.1em]">Escolha o modelo ideal</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {modelos.map((model) => {
                  const IconComp = model.icon;
                  return (
                    <div
                      key={model.id}
                      className={`bg-white rounded-sm border ${
                        model.popular
                          ? currentBrand.id === "galapagos"
                            ? "border-blue-500/30 shadow-xl shadow-blue-100/50"
                            : "border-[var(--brand-accent)]/30 shadow-xl shadow-orange-100/50"
                          : "border-neutral-100 shadow-sm"
                      } overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer relative`}
                      onClick={() => handleSelectModel(model)}
                    >
                      {model.popular && (
                        <div className={`absolute top-0 inset-x-0 h-1 ${
                          currentBrand.id === "galapagos"
                            ? "bg-[var(--brand-accent)]"
                            : "bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c]"
                        }`} />
                      )}
                      <div className={`h-40 bg-gradient-to-br ${
                        currentBrand.id === "galapagos"
                          ? model.id === "g8-pro"
                            ? "from-[#0b1329] to-[#1e3a8a]"
                            : model.id === "g8-smart"
                            ? "from-[#0b1329] to-[#111c3a]"
                            : "from-[#0a0f1d] to-[#0f172a]"
                          : model.color
                      } flex items-center justify-center relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent)]" />
                        <IconComp className="h-16 w-16 text-white/90 drop-shadow-lg group-hover:scale-125 transition-transform duration-500" />
                        {model.popular && (
                          <Badge className="absolute top-4 right-4 bg-white text-[var(--brand-accent)] border-0 font-black text-[8px] uppercase tracking-widest shadow-lg">
                            <Star className="h-3 w-3 mr-1 fill-[var(--brand-accent)]" /> Mais vendido
                          </Badge>
                        )}
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-[#0c0a09] uppercase tracking-tight">{model.name}</h3>
                          <div className="inline-flex items-center px-2 py-0.5 bg-[var(--brand-accent)]/10 rounded-sm border border-[var(--brand-accent)]/20">
                            <TrendingUp className="h-3 w-3 text-[var(--brand-accent)] mr-1.5" />
                            <span className="text-[13px] font-black text-[var(--brand-accent)] uppercase tracking-wider">
                              {model.revenueLabel}
                            </span>
                          </div>
                          <p className="text-[12px] font-bold text-neutral-600 mt-2 leading-tight">{model.description}</p>
                        </div>
                        <div className="space-y-2">
                          {model.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                              <span className="text-xs font-bold text-neutral-600">{feat}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-6 border-t border-neutral-50 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Valor</p>
                              <p className="text-lg font-black text-[#0c0a09]">{model.price}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Taxa débito</p>
                              <p className="text-lg font-black text-[var(--brand-accent)]">{model.taxRate}</p>
                            </div>
                          </div>
                          <Button className={`w-full h-12 text-white rounded-sm font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
                            currentBrand.id !== "g8"
                              ? "bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)]"
                              : "bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] hover:from-[#ea580c] hover:to-[var(--brand-accent)]"
                          }`}>
                            Solicitar <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info banner */}
            <div className="bg-[#0c0a09] rounded-sm p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-[var(--brand-accent)]/10 rounded-full blur-3xl" />
              <div className={`w-20 h-20 rounded-sm flex items-center justify-center shrink-0 shadow-2xl ${
                currentBrand.id === "galapagos"
                  ? "bg-gradient-to-br from-[#0b1329] to-[#1e3a8a]"
                  : "bg-gradient-to-br from-[var(--brand-accent)] to-[#ea580c]"
              }`}>
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1 space-y-2 text-center md:text-left relative z-10">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Fature mais com {currentBrand.id === "g8" ? "G8 Pay" : currentBrand.name}</h3>
                <p className="text-sm text-white/50 font-medium max-w-lg leading-relaxed">
                  Nossas maquininhas aceitam todas as bandeiras: Visa, Mastercard, Elo, Amex, Hipercard e muito mais. Receba via débito, crédito e voucher.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                {["VISA", "MASTER", "ELO"].map((brand) => (
                  <div key={brand} className="w-16 h-10 bg-white/10 border border-white/10 rounded-sm flex items-center justify-center">
                    <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">{brand}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Form */}
        {step === "form" && selectedModel && (
          <div className="max-w-7xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Selected model summary hidden for direct merchant registration */}

            {/* Form Sections */}
            <div className="space-y-12">
              {/* Informações Básicas */}
              <Card className="p-8 border-l-[6px] border-l-[var(--brand-accent)] shadow-xl space-y-8">
                <div className="flex items-center gap-3 border-b border-neutral-100 pb-5">
                  <div className="w-10 h-10 bg-[var(--brand-accent)] rounded-sm flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-[0.1em]">Informações Básicas</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <FormSelect
                    label="Tipo de Estabelecimento"
                    required
                    value={formData.tipoEstabelecimento}
                    onChange={(v) => updateField("tipoEstabelecimento", v)}
                    options={["Pessoa Física", "Pessoa Jurídica"]}
                  />
                  <FormField
                    label="CPF/CNPJ"
                    required
                    value={formData.cnpjCpf}
                    onChange={(v) => {
                      const masked = maskCpfCnpj(v);
                      updateField("cnpjCpf", masked);
                      if (masked.length > 14) handleCnpjLookup(masked);
                    }}
                    placeholder="XXX.XXX.XXX-XX"
                  />
                  <FormField label="Razão Social" value={formData.razaoSocial} onChange={(v) => updateField("razaoSocial", v)} placeholder="Razão Social da Empresa" />

                  <FormSelect
                    label="Tipo de Empresa"
                    required
                    value={formData.tipoEmpresa}
                    onChange={(v) => updateField("tipoEmpresa", v)}
                    options={["MEI", "ME", "EPP", "LTDA", "S.A."]}
                  />
                  <FormField label="Nome Fantasia" required value={formData.nomeFantasia} onChange={(v) => updateField("nomeFantasia", v)} placeholder="Nome Fantasia" />
                  <FormField label="Contato Principal" required value={formData.contatoPrincipal} onChange={(v) => updateField("contatoPrincipal", maskPhone(v))} placeholder="(XX) X XXXX-XXXX" />

                  <FormField label="Data de Fundação" type="date" required value={formData.dataFundacao} onChange={(v) => updateField("dataFundacao", v)} />
                  <FormSelect
                    label="Horário de Funcionamento"
                    required
                    value={formData.horarioFuncionamento}
                    onChange={(v) => updateField("horarioFuncionamento", v)}
                    options={["08h as 18h", "09h às 19h", "24 horas", "Comercial"]}
                  />
                  <FormField label="Site" value={formData.site} onChange={(v) => updateField("site", v)} placeholder="https://www.xxxxx.com.br" />

                  <FormSelect
                    label="Shopping"
                    value={formData.shopping}
                    onChange={(v) => updateField("shopping", v)}
                    options={["Não", "Sim"]}
                  />
                  <FormField label="Descrição do Shopping" value={formData.descricaoShopping} onChange={(v) => updateField("descricaoShopping", v)} placeholder="Nome do Shopping ou Edifício" />
                  <div className="space-y-2">
                    <FormField label="MCC" required value={formData.mcc} onChange={(v) => updateField("mcc", v)} placeholder="XXXX" />
                    <p className="text-[9px] text-neutral-400 font-bold uppercase italic tracking-widest leading-none">Código MCC será preenchido automaticamente</p>
                  </div>
                  <div className="space-y-2">
                    <FormField label="CNAE" required value={formData.cnae} onChange={(v) => updateField("cnae", v)} placeholder="XXXX-X/XX" />
                    <p className="text-[9px] text-neutral-400 font-bold uppercase italic tracking-widest leading-none">CNAE será preenchido automaticamente</p>
                  </div>
                </div>
              </Card>

              {/* Endereço */}
              <Card className="p-8 border-l-[6px] border-l-amber-600 shadow-xl space-y-8">
                <div className="flex items-center gap-3 border-b border-neutral-100 pb-5">
                  <div className="w-10 h-10 bg-amber-600 rounded-[2px] flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-[0.1em]">Endereço</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <FormSelect
                    label="Tipo de Endereço"
                    required
                    value={formData.tipoEndereco}
                    onChange={(v) => updateField("tipoEndereco", v)}
                    options={["Comercial", "Residencial", "Cobranca"]}
                  />
                  <div className="space-y-2">
                    <FormField label="CEP" required value={formData.cep} onChange={(v) => handleCepChange(v)} placeholder="XXXXX-XXX" />
                    <p className="text-[9px] text-neutral-400 font-bold uppercase italic tracking-widest leading-none">
                      {isSearchingCep ? "Buscando dados..." : "Digite o CEP para buscar automaticamente"}
                    </p>
                  </div>
                  <FormField label="Rua" required value={formData.rua} onChange={(v) => updateField("rua", v)} placeholder="Nome da Rua / Av" />

                  <FormField label="Número" required value={formData.numero} onChange={(v) => updateField("numero", v)} placeholder="000" />
                  <FormField label="Complemento" value={formData.complemento} onChange={(v) => updateField("complemento", v)} placeholder="Sala, Loja, etc" />
                  <FormField label="Bairro" required value={formData.bairro} onChange={(v) => updateField("bairro", v)} placeholder="Bairro" />

                  <FormField label="Cidade" required value={formData.cidade} onChange={(v) => updateField("cidade", v)} placeholder="Cidade" />
                  <FormSelect
                    label="Estado"
                    required
                    value={formData.estado}
                    onChange={(v) => updateField("estado", v)}
                    options={["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]}
                  />
                  <div className="space-y-2">
                    <FormField label="País" required value={formData.pais} onChange={(v) => updateField("pais", v)} />
                    <p className="text-[9px] text-neutral-400 font-bold uppercase italic tracking-widest leading-none">Nome do País</p>
                  </div>
                </div>
              </Card>

              {/* Informações Financeiras */}
              <Card className="p-8 border-l-[6px] border-l-blue-500 shadow-xl space-y-8">
                <div className="flex items-center gap-3 border-b border-neutral-100 pb-5">
                  <div className="w-10 h-10 bg-blue-500 rounded-sm flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-[0.1em]">Informações Financeiras</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FormField label="Faturamento Mensal" required value={formData.faturamentoMensal} onChange={(v) => updateField("faturamentoMensal", maskCurrency(v))} placeholder="R$ 0,00" />
                  <FormField label="Ticket Médio" required value={formData.ticketMedio} onChange={(v) => updateField("ticketMedio", maskCurrency(v))} placeholder="R$ 0,00" />
                  <FormSelect
                    label="Antecipação de Recebíveis"
                    required
                    value={formData.antecipacaoRecebiveis}
                    onChange={(v) => updateField("antecipacaoRecebiveis", v)}
                    options={["Sim", "Não"]}
                  />
                </div>
              </Card>

              {/* Contas Bancárias */}
              <Card className="p-8 border-l-[6px] border-l-indigo-600 shadow-xl space-y-8">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-[2px] flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-[0.1em]">Contas Bancárias</h3>
                  </div>
                  <Button onClick={addConta} className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-[0.2em] px-6 rounded-[2px]">
                    + Adicionar Conta
                  </Button>
                </div>

                <div className="space-y-8">
                  {formData.contasBancarias.map((conta, idx) => (
                    <div key={idx} className="p-8 bg-neutral-50/50 rounded-[2px] border-2 border-dashed border-neutral-200 relative group animate-in fade-in duration-300">
                      <div className="absolute top-4 right-4 flex items-center gap-4">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white px-3 py-1 rounded-[2px] border border-neutral-100 shadow-sm">Conta {idx + 1}</span>
                        {formData.contasBancarias.length > 1 && (
                          <Button variant="destructive" size="sm" onClick={() => removeConta(idx)} className="h-8 text-[9px] font-black uppercase tracking-widest px-4 rounded-[2px]">Remover</Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-10">
                        <div className="col-span-12 md:col-span-6 lg:col-span-3">
                          <FormSelect
                            label="Tipo de Conta"
                            value={conta.tipoConta}
                            onChange={(v) => updateConta(idx, "tipoConta", v)}
                            options={["Conta Corrente", "Conta Poupança (EM BREVE)", "Conta Pagamento (EM BREVE)"]}
                          />
                        </div>
                        <div className="col-span-12 md:col-span-6 lg:col-span-3">
                          <FormSelect
                            label="Banco"
                            value={conta.banco}
                            onChange={(v) => updateConta(idx, "banco", v)}
                            options={bancosList.map(b => `${b.code} - ${b.name}`)}
                          />
                        </div>
                        <div className="col-span-12 md:col-span-4 lg:col-span-2">
                          <FormField label="Agência" value={conta.agencia} onChange={(v) => updateConta(idx, "agencia", v.replace(/\D/g, "").substring(0, 4))} placeholder="0000" />
                        </div>
                        <div className="col-span-12 md:col-span-5 lg:col-span-3">
                          <FormField label="Conta" value={conta.conta} onChange={(v) => updateConta(idx, "conta", v.replace(/\D/g, "").substring(0, 12))} placeholder="000000" />
                        </div>
                        <div className="col-span-12 md:col-span-3 lg:col-span-1">
                          <FormField label="Dígito" value={conta.digito} onChange={(v) => updateConta(idx, "digito", v.replace(/\D/g, "").substring(0, 1))} placeholder="X" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Contatos */}
              <Card className="p-8 border-l-[6px] border-l-green-500 shadow-xl space-y-8">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-sm flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-[0.1em]">Contatos</h3>
                  </div>
                  <Button onClick={addContato} className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-[0.2em] px-6 rounded-[4px]">
                    + Adicionar Contato
                  </Button>
                </div>

                <div className="space-y-8">
                  {formData.contatos.map((contato, idx) => (
                    <div key={idx} className="p-8 bg-neutral-50/50 rounded-[2px] border-2 border-dashed border-neutral-200 relative group animate-in fade-in duration-300">
                      <div className="absolute top-4 right-4 flex items-center gap-4">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-neutral-100 shadow-sm">Contato {idx + 1}</span>
                        {formData.contatos.length > 1 && (
                          <Button variant="destructive" size="sm" onClick={() => removeContato(idx)} className="h-8 text-[9px] font-black uppercase tracking-widest px-4 rounded-[2px]">Remover</Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                        <FormField label="Nome" required value={contato.nome} onChange={(v) => updateContato(idx, "nome", v)} placeholder="Nome completo" />
                        <FormField label="CPF" required value={contato.cpf} onChange={(v) => updateContato(idx, "cpf", maskCpfCnpj(v))} placeholder="XXX.XXX.XXX-XX" />
                        <FormField label="Email" required value={contato.email} onChange={(v) => updateContato(idx, "email", v)} placeholder="nome@email.com" />

                        <FormSelect
                          label="Tipo de Responsável"
                          required
                          value={contato.tipoResponsavel}
                          onChange={(v) => updateContato(idx, "tipoResponsavel", v)}
                          options={["Sócio", "Diretor", "Procurador", "Outros"]}
                        />
                        <FormField label="Data de Nascimento" type="date" required value={contato.dataNascimento} onChange={(v) => updateContato(idx, "dataNascimento", v)} />
                        <FormField label="Nacionalidade" required value={contato.nacionalidade} onChange={(v) => updateContato(idx, "nacionalidade", v)} placeholder="Brasileira" />

                        <FormField label="Função" required value={contato.funcao} onChange={(v) => updateContato(idx, "funcao", v)} placeholder="Ex: Administrador" />
                        <FormField label="Telefone" required value={contato.telefone} onChange={(v) => updateContato(idx, "telefone", maskPhone(v))} placeholder="(XX) X XXXX-XXXX" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quantidade */}
              <Card className="p-8 border-l-[6px] border-l-black shadow-xl bg-neutral-900/5 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-[2px] flex items-center justify-center">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-[0.1em]">Quantidade de Máquinas Solicitadas</h3>
                </div>
                <div className="max-w-xs space-y-4">
                  <FormField label="Quantidade de Máquinas" value={formData.quantidade} onChange={(v) => updateField("quantidade", v)} placeholder="01" />
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tight leading-relaxed">Informe a quantidade de máquinas que o estabelecimento está solicitando</p>
                </div>
              </Card>

              {/* Seção de Documentos - Botão Solicitado */}
              <Card className="p-8 border-l-[6px] border-l-[var(--brand-accent)] shadow-xl bg-orange-50/30 space-y-6 rounded-[2px]">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--brand-accent)] rounded-[2px] flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <FileUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-[#0c0a09] uppercase tracking-[0.1em]">Deseja anexar documentos agora?</h3>
                      {attachedDocs.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {attachedDocs.length} documentos anexados:
                          </p>
                          <p className="text-[8px] font-bold text-neutral-500 uppercase">{attachedDocs.join(", ")}</p>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">Anexe o contrato, CNPJ e fotos para agilizar seu credenciamento</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => setStep("documents")}
                    className="bg-white border-2 border-[var(--brand-accent)] text-[var(--brand-accent)] hover:bg-[var(--brand-accent)] hover:text-white transition-all font-black text-[11px] uppercase tracking-[0.2em] px-8 h-14 rounded-[2px]"
                  >
                    {attachedDocs.length > 0 ? "Gerenciar Documentos" : "+ Anexar Documentos"}
                  </Button>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="pt-10 flex flex-col items-center gap-6">
                <Button
                  onClick={handleSubmitForm}
                  className={`w-full max-w-2xl h-20 text-white rounded-[2px] font-black text-lg uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${
                    currentBrand.id !== "g8"
                      ? "bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] shadow-2xl shadow-[var(--brand-accent-light)]"
                      : "bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] hover:from-[#ea580c] hover:to-[var(--brand-accent)] shadow-2xl shadow-orange-500/20"
                  }`}
                >
                  Revisar Solicitação e Continuar <ArrowRight className="h-6 w-6 ml-4" />
                </Button>
                <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">
                  <Shield className="h-4 w-4 text-green-500" />
                  Solicitação segura e criptografada
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Documents (NEW) */}
        {step === "documents" && selectedModel && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="text-center space-y-3">
              <Badge className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0 px-4 py-1 text-[10px] font-black uppercase tracking-widest">Documentação</Badge>
              <h2 className="text-4xl font-black text-[#0c0a09] tracking-tighter uppercase leading-none">Envio de Documentos</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-[0.2em]">Gerencie os documentos obrigatórios da sua empresa</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-6 rounded-[2px] flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--brand-accent)]/20 rounded-[2px] flex items-center justify-center text-[var(--brand-accent)] shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-black text-[var(--brand-accent)] uppercase tracking-widest">Atenção</p>
                <p className="text-sm font-bold text-neutral-700">Os documentos são opcionais para o envio inicial, mas recomendados para facilitar o processo de credenciamento.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <DocumentUploadCard
                title="Contrato Assinado"
                desc={`Documento que formaliza a parceria com a ${currentBrand.id === "g8" ? "G8 Pay" : currentBrand.name}`}
                attached={(formData.documents["Contrato Assinado"]?.length || 0) > 0}
                files={formData.documents["Contrato Assinado"] || []}
                onUpload={(f) => handleFileUpload("Contrato Assinado", f)}
                onRemove={(idx) => removeDoc("Contrato Assinado", idx)}
              />
              <DocumentUploadCard
                title="Contrato / Estatuto Social"
                desc="Cópia do instrumento de constituição ou Ficha Cadastral Jacesp"
                attached={(formData.documents["Contrato / Estatuto Social"]?.length || 0) > 0}
                files={formData.documents["Contrato / Estatuto Social"] || []}
                onUpload={(f) => handleFileUpload("Contrato / Estatuto Social", f)}
                onRemove={(idx) => removeDoc("Contrato / Estatuto Social", idx)}
              />
              <DocumentUploadCard
                title="Cartão CNPJ (RCFB)"
                desc="Comprovante de inscrição e de situação cadastral atualizado"
                attached={(formData.documents["Cartão CNPJ (RCFB)"]?.length || 0) > 0}
                files={formData.documents["Cartão CNPJ (RCFB)"] || []}
                onUpload={(f) => handleFileUpload("Cartão CNPJ (RCFB)", f)}
                onRemove={(idx) => removeDoc("Cartão CNPJ (RCFB)", idx)}
              />
              <DocumentUploadCard
                title="RG/CNH (Frente)"
                desc="Foto da parte frontal do documento"
                attached={(formData.documents["RG/CNH (Frente)"]?.length || 0) > 0}
                files={formData.documents["RG/CNH (Frente)"] || []}
                onUpload={(f) => handleFileUpload("RG/CNH (Frente)", f)}
                onRemove={(idx) => removeDoc("RG/CNH (Frente)", idx)}
              />
              <DocumentUploadCard
                title="RG/CNH (Verso)"
                desc="Foto da parte traseira do documento"
                attached={(formData.documents["RG/CNH (Verso)"]?.length || 0) > 0}
                files={formData.documents["RG/CNH (Verso)"] || []}
                onUpload={(f) => handleFileUpload("RG/CNH (Verso)", f)}
                onRemove={(idx) => removeDoc("RG/CNH (Verso)", idx)}
              />
              <DocumentUploadCard
                title="Comprovante de endereço da empresa"
                desc="Contas de consumo (luz, água, telefone) dos últimos 90 dias"
                attached={(formData.documents["Comprovante de endereço da empresa"]?.length || 0) > 0}
                files={formData.documents["Comprovante de endereço da empresa"] || []}
                onUpload={(f) => handleFileUpload("Comprovante de endereço da empresa", f)}
                onRemove={(idx) => removeDoc("Comprovante de endereço da empresa", idx)}
              />
              <DocumentUploadCard
                title="Foto da Fachada"
                desc="Envie até 3 fotos do estabelecimento"
                attached={(formData.documents["Foto da Fachada"]?.length || 0) > 0}
                files={formData.documents["Foto da Fachada"] || []}
                onUpload={(f) => handleFileUpload("Foto da Fachada", f)}
                onRemove={(idx) => removeDoc("Foto da Fachada", idx)}
              />
            </div>

            <div className="flex gap-6">
              <Button
                onClick={() => setStep("form")}
                variant="outline"
                className="flex-1 h-20 border-2 border-neutral-200 text-neutral-400 rounded-[2px] font-black text-sm uppercase tracking-[0.2em] hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] hover:bg-orange-50 transition-all"
              >
                Voltar ao Formulário
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                className={`flex-3 h-20 text-white rounded-[2px] font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${
                  currentBrand.id !== "g8"
                    ? "bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] shadow-2xl shadow-[var(--brand-accent-light)]"
                    : "bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] hover:from-[#ea580c] hover:to-[var(--brand-accent)] shadow-2xl shadow-orange-500/20"
                }`}
              >
                Próximo Passo <ArrowRight className="h-6 w-6 ml-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && selectedModel && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="text-center space-y-3">
              <Badge className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0 px-4 py-1 text-[10px] font-black uppercase tracking-widest">Revisão Final</Badge>
              <h2 className="text-4xl font-black text-[#0c0a09] tracking-tighter uppercase leading-none">Confirme sua solicitação</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-[0.2em]">Verifique se todos os dados estão corretos</p>
            </div>

            <div className="bg-white rounded-[2px] border border-neutral-100 shadow-2xl overflow-hidden">
              {/* Model Header */}
              <div className={`p-10 bg-gradient-to-br ${
                currentBrand.id !== "g8"
                  ? currentBrand.id === "galapagos"
                    ? (selectedModel.id === "g8-pro"
                      ? "from-[#0b1329] to-[#1e3a8a]"
                      : selectedModel.id === "g8-smart"
                      ? "from-[#0b1329] to-[#111c3a]"
                      : "from-[#0a0f1d] to-[#0f172a]")
                    : currentBrand.id === "fiscomoney"
                    ? "from-[#1c1f22] to-[#cca43b]"
                    : "from-[#0f0f0f] to-[#cca43b]"
                  : selectedModel.color
              } flex items-center justify-between relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent)]" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 bg-white/20 rounded-[2px] flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/30">
                    <selectedModel.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Modelo Selecionado</p>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">{selectedModel.name}</h2>
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Faturamento Alvo</p>
                  <p className="text-xl font-black text-white uppercase">{selectedModel.revenueLabel}</p>
                </div>
              </div>

              <div className="p-10 space-y-12">
                <ConfirmSection title="Dados da Empresa">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ConfirmRow label="CNPJ/CPF" value={formData.cnpjCpf} />
                    <ConfirmRow label="Razão Social" value={formData.razaoSocial || "---"} />
                    <ConfirmRow label="Nome Fantasia" value={formData.nomeFantasia} />
                    <ConfirmRow label="MCC / CNAE" value={`${formData.mcc} / ${formData.cnae}`} />
                    <ConfirmRow label="Faturamento Mensal" value={formData.faturamentoMensal} />
                    <ConfirmRow label="Ticket Médio" value={formData.ticketMedio} />
                  </div>
                </ConfirmSection>

                <ConfirmSection title="Endereço de Instalação">
                  <div className="p-6 border-2 border-dashed border-neutral-100 rounded-[2px] space-y-4">
                    <ConfirmRow label="Logradouro" value={`${formData.rua}, ${formData.numero}${formData.complemento ? ` - ${formData.complemento}` : ""}`} />
                    <div className="grid grid-cols-3 gap-6">
                      <ConfirmRow label="CEP" value={formData.cep} />
                      <ConfirmRow label="Bairro" value={formData.bairro} />
                      <ConfirmRow label="Cidade/UF" value={`${formData.cidade} - ${formData.estado}`} />
                    </div>
                  </div>
                </ConfirmSection>

                <ConfirmSection title="Dados Bancários para Recebimento">
                  <div className="space-y-4">
                    {formData.contasBancarias.map((b, i) => (
                      <div key={i} className="p-4 bg-neutral-50 rounded-[2px] border border-neutral-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ConfirmRow label="Banco" value={b.banco} />
                        <ConfirmRow label="Agência/Conta" value={`${b.agencia} / ${b.conta}-${b.digito}`} />
                        <ConfirmRow label="Tipo" value={b.tipoConta} />
                      </div>
                    ))}
                  </div>
                </ConfirmSection>

                <ConfirmSection title="Contatos Associados">
                  <div className="space-y-4">
                    {formData.contatos.map((c, i) => (
                      <div key={i} className="p-4 bg-neutral-50 rounded-[2px] border border-neutral-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ConfirmRow label="Nome" value={c.nome} />
                        <ConfirmRow label="CPF" value={c.cpf} />
                        <ConfirmRow label="Telefone" value={c.telefone} />
                      </div>
                    ))}
                  </div>
                </ConfirmSection>

                <ConfirmSection title="Documentação Anexada">
                  {attachedDocs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {attachedDocs.map(doc => (
                        <Badge key={doc} className="bg-green-100 text-green-700 border-green-200 px-3 py-1 font-black text-[9px] uppercase tracking-widest rounded-[2px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> {doc}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-neutral-400 uppercase italic">Nenhum documento anexado (serão solicitados posteriormente)</p>
                  )}
                </ConfirmSection>
              </div>
              <div className="p-10 bg-neutral-50 border-t border-neutral-100 flex gap-6">
                <Button
                  onClick={() => setStep("form")}
                  variant="outline"
                  className="flex-1 h-20 border-2 border-neutral-200 text-neutral-400 rounded-[2px] font-black text-sm uppercase tracking-[0.2em] hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] hover:bg-orange-50 transition-all"
                >
                  Voltar e Corrigir
                </Button>
                 <Button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className={`flex-[2] h-20 text-white rounded-[2px] font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 ${
                    currentBrand.id !== "g8"
                      ? "bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] shadow-2xl shadow-[var(--brand-accent-light)]"
                      : "bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] hover:from-[#ea580c] hover:to-[var(--brand-accent)] shadow-2xl shadow-orange-500/20"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      PROCESSANDO...
                    </>
                  ) : (
                    <>
                      Encerrar e Enviar para Análise <ArrowRight className="h-6 w-6 ml-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-10 py-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 rounded-[2px] flex items-center justify-center text-green-600 shadow-2xl relative border-4 border-white">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-black text-[#0c0a09] tracking-tighter uppercase">Solicitação Enviada!</h2>
              <p className="text-base font-bold text-neutral-400 uppercase tracking-widest">
                Seu pedido de maquininha foi registrado com sucesso.
              </p>
            </div>

            <div className="w-full bg-white rounded-[2px] border border-neutral-100 shadow-2xl p-8 space-y-5 text-left">
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-50">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-black text-[#0c0a09] uppercase tracking-widest">Próximos passos</span>
              </div>
              {[
                "Nossa equipe analisará seu cadastro em até 72h.",
                "Você receberá um e-mail com o status da aprovação.",
                "Após aprovação, a maquininha será enviada ao endereço informado.",
                "Prazo de entrega: 5 a 10 dias úteis.",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--brand-accent)]/10 rounded-sm flex items-center justify-center text-[var(--brand-accent)] shrink-0 mt-0.5">
                    <span className="text-[10px] font-black">{i + 1}</span>
                  </div>
                  <p className="text-sm font-bold text-neutral-500">{text}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={handleReset}
              className={`w-full h-16 text-white rounded-sm font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 transition-all ${
                currentBrand.id !== "g8"
                  ? "bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)]"
                  : "bg-gradient-to-r from-[var(--brand-accent)] to-[#ea580c] hover:from-[#ea580c] hover:to-[var(--brand-accent)]"
              }`}
            >
              Voltar ao início
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──── Reusable sub-components ──── */

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-2.5">
      <label className="text-[11px] font-black text-[#0c0a09] uppercase tracking-widest block flex items-center gap-1">
        {label}
        {required && <span className="text-[var(--brand-accent)] text-sm leading-none">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          currentBrand.id !== "g8"
            ? "h-14 bg-white border-2 border-[var(--brand-accent-light)] focus:border-[var(--brand-accent)] rounded-sm text-sm font-semibold focus:ring-2 focus:ring-[var(--brand-accent-light)] transition-all placeholder:text-neutral-400 text-neutral-800 shadow-sm"
            : "h-14 bg-white border-2 border-neutral-200 rounded-sm text-sm font-black focus:ring-2 focus:ring-[var(--brand-accent)]/30 focus:border-[var(--brand-accent)] transition-all placeholder:text-neutral-400 text-[#0c0a09] shadow-sm"
        }
      />
    </div>
  );
}

function ConfirmSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black text-[var(--brand-accent)] uppercase tracking-[0.2em] border-b border-orange-100 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-black text-neutral-900 uppercase tracking-widest leading-none">
        {label}
      </p>
      <p className="text-sm font-medium text-neutral-600 uppercase tracking-tight break-words">
        {value || "---"}
      </p>
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <label className="text-[11px] font-black text-[#0c0a09] uppercase tracking-widest block flex items-center gap-1">
        {label}
        {required && <span className="text-[var(--brand-accent)] text-sm leading-none">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          currentBrand.id !== "g8"
            ? "h-14 w-full bg-white border-2 border-[var(--brand-accent-light)] focus:border-[var(--brand-accent)] rounded-[2px] px-4 text-sm font-semibold focus:ring-2 focus:ring-[var(--brand-accent-light)] transition-all outline-none text-neutral-800 shadow-sm appearance-none cursor-pointer"
            : "h-14 w-full bg-white border-2 border-neutral-200 rounded-[2px] px-4 text-sm font-black focus:ring-2 focus:ring-[var(--brand-accent)]/30 focus:border-[var(--brand-accent)] transition-all outline-none text-[#0c0a09] shadow-sm appearance-none cursor-pointer"
        }
        style={{
          backgroundImage: currentBrand.id !== "g8"
            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${encodeURIComponent(currentBrand.id === "galapagos" ? "#2563eb" : "#cca43b")}' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`
            : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f97316' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 1rem center',
          backgroundSize: '1.2rem'
        }}
      >
        <option value="" disabled>Selecione...</option>
        {options.map((opt) => (
          <option key={opt} value={opt} disabled={opt.includes("(EM BREVE)")}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function DocumentUploadCard({
  title,
  desc,
  attached,
  files = [],
  onUpload,
  onRemove
}: {
  title: string;
  desc: string;
  attached?: boolean;
  files?: { name: string, url: string }[];
  onUpload: (file: File) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Card className={`p-8 group hover:border-[var(--brand-accent)]/50 transition-all duration-300 rounded-[2px] ${attached ? 'bg-green-50/10 border-green-200' : 'bg-white'}`}>
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className={`w-10 h-10 rounded-[2px] flex items-center justify-center shrink-0 ${attached ? 'bg-green-500 text-white' : 'bg-orange-50 text-[var(--brand-accent)]'}`}>
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#0c0a09] uppercase tracking-[0.1em]">{title}</h4>
              <p className="text-[10px] font-bold text-neutral-400 leading-tight uppercase tracking-widest">{desc}</p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-1 gap-2 mt-4">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-neutral-100 rounded-sm shadow-sm animate-in fade-in slide-in-from-left-2 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-green-50 rounded-sm flex items-center justify-center text-green-600 shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-[#0c0a09] truncate uppercase">{file.name}</p>
                      <button
                        onClick={() => window.open(file.url, '_blank')}
                        className="text-[9px] font-black text-[var(--brand-accent)] uppercase hover:underline"
                      >
                        Visualizar Arquivo
                      </button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(idx)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-64 shrink-0">
          <label className={`flex flex-col items-center justify-center h-40 w-full border-2 border-dashed rounded-[2px] cursor-pointer transition-all ${attached ? 'border-green-300 bg-green-50/30' : 'border-neutral-200 hover:bg-neutral-50 group-hover:border-[var(--brand-accent)]/30 bg-white'}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
              <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center transition-all ${attached ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400 group-hover:bg-[var(--brand-accent)]/10 group-hover:text-[var(--brand-accent)]'}`}>
                <FileUp className="h-6 w-6" />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${attached ? 'text-green-600' : 'text-neutral-500 group-hover:text-[var(--brand-accent)]'}`}>
                {attached ? 'Adicionar mais' : 'Clique para enviar'}
              </p>
              <p className="text-[8px] font-bold text-neutral-300 uppercase mt-1">PDF, JPG, JPEG ou PNG</p>
            </div>
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          </label>
        </div>
      </div>
    </Card>
  );
}
