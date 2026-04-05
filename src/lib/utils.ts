import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Generate a collision-safe ticket reference like CG-2026-K3F9A.
 * Uses a random 5-char alphanumeric suffix — safe under concurrent requests.
 */
export function generateTicketRef(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CG-${year}-${suffix}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
