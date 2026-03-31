import type { ScannerConfig, ScanResult } from './types.js';
/**
 * Validate a scanned QR code.
 * Three modes:
 *   1. scanEndpoint + bodyMapper → POST custom (turnstile, any backend)
 *   2. scanEndpoint sans bodyMapper → POST { code, action: 'lookup' }
 *   3. Pas de scanEndpoint → GET /api/v1/{collection} (mode NET)
 */
export declare function validateScan(code: string, config: ScannerConfig): Promise<ScanResult>;
/**
 * Test connectivity to the server.
 */
export declare function testConnection(config: ScannerConfig): Promise<{
    ok: boolean;
    entities?: string[];
    error?: string;
}>;
