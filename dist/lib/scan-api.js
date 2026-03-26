// Author: Dr Hamid MADANI drmdh@msn.com
// API client for scan validation via @mostajs/net REST
/**
 * Validate a scanned QR code against the @mostajs/net server.
 * Searches for a document where codeField matches the scanned value.
 */
export async function validateScan(code, config) {
    const { serverUrl, collection = 'reservations', codeField = 'qrCode', token } = config;
    const baseUrl = serverUrl.replace(/\/$/, '');
    const headers = { 'Content-Type': 'application/json' };
    if (token)
        headers['Authorization'] = `Bearer ${token}`;
    try {
        // Search for entity with matching code
        const filter = encodeURIComponent(JSON.stringify({ [codeField]: code }));
        const res = await fetch(`${baseUrl}/api/v1/${collection}?filter=${filter}&limit=1`, { headers });
        const json = await res.json();
        const items = json.data;
        if (!Array.isArray(items) || items.length === 0) {
            return { status: 'denied', message: 'Code invalide — aucune correspondance', code };
        }
        const item = items[0];
        // Basic validation checks
        if (item.status === 'cancelled') {
            return { status: 'denied', message: 'Annulé', data: item, code };
        }
        if (item.status === 'completed' || item.boardedAt) {
            return { status: 'denied', message: 'Déjà utilisé', data: item, code };
        }
        // Date check (if flightDate exists)
        if (item.flightDate) {
            const today = new Date().toISOString().slice(0, 10);
            const itemDate = item.flightDate.slice(0, 10);
            if (itemDate !== today) {
                return { status: 'denied', message: `Prévu le ${itemDate}, pas aujourd'hui`, data: item, code };
            }
        }
        // Mark as used (PUT boardedAt + status=completed)
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
 * Test connectivity to the @mostajs/net server.
 */
export async function testConnection(config) {
    try {
        const res = await fetch(`${config.serverUrl.replace(/\/$/, '')}/health`);
        const json = await res.json();
        return { ok: true, entities: json.entities };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Connexion échouée' };
    }
}
