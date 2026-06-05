import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import SearchBar from './SearchBar.jsx';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="px-8 py-4 border-b border-border bg-cream">
          <SearchBar />
        </header>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
