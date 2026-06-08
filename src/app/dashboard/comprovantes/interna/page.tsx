"use client";

import ComprovanteTemplate from "../_components/ComprovanteTemplate";
import { ArrowRightLeft } from "lucide-react";

export default function InternoPage() {
    return (
        <ComprovanteTemplate 
            title="Contas G8"
            description="Transferências realizadas entre contas do G8 Bank."
            backHref="/dashboard/comprovantes"
            icon={ArrowRightLeft}
            protocolPrefix="P2P"
            exportMetodo="TRANSFERENCIA_INTERNA"
            filterMetodo={(item) => 
                item.metodo === "TRANSFERENCIA_INTERNA" || 
                (item.metodoFormatado?.toUpperCase().includes("P2P") || item.metodoFormatado?.toUpperCase().includes("ENTRE CONTAS"))
            }
        />
    );
}
