<p align="center">
  <img src="public/rex-logo.png" alt="Rex" width="120" height="120" />
</p>

<h1 align="center">Rex</h1>

<p align="center">
  <strong>Desktop companion for Claude Code CLI</strong>
</p>

<p align="center">
  Monitor API usage, manage sessions, and resume conversations — all from a native dashboard.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.x-24C8D8?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Rust-stable-DEA584?style=for-the-badge&logo=rust&logoColor=black" alt="Rust" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-333?style=flat-square" alt="Platforms" />
  <img src="https://img.shields.io/badge/license-MIT-10B981?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/version-0.1.0-white?style=flat-square" alt="Version" />
</p>

---

## Overview

Rex is a native desktop app that sits alongside your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) workflow. It reads local session data, connects to the Anthropic OAuth API for usage metrics, and lets you resume any conversation in a terminal with one click.

<p align="center">
  <em>TODO: Add screenshot</em>
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **Usage Monitoring** | Real-time visualization of 5h session, 7d rolling, and Sonnet weekly rate limits with color-coded circular progress (green/yellow/red thresholds) |
| **Tray Popup** | Quick-access popup from the system tray with compact usage cards and one-click dashboard access |
| **Session Management** | Browse, search, and filter local Claude Code sessions with project context and message counts |
| **One-Click Resume** | Resume any session directly in a native terminal window |
| **Smart Notifications** | Desktop alerts when usage crosses 80%, 90%, or 100% thresholds (no duplicates on app start, only highest threshold fires) |
| **Auto-Authentication** | Detects OAuth tokens from credentials file, macOS Keychain, or environment variables with automatic refresh on expiration |
| **Theme Support** | Light, dark, and system-follow modes with full theme across dashboard and tray popup |
| **Cross-Platform** | Native traffic lights on macOS, custom titlebar on Linux/Windows, WSL support |

---

## Tech Stack

<table>
  <tr>
    <td align="center" width="96"><img src="https://skillicons.dev/icons?i=tauri" width="48" height="48" alt="Tauri" /><br><sub>Tauri 2</sub></td>
    <td align="center" width="96"><img src="https://skillicons.dev/icons?i=rust" width="48" height="48" alt="Rust" /><br><sub>Rust</sub></td>
    <td align="center" width="96"><img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" /><br><sub>React 19</sub></td>
    <td align="center" width="96"><img src="https://skillicons.dev/icons?i=ts" width="48" height="48" alt="TypeScript" /><br><sub>TypeScript</sub></td>
    <td align="center" width="96"><img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="TailwindCSS" /><br><sub>Tailwind 4</sub></td>
    <td align="center" width="96"><img src="https://skillicons.dev/icons?i=vite" width="48" height="48" alt="Vite" /><br><sub>Vite 6</sub></td>
  </tr>
</table>

**State:** Zustand 5 &nbsp;|&nbsp; **Routing:** React Router 7 &nbsp;|&nbsp; **API:** Anthropic OAuth &nbsp;|&nbsp; **Fonts:** Inter, Space Grotesk

### Rust Crates

| Crate | Purpose |
|-------|---------|
| `reqwest` | HTTP client (rustls-tls) |
| `tokio` | Async runtime (fs, process) |
| `serde` / `serde_json` | Serialization |
| `chrono` | Date/time handling |
| `dirs` | Home directory resolution |
| `tauri-plugin-store` | Persistent key-value storage |
| `tauri-plugin-shell` | Shell command execution |
| `tauri-plugin-dialog` | Native OS file dialogs |
| `tauri-plugin-notification` | Desktop notifications |
| `tauri-plugin-positioner` | Tray popup positioning |
| `objc2-app-kit` | macOS NSWindow customization |

---

## Architecture

