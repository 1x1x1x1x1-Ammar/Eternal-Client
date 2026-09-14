<p align="center"><img src="assets/logo.svg" width="140" alt="Eternal Client red E emblem" /></p>
<h1 align="center">ETERNAL CLIENT</h1>
<p align="center"><b>Beyond survival.</b></p>
<p align="center">A Windows-first Minecraft Java <b>launcher + real in-game client</b> with isolated instances, Microsoft/offline accounts, Modrinth, real server tools, a real diagnostics console, and Eternal Core running inside Minecraft.</p>

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
> **Eternal v1 follows one rule: visible functionality must be real.** No fake player counts, fake progress, fake partner controls, fake Minecraft launch state, or decorative controls that pretend to perform an action.

# Eternal Client v1.0.0

Eternal combines a real Minecraft launcher with a real Fabric client running inside Minecraft. Launcher and Core share the same original Eternal black/charcoal/crimson visual language while remaining separate runtime components: the same verified Core JAR can run launcher-managed or standalone.

## V1 highlights

- Premium launcher UI with responsive layouts, advanced micro-motion, real loading/error/running states and reduced-motion support.
- Full Mojang version catalog for instance creation: releases, snapshots, old beta and old alpha entries.
- Real isolated instance management: create, edit, duplicate, delete, open folder, launch, stop, playtime and running process state.
- Premium Mod Hub backed by Modrinth with version/loader filtering, real sorting/categories, pagination, dependency resolution and hash verification.
- Real Eternal Console (`Ctrl+J`) for backend operations, Minecraft stdout/debug, warnings/errors and transfer activity.
- Real Downloads center for Minecraft preparation, Modrinth transfers and Eternal updater transfers. Unknown-size work remains indeterminate instead of using fake percentages.
- Renewable Microsoft session state and a real stable GitHub updater.
- Custom Eternal Minecraft title/start menu replacing the vanilla title screen while Core is loaded.
- Crash-hardened Eternal UI opening: key-repeat suppression, Minecraft task-queue screen transitions and runtime diagnostics in `config/eternal-core.log`.
- Clean Core installs start with HUD/Zoom modules **disabled**. The player explicitly enables what they want.
- Premium Eternal Start dashboard, Modules UI, HUD Editor, live HUD, notifications and upgraded WASD + LMB/RMB keystrokes.

# Launcher → Minecraft architecture

```text
ETERNAL CLIENT v1
│
├── Launcher-managed mode
│     ↓
│  isolated Minecraft profile
│     ↓
│  validate account + Java + Minecraft version + loader
│     ↓
│  verify/repair Eternal Core metadata + SHA-256
│     ↓
│  start the real Minecraft JVM
│     ↓
│  stream install/start/log/warning/error state into Eternal Console
│     ↓
│  Eternal Core runs inside Minecraft
│
└── Standalone Core mode
      ↓
   Eternal-Core-Standalone-1.0.0.jar
      ↓
   compatible Fabric 1.21.11 mods folder
      ↓
   start Minecraft normally
      ↓
   no Eternal launcher process required
```

# Eternal Core v1

Current certified target: **Minecraft Java 1.21.11 + Fabric + Java 21**.

## Eternal Minecraft start menu

When Eternal Core is loaded, the vanilla Minecraft title screen is replaced by the original Eternal start surface. Its controls route to real Minecraft/Core destinations:

- **Singleplayer** → Minecraft world selection
- **Multiplayer** → Minecraft server browser
- **Modules** → Eternal module manager
- **HUD Editor** → draggable Eternal HUD workspace
- **Options** → Minecraft settings
- **Quit Game** → real Minecraft shutdown

The menu uses Eternal's red-E identity and premium black/crimson design direction; it does not ship Dawn assets or code.

## Default controls

| Default | Action |
|---|---|
| `Right Shift` | Open **Eternal Start** |
| `H` | Open the draggable **HUD Editor** |
| Hold `C` | Zoom, only after the Zoom module is enabled |

The Eternal bindings are rebindable in-game and persist locally. Duplicate Eternal bindings are rejected.

## Modules start OFF

A clean Eternal Core config does **not** enable HUD modules automatically. Open **Modules** from the Eternal Minecraft title screen or Eternal Start and enable only the modules you want. Existing saved user configuration is preserved.

## Real modules

| Module | Real source |
|---|---|
| Watermark | Eternal Core runtime |
| FPS | live Minecraft client FPS |
| CPS | actual left/right click events |
| Keystrokes | live WASD + LMB/RMB state and CPS |
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
| Zoom | configurable hold-key FOV; prior FOV restores on release |

## HUD Editor

The HUD Editor is a real placement workspace, not a screenshot preview:

- **Modules** button opens the module manager so hidden modules can be enabled.
- Active modules render on the actual placement canvas.
- Drag modules and see their real on-screen position.
- Snap grid supports 2/4/8 px.
- Arrow keys nudge the selected module.
- Inspector shows the selected module and coordinates.
- Default / Compact / Corners presets write real saved positions.
- Delete disables the selected module.
- Positions persist locally.

