<p align="center"><img src="assets/logo.svg" width="140" alt="Eternal Client red E emblem" /></p>
<h1 align="center">ETERNAL CLIENT</h1>
<p align="center"><b>Beyond survival.</b></p>
<p align="center">A Windows-first Minecraft Java <b>launcher + real in-game client</b> with isolated instances, Microsoft/offline accounts, Modrinth, real server tools, and Eternal Core running inside Minecraft.</p>

<p align="center">
<img alt="version" src="https://img.shields.io/badge/version-v1.0.0-EA272D?style=for-the-badge" />
<img alt="release" src="https://img.shields.io/badge/channel-STABLE-58ED89?style=for-the-badge" />
<img alt="windows" src="https://img.shields.io/badge/Windows-10%20%2F%2011-111111?style=for-the-badge&logo=windows11" />
<img alt="core" src="https://img.shields.io/badge/Eternal_Core-Standalone%20%2B%20Launcher-FF3338?style=for-the-badge" />
<img alt="minecraft" src="https://img.shields.io/badge/Core-Minecraft%201.21.11%20Fabric-39D676?style=for-the-badge" />
</p>
<p align="center"><a href="../../actions/workflows/ci.yml"><img src="../../actions/workflows/ci.yml/badge.svg" alt="Eternal CI" /></a></p>

<p align="center"><img src="assets/release-banner.svg" width="100%" alt="Eternal Client" /></p>

> [!IMPORTANT]
> **Eternal v1 is built around one rule: visible functionality must be real.** No fake player counts, fake progress, fake partner controls, fake Minecraft launch state, or decorative buttons that pretend to perform an action.

# Eternal Client v1.0.0

The first stable Eternal release combines a real Minecraft launcher with a real Fabric client that runs inside Minecraft. The launcher and Core share the same black/charcoal/crimson visual language, but they are separate runtime components: Core also works as a standalone mod with no Eternal launcher process required.

## What v1 adds over the beta line

- Stable `1.0.0` launcher and Core versioning.
- Premium final launcher visual layer with advanced micro-interactions, responsive behavior, accessibility/reduced-motion support, cinematic launch surface, richer instances, Mod Hub, server/account/settings surfaces and real update UI.
- Renewable Microsoft session state: valid device-code sessions store encrypted MSAL cache data and attempt silent token renewal before launch instead of immediately forcing a new login when the Minecraft token expires.
- Real stable GitHub updater: check, download, progress, ready state and restart/install are wired through Electron IPC to Settings.
- Single-instance Windows behavior and safer external-link handling.
- Eternal Core v1 expanded live telemetry: Health, Armor, Food and Server modules join FPS, CPS, Ping, Coordinates, Speed, Direction, Memory, Session, Clock, Keystrokes and Watermark.
- Rebuilt in-game ClickGUI v1 with 3-column module control, animated section/open details, real toggles, real key rebinding, zoom controls, style presets and HUD-editor launch.
- Premium live HUD details and animated Core notifications remain backed by actual Minecraft/JVM state.
- Core config writes use a temporary file + atomic replacement when supported; invalid config is backed up rather than silently swallowed.
- Stable release pipeline rebuilds Core and launcher, validates Core metadata/icon/version, runs tests, packages Windows, launches the packaged EXE in smoke-test mode, verifies updater metadata, creates checksums and publishes a normal GitHub release.

## Launcher + Core architecture

```text
ETERNAL CLIENT v1
│
├── Launcher-managed mode
│     ↓
│  isolated Minecraft profile
│     ↓
│  validate account + renewable session + Java + version/loader
│     ↓
│  metadata + SHA-256 verify/repair Eternal Core
│     ↓
│  start the real Minecraft JVM
│     ↓
│  Eternal Core runs inside Minecraft
│
└── Standalone Core mode
      ↓
   Eternal-Core-Standalone-1.0.0.jar
      ↓
   Fabric 1.21.11 mods folder
      ↓
   start Minecraft normally
      ↓
   no Eternal launcher process required
```

The launcher-managed and standalone modes use the **same verified Core binary**.

# Eternal Core v1

Current certified Core target: **Minecraft Java 1.21.11 + Fabric + Java 21**.

### Default controls

| Default | Action |
|---|---|
| `Right Shift` | Open Eternal Core ClickGUI |
| `H` | Open the draggable HUD Editor |
| Hold `C` | Zoom using the configured FOV |

All three Eternal bindings are rebindable in-game and persist locally. Duplicate Eternal bindings are rejected.

### Real modules

| Module | Source |
|---|---|
| Watermark | Eternal Core runtime |
| FPS | live Minecraft client FPS |
| CPS | actual left/right click activity |
| Keystrokes | live WASD state |
| Coordinates | current player XYZ |
| Ping | current player-list latency |
| Speed | horizontal player movement |
| Direction | current player yaw direction |
| Health | current/max player health |
| Armor | live armor points |
| Food | live hunger level |
| Server | current server address or local-world state |
| Memory | JVM heap usage |
| Session | elapsed Core runtime |
| Clock | local 24-hour clock |
| Zoom | configurable hold-key FOV; previous FOV restores on release |

