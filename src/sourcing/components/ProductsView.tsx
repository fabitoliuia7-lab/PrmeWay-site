import React, { useState, useMemo, useRef } from 'react';
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
  Maximize2,
  Image as ImageIcon,
  CheckCircle2,
  FileImage,
  Sparkles
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

// Canvas-based image compressor for high performance & instant local rendering
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

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

  // Modal State: Full Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    status: 'ativo',
    indicativePrice: 0,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 1,
    defaultSupplierId: ''
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Modal State: Quick Price & MOQ Edit
  const [isQuickPriceModalOpen, setIsQuickPriceModalOpen] = useState(false);
  const [quickPriceProduct, setQuickPriceProduct] = useState<ProductItem | null>(null);
  const [quickPriceForm, setQuickPriceForm] = useState<{
    price: number | '';
    currency: CurrencyType;
    priceUnit: PriceUnit;
    moq: number | '';
    supplierId: string;
    leadTimeDays: number;
    incoterm: IncotermType;
    loadingPort: string;
    paymentTerms: string;
    contractUrl: string;
  }>({
    price: 0,
    currency: 'USD',
    priceUnit: 'unidade',
    moq: 1,
    supplierId: '',
    leadTimeDays: 15,
    incoterm: 'FOB',
    loadingPort: 'Guangzhou',
    paymentTerms: '',
    contractUrl: ''
  });

  // Modal State: Manage Suppliers of a Product
  const [selectedProductForSuppliers, setSelectedProductForSuppliers] = useState<ProductItem | null>(null);
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [editingRelationId, setEditingRelationId] = useState<string | null>(null);

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
      createdAt: new Date().toISOString(),
      indicativePrice: 10,
      currency: 'USD',
      priceUnit: 'unidade',
      moq: 10,
      defaultSupplierId: suppliers[0]?.id || ''
    });
    setKeywordInput('');
    setImageUrlInput('');
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    const matchedRelations = relations.filter(r => r.productId === prod.id);
    const bestRel = matchedRelations.length > 0 
      ? [...matchedRelations].sort((a, b) => a.indicativePrice - b.indicativePrice)[0] 
      : undefined;

    const cleanImages = (prod.images || []).filter(img => img && img.trim() !== '' && img !== '/IMG-20260215-WA0003.jpg');

    setProductForm({
      ...prod,
      images: cleanImages,
      indicativePrice: prod.indicativePrice ?? bestRel?.indicativePrice ?? 10,
      currency: prod.currency ?? bestRel?.currency ?? 'USD',
      priceUnit: prod.priceUnit ?? bestRel?.priceUnit ?? 'unidade',
      moq: prod.moq ?? bestRel?.moq ?? 10,
      defaultSupplierId: prod.defaultSupplierId ?? bestRel?.supplierId ?? (suppliers[0]?.id || '')
    });
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

  // Handle Photo Files Upload from Computer / Mobile
  const handlePhotoFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);

    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressedBase64 = await compressImageFile(files[i]);
        if (compressedBase64) {
          newImages.push(compressedBase64);
        }
      }

      if (newImages.length > 0) {
        setProductForm(prev => ({
          ...prev,
          images: [
            ...(prev.images || []).filter(img => img && img.trim() !== '' && img !== '/IMG-20260215-WA0003.jpg'),
            ...newImages
          ]
        }));
      }
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      alert('Não foi possível carregar a imagem. Tente novamente com um arquivo JPG ou PNG.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save Product Submit
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.namePt?.trim()) {
      alert('Por favor preencha o nome do produto em português.');
      return;
    }

    const cleanImages = (productForm.images || []).filter(img => img && img.trim() !== '' && img !== '/IMG-20260215-WA0003.jpg');

    const saved: ProductItem = {
      id: productForm.id || generateNextId('PROD', products),
      namePt: productForm.namePt.trim(),
      nameEn: productForm.nameEn?.trim() || '',
      nameCn: productForm.nameCn?.trim() || '',
      category: productForm.category || categories[0] || 'Geral',
      description: productForm.description || '',
      material: productForm.material || '',
      dimensions: productForm.dimensions || { lengthCm: 0, widthCm: 0, heightCm: 0, cbmUnit: 0 },
      weightKg: Number(productForm.weightKg) || 0,
      hsCode: productForm.hsCode || '',
      keywords: productForm.keywords || [],
      // Pure product photos only - never company logo!
      images: cleanImages,
      status: (productForm.status as ProductStatus) || 'ativo',
      createdAt: productForm.createdAt || new Date().toISOString(),
      indicativePrice: productForm.indicativePrice !== undefined && !isNaN(Number(productForm.indicativePrice))
        ? Number(productForm.indicativePrice) 
        : undefined,
      currency: (productForm.currency as CurrencyType) || 'USD',
      priceUnit: (productForm.priceUnit as PriceUnit) || 'unidade',
      moq: productForm.moq !== undefined && !isNaN(Number(productForm.moq))
        ? Number(productForm.moq) 
        : 1,
      defaultSupplierId: productForm.defaultSupplierId || undefined
    };

    onSaveProduct(saved);

    // Keep relation synchronized if supplier is selected and price provided
    if (productForm.defaultSupplierId && saved.indicativePrice !== undefined) {
      const existingRel = relations.find(r => r.productId === saved.id && r.supplierId === productForm.defaultSupplierId);
      if (existingRel) {
        onSaveRelation({
          ...existingRel,
          indicativePrice: saved.indicativePrice,
          currency: saved.currency || 'USD',
          priceUnit: saved.priceUnit || 'unidade',
          moq: saved.moq || 1
        });
      } else {
        const nextRelId = generateNextId('REL', relations);
        onSaveRelation({
          id: nextRelId,
          productId: saved.id,
          supplierId: productForm.defaultSupplierId,
          supplierRef: '',
          indicativePrice: saved.indicativePrice,
          currency: saved.currency || 'USD',
          priceUnit: saved.priceUnit || 'unidade',
          moq: saved.moq || 1,
          monthlyCapacity: '',
          leadTimeDays: 15,
          incoterm: 'FOB',
          loadingPort: defaultPorts[0] || 'Guangzhou',
          customizationAvailable: true,
          sampleAvailable: true,
          sampleCost: 0,
          priceDate: new Date().toISOString().split('T')[0],
          infoSource: 'Cotação Direta do Catálogo',
          notes: ''
        });
      }
    }

    setIsProductModalOpen(false);
  };

  // Open Quick Price & MOQ Modal
  const handleOpenQuickPriceModal = (prod: ProductItem) => {
    const matchedRelations = relations.filter(r => r.productId === prod.id);
    const bestRel = matchedRelations.length > 0 
      ? [...matchedRelations].sort((a, b) => a.indicativePrice - b.indicativePrice)[0] 
      : undefined;

    setQuickPriceProduct(prod);
    setQuickPriceForm({
      price: prod.indicativePrice ?? bestRel?.indicativePrice ?? 10,
      currency: prod.currency ?? bestRel?.currency ?? 'USD',
      priceUnit: prod.priceUnit ?? bestRel?.priceUnit ?? 'unidade',
      moq: prod.moq ?? bestRel?.moq ?? 1,
      supplierId: prod.defaultSupplierId ?? bestRel?.supplierId ?? (suppliers[0]?.id || ''),
      leadTimeDays: bestRel?.leadTimeDays ?? 15,
      incoterm: bestRel?.incoterm ?? 'FOB',
      loadingPort: bestRel?.loadingPort ?? defaultPorts[0] ?? 'Guangzhou',
      paymentTerms: bestRel?.paymentTerms ?? '',
      contractUrl: bestRel?.contractUrl ?? ''
    });
    setIsQuickPriceModalOpen(true);
  };

  // Save Quick Price & MOQ Submit
  const handleSaveQuickPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceProduct) return;

    const priceNum = typeof quickPriceForm.price === 'number' ? quickPriceForm.price : parseFloat(quickPriceForm.price as string) || 0;
    const moqNum = typeof quickPriceForm.moq === 'number' ? quickPriceForm.moq : parseInt(quickPriceForm.moq as string, 10) || 1;

    // 1. Update Product
    const updatedProd: ProductItem = {
      ...quickPriceProduct,
      indicativePrice: priceNum,
      currency: quickPriceForm.currency,
      priceUnit: quickPriceForm.priceUnit,
      moq: moqNum,
      defaultSupplierId: quickPriceForm.supplierId || quickPriceProduct.defaultSupplierId
    };
    onSaveProduct(updatedProd);

    // 2. Update or create Supplier Relation
    if (quickPriceForm.supplierId) {
      const existingRel = relations.find(r => r.productId === quickPriceProduct.id && r.supplierId === quickPriceForm.supplierId);
      if (existingRel) {
        onSaveRelation({
          ...existingRel,
          indicativePrice: priceNum,
          currency: quickPriceForm.currency,
          priceUnit: quickPriceForm.priceUnit,
          moq: moqNum,
          leadTimeDays: quickPriceForm.leadTimeDays,
          incoterm: quickPriceForm.incoterm,
          loadingPort: quickPriceForm.loadingPort,
          paymentTerms: quickPriceForm.paymentTerms,
          contractUrl: quickPriceForm.contractUrl
        });
      } else {
        const nextRelId = generateNextId('REL', relations);
        onSaveRelation({
          id: nextRelId,
          productId: quickPriceProduct.id,
          supplierId: quickPriceForm.supplierId,
          supplierRef: '',
          indicativePrice: priceNum,
          currency: quickPriceForm.currency,
          priceUnit: quickPriceForm.priceUnit,
          moq: moqNum,
          monthlyCapacity: '',
          leadTimeDays: quickPriceForm.leadTimeDays,
          incoterm: quickPriceForm.incoterm,
          loadingPort: quickPriceForm.loadingPort,
          paymentTerms: quickPriceForm.paymentTerms,
          contractUrl: quickPriceForm.contractUrl,
          customizationAvailable: true,
          sampleAvailable: true,
          sampleCost: 0,
          priceDate: new Date().toISOString().split('T')[0],
          infoSource: 'Edição Rápida de Preço & MOQ',
          notes: ''
        });
      }
    }

    setIsQuickPriceModalOpen(false);
    setQuickPriceProduct(null);
  };

  // Open Manage Suppliers Drawer for a Product
  const handleOpenManageSuppliers = (prod: ProductItem) => {
    setSelectedProductForSuppliers(prod);
    setEditingRelationId(null);
    setRelationForm({
      productId: prod.id,
      supplierId: suppliers[0]?.id || '',
      supplierRef: '',
      indicativePrice: prod.indicativePrice || 10,
      currency: prod.currency || 'USD',
      priceUnit: prod.priceUnit || 'unidade',
      moq: prod.moq || 10,
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

  // Start editing an existing relation
  const handleStartEditRelation = (rel: ProductSupplierRelation) => {
    setEditingRelationId(rel.id);
    setRelationForm({
      ...rel
    });
  };

  // Cancel relation editing mode
  const handleCancelEditRelation = () => {
    setEditingRelationId(null);
    if (selectedProductForSuppliers) {
      setRelationForm({
        productId: selectedProductForSuppliers.id,
        supplierId: suppliers[0]?.id || '',
        supplierRef: '',
        indicativePrice: selectedProductForSuppliers.indicativePrice || 10,
        currency: selectedProductForSuppliers.currency || 'USD',
        priceUnit: selectedProductForSuppliers.priceUnit || 'unidade',
        moq: selectedProductForSuppliers.moq || 10,
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
    }
  };

  // Save Relation
  const handleSaveRelationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForSuppliers || !relationForm.supplierId) {
      alert('Selecione um fornecedor.');
      return;
    }

    if (editingRelationId) {
      const updatedRel: ProductSupplierRelation = {
        id: editingRelationId,
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
        paymentTerms: relationForm.paymentTerms || '',
        contractUrl: relationForm.contractUrl || '',
        customizationAvailable: !!relationForm.customizationAvailable,
        sampleAvailable: !!relationForm.sampleAvailable,
        sampleCost: Number(relationForm.sampleCost) || 0,
        priceDate: relationForm.priceDate || new Date().toISOString().split('T')[0],
        infoSource: relationForm.infoSource || '',
        notes: relationForm.notes || ''
      };

      onSaveRelation(updatedRel);
      setEditingRelationId(null);

      // Also update product's default price and moq
      onSaveProduct({
        ...selectedProductForSuppliers,
        indicativePrice: updatedRel.indicativePrice,
        currency: updatedRel.currency,
        priceUnit: updatedRel.priceUnit,
        moq: updatedRel.moq,
        defaultSupplierId: updatedRel.supplierId
      });
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
      paymentTerms: relationForm.paymentTerms || '',
      contractUrl: relationForm.contractUrl || '',
      customizationAvailable: !!relationForm.customizationAvailable,
      sampleAvailable: !!relationForm.sampleAvailable,
      sampleCost: Number(relationForm.sampleCost) || 0,
      priceDate: relationForm.priceDate || new Date().toISOString().split('T')[0],
      infoSource: relationForm.infoSource || '',
      notes: relationForm.notes || ''
    };

    onSaveRelation(newRel);

    // Also update product default price and moq
    onSaveProduct({
      ...selectedProductForSuppliers,
      indicativePrice: newRel.indicativePrice,
      currency: newRel.currency,
      priceUnit: newRel.priceUnit,
      moq: newRel.moq,
      defaultSupplierId: newRel.supplierId
    });
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

            const effectivePrice = product.indicativePrice ?? bestRelation?.indicativePrice ?? 0;
            const effectiveCurrency = product.currency ?? bestRelation?.currency ?? 'USD';
            const effectiveUnit = product.priceUnit ?? bestRelation?.priceUnit ?? 'unidade';
            const effectiveMoq = product.moq ?? bestRelation?.moq ?? 1;
            const linkedSupplier = suppliers.find(s => s.id === (product.defaultSupplierId || bestRelation?.supplierId));

            const hasValidImage = product.images && product.images.length > 0 && product.images[0] && product.images[0].trim() !== '' && product.images[0] !== '/IMG-20260215-WA0003.jpg';

            return (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Top Image & Badge - No Logo Fallback */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                    {hasValidImage ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.namePt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4">
                        <Package size={38} className="text-slate-300 mb-1" />
                        <span className="text-[11px] font-semibold text-slate-500">Sem fotografia</span>
                        <span className="text-[10px] text-slate-400">{product.category}</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 bg-slate-900/80 text-white backdrop-blur-sm rounded-md">
                        {product.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-600/90 text-white backdrop-blur-sm rounded-md">
                        {product.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                      <button
                        onClick={() => handleOpenQuickPriceModal(product)}
                        className="h-7 px-2 rounded-lg bg-white/95 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 backdrop-blur-sm shadow text-[11px] font-bold transition-colors cursor-pointer"
                        title="Editar Preço e Quantidade Mínima"
                      >
                        <DollarSign size={12} /> Preço/MOQ
                      </button>
                      <button
                        onClick={() => handleOpenEditProduct(product)}
                        className="w-7 h-7 rounded-lg bg-white/95 text-slate-700 hover:text-corp-blue flex items-center justify-center backdrop-blur-sm shadow transition-colors cursor-pointer"
                        title="Editar Produto Completo"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir o produto ${product.id}?`)) {
                            onDeleteProduct(product.id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-white/95 text-slate-700 hover:text-red-600 flex items-center justify-center backdrop-blur-sm shadow transition-colors cursor-pointer"
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

                    {/* Preço Indicativo & MOQ - Caixa com Edição Rápida */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Preço Indicativo (FOB):
                          </span>
                          {effectivePrice > 0 ? (
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-base font-black text-emerald-700 font-mono">
                                {effectiveCurrency} ${effectivePrice.toFixed(2)}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                /{effectiveUnit}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-amber-600 block mt-0.5">
                              Não definido
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Mínimo (MOQ):
                          </span>
                          <span className="text-xs font-bold text-slate-800 font-mono block mt-0.5">
                            {effectiveMoq} {effectiveUnit}(s)
                          </span>
                        </div>
                      </div>

                      {linkedSupplier && (
                        <div className="text-[10px] text-slate-500 truncate border-t border-slate-200/60 pt-1.5 flex items-center gap-1">
                          <Building2 size={11} className="text-corp-blue shrink-0" />
                          <span className="truncate">Fornecedor: <strong>{linkedSupplier.companyName}</strong></span>
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-between border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleOpenQuickPriceModal(product)}
                          className="text-[11px] font-bold text-corp-blue hover:text-corp-orange flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg bg-white border border-slate-200 hover:border-corp-blue transition-colors shadow-2xs"
                          title="Clique para editar o preço e a quantidade mínima deste produto"
                        >
                          <DollarSign size={12} className="text-emerald-600" />
                          <span>Editar Preço & MOQ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenManageSuppliers(product)}
                          className="text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-200/70 transition-colors"
                          title="Ver ou adicionar fornecedores para este produto"
                        >
                          <Link2 size={11} />
                          <span>{productRelations.length} Fornecedor(es)</span>
                        </button>
                      </div>
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

              {/* 3. Preço Indicativo, Moeda & MOQ (Mínimo de Compra) */}
              <div className="space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <DollarSign size={14} className="text-emerald-700" />
                    3. Preço Indicativo & MOQ (Mínimo de Compra)
                  </h4>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded font-semibold">
                    Editável Diretamente
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Preço Unitário (FOB) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.indicativePrice ?? ''}
                        onChange={e => setProductForm({ 
                          ...productForm, 
                          indicativePrice: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 
                        })}
                        placeholder="10.50"
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-800 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Moeda</label>
                    <select
                      value={productForm.currency || 'USD'}
                      onChange={e => setProductForm({ ...productForm, currency: e.target.value as CurrencyType })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="CNY">CNY (¥)</option>
                      <option value="MZN">MZN (MT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unidade</label>
                    <select
                      value={productForm.priceUnit || 'unidade'}
                      onChange={e => setProductForm({ ...productForm, priceUnit: e.target.value as PriceUnit })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                    >
                      <option value="unidade">Unidade (pcs)</option>
                      <option value="caixa">Caixa (box)</option>
                      <option value="metro">Metro (m)</option>
                      <option value="m2">Metro² (m²)</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="set">Conjunto (set)</option>
                      <option value="par">Par (pair)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      MOQ (Qtd. Mínima) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={productForm.moq ?? ''}
                      onChange={e => setProductForm({ 
                        ...productForm, 
                        moq: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 1 
                      })}
                      placeholder="10"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fornecedor Principal Vinculado (Opcional)
                  </label>
                  <select
                    value={productForm.defaultSupplierId || ''}
                    onChange={e => setProductForm({ ...productForm, defaultSupplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">Sem fornecedor pré-vinculado</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.companyName} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Fotografias do Produto (Upload do Dispositivo & URLs) */}
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-corp-blue" />
                      4. Fotografias do Produto
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Carregue fotos reais do produto do seu computador ou telemóvel (nunca mostrará o logótipo).
                    </p>
                  </div>
                  {productForm.images && productForm.images.length > 0 && (
                    <span className="text-[10px] font-bold text-corp-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {productForm.images.length} foto(s)
                    </span>
                  )}
                </div>

                {/* Input de Arquivo Oculto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp, image/jpg"
                  multiple
                  onChange={handlePhotoFilesUpload}
                  className="hidden"
                />

                {/* Dropzone & Upload Button */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-corp-blue bg-white hover:bg-blue-50/30 p-5 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-corp-blue flex items-center justify-center transition-colors">
                    <Upload size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-corp-blue">
                      {isUploadingPhoto ? 'A carregar e a processar fotos...' : 'Clique para carregar fotos do dispositivo'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Formatos suportados: JPG, PNG, WEBP (Comprimido automaticamente para rapidez)
                    </p>
                  </div>
                </div>

                {/* Galeria de Fotos Carregadas */}
                {productForm.images && productForm.images.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Fotos Atuais do Produto:
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {productForm.images.map((img, idx) => (
                        <div 
                          key={idx} 
                          className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 bg-white shadow-xs group"
                        >
                          <img 
                            src={img} 
                            alt={`Foto ${idx + 1}`} 
                            className="w-full h-full object-cover" 
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-corp-blue/90 text-white text-[9px] font-bold text-center py-0.5">
                              Principal
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductForm({
                                ...productForm,
                                images: productForm.images?.filter((_, i) => i !== idx)
                              });
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow transition-colors cursor-pointer"
                            title="Remover fotografia"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Adicionar Foto por URL Web (Alternativa) */}
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">
                    Ou colar endereço web (URL) da imagem:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={e => setImageUrlInput(e.target.value)}
                      placeholder="https://exemplo.com/foto-do-produto.jpg"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageUrlInput.trim()) {
                          setProductForm({
                            ...productForm,
                            images: [...(productForm.images || []).filter(img => img && img.trim() !== '' && img !== '/IMG-20260215-WA0003.jpg'), imageUrlInput.trim()]
                          });
                          setImageUrlInput('');
                        }
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      Adicionar Link
                    </button>
                  </div>
                </div>
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
                                onClick={() => handleStartEditRelation(rel)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Editar preço, MOQ e termos desta cotação"
                              >
                                <Edit3 size={11} /> Editar Cotação
                              </button>
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

            {/* Form to link or edit a supplier relation */}
            <form onSubmit={handleSaveRelationSubmit} className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-corp-blue flex items-center gap-1.5">
                  {editingRelationId ? (
                    <>
                      <Edit3 size={14} className="text-amber-600" />
                      Editar Cotação do Fornecedor ({relationForm.supplierId})
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      + Associar Mais um Fornecedor a este Produto
                    </>
                  )}
                </h4>
                {editingRelationId && (
                  <button
                    type="button"
                    onClick={handleCancelEditRelation}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condições de Pagamento</label>
                  <input
                    type="text"
                    value={relationForm.paymentTerms || ''}
                    onChange={e => setRelationForm({ ...relationForm, paymentTerms: e.target.value })}
                    placeholder="Ex: 30% T/T Adiantado"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contrato / Proforma (URL)</label>
                  <input
                    type="url"
                    value={relationForm.contractUrl || ''}
                    onChange={e => setRelationForm({ ...relationForm, contractUrl: e.target.value })}
                    placeholder="Link do Anexo"
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

              <div className="flex justify-end gap-2 pt-2">
                {editingRelationId && (
                  <button
                    type="button"
                    onClick={handleCancelEditRelation}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-modern-primary !py-2 px-5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {editingRelationId ? 'Atualizar Cotação' : 'Salvar Associação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Edit Price & MOQ */}
      {isQuickPriceModalOpen && quickPriceProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                  {quickPriceProduct.id} • {quickPriceProduct.category}
                </span>
                <h3 className="font-heading font-bold text-lg text-slate-900 mt-1 leading-snug">
                  Editar Preço & MOQ
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {quickPriceProduct.namePt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickPriceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPriceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preço Indicativo (FOB) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={quickPriceForm.price}
                      onChange={e => setQuickPriceForm({ ...quickPriceForm, price: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold text-emerald-800 bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Moeda</label>
                  <select
                    value={quickPriceForm.currency}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, currency: e.target.value as CurrencyType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="MZN">MZN (MT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    MOQ (Qtd. Mínima) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quickPriceForm.moq}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, moq: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 1 })}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-800 bg-white focus:outline-none focus:border-corp-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                  <select
                    value={quickPriceForm.priceUnit}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, priceUnit: e.target.value as PriceUnit })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                  >
                    <option value="unidade">Unidade (pcs)</option>
                    <option value="caixa">Caixa (box)</option>
                    <option value="metro">Metro (m)</option>
                    <option value="m2">Metro² (m²)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="set">Conjunto (set)</option>
                    <option value="par">Par (pair)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fornecedor Vinculado
                </label>
                <select
                  value={quickPriceForm.supplierId}
                  onChange={e => setQuickPriceForm({ ...quickPriceForm, supplierId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="">Sem fornecedor pré-vinculado</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id} - {s.companyName} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prazo de Produção (Dias)</label>
                  <input
                    type="number"
                    value={quickPriceForm.leadTimeDays || ''}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, leadTimeDays: parseInt(e.target.value, 10) || 15 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Incoterm</label>
                  <select
                    value={quickPriceForm.incoterm}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, incoterm: e.target.value as IncotermType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                  >
                    <option value="FOB">FOB</option>
                    <option value="EXW">EXW</option>
                    <option value="CIF">CIF</option>
                    <option value="DDP">DDP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Porto Exportação</label>
                  <select
                    value={quickPriceForm.loadingPort}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, loadingPort: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {defaultPorts.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pagamento / Termos</label>
                  <input
                    type="text"
                    value={quickPriceForm.paymentTerms}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, paymentTerms: e.target.value })}
                    placeholder="Ex: 30% Adiantado"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL do Contrato / Anexo</label>
                <input
                  type="url"
                  value={quickPriceForm.contractUrl}
                  onChange={e => setQuickPriceForm({ ...quickPriceForm, contractUrl: e.target.value })}
                  placeholder="Link para o documento"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickPriceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-modern-primary !py-2 px-5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Salvar Preço & MOQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
