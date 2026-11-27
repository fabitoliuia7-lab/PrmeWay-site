import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import {
  Supplier,
  SupplierContact,
  ProductItem,
  ProductSupplierRelation,
  SourcingClient,
  SourcingOrder,
  Quotation,
  SourcingDocument,
  SourcingConfig
} from './types';

export enum SourcingOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: SourcingOperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleSourcingFirestoreError(
  error: unknown,
  operationType: SourcingOperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const SOURCING_COLLECTIONS = {
  suppliers: 'sourcing_suppliers',
  contacts: 'sourcing_contacts',
  products: 'sourcing_products',
  relations: 'sourcing_product_suppliers',
  clients: 'sourcing_clients',
  orders: 'sourcing_orders',
  quotes: 'sourcing_quotations',
  documents: 'sourcing_documents',
  settings: 'sourcing_settings',
} as const;

export const DEFAULT_CONFIG: SourcingConfig = {
  exchangeRates: {
    USD_MZN: 64.0,
    CNY_MZN: 8.85,
    USD_CNY: 7.23,
    USD_TO_MZN: 64.0,
    USD_TO_CNY: 7.23
  },
  defaultLoadingPorts: [
    'Guangzhou',
    'Ningbo',
    'Shenzhen (Yantian/Shekou)',
    'Shanghai',
    'Qingdao',
    'Xiamen',
    'Tianjin',
    'Yiwu (via Ningbo)'
  ],
  defaultChinesePorts: [
    'Guangzhou',
    'Ningbo',
    'Shenzhen (Yantian/Shekou)',
    'Shanghai',
    'Qingdao',
    'Xiamen',
    'Tianjin',
    'Yiwu (via Ningbo)'
  ],
  mozambiqueDestinations: [
    'Porto de Maputo (CFM)',
    'Porto da Beira (CdM)',
    'Porto de Nacala',
    'Armazém PrimeWay Maputo',
    'Matola',
    'Nampula',
    'Tete'
  ],
  productCategories: [
    'Construção & Ferragens',
    'Energia Solar & Eletricidade',
    'Mobiliário & Decoração',
    'Eletrónicos & Telecomunicações',
    'Máquinas & Equipamentos Industriais',
    'Embalagens & Plásticos',
    'Têxtil, Calçado & Vestuário',
    'Peças Automotivas & Acessórios',
    'Agricultura & Ferramentas'
  ]
};

// Realistic seed data for immediate high-value demonstration
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'FOR-0001',
    companyName: 'Guangzhou Apex Building Material Co., Ltd.',
    chineseName: '广州顶峰建材有限公司',
    supplierType: 'fabricante',
    country: 'China',
    province: 'Guangdong',
    city: 'Guangzhou',
    website: 'https://apexbuilding.en.made-in-china.com',
    originPlatform: 'Canton Fair',
    status: 'ativo',
    trustLevel: 'ouro',
    internalRating: 5,
    notes: 'Fornecedor auditado pessoalmente pela equipa PrimeWay na Feira de Cantão. Especialista em portas, janelas de alumínio e cerâmica para grandes obras em África.',
    createdAt: '2026-02-10T10:00:00Z'
  },
  {
    id: 'FOR-0002',
    companyName: 'Zhejiang Sunpro Power Co., Ltd.',
    chineseName: '浙江尚普光电科技有限公司',
    supplierType: 'fabricante',
    country: 'China',
    province: 'Zhejiang',
    city: 'Yiwu / Hangzhou',
    website: 'https://sunpropower.com',
    originPlatform: '1688',
    status: 'ativo',
    trustLevel: 'ouro',
    internalRating: 5,
    notes: 'Fabricante de painéis solares e inversores com certificação TUV/CE. Excelente suporte em inglês e garantia de 12 anos.',
    createdAt: '2026-02-15T09:30:00Z'
  },
  {
    id: 'FOR-0003',
    companyName: 'Foshan City Nanhai Goldensun Furniture Factory',
    chineseName: '佛山市南海金日家具有限公司',
    supplierType: 'fabricante',
    country: 'China',
    province: 'Guangdong',
    city: 'Foshan',
    website: 'https://goldensunfurniture.1688.com',
    originPlatform: '1688',
    status: 'ativo',
    trustLevel: 'verificado',
    internalRating: 4,
    notes: 'Pólo moveleiro de Shunde/Foshan. Cadeiras ergonómicas de escritório e sofás executivos de alto padrão.',
    createdAt: '2026-02-18T14:15:00Z'
  },
  {
    id: 'FOR-0004',
    companyName: 'Shenzhen KingSpec Electronics Technology Co., Ltd.',
    chineseName: '深圳市金胜电子科技有限公司',
    supplierType: 'fabricante',
    country: 'China',
    province: 'Guangdong',
    city: 'Shenzhen',
    website: 'https://kingspec.com',
    originPlatform: 'Alibaba',
    status: 'ativo',
    trustLevel: 'ouro',
    internalRating: 5,
    notes: 'Líder em SSDs, memória RAM e componentes de informática no polo de Huaqiangbei em Shenzhen.',
    createdAt: '2026-02-22T08:00:00Z'
  },
  {
    id: 'FOR-0005',
    companyName: 'Yiwu Great Dragon Import & Export Trading Co.',
    chineseName: '义乌大龙进出口贸易有限公司',
    supplierType: 'trading_company',
    country: 'China',
    province: 'Zhejiang',
    city: 'Yiwu',
    website: 'https://greatdragonyiwu.com',
    originPlatform: 'Contacto Direto',
    status: 'ativo',
    trustLevel: 'padrao',
    internalRating: 4,
    notes: 'Trading consolidado em Yiwu Futian Market. Ideal para pequenos lotes mistos de utilidades domésticas e ferramentas.',
    createdAt: '2026-03-01T11:20:00Z'
  }
];

