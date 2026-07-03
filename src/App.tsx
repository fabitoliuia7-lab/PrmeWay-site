import React, { useState, useEffect, useMemo, ErrorInfo, ReactNode } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  Globe, 
  Clock, 
  ShieldCheck,
  Package,
  Ship,
  Plane,
  Menu,
  X,
  LogIn,
  LogOut,
  Save,
  History,
  User,
  ShieldAlert,
  Shield,
  AlertTriangle,
  Search,
  Truck,
  FileText,
  Edit,
  Download,
  Eye,
  PlayCircle,
  Youtube,
  ArrowUp,
  ArrowDown,
  Check,
  Upload,
  ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  Timestamp,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { logoBase64 } from './logoBase64';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Ocorreu um erro inesperado.";
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) message = `Erro no Banco de Dados: ${parsed.error}`;
        }
      } catch {
        message = this.state.error?.message || message;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <X size={40} />
            </div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Ops! Algo deu errado</h2>
            <p className="text-slate-600">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-modern-primary w-full"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Types ---

interface Product {
  id: number;
  descricao: string;
  imageUrl?: string;
  categoriaAerea?: string;
  valorUnitario: number | string;
  taxaEnvioFornecedor: number | string;
  quantidade: number | string;
  quantidadeCaixas?: number | string;
  comprimento: number | string;
  largura: number | string;
  altura: number | string;
  cbmUnitario?: number | string;
  pesoUnitario: number | string;
}

interface CalculationResult {
  subtotalProdutos: number;
  valorTaxaProc: number;
  valorComissao: number;
  taxaLevantamento: number;
  custosEnvio: number;
  valorDespacho: number;
  valorFreteInt: number;
  valorEnvioLocal: number;
  total: number;
  cbmTotal: number;
  pesoTotal: number;
  cbmFaturado: number;
  pesoFaturado: number;
  pesoVolumetrico: number;
  pesoTaxavel: number;
  cobrarPor: 'volume' | 'peso';
  valorDesconto: number;
  totalFinal: number;
  couponCodeApplied?: string;
}

// --- Components ---

const LevelBars = ({ level, shrink }: { level?: string; shrink?: boolean }) => {
  const getLevelConfig = () => {
    switch (level?.toLowerCase()) {
      case 'iniciante': return { active: 1, label: 'Iniciante' };
      case 'intermediário': return { active: 2, label: 'Intermediário' };
      case 'avançado': return { active: 3, label: 'Avançado' };
      default: return { active: 1, label: level || 'Iniciante' };
    }
  };
  const config = getLevelConfig();
  
  if (shrink) {
    return (
      <div className="flex gap-[2px] items-end pb-[1px]" title={config.label}>
        {[1, 2, 3].map((bar) => (
          <div 
            key={bar}
            className={`w-[4px] rounded-t-[1px] transition-all ${bar <= config.active ? 'bg-sky-400' : 'bg-slate-300 opacity-50'} ${bar === 1 ? 'h-1.5' : bar === 2 ? 'h-2.5' : 'h-3.5'}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100/50" title={config.label}>
      <div className="flex gap-[2px] items-end pb-[2px]">
        {[1, 2, 3].map((bar) => (
          <div 
            key={bar}
            className={`w-[5px] rounded-t-[2px] transition-all ${bar <= config.active ? 'bg-corp-blue' : 'bg-blue-200'} ${bar === 1 ? 'h-2' : bar === 2 ? 'h-3' : 'h-4'}`}
          />
        ))}
      </div>
      <span className="text-[10px] font-bold text-corp-blue uppercase tracking-wider">
        {config.label}
      </span>
    </div>
  );
};

const compressAndSetImage = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // compress quality 0.85
        callback(dataUrl);
      } else {
        callback(event.target?.result as string);
      }
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  youtubeId: string;
  description: string;
  course?: string;
  module: string;
  level: string;
}

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'landing' | 'cursos'>('landing');

  const navigateTo = (view: 'landing' | 'cursos', id?: string) => {
    setActiveView(view);
    setIsMenuOpen(false);
    if (view === 'cursos') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id) {
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const isAdmin = user?.email === 'fabitoliuia7@gmail.com';
  
  const [lessons, setLessons] = useState<Lesson[]>([
    { id: '1', title: "Introdução à Importação", duration: "12:45", youtubeId: "iBY6EDSjEF4", description: "Esta é a aula inaugural do nosso curso de importação. Aqui, você aprenderá os passos fundamentais para realizar suas primeiras negociações com fornecedores internacionais, entender os modais de transporte e prever custos ocultos.", course: "Curso Inicial de Importação", module: "Módulo 1", level: "Iniciante" },
    { id: '2', title: "Como Encontrar Fornecedores Confiáveis", duration: "18:20", youtubeId: "jfKfPfyJRdk", description: "Aprenda a pesquisar.", course: "Curso Inicial de Importação", module: "Módulo 1", level: "Iniciante" },
    { id: '3', title: "Cálculo de Custos e Impostos", duration: "24:10", youtubeId: "jfKfPfyJRdk", description: "Entenda os custos.", course: "Curso Inicial de Importação", module: "Módulo 2", level: "Intermediário" },
    { id: '4', title: "Modais de Transporte: Aéreo vs Marítimo", duration: "15:30", youtubeId: "jfKfPfyJRdk", description: "Descubra o melhor formato.", course: "Curso Inicial de Importação", module: "Módulo 2", level: "Intermediário" },
    { id: '5', title: "Documentação de Importação", duration: "20:05", youtubeId: "jfKfPfyJRdk", description: "Papelada necessária.", course: "Curso Especialista", module: "Módulo 3", level: "Avançado" },
    { id: '6', title: "Desembaraço Aduaneiro Simplificado", duration: "19:50", youtubeId: "jfKfPfyJRdk", description: "Aduana de forma simples.", course: "Curso Especialista", module: "Módulo 3", level: "Avançado" }
  ]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [showAdminCourse, setShowAdminCourse] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('completed_lessons');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleLessonCompletion = (lessonId: string) => {
    const updated = completedLessons.includes(lessonId) 
      ? completedLessons.filter(id => id !== lessonId)
      : [...completedLessons, lessonId];
    setCompletedLessons(updated);
    localStorage.setItem('completed_lessons', JSON.stringify(updated));
  };

  const [lessonNotes, setLessonNotes] = useState<{[key: string]: string}>(() => {
    try {
      const saved = localStorage.getItem('lesson_notes');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const saveLessonNote = (lessonId: string, note: string) => {
    const updated = { ...lessonNotes, [lessonId]: note };
    setLessonNotes(updated);
    localStorage.setItem('lesson_notes', JSON.stringify(updated));
  };

  const [courseSearch, setCourseSearch] = useState('');

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [savedDebitNotes, setSavedDebitNotes] = useState<any[]>([]);
  const [historyTab, setHistoryTab] = useState<'quotes' | 'debitNotes'>('quotes');
  const [showHistory, setShowHistory] = useState(false);
  const [showFraudCheck, setShowFraudCheck] = useState(false);
  const [quoteRefCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0'));
  const [fraudData, setFraudData] = useState({
    empresa: '',
    website: '',
    email: '',
    metodoPagamento: 'banco_empresa',
    tempoMercado: 'mais_5',
    alibabaVerified: 'nao_aplica',
    tradeAssurance: 'sim',
    priceComparison: 'normal',
    amostras: 'sim'
  });
  const [fraudResult, setFraudResult] = useState<{ score: number, level: string, messages: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [moeda, setMoeda] = useState('USD');
  const [taxaCambio, setTaxaCambio] = useState<number | string>(64);
  const [nomeCliente, setNomeCliente] = useState('');
  const [taxaProcessamento, setTaxaProcessamento] = useState<number | string>(0);
  const [comissaoServicos, setComissaoServicos] = useState<number | string>(0);
  const [taxaLevantamento, setTaxaLevantamento] = useState<number | string>(0);
  const [tipoTransporte, setTipoTransporte] = useState('maritimo');
  const [taxasAduaneiras, setTaxasAduaneiras] = useState<number | string>(0);
  const [freteInternacional, setFreteInternacional] = useState<number | string>(0);
  const [taxaEnvioLocal, setTaxaEnvioLocal] = useState<number | string>(0);
  const [destinoEntrega, setDestinoEntrega] = useState<string>('nenhum');
  const [taxaEntregaCBM, setTaxaEntregaCBM] = useState<number | string>(1000);
  const [aplicarMargemSeguranca, setAplicarMargemSeguranca] = useState(false);
  const [calcularRevenda, setCalcularRevenda] = useState(false);
  const [margemLucro, setMargemLucro] = useState<number | string>(0);
  const [custosAdicionais, setCustosAdicionais] = useState<number | string>(0);
  
  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; type: 'percentage' | 'fixed'; value: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  // Tracking State
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<null | { status: string, location: string, date: string, history: any[] }>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [showAdminTracking, setShowAdminTracking] = useState(false);
  const [adminTrackingCode, setAdminTrackingCode] = useState('');
  const [adminTrackingStatus, setAdminTrackingStatus] = useState('');
  const [adminTrackingLocation, setAdminTrackingLocation] = useState('');
  const [adminTrackingDate, setAdminTrackingDate] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  // Rodoviario States
  const [destinoRodoviario, setDestinoRodoviario] = useState<string>('');
  const [showDebitNoteModal, setShowDebitNoteModal] = useState(false);
  const [isGeneratingDebit, setIsGeneratingDebit] = useState(false);
  interface DebitItem {
    id: string;
    orderNumber: string;
    cargoDescription: string;
    pkgs: number | string;
    actualAmount: number | string;
    chargeableAmount: number | string;
    unitPrice: number | string;
    unitType: string;
  }

  const [debitNoteForm, setDebitNoteForm] = useState({
    clientInfo: '',
    operatorInfo: '',
    idCode: '',
    origin: 'China', // or South Africa
    shipMode: 'AIR', // AIR or SEA
    priceType: 'FREIGHT_AND_DUTY', // FREIGHT_ONLY, DUTY_ONLY, FREIGHT_AND_DUTY
    paymentType: 'NORMAL', // NORMAL, SEPARATE_PAYMENT, ADVANCE
  });
  const [debitItems, setDebitItems] = useState<DebitItem[]>([
    {
      id: Date.now().toString(),
      orderNumber: '',
      cargoDescription: '',
      pkgs: 1,
      actualAmount: '', // KG or CBM
      chargeableAmount: '', // KG or CBM
      unitPrice: '',
      unitType: 'KG'
    }
  ]);

  const saveTrackingUpdate = async () => {
    if (!adminTrackingCode.trim() || !adminTrackingStatus.trim()) {
      alert("Preencha o código e o status.");
      return;
    }
    setIsSavingTracking(true);
    try {
      const code = adminTrackingCode.trim().toUpperCase();
      const docRef = doc(db, 'tracking', code);
      const docSnap = await getDoc(docRef);
      
      const newHistoryEvent = {
        status: adminTrackingStatus,
        location: adminTrackingLocation,
        date: adminTrackingDate || new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          status: adminTrackingStatus,
          location: adminTrackingLocation,
          date: adminTrackingDate || new Date().toLocaleDateString('pt-BR'),
          history: arrayUnion(newHistoryEvent)
        });
      } else {
        await setDoc(docRef, {
          status: adminTrackingStatus,
          location: adminTrackingLocation,
          date: adminTrackingDate || new Date().toLocaleDateString('pt-BR'),
          history: [newHistoryEvent]
        });
      }
      alert("Rastreamento atualizado com sucesso!");
      setShowAdminTracking(false);
      setAdminTrackingCode('');
      setAdminTrackingLocation('');
      setAdminTrackingStatus('');
    } catch (e: any) {
      console.error(e);
      alert("Erro: " + e.message + " (Pode ser falta de permissões de admin)");
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleTrack = async () => {
    if (!trackingCode.trim()) return;
    setIsTracking(true);
    setTrackingResult(null);
    setTrackingError('');
    
    try {
      const docRef = doc(db, 'tracking', trackingCode.trim().toUpperCase());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTrackingResult({
          status: data.status,
          location: data.location,
          date: data.date,
          history: data.history || []
        });
      } else {
        setTrackingError('Cargo com este código não encontrado.');
      }
    } catch (error) {
      console.error("Erro ao buscar rastreamento:", error);
      setTrackingError('Ocorreu um erro ao buscar o rastreamento.');
    } finally {
      setIsTracking(false);
    }
  };
  
  const [produtos, setProdutos] = useState<Product[]>([
    {
      id: 1,
      descricao: '',
      valorUnitario: 0,
      taxaEnvioFornecedor: 0,
      quantidade: 1,
      quantidadeCaixas: '',
      comprimento: 0,
      largura: 0,
      altura: 0,
      cbmUnitario: '',
      pesoUnitario: 0
    }
  ]);

  // --- Firebase Auth ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    async function loadCourses() {
      try {
        const docRef = doc(db, 'settings', 'courses');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().lessons) {
          setLessons(docSnap.data().lessons);
        }
      } catch(e) {
        console.error("Erro ao carregar cursos:", e);
        handleFirestoreError(e, OperationType.GET, 'settings/courses');
      }
    }
    loadCourses();
  }, []);

  const handleSaveCourses = async (updatedLessons: Lesson[]) => {
    setIsSavingCourse(true);
    try {
      await setDoc(doc(db, 'settings', 'courses'), { lessons: updatedLessons });
      setLessons(updatedLessons);
      setShowAdminCourse(false);
      alert('Cursos salvos com sucesso!');
    } catch(e) {
      console.error(e);
      handleFirestoreError(e, OperationType.WRITE, 'settings/courses');
    } finally {
      setIsSavingCourse(false);
    }
  };

  useEffect(() => {
    if (!user || !isAuthReady) {
      setSavedQuotes([]);
      setSavedDebitNotes([]);
      return;
    }

    const quotesPath = 'quotes';
    const qQuotes = query(
      collection(db, quotesPath),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeQuotes = onSnapshot(qQuotes, (snapshot) => {
      const quotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedQuotes(quotes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, quotesPath);
    });

    const debitPath = 'debitNotes';
    const qDebit = query(
      collection(db, debitPath),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeDebit = onSnapshot(qDebit, (snapshot) => {
      const debits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedDebitNotes(debits);
    }, (error) => {
      console.warn("Debit Notes collection error:", error);
    });

    return () => {
      unsubscribeQuotes();
      unsubscribeDebit();
    };
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const handleSaveQuote = async () => {
    if (!user) {
      handleLogin();
      return;
    }

    setIsSaving(true);
    const path = 'quotes';
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        moeda,
        taxaCambio,
        nomeCliente,
        total: results.total,
        totalFinal: results.totalFinal,
        valorDesconto: results.valorDesconto,
        couponCodeApplied: results.couponCodeApplied || '',
        tipoTransporte,
        taxaProcessamento,
        comissaoServicos,
        taxaLevantamento,
        taxasAduaneiras,
        freteInternacional,
        taxaEnvioLocal,
        aplicarMargemSeguranca,
        calcularRevenda,
        margemLucro,
        custosAdicionais,
        produtos: produtos.map(p => ({
          descricao: p.descricao,
          imageUrl: p.imageUrl || '',
          categoriaAerea: p.categoriaAerea || 'normal',
          valorUnitario: p.valorUnitario,
          quantidade: p.quantidade,
          quantidadeCaixas: p.quantidadeCaixas ?? '',
          taxaEnvioFornecedor: p.taxaEnvioFornecedor,
          comprimento: p.comprimento,
          largura: p.largura,
          altura: p.altura,
          cbmUnitario: p.cbmUnitario || '',
          pesoUnitario: p.pesoUnitario
        })),
        createdAt: Timestamp.now()
      });
      alert("Cotação salva com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Calculations ---

  const [showLegal, setShowLegal] = useState<{ title: string; content: string } | null>(null);

  const legalTerms = {
    termos: {
      title: "Termos de Serviço",
      content: `Estes termos regem o uso dos serviços da PrimeWay Invest & Logística, SU, Lda. 
      1. Âmbito: Atuamos como intermediários logísticos e consultores de importação.
      2. Responsabilidade: A PrimeWay responsabiliza-se pela coordenação do transporte e despacho, conforme a Lei de Proteção de Dados (Lei 3/2017) e o Código Comercial de Moçambique.
      3. Cotações: Os valores gerados no simulador são estimativas baseadas em dados fornecidos pelo cliente e podem variar conforme pesagem final e taxas alfandegárias em vigor (Pauta Aduaneira).
      4. Jurisdição: Qualquer litígio será dirimido nos tribunais da Cidade de Maputo, Moçambique.`
    },
    privacidade: {
      title: "Política de Privacidade",
      content: `A PrimeWay respeita a sua privacidade.
      1. Recolha de Dados: Recolhemos apenas os dados necessários para a execução dos serviços logísticos (NOME, NUIT, CONTACTO).
      2. Proteção: Em conformidade com a Lei 3/2017 de Moçambique, garantimos que os seus dados não serão partilhados com terceiros para fins comerciais.
      3. Direitos: O cliente tem o direito de solicitar a retificação ou eliminação dos seus dados dos nossos sistemas a qualquer momento.`
    },
    compliance: {
      title: "Compliance Aduaneiro",
      content: `A PrimeWay opera em estrita conformidade com as normas da Autoridade Tributária de Moçambique.
      1. Ética: Não facilitamos nem participamos em práticas de subfaturação ou contrabando.
      2. Documentação: Todas as importações devem ser acompanhadas de faturas comerciais autênticas e documentos de transporte válidos.`
    }
  };

  const results = useMemo((): CalculationResult => {
    let subtotalProdutos = 0;
    let cbmTotal = 0;
    let pesoTotal = 0;

    produtos.forEach(p => {
      const qtd = Number(p.quantidade) || 0;
      subtotalProdutos += (Number(p.valorUnitario) || 0) * qtd + (Number(p.taxaEnvioFornecedor) || 0);
      const vols = (p.quantidadeCaixas !== undefined && p.quantidadeCaixas !== '') 
        ? Number(p.quantidadeCaixas) 
        : qtd;
      const cbmUnit = (Number(p.cbmUnitario) || 0) > 0 
        ? Number(p.cbmUnitario) 
        : (Number(p.comprimento) || 0) * (Number(p.largura) || 0) * (Number(p.altura) || 0) / 1000000;
      cbmTotal += cbmUnit * vols * (aplicarMargemSeguranca ? 1.2 : 1);
      pesoTotal += (Number(p.pesoUnitario) || 0) * qtd;
    });

    const valorTaxaProc = subtotalProdutos * (Number(taxaProcessamento) / 100);
    const valorComissao = subtotalProdutos * (Number(comissaoServicos) / 100);
    
    let cbmFaturado = cbmTotal > 0 ? Math.max(0.1, cbmTotal) : 0;
    if (tipoTransporte === 'maritimo' && pesoTotal > 0) {
      cbmFaturado = Math.max(cbmFaturado, pesoTotal / 1000);
    }
    const pesoFaturado = pesoTotal > 0 ? Math.max(0.5, pesoTotal) : 0;
    
    let pesoVolumetrico = 0;
    if (tipoTransporte === 'maritimo') {
      pesoVolumetrico = cbmTotal * 1000;
    } else if (tipoTransporte === 'aereo') {
      pesoVolumetrico = cbmTotal * 166.67;
    } else if (tipoTransporte === 'rodoviario') {
      pesoVolumetrico = cbmTotal * 333.33;
    }
    
    let pesoTaxavel = pesoTotal > 0 || cbmTotal > 0 ? Math.max(pesoTotal, pesoVolumetrico) : 0;
    let cobrarPor: 'peso' | 'volume' = pesoVolumetrico > pesoTotal ? 'volume' : 'peso';
    
    let custosEnvio = 0;
    let valorDespacho = 0;
    let valorFreteInt = 0;
    
    let valorEnvioLocal = Number(taxaEnvioLocal) || 0;
    if (destinoEntrega !== 'nenhum' && destinoEntrega !== 'manual') {
      const calculatedFee = cbmFaturado * (Number(taxaEntregaCBM) || 1000);
      valorEnvioLocal = Math.max(200, calculatedFee);
      
      if (destinoEntrega === 'maputo_cidade') {
        valorEnvioLocal = 0;
      }
    }
    
    if (tipoTransporte === 'rodoviario') {
      let tarifaBase = 0;
      switch (destinoRodoviario) {
        case 'xai_xai': tarifaBase = 3.00; break;
        case 'maxixe_inhambane': tarifaBase = 5.50; break;
        case 'beira': tarifaBase = 12.00; break;
        case 'tete': tarifaBase = 16.00; break;
        case 'nampula': tarifaBase = 22.00; break;
        case 'maputo': tarifaBase = 0; break; // Maybe flat base or 0, depending on needs. But let's say 0 for now as 'base'.
        default: tarifaBase = 0;
      }
      
      valorFreteInt = pesoTaxavel * tarifaBase;
      custosEnvio = valorFreteInt + valorEnvioLocal; // Assume despacho is separated or included in others
    } else if (tipoTransporte === 'aereo') {
      let totalWeightWeightBased = 0;
      let totalCostWeightBased = 0;
      let totalCostUnitBased = 0;
      let totalWeightTotal = 0;

      produtos.forEach(p => {
        const qtd = Number(p.quantidade) || 0;
        const pesoKg = Number(p.pesoUnitario) || 0;
        const physicalWeightLine = pesoKg * qtd;

        // Calcular volume e peso volumetrico para esta linha de produto
        const vols = (p.quantidadeCaixas !== undefined && p.quantidadeCaixas !== '') 
          ? Number(p.quantidadeCaixas) 
          : qtd;
        const cbmUnit = (Number(p.cbmUnitario) || 0) > 0 
          ? Number(p.cbmUnitario) 
          : (Number(p.comprimento) || 0) * (Number(p.largura) || 0) * (Number(p.altura) || 0) / 1000000;
        const cbmLine = cbmUnit * vols * (aplicarMargemSeguranca ? 1.2 : 1);
        const volumetricWeightLine = cbmLine * 166.67;

        // O peso taxável desta linha de produto é o maior entre peso real e volumétrico
        const taxableWeightLine = Math.max(physicalWeightLine, volumetricWeightLine);
        totalWeightTotal += taxableWeightLine;

        if (p.categoriaAerea === 'normal' || p.categoriaAerea === 'sensitive') {
          const rate = p.categoriaAerea === 'normal' ? 1600 : 2000;
          totalWeightWeightBased += taxableWeightLine;
          totalCostWeightBased += taxableWeightLine * rate;
        } else {
          let unitPrice = 0;
          switch (p.categoriaAerea) {
            case 'watch_battery':
              unitPrice = 500;
              break;
            case 'mobile':
              unitPrice = 5000;
              break;
            case 'laptop':
              unitPrice = 6500;
              break;
            default:
              unitPrice = 0;
          }
          totalCostUnitBased += unitPrice * qtd;
        }
      });

      // Apply 0.5kg minimum rule
      // If total weight is less than 0.5kg, adjust weight-based cost to 0.5kg minimum
      if (totalWeightTotal > 0 && totalWeightTotal < 0.5) {
        if (totalWeightWeightBased > 0) {
          // Scale weight-based cost to a 0.5kg shipment equivalent
          totalCostWeightBased = (totalCostWeightBased / totalWeightWeightBased) * 0.5;
        }
      }

      let custoAereoTotalMT = totalCostWeightBased + totalCostUnitBased;
      
      // Ensure absolute minimum charge of 800 MT (0.5kg normal goods) for any shipment with weight
      if (totalWeightTotal > 0 && totalWeightTotal < 0.5 && custoAereoTotalMT < 800) {
        custoAereoTotalMT = 800;
      }
      
      const convertedCost = moeda === 'USD' || moeda === 'EUR' ? (custoAereoTotalMT / (Number(taxaCambio) || 1)) : custoAereoTotalMT;
      valorFreteInt = convertedCost; // Note: For Air, this encapsulates both freight and duty logically
      custosEnvio = convertedCost + valorEnvioLocal;
    } else {
      const baseCalculoEnvio = cbmFaturado;
      valorDespacho = baseCalculoEnvio * Number(taxasAduaneiras);
      valorFreteInt = baseCalculoEnvio * Number(freteInternacional);
      custosEnvio = valorDespacho + valorFreteInt + valorEnvioLocal;
    }

    let total = subtotalProdutos + valorTaxaProc + valorComissao + Number(taxaLevantamento) + custosEnvio;

    if (calcularRevenda) {
      total = (total + Number(custosAdicionais)) * (1 + (Number(margemLucro) / 100));
    }

    let valorDesconto = 0;
    if (activeCoupon) {
      if (activeCoupon.type === 'percentage') {
        valorDesconto = total * (activeCoupon.value / 100);
      } else if (activeCoupon.type === 'fixed') {
        valorDesconto = activeCoupon.value;
      }
    }
    const totalFinal = Math.max(0, total - valorDesconto);

    return {
      subtotalProdutos,
      valorTaxaProc,
      valorComissao,
      taxaLevantamento: Number(taxaLevantamento),
      custosEnvio,
      valorDespacho,
      valorFreteInt,
      valorEnvioLocal,
      total,
      cbmTotal,
      pesoTotal,
      cbmFaturado,
      pesoFaturado,
      pesoVolumetrico,
      pesoTaxavel,
      cobrarPor,
      valorDesconto,
      totalFinal,
      couponCodeApplied: activeCoupon?.code
    };
  }, [produtos, taxaProcessamento, comissaoServicos, taxaLevantamento, tipoTransporte, taxasAduaneiras, freteInternacional, taxaEnvioLocal, calcularRevenda, margemLucro, custosAdicionais, moeda, taxaCambio, aplicarMargemSeguranca, destinoEntrega, taxaEntregaCBM, destinoRodoviario, activeCoupon]);

  // --- Handlers ---

  const adicionarProduto = () => {
    setProdutos(prev => [
      ...prev,
      {
        id: Date.now(),
        descricao: '',
        categoriaAerea: 'normal',
        valorUnitario: 0,
        taxaEnvioFornecedor: 0,
        quantidade: 1,
        quantidadeCaixas: '',
        comprimento: 0,
        largura: 0,
        altura: 0,
        cbmUnitario: '',
        pesoUnitario: 0
      }
    ]);
  };

  const removerProduto = (id: number) => {
    if (produtos.length === 1) return;
    setProdutos(prev => prev.filter(p => p.id !== id));
  };

  const atualizarProduto = (id: number, field: keyof Product, value: string | number) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponMessage({ text: 'Por favor, digite um código de cupom.', isError: true });
      return;
    }

    const coupons: Record<string, { type: 'percentage' | 'fixed'; value: number }> = {
      'PRIME10': { type: 'percentage', value: 10 },
      'PRIME15': { type: 'percentage', value: 15 },
      'PRIME20': { type: 'percentage', value: 20 },
      'BEMVINDO': { type: 'percentage', value: 5 },
      'LOGISTICA5': { type: 'percentage', value: 5 },
      'VIP25': { type: 'percentage', value: 25 },
      'DESCONTO1000': { type: 'fixed', value: 1000 }
    };

    if (coupons[code]) {
      setActiveCoupon({
        code,
        ...coupons[code]
      });
      setCouponMessage({ text: `Cupom ${code} aplicado com sucesso!`, isError: false });
    } else {
      setCouponMessage({ text: 'Cupom inválido ou expirado.', isError: true });
    }
  };

  const handleRemoveCoupon = () => {
    setActiveCoupon(null);
    setCouponInput('');
    setCouponMessage(null);
  };

  const limparTudo = () => {
    if (window.confirm("Resetar todos os dados da cotação atual?")) {
      setProdutos([{
        id: Date.now(),
        descricao: '',
        imageUrl: '',
        categoriaAerea: 'normal',
        valorUnitario: 0,
        taxaEnvioFornecedor: 0,
        quantidade: 1,
        quantidadeCaixas: '',
        comprimento: 0,
        largura: 0,
        altura: 0,
        cbmUnitario: '',
        pesoUnitario: 0
      }]);
      setNomeCliente('');
      setTaxaProcessamento(0);
      setComissaoServicos(0);
      setTaxaLevantamento(0);
      setTaxasAduaneiras(0);
      setFreteInternacional(0);
      setTaxaEnvioLocal(0);
      setAplicarMargemSeguranca(false);
      setCalcularRevenda(false);
      setMargemLucro(0);
      setCustosAdicionais(0);
      setActiveCoupon(null);
      setCouponInput('');
      setCouponMessage(null);
    }
  };

  const verificarFornecedor = () => {
    let score = 0;
    let messages: string[] = [];

    const emailLower = fraudData.email.toLowerCase();
    if (emailLower.includes('@gmail.com') || emailLower.includes('@yahoo.') || emailLower.includes('@hotmail.')) {
      score += 30;
      messages.push("Uso de email gratuito (Gmail/Yahoo) para negócios B2B é altamente suspeito.");
    } else if (emailLower && fraudData.website && !fraudData.website.includes(emailLower.split('@')[1])) {
       score += 10;
       messages.push("O domínio do email não corresponde ao domínio do website.");
    }

    if (['western_union', 'cripto', 'banco_pessoal'].includes(fraudData.metodoPagamento)) {
      score += 50;
      messages.push("Método de pagamento não rastreável ou pessoal. Risco crítico de fraude.");
    }

    if (fraudData.website && !fraudData.website.startsWith('https://')) {
      score += 15;
      messages.push("Website não possui certificado de segurança (HTTPS).");
    }

    if (fraudData.tempoMercado === 'menos_1') {
      score += 20;
      messages.push("Empresa com menos de 1 ano de mercado. Exija documentação adicional.");
    }

    if (fraudData.alibabaVerified === 'nao') {
      score += 15;
      messages.push("Fornecedor não possui selo de 'Verified Supplier' (Fornecedor Verificado) na plataforma.");
    }

    if (fraudData.tradeAssurance === 'nao') {
      score += 40;
      messages.push("Recusa em usar Trade Assurance (Garantia de Pagamento da plataforma). Risco altíssimo de golpe.");
    }

    if (fraudData.priceComparison === 'muito_baixo') {
      score += 20;
      messages.push("Preço excessivamente abaixo do mercado ('Bom demais para ser verdade'). Cuidado com fraudes ou má qualidade.");
    }

    if (fraudData.amostras === 'nao') {
      score += 25;
      messages.push("Fornecedor recusa o envio de amostras. Forte indício de empresa fantasma ou produto inexistente.");
    }

    let level = 'Baixo Risco';
    if (score >= 60) level = 'Alto Risco';
    else if (score >= 25) level = 'Risco Moderado';

    const displayScore = Math.min(score, 100);

    setFraudResult({ score: displayScore, level, messages });
  };

  const limparVerificacao = () => {
    setFraudData({
      empresa: '',
      website: '',
      email: '',
      metodoPagamento: 'banco_empresa',
      tempoMercado: 'mais_5',
      alibabaVerified: 'nao_aplica',
      tradeAssurance: 'sim',
      priceComparison: 'normal',
      amostras: 'sim'
    });
    setFraudResult(null);
  };

  const preencherDebitNoteComCotacao = () => {
    let shipMode = 'AIR';
    if (tipoTransporte === 'maritimo') {
      shipMode = 'SEA';
    } else if (tipoTransporte === 'rodoviario') {
      shipMode = 'SEA';
    }

    let defaultPrice = '';
    if (shipMode === 'SEA') {
      defaultPrice = freteInternacional ? String(freteInternacional) : '21450';
    } else {
      defaultPrice = '1600';
    }

    const items: DebitItem[] = produtos.map((p, idx) => {
      const qtd = Number(p.quantidade) || 0;
      const vols = (p.quantidadeCaixas !== undefined && p.quantidadeCaixas !== '') 
        ? Number(p.quantidadeCaixas) 
        : qtd;
      const cbmUnit = (Number(p.cbmUnitario) || 0) > 0 
        ? Number(p.cbmUnitario) 
        : (Number(p.comprimento) || 0) * (Number(p.largura) || 0) * (Number(p.altura) || 0) / 1000000;
      
      const cbmItem = cbmUnit * vols * (aplicarMargemSeguranca ? 1.2 : 1);
      const pesoItem = (Number(p.pesoUnitario) || 0) * qtd;

      let actualAmount = '';
      let chargeableAmount = '';

      if (shipMode === 'SEA') {
        actualAmount = cbmItem > 0 ? cbmItem.toFixed(4) : '0';
        chargeableAmount = cbmItem > 0 || pesoItem > 0 ? Math.max(cbmItem, pesoItem / 1000).toFixed(4) : '0';
      } else {
        actualAmount = pesoItem > 0 ? pesoItem.toFixed(2) : '0';
        const volumetricWeight = cbmItem * 166.67;
        chargeableAmount = pesoItem > 0 || cbmItem > 0 ? Math.max(pesoItem, volumetricWeight).toFixed(2) : '0';
      }

      return {
        id: (Date.now() + idx).toString(),
        orderNumber: `PEDIDO-${idx + 1}`,
        cargoDescription: p.descricao || 'Mercadoria Geral',
        pkgs: vols,
        actualAmount,
        chargeableAmount,
        unitPrice: defaultPrice,
        unitType: shipMode === 'AIR' ? 'KG' : 'CBM'
      };
    });

    setDebitNoteForm({
      clientInfo: nomeCliente || '',
      operatorInfo: user?.displayName || 'PrimeWay Operator',
      idCode: `PW-${quoteRefCode}`,
      origin: 'China',
      shipMode: shipMode as 'AIR' | 'SEA',
      priceType: 'FREIGHT_AND_DUTY',
      paymentType: 'NORMAL',
    });

    setDebitItems(items);
    setShowDebitNoteModal(true);
  };

  const gerarDebitNotePDF = async () => {
    const element = document.getElementById('debit-note-print-area');
    if (!element) {
      alert("Erro interno: A área de impressão não foi encontrada.");
      return;
    }

    try {
      setIsGeneratingDebit(true);

      // Save to Firebase (History)
      if (user) {
        try {
          await addDoc(collection(db, 'debitNotes'), {
            userId: user.uid,
            ...debitNoteForm,
            items: debitItems,
            totalMZN: debitItems.reduce((acc, item) => acc + ((parseFloat(String(item.chargeableAmount)) || 0) * (parseFloat(String(item.unitPrice)) || 0)), 0),
            createdAt: Timestamp.now()
          });
        } catch (saveError) {
          console.error("Error saving debit note to history:", saveError);
          handleFirestoreError(saveError, OperationType.CREATE, 'debitNotes');
        }
      }

      element.classList.remove('hidden', 'pointer-events-none');
      element.style.display = 'block';

      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toJpeg(element, { quality: 0.98, backgroundColor: '#ffffff', pixelRatio: 2 });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: 'a5'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

      let position = 0;
      let heightLeft = pdfHeight;

      pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Debit_Note_${debitNoteForm.idCode || 'Nova'}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar a nota de débito.");
    } finally {
      element.classList.add('hidden', 'pointer-events-none');
      element.style.display = '';
      setIsGeneratingDebit(false);
    }
  };

  const imprimirFatura = async () => {
    const element = document.getElementById('invoice-print-area');
    if (!element) {
      alert("Erro interno: A área de impressão não foi encontrada.");
      return;
    }

    try {
      setIsGeneratingPdf(true);
      // Temporarily remove hidden and pointer-events-none
      element.classList.remove('hidden', 'pointer-events-none');
      element.style.display = 'block';

      // Let the DOM update before rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toJpeg(element, { quality: 0.98, backgroundColor: '#ffffff', pixelRatio: 2 });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

      let position = 0;
      let heightLeft = pdfHeight;

      pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const clientNameFormatted = nomeCliente ? nomeCliente.trim().replace(/\s+/g, '_') : Date.now();
      pdf.save(`Fatura_Proforma_PrimeWay_${clientNameFormatted}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar a fatura. Por favor, tente novamente.");
    } finally {
      // Restore hidden class
      element.classList.add('hidden', 'pointer-events-none');
      element.style.display = '';
      setIsGeneratingPdf(false);
    }
  };

  const formatoMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* WhatsApp Button */}
      <a 
        href="https://wa.me/258842914655?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20PrimeWay!" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-8 right-8 bg-[#25D366] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-50 hover:scale-110 transition-transform no-print"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.004-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
      </a>

      {/* Topbar */}
      <div className="bg-corp-blue text-white py-2 px-6 hidden md:block no-print text-[10px] font-medium tracking-widest uppercase">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><Phone size={12} className="text-corp-orange" /> +258 84 291 4655</span>
            <span className="flex items-center gap-1.5"><Mail size={12} className="text-corp-orange" /> primewayinvestelogistica@gmail.com</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-corp-orange" /> Maputo, Moçambique</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 py-5 px-6 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => navigateTo('landing', 'inicio')} className="flex items-center gap-4 focus:outline-none">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663028416962/glYQVTOtGErYGBoj.jpg" 
              alt="PrimeWay Logo" 
              className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-105 hover:opacity-90 cursor-pointer"
              referrerPolicy="no-referrer"
            />
          </button>
          
          <div className="hidden md:flex items-center gap-10">
            {['Início', 'A Empresa', 'Serviços', 'Cursos', 'Rastreio'].map((item) => {
              const targetId = item.toLowerCase().replace(' ', '-');
              const isCursosTab = item === 'Cursos';
              const isActive = (activeView === 'cursos' && isCursosTab) || (activeView === 'landing' && !isCursosTab && window.location.hash === `#${targetId}`);
              return (
                <button 
                  key={item} 
                  onClick={() => navigateTo(isCursosTab ? 'cursos' : 'landing', targetId)}
                  className={`text-xs font-semibold uppercase tracking-widest transition-colors focus:outline-none ${
                    isActive ? 'text-corp-orange font-bold scale-102' : 'text-slate-600 hover:text-corp-blue'
                  }`}
                >
                  {item}
                </button>
              );
            })}
            
            {isAuthReady && (
              user ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-slate-600 hover:text-corp-blue transition-colors relative"
                    title="Histórico de Cotações"
                  >
                    <History size={20} />
                    {savedQuotes.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-corp-orange text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">
                        {savedQuotes.length}
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                    <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-slate-200" />
                    <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 text-xs font-bold text-corp-blue uppercase tracking-widest hover:text-corp-blue-light transition-colors"
                >
                  <LogIn size={18} /> Entrar
                </button>
              )
            )}

            <button 
              onClick={() => navigateTo('landing', 'simulador')}
              className="btn-modern-primary !py-3 !px-6 !text-[11px]"
            >
              Cotação Online
            </button>
          </div>

          <button className="md:hidden text-corp-blue" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-white border-b border-gray-200 p-6 flex flex-col gap-4 md:hidden shadow-xl"
            >
              {['Início', 'A Empresa', 'Serviços', 'Cursos', 'Rastreio'].map((item) => {
                const targetId = item.toLowerCase().replace(' ', '-');
                const isCursosTab = item === 'Cursos';
                const isActive = (activeView === 'cursos' && isCursosTab) || (activeView === 'landing' && !isCursosTab && window.location.hash === `#${targetId}`);
                return (
                  <button 
                    key={item} 
                    onClick={() => navigateTo(isCursosTab ? 'cursos' : 'landing', targetId)}
                    className={`text-left text-sm font-semibold uppercase tracking-widest ${
                      isActive ? 'text-corp-orange font-bold' : 'text-corp-blue hover:text-corp-blue-light'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}

              {isAuthReady && (
                user ? (
                  <div className="flex flex-col gap-4 py-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-full border border-slate-200" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{user.displayName}</span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowHistory(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-sm font-semibold text-slate-600 uppercase tracking-widest"
                    >
                      <History size={20} /> Histórico
                    </button>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-sm font-semibold text-red-500 uppercase tracking-widest"
                    >
                      <LogOut size={20} /> Sair
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      handleLogin();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-sm font-bold text-corp-blue uppercase tracking-widest py-4 border-t border-slate-100"
                  >
                    <LogIn size={20} /> Entrar com Google
                  </button>
                )
              )}

              <button 
                onClick={() => navigateTo('landing', 'simulador')}
                className="bg-corp-accent text-white text-sm font-semibold px-6 py-4 uppercase tracking-widest text-center rounded-sm w-full"
              >
                Cotação Online
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {activeView === 'landing' ? (
        <>
          {/* Hero Section */}
          <header id="inicio" className="relative bg-slate-900 text-white min-h-[60vh] md:min-h-[80vh] flex items-center px-6 overflow-hidden no-print">
        <div className="absolute inset-0">
          <motion.video 
            autoPlay 
            loop 
            muted 
            playsInline
            poster="https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1.2 }}
            transition={{ duration: 30, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            className="w-full h-full object-cover opacity-40"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-cargo-ship-sailing-in-the-ocean-40043-large.mp4" type="video/mp4" />
          </motion.video>
          <motion.div 
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"
          ></motion.div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-8"
          >
            <h2 className="font-heading font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.9] uppercase tracking-tighter">
              Excelência em <br /><span className="text-corp-blue-light">cada importação.</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="#simulador" className="btn-modern-primary">
                Simular Cotação <ChevronRight size={20} />
              </a>
              <a href="#serviços" className="btn-modern-outline !bg-transparent !text-white !border-white/20 hover:!bg-white/10">
                Nossos Serviços
              </a>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white py-10 md:py-16 no-print relative z-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {[
            { label: 'Transparência', value: '100%', icon: <ShieldCheck className="text-corp-blue" /> },
            { label: 'Rota Especializada', value: 'China > MZ', icon: <Globe className="text-corp-blue" /> },
            { label: 'Soluções Completas', value: 'Turn-key', icon: <Package className="text-corp-blue" /> },
            { label: 'Acompanhamento', value: '24/7', icon: <Clock className="text-corp-blue" /> }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div>
                <h4 className="font-heading font-bold text-2xl text-slate-900">{stat.value}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section id="a-empresa" className="py-12 md:py-20 px-6 bg-slate-50 no-print">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-4xl md:text-6xl text-slate-900 leading-[0.9] uppercase tracking-tighter">
              A Nossa Identidade.
            </h2>
            <div className="space-y-4 text-slate-600 leading-relaxed text-base md:text-lg">
              <p>
                A <strong className="text-corp-blue">PRIMEWAY INVEST & LOGÍSTICA</strong> é o seu parceiro estratégico. Garantimos que a sua mercadoria chegue ao destino com segurança, rapidez e transparência.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Transparência', desc: 'Processos claros.', icon: <ShieldCheck size={20} /> },
              { title: 'Confiança', desc: 'Compromisso com prazos.', icon: <Clock size={20} /> },
              { title: 'Inovação', desc: 'Tecnologia aplicada.', icon: <CheckCircle2 size={20} /> },
              { title: 'Presença', desc: 'Conexão global.', icon: <Globe size={20} /> }
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bento-item !p-6"
              >
                <div className="text-corp-blue mb-4">{item.icon}</div>
                <h4 className="font-heading font-semibold text-slate-900 mb-2 uppercase text-[10px] tracking-widest">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="serviços" className="py-12 md:py-20 px-6 bg-white no-print">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-heading font-bold text-4xl md:text-5xl text-slate-900 uppercase tracking-tighter">Soluções Logísticas</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Modelo Assistida */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bento-item !p-8 border-t-4 border-corp-blue-light"
            >
              <div className="text-corp-blue mb-6">
                <Package size={40} strokeWidth={1} />
              </div>
              <h3 className="font-heading font-bold text-2xl text-slate-900 mb-6 uppercase tracking-tight">Importação Assistida</h3>
              <ul className="space-y-4 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.3em]">
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-corp-blue-light rounded-full"></span> Recepção China</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-corp-blue-light rounded-full"></span> Consolidação</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-corp-blue-light rounded-full"></span> Frete Mar/Ar</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-corp-blue-light rounded-full"></span> Despacho</li>
              </ul>
            </motion.div>

            {/* Modelo Completa */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bento-item !p-8 !bg-slate-900 !text-white border-t-4 border-corp-blue"
            >
              <div className="text-corp-blue-light mb-6">
                <Ship size={40} strokeWidth={1} />
              </div>
              <h3 className="font-heading font-bold text-2xl text-white mb-6 uppercase tracking-tight">Importação Completa</h3>
              <ul className="space-y-4 text-[10px] text-slate-400 font-semibold uppercase tracking-[0.3em]">
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-corp-blue rounded-full"></span> Busca & Negoc.</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-corp-blue rounded-full"></span> Pagamento Int.</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-corp-blue rounded-full"></span> Embalamento</li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-corp-blue rounded-full"></span> Logística E2E</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Cursos section moved to dedicated Classroom view */}

      {/* Rastreio Section */}
      <section id="rastreio" className="py-12 md:py-20 px-6 bg-slate-50 no-print">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 relative">
            {isAdmin && (
              <div className="mb-6 flex flex-col sm:flex-row justify-center gap-3">
                <button 
                  onClick={() => setShowAdminTracking(true)}
                  className="text-sm font-bold text-corp-blue hover:text-corp-blue-light transition-colors border border-corp-blue/30 px-4 py-2 rounded-lg flex items-center justify-center gap-2 bg-blue-50/50"
                >
                  <Shield size={16} /> Admin Rastreios
                </button>
                <button 
                  onClick={preencherDebitNoteComCotacao}
                  className="text-sm font-bold text-corp-blue hover:text-corp-blue-light transition-colors border border-corp-blue/30 px-4 py-2 rounded-lg flex items-center justify-center gap-2 bg-blue-50/50"
                >
                  <Search size={16} /> Emitir Fatura (Debit)
                </button>
              </div>
            )}
            <h2 className="font-heading font-bold text-3xl md:text-5xl text-slate-900 uppercase tracking-tighter">Rastreamento</h2>
            <p className="text-slate-500 mt-4 text-sm font-semibold uppercase tracking-widest">Acompanhe o status da sua carga</p>
          </div>
          <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <input 
                type="text" 
                placeholder="Insira o código de rastreamento (Ex: PW-0001)" 
                className="input-modern !py-4 flex-1 text-sm font-semibold"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
              />
              <button 
                onClick={handleTrack}
                disabled={isTracking || !trackingCode.trim()}
                className="btn-modern-primary !py-4 px-8 whitespace-nowrap disabled:opacity-50"
              >
                {isTracking ? (
                  <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Buscando...</span>
                ) : (
                  <span className="flex items-center gap-2"><Search size={20} /> Rastrear</span>
                )}
              </button>
            </div>

            {trackingError && (
              <p className="text-red-500 font-semibold mt-4 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{trackingError}</p>
            )}

            {trackingResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 border-t border-slate-100 pt-8"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Status Atual</h4>
                    <p className="font-heading font-bold text-xl text-corp-blue flex items-center gap-2">
                      <Truck className="text-corp-blue-light" size={24} /> {trackingResult.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Atualizado em</h4>
                    <p className="font-bold text-slate-900">{trackingResult.date}</p>
                  </div>
                </div>

                <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {trackingResult.history.map((event: any, index: number) => (
                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-corp-blue text-white absolute left-[-24px] shadow shrink-0"></div>
                      
                      <div className="w-[100%] md:w-[calc(100%-4rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                          <span className="font-bold text-slate-900 text-sm">{event.status}</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-sm uppercase tracking-widest whitespace-nowrap">{event.date} às {event.time}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                          <MapPin size={12} /> {event.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <main id="simulador" className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-8 no-print">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-heading font-bold text-3xl md:text-5xl text-slate-900 uppercase tracking-tighter">Simulador Inteligente</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Parameters */}
            <section className="bento-item !p-6 md:!p-8">
              <h3 className="font-heading font-semibold text-xs text-corp-blue mb-6 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-corp-blue/5 flex items-center justify-center text-[10px]">01</span>
                Parâmetros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2">
                  <label className="label-corp">Nome do Cliente / Empresa</label>
                  <input 
                    type="text" 
                    value={nomeCliente} 
                    onChange={(e) => setNomeCliente(e.target.value)}
                    className="input-modern font-semibold !py-2.5 !px-3 text-sm"
                    placeholder="Exmo Sr.(a)..."
                  />
                </div>
                <div>
                  <label className="label-corp">Moeda</label>
                  <select 
                    value={moeda} 
                    onChange={(e) => setMoeda(e.target.value)}
                    className="input-modern font-semibold !py-2.5 !px-3 text-xs"
                  >
                    <option value="USD">USD</option>
                    <option value="MZN">MZN</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                {(moeda === 'USD' || moeda === 'EUR') && (
                  <div>
                    <label className="label-corp">Taxa {moeda}/MZN</label>
                    <input 
                      type="number" step="any"
                      value={taxaCambio || ''} 
                      onChange={(e) => setTaxaCambio(e.target.value)}
                      className="input-modern font-semibold !py-2.5 !px-3 text-xs" 
                    />
                  </div>
                )}
                <div>
                  <label className="label-corp">Taxa Proc. %</label>
                  <input 
                    type="number" step="any"
                    value={taxaProcessamento || ''} 
                    onChange={(e) => setTaxaProcessamento(e.target.value)}
                    className="input-modern !py-2.5 !px-3 text-xs" 
                  />
                </div>
                <div>
                  <label className="label-corp">Comissão %</label>
                  <input 
                    type="number" step="any"
                    value={comissaoServicos || ''} 
                    onChange={(e) => setComissaoServicos(e.target.value)}
                    className="input-modern !py-2.5 !px-3 text-xs" 
                  />
                </div>
                <div>
                  <label className="label-corp">Armazém</label>
                  <input 
                    type="number" step="any"
                    value={taxaLevantamento || ''} 
                    onChange={(e) => setTaxaLevantamento(e.target.value)}
                    className="input-modern !py-2.5 !px-3 text-xs" 
                  />
                </div>
              </div>
            </section>

            {/* 2. Products */}
            <section className="bento-item !p-6 md:!p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-semibold text-xs text-corp-blue uppercase tracking-[0.3em] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-corp-blue/5 flex items-center justify-center text-[10px]">02</span>
                  Mercadorias
                </h3>
              </div>
              
              <div className="space-y-6">
                {produtos.map((p, index) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 md:p-6 border border-slate-100 bg-slate-50/50 rounded-xl relative group"
                  >
                    <button 
                      onClick={() => removerProduto(p.id)} 
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-4 md:gap-3 mb-6">
                      <div className="col-span-2 md:col-span-4">
                        <label className="label-corp">Descrição</label>
                        <input 
                          type="text" 
                          value={p.descricao} 
                          onChange={(e) => atualizarProduto(p.id, 'descricao', e.target.value)}
                          className="input-modern !py-2.5 !px-3 text-xs" 
                          placeholder="Ex: Peças" 
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="label-corp">Valor</label>
                        <input 
                          type="number" step="any"
                          value={p.valorUnitario || ''} 
                          onChange={(e) => atualizarProduto(p.id, 'valorUnitario', e.target.value)}
                          className="input-modern !py-2.5 !px-3 text-xs" 
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="label-corp">Qtd.</label>
                        <input 
                          type="number" step="any"
                          value={p.quantidade} 
                          onChange={(e) => atualizarProduto(p.id, 'quantidade', e.target.value)}
                          className="input-modern !py-2.5 !px-3 text-xs" 
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="label-corp">Frete F.</label>
                        <input 
                          type="number" step="any"
                          value={p.taxaEnvioFornecedor || ''} 
                          onChange={(e) => atualizarProduto(p.id, 'taxaEnvioFornecedor', e.target.value)}
                          className="input-modern !py-2.5 !px-3 text-xs" 
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="label-corp">Peso</label>
                        <input 
                          type="number" step="any"
                          value={p.pesoUnitario || ''} 
                          onChange={(e) => atualizarProduto(p.id, 'pesoUnitario', e.target.value)}
                          className="input-modern !py-2.5 !px-3 text-xs" 
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4">
                      {tipoTransporte === 'aereo' && (
                        <div className="mb-4">
                          <label className="label-corp !text-corp-blue-light mb-2">Categoria Aérea</label>
                          <select 
                            value={p.categoriaAerea || 'normal'}
                            onChange={(e) => atualizarProduto(p.id, 'categoriaAerea', e.target.value)}
                            className="input-modern !bg-slate-50 !py-2.5 !px-3 text-xs w-full"
                          >
                            <option value="normal">Normal Goods (Roupas, Sapatos, Acessórios) - 1600 MT/KG</option>
                            <option value="sensitive">Sensitive Goods (Líquidos, Suplementos, Baterias) - 2000 MT/KG</option>
                            <option value="watch_battery">Watch/Battery {"(<0.3KG)"} - 500 MT/UNIT</option>
                            <option value="mobile">Mobile Phone - 5000 MT/UNIT</option>
                            <option value="laptop">Laptop/Drone/Camera - 6500 MT/UNIT</option>
                          </select>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        <label className="label-corp !text-corp-blue-light !mb-0 flex items-center justify-between">
                          <span>Imagem do Produto</span>
                          {p.imageUrl && (
                            <button
                              type="button"
                              onClick={() => atualizarProduto(p.id, 'imageUrl', '')}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase"
                            >
                              Remover Imagem
                            </button>
                          )}
                        </label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                          {/* File Upload Zone */}
                          <div className="relative group border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-3 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50/20 transition-all cursor-pointer h-[110px]">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    atualizarProduto(p.id, 'imageUrl', base64);
                                  });
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {p.imageUrl && p.imageUrl.startsWith('data:') ? (
                              <div className="flex items-center gap-2">
                                <img src={p.imageUrl} alt="Preview" className="w-14 h-14 object-cover rounded-lg shadow-sm border border-slate-200" referrerPolicy="no-referrer" />
                                <div className="text-left">
                                  <p className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Carregado
                                  </p>
                                  <p className="text-[9px] text-slate-400">Clique para substituir</p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="inline-block p-1.5 bg-white text-slate-400 group-hover:text-blue-500 rounded-lg shadow-sm mb-1 border border-slate-100">
                                  <Upload size={14} />
                                </span>
                                <p className="text-[10px] font-bold text-slate-500">Subir do Aparelho</p>
                                <p className="text-[8px] text-slate-400 leading-tight">Imagem ou foto de câmara</p>
                              </div>
                            )}
                          </div>

                          {/* Link upload option */}
                          <div className="flex flex-col justify-center border border-slate-200 rounded-xl p-3 bg-slate-50/50 h-[110px]">
                            {p.imageUrl && !p.imageUrl.startsWith('data:') ? (
                              <div className="flex items-center gap-2">
                                <img src={p.imageUrl} alt="Preview" className="w-14 h-14 object-cover rounded-lg shadow-sm border border-slate-200" referrerPolicy="no-referrer" />
                                <div className="text-left flex-1 min-w-0">
                                  <p className="text-[10px] font-bold text-blue-600 uppercase">Link da Web</p>
                                  <p className="text-[9px] text-slate-400 truncate leading-tight">{p.imageUrl}</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = prompt("Cole o link da nova imagem:", p.imageUrl);
                                      if (url !== null) atualizarProduto(p.id, 'imageUrl', url);
                                    }}
                                    className="text-[9px] font-bold text-corp-blue hover:underline uppercase block mt-1"
                                  >
                                    Alterar Link
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  <Globe size={11} /> Link da Internet (URL):
                                </span>
                                <input 
                                  type="url" 
                                  value={p.imageUrl && !p.imageUrl.startsWith('data:') ? p.imageUrl : ''} 
                                  onChange={(e) => atualizarProduto(p.id, 'imageUrl', e.target.value)}
                                  className="input-modern !bg-white !py-1.5 !px-2 text-[10px] w-full border border-slate-200" 
                                  placeholder="https://exemplo.com/foto.jpg" 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(tipoTransporte === 'maritimo' || tipoTransporte === 'aereo' || tipoTransporte === 'rodoviario') && (
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <label className="label-corp !text-corp-blue-light !mb-0 shrink-0">Dimensões & Vol</label>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 flex-1">
                            <div className="relative col-span-3 sm:col-span-1" title="Quantidade de pacotes/caixas. Se vazio, usa a Quantidade de Itens.">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400 uppercase pointer-events-none">VOLS</span>
                              <input 
                                type="number" step="any"
                                value={p.quantidadeCaixas !== undefined ? p.quantidadeCaixas : ''} 
                                onChange={(e) => atualizarProduto(p.id, 'quantidadeCaixas', e.target.value)}
                                className="input-modern !bg-slate-50 !py-2.5 !pl-11 !pr-2 text-xs font-semibold w-full" 
                                placeholder={String(p.quantidade || 1)}
                              />
                            </div>
                            <div className="relative col-span-1 sm:col-span-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-300 uppercase pointer-events-none">C</span>
                              <input 
                                type="number" step="any"
                                value={p.comprimento || ''} 
                                onChange={(e) => {
                                  atualizarProduto(p.id, 'comprimento', e.target.value);
                                  atualizarProduto(p.id, 'cbmUnitario', '');
                                }}
                                className="input-modern !bg-slate-50 !py-2.5 !pl-6 !pr-1 text-xs w-full" 
                                placeholder="0"
                              />
                            </div>
                            <div className="relative col-span-1 sm:col-span-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-300 uppercase pointer-events-none">L</span>
                              <input 
                                type="number" step="any"
                                value={p.largura || ''} 
                                onChange={(e) => {
                                  atualizarProduto(p.id, 'largura', e.target.value);
                                  atualizarProduto(p.id, 'cbmUnitario', '');
                                }}
                                className="input-modern !bg-slate-50 !py-2.5 !pl-6 !pr-1 text-xs w-full" 
                                placeholder="0"
                              />
                            </div>
                            <div className="relative col-span-1 sm:col-span-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-300 uppercase pointer-events-none">A</span>
                              <input 
                                type="number" step="any"
                                value={p.altura || ''} 
                                onChange={(e) => {
                                  atualizarProduto(p.id, 'altura', e.target.value);
                                  atualizarProduto(p.id, 'cbmUnitario', '');
                                }}
                                className="input-modern !bg-slate-50 !py-2.5 !pl-6 !pr-1 text-xs w-full" 
                                placeholder="0"
                              />
                            </div>
                            <div className="relative col-span-3 sm:col-span-1">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-blue-500 uppercase pointer-events-none">CBM</span>
                              <input 
                                type="number" step="any"
                                value={p.cbmUnitario || ''} 
                                onChange={(e) => {
                                  atualizarProduto(p.id, 'cbmUnitario', e.target.value);
                                  atualizarProduto(p.id, 'comprimento', '');
                                  atualizarProduto(p.id, 'largura', '');
                                  atualizarProduto(p.id, 'altura', '');
                                }}
                                className="input-modern !bg-blue-50/50 border-blue-200 !py-2.5 !pl-11 !pr-2 text-xs font-bold text-blue-700 placeholder:text-blue-300 w-full" 
                                placeholder="Unid."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={adicionarProduto} 
                  className="w-full md:w-auto justify-center text-corp-blue bg-corp-blue/5 border border-corp-blue/10 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-corp-blue hover:text-white transition-all rounded-xl flex items-center gap-2"
                >
                  <Plus size={16} /> Adicionar Item
                </button>
              </div>
            </section>

            {/* 3. Logistics */}
            <section className="bento-item !p-6 md:!p-8">
              <h3 className="font-heading font-semibold text-xs text-corp-blue mb-6 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-corp-blue/5 flex items-center justify-center text-[10px]">03</span>
                Aduaneiro
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div>
                  <label className="label-corp">Modal</label>
                  <select 
                    value={tipoTransporte} 
                    onChange={(e) => setTipoTransporte(e.target.value)}
                    className="input-modern font-semibold !py-2.5 !px-3 text-xs"
                  >
                    <option value="maritimo">Marítimo</option>
                    <option value="aereo">Aéreo</option>
                    <option value="rodoviario">Rodoviário</option>
                  </select>
                </div>
                {tipoTransporte === 'rodoviario' && (
                  <div className="col-span-2 md:col-span-3">
                    <label className="label-corp">Destino (Moçambique)</label>
                    <select 
                      value={destinoRodoviario} 
                      onChange={(e) => setDestinoRodoviario(e.target.value)}
                      className="input-modern font-semibold !py-2.5 !px-3 text-xs"
                    >
                      <option value="">-- Selecione o destino --</option>
                      <option value="maputo">Maputo/Matola (Base)</option>
                      <option value="xai_xai">Xai-Xai (~200km) - 3.00 MZN/kg</option>
                      <option value="maxixe_inhambane">Maxixe/Inhambane (~450km) - 5.50 MZN/kg</option>
                      <option value="beira">Beira (~1200km) - 12.00 MZN/kg</option>
                      <option value="tete">Tete (~1500km) - 16.00 MZN/kg</option>
                      <option value="nampula">Nampula (~2000km) - 22.00 MZN/kg</option>
                    </select>
                  </div>
                )}
                {tipoTransporte === 'maritimo' && (
                  <>
                    <div>
                      <label className="label-corp">Despacho</label>
                      <input 
                        type="number" step="any"
                        value={taxasAduaneiras || ''} 
                        onChange={(e) => setTaxasAduaneiras(e.target.value)}
                        className="input-modern !py-2.5 !px-3 text-xs" 
                      />
                    </div>
                    <div>
                      <label className="label-corp">Frete Int.</label>
                      <input 
                        type="number" step="any"
                        value={freteInternacional || ''} 
                        onChange={(e) => setFreteInternacional(e.target.value)}
                        className="input-modern !py-2.5 !px-3 text-xs" 
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="label-corp">Inland</label>
                  <input 
                    type="number" step="any"
                    value={destinoEntrega !== 'nenhum' && destinoEntrega !== 'manual' ? results.valorEnvioLocal : (taxaEnvioLocal || '')} 
                    onChange={(e) => setTaxaEnvioLocal(e.target.value)}
                    disabled={destinoEntrega !== 'nenhum' && destinoEntrega !== 'manual'}
                    className="input-modern !py-2.5 !px-3 text-xs disabled:opacity-50 disabled:bg-slate-50" 
                  />
                  {destinoEntrega !== 'nenhum' && destinoEntrega !== 'manual' && (
                    <span className="text-[10px] text-corp-blue font-semibold mt-1 block">Valor Calculado Automaticamente</span>
                  )}
                </div>
              </div>
            </section>
            
            {/* Delivery Section */}
            <section className="glass-card p-6">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Truck size={14} className="text-corp-blue" />
                Entrega Nacional (Opcional)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="label-corp">Província de Destino</label>
                  <select 
                    value={destinoEntrega}
                    onChange={(e) => setDestinoEntrega(e.target.value)}
                    className="input-modern font-semibold !py-2.5 !px-3 text-xs w-full"
                  >
                    <option value="nenhum">Nenhuma / Sem Entrega</option>
                    <option value="manual">Definir Manualmente</option>
                    <option value="maputo_cidade">Maputo Cidade e Matola</option>
                    <option value="maputo_prov">Maputo Província</option>
                    <option value="gaza">Gaza</option>
                    <option value="inhambane">Inhambane</option>
                    <option value="sofala">Sofala</option>
                    <option value="manica">Manica</option>
                    <option value="tete">Tete</option>
                    <option value="zambezia">Zambézia</option>
                    <option value="nampula">Nampula</option>
                    <option value="cabo_delgado">Cabo Delgado</option>
                    <option value="niassa">Niassa</option>
                  </select>
                </div>
                
                {destinoEntrega !== 'nenhum' && destinoEntrega !== 'manual' && destinoEntrega !== 'maputo_cidade' && (
                  <div>
                    <label className="label-corp">Taxa Base / CBM (MZN)</label>
                    <input 
                      type="number" step="any"
                      value={taxaEntregaCBM || ''} 
                      onChange={(e) => setTaxaEntregaCBM(e.target.value)}
                      className="input-modern !py-2.5 !px-3 text-xs w-full" 
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">Abaixo de 0.1 CBM, taxa mínima de 200 MZN.</span>
                  </div>
                )}
                
                {destinoEntrega === 'maputo_cidade' && (
                   <div className="flex items-center text-[10px] text-corp-blue font-semibold col-span-1 md:col-span-1">
                     <span className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                       <Check size={14} /> Isento de taxa volumétrica adicional
                     </span>
                   </div>
                )}
              </div>
            </section>
          </div>

          {/* Results Column */}
          <div id="calculation-results" className="space-y-6">
            <div className="glass-card !bg-corp-blue !border-none p-8 text-white rounded-2xl sticky top-24">
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/50 mb-6 block">Resultado</span>
              
              <div className="space-y-8">
                <div>
                  <span className="block text-xs text-white/40 mb-2 uppercase tracking-widest font-semibold">Investimento Total</span>
                  {results.valorDesconto > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white/40 line-through text-sm">
                        <span>{moeda} {formatoMoeda(results.total)}</span>
                      </div>
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="text-xl font-semibold text-emerald-400">{moeda}</span>
                        <span className="text-4xl md:text-6xl font-heading font-bold tracking-tighter text-emerald-400 break-all">
                          {formatoMoeda(results.totalFinal)}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase mt-1">
                        Cupom aplicado: {activeCoupon?.code} (-{activeCoupon?.type === 'percentage' ? `${activeCoupon.value}%` : `${moeda} ${activeCoupon.value}`})
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-xl font-semibold text-corp-blue-light">{moeda}</span>
                      <span className="text-4xl md:text-6xl font-heading font-bold tracking-tighter break-all">
                        {formatoMoeda(results.total)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest">
                    <span className="text-white/40">Volume Faturado</span>
                    <span className="text-corp-blue-light">{results.cbmFaturado.toFixed(3)} m³</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest">
                    <span className="text-white/40">Peso Faturado</span>
                    <span className="text-corp-blue-light">{results.pesoFaturado.toFixed(1)} kg</span>
                  </div>
                </div>

                {/* Coupon Application Panel */}
                <div className="pt-6 border-t border-white/10 space-y-3">
                  <span className="block text-xs text-white/40 uppercase tracking-widest font-semibold mb-1">Cupom de Desconto</span>
                  {activeCoupon ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <Check size={12} /> {activeCoupon.code} Ativo
                        </p>
                        <p className="text-[10px] text-white/60">
                          Desconto de {activeCoupon.type === 'percentage' ? `${activeCoupon.value}%` : `${moeda} ${formatoMoeda(activeCoupon.value)}`}
                        </p>
                      </div>
                      <button 
                        onClick={handleRemoveCoupon}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider pl-2"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            if (couponMessage) setCouponMessage(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 uppercase"
                          placeholder="Digite o cupom (Ex: PRIME10)"
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          className="bg-white text-corp-blue font-bold px-3 py-2 rounded-xl text-xs hover:bg-slate-100 transition-all uppercase tracking-wider shrink-0"
                        >
                          Aplicar
                        </button>
                      </div>
                      {couponMessage && (
                        <p className={`text-[10px] font-semibold ${couponMessage.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                          {couponMessage.text}
                        </p>
                      )}
                      
                      {/* Suggestions list */}
                      <div className="pt-1.5">
                        <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider mb-1">Cupons Disponíveis:</p>
                        <div className="flex flex-wrap gap-1">
                          {['PRIME10', 'BEMVINDO', 'PRIME15'].map(suggestedCode => (
                            <button
                              key={suggestedCode}
                              onClick={() => {
                                setCouponInput(suggestedCode);
                                if (couponMessage) setCouponMessage(null);
                              }}
                              className="text-[8px] font-bold px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-white/70 hover:text-white transition-all uppercase"
                            >
                              {suggestedCode}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-6 space-y-3">
                  <button 
                    onClick={handleSaveQuote}
                    disabled={isSaving}
                    className="w-full btn-modern-primary !bg-corp-orange !text-white !shadow-none hover:!bg-corp-orange/90 disabled:opacity-50 !py-3"
                  >
                    {isSaving ? <RotateCcw size={18} className="animate-spin" /> : <Save size={18} />} 
                    Salvar
                  </button>
                  <button 
                    onClick={imprimirFatura} 
                    disabled={isGeneratingPdf}
                    className="w-full btn-modern-primary !bg-white !text-corp-blue !shadow-none hover:!bg-slate-100 !py-3 disabled:opacity-50"
                  >
                    {isGeneratingPdf ? (
                      <RotateCcw size={18} className="animate-spin" />
                    ) : (
                      <Printer size={18} />
                    )} 
                    {isGeneratingPdf ? 'Gerando...' : 'Exportar PDF'}
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={preencherDebitNoteComCotacao}
                      className="w-full btn-modern-primary !bg-corp-blue/10 !text-white border border-white/20 !shadow-none hover:!bg-corp-blue/20 !py-3 flex items-center justify-center gap-2"
                    >
                      <FileText size={18} /> Emitir Fatura (Debit)
                    </button>
                  )}
                  <button 
                    onClick={limparTudo} 
                    className="w-full text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-white transition-all text-center py-2 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={12} /> Resetar
                  </button>
                </div>
              </div>
            </div>

            {/* Resale Simulation */}
            <section className="bento-item !p-8">
              <div className="flex items-center gap-4 mb-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="aplicarMargemSeguranca" 
                    checked={aplicarMargemSeguranca} 
                    onChange={(e) => setAplicarMargemSeguranca(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-corp-blue"></div>
                </label>
                <label htmlFor="aplicarMargemSeguranca" className="font-semibold text-[10px] text-slate-900 uppercase tracking-widest cursor-pointer select-none">Aplicar Margem de Segurança CBM (+20%)</label>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="calcularRevenda" 
                    checked={calcularRevenda} 
                    onChange={(e) => setCalcularRevenda(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-corp-blue"></div>
                </label>
                <label htmlFor="calcularRevenda" className="font-semibold text-[10px] text-slate-900 uppercase tracking-widest cursor-pointer select-none">Simulação de Revenda</label>
              </div>
              
              <AnimatePresence>
                {calcularRevenda && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-8 pt-8 border-t border-slate-100">
                      <div>
                        <label className="label-corp">Margem de Lucro (%)</label>
                        <input 
                          type="number" step="any"
                          value={margemLucro || ''} 
                          onChange={(e) => setMargemLucro(e.target.value)}
                          className="input-modern" 
                          placeholder="0" 
                        />
                      </div>
                      <div>
                        <label className="label-corp">Custos Extras Locais ({moeda})</label>
                        <input 
                          type="number" step="any"
                          value={custosAdicionais || ''} 
                          onChange={(e) => setCustosAdicionais(e.target.value)}
                          className="input-modern" 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
      </main>
        </>
      ) : (
        <main className="flex-grow bg-slate-50 py-12 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Classroom Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-[#1A284F] to-slate-900 rounded-3xl p-6 md:p-12 text-white mb-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px] pointer-events-none" />
              <div className="relative z-10 space-y-3 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="bg-corp-orange text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Academia PrimeWay</span>
                  <span className="bg-white/10 text-slate-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Portal do Aluno</span>
                </div>
                <h1 className="text-2xl md:text-5xl font-black tracking-tight leading-none text-white font-heading">
                  IMPORTAÇÃO DA CHINA E ÁFRICA DO SUL
                </h1>
                <p className="text-slate-300 text-xs md:text-base pr-4 leading-relaxed font-semibold">
                  Aprenda a importar com segurança e otimizar os seus embarques aduaneiros em Moçambique.
                </p>
                
                {/* Statistics Tracker */}
                <div className="pt-4 flex flex-wrap gap-6 items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Progresso Concluído</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-corp-orange h-full rounded-full transition-all duration-500"
                          style={{ width: `${lessons.length > 0 ? (completedLessons.length / lessons.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold font-mono text-white">
                        {completedLessons.length}/{lessons.length} ({lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col w-full md:w-auto sm:flex-row gap-3 md:self-end">
                {isAdmin && (
                  <button 
                    onClick={() => setShowAdminCourse(true)}
                    className="text-xs font-bold w-full md:w-auto text-corp-orange hover:bg-corp-orange hover:text-white transition-all border border-corp-orange/40 px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 bg-black/30"
                  >
                    <Edit size={14} /> Organizar Cursos
                  </button>
                )}
                <button 
                  onClick={() => navigateTo('landing', 'inicio')}
                  className="text-xs font-bold w-full md:w-auto text-slate-950 hover:bg-slate-200 transition-all px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 bg-white shadow-lg"
                >
                  <X size={14} /> Voltar ao Início
                </button>
              </div>
            </div>

            {/* Course Playlist & Video Main Interface */}
            {lessons.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                
                {/* Video Player & Notes Column */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  <div className="bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden aspect-video shadow-2xl relative border-4 border-[#1A284F]/10">
                    {lessons[activeLessonIndex]?.youtubeId ? (
                      <iframe 
                        key={lessons[activeLessonIndex]?.youtubeId}
                        className="w-full h-full absolute top-0 left-0"
                        src={`https://www.youtube.com/embed/${lessons[activeLessonIndex].youtubeId}`} 
                        title="Aula Player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerPolicy="strict-origin-when-cross-origin" 
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                        <Youtube size={48} className="text-slate-600 block" />
                        <span>Vídeo não disponível para esta lição</span>
                      </div>
                    )}
                  </div>

                  {/* Lesson title and resources details */}
                  <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm space-y-5 md:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 md:pb-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-[10px] font-bold text-[#1A284F] uppercase tracking-wider bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                            {lessons[activeLessonIndex]?.course || 'Curso Geral'}
                          </span>
                          <span className="text-[10px] font-bold text-corp-orange uppercase tracking-wider bg-orange-100/50 px-2.5 py-1 rounded-md">
                            {lessons[activeLessonIndex]?.module}
                          </span>
                          <LevelBars level={lessons[activeLessonIndex]?.level} />
                          <span className="text-xs font-mono font-medium text-slate-400">
                            Duração: {lessons[activeLessonIndex]?.duration}
                          </span>
                        </div>
                        <h3 className="text-xl md:text-3xl font-black text-[#1A284F] tracking-tight pt-1 leading-tight">
                          {lessons[activeLessonIndex]?.title}
                        </h3>
                      </div>

                      <button 
                        onClick={() => toggleLessonCompletion(lessons[activeLessonIndex].id)}
                        className={`px-4 py-2.5 md:px-5 md:py-3 rounded-xl w-full sm:w-auto text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${
                          completedLessons.includes(lessons[activeLessonIndex].id)
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/60'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <ShieldCheck size={16} className={completedLessons.includes(lessons[activeLessonIndex].id) ? 'text-emerald-500' : 'text-slate-400'} />
                        {completedLessons.includes(lessons[activeLessonIndex].id) ? 'Aula Concluída' : 'Marcar como Assistido'}
                      </button>
                    </div>

                    <div className="space-y-2.5 md:space-y-4">
                      <h4 className="font-bold text-[#1A284F] text-xs md:text-sm uppercase tracking-widest">Resumo do Conteúdo</h4>
                      <p className="text-slate-600 leading-relaxed text-xs md:text-sm line-clamp-3 md:line-clamp-none">
                        {lessons[activeLessonIndex]?.description || 'Esta aula aborda estratégias essenciais de posicionamento, busca de fornecedores homologados e documentação de comércio marítimo relevante para Moçambique.'}
                      </p>
                    </div>

                    {/* Rich Interactive Notes Section */}
                    <div className="bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-2xl space-y-3 md:space-y-4 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-[#1A284F] text-[10px] md:text-sm uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                          <Edit size={14} className="text-corp-orange" /> Minhas Anotações
                        </h4>
                        <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 font-mono">
                          Salvo no Navegador
                        </span>
                      </div>
                      
                      <textarea
                        value={lessonNotes[lessons[activeLessonIndex]?.id || ''] || ''}
                        onChange={(e) => saveLessonNote(lessons[activeLessonIndex].id, e.target.value)}
                        placeholder="Escreva aqui suas observações sobre esta lição..."
                        className="w-full h-20 md:h-32 p-3 md:p-4 bg-white border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-corp-blue text-slate-700 placeholder-slate-400 resize-none font-medium leading-relaxed custom-scrollbar"
                      />
                    </div>
                  </div>
                </div>

                {/* Playlist Sidebar */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-bold text-lg text-[#1A284F] flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-corp-orange" /> Conteúdo Teórico e Prático
                      </h4>

                      {/* Course Lesson Search bar */}
                      <div className="relative">
                        <input 
                          type="text" 
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          placeholder="Pesquisar aulas..."
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-corp-blue text-slate-700"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                      {(() => {
                        const filteredLessons = lessons.filter(l => 
                          l.title.toLowerCase().includes(courseSearch.toLowerCase()) || 
                          l.description.toLowerCase().includes(courseSearch.toLowerCase()) ||
                          (l.course || '').toLowerCase().includes(courseSearch.toLowerCase())
                        );

                        const groupedCourses = filteredLessons.reduce((acc, curr) => {
                          const course = curr.course || 'Curso Geral';
                          if (!acc[course]) acc[course] = {};
                          const module = curr.module || 'Módulo 1';
                          if (!acc[course][module]) acc[course][module] = [];
                          acc[course][module].push(curr);
                          return acc;
                        }, {} as Record<string, Record<string, typeof lessons>>);

                        return Object.entries(groupedCourses).map(([courseName, modules], courseIdx) => (
                          <div key={courseName} className="mb-6 last:mb-0">
                            <h4 className="text-xs font-black text-[#1A284F] uppercase tracking-widest pl-1 mb-3 border-b border-slate-100 pb-2">{courseName}</h4>
                            
                            <div className="space-y-4">
                              {Object.entries(modules).map(([moduleName, moduleLessons], modIdx) => (
                                <div key={moduleName} className="space-y-2">
                                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">{moduleName}</h5>
                                  <div className="space-y-1.5 pl-2 border-l-2 border-slate-100">
                                    {moduleLessons.map((aula) => {
                                      const realIndex = lessons.findIndex(l => l.id === aula.id);
                                      const isActive = realIndex === activeLessonIndex;
                                      const isCompleted = completedLessons.includes(aula.id);
                                      
                                      return (
                                        <div 
                                          key={aula.id} 
                                          onClick={() => {
                                            setActiveLessonIndex(realIndex);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden group border ${
                                            isActive 
                                              ? 'bg-[#1A284F] text-white border-[#1A284F] shadow-md scale-[1.01]' 
                                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-[#1A284F]/30'
                                          }`}
                                        >
                                          {/* Left status badge indicator */}
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleLessonCompletion(aula.id);
                                            }}
                                            className="focus:outline-none shrink-0"
                                          >
                                            {isCompleted ? (
                                              <ShieldCheck className="w-5 h-5 text-emerald-500 hover:scale-110 transition-transform" />
                                            ) : (
                                              <div className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${isActive ? 'border-sky-300' : 'border-slate-300'}`} />
                                            )}
                                          </button>

                                          <div className="min-w-0 flex-grow">
                                            <span className={`flex items-center gap-2 text-[8px] font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-sky-300' : 'text-slate-400'}`}>
                                              <span>Aula {realIndex + 1}</span>
                                              <LevelBars level={aula.level} shrink={true} />
                                            </span>
                                            <h5 className="font-bold text-xs truncate leading-tight pr-4">
                                              {aula.title}
                                            </h5>
                                          </div>
                                          
                                          <span className={`text-[10px] font-mono font-medium shrink-0 ${isActive ? 'text-sky-200' : 'text-slate-400'}`}>
                                            {aula.duration}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Mozambique custom laws resources helper widget */}
                  <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-corp-orange/10 rounded-full blur-xl pointer-events-none" />
                    <h5 className="font-bold text-sm uppercase tracking-widest text-corp-orange">Links Recomendados</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ferramentas governamentais essenciais para aduanas e desembaraços em Moçambique:
                    </p>
                    <ul className="space-y-2 text-xs">
                      <li>
                        <a 
                          href="https://www.at.gov.mz/por/Alfandeagas/Pauta-Aduaneira" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:underline text-corp-blue-light font-bold flex items-center gap-1.5"
                        >
                          Pauta Aduaneira Maputo (AT)
                        </a>
                      </li>
                      <li>
                        <a 
                          href="https://www.at.gov.mz/" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:underline text-corp-blue-light font-bold flex items-center gap-1.5"
                        >
                          Autoridade Tributária de Moçambique
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-xl mx-auto space-y-4">
                <PlayCircle className="w-12 h-12 text-slate-300 mx-auto" strokeWidth={1} />
                <h4 className="font-bold text-slate-800 text-lg">Nenhuma aula cadastrada</h4>
                <p className="text-sm text-slate-500">
                  Volte mais tarde ou faça login como administrador para adicionar aulas.
                </p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Admin Courses Modal */}
      <AnimatePresence>
        {showAdminCourse && isAdmin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-start sm:items-center justify-center p-0 sm:p-4"
          >
            <div className="bg-white sm:rounded-2xl w-full h-full sm:h-auto max-w-4xl sm:max-h-[90vh] flex flex-col relative overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-corp-blue/10 flex items-center justify-center text-corp-blue shrink-0">
                    <Edit size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#1A284F]">Organizar Cursos</h3>
                    <p className="text-xs sm:text-sm text-slate-500">Adicione, edite ou remova aulas</p>
                  </div>
                </div>
                <button onClick={() => setShowAdminCourse(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 custom-scrollbar">
                <div className="space-y-6">
                  {lessons.map((lesson, idx) => (
                    <div key={lesson.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 relative shadow-sm">
                       <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10 bg-white/80 backdrop-blur-sm p-1 rounded-lg">
                         <button 
                           onClick={() => {
                             if (idx === 0) return;
                             const newLessons = [...lessons];
                             const temp = newLessons[idx - 1];
                             newLessons[idx - 1] = newLessons[idx];
                             newLessons[idx] = temp;
                             setLessons(newLessons);
                           }}
                           disabled={idx === 0}
                           className="text-slate-400 hover:text-corp-blue bg-slate-50 hover:bg-blue-50 p-1.5 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                           title="Mover para cima"
                         >
                           <ArrowUp size={16} />
                         </button>
                         <button 
                           onClick={() => {
                             if (idx === lessons.length - 1) return;
                             const newLessons = [...lessons];
                             const temp = newLessons[idx + 1];
                             newLessons[idx + 1] = newLessons[idx];
                             newLessons[idx] = temp;
                             setLessons(newLessons);
                           }}
                           disabled={idx === lessons.length - 1}
                           className="text-slate-400 hover:text-corp-blue bg-slate-50 hover:bg-blue-50 p-1.5 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                           title="Mover para baixo"
                         >
                           <ArrowDown size={16} />
                         </button>
                         <button 
                           onClick={() => {
                             const newLessons = lessons.filter((_, i) => i !== idx);
                             setLessons(newLessons);
                           }}
                           className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors ml-1"
                           title="Remover aula"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>

                       <div className="pt-8 sm:pt-0">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                           <div>
                              <label className="text-xs font-semibold text-slate-500 mb-1 block">Título da Aula</label>
                              <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-corp-blue/20"
                                value={lesson.title}
                                onChange={(e) => {
                                  const newLessons = [...lessons];
                                  newLessons[idx] = { ...newLessons[idx], title: e.target.value };
                                  setLessons(newLessons);
                                }}
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Duração (Ex: 12:45)</label>
                                <input
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-corp-blue/20"
                                  value={lesson.duration}
                                  onChange={(e) => {
                                    const newLessons = [...lessons];
                                    newLessons[idx] = { ...newLessons[idx], duration: e.target.value };
                                    setLessons(newLessons);
                                  }}
                                />
                             </div>
                             <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Youtube ID</label>
                                <input
                                  placeholder="ex: iBY6EDSjEF4"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-corp-blue/20"
                                  value={lesson.youtubeId}
                                  onChange={(e) => {
                                    const newLessons = [...lessons];
                                    newLessons[idx] = { ...newLessons[idx], youtubeId: e.target.value };
                                    setLessons(newLessons);
                                  }}
                                />
                             </div>
                           </div>
                           <div className="md:col-span-2">
                              <label className="text-xs font-semibold text-slate-500 mb-1 block">Descrição</label>
                              <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-corp-blue/20 custom-scrollbar"
                                rows={2}
                                value={lesson.description}
                                onChange={(e) => {
                                  const newLessons = [...lessons];
                                  newLessons[idx] = { ...newLessons[idx], description: e.target.value };
                                  setLessons(newLessons);
                                }}
                              />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                             <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Curso</label>
                                <input
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-corp-blue/20"
                                  value={lesson.course || ""}
                                  placeholder="Ex: Curso Inicial de Importação"
                                  onChange={(e) => {
                                    const newLessons = [...lessons];
                                    newLessons[idx] = { ...newLessons[idx], course: e.target.value };
                                    setLessons(newLessons);
                                  }}
                                />
                             </div>
                             <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Módulo</label>
                                <input
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                  value={lesson.module}
                                  onChange={(e) => {
                                    const newLessons = [...lessons];
                                    newLessons[idx] = { ...newLessons[idx], module: e.target.value };
                                    setLessons(newLessons);
                                  }}
                                />
                             </div>
                             <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Nível</label>
                                <select
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-corp-blue/20"
                                  value={lesson.level}
                                  onChange={(e) => {
                                    const newLessons = [...lessons];
                                    newLessons[idx] = { ...newLessons[idx], level: e.target.value };
                                    setLessons(newLessons);
                                  }}
                                >
                                  <option value="Iniciante">Iniciante</option>
                                  <option value="Intermediário">Intermediário</option>
                                  <option value="Avançado">Avançado</option>
                                </select>
                             </div>
                           </div>
                         </div>
                       </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                       setLessons([...lessons, {
                         id: Math.random().toString(36).substr(2, 9),
                         title: "Nova Aula",
                         duration: "00:00",
                         youtubeId: "",
                         description: "",
                         course: "Curso Inicial de Importação",
                         module: "Módulo 1",
                         level: "Iniciante"
                       }]);
                    }}
                    className="w-full border-2 border-dashed border-slate-300 rounded-xl p-4 text-center text-slate-500 font-semibold hover:border-corp-blue hover:text-corp-blue hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Adicionar Nova Aula
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                <button
                  onClick={() => setShowAdminCourse(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveCourses(lessons)}
                  disabled={isSavingCourse}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-corp-blue text-white font-semibold hover:bg-[#1A284F] transition-colors text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-70 order-1 sm:order-2"
                >
                  {isSavingCourse ? <PlayCircle className="animate-spin w-4 h-4" /> : <Save size={16} />}
                  {"Salvar Cursos"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-12 pb-8 md:pt-20 md:pb-10 border-t border-white/5 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="mb-10">
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663028416962/glYQVTOtGErYGBoj.jpg" 
                alt="PrimeWay Logo Dark" 
                className="h-16 w-auto object-contain transition-transform duration-300 hover:scale-105 hover:opacity-90 cursor-pointer"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-4 text-sm text-slate-400">
              <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-corp-blue-light" /> NUIT: 402119357</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-heading font-bold mb-10 uppercase text-[10px] tracking-[0.4em] text-white/30">Sede Global</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-4">
                <MapPin size={20} className="text-corp-blue-light shrink-0 mt-1" /> 
                <span className="leading-relaxed">Bairro Matola A, Quarteirão 17, Casa Nº 38, Cidade da Matola, Maputo - Moçambique</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-bold mb-10 uppercase text-[10px] tracking-[0.4em] text-white/30">Contactos</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer">
                <Phone size={20} className="text-corp-blue-light" /> +258 84 291 4655
              </li>
              <li className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer">
                <Phone size={20} className="text-corp-blue-light" /> +258 82 692 1467
              </li>
              <li className="pt-6">
                <a href="mailto:primewayinvestelogistica@gmail.com" className="text-corp-blue-light hover:text-white transition-all flex items-center gap-3">
                  <Mail size={18} /> primewayinvestelogistica@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold mb-10 uppercase text-[10px] tracking-[0.4em] text-white/30">Legal & Ferramentas</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><button onClick={() => setShowLegal(legalTerms.termos)} className="hover:text-white transition-colors text-left">Termos de Serviço</button></li>
              <li><button onClick={() => setShowLegal(legalTerms.privacidade)} className="hover:text-white transition-colors text-left">Política de Privacidade</button></li>
              <li><button onClick={() => setShowLegal(legalTerms.compliance)} className="hover:text-white transition-colors text-left">Compliance Aduaneiro</button></li>
              <li>
                <a 
                  href="https://www.at.gov.mz/por/Alfandeagas/Pauta-Aduaneira" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors text-left flex items-center gap-2"
                >
                  Pauta Aduaneira (AT)
                </a>
              </li>
              <li>
                <button 
                  onClick={() => setShowFraudCheck(true)}
                  className="hover:text-white transition-colors text-left flex items-center gap-2 text-corp-orange"
                >
                  Verificação de Fornecedores
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 md:mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-white/20 uppercase tracking-[0.4em] font-bold">
          <p>&copy; 2024 PrimeWay Invest & Logística, SU, Lda. Todos os direitos reservados.</p>
          <p className="mt-6 md:mt-0">Global Logistics Infrastructure.</p>
        </div>
      </footer>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm no-print"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-10 max-w-4xl w-full shadow-2xl relative max-h-[80vh] flex flex-col"
            >
              <button 
                onClick={() => setShowHistory(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-corp-blue transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="font-heading font-bold text-3xl text-slate-900 uppercase tracking-tighter mb-4 flex items-center gap-4">
                <History className="text-corp-blue" /> Histórico
              </h3>

              <div className="flex border-b border-slate-100 mb-6">
                <button 
                  onClick={() => setHistoryTab('quotes')}
                  className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${historyTab === 'quotes' ? 'border-corp-blue text-corp-blue' : 'border-transparent text-slate-400'}`}
                >
                  Cotações
                </button>
                <button 
                  onClick={() => setHistoryTab('debitNotes')}
                  className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${historyTab === 'debitNotes' ? 'border-corp-blue text-corp-blue' : 'border-transparent text-slate-400'}`}
                >
                  Facturas (Debit)
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {historyTab === 'quotes' ? (
                  savedQuotes.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                      <Package size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Nenhuma cotação salva encontrada.</p>
                    </div>
                  ) : (
                    savedQuotes.map((quote) => (
                      <div 
                        key={quote.id} 
                        onClick={() => {
                          setNomeCliente(quote.nomeCliente || '');
                          setTaxaCambio(quote.taxaCambio || 64);
                          setMoeda(quote.moeda);
                          setTipoTransporte(quote.tipoTransporte);
                          setTaxaProcessamento(quote.taxaProcessamento || 0);
                          setComissaoServicos(quote.comissaoServicos || 0);
                          setTaxaLevantamento(quote.taxaLevantamento || 0);
                          setTaxasAduaneiras(quote.taxasAduaneiras || 0);
                          setFreteInternacional(quote.freteInternacional || 0);
                          setTaxaEnvioLocal(quote.taxaEnvioLocal || 0);
                          setAplicarMargemSeguranca(quote.aplicarMargemSeguranca || false);
                          setCalcularRevenda(quote.calcularRevenda || false);
                          setMargemLucro(quote.margemLucro || 0);
                          setCustosAdicionais(quote.custosAdicionais || 0);
                          
                          if (quote.produtos && quote.produtos.length > 0) {
                            setProdutos(quote.produtos.map((p: any, index: number) => ({
                              id: Date.now() + index,
                              descricao: p.descricao || '',
                              imageUrl: p.imageUrl || '',
                              categoriaAerea: p.categoriaAerea || 'normal',
                              valorUnitario: p.valorUnitario || 0,
                              taxaEnvioFornecedor: p.taxaEnvioFornecedor || 0,
                              quantidade: p.quantidade || 1,
                              quantidadeCaixas: p.quantidadeCaixas ?? '',
                              comprimento: p.comprimento || 0,
                              largura: p.largura || 0,
                              altura: p.altura || 0,
                              cbmUnitario: p.cbmUnitario || '',
                              pesoUnitario: p.pesoUnitario || 0
                            })));
                          }
                          
                          setShowHistory(false);
                          setTimeout(() => {
                            document.getElementById('calculation-results')?.scrollIntoView({ behavior: 'smooth' });
                          }, 300);
                        }}
                        className="p-6 border border-slate-100 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-all cursor-pointer group mb-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${quote.tipoTransporte === 'maritimo' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                {quote.tipoTransporte}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {quote.createdAt?.toDate ? quote.createdAt.toDate().toLocaleString('pt-BR') : 'Sem data'}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900">
                              {quote.nomeCliente ? `${quote.nomeCliente} • ` : ''} {quote.produtos?.length || 0} Itens • {quote.moeda} {formatoMoeda(quote.total)}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {quote.produtos?.map((p: any) => p.descricao).join(', ').slice(0, 100)}...
                            </p>
                          </div>
                          <div className="flex items-center text-corp-blue">
                             <Edit size={16} />
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  savedDebitNotes.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                      <FileText size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Nenhuma factura salva encontrada.</p>
                    </div>
                  ) : (
                    savedDebitNotes.map((debit) => (
                      <div 
                        key={debit.id} 
                        className="p-6 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group mb-4"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${debit.shipMode === 'SEA' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                {debit.shipMode === 'AIR' ? '✈️ Aéreo' : '🚢 Marítimo'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {debit.createdAt?.toDate ? debit.createdAt.toDate().toLocaleString('pt-BR') : 'Sem data'}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900">
                              {debit.clientInfo || 'Sem Cliente'} • MZN {formatoMoeda(debit.totalMZN)}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Ref: {debit.idCode || 'N/A'} • {debit.items?.length || 0} Itens
                            </p>
                          </div>
                          <div className="flex gap-2 w-full md:w-auto">
                            <button 
                              onClick={() => {
                                setDebitNoteForm({
                                  clientInfo: debit.clientInfo || '',
                                  operatorInfo: debit.operatorInfo || '',
                                  idCode: debit.idCode || '',
                                  origin: debit.origin || 'China',
                                  shipMode: debit.shipMode || 'AIR',
                                  priceType: debit.priceType || 'FREIGHT_AND_DUTY',
                                  paymentType: 'NORMAL',
                                });
                                setDebitItems(debit.items || []);
                                setShowHistory(false);
                                setShowDebitNoteModal(true);
                              }}
                              className="flex-1 md:flex-none btn-modern-primary !py-2 !px-4 !text-[10px] flex items-center justify-center gap-2"
                            >
                              <Edit size={14} /> Editar
                            </button>
                            <button 
                              onClick={async () => {
                                setDebitNoteForm({
                                  clientInfo: debit.clientInfo || '',
                                  operatorInfo: debit.operatorInfo || '',
                                  idCode: debit.idCode || '',
                                  origin: debit.origin || 'China',
                                  shipMode: debit.shipMode || 'AIR',
                                  priceType: debit.priceType || 'FREIGHT_AND_DUTY',
                                  paymentType: 'NORMAL',
                                });
                                setDebitItems(debit.items || []);
                                setTimeout(() => {
                                  gerarDebitNotePDF();
                                }, 300);
                              }}
                              className="flex-1 md:flex-none btn-modern-outline !py-2 !px-4 !text-[10px] flex items-center justify-center gap-2"
                            >
                              <Download size={14} /> PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal Modal */}
      <AnimatePresence>
        {showLegal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm no-print"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-10 max-w-2xl w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowLegal(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-corp-blue transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tighter mb-8">{showLegal.title}</h3>
              <div className="text-slate-600 leading-relaxed space-y-4 whitespace-pre-line">
                {showLegal.content}
              </div>
              <div className="mt-10 pt-10 border-t border-slate-100">
                <button 
                  onClick={() => setShowLegal(null)}
                  className="btn-modern-primary w-full"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Tracking Modal */}
      <AnimatePresence>
        {showAdminTracking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <Shield size={24} className="text-corp-blue" />
                  <div>
                    <h3 className="font-heading font-bold text-lg text-slate-900">Admin Rastreio</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Atualizar status da carga</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAdminTracking(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="label-corp">Código de Rastreio (Ex: PW-0001)</label>
                  <input 
                    type="text" 
                    value={adminTrackingCode} 
                    onChange={(e) => setAdminTrackingCode(e.target.value)}
                    className="input-modern !py-2.5 !px-3 font-semibold"
                    placeholder="Código exato"
                  />
                </div>
                <div>
                  <label className="label-corp">Novo Status</label>
                  <input 
                    type="text" 
                    value={adminTrackingStatus} 
                    onChange={(e) => setAdminTrackingStatus(e.target.value)}
                    className="input-modern !py-2.5 !px-3"
                    placeholder="Ex: Mercadoria despachada"
                  />
                </div>
                <div>
                  <label className="label-corp">Localização</label>
                  <input 
                    type="text" 
                    value={adminTrackingLocation} 
                    onChange={(e) => setAdminTrackingLocation(e.target.value)}
                    className="input-modern !py-2.5 !px-3"
                    placeholder="Ex: Guangzhou, CN"
                  />
                </div>
                <div>
                  <label className="label-corp">Data (Opcional - Padrão: Hoje)</label>
                  <input 
                    type="text" 
                    value={adminTrackingDate} 
                    onChange={(e) => setAdminTrackingDate(e.target.value)}
                    className="input-modern !py-2.5 !px-3"
                    placeholder="Ex: 30/04/2026"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setShowAdminTracking(false)}
                    className="btn-modern-outline flex-1"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={saveTrackingUpdate}
                    disabled={isSavingTracking}
                    className="btn-modern-primary flex-1 disabled:opacity-50"
                  >
                    {isSavingTracking ? "Salvando..." : "Salvar Atualização"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debit Note Modal */}
      <AnimatePresence>
        {showDebitNoteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden my-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <Search size={24} className="text-corp-blue" />
                  <div>
                    <h3 className="font-heading font-bold text-lg text-slate-900">Emitir Debit Note</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Fatura de chegada de carga</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDebitNoteModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="col-span-2">
                    <label className="label-corp">Cliente</label>
                    <input 
                      type="text" 
                      value={debitNoteForm.clientInfo} 
                      onChange={(e) => setDebitNoteForm({...debitNoteForm, clientInfo: e.target.value})}
                      className="input-modern !py-2.5 !px-3 font-semibold text-sm"
                    />
                  </div>
                  <div>
                    <label className="label-corp">Operador</label>
                    <input 
                      type="text" 
                      value={debitNoteForm.operatorInfo} 
                      onChange={(e) => setDebitNoteForm({...debitNoteForm, operatorInfo: e.target.value})}
                      className="input-modern !py-2.5 !px-3 font-semibold text-sm uppercase"
                    />
                  </div>
                  <div>
                    <label className="label-corp">ID Code (Rastreio)</label>
                    <input 
                      type="text" 
                      value={debitNoteForm.idCode} 
                      onChange={(e) => setDebitNoteForm({...debitNoteForm, idCode: e.target.value})}
                      className="input-modern !py-2.5 !px-3 font-semibold text-sm uppercase"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label-corp">Origem</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="China" checked={debitNoteForm.origin === 'China'} onChange={() => setDebitNoteForm({...debitNoteForm, origin: 'China'})} className="accent-corp-blue" />
                        <span className="text-sm font-semibold">China</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="South Africa" checked={debitNoteForm.origin === 'South Africa'} onChange={() => setDebitNoteForm({...debitNoteForm, origin: 'South Africa'})} className="accent-corp-blue" />
                        <span className="text-sm font-semibold">África do Sul</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="label-corp">Via de Envio e Taxas</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="AIR" checked={debitNoteForm.shipMode === 'AIR'} onChange={() => {
                            setDebitNoteForm({...debitNoteForm, shipMode: 'AIR', priceType: 'FREIGHT_AND_DUTY'});
                            setDebitItems(debitItems.map(item => ({ ...item, unitType: 'KG' })));
                          }} className="accent-corp-blue" />
                          <span className="text-sm font-semibold">Aéreo (KG)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="SEA" checked={debitNoteForm.shipMode === 'SEA'} onChange={() => {
                            setDebitNoteForm({...debitNoteForm, shipMode: 'SEA', priceType: 'FREIGHT_AND_DUTY'});
                            setDebitItems(debitItems.map(item => ({ ...item, unitPrice: '21450', unitType: 'CBM' })));
                          }} className="accent-corp-blue" />
                          <span className="text-sm font-semibold">Marítimo (CBM)</span>
                        </label>
                      </div>
                      {debitNoteForm.shipMode === 'SEA' && (
                        <div className="flex items-center gap-4 mt-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
                           <label className="flex items-center gap-2 cursor-pointer">
                             <input type="radio" value="FREIGHT_ONLY" checked={debitNoteForm.priceType === 'FREIGHT_ONLY'} onChange={() => {
                               setDebitNoteForm({...debitNoteForm, priceType: 'FREIGHT_ONLY'});
                               setDebitItems(debitItems.map(item => ({ ...item, unitPrice: '11800' })));
                             }} className="accent-corp-blue" />
                             <span className="text-xs text-slate-600 font-bold">Apenas Frete</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer">
                             <input type="radio" value="DUTY_ONLY" checked={debitNoteForm.priceType === 'DUTY_ONLY'} onChange={() => {
                               setDebitNoteForm({...debitNoteForm, priceType: 'DUTY_ONLY'});
                               setDebitItems(debitItems.map(item => ({ ...item, unitPrice: '9800' })));
                             }} className="accent-corp-blue" />
                             <span className="text-xs text-slate-600 font-bold">Apenas Taxas</span>
                           </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                             <input type="radio" value="FREIGHT_AND_DUTY" checked={debitNoteForm.priceType === 'FREIGHT_AND_DUTY'} onChange={() => {
                               setDebitNoteForm({...debitNoteForm, priceType: 'FREIGHT_AND_DUTY'});
                               setDebitItems(debitItems.map(item => ({ ...item, unitPrice: '21450' })));
                             }} className="accent-corp-blue" />
                             <span className="text-xs text-slate-600 font-bold">Frete e Taxas</span>
                           </label>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="label-corp">Tipo de Faturação</label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="NORMAL" checked={debitNoteForm.paymentType === 'NORMAL'} onChange={() => {
                          setDebitNoteForm({...debitNoteForm, paymentType: 'NORMAL'});
                        }} className="accent-corp-blue" />
                        <span className="text-sm font-semibold">Normal</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="SEPARATE_PAYMENT" checked={debitNoteForm.paymentType === 'SEPARATE_PAYMENT'} onChange={() => {
                          setDebitNoteForm({...debitNoteForm, paymentType: 'SEPARATE_PAYMENT'});
                        }} className="accent-corp-blue" />
                        <span className="text-sm font-semibold">Pagamento Separado / Parcial</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="ADVANCE" checked={debitNoteForm.paymentType === 'ADVANCE'} onChange={() => {
                          setDebitNoteForm({...debitNoteForm, paymentType: 'ADVANCE'});
                        }} className="accent-corp-blue" />
                        <span className="text-sm font-semibold">Adiantamento</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h4 className="font-heading font-bold text-sm text-slate-900 border-l-4 border-corp-blue pl-2 tracking-widest uppercase">Itens da Carga</h4>
                     <button
                        onClick={() => {
                          let defaultPrice = '';
                          if (debitNoteForm.shipMode === 'SEA') {
                             if (debitNoteForm.priceType === 'FREIGHT_ONLY') defaultPrice = '11800';
                             else if (debitNoteForm.priceType === 'DUTY_ONLY') defaultPrice = '9800';
                             else if (debitNoteForm.priceType === 'FREIGHT_AND_DUTY') defaultPrice = '21450';
                          }
                          setDebitItems([...debitItems, { 
                            id: Date.now().toString(), 
                            orderNumber: '', 
                            cargoDescription: '', 
                            pkgs: 1, 
                            actualAmount: '', 
                            chargeableAmount: '', 
                            unitPrice: defaultPrice, 
                            unitType: debitNoteForm.shipMode === 'AIR' ? 'KG' : 'CBM' 
                          }]);
                        }}
                        className="text-xs font-bold text-corp-blue hover:text-corp-blue-light transition-colors border border-corp-blue/30 px-3 py-1.5 rounded-lg flex items-center gap-2"
                     >
                       + Adicionar Item
                     </button>
                  </div>
                  
                  {debitItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-8 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 relative items-start">
                      {debitItems.length > 1 && (
                        <button 
                          title="Remover Item"
                          onClick={() => setDebitItems(debitItems.filter(i => i.id !== item.id))} 
                          className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                        >
                          <X size={14} />
                        </button>
                      )}
                      
                      <div className="md:col-span-2">
                        <label className="label-corp !text-[10px]">Order Number</label>
                        <input type="text" value={item.orderNumber} onChange={(e) => { const newItems = [...debitItems]; newItems[index].orderNumber = e.target.value; setDebitItems(newItems); }} className="input-modern !py-2 !px-2 text-xs" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="label-corp !text-[10px]">Descrição</label>
                        <input type="text" value={item.cargoDescription} onChange={(e) => { const newItems = [...debitItems]; newItems[index].cargoDescription = e.target.value; setDebitItems(newItems); }} className="input-modern !py-2 !px-2 text-xs" />
                      </div>
                      <div>
                        <label className="label-corp !text-[10px]">Qtd (PKGS)</label>
                        <input type="number" value={item.pkgs} onChange={(e) => { const newItems = [...debitItems]; newItems[index].pkgs = parseInt(e.target.value) || 0; setDebitItems(newItems); }} className="input-modern !py-2 !px-2 text-xs" min="1" />
                      </div>
                      <div>
                        <label className="label-corp !text-[10px]">Actual {debitNoteForm.shipMode === 'AIR' ? '(KG)' : '(CBM)'}</label>
                        <input type="number" step="any" value={item.actualAmount} onChange={(e) => { const newItems = [...debitItems]; newItems[index].actualAmount = e.target.value; setDebitItems(newItems); }} className="input-modern !py-2 !px-2 text-xs" />
                      </div>
                      <div>
                        <label className="label-corp !text-[10px]">Chargeable</label>
                        <input type="number" step="any" value={item.chargeableAmount} onChange={(e) => { const newItems = [...debitItems]; newItems[index].chargeableAmount = e.target.value; setDebitItems(newItems); }} className="input-modern !py-2 !px-2 text-xs" />
                      </div>
                      <div>
                         <label className="label-corp !text-[10px]">Preço Un.</label>
                         <input type="number" step="any" value={item.unitPrice} onChange={(e) => { const newItems = [...debitItems]; newItems[index].unitPrice = e.target.value; setDebitItems(newItems); }} className="input-modern !py-2 !px-2 text-xs" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 flex gap-3 mt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setShowDebitNoteModal(false)}
                    className="btn-modern-outline flex-1"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={gerarDebitNotePDF}
                    disabled={isGeneratingDebit}
                    className="btn-modern-primary flex-1 disabled:opacity-50"
                  >
                    {isGeneratingDebit ? "Gerando PDF..." : "Exportar Debit Note PDF"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fraud Check Modal */}
      <AnimatePresence>
        {showFraudCheck && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm no-print"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-10 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setShowFraudCheck(false);
                  limparVerificacao();
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-corp-blue transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tighter mb-2 flex items-center gap-3">
                <ShieldAlert className="text-corp-orange" size={32} /> Verificação de Fornecedores
              </h3>
              <p className="text-sm text-slate-500 mb-8">
                Analise o risco de fraude antes de fechar negócio com um novo fornecedor internacional.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="label-corp">Nome da Empresa</label>
                  <input 
                    type="text" 
                    value={fraudData.empresa}
                    onChange={(e) => setFraudData({...fraudData, empresa: e.target.value})}
                    className="input-modern" 
                    placeholder="Ex: Shenzhen Tech Co., Ltd." 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label-corp">Website</label>
                    <input 
                      type="text" 
                      value={fraudData.website}
                      onChange={(e) => setFraudData({...fraudData, website: e.target.value})}
                      className="input-modern" 
                      placeholder="https://www.exemplo.com" 
                    />
                  </div>
                  <div>
                    <label className="label-corp">Email de Contato</label>
                    <input 
                      type="email" 
                      value={fraudData.email}
                      onChange={(e) => setFraudData({...fraudData, email: e.target.value})}
                      className="input-modern" 
                      placeholder="vendas@exemplo.com" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label-corp">Método de Pagamento Solicitado</label>
                    <select 
                      value={fraudData.metodoPagamento}
                      onChange={(e) => setFraudData({...fraudData, metodoPagamento: e.target.value})}
                      className="input-modern"
                    >
                      <option value="banco_empresa">Transferência Bancária (Conta da Empresa)</option>
                      <option value="paypal">PayPal / Plataforma Segura</option>
                      <option value="banco_pessoal">Transferência Bancária (Conta Pessoal)</option>
                      <option value="western_union">Western Union / MoneyGram</option>
                      <option value="cripto">Criptomoedas (USDT, Bitcoin)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-corp">Tempo de Mercado</label>
                    <select 
                      value={fraudData.tempoMercado}
                      onChange={(e) => setFraudData({...fraudData, tempoMercado: e.target.value})}
                      className="input-modern"
                    >
                      <option value="mais_5">Mais de 5 anos</option>
                      <option value="1_a_5">1 a 5 anos</option>
                      <option value="menos_1">Menos de 1 ano</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-widest">Indicadores B2B (Ex: Alibaba, Made-in-China)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label-corp">Selo de Fornecedor Verificado?</label>
                      <select 
                        value={fraudData.alibabaVerified}
                        onChange={(e) => setFraudData({...fraudData, alibabaVerified: e.target.value})}
                        className="input-modern"
                      >
                        <option value="nao_aplica">Não se aplica / Fora de plataforma</option>
                        <option value="sim">Sim (Verified Supplier)</option>
                        <option value="nao">Não possui selo de verificação</option>
                      </select>
                    </div>
                    <div>
                      <label className="label-corp">Aceita Trade Assurance (Garantia)?</label>
                      <select 
                        value={fraudData.tradeAssurance}
                        onChange={(e) => setFraudData({...fraudData, tradeAssurance: e.target.value})}
                        className="input-modern"
                      >
                        <option value="sim">Sim, aceita pagamento pela plataforma</option>
                        <option value="nao">Não, exige pagamento por fora</option>
                      </select>
                    </div>
                    <div>
                      <label className="label-corp">Preço vs. Média do Mercado</label>
                      <select 
                        value={fraudData.priceComparison}
                        onChange={(e) => setFraudData({...fraudData, priceComparison: e.target.value})}
                        className="input-modern"
                      >
                        <option value="normal">Preço normal / Dentro da média</option>
                        <option value="muito_baixo">Muito abaixo do mercado (Suspeito)</option>
                      </select>
                    </div>
                    <div>
                      <label className="label-corp">Disponibilidade de Amostras</label>
                      <select 
                        value={fraudData.amostras}
                        onChange={(e) => setFraudData({...fraudData, amostras: e.target.value})}
                        className="input-modern"
                      >
                        <option value="sim">Fornece amostras (pagas ou grátis)</option>
                        <option value="nao">Recusa enviar amostras</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={verificarFornecedor}
                  className="btn-modern-primary w-full mt-4"
                >
                  Analisar Risco
                </button>

                {fraudResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-8 p-6 rounded-2xl border ${
                      fraudResult.level === 'Alto Risco' ? 'bg-red-50 border-red-200' :
                      fraudResult.level === 'Risco Moderado' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {fraudResult.level === 'Alto Risco' ? <ShieldAlert className="text-red-500" size={32} /> :
                       fraudResult.level === 'Risco Moderado' ? <AlertTriangle className="text-yellow-500" size={32} /> :
                       <ShieldCheck className="text-green-500" size={32} />}
                      <div>
                        <h4 className={`font-bold text-lg ${
                          fraudResult.level === 'Alto Risco' ? 'text-red-700' :
                          fraudResult.level === 'Risco Moderado' ? 'text-yellow-700' :
                          'text-green-700'
                        }`}>
                          {fraudResult.level}
                        </h4>
                        <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
                          Score de Risco: {fraudResult.score}/100
                        </p>
                      </div>
                    </div>
                    
                    {fraudResult.messages.length > 0 ? (
                      <ul className="space-y-2 mt-4">
                        {fraudResult.messages.map((msg, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-red-500 mt-0.5">•</span> {msg}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-green-700 mt-4">
                        Nenhum indicador crítico de fraude encontrado com base nos dados fornecidos. Ainda assim, recomendamos sempre solicitar amostras e verificar documentos oficiais.
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Print Area --- */}
      <div id="invoice-print-area" className="hidden bg-[#ffffff] font-sans text-[#000000] fixed top-0 left-0 w-[1024px] z-[-50]">
        <div className="p-12 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <img 
                  src={logoBase64} 
                  alt="PrimeWay Logo" 
                  className="w-40 h-auto object-contain shrink-0"
                />
                <div>
                  <h1 className="text-3xl font-bold text-[#1A284F] mb-1">PrimeWay</h1>
                  <p className="text-[#2D4C8C] italic text-sm mb-1">Excelência em cada importação</p>
                  <p className="text-xs text-[#64748b]">NUIT: 402119357</p>
                </div>
              </div>
              {nomeCliente && (
                <div>
                  <p className="text-sm font-semibold text-[#64748b] mb-1 uppercase tracking-wider">Atenção de:</p>
                  <p className="text-xl font-bold text-[#0f172a]">Exmo(a) Sr(a). {nomeCliente}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <h2 className="font-heading font-bold text-2xl uppercase tracking-widest text-[#0f172a] mb-2">Fatura Proforma</h2>
              <p className="text-sm font-semibold text-[#334155] mb-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="text-xs text-[#94a3b8]">REF: PW-{quoteRefCode}</p>
            </div>
          </div>

          <div className="w-full h-1 bg-[#1A284F] mb-10"></div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-[#f8fafc] rounded-xl p-6 border border-[#f1f5f9]">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-2">Volume Real da Carga</p>
              <p className="text-xl font-bold text-[#1e293b]">
                {results.cbmTotal.toFixed(4)} m³
              </p>
            </div>
            <div className="bg-[#f8fafc] rounded-xl p-6 border border-[#f1f5f9]">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-2">Modalidade</p>
              <p className="text-xl font-bold text-[#1e293b] uppercase">{tipoTransporte}</p>
            </div>
            <div className="bg-[#f8fafc] rounded-xl p-6 border border-[#f1f5f9]">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-2">Peso Real da Carga</p>
              <p className="text-xl font-bold text-[#1e293b]">
                {results.pesoTotal.toFixed(2)} kg
              </p>
            </div>
            <div className="bg-[#e0f2fe] rounded-xl p-6 border border-[#bae6fd]">
              {tipoTransporte === 'maritimo' ? (
                <>
                  <p className="text-[10px] font-bold text-[#0284c7] uppercase tracking-widest mb-2">Volume Faturado (Base de Cobrança)</p>
                  <p className="text-2xl font-bold text-[#0369a1]">
                    {results.cbmFaturado.toFixed(4)} m³
                  </p>
                  <p className="text-[9px] mt-1.5 text-[#0284c7] font-semibold uppercase">
                    {results.cbmFaturado > results.cbmTotal
                      ? '⚠️ Ajustado por peso excessivo (Dense Cargo)'
                      : '✔️ Cobrado pelo volume real (físico)'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-[#0284c7] uppercase tracking-widest mb-2">Peso a Pagar (Base de Cobrança)</p>
                  <p className="text-2xl font-bold text-[#0369a1]">
                    {results.pesoTaxavel.toFixed(2)} kg
                  </p>
                  <p className="text-[9px] mt-1.5 text-[#0284c7] font-semibold uppercase">
                    {results.cobrarPor === 'volume' 
                      ? '⚠️ Ajustado pelo peso volumétrico' 
                      : '✔️ Cobrado pelo peso real (físico)'}
                  </p>
                </>
              )}
            </div>
          </div>
          
          {tipoTransporte === 'rodoviario' && !destinoRodoviario && (
            <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl mb-10">
              <p className="text-orange-800 font-bold text-lg mb-2">Aviso de Tarifa Base:</p>
              <p className="text-orange-700 text-sm">
                Para qual cidade/província vai enviar a carga para calcular o custo estimado do frete? O cálculo exige a seleção de um destino na secção de Adunairo.
              </p>
            </div>
          )}

          {/* Table */}
          <table className="w-full text-left border-collapse mb-12">
            <thead>
              <tr className="bg-[#0f172a] text-[#ffffff] text-[10px] uppercase tracking-widest">
                <th className="py-4 px-6 font-semibold">Descrição do Item</th>
                <th className="py-4 px-6 font-semibold text-center">Visual</th>
                <th className="py-4 px-6 font-semibold text-center">{tipoTransporte === 'maritimo' ? 'Vol./Peso (Un.)' : 'Peso (Un.)'}</th>
                <th className="py-4 px-6 font-semibold text-center">Qtd</th>
                <th className="py-4 px-6 font-semibold text-right">Unitário</th>
                <th className="py-4 px-6 font-semibold text-right">Envio Forn.</th>
                <th className="py-4 px-6 font-semibold text-right">Total Linha</th>
              </tr>
            </thead>
            <tbody className="text-[#334155] text-sm">
              {produtos.map((p) => {
                const qtd = Number(p.quantidade) || 0;
                const vols = (p.quantidadeCaixas !== undefined && p.quantidadeCaixas !== '') 
                  ? Number(p.quantidadeCaixas) 
                  : qtd;
                const cbmUnit = (Number(p.cbmUnitario) || 0) > 0 
                  ? Number(p.cbmUnitario) 
                  : (Number(p.comprimento) || 0) * (Number(p.largura) || 0) * (Number(p.altura) || 0) / 1000000;
                const cbmItem = cbmUnit * vols * (aplicarMargemSeguranca ? 1.2 : 1);
                const pesoItem = (Number(p.pesoUnitario) || 0) * qtd;
                const pesoUnit = Number(p.pesoUnitario) || 0;

                return (
                <tr key={p.id} className="border-b border-[#f1f5f9]">
                  <td className="py-6 px-6 text-[#0f172a] font-semibold">
                    {p.descricao || 'Mercadoria Geral'}
                  </td>
                  <td className="py-6 px-6 text-center">
                    {p.imageUrl ? (
                      <div className="w-16 h-16 rounded-md mx-auto overflow-hidden bg-white border border-[#f1f5f9] flex items-center justify-center">
                        <img 
                          src={p.imageUrl} 
                          alt={p.descricao || 'Produto'} 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-[#f1f5f9] rounded-md mx-auto flex items-center justify-center text-[#cbd5e1]">
                        <Package size={20} />
                      </div>
                    )}
                  </td>
                  <td className="py-6 px-6 text-center whitespace-nowrap text-xs text-[#475569]">
                    {tipoTransporte === 'maritimo' && cbmUnit > 0 && <div className="mb-1">{cbmUnit.toFixed(4)} m³</div>}
                    {pesoUnit > 0 ? <div>{pesoUnit.toFixed(2)} kg</div> : (cbmUnit <= 0 && '-')}
                  </td>
                  <td className="py-6 px-6 text-center">{p.quantidade}</td>
                  <td className="py-6 px-6 text-right">{formatoMoeda(Number(p.valorUnitario) || 0)}</td>
                  <td className="py-6 px-6 text-right">{formatoMoeda(Number(p.taxaEnvioFornecedor) || 0)}</td>
                  <td className="py-6 px-6 text-right font-bold text-[#1A284F]">
                    {formatoMoeda(((Number(p.valorUnitario) || 0) * (Number(p.quantidade) || 0)) + (Number(p.taxaEnvioFornecedor) || 0))}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-16">
            <div className="w-full max-w-md">
              <div className="space-y-4 mb-6 text-sm text-[#475569]">
                <div className="flex justify-between">
                  <span>Subtotal de Mercadorias:</span>
                  <span className="font-bold text-[#0f172a]">{moeda} {formatoMoeda(results.subtotalProdutos)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxas de Serviço (Proc/Com):</span>
                  <span className="font-bold text-[#0f172a]">{moeda} {formatoMoeda(results.valorTaxaProc + results.valorComissao)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Levantamento:</span>
                  <span className="font-bold text-[#0f172a]">{moeda} {formatoMoeda(results.taxaLevantamento)}</span>
                </div>
                {tipoTransporte === 'maritimo' ? (
                  <>
                    <div className="flex justify-between">
                      <span>Frete Internacional Marítimo:</span>
                      <span className="font-bold text-[#0f172a]">{moeda} {formatoMoeda(results.valorFreteInt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Despacho Aduaneiro:</span>
                      <span className="font-bold text-[#0f172a]">{moeda} {formatoMoeda(results.valorDespacho)}</span>
                    </div>
                    {results.valorEnvioLocal > 0 && (
                      <div className="flex justify-between">
                        <span>Taxa de Envio Local:</span>
                        <span className="font-bold text-[#0f172a]">{moeda} {formatoMoeda(results.valorEnvioLocal)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Frete & Despacho Aéreo (Est.):</span>
                      <span className="font-bold text-[#0f172a]">{moeda} {formatoMoeda(results.valorFreteInt)}</span>
                    </div>
                    {results.valorEnvioLocal > 0 && (
                      <div className="flex justify-between">
                        <span>Taxa de Envio Local:</span>
                        <span className="font-bold text-[#0f172a]">{moeda} {formatoMoeda(results.valorEnvioLocal)}</span>
                      </div>
                    )}
                  </>
                )}
                {results.valorDesconto > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold pt-2 border-t border-[#f1f5f9]">
                    <span>Cupom de Desconto ({activeCoupon?.code}):</span>
                    <span>- {moeda} {formatoMoeda(results.valorDesconto)}</span>
                  </div>
                )}
              </div>
              <div className="bg-[#1A284F] text-[#ffffff] p-6 rounded-xl flex flex-wrap md:flex-nowrap justify-between items-center gap-2">
                <span className="font-bold uppercase tracking-widest text-xs whitespace-nowrap">
                  {results.valorDesconto > 0 ? 'Total Estimado com Desconto' : 'Total Estimado'}
                </span>
                <span className="text-2xl sm:text-3xl font-black whitespace-nowrap tracking-tight">{moeda} {formatoMoeda(results.totalFinal)}</span>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center text-[10px] text-[#94a3b8] border-t border-[#f1f5f9] pt-8">
            <p>Estimativa gerada em sistema. Sujeita a alterações mediante aferição de peso/cubagem na origem e variações cambiais.</p>
            <p className="font-bold text-[#475569] mt-2">PRIMEWAY INVEST & LOGÍSTICA - +258 84 291 4655 | primewayinvestelogistica@gmail.com</p>
          </div>
        </div>
      </div>

      {/* --- Debit Note Print Area --- */}
      <div id="debit-note-print-area" className="hidden bg-[#ffffff] font-sans text-[#1A284F] fixed top-0 left-0 w-[1123px] z-[-50]">
        <div className="border-[8px] border-[#2D4C8C] max-w-[1123px] mx-auto bg-white rounded-xl overflow-hidden m-4">
          {/* Header Banner */}
          <div className="bg-[#f8fafc] border-b-[4px] border-[#2D4C8C] flex items-center justify-between px-12 py-8">
            <div className="flex items-center gap-6">
               <img 
                  src={logoBase64} 
                  alt="PrimeWay Logo" 
                  className="w-40 h-auto object-contain shrink-0"
                />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-[#1A284F] tracking-wider mb-2">
                {debitNoteForm.shipMode === 'AIR' ? '✈️ AIR CARGO' : '🚢 SEA CARGO'} DE {debitNoteForm.origin.toUpperCase()} PARA MAPUTO
              </h1>
              <h2 className="text-xl font-bold text-[#2D4C8C] italic">Excelência em cada importação</h2>
            </div>
            <div className="flex items-center">
               <img src="https://flagcdn.com/w160/mz.png" alt="Mozambique Flag" className="w-[80px] object-cover shadow-sm border border-slate-200" crossOrigin="anonymous"/>
            </div>
          </div>
          
          <div className="text-center py-4 bg-[#2D4C8C] text-white">
            <h1 className="text-3xl font-black tracking-widest">
              {debitNoteForm.paymentType === 'SEPARATE_PAYMENT' ? 'NOTA DE DÉBITO (PAGAMENTO SEPARADO)' :
               debitNoteForm.paymentType === 'ADVANCE' ? 'NOTA DE DÉBITO (ADIANTAMENTO)' :
               'NOTA DE DÉBITO (DEBIT NOTE)'}
            </h1>
          </div>

          <div className="px-8 py-4 flex justify-between items-center border-b-2 border-slate-200 text-xl font-bold text-[#1A284F]">
            <div className="uppercase">CLIENTE: <span className="text-[#2D4C8C]">{debitNoteForm.clientInfo}</span></div>
            <div className="uppercase">Rastreio (ID): <span className="text-[#2D4C8C]">{debitNoteForm.idCode}</span></div>
            <div className="uppercase">OPERADOR: <span className="text-[#2D4C8C]">{debitNoteForm.operatorInfo}</span></div>
          </div>

          <div className="text-center py-3 border-b-2 border-slate-200 bg-slate-50">
            <h2 className="text-lg font-black text-[#1A284F] tracking-widest uppercase">
              {debitNoteForm.priceType === 'FREIGHT_AND_DUTY' ? 'PREÇO INCLUI FRETE E TAXAS ALFANDEGÁRIAS' : debitNoteForm.priceType === 'DUTY_ONLY' ? 'PREÇO INCLUI APENAS TAXAS ALFANDEGÁRIAS' : 'PREÇO INCLUI APENAS O FRETE'}
            </h2>
          </div>

          <table className="w-full text-center border-collapse text-base border-b-2 border-[#2D4C8C]">
            <thead>
              <tr className="bg-[#1A284F] text-white">
                <th className="py-4 px-2 border-r border-[#2D4C8C] font-bold">Nº PEDIDO</th>
                <th className="py-4 px-2 border-r border-[#2D4C8C] font-bold">DESCRIÇÃO DA CARGA</th>
                <th className="py-4 px-2 border-r border-[#2D4C8C] font-bold">VOLUMES<br/>(PKGS)</th>
                <th className="py-4 px-2 border-r border-[#2D4C8C] font-bold">TAMANHO REAL<br/>{debitNoteForm.shipMode === 'AIR' ? '(KG)' : '(CBM)'}</th>
                <th className="py-4 px-2 border-r border-[#2D4C8C] font-bold">TAMANHO TAXÁVEL<br/>{debitNoteForm.shipMode === 'AIR' ? '(KG)' : '(CBM)'}</th>
                <th className="py-4 px-2 border-r border-[#2D4C8C] font-bold">PREÇO UNIT.<br/>(MZN)</th>
                <th className="py-4 px-2 font-bold">SUBTOTAL<br/>(MZN)</th>
              </tr>
            </thead>
            <tbody className="bg-white text-[#1A284F]">
              {debitItems.map((item, idx) => {
                const chargeable = parseFloat(String(item.chargeableAmount)) || 0;
                const price = parseFloat(String(item.unitPrice)) || 0;
                return (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="py-4 px-2 border-r border-slate-200 font-bold uppercase">{item.orderNumber}</td>
                  <td className="py-4 px-2 border-r border-slate-200 font-bold uppercase">{item.cargoDescription}</td>
                  <td className="py-4 px-2 border-r border-slate-200 font-bold">{item.pkgs}</td>
                  <td className="py-4 px-2 border-r border-slate-200 font-bold">{item.actualAmount || '-'}</td>
                  <td className="py-4 px-2 border-r border-slate-200 font-bold">{item.chargeableAmount}</td>
                  <td className="py-4 px-2 border-r border-slate-200 font-bold">{price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-4 px-2 font-bold text-[#2D4C8C]">
                    {(chargeable * price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex bg-[#1A284F] text-white">
            <div className="w-[75%] py-5 text-right pr-6 font-black text-2xl tracking-widest border-r border-[#2D4C8C]">
              VALOR TOTAL A PAGAR:
            </div>
            <div className="w-[25%] py-5 text-center font-black text-2xl">
              MZN {debitItems.reduce((acc, item) => acc + ((parseFloat(String(item.chargeableAmount)) || 0) * (parseFloat(String(item.unitPrice)) || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
