import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Bot, 
  Sparkles, 
  User, 
  RotateCcw, 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  Ship,
  Globe,
  FileText,
  Boxes,
  HelpCircle,
  AlertCircle,
  BookOpen,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PAUTA_MOCAMBIQUE, 
  PAUTA_DINAMICA_TEMPO_REAL,
  PautaItem, 
  buscarPautaAduaneira, 
  obterTaxasPauta, 
  listarCategoriasPauta,
  consultarPautaTempoReal
} from '../pautaAduaneira';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp: string;
}

interface ImportExpertChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToCalculator?: (mode?: 'geral' | 'contentor' | 'veiculos') => void;
  onNavigateToSourcing?: () => void;
}

const QUICK_PROMPTS = [
  {
    icon: '📋',
    label: 'Puxar Pauta Aduaneira Oficial',
    prompt: 'Puxar taxas da Pauta Aduaneira de Moçambique para rolamentos, geradores, painéis solares, computadores e camiões'
  },
  {
    icon: '📦',
    label: 'Importar Contentor da China',
    prompt: 'Quero importar um contentor de 20 ou 40 pés da China para Moçambique (Porto de Maputo). Quais são os passos completos, custos típicos e tempo de trânsito?'
  },
  {
    icon: '🇲🇿',
    label: 'Exportar MZ para China',
    prompt: 'Como posso exportar produtos de Moçambique para a China (ex: sementes de gergelim, castanha de caju ou minérios)? Quais são as exigências da alfândega chinesa (GACC) e do Banco de Moçambique?'
  },
  {
    icon: '🛡️',
    label: 'Prevenção de Golpes no Alibaba/1688',
    prompt: 'Quais os principais cuidados e verificações para não cair em golpes com fornecedores chineses no Alibaba e 1688? Como a PrimeWay valida os fornecedores?'
  },
  {
    icon: '📑',
    label: 'O que é DU e Termo de Compromisso?',
    prompt: 'Pode me explicar como funciona o pagamento bancário ao fornecedor no exterior com Termo de Compromisso e o desembaraço aduaneiro com DU (Documento Único)?'
  },
  {
    icon: '🚚',
    label: 'Grupagem DDP vs Contentor FCL',
    prompt: 'Qual a diferença prática e de custos entre a Grupagem LCL / DDP da PrimeWay e trazer um Contentor Inteiro FCL da China?'
  }
];

const buildChatHistory = (items: ChatMessage[]) => {
  const eligible = items
    .filter((message) => {
      const content = message.content.trim();
      return Boolean(content) && (message.role === 'user' || message.role === 'assistant' || message.role === 'model') &&
        !/^⚠️\s*\*\*Aviso:/i.test(content);
    })
    .map((message) => {
      const maxLength = message.role === 'user' ? 4000 : 8000;
      return {
        role: message.role,
        content: message.content.trim().slice(0, maxLength)
      };
    })
    .slice(-20);

  let totalCharacters = eligible.reduce((total, message) => total + message.content.length, 0);
  while (totalCharacters > 24000 && eligible.length > 1) {
    const removed = eligible.shift();
    totalCharacters -= removed?.content.length || 0;
  }
  return eligible;
};

