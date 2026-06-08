"use client";

import ComprovanteTemplate from "../_components/ComprovanteTemplate";
import { Landmark } from "lucide-react";

export default function TEDPage() {
    return (
        <ComprovanteTemplate 
            title="Outros Bancos"
            description="Transferências via TED ou DOC para outras instituições financeiras."
            backHref="/dashboard/comprovantes"
            icon={Landmark}
            protocolPrefix="TED"
            exportMetodo="TRANSFERENCIA"
            filterMetodo={(item) => 
                (item.metodo === "TRANSFERENCIA" && !item.metodoFormatado?.toUpperCase().includes("ENTRE CONTAS")) || 
                item.metodoFormatado?.toUpperCase().includes("TED") ||
                item.metodoFormatado?.toUpperCase().includes("DOC")
            }
        />
    );
}
