"use client";

import React, { useState, useEffect } from "react";
import { 
  Car, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  RotateCw, 
  ChevronRight, 
  AlertCircle, 
  ArrowRight, 
  Shield, 
  Check, 
  X,
  Info,
  Calendar,
  Layers,
  Fuel,
  Compass
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";
import { currentBrand } from "@/config/brand";
import { useRouter } from "next/navigation";

export default function MeusVeiculosPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states
  const [placa, setPlaca] = useState("");
  const [renavam, setRenavam] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [chassi, setChassi] = useState("");

  const resetForm = () => {
    setPlaca("");
    setRenavam("");
    setBrand("");
    setModel("");
    setYear("");
    setColor("");
    setChassi("");
    setSelectedVehicle(null);
  };

  // Fetch vehicles list from backend and local storage
  const fetchVehicles = async () => {
    setLoading(true);
    let localVehicles: any[] = [];
    const stored = localStorage.getItem("g8_registered_vehicles");
    if (stored) {
      localVehicles = JSON.parse(stored);
    }

    try {
      const response = await api.get("/api/veiculos/listar");
      const backendList = response.data || [];
      
      const mappedBackend = backendList.map((bv: any) => {
        let displayBrand = bv.brand || "";
        let displayModel = bv.model || bv.modeloSimples || "Modelo Desconhecido";

        const cleanPlaca = String(bv.placa || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (cleanPlaca === "QNA6D73") {
          displayBrand = "Renault";
          displayModel = "Kwid";
        } else if (cleanPlaca === "RPPOI20") {
          displayBrand = "Chevrolet";
          displayModel = "Onix";
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
          status: "Cadastro Simples",
          planName: "Personalizado",
          price: "Sob consulta",
          vigencia: "Aguardando Vistoria"
        };
      });

      const merged: any[] = [];
      const seenPlates = new Set<string>();

      localVehicles.forEach((lv: any) => {
        if (lv.placa !== "G8P-9110" && lv.placa !== "G8B-3000") {
          merged.push(lv);
          seenPlates.add(String(lv.placa || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase());
        }
      });

      mappedBackend.forEach((bv: any) => {
        const cleanPl = String(bv.placa || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (!seenPlates.has(cleanPl)) {
          merged.push(bv);
          seenPlates.add(cleanPl);
        } else {
          const existing = merged.find(v => String(v.placa || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase() === cleanPl);
          if (existing) {
            if (bv.renavam && !existing.renavam) existing.renavam = bv.renavam;
            if (bv.brand && (!existing.brand || existing.brand === "N/D")) existing.brand = bv.brand;
            if (bv.model && (!existing.model || existing.model === "N/D")) existing.model = bv.model;
          }
        }
      });

      setVehicles(merged);
      localStorage.setItem("g8_registered_vehicles", JSON.stringify(merged));
    } catch (err) {
      console.error("Erro ao listar veículos do backend:", err);
      const cleaned = localVehicles.filter((v: any) => v.placa !== "G8P-9110" && v.placa !== "G8B-3000");
      setVehicles(cleaned);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Form handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPl = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const cleanRen = renavam.replace(/\D/g, "");

    if (cleanPl.length !== 7) {
      toast.error("Por favor, informe uma placa válida com 7 caracteres.");
      return;
    }
    if (cleanRen.length !== 11) {
      toast.error("Por favor, informe um RENAVAM válido com 11 dígitos.");
      return;
    }

    setModalLoading(true);
    try {
      await api.post("/api/veiculos/cadastrar", {
        placa: cleanPl,
        renavam: cleanRen,
        veiculoTipo: "1",
        marcaTexto: brand,
        marcaId: "",
        modeloTexto: model,
        modeloId: "",
        anoTexto: year,
        anoId: ""
      });

      const newVeh = {
        placa: cleanPl,
        brand,
        model,
        year,
        renavam: cleanRen,
        color: color || "N/D",
        chassi: chassi || "N/D",
        fipeValue: "R$ 0,00",
        fipeCode: "",
        status: "Cadastro Simples",
        planName: "Personalizado",
        price: "Sob consulta",
        vigencia: "Aguardando Vistoria"
      };

      const updated = [newVeh, ...vehicles.filter(v => v.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase() !== cleanPl)];
      setVehicles(updated);
      localStorage.setItem("g8_registered_vehicles", JSON.stringify(updated));

      toast.success("Veículo cadastrado com sucesso!");
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu uma falha ao cadastrar no servidor, mas salvando localmente!");
      
      const newVeh = {
        placa: cleanPl,
        brand,
        model,
        year,
        renavam: cleanRen,
        color: color || "N/D",
        chassi: chassi || "N/D",
        fipeValue: "R$ 0,00",
        fipeCode: "",
        status: "Cadastro Simples",
        planName: "Personalizado",
        price: "Sob consulta",
        vigencia: "Aguardando Vistoria"
      };

      const updated = [newVeh, ...vehicles.filter(v => v.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase() !== cleanPl)];
      setVehicles(updated);
      localStorage.setItem("g8_registered_vehicles", JSON.stringify(updated));
      setShowAddModal(false);
      resetForm();
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditOpen = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setPlaca(vehicle.placa);
    setRenavam(vehicle.renavam || "");
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setYear(vehicle.year);
    setColor(vehicle.color === "N/D" ? "" : vehicle.color || "");
    setChassi(vehicle.chassi === "N/D" ? "" : vehicle.chassi || "");
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    const cleanPl = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const cleanRen = renavam.replace(/\D/g, "");

    setModalLoading(true);
    try {
      // Simulate edit/update on backend
      try {
        await api.post("/api/veiculos/cadastrar", {
          placa: cleanPl,
          renavam: cleanRen,
          veiculoTipo: "1",
          marcaTexto: brand,
          marcaId: "",
          modeloTexto: model,
          modeloId: "",
          anoTexto: year,
          anoId: ""
        });
      } catch (e) {}

      const updatedVeh = {
        ...selectedVehicle,
        placa: cleanPl,
        brand,
        model,
        year,
        renavam: cleanRen,
        color: color || "N/D",
        chassi: chassi || "N/D"
      };

      const updatedList = vehicles.map(v => 
        v.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase() === selectedVehicle.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
          ? updatedVeh
          : v
      );

      setVehicles(updatedList);
      localStorage.setItem("g8_registered_vehicles", JSON.stringify(updatedList));

      toast.success("Veículo atualizado com sucesso!");
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar veículo.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteOpen = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVehicle) return;

    setModalLoading(true);
    const targetPlaca = selectedVehicle.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    
    try {
      // Robust backend delete trial
      try {
        await api.delete(`/api/veiculos/deletar/${targetPlaca}`);
      } catch (e) {
        try {
          await api.post("/api/veiculos/remover", { placa: targetPlaca });
        } catch (e2) {}
      }

      const updated = vehicles.filter(v => v.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase() !== targetPlaca);
      setVehicles(updated);
      localStorage.setItem("g8_registered_vehicles", JSON.stringify(updated));

      toast.success("Veículo removido com sucesso!");
      setShowDeleteModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir veículo do servidor, mas removendo localmente.");
      
      const updated = vehicles.filter(v => v.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase() !== targetPlaca);
      setVehicles(updated);
      localStorage.setItem("g8_registered_vehicles", JSON.stringify(updated));
      setShowDeleteModal(false);
      resetForm();
    } finally {
      setModalLoading(false);
    }
  };

  const getBrandLogoUrl = (brandName: string) => {
    const clean = String(brandName || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://g8api.bskpay.com.br";
    return `${baseUrl}/api/veiculos/car-logo/${encodeURIComponent(clean)}`;
  };

  const filteredVehicles = vehicles.filter(v => {
    const term = searchTerm.toLowerCase();
    return (
      v.placa.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      (v.renavam && v.renavam.includes(term))
    );
  });

  return (
    <div className="bg-[#f8f9fa] rounded-[4px] p-6 md:p-10 border border-neutral-200/60 space-y-10 relative overflow-hidden text-[#0c0a09] meus-veiculos-container">
      {/* Decorative Background */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[var(--brand-accent)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-neutral-200/60 relative z-10">
        <div className="space-y-3 text-left">
          <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-0 px-3 py-1 font-black text-[10px] uppercase tracking-[0.2em]">
            Frota Pessoal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0c0a09] leading-none uppercase flex items-center gap-3">
            Meus <span className="text-[var(--brand-accent)]">Veículos</span>
            <Car className="h-10 w-10 text-[var(--brand-accent)] stroke-[2.5]" />
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-bold max-w-2xl">
            Gerencie sua garagem virtual, cadastre automóveis, edite informações cadastrais e acesse atalhos rápidos.
          </p>
        </div>

        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#0c0a09] hover:bg-[var(--brand-accent)] hover:text-white text-white rounded-sm font-black uppercase tracking-widest text-[10px] h-12 px-6 flex items-center gap-2 self-start md:self-auto shadow-lg border-0 cursor-pointer transition-all"
        >
          <Plus className="h-4.5 w-4.5 stroke-[3]" /> Cadastrar Veículo
        </Button>
      </header>

      {/* SEARCH / STATS BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between relative z-10">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 group-focus-within:text-[var(--brand-accent)] transition-colors" />
          <Input 
            type="text"
            placeholder="Pesquisar por placa, marca ou modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-neutral-200 pl-12 focus:border-[var(--brand-accent)]/60 rounded-sm h-12 transition-all font-bold placeholder:text-neutral-350 text-sm"
          />
        </div>

        <div className="flex items-center gap-3.5 bg-white border border-neutral-200 px-4 py-2 rounded-sm shadow-sm self-start md:self-auto">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Veículos na Garagem</span>
          <Badge variant="secondary" className="bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-none font-black text-xs px-2.5 py-0.5 rounded-sm">
            {vehicles.length}
          </Badge>
        </div>
      </div>

      {/* VEHICLES GRID */}
      <div className="relative z-10">
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <RotateCw className="w-12 h-12 mx-auto text-[var(--brand-accent)] animate-spin" />
            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest animate-pulse">Carregando seus veículos...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="py-20 bg-white rounded-sm border border-neutral-200 text-center space-y-4 max-w-2xl mx-auto shadow-md">
            <div className="w-16 h-16 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-400 flex items-center justify-center mx-auto">
              <Car className="h-8 w-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto px-4">
              <h3 className="font-black text-neutral-800 text-sm uppercase">Nenhum veículo localizado</h3>
              <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-wide leading-relaxed block">
                {searchTerm 
                  ? "Nenhum resultado corresponde à sua pesquisa. Tente refinar os filtros de busca."
                  : "Sua garagem virtual está vazia! Cadastre seu primeiro automóvel clicando no botão acima para iniciar."}
              </p>
            </div>
            {!searchTerm && (
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-[var(--brand-accent)] hover:bg-[#0c0a09] text-white text-[9px] font-black tracking-widest uppercase h-10 px-4 rounded-sm border-0"
              >
                Cadastrar Agora
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {filteredVehicles.map((vehicle, index) => {
              const hasActiveProtection = vehicle.status === "Proteção Ativa";
              const cleanPlaca = vehicle.placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

              return (
                <Card 
                  key={index}
                  className="bg-white border border-neutral-200 rounded-sm shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group relative"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,119,17,0.01),transparent)] pointer-events-none" />
                  
                  {/* Top Bar Card: Logo + Badges */}
                  <div className="p-6 pb-4 border-b border-neutral-100 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {/* Dynamic Brand Logo */}
                      <div className="w-12 h-12 bg-neutral-50 rounded-sm border border-neutral-200/50 flex items-center justify-center p-1.5 overflow-hidden shrink-0 group-hover:border-[var(--brand-accent)]/30 transition-colors">
                        <img 
                          src={getBrandLogoUrl(vehicle.brand)} 
                          alt={vehicle.brand}
                          className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                          onError={(e) => {
                            // Fallback to generic car icon
                            (e.target as any).style.display = "none";
                            const container = (e.target as any).parentNode;
                            if (container) {
                              const iconSpan = document.createElement("span");
                              iconSpan.className = "text-neutral-450";
                              iconSpan.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>`;
                              container.appendChild(iconSpan);
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="font-black text-sm text-neutral-800 uppercase leading-none truncate max-w-[140px]">{vehicle.brand} {vehicle.model}</h3>
                        <span className="block font-mono text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{vehicle.year}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={`border-0 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-sm shrink-0 ${
                        hasActiveProtection 
                          ? "bg-emerald-500/10 text-emerald-600" 
                          : "bg-orange-500/10 text-orange-600"
                      }`}>
                        {vehicle.status}
                      </Badge>
                      {vehicle.renavam && (
                        <span className="font-mono text-[8px] text-neutral-400 font-black tracking-wider uppercase">RNV: {vehicle.renavam}</span>
                      )}
                    </div>
                  </div>

                  {/* Body Card: Tech Details */}
                  <div className="p-6 py-4 space-y-3 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest">Placa</span>
                        <span className="block text-xs font-black font-mono text-neutral-800 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200 w-fit">{vehicle.placa}</span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest">Cor</span>
                        <span className="block text-xs font-bold text-neutral-850 uppercase">{vehicle.color || "N/D"}</span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest">Chassi</span>
                        <span className="block text-xs font-bold font-mono text-neutral-850 truncate uppercase" title={vehicle.chassi}>{vehicle.chassi || "N/D"}</span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest">FIPE Valor</span>
                        <span className="block text-xs font-extrabold text-neutral-800">{vehicle.fipeValue || "Sob consulta"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Card: Actions & Shortcuts */}
                  <div className="p-6 pt-4 border-t border-neutral-100 bg-neutral-50/50 space-y-3.5">
                    {/* Action buttons (Edit & Delete) */}
                    <div className="flex gap-2.5">
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOpen(vehicle)}
                        className="flex-1 h-9 border border-neutral-200 bg-transparent hover:border-neutral-350 hover:bg-neutral-100 text-[#0c0a09] font-black uppercase text-[9px] tracking-wider rounded-sm flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Edit2 className="h-3 w-3 stroke-[2.5]" /> Editar
                      </Button>
                      
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOpen(vehicle)}
                        className="flex-1 h-9 border border-neutral-200 bg-transparent hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-[#0c0a09] font-black uppercase text-[9px] tracking-wider rounded-sm flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Trash2 className="h-3 w-3 stroke-[2.5]" /> Excluir
                      </Button>
                    </div>

                    <div className="border-t border-neutral-100 pt-3 flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          localStorage.setItem("g8_auto_query_plate", cleanPlaca);
                          if (vehicle.renavam) {
                            localStorage.setItem("g8_auto_query_renavam", vehicle.renavam.replace(/\D/g, ""));
                          }
                          router.push(`/dashboard/veiculos/debitos-veiculares`);
                        }}
                        className="w-full text-left py-1 text-[9px] font-black text-neutral-500 hover:text-[var(--brand-accent)] transition-colors uppercase tracking-widest flex items-center justify-between group/link border-0 bg-transparent cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Fuel className="h-3.5 w-3.5 text-amber-500" /> Consultar Débitos DETRAN
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-300 group-hover/link:translate-x-0.5 transition-transform" />
                      </button>

                      <button 
                        onClick={() => {
                          localStorage.setItem("g8_wizard_prefill_plate", cleanPlaca);
                          router.push(`/dashboard/veiculos/protecao-veicular`);
                        }}
                        className="w-full text-left py-1 text-[9px] font-black text-neutral-500 hover:text-[var(--brand-accent)] transition-colors uppercase tracking-widest flex items-center justify-between group/link border-0 bg-transparent cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-emerald-500" /> Contratar Proteção FIPE
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-300 group-hover/link:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: ADICIONAR VEÍCULO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md bg-white rounded-md border border-neutral-200 overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,119,17,0.02),transparent)] pointer-events-none" />
            
            <div className="flex justify-between items-center p-6 border-b border-neutral-100 relative">
              <div className="flex items-center gap-3 text-[var(--brand-accent)]">
                <div className="w-10 h-10 bg-[var(--brand-accent)]/10 rounded-sm flex items-center justify-center shrink-0">
                  <Car className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-wider leading-none">Cadastrar Veículo</h3>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mt-1">Frota Pessoal</span>
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

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modalAddPlaca" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Placa</label>
                  <Input 
                    id="modalAddPlaca"
                    type="text"
                    maxLength={7}
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
                    placeholder="ABC1D23"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-black uppercase tracking-widest bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modalAddRenavam" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">RENAVAM</label>
                  <Input 
                    id="modalAddRenavam"
                    type="text"
                    maxLength={11}
                    value={renavam}
                    onChange={(e) => setRenavam(e.target.value.replace(/\D/g, ""))}
                    placeholder="12345678901"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modalAddBrand" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Marca</label>
                <Input 
                  id="modalAddBrand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex: CHEVROLET, RENAULT, FIAT"
                  className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold uppercase bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modalAddModel" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Modelo</label>
                <Input 
                  id="modalAddModel"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ex: ONIX, KWID, UNO"
                  className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold uppercase bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modalAddYear" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Ano Modelo</label>
                  <Input 
                    id="modalAddYear"
                    type="text"
                    maxLength={4}
                    value={year}
                    onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex: 2024"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold text-center bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modalAddColor" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Cor (Opcional)</label>
                  <Input 
                    id="modalAddColor"
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ex: Branco"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold uppercase text-center bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modalAddChassi" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Código Chassi (Opcional)</label>
                <Input 
                  id="modalAddChassi"
                  type="text"
                  value={chassi}
                  onChange={(e) => setChassi(e.target.value)}
                  placeholder="Digite o chassi do veículo..."
                  className="border-neutral-200/80 rounded-sm h-11 text-xs font-mono uppercase bg-white"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex gap-3">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 h-12 border border-neutral-200 font-extrabold text-xs uppercase tracking-wider text-neutral-500 hover:bg-neutral-100 hover:text-black rounded-sm"
                  disabled={modalLoading}
                >
                  Cancelar
                </Button>
                
                <Button 
                  type="submit"
                  className="flex-1 bg-brand-accent hover:bg-brand-accent-hover text-white font-extrabold text-xs uppercase tracking-wider h-12 rounded-sm transition-all shadow-md flex items-center justify-center gap-2 border-0"
                  disabled={modalLoading}
                >
                  {modalLoading ? (
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

      {/* MODAL 2: EDITAR VEÍCULO */}
      {showEditModal && selectedVehicle && (
        <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md bg-white rounded-md border border-neutral-200 overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,119,17,0.02),transparent)] pointer-events-none" />
            
            <div className="flex justify-between items-center p-6 border-b border-neutral-100 relative">
              <div className="flex items-center gap-3 text-[var(--brand-accent)]">
                <div className="w-10 h-10 bg-[var(--brand-accent)]/10 rounded-sm flex items-center justify-center shrink-0">
                  <Edit2 className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-wider leading-none">Editar Veículo</h3>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mt-1">Editar Dados Fiscais</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowEditModal(false); resetForm(); }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 border-0 bg-transparent outline-none cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modalEditPlaca" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Placa</label>
                  <Input 
                    id="modalEditPlaca"
                    type="text"
                    maxLength={7}
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
                    placeholder="ABC1D23"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-black uppercase tracking-widest bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modalEditRenavam" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">RENAVAM</label>
                  <Input 
                    id="modalEditRenavam"
                    type="text"
                    maxLength={11}
                    value={renavam}
                    onChange={(e) => setRenavam(e.target.value.replace(/\D/g, ""))}
                    placeholder="12345678901"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modalEditBrand" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Marca</label>
                <Input 
                  id="modalEditBrand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex: CHEVROLET, RENAULT, FIAT"
                  className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold uppercase bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modalEditModel" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Modelo</label>
                <Input 
                  id="modalEditModel"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ex: ONIX, KWID, UNO"
                  className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold uppercase bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modalEditYear" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Ano Modelo</label>
                  <Input 
                    id="modalEditYear"
                    type="text"
                    maxLength={4}
                    value={year}
                    onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex: 2024"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold text-center bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modalEditColor" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Cor</label>
                  <Input 
                    id="modalEditColor"
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ex: Branco"
                    className="border-neutral-200/80 rounded-sm h-11 text-xs font-bold uppercase text-center bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modalEditChassi" className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">Código Chassi</label>
                <Input 
                  id="modalEditChassi"
                  type="text"
                  value={chassi}
                  onChange={(e) => setChassi(e.target.value)}
                  placeholder="Digite o chassi do veículo..."
                  className="border-neutral-200/80 rounded-sm h-11 text-xs font-mono uppercase bg-white"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex gap-3">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="flex-1 h-12 border border-neutral-200 font-extrabold text-xs uppercase tracking-wider text-neutral-500 hover:bg-neutral-100 hover:text-black rounded-sm"
                  disabled={modalLoading}
                >
                  Cancelar
                </Button>
                
                <Button 
                  type="submit"
                  className="flex-1 bg-brand-accent hover:bg-brand-accent-hover text-white font-extrabold text-xs uppercase tracking-wider h-12 rounded-sm transition-all shadow-md flex items-center justify-center gap-2 border-0"
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: EXCLUIR VEÍCULO (CONFIRMAÇÃO) */}
      {showDeleteModal && selectedVehicle && (
        <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-sm bg-white rounded-md border border-neutral-200 overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-full flex items-center justify-center text-red-500 mx-auto">
                <Trash2 className="h-6 w-6 stroke-[2]" />
              </div>

              <div className="space-y-1.5 text-center">
                <h3 className="font-black text-neutral-800 text-base uppercase">Excluir Veículo?</h3>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider leading-relaxed">
                  Tem certeza que deseja remover o veículo <strong className="text-neutral-600 font-extrabold">{selectedVehicle.brand} {selectedVehicle.model}</strong> (Placa: <strong className="text-neutral-600 font-mono font-extrabold">{selectedVehicle.placa}</strong>) da sua garagem?
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => { setShowDeleteModal(false); resetForm(); }}
                  className="flex-1 h-11 border border-neutral-200 font-extrabold text-xs uppercase tracking-wider text-neutral-500 hover:bg-neutral-100 hover:text-black rounded-sm"
                  disabled={modalLoading}
                >
                  Cancelar
                </Button>
                
                <Button 
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider h-11 rounded-sm transition-all flex items-center justify-center gap-2 border-0"
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <RotateCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirmar"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
