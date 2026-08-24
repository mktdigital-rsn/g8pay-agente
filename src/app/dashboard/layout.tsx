"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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
  Loader2,
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
  X,
  Users,
  Bell,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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

type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  scope: "all" | "agent" | "establishment";
  contextLabel: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
};

type NotificationScope = "all" | "agent" | "establishment";

type NotificationAgentOption = {
  id: string;
  fullName: string;
  cpf?: string;
};

type NotificationEstablishmentOption = {
  id: string;
  nomeFantasia: string;
  cnpjCpf?: string;
  agentId?: string;
  agentName?: string;
};

const menuGroups: { label?: string; items: MenuItem[] }[] = [
  {
    items: [
      { icon: Home, label: "Início", href: "/dashboard" },
      { 
        icon: UserPlus, 
        label: "Cadastro", 
        href: "#",
        submenu: [
          { icon: Store, label: "E.C - Estabelecimento Comercial", href: "/dashboard/maquininhas" },
          { icon: Users, label: "Meus Clientes", href: "/dashboard/meus-clientes" }
        ]
      },
      { icon: FileText, label: "Contratos", href: "/dashboard/contratos" },
      { icon: FolderOpen, label: "Documentos", href: "/dashboard/documentos" },
      { icon: UserCircle, label: "Perfil", href: "/dashboard/conta" }
    ]
  }
];

