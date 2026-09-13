<p align="center"><img src="assets/logo.svg" width="128" alt="Eternal Client red E emblem" /></p>
<h1 align="center">ETERNAL CLIENT</h1>
<p align="center"><b>The last client you'll ever need.</b></p>
<p align="center">A premium Minecraft Java <b>launcher + real in-game client</b>, built around a black/crimson interface, isolated instances, real launch state, Modrinth content, and Eternal Core inside Minecraft.</p>
<p align="center">
<img alt="version" src="https://img.shields.io/badge/version-v0.5.0--beta.5-e01414?style=for-the-badge" />
<img alt="windows" src="https://img.shields.io/badge/Windows-10%20%2F%2011-111111?style=for-the-badge&logo=windows11" />
<img alt="core" src="https://img.shields.io/badge/Eternal_Core-1.21.11%20Fabric-ff2a2a?style=for-the-badge" />
</p>
<p align="center"><a href="../../actions/workflows/ci.yml"><img src="../../actions/workflows/ci.yml/badge.svg" alt="Eternal CI" /></a></p>

> [!IMPORTANT]
> **Beta means beta.** Eternal does not show fake success, fake server players, fake progress, or fake privileged partner controls. A feature is only called release-ready after it actually passes its build/runtime gate.

## What Eternal is

```text
Eternal Launcher
   ↓
Isolated Minecraft instance
   ↓
Vanilla or Fabric profile + compatible Java
   ↓
Real Minecraft process
   ↓
Eternal Core (supported profile)
   ↓
HUD / ClickGUI / Zoom inside Minecraft
```

The launcher UI is inspired by the compact premium feel of clients such as Dawn, but the **Eternal red faceted E emblem, source, UI system, and assets are original**.

## ✦ v0.5.0-beta.5

### Launcher UI / UX
- Compact 68px icon rail instead of a generic web-dashboard sidebar.
- Frameless Electron title bar with real minimize/maximize/close actions.
- Animated crimson hero, real active-account state and real profile state.
- `Ctrl + K` Command Center for pages, profiles and launch actions.
- Real Play / Launch Another / Stop process states.
- Activity dock driven by launcher events instead of fake timers.
- Responsive layout and `prefers-reduced-motion` support.
- New Eternal red **E** emblem used in the launcher and this README.

### Real launcher work in this beta
- Per-profile isolated `.minecraft` directories.
- Vanilla launch path through `minecraft-launcher-core`.
- Fabric loader profile resolution from `meta.fabricmc.net`.
- Multiple Minecraft child processes tracked per instance.
- Offline accounts with Minecraft-compatible `OfflinePlayer:<name>` UUID semantics.
- Microsoft device-code auth source: Microsoft → Xbox Live → XSTS → Minecraft Services → ownership/profile validation. You must provide **your own** Entra/Azure public-client ID.
- Java runtime detection and version requirement checks.
- Local `.jar` add/remove/enable/disable without editing JAR contents.
- Modrinth search filtered by the instance's actual MC version + loader, plus compatible-file installation.
- Minecraft TCP status handshake for genuine online/player/version/latency data.
- Aternos is intentionally limited to legitimate server-address/status/join/dashboard flows unless an authorized API is available.
- Fixed the Electron startup crash caused by `import tar from 'tar'`; the code uses `import * as tar from 'tar'`.

### Eternal Core — in-game
Current source target: **Minecraft 1.21.11 + Fabric Loader 0.18.1**.

| Feature | Implementation |
|---|---|
| ClickGUI | `Right Shift` opens the actual in-game module UI |
| HUD editor | `H` opens draggable HUD placement with persistent positions |
| Zoom | Hold `C`; Eternal changes FOV and restores the user's previous FOV on release |
| FPS | live Minecraft FPS |
| CPS | real left/right click timestamps |
| Keystrokes | live W/A/S/D input state |
| Coordinates | live player XYZ |
| Ping | current player-list latency |
| Speed | horizontal player velocity |
| Direction | live player yaw |
| Memory | JVM heap usage |
| Session | elapsed Eternal Core runtime |

The HUD is injected into Minecraft's real `Gui.render(...)` path through a client mixin; it is not an Electron overlay.

## Current support

| Area | Beta 5 status |
|---|---|
| Vanilla profiles | Implemented |
| Fabric profiles | Implemented |
| Forge / NeoForge / Quilt | **Not exposed as working yet** |
| Offline accounts | Implemented |
| Microsoft auth flow | Implemented in source; live account test is a release gate |
| Local mods | Implemented |
| Modrinth search/install | Implemented |
| Server ping / quick join | Implemented |
| Eternal Core 1.21.11 | Source implemented; CI compilation/runtime test is a release gate |
| Aternos privileged controls | Not faked; requires authorized API |

## Build

Requirements: Windows 10/11, Node.js 20+ (22 recommended), and JDK 21 for Eternal Core.

```powershell
# launcher development
Set-ExecutionPolicy -Scope Process Bypass
.\RUN-DEV-WINDOWS.ps1

# verified launcher package path
.\BUILD-WINDOWS.ps1
```

Eternal Core is also built by GitHub Actions using Java 21 and Gradle. See `.github/workflows/ci.yml`.

## Verification

The current dependency-free source checks in this workspace are:

```text
10 tests
10 passed
0 failed
```

These checks cover the `tar` regression, Electron renderer isolation, offline UUID namespace, Microsoft launcher-auth wiring, official Fabric metadata source, Modrinth compatibility filters, genuine TCP server-ping path, Command Center wiring, and logo/source presence.

That is **not** the same as claiming the whole client is 100% release-ready. The remaining hard gates are tracked in [`TEST-RESULTS.md`](TEST-RESULTS.md) and [`RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md).

## Repository

```text
Eternal-Client/
├─ electron/            Electron main process + real launcher services
├─ src/                 React launcher UI
├─ eternal-core/        Fabric in-game client source
├─ assets/              Original Eternal branding
├─ tests/               Source regression tests
├─ scripts/             Verification helpers
└─ .github/workflows/   Windows launcher + Core CI
```

## Project rule

> **If a button looks functional, it must execute a real action. If a feature is not ready or not authorized, Eternal says so instead of pretending.**

<p align="center"><b>ETERNAL CLIENT</b><br/><i>The last client you'll ever need.</i></p>
