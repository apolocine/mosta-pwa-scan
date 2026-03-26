// Author: Dr Hamid MADANI drmdh@msn.com
// Audio feedback for scan results
export function playBeep(freq, duration) {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, duration);
    }
    catch { }
}
export function playGranted(freq = 800) { playBeep(freq, 200); }
export function playDenied(freq = 300) { playBeep(freq, 400); }
