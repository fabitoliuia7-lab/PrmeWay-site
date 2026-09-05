import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Check, 
  Send, 
  Award, 
  Clock, 
  DollarSign, 
  Ship, 
  Building2, 
  Star, 
  ArrowRight, 
  FileCheck,
  TrendingDown,
  Printer
} from 'lucide-react';
import { 
  Quotation, 
  SourcingOrder, 
  Supplier, 
  ProductItem, 
  SourcingClient 
} from '../types';

interface ProposalCompareViewProps {
  orders: SourcingOrder[];
  quotes: Quotation[];
  suppliers: Supplier[];
  products: ProductItem[];
  clients: SourcingClient[];
  preselectedOrderId?: string;
  onSendQuoteToCalculator: (quote: Quotation) => void;
  onOpenCommercialProposalModal: (order: SourcingOrder, quote: Quotation) => void;
}

export const ProposalCompareView: React.FC<ProposalCompareViewProps> = ({
  orders,
  quotes,
  suppliers,
  products,
  clients,
  preselectedOrderId,
  onSendQuoteToCalculator,
  onOpenCommercialProposalModal
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    preselectedOrderId || orders[0]?.id || ''
  );

  const currentOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  const client = useMemo(() => {
    if (!currentOrder) return null;
    return clients.find(c => c.id === currentOrder.clientId);
  }, [currentOrder, clients]);

  // All quotes for this order
  const orderQuotes = useMemo(() => {
    if (!selectedOrderId) return [];
    return quotes.filter(q => q.orderId === selectedOrderId);
  }, [quotes, selectedOrderId]);

  // Find best metrics
  const minPrice = useMemo(() => {
    if (orderQuotes.length === 0) return 0;
    return Math.min(...orderQuotes.map(q => q.unitPrice));
  }, [orderQuotes]);

  const minLeadTime = useMemo(() => {
    if (orderQuotes.length === 0) return 0;
    return Math.min(...orderQuotes.map(q => q.leadTimeDays));
  }, [orderQuotes]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="text-corp-blue" size={26} />
            Comparativo de Fornecedores & Cotações
          </h2>
          <p className="text-xs text-slate-500">
            Análise lado a lado de fabricantes chineses para tomada de decisão e seleção da melhor oferta.
          </p>
        </div>

        {/* Order Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Selecionar Pedido:</label>
          <select
            value={selectedOrderId}
            onChange={e => setSelectedOrderId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold text-corp-blue focus:outline-none focus:border-corp-blue"
          >
            {orders.map(o => (
              <option key={o.id} value={o.id}>
                {o.id} - {o.requestedProduct}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Order Context Card */}
      {currentOrder && (
        <div className="bg-gradient-to-r from-blue-900 via-[#1e3a8a] to-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
                {currentOrder.id}
              </span>
              <span className="text-xs text-slate-300">Cliente: <strong>{client?.company || client?.name}</strong></span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-300">Destino: <strong>{currentOrder.mozambiqueDestination}</strong></span>
            </div>
            <h3 className="font-bold text-lg text-white">
              {currentOrder.requestedProduct}
            </h3>
            <p className="text-xs text-slate-300 line-clamp-1">{currentOrder.description}</p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-3 rounded-xl backdrop-blur-sm shrink-0">
            <div>
              <span className="block text-[10px] uppercase text-slate-300">Demanda:</span>
              <strong className="text-sm font-bold text-white">{(currentOrder.quantity || 1).toLocaleString('pt-BR')} un</strong>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="block text-[10px] uppercase text-slate-300">Orçamento Alvo:</span>
              <strong className="text-sm font-bold text-emerald-300">
                {currentOrder.currency} ${(currentOrder.budget || 0).toLocaleString('pt-BR')}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid / Table */}
      {orderQuotes.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          Nenhuma cotação cadastrada para este pedido ainda. Vá para a aba "Cotações" para adicionar propostas de fornecedores chineses.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orderQuotes.map(quote => {
            const supp = suppliers.find(s => s.id === quote.supplierId);
            const prod = products.find(p => p.id === quote.productId);
            const isLowestPrice = quote.unitPrice === minPrice;
            const isFastest = quote.leadTimeDays === minLeadTime;

            return (
              <div 
                key={quote.id} 
                className={`bg-white rounded-2xl border ${
                  isLowestPrice 
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20' 
                    : 'border-slate-200/80 shadow-sm'
                } p-5 flex flex-col justify-between space-y-4 relative`}
              >
                {/* Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {quote.id}
                    </span>
                    {supp?.trustLevel === 'ouro' && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-0.5">
                        <Award size={11} /> Selo Ouro
                      </span>
                    )}
                  </div>

                  {isLowestPrice && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <TrendingDown size={12} /> Menor Preço
                    </span>
                  )}
                </div>

                {/* Fornecedor Info */}
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {supp?.companyName || quote.supplierId}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>{supp?.city}, China</span>
                    <span>•</span>
                    <div className="flex items-center text-amber-500">
                      <Star size={12} className="fill-amber-400 text-amber-400 mr-0.5" />
                      <span className="font-bold text-slate-700">{supp?.internalRating || 5}/5</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Block */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Preço Unitário:</span>
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {quote.currency} ${quote.unitPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Total Mercadoria ({quote.quotedQuantity ?? quote.quantity ?? 1} un):</span>
                    <strong className="text-slate-800 font-mono">
                      {quote.currency} ${(quote.totalMerchandise ?? ((quote.unitPrice || 0) * (quote.quotedQuantity ?? quote.quantity ?? 1))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Frete Est. até Moçambique:</span>
                    <strong className="text-slate-800 font-mono">
                      USD ${(quote.estimatedFreightUSD ?? quote.estimatedFreight ?? 0).toLocaleString('pt-BR')}
                    </strong>
                  </div>
                </div>

                {/* Termos & Logística */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Incoterm & Embarque</span>
                    <strong className="text-slate-800 text-[11px]">{quote.incoterm} - {quote.loadingPort}</strong>
                  </div>

                  <div className="bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Produção</span>
                    <strong className={`text-[11px] ${isFastest ? 'text-emerald-700 font-extrabold' : 'text-slate-800'}`}>
                      {quote.leadTimeDays} dias {isFastest && '⚡'}
                    </strong>
                  </div>
                </div>

                {/* Condições de Pagamento */}
                <div className="text-[11px] text-slate-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/60">
                  <span className="font-semibold text-corp-blue block mb-0.5">Condições Comerciais:</span>
                  {quote.paymentTerms || '30% T/T adiantado'}
                </div>

                {/* Ações */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onSendQuoteToCalculator(quote)}
                    className="w-full flex items-center justify-center gap-2 bg-corp-blue hover:bg-corp-orange text-white py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    title="Preenche a calculadora com os dados desta cotação"
                  >
                    <Send size={13} />
                    Enviar para Calculadora
                  </button>

                  <button
                    onClick={() => currentOrder && onOpenCommercialProposalModal(currentOrder, quote)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileCheck size={13} />
                    Gerar Proposta Comercial (PDF)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
