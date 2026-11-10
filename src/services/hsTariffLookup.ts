import type { HsLookup, HsLookupResult, HsTariff } from './hsTariffTypes';

const SNAPSHOT_SOURCE_URL = 'https://www.at.gov.mz/servicos/pauta-aduaneira';
const DEFAULT_CATALOG_URL = '/data/pauta-hs.json';
const DEFAULT_API_URL = '/api/pauta/at-search';
const API_TIMEOUT_MS = 1_000;
const CATALOG_TIMEOUT_MS = 5_000;
const CACHE_TTL_MS = 60_000;

export type HsFetch = (
  input: RequestInfo | URL | string,
  init?: RequestInit,
) => Promise<Response>;

export interface HsLookupFactoryOptions {
  fetch?: HsFetch;
  catalogUrl?: string;
  apiUrl?: string;
  now?: () => number;
}

type Rate = number | null;

type StaticItem = {
  code?: unknown;
  codigo?: unknown;
  description?: unknown;
  descricao?: unknown;
  rights?: unknown;
  direitos?: unknown;
  direitosPerc?: unknown;
  ice?: unknown;
  icePerc?: unknown;
  iva?: unknown;
  ivaPerc?: unknown;
  cap?: unknown;
  subcap?: unknown;
  capDesc?: unknown;
  subcapDesc?: unknown;
  unit?: unknown;
  unidade?: unknown;
};

type StaticCatalogPayload = {
  version?: unknown;
  chapters?: Record<string, unknown>;
  headings?: Record<string, unknown>;
  metadata?: {
    source?: unknown;
    sourceUrl?: unknown;
    hash?: unknown;
  };
  items?: unknown;
};

type Catalog = {
  byCode: Map<string, HsTariff>;
  items: HsTariff[];
};

type CacheEntry = {
  expiresAt: number;
  result: HsLookupResult;
};

type ApiAttempt =
  | { status: 'available'; result: HsLookupResult }
  | { status: 'unavailable' };

function abortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('A consulta HS foi cancelada.', 'AbortError');
  }
  const error = new Error('A consulta HS foi cancelada.');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError();
}

async function awaitAbortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  throwIfAborted(signal);
  if (!signal) return promise;

  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(abortError());
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** Remove somente pontos, espaços e hífens; a validação numérica acontece no lookup. */
export function normalizeHsCode(query: string): string {
  return String(query ?? '').replace(/[.\s-]/g, '');
}

function parseRate(value: unknown): { ok: true; value: Rate } | { ok: false } {
  if (value === null) return { ok: true, value: null };
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 && value <= 100 ? { ok: true, value } : { ok: false };
  }
  if (typeof value !== 'string') return { ok: false };

  const match = value.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%?$/);
  const parsed = match ? Number(match[1]) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? { ok: true, value: parsed } : { ok: false };
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function firstField(item: StaticItem, keys: string[]): unknown {
  for (const key of keys) {
    if (hasOwn(item, key)) return item[key as keyof StaticItem];
  }
  return undefined;
}

function category(cap: string, capDesc: string, subcap: string, subcapDesc: string): string {
  const chapter = capDesc ? `Cap. ${cap}: ${capDesc}` : cap ? `Cap. ${cap}` : '';
  const heading = subcapDesc ? `Subposição ${subcap}: ${subcapDesc}` : subcap ? `Subposição ${subcap}` : '';
  return [chapter, heading].filter(Boolean).join(' — ');
}

function textField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toTariff(
  raw: StaticItem,
  source: 'api' | 'snapshot',
  sourceUrl: string,
  requireAllRates = true,
): HsTariff | null {
  const code = normalizeHsCode(String(firstField(raw, ['code', 'codigo']) ?? ''));
  if (!/^\d{8}$/.test(code)) return null;

  const descriptionValue = firstField(raw, ['description', 'descricao']);
  if (!isString(descriptionValue) || !descriptionValue.trim()) return null;

  const rateValues = [
    firstField(raw, ['rights', 'direitos', 'direitosPerc']),
    firstField(raw, ['ice', 'icePerc']),
    firstField(raw, ['iva', 'ivaPerc']),
  ];
  if (requireAllRates && rateValues.some((value) => value === undefined)) return null;

  const rawIce = rateValues[1];
  const iceRule = typeof rawIce === 'string' && rawIce.length <= 200 && /(?:MZN|MZM)\s+Per\s+\d+(?:\.\d+)?\s+[A-Za-z]+/i.test(rawIce) ? rawIce.trim() : undefined;
  const parsedRates = rateValues.map((value, index) => parseRate(index === 1 && iceRule ? null : value === undefined ? null : value));
  if (!parsedRates.every((parsed): parsed is { ok: true; value: Rate } => parsed.ok)) return null;

  const cap = textField(raw.cap) || code.slice(0, 2);
  const subcap = textField(raw.subcap) || code.slice(0, 4);
  const capDesc = textField(raw.capDesc);
  const subcapDesc = textField(raw.subcapDesc);
  const unitValue = firstField(raw, ['unit', 'unidade']);
  const description = descriptionValue.trim();
  const context = subcapDesc || capDesc;
  const readableDescription = /^-*\s*OUTR[AO]S?\s*$/iu.test(description) && context ? `${description} — ${context}` : description;

  return {
    codigo: code,
    descricao: readableDescription,
    direitosPerc: parsedRates[0].value,
    icePerc: parsedRates[1].value,
    ivaPerc: parsedRates[2].value,
    ...(iceRule ? { iceRule } : {}),
    categoria: category(cap, capDesc, subcap, subcapDesc),
    ...(typeof unitValue === 'string' && unitValue.trim() ? { unidade: unitValue.trim() } : {}),
    source,
    sourceUrl,
  };
}

