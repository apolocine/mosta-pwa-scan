# @mostajs/pwa-scan

> PWA QR Scanner universel — fonctionne avec @mostajs/net, endpoints custom, tourniquets, ou n'importe quel backend REST.

[![npm](https://img.shields.io/npm/v/@mostajs/pwa-scan.svg)](https://www.npmjs.com/package/@mostajs/pwa-scan)

## Installation

```bash
npm install @mostajs/pwa-scan
```

## Quick Start

```tsx
import { PwaScanner } from '@mostajs/pwa-scan'

// Auto-configurable — affiche le formulaire si pas de serverUrl
export default function ScanPage() {
  return <PwaScanner />
}
```

## 3 Modes d'utilisation

### Mode NET (@mostajs/net)

Recherche directe dans une collection via l'API REST de @mostajs/net :

```tsx
<PwaScanner
  serverUrl="http://localhost:4488"
  collection="reservations"
  codeField="qrCode"
  token="jwt-token"
/>
```

### Mode Custom Endpoint

POST vers un endpoint custom. Le serveur gère toute la logique de validation :

```tsx
<PwaScanner
  serverUrl=""
  scanEndpoint="/api/scan"
  appName="Mon Scanner"
/>
// POST { code: "...", action: "lookup" } → { status, message, data }
```

### Mode Turnstile / IoT

Avec `bodyMapper` et `responseMapper` pour adapter le format à n'importe quel backend :

```tsx
<PwaScanner
  serverUrl=""
  scanEndpoint="/api/turnstiles/validate"
  gateId="GATE-01"
  deviceId="scanner-mobile-01"
  apiKey="my-secret-key"
  userAgent="MostaGare-Turnstile"
  bodyMapper={(code, config) => ({
    ticketNumber: code,
    gateId: config.gateId,
    deviceId: config.deviceId,
    timestamp: new Date().toISOString(),
  })}
  responseMapper={(json, code) => ({
    status: json.valid ? 'granted' : 'denied',
    message: json.message,
    data: json.ticketInfo,
    code,
  })}
/>
```

## Features

- **QR scanning** via caméra (`html5-qrcode`)
- **Saisie manuelle** en fallback
- **3 modes** : NET, endpoint custom, turnstile/IoT
- **Auto-config** via URL params : `?url=http://server&token=jwt&apiKey=xxx`
- **Historique offline** en localStorage
- **PWA installable** — manifest.json inclus
- **Audio feedback** — bip accordé / bip refusé
- **bodyMapper** — transforme le code scanné en body request
- **responseMapper** — transforme la réponse serveur en ScanResult
- **Auto-détection** du format réponse (`{ status }` ou `{ valid }`)

## ScannerConfig

```typescript
interface ScannerConfig {
  serverUrl: string              // URL du serveur (vide = même origine)

  // Endpoint
  scanEndpoint?: string          // POST custom (remplace /api/v1/)
  collection?: string            // Mode NET : collection (default: 'reservations')
  codeField?: string             // Mode NET : champ QR (default: 'qrCode')

  // Authentification
  token?: string                 // → Authorization: Bearer xxx
  apiKey?: string                // → x-api-key: xxx

  // Identité device
  deviceId?: string              // Identifiant device
  gateId?: string                // Identifiant gate/checkpoint
  userAgent?: string             // Custom User-Agent

  // Extensibilité
  headers?: Record<string, string>                          // Headers custom
  bodyMapper?: (code: string, config: ScannerConfig) => object   // Body custom
  responseMapper?: (json: any, code: string) => ScanResult       // Réponse custom

  // UI
  appName?: string               // Nom affiché (default: 'MostaJS Scanner')
}
```

## Headers automatiques

| Prop | Header généré |
|------|--------------|
| `token` | `Authorization: Bearer {token}` |
| `apiKey` | `x-api-key: {apiKey}` |
| `userAgent` | `User-Agent: {userAgent}` |
| `headers` | Merge additionnel (priorité max) |

## Auto-détection de réponse

Si pas de `responseMapper`, le module détecte automatiquement le format :

| Format serveur | Mapping |
|---------------|---------|
| `{ status: 'granted'\|'denied'\|'error', message, data }` | Pass-through (ScanResult natif) |
| `{ valid: true\|false, message, ticketInfo }` | `valid` → `status`, `ticketInfo` → `data` |

## PwaScannerProps

```typescript
interface PwaScannerProps extends Partial<PwaScanConfig> {
  serverUrl?: string
  renderResult?: (result: ScanResult) => React.ReactNode  // Rendu custom du résultat
  onResult?: (result: ScanResult) => void                  // Callback à chaque scan
}
```

## Hook `usePwaScan`

Pour construire votre propre UI :

```tsx
import { usePwaScan } from '@mostajs/pwa-scan'

const { scanning, result, processing, startScanner, stopScanner, resetResult, scanManual } = usePwaScan({
  serverUrl: '',
  scanEndpoint: '/api/turnstiles/validate',
  gateId: 'GATE-01',
  bodyMapper: (code, cfg) => ({ ticketNumber: code, gateId: cfg.gateId }),
  responseMapper: (json, code) => ({
    status: json.valid ? 'granted' : 'denied',
    message: json.message,
    data: json.ticketInfo,
    code,
  }),
})
```

## API directe

```tsx
import { validateScan, testConnection } from '@mostajs/pwa-scan'

// Valider un code
const result = await validateScan('QR-CODE-123', config)
// → { status: 'granted', message: '...', data: {...}, code: 'QR-CODE-123' }

// Tester la connexion
const { ok, error } = await testConnection(config)
```

## Config par priorité

1. **Props** — `<PwaScanner serverUrl="..." bodyMapper={...} />`
2. **URL params** — `?url=http://server&token=jwt&apiKey=xxx`
3. **localStorage** — persisté après premier enregistrement
4. **Config form** — affiché si aucune config trouvée

## Exemples d'intégration

### MostaGare — Scanner agent (validation ticket bus)

```tsx
<PwaScanner
  serverUrl=""
  scanEndpoint="/api/turnstiles/validate"
  gateId="WEB-AGENT"
  appName="MostaGare Agent Scanner"
  bodyMapper={(code, cfg) => ({
    ticketNumber: code,
    gateId: cfg.gateId,
    timestamp: new Date().toISOString(),
  })}
  responseMapper={(json, code) => ({
    status: json.valid ? 'granted' : 'denied',
    message: json.message,
    data: json.ticketInfo,
    code,
  })}
  renderResult={(result) => (
    <div>{result.data?.passengerName} — Siège {result.data?.seatNumber}</div>
  )}
/>
```

### SecuAccessPro — Contrôle d'accès avec face recognition

```tsx
<PwaScanner
  serverUrl=""
  scanEndpoint="/api/scan"
  appName="SecuAccess Scanner"
  faceEnabled={true}
  onResult={(result) => {
    if (result.status === 'granted' && result.data?.faceDescriptor) {
      // Lancer vérification faciale
    }
  }}
/>
```

### Booking-Baloon — Réservation via @mostajs/net

```tsx
<PwaScanner
  serverUrl="http://localhost:4488"
  collection="reservations"
  codeField="qrCode"
  token="jwt-token"
/>
```

### IoT / Tourniquet physique

```tsx
<PwaScanner
  serverUrl="https://api.gare.dz"
  scanEndpoint="/api/turnstiles/validate"
  apiKey="turnstile-secret-2024"
  userAgent="MostaGare-Turnstile"
  deviceId="turnstile-gate-A-001"
  gateId="GATE-A"
  headers={{ 'X-Firmware': 'v2.1' }}
  bodyMapper={(code, cfg) => ({
    ticketNumber: code,
    gateId: cfg.gateId,
    deviceId: cfg.deviceId,
    timestamp: new Date().toISOString(),
  })}
/>
```

## Exports

```typescript
// Components
export { PwaScanner } from '@mostajs/pwa-scan'

// Hooks
export { usePwaScan } from '@mostajs/pwa-scan'

// API
export { validateScan, testConnection } from '@mostajs/pwa-scan'

// Audio
export { playBeep, playGranted, playDenied } from '@mostajs/pwa-scan'

// Types
export type { ScannerConfig, ScanResult, PwaScanConfig, PwaScannerProps } from '@mostajs/pwa-scan'
```

## License

MIT — © 2026 Dr Hamid MADANI <drmdh@msn.com>
