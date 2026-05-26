import { useState, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import Layout, { type Section } from './components/Layout';
import Dashboard from './components/Dashboard';
import Gastos from './components/Gastos';
import Metas from './components/Metas';
import LiquidacionSueldo from './components/LiquidacionSueldo';
import CalculadoraHorasExtras from './components/CalculadoraHorasExtras';
import LoginPage from './components/LoginPage';

export default function App() {
  const { user, loading, firebaseReady } = useAuth();
  const [section, setSection] = useState<Section>('dashboard');

  const showLogin = firebaseReady && !loading && !user;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return <LoginPage />;
  }

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <Dashboard />;
      case 'gastos': return <Gastos />;
      case 'metas': return <Metas />;
      case 'liquidacion': return <LiquidacionSueldo />;
      case 'horas-extras': return <CalculadoraHorasExtras />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout section={section} onSectionChange={setSection}>
      {renderSection()}
    </Layout>
  );
}