function catalogFromPayload(payload: unknown, sourceUrl: string): Catalog | null {
  const items: unknown[] | null = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as StaticCatalogPayload).items)
      ? (payload as StaticCatalogPayload).items as unknown[]
      : null;
  if (!items || items.length === 0) return null;

  const metadata = !Array.isArray(payload) && payload && typeof payload === 'object' ? payload as StaticCatalogPayload : undefined;
  const tariffs: HsTariff[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') return null;
    const row = item as StaticItem;
    const code = normalizeHsCode(String(firstField(row, ['code', 'codigo']) ?? ''));
    const tariff = toTariff({
      ...row,
      capDesc: row.capDesc ?? metadata?.chapters?.[code.slice(0, 2)],
      subcapDesc: row.subcapDesc ?? metadata?.headings?.[code.slice(0, 4)],
    }, 'snapshot', sourceUrl);
    if (!tariff) return null;
    tariffs.push(tariff);
  }

  const byCode = new Map<string, HsTariff>();
  for (const tariff of tariffs) {
    if (byCode.has(tariff.codigo)) return null;
    byCode.set(tariff.codigo, tariff);
  }
  return { byCode, items: tariffs };
}

function apiPayloadItems(payload: unknown): unknown[] | null {
  if (!payload || typeof payload !== 'object') return null;
  const items = (payload as { items?: unknown }).items;
  return Array.isArray(items) ? items : null;
}

function apiTariffs(payload: unknown, sourceUrl: string): HsTariff[] | null {
  const items = apiPayloadItems(payload);
  if (!items) return null;

  const tariffs: HsTariff[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') return null;
    const tariff = toTariff(item as StaticItem, 'api', sourceUrl);
    if (!tariff) return null;
    tariffs.push(tariff);
  }
  return tariffs;
}

function choices(catalog: Catalog, prefix: string): HsLookupResult {
  const matches = catalog.items.filter((item) => item.codigo.startsWith(prefix));
  if (matches.length === 0) return { kind: 'not_found' };
  return { kind: 'choices', items: matches.slice(0, 20), total: matches.length };
}

function unavailableOrAbort(signal?: AbortSignal): ApiAttempt {
  throwIfAborted(signal);
  return { status: 'unavailable' };
}

function responseJson(response: Response): Promise<unknown> {
  if (typeof response.json === 'function') return response.json() as Promise<unknown>;
  return response.text().then((text) => JSON.parse(text));
}

/**
 * Creates an isolated lookup instance. The factory is intentionally exported to make fetch and
 * catalog loading injectable in unit tests; the default exports below are the browser singleton.
 */
