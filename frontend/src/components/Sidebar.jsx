import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const BIBLIOTECA_CATS = [
  { label: 'design', icon: 'ti-palette' },
  { label: 'seguranca', icon: 'ti-shield-lock' },
  { label: 'infraestrutura', icon: 'ti-server' },
  { label: 'codigo', icon: 'ti-code' },
  { label: 'prompts', icon: 'ti-message-bolt' },
];

function SideItem({ to, icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm transition-colors duration-100 ${
          isActive
            ? 'bg-[#EDE4D8] text-terra font-medium'
            : 'text-muted hover:bg-cream hover:text-dark'
        }`
      }
    >
      <i className={`${icon} text-base`} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <aside className="w-[220px] min-h-screen bg-surface border-r border-border flex flex-col py-5 px-3 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-7">
        <i className="ti-flame text-terra text-xl" />
        <span className="text-dark font-medium text-base tracking-tight">Facho</span>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {/* Geral */}
        <p className="px-3 text-[10px] font-medium text-faint uppercase tracking-widest mb-1 mt-1">
          Geral
        </p>
        <SideItem to="/dashboard" icon="ti-layout-dashboard" label="visão geral" end />
        <SideItem to="/projetos" icon="ti-folders" label="projetos" />

        {/* Biblioteca */}
        <p className="px-3 text-[10px] font-medium text-faint uppercase tracking-widest mb-1 mt-4">
          Biblioteca
        </p>
        {BIBLIOTECA_CATS.map((cat) => (
          <SideItem
            key={cat.label}
            to={`/biblioteca/${cat.label}`}
            icon={cat.icon}
            label={cat.label}
          />
        ))}
      </nav>

      {/* Inferior */}
      <div className="flex flex-col gap-0.5 mt-4 border-t border-border pt-4">
        <SideItem to="/preferencias" icon="ti-settings" label="preferências" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm text-muted hover:bg-cream hover:text-dark transition-colors duration-100 text-left"
        >
          <i className="ti-logout text-base" />
          <span>sair</span>
        </button>
      </div>
    </aside>
  );
}
