export type ChecklistPublicoMaquinaPayload = {
  id: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  placas: string;
  numeroSerie?: string;
};

export type ChecklistPrintDraft = {
  operador?: string;
  trabajadorId?: string;
  trabajadorNombre?: string;
  nivelCombustible?: number | null;
  checkedItems?: Record<string, boolean>;
  numericValues?: Record<string, string>;
  observaciones?: string;
  notas?: string;
};

const DRAFT_STORAGE_PREFIX = "checklist-print-draft:";

export function buildChecklistPublicoUrl(maquina: ChecklistPublicoMaquinaPayload) {
  const data = encodeURIComponent(
    JSON.stringify({
      id: maquina.id,
      nombre: maquina.nombre,
      marca: maquina.marca ?? "",
      modelo: maquina.modelo ?? "",
      placas: maquina.placas,
      serie: maquina.numeroSerie ?? "",
    })
  );
  return `${window.location.origin}/checklist-publico?data=${data}`;
}

export function stashChecklistPrintDraft(draft: ChecklistPrintDraft): string | null {
  try {
    const draftKey = crypto.randomUUID();
    sessionStorage.setItem(`${DRAFT_STORAGE_PREFIX}${draftKey}`, JSON.stringify(draft));
    return draftKey;
  } catch {
    return null;
  }
}

export function readChecklistPrintDraft(draftKey: string): ChecklistPrintDraft | null {
  const storageKey = `${DRAFT_STORAGE_PREFIX}${draftKey}`;
  try {
    const raw = sessionStorage.getItem(storageKey);
    sessionStorage.removeItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as ChecklistPrintDraft;
  } catch {
    sessionStorage.removeItem(storageKey);
    return null;
  }
}

export function openChecklistPrintWindow(
  maquina: ChecklistPublicoMaquinaPayload,
  draft?: ChecklistPrintDraft
): Window | null {
  let url = `${buildChecklistPublicoUrl(maquina)}&print=1`;
  if (draft) {
    const draftKey = stashChecklistPrintDraft(draft);
    if (!draftKey) return null;
    url += `&draftKey=${encodeURIComponent(draftKey)}`;
  }
  return window.open(url, "_blank");
}
