import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  MapPin, Eye, EyeOff, Loader2, Shield, Satellite, Radio, ChevronRight,
} from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { login, loginError } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-blue-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          {/* Road/route lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 900">
            <path d="M100,100 Q300,200 200,400 T400,600 T600,800" stroke="white" strokeWidth="2" fill="none" strokeDasharray="8,8">
              <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M700,50 Q500,250 600,450 T350,700" stroke="white" strokeWidth="2" fill="none" strokeDasharray="8,8">
              <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.5s" repeatCount="indefinite" />
            </path>
            <path d="M50,500 Q250,350 450,500 T750,400" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="6,6">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="2s" repeatCount="indefinite" />
            </path>
          </svg>
          {/* Dot markers */}
          <div className="absolute top-[30%] left-[25%] w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
          <div className="absolute top-[55%] left-[60%] w-3 h-3 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-[70%] left-[35%] w-3 h-3 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <Satellite className="w-7 h-7 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Walta GPS</h1>
              <p className="text-blue-200 text-sm font-medium">Fleet Tracking Platform</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6">
            Real-Time Vehicle<br />
            Tracking & Fleet<br />
            Intelligence
          </h2>
          <p className="text-blue-100/80 text-lg mb-10 max-w-md leading-relaxed">
            Monitor your entire fleet in real-time. Get instant alerts, route history,
            geofencing, and remote vehicle control — all from one powerful dashboard.
          </p>

          <div className="space-y-4">
            {[
              { icon: MapPin, text: 'Live GPS tracking with real-time updates' },
              { icon: Shield, text: 'Geofencing & instant boundary alerts' },
              { icon: Radio, text: 'Remote engine control & commands' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-blue-100/90">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-cyan-300" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-14 flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">Traccar</div>
              <div className="text-xs text-blue-200">Powered By</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-xs text-blue-200">Uptime</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-xs text-blue-200">Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Satellite className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Walta GPS</h1>
              <p className="text-gray-500 text-xs">Fleet Tracking Platform</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your fleet management dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
            </div>

            {/* Error */}
            {loginError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 animate-slide-in">
                {loginError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Server info */}
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
             <p className="text-[10px] text-gray-400 mt-1">
              Use your account credentials to sign in
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Powered by Vertex Innovations
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Walta Fleet Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
