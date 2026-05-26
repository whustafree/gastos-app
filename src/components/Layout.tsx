import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Wallet, PiggyBank, FileText, Clock,
  LogOut, Menu, X, User, Calculator, ChartPie,
} from 'lucide-react';

export type Section = 'dashboard' | 'gastos' | 'metas' | 'liquidacion' | 'horas-extras' | 'presupuestos';

interface LayoutProps {
  section: Section;
  onSectionChange: (s: Section) => void;
  children: React.ReactNode;
}

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'gastos', label: 'Gastos', icon: Wallet },
  { id: 'metas', label: 'Metas', icon: PiggyBank },
  { id: 'presupuestos', label: 'Presupuesto', icon: ChartPie },
  { id: 'liquidacion', label: 'Liquidación', icon: FileText },
  { id: 'horas-extras', label: 'Horas Extras', icon: Clock },
];

const categoriaIconos: Record<string, string> = {
  dashboard: '📊',
  gastos: '💰',
  metas: '🎯',
  presupuestos: '📋',
  liquidacion: '📄',
  'horas-extras': '⏰',
};

export default function Layout({ section, onSectionChange, children }: LayoutProps) {
  const { user, isDemo, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const userName = isDemo ? 'Usuario Demo' : user?.displayName || user?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 safe-top-padding">
        <div className="flex items-center justify-between px-4 h-14 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-800 transition-colors"
            >
              {showMenu ? <X className="w-5 h-5 text-gray-300" /> : <Menu className="w-5 h-5 text-gray-300" />}
            </button>
            <div>
              <h1 className="text-sm font-bold text-white">GastosApp</h1>
              <p className="text-xs text-gray-500">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowMenu(false)} />
          <div className="fixed left-0 top-14 bottom-16 z-40 w-64 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto animate-fade-in-up shadow-2xl">
            <div className="flex items-center gap-3 p-3 mb-4 rounded-2xl bg-gray-800/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{userName}</p>
                <p className="text-xs text-gray-500">{isDemo ? 'Modo Demo' : user?.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setShowMenu(false); onSectionChange(item.id); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    section === item.id
                      ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 pb-24 overflow-y-auto">
        <div key={section} className="animate-fade-in-up">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-t border-gray-800/50 safe-bottom-padding">
        <div className="max-w-5xl mx-auto flex items-center justify-around h-16 px-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all relative ${
                section === item.id
                  ? 'text-blue-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {section === item.id && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
