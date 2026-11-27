import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { ErpOperationType, logErpFirestoreError, useErp } from '../ErpContext';

interface SaleDetailProps {
  id: string;
}

export default function SaleDetail({ id }: SaleDetailProps) {
  const { navigate, user } = useErp();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    type: 'Importação Completa',
    status: 'Pending',
    amount: '',
    notes: '',
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
          const docRef = doc(db, 'sales', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const d = docSnap.data();
            setFormData({
              title: d.title || '',
              clientId: d.clientId || '',
              type: d.type || 'Importação Completa',
              status: d.status || 'Pending',
              amount: d.amount !== undefined && d.amount !== null ? String(d.amount) : '',
              notes: d.notes || '',
            });
          }
        }
      } catch (err) {
        logErpFirestoreError(err, ErpOperationType.GET, `sales/${id}`);
        setErrorMsg('Erro ao carregar detalhes da operação.');
      } finally {
        setLoading(false);
      }
    };
    void fetchInitialData();
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const dataToSave = {
        title: formData.title.trim(),
        clientId: formData.clientId,
        type: formData.type,
        status: formData.status,
        amount: Number(formData.amount) || 0,
        notes: formData.notes.trim(),
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, 'sales', newId), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          ownerId: user?.uid || '',
          userEmail: user?.email || '',
        });
        navigate('/sales');
      } else if (id) {
        await updateDoc(doc(db, 'sales', id), dataToSave);
        navigate('/sales');
      }
    } catch (err) {
      logErpFirestoreError(err, isNew ? ErpOperationType.CREATE : ErpOperationType.UPDATE, `sales/${id}`);
      setErrorMsg('Erro ao salvar operação.');
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
      await deleteDoc(doc(db, 'sales', id));
      navigate('/sales');
    } catch (err) {
      logErpFirestoreError(err, ErpOperationType.DELETE, `sales/${id}`);
      setErrorMsg('Erro ao excluir operação.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto mt-2">
      <button
        type="button"
        onClick={() => navigate('/sales')}
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
          {isNew ? 'Nova Operação' : 'Detalhes da Operação'}
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
              title="Excluir Operação"
            >
              <Trash2 className="w-4 h-4" />
              {confirmDelete ? 'Confirmar Exclusão' : ''}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#dfe3e6] shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título / Referência da Carga</label>
            <input
              required
              type="text"
              placeholder="Ex: Madeiras da China Container 01"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cliente</label>
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Serviço</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            >
              <option value="Importação Completa">Importação Completa</option>
              <option value="Importação Assistida">Importação Assistida</option>
              <option value="Transporte Regional">Transporte Regional</option>
              <option value="Consultoria">Consultoria em Importação</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status da Operação</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            >
              <option value="Pending">Pendente</option>
              <option value="Negotiating">Em Negociação</option>
              <option value="Purchased">Comprado na China</option>
              <option value="In Transit">Em Trânsito (Frete Internacional)</option>
              <option value="Customs">Desembaraço (Alfândega MZ)</option>
              <option value="Delivered">Entregue</option>
              <option value="Cancelled">Cancelado</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor Total (MZN)</label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Anotações e Detalhes da Carga</label>
            <textarea
              rows={4}
              placeholder="Descreva containers, pesos, volumes, parceiros..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-sm"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#16263c] text-white px-6 py-2.5 rounded-md font-semibold text-sm hover:bg-[#233856] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SALVANDO...' : 'SALVAR OPERAÇÃO'}
          </button>
        </div>
      </form>
    </div>
  );
}
