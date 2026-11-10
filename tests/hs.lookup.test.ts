import assert from 'node:assert/strict';
import test from 'node:test';
import { createHsTariffLookup, normalizeHsCode } from '../src/services/hsTariffLookup';
import type { HsFetch } from '../src/services/hsTariffLookup';

const rows = [
  {
    code: '84821000', description: '- ROLAMENTOS DE ESFERAS', rights: 7.5, ice: null, iva: 16,
    cap: '84', subcap: '8482', capDesc: 'Máquinas e aparelhos mecânicos', subcapDesc: 'Rolamentos', unit: 'Peça',
  },
  {
    code: '84822000', description: 'Rolamentos cónicos', rights: 5, ice: null, iva: 16,
    cap: '84', subcap: '8482', capDesc: 'Máquinas e aparelhos mecânicos', subcapDesc: 'Rolamentos',
  },
  {
    code: '84823000', description: 'Rolamentos de tambores', rights: 0, ice: 0, iva: null,
    cap: '84', subcap: '8482', capDesc: 'Máquinas e aparelhos mecânicos', subcapDesc: 'Rolamentos',
  },
  {
    code: '84824000', description: 'Rolamentos de agulhas', rights: 10, ice: null, iva: 16,
    cap: '84', subcap: '8482', capDesc: 'Máquinas e aparelhos mecânicos', subcapDesc: 'Rolamentos',
  },
  {
    code: '84825000', description: 'Outros rolamentos', rights: 20, ice: null, iva: 16,
    cap: '84', subcap: '8482', capDesc: 'Máquinas e aparelhos mecânicos', subcapDesc: 'Rolamentos',
  },
];

const catalogResponse = () => new Response(JSON.stringify({
  version: 'at-pauta-snapshot-v1',
  metadata: { source: 'snapshot', sourceUrl: 'https://www.at.gov.mz/servicos/pauta-aduaneira', hash: 'sha256:test' },
  items: rows,
}), { status: 200, headers: { 'content-type': 'application/json' } });

