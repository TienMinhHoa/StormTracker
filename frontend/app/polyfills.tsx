'use client';

import { useEffect } from 'react';

/**
 * Minimal polyfills for browser compatibility
 * Required for geotiff library (Buffer) and other Node.js dependencies
 */
export default function PolyfillProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Polyfill Buffer for geotiff library
    if (typeof (window as any).Buffer === 'undefined') {
      try {
        const { Buffer } = require('buffer');
        (window as any).Buffer = Buffer;
      } catch (e) {
        // Fallback minimal Buffer
        (window as any).Buffer = class Buffer {
          static from(data: any) {
            if (typeof data === 'string') {
              return new TextEncoder().encode(data);
            }
            return new Uint8Array(data);
          }
          static alloc(size: number) {
            return new Uint8Array(size);
          }
          static isBuffer(obj: any) {
            return obj instanceof Uint8Array;
          }
        };
      }
    }

    // Polyfill global reference
    if (typeof (window as any).global === 'undefined') {
      (window as any).global = window;
    }
  }, []);

  return <>{children}</>;
}
