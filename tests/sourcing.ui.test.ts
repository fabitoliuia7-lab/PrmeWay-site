import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer as createPortProbe } from 'node:net';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import type { ProductItem, Supplier } from '../src/sourcing/types';

let vite: ViteDevServer;
let Products: any, Dashboard: any, Module: any;
const noop = () => {};
const supplier: Supplier = { id: 'FOR-TEST', companyName: 'Fornecedor de teste', chineseName: '', supplierType: 'fabricante', country: 'China', province: '', city: '', website: '', originPlatform: 'Outro', status: 'ativo', trustLevel: 'padrao', internalRating: 1, notes: '', createdAt: '' };
const product: ProductItem = { id: 'PROD-TEST', namePt: 'Produto de teste', nameEn: 'Test product', nameCn: '测试产品', category: 'Teste', description: 'Descrição de teste', material: 'Teste', dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10, cbmUnit: 0.001 }, weightKg: 2, hsCode: '33030000', keywords: [], images: [], status: 'ativo', createdAt: '', indicativePrice: 12, currency: 'CNY', priceUnit: 'unidade', moq: 5, defaultSupplierId: supplier.id };
before(async () => {
  const port = await new Promise<number>((resolve, reject) => {
    const probe = createPortProbe(); probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => { const address = probe.address(); if (!address || typeof address === 'string') return reject(new Error('No free test port')); probe.close(() => resolve(address.port)); });
  });
  vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: { host: '127.0.0.1', port } }, appType: 'custom', esbuild: { jsx: 'automatic' }, optimizeDeps: { noDiscovery: true, entries: [] } });
  Products = (await vite.ssrLoadModule('/src/sourcing/components/ProductsView.tsx')).ProductsView;
  Dashboard = (await vite.ssrLoadModule('/src/sourcing/components/DashboardView.tsx')).DashboardView;
  Module = (await vite.ssrLoadModule('/src/sourcing/SourcingModule.tsx')).SourcingModule;
});
after(async () => { await vite?.close(); });

function renderProducts(items = [product]) {
  return renderToStaticMarkup(createElement(Products, { products: items, suppliers: [supplier], relations: [], categories: ['Teste'], defaultPorts: ['Guangzhou'], onSaveProduct: noop, onDeleteProduct: noop, onSaveRelation: noop, onDeleteRelation: noop, onSendToCalculator: noop }));
}
function buttonLabels(html: string) {
  return [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map(match => match[1].replace(/<[^>]*>/g, '').trim());
}

test('catalogue keeps price/currency/unit/MOQ/supplier and a single simulate action', () => {
  const html = renderProducts(); const labels = buttonLabels(html);
  assert.match(html, /data-sourcing-product-card="PROD-TEST"/);
  assert.match(html, /Produto de teste/); assert.match(html, /Fornecedor de teste/);
  assert.match(html, /CNY.*12\.00/); assert.match(html, /\/unidade/);
  assert.match(html, /Mínimo \(MOQ\)/);
  assert.equal(labels.filter(label => label === 'Simular').length, 1);
  assert.equal(labels.filter(label => label === 'Editar preço/MOQ').length, 1);
  assert.ok(!html.includes('CNY $'));
});

test('technical and alternative product names remain in a closed details region', () => {
  const html = renderProducts(); const details = html.match(/<details\b[^>]*>([\s\S]*?)<\/details>/)?.[0];
  assert.ok(details); assert.doesNotMatch(details, /<details[^>]*\bopen\b/);
  for (const value of ['Detalhes do produto', '33030000', '0.001', '2 kg', 'Test product', '测试产品']) assert.ok(details.includes(value), value);
  assert.match(html, /aria-label="Pesquisar produtos"/);
  assert.match(html, /aria-label="Categoria"/); assert.match(html, /aria-label="Estado do produto"/);
});

test('dashboard retains keyboard-accessible KPIs and creation actions without marketing copy', () => {
  const html = renderToStaticMarkup(createElement(Dashboard, { suppliers: [supplier], products: [product], orders: [], quotes: [], clients: [], onNavigateTab: noop, onOpenNewOrder: noop, onOpenNewSupplier: noop, onOpenNewProduct: noop, onSendProductToCalculator: noop }));
  assert.match(html, /Painel de sourcing/);
  for (const value of ['Fornecedores: 1', 'Produtos: 1', 'Pedidos ativos: 0', 'Cotações: 0']) assert.ok(html.includes(`aria-label="${value}"`));
  const labels = buttonLabels(html);
  for (const value of ['Novo pedido', 'Novo produto', '+ Novo fornecedor', 'Simular', 'Ver catálogo']) assert.ok(labels.includes(value), value);
  assert.doesNotMatch(html, /Selo Ouro|Guangzhou, Yiwu|Gestão centralizada|Precisa cotar um novo item|Demandas ativas/);
});

test('sourcing keeps every navigation destination and only one calculator return action', () => {
  const html = renderToStaticMarkup(createElement(Module, { onBackToCalculator: noop, onInjectIntoCalculator: noop }));
  const labels = buttonLabels(html);
  assert.equal(labels.filter(label => label === 'Calculadora').length, 1);
  for (const value of ['Painel', 'Fornecedores', 'Produtos', 'Pedidos', 'Cotações', 'Comparar', 'Documentos', 'Clientes', 'Definições']) assert.ok(labels.some(label => label === value || label.startsWith(value)), value);
  assert.match(html, /id="conteudo-principal"/); assert.match(html, /pw-sourcing/);
  assert.doesNotMatch(html, /Base de Fabricantes, Catálogos|Calculadora de Custos|China ➔ MZ/);
});

test('a product without a linked supplier shows an explicit pending supplier state', () => {
  const html = renderProducts([{ ...product, defaultSupplierId: undefined }]);
  assert.match(html, /Fornecedor:/);
  assert.match(html, /Por definir/);
});
