import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFriendlyPdfErrorMessage(error: unknown): string {
  const fallback = "Falha ao processar o PDF. Tente novamente em instantes.";

  if (!error || typeof error !== "object") return fallback;

  const code = "code" in error && typeof (error as any).code === "string" ? (error as any).code : "";
  const message = "message" in error && typeof (error as any).message === "string" ? (error as any).message : "";

  switch (code) {
    case "storage/unauthorized":
      return "Sem permissão para acessar o arquivo. Faça login novamente e tente de novo.";
    case "storage/canceled":
      return "Envio cancelado antes da conclusão.";
    case "storage/quota-exceeded":
      return "Limite do Storage atingido. Verifique o plano/projeto no Firebase.";
    case "storage/object-not-found":
      return "Arquivo não encontrado no Storage. Pode ter sido removido.";
    case "storage/retry-limit-exceeded":
      return "Tempo de envio excedido. Verifique sua conexão e tente novamente.";
    case "auth/network-request-failed":
      return "Falha de rede durante a autenticação. Verifique sua conexão.";
    case "permission-denied":
      return "Permissão negada para salvar dados do anexo.";
    default:
      break;
  }

  if (message) return message;
  return fallback;
}
