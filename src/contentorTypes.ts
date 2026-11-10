export type ContentorType = '20_dry' | '40_dry' | '40_hc' | '20_reefer' | '40_reefer';

export interface ContentorSpec {
  tipo: ContentorType;
  nome: string;
  dimensoesInternas: string;
  capacidadeCbm: number;
  capacidadeCargaKg: number;
  freteSugeridoUsd: number;
  kudumbaSugeridoMzn: number;
  thcTerminalSugeridoMzn: number;
  inlandSugeridoMzn: number;
  descricao: string;
}

export const CONTENTOR_SPECS: Record<ContentorType, ContentorSpec> = {
  '20_dry': {
    tipo: '20_dry',
    nome: "Contentor 20' Dry (Standard)",
    dimensoesInternas: '5.90m x 2.35m x 2.39m',
    capacidadeCbm: 33.2,
    capacidadeCargaKg: 26000,
    freteSugeridoUsd: 2400,
    kudumbaSugeridoMzn: 3850,
    thcTerminalSugeridoMzn: 14500,
    inlandSugeridoMzn: 24000,
    descricao: 'Ideal para cargas pesadas e densas (rolamentos, peças, maquinários, minérios, ferragens).'
  },
  '40_dry': {
    tipo: '40_dry',
    nome: "Contentor 40' Dry (Standard)",
    dimensoesInternas: '12.03m x 2.35m x 2.39m',
    capacidadeCbm: 67.7,
    capacidadeCargaKg: 28000,
    freteSugeridoUsd: 3600,
    kudumbaSugeridoMzn: 6200,
    thcTerminalSugeridoMzn: 24500,
    inlandSugeridoMzn: 32000,
    descricao: 'Ideal para mercadorias volumosas de peso moderado (têxteis, plásticos, eletrónicos).'
  },
  '40_hc': {
    tipo: '40_hc',
    nome: "Contentor 40' High Cube (40' HC)",
    dimensoesInternas: '12.03m x 2.35m x 2.69m',
    capacidadeCbm: 76.3,
    capacidadeCargaKg: 28500,
    freteSugeridoUsd: 3850,
    kudumbaSugeridoMzn: 6200,
    thcTerminalSugeridoMzn: 24500,
    inlandSugeridoMzn: 32000,
    descricao: 'Maior altura interna. Excelente para mobiliário, calçado, caixas leves e paletes altas.'
  },
  '20_reefer': {
    tipo: '20_reefer',
    nome: "Contentor 20' Frigorífico (Reefer)",
    dimensoesInternas: '5.44m x 2.29m x 2.27m',
    capacidadeCbm: 28.3,
    capacidadeCargaKg: 24000,
    freteSugeridoUsd: 4500,
    kudumbaSugeridoMzn: 3850,
    thcTerminalSugeridoMzn: 22000,
    inlandSugeridoMzn: 30000,
    descricao: 'Controlo térmico para produtos perecíveis, fármacos e congelados.'
  },
  '40_reefer': {
    tipo: '40_reefer',
    nome: "Contentor 40' Frigorífico (Reefer HC)",
    dimensoesInternas: '11.58m x 2.29m x 2.50m',
    capacidadeCbm: 67.0,
    capacidadeCargaKg: 27000,
    freteSugeridoUsd: 6200,
    kudumbaSugeridoMzn: 6200,
    thcTerminalSugeridoMzn: 32000,
    inlandSugeridoMzn: 42000,
    descricao: 'Grande capacidade com refrigeração ativa contínua.'
  }
};

export interface ContentorItem {
  id: string;
  tipoContentor: ContentorType;
  descricaoCarga: string;
  codigoPautal: string; // HS Code
  pautaEstado?: 'pendente' | 'confirmada' | 'incompleta' | 'manual' | 'nao_encontrada';
  iceRegraPauta?: string;
  pesoTotalKg: number | string;
  volumeUtilizadoCbm: number | string;
  quantidade: number | string;
  portoOrigem: string;
  portoDestino: string;

  // 1. Valores Comerciais & Frete Internacional
  valorFobUsd: number | string;
  freteMaritimoUsd: number | string;
  seguroMaritimoUsd: number | string;

  // 2. Pauta Aduaneira de Moçambique (Estado / DU Oficial)
  direitosPerc: number | string;
  icePerc: number | string;
  ivaPerc: number | string;
  tsaAduaneiroMzn: number | string;
  mcnetMzn: number | string;
  kudumbaMzn: number | string;

  // 3. Taxas Portuárias e Terminais (DP World / Cornelder)
  thcPortuarioMzn: number | string;
  taxaSegurancaPortoMzn: number | string;
  armazenagemTerminalMzn: number | string;
  diasLivresTerminal: number;

