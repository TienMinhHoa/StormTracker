'use client';

import { useState, useEffect } from 'react';

interface WindDebugPanelProps {
  enabled: boolean;
  windData: any;
  loading: boolean;
}

export default function WindDebugPanel({ enabled, windData, loading }: WindDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      if (message.includes('Wind') || message.includes('wind') || 
          message.includes('🌪️') || message.includes('🎨') || 
          message.includes('✅') || message.includes('❌') ||
          message.includes('🗺️') || message.includes('📊')) {
        setLogs(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()}: ${message}`]);
      }
      originalLog.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev.slice(-19), `❌ ${new Date().toLocaleTimeString()}: ${message}`]);
      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 left-4 z-50 px-3 py-2 bg-yellow-500 text-black rounded-lg text-xs font-bold shadow-lg hover:bg-yellow-400"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 z-50 w-96 max-h-96 bg-black/90 backdrop-blur-sm rounded-lg shadow-2xl border border-yellow-500/50 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-yellow-500/50 bg-yellow-500/20">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold text-sm">🐛 Wind Layer Debug</span>
          {loading && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          )}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-yellow-400 hover:text-yellow-300"
        >
          ✕
        </button>
      </div>
      
      <div className="p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={enabled ? 'text-green-400' : 'text-red-400'}>
            {enabled ? '✓ Enabled' : '✗ Disabled'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Wind Data:</span>
          <span className={windData ? 'text-green-400' : 'text-red-400'}>
            {windData ? `✓ Loaded (${windData.width}x${windData.height})` : '✗ Not loaded'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Loading:</span>
          <span className={loading ? 'text-yellow-400' : 'text-gray-500'}>
            {loading ? '⏳ Loading...' : '✓ Ready'}
          </span>
        </div>
      </div>

      <div className="border-t border-yellow-500/50">
        <div className="p-2 bg-yellow-500/10">
          <span className="text-yellow-400 text-xs font-bold">Console Logs:</span>
        </div>
        <div className="max-h-48 overflow-y-auto p-2 space-y-1 bg-black/50 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic">No logs yet...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-green-400 break-words">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="p-2 border-t border-yellow-500/50 bg-yellow-500/10 text-center">
        <button
          onClick={() => setLogs([])}
          className="text-yellow-400 hover:text-yellow-300 text-xs font-medium"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}

