import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Edit3, 
  Trash2, 
  X,
  FileText
} from 'lucide-react';
import { SourcingClient } from '../types';
import { generateNextId } from '../idGenerator';

interface ClientsViewProps {
  clients: SourcingClient[];
  onSaveClient: (client: SourcingClient) => void;
  onDeleteClient: (clientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onSaveClient,
  onDeleteClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<SourcingClient | null>(null);

  const [formData, setFormData] = useState<Partial<SourcingClient>>({
    name: '',
    company: '',
    nuit: '',
    phone: '',
    email: '',
    city: 'Maputo',
    address: '',
    notes: ''
  });

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const search = searchTerm.toLowerCase();
      return (
        c.id.toLowerCase().includes(search) ||
        c.name.toLowerCase().includes(search) ||
        c.company.toLowerCase().includes(search) ||
        c.city.toLowerCase().includes(search) ||
        c.nuit.toLowerCase().includes(search)
      );
    });
  }, [clients, searchTerm]);

  const handleOpenNew = () => {
    const nextId = generateNextId('CLI', clients);
    setEditingClient(null);
    setFormData({
      id: nextId,
      name: '',
      company: '',
      nuit: '',
      phone: '',
      email: '',
      city: 'Maputo',
      address: '',
      notes: '',
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: SourcingClient) => {
    setEditingClient(client);
    setFormData({ ...client });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() && !formData.company?.trim()) {
      alert('Preencha o nome do cliente ou da empresa.');
      return;
    }

    const saved: SourcingClient = {
      id: formData.id || generateNextId('CLI', clients),
      name: formData.name || formData.company || 'Cliente',
      company: formData.company || formData.name || '',
      nuit: formData.nuit || '',
      phone: formData.phone || '',
      email: formData.email || '',
      city: formData.city || 'Maputo',
      address: formData.address || '',
      notes: formData.notes || '',
      createdAt: formData.createdAt || new Date().toISOString()
    };

    onSaveClient(saved);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-corp-blue" size={26} />
            Clientes em Moçambique
          </h2>
          <p className="text-xs text-slate-500">
            Registo de importadores, empresas e clientes finais atendidos pelo serviço de sourcing.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="btn-modern-primary flex items-center gap-2 text-xs font-bold uppercase tracking-wider !py-2.5 px-4 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por CLI-0001, empresa, NUIT ou cidade..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Nenhum cliente encontrado.
          </div>
        ) : (
          filteredClients.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold bg-blue-50 text-corp-blue px-2 py-0.5 rounded border border-blue-100">
                    {c.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1 text-slate-400 hover:text-corp-blue rounded-lg"
                      title="Editar"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir cliente ${c.id}?`)) {
                          onDeleteClient(c.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900">{c.company}</h3>
                <p className="text-xs text-slate-500 font-medium">Contacto: {c.name}</p>

                <div className="space-y-1.5 pt-3 text-xs text-slate-600">
                  {c.nuit && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">NUIT:</span>
                      <strong className="font-mono text-slate-800">{c.nuit}</strong>
                    </div>
                  )}
                  {c.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-corp-orange" />
                      <span>{c.city}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <a href={`tel:${c.phone}`} className="hover:underline font-mono">{c.phone}</a>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      <a href={`mailto:${c.email}`} className="hover:underline truncate">{c.email}</a>
                    </div>
                  )}
                </div>
              </div>

              {c.notes && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                  {c.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-corp-blue text-white flex items-center justify-center shadow-md">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900 uppercase tracking-tight">
                  {editingClient ? `Editar Cliente (${formData.id})` : 'Novo Cliente em Moçambique'}
                </h3>
                <p className="text-xs text-slate-500">
                  Registo para faturamento de sourcing e propostas comerciais.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Empresa / Razão Social *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Ex: Construções Delta Lda"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pessoa de Contacto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João Tembe"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NUIT</label>
                  <input
                    type="text"
                    value={formData.nuit}
                    onChange={e => setFormData({ ...formData, nuit: e.target.value })}
                    placeholder="Ex: 400123987"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+258 84 000 0000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="compras@empresa.co.mz"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Maputo, Beira, Nampula..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Físico</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Av. 24 de Julho, 123"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Histórico de pagamentos, perfil de carga preferencial..."
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
                  {editingClient ? 'Atualizar' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
