import type { ScannerConfig, ScanResult } from './types.js';
/**
 * Validate a scanned QR code against the @mostajs/net server.
 * Searches for a document where codeField matches the scanned value.
 */
export declare function validateScan(code: string, config: ScannerConfig): Promise<ScanResult>;
/**
 * Test connectivity to the @mostajs/net server.
 */
export declare function testConnection(config: ScannerConfig): Promise<{
    ok: boolean;
    entities?: string[];
    error?: string;
}>;
