import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

import { currentBrand } from "@/config/brand";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "G8pay - Torne-se um agente de negócios",
  description: "Torne-se um agente de negócios G8Pay e venha crescer conosco. Cadastre-se ou agende uma reunião comercial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; 
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} font-sans antialiased text-base`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
