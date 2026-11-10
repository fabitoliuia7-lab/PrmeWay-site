import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateContentores } from '../src/contentorCalculation';
import { createCleanContentorItem } from '../src/contentorTypes';

test('explicit numeric or string zero IVA remains zero instead of reverting to 16 percent', () => {
  for (const value of [0, '0']) {
    const item = { ...createCleanContentorItem(), ivaPerc: value };
    const result = calculateContentores([item], 64);
    assert.equal(result.itemsCalculated[0].ivaMzn, 0);
    assert.equal(result.totalIvaMzn, 0);
    assert.equal(result.taxasPendentes, false);
  }
});

test('missing or invalid rates are marked pending, not treated as confirmed zero or default IVA', () => {
  for (const rate of ['', ' ', 'not-a-rate', -1, 101]) {
    const item = { ...createCleanContentorItem(), ivaPerc: rate };
    const result = calculateContentores([item], 64);
    assert.equal(result.taxasPendentes, true);
    assert.equal(result.itemsCalculated[0].taxasPendentes, true);
    assert.equal(result.itemsCalculated[0].ivaMzn, 0);
  }
});

test('a loading, incomplete or unavailable lookup cannot export stale tariff totals', () => {
  for (const status of ['pendente', 'incompleta', 'nao_encontrada'] as const) {
    const result = calculateContentores([{ ...createCleanContentorItem(), pautaEstado: status }], 64);
    assert.equal(result.taxasPendentes, true);
  }
  const manual = calculateContentores([{ ...createCleanContentorItem(), pautaEstado: 'manual', icePerc: 0 }], 64);
  assert.equal(manual.taxasPendentes, false);
});

test('all container quantities still multiply purchase, freight, fees, weight and CBM', () => {
  const item = { ...createCleanContentorItem(), direitosPerc: 7.5, icePerc: 0, ivaPerc: 16 };
  const single = calculateContentores([item], 64);
  const double = calculateContentores([{ ...item, quantidade: 2 }], 64);
  for (const metric of ['totalFobUsd', 'totalFreteUsd', 'totalCifUsd', 'totalDireitosMzn', 'totalIvaMzn', 'totalTsaMzn', 'totalMcnetMzn', 'totalKudumbaMzn', 'totalGeralMzn', 'totalCbmOcupado', 'totalPesoKg'] as const) {
    assert.equal(double[metric], single[metric] * 2, metric);
  }
});

test('tax bases remain CIF, CIF plus DA, then CIF plus DA plus ICE', () => {
  const item = { ...createCleanContentorItem(), direitosPerc: 7.5, icePerc: 10, ivaPerc: 16 };
  const result = calculateContentores([item], 64).itemsCalculated[0];
  assert.equal(result.direitosMzn, result.cifMznTotal * 0.075);
  assert.equal(result.iceMzn, (result.cifMznTotal + result.direitosMzn) * 0.10);
  assert.equal(result.ivaMzn, (result.cifMznTotal + result.direitosMzn + result.iceMzn) * 0.16);
});

test('one incomplete container marks the aggregate total pending without affecting another item', () => {
  const valid = createCleanContentorItem();
  const pending = { ...createCleanContentorItem(), ivaPerc: '' };
  const result = calculateContentores([valid, pending], 64);
  assert.equal(result.itemsCalculated[0].taxasPendentes, false);
  assert.equal(result.itemsCalculated[1].taxasPendentes, true);
  assert.equal(result.taxasPendentes, true);
});
