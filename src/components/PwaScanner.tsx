// Author: Dr Hamid MADANI drmdh@msn.com
// @mostajs/pwa-scan — Self-contained PWA scanner component
'use client'

import { useState, useEffect } from 'react'
import { usePwaScan } from '../hooks/usePwaScan.js'
import type { PwaScanConfig, ScanResult } from '../lib/types.js'
import { testConnection } from '../lib/scan-api.js'

export interface PwaScannerProps extends Partial<PwaScanConfig> {
  /** If not configured, shows the config form first */
  serverUrl?: string
  /** Custom result renderer */
  renderResult?: (result: ScanResult) => React.ReactNode
  /** Called on each scan result */
  onResult?: (result: ScanResult) => void
}

/**
 * Self-contained PWA QR Scanner.
 * If no serverUrl is provided, shows a config form to enter it.
 * Supports: NET mode, custom endpoint, turnstile, apiKey auth, bodyMapper, responseMapper.
 */
export default function PwaScanner({ serverUrl: initialUrl, renderResult, onResult, ...rest }: PwaScannerProps) {
  const [config, setConfig] = useState<PwaScanConfig>({
    serverUrl: initialUrl || '',
    collection: 'reservations',
    codeField: 'qrCode',
    appName: 'MostaJS Scanner',
    ...rest,
  })
  const [configured, setConfigured] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; entities?: string[]; error?: string } | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [history, setHistory] = useState<ScanResult[]>([])
  const [tab, setTab] = useState<'scan' | 'history' | 'config'>('scan')

  const { scanning, result, processing, startScanner, stopScanner, resetResult, scanManual } = usePwaScan(config)

  // Load config from localStorage (only UI-editable fields, not callbacks)
  useEffect(() => {
    const saved = localStorage.getItem('mostajs-pwa-scan-config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Merge saved UI fields, keep programmatic props (bodyMapper, responseMapper, etc.)
        setConfig(prev => ({ ...prev, ...parsed, ...rest }))
        setConfigured(true)
      } catch {}
    }
    if (initialUrl || rest.scanEndpoint) setConfigured(true)

    // Load history
    const savedHistory = localStorage.getItem('mostajs-pwa-scan-history')
    if (savedHistory) try { setHistory(JSON.parse(savedHistory)) } catch {}

    // Check URL params for auto-config
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get('url')
    const tokenParam = params.get('token')
    const apiKeyParam = params.get('apiKey')
    if (urlParam) {
      const autoConfig: PwaScanConfig = {
        ...config, ...rest, serverUrl: urlParam,
        ...(tokenParam ? { token: tokenParam } : {}),
        ...(apiKeyParam ? { apiKey: apiKeyParam } : {}),
      }
      setConfig(autoConfig)
      localStorage.setItem('mostajs-pwa-scan-config', JSON.stringify({
        serverUrl: urlParam, token: tokenParam, apiKey: apiKeyParam
      }))
      setConfigured(true)
    }
  }, [])

  // Save result to history
  useEffect(() => {
    if (result && result.status !== 'error') {
      const entry = { ...result, timestamp: new Date().toISOString() } as any
      const updated = [entry, ...history].slice(0, 50)
      setHistory(updated)
      localStorage.setItem('mostajs-pwa-scan-history', JSON.stringify(updated))
      onResult?.(result)
    }
  }, [result])

  async function handleTestConnection() {
    setTesting(true)
    setTestResult(null)
    const res = await testConnection(config)
    setTestResult(res)
    setTesting(false)
  }

  function saveConfig() {
    // Save only serializable UI fields (no functions)
    const { bodyMapper, responseMapper, ...serializable } = config
    localStorage.setItem('mostajs-pwa-scan-config', JSON.stringify(serializable))
    setConfigured(true)
    setTab('scan')
  }

  // ── Config Form ────────────────────────────────────
  if (!configured || tab === 'config') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', padding: 20 }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48 }}>📷</div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{config.appName}</h1>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Configuration du scanner</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>URL du serveur</label>
              <input value={config.serverUrl} onChange={e => setConfig({ ...config, serverUrl: e.target.value })}
                placeholder="http://localhost:4447" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Endpoint scan (optionnel)</label>
              <input value={config.scanEndpoint || ''} onChange={e => setConfig({ ...config, scanEndpoint: e.target.value || undefined })}
                placeholder="/api/turnstiles/validate" style={inputStyle} />
            </div>

            {/* NET mode fields — only shown when no scanEndpoint */}
            {!config.scanEndpoint && (
              <>
                <div>
                  <label style={labelStyle}>Collection</label>
                  <input value={config.collection} onChange={e => setConfig({ ...config, collection: e.target.value })}
                    placeholder="reservations" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Champ QR code</label>
                  <input value={config.codeField} onChange={e => setConfig({ ...config, codeField: e.target.value })}
                    placeholder="qrCode" style={inputStyle} />
                </div>
              </>
            )}

            {/* Auth */}
            <div>
              <label style={labelStyle}>Token Bearer (optionnel)</label>
              <input value={config.token || ''} onChange={e => setConfig({ ...config, token: e.target.value || undefined })}
                placeholder="Bearer token" type="password" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>API Key (optionnel)</label>
              <input value={config.apiKey || ''} onChange={e => setConfig({ ...config, apiKey: e.target.value || undefined })}
                placeholder="x-api-key" type="password" style={inputStyle} />
            </div>

            {/* Device identity */}
            <div>
              <label style={labelStyle}>Gate ID (optionnel)</label>
              <input value={config.gateId || ''} onChange={e => setConfig({ ...config, gateId: e.target.value || undefined })}
                placeholder="GATE-01" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Device ID (optionnel)</label>
              <input value={config.deviceId || ''} onChange={e => setConfig({ ...config, deviceId: e.target.value || undefined })}
                placeholder="scanner-01" style={inputStyle} />
            </div>
          </div>

          <button onClick={handleTestConnection} disabled={testing || (!config.serverUrl && !config.scanEndpoint)}
            style={{ width: '100%', padding: 12, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>
            {testing ? '⏳ Test...' : '🔌 Tester la connexion'}
          </button>

          {testResult && (
            <div style={{ padding: 10, borderRadius: 8, marginBottom: 8, fontSize: 13,
              backgroundColor: testResult.ok ? '#064e3b' : '#7f1d1d', color: testResult.ok ? '#6ee7b7' : '#fca5a5' }}>
              {testResult.ok ? `✅ Connecté` : `❌ ${testResult.error}`}
            </div>
          )}

          <button onClick={saveConfig} disabled={!config.serverUrl && !config.scanEndpoint}
            style={{ width: '100%', padding: 12, backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            ✓ Sauvegarder
          </button>
        </div>
      </div>
    )
  }

  // ── Main Scanner ───────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', backgroundColor: '#1e293b' }}>
        {(['scan', 'history', 'config'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t !== 'scan') stopScanner() }}
            style={{ flex: 1, padding: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              backgroundColor: tab === t ? '#0ea5e9' : '#1e293b', color: tab === t ? '#fff' : '#94a3b8' }}>
            {t === 'scan' ? '📷 Scanner' : t === 'history' ? `📋 Historique (${history.length})` : '⚙️ Config'}
          </button>
        ))}
      </div>

      {/* Scan tab */}
      {tab === 'scan' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          {!result ? (
            <>
              <div id="pwa-qr-reader" style={{ width: '100%', maxWidth: 350, aspectRatio: '1', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }} />
              {!scanning && (
                <button onClick={startScanner}
                  style={{ marginTop: 16, padding: '14px 28px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                  📷 Démarrer
                </button>
              )}
              <div style={{ marginTop: 16, display: 'flex', gap: 8, width: '100%', maxWidth: 350 }}>
                <input value={manualCode} onChange={e => setManualCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && scanManual(manualCode).then(() => setManualCode(''))}
                  placeholder="Saisie manuelle" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => scanManual(manualCode).then(() => setManualCode(''))}
                  style={{ padding: '10px 16px', backgroundColor: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer' }}>OK</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ width: '100%', maxWidth: 380, borderRadius: 20, padding: 32, textAlign: 'center',
                backgroundColor: result.status === 'granted' ? '#22c55e' : '#ef4444' }}>
                <div style={{ fontSize: 64, marginBottom: 12 }}>{result.status === 'granted' ? '✅' : '❌'}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{result.message}</div>
                {renderResult ? renderResult(result) : result.data && (
                  <div style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 13, textAlign: 'left' }}>
                    {Object.entries(result.data).filter(([k]) => !['id', 'createdAt', 'updatedAt', 'qrCode', 'boardedAt'].includes(k)).slice(0, 6).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span style={{ opacity: 0.7 }}>{k}</span>
                        <span style={{ fontWeight: 600 }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { resetResult(); startScanner() }}
                style={{ marginTop: 24, padding: '14px 28px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                🔄 Scanner suivant
              </button>
            </>
          )}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Aucun scan</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((h: any, i: number) => (
                <div key={i} style={{ padding: 12, backgroundColor: '#1e293b', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 16, marginRight: 8 }}>{h.status === 'granted' ? '✅' : '❌'}</span>
                    <span style={{ fontSize: 14 }}>{h.message}</span>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{h.code?.slice(0, 20)}{h.code?.length > 20 ? '...' : ''}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{h.timestamp?.slice(11, 19)}</div>
                </div>
              ))}
              <button onClick={() => { setHistory([]); localStorage.removeItem('mostajs-pwa-scan-history') }}
                style={{ padding: 10, backgroundColor: '#334155', color: '#94a3b8', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                Effacer l'historique
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8, border: '1px solid #334155',
  backgroundColor: '#1e293b', color: '#e2e8f0', fontSize: 14, width: '100%',
}
