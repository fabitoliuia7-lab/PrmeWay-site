import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  KeyRound, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw,
  Clock,
  HelpCircle
} from 'lucide-react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  verifyPasswordResetCode,
  confirmPasswordReset,
  updateProfile, 
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { logoBase64 } from './logoBase64';

export type AuthTab = 'login' | 'register' | 'forgot' | 'resetPassword';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: FirebaseUser | null;
  initialTab?: AuthTab;
  resetCode?: string | null;
  onOpenLegalTerms?: (type: 'termos' | 'privacidade') => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTab = 'login',
  resetCode = null,
  onOpenLegalTerms,
  onSuccess,
}) => {
  const [tab, setTab] = useState<AuthTab>(initialTab);

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states - Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAgreeTerms, setRegAgreeTerms] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Form states - Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Form states - In-App Reset Password Confirmation
  const [activeResetCode, setActiveResetCode] = useState<string | null>(resetCode);
  const [resetAccountEmail, setResetAccountEmail] = useState<string>('');
  const [isVerifyingResetCode, setIsVerifyingResetCode] = useState(false);
  const [isResetCodeValid, setIsResetCodeValid] = useState<boolean | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showNewResetPassword, setShowNewResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [configNotice, setConfigNotice] = useState<string | null>(null);

  // Reset or initialize states when modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErrorMessage(null);
      setSuccessMessage(null);
      setConfigNotice(null);
      setForgotSent(false);
      setGoogleLoading(false);
      setLoading(false);
      if (initialTab === 'forgot' && loginEmail) {
        setForgotEmail(loginEmail);
      }
    }
  }, [isOpen, initialTab, loginEmail]);

  // Sync reset code if provided
  useEffect(() => {
    if (resetCode) {
      setActiveResetCode(resetCode);
      setTab('resetPassword');
    }
  }, [resetCode]);

  // Handle countdown timer for password recovery emails
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  // Verify Reset Code when entering resetPassword view
  useEffect(() => {
    if (isOpen && tab === 'resetPassword' && activeResetCode) {
      setIsVerifyingResetCode(true);
      setErrorMessage(null);
      verifyPasswordResetCode(auth, activeResetCode)
        .then((email) => {
          setResetAccountEmail(email);
          setIsResetCodeValid(true);
        })
        .catch((err) => {
          setIsResetCodeValid(false);
          setErrorMessage(parseAuthError(err));
        })
        .finally(() => {
          setIsVerifyingResetCode(false);
        });
    }
  }, [isOpen, tab, activeResetCode]);

  // Auto-close immediately if user is already authenticated
  useEffect(() => {
    if (currentUser && isOpen) {
      setGoogleLoading(false);
      setLoading(false);
      onClose();
    }
  }, [currentUser, isOpen, onClose]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Calculate password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200', width: 'w-0' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Fraca', color: 'bg-red-500', width: 'w-1/4' };
    if (score <= 3) return { score: 2, label: 'Média', color: 'bg-amber-500', width: 'w-2/4' };
    if (score === 4) return { score: 3, label: 'Boa', color: 'bg-blue-500', width: 'w-3/4' };
    return { score: 4, label: 'Forte', color: 'bg-emerald-500', width: 'w-full' };
  };

  const passwordStrength = getPasswordStrength(regPassword);
  const resetStrength = getPasswordStrength(newResetPassword);

  // Map Firebase Auth errors to user-friendly Portuguese messages
  const parseAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'E-mail ou senha incorretos. Por favor, verifique os seus dados ou utilize a recuperação de senha.';
      case 'auth/user-not-found':
        return 'Não encontramos nenhuma conta com este endereço de e-mail. Verifique a digitação ou crie uma conta nova.';
      case 'auth/email-already-in-use':
        return 'Este endereço de e-mail já está registado. Experimente iniciar sessão ou redefinir a sua senha.';
      case 'auth/invalid-email':
        return 'O endereço de e-mail inserido não tem um formato válido.';
      case 'auth/weak-password':
        return 'A senha deve ter no mínimo 6 caracteres. Recomendamos combinar letras e números.';
      case 'auth/expired-action-code':
        return 'O link de recuperação expirou. Por motivos de segurança, o link tem validade limitada e é anulado se clicar em "Recuperar" mais de uma vez. Solicite um novo link abaixo.';
      case 'auth/invalid-action-code':
        return 'Este link de recuperação é inválido ou já foi utilizado. Se clicou em "Enviar" várias vezes, abra sempre o link do último e-mail recebido.';
      case 'auth/operation-not-allowed':
        setConfigNotice('O provedor de autenticação por E-mail/Senha precisa de ser ativado no Firebase Console (Authentication > Sign-in method > E-mail/senha). Você também pode entrar usando a sua conta Google.');
        return 'O acesso por e-mail/senha ainda não está habilitado no Firebase Console. Utilize o botão Google ou ative o provedor na consola.';
      case 'auth/too-many-requests':
        return 'Acesso temporariamente bloqueado devido a muitas tentativas falhadas. Aguarde alguns minutos ou redefina a sua senha.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return '';
      case 'auth/popup-blocked':
        return 'A janela de autenticação foi bloqueada pelo seu navegador. Por favor, permita pop-ups para esta página.';
      case 'auth/network-request-failed':
        return 'Falha de comunicação com os servidores. Por favor, verifique a sua ligação à internet.';
      default:
        return (err as Error)?.message || 'Ocorreu um erro ao processar o seu pedido. Tente novamente.';
    }
  };

  // Safe background profile synchronization (fire-and-forget, never blocking UI)
  const syncUserProfile = async (userObj: { uid: string; email?: string | null; displayName?: string | null }) => {
    if (!userObj.uid || !userObj.email) return;
    try {
      const userRef = doc(db, 'users', userObj.uid);
      const isAdminEmail = userObj.email === 'fabitoliuia7@gmail.com' || userObj.email === 'comercial@primewayinvest.com';
      await setDoc(userRef, {
        uid: userObj.uid,
        email: userObj.email,
        displayName: userObj.displayName || '',
        role: isAdminEmail ? 'admin' : 'client',
        createdAt: Timestamp.now()
      }, { merge: true });
    } catch {
      // Ignored non-blocking
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfigNotice(null);

    const emailTrim = loginEmail.trim();
    if (!emailTrim) {
      setErrorMessage('Por favor, informe o seu endereço de e-mail.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Por favor, insira a sua senha de acesso.');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, emailTrim, loginPassword);
      syncUserProfile(cred.user);
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfigNotice(null);

    const nameTrim = regName.trim();
    const emailTrim = regEmail.trim();

    if (!nameTrim) {
      setErrorMessage('Por favor, digite o seu nome completo ou nome da empresa.');
      return;
    }
    if (!emailTrim) {
      setErrorMessage('Por favor, digite o seu e-mail.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('A senha deve conter pelo menos 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('A confirmação da senha não coincide com a senha digitada.');
      return;
    }
    if (!regAgreeTerms) {
      setErrorMessage('Para criar uma conta, é necessário aceitar os Termos de Serviço da PrimeWay.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, emailTrim, regPassword);
      
      if (nameTrim) {
        updateProfile(cred.user, { displayName: nameTrim }).catch(() => {});
      }

      syncUserProfile({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: nameTrim
      });

      setSuccessMessage('Conta criada com sucesso! Bem-vindo à PrimeWay.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Recovery Submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;
    setErrorMessage(null);
    setConfigNotice(null);

    const emailTrim = forgotEmail.trim();
    if (!emailTrim) {
      setErrorMessage('Por favor, informe o e-mail da conta que deseja recuperar.');
      return;
    }

    setLoading(true);
    try {
      const returnUrl = window.location.origin;
      try {
        await sendPasswordResetEmail(auth, emailTrim, {
          url: returnUrl,
          handleCodeInApp: true,
        });
      } catch (uriErr: unknown) {
        const code = (uriErr as { code?: string })?.code;
        if (code === 'auth/unauthorized-continue-uri') {
          // If custom URL is not in authorized domains yet, fall back seamlessly
          await sendPasswordResetEmail(auth, emailTrim);
        } else {
          throw uriErr;
        }
      }
      setForgotSent(true);
      setCooldownSeconds(60); // 60s cooldown to avoid invalidating links by spamming clicks
      setSuccessMessage(`Enviámos um link de recuperação para ${emailTrim}. Verifique a sua caixa de entrada.`);
    } catch (err) {
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle In-App New Password Confirmation
  const handleConfirmResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newResetPassword || newResetPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setErrorMessage('A confirmação da nova senha não coincide.');
      return;
    }
    if (!activeResetCode) {
      setErrorMessage('Código de recuperação não encontrado ou inválido.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, activeResetCode, newResetPassword);
      setSuccessMessage('Senha atualizada com sucesso! Pode agora iniciar sessão com a sua nova senha.');
      
      // Clean query string from browser URL
      if (window.history?.replaceState) {
        const cleanPath = window.location.pathname;
        window.history.replaceState({}, document.title, cleanPath);
      }

      setTimeout(() => {
        setTab('login');
        setLoginEmail(resetAccountEmail);
        setLoginPassword('');
        setSuccessMessage('Senha atualizada com sucesso! Inicie sessão com a nova senha.');
      }, 1500);
    } catch (err) {
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Login (Fast & Non-blocking)
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setConfigNotice(null);
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      if (cred?.user) {
        onSuccess?.();
        onClose();
        syncUserProfile(cred.user);
      }
    } catch (err: unknown) {
      console.error('Google Auth Error:', err);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed or dismissed the popup window, stop spinner cleanly
        setGoogleLoading(false);
        return;
      }
      const parsed = parseAuthError(err);
      if (parsed) setErrorMessage(parsed);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto z-10"
        >
          {/* Clean Top Brand Header Banner */}
          <div className="relative bg-gradient-to-br from-[#0f1b40] via-[#1a2b6b] to-[#1e3a8a] text-white p-6 sm:p-7">
            {/* Ambient pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/40"
              title="Fechar janela"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            {/* Header Content */}
            <div className="relative z-10 flex items-center gap-3.5 mb-2">
              <div className="bg-white p-1.5 rounded-xl shadow-md border border-white/20">
                <img
                  src={logoBase64}
                  alt="PrimeWay Invest & Logística"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-200 block">
                  Portal do Cliente
                </span>
                <h2 className="text-xl font-black font-heading tracking-tight text-white leading-tight">
                  {tab === 'login' && 'Iniciar Sessão'}
                  {tab === 'register' && 'Criar Nova Conta'}
                  {tab === 'forgot' && 'Recuperar Senha'}
                  {tab === 'resetPassword' && 'Definir Nova Senha'}
                </h2>
              </div>
            </div>

            {/* Subtitle based on active view */}
            <p className="text-xs text-blue-100/90 leading-relaxed max-w-sm mt-1">
              {tab === 'login' && 'Aceda à sua conta para gerir cotações, faturas e acompanhar cargas internacionais.'}
              {tab === 'register' && 'Registe-se gratuitamente para salvar cotações e ter atendimento prioritário.'}
              {tab === 'forgot' && 'Insira o seu e-mail cadastrado para receber as instruções de recuperação.'}
              {tab === 'resetPassword' && 'Crie uma nova senha segura para aceder à sua conta na PrimeWay.'}
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-7 max-h-[75vh] overflow-y-auto">
            {/* Feedback Banners */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs sm:text-sm leading-relaxed"
              >
                <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-xs sm:text-sm leading-relaxed"
              >
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <div className="flex-1">{successMessage}</div>
              </motion.div>
            )}

            {configNotice && (
              <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck size={14} className="text-amber-600" />
                  <span>Dica de Configuração Firebase</span>
                </div>
                {configNotice}
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {tab === 'login' && (
              <div className="space-y-4">
                {/* 1-Click Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading || googleLoading}
                  className="w-full border-2 border-slate-200/90 hover:border-corp-blue/40 bg-white hover:bg-slate-50 text-slate-800 font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-3 text-sm active:scale-[0.99] disabled:opacity-60"
                >
                  {googleLoading ? (
                    <>
                      <RefreshCw size={17} className="animate-spin text-corp-blue" />
                      <span>A ligar à Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Entrar com Google</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                    <span className="bg-white px-3 text-slate-400 font-semibold">ou com e-mail e senha</span>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="label-corp">Endereço de E-mail</label>
                    <div className="relative">
                      <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="exemplo@empresa.co.mz"
                        className="input-modern !pl-10 text-sm"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="label-corp !mb-0">Senha</label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail);
                          setTab('forgot');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-xs text-corp-blue hover:text-corp-blue-light font-bold transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-modern !pl-10 !pr-10 text-sm"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        title={showLoginPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Login Button */}
                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full btn-modern-primary !py-3.5 !text-sm flex items-center justify-center gap-2 mt-2 shadow-md shadow-corp-blue/25"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        <span>A entrar...</span>
                      </>
                    ) : (
                      <>
                        <span>Iniciar Sessão</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>

                {/* Bottom Link to Register */}
                <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
                  Não possui conta na PrimeWay?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setTab('register');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="font-bold text-corp-blue hover:text-corp-blue-light transition-colors underline underline-offset-2 ml-1"
                  >
                    Criar conta agora
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: REGISTER */}
            {tab === 'register' && (
              <div className="space-y-4">
                {/* Back to Login link */}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-corp-blue font-bold transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Voltar ao início de sessão</span>
                </button>

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="label-corp">Nome Completo ou Empresa</label>
                    <div className="relative">
                      <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Ex: Carlos Sitoe ou Minha Empresa, Lda"
                        className="input-modern !pl-10 text-sm"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-corp">Endereço de E-mail</label>
                    <div className="relative">
                      <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="contacto@empresa.co.mz"
                        className="input-modern !pl-10 text-sm"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-corp">Telemóvel / WhatsApp (Opcional)</label>
                    <div className="relative">
                      <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+258 84 000 0000"
                        className="input-modern !pl-10 text-sm"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-corp">Criar Nova Senha</label>
                    <div className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        className="input-modern !pl-10 !pr-10 text-sm"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Password Strength Meter */}
                    {regPassword.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Nível da senha:</span>
                          <span className="font-bold text-slate-700">{passwordStrength.label}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300 ${passwordStrength.width}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label-corp">Confirmar Senha</label>
                    <div className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repita a senha criada"
                        className={`input-modern !pl-10 !pr-10 text-sm ${
                          regConfirmPassword && regConfirmPassword !== regPassword
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                        }`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {regConfirmPassword && (
                      <p className={`text-[11px] mt-1 font-medium ${
                        regConfirmPassword === regPassword ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {regConfirmPassword === regPassword ? '✓ As senhas coincidem' : '✕ As senhas não coincidem'}
                      </p>
                    )}
                  </div>

                  {/* Terms checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        required
                        checked={regAgreeTerms}
                        onChange={(e) => setRegAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-corp-blue focus:ring-corp-blue"
                      />
                      <span className="leading-snug">
                        Concordo com os{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLegalTerms?.('termos')}
                          className="text-corp-blue font-bold hover:underline"
                        >
                          Termos de Serviço
                        </button>{' '}
                        e a{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLegalTerms?.('privacidade')}
                          className="text-corp-blue font-bold hover:underline"
                        >
                          Política de Privacidade
                        </button>{' '}
                        da PrimeWay.
                      </span>
                    </label>
                  </div>

                  {/* Submit Register Button */}
                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full btn-modern-primary !py-3.5 !text-sm flex items-center justify-center gap-2 shadow-md shadow-corp-blue/25"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        <span>A criar conta...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-amber-300" />
                        <span>Criar Conta PrimeWay</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Google alternative */}
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                    <span className="bg-white px-3 text-slate-400 font-semibold">ou registe-se com</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading || googleLoading}
                  className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-3 text-xs sm:text-sm hover:border-slate-300"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar com Google</span>
                </button>

                {/* Bottom switcher */}
                <div className="pt-2 text-center text-xs text-slate-500">
                  Já possui uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setTab('login');
                      setErrorMessage(null);
                    }}
                    className="font-bold text-corp-blue hover:text-corp-blue-light transition-colors underline underline-offset-2 ml-1"
                  >
                    Iniciar sessão
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: FORGOT PASSWORD / RECOVERY */}
            {tab === 'forgot' && (
              <div className="space-y-4">
                {/* Back to Login link */}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setForgotSent(false);
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-corp-blue font-bold transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Voltar ao início de sessão</span>
                </button>

                {forgotSent ? (
                  <div className="text-center py-3 space-y-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 size={30} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        E-mail de Recuperação Enviado!
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                        Enviámos as instruções para <strong className="text-slate-900">{forgotEmail}</strong>.
                      </p>
                    </div>

                    {/* Explanatory box to prevent "link expired" confusion */}
                    <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-left text-xs text-amber-900 space-y-1.5">
                      <p className="font-bold flex items-center gap-1.5 text-amber-800">
                        <HelpCircle size={15} className="shrink-0 text-amber-600" />
                        Atenção importante sobre o link:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed text-[11px]">
                        <li>
                          <strong>Abra sempre o e-mail mais recente:</strong> Por motivos de segurança, cada novo link enviado invalida os links anteriores.
                        </li>
                        <li>
                          Verifique a pasta de <strong>Spam / Lixo Eletrónico</strong> se não encontrar na caixa de entrada.
                        </li>
                        <li>
                          O link tem validade limitada e só pode ser utilizado uma única vez.
                        </li>
                      </ul>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotSent(false);
                          setSuccessMessage(null);
                        }}
                        disabled={cooldownSeconds > 0}
                        className="w-full btn-modern-outline !py-2.5 !text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {cooldownSeconds > 0 ? (
                          <>
                            <Clock size={14} />
                            <span>Pode reenviar em {cooldownSeconds}s</span>
                          </>
                        ) : (
                          <span>Reenviar novo e-mail</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="w-full btn-modern-primary !py-2.5 !text-xs"
                      >
                        Ir para Iniciar Sessão
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl text-xs text-slate-600 leading-relaxed">
                      Insira o endereço de e-mail associado à sua conta PrimeWay. Enviaremos um link para criar uma nova senha.
                    </div>

                    <div>
                      <label className="label-corp">E-mail Cadastrado</label>
                      <div className="relative">
                        <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="seu.email@empresa.co.mz"
                          className="input-modern !pl-10 text-sm"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || cooldownSeconds > 0}
                      className="w-full btn-modern-primary !py-3.5 !text-sm flex items-center justify-center gap-2 shadow-md shadow-corp-blue/25 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={17} className="animate-spin" />
                          <span>A enviar link...</span>
                        </>
                      ) : cooldownSeconds > 0 ? (
                        <>
                          <Clock size={16} />
                          <span>Aguarde {cooldownSeconds}s para reenviar</span>
                        </>
                      ) : (
                        <>
                          <KeyRound size={17} />
                          <span>Enviar Link de Recuperação</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 4: RESET PASSWORD (IN-APP WHEN CLICKING EMAIL LINK) */}
            {tab === 'resetPassword' && (
              <div className="space-y-4">
                {isVerifyingResetCode ? (
                  <div className="py-8 text-center space-y-3">
                    <RefreshCw size={28} className="animate-spin text-corp-blue mx-auto" />
                    <p className="text-xs text-slate-600">A verificar a validade do seu link de recuperação...</p>
                  </div>
                ) : isResetCodeValid === false ? (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle size={30} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Link Expirado ou Já Utilizado
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                        Este link de recuperação já não é válido. Se solicitou múltiplos links, lembre-se de abrir sempre a mensagem mais recente enviada para a sua caixa de entrada.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTab('forgot');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="w-full btn-modern-primary !py-3 !text-xs flex items-center justify-center gap-2"
                    >
                      <KeyRound size={16} />
                      <span>Solicitar Novo Link de Recuperação</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmResetSubmit} className="space-y-3.5">
                    {resetAccountEmail && (
                      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-slate-700 flex items-center justify-between">
                        <span>A redefinir senha para:</span>
                        <strong className="text-corp-blue font-bold">{resetAccountEmail}</strong>
                      </div>
                    )}

                    <div>
                      <label className="label-corp">Nova Senha</label>
                      <div className="relative">
                        <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showNewResetPassword ? 'text' : 'password'}
                          required
                          value={newResetPassword}
                          onChange={(e) => setNewResetPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="input-modern !pl-10 !pr-10 text-sm"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewResetPassword(!showNewResetPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {newResetPassword.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Força da senha:</span>
                            <span className="font-bold text-slate-700">{resetStrength.label}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${resetStrength.color} transition-all duration-300 ${resetStrength.width}`} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="label-corp">Confirmar Nova Senha</label>
                      <div className="relative">
                        <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showConfirmResetPassword ? 'text' : 'password'}
                          required
                          value={confirmResetPassword}
                          onChange={(e) => setConfirmResetPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          className={`input-modern !pl-10 !pr-10 text-sm ${
                            confirmResetPassword && confirmResetPassword !== newResetPassword ? 'border-red-300' : ''
                          }`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmResetPassword && (
                        <p className={`text-[11px] mt-1 font-medium ${
                          confirmResetPassword === newResetPassword ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {confirmResetPassword === newResetPassword ? '✓ As senhas coincidem' : '✕ As senhas não coincidem'}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-modern-primary !py-3.5 !text-sm flex items-center justify-center gap-2 shadow-md shadow-corp-blue/25"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={17} className="animate-spin" />
                          <span>A salvar senha...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={17} />
                          <span>Salvar e Atualizar Senha</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Clean Footer Info */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Conexão Criptografada SSL</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenLegalTerms?.('termos')}
                className="hover:text-slate-800 transition-colors"
              >
                Termos
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegalTerms?.('privacidade')}
                className="hover:text-slate-800 transition-colors"
              >
                Privacidade
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
