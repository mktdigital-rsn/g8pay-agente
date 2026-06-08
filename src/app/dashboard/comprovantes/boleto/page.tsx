"use client";

import ComprovanteTemplate from "../_components/ComprovanteTemplate";
import { FileText } from "lucide-react";

export default function BoletoPage() {
    return (
        <ComprovanteTemplate 
            title="Boleto de Cobrança"
            description="Comprovantes de pagamentos de boletos, títulos e convênios."
            backHref="/dashboard/comprovantes"
            icon={FileText}
            protocolPrefix="BOL"
            exportMetodo="PAGAMENTO_BOLETO"
            filterMetodo={(item) => 
                item.metodo === "PAGAMENTO_BOLETO" || 
                item.metodo === "PAGAMENTO" ||
                item.metodoFormatado?.toUpperCase().includes("BOLETO")
            }
        />
    );
}
