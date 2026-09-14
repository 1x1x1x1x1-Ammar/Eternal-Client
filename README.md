<p align="center"><img src="assets/logo.svg" width="140" alt="Eternal Client red E emblem" /></p>
<h1 align="center">ETERNAL CLIENT</h1>
<p align="center"><b>Beyond survival.</b></p>
<p align="center">A Windows-first Minecraft Java <b>launcher + real in-game client</b> with isolated instances, Microsoft/offline accounts, Modrinth, real server tools, a real diagnostics console, real transfer telemetry, and Eternal Core inside Minecraft.</p>

<p align="center">
<img alt="version" src="https://img.shields.io/badge/version-v1.0.1-EA272D?style=for-the-badge" />
<img alt="release" src="https://img.shields.io/badge/channel-STABLE-58ED89?style=for-the-badge" />
<img alt="windows" src="https://img.shields.io/badge/Windows-10%20%2F%2011-111111?style=for-the-badge&logo=windows11" />
<img alt="core" src="https://img.shields.io/badge/Eternal_Core-Standalone%20%2B%20Launcher-FF3338?style=for-the-badge" />
<img alt="minecraft" src="https://img.shields.io/badge/Core-Minecraft%201.21.11%20Fabric-39D676?style=for-the-badge" />
</p>
<p align="center"><a href="../../actions/workflows/ci.yml"><img src="../../actions/workflows/ci.yml/badge.svg" alt="Eternal CI" /></a></p>

<p align="center"><img src="assets/release-banner.svg" width="100%" alt="Eternal Client" /></p>

> [!IMPORTANT]
> **If a control looks functional, it must perform a real action.** Eternal does not use fake percentages, fake server/player counts, fake partner controls, fake Minecraft runtime state, or decorative controls pretending to work.

# Eternal Client v1.0.1

Eternal combines a real Minecraft launcher with a real Fabric in-game client. Launcher and Core share Eternal's original black/charcoal/crimson design system while remaining separate runtime components. The same verified Core JAR works launcher-managed or standalone.

v1.0.1 is a stability hotfix built from real user testing. It specifically hardens the packaged Minecraft launch engine and the in-game Right Shift / Eternal Start path while preserving the premium launcher and Core UI work from v1.

## What v1.0.1 fixes

- Loads `minecraft-launcher-core` through Node's native CommonJS bridge, avoiding packaged Electron namespace issues that could surface as a vague **Client** error.
- Runtime CI now constructs a real MCLC `Client` and verifies its launch/event API before release.
- Pre-JVM launch failures, Minecraft warnings/errors and abnormal exits are surfaced in **Eternal Console**.
- Instance profiles persist Mojang's actual version type (`release`, `snapshot`, `old_beta`, `old_alpha`) instead of forcing everything to `release`.
- Right Shift screen opening remains queued and non-reentrant; repeated key events are ignored.
- Eternal in-world screens use their own safe background path rather than depending on vanilla menu blur/background behavior.
- Eternal Start has a guarded renderer and **Safe Mode fallback** that records the actual problem to `config/eternal-core.log`.
- Clean Core configs still start with modules **OFF** until the player chooses them.

# Launcher → Minecraft

```text
ETERNAL CLIENT v1.0.1
│
├── Launcher-managed mode
│     ↓
│  isolated Minecraft instance
│     ↓
│  validate account + Java + Mojang version + loader
│     ↓
│  verify/repair Eternal Core metadata + SHA-256
│     ↓
│  load verified minecraft-launcher-core Client
│     ↓
│  start the real Minecraft JVM
│     ↓
│  stream downloads / stdout / warnings / errors into Eternal
│     ↓
│  Eternal Core runs inside Minecraft
│
└── Standalone Core mode
      ↓
   Eternal-Core-Standalone-1.0.1.jar
      ↓
   Fabric 1.21.11 mods folder
      ↓
   start Minecraft normally
      ↓
   no Eternal launcher process required
```

# Premium launcher

Eternal is designed as a desktop client rather than a generic settings dashboard:

- cinematic Eternal Home / launch surface
- compact black/charcoal/crimson navigation
- Eternal red-E branding throughout the packaged app
- route transitions, hover/pressed/loading/running/error states and controlled micro-motion
- responsive window layouts and reduced-motion support
- real account, instance, Mod Hub, server, Core, Downloads, Developer and Settings pages
- `Ctrl + K` command center
- `Ctrl + J` operation/runtime console

The UI consumes backend state; visual polish is not allowed to invent runtime data.

# Instances

Eternal uses isolated per-profile `.minecraft` trees.

- Mojang's complete official version manifest backs selection.
- Browse/search releases, snapshots, old beta and old alpha entries.
- Persist the real Mojang version type into the instance.
- Vanilla + Fabric are the launch paths implemented today.
- Fabric compatibility is resolved from Fabric metadata when launching.
- Edit instance name and RAM.
- Duplicate isolated files into a separate profile.
- Delete/duplicate are blocked while a profile is running.
- Real last-played, playtime and process state.
- Multiple running Minecraft processes are tracked by profile.

Eternal Core support is intentionally narrower than launcher version selection: the current Core build targets **Fabric 1.21.11**.

# Mod Hub

The Mod Hub is backed by live Modrinth data rather than a hard-coded showcase.

- search filtered by selected Minecraft version + loader
- relevance, downloads, follows, newest and recently-updated sorting
- real Modrinth category facets
- real Load More pagination
- project downloads/follows/categories from Modrinth
- recursive required-dependency resolution
- SHA-512 / SHA-1 verification when supplied
- `.part` transfers never count as installed
- Vanilla instances disable mod installation rather than pretending JARs load
- launcher-managed Eternal Core cannot be removed/disabled from Mod Hub

