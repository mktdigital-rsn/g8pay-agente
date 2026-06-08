import { atom } from "jotai";

export interface CobrancaResult {
  html: string;
  dataVencimento: string;
  isPlaceholder?: boolean;
}

interface CobrancaData {
  valor: number;
  pagadorNome: string;
  pagadorTaxNumber: string;
  pagadorEmail: string;
  pagadorTelefone: string;
  pagadorCep: string;
  pagadorBairro: string;
  pagadorRua: string;
  pagadorCidade: string;
  pagadorUf: string;
  pagadorNumero: string;
  pagadorComplemento?: string;
  dataVencimento: string;
  isRecorrente?: boolean;
  quantidadeMeses?: number;
  groupName?: string;
  results?: CobrancaResult[];
}

export const cobrancaDataAtom = atom<CobrancaData>({
  valor: 0,
  pagadorNome: "",
  pagadorTaxNumber: "",
  pagadorEmail: "",
  pagadorTelefone: "",
  pagadorCep: "",
  pagadorBairro: "",
  pagadorRua: "",
  pagadorCidade: "",
  pagadorUf: "",
  pagadorNumero: "",
  pagadorComplemento: "",
  dataVencimento: "",
  groupName: "",
});

export const cobrancaHtmlAtom = atom<string | null>(null);
