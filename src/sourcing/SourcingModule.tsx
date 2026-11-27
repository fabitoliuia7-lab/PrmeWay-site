import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Building2, 
  Package, 
  ClipboardList, 
  FileText, 
  Scale, 
  FolderDown, 
  Users, 
  Settings as SettingsIcon, 
  LayoutDashboard, 
  ArrowLeft,
  Cloud,
  CloudOff,
  RefreshCw,
  Lock
} from 'lucide-react';
import { 
  Supplier, 
  SupplierContact, 
  ProductItem, 
  ProductSupplierRelation, 
  SourcingOrder, 
  Quotation, 
  CatalogDocument, 
  SourcingClient, 
  SourcingSettings 
} from './types';
import { 
  loadSourcingData, 
  saveSourcingData, 
  resetToDefaultSeed,
  loadSourcingFromFirestore,
  persistSupplierAndContacts,
  removeSupplierFromFirestore,
  persistProduct,
  removeProductFromFirestore,
  persistRelation,
  removeRelationFromFirestore,
  persistOrder,
  removeOrderFromFirestore,
  persistQuotation,
  removeQuotationFromFirestore,
  persistDocument,
  removeDocumentFromFirestore,
  persistClient,
  removeClientFromFirestore,
  persistSourcingSettings,
  resetSourcingFirestoreToSeed,
} from './storage';
import { DashboardView } from './components/DashboardView';
import { SuppliersView } from './components/SuppliersView';
import { ProductsView } from './components/ProductsView';
import { OrdersView } from './components/OrdersView';
import { QuotationsView } from './components/QuotationsView';
import { ProposalCompareView } from './components/ProposalCompareView';
import { CatalogsDocumentsView } from './components/CatalogsDocumentsView';
import { ClientsView } from './components/ClientsView';
import { SettingsView } from './components/SettingsView';
import { CommercialProposalModal } from './components/CommercialProposalModal';
import './sourcing-ui.css';

export interface SourcingModuleProps {
  onBackToCalculator: () => void;
  onInjectIntoCalculator: (data: {
    productName: string;
    fobPriceUSD: number;
    quantity: number;
    weightKg: number;
    cbm: number;
    hsCode?: string;
    freightEstimateUSD?: number;
    supplierName?: string;
    imageUrl?: string;
  }) => void;
  isAdmin?: boolean;
  isAuthReady?: boolean;
  isAuthenticated?: boolean;
  onOpenLogin?: () => void;
}

