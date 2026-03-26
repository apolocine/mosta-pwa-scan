# @mostajs/pwa-scan

> PWA QR Scanner for @mostajs apps — installable, configurable, works with any @mostajs/net server.

[![npm](https://img.shields.io/npm/v/@mostajs/pwa-scan.svg)](https://www.npmjs.com/package/@mostajs/pwa-scan)

## Quick Start

```bash
npm install @mostajs/pwa-scan
```

```tsx
import { PwaScanner } from '@mostajs/pwa-scan'

// Auto-configurable — shows config form if no serverUrl
export default function ScanPage() {
  return <PwaScanner />
}

// Pre-configured
export default function ScanPage() {
  return <PwaScanner serverUrl="http://localhost:4488" collection="reservations" codeField="qrCode" />
}
```

## Features

- **QR scanning** via camera (`html5-qrcode`)
- **Manual code entry** for fallback
- **Auto-config** via URL params: `?url=http://server:4488&token=jwt`
- **Offline history** stored in localStorage
- **PWA installable** — manifest.json included
- **Audio feedback** — granted (high beep) / denied (low beep)
- **Configurable** — collection, codeField, token, appName
- **Works with any @mostajs/net server**

## Config Methods

1. **URL params** — `https://app.com/scan?url=http://server:4488&token=jwt`
2. **localStorage** — persisted after first config
3. **Props** — `<PwaScanner serverUrl="..." />`
4. **Config form** — shown if no config found

## Hook

```tsx
import { usePwaScan } from '@mostajs/pwa-scan'

const { scanning, result, startScanner, stopScanner, scanManual } = usePwaScan({
  serverUrl: 'http://localhost:4488',
  collection: 'reservations',
  codeField: 'qrCode',
})
```

## License

MIT — © 2026 Dr Hamid MADANI <drmdh@msn.com>
