import React, { useState } from 'react';
import type { NavPage } from './types';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import ImportDataset from './pages/ImportDataset';
import DatasetHealth from './pages/DatasetHealth';
import Processing from './pages/Processing';
import ReviewQueue from './pages/ReviewQueue';
import Tigers from './pages/Tigers';
import MovementMap from './pages/MovementMap';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { Shield } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>('overview');

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <Overview onNavigate={(p) => setActivePage(p)} />;
      case 'import':
        return <ImportDataset />;
      case 'health':
        return <DatasetHealth />;
      case 'processing':
        return <Processing />;
      case 'review':
        return <ReviewQueue />;
      case 'tigers':
        return <Tigers />;
      case 'movement':
        return <MovementMap />;
      case 'alerts':
        return <Alerts />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview onNavigate={(p) => setActivePage(p)} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 ml-64 p-8">
        {/* Top bar */}
        <div className="mb-8 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-amber-500" />
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em]">
              Preda Vision Intelligence · Pench Tiger Reserve
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-400">Offline System Active</span>
          </div>
        </div>

        {renderPage()}
      </main>
    </div>
  );
}
