import React from 'react';
import { useAppContext, AppView } from '@/contexts/AppContext';
import {
  LayoutDashboard, Map, Car, History, Hexagon, Bell, Terminal, Settings,
  Satellite, ChevronLeft, ChevronRight, LogOut, Radio, X, Plus,
} from 'lucide-react';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const Sidebar: React.FC = () => {
  const {
    currentView, setCurrentView, sidebarCollapsed, toggleSidebarCollapse,
    sidebarOpen, toggleSidebar, events, logout, wsConnected, user,
  } = useAppContext();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'device-manager', label: 'Add Device', icon: Plus },
    { id: 'playback', label: 'Playback', icon: History },
    { id: 'geofences', label: 'Geofences', icon: Hexagon },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: events.length },
    { id: 'commands', label: 'Commands', icon: Terminal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (view: AppView) => {
    setCurrentView(view);
    if (sidebarOpen) toggleSidebar();
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          flex flex-col transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          ${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center h-16 border-b border-gray-200 dark:border-gray-800 px-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Satellite className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">Walta GPS</h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-[10px] text-gray-400 font-medium">
                    {wsConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <Satellite className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
              Navigation
            </p>
          )}
          {navItems.map(item => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center gap-3 rounded-xl transition-all duration-200 relative
                  ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}
                  ${isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
                {sidebarCollapsed && item.badge && item.badge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* WebSocket Status */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 mx-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {wsConnected ? 'Live Updates' : 'Reconnecting...'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {user?.email || 'Not logged in'}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className={`border-t border-gray-200 dark:border-gray-800 p-3 ${sidebarCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-2"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>

          <button
            onClick={logout}
            className={`
              w-full flex items-center gap-2 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
              ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'}
            `}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
