
import React, { useState } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientModule from './components/ClientModule';
import ProcessModule from './components/ProcessModule';
import FinanceModule from './components/FinanceModule';
import AuthModule from './components/AuthModule';

const AppContent: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUser) {
    return <AuthModule />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'clients': return <ClientModule />;
      case 'processes': return <ProcessModule />;
      case 'finance': return <FinanceModule />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