export const INITIAL_CONTACTS: SupplierContact[] = [
  {
    id: 'CONT-0001',
    supplierId: 'FOR-0001',
    name: 'Lin Xiaowei (Kevin Lin)',
    role: 'Diretor de Exportação África',
    phone: '+86 138 0298 7741',
    whatsapp: '+86 138 0298 7741',
    wechat: 'kevin_apex_gz',
    email: 'kevin@apexbuilding.com',
    language: 'Inglês, Mandarim',
    isPrimary: true
  },
  {
    id: 'CONT-0002',
    supplierId: 'FOR-0001',
    name: 'Chen Mei (May Chen)',
    role: 'Assistente Comercial',
    phone: '+86 139 2210 5543',
    whatsapp: '+86 139 2210 5543',
    wechat: 'may_apex_sales',
    email: 'sales2@apexbuilding.com',
    language: 'Inglês',
    isPrimary: false
  },
  {
    id: 'CONT-0003',
    supplierId: 'FOR-0002',
    name: 'Zhang Wei (Victor Zhang)',
    role: 'Key Account Manager',
    phone: '+86 158 6890 1234',
    whatsapp: '+86 158 6890 1234',
    wechat: 'sunpro_victor',
    email: 'victor.zhang@sunpropower.com',
    language: 'Inglês, Mandarim',
    isPrimary: true
  },
  {
    id: 'CONT-0004',
    supplierId: 'FOR-0003',
    name: 'Li Feng (Frank Li)',
    role: 'Gerente Geral de Vendas',
    phone: '+86 137 0283 9922',
    whatsapp: '+86 137 0283 9922',
    wechat: 'frank_foshan_furn',
    email: 'export@goldensunfurniture.cn',
    language: 'Inglês',
    isPrimary: true
  },
  {
    id: 'CONT-0005',
    supplierId: 'FOR-0004',
    name: 'Elena Wu',
    role: 'International Business Lead',
    phone: '+86 186 7551 8899',
    whatsapp: '+86 186 7551 8899',
    wechat: 'elena_kingspec',
    email: 'elena.wu@kingspec.com',
    language: 'Inglês, Mandarim',
    isPrimary: true
  }
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'PROD-0001',
    namePt: 'Painel Solar Fotovoltaico Monocristalino 550W Tier 1',
    nameEn: '550W Monocrystalline Tier 1 Solar PV Module',
    nameCn: '550W单晶高效光伏太阳能板',
    category: 'Energia Solar & Eletricidade',
    description: 'Painel solar de alta eficiência de 144 células half-cell, vidro temperado antirreflexo 3.2mm, frame de alumínio anodizado prata.',
    material: 'Silício Monocristalino, Vidro Temperado e Alumínio',
    dimensions: {
      lengthCm: 227.8,
      widthCm: 113.4,
      heightCm: 3.5,
      cbmUnit: 0.0904
    },
    weightKg: 28.5,
    hsCode: '8541.43.00',
    keywords: ['solar', 'painel solar', 'energia', '550w', 'fotovoltaico', 'monocristalino', 'inversor'],
    images: ['https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80'],
    status: 'ativo',
    createdAt: '2026-02-15T12:00:00Z',
    indicativePrice: 62.50,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 62,
    defaultSupplierId: 'FOR-0002'
  },
  {
    id: 'PROD-0002',
    namePt: 'Porcelanato Polido Esmaltado 60x60cm Calacatta Gold',
    nameEn: '60x60cm Calacatta Gold Glazed Polished Porcelain Floor Tile',
    nameCn: '600x600mm 金丝白全抛釉瓷砖',
    category: 'Construção & Ferragens',
    description: 'Piso cerâmico de porcelanato super gloss anti-manchas, espessura 9.5mm, 4 peças por caixa (1.44m²/cx), alta resistência ao tráfego.',
    material: 'Argila refinada, esmalte cerâmico vitrificado',
    dimensions: {
      lengthCm: 60.5,
      widthCm: 60.5,
      heightCm: 4.2,
      cbmUnit: 0.0154
    },
    weightKg: 31.0,
    hsCode: '6907.21.00',
    keywords: ['porcelanato', 'piso', 'ceramica', 'azulejo', 'construcao', 'acabamento', 'calacatta'],
    images: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop&q=80'],
    status: 'ativo',
    createdAt: '2026-02-18T10:00:00Z',
    indicativePrice: 6.80,
    currency: 'USD',
    priceUnit: 'caixa',
    moq: 500,
    defaultSupplierId: 'FOR-0001'
  },
  {
    id: 'PROD-0003',
    namePt: 'Cadeira de Escritório Ergonómica com Apoio Lombar 3D',
    nameEn: 'High Back Ergonomic Mesh Office Chair with 3D Armrest',
    nameCn: '高背网布人体工学办公椅',
    category: 'Mobiliário & Decoração',
    description: 'Cadeira executiva com encosto em malha respirável de alta densidade, pistão a gás classe 4 com certificação BIFMA, base estrela em alumínio.',
    material: 'Malha Mesh nylon, polímero reforçado e alumínio fundido',
    dimensions: {
      lengthCm: 70.0,
      widthCm: 32.0,
      heightCm: 64.0,
      cbmUnit: 0.143
    },
    weightKg: 16.5,
    hsCode: '9401.31.00',
    keywords: ['cadeira', 'escritorio', 'ergonomica', 'computador', 'moveis', 'office'],
    images: ['https://images.unsplash.com/photo-1580481077194-43b177893dd4?w=600&auto=format&fit=crop&q=80'],
    status: 'ativo',
    createdAt: '2026-02-20T11:00:00Z',
    indicativePrice: 38.00,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 50,
    defaultSupplierId: 'FOR-0003'
  },
  {
    id: 'PROD-0004',
    namePt: 'Unidade SSD NVMe M.2 PCIe 4.0 1TB de Alta Velocidade',
    nameEn: '1TB M.2 PCIe 4.0 NVMe High Speed Solid State Drive',
    nameCn: '1TB M.2 PCIe 4.0 高速固态硬盘',
    category: 'Eletrónicos & Telecomunicações',
    description: 'Leitura sequencial até 5000 MB/s, dissipador térmico em grafeno integrado, ideal para notebooks corporativos e desktops.',
    material: 'PCB, chips 3D NAND TLC, liga de grafeno',
    dimensions: {
      lengthCm: 8.0,
      widthCm: 2.2,
      heightCm: 0.35,
      cbmUnit: 0.00006
    },
    weightKg: 0.045,
    hsCode: '8471.70.00',
    keywords: ['ssd', 'nvme', 'computador', 'armazenamento', 'disco', 'ti', 'informatica'],
    images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80'],
    status: 'ativo',
    createdAt: '2026-02-25T14:30:00Z',
    indicativePrice: 32.50,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 100,
    defaultSupplierId: 'FOR-0004'
  }
];