# Eternal Console

Open with **Ctrl + J**.

### Operations
Real instance, account, mod, server, Core, settings and updater actions.

### Minecraft
Real launch lifecycle, stdout/debug output, warnings/errors and process-exit state.

### Transfers
Real Minecraft, Modrinth and updater transfer events.

Major operations can open the console automatically. Runtime failures are classified and can surface the console automatically. Visible output can be copied for bug reports.

# Downloads

Downloads is a real transfer center, not a fake progress animation.

- Minecraft preparation/download events from the launcher pipeline
- Modrinth transferred/total bytes where available
- Eternal updater bytes + speed
- real session transfer history
- All / Active / Complete / Errors filters
- indeterminate UI when total size is unknown

No measurable total = no invented percentage.

# Accounts / Java / Servers

- Microsoft OAuth → Xbox Live → XSTS → Minecraft Services ownership flow
- encrypted renewable MSAL session cache + silent renewal before launch
- offline accounts with deterministic Minecraft-compatible UUIDs
- Java detection/validation + required-major enforcement before launch
- real Minecraft status handshake, latency, protocol/version/player count and SRV resolution
- modern Quick Play plus legacy server arguments when required
- honest Aternos standard mode: save/ping/join/open dashboard, without fake privileged controls

# Eternal Core v1.0.1

Automated target: **Minecraft Java 1.21.11 + Fabric + Java 21**.

## Custom Eternal Minecraft start menu

With Core loaded, the vanilla title screen is replaced by an original Eternal premium menu. Its controls route to real destinations:

- **Singleplayer** → Minecraft world selection
- **Multiplayer** → Minecraft server browser
- **Modules** → Eternal module manager
- **HUD Editor** → Eternal HUD placement workspace
- **Options** → Minecraft settings
- **Quit Game** → Minecraft shutdown

The visual direction uses Eternal's own red-E identity and original implementation.

## In-game Eternal Start

Default **Right Shift** opens Eternal Start through Minecraft's client task queue. The screen shows real FPS, ping, session/server state and working controls for Modules, HUD Editor, Resume, module bulk actions, Zoom and notifications.

If the premium render path itself fails, Core writes the error to `config/eternal-core.log` and presents an Eternal Safe Mode screen rather than intentionally propagating the UI exception.

## Modules are opt-in

A clean config starts modules disabled. Existing saved user config is respected.

Open **Modules** from the Eternal Minecraft menu or Eternal Start, enable only what you want, then open **HUD Editor** to place it.

## Real modules

| Module | Source |
|---|---|
| Watermark | Eternal Core runtime |
| FPS | live Minecraft FPS |
| CPS | actual mouse click events |
| Keystrokes | live WASD + LMB/RMB state and CPS |
| Coordinates | player XYZ |
| Ping | player-list latency |
| Speed | player horizontal movement |
| Direction | player yaw |
| Health | current/max health |
| Armor | armor points |
| Food | hunger level |
| Server | current server / local world |
| Memory | JVM heap usage |
| Session | elapsed Core runtime |
| Clock | local time |
| Zoom | real configurable FOV hold action |

## Keystrokes

The Keystrokes widget is a real HUD component with premium compact styling:

- W / A / S / D live press state
- LMB / RMB live press state
- real left/right CPS values
- Eternal accent and interaction styling

## HUD Editor

- enable hidden modules through the Modules button
- see active modules on the actual placement canvas
- drag modules
- 2 / 4 / 8 px snap grid
- arrow-key nudge
- coordinate inspector
- Default / Compact / Corners persisted presets
- Delete disables selected module
- positions save locally

## Core controls

| Default | Action |
|---|---|
| `Right Shift` | Eternal Start |
| `H` | HUD Editor |
| Hold `C` | Zoom when Zoom is enabled |

Bindings are rebindable and duplicate Eternal keybinds are rejected.

Core config:

```text
config/eternal-core.json
```

Core diagnostics:

```text
config/eternal-core.log
```

# Stable update channel

```text
Check → available/current/error → Download → real progress → Ready → Restart & install
```

`latest.yml` is published with the stable installer for `electron-updater`.

# v1.0.1 release files

The stable release intentionally includes **no portable ZIP**.

```text
Eternal.Client.Setup.1.0.1.exe
Eternal-Core-Standalone-1.0.1.jar
latest.yml
SHA256SUMS.txt
```

# Release gates

The exact v1.0.1 candidate must pass:

```text
clean Java 21 Eternal Core build
        ↓
Core metadata + icon + version validation
        ↓
Node dependency install
        ↓
runtime smoke: require MCLC + construct Client
        ↓
source / functionality / UI regression suite
        ↓
Vite production renderer build
        ↓
Eternal Windows branding validation
        ↓
NSIS / Electron packaging
        ↓
latest.yml validation
        ↓
PACKAGED Eternal Client.exe --smoke-test
        ↓
standalone Core + SHA256SUMS
        ↓
normal GitHub release marked latest
```

Passing these gates proves the exact candidate builds, packages and starts in CI. A physical-PC gameplay test still matters for GPU/driver/account/server/third-party-mod combinations; real failures are captured and fixed instead of hidden behind a “100% bug-free” claim.

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
├─ tests/               regression / runtime / UI gates
├─ scripts/             build / Core / branding helpers
└─ .github/workflows/   CI + release automation
```

<p align="center"><b>ETERNAL CLIENT v1.0.1</b><br/><i>The launcher and the client — one system.</i></p>
