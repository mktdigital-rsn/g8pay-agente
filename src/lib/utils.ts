import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanTaxNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function cleanCep(value: string) {
  return value.replace(/\D/g, "");
}

export function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
