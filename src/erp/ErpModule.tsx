import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { Menu, X, Lock, ArrowLeft, LogIn } from 'lucide-react';
import { ErpProvider, useErp } from './ErpContext';
import ErpSidebar from './ErpSidebar';
import Dashboard from './pages/Dashboard';
import ClientsList from './pages/ClientsList';
import ClientDetail from './pages/ClientDetail';
import OpportunitiesList from './pages/OpportunitiesList';
import OpportunityDetail from './pages/OpportunityDetail';
import SalesList from './pages/SalesList';
import SaleDetail from './pages/SaleDetail';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';

interface ErpModuleProps {
  isAdmin: boolean;
  isAuthReady: boolean;
  user: User | null;
  onExitErp: () => void;
  onOpenLogin?: () => void;
}

function ErpRouteContent() {
  const { route } = useErp();

  if (route === '/' || route === '') {
    return <Dashboard />;
  }
  if (route === '/clients') {
    return <ClientsList />;
  }
  if (route.startsWith('/clients/')) {
    const id = route.slice('/clients/'.length);
    return <ClientDetail id={id} />;
  }
  if (route === '/opportunities') {
    return <OpportunitiesList />;
  }
  if (route.startsWith('/opportunities/')) {
    const id = route.slice('/opportunities/'.length);
    return <OpportunityDetail id={id} />;
  }
  if (route === '/sales') {
    return <SalesList />;
  }
  if (route.startsWith('/sales/')) {
    const id = route.slice('/sales/'.length);
    return <SaleDetail id={id} />;
  }
  if (route === '/agenda') {
    return <Tasks />;
  }
  if (route === '/reports') {
    return <Reports />;
  }

  return <Dashboard />;
}

export function ErpModule({ isAdmin, isAuthReady, user, onExitErp, onOpenLogin }: ErpModuleProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthReady) {
    return (
      <div className="min-h-[calc(100dvh-110px)] flex items-center justify-center bg-slate-50 px-6 py-16">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">A verificar credenciais de acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !user) {
    return (
      <div className="min-h-[calc(100dvh-110px)] flex items-center justify-center bg-slate-50 px-6 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Acesso Restrito — PrimeWay ERP</h1>
            <p className="text-sm text-slate-600">
              O módulo interno de ERP, CRM e Gestão Comercial é reservado à equipa administrativa autenticada.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onOpenLogin && !user && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Iniciar Sessão
              </button>
            )}
            <button
              type="button"
              onClick={onExitErp}
              className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErpProvider user={user} onExitErp={onExitErp}>
      <div className="flex min-h-[calc(100dvh-110px)] bg-slate-50 text-slate-800 font-sans relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <ErpSidebar />
        </div>

        {/* Mobile Drawer Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="w-64 h-full bg-slate-900 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Fechar menu ERP"
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <ErpSidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Abrir menu ERP"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="font-semibold text-sm text-slate-600">
                Painel Operacional — Primeway ERP
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="hidden sm:inline">Moçambique • MZN</span>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <ErpRouteContent />
            </div>
          </main>
        </div>
      </div>
    </ErpProvider>
  );
}