export const INITIAL_RELATIONS: ProductSupplierRelation[] = [
  {
    id: 'REL-0001',
    productId: 'PROD-0001',
    supplierId: 'FOR-0002',
    supplierRef: 'SPP-550M-144',
    indicativePrice: 62.50,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 62,
    monthlyCapacity: '100,000 unidades / mês',
    leadTimeDays: 15,
    incoterm: 'FOB',
    loadingPort: 'Ningbo',
    customizationAvailable: true,
    sampleAvailable: true,
    sampleCost: 80.00,
    priceDate: '2026-02-16',
    infoSource: 'Cotação oficial assinada via e-mail',
    notes: 'Preço válido para pedidos acima de 1 container 40HQ (620 peças). Embalagem reforçada para transporte marítimo.'
  },
  {
    id: 'REL-0002',
    productId: 'PROD-0001',
    supplierId: 'FOR-0005',
    supplierRef: 'YW-SOLAR-550',
    indicativePrice: 66.00,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 10,
    monthlyCapacity: '2,000 unidades / mês',
    leadTimeDays: 7,
    incoterm: 'EXW',
    loadingPort: 'Yiwu (via Ningbo)',
    customizationAvailable: false,
    sampleAvailable: true,
    sampleCost: 90.00,
    priceDate: '2026-02-28',
    infoSource: 'Visita ao mercado de Yiwu',
    notes: 'Preço ligeiramente mais alto por ser trading, porém permite compras em lotes pequenos fracionados (LCL).'
  },
  {
    id: 'REL-0003',
    productId: 'PROD-0002',
    supplierId: 'FOR-0001',
    supplierRef: 'APX-CAL-6060',
    indicativePrice: 6.80,
    currency: 'USD',
    priceUnit: 'caixa',
    moq: 500,
    monthlyCapacity: '50 containers / mês',
    leadTimeDays: 20,
    incoterm: 'FOB',
    loadingPort: 'Guangzhou',
    customizationAvailable: true,
    sampleAvailable: true,
    sampleCost: 0,
    priceDate: '2026-02-12',
    infoSource: 'Catálogo Feira de Cantão',
    notes: 'Amostras gratuitas mediante pagamento do frete expresso pelo cliente. Embalagem paletizada reforçada com cantoneiras plásticas.'
  },
  {
    id: 'REL-0004',
    productId: 'PROD-0003',
    supplierId: 'FOR-0003',
    supplierRef: 'GS-CHAIR-809',
    indicativePrice: 38.50,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 50,
    monthlyCapacity: '15,000 unidades / mês',
    leadTimeDays: 18,
    incoterm: 'FOB',
    loadingPort: 'Guangzhou',
    customizationAvailable: true,
    sampleAvailable: true,
    sampleCost: 50.00,
    priceDate: '2026-02-19',
    infoSource: 'Negociação direta WeChat',
    notes: 'Opção de gravação do logotipo da empresa compradora no encosto a partir de 200 peças sem custo adicional.'
  },
  {
    id: 'REL-0005',
    productId: 'PROD-0004',
    supplierId: 'FOR-0004',
    supplierRef: 'KS-NVME-1TB-G4',
    indicativePrice: 42.00,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 100,
    monthlyCapacity: '200,000 unidades / mês',
    leadTimeDays: 10,
    incoterm: 'FOB',
    loadingPort: 'Shenzhen (Yantian/Shekou)',
    customizationAvailable: true,
    sampleAvailable: true,
    sampleCost: 45.00,
    priceDate: '2026-02-23',
    infoSource: 'Lista de preços semanal do distribuidor',
    notes: 'Garantia de substituição imediata em caso de falha de lote.'
  }
];

export const INITIAL_CLIENTS: SourcingClient[] = [
  {
    id: 'CLI-0001',
    name: 'Eng. António Cuna',
    company: 'Cuna & Filhos Construções, Lda.',
    nuit: '400192837',
    phone: '+258 84 391 2299',
    email: 'compras@cunaconstrucoes.co.mz',
    city: 'Maputo',
    address: 'Av. 24 de Julho nº 1420, Maputo',
    notes: 'Cliente corporativo frequente. Importa materiais de acabamento e cerâmica para condomínios residenciais.',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'CLI-0002',
    name: 'Fátima Machel',
    company: 'Soluções Energéticas de Moçambique, SA',
    nuit: '400876543',
    phone: '+258 82 550 4411',
    email: 'fatima@solenergiamoz.com',
    city: 'Matola',
    address: 'Zona Industrial da Matola, Parcela 8B',
    notes: 'Projetos rurais de eletrificação com energia solar. Demanda por painéis de 550W e baterias de lítio.',
    createdAt: '2026-02-01T10:30:00Z'
  },
  {
    id: 'CLI-0003',
    name: 'Carlos Tembe',
    company: 'TechStore Maputo Importações',
    nuit: '400654321',
    phone: '+258 87 123 4567',
    email: 'carlos@techstore.co.mz',
    city: 'Maputo',
    address: 'Shopping 24, Loja 14, Maputo',
    notes: 'Distribuição de hardware e periféricos de informática.',
    createdAt: '2026-02-10T15:00:00Z'
  }
];

export const INITIAL_ORDERS: SourcingOrder[] = [
  {
    id: 'PED-0001',
    clientId: 'CLI-0002',
    productId: 'PROD-0001',
    requestedProduct: '620 Painéis Solares 550W (1 Container 40HQ)',
    description: 'Fornecimento completo para projeto de eletrificação em Inhambane. Necessário certificados TUV e relatórios de teste de flash de cada painel.',
    quantity: 620,
    budget: 42000,
    currency: 'USD',
    mozambiqueDestination: 'Porto de Maputo (CFM)',
    deadline: '2026-05-30',
    customization: 'Etiquetas personalizadas com número do projeto e logotipo da Soluções Energéticas.',
    status: 'cotacoes_recebidas',
    priority: 'urgente',
    assignedTo: 'Equipa PrimeWay Guangzhou',
    createdAt: '2026-02-20T14:00:00Z'
  },
  {
    id: 'PED-0002',
    clientId: 'CLI-0001',
    productId: 'PROD-0002',
    requestedProduct: '1,500 caixas de Porcelanato 60x60cm Calacatta Gold',
    description: 'Revestimento para 24 apartamentos no Bairro do Triunfo, Maputo. Requer teste de absorção de água menor que 0.5%.',
    quantity: 1500,
    budget: 12000,
    currency: 'USD',
    mozambiqueDestination: 'Porto de Maputo (CFM)',
    deadline: '2026-06-15',
    customization: 'Embalagem neutra em caixas de papelão reforçado com código de barras.',
    status: 'em_pesquisa',
    priority: 'alta',
    assignedTo: 'Carlos Mondlane (PrimeWay)',
    createdAt: '2026-02-25T09:15:00Z'
  },
  {
    id: 'PED-0003',
    clientId: 'CLI-0003',
    productId: 'PROD-0004',
    requestedProduct: '500 SSDs M.2 NVMe 1TB PCIe 4.0',
    description: 'Reposição de stock para revenda nas lojas de Maputo e Matola. Envio preferencial via aéreo express.',
    quantity: 500,
    budget: 22000,
    currency: 'USD',
    mozambiqueDestination: 'Armazém PrimeWay Maputo',
    deadline: '2026-04-10',
    customization: 'Caixa blister individual para venda no retalho em português.',
    status: 'proposta_enviada',
    priority: 'media',
    assignedTo: 'Equipa PrimeWay Maputo',
    createdAt: '2026-03-01T11:00:00Z'
  }
];

