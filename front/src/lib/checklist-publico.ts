export type ChecklistPublicoMaquinaPayload = {
  id: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  placas: string;
  numeroSerie?: string;
};

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

export function openChecklistPrintWindow(maquina: ChecklistPublicoMaquinaPayload) {
  return window.open(`${buildChecklistPublicoUrl(maquina)}&print=1`, "_blank");
}
