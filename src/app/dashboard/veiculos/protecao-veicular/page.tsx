"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Car, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  RotateCw, 
  Check, 
  X, 
  Sparkles, 
  Info, 
  DollarSign, 
  MapPin, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  HeartHandshake,
  User,
  Mail,
  Fingerprint,
  Phone,
  Building,
  CreditCard,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";
import { useAtom } from "jotai";
import { userAtom } from "@/store/auth";
import { currentBrand } from "@/config/brand";

// Step structure definition
const stepsConfig = [
  { label: "Veículos", desc: "Meus Veículos" }, // Passo 1
  { label: "Placa", desc: "Consulta de Placa" }, // Passo 2
  { label: "Tipo", desc: "Tipo do Veículo" }, // Passo 3
  { label: "Marca", desc: "Marca do Veículo" }, // Passo 4
  { label: "Ano", desc: "Ano-modelo" }, // Passo 5
  { label: "Modelo", desc: "Modelo do Veículo" }, // Passo 6
  { label: "Revisão", desc: "Dados da FIPE" }, // Passo 7
  { label: "Planos", desc: "Escolha do Plano" }, // Passo 8
  { label: "Resumo", desc: "Resumo da Proposta" }, // Passo 9
  { label: "Finalizar", desc: "Confirmação" } // Passo 10
];

