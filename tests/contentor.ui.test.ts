import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer as createPortProbe } from 'node:net';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { createCleanContentorItem, type ContentorItem } from '../src/contentorTypes';
import { calculateContentores } from '../src/contentorCalculation';

let vite: ViteDevServer;
let Fcl: any;
const noop = () => {};
before(async () => {
  const port = await new Promise<number>((resolve, reject) => {
    const probe = createPortProbe(); probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      if (!address || typeof address === 'string') return reject(new Error('No free test port'));
      probe.close(() => resolve(address.port));
    });
  });
  vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: { host: '127.0.0.1', port } }, appType: 'custom', esbuild: { jsx: 'automatic' }, optimizeDeps: { noDiscovery: true, entries: [] } });
  Fcl = (await vite.ssrLoadModule('/src/ContentorFclSection.tsx')).ContentorFclSection;
});
after(async () => { await vite?.close(); });

function render(item: ContentorItem) {
  return renderToStaticMarkup(createElement(Fcl, {
    contentoresList: [item], activeContentorId: item.id, setActiveContentorId: noop,
    adicionarContentor: noop, duplicarContentor: noop, removerContentor: noop,
    atualizarContentorField: noop, atualizarContentorFields: noop, currentContentor: item,
    calculatedItem: calculateContentores([item], 64).itemsCalculated[0], taxaCambio: 64,
    moeda: 'MZN', formatoMoeda: (value: number) => value.toFixed(2),
  }));
}

test('FCL uses a single HS input and collapsible manual details without old category shortcuts', () => {
  const html = render({ ...createCleanContentorItem(), pautaEstado: 'manual', ivaPerc: 0 });
  assert.equal((html.match(/<input[^>]*\bid="hs-code-/g) || []).length, 1);
  assert.match(html, /Confirmar ou ajustar alíquotas e taxas de processamento/);
  assert.match(html, /<details/);
  assert.doesNotMatch(html, /Atalhos Rápidos|Auto-Taxas|Puxar da Pauta|Central Tempo Real|Auto-Preencher Taxas/);
});

test('strategic cost composition shows the actual IVA including zero and other percentages', () => {
  for (const iva of [0, 8.5]) {
    const html = render({ ...createCleanContentorItem(), pautaEstado: 'manual', ivaPerc: iva });
    assert.ok(html.includes(`IVA (${iva}%)`));
    assert.doesNotMatch(html, /IVA \(16%\)/);
    assert.match(html, /Composição estimada dos custos/);
  }
});

test('pending tariffs do not expose a strategic comparison or a confirmed State subtotal', () => {
  const html = render({ ...createCleanContentorItem(), ivaPerc: '', pautaEstado: 'incompleta' });
  assert.match(html, /A confirmar/);
  assert.doesNotMatch(html, /Composição estimada dos custos|Análise Estratégica &amp; Comparativo/);
});

test('physical limits show conditional warnings and container selection has a keyboard button', () => {
  const normal = render({ ...createCleanContentorItem(), pautaEstado: 'manual', ivaPerc: 0 });
  assert.doesNotMatch(normal, /Peso acima do limite|Volume acima da capacidade/);
  assert.match(normal, /aria-pressed="true"/);
  const overloaded = render({ ...createCleanContentorItem(), pautaEstado: 'manual', ivaPerc: 0, pesoTotalKg: 27000, volumeUtilizadoCbm: 34 });
  assert.match(overloaded, /role="alert"/);
  assert.match(overloaded, /Peso acima do limite/);
  assert.match(overloaded, /Volume acima da capacidade/);
});
