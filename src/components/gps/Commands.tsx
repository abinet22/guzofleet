import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  Terminal, Car, Power, Lock, Unlock, MapPin, Send, Check, X,
  Loader2, Clock, AlertTriangle, ChevronDown, Search, Zap,
  ShieldAlert, Radio,
} from 'lucide-react';
import { CommandType, timeAgoString } from '@/data/gpsData';

interface CommandOption {
  type: CommandType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  dangerous?: boolean;
}

const commandOptions: CommandOption[] = [
  { type: 'engineStop', label: 'Cut Engine', description: 'Remotely stop the vehicle engine', icon: Power, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20', dangerous: true },
  { type: 'engineResume', label: 'Resume Engine', description: 'Allow engine to start again', icon: Zap, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  { type: 'lockDoors', label: 'Lock Doors', description: 'Remotely lock all vehicle doors', icon: Lock, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { type: 'unlockDoors', label: 'Unlock Doors', description: 'Remotely unlock all vehicle doors', icon: Unlock, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { type: 'locate', label: 'Request Location', description: 'Force a GPS position update', icon: MapPin, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
];

const Commands: React.FC = () => {
  const { devices, positions, commandHistory, sendCommand, selectedDeviceId, setSelectedDeviceId } = useAppContext();
  const [selectedDevice, setSelectedDevice] = useState<number | null>(selectedDeviceId);
  const [confirmCommand, setConfirmCommand] = useState<CommandType | null>(null);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.attributes.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const device = devices.find(d => d.id === selectedDevice);

  const handleSendCommand = async (type: CommandType) => {
    if (!selectedDevice) return;
    setSending(true);
    sendCommand(selectedDevice, type);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setConfirmCommand(null);
  };

  const deviceCommands = commandHistory.filter(c => !selectedDevice || c.deviceId === selectedDevice);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Command Center</h2>
        <p className="text-sm text-gray-500">Send remote commands to your fleet vehicles</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Vehicle Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Select Vehicle</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search vehicles..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredDevices.map(d => {
              const isSelected = selectedDevice === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDevice(d.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    d.status === 'online' ? 'bg-green-100 dark:bg-green-900/30' :
                    d.status === 'idle' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <Car className={`w-4 h-4 ${
                      d.status === 'online' ? 'text-green-600' :
                      d.status === 'idle' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{d.name}</p>
                    <p className="text-[10px] text-gray-500">{d.attributes.licensePlate}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    d.status === 'online' ? 'bg-green-500' :
                    d.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Commands */}
        <div className="xl:col-span-2 space-y-6">
          {/* Selected vehicle info */}
          {device && (
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Car className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{device.name}</h3>
                  <p className="text-blue-100 text-sm">{device.model} - {device.attributes.licensePlate}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-xs text-blue-100">{device.status.toUpperCase()}</span>
                    <span className="text-xs text-blue-200">- Driver: {device.attributes.driver}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Command Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {commandOptions.map(cmd => {
              const Icon = cmd.icon;
              const isConfirming = confirmCommand === cmd.type;
              return (
                <div
                  key={cmd.type}
                  className={`bg-white dark:bg-gray-800 rounded-xl border p-4 transition-all ${
                    isConfirming
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-100 dark:border-gray-700 hover:shadow-md'
                  } ${!selectedDevice ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${cmd.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${cmd.color}`} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{cmd.label}</h4>
                  <p className="text-xs text-gray-500 mb-4">{cmd.description}</p>

                  {isConfirming ? (
                    <div className="space-y-2">
                      {cmd.dangerous && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                          <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">This action will stop the engine!</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendCommand(cmd.type)}
                          disabled={sending}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          {sending ? 'Sending...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmCommand(null)}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCommand(cmd.type)}
                      className={`w-full py-2.5 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                        cmd.dangerous
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      Send Command
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Command History */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Command History</h3>
            {deviceCommands.length > 0 ? (
              <div className="space-y-2">
                {deviceCommands.slice(0, 10).map(cmd => {
                  const d = devices.find(dev => dev.id === cmd.deviceId);
                  return (
                    <div key={cmd.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        cmd.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/30' :
                        cmd.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' :
                        'bg-yellow-100 dark:bg-yellow-900/30'
                      }`}>
                        {cmd.status === 'delivered' ? <Check className="w-4 h-4 text-green-600" /> :
                         cmd.status === 'failed' ? <X className="w-4 h-4 text-red-600" /> :
                         <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{cmd.description}</p>
                        <p className="text-xs text-gray-500">{d?.name || `Device #${cmd.deviceId}`}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          cmd.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          cmd.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {(cmd.status || 'pending').toUpperCase()}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {cmd.sentTime ? timeAgoString(cmd.sentTime) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No commands sent yet</p>
                <p className="text-xs mt-1">Select a vehicle and send a command</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Commands;
