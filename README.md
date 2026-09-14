<p align="center"><img src="assets/logo.svg" width="140" alt="Eternal Client red E emblem" /></p>
<h1 align="center">ETERNAL CLIENT</h1>
<p align="center"><b>Beyond survival.</b></p>
<p align="center">A Windows-first Minecraft Java <b>launcher + real in-game client</b> with isolated instances, Microsoft/offline accounts, Modrinth, real server tools, a real diagnostics console, and Eternal Core running inside Minecraft.</p>

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
> **Eternal follows one rule: visible functionality must be real.** No fake player counts, fake progress, fake partner controls, fake Minecraft launch state, or decorative controls that pretend to perform an action.

# Eternal Client v1.0.1

v1.0.1 is the stable Core-reliability and premium-UI patch. It keeps the real launcher/instance/Modrinth/server/account systems from v1 while hardening the in-game screen path after a real crash report, expanding diagnostics, improving the real Downloads center, and giving both launcher and Core another detailed UI/UX pass.

## v1.0.1 highlights

- Core Modules screen rendering/input is guarded and recovers to Eternal Start instead of allowing a UI exception to crash the game.
- HUD Studio rendering, dragging and input are guarded too.
- Top-level HUD rendering and individual HUD modules have failure isolation.
- `config/eternal-core.log` stores full exception stack traces for real debugging.
- Premium Eternal Minecraft title/start screen has a safe fallback renderer.
- Clean Core installs still start all HUD/Zoom modules **disabled** until the player chooses them.
- Rebuilt in-game Modules center with real ON/OFF state, Enable All, Disable All and **Edit Layout**.
- Rebuilt HUD Studio with live preview, selection anchors, position/size inspector, snap, nudge, presets and real module disable.
- Premium Keystrokes now uses real WASD + LMB/RMB state, left/right CPS, total CPS and CPS activity bars.
- Launcher Minecraft launch failures before JVM startup now become explicit `ERROR` lifecycle events.
- Downloads shows real errors, real byte/speed telemetry where available, opens Console directly and can clear session transfer history.
- New final `v1.0.1.css` layer polishes sidebar, Home, instances, Mod Hub, Core, Console, Downloads, common controls and responsive/reduced-motion states.

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

Automated build target: **Minecraft Java 1.21.11 + Fabric + Java 21**. Gradle compilation and release checks are required before publication; a real-machine gameplay pass is still the final compatibility gate for specific hardware/mod/server combinations.

## Eternal Minecraft start menu

When Eternal Core is loaded, the vanilla Minecraft title screen is replaced by the original Eternal start surface. Its controls route to real Minecraft/Core destinations:

- **Singleplayer** → Minecraft world selection
- **Multiplayer** → Minecraft server browser
- **Modules** → Eternal module center
- **HUD Studio** → draggable Eternal HUD workspace
- **Options** → Minecraft settings
- **Quit Game** → real Minecraft shutdown

The v1.0.1 start surface adds stronger visual hierarchy, current keybind hints, enabled-module status and a safe fallback menu if the premium renderer fails. It uses Eternal's own red-E identity and original black/crimson interface; it does not ship Dawn assets or code.

## Default controls

| Default | Action |
|---|---|
| `Right Shift` | Open **Eternal Start** |
| `H` | Open **HUD Studio** |
| Hold `C` | Zoom, only after the Zoom module is enabled |

The Eternal bindings are rebindable in-game and persist locally. Duplicate Eternal bindings are rejected.

## Modules start OFF

A clean Eternal Core config does **not** enable HUD modules automatically. Open **Modules** from Eternal Start/title screen and enable only the modules you want. Existing saved configuration is preserved.

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

## Modules center

The in-game module center is functional, not a screenshot:

- Real ON/OFF state on every module card.
- Enable All / Disable All.
- **Edit Layout** opens the real HUD Studio.
- Zoom FOV control.
- Notifications control.
- Persistent Start/HUD/Zoom keybinds with duplicate protection.
- Accent, HUD opacity and snap grid.
- Default / Compact / Corners presets.
- Crash recovery writes the complete exception to `config/eternal-core.log` and returns to Eternal Start when possible.

## HUD Studio

The HUD Studio is the real placement workspace:

- **Modules** opens the module center to add/remove HUD widgets.
- Active modules render exactly as they will in-game.
- Drag modules with grid snapping.
- Selection anchors show the active drag target.
- Inspector shows actual position and widget size.
- Arrow keys nudge the selected module.
- Default / Compact / Corners presets write saved positions.
- Delete disables the selected module.
- Positions persist locally.
- Render/input/drag failures are guarded and logged instead of taking down Minecraft.

## Premium Keystrokes

Keystrokes is still based only on real input state but now has a richer in-game presentation:

- W/A/S/D pressed-state glow
- real LMB/RMB pressed state
- real left/right CPS counters
- total CPS footer
- live CPS activity bars
- layered Eternal panel chrome

Health, Armor and Food widgets also display real value bars based on current player state.

## Core diagnostics

Core writes runtime diagnostics to Minecraft stdout/stderr and:

```text
config/eternal-core.log
```

v1.0.1 persists full Java stack traces. The launcher captures Minecraft output in **Console → Minecraft**, classifies errors/warnings and surfaces abnormal exits with the preceding runtime output.

Core configuration lives at:

```text
config/eternal-core.json
```

It stores module states, HUD positions, accent, opacity, zoom FOV, snap grid, notifications and keybinds. Writes use a temporary file + atomic replacement when supported, and malformed config is backed up as `eternal-core.corrupt-<timestamp>.json`.

# Eternal Console

Open with **Ctrl+J**. Major operations open it automatically; Minecraft warnings/errors can surface it automatically.

Tabs:

- **Operations** — instance/account/mod/server/Core/settings/update backend actions
- **Minecraft** — launch lifecycle + real Minecraft stdout/debug + warnings/errors
- **Transfers** — real transfer events

v1.0.1 also reports Java/account/Fabric/Core preparation failures as Minecraft `ERROR` lifecycle events even when the JVM never starts.

# Real Downloads center

The Downloads page combines real backend state from:

- Minecraft version/assets/library preparation
- Modrinth downloads
- Eternal stable updater downloads
- loader/Core preparation lifecycle
- pre-launch/runtime failures

When bytes are available Eternal shows actual transferred bytes, total bytes and speed. When total size is unavailable, Eternal uses an indeterminate state — never a fake percentage. Failed rows can open Console directly, and **Clear session transfers** clears only saved transfer-event history.

# Instance system

- Each instance owns an isolated `.minecraft` tree.
- Mojang's official manifest backs the complete version catalog.
- Search/type releases, snapshots, old beta and old alpha entries.
- Launcher paths implemented: **Vanilla + Fabric**.
- Fabric loader compatibility resolves against Fabric metadata at launch.
- Edit name and RAM safely.
- Duplicate copies the isolated instance tree.
- Delete/duplicate are blocked while an instance is running.
- Multiple Minecraft processes are tracked by profile.

Core support is intentionally narrower than launcher version selection: the current Core build targets **Fabric 1.21.11**.

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
launcher dependency install
        ↓
source/runtime/UI/crash-recovery regression suite
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

<p align="center"><b>ETERNAL CLIENT v1.0.1</b><br/><i>The launcher and the client — one system.</i></p>
