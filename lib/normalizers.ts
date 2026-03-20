import { AREA_OPTIONS, COMPANY_OPTIONS, STATUS_OPTIONS } from "./constants";

const simplify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

const findByNormalizedValue = <T extends readonly string[]>(
  rawValue: unknown,
  options: T,
  aliases: Record<string, T[number]> = {}
): T[number] | undefined => {
  if (typeof rawValue !== "string") return undefined;
  const trimmed = rawValue.trim();
  if (!trimmed) return undefined;

  const exact = options.find((opt) => opt === trimmed);
  if (exact) return exact;

  const normalized = simplify(trimmed);
  if (aliases[normalized]) return aliases[normalized];

  return options.find((opt) => simplify(opt) === normalized);
};

const normalizeToKey = (rawValue: unknown): string => {
  if (typeof rawValue !== "string") return "";
  return simplify(rawValue.trim());
};

const companyAliases: Record<string, (typeof COMPANY_OPTIONS)[number]> = {
  ENGEARPB: "ENGEAR",
  CLIMAZONEPB: "CLIMAZONE",
};

const areaAliases: Record<string, (typeof AREA_OPTIONS)[number]> = {
  INSTAC: "INST. AC",
  INSTALACAOAC: "INST. AC",
  MANUTAC: "MANUT. AC",
  MANUTENCAOAC: "MANUT. AC",
  PRE: "PRÉ-INSTALAÇÃO",
  PREINSTALACAO: "PRÉ-INSTALAÇÃO",
  PREINST: "PRÉ-INSTALAÇÃO",
  GAS: "GÁS",
  EXAUST: "EXAUSTÃO",
  EXAUSTAO: "EXAUSTÃO",
  GASESMEDICINAIS: "GASES MEDICINAIS",
  GASMEDICINAIS: "GASES MEDICINAIS",
  PROJETOS: "PROJETO",
};

const statusAliases: Record<string, (typeof STATUS_OPTIONS)[number]> = {
  AINICAR: "A INICIAR",
  AINICIAR: "A INICIAR",
};

export const normalizeCompany = (rawValue: unknown) =>
{
  const mapped = findByNormalizedValue(rawValue, COMPANY_OPTIONS, companyAliases);
  if (mapped) return mapped;

  const key = normalizeToKey(rawValue);
  if (!key) return undefined;
  if (key.includes("ENGEAR")) return "ENGEAR";
  if (key.includes("CLIMAZONE") || key.includes("CLIMA")) return "CLIMAZONE";

  return undefined;
};

export const normalizeArea = (rawValue: unknown) =>
{
  const mapped = findByNormalizedValue(rawValue, AREA_OPTIONS, areaAliases);
  if (mapped) return mapped;

  const key = normalizeToKey(rawValue);
  if (!key) return undefined;

  if (key.includes("INST") && key.includes("AC")) return "INST. AC";
  if (key.includes("MANUT") && key.includes("AC")) return "MANUT. AC";
  if (key.startsWith("PRE") || key.includes("PREINST") || key.includes("INSTALACAO")) return "PRÉ-INSTALAÇÃO";
  if (key === "CI" || key.endsWith("CI")) return "CI";
  if (key.includes("GAS") && key.includes("MED")) return "GASES MEDICINAIS";
  if (key === "GAS") return "GÁS";
  if (key.includes("SAS")) return "SAS";
  if (key.includes("AQG")) return "AQG";
  if (key.includes("EXAUST")) return "EXAUSTÃO";
  if (key.includes("LOCACAO")) return "LOCAÇÃO";
  if (key.includes("PROJETO")) return "PROJETO";

  return undefined;
};

export const normalizeSaleStatus = (rawValue: unknown) => {
  if (rawValue === "Á INICAR") return "A INICIAR" as (typeof STATUS_OPTIONS)[number];

  const mapped = findByNormalizedValue(rawValue, STATUS_OPTIONS, statusAliases);
  if (mapped) return mapped;

  const key = normalizeToKey(rawValue);
  if (!key) return "A INICIAR"; // Default to A INICIAR if unknown
  
  if (key.includes("CANCEL")) return "CANCELADO";
  if (key.includes("FINAL") || key.includes("AGUARD") || key.includes("PAGAMENTO") || key.includes("FATURAD") || key.includes("RECEB")) return "FINALIZADA";
  if (key.includes("ANDAMENTO")) return "EM ANDAMENTO";
  if (key.includes("INIC")) return "A INICIAR";

  return "A INICIAR";
};
