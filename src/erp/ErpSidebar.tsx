import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  PieChart,
  BarChart,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ErpOperationType, logErpFirestoreError, useErp } from './ErpContext';

export default function ErpSidebar() {
  const { user, route, navigate, onExitErp } = useErp();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tasks'), where('status', '==', 'Pendente'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let overdueAndToday = 0;
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        snapshot.forEach(docSnap => {
          const date = docSnap.data().date?.toDate?.();
          if (date && date <= todayEnd) {
            overdueAndToday++;
          }
        });
        setPendingCount(overdueAndToday);
      },
      (error) => {
        logErpFirestoreError(error, ErpOperationType.LIST, 'tasks');
      }
    );
    return () => unsubscribe();
  }, [user]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'CRM (Clientes)', path: '/clients', icon: Users },
    { name: 'Oportunidades', path: '/opportunities', icon: BarChart },
    { name: 'Agenda & Follow-up', path: '/agenda', icon: Calendar, badge: pendingCount },
    { name: 'Importações', path: '/sales', icon: Package },
    { name: 'Relatórios', path: '/reports', icon: PieChart },
  ];

  const isRouteActive = (itemPath: string) => {
    if (itemPath === '/') return route === '/';
    return route === itemPath || route.startsWith(`${itemPath}/`);
  };

  return (
    <div className="bg-[#16263c] text-white border-b border-slate-700/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Back + PrimeWay Logo & Identity + User Chip */}
        <div className="flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onExitErp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Site</span>
            </button>

            <div className="h-6 w-px bg-white/15 hidden sm:block shrink-0" />

            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/IMG-20260215-WA0003.jpg"
                alt="PrimeWay Logo"
                className="w-9 h-9 rounded-md object-contain bg-[#050505] border border-white/20 shrink-0"
              />
              <div className="min-w-0">
                <div className="font-heading font-bold text-sm sm:text-base leading-tight tracking-tight truncate">
                  PrimeWay ERP &amp; CRM
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-300 font-medium truncate">
                  Gestão Comercial &amp; Operações
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md bg-white/10 text-[11px] font-medium text-slate-200">
              Moçambique • MZN
            </span>
            <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-md">
              <div className="w-6 h-6 rounded bg-[#b94f22] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {(user?.displayName || user?.email || 'A').slice(0, 1).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-slate-100 max-w-[160px] truncate">
                {user?.displayName || user?.email || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Horizontal Tabs matching Sourcing / Corporate */}
        <nav
          aria-label="Navegação ERP"
          className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-white/10 text-xs font-medium"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.path);
            return (
              <button
                key={item.path}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#b94f22] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-300'}`} />
                <span>{item.name}</span>
                {!!item.badge && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      active ? 'bg-white text-[#b94f22]' : 'bg-[#b94f22] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
