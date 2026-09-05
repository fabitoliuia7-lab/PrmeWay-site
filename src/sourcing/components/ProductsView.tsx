import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  ExternalLink, 
  Send, 
  Building2, 
  DollarSign, 
  Calendar, 
  Ship, 
  Tag, 
  Edit3, 
  Trash2, 
  Link2, 
  Check, 
  X, 
  Layers, 
  Upload, 
  Scale, 
  Maximize2 
} from 'lucide-react';
import { 
  ProductItem, 
  Supplier, 
  ProductSupplierRelation, 
  CurrencyType, 
  IncotermType, 
  PriceUnit, 
  ProductStatus 
} from '../types';
import { generateNextId } from '../idGenerator';

interface ProductsViewProps {
  products: ProductItem[];
  suppliers: Supplier[];
  relations: ProductSupplierRelation[];
  categories: string[];
  defaultPorts: string[];
  onSaveProduct: (product: ProductItem) => void;
  onDeleteProduct: (productId: string) => void;
  onSaveRelation: (relation: ProductSupplierRelation) => void;
  onDeleteRelation: (relationId: string) => void;
  onSendToCalculator: (product: ProductItem, relation?: ProductSupplierRelation) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  suppliers,
  relations,
  categories,
  defaultPorts,
  onSaveProduct,
  onDeleteProduct,
  onSaveRelation,
  onDeleteRelation,
  onSendToCalculator
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedStatus, setSelectedStatus] = useState('todos');

  // Modal State: Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productForm, setProductForm] = useState<Partial<ProductItem>>({
    namePt: '',
    nameEn: '',
    nameCn: '',
    category: categories[0] || 'Construção & Ferragens',
    description: '',
    material: '',
    dimensions: { lengthCm: 0, widthCm: 0, heightCm: 0, cbmUnit: 0 },
    weightKg: 0,
    hsCode: '',
    keywords: [],
    images: [],
    status: 'ativo'
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Modal State: Manage Suppliers of a Product
  const [selectedProductForSuppliers, setSelectedProductForSuppliers] = useState<ProductItem | null>(null);
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [relationForm, setRelationForm] = useState<Partial<ProductSupplierRelation>>({
    supplierId: '',
    supplierRef: '',
    indicativePrice: 0,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 1,
    monthlyCapacity: '',
    leadTimeDays: 15,
    incoterm: 'FOB',
    loadingPort: defaultPorts[0] || 'Guangzhou',
    customizationAvailable: true,
    sampleAvailable: true,
    sampleCost: 0,
    priceDate: new Date().toISOString().split('T')[0],
    infoSource: 'Catálogo do Fornecedor',
    notes: ''
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        p.id.toLowerCase().includes(search) ||
        p.namePt.toLowerCase().includes(search) ||
        p.nameEn.toLowerCase().includes(search) ||
        p.nameCn.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        p.material.toLowerCase().includes(search) ||
        p.hsCode.toLowerCase().includes(search) ||
        p.keywords.some(k => k.toLowerCase().includes(search));

      const matchCategory = selectedCategory === 'todas' || p.category === selectedCategory;
      const matchStatus = selectedStatus === 'todos' || p.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  // Open New Product Modal
  const handleOpenNewProduct = () => {
    const nextId = generateNextId('PROD', products);
    setEditingProduct(null);
    setProductForm({
      id: nextId,
      namePt: '',
      nameEn: '',
      nameCn: '',
      category: categories[0] || 'Construção & Ferragens',
      description: '',
      material: '',
      dimensions: { lengthCm: 0, widthCm: 0, heightCm: 0, cbmUnit: 0 },
      weightKg: 0,
      hsCode: '',
      keywords: [],
      images: [],
      status: 'ativo',
      createdAt: new Date().toISOString()
    });
    setKeywordInput('');
    setImageUrlInput('');
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setProductForm({ ...prod });
    setKeywordInput('');
    setImageUrlInput('');
    setIsProductModalOpen(true);
  };

  // Auto calculate CBM
  const handleDimensionChange = (field: 'lengthCm' | 'widthCm' | 'heightCm', val: number) => {
    const current = productForm.dimensions || { lengthCm: 0, widthCm: 0, heightCm: 0, cbmUnit: 0 };
    const updated = { ...current, [field]: val };
    const cbm = (updated.lengthCm * updated.widthCm * updated.heightCm) / 1000000;
    updated.cbmUnit = Number(cbm.toFixed(5));
    setProductForm({ ...productForm, dimensions: updated });
  };

  // Save Product
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.namePt?.trim()) {
      alert('Por favor preencha o nome do produto em português.');
      return;
    }

    const saved: ProductItem = {
      id: productForm.id || generateNextId('PROD', products),
      namePt: productForm.namePt,
      nameEn: productForm.nameEn || '',
      nameCn: productForm.nameCn || '',
      category: productForm.category || categories[0] || 'Geral',
      description: productForm.description || '',
      material: productForm.material || '',
      dimensions: productForm.dimensions || { lengthCm: 0, widthCm: 0, heightCm: 0, cbmUnit: 0 },
      weightKg: Number(productForm.weightKg) || 0,
      hsCode: productForm.hsCode || '',
      keywords: productForm.keywords || [],
      images: productForm.images && productForm.images.length > 0 ? productForm.images : ['/IMG-20260215-WA0003.jpg'],
      status: (productForm.status as ProductStatus) || 'ativo',
      createdAt: productForm.createdAt || new Date().toISOString()
    };

    onSaveProduct(saved);
    setIsProductModalOpen(false);
  };

  // Open Manage Suppliers Drawer for a Product
  const handleOpenManageSuppliers = (prod: ProductItem) => {
    setSelectedProductForSuppliers(prod);
    setRelationForm({
      productId: prod.id,
      supplierId: suppliers[0]?.id || '',
      supplierRef: '',
      indicativePrice: 10,
      currency: 'USD',
      priceUnit: 'unidade',
      moq: 10,
      monthlyCapacity: '',
      leadTimeDays: 15,
      incoterm: 'FOB',
      loadingPort: defaultPorts[0] || 'Guangzhou',
      customizationAvailable: true,
      sampleAvailable: true,
      sampleCost: 0,
      priceDate: new Date().toISOString().split('T')[0],
      infoSource: 'Catálogo / Cotação WeChat',
      notes: ''
    });
    setIsRelationModalOpen(true);
  };

  // Save Relation
  const handleSaveRelationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForSuppliers || !relationForm.supplierId) {
      alert('Selecione um fornecedor.');
      return;
    }

    const nextId = generateNextId('REL', relations);
    const newRel: ProductSupplierRelation = {
      id: nextId,
      productId: selectedProductForSuppliers.id,
      supplierId: relationForm.supplierId,
      supplierRef: relationForm.supplierRef || '',
      indicativePrice: Number(relationForm.indicativePrice) || 0,
      currency: (relationForm.currency as CurrencyType) || 'USD',
      priceUnit: (relationForm.priceUnit as PriceUnit) || 'unidade',
      moq: Number(relationForm.moq) || 1,
      monthlyCapacity: relationForm.monthlyCapacity || '',
      leadTimeDays: Number(relationForm.leadTimeDays) || 15,
      incoterm: (relationForm.incoterm as IncotermType) || 'FOB',
      loadingPort: relationForm.loadingPort || 'Guangzhou',
      customizationAvailable: !!relationForm.customizationAvailable,
      sampleAvailable: !!relationForm.sampleAvailable,
      sampleCost: Number(relationForm.sampleCost) || 0,
      priceDate: relationForm.priceDate || new Date().toISOString().split('T')[0],
      infoSource: relationForm.infoSource || '',
      notes: relationForm.notes || ''
    };

    onSaveRelation(newRel);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="text-emerald-600" size={26} />
            Catálogo de Produtos & Códigos HS
          </h2>
          <p className="text-xs text-slate-500">
            Base de produtos para importação da China, com dimensões CBM, peso, código pautal e múltiplos fornecedores.
          </p>
        </div>

        <button
          onClick={handleOpenNewProduct}
          className="btn-modern-primary flex items-center gap-2 text-xs font-bold uppercase tracking-wider !py-2.5 px-4 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Registar Produto
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por PROD-0001, nome (PT/EN/CN), material, HS Code ou tags..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-corp-blue"
            >
              <option value="todas">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-corp-blue"
            >
              <option value="todos">Status (Todos)</option>
              <option value="ativo">Ativo</option>
              <option value="em_desenvolvimento">Em Pesquisa / Desenvolvimento</option>
              <option value="descontinuado">Descontinuado</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>A exibir <strong>{filteredProducts.length}</strong> de {products.length} produtos cadastrados</span>
          {(searchTerm || selectedCategory !== 'todas' || selectedStatus !== 'todos') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('todas');
                setSelectedStatus('todos');
              }}
              className="text-corp-blue hover:underline font-semibold"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Nenhum produto encontrado com os filtros selecionados.
          </div>
        ) : (
          filteredProducts.map(product => {
            const productRelations = relations.filter(r => r.productId === product.id);
            const bestRelation = productRelations.length > 0 
              ? [...productRelations].sort((a, b) => a.indicativePrice - b.indicativePrice)[0]
              : null;

            return (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Top Image & Badge */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img 
                      src={product.images[0] || '/IMG-20260215-WA0003.jpg'} 
                      alt={product.namePt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 bg-slate-900/80 text-white backdrop-blur-sm rounded-md">
                        {product.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-600/90 text-white backdrop-blur-sm rounded-md">
                        {product.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditProduct(product)}
                        className="w-7 h-7 rounded-lg bg-white/90 text-slate-700 hover:text-corp-blue flex items-center justify-center backdrop-blur-sm shadow transition-colors"
                        title="Editar Produto"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir o produto ${product.id}?`)) {
                            onDeleteProduct(product.id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-white/90 text-slate-700 hover:text-red-600 flex items-center justify-center backdrop-blur-sm shadow transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug" title={product.namePt}>
                        {product.namePt}
                      </h3>
                      {product.nameCn && (
                        <p className="text-[11px] text-slate-500 font-serif italic truncate mt-0.5">
                          {product.nameCn}
                        </p>
                      )}
                      {product.nameEn && (
                        <p className="text-[10px] text-slate-400 truncate">
                          EN: {product.nameEn}
                        </p>
                      )}
                    </div>

                    {/* Especificações Físicas & Código HS */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-600 border border-slate-100">
                      <div>
                        <span className="block text-slate-400 font-medium">HS Code</span>
                        <strong className="text-slate-800 font-mono">{product.hsCode || 'N/D'}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">Volume CBM</span>
                        <strong className="text-slate-800 font-mono">
                          {product.dimensions.cbmUnit ? `${product.dimensions.cbmUnit} m³` : 'N/D'}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">Peso Unit.</span>
                        <strong className="text-slate-800 font-mono">{product.weightKg ? `${product.weightKg} kg` : 'N/D'}</strong>
                      </div>
                    </div>

                    {/* Fornecedores Vinculados */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-semibold flex items-center gap-1 text-[11px]">
                          <Building2 size={13} className="text-corp-blue" />
                          Fornecedores ({productRelations.length})
                        </span>
                        <button
                          onClick={() => handleOpenManageSuppliers(product)}
                          className="text-[11px] font-bold text-corp-blue hover:text-corp-orange flex items-center gap-0.5 cursor-pointer"
                        >
                          <Link2 size={12} /> Gerir Vínculos
                        </button>
                      </div>

                      {bestRelation ? (
                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 text-xs flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-emerald-800 font-semibold block">
                              Melhor Preço Indicativo:
                            </span>
                            <span className="text-base font-extrabold text-emerald-700">
                              {bestRelation.currency} ${bestRelation.indicativePrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1">
                              /{bestRelation.priceUnit} (MOQ: {bestRelation.moq})
                            </span>
                          </div>
                          <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-1 rounded border border-emerald-200">
                            {bestRelation.loadingPort}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2 text-center text-[11px] text-amber-700">
                          Nenhum fornecedor vinculado ainda. Clique em "Gerir Vínculos".
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions: Enviar para Calculadora */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => onSendToCalculator(product, bestRelation || undefined)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-corp-blue to-blue-900 hover:from-corp-orange hover:to-corp-orange-dark text-white py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
                    title="Preenche a calculadora aduaneira com dimensões, peso e preço"
                  >
                    <Send size={13} />
                    Enviar para Calculadora
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Registar / Editar Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900 uppercase tracking-tight">
                  {editingProduct ? `Editar Produto (${productForm.id})` : 'Novo Produto no Catálogo'}
                </h3>
                <p className="text-xs text-slate-500">
                  Cadastre o produto em 3 línguas com dimensões para apuramento automático de CBM e frete marítimo.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-6">
              {/* Identificação do Produto */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-corp-blue border-b border-slate-100 pb-1.5">
                  1. Identificação & Nomes (PT / EN / CN)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Código Único</label>
                    <input
                      type="text"
                      disabled
                      value={productForm.id}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome em Português *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.namePt}
                      onChange={e => setProductForm({ ...productForm, namePt: e.target.value })}
                      placeholder="Ex: Painel Solar Monocristalino 550W Tier 1"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome em Inglês (Para cotações com fornecedores)
                    </label>
                    <input
                      type="text"
                      value={productForm.nameEn}
                      onChange={e => setProductForm({ ...productForm, nameEn: e.target.value })}
                      placeholder="Ex: 550W Monocrystalline Solar Panel"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome em Chinês (Buscas no 1688 / Taobao)
                    </label>
                    <input
                      type="text"
                      value={productForm.nameCn}
                      onChange={e => setProductForm({ ...productForm, nameCn: e.target.value })}
                      placeholder="Ex: 550W单晶太阳能板"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue font-serif"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria *</label>
                    <select
                      value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue bg-white"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código HS (Pauta Aduaneira)
                    </label>
                    <input
                      type="text"
                      value={productForm.hsCode}
                      onChange={e => setProductForm({ ...productForm, hsCode: e.target.value })}
                      placeholder="Ex: 8541.43.00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-corp-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Material Predominante</label>
                    <input
                      type="text"
                      value={productForm.material}
                      onChange={e => setProductForm({ ...productForm, material: e.target.value })}
                      placeholder="Ex: Alumínio, Silício, Cerâmica..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição Técnica Detalhada</label>
                  <textarea
                    rows={2}
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Especificações de voltagem, normas de teste, espessura, acabamento..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
                  />
                </div>
              </div>

              {/* Dimensões e CBM */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-corp-blue border-b border-slate-100 pb-1.5 flex items-center gap-2">
                  <Maximize2 size={14} /> 2. Dimensões Físicas & Cálculo Automático de CBM
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Comprimento (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.dimensions?.lengthCm || ''}
                      onChange={e => handleDimensionChange('lengthCm', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Largura (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.dimensions?.widthCm || ''}
                      onChange={e => handleDimensionChange('widthCm', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Altura (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.dimensions?.heightCm || ''}
                      onChange={e => handleDimensionChange('heightCm', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Peso Unitário (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.weightKg || ''}
                      onChange={e => setProductForm({ ...productForm, weightKg: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-700">Volume CBM calculado por unidade:</span>
                  <span className="font-mono font-extrabold text-corp-blue text-sm">
                    {productForm.dimensions?.cbmUnit || 0} m³
                  </span>
                </div>
              </div>

              {/* URL da Imagem */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">URL da Imagem do Produto</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    placeholder="https://exemplo.com/foto-do-produto.jpg"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrlInput.trim()) {
                        setProductForm({
                          ...productForm,
                          images: [...(productForm.images || []), imageUrlInput.trim()]
                        });
                        setImageUrlInput('');
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    Adicionar Foto
                  </button>
                </div>
                {productForm.images && productForm.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm({
                              ...productForm,
                              images: productForm.images?.filter((_, i) => i !== idx)
                            });
                          }}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-modern-primary !py-2.5 px-6 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {editingProduct ? 'Atualizar Produto' : 'Guardar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal: Gerir Vínculos Fornecedor-Produto (N para N) */}
      {isRelationModalOpen && selectedProductForSuppliers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsRelationModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-corp-blue text-white flex items-center justify-center shadow-md">
                <Link2 size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900 uppercase tracking-tight">
                  Fornecedores Vinculados ao Produto
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedProductForSuppliers.id} - {selectedProductForSuppliers.namePt}
                </p>
              </div>
            </div>

            {/* List of currently linked suppliers */}
            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Fornecedores Atuais com Preço & Condições
              </h4>

              {relations.filter(r => r.productId === selectedProductForSuppliers.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  Ainda não há nenhum fornecedor chinês vinculado a este produto. Preencha o formulário abaixo para cadastrar a cotação inicial.
                </p>
              ) : (
                <div className="space-y-3">
                  {relations
                    .filter(r => r.productId === selectedProductForSuppliers.id)
                    .map(rel => {
                      const supp = suppliers.find(s => s.id === rel.supplierId);
                      return (
                        <div key={rel.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[11px] bg-blue-100 text-corp-blue px-1.5 py-0.2 rounded">
                                  {supp?.id || rel.supplierId}
                                </span>
                                <strong className="text-slate-900 text-sm">
                                  {supp?.companyName || 'Fornecedor Desconhecido'}
                                </strong>
                              </div>
                              <div className="text-[11px] text-slate-500 font-serif">{supp?.chineseName}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  onSendToCalculator(selectedProductForSuppliers, rel);
                                  setIsRelationModalOpen(false);
                                }}
                                className="px-2.5 py-1 bg-corp-blue text-white rounded-lg text-[11px] font-bold hover:bg-corp-orange transition-colors flex items-center gap-1 cursor-pointer"
                                title="Enviar esta cotação para a calculadora"
                              >
                                <Send size={11} /> Usar na Calculadora
                              </button>
                              <button
                                onClick={() => onDeleteRelation(rel.id)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                title="Remover Vínculo"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block">Preço Indicativo</span>
                              <strong className="text-emerald-700 text-sm font-extrabold">
                                {rel.currency} ${rel.indicativePrice.toFixed(2)}
                              </strong>
                              <span className="text-[10px] text-slate-500"> /{rel.priceUnit}</span>
                            </div>

                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block">MOQ Mínimo</span>
                              <strong className="text-slate-800">{rel.moq} {rel.priceUnit}(s)</strong>
                            </div>

                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block">Incoterm & Porto</span>
                              <strong className="text-slate-800">{rel.incoterm} - {rel.loadingPort}</strong>
                            </div>

                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-slate-400 block">Prazo Produção</span>
                              <strong className="text-slate-800">{rel.leadTimeDays} dias</strong>
                            </div>
                          </div>

                          {rel.notes && (
                            <p className="text-[11px] text-slate-500 italic pt-1">
                              Obs: {rel.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Form to link a new supplier */}
            <form onSubmit={handleSaveRelationSubmit} className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-corp-blue">
                + Associar Mais um Fornecedor a este Produto
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selecionar Fornecedor Chinês *
                  </label>
                  <select
                    required
                    value={relationForm.supplierId}
                    onChange={e => setRelationForm({ ...relationForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-corp-blue"
                  >
                    <option value="">Selecione...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.companyName} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ref. do Fornecedor / Link 1688</label>
                  <input
                    type="text"
                    value={relationForm.supplierRef}
                    onChange={e => setRelationForm({ ...relationForm, supplierRef: e.target.value })}
                    placeholder="Ex: SPP-550M ou link"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preço Indicativo *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={relationForm.indicativePrice || ''}
                    onChange={e => setRelationForm({ ...relationForm, indicativePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Moeda</label>
                  <select
                    value={relationForm.currency}
                    onChange={e => setRelationForm({ ...relationForm, currency: e.target.value as CurrencyType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="MZN">MZN (MT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unidade</label>
                  <select
                    value={relationForm.priceUnit}
                    onChange={e => setRelationForm({ ...relationForm, priceUnit: e.target.value as PriceUnit })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="unidade">Unidade</option>
                    <option value="caixa">Caixa</option>
                    <option value="metro">Metro</option>
                    <option value="kg">Kg</option>
                    <option value="set">Set / Conjunto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MOQ (Mínimo)</label>
                  <input
                    type="number"
                    value={relationForm.moq || ''}
                    onChange={e => setRelationForm({ ...relationForm, moq: parseInt(e.target.value, 10) || 1 })}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Incoterm</label>
                  <select
                    value={relationForm.incoterm}
                    onChange={e => setRelationForm({ ...relationForm, incoterm: e.target.value as IncotermType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                  >
                    <option value="FOB">FOB (Free on Board)</option>
                    <option value="EXW">EXW (Fábrica)</option>
                    <option value="CIF">CIF (Maputo/Beira)</option>
                    <option value="DDP">DDP (Com impostos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Porto de Embarque</label>
                  <select
                    value={relationForm.loadingPort}
                    onChange={e => setRelationForm({ ...relationForm, loadingPort: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {defaultPorts.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prazo Produção (Dias)</label>
                  <input
                    type="number"
                    value={relationForm.leadTimeDays || ''}
                    onChange={e => setRelationForm({ ...relationForm, leadTimeDays: parseInt(e.target.value, 10) || 1 })}
                    placeholder="15"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data da Cotação</label>
                  <input
                    type="date"
                    value={relationForm.priceDate}
                    onChange={e => setRelationForm({ ...relationForm, priceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condições & Observações Comerciais</label>
                <input
                  type="text"
                  value={relationForm.notes}
                  onChange={e => setRelationForm({ ...relationForm, notes: e.target.value })}
                  placeholder="Ex: Embalagem reforçada, 30% sinal, amostra rápida..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="btn-modern-primary !py-2 px-5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Salvar Associação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
