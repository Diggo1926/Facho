import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  IconLayoutDashboard, IconFolders, IconPalette,
  IconShieldLock, IconServer, IconCode, IconMessageBolt,
  IconSettings, IconLogout,
} from '@tabler/icons-react';

const BIBLIOTECA_CATS = [
  { label: 'design', Icon: IconPalette },
  { label: 'seguranca', Icon: IconShieldLock },
  { label: 'infraestrutura', Icon: IconServer },
  { label: 'codigo', Icon: IconCode },
  { label: 'prompts', Icon: IconMessageBolt },
];

function SideItem({ to, Icon, label, end = false }) {
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
      <Icon size={16} />
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
      <div className="flex items-center gap-2 px-3 mb-7">
        <img src="/logo-facho.png" alt="Facho" style={{ width: '40px', height: '40px', mixBlendMode: 'multiply', objectFit: 'contain' }} />
        <span className="text-dark font-medium text-base tracking-tight">Facho</span>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        <p className="px-3 text-[10px] font-medium text-faint uppercase tracking-widest mb-1 mt-1">
          Geral
        </p>
        <SideItem to="/dashboard" Icon={IconLayoutDashboard} label="visão geral" end />
        <SideItem to="/projetos" Icon={IconFolders} label="projetos" />

        <p className="px-3 text-[10px] font-medium text-faint uppercase tracking-widest mb-1 mt-4">
          Biblioteca
        </p>
        {BIBLIOTECA_CATS.map((cat) => (
          <SideItem
            key={cat.label}
            to={`/biblioteca/${cat.label}`}
            Icon={cat.Icon}
            label={cat.label}
          />
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 mt-4 border-t border-border pt-4">
        <SideItem to="/preferencias" Icon={IconSettings} label="preferências" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm text-muted hover:bg-cream hover:text-dark transition-colors duration-100 text-left"
        >
          <IconLogout size={16} />
          <span>sair</span>
        </button>
      </div>
    </aside>
  );
}
