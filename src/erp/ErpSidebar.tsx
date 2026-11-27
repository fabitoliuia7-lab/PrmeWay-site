import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  PieChart,
  BarChart,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ErpOperationType, logErpFirestoreError, useErp } from './ErpContext';

interface ErpSidebarProps {
  onClose?: () => void;
}

export default function ErpSidebar({ onClose }: ErpSidebarProps) {
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
    { name: 'Oportunidades (ERP)', path: '/opportunities', icon: BarChart },
    { name: 'Agenda & Follow-up', path: '/agenda', icon: Calendar, badge: pendingCount },
    { name: 'Importações', path: '/sales', icon: Package },
    { name: 'Relatórios', path: '/reports', icon: PieChart },
  ];

  const isRouteActive = (itemPath: string) => {
    if (itemPath === '/') return route === '/';
    return route === itemPath || route.startsWith(`${itemPath}/`);
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-full min-h-[calc(100dvh-110px)]">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg p-1 shrink-0">
            <img
              src="/logo-primeway.png"
              alt="Primeway Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight block leading-tight">Primeway</span>
            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">ERP &amp; CRM</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto text-sm font-medium">
        <div className="px-6 py-2 text-slate-500 uppercase text-[10px] tracking-widest font-bold flex justify-between">
          <span>Menu</span>
        </div>
        {navItems.map((item) => {
          const active = isRouteActive(item.path);
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path);
                onClose?.();
              }}
              className={`w-full text-left flex items-center justify-between px-6 py-3 transition-colors cursor-pointer ${
                active
                  ? 'bg-indigo-600/10 text-indigo-400 border-r-2 border-indigo-500'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
              {!!item.badge && item.badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold">{(user?.email?.[0] || 'A').toUpperCase()}</span>
            )}
          </div>
          <div className="text-xs font-medium truncate">
            <p className="text-white truncate">{user?.displayName || 'Admin'}</p>
            <p className="text-slate-400 italic truncate">{user?.email || 'Gestão'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onClose?.();
            onExitErp();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Site
        </button>
      </div>
    </aside>
  );
}
