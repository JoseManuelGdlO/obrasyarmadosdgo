import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})/

/** Formatea YYYY-MM-DD en calendario local (sin desfase UTC). */
export function formatDateOnlyLocale(value: string | null | undefined, locale?: string) {
  if (!value) return ""
  const match = value.trim().match(DATE_ONLY_RE)
  if (!match) return value
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return new Date(year, month - 1, day).toLocaleDateString(locale)
}
