import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Building2, 
  Package, 
  Send, 
  Edit3, 
  Trash2, 
  X, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  DollarSign, 
  Ship, 
  ExternalLink 
} from 'lucide-react';
import { 
  Quotation, 
  SourcingOrder, 
  Supplier, 
  ProductItem, 
  CurrencyType, 
  IncotermType, 
  QuotationStatus 
} from '../types';
import { generateNextId } from '../idGenerator';

interface QuotationsViewProps {
  quotes: Quotation[];
  orders: SourcingOrder[];
  suppliers: Supplier[];
  products: ProductItem[];
  defaultPorts: string[];
  destinations: string[];
  selectedOrderIdFilter?: string;
  onSaveQuote: (quote: Quotation) => void;
  onDeleteQuote: (quoteId: string) => void;
  onSendQuoteToCalculator: (quote: Quotation) => void;
  onNavigateToCompare: (orderId: string) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  quotes,
  orders,
  suppliers,
  products,
  defaultPorts,
  destinations,
  selectedOrderIdFilter,
  onSaveQuote,
  onDeleteQuote,
  onSendQuoteToCalculator,
  onNavigateToCompare
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>(selectedOrderIdFilter || 'todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);

  const [formData, setFormData] = useState<Partial<Quotation>>({
    orderId: orders[0]?.id || '',
    supplierId: suppliers[0]?.id || '',
    productId: products[0]?.id || '',
    quotationDate: new Date().toISOString().split('T')[0],
    validityDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    unitPrice: 10,
    currency: 'USD',
    quotedQuantity: 100,
    totalMerchandise: 1000,
    incoterm: 'FOB',
    loadingPort: defaultPorts[0] || 'Guangzhou',
    destinationPort: destinations[0] || 'Porto de Maputo (CFM)',
    estimatedFreightUSD: 500,
    estimatedInsuranceUSD: 50,
    leadTimeDays: 15,
    estimatedDeliveryDays: 45,
    paymentTerms: '30% T/T adiantado, 70% antes do embarque',
    quoteRating: 5,
    status: 'em_analise',
    attachmentUrl: '',
    notes: ''
  });

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const supp = suppliers.find(s => s.id === q.supplierId);
      const prod = products.find(p => p.id === q.productId);
      const search = searchTerm.toLowerCase();

      const matchSearch = 
        q.id.toLowerCase().includes(search) ||
        q.orderId.toLowerCase().includes(search) ||
        (supp && supp.companyName.toLowerCase().includes(search)) ||
        (prod && prod.namePt.toLowerCase().includes(search));

      const matchOrder = orderFilter === 'todos' || q.orderId === orderFilter;
      const matchStatus = statusFilter === 'todos' || q.status === statusFilter;

      return matchSearch && matchOrder && matchStatus;
    });
  }, [quotes, suppliers, products, searchTerm, orderFilter, statusFilter]);

  const handleOpenNew = () => {
    const nextId = generateNextId('COT', quotes);
    setEditingQuote(null);
    setFormData({
      id: nextId,
      orderId: orderFilter !== 'todos' ? orderFilter : (orders[0]?.id || ''),
      supplierId: suppliers[0]?.id || '',
      productId: products[0]?.id || '',
      quotationDate: new Date().toISOString().split('T')[0],
      validityDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      unitPrice: 25,
      currency: 'USD',
      quotedQuantity: 100,
      totalMerchandise: 2500,
      incoterm: 'FOB',
      loadingPort: defaultPorts[0] || 'Guangzhou',
      destinationPort: destinations[0] || 'Porto de Maputo (CFM)',
      estimatedFreightUSD: 600,
      estimatedInsuranceUSD: 60,
      leadTimeDays: 15,
      estimatedDeliveryDays: 45,
      paymentTerms: '30% T/T sinal, 70% contra cópia do B/L',
      quoteRating: 5,
      status: 'recebida',
      attachmentUrl: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (quote: Quotation) => {
    setEditingQuote(quote);
    setFormData({ ...quote });
    setIsModalOpen(true);
  };

  // Recalculate total merchandise
  const handlePriceOrQtyChange = (price: number, qty: number) => {
    const total = Number((price * qty).toFixed(2));
    setFormData(prev => ({
      ...prev,
      unitPrice: price,
      quotedQuantity: qty,
      totalMerchandise: total
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderId || !formData.supplierId || !formData.productId) {
      alert('Selecione o pedido, o fornecedor e o produto.');
      return;
    }

    const nowStr = new Date().toISOString();
    const dateOnly = nowStr.split('T')[0];
    const qty = Number(formData.quotedQuantity) || Number(formData.quantity) || 1;
    const freight = Number(formData.estimatedFreightUSD) || Number(formData.estimatedFreight) || 0;
    const leadTime = Number(formData.leadTimeDays) || Number(formData.productionLeadTimeDays) || 15;

    const saved: Quotation = {
      id: formData.id || generateNextId('COT', quotes),
      orderId: formData.orderId,
      supplierId: formData.supplierId,
      productId: formData.productId,
      requestDate: formData.requestDate || dateOnly,
      responseDate: formData.responseDate || formData.quotationDate || dateOnly,
      quotationDate: formData.quotationDate || dateOnly,
      validUntil: formData.validUntil || formData.validityDate || dateOnly,
      validityDate: formData.validityDate || formData.validUntil || dateOnly,
      unitPrice: Number(formData.unitPrice) || 0,
      quantity: qty,
      quotedQuantity: qty,
      totalMerchandise: Number(formData.totalMerchandise) || (Number(formData.unitPrice) * qty),
      currency: (formData.currency as CurrencyType) || 'USD',
      incoterm: (formData.incoterm as IncotermType) || 'FOB',
      loadingPort: formData.loadingPort || 'Guangzhou',
      destinationPort: formData.destinationPort || 'Porto de Maputo (CFM)',
      estimatedFreight: freight,
      estimatedFreightUSD: freight,
      estimatedInsurance: Number(formData.estimatedInsuranceUSD) || 0,
      estimatedInsuranceUSD: Number(formData.estimatedInsuranceUSD) || 0,
      productionLeadTimeDays: leadTime,
      leadTimeDays: leadTime,
      estimatedDeliveryDays: Number(formData.estimatedDeliveryDays) || 45,
      paymentTerms: formData.paymentTerms || '',
      internalRating: Number(formData.quoteRating) || Number(formData.internalRating) || 5,
      quoteRating: Number(formData.quoteRating) || 5,
      status: (formData.status as QuotationStatus) || 'recebida',
      attachmentUrl: formData.attachmentUrl || '',
      notes: formData.notes || '',
      createdAt: formData.createdAt || nowStr
    };

    onSaveQuote(saved);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="text-purple-600" size={26} />
            Cotações Recebidas de Fornecedores
          </h2>
          <p className="text-xs text-slate-500">
            Registo detalhado de orçamentos, prazos de entrega e condições comerciais da China.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="btn-modern-primary flex items-center gap-2 text-xs font-bold uppercase tracking-wider !py-2.5 px-4 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Lançar Cotação
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por COT-0001, fornecedor ou produto..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
            />
          </div>

          <div>
            <select
              value={orderFilter}
              onChange={e => setOrderFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="todos">Filtrar por Pedido (Todos)</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.id} - {o.requestedProduct}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="todos">Status (Todos)</option>
              <option value="recebida">Recebida</option>
              <option value="em_analise">Em Análise</option>
              <option value="aprovada">Aprovada / Recomendada</option>
              <option value="rejeitada">Rejeitada</option>
            </select>
          </div>
        </div>

        {orderFilter !== 'todos' && (
          <div className="flex items-center justify-between bg-purple-50 p-2.5 rounded-xl text-xs text-purple-900">
            <span>A filtrar pelo pedido <strong>{orderFilter}</strong></span>
            <button
              onClick={() => onNavigateToCompare(orderFilter)}
              className="font-bold underline flex items-center gap-1 hover:text-purple-700"
            >
              Abrir Comparação Lado a Lado deste Pedido →
            </button>
          </div>
        )}
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Cotação & Pedido</th>
                <th className="py-3 px-4">Fornecedor & Produto</th>
                <th className="py-3 px-4">Preço Unitário & Total</th>
                <th className="py-3 px-4">Incoterm & Frete Est.</th>
                <th className="py-3 px-4">Prazos & Validade</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhuma cotação encontrada.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map(quote => {
                  const supp = suppliers.find(s => s.id === quote.supplierId);
                  const prod = products.find(p => p.id === quote.productId);

                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Código & Pedido */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <span className="font-mono text-[11px] font-extrabold px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">
                            {quote.id}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            Pedido: <strong className="text-slate-700">{quote.orderId}</strong>
                          </div>
                          <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            quote.status === 'aprovada' ? 'bg-emerald-100 text-emerald-700' :
                            quote.status === 'rejeitada' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {quote.status}
                          </span>
                        </div>
                      </td>

                      {/* Fornecedor & Produto */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-sm">
                            {supp?.companyName || quote.supplierId}
                          </div>
                          <div className="text-xs text-slate-600 font-medium">
                            {prod?.namePt || quote.productId}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Qtd: {(quote.quotedQuantity ?? quote.quantity ?? 1).toLocaleString('pt-BR')} un
                          </div>
                        </div>
                      </td>

                      {/* Preço Unitário & Total */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-0.5">
                          <div className="text-emerald-700 font-extrabold text-sm">
                            {quote.currency} ${(quote.unitPrice || 0).toFixed(2)}
                          </div>
                          <div className="text-[11px] text-slate-600 font-semibold">
                            Total: {quote.currency} ${(quote.totalMerchandise ?? ((quote.unitPrice || 0) * (quote.quotedQuantity ?? quote.quantity ?? 1))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Pagamento: {quote.paymentTerms}
                          </div>
                        </div>
                      </td>

                      {/* Incoterm & Frete */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {quote.incoterm} - {quote.loadingPort}
                          </span>
                          <div className="text-[11px] text-slate-500">
                            Destino: {quote.destinationPort}
                          </div>
                          <div className="text-[11px] text-slate-700 font-medium">
                            Frete Marítimo: <strong>USD ${quote.estimatedFreightUSD}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Prazos & Validade */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1 text-[11px]">
                          <div>Produção: <strong>{quote.leadTimeDays} dias</strong></div>
                          <div>Trânsito Est.: <strong>{quote.estimatedDeliveryDays} dias</strong></div>
                          <div className="text-slate-400 text-[10px]">
                            Válido até: <strong>{quote.validityDate}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSendQuoteToCalculator(quote)}
                            className="p-1.5 bg-blue-50 text-corp-blue hover:bg-corp-orange hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Enviar esta cotação para a Calculadora PrimeWay"
                          >
                            <Send size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(quote)}
                            className="p-1.5 text-slate-400 hover:text-corp-blue rounded-lg"
                            title="Editar Cotação"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Excluir a cotação ${quote.id}?`)) {
                                onDeleteQuote(quote.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar / Editar Cotação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900 uppercase tracking-tight">
                  {editingQuote ? `Editar Cotação (${formData.id})` : 'Registar Cotação da China'}
                </h3>
                <p className="text-xs text-slate-500">
                  Preencha os valores informados pelo fabricante chinês no WeChat / Proforma.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pedido de Sourcing *</label>
                  <select
                    required
                    value={formData.orderId}
                    onChange={e => setFormData({ ...formData, orderId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.id} - {o.requestedProduct}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fornecedor Chinês *</label>
                  <select
                    required
                    value={formData.supplierId}
                    onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Produto *</label>
                  <select
                    required
                    value={formData.productId}
                    onChange={e => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.namePt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preço e Quantidade */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preço Unitário *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitPrice || ''}
                    onChange={e => handlePriceOrQtyChange(parseFloat(e.target.value) || 0, formData.quotedQuantity || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Moeda</label>
                  <select
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value as CurrencyType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="MZN">MZN (MT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade Cotada</label>
                  <input
                    type="number"
                    required
                    value={formData.quotedQuantity || ''}
                    onChange={e => handlePriceOrQtyChange(formData.unitPrice || 0, parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Mercadoria</label>
                  <input
                    type="text"
                    disabled
                    value={`${formData.currency} $${formData.totalMerchandise?.toFixed(2)}`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700"
                  />
                </div>
              </div>

              {/* Incoterms e Logística */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Incoterm</label>
                  <select
                    value={formData.incoterm}
                    onChange={e => setFormData({ ...formData, incoterm: e.target.value as IncotermType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                  >
                    <option value="FOB">FOB</option>
                    <option value="EXW">EXW</option>
                    <option value="CIF">CIF</option>
                    <option value="DDP">DDP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Porto de Embarque</label>
                  <select
                    value={formData.loadingPort}
                    onChange={e => setFormData({ ...formData, loadingPort: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {defaultPorts.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destino Moçambique</label>
                  <select
                    value={formData.destinationPort}
                    onChange={e => setFormData({ ...formData, destinationPort: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {destinations.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frete Internacional Est. (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estimatedFreightUSD || ''}
                    onChange={e => setFormData({ ...formData, estimatedFreightUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Prazos e Condições */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prazo de Produção (Dias)</label>
                  <input
                    type="number"
                    value={formData.leadTimeDays || ''}
                    onChange={e => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prazo de Entrega Estimado (Dias)</label>
                  <input
                    type="number"
                    value={formData.estimatedDeliveryDays || ''}
                    onChange={e => setFormData({ ...formData, estimatedDeliveryDays: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Validade da Cotação</label>
                  <input
                    type="date"
                    value={formData.validityDate}
                    onChange={e => setFormData({ ...formData, validityDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condições de Pagamento</label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="Ex: 30% T/T adiantado, 70% antes do embarque"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status da Cotação</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as QuotationStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                  >
                    <option value="recebida">Recebida</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="aprovada">Aprovada (Melhor Cotação)</option>
                    <option value="rejeitada">Rejeitada</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-modern-primary !py-2.5 px-6 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {editingQuote ? 'Atualizar Cotação' : 'Guardar Cotação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
