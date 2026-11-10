import React from 'react';
import { 
  Building2, 
  Package, 
  FileText, 
  ClipboardList, 
  ArrowUpRight, 
  Plus, 
  Send,
  Edit3
} from 'lucide-react';
import { 
  Supplier, 
  ProductItem, 
  SourcingOrder, 
  Quotation, 
  SourcingClient 
} from '../types';

interface DashboardViewProps {
  suppliers: Supplier[];
  products: ProductItem[];
  orders: SourcingOrder[];
  quotes: Quotation[];
  clients: SourcingClient[];
  onNavigateTab: (tab: string, orderId?: string) => void;
  onOpenNewOrder: () => void;
  onOpenNewSupplier: () => void;
  onOpenNewProduct: () => void;
  onSendProductToCalculator: (product: ProductItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  suppliers,
  products,
  orders,
  quotes,
  clients,
  onNavigateTab,
  onOpenNewOrder,
  onOpenNewSupplier,
  onOpenNewProduct,
  onSendProductToCalculator
}) => {
  const activeOrders = orders.filter(o => o.status !== 'concluido' && o.status !== 'cancelado');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900">
          Painel de sourcing
        </h1>
        <button
          onClick={onOpenNewOrder}
          className="self-start sm:self-auto flex items-center gap-2 bg-corp-orange hover:bg-corp-orange-dark text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} /> Novo pedido
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fornecedores */}
        <button
          type="button"
          onClick={() => onNavigateTab('fornecedores')}
          aria-label={`Fornecedores: ${suppliers.length}`}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-corp-blue-light transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fornecedores</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-corp-blue flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 size={20} />
            </div>
          </div>
          <span className="text-3xl font-heading font-extrabold text-slate-900">{suppliers.length}</span>
        </button>

        {/* Produtos Cadastrados */}
        <button
          type="button"
          onClick={() => onNavigateTab('produtos')}
          aria-label={`Produtos: ${products.length}`}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-corp-blue-light transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Produtos</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package size={20} />
            </div>
          </div>
          <span className="text-3xl font-heading font-extrabold text-slate-900">{products.length}</span>
        </button>

        {/* Pedidos de Sourcing */}
        <button
          type="button"
          onClick={() => onNavigateTab('pedidos')}
          aria-label={`Pedidos ativos: ${activeOrders.length}`}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-corp-blue-light transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pedidos ativos</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList size={20} />
            </div>
          </div>
          <span className="text-3xl font-heading font-extrabold text-slate-900">{activeOrders.length}</span>
        </button>

        {/* Cotações */}
        <button
          type="button"
          onClick={() => onNavigateTab('cotacoes')}
          aria-label={`Cotações: ${quotes.length}`}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-corp-blue-light transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cotações</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
          </div>
          <span className="text-3xl font-heading font-extrabold text-slate-900">{quotes.length}</span>
        </button>
      </div>

      {/* Grid: Pedidos Recentes & Produtos Populares */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna 1 & 2: Pipeline de Pedidos de Sourcing */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <ClipboardList size={18} className="text-corp-blue" />
                Pedidos recentes
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('pedidos')}
              className="text-xs font-bold text-corp-blue hover:text-corp-orange flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.slice(0, 5).map(order => {
              const client = clients.find(c => c.id === order.clientId);
              return (
                <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                        {order.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {order.status}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">{client?.company || client?.name || 'Cliente'}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{order.requestedProduct}</h4>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {(order.quantity || 1).toLocaleString('pt-BR')} un
                      </div>
                      <div className="text-[11px] font-semibold text-corp-blue">
                        {order.currency} {Number(order.budget || 0).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateTab('comparacao', order.id)}
                      className="px-3 py-1.5 bg-blue-50 text-corp-blue hover:bg-corp-blue hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Comparar cotações deste pedido"
                    >
                      Comparar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna 3: Produtos Mapeados & Ação Rápida */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <Package size={18} className="text-emerald-600" />
                Catálogo rápido
              </h3>
              <button
                onClick={onOpenNewProduct}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus size={14} /> Novo produto
              </button>
            </div>

            <div className="space-y-3">
              {products.slice(0, 4).map(prod => {
                const supplier = suppliers.find(item => item.id === prod.defaultSupplierId);
                return (
                <div key={prod.id} className="p-3 border border-slate-100 rounded-xl hover:border-slate-300 transition-all bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    {prod.images && prod.images.length > 0 && prod.images[0] && prod.images[0].trim() !== '' && prod.images[0] !== '/IMG-20260215-WA0003.jpg' ? (
                      <img 
                        src={prod.images[0]} 
                        alt={prod.namePt}
                        className="w-12 h-12 rounded-lg object-cover bg-white p-0.5 border border-slate-200 shrink-0" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                        <Package size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={prod.namePt}>
                        {prod.namePt}
                      </h4>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        {prod.indicativePrice ? (
                          <span className="text-[11px] font-mono font-bold text-emerald-700 shrink-0">
                            {prod.currency || 'USD'} {prod.indicativePrice.toFixed(2)} / {prod.priceUnit || 'unidade'} · MOQ {prod.moq || 1}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Preço por definir</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {supplier?.companyName || 'Fornecedor por definir'}
                      </p>
                    </div>
                  </div>

                  <details className="mt-2 text-[10px] text-slate-500">
                    <summary className="cursor-pointer font-semibold">Detalhes</summary>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2">
                      <span>Categoria: {prod.category}</span>
                      <span>HS: {prod.hsCode || 'N/D'}</span>
                      {prod.nameEn && <span>EN: {prod.nameEn}</span>}
                      {prod.nameCn && <span>CN: {prod.nameCn}</span>}
                    </div>
                  </details>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-end gap-3">
                    <button
                      onClick={() => onNavigateTab('produtos')}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Abrir produto no catálogo"
                    >
                      <Edit3 size={11} /> Ver catálogo
                    </button>
                    <button
                      onClick={() => onSendProductToCalculator(prod)}
                      className="text-[11px] font-bold text-corp-blue hover:text-corp-orange flex items-center gap-1 transition-colors cursor-pointer"
                      title="Simular custos de importação"
                    >
                      <Send size={12} /> Simular
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={onOpenNewSupplier}
              className="text-xs font-bold text-corp-blue hover:text-corp-orange transition-colors"
            >
              + Novo fornecedor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
