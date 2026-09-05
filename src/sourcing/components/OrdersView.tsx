import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Clock, 
  User, 
  MapPin, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  X, 
  Send,
  Scale
} from 'lucide-react';
import { 
  SourcingOrder, 
  SourcingClient, 
  ProductItem, 
  OrderStatus, 
  OrderPriority, 
  CurrencyType 
} from '../types';
import { generateNextId } from '../idGenerator';

interface OrdersViewProps {
  orders: SourcingOrder[];
  clients: SourcingClient[];
  products: ProductItem[];
  destinations: string[];
  onSaveOrder: (order: SourcingOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onNavigateToQuotes: (orderId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  clients,
  products,
  destinations,
  onSaveOrder,
  onDeleteOrder,
  onNavigateToQuotes
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [selectedPriority, setSelectedPriority] = useState('todos');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SourcingOrder | null>(null);

  const [formData, setFormData] = useState<Partial<SourcingOrder>>({
    clientId: clients[0]?.id || '',
    requestedProduct: '',
    description: '',
    quantity: 100,
    budget: 1000,
    currency: 'USD',
    mozambiqueDestination: destinations[0] || 'Porto de Maputo (CFM)',
    deadline: '',
    customization: '',
    status: 'aberto',
    priority: 'media',
    assignedTo: 'Equipa PrimeWay'
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const client = clients.find(c => c.id === o.clientId);
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        o.id.toLowerCase().includes(search) ||
        o.requestedProduct.toLowerCase().includes(search) ||
        o.description.toLowerCase().includes(search) ||
        (client && (client.name.toLowerCase().includes(search) || client.company.toLowerCase().includes(search)));

      const matchStatus = selectedStatus === 'todos' || o.status === selectedStatus;
      const matchPriority = selectedPriority === 'todos' || o.priority === selectedPriority;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [orders, clients, searchTerm, selectedStatus, selectedPriority]);

  const handleOpenNew = () => {
    const nextId = generateNextId('PED', orders);
    setEditingOrder(null);
    setFormData({
      id: nextId,
      clientId: clients[0]?.id || '',
      requestedProduct: '',
      description: '',
      quantity: 100,
      budget: 5000,
      currency: 'USD',
      mozambiqueDestination: destinations[0] || 'Porto de Maputo (CFM)',
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      customization: '',
      status: 'aberto',
      priority: 'media',
      assignedTo: 'Equipa PrimeWay Guangzhou',
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: SourcingOrder) => {
    setEditingOrder(order);
    setFormData({ ...order });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requestedProduct?.trim() || !formData.clientId) {
      alert('Preencha o cliente e o produto solicitado.');
      return;
    }

    const saved: SourcingOrder = {
      id: formData.id || generateNextId('PED', orders),
      clientId: formData.clientId,
      productId: formData.productId || undefined,
      requestedProduct: formData.requestedProduct,
      description: formData.description || '',
      quantity: Number(formData.quantity) || 1,
      budget: Number(formData.budget) || 0,
      currency: (formData.currency as CurrencyType) || 'USD',
      mozambiqueDestination: formData.mozambiqueDestination || 'Porto de Maputo (CFM)',
      deadline: formData.deadline || '',
      customization: formData.customization || '',
      status: (formData.status as OrderStatus) || 'aberto',
      priority: (formData.priority as OrderPriority) || 'media',
      assignedTo: formData.assignedTo || 'Equipa PrimeWay',
      createdAt: formData.createdAt || new Date().toISOString()
    };

    onSaveOrder(saved);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-corp-blue" size={26} />
            Pedidos de Sourcing de Clientes
          </h2>
          <p className="text-xs text-slate-500">
            Registo de demandas para busca de fabricantes chineses, negociação de preços e prazos.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="btn-modern-primary flex items-center gap-2 text-xs font-bold uppercase tracking-wider !py-2.5 px-4 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Criar Pedido
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
              placeholder="Pesquisar por PED-0001, cliente ou produto..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="todos">Status (Todos)</option>
              <option value="aberto">Aberto / Novo</option>
              <option value="em_pesquisa">Em Pesquisa na China</option>
              <option value="cotacoes_recebidas">Cotações Recebidas</option>
              <option value="proposta_enviada">Proposta Enviada ao Cliente</option>
              <option value="aprovado">Aprovado pelo Cliente</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="todos">Prioridade (Todas)</option>
              <option value="urgente">🚨 Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Nenhum pedido de sourcing encontrado.
          </div>
        ) : (
          filteredOrders.map(order => {
            const client = clients.find(c => c.id === order.clientId);
            return (
              <div 
                key={order.id} 
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 bg-blue-50 text-corp-blue rounded-md border border-blue-100">
                      {order.id}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      order.priority === 'urgente' ? 'bg-red-100 text-red-700 font-extrabold' :
                      order.priority === 'alta' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      Prioridade {order.priority}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => onNavigateToQuotes(order.id)}
                      className="px-3 py-1.5 bg-blue-50 text-corp-blue hover:bg-corp-blue hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Scale size={13} /> Ver Cotações
                    </button>
                    <button
                      onClick={() => handleOpenEdit(order)}
                      className="p-1.5 text-slate-400 hover:text-corp-blue rounded-lg"
                      title="Editar Pedido"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir pedido ${order.id}?`)) {
                          onDeleteOrder(order.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                  <div className="lg:col-span-2 space-y-1.5">
                    <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                      <User size={13} className="text-corp-orange" />
                      Cliente: <strong className="text-slate-900">{client?.company || client?.name || 'Cliente'}</strong>
                      {client?.city && <span className="text-slate-400">({client.city})</span>}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {order.requestedProduct}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {order.description}
                    </p>
                    {order.customization && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100 font-medium">
                        <strong>Personalização solicitada:</strong> {order.customization}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quantidade Alvo:</span>
                      <strong className="text-slate-900 font-mono">{(order.quantity || 1).toLocaleString('pt-BR')} un</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Orçamento Máximo:</span>
                      <strong className="text-emerald-700 font-mono font-extrabold">
                        {order.currency} ${(order.budget || 0).toLocaleString('pt-BR')}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Destino:</span>
                      <span className="text-slate-800 font-semibold truncate text-right">{order.mozambiqueDestination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Prazo Desejado:</span>
                      <strong className="text-slate-700">{order.deadline || 'Flexível'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Criar / Editar Pedido */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-corp-blue text-white flex items-center justify-center shadow-md">
                <ClipboardList size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900 uppercase tracking-tight">
                  {editingOrder ? `Editar Pedido (${formData.id})` : 'Novo Pedido de Sourcing'}
                </h3>
                <p className="text-xs text-slate-500">
                  Registe a solicitação do cliente em Moçambique para cotação direta na China.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente *</label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.company || c.name} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vincular a Produto do Catálogo (Opcional)</label>
                  <select
                    value={formData.productId || ''}
                    onChange={e => {
                      const prodId = e.target.value;
                      const prod = products.find(p => p.id === prodId);
                      setFormData({
                        ...formData,
                        productId: prodId,
                        requestedProduct: prod ? prod.namePt : formData.requestedProduct
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">Nenhum (Novo Produto Sob Demanda)</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.namePt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Produto Solicitado / Título *</label>
                <input
                  type="text"
                  required
                  value={formData.requestedProduct}
                  onChange={e => setFormData({ ...formData, requestedProduct: e.target.value })}
                  placeholder="Ex: 500 Unidades de Cabo Elétrico de Cobre 2.5mm"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição & Requisitos Específicos</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Especificações de qualidade, certificações exigidas, cor, embalagem..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Orçamento Alvo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget || ''}
                    onChange={e => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as OrderPriority })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                  >
                    <option value="urgente">🚨 Urgente</option>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destino em Moçambique</label>
                  <select
                    value={formData.mozambiqueDestination}
                    onChange={e => setFormData({ ...formData, mozambiqueDestination: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {destinations.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prazo Limite para Entrega</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requisitos de Personalização (OEM/ODM)</label>
                <input
                  type="text"
                  value={formData.customization}
                  onChange={e => setFormData({ ...formData, customization: e.target.value })}
                  placeholder="Ex: Marca própria gravada a laser, embalagem em português..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
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
                  {editingOrder ? 'Atualizar Pedido' : 'Registar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
