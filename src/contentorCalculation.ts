import {
  ContentorItem,
  ContentorCalculatedItem,
  CONTENTOR_SPECS
} from './contentorTypes';

export function calculateContentores(
  contentoresList: ContentorItem[],
  taxaCambioInput: number | string
) {
  const cambio = Number(taxaCambioInput) || 64;

  const itemsCalculated: ContentorCalculatedItem[] = contentoresList.map((c) => {
    const validRate = (value: number | string) => value !== '' && value !== undefined && value !== null && String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100;
    const rateOrZero = (value: number | string) => validRate(value) ? Number(value) : 0;
    const taxasPendentes = ![c.direitosPerc, c.icePerc, c.ivaPerc].every(validRate) || ['pendente', 'incompleta', 'nao_encontrada'].includes(c.pautaEstado || '');
    const spec = CONTENTOR_SPECS[c.tipoContentor] || CONTENTOR_SPECS['20_dry'];
    const qty = Math.max(1, Number(c.quantidade) || 1);

    const fobUsdSingle = Number(c.valorFobUsd) || 0;
    const freteUsdSingle = Number(c.freteMaritimoUsd) || 0;
    const seguroUsdSingle = Number(c.seguroMaritimoUsd) || 0;
    const cifUsdSingle = fobUsdSingle + freteUsdSingle + seguroUsdSingle;
    const cifUsdTotal = cifUsdSingle * qty;
    const cifMznTotal = cifUsdTotal * cambio;

    // 1. Alfândegas / Estado (DU Oficial)
    const direitosPerc = rateOrZero(c.direitosPerc);
    const direitosMzn = cifMznTotal * (direitosPerc / 100);

    const icePerc = rateOrZero(c.icePerc);
    const iceMzn = (cifMznTotal + direitosMzn) * (icePerc / 100);

    const ivaPerc = rateOrZero(c.ivaPerc);
    const ivaMzn = (cifMznTotal + direitosMzn + iceMzn) * (ivaPerc / 100);

    const tsaMzn = (Number(c.tsaAduaneiroMzn) || 0) * qty;
    const mcnetMzn = (Number(c.mcnetMzn) || 0) * qty;
    const kudumbaMzn = (Number(c.kudumbaMzn) || 0) * qty;

    const subtotalAlfandegaMzn = direitosMzn + iceMzn + ivaMzn + tsaMzn + mcnetMzn + kudumbaMzn;
    const subtotalAlfandegaUsd = subtotalAlfandegaMzn / cambio;

    // 2. Porto & Terminal (DP World / Cornelder)
    const thcMzn = (Number(c.thcPortuarioMzn) || 0) * qty;
    const segurancaPortoMzn = (Number(c.taxaSegurancaPortoMzn) || 0) * qty;
    const armazenagemMzn = (Number(c.armazenagemTerminalMzn) || 0) * qty;

    const subtotalPortoTerminalMzn = thcMzn + segurancaPortoMzn + armazenagemMzn;
    const subtotalPortoTerminalUsd = subtotalPortoTerminalMzn / cambio;

    // 3. Linha de Navegação (Shipping Line / Agência Marítima)
    const deliveryOrderMzn = (Number(c.deliveryOrderMzn) || 0) * qty;
    const limpezaMzn = (Number(c.limpezaDesmagnetizacaoMzn) || 0) * qty;
    const caucaoMzn = (Number(c.caucaoContentorMzn) || 0) * qty;

    const subtotalLinhaNavegacaoMzn = deliveryOrderMzn + limpezaMzn + caucaoMzn;
    const subtotalLinhaNavegacaoUsd = subtotalLinhaNavegacaoMzn / cambio;

    // 4. Logística Terrestre, Despachante & PrimeWay
    const despachanteMzn = (Number(c.honorariosDespachanteMzn) || 0) * qty;
    const documentacaoMzn = (Number(c.documentacaoPastasMzn) || 0) * qty;
    const transporteInlandMzn = (Number(c.transporteInlandMzn) || 0) * qty;

    let honorariosPrimewayMzn = 0;
    if (c.tipoHonorariosPrimeway === 'percentual') {
      const perc = Number(c.honorariosPrimewayPerc) || 0;
      honorariosPrimewayMzn = cifMznTotal * (perc / 100);
    } else {
      honorariosPrimewayMzn = (Number(c.honorariosPrimewayMzn) || 0) * qty;
    }

    const subtotalLogisticaPrimewayMzn = despachanteMzn + documentacaoMzn + transporteInlandMzn + honorariosPrimewayMzn;
    const subtotalLogisticaPrimewayUsd = subtotalLogisticaPrimewayMzn / cambio;

    // Totais
    const totalDespesasLocaisMzn = subtotalPortoTerminalMzn + subtotalLinhaNavegacaoMzn + subtotalLogisticaPrimewayMzn;
    const totalImportacaoMzn = cifMznTotal + subtotalAlfandegaMzn + totalDespesasLocaisMzn;
    const totalImportacaoUsd = totalImportacaoMzn / cambio;

    // Métricas e Análise
    const capacidadeTotalCbm = spec.capacidadeCbm * qty;
    const volumeUtilizadoCbm = Number(c.volumeUtilizadoCbm) > 0 ? (Number(c.volumeUtilizadoCbm) * qty) : capacidadeTotalCbm;
    const taxaOcupacaoPerc = Math.min(100, Math.max(1, (volumeUtilizadoCbm / capacidadeTotalCbm) * 100));
    const pesoTotalKg = (Number(c.pesoTotalKg) || 0) * qty;

    const custoPorCbmMzn = volumeUtilizadoCbm > 0 ? (totalImportacaoMzn / volumeUtilizadoCbm) : 0;
    const custoPorCbmUsd = volumeUtilizadoCbm > 0 ? (totalImportacaoUsd / volumeUtilizadoCbm) : 0;

    // Comparativo se fosse Grupagem LCL (ex: $380 por CBM frete + despacho DDP tudo incluso)
    const estimativaGrupagemLclUsd = (volumeUtilizadoCbm * 380) + (fobUsdSingle * qty);
    const diferencaFclVsLclUsd = estimativaGrupagemLclUsd - totalImportacaoUsd;

    return {
      item: c,
      spec,
      qty,
      fobUsdSingle,
      freteUsdSingle,
      seguroUsdSingle,
      cifUsdSingle,
      cifUsdTotal,
      cifMznTotal,
      direitosMzn,
      iceMzn,
      ivaMzn,
      taxasPendentes,
      tsaMzn,
      mcnetMzn,
      kudumbaMzn,
      subtotalAlfandegaMzn,
      subtotalAlfandegaUsd,
      thcMzn,
      segurancaPortoMzn,
      armazenagemMzn,
      subtotalPortoTerminalMzn,
      subtotalPortoTerminalUsd,
      deliveryOrderMzn,
      limpezaMzn,
      caucaoMzn,
      subtotalLinhaNavegacaoMzn,
      subtotalLinhaNavegacaoUsd,
      despachanteMzn,
      documentacaoMzn,
      transporteInlandMzn,
      honorariosPrimewayMzn,
      subtotalLogisticaPrimewayMzn,
      subtotalLogisticaPrimewayUsd,
      totalDespesasLocaisMzn,
      totalImportacaoMzn,
      totalImportacaoUsd,
      capacidadeTotalCbm,
      volumeUtilizadoCbm,
      taxaOcupacaoPerc,
      pesoTotalKg,
      custoPorCbmMzn,
      custoPorCbmUsd,
      estimativaGrupagemLclUsd,
      diferencaFclVsLclUsd
    };
  });

  // Totais Agregados de Todos os Contentores
  let totalFobUsd = 0;
  let totalFreteUsd = 0;
  let totalSeguroUsd = 0;
  let totalCifUsd = 0;
  let totalCifMzn = 0;

  let totalDireitosMzn = 0;
  let totalIceMzn = 0;
  let totalIvaMzn = 0;
  let totalTsaMzn = 0;
  let totalMcnetMzn = 0;
  let totalKudumbaMzn = 0;
  let totalAlfandegaMzn = 0;

  let totalThcMzn = 0;
  let totalSegurancaPortoMzn = 0;
  let totalArmazenagemMzn = 0;
  let totalPortoTerminalMzn = 0;

  let totalDeliveryOrderMzn = 0;
  let totalLimpezaMzn = 0;
  let totalCaucaoMzn = 0;
  let totalLinhaNavegacaoMzn = 0;

  let totalDespachanteMzn = 0;
  let totalDocumentacaoMzn = 0;
  let totalTransporteInlandMzn = 0;
  let totalHonorariosPrimewayMzn = 0;
  let totalLogisticaPrimewayMzn = 0;

  let totalGeralMzn = 0;
  let totalGeralUsd = 0;
  let totalCbmOcupado = 0;
  let totalPesoKg = 0;

  itemsCalculated.forEach((c) => {
    totalFobUsd += c.fobUsdSingle * c.qty;
    totalFreteUsd += c.freteUsdSingle * c.qty;
    totalSeguroUsd += c.seguroUsdSingle * c.qty;
    totalCifUsd += c.cifUsdTotal;
    totalCifMzn += c.cifMznTotal;

    totalDireitosMzn += c.direitosMzn;
    totalIceMzn += c.iceMzn;
    totalIvaMzn += c.ivaMzn;
    totalTsaMzn += c.tsaMzn;
    totalMcnetMzn += c.mcnetMzn;
    totalKudumbaMzn += c.kudumbaMzn;
    totalAlfandegaMzn += c.subtotalAlfandegaMzn;

    totalThcMzn += c.thcMzn;
    totalSegurancaPortoMzn += c.segurancaPortoMzn;
    totalArmazenagemMzn += c.armazenagemMzn;
    totalPortoTerminalMzn += c.subtotalPortoTerminalMzn;

    totalDeliveryOrderMzn += c.deliveryOrderMzn;
    totalLimpezaMzn += c.limpezaMzn;
    totalCaucaoMzn += c.caucaoMzn;
    totalLinhaNavegacaoMzn += c.subtotalLinhaNavegacaoMzn;

    totalDespachanteMzn += c.despachanteMzn;
    totalDocumentacaoMzn += c.documentacaoMzn;
    totalTransporteInlandMzn += c.transporteInlandMzn;
    totalHonorariosPrimewayMzn += c.honorariosPrimewayMzn;
    totalLogisticaPrimewayMzn += c.subtotalLogisticaPrimewayMzn;

    totalGeralMzn += c.totalImportacaoMzn;
    totalGeralUsd += c.totalImportacaoUsd;
    totalCbmOcupado += c.volumeUtilizadoCbm;
    totalPesoKg += c.pesoTotalKg;
  });

  return {
    cambio,
    itemsCalculated,
    taxasPendentes: itemsCalculated.some(item => item.taxasPendentes),
    totalFobUsd,
    totalFreteUsd,
    totalSeguroUsd,
    totalCifUsd,
    totalCifMzn,
    totalDireitosMzn,
    totalIceMzn,
    totalIvaMzn,
    totalTsaMzn,
    totalMcnetMzn,
    totalKudumbaMzn,
    totalAlfandegaMzn,
    totalThcMzn,
    totalSegurancaPortoMzn,
    totalArmazenagemMzn,
    totalPortoTerminalMzn,
    totalDeliveryOrderMzn,
    totalLimpezaMzn,
    totalCaucaoMzn,
    totalLinhaNavegacaoMzn,
    totalDespachanteMzn,
    totalDocumentacaoMzn,
    totalTransporteInlandMzn,
    totalHonorariosPrimewayMzn,
    totalLogisticaPrimewayMzn,
    totalGeralMzn,
    totalGeralUsd,
    totalCbmOcupado,
    totalPesoKg
  };
}
