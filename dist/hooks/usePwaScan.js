// Author: Dr Hamid MADANI drmdh@msn.com
// @mostajs/pwa-scan — React hook for QR scanning
'use client';
import { useState, useRef, useCallback } from 'react';
import { validateScan } from '../lib/scan-api.js';
import { playGranted, playDenied } from '../lib/audio.js';
export function usePwaScan(config) {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);
    const scannerRef = useRef(null);
    const handleScan = useCallback(async (code) => {
        setProcessing(true);
        const res = await validateScan(code, config);
        setResult(res);
        if (res.status === 'granted')
            playGranted(config.grantedFreq);
        else
            playDenied(config.deniedFreq);
        setProcessing(false);
    }, [config]);
    const startScanner = useCallback(async () => {
        setResult(null);
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const scanner = new Html5Qrcode('pwa-qr-reader');
            scannerRef.current = scanner;
            await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } }, async (decodedText) => {
                if (processing)
                    return;
                await scanner.stop();
                setScanning(false);
                await handleScan(decodedText);
            }, () => { });
            setScanning(true);
        }
        catch (err) {
            setResult({ status: 'error', message: 'Caméra: ' + (err?.message || err) });
        }
    }, [handleScan, processing]);
    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            }
            catch { }
            scannerRef.current = null;
        }
        setScanning(false);
    }, []);
    const resetResult = useCallback(() => setResult(null), []);
    const scanManual = useCallback(async (code) => {
        if (!code.trim())
            return;
        await handleScan(code.trim());
    }, [handleScan]);
    return { scanning, result, processing, startScanner, stopScanner, resetResult, scanManual };
}
