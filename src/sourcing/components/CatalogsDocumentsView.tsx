import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  ExternalLink, 
  Building2, 
  Package, 
  FileCheck, 
  Download, 
  Trash2, 
  X, 
  Upload, 
  Link2,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { CatalogDocument, Supplier, ProductItem, DocumentType } from '../types';
import { generateNextId } from '../idGenerator';

interface CatalogsDocumentsViewProps {
  documents: CatalogDocument[];
  suppliers: Supplier[];
  products: ProductItem[];
  onSaveDocument: (doc: CatalogDocument) => void;
  onDeleteDocument: (docId: string) => void;
}

export const CatalogsDocumentsView: React.FC<CatalogsDocumentsViewProps> = ({
  documents,
  suppliers,
  products,
  onSaveDocument,
  onDeleteDocument
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<CatalogDocument>>({
    title: '',
    documentType: 'catalogo',
    supplierId: suppliers[0]?.id || '',
    productId: '',
    fileUrl: '',
    description: ''
  });

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const supp = suppliers.find(s => s.id === d.supplierId);
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        d.id.toLowerCase().includes(search) ||
        d.title.toLowerCase().includes(search) ||
        d.description.toLowerCase().includes(search) ||
        (supp && supp.companyName.toLowerCase().includes(search));

      const matchType = typeFilter === 'todos' || d.documentType === typeFilter;
      return matchSearch && matchType;
    });
  }, [documents, suppliers, searchTerm, typeFilter]);

  const handleOpenNew = () => {
    const nextId = generateNextId('DOC', documents);
    setFormData({
      id: nextId,
      title: '',
      documentType: 'catalogo',
      supplierId: suppliers[0]?.id || '',
      productId: '',
      fileUrl: '',
      description: '',
      uploadedAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.fileUrl?.trim()) {
      alert('Informe o título e o link ou ficheiro do documento.');
      return;
    }

    const saved: CatalogDocument = {
      id: formData.id || generateNextId('DOC', documents),
      title: formData.title,
      documentType: (formData.documentType as DocumentType) || 'catalogo',
      supplierId: formData.supplierId || undefined,
      productId: formData.productId || undefined,
      fileUrl: formData.fileUrl,
      description: formData.description || '',
      uploadedAt: formData.uploadedAt || new Date().toISOString()
    };

    onSaveDocument(saved);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="text-corp-blue" size={26} />
            Catálogos & Documentos Técnicos
          </h2>
          <p className="text-xs text-slate-500">
            Fichas técnicas, catálogos PDF, licenças de negócio de fábricas e proformas da China.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="btn-modern-primary flex items-center gap-2 text-xs font-bold uppercase tracking-wider !py-2.5 px-4 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Adicionar Documento / Link
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar documento por título, código ou fornecedor..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-corp-blue"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="todos">Tipo de Documento (Todos)</option>
              <option value="catalogo">Catálogo PDF de Produtos</option>
              <option value="ficha_tecnica">Ficha Técnica / Spec Sheet</option>
              <option value="licenca">Licença Comercial / Alvará Chinês</option>
              <option value="inspecao">Relatório de Inspeção / Teste</option>
              <option value="proforma">Fatura Proforma (P/I)</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Nenhum documento encontrado.
          </div>
        ) : (
          filteredDocs.map(doc => {
            const supp = suppliers.find(s => s.id === doc.supplierId);
            const prod = products.find(p => p.id === doc.productId);

            return (
              <div 
                key={doc.id} 
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-blue-50 text-corp-blue px-2 py-0.5 rounded border border-blue-100">
                      {doc.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {((doc.documentType || doc.docType) ?? 'outro').replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {doc.title}
                  </h3>

                  {supp && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                      <Building2 size={13} className="text-corp-blue" />
                      <span>{supp.companyName}</span>
                    </div>
                  )}

                  {prod && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Package size={13} className="text-emerald-600" />
                      <span>{prod.namePt}</span>
                    </div>
                  )}

                  {doc.description && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-corp-blue hover:text-corp-orange transition-colors"
                  >
                    <ExternalLink size={13} /> Abrir Ficheiro / Link
                  </a>

                  <button
                    onClick={() => {
                      if (window.confirm(`Excluir documento ${doc.id}?`)) {
                        onDeleteDocument(doc.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Remover"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
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
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900 uppercase tracking-tight">
                  Registar Documento ou Catálogo
                </h3>
                <p className="text-xs text-slate-500">
                  Adicione links para PDF no Google Drive, Baidu Netdisk ou Weiyun.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Documento *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Catálogo Oficial de Painéis Solares 2026 (PDF)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Documento</label>
                  <select
                    value={formData.documentType}
                    onChange={e => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="catalogo">Catálogo</option>
                    <option value="ficha_tecnica">Ficha Técnica</option>
                    <option value="licenca">Licença / Alvará</option>
                    <option value="inspecao">Inspeção / Teste</option>
                    <option value="proforma">Proforma Invoice</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fornecedor Chinês</label>
                  <select
                    value={formData.supplierId || ''}
                    onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">Nenhum (Geral)</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link para o Ficheiro / Cloud Storage *</label>
                <input
                  type="url"
                  required
                  value={formData.fileUrl}
                  onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://drive.google.com/... ou https://pan.baidu.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Notas de Conteúdo</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Contém tabela de descontos para pedidos acima de 1 container..."
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
                  Guardar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
