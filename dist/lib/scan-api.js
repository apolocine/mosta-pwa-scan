// Author: Dr Hamid MADANI drmdh@msn.com
// API client for scan validation — supports NET, custom endpoint, turnstile, etc.
/**
 * Build headers from config: Content-Type, Authorization, x-api-key, User-Agent, custom headers.
 */
function buildHeaders(config) {
    const h = { 'Content-Type': 'application/json' };
    if (config.token)
        h['Authorization'] = `Bearer ${config.token}`;
    if (config.apiKey)
        h['x-api-key'] = config.apiKey;
    if (config.userAgent)
        h['User-Agent'] = config.userAgent;
    // Custom headers override everything
    if (config.headers)
        Object.assign(h, config.headers);
    return h;
}
/**
 * Default body mapper for scanEndpoint mode.
 */
function defaultBodyMapper(code, _config) {
    return { code, action: 'lookup' };
}
/**
 * Default response mapper — auto-detects format:
 * - { status: 'granted'|'denied'|'error', message, data } → ScanResult (pass-through)
 * - { valid: boolean, message, ticketInfo } → mapped to ScanResult (turnstile format)
 */
function defaultResponseMapper(json, code) {
    // Format ScanResult natif (status string)
    if (typeof json.status === 'string' && ['granted', 'denied', 'error'].includes(json.status)) {
        return { status: json.status, message: json.message || '', data: json.data, code };
    }
    // Format Turnstile (valid boolean)
    if (typeof json.valid === 'boolean') {
        return {
            status: json.valid ? 'granted' : 'denied',
            message: json.message || (json.valid ? 'Validé' : 'Refusé'),
            data: json.ticketInfo || json.data,
            code,
        };
    }
    // Format inconnu
    return { status: 'error', message: json.message || json.error || 'Réponse invalide', code };
}
/**
 * Validate a scanned QR code.
 * Three modes:
 *   1. scanEndpoint + bodyMapper → POST custom (turnstile, any backend)
 *   2. scanEndpoint sans bodyMapper → POST { code, action: 'lookup' }
 *   3. Pas de scanEndpoint → GET /api/v1/{collection} (mode NET)
 */
export async function validateScan(code, config) {
    const { serverUrl, scanEndpoint, collection = 'reservations', codeField = 'qrCode' } = config;
    const baseUrl = serverUrl.replace(/\/$/, '');
    const headers = buildHeaders(config);
    const mapResponse = config.responseMapper || defaultResponseMapper;
    try {
        // ── Mode Custom Endpoint (POST) ──
        if (scanEndpoint) {
            const url = scanEndpoint.startsWith('http') ? scanEndpoint : `${baseUrl}${scanEndpoint}`;
            const mapBody = config.bodyMapper || defaultBodyMapper;
            const body = mapBody(code, config);
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            const json = await res.json();
            return mapResponse(json, code);
        }
        // ── Mode NET (default) ──
        const filter = encodeURIComponent(JSON.stringify({ [codeField]: code }));
        const res = await fetch(`${baseUrl}/api/v1/${collection}?filter=${filter}&limit=1`, { headers });
        const json = await res.json();
        const items = json.data;
        if (!Array.isArray(items) || items.length === 0) {
            return { status: 'denied', message: 'Code invalide — aucune correspondance', code };
        }
        const item = items[0];
        if (item.status === 'cancelled') {
            return { status: 'denied', message: 'Annulé', data: item, code };
        }
        if (item.status === 'completed' || item.boardedAt) {
            return { status: 'denied', message: 'Déjà utilisé', data: item, code };
        }
        if (item.flightDate) {
            const today = new Date().toISOString().slice(0, 10);
            const itemDate = item.flightDate.slice(0, 10);
            if (itemDate !== today) {
                return { status: 'denied', message: `Prévu le ${itemDate}, pas aujourd'hui`, data: item, code };
            }
        }
        // Mark as used
        try {
            await fetch(`${baseUrl}/api/v1/${collection}/${item.id}`, {
                method: 'PUT', headers,
                body: JSON.stringify({ boardedAt: new Date().toISOString(), status: 'completed' }),
            });
        }
        catch { }
        return { status: 'granted', message: 'Validé', data: item, code };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur réseau';
        return { status: 'error', message: msg, code };
    }
}
/**
 * Test connectivity to the server.
 */
export async function testConnection(config) {
    try {
        const headers = buildHeaders(config);
        const baseUrl = config.serverUrl.replace(/\/$/, '');
        // Try scanEndpoint health or /health
        const url = config.scanEndpoint
            ? (config.scanEndpoint.startsWith('http') ? config.scanEndpoint : `${baseUrl}${config.scanEndpoint}`)
            : `${baseUrl}/health`;
        const res = await fetch(url, { method: 'GET', headers });
        const json = await res.json();
        return { ok: res.ok, entities: json.entities };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Connexion échouée' };
    }
}