export const INITIAL_QUOTES: Quotation[] = [
  {
    id: 'COT-0001',
    orderId: 'PED-0001',
    supplierId: 'FOR-0002',
    productId: 'PROD-0001',
    requestDate: '2026-02-21',
    responseDate: '2026-02-23',
    validUntil: '2026-03-31',
    unitPrice: 62.00,
    quantity: 620,
    currency: 'USD',
    incoterm: 'FOB',
    loadingPort: 'Ningbo',
    estimatedFreight: 3850,
    productionLeadTimeDays: 14,
    paymentTerms: '30% T/T adiantado, 70% contra cópia do Bill of Lading (B/L)',
    internalRating: 5,
    status: 'selecionada',
    notes: 'Melhor proposta técnica e comercial. Preço unitário caiu de $62.50 para $62.00 para fechar container cheio.',
    createdAt: '2026-02-23T16:00:00Z'
  },
  {
    id: 'COT-0002',
    orderId: 'PED-0001',
    supplierId: 'FOR-0005',
    productId: 'PROD-0001',
    requestDate: '2026-02-21',
    responseDate: '2026-02-24',
    validUntil: '2026-03-25',
    unitPrice: 65.50,
    quantity: 620,
    currency: 'USD',
    incoterm: 'FOB',
    loadingPort: 'Ningbo',
    estimatedFreight: 4100,
    productionLeadTimeDays: 20,
    paymentTerms: '50% depósito, 50% antes do embarque',
    internalRating: 3,
    status: 'rejeitada',
    notes: 'Valor unitário $3.50 mais caro por unidade e condições de pagamento menos flexíveis.',
    createdAt: '2026-02-24T10:30:00Z'
  },
  {
    id: 'COT-0003',
    orderId: 'PED-0003',
    supplierId: 'FOR-0004',
    productId: 'PROD-0004',
    requestDate: '2026-03-01',
    responseDate: '2026-03-02',
    validUntil: '2026-04-05',
    unitPrice: 41.50,
    quantity: 500,
    currency: 'USD',
    incoterm: 'FOB',
    loadingPort: 'Shenzhen',
    estimatedFreight: 950,
    productionLeadTimeDays: 7,
    paymentTerms: '100% T/T antes da expedição com garantia Trade Assurance',
    internalRating: 5,
    status: 'selecionada',
    notes: 'Excelente prazo de produção (7 dias). Cotação enviada ao cliente Carlos Tembe.',
    createdAt: '2026-03-02T13:00:00Z'
  }
];

export const INITIAL_DOCUMENTS: SourcingDocument[] = [
  {
    id: 'DOC-0001',
    entityType: 'fornecedor',
    entityId: 'FOR-0001',
    title: 'Catálogo Geral Cerâmica & Alumínio Apex 2026 (PDF)',
    docType: 'catalogo_pdf',
    fileUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80',
    fileSize: '18.4 MB',
    uploadedAt: '2026-02-11T14:00:00Z',
    notes: 'Catálogo de linhas completas para exportação.'
  },
  {
    id: 'DOC-0002',
    entityType: 'fornecedor',
    entityId: 'FOR-0002',
    title: 'Licença Comercial e Certificação TUV Rheinland Sunpro Power',
    docType: 'licenca_comercial',
    fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    fileSize: '4.2 MB',
    uploadedAt: '2026-02-16T11:20:00Z',
    notes: 'Documento original verificado pela PrimeWay.'
  },
  {
    id: 'DOC-0003',
    entityType: 'produto',
    entityId: 'PROD-0001',
    title: 'Ficha Técnica Completa Painel Sunpro 550W Half-Cell',
    docType: 'ficha_tecnica',
    fileUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
    fileSize: '2.1 MB',
    uploadedAt: '2026-02-17T09:00:00Z',
    notes: 'Dados elétricos STC, curvas IV e coeficiente de temperatura.'
  }
];

// LocalStorage helpers with fallback
export function loadFromLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`primeway_sourcing_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Erro ao carregar do localStorage [${key}]:`, e);
    return fallback;
  }
}

