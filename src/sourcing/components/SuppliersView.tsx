import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  ExternalLink, 
  Phone, 
  Mail, 
  MessageCircle, 
  Award, 
  Globe, 
  MapPin, 
  Edit3, 
  Trash2, 
  UserPlus, 
  Check, 
  X,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { 
  Supplier, 
  SupplierContact, 
  SupplierType, 
  SupplierStatus, 
  TrustLevel, 
  OriginPlatform 
} from '../types';
import { generateNextId } from '../idGenerator';

interface SuppliersViewProps {
  suppliers: Supplier[];
  contacts: SupplierContact[];
  onSaveSupplier: (supplier: Supplier, contacts: SupplierContact[]) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  contacts,
  onSaveSupplier,
  onDeleteSupplier
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('todas');
  const [selectedTrust, setSelectedTrust] = useState('todos');
  const [selectedType, setSelectedType] = useState('todos');
  const [minRating, setMinRating] = useState<number>(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Supplier>>({
    companyName: '',
    chineseName: '',
    supplierType: 'fabricante',
    country: 'China',
    province: 'Guangdong',
    city: 'Guangzhou',
    website: '',
    originPlatform: '1688',
    status: 'ativo',
    trustLevel: 'verificado',
    internalRating: 5,
    notes: ''
  });

  // Contacts for the active modal supplier
  const [supplierContacts, setSupplierContacts] = useState<SupplierContact[]>([]);
  const [newContact, setNewContact] = useState<Partial<SupplierContact>>({
    name: '',
    role: '',
    phone: '',
    whatsapp: '',
    wechat: '',
    email: '',
    language: 'Inglês',
    isPrimary: false
  });
  const [showAddContactRow, setShowAddContactRow] = useState(false);

  // Unique cities for filter
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach(s => {
      if (s.city) set.add(s.city);
    });
    return Array.from(set);
  }, [suppliers]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch = 
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.chineseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.notes.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCity = selectedCity === 'todas' || s.city.toLowerCase().includes(selectedCity.toLowerCase());
      const matchTrust = selectedTrust === 'todos' || s.trustLevel === selectedTrust;
      const matchType = selectedType === 'todos' || s.supplierType === selectedType;
      const matchRating = s.internalRating >= minRating;

