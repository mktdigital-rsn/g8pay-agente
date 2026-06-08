"use client";

import React, { useState } from "react";
import LoginScreen from "@/components/LoginScreen";
import AgentOnboarding from "@/components/AgentOnboarding";
import CommercialScheduling from "@/components/CommercialScheduling";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [view, setView] = useState<"login" | "onboarding" | "scheduling">("login");

  return (
    <main className="min-h-screen bg-[#0c0a09] overflow-x-hidden font-sans">
      <AnimatePresence mode="wait">
        {view === "login" && (
          <motion.div
            key="login-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoginScreen
              onBecomeAgent={() => setView("onboarding")}
              onCommercialSchedule={() => setView("scheduling")}
            />
          </motion.div>
        )}

        {view === "onboarding" && (
          <motion.div
            key="onboarding-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AgentOnboarding onBack={() => setView("login")} />
          </motion.div>
        )}

        {view === "scheduling" && (
          <motion.div
            key="scheduling-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CommercialScheduling onBack={() => setView("login")} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