export function saveToLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`primeway_sourcing_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error(`Erro ao gravar no localStorage [${key}]:`, e);
  }
}

// Global state container for Sourcing
export interface SourcingStore {
  suppliers: Supplier[];
  contacts: SupplierContact[];
  products: ProductItem[];
  relations: ProductSupplierRelation[];
  clients: SourcingClient[];
  orders: SourcingOrder[];
  quotes: Quotation[];
  documents: SourcingDocument[];
  config: SourcingConfig;
  settings: SourcingConfig;
}

export function getInitialSourcingStore(): SourcingStore {
  const loadedConfig = loadFromLocal<SourcingConfig>('config', DEFAULT_CONFIG);
  const loadedSuppliers = loadFromLocal<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
  const loadedContacts = loadFromLocal<SupplierContact[]>('contacts', INITIAL_CONTACTS);
  const loadedRelations = loadFromLocal<ProductSupplierRelation[]>('relations', INITIAL_RELATIONS);
  const rawProducts = loadFromLocal<ProductItem[]>('products', INITIAL_PRODUCTS);

  const loadedProducts = rawProducts.map(prod => {
    const cleanImages = (prod.images || []).filter(img => img && img !== '/IMG-20260215-WA0003.jpg');
    const matchedRelations = loadedRelations.filter(r => r.productId === prod.id);
    const bestRel = matchedRelations.length > 0 ? [...matchedRelations].sort((a, b) => a.indicativePrice - b.indicativePrice)[0] : undefined;

    return {
      ...prod,
      images: cleanImages,
      indicativePrice: prod.indicativePrice ?? bestRel?.indicativePrice ?? 0,
      currency: prod.currency ?? bestRel?.currency ?? 'USD',
      priceUnit: prod.priceUnit ?? bestRel?.priceUnit ?? 'unidade',
      moq: prod.moq ?? bestRel?.moq ?? 1,
      defaultSupplierId: prod.defaultSupplierId ?? bestRel?.supplierId
    };
  });

  return {
    suppliers: loadedSuppliers,
    contacts: loadedContacts,
    products: loadedProducts,
    relations: loadedRelations,
    clients: loadFromLocal<SourcingClient[]>('clients', INITIAL_CLIENTS),
    orders: loadFromLocal<SourcingOrder[]>('orders', INITIAL_ORDERS),
    quotes: loadFromLocal<Quotation[]>('quotes', INITIAL_QUOTES),
    documents: loadFromLocal<SourcingDocument[]>('documents', INITIAL_DOCUMENTS),
    config: loadedConfig,
    settings: loadedConfig
  };
}

export function loadSourcingData(): SourcingStore {
  return getInitialSourcingStore();
}

export function saveSourcingData(store: SourcingStore): void {
  saveToLocal('suppliers', store.suppliers);
  saveToLocal('contacts', store.contacts);
  saveToLocal('products', store.products);
  saveToLocal('relations', store.relations);
  saveToLocal('clients', store.clients);
  saveToLocal('orders', store.orders);
  saveToLocal('quotes', store.quotes);
  saveToLocal('documents', store.documents);
  saveToLocal('config', store.settings || store.config);
}

export function resetToDefaultSeed(): SourcingStore {
  const defaultStore: SourcingStore = {
    suppliers: INITIAL_SUPPLIERS,
    contacts: INITIAL_CONTACTS,
    products: INITIAL_PRODUCTS,
    relations: INITIAL_RELATIONS,
    clients: INITIAL_CLIENTS,
    orders: INITIAL_ORDERS,
    quotes: INITIAL_QUOTES,
    documents: INITIAL_DOCUMENTS,
    config: DEFAULT_CONFIG,
    settings: DEFAULT_CONFIG
  };
  saveSourcingData(defaultStore);
  return defaultStore;
}

// --- Payload Sanitizers (strictly aligned with firebase-blueprint.json & firestore.rules) ---

function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.filter(item => item !== undefined).map(item => stripUndefined(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return obj;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function sanitizeOptionalEmail(email?: string): string {
  const trimmed = (email || '').trim();
  return EMAIL_REGEX.test(trimmed) ? trimmed : '';
}

function clampString(val: unknown, maxLen: number): string {
  return String(val ?? '').slice(0, maxLen);
}

export function sanitizeSupplierForFirestore(s: Supplier): Supplier {
  const allowedPlatforms = ['1688', 'Alibaba', 'Made-in-China', 'Canton Fair', 'Contacto Direto', 'Indicação', 'Outro'];
  const allowedTypes = ['fabricante', 'trading_company', 'grossista', 'agente'];
  const allowedStatus = ['ativo', 'em_avaliacao', 'inativo', 'blacklisted'];
  const allowedTrust = ['ouro', 'verificado', 'padrao', 'alto_risco'];
  const rating = Math.min(5, Math.max(1, Number(s.internalRating) || 5));

  return stripUndefined({
    id: clampString(s.id, 128),
    companyName: clampString(s.companyName || 'Fornecedor', 300),
    chineseName: clampString(s.chineseName, 300),
    supplierType: allowedTypes.includes(s.supplierType) ? s.supplierType : 'fabricante',
    country: clampString(s.country || 'China', 100),
    province: clampString(s.province, 120),
    city: clampString(s.city, 120),
    website: clampString(s.website, 500),
    originPlatform: allowedPlatforms.includes(s.originPlatform) ? s.originPlatform : 'Outro',
    status: allowedStatus.includes(s.status) ? s.status : 'ativo',
    trustLevel: allowedTrust.includes(s.trustLevel) ? s.trustLevel : 'padrao',
    internalRating: rating,
    notes: clampString(s.notes, 4000),
    createdAt: clampString(s.createdAt || new Date().toISOString(), 64),
  });
}

export function sanitizeContactForFirestore(c: SupplierContact): SupplierContact {
  return stripUndefined({
    id: clampString(c.id, 128),
    supplierId: clampString(c.supplierId, 128),
    name: clampString(c.name || 'Contacto', 200),
    role: clampString(c.role, 150),
    phone: clampString(c.phone, 64),
    whatsapp: clampString(c.whatsapp, 64),
    wechat: clampString(c.wechat, 100),
    email: sanitizeOptionalEmail(c.email),
    language: clampString(c.language, 100),
    isPrimary: Boolean(c.isPrimary),
  });
}

export function sanitizeProductForFirestore(p: ProductItem): ProductItem {
  const allowedStatus = ['ativo', 'em_desenvolvimento', 'descontinuado'];
  const allowedCurrencies = ['USD', 'CNY', 'MZN'];
  const allowedUnits = ['unidade', 'metro', 'kg', 'caixa', 'set', 'par'];
  const cleanImages = (p.images || [])
    .filter(img => typeof img === 'string' && img.length > 0 && img.length <= 350000 && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:image/')))
    .slice(0, 5);

  return stripUndefined({
    id: clampString(p.id, 128),
    namePt: clampString(p.namePt || 'Produto', 300),
    nameEn: clampString(p.nameEn, 300),
    nameCn: clampString(p.nameCn, 300),
    category: clampString(p.category || 'Geral', 150),
    description: clampString(p.description, 4000),
    material: clampString(p.material, 500),
    dimensions: {
      lengthCm: Math.max(0, Number(p.dimensions?.lengthCm) || 0),
      widthCm: Math.max(0, Number(p.dimensions?.widthCm) || 0),
      heightCm: Math.max(0, Number(p.dimensions?.heightCm) || 0),
      cbmUnit: Math.max(0, Number(p.dimensions?.cbmUnit) || 0),
    },
    weightKg: Math.max(0, Number(p.weightKg) || 0),
    hsCode: clampString(p.hsCode, 32),
    keywords: (p.keywords || []).filter(k => typeof k === 'string').slice(0, 50),
    images: cleanImages,
    status: allowedStatus.includes(p.status) ? p.status : 'ativo',
    createdAt: clampString(p.createdAt || new Date().toISOString(), 64),
    indicativePrice: p.indicativePrice !== undefined ? Math.max(0, Number(p.indicativePrice) || 0) : undefined,
    currency: p.currency && allowedCurrencies.includes(p.currency) ? p.currency : 'USD',
    priceUnit: p.priceUnit && allowedUnits.includes(p.priceUnit) ? p.priceUnit : 'unidade',
    moq: p.moq !== undefined ? Math.max(0, Number(p.moq) || 0) : undefined,
    defaultSupplierId: p.defaultSupplierId ? clampString(p.defaultSupplierId, 128) : undefined,
  });
}

export function sanitizeRelationForFirestore(r: ProductSupplierRelation): ProductSupplierRelation {
  const allowedCurrencies = ['USD', 'CNY', 'MZN'];
  const allowedUnits = ['unidade', 'metro', 'kg', 'caixa', 'set', 'par'];
  const allowedIncoterms = ['EXW', 'FOB', 'CIF', 'DDP'];

  return stripUndefined({
    id: clampString(r.id, 128),
    productId: clampString(r.productId, 128),
    supplierId: clampString(r.supplierId, 128),
    supplierRef: clampString(r.supplierRef, 150),
    indicativePrice: Math.max(0, Number(r.indicativePrice) || 0),
    currency: allowedCurrencies.includes(r.currency) ? r.currency : 'USD',
    priceUnit: allowedUnits.includes(r.priceUnit) ? r.priceUnit : 'unidade',
    moq: Math.max(0, Number(r.moq) || 0),
    monthlyCapacity: clampString(r.monthlyCapacity, 200),
    leadTimeDays: Math.max(0, Number(r.leadTimeDays) || 0),
    incoterm: allowedIncoterms.includes(r.incoterm) ? r.incoterm : 'FOB',
    loadingPort: clampString(r.loadingPort, 150),
    paymentTerms: r.paymentTerms !== undefined ? clampString(r.paymentTerms, 500) : undefined,
    contractUrl: r.contractUrl !== undefined ? clampString(r.contractUrl, 1000) : undefined,
    customizationAvailable: Boolean(r.customizationAvailable),
    sampleAvailable: Boolean(r.sampleAvailable),
    sampleCost: r.sampleCost !== undefined ? Math.max(0, Number(r.sampleCost) || 0) : undefined,
    priceDate: clampString(r.priceDate, 64),
    infoSource: clampString(r.infoSource, 300),
    notes: clampString(r.notes, 4000),
  });
}

export function sanitizeClientForFirestore(c: SourcingClient): SourcingClient {
  return stripUndefined({
    id: clampString(c.id, 128),
    name: clampString(c.name || 'Cliente', 200),
    company: clampString(c.company || 'Empresa', 300),
    nuit: clampString(c.nuit, 64),
    phone: clampString(c.phone, 64),
    email: sanitizeOptionalEmail(c.email),
    city: clampString(c.city, 120),
    address: clampString(c.address, 400),
    notes: clampString(c.notes, 4000),
    createdAt: clampString(c.createdAt || new Date().toISOString(), 64),
  });
}

export function sanitizeOrderForFirestore(o: SourcingOrder): SourcingOrder {
  const allowedCurrencies = ['USD', 'CNY', 'MZN'];
  const allowedStatus = ['aberto', 'em_pesquisa', 'cotacoes_recebidas', 'proposta_enviada', 'aprovado', 'concluido', 'cancelado'];
  const allowedPriority = ['baixa', 'media', 'alta', 'urgente'];

  return stripUndefined({
    id: clampString(o.id, 128),
    clientId: clampString(o.clientId, 128),
    productId: o.productId ? clampString(o.productId, 128) : undefined,
    requestedProduct: clampString(o.requestedProduct || 'Pedido', 400),
    description: clampString(o.description, 4000),
    quantity: Math.max(0, Number(o.quantity) || 0),
    budget: Math.max(0, Number(o.budget) || 0),
    currency: allowedCurrencies.includes(o.currency) ? o.currency : 'USD',
    mozambiqueDestination: clampString(o.mozambiqueDestination, 200),
    deadline: clampString(o.deadline, 64),
    customization: clampString(o.customization, 1000),
    status: allowedStatus.includes(o.status) ? o.status : 'aberto',
    priority: allowedPriority.includes(o.priority) ? o.priority : 'media',
    assignedTo: clampString(o.assignedTo, 200),
    createdAt: clampString(o.createdAt || new Date().toISOString(), 64),
  });
}

export function sanitizeQuotationForFirestore(q: Quotation): Quotation {
  const allowedCurrencies = ['USD', 'CNY', 'MZN'];
  const allowedIncoterms = ['EXW', 'FOB', 'CIF', 'DDP'];
  const allowedStatus = ['recebida', 'em_analise', 'selecionada', 'aprovada', 'rejeitada'];

  return stripUndefined({
    id: clampString(q.id, 128),
    orderId: clampString(q.orderId, 128),
    supplierId: clampString(q.supplierId, 128),
    productId: q.productId ? clampString(q.productId, 128) : undefined,
    requestDate: clampString(q.requestDate, 64),
    responseDate: clampString(q.responseDate, 64),
    quotationDate: q.quotationDate !== undefined ? clampString(q.quotationDate, 64) : undefined,
    validUntil: clampString(q.validUntil, 64),
    validityDate: q.validityDate !== undefined ? clampString(q.validityDate, 64) : undefined,
    unitPrice: Math.max(0, Number(q.unitPrice) || 0),
    quantity: Math.max(0, Number(q.quantity) || 0),
    quotedQuantity: q.quotedQuantity !== undefined ? Math.max(0, Number(q.quotedQuantity) || 0) : undefined,
    currency: allowedCurrencies.includes(q.currency) ? q.currency : 'USD',
    incoterm: allowedIncoterms.includes(q.incoterm) ? q.incoterm : 'FOB',
    loadingPort: clampString(q.loadingPort, 150),
    destinationPort: q.destinationPort !== undefined ? clampString(q.destinationPort, 150) : undefined,
    estimatedFreight: Math.max(0, Number(q.estimatedFreight) || 0),
    estimatedFreightUSD: q.estimatedFreightUSD !== undefined ? Math.max(0, Number(q.estimatedFreightUSD) || 0) : undefined,
    estimatedInsurance: q.estimatedInsurance !== undefined ? Math.max(0, Number(q.estimatedInsurance) || 0) : undefined,
    estimatedInsuranceUSD: q.estimatedInsuranceUSD !== undefined ? Math.max(0, Number(q.estimatedInsuranceUSD) || 0) : undefined,
    productionLeadTimeDays: Math.max(0, Number(q.productionLeadTimeDays) || 0),
    leadTimeDays: q.leadTimeDays !== undefined ? Math.max(0, Number(q.leadTimeDays) || 0) : undefined,
    estimatedDeliveryDays: q.estimatedDeliveryDays !== undefined ? Math.max(0, Number(q.estimatedDeliveryDays) || 0) : undefined,
    paymentTerms: clampString(q.paymentTerms, 500),
    internalRating: Math.min(5, Math.max(0, Number(q.internalRating) || 5)),
    quoteRating: q.quoteRating !== undefined ? Math.min(5, Math.max(0, Number(q.quoteRating) || 5)) : undefined,
    status: allowedStatus.includes(q.status) ? q.status : 'recebida',
    attachmentUrl: q.attachmentUrl !== undefined ? clampString(q.attachmentUrl, 1000) : undefined,
    totalMerchandise: q.totalMerchandise !== undefined ? Math.max(0, Number(q.totalMerchandise) || 0) : undefined,
    notes: clampString(q.notes, 4000),
    createdAt: clampString(q.createdAt || new Date().toISOString(), 64),
  });
}

export function sanitizeDocumentForFirestore(d: SourcingDocument): SourcingDocument {
  const allowedEntityTypes = ['fornecedor', 'produto', 'pedido', 'cotacao'];
  const allowedDocTypes = ['catalogo_pdf', 'ficha_tecnica', 'licenca_comercial', 'relatorio_inspecao', 'fatura_proforma', 'foto_produto', 'outro', 'catalogo', 'licenca', 'inspecao', 'proforma'];
  const rawUrl = (d.fileUrl || '').trim();
  const safeUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl.slice(0, 2000) : `https://${rawUrl}`.slice(0, 2000);

  return stripUndefined({
    id: clampString(d.id, 128),
    entityType: d.entityType && allowedEntityTypes.includes(d.entityType) ? d.entityType : undefined,
    entityId: d.entityId ? clampString(d.entityId, 128) : undefined,
    supplierId: d.supplierId ? clampString(d.supplierId, 128) : undefined,
    productId: d.productId ? clampString(d.productId, 128) : undefined,
    title: clampString(d.title || 'Documento', 300),
    docType: d.docType && allowedDocTypes.includes(d.docType) ? d.docType : undefined,
    documentType: d.documentType && allowedDocTypes.includes(d.documentType) ? d.documentType : undefined,
    fileUrl: safeUrl,
    fileSize: d.fileSize ? clampString(d.fileSize, 64) : undefined,
    description: d.description !== undefined ? clampString(d.description, 2000) : undefined,
    uploadedAt: clampString(d.uploadedAt || new Date().toISOString(), 64),
    notes: d.notes !== undefined ? clampString(d.notes, 2000) : undefined,
  });
}

