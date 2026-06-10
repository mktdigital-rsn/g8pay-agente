"use client";

import React from "react";
import Image from "next/image";
import {
  Home,
  Wallet,
  ArrowUpRight,
  Smartphone,
  FileText,
  UserCircle,
  HelpCircle,
  Search,
  LogOut,
  RotateCw,
  CreditCard,
  Clock,
  Banknote,
  Cpu,
  User,
  Palmtree,
  Plane,
  Shield,
  Car,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Store,
  FolderOpen,
  Menu,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { useSetAtom, useAtom } from "jotai";
import { temporaryDeviceIdAtom, balanceAtom, isBalanceLoadingAtom, userAtom, isUserLoadingAtom } from "@/store/auth";
import { currentBrand } from "@/config/brand";

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  disabled?: boolean;
  badge?: string;
  type?: 'link' | 'separator';
  submenu?: { icon: any; label: string; href: string }[];
}

const menuGroups: { label?: string; items: MenuItem[] }[] = [
  {
    items: [
      { icon: Home, label: "Início", href: "/dashboard" },
      { 
        icon: UserPlus, 
        label: "Cadastro", 
        href: "#",
        submenu: [
          { icon: Store, label: "E.C - Estabelecimento Comercial", href: "/dashboard/maquininhas" }
        ]
      },
      { icon: FileText, label: "Contratos", href: "/dashboard/contratos" },
      { icon: FolderOpen, label: "Documentos", href: "/dashboard/documentos" },
      { icon: UserCircle, label: "Perfil", href: "/dashboard/conta" }
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
   const pathname = usePathname();
   const router = useRouter();
   const setTemporaryDeviceId = useSetAtom(temporaryDeviceIdAtom);
   const [userName, setUserName] = React.useState("");
   const [balance, setBalance] = React.useState("");
   const [accountInfo, setAccountInfo] = React.useState({ agency: "", account: "" });
   const [isLoadingData, setIsLoadingData] = React.useState(true);
   const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({});
   const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

   React.useEffect(() => {
     menuGroups.forEach(group => {
       group.items.forEach(item => {
         if (item.submenu) {
           const isAnySubActive = item.submenu.some(sub => pathname.startsWith(sub.href));
           if (isAnySubActive) {
             setExpandedMenus(prev => ({ ...prev, [item.label]: true }));
           }
         }
       });
     });
   }, [pathname]);
   const setGlobalBalance = useSetAtom(balanceAtom);
   const setGlobalBalanceLoading = useSetAtom(isBalanceLoadingAtom);
   const [user, setUser] = useAtom(userAtom);
   const setIsUserLoading = useSetAtom(isUserLoadingAtom);

  React.useEffect(() => {
    const fetchData = async () => {
      // Fetch details from localStorage if in bypass/demo mode
      const localName = typeof window !== "undefined" ? localStorage.getItem("userName") : null;
      const signedContractStr = typeof window !== "undefined" ? localStorage.getItem("signedContract") : null;
      let initialName = "Agente G8Pay";
      let initialEmail = "agente@g8pay.com";
      let initialCpf = "000.000.000-00";

      if (localName) {
        initialName = localName;
      }
      if (signedContractStr) {
        try {
          const contract = JSON.parse(signedContractStr);
          if (contract.fullName) initialName = contract.fullName;
          if (contract.email) initialEmail = contract.email;
          if (contract.cpf) initialCpf = contract.cpf;
        } catch (err) {}
      }

      setUserName(initialName);
      setAccountInfo({
        agency: "0001",
        account: "12345-6"
      });

      setUser({
        name: initialName,
        nome: initialName,
        email: initialEmail,
        taxNumber: initialCpf,
        status: "CONTA_APROVADA",
        accountBranch: "0001",
        accountNumber: "12345-6",
        bankNumber: "389"
      });

      try {
        const userRes = await api.get("/api/users/data");

        if (userRes.data) {
          const u = userRes.data;
          setUser(u);
          setUserName(u.name || u.nome || "Cliente");
          
          const extract = (val: any) => (val && typeof val === 'object' && 'present' in val) 
            ? (val.present ? val.value : "---") 
            : (val || "---");

          setAccountInfo({ 
            agency: extract(u.accountBranch || u.branch || u.agencia), 
            account: extract(u.accountNumber || u.account || u.conta) 
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setIsUserLoading(false);
      }
    };
    fetchData();
  }, [setUser, setIsUserLoading]);

  React.useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balanceRes = await api.get("/api/banco/saldo/getSaldo");

        if (balanceRes.data) {
          const valor = balanceRes.data.valor || 0;
          setBalance(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor));
          setGlobalBalance(valor);
        }
        setIsLoadingData(false);
        setGlobalBalanceLoading(false);
      } catch (err) {
        console.error("Error updating balance:", err);
        setBalance(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0));
        setGlobalBalance(0);
        setIsLoadingData(false);
        setGlobalBalanceLoading(false);
      }
    };
    fetchBalance();
  }, [pathname, setGlobalBalance, setGlobalBalanceLoading]);

  const cleanName = (name: string) => {
    return name.replace(/^\d+(\.\d+)*\s*/, '').split(' ')[0] || "Cliente";
  };

  const handleLogout = React.useCallback(() => {
    setTemporaryDeviceId("");
    localStorage.clear();
    router.push("/");
  }, [router, setTemporaryDeviceId]);

  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);

  // Monitor user activity to reset session timer
  React.useEffect(() => {
    const EVENTS = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    let lastActivity = Date.now();

    const handleActivity = () => {
      const now = Date.now();
      // Throttle localStorage writes to once every 2 seconds
      if (now - lastActivity > 2000) {
        lastActivity = now;
        const expiresAt = now + 600 * 1000;
        localStorage.setItem("sessionExpiresAt", expiresAt.toString());
        setTimeLeft(600);
      }
    };

    EVENTS.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, []);

  // Initial load and sync of expiration
  React.useEffect(() => {
    const expiresAt = localStorage.getItem("sessionExpiresAt");
    if (expiresAt) {
      const remaining = Math.floor((parseInt(expiresAt) - Date.now()) / 1000);
      if (remaining <= 0) {
        toast.error("Sua sessão expirou por inatividade. Por favor, faça login novamente.");
        handleLogout();
      } else {
        setTimeLeft(remaining);
      }
    } else {
      const expires = Date.now() + 600 * 1000;
      localStorage.setItem("sessionExpiresAt", expires.toString());
      setTimeLeft(600);
    }
  }, [handleLogout]);

  // Countdown timer interval
  React.useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      toast.error("Sua sessão expirou por inatividade. Por favor, faça login novamente.");
      handleLogout();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, handleLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const THEME_BG = 
    currentBrand.id === "fiscomoney"
      ? "bg-[#1c1f22]"
      : "bg-[#141210]"; // Slightly lighter than #0c0a09

  const sidebarBg = 
    currentBrand.id === "galapagos"
      ? "bg-[#0b1329] border-r border-white/5"
      : currentBrand.id === "fiscomoney"
      ? "bg-[#141619] border-r border-white/5"
      : currentBrand.id === "advogado10x"
      ? "bg-[#0f0f0f] border-r border-white/5"
      : THEME_BG;

  const headerBg = 
    currentBrand.id === "galapagos"
      ? "bg-[#0b1329] border-b border-white/5"
      : currentBrand.id === "fiscomoney"
      ? "bg-[#141619] border-b border-white/5"
      : currentBrand.id === "advogado10x"
      ? "bg-[#0f0f0f] border-b border-white/5"
      : THEME_BG;

  const renderSidebarContent = (onLinkClick?: () => void) => {
    return (
      <>
        <div className="px-2 relative z-10">
          <Link href="/dashboard" onClick={onLinkClick}>
            {currentBrand.id === "g8" ? (
              <Image src={currentBrand.logoOfficial} alt={currentBrand.name} width={180} height={60} className="object-contain 2xl:scale-110" />
            ) : (
              <div className={`flex items-center gap-3.5 select-none animate-in fade-in duration-300 origin-left ${
                currentBrand.id === "advogado10x"
                  ? "scale-[1.05] 2xl:scale-[1.15] -translate-x-1"
                  : "scale-125 2xl:scale-[1.4]"
              }`}>
                <img 
                  src={currentBrand.logoOfficial} 
                  alt={currentBrand.name} 
                  className={`${
                    currentBrand.id === "galapagos" 
                      ? "h-9" 
                      : currentBrand.id === "advogado10x"
                      ? "h-14"
                      : "h-14"
                  } w-auto object-contain brightness-100`} 
                />
                {currentBrand.id === "galapagos" && (
                  <div className="flex flex-col justify-center text-left">
                    <span className="text-[17px] font-semibold tracking-wide leading-none text-white font-sans">
                      {currentBrand.name.split(" ")[0]}
                    </span>
                    <span className="text-[8px] font-black tracking-[0.38em] uppercase text-white mt-1 leading-none">
                      {(currentBrand.name.split(" ")[1] || "Capital").toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Link>
        </div>

        <div className="flex flex-col space-y-5 relative z-10 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {/* User Card with Yellowish Background */}
          <div className={`flex-shrink-0 flex items-center gap-4 p-4 rounded-md shadow-2xl relative overflow-hidden group ${
            currentBrand.id !== "g8"
              ? "bg-white/[0.04] border border-white/10"
              : "bg-brand-secondary/10 border border-brand-secondary/20"
          }`}>
            <div className="absolute top-0 right-0 p-2 opacity-10">
               <User className="h-10 w-10 text-brand-secondary" />
            </div>
            <Avatar className="h-12 w-12 border-2 border-brand-accent rounded-md shadow-lg shrink-0">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} />
              <AvatarFallback className="bg-neutral-800 text-white font-black uppercase">{cleanName(userName)[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-[9px] text-brand-accent font-black uppercase tracking-[0.2em] mb-0.5">Status Platinum</span>
              <span className="text-lg font-black text-white leading-tight truncate mb-1.5">{cleanName(userName)}</span>
              
              <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 ${
                    currentBrand.id === "galapagos" ? "text-white/50" : "text-brand-secondary/60"
                  }`}>Banco</span>
                  <span className="text-[10px] font-mono font-black text-white leading-none">{currentBrand.bankCode} • {currentBrand.bankName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 ${
                      currentBrand.id === "galapagos" ? "text-white/50" : "text-brand-secondary/60"
                    }`}>Ag</span>
                    <span className="text-[10px] font-mono font-black text-white leading-none">{accountInfo.agency}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 ${
                      currentBrand.id === "galapagos" ? "text-white/50" : "text-brand-secondary/60"
                    }`}>C/C</span>
                    <span className="text-[10px] font-mono font-black text-white leading-none">{accountInfo.account}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <nav className="space-y-4">
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
                  
                  if (item.submenu) {
                    const isAnySubActive = item.submenu.some(sub => pathname.startsWith(sub.href));
                    return (
                      <div key={item.label} className="space-y-1">
                        <button
                          onClick={() => setExpandedMenus(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                          className={`flex items-center gap-5 px-6 py-3 w-full rounded-md transition-all group relative overflow-hidden border border-transparent ${
                            isAnySubActive
                              ? "text-brand-accent bg-white shadow-lg shadow-brand-accent/5"
                              : "text-white/80 hover:bg-white hover:text-brand-accent"
                          }`}
                        >
                          <item.icon className={`h-5 w-5 relative z-10 ${isAnySubActive ? "text-brand-accent" : "text-white/60 group-hover:text-brand-accent"}`} />
                          <div className="flex items-center justify-between flex-1 relative z-10">
                            <span className={`text-[11px] uppercase tracking-[0.15em] font-black ${isAnySubActive ? "text-brand-accent" : "text-white/80 group-hover:text-brand-accent transition-colors duration-300"}`}>{item.label}</span>
                            {expandedMenus[item.label] ? (
                              <ChevronUp className="h-4 w-4 text-brand-accent relative z-10 shrink-0" />
                            ) : (
                              <ChevronDown className={`h-4 w-4 relative z-10 shrink-0 ${isAnySubActive ? "text-brand-accent" : "text-white/60 group-hover:text-brand-accent"}`} />
                            )}
                          </div>
                        </button>
                        {expandedMenus[item.label] && (
                          <div className="pl-6 space-y-1 animate-in slide-in-from-top-1 duration-200">
                            {item.submenu.map((sub) => {
                              const isSubActive = pathname.startsWith(sub.href);
                              return (
                                <Link
                                  key={sub.label}
                                  href={sub.href}
                                  onClick={onLinkClick}
                                  className={`flex items-center gap-4 px-6 py-2.5 rounded-md transition-all group border border-transparent ${
                                    isSubActive
                                      ? currentBrand.id !== "g8"
                                        ? "text-brand-accent bg-white shadow-md shadow-black/5"
                                        : "text-white bg-brand-accent shadow-md shadow-brand-accent/10"
                                      : "text-white/70 hover:bg-white hover:text-brand-accent"
                                  }`}
                                >
                                  <sub.icon className={`h-4 w-4 shrink-0 ${isSubActive ? (currentBrand.id !== "g8" ? "text-brand-accent" : "text-white") : "text-white/40 group-hover:text-brand-accent"}`} />
                                  <span className={`text-[10px] uppercase tracking-[0.15em] font-black ${isSubActive ? (currentBrand.id !== "g8" ? "text-brand-accent" : "text-white") : "text-white/70 group-hover:text-brand-accent"}`}>{sub.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.disabled ? "#" : item.href}
                      onClick={(e) => {
                        if (item.disabled) {
                          e.preventDefault();
                        } else if (onLinkClick) {
                          onLinkClick();
                        }
                      }}
                      className={`flex items-center gap-5 px-6 py-3 rounded-md transition-all group relative overflow-hidden border border-transparent ${isActive
                        ? currentBrand.id !== "g8"
                          ? "text-brand-accent bg-white shadow-lg shadow-black/10"
                          : "text-white bg-brand-accent shadow-lg shadow-brand-accent/20"
                        : item.disabled
                          ? "opacity-60 cursor-not-allowed"
                          : "text-white/80 hover:bg-white hover:text-brand-accent"
                        }`}
                    >
                      <item.icon className={`h-5 w-5 relative z-10 ${isActive ? (currentBrand.id !== "g8" ? "text-brand-accent" : "text-white") : item.disabled ? "text-white/40" : "text-white/60 group-hover:text-brand-accent"}`} />
                      <div className="flex items-center justify-between flex-1 relative z-10">
                        <span className={`text-[11px] uppercase tracking-[0.15em] font-black ${isActive ? (currentBrand.id !== "g8" ? "text-brand-accent" : "text-white") : item.disabled ? "text-white/40" : "text-white/80 group-hover:text-brand-accent transition-colors duration-300"}`}>{item.label}</span>
                        {item.badge && (
                          <span className={`font-black text-[9px] px-1.5 py-0.5 rounded-sm tracking-tighter ${item.badge === "EM BREVE" ? "bg-[#ffdd00] text-black" : "bg-white/10 text-white"}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
                {groupIdx < menuGroups.length - 1 && <Separator className="bg-white/5 my-4" />}
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto relative z-10 pt-6 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-5 px-5 py-4 w-full text-white/60 hover:bg-white hover:text-brand-accent rounded-md transition-all border border-transparent group">
            <LogOut className="h-5 w-5 text-white/60 group-hover:text-brand-accent" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white/60 group-hover:text-brand-accent">Sair</span>
          </button>
        </div>
      </>
    );
  };

  return (
    <div className={`flex h-screen ${THEME_BG} text-white overflow-hidden font-sans ${currentBrand.themeClass}`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex w-72 2xl:w-80 flex flex-col p-6 2xl:p-10 space-y-8 z-20 relative ${sidebarBg} shrink-0`}>
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer (Sidebar) */}
      <div className={`fixed inset-0 z-50 flex lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Backdrop */}
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
        
        {/* Drawer Body */}
        <aside className={`relative w-72 max-w-[85vw] flex flex-col p-6 space-y-6 z-10 transition-transform duration-300 ease-out ${sidebarBg} ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
          
          {renderSidebarContent(() => setIsMobileMenuOpen(false))}
        </aside>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className={`h-20 lg:h-24 flex items-center justify-between px-4 md:px-10 z-10 shrink-0 ${headerBg}`}>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-md text-white transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3 sm:gap-8 xl:gap-12">
            {/* Balance Section */}
            <div className={`flex flex-col items-end justify-center h-12 border-r pr-4 sm:pr-8 xl:pr-12 ${
              currentBrand.id !== "g8" ? "border-white/5" : "border-white/10"
            }`}>
              <span className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] mb-2 leading-none">Comissões</span>
              <div className="flex items-center gap-4">
                {isLoadingData ? (
                  <div className="h-6 w-32 bg-white/5 animate-pulse rounded-md" />
                ) : (
                  <span className="text-lg sm:text-2xl xl:text-3xl font-black text-white font-mono tracking-tighter">{balance}</span>
                )}
                <button onClick={() => window.location.reload()} className="group/sync">
                   <RotateCw className="h-4 w-4 text-brand-accent group-hover/sync:rotate-180 transition-transform duration-700" />
                </button>
              </div>
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-3 sm:gap-6 xl:gap-8 relative">
              {timeLeft !== null && (
                <div className={`hidden lg:flex flex-col items-center gap-1.5 px-4 py-2 rounded-md shadow-lg ${
                  currentBrand.id !== "g8"
                    ? "bg-white/10 border border-white/20"
                    : "bg-brand-secondary/10 border border-brand-secondary/20"
                }`}>
                   <div className="flex items-center gap-2">
                      <Clock className={`h-3 w-3 animate-pulse ${
                        currentBrand.id !== "g8" ? "text-white" : "text-brand-secondary"
                      }`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        currentBrand.id !== "g8" ? "text-white" : "text-brand-secondary"
                      }`}>Sessão Segura</span>
                   </div>
                   <span className="text-sm font-mono font-black text-white tabular-nums leading-none">
                     {formatTime(timeLeft)}
                   </span>
                </div>
              )}

              <Link href="/dashboard/conta" className="flex items-center gap-4 cursor-pointer group">
                <div className="text-right flex flex-col justify-center hidden sm:flex">
                  <p className="text-base font-black text-white group-hover:text-brand-accent transition-colors leading-none truncate max-w-[200px] xl:max-w-[300px]">
                    {cleanName(userName)}
                  </p>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1.5 leading-none">PLATINUM ELITE</p>
                </div>
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent to-brand-secondary rounded-md blur opacity-0 group-hover:opacity-20 transition-opacity" />
                  <Avatar className="h-12 w-12 border border-white/5 rounded-md relative z-10 shadow-lg">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} />
                    <AvatarFallback className="bg-brand-accent text-white font-black">{cleanName(userName)[0]}</AvatarFallback>
                  </Avatar>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-white relative shadow-inner no-scrollbar">
          <div className="max-w-[1920px] mx-auto min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
