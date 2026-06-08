"use client";

import React, { useState, useEffect } from "react";
import { 
  Car, 
  Search, 
  RotateCw, 
  Check, 
  X, 
  Info, 
  DollarSign, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  CreditCard,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Printer,
  ShoppingBag,
  Coins,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";
import { currentBrand } from "@/config/brand";

// Tabs definitions
type TabType = "todos" | "ipva" | "licenciamento" | "multas";

export default function DebitosVeicularesPage() {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sumLoading, setSumLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Form State
  const [placa, setPlaca] = useState("");
  const [renavam, setRenavam] = useState("");
  const [searchCompleted, setSearchCompleted] = useState(false);

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

      // Automatically select the newly registered vehicle
      setPlaca(cleanPl);
      setRenavam(cleanRen);
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
      setPlaca(cleanPl);
      setRenavam(cleanRen);
    } finally {
      setAddLoading(false);
    }
  };

  // DETRAN Search Response Data
  const [debtsData, setDebtsData] = useState<{
    veiculo: any;
    multas: any[];
    ipvas: any[];
    licenciamentos: any[];
    dpvats: any[];
    dividaativa: any;
  } | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("ipva");

  // Selection states (Checkout Cart)
  // To avoid mixing payment categories, once the user selects an item in a tab,
  // we lock selections to that tab category.
  const [selectedCategory, setSelectedCategory] = useState<TabType | null>(null);
  const [selectedMultas, setSelectedMultas] = useState<string[]>([]); // list of AIT codes
  const [selectedIpvas, setSelectedIpvas] = useState<string[]>([]); // list of years as strings
  const [selectedLicenciamentos, setSelectedLicenciamentos] = useState<string[]>([]); // list of years as strings

  // Dynamic summed values from server
  const [totalSumValue, setTotalSumValue] = useState<number>(0);
  const [totalSumFormatted, setTotalSumFormatted] = useState<string>("");

  // Installments Simulation
  const [installmentsOptions, setInstallmentsOptions] = useState<any[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);

  // Payment Safe Webview Form (Mercado Pago)
  const [mpFormHtml, setMpFormHtml] = useState<string>("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [cardTokenData, setCardTokenData] = useState<any>(null);

  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Custom Credit Card Checkout States
  const [cardTab, setCardTab] = useState<"meus-cartoes" | "novo-cartao">("novo-cartao");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardCpf, setCardCpf] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Load registered vehicles from backend + localStorage
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
            renavam: bv.renavam || null,
            fipeValue: bv.valorFipe || "R$ 0,00",
            color: "N/D",
            chassi: bv.chassi || "N/D",
            fipeCode: bv.codeFipe || "",
            status: "Cotação em Análise",
            planName: "Personalizado",
            price: "Sob consulta",
            vigencia: "Aguardando Vistoria"
          };
        });

        const merged: any[] = [];
        const seenPlates = new Set<string>();

        // First add localVehicles to preserve specific statuses
        localVehicles.forEach((lv: any) => {
          if (lv.placa !== "G8P-9110" && lv.placa !== "G8B-3000") {
            merged.push({ ...lv });
            seenPlates.add(String(lv.placa || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase());
          }
        });

        // Then add backend vehicles or enrich existing
        mappedBackend.forEach((bv: any) => {
          const cleanPl = String(bv.placa || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
          if (!seenPlates.has(cleanPl)) {
            merged.push(bv);
            seenPlates.add(cleanPl);
          } else {
            // Enrich existing vehicle from localVehicles with backend properties
            const existing = merged.find(v => String(v.placa || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase() === cleanPl);
            if (existing) {
              if (bv.renavam && !existing.renavam) {
                existing.renavam = bv.renavam;
              }
              if (bv.brand && (!existing.brand || existing.brand === "N/D")) {
                existing.brand = bv.brand;
              }
              if (bv.model && (!existing.model || existing.model === "Modelo Desconhecido" || existing.model === "N/D")) {
                existing.model = bv.model;
              }
            }
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

  // Auto query if redirected from Meus Veículos
  useEffect(() => {
    const autoQueryPlate = localStorage.getItem("g8_auto_query_plate");
    const autoQueryRenavam = localStorage.getItem("g8_auto_query_renavam");
    
    if (autoQueryPlate) {
      const cleanPl = autoQueryPlate.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      const cleanRen = (autoQueryRenavam || "").replace(/\D/g, "");
      
      setPlaca(cleanPl);
      setRenavam(cleanRen);
      
      // Clean up localStorage immediately to avoid search loops on page refresh
      localStorage.removeItem("g8_auto_query_plate");
      localStorage.removeItem("g8_auto_query_renavam");
      
      const runAutoSearch = async () => {
        if (cleanPl.length !== 7 || cleanRen.length !== 11) return;
        setSearchLoading(true);
        setSearchCompleted(false);
        setDebtsData(null);
        handleResetCart();
        
        try {
          const response = await api.get(`/api/multas-carro/infracoes/${cleanPl}/${cleanRen}`);
          if (response.data && response.data.status && response.data.result) {
            const result = response.data.result;
            setDebtsData({
              veiculo: result.veiculo || null,
              multas: result.multas || [],
              ipvas: result.ipvas || [],
              licenciamentos: result.licenciamentos || [],
              dpvats: result.dpvats || [],
              dividaativa: result.debitos || null
            });
            setSearchCompleted(true);
            toast.success("Dados de débitos veiculares carregados com sucesso!");
            
            if ((result.ipvas || []).length > 0) {
              setActiveTab("ipva");
            } else if ((result.licenciamentos || []).length > 0) {
              setActiveTab("licenciamento");
            } else if ((result.multas || []).length > 0) {
              setActiveTab("multas");
            }
          } else {
            toast.error("Não foram encontrados dados para este veículo. Verifique a Placa e o RENAVAM.");
          }
        } catch (err) {
          console.error("Erro ao buscar débitos DETRAN:", err);
          toast.error("Ocorreu uma falha de conexão com o DETRAN. Verifique as credenciais e tente novamente.");
        } finally {
          setSearchLoading(false);
        }
      };
      
      setTimeout(runAutoSearch, 100);
    }
  }, [myVehicles]);

  // Search Submit DETRAN
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const cleanRenavam = renavam.replace(/\D/g, "");

    if (cleanPlaca.length !== 7) {
      toast.error("Por favor, digite uma placa válida com 7 caracteres.");
      return;
    }
    if (cleanRenavam.length !== 11) {
      toast.error("Por favor, digite um RENAVAM válido com 11 dígitos.");
      return;
    }

    setSearchLoading(true);
    setSearchCompleted(false);
    setDebtsData(null);
    handleResetCart();

    try {
      const response = await api.get(`/api/multas-carro/infracoes/${cleanPlaca}/${cleanRenavam}`);
      if (response.data && response.data.status && response.data.result) {
        const result = response.data.result;
        setDebtsData({
          veiculo: result.veiculo || null,
          multas: result.multas || [],
          ipvas: result.ipvas || [],
          licenciamentos: result.licenciamentos || [],
          dpvats: result.dpvats || [],
          dividaativa: result.debitos || null
        });
        setSearchCompleted(true);
        toast.success("Dados de débitos veiculares carregados com sucesso!");
        
        // Auto-select tab with active debts
        if ((result.ipvas || []).length > 0) {
          setActiveTab("ipva");
        } else if ((result.licenciamentos || []).length > 0) {
          setActiveTab("licenciamento");
        } else if ((result.multas || []).length > 0) {
          setActiveTab("multas");
        }
      } else {
        toast.error("Não foram encontrados dados para este veículo. Verifique a Placa e o RENAVAM.");
      }
    } catch (err) {
      console.error("Erro ao buscar débitos DETRAN:", err);
      toast.error("Ocorreu uma falha de conexão com o DETRAN. Verifique as credenciais e tente novamente.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Reset Cart / Selections
  const handleResetCart = () => {
    setSelectedCategory(null);
    setSelectedMultas([]);
    setSelectedIpvas([]);
    setSelectedLicenciamentos([]);
    setTotalSumValue(0);
    setTotalSumFormatted("");
    setInstallmentsOptions([]);
    setSelectedInstallment(null);
    setCardTokenData(null);
    setMpFormHtml("");
    // Reset custom card fields
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setCardCpf("");
    setSaveCard(false);
    setIsCardFlipped(false);
  };

  // Handle checking / unchecking items
  const handleToggleItem = (tab: Exclude<TabType, "todos">, id: string) => {
    // Lock category check if not in 'todos' tab
    if (activeTab !== "todos") {
      const hasOtherSelections = 
        (tab !== "multas" && selectedMultas.length > 0) ||
        (tab !== "ipva" && selectedIpvas.length > 0) ||
        (tab !== "licenciamento" && selectedLicenciamentos.length > 0);
      
      if (hasOtherSelections) {
        toast.warning("Você possui seleções de outras categorias na aba Todos. Desmarque-as ou limpe o carrinho para pagar individualmente.");
        return;
      }
    }

    let updatedMultas = [...selectedMultas];
    let updatedIpvas = [...selectedIpvas];
    let updatedLicenciamentos = [...selectedLicenciamentos];

    if (tab === "multas") {
      if (updatedMultas.includes(id)) {
        updatedMultas = updatedMultas.filter(x => x !== id);
      } else {
        updatedMultas.push(id);
      }
      setSelectedMultas(updatedMultas);
    } else if (tab === "ipva") {
      if (updatedIpvas.includes(id)) {
        updatedIpvas = updatedIpvas.filter(x => x !== id);
      } else {
        updatedIpvas.push(id);
      }
      setSelectedIpvas(updatedIpvas);
    } else if (tab === "licenciamento") {
      if (updatedLicenciamentos.includes(id)) {
        updatedLicenciamentos = updatedLicenciamentos.filter(x => x !== id);
      } else {
        updatedLicenciamentos.push(id);
      }
      setSelectedLicenciamentos(updatedLicenciamentos);
    }

    // Determine current active selection category
    const hasSelection = updatedMultas.length > 0 || updatedIpvas.length > 0 || updatedLicenciamentos.length > 0;
    if (hasSelection) {
      const selectedCount = (updatedMultas.length > 0 ? 1 : 0) + (updatedIpvas.length > 0 ? 1 : 0) + (updatedLicenciamentos.length > 0 ? 1 : 0);
      if (activeTab === "todos" || selectedCount > 1) {
        setSelectedCategory("todos");
      } else {
        if (updatedMultas.length > 0) setSelectedCategory("multas");
        else if (updatedIpvas.length > 0) setSelectedCategory("ipva");
        else if (updatedLicenciamentos.length > 0) setSelectedCategory("licenciamento");
      }
    } else {
      setSelectedCategory(null);
    }
  };

  // Calculate dynamic sum on selections
  useEffect(() => {
    if (!selectedCategory) {
      setTotalSumValue(0);
      setTotalSumFormatted("");
      setInstallmentsOptions([]);
      setSelectedInstallment(null);
      return;
    }

    const triggerSumAPI = async () => {
      setSumLoading(true);
      const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      try {
        if (selectedCategory === "todos") {
          // Calculate sum client-side
          let sum = 0;
          if (debtsData) {
            selectedIpvas.forEach(ano => {
              const item = debtsData.ipvas.find(x => x.ano.toString() === ano);
              if (item) sum += item.valor;
            });
            selectedLicenciamentos.forEach(ano => {
              const item = debtsData.licenciamentos.find(x => x.ano.toString() === ano);
              if (item) sum += item.valor;
            });
            selectedMultas.forEach(ait => {
              const item = debtsData.multas.find(x => x.ait === ait);
              if (item) sum += item.valor;
            });
          }
          setTotalSumValue(sum);
          setTotalSumFormatted(`R$ ${sum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        } else if (selectedCategory === "multas") {
          const res = await api.post("/api/multas-carro/somar-multas", {
            aitList: selectedMultas
          });
          if (res.data && res.data.data) {
            setTotalSumValue(res.data.data.valor);
            setTotalSumFormatted(res.data.data.valorFormatado);
          }
        } else if (selectedCategory === "ipva") {
          const res = await api.post("/api/multas-carro/somar-ipva", {
            placa: cleanPlaca,
            anos: selectedIpvas
          });
          if (res.data && res.data.data) {
            setTotalSumValue(res.data.data.valor);
            setTotalSumFormatted(res.data.data.valorFormatado);
          }
        } else if (selectedCategory === "licenciamento") {
          const res = await api.post("/api/multas-carro/somar-licenciamento", {
            placa: cleanPlaca,
            anos: selectedLicenciamentos
          });
          if (res.data && res.data.data) {
            setTotalSumValue(res.data.data.valor);
            setTotalSumFormatted(res.data.data.valorFormatado);
          }
        }
      } catch (err) {
        console.error("Erro ao somar débitos:", err);
        toast.error("Erro ao obter cálculo atualizado de débitos.");
      } finally {
        setSumLoading(false);
      }
    };

    triggerSumAPI();
  }, [selectedCategory, selectedMultas, selectedIpvas, selectedLicenciamentos, placa, debtsData]);

  // Installment Simulation when sum changes
  useEffect(() => {
    if (totalSumValue <= 0) {
      setInstallmentsOptions([]);
      setSelectedInstallment(null);
      return;
    }

    const simulateInstallments = async () => {
      try {
        const res = await api.post("/api/multas-carro/calcular-parcelas", {
          valor: totalSumValue
        });
        if (res.data && Array.isArray(res.data)) {
          setInstallmentsOptions(res.data);
          // Set 1x as default
          setSelectedInstallment(res.data[0]);
        }
      } catch (err) {
        console.error("Erro ao simular parcelas:", err);
      }
    };

    simulateInstallments();
  }, [totalSumValue]);

  // Custom input formatting and masks
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const formatted = value.substring(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    let formatted = value.substring(0, 4);
    if (formatted.length > 2) {
      formatted = formatted.substring(0, 2) + "/" + formatted.substring(2);
    }
    setCardExpiry(formatted);
  };

  const handleCardCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    let formatted = value.substring(0, 11);
    if (formatted.length > 9) {
      formatted = formatted.substring(0, 3) + "." + formatted.substring(3, 6) + "." + formatted.substring(6, 9) + "-" + formatted.substring(9);
    } else if (formatted.length > 6) {
      formatted = formatted.substring(0, 3) + "." + formatted.substring(3, 6) + "." + formatted.substring(6);
    } else if (formatted.length > 3) {
      formatted = formatted.substring(0, 3) + "." + formatted.substring(3);
    }
    setCardCpf(formatted);
  };

  const handleConfirmCustomPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const cleanNumber = cardNumber.replace(/\s/g, "");
    if (cleanNumber.length < 16) {
      toast.error("Por favor, digite um número de cartão válido (16 dígitos).");
      return;
    }

    if (!cardName.trim() || cardName.trim().split(/\s+/).length < 2) {
      toast.error("Por favor, digite o nome completo impresso no cartão.");
      return;
    }

    if (cardExpiry.length < 5) {
      toast.error("Por favor, digite uma data de vencimento válida (MM/AA).");
      return;
    }

    const parts = cardExpiry.split("/");
    const month = parseInt(parts[0], 10);
    if (isNaN(month) || month < 1 || month > 12) {
      toast.error("Por favor, digite um mês de vencimento válido (01 a 12).");
      return;
    }

    if (cardCvv.length < 3) {
      toast.error("Por favor, digite um código CVV válido (3 ou 4 dígitos).");
      return;
    }

    const cleanCpf = cardCpf.replace(/\D/g, "");
    if (cleanCpf.length < 11) {
      toast.error("Por favor, digite um CPF válido.");
      return;
    }

    setCheckoutLoading(true);
    setTimeout(() => {
      setCheckoutLoading(false);
      // Construct simulated tokenization data
      const mockToken = "tok_" + currentBrand.id + "_" + Math.random().toString(36).substring(2, 15).toUpperCase();
      const mockPayload = {
        token: mockToken,
        payment_method_id: cleanNumber.startsWith("5") ? "mastercard" : cleanNumber.startsWith("3") ? "amex" : "visa",
        payer: {
          email: `cliente@${currentBrand.id}bank.com.br`,
          identification: {
            type: "CPF",
            number: cleanCpf
          }
        }
      };

      setCardTokenData(mockPayload);
      setShowCheckoutModal(false);
      toast.success(`Cartão processado com sucesso com segurança ${currentBrand.name}! Processando pagamento...`);
    }, 1200);
  };

  // Open Checkout Webview / Modal Form
  const handleProceedToCheckout = () => {
    if (!selectedInstallment) {
      toast.error("Por favor, selecione uma opção de parcelamento para continuar.");
      return;
    }

    // Initialize/Reset custom card fields
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setCardCpf("");
    setSaveCard(false);
    setIsCardFlipped(false);
    setCardTab("novo-cartao");
    setMpFormHtml("custom"); // bypass mpFormHtml check

    // Open the custom payment modal directly
    setShowCheckoutModal(true);
  };

  // Listen to Window PostMessage tokenizations
  useEffect(() => {
    const handleMessageListener = (event: MessageEvent) => {
      // Validate secure messages
      if (event.data && typeof event.data === "object" && event.data.token) {
        const payload = event.data;
        setCardTokenData(payload);
        setShowCheckoutModal(false);
        toast.success("Cartão tokenizado com sucesso! Processando liquidação...");
      }
    };

    window.addEventListener("message", handleMessageListener);
    return () => window.removeEventListener("message", handleMessageListener);
  }, []);

  // Trigger Final payment settlement on successful tokenization
  useEffect(() => {
    if (!cardTokenData || !selectedCategory || !selectedInstallment) return;

    const executePayment = async () => {
      setPaymentLoading(true);
      const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      try {
        let endpoint = "";
        let payload: any = {
          amount: selectedInstallment.valorTotal,
          originalAmount: totalSumValue,
          token: cardTokenData.token,
          installments: selectedInstallment.parcelas,
          paymentMethodId: cardTokenData.payment_method_id || "visa",
          payerEmail: cardTokenData.payer?.email || `cliente@${currentBrand.id}bank.com.br`,
          placa: cleanPlaca
        };

        let resData: any = {};
        if (selectedCategory === "todos") {
          const promises = [];
          if (selectedIpvas.length > 0) {
            promises.push(api.post("/api/multas-carro/pagar-ipva", {
              ...payload,
              description: `Pagamento de IPVA - Placa ${cleanPlaca}`,
              anos: selectedIpvas
            }));
          }
          if (selectedLicenciamentos.length > 0) {
            promises.push(api.post("/api/multas-carro/pagar-licenciamento", {
              ...payload,
              description: `Pagamento de Licenciamento - Placa ${cleanPlaca}`,
              anos: selectedLicenciamentos
            }));
          }
          if (selectedMultas.length > 0) {
            promises.push(api.post("/api/multas-carro/pagar-multa", {
              ...payload,
              description: `Pagamento de multa de trânsito - Placa ${cleanPlaca}`,
              aitList: selectedMultas
            }));
          }
          const responses = await Promise.all(promises);
          resData = responses[0]?.data || {};
        } else {
          if (selectedCategory === "ipva") {
            endpoint = "/api/multas-carro/pagar-ipva";
            payload.description = `Pagamento de IPVA - Placa ${cleanPlaca}`;
            payload.anos = selectedIpvas;
          } else if (selectedCategory === "licenciamento") {
            endpoint = "/api/multas-carro/pagar-licenciamento";
            payload.description = `Pagamento de Licenciamento - Placa ${cleanPlaca}`;
            payload.anos = selectedLicenciamentos;
          } else if (selectedCategory === "multas") {
            endpoint = "/api/multas-carro/pagar-multa";
            payload.description = `Pagamento de multa de trânsito - Placa ${cleanPlaca}`;
            payload.aitList = selectedMultas;
          }
          const res = await api.post(endpoint, payload);
          resData = res.data || {};
        }

        toast.success("Pagamento efetuado com sucesso junto ao DETRAN!");
        
        // Show Digital Receipt
        setReceiptData({
          placa: cleanPlaca,
          category: selectedCategory,
          amountPaid: selectedInstallment.valorTotalFormatado,
          installments: selectedInstallment.parcelas,
          authCode: resData.authCode || Math.random().toString(36).substring(2, 10).toUpperCase(),
          date: new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR"),
          details: selectedCategory === "ipva" ? selectedIpvas 
                   : selectedCategory === "licenciamento" ? selectedLicenciamentos 
                   : selectedCategory === "multas" ? selectedMultas
                   : [
                       ...(selectedIpvas.map(a => `IPVA ${a}`)),
                       ...(selectedLicenciamentos.map(a => `Licenciamento ${a}`)),
                       ...(selectedMultas.map(m => `Multa AIT ${m}`))
                     ]
        });
        setShowReceipt(true);
        
        // Clear Search / Reset states
        handleResetCart();
        setDebtsData(null);
        setSearchCompleted(false);
      } catch (err) {
        console.error("Erro ao efetuar pagamento:", err);
        toast.error("Ocorreu uma falha ao liquidar débitos junto ao DETRAN. Verifique seu limite ou tente outro cartão.");
      } finally {
        setPaymentLoading(false);
        setCardTokenData(null);
      }
    };

    executePayment();
  }, [cardTokenData, selectedCategory, selectedInstallment, totalSumValue, placa, selectedMultas, selectedIpvas, selectedLicenciamentos]);

  const formatRenavam = (val: any) => {
    if (!val) return "";
    const str = String(val).replace(/\D/g, "");
    return str.padStart(11, "0");
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "N/D";
    if (dateStr instanceof Date) {
      if (isNaN(dateStr.getTime())) return "N/D";
      return dateStr.toLocaleDateString("pt-BR");
    }
    
    const cleanStr = String(dateStr).trim();
    if (cleanStr === "" || cleanStr === "null" || cleanStr === "undefined" || cleanStr === "Invalid Date") {
      return "N/D";
    }

    // If it's already DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
      return cleanStr;
    }

    // Try parsing as ISO format YYYY-MM-DD or YYYY-MM-DD HH:mm:ss or YYYY-MM-DDTHH:mm:ss
    const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2}))?/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }

    // Try parsing timestamp (e.g. 1779799867604)
    if (/^\d+$/.test(cleanStr)) {
      const d = new Date(parseInt(cleanStr));
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("pt-BR");
      }
    }

    // Fallback try/catch standard JS parsing
    try {
      const d = new Date(cleanStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("pt-BR");
      }
    } catch (e) {}

    return cleanStr;
  };

  const getVencimento = (m: any) => {
    const formatted = formatDate(m.vencimento);
    if (formatted === "N/D" || formatted === "INDISPONÍVEL" || formatted === "Invalid Date") {
      if (m.data_hora) {
        const cleanStr = String(m.data_hora).trim();
        let infractionDate = new Date();
        let parsed = false;
        const matchBR = cleanStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (matchBR) {
          infractionDate = new Date(parseInt(matchBR[3]), parseInt(matchBR[2]) - 1, parseInt(matchBR[1]));
          parsed = true;
        } else {
          const d = new Date(cleanStr);
          if (!isNaN(d.getTime())) {
            infractionDate = d;
            parsed = true;
          }
        }
        if (parsed) {
          infractionDate.setDate(infractionDate.getDate() + 30);
          return infractionDate.toLocaleDateString("pt-BR");
        }
      }
      return "INDISPONÍVEL";
    }
    return formatted;
  };

  // Dynamic calculations for Select All bar
  const totalIpvas = debtsData?.ipvas?.length || 0;
  const totalLicenciamentos = debtsData?.licenciamentos?.length || 0;
  const totalMultas = debtsData?.multas?.length || 0;

  let totalItemsInTab = 0;
  let selectedItemsInTab = 0;
  let allSelectedInTab = false;
  let isTabLocked = false;

  if (debtsData) {
    if (activeTab === "todos") {
      totalItemsInTab = totalIpvas + totalLicenciamentos + totalMultas;
      selectedItemsInTab = selectedIpvas.length + selectedLicenciamentos.length + selectedMultas.length;
      allSelectedInTab = totalItemsInTab > 0 && selectedItemsInTab === totalItemsInTab;
    } else if (activeTab === "ipva") {
      totalItemsInTab = totalIpvas;
      selectedItemsInTab = selectedIpvas.length;
      allSelectedInTab = totalItemsInTab > 0 && selectedItemsInTab === totalItemsInTab;
      isTabLocked = !!(selectedCategory && selectedCategory !== "ipva");
    } else if (activeTab === "licenciamento") {
      totalItemsInTab = totalLicenciamentos;
      selectedItemsInTab = selectedLicenciamentos.length;
      allSelectedInTab = totalItemsInTab > 0 && selectedItemsInTab === totalItemsInTab;
      isTabLocked = !!(selectedCategory && selectedCategory !== "licenciamento");
    } else if (activeTab === "multas") {
      totalItemsInTab = totalMultas;
      selectedItemsInTab = selectedMultas.length;
      allSelectedInTab = totalItemsInTab > 0 && selectedItemsInTab === totalItemsInTab;
      isTabLocked = !!(selectedCategory && selectedCategory !== "multas");
    }
  }

  const handleToggleSelectAll = () => {
    if (!debtsData) return;

    if (activeTab === "todos") {
      const allIpvas = debtsData.ipvas.map(x => x.ano.toString());
      const allLic = debtsData.licenciamentos.map(x => x.ano.toString());
      const allMultas = debtsData.multas.map(x => x.ait);

      const areAllSelected = 
        selectedIpvas.length === debtsData.ipvas.length &&
        selectedLicenciamentos.length === debtsData.licenciamentos.length &&
        selectedMultas.length === debtsData.multas.length;

      if (areAllSelected) {
        setSelectedIpvas([]);
        setSelectedLicenciamentos([]);
        setSelectedMultas([]);
        setSelectedCategory(null);
      } else {
        setSelectedIpvas(allIpvas);
        setSelectedLicenciamentos(allLic);
        setSelectedMultas(allMultas);
        setSelectedCategory("todos");
      }
    } else if (activeTab === "ipva") {
      const isLocked = selectedCategory && selectedCategory !== "ipva";
      if (isLocked) {
        toast.warning("Você possui seleções de outras categorias. Limpe o carrinho para selecionar nesta aba.");
        return;
      }
      const allIpvas = debtsData.ipvas.map(x => x.ano.toString());
      const areAllSelected = selectedIpvas.length === debtsData.ipvas.length;

      if (areAllSelected) {
        setSelectedIpvas([]);
        setSelectedCategory(null);
      } else {
        setSelectedIpvas(allIpvas);
        setSelectedCategory("ipva");
      }
    } else if (activeTab === "licenciamento") {
      const isLocked = selectedCategory && selectedCategory !== "licenciamento";
      if (isLocked) {
        toast.warning("Você possui seleções de outras categorias. Limpe o carrinho para selecionar nesta aba.");
        return;
      }
      const allLic = debtsData.licenciamentos.map(x => x.ano.toString());
      const areAllSelected = selectedLicenciamentos.length === debtsData.licenciamentos.length;

      if (areAllSelected) {
        setSelectedLicenciamentos([]);
        setSelectedCategory(null);
      } else {
        setSelectedLicenciamentos(allLic);
        setSelectedCategory("licenciamento");
      }
    } else if (activeTab === "multas") {
      const isLocked = selectedCategory && selectedCategory !== "multas";
      if (isLocked) {
        toast.warning("Você possui seleções de outras categorias. Limpe o carrinho para selecionar nesta aba.");
        return;
      }
      const allMultas = debtsData.multas.map(x => x.ait);
      const areAllSelected = selectedMultas.length === debtsData.multas.length;

      if (areAllSelected) {
        setSelectedMultas([]);
        setSelectedCategory(null);
      } else {
        setSelectedMultas(allMultas);
        setSelectedCategory("multas");
      }
    }
  };

  return (
    <div className="bg-[#f8f9fa] rounded-[4px] p-6 md:p-10 border border-neutral-200/60 space-y-10 relative overflow-hidden text-[#0c0a09]">
      {/* Background Decorativo */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[var(--brand-accent)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-neutral-200/60 relative z-10">
        <div className="space-y-3">
          <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0 px-3 py-1 font-black text-[10px] uppercase tracking-[0.2em]">
            Serviços Automotivos
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none uppercase flex items-center gap-3">
            Débitos <span className="text-[var(--brand-accent)]">Veiculares</span>
            <Car className="h-10 w-10 text-[var(--brand-accent)] stroke-[2.5]" />
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-bold max-w-2xl">
            Consulte e pague multas, licenciamento anual e IPVA de maneira 100% integrada e parcelada.
          </p>
        </div>
      </header>

      {/* DETRAN SEARCH FORM */}
      {!searchCompleted && !showReceipt && (
        <Card className="p-8 max-w-2xl mx-auto rounded-sm border border-neutral-200 bg-white relative overflow-hidden group shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,119,17,0.03),transparent)]" />
          
          <form onSubmit={handleSearchSubmit} className="space-y-8 relative z-10 text-left">
            <div className="flex items-center gap-4 text-[var(--brand-accent)] pb-4 border-b border-neutral-100">
              <div className="w-14 h-14 bg-[var(--brand-accent)]/10 rounded-sm flex items-center justify-center shrink-0">
                <Search className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div className="space-y-0.5">
                <span className="font-black uppercase tracking-wider text-base block">Consulta DETRAN</span>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Insira as credenciais do automóvel</span>
              </div>
            </div>

            {/* Info SP plates only */}
            <div className="p-4 bg-orange-50/50 border border-orange-200/60 rounded-sm text-left flex items-start gap-3 animate-in fade-in duration-300">
              <Info className="h-5.5 w-5.5 text-[var(--brand-accent)] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="block text-xs font-black text-[var(--brand-accent)] uppercase tracking-wider">
                  Aviso Importante
                </span>
                <span className="block text-sm font-semibold text-neutral-600 leading-relaxed">
                  A consulta de débitos veiculares está disponível exclusivamente para veículos com placas do estado de <strong className="text-[var(--brand-accent)] font-black">São Paulo (SP)</strong>.
                </span>
              </div>
            </div>

            {/* Meus Veículos Cadastrados */}
            {myVehicles.length > 0 && (
              <div className="space-y-3 pt-2">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-500 block">
                  Meus Veículos Cadastrados
                </label>
                <div className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory">
                  {myVehicles.map((vehicle, idx) => {
                    const isSelected = placa === vehicle.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const cleanPl = vehicle.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                          setPlaca(cleanPl);
                          if (vehicle.renavam) {
                            setRenavam(vehicle.renavam.replace(/\D/g, ""));
                          } else {
                            setRenavam("");
                          }
                          toast.info(`Veículo ${vehicle.brand} ${vehicle.model} selecionado!`);
                        }}
                        className={`flex items-center gap-3 p-4 bg-white border rounded-sm hover:border-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/5 transition-all text-left group cursor-pointer w-[220px] shrink-0 snap-start ${
                          isSelected
                            ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]/5 ring-2 ring-[var(--brand-accent)]/10"
                            : "border-neutral-200"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]" : "bg-neutral-50 text-neutral-400 group-hover:bg-[var(--brand-accent)]/10 group-hover:text-[var(--brand-accent)]"
                        }`}>
                          <Car className="h-5 w-5 stroke-[2]" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <span className="block font-black text-xs uppercase text-neutral-800 leading-none truncate">
                            {vehicle.brand} {vehicle.model}
                          </span>
                          <span className="block font-mono text-[10px] text-neutral-400 font-bold uppercase leading-none">
                            {vehicle.placa}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {/* Quick Register Vehicle Button Card */}
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-3 p-4 bg-white border border-dashed border-neutral-355 rounded-sm hover:border-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/5 transition-all text-left group cursor-pointer w-[220px] shrink-0 snap-start"
                  >
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0 bg-neutral-50 text-neutral-400 group-hover:bg-[var(--brand-accent)]/10 group-hover:text-[var(--brand-accent)] transition-colors">
                      <Plus className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="block font-black text-xs uppercase text-neutral-800 group-hover:text-[var(--brand-accent)] transition-colors leading-none">
                        Cadastrar Novo
                      </span>
                      <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none">
                        Adicionar Veículo
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-500">Placa do Veículo</label>
                <Input
                  maxLength={7}
                  placeholder="ABC1D23"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
                  className="h-14 border-neutral-200 bg-white rounded-sm font-black uppercase text-base focus:ring-4 focus:ring-[var(--brand-accent)]/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-500">Código RENAVAM</label>
                <Input
                  maxLength={11}
                  placeholder="12345678901"
                  value={renavam}
                  onChange={(e) => setRenavam(e.target.value.replace(/\D/g, ""))}
                  className="h-14 border-neutral-200 bg-white rounded-sm font-bold text-base focus:ring-4 focus:ring-[var(--brand-accent)]/10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={searchLoading}
              className="w-full h-14 bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white rounded-sm font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all"
            >
              {searchLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Consultando Base do DETRAN...
                </>
              ) : (
                <>
                  Pesquisar Débitos <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* DASHBOARD RESULTS INTERFACE */}
      {searchCompleted && debtsData && !showReceipt && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* LEFT AREA: DEBTS DETAILED ACCORDION/TABS */}
          <div className="lg:col-span-8 space-y-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60">
              <div className="space-y-0.5">
                <h2 className="text-xl font-black uppercase tracking-tight">Débitos Encontrados</h2>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  Veículo Placa: <strong className="text-neutral-700 font-mono">{placa}</strong> • RENAVAM: <strong className="text-neutral-700 font-mono">{formatRenavam(renavam)}</strong>
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchCompleted(false); handleResetCart(); }}
                className="border border-neutral-200 bg-transparent hover:bg-neutral-100 text-[#0c0a09] font-black uppercase text-[9px] tracking-wider rounded-sm shrink-0"
              >
                Voltar à Busca
              </Button>
            </div>

            {/* VEHICLE TECH SPEC CARD (FICHA TÉCNICA) */}
            {debtsData.veiculo && (
              <Card className="p-6 border border-neutral-200 bg-white shadow-sm relative overflow-hidden rounded-sm border-l-4 border-l-[var(--brand-accent)] animate-in fade-in slide-in-from-top duration-500">
                <div className="flex items-center gap-2 text-[#0c0a09] pb-4 border-b border-neutral-100 mb-4">
                  <Car className="h-5 w-5 text-[var(--brand-accent)] stroke-[2.5]" />
                  <span className="font-black uppercase tracking-wider text-xs">Dados Cadastrais do Veículo</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 gap-y-3">
                  <div className="space-y-0.5">
                    <span className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">Placa</span>
                    <span className="block text-sm font-black font-mono text-neutral-800 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200 w-fit">{debtsData.veiculo.placa || placa}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">Marca / Modelo</span>
                    <span className="block text-sm font-black text-neutral-800 uppercase truncate" title={debtsData.veiculo.modelo}>{debtsData.veiculo.modelo || debtsData.veiculo.marca || "N/D"}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">Ano Fabricação</span>
                    <span className="block text-sm font-bold text-neutral-800">{debtsData.veiculo.anoFabricacao || "N/D"}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">Combustível</span>
                    <span className="block text-sm font-bold text-neutral-800 uppercase">{debtsData.veiculo.combustivel || "N/D"}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">RENAVAM</span>
                    <span className="block text-sm font-bold font-mono text-neutral-800">{formatRenavam(debtsData.veiculo.renavam || renavam)}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">Município</span>
                    <span className="block text-sm font-bold text-neutral-800 uppercase">{debtsData.veiculo.municipio_nome || "N/D"}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">Último Licenciamento</span>
                    <span className="block text-sm font-extrabold text-[var(--brand-accent)]">{debtsData.veiculo.ultimoLicenciamento || "N/D"}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">Categoria</span>
                    <span className="block text-sm font-bold text-neutral-800 uppercase">{debtsData.veiculo.categoria || "N/D"}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* TAB TRIGGERS BAR */}
            <div className="flex bg-white border border-neutral-200 rounded-sm p-1.5 gap-1.5 shadow-sm">
              {(["todos", "ipva", "licenciamento", "multas"] as TabType[]).map((tab) => {
                const isActive = activeTab === tab;
                const listLength = tab === "todos" 
                                 ? (debtsData.ipvas.length + debtsData.licenciamentos.length + debtsData.multas.length)
                                 : tab === "ipva" ? debtsData.ipvas.length 
                                 : tab === "licenciamento" ? debtsData.licenciamentos.length 
                                 : debtsData.multas.length;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 font-black uppercase text-sm tracking-wider rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-0 ${
                      isActive 
                        ? "bg-gradient-to-r from-[var(--brand-accent)] to-[#ff8822] text-white shadow-md shadow-[var(--brand-accent)]/30 animate-in fade-in duration-300"
                        : "hover:bg-[var(--brand-accent)]/5 text-neutral-400 hover:text-[var(--brand-accent)] bg-transparent"
                    }`}
                  >
                    {tab === "todos" ? "Todos" : tab === "ipva" ? "IPVA" : tab === "licenciamento" ? "Licenciamento" : "Multas"}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black tracking-normal transition-colors ${
                      isActive 
                        ? "bg-white text-[var(--brand-accent)]"
                        : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {listLength}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENTS */}
            <div className="space-y-4">
              
              {/* Category Lock Warning Banner */}
              {selectedCategory && selectedCategory !== "todos" && (
                <div className="p-3 bg-orange-50 border border-orange-200 text-[var(--brand-accent)] rounded-sm text-left flex items-start gap-2.5">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold leading-normal">
                    Carrinho ativo em <strong>{selectedCategory.toUpperCase()}</strong>. Se deseja pagar débitos de outra aba, desmarque as opções atuais ou limpe o carrinho.
                  </span>
                </div>
              )}

              {/* Select All Toggle / Control Card */}
              {debtsData && totalItemsInTab > 0 && (
                <Card 
                  onClick={handleToggleSelectAll}
                  className={`p-4 border rounded-sm flex items-center justify-between gap-4 transition-all text-left group ${
                    isTabLocked 
                      ? "opacity-50 cursor-not-allowed border-neutral-150 bg-neutral-50/50" 
                      : "cursor-pointer bg-white border-neutral-200 hover:border-[var(--brand-accent)]/60 hover:bg-[var(--brand-accent)]/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isTabLocked 
                        ? "border-neutral-200 bg-neutral-50"
                        : allSelectedInTab 
                          ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white" 
                          : "border-neutral-300 group-hover:border-[var(--brand-accent)]"
                    }`}>
                      {allSelectedInTab && <Check className="w-4 h-4" />}
                    </div>
                    
                    <div className="space-y-0.5">
                      <span className={`block text-xs font-black uppercase tracking-wider ${isTabLocked ? "text-neutral-300" : "text-neutral-750"}`}>
                        {allSelectedInTab ? "Desmarcar Todos" : "Selecionar Todos os Débitos"}
                      </span>
                      <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none">
                        Aplicar seleção em massa aos itens desta aba
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-500 border-neutral-200 px-2 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-wider">
                      {selectedItemsInTab} de {totalItemsInTab} Selecionados
                    </Badge>
                  </div>
                </Card>
              )}

              {/* TODOS TAB */}
              {activeTab === "todos" && (
                <div className="space-y-3.5">
                  {debtsData.ipvas.length === 0 && debtsData.licenciamentos.length === 0 && debtsData.multas.length === 0 ? (
                    <div className="py-12 bg-white rounded-sm border border-neutral-200 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
                      <p className="text-sm font-black text-neutral-500 uppercase tracking-widest">Nenhum débito pendente localizado!</p>
                    </div>
                  ) : (
                    <>
                      {/* IPVA Items */}
                      {debtsData.ipvas.map((ipva) => {
                        const isChecked = selectedIpvas.includes(ipva.ano.toString());
                        return (
                          <Card 
                            key={`todo-ipva-${ipva.ano}`}
                            onClick={() => handleToggleItem("ipva", ipva.ano.toString())}
                            className={`p-6 border rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all text-left border-l-4 ${
                              isChecked 
                                ? "bg-[var(--brand-accent)]/5 border-[var(--brand-accent)] border-l-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/10 shadow-sm shadow-[var(--brand-accent)]/5" 
                                : "bg-white border-neutral-200 border-l-amber-500 hover:border-[var(--brand-accent)]/60 hover:bg-[var(--brand-accent)]/5"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                                isChecked ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white" : "border-neutral-300"
                              }`}>
                                {isChecked && <Check className="w-4 h-4" />}
                              </div>
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="block font-black text-lg uppercase text-neutral-800 leading-snug">
                                    IPVA Anual {ipva.ano}
                                  </span>
                                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none font-black text-[10px] px-2 py-0.5 uppercase rounded-sm shrink-0">
                                    IPVA
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-400 font-bold uppercase tracking-wider">
                                  <span>Vencimento: {formatDate(ipva.vencimento)}</span>
                                  {ipva.valor_com_desconto && (
                                    <span className="text-emerald-600 font-black">C/ Desconto: R$ {ipva.valor_com_desconto.toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right font-mono shrink-0 sm:pl-4">
                              <span className="block text-xl font-black text-neutral-900">
                                R$ {ipva.valor.toFixed(2)}
                              </span>
                            </div>
                          </Card>
                        );
                      })}

                      {/* Licenciamento Items */}
                      {debtsData.licenciamentos.map((lic) => {
                        const isChecked = selectedLicenciamentos.includes(lic.ano.toString());
                        return (
                          <Card 
                            key={`todo-lic-${lic.ano}`}
                            onClick={() => handleToggleItem("licenciamento", lic.ano.toString())}
                            className={`p-6 border rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all text-left border-l-4 ${
                              isChecked 
                                ? "bg-[var(--brand-accent)]/5 border-[var(--brand-accent)] border-l-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/10 shadow-sm shadow-[var(--brand-accent)]/5" 
                                : "bg-white border-neutral-200 border-l-blue-500 hover:border-[var(--brand-accent)]/60 hover:bg-[var(--brand-accent)]/5"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                                isChecked ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white" : "border-neutral-300"
                              }`}>
                                {isChecked && <Check className="w-4 h-4" />}
                              </div>
                              
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="block font-black text-lg uppercase text-neutral-800 leading-snug">
                                    Taxa de Licenciamento {lic.ano}
                                  </span>
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-black text-[10px] px-2 py-0.5 uppercase rounded-sm shrink-0">
                                    Licenciamento
                                  </Badge>
                                </div>
                                <span className="block text-sm text-neutral-400 font-bold uppercase tracking-wider">
                                  Taxa obrigatória do DETRAN
                                </span>
                              </div>
                            </div>

                            <div className="text-right font-mono shrink-0 sm:pl-4">
                              <span className="block text-xl font-black text-neutral-900">
                                R$ {lic.valor.toFixed(2)}
                              </span>
                            </div>
                          </Card>
                        );
                      })}

                      {/* Multas Items */}
                      {debtsData.multas.map((m) => {
                        const isChecked = selectedMultas.includes(m.ait);
                        return (
                          <Card 
                            key={`todo-multa-${m.ait}`}
                            onClick={() => handleToggleItem("multas", m.ait)}
                            className={`p-6 border rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all cursor-pointer border-l-4 text-left ${
                              isChecked 
                                ? "bg-[var(--brand-accent)]/5 border-[var(--brand-accent)] border-l-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/10 shadow-sm shadow-[var(--brand-accent)]/5" 
                                : "bg-white border-neutral-200 border-l-rose-500 hover:border-[var(--brand-accent)]/60 hover:bg-[var(--brand-accent)]/5"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                                isChecked ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white" : "border-neutral-300"
                              }`}>
                                {isChecked && <Check className="w-4 h-4" />}
                              </div>
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="block font-black text-lg uppercase text-neutral-800 leading-snug">
                                    {m.infracao}
                                  </span>
                                  <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-none font-black text-[10px] px-2 py-0.5 uppercase rounded-sm shrink-0">
                                    Multa
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm text-neutral-400 font-bold uppercase tracking-wider">
                                  <span>Município: {m.municipio}</span>
                                  <span>Código AIT: {m.ait}</span>
                                  <span>Local: {m.local}</span>
                                  <span>Data: {formatDate(m.data_hora)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right font-mono shrink-0 sm:pl-4">
                              <span className="block text-xl font-black text-neutral-900">
                                R$ {m.valor.toFixed(2)}
                              </span>
                              <span className="block text-xs text-neutral-400 font-black uppercase tracking-wider">Venc: {getVencimento(m)}</span>
                            </div>
                          </Card>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

              {/* IPVA TAB */}
              {activeTab === "ipva" && (
                <div className="space-y-3">
                  {debtsData.ipvas.length > 0 ? (
                    debtsData.ipvas.map((ipva) => {
                      const isChecked = selectedIpvas.includes(ipva.ano.toString());
                      const isLocked = selectedCategory && selectedCategory !== "ipva";
                      
                      return (
                        <Card 
                          key={ipva.ano}
                          onClick={() => !isLocked && handleToggleItem("ipva", ipva.ano.toString())}
                          className={`p-6 border rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all text-left border-l-4 ${
                            isLocked 
                              ? "opacity-50 cursor-not-allowed border-neutral-100 bg-neutral-50/50" 
                              : isChecked 
                                ? "cursor-pointer bg-[var(--brand-accent)]/5 border-[var(--brand-accent)] border-l-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/10 shadow-sm shadow-[var(--brand-accent)]/5" 
                                : "cursor-pointer bg-white border-neutral-200 border-l-amber-500 hover:border-[var(--brand-accent)]/60 hover:bg-[var(--brand-accent)]/5"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                              isChecked ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white" : "border-neutral-300"
                            }`}>
                              {isChecked && <Check className="w-4 h-4" />}
                            </div>
                            
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="block font-black text-lg uppercase text-neutral-800 leading-snug">
                                  IPVA Anual {ipva.ano}
                                </span>
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none font-black text-[10px] px-2 py-0.5 uppercase rounded-sm shrink-0">
                                  IPVA
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-neutral-400 font-bold uppercase tracking-wider">
                                <span>Vencimento: {formatDate(ipva.vencimento)}</span>
                                {ipva.valor_com_desconto && (
                                  <span className="text-emerald-600 font-black">C/ Desconto: R$ {ipva.valor_com_desconto.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono shrink-0 sm:pl-4">
                            <span className="block text-xl font-black text-neutral-900">
                              R$ {ipva.valor.toFixed(2)}
                            </span>
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="py-12 bg-white rounded-sm border border-neutral-200 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
                      <p className="text-sm font-black text-neutral-500 uppercase tracking-widest">Nenhum IPVA pendente localizado!</p>
                    </div>
                  )}
                </div>
              )}

              {/* LICENCIAMENTO TAB */}
              {activeTab === "licenciamento" && (
                <div className="space-y-3">
                  {debtsData.licenciamentos.length > 0 ? (
                    debtsData.licenciamentos.map((lic) => {
                      const isChecked = selectedLicenciamentos.includes(lic.ano.toString());
                      const isLocked = selectedCategory && selectedCategory !== "licenciamento";
                      
                      return (
                        <Card 
                          key={lic.ano}
                          onClick={() => !isLocked && handleToggleItem("licenciamento", lic.ano.toString())}
                          className={`p-6 border rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all text-left border-l-4 ${
                            isLocked 
                              ? "opacity-50 cursor-not-allowed border-neutral-100 bg-neutral-50/50" 
                              : isChecked 
                                ? "cursor-pointer bg-[var(--brand-accent)]/5 border-[var(--brand-accent)] border-l-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/10 shadow-sm shadow-[var(--brand-accent)]/5" 
                                : "cursor-pointer bg-white border-neutral-200 border-l-blue-500 hover:border-[var(--brand-accent)]/60 hover:bg-[var(--brand-accent)]/5"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                              isChecked ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white" : "border-neutral-300"
                            }`}>
                              {isChecked && <Check className="w-4 h-4" />}
                            </div>
                            
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="block font-black text-lg uppercase text-neutral-800 leading-snug">
                                  Taxa de Licenciamento {lic.ano}
                                </span>
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-black text-[10px] px-2 py-0.5 uppercase rounded-sm shrink-0">
                                  Licenciamento
                                </Badge>
                              </div>
                              <span className="block text-sm text-neutral-400 font-bold uppercase tracking-wider">
                                Taxa obrigatória do DETRAN
                              </span>
                            </div>
                          </div>

                          <div className="text-right font-mono shrink-0 sm:pl-4">
                            <span className="block text-xl font-black text-neutral-900">
                              R$ {lic.valor.toFixed(2)}
                            </span>
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="py-12 bg-white rounded-sm border border-neutral-200 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
                      <p className="text-sm font-black text-neutral-500 uppercase tracking-widest">Licenciamento em dia!</p>
                    </div>
                  )}
                </div>
              )}

              {/* MULTAS TAB */}
              {activeTab === "multas" && (
                <div className="space-y-3">
                  {debtsData.multas.length > 0 ? (
                    debtsData.multas.map((m) => {
                      const isChecked = selectedMultas.includes(m.ait);
                      const isLocked = selectedCategory && selectedCategory !== "multas";
                      
                      return (
                        <Card 
                          key={m.ait}
                          onClick={() => !isLocked && handleToggleItem("multas", m.ait)}
                          className={`p-6 border rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all text-left border-l-4 ${
                            isLocked 
                              ? "opacity-50 cursor-not-allowed border-neutral-100 bg-neutral-50/50" 
                              : isChecked 
                                ? "cursor-pointer bg-[var(--brand-accent)]/5 border-[var(--brand-accent)] border-l-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/10 shadow-sm shadow-[var(--brand-accent)]/5" 
                                : "cursor-pointer bg-white border-neutral-200 border-l-rose-500 hover:border-[var(--brand-accent)]/60 hover:bg-[var(--brand-accent)]/5"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                              isChecked ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white" : "border-neutral-300"
                            }`}>
                              {isChecked && <Check className="w-4 h-4" />}
                            </div>
                            
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <span className="block font-black text-lg uppercase text-neutral-800 leading-snug">
                                {m.infracao}
                              </span>
                              <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm text-neutral-400 font-bold uppercase tracking-wider">
                                <span>Município: {m.municipio}</span>
                                <span>Código AIT: {m.ait}</span>
                                <span>Local: {m.local}</span>
                                <span>Data: {formatDate(m.data_hora)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono shrink-0 sm:pl-4">
                            <span className="block text-xl font-black text-neutral-900">
                              R$ {m.valor.toFixed(2)}
                            </span>
                            <span className="block text-xs text-neutral-400 font-black uppercase tracking-wider">Venc: {getVencimento(m)}</span>
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="py-12 bg-white rounded-sm border border-neutral-200 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
                      <p className="text-sm font-black text-neutral-500 uppercase tracking-widest">Nenhuma multa registrada!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT AREA: FLOATING CART CHECKOUT & SIMULATOR */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <Card className="p-6 bg-gradient-to-br from-white to-neutral-50 border border-neutral-200 rounded-sm shadow-xl sticky top-6 overflow-hidden">
              
              {/* Cart Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-100 text-[#0c0a09] relative">
                <div className="w-10 h-10 bg-[var(--brand-accent)]/10 rounded-sm flex items-center justify-center text-[var(--brand-accent)] shrink-0">
                  <ShoppingBag className="h-5.5 w-5.5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-wider leading-none">Resumo do Pagamento</h3>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mt-1">G8Pay Checkout Seguro</span>
                </div>
              </div>

              {/* Cart Items list */}
              <div className="py-6 space-y-4">
                {selectedCategory ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      <span>Categoria</span>
                      <Badge className={`border-transparent font-black px-2.5 py-1 rounded-sm text-[8px] uppercase border-0 ${
                        selectedCategory === "todos" ? "bg-purple-100 text-purple-800" 
                        : selectedCategory === "ipva" ? "bg-amber-100 text-amber-800"
                        : selectedCategory === "licenciamento" ? "bg-blue-100 text-blue-800"
                        : "bg-rose-100 text-rose-800"
                      }`}>
                        {selectedCategory === "todos" ? "TODOS OS DÉBITOS" : selectedCategory}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 bg-neutral-50 border border-neutral-200/40 p-3 rounded-sm">
                      <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        <span>Total de Itens</span>
                        <span className="font-extrabold text-neutral-800">
                          {selectedMultas.length + selectedIpvas.length + selectedLicenciamentos.length} item(s)
                        </span>
                      </div>
                      
                      {selectedCategory === "todos" && (
                        <div className="border-t border-neutral-200/40 pt-1.5 mt-1.5 space-y-1">
                          {selectedIpvas.length > 0 && (
                            <div className="flex justify-between items-center text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                              <span>IPVA</span>
                              <span className="font-black text-neutral-600">{selectedIpvas.length} selecionado(s)</span>
                            </div>
                          )}
                          {selectedLicenciamentos.length > 0 && (
                            <div className="flex justify-between items-center text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                              <span>Licenciamento</span>
                              <span className="font-black text-neutral-600">{selectedLicenciamentos.length} selecionado(s)</span>
                            </div>
                          )}
                          {selectedMultas.length > 0 && (
                            <div className="flex justify-between items-center text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                              <span>Multas</span>
                              <span className="font-black text-neutral-600">{selectedMultas.length} selecionada(s)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-[#0c0a09] text-white p-4 rounded-sm border border-neutral-800 space-y-1 relative overflow-hidden shadow-inner">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--brand-accent)]/10 rounded-full blur-xl pointer-events-none" />
                      <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none">Subtotal do Débito</span>
                      <div className="flex justify-between items-baseline relative z-10">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">Valor Principal</span>
                        {sumLoading ? (
                          <div className="h-6 w-24 bg-neutral-800 animate-pulse rounded-sm" />
                        ) : (
                          <span className="text-2xl font-black font-mono text-[var(--brand-accent)]">
                            {totalSumFormatted || "R$ 0,00"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* INSTALLMENT OPTIONS SIMULATION */}
                    {installmentsOptions.length > 0 && (
                      <div className="border-t border-neutral-100 pt-4 space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                          <Coins className="h-3.5 w-3.5 text-[var(--brand-accent)]" /> Opções de Parcelamento no Cartão
                        </label>
                        
                        <div className="relative">
                          <select
                            value={selectedInstallment ? selectedInstallment.parcelas : 1}
                            onChange={(e) => {
                              const found = installmentsOptions.find(o => o.parcelas === parseInt(e.target.value));
                              if (found) setSelectedInstallment(found);
                            }}
                            className="w-full h-12 px-3.5 pr-10 border border-neutral-200 rounded-sm font-black text-xs bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 focus:border-[var(--brand-accent)] appearance-none cursor-pointer"
                          >
                            {installmentsOptions.map((opt) => (
                              <option key={opt.parcelas} value={opt.parcelas}>
                                {opt.parcelas}x de {opt.valorParcelaFormatado} (Total: {opt.valorTotalFormatado})
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                            <CreditCard className="h-4 w-4" />
                          </div>
                        </div>

                        {selectedInstallment && selectedInstallment.valorJuros > 0 && (
                          <div className="bg-orange-50/60 border border-orange-100 rounded-sm p-3 flex justify-between items-center text-[10px] font-bold text-neutral-600 leading-normal uppercase">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-[var(--brand-accent)] rounded-full animate-pulse" />
                              <span>Tarifa do Parcelamento</span>
                            </div>
                            <span className="text-[var(--brand-accent)] font-black">+{selectedInstallment.valorTotalJurosFormatado}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <Info className="h-8 w-8 mx-auto text-neutral-200" />
                    <p className="text-xs font-bold text-neutral-400">
                      Nenhum débito selecionado. Marque os itens ao lado para iniciar.
                    </p>
                  </div>
                )}
              </div>

              {/* Checkout / Pay button */}
              <div className="border-t border-neutral-100 pt-4 space-y-4">
                <Button
                  onClick={handleProceedToCheckout}
                  disabled={!selectedCategory || checkoutLoading}
                  className="w-full h-14 bg-[var(--brand-accent)] hover:bg-[#0c0a09] hover:text-white text-white rounded-sm font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2.5 transition-all group active:scale-[0.98] cursor-pointer border-0"
                >
                  {checkoutLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      Preparando Gateway...
                    </>
                  ) : (
                    <>
                      Avançar para Pagamento <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-neutral-400">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[8px] font-black uppercase tracking-wider">Ambiente de Criptografia Segura SSL</span>
                </div>

                {selectedCategory && (
                  <button
                    onClick={handleResetCart}
                    className="w-full text-center text-[9px] font-black text-neutral-400 hover:text-red-500 transition-colors uppercase tracking-widest pt-1 cursor-pointer border-0 bg-transparent outline-none"
                  >
                    Limpar Seleções
                  </button>
                )}
              </div>
            </Card>

            {/* Informational Alerts for DPVAT & Divida Ativa */}
            {((debtsData.dpvats && debtsData.dpvats.length > 0) || (debtsData.dividaativa && debtsData.dividaativa.total > 0)) && (
              <Card className="p-5 bg-amber-50/60 border border-amber-200/80 rounded-sm space-y-3 shadow-md animate-in fade-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-2 text-amber-800 pb-2 border-b border-amber-200/40">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Alertas Importantes DETRAN</span>
                </div>
                
                <div className="space-y-3 text-[10px] font-bold text-neutral-600 leading-normal uppercase">
                  {debtsData.dpvats && debtsData.dpvats.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-amber-800 block font-black">Seguro Obrigatório DPVAT Pendente:</span>
                      {debtsData.dpvats.map((dpvat: string, idx: number) => (
                        <span key={idx} className="block text-neutral-500 font-mono text-[9px]">• {dpvat}</span>
                      ))}
                    </div>
                  )}

                  {debtsData.dividaativa && debtsData.dividaativa.total > 0 && (
                    <div className="space-y-1">
                      <span className="text-amber-800 block font-black">Débito em Dívida Ativa localizado:</span>
                      <span className="block text-neutral-500 font-mono text-[9px]">• Valor Inscrito: R$ {debtsData.dividaativa.total.toFixed(2)} ({debtsData.dividaativa.tipo})</span>
                      <span className="block text-red-600 text-[8px] font-black tracking-wider leading-snug pt-1">Atenção: Débitos em dívida ativa estadual devem ser liquidados diretamente na Procuradoria Geral do Estado (PGE).</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* SECURE PREMIUM CHECKOUT MODAL */}
      {showCheckoutModal && (() => {
        const displayCardNumber = cardNumber || "•••• •••• •••• ••••";
        const displayCardName = cardName.toUpperCase() || "NOME DO TITULAR";
        const displayExpiry = cardExpiry || "MM/AA";
        const getCardBrand = () => {
          const clean = cardNumber.replace(/\s/g, "");
          if (clean.startsWith("5")) return "Mastercard";
          if (clean.startsWith("4")) return "Visa";
          return "G8Pay";
        };
        return (
          <div className="fixed inset-0 bg-neutral-955/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300" style={{ backgroundColor: "rgba(10, 8, 7, 0.85)" }}>
            <Card className="w-full max-w-4xl bg-white border border-neutral-100 rounded-[10px] relative overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
              {/* Modal Header */}
              <div className="text-white p-5 flex justify-between items-center border-b border-neutral-800" style={{ backgroundColor: "#0c0a09" }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-[6px] bg-brand-accent/10 text-brand-accent border border-brand-accent/20 animate-pulse">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold uppercase tracking-widest text-sm block">{currentBrand.name} Checkout</span>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Gateway de Pagamento Criptografado &amp; Autenticado</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCheckoutModal(false)}
                  className="p-1.5 rounded-[10px] bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all border border-neutral-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Content - Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto max-h-[calc(100vh-120px)] lg:h-[580px]">
                {/* Left Column: Transaction Details & Interactive Card */}
                <div className="lg:col-span-5 bg-neutral-50 p-6 border-r border-neutral-100 flex flex-col justify-between space-y-6">
                  
                  {/* Transaction Summary */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block text-left">Resumo do Pagamento</span>
                    
                    <div className="bg-white p-4 rounded-[8px] border border-neutral-200/60 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase">Veículo Placa</span>
                        <span className="font-black text-xs text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-[6px] uppercase tracking-wider">{placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase">Categoria</span>
                        <span className="font-extrabold text-xs text-brand-accent uppercase">
                          {selectedCategory === "ipva" ? "IPVA" 
                           : selectedCategory === "licenciamento" ? "Licenciamento" 
                           : selectedCategory === "multas" ? "Multas de Trânsito" 
                           : "Todos os Débitos"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase">Parcelamento</span>
                        {selectedInstallment && (
                          <span className="font-black text-xs text-neutral-800">
                            {selectedInstallment.parcelas}x de {selectedInstallment.valorParcelaFormatado}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Card Preview container */}
                  <div className="flex flex-col items-center justify-center py-2 space-y-3">
                    {/* Flip Card Visual */}
                    <div className="relative w-full max-w-sm h-48 [perspective:1000px] cursor-pointer" onClick={() => setIsCardFlipped(!isCardFlipped)}>
                      <div 
                        className="relative w-full h-full"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {/* CARD FRONT */}
                        <div 
                          className="absolute inset-0 w-full h-full rounded-[10px] bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-6 text-white shadow-xl border border-neutral-850 overflow-hidden flex flex-col justify-between select-none"
                          style={{
                            backfaceVisibility: "hidden",
                            border: "1px solid rgba(255, 255, 255, 0.08)"
                          }}
                        >
                          {/* Radial Glowing Accents */}
                          <div className="absolute top-[-30%] right-[-20%] w-48 h-48 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute bottom-[-30%] left-[-20%] w-48 h-48 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />

                          {/* Top Row: Brand & Wireless Wave */}
                          <div className="flex justify-between items-center z-10">
                            <div className="flex items-center">
                              <img src={currentBrand.logoWhite} alt={currentBrand.name} className="h-5.5 object-contain" />
                            </div>
                            
                            {/* contactless pay symbol SVG */}
                            <svg className="w-5 h-5 opacity-60 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>

                          {/* EMV Contact Chip */}
                          <div className="w-10 h-7.5 rounded-[4px] bg-gradient-to-br from-amber-400 via-yellow-250 to-amber-500 border border-yellow-300 relative overflow-hidden flex flex-col justify-around p-1 z-10 shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                            <div className="border-t border-yellow-750/20 w-full h-[1px]"></div>
                            <div className="border-t border-yellow-750/20 w-full h-[1px]"></div>
                            <div className="border-t border-yellow-750/20 w-full h-[1px]"></div>
                          </div>

                          {/* Card Number */}
                          <div className="z-10 text-center">
                            <span className="font-mono text-base tracking-[0.18em] text-neutral-100 font-bold block drop-shadow-md select-all">
                              {displayCardNumber}
                            </span>
                          </div>

                          {/* Holder Details & Expiration */}
                          <div className="flex justify-between items-end z-10">
                            <div className="space-y-0.5 truncate max-w-[70%] text-left">
                              <span className="text-[7px] text-neutral-400 font-bold uppercase tracking-wider block">Titular do Cartão</span>
                              <span className="font-bold text-[10px] tracking-wide block uppercase truncate text-neutral-100">
                                {displayCardName}
                              </span>
                            </div>

                            <div className="flex gap-4 flex-shrink-0">
                              <div className="space-y-0.5 text-right">
                                <span className="text-[7px] text-neutral-400 font-bold uppercase tracking-wider block">Validade</span>
                                <span className="font-mono font-bold text-[10px] tracking-widest block text-neutral-100">
                                  {displayExpiry}
                                </span>
                              </div>

                              <div className="w-9 h-6 flex items-center justify-end">
                                {/* Dynamic Method Brand Icon */}
                                {getCardBrand() === "Visa" && (
                                  <span className="text-white font-extrabold italic text-sm tracking-wider">VISA</span>
                                )}
                                {getCardBrand() === "Mastercard" && (
                                  <div className="flex -space-x-1.5">
                                    <div className="w-4 h-4 rounded-full bg-red-500/90" />
                                    <div className="w-4 h-4 rounded-full bg-amber-500/90" />
                                  </div>
                                )}
                                {getCardBrand() === "G8Pay" && (
                                  <span className="text-brand-secondary font-black italic text-xs tracking-tighter">{currentBrand.shortName}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CARD BACK */}
                        <div 
                          className="absolute inset-0 w-full h-full rounded-[10px] bg-gradient-to-br from-neutral-900 to-neutral-950 py-5 text-white shadow-xl border border-neutral-800 overflow-hidden flex flex-col justify-between select-none"
                          style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                          }}
                        >
                          {/* Magnetic Strip */}
                          <div className="w-full h-9.5 bg-neutral-800/90" />

                          {/* Signature Stripe & CVV */}
                          <div className="px-5 space-y-1">
                            <span className="text-[6px] text-neutral-400 font-bold uppercase tracking-widest block text-left">Assinatura do Portador / Cód. Segurança</span>
                            <div className="flex items-center">
                              <div className="h-8 bg-neutral-100 w-9/12 rounded-l-[4px] bg-[repeating-linear-gradient(45deg,#d4d4d8,#d4d4d8_10px,#e4e4e7_10px,#e4e4e7_20px)]" />
                              <div className="h-8 bg-white text-neutral-900 w-3/12 rounded-r-[4px] font-black font-mono italic text-xs flex items-center justify-center shadow-inner tracking-widest">
                                {cardCvv || "•••"}
                              </div>
                            </div>
                          </div>

                          {/* Info text & legal notes */}
                          <div className="space-y-1 text-center">
                            <span className="text-[6px] text-neutral-500 tracking-wider block max-w-xs mx-auto">
                              Este cartão é propriedade do {currentBrand.bankName}. O uso deste cartão está sujeito aos termos do Contrato de Abertura de Conta e Serviços de Cartão.
                            </span>
                            <span className="text-[7px] text-brand-accent font-black tracking-widest block">
                              SAC 24H: {currentBrand.supportPhone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <RotateCw className="h-3 w-3 animate-pulse" /> Clique no cartão para girar
                    </span>
                  </div>

                  {/* Total sum indicator */}
                  <div className="bg-neutral-900 text-white p-4.5 rounded-[8px] border border-neutral-800/40 shadow-lg space-y-1 w-full text-left">
                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block">Total a ser debitado</span>
                    {selectedInstallment && (
                      <span className="text-lg font-black text-brand-accent font-mono tracking-tight block">
                        {selectedInstallment.valorTotalFormatado}
                      </span>
                    )}
                  </div>

                </div>

                {/* Right Column: Tabbed inputs form */}
                <div className="lg:col-span-7 p-6 flex flex-col justify-between">
                  
                  <div className="space-y-6">
                    {/* Custom Tab Headers */}
                    <div className="flex border-b border-neutral-100 pb-1">
                      <button 
                        onClick={() => setCardTab("novo-cartao")}
                        className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${cardTab === "novo-cartao" ? "border-brand-accent text-brand-accent" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}
                        type="button"
                      >
                        Pagar com Novo Cartão
                      </button>
                      <button 
                        onClick={() => setCardTab("meus-cartoes")}
                        className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${cardTab === "meus-cartoes" ? "border-brand-accent text-brand-accent" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}
                        type="button"
                      >
                        Meus Cartões Salvos
                      </button>
                    </div>

                    {cardTab === "meus-cartoes" ? (
                      /* EMPTY STATE PLACEHOLDER */
                      <div className="flex flex-col items-center justify-center py-14 px-6 text-center space-y-4 animate-in fade-in duration-300">
                        <div className="p-4 rounded-full bg-neutral-50 text-neutral-300 border border-dashed border-neutral-200">
                          <CreditCard className="h-10 w-10 stroke-[1.25]" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                          <span className="font-extrabold text-neutral-700 text-sm block">Nenhum cartão de crédito salvo</span>
                          <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wide leading-relaxed block">
                            Você ainda não possui cartões de crédito salvos vinculados à sua conta {currentBrand.name}. Preencha os dados do novo cartão na aba ao lado para realizar o pagamento.
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* FORM INPUTS FOR NEW CARD */
                      <form onSubmit={handleConfirmCustomPayment} className="space-y-4 animate-in fade-in duration-300 text-left">
                        
                        {/* Card Number Input */}
                        <div className="space-y-1.5">
                          <label htmlFor="cardNumber" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Número do Cartão</label>
                          <div className="relative">
                            <Input 
                              id="cardNumber"
                              type="text"
                              inputMode="numeric"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              placeholder="0000 0000 0000 0000"
                              className="pr-10 border-neutral-200/80 rounded-[8px] h-11 text-xs font-bold tracking-widest"
                              required
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-300">
                              <CreditCard className="h-4.5 w-4.5" />
                            </div>
                          </div>
                        </div>

                        {/* Card Holder Name Input */}
                        <div className="space-y-1.5">
                          <label htmlFor="cardName" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Nome Impresso no Cartão</label>
                          <Input 
                            id="cardName"
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="NOME COMPLETO DO TITULAR"
                            className="border-neutral-200/80 rounded-[8px] h-11 text-xs font-bold uppercase"
                            required
                          />
                        </div>

                        {/* Two Column Expiration & CVV */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label htmlFor="cardExpiry" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Validade</label>
                            <Input 
                              id="cardExpiry"
                              type="text"
                              inputMode="numeric"
                              value={cardExpiry}
                              onChange={handleCardExpiryChange}
                              placeholder="Mês/Ano (MM/AA)"
                              className="border-neutral-200/80 rounded-[8px] h-11 text-xs font-bold text-center"
                              maxLength={5}
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor="cardCvv" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Código CVV</label>
                            <Input 
                              id="cardCvv"
                              type="text"
                              inputMode="numeric"
                              value={cardCvv}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                setCardCvv(val.substring(0, 4));
                              }}
                              onFocus={() => setIsCardFlipped(true)}
                              onBlur={() => setIsCardFlipped(false)}
                              placeholder="123"
                              className="border-neutral-200/80 rounded-[8px] h-11 text-xs font-bold text-center"
                              maxLength={4}
                              required
                            />
                          </div>
                        </div>

                        {/* Holder CPF Input */}
                        <div className="space-y-1.5">
                          <label htmlFor="cardCpf" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">CPF do Titular</label>
                          <Input 
                            id="cardCpf"
                            type="text"
                            inputMode="numeric"
                            value={cardCpf}
                            onChange={handleCardCpfChange}
                            placeholder="000.000.000-00"
                            className="border-neutral-200/80 rounded-[8px] h-11 text-xs font-bold tracking-widest"
                            required
                          />
                        </div>

                        {/* Save Card Checkbox */}
                        <div className="flex items-center gap-2 pt-1">
                          <input 
                            type="checkbox" 
                            id="saveCardCheckbox" 
                            checked={saveCard}
                            onChange={(e) => setSaveCard(e.target.checked)}
                            className="h-4 w-4 rounded-[3px] border-neutral-300 text-brand-accent focus:ring-brand-accent cursor-pointer"
                          />
                          <label htmlFor="saveCardCheckbox" className="text-[9px] font-extrabold uppercase text-neutral-500 tracking-wide select-none cursor-pointer text-left">
                            Salvar este cartão de crédito de forma segura para compras futuras
                          </label>
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                          <Button 
                            type="submit"
                            disabled={checkoutLoading || paymentLoading}
                            className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-extrabold text-xs uppercase tracking-widest h-12 rounded-[8px] transition-all shadow-md flex items-center justify-center gap-2 animate-pulse"
                          >
                            {checkoutLoading ? (
                              <>
                                <RotateCw className="h-4 w-4 animate-spin" /> Processando Criptografia...
                              </>
                            ) : (
                              <>
                                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Confirmar e Pagar Débito
                              </>
                            )}
                          </Button>
                        </div>

                      </form>
                    )}
                  </div>

                  {/* Secure Badge footer */}
                  <div className="border-t border-neutral-100 pt-4 mt-6 flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-neutral-400 leading-normal">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Criptografia de Dados SSL / Padrão de Segurança PCI-DSS</span>
                    </div>
                    <span>{currentBrand.shortName.toUpperCase()} Shield ATIVO</span>
                  </div>

                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* FINAL DIGITAL RECEIPT PAGE */}
      {showReceipt && receiptData && (
        <div className="max-w-xl mx-auto space-y-8 animate-in zoom-in duration-300 relative z-10">
          <Card className="border border-neutral-200 bg-white shadow-2xl relative overflow-hidden rounded-xl text-[#0c0a09]">
            {/* Top decorative receipt cut stripes */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-accent to-brand-secondary" />
            
            <div className="p-8 space-y-8">
              
              {/* Receipt Header */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
                  <Check className="h-9 w-9 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[8px] font-black tracking-[0.2em] px-2 py-0.5 rounded-sm uppercase">
                    Comprovante de Pagamento
                  </Badge>
                  <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Débito Liquidado!</h2>
                </div>
              </div>

              {/* Receipt Info Table */}
              <div className="border-t border-b border-neutral-100 py-6 space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider">
                  <div className="space-y-1">
                    <span className="text-[9px] text-neutral-400 block font-black">Placa do Veículo</span>
                    <span className="text-sm font-extrabold text-neutral-800 font-mono">{receiptData.placa}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-neutral-400 block font-black">Tipo de Débito</span>
                    <span className="text-sm font-extrabold text-[var(--brand-accent)]">{receiptData.category}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-neutral-400 block font-black">Código de Autenticação</span>
                    <span className="text-sm font-mono font-bold text-neutral-800">{receiptData.authCode}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-neutral-400 block font-black">Data da Transação</span>
                    <span className="text-sm font-bold text-neutral-800">{receiptData.date}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-neutral-400 block font-black">Valor Pago (c/ juros)</span>
                    <span className="text-sm font-extrabold text-neutral-800 font-mono">{receiptData.amountPaid}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-neutral-400 block font-black">Parcelas</span>
                    <span className="text-sm font-bold text-neutral-800">{receiptData.installments}x</span>
                  </div>
                </div>

                {/* Items Paid List */}
                <div className="border-t border-neutral-100 pt-4 space-y-2">
                  <span className="text-[9px] text-neutral-400 font-black uppercase tracking-widest block">Ítens Liquidados</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {receiptData.details.map((item: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="bg-neutral-50 text-neutral-700 border-neutral-200 px-2 py-0.5 rounded-sm font-mono text-[9px]">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="flex gap-4">
                <Button
                  onClick={() => { setShowReceipt(false); setPlaca(""); setRenavam(""); }}
                  className="flex-1 h-12 bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white rounded-sm font-black uppercase tracking-widest text-[9px] shadow-lg transition-all"
                >
                  Consultar Outro Veículo
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="border-neutral-200 hover:bg-neutral-50 hover:text-black font-black uppercase text-[9px] tracking-wider rounded-sm flex items-center gap-2 justify-center"
                >
                  <Printer className="h-4 h-4 shrink-0" /> Imprimir
                </Button>
              </div>

            </div>
          </Card>
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

      {/* Global Processing payment spinner overlay */}
      {paymentLoading && (
        <div className="fixed inset-0 bg-neutral-900/60 z-50 flex flex-col items-center justify-center space-y-4 backdrop-blur-sm">
          <RotateCw className="w-16 h-16 text-[var(--brand-accent)] animate-spin" />
          <span className="text-sm font-black uppercase tracking-widest text-white animate-pulse">
            Efetivando liquidação com o DETRAN... Não feche esta tela!
          </span>
        </div>
      )}
    </div>
  );
}
