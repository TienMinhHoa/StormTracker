'use client';

import { useState } from 'react';
import WarningTab from './WarningTab';
import WarningTable from './WarningTable';
import type { Warning } from '../../services/warningApi';

type WarningViewProps = {
  onWarningClick?: (warning: any) => void;
  externalSelectedWarning?: any;
};

export default function WarningView({ onWarningClick, externalSelectedWarning }: WarningViewProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* View Mode Toggle */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-1 bg-[#1c2127] rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2 ${
              viewMode === 'table'
                ? 'bg-teal-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Bảng
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2 ${
              viewMode === 'cards'
                ? 'bg-teal-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Thẻ
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <WarningTable onWarningClick={onWarningClick} externalSelectedWarning={externalSelectedWarning} />
      ) : (
        <WarningTab onWarningClick={onWarningClick} externalSelectedWarning={externalSelectedWarning} />
      )}
    </div>
  );
}
