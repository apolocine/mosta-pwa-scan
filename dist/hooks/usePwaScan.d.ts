import type { ScanResult, PwaScanConfig } from '../lib/types.js';
export interface UsePwaScanReturn {
    scanning: boolean;
    result: ScanResult | null;
    processing: boolean;
    startScanner: () => Promise<void>;
    stopScanner: () => Promise<void>;
    resetResult: () => void;
    scanManual: (code: string) => Promise<void>;
}
export declare function usePwaScan(config: PwaScanConfig): UsePwaScanReturn;
