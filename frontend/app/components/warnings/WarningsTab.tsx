'use client';

import { useState } from 'react';
import { warnings } from './warningsData';
import { getColorClasses } from './warningUtils';

export default function WarningsTab() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <select className="flex-1 rounded-lg border border-gray-700 bg-[#1c2127] px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#137fec] focus:border-[#137fec] outline-none">
            <option>All Types</option>
            <option>Tropical Storm</option>
            <option>Flash Flood</option>
            <option>Tornado</option>
          </select>
          <select className="flex-1 rounded-lg border border-gray-700 bg-[#1c2127] px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#137fec] focus:border-[#137fec] outline-none">
            <option>All Severities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        {/* Warning List */}
        <div className="flex flex-col gap-3">
          {warnings.map((warning) => {
            const colors = getColorClasses(warning.color);
            const isExpanded = expandedId === warning.id;

            return (
              <div
                key={warning.id}
                className={`${colors.bg} border-l-4 ${colors.border} rounded-r-lg overflow-hidden`}
              >
                <div
                  className={`p-3 cursor-pointer ${colors.hover} transition-colors`}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : warning.id)
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-bold ${colors.text} text-sm`}>
                        {warning.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {warning.location}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {warning.time}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && warning.description && (
                  <div
                    className={`px-3 pb-3 pt-2 border-t ${colors.border}/20 animate-fadeIn`}
                  >
                    <p className="text-sm text-gray-300 mb-3">
                      {warning.description}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      Estimated Duration: {warning.duration}
                    </p>
                    <div className="flex items-center gap-2">
                      <button className="flex-1 inline-flex items-center justify-center gap-2 text-sm px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                        Share
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center gap-2 text-sm px-3 py-1.5 rounded-md bg-[#137fec] text-white hover:bg-[#137fec]/90 transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Acknowledge
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
