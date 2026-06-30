import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projetos from './pages/Projetos.jsx';
import Projeto from './pages/Projeto.jsx';
import Biblioteca from './pages/Biblioteca.jsx';
import Categoria from './pages/Categoria.jsx';
import Preferencias from './pages/Preferencias.jsx';
import Templates from './pages/Templates.jsx';
import ContractTemplates from './pages/ContractTemplates.jsx';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projetos" element={<Projetos />} />
          <Route path="projeto/:id" element={<Projeto />} />
          <Route path="biblioteca" element={<Biblioteca />} />
          <Route path="biblioteca/:categoria" element={<Categoria />} />
          <Route path="preferencias" element={<Preferencias />} />
          <Route path="templates" element={<Templates />} />
          <Route path="contratos/modelos" element={<ContractTemplates />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