export function sanitizeSettingsForFirestore(cfg: SourcingConfig): SourcingConfig {
  const usdMzn = Number(cfg.exchangeRates?.USD_MZN || cfg.exchangeRates?.USD_TO_MZN) || 64.0;
  const usdCny = Number(cfg.exchangeRates?.USD_CNY || cfg.exchangeRates?.USD_TO_CNY) || 7.23;
  const cnyMzn = Number(cfg.exchangeRates?.CNY_MZN) || Number((usdMzn / usdCny).toFixed(2));
  const loadingPorts = (cfg.defaultLoadingPorts || cfg.defaultChinesePorts || DEFAULT_CONFIG.defaultLoadingPorts).slice(0, 50);

  return stripUndefined({
    exchangeRates: {
      USD_MZN: usdMzn > 0 ? usdMzn : 64.0,
      CNY_MZN: cnyMzn > 0 ? cnyMzn : 8.85,
      USD_CNY: usdCny > 0 ? usdCny : 7.23,
      USD_TO_MZN: usdMzn > 0 ? usdMzn : 64.0,
      USD_TO_CNY: usdCny > 0 ? usdCny : 7.23,
    },
    defaultLoadingPorts: loadingPorts,
    defaultChinesePorts: (cfg.defaultChinesePorts || loadingPorts).slice(0, 50),
    mozambiqueDestinations: (cfg.mozambiqueDestinations || DEFAULT_CONFIG.mozambiqueDestinations).slice(0, 50),
    productCategories: (cfg.productCategories || DEFAULT_CONFIG.productCategories).slice(0, 50),
  });
}

