import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer as createPortProbe } from 'node:net';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { COMPANY, QUOTATION_URL, resolveSiteView, siteViewFromHash } from '../src/corporate/types';

let vite: ViteDevServer;
let Header: any;
let Landing: any;
let Footer: any;
const noop = () => {};
const headerProps = {
  activeView: 'landing', onNavigate: noop, isAuthReady: true, user: null,
  isAdmin: false, quoteCount: 0, onLogin: noop, onProfile: noop,
  onHistory: noop, onLogout: noop, onSupplierCheck: noop,
};
const footerProps = { onNavigate: noop, onLegal: noop, onSupplierCheck: noop, onInstall: noop, showInstall: true };

before(async () => {
  const port = await new Promise<number>((resolve, reject) => {
    const probe = createPortProbe();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      if (!address || typeof address === 'string') return reject(new Error('No free test port'));
      probe.close(() => resolve(address.port));
    });
  });
  vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: { host: '127.0.0.1', port } }, appType: 'custom', esbuild: { jsx: 'automatic' }, optimizeDeps: { noDiscovery: true, entries: [] } });
  Header = (await vite.ssrLoadModule('/src/corporate/CorporateHeader.tsx')).CorporateHeader;
  Landing = (await vite.ssrLoadModule('/src/corporate/CorporateLanding.tsx')).CorporateLanding;
  Footer = (await vite.ssrLoadModule('/src/corporate/CorporateFooter.tsx')).CorporateFooter;
});
after(async () => { await vite?.close(); });

test('legacy calculator and tracking navigation resolves to distinct tool views', () => {
  assert.equal(resolveSiteView('landing', 'simulador'), 'simulador');
  assert.equal(resolveSiteView('landing', 'rastreio'), 'rastreio');
  assert.equal(resolveSiteView('landing', 'serviços'), 'landing');
  assert.equal(resolveSiteView('sourcing'), 'sourcing');
});

test('all tool deep links restore their view, unknown and auth hashes stay on landing', () => {
  for (const view of ['simulador', 'rastreio', 'sourcing', 'cursos']) assert.equal(siteViewFromHash(`#${view}`), view);
  for (const hash of ['', '#serviços', '#a-empresa', '#mode=resetPassword&oobCode=test', '#not-a-view']) assert.equal(siteViewFromHash(hash), 'landing');
});

test('PWA shortcuts and cached legacy shortcuts open the intended tools', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.shortcuts.map((shortcut: { url: string }) => shortcut.url), ['/#rastreio', '/#simulador']);
  assert.equal(siteViewFromHash('#tracking'), 'rastreio');
  assert.equal(siteViewFromHash('#calculator'), 'simulador');
});

test('commercial page has clear copy and keeps lengthy tools out of the landing', () => {
  const html = renderToStaticMarkup(createElement(Landing, { onNavigate: noop }));
  assert.match(html, /<main id="conteudo-principal" tabindex="-1"/);
  assert.match(html, /<h1 id="hero-title"[^>]*>Excelência em cada importação\.<\/h1>/);
  assert.match(html, /China.*Moçambique/);
  assert.match(html, /Pedir cotação/);
  assert.match(html, /Simular custos/);
  assert.doesNotMatch(html, /<input|<video|24\/7|100%/);
  for (const id of ['inicio', 'serviços', 'como-funciona', 'a-empresa', 'contactos']) assert.ok(html.includes(`id="${id}"`));
});

test('commercial page uses contextual existing imagery and actual quotation/contact links', () => {
  const html = renderToStaticMarkup(createElement(Landing, { onNavigate: noop }));
  assert.match(html, /\/images\/operacao-portuaria\.jpg/);
  assert.match(html, /Imagem ilustrativa/);
  assert.ok(html.includes(QUOTATION_URL));
  assert.ok(html.includes(`mailto:${COMPANY.email}`));
  assert.ok(html.includes(COMPANY.phoneHref));
});

test('guest header preserves login, all tools, and identified closed menus', () => {
  const html = renderToStaticMarkup(createElement(Header, headerProps));
  assert.match(html, /Área do cliente/);
  assert.doesNotMatch(html, /Histórico|Administração/);
  for (const label of ['Serviços', 'Como funciona', 'A empresa', 'Ferramentas', 'Simular custos', 'Rastrear encomenda', 'Sourcing', 'Cursos', 'Verificação de fornecedores']) assert.ok(html.includes(label));
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-label="Abrir menu"/);
  assert.match(html, /aria-controls="pw-header-mobile-panel"/);
});

test('account header preserves profile, history and logout without implying admin for clients', () => {
  const props = { ...headerProps, user: { displayName: 'Cliente de teste', email: 'client@example.com', photoURL: null }, quoteCount: 3 };
  const client = renderToStaticMarkup(createElement(Header, props));
  for (const label of ['Cliente de teste', 'Perfil', 'Histórico', 'Sair', '3 cotações']) assert.ok(client.includes(label));
  assert.doesNotMatch(client, /Administração/);
  const admin = renderToStaticMarkup(createElement(Header, { ...props, isAdmin: true }));
  assert.match(admin, /Administração/);
});

test('footer preserves actual company data, legal actions and contact destinations', () => {
  const html = renderToStaticMarkup(createElement(Footer, footerProps));
  for (const value of [COMPANY.nuit, COMPANY.phoneHref, COMPANY.secondPhoneHref, `mailto:${COMPANY.email}`]) assert.ok(html.includes(value));
  assert.match(html, /Excelência em cada importação\./);
  for (const label of ['Termos', 'Privacidade', 'Compliance', 'Pauta Aduaneira', 'Verificar fornecedor', 'Instalar aplicação']) assert.ok(html.includes(label));
  assert.ok(html.includes(`© ${new Date().getFullYear()}`));
  assert.doesNotMatch(html, /href="#top"/);
});

test('installed application hides the redundant installation action', () => {
  const html = renderToStaticMarkup(createElement(Footer, { ...footerProps, showInstall: false }));
  assert.doesNotMatch(html, /Instalar aplicação/);
});
