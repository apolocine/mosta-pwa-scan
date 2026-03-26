// @mostajs/pwa-scan — PWA QR Scanner for @mostajs apps
// Author: Dr Hamid MADANI drmdh@msn.com

// Components
export { default as PwaScanner } from './components/PwaScanner.js'
export type { PwaScannerProps } from './components/PwaScanner.js'

// Hooks
export { usePwaScan } from './hooks/usePwaScan.js'
export type { UsePwaScanReturn } from './hooks/usePwaScan.js'

// API
export { validateScan, testConnection } from './lib/scan-api.js'

// Audio
export { playBeep, playGranted, playDenied } from './lib/audio.js'

// Types
export type { ScannerConfig, ScanResult, PwaScanConfig } from './lib/types.js'
