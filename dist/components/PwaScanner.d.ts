import type { PwaScanConfig, ScanResult } from '../lib/types.js';
export interface PwaScannerProps extends Partial<PwaScanConfig> {
    /** If not configured, shows the config form first */
    serverUrl?: string;
    /** Custom result renderer */
    renderResult?: (result: ScanResult) => React.ReactNode;
    /** Called on each scan result */
    onResult?: (result: ScanResult) => void;
}
/**
 * Self-contained PWA QR Scanner.
 * If no serverUrl is provided, shows a config form to enter it.
 * Stores config in localStorage for persistence.
 */
export default function PwaScanner({ serverUrl: initialUrl, renderResult, onResult, ...rest }: PwaScannerProps): import("react/jsx-runtime").JSX.Element;
