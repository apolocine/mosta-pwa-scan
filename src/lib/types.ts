// Author: Dr Hamid MADANI drmdh@msn.com
// @mostajs/pwa-scan — Types

export interface ScannerConfig {
  /** URL of the @mostajs/net server */
  serverUrl: string
  /** API endpoint for scan validation (default: searches by qrCode field) */
  scanEndpoint?: string
  /** Collection to search in (default: 'reservations') */
  collection?: string
  /** Field containing the QR code value (default: 'qrCode') */
  codeField?: string
  /** Bearer token for API auth */
  token?: string
  /** App name shown in UI */
  appName?: string
}

export interface ScanResult {
  status: 'granted' | 'denied' | 'error'
  message: string
  data?: Record<string, unknown>
  code?: string
}

export interface PwaScanConfig extends ScannerConfig {
  /** Enable face recognition mode */
  faceEnabled?: boolean
  /** Grant sound frequency (default: 800) */
  grantedFreq?: number
  /** Deny sound frequency (default: 300) */
  deniedFreq?: number
}