```
src-tauri/                      Rust backend (Tauri v2)
  src/
    commands/                   Tauri IPC command handlers
      auth.rs                     OAuth token detection
      platform.rs                 OS/platform info
      sessions.rs                 Session listing and reading
      terminal.rs                 Terminal launch for resume
      tray.rs                     System tray tooltip and icon
      usage.rs                    API usage fetching
    models/                     Data structures
      session.rs                  Session metadata types
      usage.rs                    Usage response types (5h, 7d, Sonnet)
    services/                   Core business logic
      anthropic_client.rs         Anthropic API client (OAuth)
      credentials.rs              Token auto-detection (file, keychain, env)
      session_parser.rs           JSONL session file parser
      terminal_launcher.rs        Cross-platform terminal spawning
    lib.rs                      App entry, window/tray creation, macOS NSWindow config

src/                            React frontend
  components/
    connection/                 Auth flow (ConnectionForm, DirectoryPicker)
    dashboard/                  Dashboard widgets (UsageCard, SessionList)
    layout/                     App shell (Sidebar, TitleBar, AppLayout)
    ui/                         Reusable primitives (Card, Button, Badge, etc.)
  hooks/
    useAutoRefresh.ts             Periodic data refresh based on settings
    useTheme.ts                   Light/dark/system theme management
    usePlatform.ts                OS and WSL detection
  pages/
    DashboardPage.tsx             Main overview (3 usage cards + session list)
    UsagePage.tsx                 Detailed rate limit view
    HistoryPage.tsx               Full session history
    ProjectsPage.tsx              Sessions grouped by project
    SettingsPage.tsx              App configuration
    ConnectionPage.tsx            Initial auth setup
    TrayPage.tsx                  Compact tray popup (3 usage cards)
  stores/                       Zustand state management
    useUsageStore.ts              Usage data with auto token refresh on 401
    useConnectionStore.ts         Auth credentials and token management
    useSessionStore.ts            Session listing and resume
    useSettingsStore.ts           Theme, refresh interval, notifications
  services/
    api.ts                        Tauri invoke wrappers
    store.ts                      Persistent storage helpers
    notifications.ts              Threshold-based desktop notifications
```

---

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) >= 18
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) authenticated (`claude` command available)

**Platform-specific:**

| Platform | Requirements |
|----------|-------------|
| macOS | Xcode Command Line Tools |
| Linux | `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf` |
| Windows | WebView2 (bundled with Win 10+), optional WSL for Linux session support |

---

## Getting Started

```bash
# Clone
git clone <repo-url> && cd Rex

# Install frontend dependencies
npm install

# Development (opens Tauri window with hot reload)
npm run tauri dev

# Production build
npm run tauri build
```

The built app will be in `src-tauri/target/release/bundle/`.

---

## Authentication

### Automatic (recommended)

Rex auto-detects your OAuth token on first launch from:

1. `CLAUDE_CODE_OAUTH_TOKEN` environment variable
2. `~/.claude/.credentials.json` (written by `claude` CLI on login)
3. macOS Keychain (`Claude Code-credentials` entry)

When a token expires (401), Rex automatically re-detects from the file system (Claude CLI may have refreshed it). If the token is still invalid, it disconnects and redirects to the connection page.

### Manual fallback

If auto-detection fails, you can connect manually with your **Organization ID** and **Session Key**:

1. Open [console.anthropic.com](https://console.anthropic.com) in your browser
2. Navigate to **Settings > Usage**
3. Open browser **DevTools** (F12) > **Network** tab
4. Locate any request to the Anthropic API:
   - **Organization ID** — found in the **Request URL** (e.g. `.../api/organizations/<ORG_ID>/...`)
   - **Session Key** — found in the **`Set-Cookie` response header** (value of the `sessionKey` cookie)

> Credentials are stored locally via `tauri-plugin-store` and never leave your machine.

---

## Usage Monitoring

Rex tracks three Anthropic rate limits:

| Limit | Color | Description |
|-------|-------|-------------|
| **Session (5h)** | Green | 5-hour sliding window session limit |
| **Weekly (7d)** | Purple | 7-day rolling aggregate limit |
| **Sonnet (7d)** | Blue | 7-day Sonnet model-specific limit |

Circular progress indicators change color at thresholds:
- **< 80%** — Card accent color (green/purple/blue)
- **>= 80%** — Yellow (warning)
- **>= 90%** — Red (critical)

Desktop notifications fire once per threshold (80%, 90%, 100%) and suppress duplicates on app startup.

---

## Session Resume

Clicking **Resume** on any session opens a native terminal running `claude --resume <session-id>`:

| OS | Method |
|----|--------|
| **macOS** | Writes a temp `.command` script, opens via `open` (Terminal.app) |
| **Linux** | Tries `x-terminal-emulator`, `gnome-terminal`, `konsole`, `xfce4-terminal`, `xterm` |
| **Windows** | `wt.exe` (Windows Terminal) or `cmd.exe`; WSL mode available |

---

## License

MIT
