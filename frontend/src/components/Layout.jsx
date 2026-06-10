import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import SearchBar from './SearchBar.jsx';
import {
  IconMenu2, IconSearch,
  IconLayoutDashboard, IconFolders, IconPalette, IconTemplate,
} from '@tabler/icons-react';

const BOTTOM_NAV = [
  { path: '/dashboard', Icon: IconLayoutDashboard, label: 'Início' },
  { path: '/projetos', Icon: IconFolders, label: 'Projetos' },
  { path: '/biblioteca/design', Icon: IconPalette, label: 'Biblioteca' },
  { path: '/templates', Icon: IconTemplate, label: 'Templates' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function navTo(path) {
    navigate(path);
    closeSidebar();
  }

  function isActive(basePath) {
    if (basePath === '/dashboard') return location.pathname === '/dashboard';
    if (basePath === '/biblioteca/design') return location.pathname.startsWith('/biblioteca');
    return location.pathname.startsWith(basePath);
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Overlay escuro quando sidebar está aberta no mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Topbar mobile */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-surface border-b border-border flex items-center px-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-muted hover:text-dark transition-colors"
            aria-label="Abrir menu"
          >
            <IconMenu2 size={22} />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <img
              src="/logo-facho.png"
              alt="Facho"
              style={{ width: '26px', height: '26px', mixBlendMode: 'multiply', objectFit: 'contain' }}
            />
            <span className="text-dark font-medium text-sm">Facho</span>
          </div>
          <button
            onClick={() => setShowMobileSearch((v) => !v)}
            className="p-2 text-muted hover:text-dark transition-colors"
            aria-label="Buscar"
          >
            <IconSearch size={20} />
          </button>
        </header>

        {/* SearchBar deslizante no mobile */}
        {showMobileSearch && (
          <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-surface border-b border-border px-4 py-3">
            <SearchBar onResultSelect={() => setShowMobileSearch(false)} />
          </div>
        )}

        {/* Header desktop */}
        <header className="hidden md:block px-8 py-4 border-b border-border bg-cream">
          <SearchBar />
        </header>

        {/* Conteúdo da página */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pt-[72px] pb-20 md:pt-6 md:px-8 md:py-6 md:pb-6">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation — apenas mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border flex items-center h-16">
        {BOTTOM_NAV.map(({ path, Icon, label }) => (
          <button
            key={path}
            onClick={() => navTo(path)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              isActive(path) ? 'text-terra' : 'text-faint'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
