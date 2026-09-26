import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Mail, 
  ShieldCheck, 
  LogOut, 
  KeyRound, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Edit2,
  Check,
  Building,
  Clock
} from 'lucide-react';
import { User as FirebaseUser, updateProfile, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  isAdmin: boolean;
  quotesCount: number;
  onOpenHistory: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  isAdmin,
  quotesCount,
  onOpenHistory,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !user) return null;

  const handleSaveName = async () => {
    if (!newName.trim() || !user) return;
    setIsSavingName(true);
    setStatusMessage(null);
    try {
      await updateProfile(user, { displayName: newName.trim() });
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: newName.trim()
        });
      } catch (err) {
        // Non-blocking if firestore document doesn't exist yet
        console.warn('Could not update firestore users doc:', err);
      }
      setIsEditingName(false);
      setStatusMessage({ type: 'success', text: 'Nome atualizado com sucesso!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro ao atualizar o nome. Tente novamente.' });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user.email) return;
    setIsSendingReset(true);
    setStatusMessage(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
      setStatusMessage({ 
        type: 'success', 
        text: `Link de redefinição de senha enviado para ${user.email}. Verifique a sua caixa de entrada.` 
      });
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Erro ao enviar e-mail de redefinição. Tente mais tarde.' 
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'PW';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10"
        >
          {/* Header Card */}
          <div className="bg-gradient-to-br from-[#0f1b40] via-[#1a2b6b] to-[#1e3a8a] text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
              title="Fechar"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              {/* User Avatar */}
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Utilizador'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-600/60 border-2 border-white/30 flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {getInitials(user.displayName, user.email)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isAdmin 
                      ? 'bg-amber-400 text-slate-950 font-black' 
                      : 'bg-blue-400/30 text-blue-100 border border-blue-300/30'
                  }`}>
                    {isAdmin ? 'Administrador PrimeWay' : 'Cliente PrimeWay'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white truncate font-heading">
                  {user.displayName || 'Utilizador PrimeWay'}
                </h3>
                <p className="text-xs text-blue-200/90 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4">
            {/* Status message */}
            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Edit Display Name */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nome na Conta
                </span>
                {!isEditingName && (
                  <button
                    onClick={() => {
                      setNewName(user.displayName || '');
                      setIsEditingName(true);
                    }}
                    className="text-xs text-corp-blue hover:text-corp-blue-light font-bold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 size={13} /> Editar
                  </button>
                )}
              </div>

              {isEditingName ? (
                <div className="space-y-2 mt-1">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="input-modern !py-2 text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={isSavingName || !newName.trim()}
                      className="btn-modern-primary !py-1.5 !px-3 !text-xs flex items-center gap-1"
                    >
                      {isSavingName ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-800">
                  {user.displayName || 'Sem nome configurado'}
                </p>
              )}
            </div>

            {/* Quick Stats / Shortcuts */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-corp-blue/30 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <History size={18} className="text-corp-blue group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-corp-blue bg-blue-100 px-2 py-0.5 rounded-full">
                    {quotesCount}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">Cotações</div>
                <div className="text-[11px] text-slate-500">Ver histórico salvo</div>
              </button>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left">
                <div className="flex items-center justify-between mb-1">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded">
                    Ativo
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">Segurança</div>
                <div className="text-[11px] text-slate-500">Sessão protegida</div>
              </div>
            </div>

            {/* Password Reset Action */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-0.5">
                    <KeyRound size={15} className="text-corp-blue" />
                    <span>Redefinir Senha da Conta</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Enviaremos um link para {user.email} para que possa alterar a sua senha.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSendPasswordReset}
                  disabled={isSendingReset || resetSent}
                  className="shrink-0 px-3 py-2 bg-white hover:bg-slate-100 text-corp-blue border border-corp-blue/30 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSendingReset ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : resetSent ? (
                    <CheckCircle2 size={13} className="text-emerald-600" />
                  ) : null}
                  <span>{resetSent ? 'Enviado' : 'Enviar Link'}</span>
                </button>
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-red-50 hover:bg-red-100/80 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-red-200/60"
              >
                <LogOut size={16} />
                <span>Terminar Sessão</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
