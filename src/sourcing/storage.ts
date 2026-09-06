import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  getDocFromServer
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
  // Painel Solar associado a FOR-0002
  {
    id: 'REL-0001',
    productId: 'PROD-0001',
    supplierId: 'FOR-0002',
    supplierRef: 'SPP-550M-144',
    indicativePrice: 62.50,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 62, // 1 pallet padrão
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
  // Painel Solar também associado a FOR-0005 (Trading)
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
  // Porcelanato associado a FOR-0001
  {
    id: 'REL-0003',
    productId: 'PROD-0002',
    supplierId: 'FOR-0001',
    supplierRef: 'APX-CAL-6060',
    indicativePrice: 6.80,
    currency: 'USD',
    priceUnit: 'caixa',
    moq: 500, // caixas
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
  // Cadeira Ergonómica associada a FOR-0003
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
  // SSD associado a FOR-0004
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

  // Sanitize products: remove any fallback to the company logo and ensure price/MOQ are populated
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

