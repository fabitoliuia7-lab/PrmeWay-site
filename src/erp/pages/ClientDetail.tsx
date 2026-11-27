import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc, collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Save, Trash2, MessageCircle, Phone, Calendar, Mail } from 'lucide-react';
import { ErpOperationType, logErpFirestoreError, useErp } from '../ErpContext';

interface ClientDetailProps {
  id: string;
}

export default function ClientDetail({ id }: ClientDetailProps) {
  const { navigate, user } = useErp();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    sector: '',
    status: 'Novo',
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [newInteraction, setNewInteraction] = useState({ type: 'Ligação', notes: '', date: '' });

  useEffect(() => {
    if (!isNew && id) {
      const fetchClient = async () => {
        try {
          const docRef = doc(db, 'clients', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const d = docSnap.data();
            setFormData({
              name: d.name || '',
              email: d.email || '',
              phone: d.phone || '',
              company: d.company || '',
              sector: d.sector || '',
              status: d.status || 'Novo',
            });
          }
        } catch (err) {
          logErpFirestoreError(err, ErpOperationType.GET, `clients/${id}`);
          setErrorMsg('Erro ao carregar dados do cliente.');
        } finally {
          setLoading(false);
        }
      };

      const qInteractions = query(collection(db, `clients/${id}/interactions`), orderBy('date', 'desc'));
      const unsub = onSnapshot(
        qInteractions,
        (snap) => {
          setInteractions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        },
        (err) => {
          logErpFirestoreError(err, ErpOperationType.LIST, `clients/${id}/interactions`);
        }
      );

      void fetchClient();
      return () => unsub();
    }
  }, [id, isNew]);

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    setErrorMsg(null);
    try {
      await addDoc(collection(db, `clients/${id}/interactions`), {
        type: newInteraction.type,
        notes: newInteraction.notes.trim(),
        date: newInteraction.date,
        clientId: id,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewInteraction({ type: 'Ligação', notes: '', date: '' });
    } catch (err) {
      logErpFirestoreError(err, ErpOperationType.CREATE, `clients/${id}/interactions`);
      setErrorMsg('Erro ao adicionar interação.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        sector: formData.sector.trim(),
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, 'clients', newId), {
          ...payload,
          createdAt: serverTimestamp(),
          ownerId: user?.uid || '',
          userEmail: user?.email || '',
        });
        navigate('/clients');
      } else if (id) {
        await updateDoc(doc(db, 'clients', id), payload);
        navigate('/clients');
      }
    } catch (err) {
      logErpFirestoreError(err, isNew ? ErpOperationType.CREATE : ErpOperationType.UPDATE, `clients/${id}`);
      setErrorMsg('Erro ao salvar cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Excluir este cliente?')) return;
    try {
      await deleteDoc(doc(db, 'clients', id));
      navigate('/clients');
    } catch (err) {
      logErpFirestoreError(err, ErpOperationType.DELETE, `clients/${id}`);
      setErrorMsg('Erro ao excluir cliente.');
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-6 w-full">
      <button
        type="button"
        onClick={() => navigate('/clients')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors text-sm font-medium cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        VOLTAR
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {isNew ? 'Novo Cliente' : 'Editar Cliente'}
        </h1>
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
            title="Excluir Cliente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome Completo</label>
            <input
              required
              type="text"
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail</label>
            <input
              type="email"
              placeholder="email@empresa.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefone / WhatsApp</label>
            <input
              type="text"
              placeholder="+258 84..."
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Empresa</label>
            <input
              type="text"
              placeholder="Nome da empresa"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Setor</label>
            <input
              type="text"
              placeholder="Ex: Construção, Comércio"
              value={formData.sector}
              onChange={e => setFormData({ ...formData, sector: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            >
              <option value="Novo">Novo (Lead)</option>
              <option value="Em Contato">Em Contato</option>
              <option value="Qualificado">Qualificado</option>
              <option value="Perdido">Perdido</option>
              <option value="Ganho">Ganho / Cliente</option>
              <option value="Ativo">Ativo (Em operações)</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SALVANDO...' : 'SALVAR CLIENTE'}
          </button>
        </div>
      </form>

      {!isNew && (
        <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">Histórico de Interações</h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleAddInteraction} className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Registrar Nova Interação</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <select
                    required
                    value={newInteraction.type}
                    onChange={e => setNewInteraction({ ...newInteraction, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  >
                    <option value="Ligação">Ligação</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Reunião">Reunião</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <input
                    required
                    type="datetime-local"
                    value={newInteraction.date}
                    onChange={e => setNewInteraction({ ...newInteraction, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
                  <input
                    required
                    type="text"
                    placeholder="Resumo da interação..."
                    value={newInteraction.notes}
                    onChange={e => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    ADICIONAR
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-6">
              {interactions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhuma interação registrada ainda.</p>
              ) : (
                interactions.map(interaction => {
                  const Icon = interaction.type === 'Ligação' ? Phone :
                               interaction.type === 'E-mail' ? Mail :
                               interaction.type === 'WhatsApp' ? MessageCircle : Calendar;
                  return (
                    <div key={interaction.id} className="flex gap-4">
                      <div className="mt-1 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-slate-900">{interaction.type}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">
                            {new Date(interaction.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{interaction.notes}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
