export type SupplierType = 'fabricante' | 'trading_company' | 'grossista' | 'agente';
export type SupplierStatus = 'ativo' | 'em_avaliacao' | 'inativo' | 'blacklisted';
export type TrustLevel = 'ouro' | 'verificado' | 'padrao' | 'alto_risco';
export type OriginPlatform = '1688' | 'Alibaba' | 'Made-in-China' | 'Canton Fair' | 'Contacto Direto' | 'Indicação' | 'Outro';

export interface SupplierContact {
  id: string; // CONT-0001
  supplierId: string; // FOR-0001
  name: string;
  role: string;
  phone: string;
  whatsapp: string;
  wechat: string;
  email: string;
  language: string;
  isPrimary: boolean;
}

export interface Supplier {
  id: string; // FOR-0001
  companyName: string;
  chineseName: string;
  supplierType: SupplierType;
  country: string;
  province: string;
  city: string;
  website: string;
  originPlatform: OriginPlatform;
  status: SupplierStatus;
  trustLevel: TrustLevel;
  internalRating: number; // 1 to 5
  notes: string;
  createdAt: string;
}

export interface ProductDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  cbmUnit: number;
}

export type ProductStatus = 'ativo' | 'em_desenvolvimento' | 'descontinuado';

export interface ProductItem {
  id: string; // PROD-0001
  namePt: string;
  nameEn: string;
  nameCn: string;
  category: string;
  description: string;
  material: string;
  dimensions: ProductDimensions;
  weightKg: number;
  hsCode: string;
  keywords: string[];
  images: string[];
  status: ProductStatus;
  createdAt: string;
  indicativePrice?: number;
  currency?: CurrencyType;
  priceUnit?: PriceUnit;
  moq?: number;
  defaultSupplierId?: string;
}

export type CurrencyType = 'USD' | 'CNY' | 'MZN';
export type IncotermType = 'EXW' | 'FOB' | 'CIF' | 'DDP';
export type PriceUnit = 'unidade' | 'metro' | 'kg' | 'caixa' | 'set' | 'par';

export interface ProductSupplierRelation {
  id: string; // REL-0001
  productId: string; // PROD-0001
  supplierId: string; // FOR-0001
  supplierRef: string;
  indicativePrice: number;
  currency: CurrencyType;
  priceUnit: PriceUnit;
  moq: number;
  monthlyCapacity: string;
  leadTimeDays: number;
  incoterm: IncotermType;
  loadingPort: string;
  customizationAvailable: boolean;
  sampleAvailable: boolean;
  sampleCost?: number;
  priceDate: string;
  infoSource: string;
  notes: string;
}

export interface SourcingClient {
  id: string; // CLI-0001
  name: string;
  company: string;
  nuit: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes: string;
  createdAt: string;
}

export type OrderStatus = 'aberto' | 'em_pesquisa' | 'cotacoes_recebidas' | 'proposta_enviada' | 'aprovado' | 'concluido' | 'cancelado';
export type OrderPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface SourcingOrder {
  id: string; // PED-0001
  clientId: string; // CLI-0001
  productId?: string; // Optional PROD-0001
  requestedProduct: string;
  description: string;
  quantity: number;
  budget: number;
  currency: CurrencyType;
  mozambiqueDestination: string;
  deadline: string;
  customization: string;
  status: OrderStatus;
  priority: OrderPriority;
  assignedTo: string;
  createdAt: string;
}

export type QuoteStatus = 'recebida' | 'em_analise' | 'selecionada' | 'aprovada' | 'rejeitada';
export type QuotationStatus = QuoteStatus;

export interface Quotation {
  id: string; // COT-0001
  orderId: string; // PED-0001
  supplierId: string; // FOR-0001
  productId?: string; // PROD-0001
  requestDate: string;
  responseDate: string;
  quotationDate?: string;
  validUntil: string;
  validityDate?: string;
  unitPrice: number;
  quantity: number;
  quotedQuantity?: number;
  currency: CurrencyType;
  incoterm: IncotermType;
  loadingPort: string;
  destinationPort?: string;
  estimatedFreight: number;
  estimatedFreightUSD?: number;
  estimatedInsurance?: number;
  estimatedInsuranceUSD?: number;
  productionLeadTimeDays: number;
  leadTimeDays?: number;
  estimatedDeliveryDays?: number;
  paymentTerms: string;
  internalRating: number; // 1-5
  quoteRating?: number;
  status: QuoteStatus;
  attachmentUrl?: string;
  totalMerchandise?: number;
  notes: string;
  createdAt: string;
}

export type DocumentType = 'catalogo_pdf' | 'ficha_tecnica' | 'licenca_comercial' | 'relatorio_inspecao' | 'fatura_proforma' | 'foto_produto' | 'outro' | 'catalogo' | 'licenca' | 'inspecao' | 'proforma';

export interface SourcingDocument {
  id: string; // DOC-0001
  entityType?: 'fornecedor' | 'produto' | 'pedido' | 'cotacao';
  entityId?: string;
  supplierId?: string;
  productId?: string;
  title: string;
  docType?: DocumentType;
  documentType?: DocumentType;
  fileUrl: string;
  fileSize?: string;
  description?: string;
  uploadedAt: string;
  notes?: string;
}

export type CatalogDocument = SourcingDocument;

export interface SourcingConfig {
  exchangeRates: {
    USD_MZN: number;
    CNY_MZN?: number;
    USD_CNY: number;
    USD_TO_MZN?: number;
    USD_TO_CNY?: number;
  };
  defaultLoadingPorts: string[];
  defaultChinesePorts?: string[];
  mozambiqueDestinations: string[];
  productCategories: string[];
}

export type SourcingSettings = SourcingConfig;
