<p align="center"><img src="assets/logo.svg" width="116" alt="Eternal Client red E emblem" /></p>
<h1 align="center">ETERNAL CLIENT</h1>
<p align="center"><b>Beyond survival.</b></p>
<p align="center">A premium Minecraft Java <b>launcher + real in-game client</b> with isolated instances, Microsoft/offline accounts, real launch state, Modrinth content, server tools, and Eternal Core running inside Minecraft.</p>

<p align="center">
<img alt="version" src="https://img.shields.io/badge/version-v0.5.0--beta.5-EA272D?style=for-the-badge" />
<img alt="windows" src="https://img.shields.io/badge/Windows-10%20%2F%2011-111111?style=for-the-badge&logo=windows11" />
<img alt="core" src="https://img.shields.io/badge/Eternal_Core-1.21.11%20Fabric-FF3338?style=for-the-badge" />
</p>
<p align="center"><a href="../../actions/workflows/ci.yml"><img src="../../actions/workflows/ci.yml/badge.svg" alt="Eternal CI" /></a></p>

<p align="center"><img src="assets/release-banner.svg" width="100%" alt="Eternal Client first beta release" /></p>

> [!IMPORTANT]
> **Eternal is real beta software, not a mock launcher.** A button that looks usable must execute a real action. Fake player counts, fake download percentages, fake partner controls, and fake success states are not accepted in this project.

## Launcher + in-game client

```text
Eternal Launcher
   ↓
Isolated Minecraft instance
   ↓
Correct Minecraft + loader + Java
   ↓
Real Minecraft process
   ↓
Eternal Core on supported profiles
   ↓
HUD / ClickGUI / Zoom inside Minecraft
```

The interface targets the compact, cinematic quality of premium Minecraft clients while keeping **Eternal's own red E branding, source code, layout system, and assets**.

# v0.5.0-beta.5 — First GitHub Beta

### New release UI

- Rebuilt Home around the **Play Minecraft Your Way** flow.
- Dark cinematic black/crimson visual system with fast micro-animations.
- Full text + icon navigation: Home, Instances, Mods, Servers, Accounts, Settings, Downloads and Developer.
- Real instance selector directly beside the Play button.
- Real current-account and running-process state.
- Real feature cards for instances, Modrinth, servers and accounts.
- Dedicated **Accounts** page with Microsoft device-code state and offline accounts.
- Dedicated **Downloads** page driven by actual launcher/download events. Unknown progress stays indeterminate instead of inventing a percentage.
- Dedicated **Developer** page backed by Electron IPC diagnostics and detected Java runtimes.
- `Ctrl + K` Command Center remains available for fast navigation and launch actions.
- New smooth red **Eternal E** emblem used throughout the launcher and README.

### Real launcher functionality

- Per-profile isolated `.minecraft` directories.
- Vanilla launch path through `minecraft-launcher-core`.
- Fabric loader resolution through Fabric's official metadata service.
- Multiple simultaneous Minecraft child processes tracked per instance.
- Real PID-aware stop/exit state so closing one game does not incorrectly mark another running copy as stopped.
- Offline accounts using Minecraft-compatible `OfflinePlayer:<name>` UUID semantics.
- Microsoft device-code login chain: Microsoft → Xbox Live → XSTS → Minecraft Services → ownership/profile validation.
- Microsoft auth requires **your own** Entra/Azure public client ID; Eternal does not copy another launcher's credentials.
- Java discovery and version checks.
- Local `.jar` add/remove/enable/disable without editing mod JAR contents.
- Modrinth search and install filtered by the selected instance's Minecraft version + loader.
- Genuine Minecraft TCP status handshake for server online state, version, player count and latency.
- Aternos standard mode exposes only legitimate server status / join / dashboard behavior unless an authorized partner API exists.
- Electron renderer stays isolated with `contextIsolation`, `sandbox`, and no Node integration in the renderer.

### Eternal Core — actually inside Minecraft

Current certified source target: **Minecraft 1.21.11 + Fabric**.

| Feature | Current implementation |
|---|---|
| ClickGUI | `Right Shift` opens Eternal's in-game module UI |
| HUD editor | `H` opens draggable HUD placement with persistent positions |
| Zoom | Hold `C`; FOV changes and restores on release |
| FPS | live Minecraft FPS |
| CPS | real left/right click timestamps |
| Keystrokes | live movement input |
| Coordinates | live player XYZ |
| Ping | current player-list latency |
| Speed | horizontal player movement speed |
| Direction | player yaw |
| Memory | JVM heap usage |
| Session | current Eternal Core session time |

The HUD is rendered through Minecraft's actual client GUI path; it is not an Electron overlay pretending to be in-game.

## Current support

| Area | Beta 5 status |
|---|---|
| Vanilla profiles | Implemented |
| Fabric profiles | Implemented |
| Forge / NeoForge / Quilt | Not exposed as working until ported/tested |
| Offline accounts | Implemented |
| Microsoft auth source | Implemented; live owning-account test remains a release gate |
| Local mods | Implemented |
| Modrinth search/install | Implemented |
| Minecraft server ping | Implemented |
| Quick server launch | Implemented where supported by target MC version |
| Eternal Core 1.21.11 | Compiled by CI and packaged into release pipeline |
| Aternos privileged controls | Not faked; requires authorized API |

## Build on Windows

Requirements: Windows 10/11 x64, Node.js 22 recommended, JDK 21 for Eternal Core.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\RUN-DEV-WINDOWS.ps1
```

Production verification / installer path:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\BUILD-WINDOWS.ps1
```

GitHub Actions separately verifies the launcher and Eternal Core. The release workflow builds the real Core JAR, stages it into the launcher assets, compiles the renderer, packages the Windows NSIS installer, and publishes release artifacts only if those steps succeed.

## Repository map

```text
Eternal-Client/
├─ electron/            Electron main process + launcher services
├─ src/                 React launcher UI
├─ eternal-core/        Fabric in-game client source
├─ assets/              Eternal branding + release artwork
├─ tests/               Source regression tests
├─ scripts/             Verification helpers
└─ .github/workflows/   CI + release automation
```

## Release discipline

A green source test is not the same as a fully certified launcher. Before Eternal leaves beta, the project still needs clean-machine Windows verification, real Microsoft owning-account validation, actual Minecraft launch testing, in-game Eternal Core smoke testing, installer/update testing, and regression passes across every supported loader/version pair.

See [`TEST-RESULTS.md`](TEST-RESULTS.md) and [`RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md).

> **Project rule:** if a feature is not implemented, tested, or authorized yet, Eternal says so instead of pretending.

<p align="center"><b>ETERNAL CLIENT</b><br/><i>Bigger. Faster. Better.</i></p>