const adminMenuGroups: { label?: string; items: MenuItem[] }[] = [
  {
    items: [
      { icon: Home, label: "Início", href: "/dashboard" },
      {
        icon: Shield,
        label: "Compliance",
        href: "#",
        submenu: [
          { icon: Users, label: "Agentes", href: "/dashboard/compliance/agentes" },
          { icon: Store, label: "E.C.", href: "/dashboard/compliance" },
        ],
      },
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
   const [userRole, setUserRole] = React.useState("agent");
   const [agentId, setAgentId] = React.useState("");
   const [notifications, setNotifications] = React.useState<DashboardNotification[]>([]);
   const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
   const [isNotificationsLoading, setIsNotificationsLoading] = React.useState(false);
   const [isNotificationComposerOpen, setIsNotificationComposerOpen] = React.useState(false);
   const [notificationTitle, setNotificationTitle] = React.useState("");
   const [notificationMessage, setNotificationMessage] = React.useState("");
   const [notificationScope, setNotificationScope] = React.useState<NotificationScope>("all");
   const [notificationTargetAgentId, setNotificationTargetAgentId] = React.useState("");
   const [notificationTargetEstablishmentId, setNotificationTargetEstablishmentId] = React.useState("");
   const [adminAgents, setAdminAgents] = React.useState<NotificationAgentOption[]>([]);
   const [adminEstablishments, setAdminEstablishments] = React.useState<NotificationEstablishmentOption[]>([]);
  const [isNotificationTargetsLoading, setIsNotificationTargetsLoading] = React.useState(false);
  const [isSendingNotification, setIsSendingNotification] = React.useState(false);
  const notificationsPanelRef = React.useRef<HTMLDivElement | null>(null);
  const previousUnreadCountRef = React.useRef(0);
  const selectedAgentEstablishments = React.useMemo(() => {
    if (!notificationTargetAgentId) return [];
    return adminEstablishments.filter((ec) => ec.agentId === notificationTargetAgentId);
  }, [adminEstablishments, notificationTargetAgentId]);
  const isPathActive = React.useCallback((href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  }, [pathname]);
  const isExactPathActive = React.useCallback((href: string) => pathname === href, [pathname]);
  const unreadNotificationsCount = React.useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

   React.useEffect(() => {
     const activeGroups = userRole === "admin" ? adminMenuGroups : menuGroups;
     activeGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.submenu) {
          const isAnySubActive = item.submenu.some(sub => isExactPathActive(sub.href));
          if (isAnySubActive) {
            setExpandedMenus(prev => ({ ...prev, [item.label]: true }));
          }
        }
      });
    });
  }, [isExactPathActive, pathname, userRole]);
   const setGlobalBalance = useSetAtom(balanceAtom);
   const setGlobalBalanceLoading = useSetAtom(isBalanceLoadingAtom);
   const [user, setUser] = useAtom(userAtom);
   const setIsUserLoading = useSetAtom(isUserLoadingAtom);

  React.useEffect(() => {
    const fetchData = async () => {
      const localRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : "agent";
      const localAgentId = typeof window !== "undefined" ? localStorage.getItem("agentId") : "";
      setUserRole(localRole || "agent");
      setAgentId(localAgentId || "");
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

  const loadNotifications = React.useCallback(async (currentAgentId: string) => {
    if (!currentAgentId) {
      setNotifications([]);
      return;
    }

    setIsNotificationsLoading(true);
    try {
      const response = await api.get("/api/notifications", {
        params: { agentId: currentAgentId },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        setNotifications(response.data.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setIsNotificationsLoading(false);
    }
  }, []);

  const openAdminNotificationComposer = React.useCallback(() => {
    if (userRole !== "admin") return;
    setIsNotificationsOpen(false);
    setNotificationTitle("Comunicado geral");
    setNotificationMessage("");
    setNotificationScope("all");
    setNotificationTargetAgentId("");
    setNotificationTargetEstablishmentId("");
    setIsNotificationComposerOpen(true);
  }, [userRole]);

  const loadNotificationTargets = React.useCallback(async () => {
    if (userRole !== "admin") return;

    setIsNotificationTargetsLoading(true);
    try {
      const [agentsResponse, establishmentsResponse] = await Promise.all([
        api.get("/api/agents/admin"),
        api.get("/api/establishments"),
      ]);

      if (agentsResponse.data?.success && Array.isArray(agentsResponse.data.data)) {
        setAdminAgents(
          agentsResponse.data.data.map((agent: any) => ({
            id: String(agent.agentId || agent.id || ""),
            fullName: String(agent.fullName || agent.name || "Agente sem nome"),
            cpf: agent.cpf ? String(agent.cpf) : undefined,
          })).filter((agent: NotificationAgentOption) => agent.id)
        );
      } else {
        setAdminAgents([]);
      }

      if (establishmentsResponse.data?.success && Array.isArray(establishmentsResponse.data.data)) {
        setAdminEstablishments(
          establishmentsResponse.data.data.map((ec: any) => ({
            id: String(ec.id || ""),
            nomeFantasia: String(ec.nomeFantasia || ec.razaoSocial || "E.C. sem nome"),
            cnpjCpf: ec.cnpjCpf ? String(ec.cnpjCpf) : undefined,
            agentId: ec.agentId ? String(ec.agentId) : undefined,
          })).filter((ec: NotificationEstablishmentOption) => ec.id)
        );
      } else {
        setAdminEstablishments([]);
      }
    } catch (error) {
      console.error("Error loading notification targets:", error);
      setAdminAgents([]);
      setAdminEstablishments([]);
    } finally {
      setIsNotificationTargetsLoading(false);
    }
  }, [userRole]);

  const handleSendAdminNotification = React.useCallback(async () => {
    const title = notificationTitle.trim();
    const message = notificationMessage.trim();

    if (!title || !message) {
      toast.error("Preencha o título e a mensagem da notificação.");
      return;
    }

    if (notificationScope === "agent" && !notificationTargetAgentId) {
      toast.error("Selecione um agente para a notificação.");
      return;
    }

    setIsSendingNotification(true);
    const toastId = toast.loading("Enviando notificação...");

    try {
      const response = await api.post("/api/notifications", {
        title,
        message,
        scope: notificationScope,
        targetAgentId: notificationScope === "agent" ? notificationTargetAgentId : undefined,
        targetEstablishmentId: notificationScope === "agent" && notificationTargetEstablishmentId
          ? notificationTargetEstablishmentId
          : undefined,
        createdByRole: "admin",
        createdByName: userName || "Admin",
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Não foi possível criar a notificação.");
      }

      toast.success("Notificação enviada com sucesso!", { id: toastId });
      setIsNotificationComposerOpen(false);
      setNotificationMessage("");
      setNotificationScope("all");
      setNotificationTargetAgentId("");
      setNotificationTargetEstablishmentId("");
    } catch (error: any) {
      console.error("Error sending admin notification:", error);
      toast.error(error.response?.data?.error || error.message || "Não foi possível enviar a notificação.", { id: toastId });
    } finally {
      setIsSendingNotification(false);
    }
  }, [
    notificationMessage,
    notificationScope,
    notificationTargetAgentId,
    notificationTargetEstablishmentId,
    notificationTitle,
    userName,
  ]);

  React.useEffect(() => {
    if (isNotificationComposerOpen && userRole === "admin") {
      void loadNotificationTargets();
    }
  }, [isNotificationComposerOpen, loadNotificationTargets, userRole]);

  React.useEffect(() => {
    if (!agentId) return;
    void loadNotifications(agentId);
  }, [agentId, loadNotifications, pathname]);

  React.useEffect(() => {
    if (!agentId) return;

    const previousUnreadCount = previousUnreadCountRef.current;
    previousUnreadCountRef.current = unreadNotificationsCount;

    if (unreadNotificationsCount <= 0 || unreadNotificationsCount === previousUnreadCount) {
      return;
    }

    const audioContext = typeof window !== "undefined"
      ? new (window.AudioContext || (window as any).webkitAudioContext)()
      : null;

    if (!audioContext) return;

    const playTone = (frequency: number, startTime: number, duration: number, gainValue: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gainNode.gain.value = gainValue;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const startAt = audioContext.currentTime + 0.01;
    playTone(880, startAt, 0.12, 0.04);
    playTone(988, startAt + 0.12, 0.14, 0.035);

    return () => {
      audioContext.close().catch(() => undefined);
    };
  }, [agentId, unreadNotificationsCount]);

  React.useEffect(() => {
    if (!isNotificationsOpen || !agentId) return;

    const unreadNotifications = notifications.filter(notification => !notification.isRead);
    if (unreadNotifications.length === 0) return;

    const markAsRead = async () => {
      try {
        await Promise.all(
          unreadNotifications.map((notification) =>
            api.patch(`/api/notifications/${notification.id}/read`, { agentId })
          )
        );
        await loadNotifications(agentId);
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    };

    void markAsRead();
  }, [agentId, isNotificationsOpen, loadNotifications, notifications]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsPanelRef.current &&
        !notificationsPanelRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

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

  const formatNotificationDate = (value?: string | null) => {
    if (!value) return "---";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              <span className="text-[9px] text-brand-accent font-black uppercase tracking-[0.2em] mb-0.5">{userRole === "admin" ? "Acesso Total" : "Status Platinum"}</span>
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
            {(userRole === "admin" ? adminMenuGroups : menuGroups).map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : isPathActive(item.href);
                  
                  if (item.submenu) {
                    return (
                      <div key={item.label} className="space-y-1">
                        <button
                          onClick={() => setExpandedMenus(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                          className={`flex items-center gap-5 px-6 py-3 w-full rounded-md transition-all group relative overflow-hidden border border-transparent ${
                            expandedMenus[item.label]
                              ? "text-white bg-white/5 border-white/10"
                              : "text-white/80 hover:bg-white/5 hover:text-brand-accent"
                          }`}
                        >
                          <item.icon className={`h-5 w-5 relative z-10 ${expandedMenus[item.label] ? "text-white" : "text-white/60 group-hover:text-brand-accent"}`} />
                          <div className="flex items-center justify-between flex-1 relative z-10">
                            <span className={`text-[11px] uppercase tracking-[0.15em] font-black ${expandedMenus[item.label] ? "text-white" : "text-white/80 group-hover:text-brand-accent transition-colors duration-300"}`}>{item.label}</span>
                            {expandedMenus[item.label] ? (
                              <ChevronUp className="h-4 w-4 text-brand-accent relative z-10 shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 relative z-10 shrink-0 text-white/60 group-hover:text-brand-accent" />
                            )}
                          </div>
                        </button>
                        {expandedMenus[item.label] && (
                          <div className="pl-6 space-y-1 animate-in slide-in-from-top-1 duration-200">
                            {item.submenu.map((sub) => {
                              const isSubActive = isExactPathActive(sub.href);
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
            {userRole !== "admin" && (
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
            )}

            {/* Profile Section */}
            <div className="flex items-center gap-3 sm:gap-6 xl:gap-8 relative">
              {agentId && (
                <div ref={notificationsPanelRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(prev => !prev)}
                    className="relative flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 hover:text-brand-accent"
                    aria-label="Abrir notificações"
                  >
                    <motion.span
                      animate={
                        unreadNotificationsCount > 0
                          ? { rotate: [0, -12, 12, -8, 8, 0], y: [0, -1, 0, -1, 0] }
                          : { rotate: 0, y: 0 }
                      }
                      transition={
                        unreadNotificationsCount > 0
                          ? { duration: 1.15, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }
                          : { duration: 0.2 }
                      }
                      className="block"
                    >
                      <Bell className="h-4.5 w-4.5" />
                    </motion.span>
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-brand-accent text-white text-[9px] font-black leading-none flex items-center justify-center">
                        {unreadNotificationsCount > 9
                          ? "9+"
                          : unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-full mt-3 w-[22rem] max-w-[85vw] rounded-[18px] border border-white/10 bg-[#141210] shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-brand-accent">Sininho</p>
                          <h3 className="text-sm font-black text-white uppercase tracking-wide">Notificações</h3>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                          {unreadNotificationsCount} novas
                        </span>
                      </div>

                      <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
                        {isNotificationsLoading ? (
                          <div className="p-4 space-y-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                              <div key={index} className="rounded-[14px] border border-white/8 bg-white/5 p-4 animate-pulse">
                                <div className="h-3 w-24 bg-white/10 rounded-full" />
                                <div className="mt-3 h-4 w-4/5 bg-white/10 rounded-full" />
                                <div className="mt-2 h-3 w-3/5 bg-white/10 rounded-full" />
                              </div>
                            ))}
                          </div>
                        ) : notifications.length > 0 ? (
                          <div className="p-3 space-y-3">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`rounded-[14px] border p-4 transition-colors ${
                                  notification.isRead
                                    ? "border-white/10 bg-white/[0.03]"
                                    : "border-brand-accent/30 bg-brand-accent/10"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.22em] ${notification.isRead ? "text-white/40" : "text-brand-accent"}`}>
                                      {notification.contextLabel}
                                    </p>
                                    <h4 className="mt-1 text-sm font-black text-white uppercase tracking-wide break-words">
                                      {notification.title}
                                    </h4>
                                  </div>
                                  {!notification.isRead && (
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-accent shrink-0" />
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-white/70 leading-relaxed break-words">
                                  {notification.message}
                                </p>
                                <div className="mt-3 flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                                  <span>{formatNotificationDate(notification.createdAt)}</span>
                                  {notification.readAt && <span>Lida em {formatNotificationDate(notification.readAt)}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center">
                            <p className="text-sm font-bold text-white/55">Nenhuma notificação no momento.</p>
                            <p className="mt-2 text-xs text-white/35">
                              Os avisos enviados pelo admin aparecerão aqui quando a página for recarregada.
                            </p>
                          </div>
                        )}
                      </div>

                      {userRole === "admin" && (
                        <div className="p-3 border-t border-white/10 bg-white/[0.02]">
                          <button
                            type="button"
                            onClick={openAdminNotificationComposer}
                            className="w-full h-11 rounded-[12px] bg-brand-accent hover:bg-brand-accent-hover text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                          >
                            <Send className="h-4 w-4" />
                            Nova notificação
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1.5 leading-none">{userRole === "admin" ? "ADMINISTRADOR" : "PLATINUM ELITE"}</p>
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

      {isNotificationComposerOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-[18px] bg-white border border-neutral-100 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">Sininho</p>
                <h3 className="mt-1 text-2xl font-black text-[#0c0a09] uppercase">Nova notificação</h3>
                <p className="mt-1 text-sm text-neutral-500 font-medium">
                  Envie um comunicado geral ou para um agente específico, com a opção de amarrar a um E.C. em questão.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationComposerOpen(false)}
                className="h-10 w-10 rounded-full border border-neutral-200 text-neutral-500 hover:text-[#0c0a09] hover:border-neutral-300 hover:bg-neutral-50 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Destinatário</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: "all", label: "Todos os agentes" },
                    { value: "agent", label: "Agente específico" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNotificationScope(option.value as NotificationScope)}
                      className={`h-11 rounded-sm border px-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                        notificationScope === option.value
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
                </div>
              </div>

              {notificationScope === "agent" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Agente</label>
                    <select
                      value={notificationTargetAgentId}
                      onChange={(e) => {
                        setNotificationTargetAgentId(e.target.value);
                        setNotificationTargetEstablishmentId("");
                      }}
                      className="w-full h-12 px-4 rounded-sm border border-neutral-200 bg-white text-sm font-medium text-[#0c0a09] focus-visible:outline-none focus-visible:border-brand-accent"
                      disabled={isNotificationTargetsLoading}
                    >
                      <option value="">
                        {isNotificationTargetsLoading ? "Carregando agentes..." : "Selecione um agente"}
                      </option>
                      {adminAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.fullName} {agent.cpf ? `• ${agent.cpf}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">E.C. em questão</label>
                    <select
                      value={notificationTargetEstablishmentId}
                      onChange={(e) => setNotificationTargetEstablishmentId(e.target.value)}
                      className="w-full h-12 px-4 rounded-sm border border-neutral-200 bg-white text-sm font-medium text-[#0c0a09] focus-visible:outline-none focus-visible:border-brand-accent"
                      disabled={!notificationTargetAgentId || isNotificationTargetsLoading}
                    >
                      <option value="">
                        {!notificationTargetAgentId
                          ? "Selecione um agente primeiro"
                          : isNotificationTargetsLoading
                            ? "Carregando E.C.s..."
                            : "Opcional: selecione um E.C."}
                      </option>
                      {selectedAgentEstablishments.map((ec) => (
                        <option key={ec.id} value={ec.id}>
                          {ec.nomeFantasia} {ec.cnpjCpf ? `• ${ec.cnpjCpf}` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      Esse campo é opcional e serve para amarrar o aviso a um E.C. específico do agente escolhido.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Título</label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Ex: Cobrança de meta comercial"
                  className="w-full h-12 px-4 rounded-sm border border-neutral-200 bg-white text-sm font-medium text-[#0c0a09] placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-brand-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Mensagem</label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder={
                    notificationScope === "all"
                      ? "Escreva o comunicado para todos os agentes..."
                      : notificationScope === "agent"
                        ? "Escreva o comunicado para este agente..."
                        : "Escreva o comunicado para este E.C...."
                  }
                  className="w-full min-h-[160px] px-4 py-3 rounded-sm border border-neutral-200 bg-white text-sm font-medium text-[#0c0a09] placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-brand-accent resize-y"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setIsNotificationComposerOpen(false)}
                  className="h-11 px-5 rounded-sm bg-white hover:bg-neutral-50 text-[#0c0a09] border border-neutral-200 font-black text-[10px] uppercase tracking-widest"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSendAdminNotification()}
                  disabled={isSendingNotification}
                  className="h-11 px-5 rounded-sm bg-brand-accent hover:bg-brand-accent-hover text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                >
                  {isSendingNotification ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar notificação
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
