export interface ScannerConfig {
    /** URL of the server (can be empty for same-origin) */
    serverUrl: string;
    /** Custom POST endpoint (replaces NET /api/v1/ mode) */
    scanEndpoint?: string;
    /** Collection to search in — NET mode only (default: 'reservations') */
    collection?: string;
    /** Field containing the QR code value — NET mode only (default: 'qrCode') */
    codeField?: string;
    /** Bearer token → Authorization: Bearer xxx */
    token?: string;
    /** API key → x-api-key: xxx */
    apiKey?: string;
    /** Device identifier (e.g., 'scanner-mobile-01') */
    deviceId?: string;
    /** Gate/checkpoint identifier (e.g., 'GATE-01') */
    gateId?: string;
    /** Custom User-Agent string (e.g., 'MostaGare-Turnstile') */
    userAgent?: string;
    /** Additional custom headers merged last (highest priority) */
    headers?: Record<string, string>;
    /** Transform scanned code into request body. Default: { code, action: 'lookup' } */
    bodyMapper?: (code: string, config: ScannerConfig) => object;
    /** Transform server response into ScanResult. Auto-detects { status } vs { valid } formats if omitted */
    responseMapper?: (json: any, code: string) => ScanResult;
    /** App name shown in UI (default: 'MostaJS Scanner') */
    appName?: string;
}
export interface ScanResult {
    status: 'granted' | 'denied' | 'error';
    message: string;
    data?: Record<string, unknown>;
    code?: string;
}
export interface PwaScanConfig extends ScannerConfig {
    /** Enable face recognition mode */
    faceEnabled?: boolean;
    /** Grant sound frequency (default: 800) */
    grantedFreq?: number;
    /** Deny sound frequency (default: 300) */
    deniedFreq?: number;
}
