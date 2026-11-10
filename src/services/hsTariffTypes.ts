export interface HsTariff {
  codigo: string;
  descricao: string;
  direitosPerc: number | null;
  icePerc: number | null;
  ivaPerc: number | null;
  iceRule?: string;
  categoria: string;
  unidade?: string;
  source: 'api' | 'snapshot';
  sourceUrl: string;
}

export type HsLookupResult =
  | { kind: 'match'; tariff: HsTariff }
  | { kind: 'choices'; items: HsTariff[]; total: number }
  | { kind: 'incomplete' }
  | { kind: 'invalid' }
  | { kind: 'not_found' };

export type HsLookup = (query: string, options?: { signal?: AbortSignal }) => Promise<HsLookupResult>;

export function formatHsCode(code: string): string {
  return /^\d{8}$/.test(code) ? `${code.slice(0, 4)}.${code.slice(4, 6)}.${code.slice(6, 8)}` : code;
}
