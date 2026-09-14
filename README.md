<p align="center"><img src="assets/logo.svg" width="140" alt="Eternal Client red E emblem" /></p>
<h1 align="center">ETERNAL CLIENT</h1>
<p align="center"><b>Beyond survival.</b></p>
<p align="center">A Windows-first Minecraft Java <b>launcher + real in-game client</b> with isolated instances, Microsoft/offline accounts, real skins, Modrinth, server tools, diagnostics, and Eternal Core running inside Minecraft.</p>

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
> **Eternal follows one rule: visible functionality must be real.** No fake player counts, fake progress, fake partner controls, fake Minecraft launch state, fake skin success, or decorative controls that pretend to perform an action.

# Eternal Client v1.0.1

v1.0.1 is the first stable hotfix after a real user crash report. It fixes the Eternal Core static-initialization crash, keeps the premium launcher/Core work from v1.0.0, and adds a real Microsoft/offline Skin Studio with a much stronger Accounts UI.

## Critical Core hotfix

The v1.0.0 crash was traced to static initialization order inside `CoreConfig`: the singleton was constructed before the module catalog existed. v1.0.1 initializes `MODULES` before `CoreConfig.INSTANCE`, and CI now contains a regression gate for that exact failure mode.

Clean Core installs still start with all modules **disabled**. Users explicitly choose what appears in-game.

## V1.0.1 highlights

- Fatal Core initialization crash fixed from real crash-report evidence.
- Premium launcher UI with responsive layouts, advanced micro-motion, real loading/error/running states and reduced-motion support.
- Complete Mojang version catalog for instance creation: releases, snapshots, old beta and old alpha entries.
- Real isolated instance management: create, edit, duplicate, delete, open folder, launch, stop, playtime and running process state.
- Premium Mod Hub backed by Modrinth with version/loader filtering, real sorting/categories, pagination, dependency resolution and hash verification.
- Real Eternal Console (`Ctrl+J`) for backend operations, Minecraft stdout/debug, warnings/errors, account/skin operations and transfer activity.
- Real Downloads center for Minecraft preparation, Modrinth transfers and Eternal updater transfers. Unknown-size work stays indeterminate instead of using fake percentages.
- Renewable Microsoft session state and stable GitHub updater.
- Real Skin Studio with Microsoft Minecraft skin upload/reset/refresh and local-only offline skins.
- Custom Eternal Minecraft title/start menu replacing the vanilla title screen while Core is loaded.
- Crash-hardened Eternal UI opening: key-repeat suppression, normalized mouse actions, Minecraft task-queue screen transitions and runtime diagnostics in `config/eternal-core.log`.
- Premium Eternal Start dashboard, Modules UI, HUD Editor, live HUD, notifications and upgraded WASD + LMB/RMB keystrokes.

# Launcher → Minecraft architecture

```text
ETERNAL CLIENT v1.0.1
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
   Eternal-Core-Standalone-1.0.1.jar
      ↓
   compatible Fabric 1.21.11 mods folder
      ↓
   start Minecraft normally
      ↓
   no Eternal launcher process required
```

# Eternal Core v1.0.1

Automated build target: **Minecraft Java 1.21.11 + Fabric + Java 21**. Gradle compilation and release checks are required before publication; a real-machine gameplay pass remains the final compatibility gate for a particular hardware/mod/server combination.

## Eternal Minecraft start menu

When Eternal Core is loaded, the vanilla Minecraft title screen is replaced by the original Eternal start surface. Every visible destination is wired to a real Minecraft/Core action:

- **Singleplayer** → Minecraft world selection
- **Multiplayer** → Minecraft server browser
- **Modules** → Eternal module manager
- **HUD Editor** → draggable Eternal HUD workspace
- **Options** → Minecraft settings
- **Quit Game** → real Minecraft shutdown

The menu uses Eternal's red-E identity and premium black/crimson design language. It does not ship Dawn assets or code.

## Default controls

| Default | Action |
|---|---|
| `Right Shift` | Open **Eternal Start** |
| `H` | Open the draggable **HUD Editor** |
| Hold `C` | Zoom, only after the Zoom module is enabled |

Bindings are rebindable in-game and persist locally. Duplicate Eternal bindings are rejected.

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

The HUD Editor is a real placement workspace:

- **Modules** button opens the module manager so hidden modules can be enabled.
- Active modules render on the real placement canvas.
- Drag modules and see their actual position.
- Snap grid supports 2/4/8 px.
- Arrow keys nudge the selected module.
- Inspector shows selected module + coordinates.
- Default / Compact / Corners presets write real saved positions.
- Delete disables the selected module.
- Positions persist locally.

