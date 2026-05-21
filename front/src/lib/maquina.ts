export interface MaquinaCatalogRef {
  id: string;
  nombre: string;
}

export interface MaquinaWithCatalog {
  claseId?: string;
  tipoId?: string;
  clase?: MaquinaCatalogRef | null;
  tipoCatalogo?: MaquinaCatalogRef | null;
  tipo?: string;
}

export const getMaquinaTipoNombre = (m: MaquinaWithCatalog) =>
  m.tipoCatalogo?.nombre || m.tipo || "";

export const getMaquinaClaseNombre = (m: MaquinaWithCatalog) => m.clase?.nombre || "";

export const getMaquinaClaseTipoLabel = (m: MaquinaWithCatalog) => {
  const clase = getMaquinaClaseNombre(m);
  const tipo = getMaquinaTipoNombre(m);
  if (clase && tipo) return `${clase} · ${tipo}`;
  return tipo || clase || "";
};
