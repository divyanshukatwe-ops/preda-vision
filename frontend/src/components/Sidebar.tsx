import React from 'react';
import type { NavPage } from '../types';
import {
  LayoutDashboard,
  Upload,
  HeartPulse,
  Cpu,
  PawPrint,
  Map,
  Bell,
  ListChecks,
  FileText,
  Settings,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const navItems: { page: NavPage; label: string; icon: React.ReactNode; active: boolean }[] = [
  { page: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} />, active: true },
  { page: 'import', label: 'Import Dataset', icon: <Upload size={20} />, active: true },
  { page: 'health', label: 'Dataset Health', icon: <HeartPulse size={20} />, active: true },
  { page: 'processing', label: 'Processing', icon: <Cpu size={20} />, active: true },
  { page: 'tigers', label: 'Tiger Intelligence', icon: <PawPrint size={20} />, active: true },
  { page: 'movement', label: 'Movement Map', icon: <Map size={20} />, active: true },
  { page: 'alerts', label: 'Alerts', icon: <Bell size={20} />, active: true },
  { page: 'review', label: 'Review Queue', icon: <ListChecks size={20} />, active: true },
  { page: 'reports', label: 'Reports', icon: <FileText size={20} />, active: true },
  { page: 'settings', label: 'Settings', icon: <Settings size={20} />, active: true },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide flex items-center gap-1.5">
              PREDA VISION
            </h1>
            <p className="text-[10px] text-amber-400 font-semibold tracking-widest uppercase">PenchGuard AI Suite</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ page, label, icon, active }) => (
            <li key={page}>
              <button
                onClick={() => onNavigate(page)}
                disabled={!active}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                  ${
                    activePage === page
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                      : active
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      : 'text-gray-600 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <span className={activePage === page ? 'text-amber-400' : ''}>{icon}</span>
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[10px] text-gray-400 font-semibold text-center">
          Pench Tiger Reserve
        </p>
        <p className="text-[10px] text-gray-500 text-center mt-0.5">
          Preda Vision Intelligence · v1.0
        </p>
      </div>
    </aside>
  );
}