async function commitBatchOperations(operations: Array<(batch: ReturnType<typeof writeBatch>) => void>): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    for (const op of chunk) {
      op(batch);
    }
    await batch.commit();
  }
}

export async function writeStoreToFirestore(store: SourcingStore): Promise<void> {
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (const s of store.suppliers) {
    const clean = sanitizeSupplierForFirestore(s);
    ops.push(b => b.set(doc(db, SOURCING_COLLECTIONS.suppliers, clean.id), clean));
  }
  for (const c of store.contacts) {
    const clean = sanitizeContactForFirestore(c);
    ops.push(b => b.set(doc(db, SOURCING_COLLECTIONS.contacts, clean.id), clean));
  }
  for (const p of store.products) {
    const clean = sanitizeProductForFirestore(p);
    ops.push(b => b.set(doc(db, SOURCING_COLLECTIONS.products, clean.id), clean));
  }
  for (const r of store.relations) {
    const clean = sanitizeRelationForFirestore(r);
    ops.push(b => b.set(doc(db, SOURCING_COLLECTIONS.relations, clean.id), clean));
  }
  for (const cl of store.clients) {
    const clean = sanitizeClientForFirestore(cl);
    ops.push(b => b.set(doc(db, SOURCING_COLLECTIONS.clients, clean.id), clean));
  }
  for (const o of store.orders) {
    const clean = sanitizeOrderForFirestore(o);
    ops.push(b => b.set(doc(db, SOURCING_COLLECTIONS.orders, clean.id), clean));
  }
  for (const q of store.quotes) {
    const clean = sanitizeQuotationForFirestore(q);
    ops.push(b => b.set(doc(db, SOURCING_COLLECTIONS.quotes, clean.id), clean));
  }
  for (const d of store.documents) {
    const clean = sanitizeDocumentForFirestore(d);
    ops.push(b => b.set(doc(db, SOURCING_COLLECTIONS.documents, clean.id), clean));
  }
  const cleanCfg = sanitizeSettingsForFirestore(store.settings || store.config || DEFAULT_CONFIG);
  ops.push(b => b.set(doc(db, SOURCING_COLLECTIONS.settings, 'default'), cleanCfg));

  try {
    await commitBatchOperations(ops);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.WRITE, 'sourcing_batch');
  }
}

export async function loadSourcingFromFirestore(): Promise<{ store: SourcingStore; migratedFromLocal: boolean }> {
  try {
    const [
      supSnap,
      contSnap,
      prodSnap,
      relSnap,
      cliSnap,
      ordSnap,
      quoteSnap,
      docSnap,
      cfgSnap,
    ] = await Promise.all([
      getDocs(collection(db, SOURCING_COLLECTIONS.suppliers)),
      getDocs(collection(db, SOURCING_COLLECTIONS.contacts)),
      getDocs(collection(db, SOURCING_COLLECTIONS.products)),
      getDocs(collection(db, SOURCING_COLLECTIONS.relations)),
      getDocs(collection(db, SOURCING_COLLECTIONS.clients)),
      getDocs(collection(db, SOURCING_COLLECTIONS.orders)),
      getDocs(collection(db, SOURCING_COLLECTIONS.quotes)),
      getDocs(collection(db, SOURCING_COLLECTIONS.documents)),
      getDoc(doc(db, SOURCING_COLLECTIONS.settings, 'default')),
    ]);

    const hasAnyCloudData =
      !supSnap.empty ||
      !contSnap.empty ||
      !prodSnap.empty ||
      !relSnap.empty ||
      !cliSnap.empty ||
      !ordSnap.empty ||
      !quoteSnap.empty ||
      !docSnap.empty ||
      cfgSnap.exists();

    if (!hasAnyCloudData) {
      // Auto-migrate any existing localStorage edits (or initial seed) to Firestore on first admin load
      const localStore = getInitialSourcingStore();
      await writeStoreToFirestore(localStore);
      return { store: localStore, migratedFromLocal: true };
    }

    const sortByCreatedDesc = <T extends { createdAt?: string; uploadedAt?: string; id: string }>(arr: T[]): T[] =>
      [...arr].sort((a, b) => {
        const ta = a.createdAt || a.uploadedAt || '';
        const tb = b.createdAt || b.uploadedAt || '';
        return tb.localeCompare(ta) || b.id.localeCompare(a.id);
      });

    const loadedConfig = cfgSnap.exists()
      ? sanitizeSettingsForFirestore(cfgSnap.data() as SourcingConfig)
      : DEFAULT_CONFIG;

    const store: SourcingStore = {
      suppliers: sortByCreatedDesc(supSnap.docs.map(d => d.data() as Supplier)),
      contacts: contSnap.docs.map(d => d.data() as SupplierContact),
      products: sortByCreatedDesc(prodSnap.docs.map(d => d.data() as ProductItem)),
      relations: relSnap.docs.map(d => d.data() as ProductSupplierRelation),
      clients: sortByCreatedDesc(cliSnap.docs.map(d => d.data() as SourcingClient)),
      orders: sortByCreatedDesc(ordSnap.docs.map(d => d.data() as SourcingOrder)),
      quotes: sortByCreatedDesc(quoteSnap.docs.map(d => d.data() as Quotation)),
      documents: sortByCreatedDesc(docSnap.docs.map(d => d.data() as SourcingDocument)),
      config: loadedConfig,
      settings: loadedConfig,
    };

    saveSourcingData(store);
    return { store, migratedFromLocal: false };
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.LIST, SOURCING_COLLECTIONS.suppliers);
  }
}

