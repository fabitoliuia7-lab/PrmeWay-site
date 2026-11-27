import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Save, Trash2, Plus, Minus } from 'lucide-react';
import { ErpOperationType, logErpFirestoreError, useErp } from '../ErpContext';

interface OpportunityItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface OpportunityDetailProps {
  id: string;
}

export default function OpportunityDetail({ id }: OpportunityDetailProps) {
  const { navigate, user } = useErp();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    status: 'Prospecção',
    deadline: '',
    items: [] as OpportunityItem[],
  });

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const q = query(collection(db, 'clients'), orderBy('name'));
        const clientsSnap = await getDocs(q);
        const clientsData = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setClients(clientsData);

        if (!isNew && id) {
          const docRef = doc(db, 'opportunities', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const d = docSnap.data();
            setFormData({
              title: d.title || '',
              clientId: d.clientId || '',
              status: d.status || 'Prospecção',
              deadline: d.deadline || '',
              items: Array.isArray(d.items) ? d.items : [],
            });
          }
        }
      } catch (err) {
        logErpFirestoreError(err, ErpOperationType.GET, `opportunities/${id}`);
        setErrorMsg('Erro ao carregar detalhes da oportunidade.');
      } finally {
        setLoading(false);
      }
    };
    void fetchInitialData();
  }, [id, isNew]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }],
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId),
    });
  };

  const handleItemChange = (itemId: string, field: keyof OpportunityItem, value: string | number) => {
    setFormData({
      ...formData,
      items: formData.items.map(item => (item.id === itemId ? { ...item, [field]: value } : item)),
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((acc, curr) => acc + Number(curr.quantity || 0) * Number(curr.price || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const sanitizedItems = formData.items.map(item => ({
        id: item.id,
        description: String(item.description || '').trim(),
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
      }));
      const dataToSave = {
        title: formData.title.trim(),
        clientId: formData.clientId,
        status: formData.status,
        deadline: formData.deadline,
        items: sanitizedItems,
        value: calculateTotal(),
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, 'opportunities', newId), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          ownerId: user?.uid || '',
          userEmail: user?.email || '',
        });
        navigate('/opportunities');
      } else if (id) {
        await updateDoc(doc(db, 'opportunities', id), dataToSave);
        navigate('/opportunities');
      }
    } catch (err) {
      logErpFirestoreError(err, isNew ? ErpOperationType.CREATE : ErpOperationType.UPDATE, `opportunities/${id}`);
      setErrorMsg('Erro ao salvar oportunidade.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteDoc(doc(db, 'opportunities', id));
      navigate('/opportunities');
    } catch (err) {
      logErpFirestoreError(err, ErpOperationType.DELETE, `opportunities/${id}`);
      setErrorMsg('Erro ao excluir oportunidade.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>;

  const totalValue = calculateTotal();

  return (
    <div className="max-w-4xl mx-auto mt-2">
      <button
        type="button"
        onClick={() => navigate('/opportunities')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors text-sm font-medium cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        VOLTAR
      </button>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          {isNew ? 'Nova Oportunidade e Orçamento' : 'Editar Oportunidade'}
        </h1>
        {!isNew && (
          <div className="flex items-center gap-2">
            {confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className={`px-3 py-2 rounded-lg transition-colors border flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                confirmDelete
                  ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                  : 'text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-100'
              }`}
              title="Excluir Oportunidade"
            >
              <Trash2 className="w-4 h-4" />
              {confirmDelete ? 'Confirmar Exclusão' : ''}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título da Oportunidade</label>
            <input
              required
              type="text"
              placeholder="Ex: Fornecimento de Peças - Abril"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium text-slate-900"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cliente Relacionado</label>
            <select
              required
              value={formData.clientId}
              onChange={e => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            >
              <option value="" disabled>Selecione um cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status no Funil</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold"
            >
              <option value="Prospecção">Prospecção</option>
              <option value="Proposta">Proposta (Enviada)</option>
              <option value="Negociação">Negociação</option>
              <option value="Ganho">Ganho (Fechado)</option>
              <option value="Perdido">Perdido (Não Fechou)</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prazo de Fechamento ou Entrega</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Itens do Orçamento</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ADICIONAR ITEM
            </button>
          </div>

          <div className="space-y-3">
            {formData.items.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500 text-sm">
                Nenhum item adicionado ao orçamento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-white rounded-lg border border-slate-200 min-w-[600px]">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 w-10"></th>
                      <th className="px-4 py-2">Descrição / Produto / Serviço</th>
                      <th className="px-4 py-2 w-32">Qtd</th>
                      <th className="px-4 py-2 w-48 text-right">Preço Unit (MZN)</th>
                      <th className="px-4 py-2 w-48 text-right">Total (MZN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.items.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="bg-rose-50 text-rose-500 p-1 rounded hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            required
                            placeholder="Nome do item..."
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            className="w-full outline-none border-b border-transparent hover:border-slate-300 focus:border-indigo-500 transition-colors py-1 bg-transparent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            required
                            min="1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                            className="w-full outline-none border-b border-transparent hover:border-slate-300 focus:border-indigo-500 transition-colors py-1 bg-transparent"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                            className="w-full text-right outline-none border-b border-transparent hover:border-slate-300 focus:border-indigo-500 transition-colors py-1 bg-transparent font-medium"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-slate-700 bg-slate-50/50">
                          {(Number(item.quantity) * Number(item.price)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50">
                        Total do Orçamento
                      </td>
                      <td className="px-4 py-3 text-right bg-indigo-600 text-white font-bold text-lg rounded-br-lg">
                        MZN {totalValue.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SALVANDO...' : 'SALVAR OPORTUNIDADE'}
          </button>
        </div>
      </form>
    </div>
  );
}
