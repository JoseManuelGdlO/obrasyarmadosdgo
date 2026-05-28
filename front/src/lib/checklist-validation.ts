export type ChecklistMissingField = {
  field: "operador" | "nivelCombustible" | `inspection:${string}`;
  label: string;
};

export function checklistFieldDomId(field: ChecklistMissingField["field"]): string {
  if (field === "operador") return "checklist-field-operador";
  if (field === "nivelCombustible") return "checklist-field-nivel-combustible";
  return `checklist-field-${field.replace("inspection:", "")}`;
}

export function findFirstMissingChecklistField(params: {
  operador: string;
  nivelCombustible: number | null;
  checkItems: Array<{ id: string; label: string }>;
  checkedItems: Record<string, boolean>;
}): ChecklistMissingField | null {
  if (!params.operador.trim()) {
    return { field: "operador", label: "Operador" };
  }
  if (params.nivelCombustible === null) {
    return { field: "nivelCombustible", label: "Nivel de gasolina" };
  }
  const unchecked = params.checkItems.find((item) => !params.checkedItems[item.id]);
  if (unchecked) {
    return { field: `inspection:${unchecked.id}`, label: unchecked.label };
  }
  return null;
}

export function missingChecklistFieldMessage(label: string) {
  return `Te falta llenar este campo: ${label}`;
}

export function scrollToChecklistField(field: ChecklistMissingField["field"]) {
  const id = checklistFieldDomId(field);
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export const checklistFieldHighlightClass =
  "rounded-lg ring-2 ring-destructive bg-destructive/5";

export function isChecklistFieldHighlighted(
  highlightedField: string | null,
  field: ChecklistMissingField["field"]
) {
  return highlightedField === field;
}