## Core diagnostics

Core writes runtime diagnostics to Minecraft stdout/stderr and:

```text
config/eternal-core.log
```

The launcher captures Minecraft output in **Console → Minecraft**. Error/warning lines are classified and abnormal Minecraft exits point you to the preceding runtime output.

Core configuration lives at:

```text
config/eternal-core.json
```

It stores module states, HUD positions, accent, opacity, zoom FOV, snap grid, notifications and keybinds. Writes use a temporary file + atomic replacement when supported, and malformed config is backed up as `eternal-core.corrupt-<timestamp>.json`.

# Accounts + Skin Studio

The Accounts page is now a premium identity manager rather than a plain account list.

## Microsoft accounts

- Device-code Microsoft login.
- Xbox Live → XSTS → Minecraft Services ownership/profile flow.
- Encrypted renewable MSAL session state.
- Active Minecraft skin/model/cape metadata shown in the launcher.
- **Classic / Slim** model selection.
- Validated `64x64` or legacy `64x32` PNG skin upload.
- Real upload through the authenticated Minecraft Services skin endpoint.
- Real reset through the Minecraft Services active-skin endpoint.
- Profile/cosmetics refresh after changes.
- Backend-proxied preview data so packaged Electron does not rely on fragile remote-canvas CORS behavior.

## Offline accounts

- Minecraft-compatible deterministic offline UUID.
- Local skin PNG selection and launcher preview.
- Offline skins stay inside Eternal's data directory and are never presented as Mojang/Microsoft account changes.
- Removing an offline account cleans up its Eternal-managed local skin file.

# Eternal Console

Open with **Ctrl+J**. Major operations open it automatically; Minecraft warnings/errors can surface it automatically.

Tabs:

- **Operations** — instance/account/skin/mod/server/Core/settings/update backend actions
- **Minecraft** — launch lifecycle + real Minecraft stdout/debug + warnings/errors
- **Transfers** — real transfer events

Instance creation, duplication, Minecraft launch, Modrinth install, Microsoft login, skin changes, server quick-join, Core export and updater download all produce backend-derived events. Visible output can be copied for bug reports.

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
- Launcher paths implemented: **Vanilla + Fabric**.
- Fabric loader compatibility resolves against Fabric metadata at launch.
- Edit name and RAM safely.
- Duplicate copies the isolated instance tree.
- Delete/duplicate are blocked while an instance is running.
- Multiple Minecraft processes are tracked by profile.

Core support is intentionally narrower than launcher version selection: the current Core build targets **Fabric 1.21.11** only.

# Mod Hub

- Real Modrinth search filtered by selected Minecraft version and loader.
- Relevance/download/follow/newest/updated sorting.
- Category facets.
- Real pagination / Load More.
- Real project download/follower/category metadata.
- Required dependency resolution.
- SHA-512/SHA-1 verification when Modrinth provides hashes.
- `.part` files are not treated as installed.
- Vanilla profiles disable mod installation instead of pretending JARs work.
- Launcher-managed Eternal Core cannot be manually removed/disabled through Mod Hub.

# Java and servers

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

v1.0.1 intentionally publishes **no portable ZIP**.

```text
Eternal.Client.Setup.1.0.1.exe
Eternal-Core-Standalone-1.0.1.jar
latest.yml
SHA256SUMS.txt
```

# Release gates

`v1.0.1` is published only when the exact candidate passes:

```text
clean Java 21 Eternal Core build
        ↓
Core metadata + icon + version validation
        ↓
CoreConfig static-init regression gate
        ↓
launcher dependency install
        ↓
source/runtime/UI/skin regression suite
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

Passing these gates proves the exact source builds, packages and starts in CI. It cannot prove every GPU driver, server, account or third-party mod combination is bug-free, so real failures are logged and fixed instead of hidden behind a “100% bug-free” label.

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
├─ electron/            Electron launcher backend + accounts/skins/downloads
├─ src/                 React premium launcher UI
├─ eternal-core/        standalone + launcher-managed Fabric client
├─ assets/              Eternal branding
├─ tests/               regression/release/UI/runtime gates
├─ scripts/             build/Core/branding helpers
└─ .github/workflows/   CI + stable/beta release automation
```

> **If a control looks functional, it must perform a real action. If a capability is unavailable, Eternal disables it or explains why instead of pretending.**

<p align="center"><b>ETERNAL CLIENT v1.0.1</b><br/><i>The launcher and the client — one system.</i></p>