export function createHsTariffLookup(options: HsLookupFactoryOptions = {}): {
  lookupHsCode: HsLookup;
  preloadHsCatalog: () => Promise<void>;
} {
  const fetchImpl = options.fetch ?? (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined);
  const catalogUrl = options.catalogUrl ?? DEFAULT_CATALOG_URL;
  const apiUrl = options.apiUrl ?? DEFAULT_API_URL;
  const now = options.now ?? (() => Date.now());
  let catalog: Catalog | undefined;
  let catalogPromise: Promise<Catalog> | undefined;
  const resultCache = new Map<string, CacheEntry>();

  async function loadCatalog(): Promise<Catalog> {
    if (!fetchImpl) throw new Error('fetch indisponível para carregar o catálogo HS.');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
    try {
      const response = await fetchImpl(catalogUrl, {
        method: 'GET',
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-cache',
        headers: { Accept: 'application/json' },
      });
      if (controller.signal.aborted) throw new Error('Tempo excedido ao carregar o catálogo HS.');
      if (!response.ok) throw new Error(`Catálogo HS indisponível (${response.status}).`);
      const payload = await responseJson(response);
      if (controller.signal.aborted) throw new Error('Tempo excedido ao carregar o catálogo HS.');
      const loaded = catalogFromPayload(payload, SNAPSHOT_SOURCE_URL);
      if (!loaded) throw new Error('Catálogo HS inválido.');
      return loaded;
    } finally {
      clearTimeout(timer);
    }
  }

  async function preloadHsCatalog(): Promise<void> {
    if (catalog) return;
    if (!catalogPromise) {
      catalogPromise = loadCatalog()
        .then((loaded) => {
          catalog = loaded;
          return loaded;
        })
        .finally(() => {
          catalogPromise = undefined;
        });
    }
    await catalogPromise;
  }

  function getCached(query: string): HsLookupResult | undefined {
    const entry = resultCache.get(query);
    if (!entry) return undefined;
    if (entry.expiresAt <= now()) {
      resultCache.delete(query);
      return undefined;
    }
    return entry.result;
  }

  function setCached(query: string, result: HsLookupResult): void {
    resultCache.set(query, { result, expiresAt: now() + CACHE_TTL_MS });
  }

  async function lookupApi(query: string, signal?: AbortSignal): Promise<ApiAttempt> {
    if (!fetchImpl) return unavailableOrAbort(signal);
    throwIfAborted(signal);

    const controller = new AbortController();
    let externallyAborted = false;
    const abortExternal = () => {
      externallyAborted = true;
      controller.abort();
    };
    signal?.addEventListener('abort', abortExternal, { once: true });
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const separator = apiUrl.includes('?') ? '&' : '?';
      const url = `${apiUrl}${separator}q=${encodeURIComponent(query)}&limit=30&page=1`;
      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: 'GET',
          signal: controller.signal,
          credentials: 'omit',
          headers: { Accept: 'application/json' },
        });
      } catch (error) {
        if (externallyAborted || signal?.aborted) throw abortError();
        return { status: 'unavailable' };
      }

      if (externallyAborted || signal?.aborted) throw abortError();
      if (controller.signal.aborted) return { status: 'unavailable' };
      if (!response.ok) return { status: 'unavailable' };

      let payload: unknown;
      try {
        payload = await responseJson(response);
      } catch {
        return { status: 'unavailable' };
      }
      if (externallyAborted || signal?.aborted) throw abortError();
      if (controller.signal.aborted) return { status: 'unavailable' };

      const sourceUrl = `${apiUrl}?q=${encodeURIComponent(query)}&limit=30&page=1`;
      const tariffs = apiTariffs(payload, sourceUrl);
      if (!tariffs) return { status: 'unavailable' };
      const exact = tariffs.find((tariff) => tariff.codigo === query);
      return exact
        ? { status: 'available', result: { kind: 'match', tariff: exact } }
        : { status: 'available', result: { kind: 'not_found' } };
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abortExternal);
    }
  }

  async function lookupHsCode(query: string, lookupOptions?: { signal?: AbortSignal }): Promise<HsLookupResult> {
    const signal = lookupOptions?.signal;
    throwIfAborted(signal);
    const normalized = normalizeHsCode(query);

    if (!normalized) return { kind: 'incomplete' };
    if (!/^\d+$/.test(normalized)) return { kind: 'invalid' };
    if (normalized.length < 4) return { kind: 'incomplete' };
    if (normalized.length > 8) return { kind: 'invalid' };
    if (normalized.length === 5 || normalized.length === 7) return { kind: 'incomplete' };

    const cached = getCached(normalized);
    if (cached) {
      throwIfAborted(signal);
      return cached;
    }

    let result: HsLookupResult;
    if (normalized.length === 4 || normalized.length === 6) {
      try {
        await awaitAbortable(preloadHsCatalog(), signal);
        result = choices(catalog!, normalized);
      } catch (error) {
        if (signal?.aborted) throw abortError();
        throw new Error('A base pautal está indisponível.');
      }
    } else {
      const api = await lookupApi(normalized, signal);
      if (api.status === 'available') {
        result = api.result;
      } else {
        try {
          await awaitAbortable(preloadHsCatalog(), signal);
          result = catalog!.byCode.has(normalized)
            ? { kind: 'match', tariff: catalog!.byCode.get(normalized)! }
            : { kind: 'not_found' };
        } catch (error) {
          if (signal?.aborted) throw abortError();
          throw new Error('A base pautal está indisponível.');
        }
      }
    }

    throwIfAborted(signal);
    setCached(normalized, result);
    return result;
  }

  return { lookupHsCode, preloadHsCatalog };
}

const defaultLookup = createHsTariffLookup();

export const lookupHsCode: HsLookup = defaultLookup.lookupHsCode;
export const preloadHsCatalog = defaultLookup.preloadHsCatalog;
