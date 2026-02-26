import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { TRACCAR_BASE_URL, TRACCAR_WS_URL } from '@/services/traccarApi';
import {
  User, Moon, Sun, Map, Bell, Key, Globe, Palette,
  Save, Check, LogOut, Server, Wifi, Database, Mail,
  Phone, Building,
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, darkMode, toggleDarkMode, mapStyle, setMapStyle, logout, wsConnected } = useAppContext();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pushAlerts, setPushAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [overspeedAlerts, setOverspeedAlerts] = useState(true);
  const [geofenceAlerts, setGeofenceAlerts] = useState(true);
  const [batteryAlerts, setBatteryAlerts] = useState(true);
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) return;
    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  const mapStyles = [
    { id: 'streets', label: 'Streets', desc: 'Standard road map' },
    { id: 'satellite', label: 'Satellite', desc: 'Aerial imagery' },
    { id: 'terrain', label: 'Terrain', desc: 'Topographic view' },
    { id: 'dark', label: 'Dark', desc: 'Dark theme map' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500">Manage your account and application preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Profile Information</h3>
            <p className="text-xs text-gray-500">Your Traccar account details</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 text-sm text-gray-500 outline-none cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Organization</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value="Walta Pharmaceuticals"
                readOnly
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 text-sm text-gray-500 outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>User ID: <span className="font-medium text-gray-900 dark:text-white">{user?.id}</span></span>
            <span>Admin: <span className="font-medium text-gray-900 dark:text-white">{user?.administrator ? 'Yes' : 'No'}</span></span>
            <span>Device Limit: <span className="font-medium text-gray-900 dark:text-white">{user?.deviceLimit === -1 ? 'Unlimited' : user?.deviceLimit}</span></span>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveProfile}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
            <Key className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Change Password</h3>
            <p className="text-xs text-gray-500">Update your Traccar account password</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-red-500 mt-2">Passwords do not match</p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {passwordSaved ? <Check className="w-4 h-4" /> : <Key className="w-4 h-4" />}
            {passwordSaved ? 'Updated!' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
            <Palette className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Appearance</h3>
            <p className="text-xs text-gray-500">Customize the look and feel</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl mb-4">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-5 h-5 text-blue-500" /> : <Sun className="w-5 h-5 text-yellow-500" />}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Theme</p>
              <p className="text-xs text-gray-500">{darkMode ? 'Dark mode enabled' : 'Light mode enabled'}</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Map Style</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mapStyles.map(style => (
              <button
                key={style.id}
                onClick={() => setMapStyle(style.id)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  mapStyle === style.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Map className={`w-6 h-6 mx-auto mb-2 ${mapStyle === style.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <p className="text-xs font-medium text-gray-900 dark:text-white">{style.label}</p>
                <p className="text-[10px] text-gray-500">{style.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <p className="text-xs text-gray-500">Configure alert preferences</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Push Notifications', desc: 'Receive browser push notifications', value: pushAlerts, onChange: setPushAlerts },
            { label: 'Email Alerts', desc: 'Get alerts via email', value: emailAlerts, onChange: setEmailAlerts },
            { label: 'Overspeed Alerts', desc: 'Alert when vehicle exceeds speed limit', value: overspeedAlerts, onChange: setOverspeedAlerts },
            { label: 'Geofence Alerts', desc: 'Alert on geofence entry/exit', value: geofenceAlerts, onChange: setGeofenceAlerts },
            { label: 'Low Battery Alerts', desc: 'Alert when device battery is low', value: batteryAlerts, onChange: setBatteryAlerts },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() => item.onChange(!item.value)}
                className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Server Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            <Server className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Server Configuration</h3>
            <p className="text-xs text-gray-500">Traccar API connection settings</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">API Base URL</span>
            </div>
            <span className="text-sm font-mono text-gray-900 dark:text-white truncate ml-4">{TRACCAR_BASE_URL}/api</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">WebSocket URL</span>
            </div>
            <span className="text-sm font-mono text-gray-900 dark:text-white truncate ml-4">{TRACCAR_WS_URL}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Connection Status</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              wsConnected
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/50 p-5">
        <h3 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Sign Out</p>
            <p className="text-xs text-gray-500">End your current session and clear stored credentials</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