export const SourcingModule: React.FC<SourcingModuleProps> = ({
  onBackToCalculator,
  onInjectIntoCalculator,
  isAdmin = false,
  isAuthReady = false,
  isAuthenticated = false,
  onOpenLogin
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [compareOrderId, setCompareOrderId] = useState<string | undefined>(undefined);

  // Data State
  const [data, setData] = useState(() => loadSourcingData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const [cloudStatus, setCloudStatus] = useState<'idle' | 'loading' | 'saving' | 'synced' | 'error'>('idle');
  const [cloudError, setCloudError] = useState<string | null>(null);

  // Keep local offline cache mirrored whenever state changes
  useEffect(() => {
    saveSourcingData(data);
  }, [data]);

  const syncFromCloud = useCallback(async () => {
    if (!isAuthReady || !isAdmin) return;
    setCloudStatus('loading');
    setCloudError(null);
    try {
      const { store } = await loadSourcingFromFirestore();
      setData(store);
      setCloudStatus('synced');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao sincronizar Sourcing com a nuvem.';
      setCloudError(message);
      setCloudStatus('error');
    }
  }, [isAuthReady, isAdmin]);

  useEffect(() => {
    if (isAuthReady && isAdmin) {
      void syncFromCloud();
    } else if (isAuthReady && !isAdmin) {
      setCloudStatus('idle');
      setCloudError(null);
    }
  }, [isAuthReady, isAdmin, syncFromCloud]);

  const runCloudMutation = async (fn: () => Promise<void>) => {
    if (!isAdmin) return;
    setCloudStatus('saving');
    setCloudError(null);
    try {
      await fn();
      setCloudStatus('synced');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao guardar alteração na nuvem.';
      setCloudError(message);
      setCloudStatus('error');
    }
  };

  // Commercial Proposal Modal State
  const [proposalModal, setProposalModal] = useState<{
    isOpen: boolean;
    order: SourcingOrder | null;
    quote: Quotation | null;
  }>({
    isOpen: false,
    order: null,
    quote: null
  });

  // --- Handlers: Suppliers ---
  const handleSaveSupplier = (supplier: Supplier, contacts: SupplierContact[]) => {
    const previousContactsForSupplier = dataRef.current.contacts
      .filter(c => c.supplierId === supplier.id)
      .map(c => c.id);
    const nextContactIds = new Set(contacts.map(c => c.id));
    const removedContactIds = previousContactsForSupplier.filter(id => !nextContactIds.has(id));

    setData(prev => {
      const existsIndex = prev.suppliers.findIndex(s => s.id === supplier.id);
      const newSuppliers = [...prev.suppliers];
      if (existsIndex >= 0) {
        newSuppliers[existsIndex] = supplier;
      } else {
        newSuppliers.unshift(supplier);
      }

      const otherContacts = prev.contacts.filter(c => c.supplierId !== supplier.id);
      const newContacts = [...otherContacts, ...contacts];

      return {
        ...prev,
        suppliers: newSuppliers,
        contacts: newContacts
      };
    });

    void runCloudMutation(() => persistSupplierAndContacts(supplier, contacts, removedContactIds));
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const contactIds = dataRef.current.contacts.filter(c => c.supplierId === supplierId).map(c => c.id);
    const relationIds = dataRef.current.relations.filter(r => r.supplierId === supplierId).map(r => r.id);

    setData(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== supplierId),
      contacts: prev.contacts.filter(c => c.supplierId !== supplierId),
      relations: prev.relations.filter(r => r.supplierId !== supplierId)
    }));

    void runCloudMutation(() => removeSupplierFromFirestore(supplierId, contactIds, relationIds));
  };

  // --- Handlers: Products ---
  const handleSaveProduct = (product: ProductItem) => {
    setData(prev => {
      const existsIndex = prev.products.findIndex(p => p.id === product.id);
      const newProducts = [...prev.products];
      if (existsIndex >= 0) {
        newProducts[existsIndex] = product;
      } else {
        newProducts.unshift(product);
      }
      return { ...prev, products: newProducts };
    });

    void runCloudMutation(() => persistProduct(product));
  };

  const handleDeleteProduct = (productId: string) => {
    const relationIds = dataRef.current.relations.filter(r => r.productId === productId).map(r => r.id);

    setData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId),
      relations: prev.relations.filter(r => r.productId !== productId)
    }));

    void runCloudMutation(() => removeProductFromFirestore(productId, relationIds));
  };

  // --- Handlers: Product-Supplier Relations ---
  const handleSaveRelation = (relation: ProductSupplierRelation) => {
    setData(prev => {
      const existsIndex = prev.relations.findIndex(r => r.id === relation.id);
      const newRelations = [...prev.relations];
      if (existsIndex >= 0) {
        newRelations[existsIndex] = relation;
      } else {
        newRelations.unshift(relation);
      }
      return { ...prev, relations: newRelations };
    });

    void runCloudMutation(() => persistRelation(relation));
  };

  const handleDeleteRelation = (relationId: string) => {
    setData(prev => ({
      ...prev,
      relations: prev.relations.filter(r => r.id !== relationId)
    }));

    void runCloudMutation(() => removeRelationFromFirestore(relationId));
  };

  // --- Handlers: Orders ---
  const handleSaveOrder = (order: SourcingOrder) => {
    setData(prev => {
      const existsIndex = prev.orders.findIndex(o => o.id === order.id);
      const newOrders = [...prev.orders];
      if (existsIndex >= 0) {
        newOrders[existsIndex] = order;
      } else {
        newOrders.unshift(order);
      }
      return { ...prev, orders: newOrders };
    });

    void runCloudMutation(() => persistOrder(order));
  };

  const handleDeleteOrder = (orderId: string) => {
    setData(prev => ({
      ...prev,
      orders: prev.orders.filter(o => o.id !== orderId)
    }));

    void runCloudMutation(() => removeOrderFromFirestore(orderId));
  };

  // --- Handlers: Quotations ---
  const handleSaveQuote = (quote: Quotation) => {
    setData(prev => {
      const existsIndex = prev.quotes.findIndex(q => q.id === quote.id);
      const newQuotes = [...prev.quotes];
      if (existsIndex >= 0) {
        newQuotes[existsIndex] = quote;
      } else {
        newQuotes.unshift(quote);
      }
      return { ...prev, quotes: newQuotes };
    });

    void runCloudMutation(() => persistQuotation(quote));
  };

  const handleDeleteQuote = (quoteId: string) => {
    setData(prev => ({
      ...prev,
      quotes: prev.quotes.filter(q => q.id !== quoteId)
    }));

    void runCloudMutation(() => removeQuotationFromFirestore(quoteId));
  };

  // --- Handlers: Documents ---
  const handleSaveDocument = (docItem: CatalogDocument) => {
    setData(prev => {
      const existsIndex = prev.documents.findIndex(d => d.id === docItem.id);
      const newDocs = [...prev.documents];
      if (existsIndex >= 0) {
        newDocs[existsIndex] = docItem;
      } else {
        newDocs.unshift(docItem);
      }
      return { ...prev, documents: newDocs };
    });

    void runCloudMutation(() => persistDocument(docItem));
  };

  const handleDeleteDocument = (docId: string) => {
    setData(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== docId)
    }));

    void runCloudMutation(() => removeDocumentFromFirestore(docId));
  };

  // --- Handlers: Clients ---
  const handleSaveClient = (client: SourcingClient) => {
    setData(prev => {
      const existsIndex = prev.clients.findIndex(c => c.id === client.id);
      const newClients = [...prev.clients];
      if (existsIndex >= 0) {
        newClients[existsIndex] = client;
      } else {
        newClients.unshift(client);
      }
      return { ...prev, clients: newClients };
    });

    void runCloudMutation(() => persistClient(client));
  };

  const handleDeleteClient = (clientId: string) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== clientId)
    }));

    void runCloudMutation(() => removeClientFromFirestore(clientId));
  };

  // --- Handlers: Settings & Reset ---
  const handleSaveSettings = (settings: SourcingSettings) => {
    setData(prev => ({ ...prev, settings, config: settings }));
    void runCloudMutation(() => persistSourcingSettings(settings));
  };

  const handleResetSeedData = () => {
    const previous = dataRef.current;
    const fresh = resetToDefaultSeed();
    setData(fresh);
    if (isAdmin) {
      void runCloudMutation(async () => {
        await resetSourcingFirestoreToSeed(previous);
      });
    }
  };

  // --- Calculator State Injection Actions ---
  const handleSendProductToCalculator = (product: ProductItem, relation?: ProductSupplierRelation) => {
    let priceUSD = 10;
    let supplierName: string | undefined = undefined;

    if (relation) {
      if (relation.currency === 'USD') {
        priceUSD = relation.indicativePrice;
      } else if (relation.currency === 'CNY') {
        const rate = data.settings.exchangeRates.USD_TO_CNY || 7.23;
        priceUSD = Number((relation.indicativePrice / rate).toFixed(2));
      } else if (relation.currency === 'MZN') {
        const rate = data.settings.exchangeRates.USD_TO_MZN || 64;
        priceUSD = Number((relation.indicativePrice / rate).toFixed(2));
      }
      const supp = data.suppliers.find(s => s.id === relation.supplierId);
      supplierName = supp?.companyName;
    } else if (product.indicativePrice && product.indicativePrice > 0) {
      if (product.currency === 'CNY') {
        const rate = data.settings.exchangeRates.USD_TO_CNY || 7.23;
        priceUSD = Number((product.indicativePrice / rate).toFixed(2));
      } else if (product.currency === 'MZN') {
        const rate = data.settings.exchangeRates.USD_TO_MZN || 64;
        priceUSD = Number((product.indicativePrice / rate).toFixed(2));
      } else {
        priceUSD = product.indicativePrice;
      }
      if (product.defaultSupplierId) {
        const supp = data.suppliers.find(s => s.id === product.defaultSupplierId);
        supplierName = supp?.companyName;
      }
    }

    const productImage = product.images && product.images.length > 0 && product.images[0] !== '/IMG-20260215-WA0003.jpg' && product.images[0].trim() !== ''
      ? product.images[0]
      : undefined;

    onInjectIntoCalculator({
      productName: product.namePt,
      fobPriceUSD: priceUSD,
      quantity: relation?.moq || product.moq || 10,
      weightKg: product.weightKg || 1,
      cbm: product.dimensions?.cbmUnit || 0.05,
      hsCode: product.hsCode,
      supplierName,
      imageUrl: productImage
    });
  };

  const handleSendQuoteToCalculator = (quote: Quotation) => {
    const product = data.products.find(p => p.id === quote.productId);
    const supplier = data.suppliers.find(s => s.id === quote.supplierId);

    let priceUSD = quote.unitPrice;
    if (quote.currency === 'CNY') {
      const rate = data.settings.exchangeRates.USD_TO_CNY || 7.23;
      priceUSD = Number((quote.unitPrice / rate).toFixed(2));
    } else if (quote.currency === 'MZN') {
      const rate = data.settings.exchangeRates.USD_TO_MZN || 64;
      priceUSD = Number((quote.unitPrice / rate).toFixed(2));
    }

    const productImage = product && product.images && product.images.length > 0 && product.images[0] !== '/IMG-20260215-WA0003.jpg' && product.images[0].trim() !== ''
      ? product.images[0]
      : undefined;

    onInjectIntoCalculator({
      productName: product ? product.namePt : `Item Cotado (${quote.id})`,
      fobPriceUSD: priceUSD,
      quantity: quote.quotedQuantity || quote.quantity || 1,
      weightKg: product?.weightKg || 5,
      cbm: product?.dimensions?.cbmUnit || 0.1,
      hsCode: product?.hsCode,
      freightEstimateUSD: quote.estimatedFreightUSD,
      supplierName: supplier?.companyName,
      imageUrl: productImage
    });
  };

  // Nav Items
  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'fornecedores', label: 'Fornecedores', icon: Building2, count: data.suppliers.length },
    { id: 'produtos', label: 'Produtos', icon: Package, count: data.products.length },
    { id: 'pedidos', label: 'Pedidos', icon: ClipboardList, count: data.orders.length },
    { id: 'cotacoes', label: 'Cotações', icon: FileText, count: data.quotes.length },
    { id: 'comparacao', label: 'Comparar', icon: Scale },
    { id: 'documentos', label: 'Documentos', icon: FolderDown, count: data.documents.length },
    { id: 'clientes', label: 'Clientes', icon: Users, count: data.clients.length },
    { id: 'configuracoes', label: 'Definições', icon: SettingsIcon }
  ];

  return (
    <div className="pw-sourcing min-h-screen bg-slate-50/50 pb-20">
      {/* Sourcing Top Navigation Bar */}
      <div className="bg-[#1A284F] text-white border-b border-slate-700/60 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Back to Calculator + Brand */}
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToCalculator}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer backdrop-blur-sm"
                title="Voltar para a Calculadora Principal"
              >
                <ArrowLeft size={15} />
                Calculadora
              </button>

              <div className="h-6 w-[1px] bg-slate-700/60 hidden sm:block" />

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-corp-orange flex items-center justify-center text-white shadow-sm font-black text-xs">
                  PW
                </div>
                <div>
                  <div className="font-heading font-extrabold text-sm sm:text-base leading-none tracking-tight flex items-center gap-1.5">
                    Sourcing
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Cloud Persistence Indicator */}
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => void syncFromCloud()}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    cloudStatus === 'error'
                      ? 'bg-red-500/20 text-red-200 border border-red-400/40'
                      : cloudStatus === 'loading' || cloudStatus === 'saving'
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                        : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                  }`}
                  title="Sincronização em nuvem (Firestore)"
                >
                  {cloudStatus === 'loading' || cloudStatus === 'saving' ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : cloudStatus === 'error' ? (
                    <CloudOff size={12} />
                  ) : (
                    <Cloud size={12} />
                  )}
                  <span className="hidden sm:inline">
                    {cloudStatus === 'loading'
                      ? 'A carregar nuvem...'
                      : cloudStatus === 'saving'
                        ? 'A guardar na nuvem...'
                        : cloudStatus === 'error'
                          ? 'Erro na nuvem (Tentar novamente)'
                          : 'Sincronizado na nuvem'}
                  </span>
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 text-slate-200">
                  <Lock size={12} />
                  <span className="hidden sm:inline">Modo demonstração local</span>
                </span>
              )}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-700/40 text-xs font-medium">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'comparacao') setCompareOrderId(undefined);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-corp-orange text-white font-bold shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Sourcing Content Area */}
      <main id="conteudo-principal" tabIndex={-1} className="pw-sourcing__main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {isAuthReady && !isAdmin && (
          <div className="mb-5 p-4 rounded-xl border border-amber-200 bg-amber-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-950">
            <div>
              <strong className="font-bold">Aviso de persistência:</strong>{' '}
              {isAuthenticated
                ? 'Apenas contas de Administrador sincronizam os dados de Sourcing na base de dados em nuvem (Firestore). Alterações aqui ficam apenas temporárias neste navegador.'
                : 'Está no modo de demonstração local. Inicie sessão como Administrador para gravar permanentemente fornecedores, produtos e pedidos na nuvem.'}
            </div>
            {!isAuthenticated && onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="shrink-0 px-3.5 py-2 rounded-lg bg-[#1A284F] text-white font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Iniciar Sessão
              </button>
            )}
          </div>
        )}

        {cloudStatus === 'error' && cloudError && (
          <div className="mb-5 p-4 rounded-xl border border-red-200 bg-red-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-red-900">
            <div>
              <strong className="font-bold">Falha ao sincronizar com a base de dados:</strong>{' '}
              <span>Verifique a sua ligação ou permissões de administrador antes de continuar.</span>
            </div>
            <button
              type="button"
              onClick={() => void syncFromCloud()}
              className="shrink-0 px-3.5 py-1.5 rounded-lg bg-red-700 text-white font-bold hover:bg-red-800 transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            suppliers={data.suppliers}
            products={data.products}
            orders={data.orders}
            quotes={data.quotes}
            clients={data.clients}
            onNavigateTab={(tab, orderId) => {
              if (tab === 'calculadora') {
                onBackToCalculator();
              } else {
                if (tab === 'comparacao') setCompareOrderId(orderId);
                setActiveTab(tab);
              }
            }}
            onOpenNewOrder={() => setActiveTab('pedidos')}
            onOpenNewSupplier={() => setActiveTab('fornecedores')}
            onOpenNewProduct={() => setActiveTab('produtos')}
            onSendProductToCalculator={prod => handleSendProductToCalculator(prod)}
          />
        )}

        {activeTab === 'fornecedores' && (
          <SuppliersView
            suppliers={data.suppliers}
            contacts={data.contacts}
            onSaveSupplier={handleSaveSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        )}

        {activeTab === 'produtos' && (
          <ProductsView
            products={data.products}
            suppliers={data.suppliers}
            relations={data.relations}
            categories={data.settings.productCategories}
            defaultPorts={data.settings.defaultChinesePorts || data.settings.defaultLoadingPorts}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onSaveRelation={handleSaveRelation}
            onDeleteRelation={handleDeleteRelation}
            onSendToCalculator={handleSendProductToCalculator}
          />
        )}

        {activeTab === 'pedidos' && (
          <OrdersView
            orders={data.orders}
            clients={data.clients}
            products={data.products}
            destinations={data.settings.mozambiqueDestinations}
            onSaveOrder={handleSaveOrder}
            onDeleteOrder={handleDeleteOrder}
            onNavigateToQuotes={orderId => {
              setCompareOrderId(orderId);
              setActiveTab('comparacao');
            }}
          />
        )}

        {activeTab === 'cotacoes' && (
          <QuotationsView
            quotes={data.quotes}
            orders={data.orders}
            suppliers={data.suppliers}
            products={data.products}
            defaultPorts={data.settings.defaultChinesePorts || data.settings.defaultLoadingPorts}
            destinations={data.settings.mozambiqueDestinations}
            onSaveQuote={handleSaveQuote}
            onDeleteQuote={handleDeleteQuote}
            onSendQuoteToCalculator={handleSendQuoteToCalculator}
            onNavigateToCompare={orderId => {
              setCompareOrderId(orderId);
              setActiveTab('comparacao');
            }}
          />
        )}

        {activeTab === 'comparacao' && (
          <ProposalCompareView
            orders={data.orders}
            quotes={data.quotes}
            suppliers={data.suppliers}
            products={data.products}
            clients={data.clients}
            preselectedOrderId={compareOrderId}
            onSendQuoteToCalculator={handleSendQuoteToCalculator}
            onOpenCommercialProposalModal={(order, quote) => {
              setProposalModal({
                isOpen: true,
                order,
                quote
              });
            }}
          />
        )}

        {activeTab === 'documentos' && (
          <CatalogsDocumentsView
            documents={data.documents}
            suppliers={data.suppliers}
            products={data.products}
            onSaveDocument={handleSaveDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeTab === 'clientes' && (
          <ClientsView
            clients={data.clients}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {activeTab === 'configuracoes' && (
          <SettingsView
            settings={data.settings}
            onSaveSettings={handleSaveSettings}
            onResetSeedData={handleResetSeedData}
          />
        )}
      </main>

      {/* Commercial Proposal Printable Modal */}
      {proposalModal.isOpen && proposalModal.order && proposalModal.quote && (
        <CommercialProposalModal
          isOpen={proposalModal.isOpen}
          order={proposalModal.order}
          quote={proposalModal.quote}
          supplier={data.suppliers.find(s => s.id === proposalModal.quote?.supplierId)}
          product={data.products.find(p => p.id === proposalModal.quote?.productId)}
          client={data.clients.find(c => c.id === proposalModal.order?.clientId)}
          settings={data.settings}
          onClose={() => setProposalModal({ isOpen: false, order: null, quote: null })}
        />
      )}
    </div>
  );
};