Core configuration lives at:

```text
config/eternal-core.json
```

It stores module states, HUD positions, accent, opacity, zoom FOV, snap grid, notifications and keybinds. V1 backs up malformed config and uses atomic replacement when supported to reduce config corruption risk.

# Real launcher functions

- Isolated per-profile `.minecraft` directories.
- Official Mojang release metadata for version selection and instance validation.
- Real Vanilla + Fabric launch paths; unsupported loaders are not advertised.
- Multiple Minecraft child processes per profile.
- Microsoft OAuth → Xbox Live → XSTS → Minecraft Services ownership flow.
- Encrypted renewable Microsoft session cache and pre-launch token renewal.
- Offline accounts with Minecraft-compatible deterministic UUIDs.
- Java discovery and runtime/version validation before launch.
- Modrinth search/install filtered by actual Minecraft version + loader.
- Required Modrinth dependency resolution plus SHA-512/SHA-1 verification when supplied.
- Launcher-managed Core protection, metadata validation and SHA-256 repair.
- Minecraft protocol server status, latency, real player counts and standard SRV resolution.
- Modern Quick Play plus legacy server launch arguments where appropriate.
- Real launch/download activity state instead of random/fake progress.
- Single-instance Electron lifecycle and packaged EXE startup smoke testing.
- Stable GitHub update check/download/install flow.
- NSIS installer, portable build, standalone Core JAR, updater metadata and SHA-256 checksums.

# UI / UX

Eternal uses its own red-E identity and original code/assets while targeting the dense premium feel of modern Minecraft clients:

- cinematic black/charcoal/crimson launcher
- strong visual hierarchy and compact desktop spacing
- animated Eternal emblem, status pulses and controlled micro-motion
- real loading/error/empty/running/downloading/update states
- richer instance, Mod Hub, server and account cards
- keyboard command center (`Ctrl + K`)
- matching ClickGUI, HUD, HUD Editor and notifications in Minecraft
- responsive layouts down to the launcher's supported minimum size
- reduced-motion support for nonessential motion

The desktop Core page is intentionally a documentation/status surface. **Actual game controls stay inside Minecraft** so the launcher never pretends to edit an in-game HUD.

# Stable update channel

The Windows build contains a GitHub update provider for this repository. Settings exposes real actions for:

```text
Check → Download → progress → Ready → Restart & install
```

The stable release publishes `latest.yml` alongside the installer so `electron-updater` can resolve the current release.

# Aternos

Eternal supports legitimate standard-mode behavior without pretending to have partner-only access:

- save an Aternos address
- real Minecraft status/ping
- quick join
- open the official Aternos dashboard

Start/stop/console controls are not presented as working without an authorized Aternos API.

# Stable release gates

`v1.0.0` is published only after the stable workflow passes:

```text
Core clean Gradle build
        ↓
Core metadata + embedded icon + version validation
        ↓
launcher dependency install
        ↓
source/runtime regression suite
        ↓
Vite production build
        ↓
Eternal Windows branding checks
        ↓
NSIS / Electron packaging
        ↓
latest.yml updater metadata validation
        ↓
PACKAGED Eternal Client.exe startup smoke test
        ↓
portable ZIP + standalone Core JAR + SHA256SUMS
        ↓
normal GitHub release marked latest
```

Passing those gates proves the project builds, packages and starts under CI. Real-world hardware/server/account combinations can still expose bugs, so issues should be reported instead of hidden behind a “100% bug-free” claim.

# Build locally

Requirements: Windows 10/11, Node.js 20+ (**22 recommended**), JDK 21.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\RUN-DEV-WINDOWS.ps1
```

Verified package build:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\BUILD-WINDOWS.ps1
```

# Repository map

```text
Eternal-Client/
├─ electron/            Electron launcher backend
├─ src/                 React launcher UI
├─ eternal-core/        standalone + launcher-managed Fabric client
├─ assets/              Eternal branding
├─ tests/               regression/release/UI tests
├─ scripts/             build/Core/branding helpers
└─ .github/workflows/   CI + stable/beta release automation
```

# Certified scope

- Eternal Core v1 is certified for **Fabric 1.21.11**.
- Launcher profile paths currently implemented: **Vanilla + Fabric**.
- Microsoft login requires your own Entra/Azure public-client application ID.
- Other loaders/Core Minecraft versions are added only after their launch/runtime paths are implemented and tested.

> **If a button looks functional, it must perform a real action. If a feature is unavailable, Eternal disables it or explains why instead of pretending.**

<p align="center"><b>ETERNAL CLIENT v1</b><br/><i>Bigger. Faster. Better.</i></p>