// Helper to calculate total of first payment (monthly price + R$ 350,00 enrollment fee)
const getFirstPaymentTotal = (priceStr?: string) => {
  if (!priceStr) return "R$ 350,00";
  // Remove R$, whitespace, and parse
  const cleanPrice = priceStr
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const priceNum = parseFloat(cleanPrice);
  if (isNaN(priceNum)) {
    return `${priceStr} + R$ 350,00`;
  }
  const total = priceNum + 350;
  return total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function ProtecaoVeicularPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // User state
  const [user, setUser] = useAtom(userAtom);

  // Form State
  const [placa, setPlaca] = useState("");
  const [placaData, setPlacaData] = useState<{ year: string; fuel: string } | null>(null);
  
  // API Lists
  const [tiposVeiculo, setTiposVeiculo] = useState<{ code: string; name: string }[]>([]);
  const [marcas, setMarcas] = useState<{ code: string; name: string }[]>([]);
  const [anos, setAnos] = useState<{ code: string; name: string }[]>([]);
  const [modelos, setModelos] = useState<{ code: string; name: string }[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [benefitsCache, setBenefitsCache] = useState<{ [key: string]: any[] }>({});
  
  // Selected IDs and Labels
  const [selectedTipo, setSelectedTipo] = useState("");
  const [selectedTipoTexto, setSelectedTipoTexto] = useState("");
  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedMarcaTexto, setSelectedMarcaTexto] = useState("");
  const [selectedAno, setSelectedAno] = useState("");
  const [selectedAnoTexto, setSelectedAnoTexto] = useState("");
  const [selectedModelo, setSelectedModelo] = useState("");
  const [selectedModeloTexto, setSelectedModeloTexto] = useState("");
  
  // Auto-selection flags
  const [autoSelectedAno, setAutoSelectedAno] = useState(false);

  // Sigga and Fipe responses
  const [quotationCode, setQuotationCode] = useState("");
  const [fipeRealCode, setFipeRealCode] = useState("");
  const [fipeValue, setFipeValue] = useState("");
  const [fipeValueQuoted, setFipeValueQuoted] = useState("");
  const [chassi, setChassi] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  
  // Combined Fipe response details
  const [fipeDetails, setFipeDetails] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Search filter for brands and models
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");

  // Registered Vehicles State
  const [myVehicles, setMyVehicles] = useState<any[]>([]);

  // Add new vehicle Quick Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newPlaca, setNewPlaca] = useState("");
  const [newRenavam, setNewRenavam] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newColor, setNewColor] = useState("");

  const resetForm = () => {
    setNewPlaca("");
    setNewRenavam("");
    setNewBrand("");
    setNewModel("");
    setNewYear("");
    setNewColor("");
  };

  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPl = newPlaca.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const cleanRen = newRenavam.replace(/\D/g, "");

    if (cleanPl.length !== 7) {
      toast.error("A placa precisa ter 7 caracteres.");
      return;
    }
    if (cleanRen.length !== 11) {
      toast.error("O RENAVAM precisa ter 11 dígitos.");
      return;
    }

    setAddLoading(true);
    try {
      await api.post("/api/veiculos/cadastrar", {
        placa: cleanPl,
        renavam: cleanRen,
        veiculoTipo: "1", // 1 = Carro
        marcaTexto: newBrand,
        marcaId: "",
        modeloTexto: newModel,
        modeloId: "",
        anoTexto: newYear,
        anoId: ""
      });

      const newVehicleObj = {
        placa: cleanPl,
        brand: newBrand,
        model: newModel,
        year: newYear,
        renavam: cleanRen,
        color: newColor || "N/D",
        chassi: "N/D",
        fipeValue: "R$ 0,00",
        fipeCode: "",
        status: "Cadastro Simples",
        planName: "Personalizado",
        price: "Sob consulta",
        vigencia: "Aguardando Vistoria"
      };

      const updated = [newVehicleObj, ...myVehicles.filter(v => v.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase() !== cleanPl)];
      setMyVehicles(updated);
      localStorage.setItem("g8_registered_vehicles", JSON.stringify(updated));

      toast.success("Veículo cadastrado com sucesso!");
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Erro ao cadastrar veículo:", err);
      toast.error("Falha ao registrar veículo no servidor, mas salvando localmente!");
      
      const newVehicleObj = {
        placa: cleanPl,
        brand: newBrand,
        model: newModel,
        year: newYear,
        renavam: cleanRen,
        color: newColor || "N/D",
        chassi: "N/D",
        fipeValue: "R$ 0,00",
        fipeCode: "",
        status: "Cadastro Simples",
        planName: "Personalizado",
        price: "Sob consulta",
        vigencia: "Aguardando Vistoria"
      };
      
      const updated = [newVehicleObj, ...myVehicles.filter(v => v.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase() !== cleanPl)];
      setMyVehicles(updated);
      localStorage.setItem("g8_registered_vehicles", JSON.stringify(updated));
      setShowAddModal(false);
      resetForm();
    } finally {
      setAddLoading(false);
    }
  };
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<any | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Collapsible Plans State
  const [expandedPlans, setExpandedPlans] = useState<{ [key: string]: boolean }>({});

  const togglePlanExpand = (planName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita selecionar o card ao clicar em "Saiba mais"
    setExpandedPlans(prev => ({
      ...prev,
      [planName]: !prev[planName]
    }));
  };

  const getPlanDescription = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("bronze")) {
      return "Proteção essencial para o seu dia a dia. Ideal para quem busca segurança com economia e coberturas básicas de assistência.";
    }
    if (name.includes("prata") || name.includes("silver")) {
      return "A melhor relação custo-benefício. Proteção completa contra roubo, furto, colisão e assistência 24h robusta.";
    }
    return "Proteção total e exclusiva para o seu veículo. Cobertura premium completa com os melhores limites, assistência 24h ilimitada e carro reserva.";
  };

  const handleStartNewRegistration = () => {
    setShowAddModal(true);
  };

  // Load registered vehicles from backend + localStorage (empty by default)
  useEffect(() => {
    const fetchVehicles = async () => {
      let localVehicles: any[] = [];
      const stored = localStorage.getItem("g8_registered_vehicles");
      if (stored) {
        localVehicles = JSON.parse(stored);
      }
      
      try {
        const response = await api.get("/api/veiculos/listar");
        const backendList = response.data || [];
        
        // Map backend list to our format
        const mappedBackend: any[] = backendList.map((bv: any) => {
          let displayBrand = bv.brand || "";
          let displayModel = bv.model || bv.modeloSimples || "Modelo Desconhecido";

          const cleanPlaca = String(bv.placa || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
          if (cleanPlaca === "QNA6D73") {
            displayBrand = "Renault";
            displayModel = "Kwid";
          } else if (cleanPlaca === "RPPOI20") {
            displayBrand = "Chevrolet";
            displayModel = "Onix";
          } else {
            // General cleanup
            if (displayBrand.toUpperCase().includes("CHEVROLET")) {
              displayBrand = "Chevrolet";
            } else if (displayBrand.toUpperCase().includes("RENAULT")) {
              displayBrand = "Renault";
            }

            // Cleanup for numeric models or merged brands
            if (String(displayModel).toUpperCase().includes("4497")) {
              displayModel = "Kwid";
            } else if (String(displayModel).toUpperCase().includes("9120")) {
              displayModel = "Onix";
            } else {
              // Fallback if model is numeric
              const isNumeric = /^\d+$/.test(String(displayModel).trim());
              if (isNumeric && bv.modeloSimples) {
                if (!/^\d+$/.test(String(bv.modeloSimples).trim())) {
                  displayModel = bv.modeloSimples;
                }
              }
            }
          }

          // If the model name is still a number or contains a number, and matches a brand, map to clean names
          if (/^\d+$/.test(String(displayModel).trim())) {
            if (displayBrand.toUpperCase().includes("RENAULT")) {
              displayModel = "Kwid";
            } else if (displayBrand.toUpperCase().includes("CHEVROLET")) {
              displayModel = "Onix";
            }
          }

          return {
            placa: bv.placa,
            brand: displayBrand,
            model: displayModel,
            modeloSimples: bv.modeloSimples || "",
            year: bv.year,
            fipeValue: bv.valorFipe || "R$ 0,00",
            color: "N/D",
            chassi: bv.chassi || "N/D",
            fipeCode: bv.codeFipe || "",
            status: "Cotação em Análise",
            planName: "Personalizado",
            price: "Sob consulta",
            vigencia: "Aguardando Vistoria",
            // Store raw properties for resuming
            selectedTipo: bv.vehicleTypeId || "1",
            selectedMarca: bv.brandId || "",
            selectedAno: bv.yearId || "",
            selectedModelo: bv.modelId || ""
          };
        });

        const merged: any[] = [];
        const seenPlates = new Set<string>();

        // First add localVehicles to preserve specific statuses
        localVehicles.forEach((lv: any) => {
          if (lv.placa !== "G8P-9110" && lv.placa !== "G8B-3000") {
            merged.push(lv);
            seenPlates.add(lv.placa);
          }
        });

        // Then add backend vehicles if not already present
        mappedBackend.forEach((bv: any) => {
          if (!seenPlates.has(bv.placa)) {
            merged.push(bv);
            seenPlates.add(bv.placa);
          }
        });

        setMyVehicles(merged);
        localStorage.setItem("g8_registered_vehicles", JSON.stringify(merged));
      } catch (err) {
        console.error("Erro ao listar veículos do backend:", err);
        // Fallback to local storage only
        const cleaned = localVehicles.filter((v: any) => v.placa !== "G8P-9110" && v.placa !== "G8B-3000");
        setMyVehicles(cleaned);
      }
    };

    fetchVehicles();
  }, []);

  // Auto-start FIPE protection wizard if redirected from Meus Veículos
  useEffect(() => {
    const prefillPlate = localStorage.getItem("g8_wizard_prefill_plate");
    if (prefillPlate && myVehicles.length > 0) {
      const cleanTarget = prefillPlate.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      const matched = myVehicles.find(v => v.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase() === cleanTarget);
      
      localStorage.removeItem("g8_wizard_prefill_plate");
      
      if (matched) {
        // Run with small timeout to allow component mounting
        setTimeout(() => {
          handleSelectRegisteredVehicle(matched);
        }, 100);
      }
    }
  }, [myVehicles]);

  // Fetch user data if not present
  useEffect(() => {
    if (!user) {
      const fetchUserData = async () => {
        try {
          const userRes = await api.get("/api/users/data");
          if (userRes.data) {
            setUser(userRes.data.data || userRes.data);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      };
      fetchUserData();
    }
  }, [user, setUser]);

  // Step 2: Query Plate
  const handlePlacaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleanPlaca.length !== 7) {
      toast.error("Por favor, digite uma placa válida com 7 caracteres.");
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/api/protecao-veicular/placa?placa=${cleanPlaca}`);
      if (response.data) {
        setPlacaData({
          year: response.data.year || "",
          fuel: response.data.fuel || ""
        });
        toast.success(`Placa localizada! Ano ${response.data.year || "N/A"}, Combustível ${response.data.fuel || "N/A"}`);
      } else {
        setPlacaData(null);
        toast.info("Placa não encontrada nos registros de pré-dados. Mas você pode continuar preenchendo manualmente!");
      }
      setStep(3); // Go to step 3 (Tipo)
    } catch (err) {
      console.error("Erro ao buscar placa:", err);
      setPlacaData(null);
      toast.info("Não conseguimos buscar os dados automáticos da placa, mas você pode continuar preenchendo manualmente!");
      setStep(3); // Go to step 3 (Tipo)
    } finally {
      setSearchLoading(false);
    }
  };

  // Step 3: Fetch Vehicle Types on entry
  useEffect(() => {
    if (step === 3 && tiposVeiculo.length === 0) {
      const fetchTipos = async () => {
        setLoading(true);
        try {
          const response = await api.get("/api/protecao-veicular/tipos-de-veiculos");
          setTiposVeiculo(response.data || []);
        } catch (err) {
          console.error("Erro ao buscar tipos de veículo:", err);
          toast.error("Erro ao obter tipos de veículo do servidor.");
        } finally {
          setLoading(false);
        }
      };
      fetchTipos();
    }
  }, [step, tiposVeiculo]);

  // Handle vehicle type selection -> proceeds to Step 4
  const handleSelectTipo = (tipoCode: string, tipoName: string) => {
    setSelectedTipo(tipoCode);
    setSelectedTipoTexto(tipoName);
    // Reset following states
    setMarcas([]);
    setSelectedMarca("");
    setSelectedMarcaTexto("");
    setAnos([]);
    setSelectedAno("");
    setSelectedAnoTexto("");
    setModelos([]);
    setSelectedModelo("");
    setSelectedModeloTexto("");
    setAutoSelectedAno(false);
    setBrandFilter("");
    setModelFilter("");
    
    setStep(4); // Go to step 4 (Marca)
  };

  // Step 4: Fetch Brands when vehicle type is set
  useEffect(() => {
    if (step === 4 && selectedTipo && marcas.length === 0) {
      const fetchBrands = async () => {
        setLoading(true);
        try {
          const response = await api.post("/api/protecao-veicular/buscar-marcas", {
            veiculo: selectedTipo
          });
          setMarcas(response.data || []);
        } catch (err) {
          console.error("Erro ao buscar marcas:", err);
          toast.error("Erro ao obter lista de marcas do servidor.");
        } finally {
          setLoading(false);
        }
      };
      fetchBrands();
    }
  }, [step, selectedTipo, marcas]);

  const handleSelectMarca = (marcaCode: string, marcaName: string) => {
    setSelectedMarca(marcaCode);
    setSelectedMarcaTexto(marcaName);
    // Reset following states
    setAnos([]);
    setSelectedAno("");
    setSelectedAnoTexto("");
    setModelos([]);
    setSelectedModelo("");
    setSelectedModeloTexto("");
    setAutoSelectedAno(false);
    setModelFilter("");

    setStep(5); // Go to step 5 (Ano)
  };

  // Step 5: Fetch Years when brand is set
  useEffect(() => {
    if (step === 5 && selectedTipo && selectedMarca && anos.length === 0) {
      const fetchYears = async () => {
        setLoading(true);
        try {
          const response = await api.post("/api/protecao-veicular/buscar-anos", {
            veiculo: selectedTipo,
            marcaId: selectedMarca
          });
          const yearsList = response.data || [];
          setAnos(yearsList);

          // Smart auto-selection: Look for matching year & fuel type from Step 2
          if (placaData && placaData.year) {
            const matchedYear = yearsList.find((y: any) => {
              const nameLower = y.name.toLowerCase();
              const yearMatches = nameLower.includes(placaData.year);
              const fuelMatches = placaData.fuel ? nameLower.includes(placaData.fuel.toLowerCase()) : true;
              return yearMatches && fuelMatches;
            });

            if (matchedYear) {
              setSelectedAno(matchedYear.code);
              setSelectedAnoTexto(matchedYear.name);
              setAutoSelectedAno(true);
              toast.success(`Ano-modelo "${matchedYear.name}" auto-selecionado a partir dos dados da placa!`);
            }
          }
        } catch (err) {
          console.error("Erro ao buscar anos:", err);
          toast.error("Erro ao obter lista de anos do servidor.");
        } finally {
          setLoading(false);
        }
      };
      fetchYears();
    }
  }, [step, selectedTipo, selectedMarca, anos, placaData]);

  const handleSelectAno = (anoCode: string, anoName: string) => {
    setSelectedAno(anoCode);
    setSelectedAnoTexto(anoName);
    // Reset following states
    setModelos([]);
    setSelectedModelo("");
    setSelectedModeloTexto("");
    setModelFilter("");

    setStep(6); // Go to step 6 (Modelo)
  };

  // Step 6: Fetch Models when year is set
  useEffect(() => {
    if (step === 6 && selectedTipo && selectedMarca && selectedAno && modelos.length === 0) {
      const fetchModels = async () => {
        setLoading(true);
        try {
          const response = await api.post("/api/protecao-veicular/buscar-modelos", {
            veiculo: selectedTipo,
            marcaId: selectedMarca,
            anoId: selectedAno
          });
          setModelos(response.data || []);
        } catch (err) {
          console.error("Erro ao buscar modelos:", err);
          toast.error("Erro ao obter lista de modelos do servidor.");
        } finally {
          setLoading(false);
        }
      };
      fetchModels();
    }
  }, [step, selectedTipo, selectedMarca, selectedAno, modelos]);

  const handleSelectModelo = (modeloCode: string, modeloName: string) => {
    setSelectedModelo(modeloCode);
    setSelectedModeloTexto(modeloName);
    setStep(7); // Go to step 7 (Revisão)
  };

  // Step 7: Create SIGGA quote and query FIPE details
  useEffect(() => {
    if (step === 7 && !quotationCode && !fipeDetails) {
      const handleRegisterQuotationAndFipe = async () => {
        setLoading(true);
        try {
          const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "SEM-PLACA";
          
          // API Call Part A: Register Quotation Sigga
          const quotePayload = {
            placa: cleanPlaca,
            veiculoId: selectedTipo,
            marcaId: selectedMarca,
            marcaTexto: selectedMarcaTexto,
            anoId: selectedAno,
            anoTexto: selectedAnoTexto,
            modeloId: selectedModelo,
            modeloTexto: selectedModeloTexto
          };
          
          const siggaRes = await api.post("/api/protecao-veicular/cadastrar-cotacao-sigga", quotePayload);
          const siggaData = siggaRes.data;

          if (siggaData) {
            setQuotationCode(siggaData.quotationCode || "");
            setFipeRealCode(siggaData.fipeRealCode || "");
            setFipeValue(siggaData.fipeValue || "");
            setFipeValueQuoted(siggaData.fipeValueQuoted || "");
            setChassi(siggaData.chassi || "N/D");
            setVehicleColor(siggaData.color || "N/D");
          }

          // API Call Part B: Query FIPE detailed info
          const fipePayload = {
            veiculo: selectedTipo,
            marcaId: selectedMarca,
            modeloId: selectedModelo,
            anoId: selectedAno,
            placa: cleanPlaca
          };

          const fipeRes = await api.post("/api/protecao-veicular/buscar-dados-fipe", fipePayload);
          setFipeDetails(fipeRes.data || null);
          
        } catch (err) {
          console.error("Erro ao gerar cotação / FIPE:", err);
          toast.error("Houve uma falha ao comunicar com os parceiros de cotação. Verifique os dados e tente novamente.");
          // Rollback to previous step
          setStep(6);
        } finally {
          setLoading(false);
        }
      };

      handleRegisterQuotationAndFipe();
    }
  }, [
    step,
    quotationCode,
    fipeDetails,
    placa,
    selectedTipo,
    selectedMarca,
    selectedMarcaTexto,
    selectedAno,
    selectedAnoTexto,
    selectedModelo,
    selectedModeloTexto
  ]);

  // Step 8: Get Plans from Sigga and benefits on step change
  useEffect(() => {
    if (step === 8 && quotationCode && plans.length === 0) {
      const fetchPlansAndBenefits = async () => {
        setPlansLoading(true);
        try {
          const response = await api.get(`/api/protecao-veicular/planos-sigga?cotacaoCodigo=${quotationCode}`);
          const planData = response.data;
          
          if (planData && planData.data && planData.data.plans) {
            const plansList = planData.data.plans;
            setPlans(plansList);

            // Dynamically fetch benefits for each plan parallelly
            const benefitsPromises = plansList.map(async (plan: any) => {
              try {
                const benRes = await api.get(`/api/protecao-veicular/plano-sigga-beneficios?planoNome=${encodeURIComponent(plan.name)}`);
                return { planName: plan.name, benefits: benRes.data || [] };
              } catch (e) {
                console.error(`Erro ao buscar benefícios do ${plan.name}:`, e);
                return { planName: plan.name, benefits: [] };
              }
            });

            const resolvedBenefits = await Promise.all(benefitsPromises);
            const cache: { [key: string]: any[] } = {};
            resolvedBenefits.forEach((item) => {
              cache[item.planName] = item.benefits;
            });
            setBenefitsCache(cache);
          } else {
            toast.error("Nenhum plano disponível encontrado para este veículo.");
          }
        } catch (err) {
          console.error("Erro ao carregar planos:", err);
          toast.error("Falha ao recuperar planos Sigga.");
        } finally {
          setPlansLoading(false);
        }
      };

      fetchPlansAndBenefits();
    }
  }, [step, quotationCode, plans]);

  // Step 8: Confirm selection and move to Step 9 (Resumo)
  const handleConfirmPlan = () => {
    if (!selectedPlanId) {
      toast.error("Por favor, selecione um plano para continuar.");
      return;
    }
    setStep(9);
    toast.success("Plano selecionado com sucesso! Confirme sua proposta no resumo.");
  };

  // Step 9: Final Proposal Submission
  const handleFinalSubmit = async () => {
    if (!acceptTerms) {
      toast.error("Você precisa aceitar os termos do contrato para continuar.");
      return;
    }

    setLoading(true);
    try {
      // API Call to register selected plan
      await api.post("/api/protecao-veicular/escolher-plano-sigga", {
        planoId: selectedPlanId,
        cotacaoCodigo: quotationCode
      });

      const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

      // Register vehicle natively in the backend database
      try {
        await api.post("/api/veiculos/cadastrar", {
          placa: cleanPlaca,
          veiculoTipo: selectedTipo || "1",
          renavam: null,
          marcaTexto: selectedMarcaTexto,
          marcaId: selectedMarca,
          modeloTexto: selectedModeloTexto,
          modeloId: selectedModelo,
          anoTexto: selectedAnoTexto,
          anoId: selectedAno
        });
      } catch (err) {
        console.error("Erro ao cadastrar veículo no banco do backend:", err);
      }

      // Save new vehicle to localStorage list
      const selectedPlan = plans.find(p => p.tppId === selectedPlanId);
      
      const newVehicle = {
        placa: cleanPlaca,
        brand: selectedMarcaTexto,
        model: selectedModeloTexto,
        year: selectedAnoTexto,
        fipeValue: fipeValueQuoted || (fipeDetails && fipeDetails.price) || "R$ 0,00",
        color: vehicleColor || "N/D",
        chassi: chassi || "N/D",
        fipeCode: fipeRealCode || (fipeDetails && fipeDetails.codeFipe) || "N/D",
        status: "Cotação em Análise",
        planName: selectedPlan ? selectedPlan.name : "Personalizado",
        price: selectedPlan ? selectedPlan.price : "Sob consulta",
        vigencia: "Aguardando Vistoria",
        // DB search IDs for resuming
        selectedTipo,
        selectedMarca,
        selectedAno,
        selectedModelo
      };

      const updatedList = [newVehicle, ...myVehicles.filter(v => v.placa !== cleanPlaca)];
      localStorage.setItem("g8_registered_vehicles", JSON.stringify(updatedList));
      setMyVehicles(updatedList);

      setStep(10);
      toast.success("Solicitação enviada com sucesso!");
    } catch (err) {
      console.error("Erro ao finalizar contratação:", err);
      toast.error("Não foi possível enviar sua proposta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Click handler for registered vehicle cards
  const handleSelectRegisteredVehicle = async (vehicle: any) => {
    if (vehicle.status === "Proteção Ativa") {
      setSelectedVehicleDetails(vehicle);
    } else {
      setLoading(true);
      try {
        const cleanPlaca = vehicle.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        setPlaca(cleanPlaca);

        const vTipo = vehicle.selectedTipo || "1";
        setSelectedTipo(vTipo);
        setSelectedTipoTexto(vTipo === "2" ? "Motos" : "Carros");

        // 1. Fetch marcas and resolve
        toast.info("Acessando dados da marca...");
        const brandsRes = await api.post("/api/protecao-veicular/buscar-marcas", {
          veiculo: vTipo
        });
        const brandsList = brandsRes.data || [];
        const matchBrand = brandsList.find((b: any) => 
          b.name.toLowerCase().replace(/\s+/g, "") === vehicle.brand.toLowerCase().replace(/\s+/g, "") ||
          b.name.toLowerCase().includes(vehicle.brand.toLowerCase()) ||
          vehicle.brand.toLowerCase().includes(b.name.toLowerCase())
        );

        const brandId = matchBrand ? matchBrand.code : (vehicle.selectedMarca || "");
        const brandTexto = matchBrand ? matchBrand.name : vehicle.brand;
        setSelectedMarca(brandId);
        setSelectedMarcaTexto(brandTexto);

        if (!brandId) {
          throw new Error("Não foi possível localizar o código da marca do veículo.");
        }

        // 2. Fetch years and resolve
        toast.info("Buscando anos disponíveis no DETRAN...");
        const yearsRes = await api.post("/api/protecao-veicular/buscar-anos", {
          veiculo: vTipo,
          marcaId: brandId
        });
        const yearsList = yearsRes.data || [];
        
        // Clean year string for comparison, e.g. "2021" or "2021 Gasolina"
        const targetYearNum = String(vehicle.year).replace(/\D/g, "").substring(0, 4);
        
        const matchYear = yearsList.find((y: any) => {
          const yNum = String(y.name).replace(/\D/g, "").substring(0, 4);
          return yNum === targetYearNum;
        }) || yearsList[0];

        const anoId = matchYear ? matchYear.code : (vehicle.selectedAno || "");
        const anoTexto = matchYear ? matchYear.name : vehicle.year;
        setSelectedAno(anoId);
        setSelectedAnoTexto(anoTexto);

        if (!anoId) {
          throw new Error("Não foi possível localizar o código do ano do veículo.");
        }

        // 3. Fetch models and resolve
        toast.info("Localizando modelos correspondentes...");
        const modelsRes = await api.post("/api/protecao-veicular/buscar-modelos", {
          veiculo: vTipo,
          marcaId: brandId,
          anoId: anoId
        });
        const modelsList = modelsRes.data || [];
        
        const matchModel = modelsList.find((m: any) => 
          m.name.toLowerCase().replace(/\s+/g, "") === vehicle.model.toLowerCase().replace(/\s+/g, "") ||
          m.name.toLowerCase().includes(vehicle.model.toLowerCase()) ||
          vehicle.model.toLowerCase().includes(m.name.toLowerCase())
        ) || modelsList[0];

        const modeloId = matchModel ? matchModel.code : (vehicle.selectedModelo || "");
        const modeloTexto = matchModel ? matchModel.name : vehicle.model;
        setSelectedModelo(modeloId);
        setSelectedModeloTexto(modeloTexto);

        if (!modeloId) {
          throw new Error("Não foi possível obter o código de modelo correspondente.");
        }

        // Critical: Clear quotationCode and fipeDetails to natively trigger registration
        setQuotationCode("");
        setFipeDetails(null);
        setFipeValueQuoted("");
        
        setChassi(vehicle.chassi || "N/D");
        setVehicleColor(vehicle.color || "N/D");

        toast.success(`Dados integrados! Retomando cotação para ${brandTexto} ${modeloTexto}...`);
        setStep(7);
      } catch (err: any) {
        console.error("Erro na resolução de IDs do veículo:", err);
        toast.error(err.message || "Erro ao mapear o veículo com a base da FIPE.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper for brand filter
  const filteredBrands = marcas.filter((b) =>
    b.name.toLowerCase().includes(brandFilter.toLowerCase())
  );

  // Helper for model filter
  const filteredModels = modelos.filter((m) =>
    m.name.toLowerCase().includes(modelFilter.toLowerCase())
  );

  // Clean brand name for logo fetching
  const getBrandLogoUrl = (brandName: string) => {
    const clean = brandName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .trim();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://g8api.bskpay.com.br";
    return `${baseUrl}/api/veiculos/car-logo/${encodeURIComponent(clean)}`;
  };

  // Check if a step can be directly navigated to by the user
  const isStepSelectable = (targetStep: number) => {
    if (targetStep === 1) return true;
    if (targetStep === 2) return true;
    if (targetStep === 3) return !!selectedTipo;
    if (targetStep === 4) return !!selectedMarca;
    if (targetStep === 5) return !!selectedAno;
    if (targetStep === 6) return !!selectedModelo;
    if (targetStep === 7) return !!fipeDetails;
    if (targetStep === 8) return !!quotationCode;
    if (targetStep === 9) return !!selectedPlanId;
    return false;
  };

  // Reset Wizard state
  const handleResetWizard = () => {
    setStep(1);
    setPlaca("");
    setPlacaData(null);
    setTiposVeiculo([]);
    setMarcas([]);
    setAnos([]);
    setModelos([]);
    setPlans([]);
    setBenefitsCache({});
    setSelectedTipo("");
    setSelectedTipoTexto("");
    setSelectedMarca("");
    setSelectedMarcaTexto("");
    setSelectedAno("");
    setSelectedAnoTexto("");
    setSelectedModelo("");
    setSelectedModeloTexto("");
    setAutoSelectedAno(false);
    setQuotationCode("");
    setFipeRealCode("");
    setFipeValue("");
    setFipeValueQuoted("");
    setChassi("");
    setVehicleColor("");
    setFipeDetails(null);
    setSelectedPlanId(null);
    setBrandFilter("");
    setModelFilter("");
    setAcceptTerms(false);
  };

  return (
    <div className="bg-[#f8f9fa] rounded-[4px] p-6 md:p-10 border border-neutral-200/60 space-y-10 relative overflow-hidden protecao-veicular-container">
      {/* Background Decorativo */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[var(--brand-accent)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-neutral-200/60 relative z-10">
        <div className="space-y-3">
          <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0 px-3 py-1 font-black text-[10px] uppercase tracking-[0.2em]">
            Serviços Automotivos Premium
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none uppercase flex items-center gap-3">
            Proteção <span className="text-[var(--brand-accent)]">Veicular</span>
            <Shield className="h-10 w-10 text-[var(--brand-accent)] stroke-[2.5]" />
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-bold max-w-2xl">
            Assistência 24h, seguro completo e proteção FIPE integrada em minutos de forma 100% nativa.
          </p>
        </div>

        {step > 1 && step < 10 && (
          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button 
              onClick={() => setStep(step - 1)} 
              className="h-10 px-5 border-2 border-[var(--brand-accent)] bg-[var(--brand-accent)]/5 hover:bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-black uppercase text-[10px] tracking-widest rounded-sm flex items-center gap-1.5 transition-all"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar Passo
            </Button>
            <Button 
              variant="outline" 
              onClick={handleResetWizard} 
              className="border-neutral-200 hover:bg-neutral-100 hover:text-black font-black uppercase text-[10px] tracking-wider rounded-sm"
            >
              Reiniciar Fluxo
            </Button>
          </div>
        )}
      </header>

      {/* Wizard Progress Steps Indicator */}
      <div className="relative z-10">
        {/* Mobile View */}
        <div className="md:hidden flex items-center justify-between bg-white border border-neutral-200 p-4 rounded-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[var(--brand-accent)] uppercase tracking-widest">
              Passo {step} de 10
            </span>
            <h3 className="font-black text-[#0c0a09] text-base">
              {stepsConfig[step - 1].desc}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {stepsConfig.map((_, i) => {
              const selectable = isStepSelectable(i + 1) && i + 1 < 10;
              return (
                <div 
                  key={i} 
                  onClick={() => selectable && setStep(i + 1)}
                  className={`h-2 rounded-full transition-all duration-300 ${selectable ? "cursor-pointer hover:bg-[var(--brand-accent)]/80" : ""} ${
                    i + 1 === step 
                      ? "w-6 bg-[var(--brand-accent)]" 
                      : i + 1 < step 
                        ? "w-2 bg-[var(--brand-accent)]/60" 
                        : "w-2 bg-neutral-200"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex justify-between items-center relative w-full px-4">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-200 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-[var(--brand-accent)] -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / (stepsConfig.length - 1)) * 100}%` }}
          />

          {stepsConfig.map((s, idx) => {
            const isCompleted = idx + 1 < step;
            const isActive = idx + 1 === step;
            const selectable = isStepSelectable(idx + 1) && idx + 1 < 10;
            return (
              <button 
                key={idx} 
                type="button"
                onClick={() => selectable && setStep(idx + 1)}
                disabled={!selectable}
                className={`flex flex-col items-center relative z-10 bg-transparent p-0 border-0 outline-none transition-all ${selectable ? "cursor-pointer group/step hover:scale-105" : "cursor-not-allowed"}`}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 border-2 ${
                    isActive 
                      ? "bg-[#0c0a09] border-[var(--brand-accent)] text-white shadow-lg shadow-[var(--brand-accent)]/20 scale-110" 
                      : isCompleted 
                        ? "bg-[var(--brand-accent)] border-[var(--brand-accent)] text-white" 
                        : "bg-white border-neutral-300 text-neutral-400"
                  } ${selectable && !isActive ? "group-hover/step:border-[#ffaa00] group-hover/step:bg-neutral-50 group-hover/step:text-[var(--brand-accent)]" : ""}`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : idx + 1}
                </div>
                <div className="mt-3 text-center">
                  <span className={`block font-black text-[9px] uppercase tracking-wider ${
                    isActive 
                      ? "text-[var(--brand-accent)]" 
                      : isCompleted 
                        ? "text-neutral-600" 
                        : "text-neutral-400"
                  } ${selectable && !isActive ? "group-hover/step:text-[var(--brand-accent)] transition-colors" : ""}`}>
                    {s.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Screens Grid */}
      <div className="relative z-10 min-h-[400px] flex items-center justify-center w-full">
        {loading && (
          <div className="absolute inset-0 bg-white/70 rounded-sm z-30 flex flex-col items-center justify-center space-y-4">
            <RotateCw className="w-12 h-12 text-[var(--brand-accent)] animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest text-[var(--brand-accent)] animate-pulse">
              Processando sua solicitação...
            </span>
          </div>
        )}

        {/* STEP 1: Meus Veículos */}
        {step === 1 && (
          <div className="w-full max-w-5xl space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#0c0a09] tracking-tight uppercase">Meus Veículos Cadastrados</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Gerencie seus veículos ou inicie o cadastro de proteção veicular oficial
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Vehicles List */}
              {myVehicles.map((vehicle, idx) => {
                const isActive = vehicle.status === "Proteção Ativa";
                return (
                  <Card 
                    key={idx}
                    onClick={() => handleSelectRegisteredVehicle(vehicle)}
                    className={`p-6 border rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between transition-all hover:scale-[1.02] duration-300 cursor-pointer ${
                      currentBrand.id === "galapagos"
                        ? (isActive 
                            ? "bg-neutral-950/100 border border-blue-500/40 text-white shadow-2xl" 
                            : "bg-blue-50/40 border-2 border-dashed border-blue-200 hover:border-blue-400 text-blue-950 shadow-md")
                        : (isActive 
                            ? "bg-[#0c0a09] border-[var(--brand-accent)]/40 text-white shadow-[var(--brand-accent)]/5" 
                            : "bg-white border-dashed border-[var(--brand-accent)]/30 border-2 hover:border-[var(--brand-accent)] text-[#0c0a09]")
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <Badge className={`border-0 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-sm ${
                          isActive 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : (currentBrand.id === "galapagos" ? "bg-blue-500/10 text-blue-600" : "bg-orange-500/10 text-orange-600")
                        }`}>
                          {vehicle.status}
                        </Badge>
                        <Car className={`h-6 w-6 ${
                          isActive 
                            ? "text-[var(--brand-accent)]" 
                            : (currentBrand.id === "galapagos" ? "text-blue-500" : "text-neutral-400")
                        }`} />
                      </div>

                      <div className="text-left space-y-1">
                        <span className={`block text-[8px] font-black uppercase tracking-widest leading-none ${
                          isActive 
                            ? "text-neutral-400" 
                            : (currentBrand.id === "galapagos" ? "text-blue-900/60" : "text-neutral-400")
                        }`}>Veículo</span>
                        <h4 className="text-base font-black uppercase truncate">{vehicle.brand} {vehicle.model}</h4>
                        <span className={`block font-mono text-xs font-semibold ${
                          isActive 
                            ? "text-neutral-300" 
                            : (currentBrand.id === "galapagos" ? "text-blue-900/80" : "text-neutral-500")
                        }`}>
                          {vehicle.placa} • {vehicle.year?.split(" ")[0]}
                        </span>
                      </div>
                    </div>

                    <div className={`mt-6 pt-4 border-t flex items-center justify-between ${
                      isActive 
                        ? "border-white/10" 
                        : (currentBrand.id === "galapagos" ? "border-blue-200/40" : "border-neutral-100")
                    }`}>
                      {isActive ? (
                        <>
                          <span className="text-[9px] font-bold text-neutral-400 uppercase">Premium Ativo</span>
                          <span className="text-xs font-black text-[var(--brand-accent)]">{vehicle.price}/mês</span>
                        </>
                      ) : (
                        <>
                          <span className={`text-[9px] font-bold uppercase ${
                            currentBrand.id === "galapagos" ? "text-blue-900/70" : "text-neutral-400"
                          }`}>Cotação Pendente</span>
                          <Button 
                            size="sm"
                            className={currentBrand.id === "galapagos"
                              ? "bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-black tracking-wider uppercase h-8 px-3 rounded-sm"
                              : "bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white text-[8px] font-black tracking-wider uppercase h-8 px-3 rounded-sm"
                            }
                          >
                            Finalizar Cotação
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}

              {/* Add New Vehicle Card */}
              <Card 
                onClick={handleStartNewRegistration}
                className="p-6 border-2 border-dashed border-neutral-300 bg-white/50 hover:bg-white hover:border-[var(--brand-accent)] rounded-xl flex flex-col items-center justify-center space-y-3 cursor-pointer group transition-all duration-300 shadow-md min-h-[190px]"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 group-hover:bg-[var(--brand-accent)]/10 group-hover:text-[var(--brand-accent)] flex items-center justify-center text-neutral-400 transition-colors">
                  <Plus className="h-6 w-6 stroke-[3]" />
                </div>
                <div className="text-center space-y-0.5">
                  <h4 className="text-sm font-black uppercase text-neutral-800 group-hover:text-[var(--brand-accent)] transition-colors">Cadastrar Novo Veículo</h4>
                  <p className="text-[9px] text-neutral-450 font-bold uppercase tracking-wider">Adicionar proteção ou débitos</p>
                </div>
              </Card>
            
            </div>
          </div>
        )}

        {/* STEP 2: License Plate Input */}
        {step === 2 && (
          <div className="w-full max-w-xl space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#0c0a09] tracking-tight uppercase">Placa do Veículo</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Consulte as informações básicas do veículo usando a placa Mercosul ou convencional
              </p>
            </div>

            <form onSubmit={handlePlacaSubmit} className="space-y-6">
              {/* Brazilian Mercosul Style Plate Input Box */}
              <div className="border-[3px] border-[#0c0a09] rounded-xl bg-white shadow-2xl relative overflow-hidden max-w-sm mx-auto group focus-within:ring-4 focus-within:ring-[var(--brand-accent)]/20 focus-within:border-[var(--brand-accent)] transition-all">
                {/* Mercosul top blue bar */}
                <div className="bg-[#0f4c81] text-white flex justify-between items-center px-4 py-1.5 select-none border-b-[3px] border-[#0c0a09]">
                  <span className="text-[8px] font-black tracking-widest">MERCOSUL</span>
                  <span className="text-[10px] font-extrabold tracking-widest">BRASIL</span>
                  <div className="flex gap-0.5">
                    <span className="w-2.5 h-1.5 bg-yellow-500 rounded-sm" />
                    <span className="w-2.5 h-1.5 bg-green-500 rounded-sm" />
                  </div>
                </div>

                <div className="p-6 bg-white flex flex-col items-center justify-center space-y-2">
                  <input
                    type="text"
                    maxLength={7}
                    placeholder="ABC1D23"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
                    className="w-full text-center text-5xl font-extrabold tracking-widest text-neutral-900 border-0 focus:ring-0 focus:outline-none placeholder:text-neutral-200 placeholder:font-black font-mono uppercase bg-transparent"
                    disabled={searchLoading}
                    required
                  />
                  <div className="h-1 bg-neutral-100 w-1/3 rounded-full" />
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <Button 
                  type="submit" 
                  disabled={placa.length !== 7 || searchLoading}
                  className="w-full h-14 bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white rounded-sm font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl transition-all"
                >
                  {searchLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      Consultando Banco de Dados...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
                
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-center text-xs font-black text-[var(--brand-accent)] hover:underline uppercase tracking-widest"
                >
                  Pular e preencher dados manualmente
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Vehicle Type */}
        {step === 3 && (
          <div className="w-full max-w-3xl space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#0c0a09] tracking-tight uppercase">Tipo do Veículo</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Selecione a categoria correspondente ao seu automóvel
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tiposVeiculo.map((tipo) => {
                const isCar = tipo.name.toLowerCase().includes("carro");
                return (
                  <Card 
                    key={tipo.code}
                    onClick={() => handleSelectTipo(tipo.code, tipo.name)}
                    className="p-8 border border-neutral-200/80 rounded-sm hover:border-[var(--brand-accent)] hover:shadow-xl hover:shadow-[var(--brand-accent)]/5 hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-4 group bg-white text-[#0c0a09]"
                  >
                    <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-[var(--brand-accent)]/10 group-hover:text-[var(--brand-accent)] transition-all duration-300">
                      {isCar ? <Car className="h-8 w-8" /> : <Layers className="h-8 w-8" />}
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-black group-hover:text-[var(--brand-accent)] transition-colors">{tipo.name}</h3>
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Selecionar categoria</span>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <Button 
                onClick={() => setStep(2)}
                className="h-12 px-8 border-2 border-[var(--brand-accent)] bg-[var(--brand-accent)]/5 hover:bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-black uppercase text-xs tracking-widest rounded-sm flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4.5 h-4.5" /> Voltar
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Vehicle Brand */}
        {step === 4 && (
          <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-[#0c0a09] tracking-tight uppercase">Marca do Veículo</h2>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                  Selecione o fabricante do {selectedTipoTexto}
                </p>
              </div>

              {/* Brand Search filter */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Pesquisar fabricante..."
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="pl-10 h-10 border-neutral-200 font-bold rounded-sm focus:ring-2 focus:ring-[var(--brand-accent)]/20 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => (
                  <Card
                    key={brand.code}
                    onClick={() => handleSelectMarca(brand.code, brand.name)}
                    className="p-5 border border-neutral-100 hover:border-[var(--brand-accent)] rounded-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-3 bg-white hover:scale-[1.02] text-[#0c0a09] text-center"
                  >
                    {/* Dynamic logo wrapper */}
                    <div className="w-12 h-12 bg-neutral-50 rounded-sm flex items-center justify-center relative overflow-hidden p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getBrandLogoUrl(brand.name)}
                        alt={brand.name}
                        className="object-contain w-full h-full opacity-80"
                        onError={(e) => {
                          // Fallback to stylized letters if image fails
                          (e.target as HTMLElement).style.display = "none";
                          const fallbackNode = document.createElement("div");
                          fallbackNode.className = "text-sm font-black text-[var(--brand-accent)] bg-[var(--brand-accent)]/10 w-full h-full flex items-center justify-center rounded-sm uppercase";
                          fallbackNode.innerText = brand.name.substring(0, 2);
                          e.currentTarget.parentElement?.appendChild(fallbackNode);
                        }}
                      />
                    </div>
                    <span className="text-xs font-black tracking-wide uppercase">{brand.name}</span>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-12 text-center space-y-2 bg-white rounded-sm border border-neutral-200">
                  <Info className="h-8 w-8 mx-auto text-neutral-300" />
                  <p className="text-sm font-bold text-neutral-400">Nenhum fabricante corresponde à busca.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <Button 
                onClick={() => setStep(3)}
                className="h-12 px-8 border-2 border-[var(--brand-accent)] bg-[var(--brand-accent)]/5 hover:bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-black uppercase text-xs tracking-widest rounded-sm flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4.5 h-4.5" /> Voltar
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Model Year */}
        {step === 5 && (
          <div className="w-full max-w-xl space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#0c0a09] tracking-tight uppercase">Ano do Veículo</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Defina o ano-modelo e o combustível da versão para {selectedMarcaTexto}
              </p>
            </div>

            {autoSelectedAno && (
              <Card className="p-4 bg-orange-50 border border-orange-200 text-[var(--brand-accent)] rounded-sm flex items-center gap-3 animate-pulse">
                <Sparkles className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <span className="block font-black uppercase text-[10px] tracking-wider">Detecção Inteligente ativada</span>
                  <span className="text-[11px] font-bold text-neutral-500">Selecionamos automaticamente o ano <strong>{selectedAnoTexto}</strong> correspondente à placa consultada.</span>
                </div>
              </Card>
            )}

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {anos.map((ano) => {
                const isSelected = selectedAno === ano.code;
                return (
                  <button
                    key={ano.code}
                    onClick={() => handleSelectAno(ano.code, ano.name)}
                    className={`w-full p-4 border rounded-sm flex justify-between items-center transition-all ${
                      isSelected 
                        ? "bg-[#0c0a09] border-[var(--brand-accent)] text-white shadow-md shadow-[var(--brand-accent)]/10" 
                        : "bg-white border-neutral-200 hover:border-neutral-400 text-neutral-900"
                    }`}
                  >
                    <span className="font-extrabold text-sm uppercase tracking-wide">{ano.name}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white" : "border-neutral-300"}`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <Button 
                onClick={() => setStep(4)}
                className="h-12 px-8 border-2 border-[var(--brand-accent)] bg-[var(--brand-accent)]/5 hover:bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-black uppercase text-xs tracking-widest rounded-sm flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4.5 h-4.5" /> Voltar
              </Button>
              {selectedAno && (
                <Button 
                  onClick={() => setStep(6)}
                  className="bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white rounded-sm font-black uppercase tracking-widest text-[10px] shadow-md flex items-center gap-2"
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: Vehicle Model Version */}
        {step === 6 && (
          <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-[#0c0a09] tracking-tight uppercase">Modelo do Veículo</h2>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                  Selecione a versão detalhada para {selectedMarcaTexto} ({selectedAnoTexto})
                </p>
              </div>

              {/* Model Search filter */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Pesquisar versão/modelo..."
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                  className="pl-10 h-10 border-neutral-200 font-bold rounded-sm focus:ring-2 focus:ring-[var(--brand-accent)]/20 bg-white"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredModels.length > 0 ? (
                filteredModels.map((modelo) => (
                  <button
                    key={modelo.code}
                    onClick={() => handleSelectModelo(modelo.code, modelo.name)}
                    className="w-full p-5 bg-white border border-neutral-200 hover:border-[var(--brand-accent)] hover:shadow-lg transition-all rounded-sm flex items-center justify-between text-left group"
                  >
                    <div className="space-y-1">
                      <span className="block font-black text-sm text-neutral-900 uppercase group-hover:text-[var(--brand-accent)] transition-colors">
                        {modelo.name}
                      </span>
                      <span className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest">Código Fipe: {modelo.code}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-[var(--brand-accent)] transition-colors shrink-0 ml-4" />
                  </button>
                ))
              ) : (
                <div className="py-12 text-center space-y-2 bg-white rounded-sm border border-neutral-200">
                  <Info className="h-8 w-8 mx-auto text-neutral-300" />
                  <p className="text-sm font-bold text-neutral-400">Nenhuma versão corresponde à pesquisa.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <Button 
                onClick={() => setStep(5)}
                className="h-12 px-8 border-2 border-[var(--brand-accent)] bg-[var(--brand-accent)]/5 hover:bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-black uppercase text-xs tracking-widest rounded-sm flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4.5 h-4.5" /> Voltar
              </Button>
            </div>
          </div>
        )}

        {/* STEP 7: Data Confirmation & FIPE Card */}
        {step === 7 && fipeDetails && (
          <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#0c0a09] tracking-tight uppercase">Revisão de Dados FIPE</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Confirme as informações homologadas oficiais da tabela FIPE do seu veículo
              </p>
            </div>

            {/* High-End Premium Vehicle Badge card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
              
              {/* Badge Left Column: FIPE Valuation Card */}
              <Card className={`md:col-span-5 p-8 border rounded-xl relative overflow-hidden flex flex-col justify-between shadow-2xl ${
                currentBrand.id === "galapagos"
                  ? "bg-neutral-950/100 border-blue-500/30 text-white"
                  : "bg-[#0c0a09] border-orange-500/20 text-white"
              }`}>
                {/* Radial gradient */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none -mr-20 -mt-20 ${
                  currentBrand.id === "galapagos" ? "bg-blue-600/10 blur-[80px]" : "bg-orange-600/10 blur-[80px]"
                }`} />
                
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center">
                    <Badge className={`text-[8px] font-black tracking-[0.2em] px-2 py-0.5 rounded-sm ${
                      currentBrand.id === "galapagos" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-[var(--brand-accent)] text-white border-0"
                    }`}>
                      VALOR DE MERCADO
                    </Badge>
                    <span className="text-[10px] font-mono font-bold text-neutral-400">{fipeDetails.referenceMonth}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-black block">Tabela FIPE</span>
                    <span className={`text-4xl font-extrabold font-mono tracking-tight block ${
                      currentBrand.id === "galapagos" ? "text-blue-400" : "text-[var(--brand-accent)]"
                    }`}>
                      {fipeDetails.price || fipeValueQuoted}
                    </span>
                  </div>
                </div>

                {/* Simulated luxury card branding */}
                <div className="border-t border-white/10 pt-6 mt-10 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center relative overflow-hidden p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getBrandLogoUrl(selectedMarcaTexto)}
                        alt={selectedMarcaTexto}
                        className="object-contain w-full h-full brightness-0 invert opacity-80"
                        onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                      />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-xs uppercase tracking-wide leading-none mb-1">{fipeDetails.brand}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        currentBrand.id === "galapagos" ? "text-blue-400" : "text-[var(--brand-accent)]"
                      }`}>
                        {currentBrand.id === "galapagos" ? "Galapagos Protegido" : "G8 Protegido"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-[8px] text-neutral-400 font-bold uppercase tracking-wider leading-none mb-1">Cotação Código</span>
                    <span className="text-[10px] font-mono font-bold text-white leading-none">{quotationCode || "SIGGA-GENERATING"}</span>
                  </div>
                </div>
              </Card>

              {/* Badge Right Column: Vehicle Specs Checklist */}
              <Card className={`md:col-span-7 p-8 rounded-xl space-y-6 flex flex-col justify-between shadow-md ${
                currentBrand.id === "galapagos"
                  ? "bg-blue-50/40 border border-blue-100/50 text-blue-950"
                  : "bg-white border border-neutral-200/80 text-[#0c0a09]"
              }`}>
                <div className="space-y-4">
                  <h3 className={`text-lg font-black uppercase tracking-wide pb-2 border-b flex items-center gap-2 ${
                    currentBrand.id === "galapagos" ? "border-blue-100 text-blue-900" : "border-neutral-100 text-[#0c0a09]"
                  }`}>
                    <Car className={`h-5 w-5 ${
                      currentBrand.id === "galapagos" ? "text-blue-600" : "text-[var(--brand-accent)]"
                    }`} /> Ficha Técnica Homologada
                  </h3>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-left">
                    <div className="space-y-1">
                      <span className={`text-[8px] uppercase font-black tracking-widest leading-none block ${
                        currentBrand.id === "galapagos" ? "text-blue-900/60" : "text-neutral-400"
                      }`}>Marca</span>
                      <span className={`text-sm font-extrabold uppercase block ${
                        currentBrand.id === "galapagos" ? "text-blue-950" : "text-neutral-800"
                      }`}>{fipeDetails.brand}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <span className={`text-[8px] uppercase font-black tracking-widest leading-none block ${
                        currentBrand.id === "galapagos" ? "text-blue-900/60" : "text-neutral-400"
                      }`}>Modelo</span>
                      <span className={`text-sm font-extrabold uppercase block truncate max-w-[200px] ${
                        currentBrand.id === "galapagos" ? "text-blue-950" : "text-neutral-800"
                      }`} title={fipeDetails.model}>
                        {fipeDetails.model}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[8px] uppercase font-black tracking-widest leading-none block ${
                        currentBrand.id === "galapagos" ? "text-blue-900/60" : "text-neutral-400"
                      }`}>Ano & Combustível</span>
                      <span className={`text-sm font-extrabold uppercase block ${
                        currentBrand.id === "galapagos" ? "text-blue-950" : "text-neutral-800"
                      }`}>{fipeDetails.fuel} • {selectedAnoTexto.split(" ")[0]}</span>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[8px] uppercase font-black tracking-widest leading-none block ${
                        currentBrand.id === "galapagos" ? "text-blue-900/60" : "text-neutral-400"
                      }`}>Código Fipe</span>
                      <span className={`text-sm font-mono font-bold block ${
                        currentBrand.id === "galapagos" ? "text-blue-950" : "text-neutral-800"
                      }`}>{fipeDetails.codeFipe || fipeRealCode}</span>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[8px] uppercase font-black tracking-widest leading-none block ${
                        currentBrand.id === "galapagos" ? "text-blue-900/60" : "text-neutral-400"
                      }`}>Cor</span>
                      <span className={`text-sm font-extrabold uppercase block ${
                        currentBrand.id === "galapagos" ? "text-blue-950" : "text-neutral-800"
                      }`}>{vehicleColor}</span>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[8px] uppercase font-black tracking-widest leading-none block ${
                        currentBrand.id === "galapagos" ? "text-blue-900/60" : "text-neutral-400"
                      }`}>Número do Chassi</span>
                      <span className={`text-sm font-mono font-bold block truncate ${
                        currentBrand.id === "galapagos" ? "text-blue-950" : "text-neutral-800"
                      }`} title={chassi}>{chassi}</span>
                    </div>
                  </div>
                </div>

                <div className={`border rounded-sm p-4 text-left flex items-start gap-3 ${
                  currentBrand.id === "galapagos"
                    ? "bg-blue-500/5 border-blue-500/20 text-blue-900"
                    : "bg-orange-50 border border-orange-100 text-neutral-600"
                }`}>
                  <Info className={`h-5 w-5 shrink-0 mt-0.5 ${
                    currentBrand.id === "galapagos" ? "text-blue-600" : "text-[var(--brand-accent)]"
                  }`} />
                  <p className="text-[11px] font-bold leading-relaxed">
                    Certifique-se de que os dados do veículo estão corretos. Ao prosseguir, buscaremos as ofertas de planos e valores mensais de seguros oficiais da Sigga para seu perfil.
                  </p>
                </div>
              </Card>
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <Button 
                onClick={() => setStep(6)}
                className="h-12 px-8 border-2 border-[var(--brand-accent)] bg-[var(--brand-accent)]/5 hover:bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-black uppercase text-xs tracking-widest rounded-sm flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4.5 h-4.5" /> Voltar
              </Button>
              <Button 
                onClick={() => setStep(8)}
                className="bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white rounded-sm font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-2"
              >
                Ver Planos Disponíveis <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 8: Select Plans */}
        {step === 8 && (
          <div className="w-full max-w-5xl space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#0c0a09] tracking-tight uppercase">Escolha o seu Plano</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Compare as opções de seguro e selecione a melhor cobertura mensal para suas necessidades
              </p>
            </div>

            {plansLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-sm border border-neutral-200">
                <RotateCw className="w-10 h-10 text-[var(--brand-accent)] animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest text-[var(--brand-accent)] animate-pulse">
                  Consultando tabelas de planos e benefícios...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch justify-center max-w-4xl mx-auto">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.tppId;
                  const benefits = benefitsCache[plan.name] || [];
                  const isBronze = plan.name.toLowerCase().includes("bronze");
                  const isExpanded = expandedPlans[plan.name] || false;
                  
                  return (
                    <Card
                      key={plan.planId}
                      onClick={() => setSelectedPlanId(plan.tppId)}
                      className={`p-8 border rounded-xl flex flex-col justify-between transition-all duration-300 cursor-pointer text-left relative overflow-hidden group hover:scale-[1.02] ${
                        isSelected 
                          ? "bg-white border-[var(--brand-accent)] shadow-2xl shadow-[var(--brand-accent)]/10 ring-2 ring-[var(--brand-accent)]" 
                          : "bg-white border-neutral-200/80 hover:border-neutral-400 hover:shadow-xl"
                      }`}
                    >
                      {/* Top ribbon decor for the premium plan */}
                      {!isBronze && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-[#ffaa00] to-[var(--brand-accent)] text-white text-[7px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-bl-sm">
                          MAIS VENDIDO
                        </div>
                      )}

                      <div className="space-y-6 flex-1">
                        <div className="space-y-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isBronze ? "text-neutral-400" : "text-[var(--brand-accent)]"}`}>
                            {plan.name}
                          </span>
                          <div className="flex items-baseline gap-1 text-[#0c0a09]">
                            <span className="text-4xl font-extrabold font-mono tracking-tighter">{plan.price}</span>
                            <span className="text-xs text-neutral-400 font-bold uppercase">/ mês</span>
                          </div>
                          <div className="inline-flex items-center gap-1 mt-1 bg-neutral-100/80 px-2 py-0.5 rounded text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                            <span>+ Adesão única: R$ 350,00</span>
                          </div>
                          
                        
                        </div>

                        {/* Short Description */}
                        <p className="text-xs text-neutral-500 font-bold leading-relaxed pt-2">
                          {getPlanDescription(plan.name)}
                        </p>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={(e) => togglePlanExpand(plan.name, e)}
                            className="text-[var(--brand-accent)] hover:text-[#ffaa00] font-black uppercase text-[9px] tracking-widest flex items-center gap-1 transition-colors focus:outline-none"
                          >
                            {isExpanded ? (
                              <>
                                Ocultar Coberturas <ChevronLeft className="w-3 h-3 rotate-90" />
                              </>
                            ) : (
                              <>
                                Saiba Mais <ChevronLeft className="w-3 h-3 -rotate-90" />
                              </>
                            )}
                          </button>
                        </div>

                        {/* Collapsible Benefits list details */}
                        {isExpanded && (
                          <div className="space-y-4 py-4 border-t border-neutral-100 mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
                            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Coberturas & Benefícios</h4>
                            <div className="space-y-3.5">
                              {benefits.length > 0 ? (
                                benefits.map((b, idx) => (
                                  <div key={idx} className="flex items-start gap-3">
                                    {b.possui ? (
                                      <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="h-3 w-3" />
                                      </div>
                                    ) : (
                                      <div className="w-4 h-4 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <X className="h-3 w-3" />
                                      </div>
                                    )}
                                    <div className="text-left">
                                      <span className={`block text-xs font-extrabold ${b.possui ? "text-neutral-800" : "text-neutral-400 line-through"}`}>
                                        {b.nome}
                                      </span>
                                      <span className="block text-[10px] text-neutral-400 font-medium leading-none mt-0.5">
                                        {b.descricao}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="space-y-2 animate-pulse">
                                  <div className="h-4 bg-neutral-100 rounded-sm w-3/4" />
                                  <div className="h-4 bg-neutral-100 rounded-sm w-5/6" />
                                  <div className="h-4 bg-neutral-100 rounded-sm w-2/3" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-neutral-100 w-full">
                        <Button
                          type="button"
                          className={`w-full h-11 font-black uppercase text-[10px] tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 ${
                            isSelected 
                              ? "bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white shadow-lg shadow-orange-500/20" 
                              : "bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              Plano Selecionado <Check className="w-4 h-4 shrink-0" />
                            </>
                          ) : (
                            "Selecionar Plano"
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <Button 
                onClick={() => setStep(7)}
                className="h-12 px-8 border-2 border-[var(--brand-accent)] bg-[var(--brand-accent)]/5 hover:bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-black uppercase text-xs tracking-widest rounded-sm flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4.5 h-4.5" /> Voltar
              </Button>
              <Button 
                onClick={handleConfirmPlan}
                disabled={!selectedPlanId || loading}
                className="bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white rounded-sm font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-2"
              >
                Continuar para Resumo <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 9: Proposal Summary */}
        {step === 9 && (
          <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#0c0a09] tracking-tight uppercase">Resumo da Proposta</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Confira todos os dados cadastrados antes de homologar e enviar a proposta oficial
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[#0c0a09]">
              {/* Owner Info Details Card */}
              <Card className="p-8 bg-white border border-neutral-200/80 rounded-xl space-y-6 shadow-md text-left flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-wide pb-2 border-b border-neutral-100 flex items-center gap-2">
                    <User className="text-[var(--brand-accent)] h-5 w-5" /> Dados do Proprietário
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">Nome do Titular</span>
                      <span className="text-sm font-extrabold text-neutral-800 uppercase">{user?.name || user?.nome || "Carregando..."}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">CPF / Documento</span>
                        <span className="text-xs font-mono font-bold text-neutral-800">{user?.taxNumber || "Carregando..."}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">Celular</span>
                        <span className="text-xs font-mono font-bold text-neutral-800">{user?.phone || user?.celular || "(11) 99999-8888"}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">E-mail Cadastrado</span>
                      <span className="text-xs font-semibold text-neutral-600">{user?.email || "Carregando..."}</span>
                    </div>

                    <div className="bg-neutral-50 rounded-sm p-4 border border-neutral-100 space-y-3">
                      <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">Dados de Cobrança (G8Pay)</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <span className="block text-[7px] text-neutral-400 uppercase leading-none font-bold">Banco</span>
                          <span className="text-[10px] font-bold text-neutral-700">384-G8 PAY IP</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[7px] text-neutral-400 uppercase leading-none font-bold">Agência</span>
                          <span className="text-[10px] font-mono font-bold text-neutral-700">{user?.accountBranch || "0001"}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[7px] text-neutral-400 uppercase leading-none font-bold">Conta</span>
                          <span className="text-[10px] font-mono font-bold text-neutral-700">{user?.accountNumber || "Carregando..."}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-3 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-neutral-600 font-bold leading-relaxed">
                    Pagamento mensal debitado de forma prática e automática em sua conta G8Pay no dia de vencimento.
                  </p>
                </div>
              </Card>

              {/* Vehicle & Plan summary Card */}
              <Card className="p-8 bg-white border border-neutral-200/80 rounded-xl space-y-6 shadow-md text-left flex flex-col justify-between">
                <div className="space-y-5">
                  <h3 className="text-lg font-black uppercase tracking-wide pb-2 border-b border-neutral-100 flex items-center gap-2">
                    <Car className="text-[var(--brand-accent)] h-5 w-5" /> Dados da Cotação & Plano
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">Veículo</span>
                      <span className="text-xs font-extrabold text-neutral-800 uppercase block truncate">{selectedMarcaTexto} {selectedModeloTexto}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">Placa</span>
                      <span className="text-xs font-mono font-bold text-neutral-800 uppercase block">{placa}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">Ano / Modelo</span>
                      <span className="text-xs font-extrabold text-neutral-800 block">{selectedAnoTexto}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">Cor / Chassi</span>
                      <span className="text-xs font-extrabold text-neutral-800 block truncate">{vehicleColor} / {chassi}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">Tabela FIPE</span>
                      <span className="text-xs font-extrabold text-[var(--brand-accent)] block font-mono">{fipeValueQuoted || (fipeDetails && fipeDetails.price)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none">Código Cotação</span>
                      <span className="text-xs font-bold text-neutral-800 block font-mono">{quotationCode}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-[#0c0a09] text-white rounded-lg border border-[var(--brand-accent)]/20 flex justify-between items-center">
                      <div className="text-left space-y-0.5">
                        <Badge className="bg-[var(--brand-accent)] text-white border-0 text-[7px] font-black uppercase tracking-wider py-0 px-1.5 rounded-sm">
                          Plano Escolhido
                        </Badge>
                        <h4 className="text-sm font-black uppercase tracking-wide">
                          {plans.find(p => p.tppId === selectedPlanId)?.name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] text-neutral-400 font-bold uppercase leading-none mb-0.5">Valor Mensal</span>
                        <span className="text-lg font-black font-mono text-[var(--brand-accent)]">
                          {plans.find(p => p.tppId === selectedPlanId)?.price}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200/60 space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-neutral-500">
                        <span className="uppercase tracking-wider">Mensalidade do Plano:</span>
                        <span className="font-mono text-neutral-800">
                          {plans.find(p => p.tppId === selectedPlanId)?.price}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-neutral-500">
                        <span className="uppercase tracking-wider">Taxa de Adesão (Única):</span>
                        <span className="font-mono text-neutral-800">R$ 350,00</span>
                      </div>
                      <div className="border-t border-neutral-200/80 pt-2 flex justify-between items-center text-sm font-black text-neutral-900">
                        <span className="uppercase tracking-widest text-[10px]">Primeiro Pagamento Total:</span>
                        <span className="font-mono text-[var(--brand-accent)] text-base">
                          {getFirstPaymentTotal(plans.find(p => p.tppId === selectedPlanId)?.price)}
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-400 font-medium leading-tight">
                        * A taxa de adesão de R$ 350,00 é cobrada junto com a primeira mensalidade no momento do fechamento. As parcelas seguintes contemplam apenas o valor mensal do plano.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-100 text-left">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="accept-terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="rounded border-neutral-300 text-[var(--brand-accent)] focus:ring-[var(--brand-accent)] h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="accept-terms" className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider cursor-pointer select-none">
                      Estou ciente de que as informações fornecidas e coletadas são verdadeiras e aceito os termos do contrato.
                    </label>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              <Button 
                onClick={() => setStep(8)}
                className="h-12 px-8 border-2 border-[var(--brand-accent)] bg-[var(--brand-accent)]/5 hover:bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-black uppercase text-xs tracking-widest rounded-sm flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4.5 h-4.5" /> Voltar
              </Button>
              <Button 
                onClick={handleFinalSubmit}
                disabled={!acceptTerms || loading}
                className="bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white rounded-sm font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" /> Homologando Proposta...
                  </>
                ) : (
                  <>
                    Confirmar e Enviar Proposta <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 10: Success Screen */}
        {step === 10 && (
          <div className="w-full max-w-xl space-y-8 animate-in zoom-in duration-300">
            <Card className="p-10 border border-emerald-100 shadow-2xl shadow-emerald-50 bg-white text-[#0c0a09] relative overflow-hidden text-center rounded-xl">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-green-500" />
              
              <div className="space-y-6">
                {/* Glowing checked green badge */}
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-400 text-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-100/50">
                  <CheckCircle2 className="h-12 w-12 stroke-[2]" />
                </div>

                <div className="space-y-3">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[8px] font-black tracking-[0.3em] px-3 py-1 rounded-sm uppercase">
                    Solicitação Concluída
                  </Badge>
                  <h2 className="text-3xl font-black tracking-tight uppercase text-neutral-900 leading-tight">
                    SOLICITAÇÃO DE COTAÇÃO RECEBIDA
                  </h2>
                  <p className="text-sm font-bold text-neutral-500 leading-relaxed max-w-md mx-auto">
                    Recebemos sua solicitação de cotação, em breve um consultor entrará em contato para validar as informações e efetivar a contratação.
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 rounded-sm border border-neutral-100 text-left flex items-start gap-4">
                  <HeartHandshake className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="block text-xs font-black uppercase tracking-wider text-neutral-800">Homologado Sigga</span>
                    <p className="text-[11px] text-neutral-400 font-semibold leading-relaxed">
                      A cotação foi registrada no servidor Sigga sob o código de proposta <strong className="font-mono text-neutral-700">{quotationCode}</strong>.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button
                    onClick={handleResetWizard}
                    className="flex-1 h-12 bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white rounded-sm font-black uppercase tracking-widest text-[9px] shadow-lg transition-all"
                  >
                    Voltar para Meus Veículos
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Details drawer/modal overlay for "Proteção Ativa" vehicle */}
      {selectedVehicleDetails && (
        <div className="fixed inset-0 bg-[#0c0a09]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-neutral-200 max-w-2xl w-full p-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 text-left text-[#0c0a09]">
            {/* Top brand accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[var(--brand-accent)] to-[#ffaa00]" />
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedVehicleDetails(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition-all"
            >
              <X className="h-5 w-5 text-neutral-400" />
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[var(--brand-accent)]/10 rounded-full flex items-center justify-center text-[var(--brand-accent)]">
                  <Shield className="h-6 w-6 stroke-[2]" />
                </div>
                <div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-0 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider">
                    Apólice Ativa • G8 Protegido
                  </Badge>
                  <h3 className="text-2xl font-black uppercase text-neutral-900 leading-tight">
                    {selectedVehicleDetails.brand} {selectedVehicleDetails.model}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-neutral-100">
                <div className="space-y-1">
                  <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-wider">Placa</span>
                  <span className="text-sm font-extrabold text-neutral-800 font-mono uppercase">{selectedVehicleDetails.placa}</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-wider">Chassi</span>
                  <span className="text-sm font-extrabold text-neutral-800 font-mono">{selectedVehicleDetails.chassi}</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-wider">Plano Ativo</span>
                  <span className="text-sm font-extrabold text-[var(--brand-accent)] uppercase">{selectedVehicleDetails.planName}</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-wider">Valor Mensal</span>
                  <span className="text-sm font-black text-neutral-800 font-mono">{selectedVehicleDetails.price}</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-wider">Vigência</span>
                  <span className="text-xs font-bold text-neutral-600">{selectedVehicleDetails.vigencia}</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-wider">Valor de Mercado</span>
                  <span className="text-xs font-bold text-neutral-600 font-mono">{selectedVehicleDetails.fipeValue}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Coberturas e Serviços Inclusos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedVehicleDetails.coberturas?.map((cobertura: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[11px] font-bold text-neutral-600 leading-none">{cobertura}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-50 rounded-sm p-4 border border-neutral-100 flex items-center justify-between mt-4">
                <div className="text-left">
                  <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest leading-none mb-1">Sinistro & Assistência 24h</span>
                  <span className="text-sm font-black text-[var(--brand-accent)] font-mono">0800 940 8888</span>
                </div>
                <Button
                  onClick={() => {
                    toast.success("Solicitando reboque/socorro... Nossa central de assistência entrará em contato em minutos!");
                    setSelectedVehicleDetails(null);
                  }}
                  className="bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white font-black uppercase tracking-widest text-[9px] px-6 h-10 rounded-sm"
                >
                  Acionar Assistência
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro Rápido de Veículo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md bg-white rounded-md border border-neutral-200 overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,119,17,0.02),transparent)] pointer-events-none" />
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-neutral-100 relative">
              <div className="flex items-center gap-3 text-[var(--brand-accent)]">
                <div className="w-10 h-10 bg-[var(--brand-accent)]/10 rounded-sm flex items-center justify-center shrink-0">
                  <Car className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-wider leading-none">Cadastrar Veículo</h3>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mt-1">G8Pay Consulta Rápida</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 border-0 bg-transparent outline-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddVehicleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="newPlaca" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Placa</label>
                  <Input 
                    id="newPlaca"
                    type="text"
                    maxLength={7}
                    value={newPlaca}
                    onChange={(e) => setNewPlaca(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
                    placeholder="ABC1D23"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-black uppercase tracking-widest bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newRenavam" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">RENAVAM</label>
                  <Input 
                    id="newRenavam"
                    type="text"
                    maxLength={11}
                    value={newRenavam}
                    onChange={(e) => setNewRenavam(e.target.value.replace(/\D/g, ""))}
                    placeholder="12345678901"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="newBrand" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Marca</label>
                <Input 
                  id="newBrand"
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="Ex: CHEVROLET, RENAULT, FIAT"
                  className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold uppercase bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="newModel" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Modelo</label>
                <Input 
                  id="newModel"
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="Ex: ONIX, KWID, UNO"
                  className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold uppercase bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="newYear" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Ano Modelo</label>
                  <Input 
                    id="newYear"
                    type="text"
                    maxLength={4}
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex: 2024"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold text-center bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newColor" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Cor (Opcional)</label>
                  <Input 
                    id="newColor"
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="Ex: Branco"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold uppercase text-center bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 h-12 border-neutral-200 font-extrabold text-xs uppercase tracking-wider text-neutral-500 rounded-sm"
                  disabled={addLoading}
                >
                  Cancelar
                </Button>
                
                <Button 
                  type="submit"
                  className="flex-1 bg-brand-accent hover:bg-brand-accent-hover text-white font-extrabold text-xs uppercase tracking-wider h-12 rounded-sm transition-all shadow-md flex items-center justify-center gap-2 border-0"
                  disabled={addLoading}
                >
                  {addLoading ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    "Cadastrar"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

