import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import LoginScreen from './gps/LoginScreen';
import Sidebar from './gps/Sidebar';
import Header from './gps/Header';
import Dashboard from './gps/Dashboard';
import LiveMap from './gps/LiveMap';
import VehicleList from './gps/VehicleList';
import VehicleDetails from './gps/VehicleDetails';
import PlaybackHistory from './gps/PlaybackHistory';
import Geofences from './gps/Geofences';
import Alerts from './gps/Alerts';
import Commands from './gps/Commands';
import Settings from './gps/Settings';
import DeviceManager from './gps/DeviceManager';
import { Loader2, Satellite } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { isAuthenticated, currentView, sidebarCollapsed, checkingSession, loading, apiError } = useAppContext();

  // Show loading spinner while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <Satellite className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Connecting to server...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'map':
        return <LiveMap />;
      case 'vehicles':
        return <VehicleList />;
      case 'vehicle-detail':
        return <VehicleDetails />;
      case 'playback':
        return <PlaybackHistory />;
      case 'geofences':
        return <Geofences />;
      case 'alerts':
        return <Alerts />;
      case 'commands':
        return <Commands />;
      case 'settings':
        return <Settings />;
      case 'device-manager':
        return <DeviceManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Header */}
        <Header />

        {/* API Error Banner */}
        {apiError && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-600 dark:text-red-400 text-center">
            {apiError}
          </div>
        )}

        {/* Page Content */}
        <main className={`${currentView === 'map' ? '' : 'overflow-y-auto'}`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