function apiResponse(items: unknown[], status = 200): Response {
  return new Response(JSON.stringify({ items, total: items.length }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function fetchWith({ api, catalog = true }: { api?: (url: string) => Response | Promise<Response>; catalog?: boolean } = {}): { fetch: HsFetch; calls: string[] } {
  const calls: string[] = [];
  const fetch: HsFetch = async (input, init) => {
    const url = String(input);
    calls.push(url);
    if (url.startsWith('/data/pauta-hs.json')) {
      if (!catalog) return new Response('<html>not found</html>', { status: 404 });
      return catalogResponse();
    }
    if (api) return api(url);
    throw new Error('API offline');
  };
  return { fetch, calls };
}

test('normaliza somente separadores permitidos e encontra 84821000 no snapshot', async () => {
  assert.equal(normalizeHsCode('84.821-000'), '84821000');
  const { fetch } = fetchWith();
  const lookup = createHsTariffLookup({ fetch }).lookupHsCode;
  const result = await lookup('84 8210 00');
  assert.equal(result.kind, 'match');
  if (result.kind === 'match') {
    assert.equal(result.tariff.codigo, '84821000');
    assert.equal(result.tariff.direitosPerc, 7.5);
    assert.equal(result.tariff.icePerc, null);
    assert.equal(result.tariff.source, 'snapshot');
  }
});

test('prefixo de seis ou quatro dígitos devolve escolhas e nunca aplica a primeira', async () => {
  const { fetch } = fetchWith();
  const lookup = createHsTariffLookup({ fetch }).lookupHsCode;
  const result = await lookup('84.82');
  assert.equal(result.kind, 'choices');
  if (result.kind === 'choices') {
    assert.equal(result.total, 5);
    assert.equal(result.items.length, 5);
    assert.equal(result.items[0].codigo, '84821000');
  }
});

test('códigos desconhecidos não capturam um item do prefixo', async () => {
  const { fetch } = fetchWith();
  const result = await createHsTariffLookup({ fetch }).lookupHsCode('84829999');
  assert.deepEqual(result, { kind: 'not_found' });
});

test('valida letras, tamanhos e preserva zero numérico e null', async () => {
  const { fetch } = fetchWith();
  const lookup = createHsTariffLookup({ fetch }).lookupHsCode;
  assert.deepEqual(await lookup('8482A'), { kind: 'invalid' });
  assert.deepEqual(await lookup('84'), { kind: 'incomplete' });
  assert.deepEqual(await lookup('848210000'), { kind: 'invalid' });
  const result = await lookup('84823000');
  assert.equal(result.kind, 'match');
  if (result.kind === 'match') {
    assert.equal(result.tariff.direitosPerc, 0);
    assert.equal(result.tariff.icePerc, 0);
    assert.equal(result.tariff.ivaPerc, null);
  }
});

test('usa a API quando a resposta contém o código exato válido', async () => {
  const apiItem = { ...rows[0], rights: '9.25', ice: '0%', iva: '16%' };
  const { fetch, calls } = fetchWith({ api: () => apiResponse([apiItem]) });
  const result = await createHsTariffLookup({ fetch }).lookupHsCode('84821000');
  assert.equal(result.kind, 'match');
  if (result.kind === 'match') {
    assert.equal(result.tariff.direitosPerc, 9.25);
    assert.equal(result.tariff.icePerc, 0);
    assert.equal(result.tariff.source, 'api');
  }
  assert.equal(calls.filter((url) => url.startsWith('/api/pauta/at-search')).length, 1);
});

test('API válida sem correspondência exata retorna not_found sem usar snapshot', async () => {
  const { fetch } = fetchWith({ api: () => apiResponse([]) });
  const result = await createHsTariffLookup({ fetch }).lookupHsCode('84821000');
  assert.deepEqual(result, { kind: 'not_found' });
});

test('404/HTML da API faz fallback ao índice estático', async () => {
  const { fetch } = fetchWith({ api: () => new Response('<html>Vercel</html>', { status: 404 }) });
  const result = await createHsTariffLookup({ fetch }).lookupHsCode('84821000');
  assert.equal(result.kind, 'match');
  if (result.kind === 'match') assert.equal(result.tariff.source, 'snapshot');
});

test('timeout de aproximadamente um segundo da API usa o snapshot', async () => {
  const { fetch } = fetchWith({
    api: (_url) => new Promise((resolve) => {
      setTimeout(() => resolve(apiResponse([{ ...rows[0], rights: 99 }])), 1_100);
    }),
  });
  const result = await createHsTariffLookup({ fetch }).lookupHsCode('84821000');
  assert.equal(result.kind, 'match');
  if (result.kind === 'match') {
    assert.equal(result.tariff.source, 'snapshot');
    assert.equal(result.tariff.direitosPerc, 7.5);
  }
});

test('cacheia consultas repetidas e repete após cancelar sem cachear resposta parcial', async () => {
  let apiCalls = 0;
  const { fetch, calls } = fetchWith({
    api: () => {
      apiCalls += 1;
      return apiResponse([{ ...rows[0], rights: 7.5 }]);
    },
  });
  const lookup = createHsTariffLookup({ fetch }).lookupHsCode;
  await lookup('84821000');
  await lookup('8482.10.00');
  assert.equal(apiCalls, 1);
  assert.equal(calls.filter((url) => url.startsWith('/api/pauta/at-search')).length, 1);

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => lookup('84821000', { signal: controller.signal }), { name: 'AbortError' });
});

test('cancelamento do prefixo propaga imediatamente sem cancelar o preload compartilhado', async () => {
  let releaseCatalog!: () => void;
  const catalogPromise = new Promise<Response>((resolve) => { releaseCatalog = () => resolve(catalogResponse()); });
  const { fetch } = fetchWith();
  const delayedFetch: HsFetch = async (input, init) => {
    if (String(input).startsWith('/data/pauta-hs.json')) return catalogPromise;
    return fetch(input, init);
  };
  const instance = createHsTariffLookup({ fetch: delayedFetch });
  const controller = new AbortController();
  const pending = instance.lookupHsCode('8482', { signal: controller.signal });
  controller.abort();
  await assert.rejects(() => pending, { name: 'AbortError' });
  releaseCatalog();
  await instance.preloadHsCatalog();
});

test('códigos com cinco/sete dígitos não consultam a API nem aplicam uma tarifa', async () => {
  const { fetch, calls } = fetchWith();
  const lookup = createHsTariffLookup({ fetch }).lookupHsCode;
  assert.deepEqual(await lookup('84821'), { kind: 'incomplete' });
  assert.deepEqual(await lookup('8482100'), { kind: 'incomplete' });
  assert.equal(calls.length, 0);
});

test('alíquotas negativas, acima de 100 ou inválidas na API não são aplicadas', async () => {
  for (const rights of [-1, 101, 'NaN', '101%']) {
    const { fetch } = fetchWith({ api: () => apiResponse([{ ...rows[0], rights }]) });
    const result = await createHsTariffLookup({ fetch }).lookupHsCode('84821000');
    assert.equal(result.kind, 'match');
    if (result.kind === 'match') {
      assert.equal(result.tariff.source, 'snapshot');
      assert.equal(result.tariff.direitosPerc, 7.5);
    }
  }
});

test('base indisponível não é anunciada como código inexistente nem cacheada', async () => {
  const { fetch, calls } = fetchWith({ catalog: false });
  const lookup = createHsTariffLookup({ fetch }).lookupHsCode;
  await assert.rejects(() => lookup('84821000'), /indisponível/);
  await assert.rejects(() => lookup('84821000'), /indisponível/);
  assert.equal(calls.filter(url => url.startsWith('/data/')).length, 2);
});

test('índice compacto recupera o contexto de descrições genéricas sem duplicar os capítulos', async () => {
  const fetch: HsFetch = async (input) => String(input).startsWith('/api/')
    ? new Response('not found', { status: 404 })
    : new Response(JSON.stringify({ chapters: { '30': 'Produtos farmacêuticos' }, headings: { '3004': 'Medicamentos' }, items: [{ code: '30049000', description: '- OUTROS', rights: 0, ice: null, iva: null }] }), { status: 200 });
  const result = await createHsTariffLookup({ fetch }).lookupHsCode('30049000');
  assert.equal(result.kind, 'match');
  if (result.kind === 'match') {
    assert.match(result.tariff.descricao, /Medicamentos/);
    assert.match(result.tariff.categoria, /Produtos farmacêuticos/);
    assert.equal(result.tariff.ivaPerc, null);
  }
});

test('ICE específico ou misto mantém a regra textual sem se transformar numa percentagem', async () => {
  for (const rule of ['0.0099 MZN Per 1 KG', '75% / 600 MZN Per 1 L', '75% / 640 MZM Per 1 KG']) {
    const { fetch } = fetchWith({ api: () => apiResponse([{ ...rows[0], ice: rule }]) });
    const result = await createHsTariffLookup({ fetch }).lookupHsCode('84821000');
    assert.equal(result.kind, 'match');
    if (result.kind === 'match') {
      assert.equal(result.tariff.icePerc, null);
      assert.equal(result.tariff.iceRule, rule);
    }
  }
});