      return matchSearch && matchCity && matchTrust && matchType && matchRating;
    });
  }, [suppliers, searchTerm, selectedCity, selectedTrust, selectedType, minRating]);

  // Open Modal for New Supplier
  const handleOpenNew = () => {
    const nextId = generateNextId('FOR', suppliers);
    setEditingSupplier(null);
    setFormData({
      id: nextId,
      companyName: '',
      chineseName: '',
      supplierType: 'fabricante',
      country: 'China',
      province: 'Guangdong',
      city: 'Guangzhou',
      website: '',
      originPlatform: '1688',
      status: 'ativo',
      trustLevel: 'verificado',
      internalRating: 5,
      notes: '',
      createdAt: new Date().toISOString()
    });
    setSupplierContacts([]);
    setShowAddContactRow(false);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({ ...supplier });
    const existing = contacts.filter(c => c.supplierId === supplier.id);
    setSupplierContacts(existing);
    setShowAddContactRow(false);
    setIsModalOpen(true);
  };

  // Add Contact to current supplier
  const handleAddContact = () => {
    if (!newContact.name?.trim()) {
      alert('Por favor informe o nome do contacto.');
      return;
    }
    const currentId = formData.id || 'FOR-TEMP';
    const nextContId = generateNextId('CONT', [...contacts, ...supplierContacts]);
    
    const created: SupplierContact = {
      id: nextContId,
      supplierId: currentId,
      name: newContact.name,
      role: newContact.role || 'Vendas / Comercial',
      phone: newContact.phone || '',
      whatsapp: newContact.whatsapp || '',
      wechat: newContact.wechat || '',
      email: newContact.email || '',
      language: newContact.language || 'Inglês',
      isPrimary: supplierContacts.length === 0 ? true : !!newContact.isPrimary
    };

    setSupplierContacts(prev => [...prev, created]);
    setNewContact({
      name: '',
      role: '',
      phone: '',
      whatsapp: '',
      wechat: '',
      email: '',
      language: 'Inglês',
      isPrimary: false
    });
    setShowAddContactRow(false);
  };

  const handleRemoveContact = (contId: string) => {
    setSupplierContacts(prev => prev.filter(c => c.id !== contId));
  };

  // Save Supplier
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName?.trim()) {
      alert('Por favor, informe o nome da empresa.');
      return;
    }

    const supplierToSave: Supplier = {
      id: formData.id || generateNextId('FOR', suppliers),
      companyName: formData.companyName,
      chineseName: formData.chineseName || '',
      supplierType: (formData.supplierType as SupplierType) || 'fabricante',
      country: formData.country || 'China',
      province: formData.province || 'Guangdong',
      city: formData.city || 'Guangzhou',
      website: formData.website || '',
      originPlatform: (formData.originPlatform as OriginPlatform) || '1688',
      status: (formData.status as SupplierStatus) || 'ativo',
      trustLevel: (formData.trustLevel as TrustLevel) || 'verificado',
      internalRating: Number(formData.internalRating) || 5,
      notes: formData.notes || '',
      createdAt: formData.createdAt || new Date().toISOString()
    };

    // Ensure contacts have the right supplierId
    const updatedContacts = supplierContacts.map(c => ({
      ...c,
      supplierId: supplierToSave.id
    }));

    onSaveSupplier(supplierToSave, updatedContacts);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & New Supplier Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="text-corp-blue" size={26} />
            Fornecedores Chineses
          </h2>
          <p className="text-xs text-slate-500">
            Registo qualificado de fabricantes, tradings e intermediários na China com verificação interna.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="btn-modern-primary flex items-center gap-2 text-xs font-bold uppercase tracking-wider !py-2.5 px-4 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Registar Fornecedor
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por código (FOR-0001), nome, chinês ou cidade..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue transition-colors"
            />
          </div>

          {/* City Filter */}
          <div>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-corp-blue"
            >
              <option value="todas">Todas as Cidades</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Trust Level */}
          <div>
            <select
              value={selectedTrust}
              onChange={e => setSelectedTrust(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-corp-blue"
            >
              <option value="todos">Nível de Confiança (Todos)</option>
              <option value="ouro">🏆 Selo Ouro (Auditado)</option>
              <option value="verificado">✅ Verificado PrimeWay</option>
              <option value="padrao">⚪ Padrão / Em Avaliação</option>
              <option value="alto_risco">⚠️ Alto Risco / Atenção</option>
            </select>
          </div>

          {/* Supplier Type */}
          <div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-corp-blue"
            >
              <option value="todos">Tipo (Todos)</option>
              <option value="fabricante">Fabricante Direto</option>
              <option value="trading_company">Trading Company</option>
              <option value="grossista">Grossista / Distribuidor</option>
              <option value="agente">Agente de Sourcing</option>
            </select>
          </div>
        </div>

        {/* Sub-row: Quick count & clear */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>A exibir <strong>{filteredSuppliers.length}</strong> de {suppliers.length} fornecedores</span>
          {(searchTerm || selectedCity !== 'todas' || selectedTrust !== 'todos' || selectedType !== 'todos') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCity('todas');
                setSelectedTrust('todos');
                setSelectedType('todos');
                setMinRating(0);
              }}
              className="text-corp-blue hover:underline font-semibold"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Código & Empresa</th>
                <th className="py-3 px-4">Localização</th>
                <th className="py-3 px-4">Tipo & Plataforma</th>
                <th className="py-3 px-4">Confiança & Avaliação</th>
                <th className="py-3 px-4">Contactos Chave</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum fornecedor encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(supplier => {
                  const supplierConts = contacts.filter(c => c.supplierId === supplier.id);
                  const primaryContact = supplierConts.find(c => c.isPrimary) || supplierConts[0];

                  return (
                    <tr key={supplier.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Código & Empresa */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-extrabold px-1.5 py-0.5 bg-blue-50 text-corp-blue rounded border border-blue-100">
                              {supplier.id}
                            </span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                              supplier.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' :
                              supplier.status === 'em_avaliacao' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {supplier.status}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm">
                            {supplier.companyName}
                          </div>
                          {supplier.chineseName && (
                            <div className="text-[11px] text-slate-500 font-serif">
                              {supplier.chineseName}
                            </div>
                          )}
                          {supplier.website && (
                            <a
                              href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-sky-600 hover:text-sky-800 inline-flex items-center gap-1 mt-0.5 font-medium"
                            >
                              <Globe size={11} /> Website / Loja <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Localização */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            <MapPin size={12} className="text-corp-orange shrink-0" />
                            {supplier.city}
                          </div>
                          <div className="text-[11px] text-slate-500">{supplier.province}, {supplier.country}</div>
                        </div>
                      </td>

                      {/* Tipo & Plataforma */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold capitalize">
                            {supplier.supplierType.replace('_', ' ')}
                          </span>
                          <div className="text-[11px] text-slate-500">
                            Origem: <strong>{supplier.originPlatform}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Confiança & Avaliação */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            {supplier.trustLevel === 'ouro' ? (
                              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                🏆 Selo Ouro
                              </span>
                            ) : supplier.trustLevel === 'verificado' ? (
                              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                <ShieldCheck size={12} /> Verificado
                              </span>
                            ) : (
                              <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                                {supplier.trustLevel}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={11}
                                className={star <= supplier.internalRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                              />
                            ))}
                            <span className="text-[10px] text-slate-500 font-bold ml-1">
                              ({supplier.internalRating}/5)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contactos */}
                      <td className="py-3 px-4 align-top">
                        {primaryContact ? (
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-xs">
                              {primaryContact.name}
                              {primaryContact.isPrimary && (
                                <span className="text-[9px] text-corp-blue bg-blue-50 px-1 py-0.2 rounded ml-1 font-normal">Principal</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">{primaryContact.role}</div>
                            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                              {primaryContact.wechat && (
                                <span className="text-emerald-700 font-mono flex items-center gap-0.5" title="WeChat ID">
                                  <MessageCircle size={11} /> {primaryContact.wechat}
                                </span>
                              )}
                              {primaryContact.whatsapp && (
                                <a
                                  href={`https://wa.me/${primaryContact.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-green-600 font-mono flex items-center gap-0.5 hover:underline"
                                >
                                  <Phone size={11} /> WA
                                </a>
                              )}
                              {primaryContact.email && (
                                <a
                                  href={`mailto:${primaryContact.email}`}
                                  className="text-sky-600 flex items-center gap-0.5 hover:underline"
                                  title={primaryContact.email}
                                >
                                  <Mail size={11} /> Email
                                </a>
                              )}
                            </div>
                            {supplierConts.length > 1 && (
                              <span className="text-[10px] text-slate-400">
                                +{supplierConts.length - 1} contacto(s) adicional(is)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Nenhum contacto cadastrado</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(supplier)}
                            className="p-1.5 text-slate-500 hover:text-corp-blue hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar Fornecedor & Contactos"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Tem a certeza que deseja excluir o fornecedor ${supplier.id} (${supplier.companyName})?`)) {
                                onDeleteSupplier(supplier.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 size={15} />
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

      {/* Modal: Cadastro / Edição de Fornecedor */}
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
              <div className="w-12 h-12 rounded-2xl bg-corp-blue text-white flex items-center justify-center shadow-md">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900 uppercase tracking-tight">
                  {editingSupplier ? `Editar Fornecedor (${formData.id})` : 'Novo Fornecedor Chinês'}
                </h3>
                <p className="text-xs text-slate-500">
                  Preencha os dados da empresa e adicione os contactos no WeChat/WhatsApp.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Secção 1: Dados da Empresa */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-corp-blue border-b border-slate-100 pb-1.5">
                  1. Identificação da Empresa na China
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código Único <span className="text-slate-400 font-normal">(automático)</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.id}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome da Empresa (Inglês / Internacional) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Ex: Guangzhou Apex Building Material Co., Ltd."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome em Chinês (Caracteres)
                    </label>
                    <input
                      type="text"
                      value={formData.chineseName}
                      onChange={e => setFormData({ ...formData, chineseName: e.target.value })}
                      placeholder="Ex: 广州顶峰建材有限公司"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue font-serif"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Website / Loja Online
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                      placeholder="Ex: https://apexbuilding.1688.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Ex: Guangzhou, Yiwu, Foshan..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Província *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.province}
                      onChange={e => setFormData({ ...formData, province: e.target.value })}
                      placeholder="Ex: Guangdong, Zhejiang..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de Fornecedor
                    </label>
                    <select
                      value={formData.supplierType}
                      onChange={e => setFormData({ ...formData, supplierType: e.target.value as SupplierType })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue bg-white"
                    >
                      <option value="fabricante">Fabricante Direto</option>
                      <option value="trading_company">Trading Company</option>
                      <option value="grossista">Grossista</option>
                      <option value="agente">Agente de Sourcing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Plataforma de Origem
                    </label>
                    <select
                      value={formData.originPlatform}
                      onChange={e => setFormData({ ...formData, originPlatform: e.target.value as OriginPlatform })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue bg-white"
                    >
                      <option value="1688">1688.com</option>
                      <option value="Alibaba">Alibaba</option>
                      <option value="Made-in-China">Made-in-China</option>
                      <option value="Canton Fair">Feira de Cantão (Canton Fair)</option>
                      <option value="Contacto Direto">Contacto Direto / Presencial</option>
                      <option value="Indicação">Indicação de Parceiro</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nível de Confiança
                    </label>
                    <select
                      value={formData.trustLevel}
                      onChange={e => setFormData({ ...formData, trustLevel: e.target.value as TrustLevel })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue bg-white"
                    >
                      <option value="ouro">🏆 Ouro (Auditado)</option>
                      <option value="verificado">✅ Verificado</option>
                      <option value="padrao">⚪ Padrão</option>
                      <option value="alto_risco">⚠️ Alto Risco</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Avaliação Interna (1 a 5)
                    </label>
                    <select
                      value={formData.internalRating}
                      onChange={e => setFormData({ ...formData, internalRating: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue bg-white font-bold"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 - Excelente)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 - Muito Bom)</option>
                      <option value={3}>⭐⭐⭐ (3 - Médio)</option>
                      <option value={2}>⭐⭐ (2 - Regular)</option>
                      <option value={1}>⭐ (1 - Fraco)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações & Histórico de Auditoria
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ex: Fábrica visitada em 2026. Fornece boas amostras, flexível no MOQ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
                  />
                </div>
              </div>

              {/* Secção 2: Contactos do Fornecedor (WeChat / WhatsApp) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-corp-blue flex items-center gap-2">
                    2. Contactos do Fornecedor (WeChat, WhatsApp, Email)
                  </h4>
                  {!showAddContactRow && (
                    <button
                      type="button"
                      onClick={() => setShowAddContactRow(true)}
                      className="text-xs font-bold text-corp-blue hover:text-corp-orange flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus size={14} /> Adicionar Contacto
                    </button>
                  )}
                </div>

                {/* Sub-form to add a new contact */}
                {showAddContactRow && (
                  <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Novo Contacto de Vendas</span>
                      <button
                        type="button"
                        onClick={() => setShowAddContactRow(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nome do Contacto *</label>
                        <input
                          type="text"
                          value={newContact.name}
                          onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                          placeholder="Ex: Kevin Lin"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Função / Cargo</label>
                        <input
                          type="text"
                          value={newContact.role}
                          onChange={e => setNewContact({ ...newContact, role: e.target.value })}
                          placeholder="Ex: Export Manager"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Idioma</label>
                        <input
                          type="text"
                          value={newContact.language}
                          onChange={e => setNewContact({ ...newContact, language: e.target.value })}
                          placeholder="Ex: Inglês, Mandarim"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">WeChat ID (Principal na China)</label>
                        <input
                          type="text"
                          value={newContact.wechat}
                          onChange={e => setNewContact({ ...newContact, wechat: e.target.value })}
                          placeholder="Ex: kevin_wechat2026"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">WhatsApp (com DDI)</label>
                        <input
                          type="text"
                          value={newContact.whatsapp}
                          onChange={e => setNewContact({ ...newContact, whatsapp: e.target.value })}
                          placeholder="+86 138 0000 0000"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">E-mail</label>
                        <input
                          type="email"
                          value={newContact.email}
                          onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                          placeholder="vendas@empresa.cn"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newContact.isPrimary}
                          onChange={e => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                          className="rounded text-corp-blue"
                        />
                        <span>Definir como contacto principal</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleAddContact}
                        className="px-4 py-1.5 bg-corp-blue text-white rounded-lg text-xs font-bold hover:bg-corp-blue-light transition-colors"
                      >
                        Confirmar Contacto
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Contacts added */}
                <div className="space-y-2">
                  {supplierContacts.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      Nenhum contacto cadastrado ainda. Clique em "Adicionar Contacto" para incluir representantes de vendas.
                    </p>
                  ) : (
                    supplierContacts.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {c.name}
                            {c.isPrimary && (
                              <span className="text-[10px] bg-blue-100 text-corp-blue font-semibold px-1.5 py-0.2 rounded">
                                Principal
                              </span>
                            )}
                            <span className="text-slate-400 font-normal">• {c.role}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-[11px] text-slate-600">
                            {c.wechat && <span>WeChat: <strong className="font-mono">{c.wechat}</strong></span>}
                            {c.whatsapp && <span>WA: <strong className="font-mono">{c.whatsapp}</strong></span>}
                            {c.email && <span>Email: {c.email}</span>}
                            {c.language && <span>Idioma: {c.language}</span>}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveContact(c.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-modern-primary !py-2.5 px-6 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {editingSupplier ? 'Atualizar Fornecedor' : 'Guardar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