export const ImportExpertChatbot: React.FC<ImportExpertChatbotProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onNavigateToCalculator,
  onNavigateToSourcing
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    setInternalIsOpen(open);
    if (!open && externalOnClose) externalOnClose();
  };

  const [activeTab, setActiveTab] = useState<'chat' | 'pauta'>('chat');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pauta Explorer search state
  const [pautaSearch, setPautaSearch] = useState('');
  const [pautaCategoryFilter, setPautaCategoryFilter] = useState('Todas');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [itensTempoReal, setItensTempoReal] = useState<PautaItem[]>([]);

  const handleBuscarTempoReal = async (termo?: string) => {
    const q = (termo !== undefined ? termo : pautaSearch).trim();
    if (!q) return;
    setIsSearchingOnline(true);
    try {
      const res = await consultarPautaTempoReal(q);
      const novo: PautaItem = {
        codigo: res.codigo,
        shCapitulo: res.codigo.slice(0, 2),
        shPosicao: res.codigo.replace(/\D/g, '').slice(0, 4),
        descricao: res.descricao,
        categoria: res.categoria,
        tipoBem: (res.tipoBem as any) || 'capital',
        direitosPerc: res.direitosPerc,
        icePerc: res.icePerc,
        ivaPerc: res.ivaPerc,
        notas: res.notas
      };
      setItensTempoReal(prev => [novo, ...prev.filter(i => i.codigo !== novo.codigo)]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const categoriesList = useMemo(() => {
    return ['Todas', ...listarCategoriasPauta()];
  }, []);

  const pautaFilteredItems = useMemo(() => {
    let items = pautaSearch.trim() 
      ? buscarPautaAduaneira(pautaSearch, 50) 
      : [...itensTempoReal, ...PAUTA_DINAMICA_TEMPO_REAL, ...PAUTA_MOCAMBIQUE];

    if (pautaCategoryFilter !== 'Todas') {
      items = items.filter(i => i.categoria === pautaCategoryFilter);
    }
    return items;
  }, [pautaSearch, pautaCategoryFilter, itensTempoReal]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `Olá! Sou o **Especialista em Comércio e Logística China ⇄ Moçambique** da PrimeWay.\n\nEstou conectado em tempo real à **Pauta Aduaneira de Moçambique (SH)** e às normas comerciais e aduaneiras bilaterais.\n\nComo posso ajudar a sua empresa hoje? Posso orientar sobre:\n* **Pauta Aduaneira & Impostos**: Direitos Aduaneiros (0%, 5%, 7.5%, 20%), ICE (10% a 40%) e IVA (16%), além de taxas TSA, MCNET e Kudumba.\n* **Importação da China**: Contentores FCL, Grupagem LCL/DDP, Portos de Maputo/Beira/Nacala, custos e prazos de trânsito (28 a 40 dias).\n* **Exportação Moçambique ➔ China**: Gergelim, castanha de caju, minérios, madeira processada, registo na GACC e desembaraço aduaneiro com Tarifa Zero.\n* **Sourcing Seguro**: Validação de fábricas chinesas no Alibaba e 1688, pagamento seguro e controlo cambial.\n\n*Clique na aba **"📋 Puxar Pauta Aduaneira"** no topo para consultar qualquer produto ou digite a sua dúvida abaixo!*`,
        timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, activeTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim().slice(0, 4000);
    if (!text || isLoading) return;

    // Switch back to chat tab if sent from pauta tab
    setActiveTab('chat');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, assistantMessage]);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const historyPayload = buildChatHistory([...messages, userMessage]);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          stream: true
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro de resposta: status ${res.status}`);
      }

      if (!res.body) {
        throw new Error('Streaming não suportado pelo navegador.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.replace('data: ', '');
            if (dataStr === '[DONE]') {
              break;
            }
            let parsed: { text?: string; error?: string };
            try {
              parsed = JSON.parse(dataStr);
            } catch {
              // Ignore non-JSON chunk lines, but never swallow parsed SSE errors.
              continue;
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulatedText += parsed.text;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulatedText }
                    : msg
                )
              );
            }
          }
        }
      }

      if (!accumulatedText) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMsgId 
              ? { ...msg, content: 'Resposta vazia ou consulta concluída sem texto.' }
              : msg
          )
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Chat query cancelled by user');
      } else {
        console.error('Chat error:', err);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMsgId 
              ? { ...msg, content: `⚠️ **Aviso:** ${err.message || 'Ocorreu um erro ao comunicar com o especialista. Por favor, verifique a sua ligação ou tente novamente.'}` }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStopStreaming = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Deseja limpar todo o histórico desta conversa com o especialista?')) {
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: 'Histórico reiniciado. Como posso orientar a sua próxima operação de importação ou exportação?',
          timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePuxarItemParaChat = (item: PautaItem) => {
    handleSendMessage(`Puxar taxas oficiais e base de cálculo da Pauta Aduaneira para: ${item.codigo} - ${item.descricao} (DA ${item.direitosPerc}%, ICE ${item.icePerc}%, IVA ${item.ivaPerc}%)`);
  };

  const handlePuxarItemParaSimulador = (item: PautaItem) => {
    if (onNavigateToCalculator) {
      onNavigateToCalculator(item.tipoBem === 'veiculo' ? 'veiculos' : 'contentor');
      setIsOpen(false);
    }
  };

  // Render markdown text formatting cleanly
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Heading 3 or 4
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                <span className="w-1.5 h-3.5 bg-corp-blue rounded-full"></span>
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-extrabold text-slate-900 text-base mt-3 mb-1 text-corp-blue">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }

          // Bullet items
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const rawText = trimmed.replace(/^(\*|-)\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-corp-blue font-bold text-base leading-none mt-1">•</span>
                <span className="flex-1">{formatInlineStyles(rawText)}</span>
              </div>
            );
          }

          // Numbered items
          if (/^\d+\.\s+/.test(trimmed)) {
            const num = trimmed.match(/^(\d+)\.\s+/)?.[1];
            const rawText = trimmed.replace(/^\d+\.\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="bg-corp-blue/10 text-corp-blue text-[11px] font-black px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">
                  {num}
                </span>
                <span className="flex-1">{formatInlineStyles(rawText)}</span>
              </div>
            );
          }

          // Simple Markdown table row detection
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            // Header separator row like | :--- | :---: |
            if (/^\|[\s\-:]+\|/.test(trimmed)) {
              return null;
            }
            const cols = trimmed.slice(1, -1).split('|').map(c => c.trim());
            return (
              <div key={idx} className="grid grid-cols-6 gap-1 bg-slate-50 p-1.5 rounded text-xs border border-slate-200/80 my-1">
                <div className="col-span-2 font-mono font-bold text-corp-blue truncate">{cols[0]}</div>
                <div className="col-span-2 font-semibold text-slate-800 truncate">{cols[1]}</div>
                <div className="col-span-1 text-center font-bold text-amber-900 bg-amber-100 rounded py-0.5">{cols[3] || cols[2]}</div>
                <div className="col-span-1 text-center font-bold text-slate-700 bg-slate-200 rounded py-0.5">{cols[5] || '16%'}</div>
              </div>
            );
          }

          return <p key={idx}>{formatInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  // Helper for bold and badge styling in inline markdown
  const formatInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        // Highlight tariff rates, percentages, HS codes
        if (/(\d+%\s*DA|\d+%\s*ICE|\d+%\s*IVA|\bSH\s*\d+|\bFCL\b|\bLCL\b|\bDDP\b|\bCIF\b|\bFOB\b)/i.test(inner)) {
          return (
            <span key={i} className="inline-flex items-center font-bold px-1.5 py-0.2 mx-0.5 bg-blue-50 text-corp-blue rounded border border-blue-200/80 text-[12px]">
              {inner}
            </span>
          );
        }
        return <strong key={i} className="font-bold text-slate-900">{inner}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button (when chatbot window is closed) */}
      {!isOpen && (
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 no-print"
        >
          {/* Teaser Tooltip */}
          <div 
            onClick={() => {
              setActiveTab('chat');
              setIsOpen(true);
            }}
            className="hidden sm:flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/80 text-xs font-semibold text-slate-800 cursor-pointer hover:border-corp-blue transition-all group"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Especialista em Importação & Pauta Aduaneira</span>
            <span className="text-[10px] bg-corp-blue text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider group-hover:bg-corp-orange transition-colors">
              Puxar Pauta
            </span>
          </div>

          {/* Main Action Button */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('chat');
              setIsOpen(true);
            }}
            aria-label="Abrir Assistente Especialista de Importação"
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1A284F] via-[#2A417F] to-corp-orange text-white shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all group border-2 border-white/40"
          >
            <Bot size={26} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          </button>
        </motion.div>
      )}

      {/* Main Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 flex flex-col bg-white shadow-2xl border border-slate-200/80 overflow-hidden no-print ${
              isFullscreen 
                ? 'inset-3 sm:inset-6 rounded-3xl' 
                : isMinimized 
                  ? 'bottom-6 right-6 w-80 sm:w-96 rounded-2xl h-16' 
                  : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[500px] md:w-[560px] h-[640px] max-h-[88vh] rounded-3xl'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1A284F] via-[#223565] to-[#1A284F] text-white px-4 py-3 flex items-center justify-between shrink-0 select-none shadow-md border-b border-blue-900/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-inner">
                    <Bot size={20} className="text-amber-300" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#1A284F] rounded-full"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                      Especialista PrimeWay AI
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-400/30">
                        China ⇄ MZ
                      </span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Pauta Aduaneira Conectada • FCL • LCL • Despacho
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Limpar Conversa"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? 'Restaurar Tamanho' : 'Maximizar'}
                  className="hidden sm:inline-flex p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Expandir' : 'Minimizar'}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronDown size={18} className={`transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Fechar"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-red-500/30 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Navigation Tab Bar: Chat vs Pauta Explorer */}
            {!isMinimized && (
              <div className="bg-slate-100 p-1 flex gap-1 border-b border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-white text-corp-blue shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <MessageSquare size={14} /> Chat Especialista
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pauta')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'pauta'
                      ? 'bg-white text-corp-blue shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <BookOpen size={14} className="text-amber-500" />
                  <span>Pauta em Tempo Real</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black border border-emerald-300">
                    Live
                  </span>
                </button>
              </div>
            )}

            {/* Content (Hidden when minimized) */}
            {!isMinimized && (
              activeTab === 'pauta' ? (
                /* Interactive Pauta Explorer View */
                <div className="flex flex-col flex-1 min-h-0 bg-white">
                  {/* Search and Category Filter Bar */}
                  <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={pautaSearch}
                          onChange={(e) => setPautaSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleBuscarTempoReal()}
                          placeholder="Pesquisar código SH (ex: 8422.40, 8502, 8541) ou produto..."
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />
                        {pautaSearch && (
                          <button
                            type="button"
                            onClick={() => setPautaSearch('')}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBuscarTempoReal()}
                        disabled={isSearchingOnline}
                        className="flex items-center gap-1 px-3 py-2 bg-corp-blue hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-60"
                        title="Buscar em Tempo Real na Pauta Aduaneira de Moçambique"
                      >
                        <Sparkles size={13} className="text-amber-300" />
                        <span>{isSearchingOnline ? 'A Buscar...' : 'Tempo Real'}</span>
                      </button>
                    </div>

                    {/* Category Scroll Filter */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                      <Filter size={12} className="text-slate-400 shrink-0 ml-1" />
                      {categoriesList.slice(0, 8).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setPautaCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                            pautaCategoryFilter === cat
                              ? 'bg-amber-600 text-white font-bold'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Results List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span>Mostrando <strong>{pautaFilteredItems.length}</strong> produtos oficiais</span>
                      <span className="text-[10px] text-amber-700 font-semibold">Clique para puxar para o chat ou simulador</span>
                    </div>

                    {pautaFilteredItems.map((item) => (
                      <div
                        key={item.codigo}
                        className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-amber-400 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-black text-corp-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {item.codigo}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold truncate">
                                {item.categoria}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {item.descricao}
                            </h4>
                            {item.notas && (
                              <p className="text-[11px] text-slate-500 mt-1">
                                {item.notas}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[11px] font-black px-2 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-300">
                              DA: {item.direitosPerc}%
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                              <span>ICE: {item.icePerc}%</span>
                              <span>•</span>
                              <span>IVA: {item.ivaPerc}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons on tariff card */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handlePuxarItemParaChat(item)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-corp-blue text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <MessageSquare size={12} /> Puxar para o Chat
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePuxarItemParaSimulador(item)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          >
                            <Boxes size={12} /> Puxar para o Simulador
                          </button>
                        </div>
                      </div>
                    ))}

                    {pautaFilteredItems.length === 0 && (
                      <div className="text-center py-10 text-slate-500 space-y-2">
                        <AlertCircle size={32} className="mx-auto text-slate-400" />
                        <p className="text-xs font-semibold">Nenhum produto encontrado para &quot;{pautaSearch}&quot;.</p>
                        <p className="text-[11px] text-slate-400">Tente buscar por termos genéricos como: gerador, painel, bomba, camião, ferro, cabo.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Chat Conversation View */
                <div className="flex flex-col flex-1 min-h-0 bg-slate-50/70">
                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[85%]">
                          {msg.role !== 'user' && (
                            <div className="w-7 h-7 rounded-lg bg-corp-blue text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                              <Bot size={15} />
                            </div>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl shadow-sm text-sm relative group ${
                              msg.role === 'user'
                                ? 'bg-corp-blue text-white rounded-tr-xs'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                            }`}
                          >
                            {/* Message Body */}
                            {msg.role === 'user' ? (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                              renderFormattedContent(msg.content)
                            )}

                            {/* Footer Action buttons for assistant messages */}
                            {msg.role !== 'user' && msg.id !== 'welcome-1' && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                                <span className="text-[10px] text-slate-400 font-semibold">{msg.timestamp}</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  >
                                    {copiedId === msg.id ? (
                                      <>
                                        <Check size={12} className="text-emerald-600" />
                                        <span className="text-emerald-600 font-bold">Copiado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('pauta')}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition-colors cursor-pointer"
                                  >
                                    <BookOpen size={12} />
                                    <span>Ver Pauta SH</span>
                                  </button>

                                  {onNavigateToCalculator && (
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToCalculator('contentor')}
                                      className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-corp-blue font-semibold transition-colors cursor-pointer"
                                    >
                                      <Boxes size={12} />
                                      <span>Simulador FCL</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {msg.role === 'user' && (
                            <div className="w-7 h-7 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                              <User size={15} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-slate-500 text-xs pl-2 bg-white/60 p-2.5 rounded-xl border border-slate-200/50 w-fit">
                        <div className="w-4 h-4 border-2 border-corp-blue border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-semibold text-corp-blue">Consultando especialista & Pauta Aduaneira...</span>
                        <button
                          type="button"
                          onClick={handleStopStreaming}
                          className="ml-2 text-red-500 hover:text-red-700 font-bold underline cursor-pointer"
                        >
                          Parar
                        </button>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Prompts (Suggested Questions) */}
                  <div className="p-2.5 bg-white border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                        <Sparkles size={11} className="text-amber-500" /> Perguntas Rápidas de Especialista
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('pauta')}
                        className="text-[10px] text-amber-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <BookOpen size={10} /> Abrir Pauta SH
                      </button>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {QUICK_PROMPTS.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(q.prompt)}
                          disabled={isLoading}
                          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-corp-blue border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                        >
                          <span>{q.icon}</span>
                          <span>{q.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        maxLength={4000}
                        placeholder="Ex: Puxar taxas de geradores e painéis solares na pauta..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value.slice(0, 4000))}
                        disabled={isLoading}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-corp-blue/30 focus:border-corp-blue transition-all font-medium disabled:opacity-50"
                      />

                      <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="p-2.5 rounded-xl bg-corp-blue hover:bg-[#132040] text-white disabled:opacity-40 transition-colors shadow-sm flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 mt-1.5">
                      <span>Baseado na Pauta Aduaneira Oficial da AT Moçambique</span>
                      <span className="font-semibold text-corp-blue">PrimeWay Invest & Logística</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
