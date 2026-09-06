import React from 'react';
import { 
  Building2, 
  Package, 
  FileText, 
  ClipboardList, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Plus, 
  Calculator, 
  Scale,
  Award,
  Globe2,
  Send
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
  onNavigateTab: (tab: string) => void;
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
  const pendingQuotes = quotes.filter(q => q.status === 'em_analise' || q.status === 'recebida');
  const goldSuppliers = suppliers.filter(s => s.trustLevel === 'ouro');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#1A284F] via-[#243763] to-[#1A284F] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-corp-orange/20 border border-corp-orange/30 text-corp-orange text-xs font-bold uppercase tracking-wider">
              <Globe2 size={13} />
              Sourcing China ➔ Moçambique
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
              Painel de Controlo de Sourcing & Fornecedores
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Gestão centralizada de fabricantes chineses, catálogos, pedidos de cotação e integração direta com a calculadora aduaneira da PrimeWay.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewOrder}
              className="flex items-center gap-2 bg-corp-orange hover:bg-corp-orange-dark text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-corp-orange/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus size={16} /> Novo Pedido
            </button>
            <button
              onClick={() => onNavigateTab('calculadora')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer backdrop-blur-sm"
            >
              <Calculator size={16} className="text-sky-300" /> Abrir Calculadora
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fornecedores */}
        <div 
          onClick={() => onNavigateTab('fornecedores')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-corp-blue-light transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fornecedores Chineses</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-corp-blue flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900">{suppliers.length}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <Award size={13} className="mr-0.5" /> {goldSuppliers.length} Selo Ouro
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Guangzhou, Yiwu, Foshan, Shenzhen</p>
        </div>

        {/* Produtos Cadastrados */}
        <div 
          onClick={() => onNavigateTab('produtos')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-corp-blue-light transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Produtos no Catálogo</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900">{products.length}</span>
            <span className="text-xs text-slate-600 font-medium">Itens mapeados</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Com códigos HS e especificações físicas</p>
        </div>

        {/* Pedidos de Sourcing */}
        <div 
          onClick={() => onNavigateTab('pedidos')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-corp-blue-light transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pedidos em Curso</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900">{activeOrders.length}</span>
            <span className="text-xs text-amber-600 font-semibold flex items-center">
              <Clock size={13} className="mr-0.5" /> Ativos
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{orders.length} pedidos totais registados</p>
        </div>

        {/* Cotações */}
        <div 
          onClick={() => onNavigateTab('cotacoes')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-corp-blue-light transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cotações Recebidas</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900">{quotes.length}</span>
            <span className="text-xs text-purple-600 font-semibold flex items-center">
              <Scale size={13} className="mr-0.5" /> {pendingQuotes.length} sob análise
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Prontas para envio à calculadora</p>
        </div>
      </div>

      {/* Grid: Pedidos Recentes & Produtos Populares */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna 1 & 2: Pipeline de Pedidos de Sourcing */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <ClipboardList size={18} className="text-corp-blue" />
                Pedidos de Sourcing de Clientes
              </h3>
              <p className="text-xs text-slate-500">Demandas ativas de clientes moçambicanos para cotação na China</p>
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                        {order.id}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        order.priority === 'urgente' ? 'bg-red-100 text-red-700' :
                        order.priority === 'alta' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {order.priority}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">{client?.company || client?.name || 'Cliente'}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{order.requestedProduct}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{order.description}</p>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {(order.quantity || 1).toLocaleString('pt-BR')} un
                      </div>
                      <div className="text-[11px] font-semibold text-corp-blue">
                        Alvo: {order.currency} ${(order.budget || 0).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateTab('comparacao')}
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
              <h3 className="font-heading font-bold text-base text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Package size={18} className="text-emerald-600" />
                Catálogo Rápido
              </h3>
              <button
                onClick={onOpenNewProduct}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus size={14} /> Novo
              </button>
            </div>

            <div className="space-y-3">
              {products.slice(0, 4).map(prod => (
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
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{prod.id}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-medium truncate">
                          {prod.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={prod.namePt}>
                        {prod.namePt}
                      </h4>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-[11px] text-slate-500 font-serif italic truncate">{prod.nameCn}</p>
                        {prod.indicativePrice ? (
                          <span className="text-[11px] font-mono font-bold text-emerald-700 shrink-0">
                            {prod.currency || 'USD'} ${prod.indicativePrice.toFixed(2)} (MOQ: {prod.moq || 1})
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      HS: {prod.hsCode || 'N/D'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onNavigateTab('produtos')}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ir para o Catálogo para Editar Preço & MOQ"
                      >
                        <Edit3 size={11} /> Editar
                      </button>
                      <button
                        onClick={() => onSendProductToCalculator(prod)}
                        className="text-[11px] font-bold text-corp-blue hover:text-corp-orange flex items-center gap-1 transition-colors cursor-pointer"
                        title="Calcular custos de importação para Moçambique"
                      >
                        <Send size={12} /> Calculadora
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-corp-blue text-white flex items-center justify-center shrink-0">
                <Calculator size={18} />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Precisa cotar um novo item?</span>
                <span className="text-slate-600">Simule fretes e desembaraço aduaneiro agora.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
