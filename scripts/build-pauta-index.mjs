import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const inputPath = resolve(root, 'src/data/pauta_aduaneira_at_oficial.json');
const outputPath = resolve(root, 'public/data/pauta-hs.json');
const officialUrl = 'https://www.at.gov.mz/servicos/pauta-aduaneira';

function rate(value, field) {
  if (value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100) return value;
  if (typeof value === 'string') {
    const percentage = value.trim().match(/^(\d+(?:\.\d+)?)%$/);
    if (percentage && Number(percentage[1]) <= 100) return Number(percentage[1]);
    if (field === 'ice' && value.length <= 200 && /(?:MZN|MZM)\s+Per\s+\d+(?:\.\d+)?\s+[A-Za-z]+/i.test(value)) return value.trim();
  }
  throw new Error(`Alíquota/regra inválida na base original (${field}); não foi presumida uma taxa.`);
}

const sourceBytes = await readFile(inputPath);
const sourceHash = createHash('sha256').update(sourceBytes).digest('hex');
const source = JSON.parse(sourceBytes);
if (!Array.isArray(source) || source.length === 0) throw new Error('A pauta original deve conter itens.');

const chapters = {};
const headings = {};
const codes = new Set();
const items = source.map((item, index) => {
  const code = String(item.codigo ?? '');
  if (!/^\d{8}$/.test(code) || codes.has(code)) throw new Error(`Código inválido/duplicado no item ${index}: ${code}`);
  codes.add(code);
  const description = String(item.descricao ?? '').trim();
  if (!description) throw new Error(`Descrição em falta: ${code}`);
  chapters[code.slice(0, 2)] = String(item.capDesc ?? '').trim();
  headings[code.slice(0, 4)] = String(item.subcapDesc ?? '').trim();
  return {
    code,
    description,
    rights: rate(item.direitos, 'direitos'),
    ice: rate(item.ice, 'ice'),
    iva: rate(item.iva, 'iva'),
    ...(item.unidade == null ? {} : { unit: String(item.unidade) }),
  };
});

const payload = {
  version: 'at-pauta-snapshot-v2',
  metadata: {
    source: 'Autoridade Tributária de Moçambique — cópia da pauta disponível; não é consulta em direto',
    sourceUrl: officialUrl,
    hash: `sha256:${sourceHash}`,
  },
  chapters,
  headings,
  items,
};
await mkdir(dirname(outputPath), { recursive: true });
const json = `${JSON.stringify(payload)}\n`;
await writeFile(outputPath, json, 'utf8');
console.log(`Índice HS: ${items.length} códigos, ${Buffer.byteLength(json)} bytes; fonte ${sourceHash}.`);