## Core diagnostics

Core writes runtime diagnostics to both Minecraft stdout/stderr and:

```text
config/eternal-core.log
```

The launcher captures Minecraft output in **Console → Minecraft**. Error/warning lines are classified and surfaced, and abnormal Minecraft exits tell you to inspect the preceding runtime lines instead of hiding the failure.

Core configuration lives at:

```text
config/eternal-core.json
```

It stores module states, HUD positions, accent, opacity, zoom FOV, snap grid, notifications and keybinds. Writes use a temporary file + atomic replacement when supported, and malformed config is backed up as `eternal-core.corrupt-<timestamp>.json`.

# Eternal Console

Open with **Ctrl+J**. Major operations open it automatically; Minecraft warnings/errors also surface it automatically.

Tabs:

- **Operations** — instance/account/mod/server/Core/settings/update backend actions
- **Minecraft** — launch lifecycle + real Minecraft stdout/debug + warnings/errors
- **Transfers** — real transfer events

Instance creation, duplication, Minecraft launch, Modrinth install, Microsoft login, server quick-join, Core export and updater download all produce backend-derived events. The console can copy visible output for bug reports.

# Real Downloads center

The Downloads page combines real backend transfer state from:

- Minecraft version/assets/library preparation
- Modrinth downloads
- Eternal stable updater downloads
- loader/Core preparation lifecycle

When bytes are available Eternal shows actual transferred bytes, total bytes and speed. When total size is unavailable, Eternal uses an indeterminate state — never a fake percentage.

# Instance system

- Each instance owns an isolated `.minecraft` tree.
- Mojang's official manifest backs the version catalog.
- Search/type releases, snapshots, old beta and old alpha entries.
- Launcher paths implemented in v1: **Vanilla + Fabric**.
- Fabric loader compatibility is resolved against Fabric metadata at launch.
- Edit name and RAM safely.
- Duplicate copies the isolated instance tree.
- Delete/duplicate are blocked while an instance is running.
- Multiple Minecraft processes are tracked by profile.

Core support is intentionally narrower than launcher version selection: Eternal Core v1 is certified for **Fabric 1.21.11** only.

# Mod Hub V1

- Real Modrinth search filtered by selected Minecraft version and loader.
- Relevance/download/follow/newest/updated sorting.
- Category facets such as optimization, utility, technology, adventure, worldgen and decoration.
- Real pagination / Load More.
- Real project download/follower/category metadata.
- Required dependency resolution.
- SHA-512/SHA-1 verification when Modrinth provides hashes.
- `.part` files are not treated as installed.
- Vanilla profiles disable mod installation instead of pretending JARs work.
- Launcher-managed Eternal Core cannot be manually removed/disabled through Mod Hub.

# Accounts, Java and servers

- Microsoft OAuth → Xbox Live → XSTS → Minecraft Services ownership flow.
- Encrypted renewable MSAL cache and pre-launch token renewal.
- Offline accounts with deterministic Minecraft-compatible UUIDs.
- Java detection/validation and required-major enforcement before launch.
- Real Minecraft server status handshake, latency, version/player count and SRV resolution.
- Modern Quick Play plus legacy server arguments where appropriate.
- Aternos standard mode stays honest: save, ping, quick join and open official dashboard; no fake privileged controls.

# Stable update channel

Settings exposes the real packaged update flow:

```text
Check → available/current/error → Download → real progress → Ready → Restart & install
```

The stable release publishes `latest.yml` alongside the installer for `electron-updater`.

# Stable release files

V1 intentionally publishes **no portable ZIP**.

```text
Eternal.Client.Setup.1.0.0.exe
Eternal-Core-Standalone-1.0.0.jar
latest.yml
SHA256SUMS.txt
```

# Release gates

`v1.0.0` is published only when the exact candidate passes:

```text
clean Java 21 Eternal Core build
        ↓
Core metadata + icon + version validation
        ↓
launcher dependency install
        ↓
source/runtime/UI regression suite
        ↓
Vite production renderer build
        ↓
Eternal Windows branding validation
        ↓
NSIS / Electron packaging
        ↓
latest.yml updater validation
        ↓
PACKAGED Eternal Client.exe --smoke-test
        ↓
standalone Core + checksums
        ↓
normal GitHub release marked latest
```

Passing these gates proves the exact source builds, packages and starts in CI. It cannot prove every GPU driver, server, Microsoft account or mod combination is bug-free, so real failures are logged and fixed instead of being hidden behind a “100% bug-free” label.

# Build locally

Requirements: Windows 10/11, Node.js 20+ (**22 recommended**) and JDK 21.

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
├─ tests/               regression/release/UI/runtime gates
├─ scripts/             build/Core/branding helpers
└─ .github/workflows/   CI + stable/beta release automation
```

> **If a control looks functional, it must perform a real action. If a capability is unavailable, Eternal disables it or explains why instead of pretending.**

<p align="center"><b>ETERNAL CLIENT v1</b><br/><i>The launcher and the client — one system.</i></p>