export async function persistSupplierAndContacts(
  supplier: Supplier,
  contacts: SupplierContact[],
  removedContactIds: string[]
): Promise<void> {
  const cleanSupplier = sanitizeSupplierForFirestore(supplier);
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
    b => b.set(doc(db, SOURCING_COLLECTIONS.suppliers, cleanSupplier.id), cleanSupplier),
  ];

  for (const cid of removedContactIds) {
    ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.contacts, cid)));
  }
  for (const c of contacts) {
    const cleanContact = sanitizeContactForFirestore(c);
    ops.push(b => b.set(doc(db, SOURCING_COLLECTIONS.contacts, cleanContact.id), cleanContact));
  }

  try {
    await commitBatchOperations(ops);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.WRITE, `${SOURCING_COLLECTIONS.suppliers}/${cleanSupplier.id}`);
  }
}

export async function removeSupplierFromFirestore(
  supplierId: string,
  contactIds: string[],
  relationIds: string[]
): Promise<void> {
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
    b => b.delete(doc(db, SOURCING_COLLECTIONS.suppliers, supplierId)),
  ];
  for (const cid of contactIds) {
    ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.contacts, cid)));
  }
  for (const rid of relationIds) {
    ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.relations, rid)));
  }
  try {
    await commitBatchOperations(ops);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.DELETE, `${SOURCING_COLLECTIONS.suppliers}/${supplierId}`);
  }
}

export async function persistProduct(product: ProductItem): Promise<void> {
  const clean = sanitizeProductForFirestore(product);
  const path = `${SOURCING_COLLECTIONS.products}/${clean.id}`;
  try {
    await setDoc(doc(db, SOURCING_COLLECTIONS.products, clean.id), clean);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.WRITE, path);
  }
}

export async function removeProductFromFirestore(productId: string, relationIds: string[]): Promise<void> {
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
    b => b.delete(doc(db, SOURCING_COLLECTIONS.products, productId)),
  ];
  for (const rid of relationIds) {
    ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.relations, rid)));
  }
  try {
    await commitBatchOperations(ops);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.DELETE, `${SOURCING_COLLECTIONS.products}/${productId}`);
  }
}

export async function persistRelation(relation: ProductSupplierRelation): Promise<void> {
  const clean = sanitizeRelationForFirestore(relation);
  const path = `${SOURCING_COLLECTIONS.relations}/${clean.id}`;
  try {
    await setDoc(doc(db, SOURCING_COLLECTIONS.relations, clean.id), clean);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.WRITE, path);
  }
}

export async function removeRelationFromFirestore(relationId: string): Promise<void> {
  const path = `${SOURCING_COLLECTIONS.relations}/${relationId}`;
  try {
    await deleteDoc(doc(db, SOURCING_COLLECTIONS.relations, relationId));
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.DELETE, path);
  }
}

export async function persistOrder(order: SourcingOrder): Promise<void> {
  const clean = sanitizeOrderForFirestore(order);
  const path = `${SOURCING_COLLECTIONS.orders}/${clean.id}`;
  try {
    await setDoc(doc(db, SOURCING_COLLECTIONS.orders, clean.id), clean);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.WRITE, path);
  }
}

export async function removeOrderFromFirestore(orderId: string): Promise<void> {
  const path = `${SOURCING_COLLECTIONS.orders}/${orderId}`;
  try {
    await deleteDoc(doc(db, SOURCING_COLLECTIONS.orders, orderId));
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.DELETE, path);
  }
}

export async function persistQuotation(quote: Quotation): Promise<void> {
  const clean = sanitizeQuotationForFirestore(quote);
  const path = `${SOURCING_COLLECTIONS.quotes}/${clean.id}`;
  try {
    await setDoc(doc(db, SOURCING_COLLECTIONS.quotes, clean.id), clean);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.WRITE, path);
  }
}

export async function removeQuotationFromFirestore(quoteId: string): Promise<void> {
  const path = `${SOURCING_COLLECTIONS.quotes}/${quoteId}`;
  try {
    await deleteDoc(doc(db, SOURCING_COLLECTIONS.quotes, quoteId));
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.DELETE, path);
  }
}

export async function persistDocument(docItem: SourcingDocument): Promise<void> {
  const clean = sanitizeDocumentForFirestore(docItem);
  const path = `${SOURCING_COLLECTIONS.documents}/${clean.id}`;
  try {
    await setDoc(doc(db, SOURCING_COLLECTIONS.documents, clean.id), clean);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.WRITE, path);
  }
}

export async function removeDocumentFromFirestore(docId: string): Promise<void> {
  const path = `${SOURCING_COLLECTIONS.documents}/${docId}`;
  try {
    await deleteDoc(doc(db, SOURCING_COLLECTIONS.documents, docId));
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.DELETE, path);
  }
}

export async function persistClient(client: SourcingClient): Promise<void> {
  const clean = sanitizeClientForFirestore(client);
  const path = `${SOURCING_COLLECTIONS.clients}/${clean.id}`;
  try {
    await setDoc(doc(db, SOURCING_COLLECTIONS.clients, clean.id), clean);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.WRITE, path);
  }
}

export async function removeClientFromFirestore(clientId: string): Promise<void> {
  const path = `${SOURCING_COLLECTIONS.clients}/${clientId}`;
  try {
    await deleteDoc(doc(db, SOURCING_COLLECTIONS.clients, clientId));
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.DELETE, path);
  }
}

export async function persistSourcingSettings(settings: SourcingConfig): Promise<void> {
  const clean = sanitizeSettingsForFirestore(settings);
  const path = `${SOURCING_COLLECTIONS.settings}/default`;
  try {
    await setDoc(doc(db, SOURCING_COLLECTIONS.settings, 'default'), clean);
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.WRITE, path);
  }
}

export async function resetSourcingFirestoreToSeed(currentStore: SourcingStore): Promise<SourcingStore> {
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
  for (const s of currentStore.suppliers) ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.suppliers, s.id)));
  for (const c of currentStore.contacts) ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.contacts, c.id)));
  for (const p of currentStore.products) ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.products, p.id)));
  for (const r of currentStore.relations) ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.relations, r.id)));
  for (const cl of currentStore.clients) ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.clients, cl.id)));
  for (const o of currentStore.orders) ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.orders, o.id)));
  for (const q of currentStore.quotes) ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.quotes, q.id)));
  for (const d of currentStore.documents) ops.push(b => b.delete(doc(db, SOURCING_COLLECTIONS.documents, d.id)));

  try {
    if (ops.length > 0) {
      await commitBatchOperations(ops);
    }
    const fresh = resetToDefaultSeed();
    await writeStoreToFirestore(fresh);
    return fresh;
  } catch (error) {
    handleSourcingFirestoreError(error, SourcingOperationType.WRITE, 'sourcing_reset');
  }
}
