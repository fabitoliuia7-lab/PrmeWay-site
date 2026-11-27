import React from 'react';
import type { User } from 'firebase/auth';
import { Lock, ArrowLeft, LogIn } from 'lucide-react';
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
  if (!isAuthReady) {
    return (
      <div className="min-h-[calc(100dvh-110px)] flex items-center justify-center bg-[#f7f7f3] px-6 py-16">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#16263c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">A verificar credenciais de acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !user) {
    return (
      <div className="min-h-[calc(100dvh-110px)] flex items-center justify-center bg-[#f7f7f3] px-6 py-16">
        <div className="max-w-md w-full bg-white rounded-lg border border-[#dfe3e6] shadow-sm p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-lg bg-[#16263c]/5 text-[#16263c] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-xl font-bold text-[#16263c]">Acesso Restrito — PrimeWay ERP</h1>
            <p className="text-sm text-slate-600">
              O módulo interno de ERP, CRM e Gestão Comercial é reservado à equipa administrativa autenticada.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onOpenLogin && !user && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex-1 flex items-center justify-center gap-2 bg-[#16263c] text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-[#233856] transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Iniciar Sessão
              </button>
            )}
            <button
              type="button"
              onClick={onExitErp}
              className="flex-1 flex items-center justify-center gap-2 border border-[#dfe3e6] text-[#16263c] px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-[#f7f7f3] transition-colors cursor-pointer"
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
      <div className="min-h-[calc(100dvh-110px)] bg-[#f7f7f3] text-[#16263c] font-sans pb-16">
        <ErpSidebar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <ErpRouteContent />
        </main>
      </div>
    </ErpProvider>
  );
}