  // 4. Linha de Navegação (Shipping Line / Agência Marítima)
  deliveryOrderMzn: number | string;
  limpezaDesmagnetizacaoMzn: number | string;
  caucaoContentorMzn: number | string;

  // 5. Despachante Aduaneiro & Logística Terrestre PrimeWay
  honorariosDespachanteMzn: number | string;
  documentacaoPastasMzn: number | string;
  destinoInland: string;
  transporteInlandMzn: number | string;

  // 6. Honorários & Agenciamento PrimeWay (Negociável)
  tipoHonorariosPrimeway: 'fixo' | 'percentual';
  honorariosPrimewayMzn: number | string;
  honorariosPrimewayPerc: number | string;
}

export const createCleanContentorItem = (tipo: ContentorType = '20_dry'): ContentorItem => {
  const spec = CONTENTOR_SPECS[tipo];
  return {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
    tipoContentor: tipo,
    descricaoCarga: 'Rolamentos Industriais e Acessórios Mecânicos',
    codigoPautal: '8482.10.00',
    pesoTotalKg: 18500,
    volumeUtilizadoCbm: 28,
    quantidade: 1,
    portoOrigem: 'Ningbo / Shanghai Port, China',
    portoDestino: 'Porto de Maputo (DP World Terminal)',

    // Valores Comerciais
    valorFobUsd: 16000,
    freteMaritimoUsd: spec.freteSugeridoUsd,
    seguroMaritimoUsd: 160, // ~1% do FOB

    // Pauta Aduaneira de Moçambique
    direitosPerc: 5, // 5% para bens de capital / rolamentos mecânicos
    icePerc: 0,
    ivaPerc: 16,
    tsaAduaneiroMzn: 1250,
    mcnetMzn: 1550,
    kudumbaMzn: spec.kudumbaSugeridoMzn,

    // Porto & Terminal
    thcPortuarioMzn: spec.thcTerminalSugeridoMzn,
    taxaSegurancaPortoMzn: 3500,
    armazenagemTerminalMzn: 0,
    diasLivresTerminal: 10,

    // Linha de Navegação
    deliveryOrderMzn: 8500,
    limpezaDesmagnetizacaoMzn: 4500,
    caucaoContentorMzn: 6000,

    // Despachante e Terrestre
    honorariosDespachanteMzn: 22000,
    documentacaoPastasMzn: 3500,
    destinoInland: 'maputo_matola',
    transporteInlandMzn: spec.inlandSugeridoMzn,

    // PrimeWay
    tipoHonorariosPrimeway: 'fixo',
    honorariosPrimewayMzn: 15000,
    honorariosPrimewayPerc: 2.5
  };
};

export interface ContentorCalculatedItem {
  item: ContentorItem;
  spec: ContentorSpec;
  qty: number;

  // Comercial
  fobUsdSingle: number;
  freteUsdSingle: number;
  seguroUsdSingle: number;
  cifUsdSingle: number;
  cifUsdTotal: number;
  cifMznTotal: number;

  // 1. Parte 1 - Alfândegas / Estado
  direitosMzn: number;
  iceMzn: number;
  ivaMzn: number;
  taxasPendentes: boolean;
  tsaMzn: number;
  mcnetMzn: number;
  kudumbaMzn: number;
  subtotalAlfandegaMzn: number;
  subtotalAlfandegaUsd: number;

  // 2. Parte 2 - Porto & Terminal
  thcMzn: number;
  segurancaPortoMzn: number;
  armazenagemMzn: number;
  subtotalPortoTerminalMzn: number;
  subtotalPortoTerminalUsd: number;

  // 3. Parte 3 - Linha de Navegação
  deliveryOrderMzn: number;
  limpezaMzn: number;
  caucaoMzn: number;
  subtotalLinhaNavegacaoMzn: number;
  subtotalLinhaNavegacaoUsd: number;

  // 4. Parte 4 - Logística Terrestre, Despachante & PrimeWay
  despachanteMzn: number;
  documentacaoMzn: number;
  transporteInlandMzn: number;
  honorariosPrimewayMzn: number;
  subtotalLogisticaPrimewayMzn: number;
  subtotalLogisticaPrimewayUsd: number;

  // Totais
  totalDespesasLocaisMzn: number; // Partes 2 + 3 + 4
  totalImportacaoMzn: number; // CIF + Impostos + Portuárias + Linha + Terrestre
  totalImportacaoUsd: number;

  // Métricas e Análise
  capacidadeTotalCbm: number;
  volumeUtilizadoCbm: number;
  taxaOcupacaoPerc: number;
  pesoTotalKg: number;
  custoPorCbmMzn: number;
  custoPorCbmUsd: number;

  // Comparativo com Grupagem LCL
  estimativaGrupagemLclUsd: number;
  diferencaFclVsLclUsd: number;
}
