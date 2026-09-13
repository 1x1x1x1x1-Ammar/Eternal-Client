<p align="center">
  <img src="assets/logo.svg" width="112" alt="Eternal Client logo" />
</p>

<h1 align="center">ETERNAL CLIENT</h1>

<p align="center"><strong>The last client you'll ever need.</strong></p>

<p align="center">
  A Windows-first <strong>Minecraft Java launcher + real in-game client</strong>.<br/>
  Built around isolated instances, genuine download/launch state, Modrinth content, and Eternal Core running inside Minecraft.
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-v0.5.0--beta.5-e01414?style=for-the-badge" />
  <img alt="Minecraft" src="https://img.shields.io/badge/Minecraft-1.21.11-39d676?style=for-the-badge" />
  <img alt="Fabric" src="https://img.shields.io/badge/Eternal_Core-Fabric-ff2a2a?style=for-the-badge" />
  <img alt="Windows" src="https://img.shields.io/badge/Windows-10%20%2F%2011-111111?style=for-the-badge&logo=windows11" />
</p>

<p align="center">
  <a href="https://github.com/1x1x1x1x1-Ammar/Eternal-Client/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/1x1x1x1x1-Ammar/Eternal-Client/actions/workflows/ci.yml/badge.svg" /></a>
</p>

> [!IMPORTANT]
> **Eternal Client is beta software.** This repo follows one rule: if a control looks functional, it must execute a real action. Unsupported or unconfigured integrations stay visibly unavailable instead of showing fake success, fake players, fake progress, or fake partner APIs.

---

## Launcher + client, not launcher-only

```text
Eternal Launcher
      ↓
Isolated Minecraft instance
      ↓
Correct Minecraft + loader + Java
      ↓
Verified Eternal Core JAR
      ↓
Minecraft starts
      ↓
Eternal UI and HUD run INSIDE Minecraft
```

The desktop launcher is **Electron + React + Vite**. Eternal Core is a real **Fabric client mod**. The first certified in-game target is **Minecraft 1.21.11 + Fabric**; other combinations are not marked supported until they have a matching tested build.

---

# ✦ v0.5.0-beta.5 — Command Center Update

This beta pushes both sides of Eternal forward: the premium launcher UX and the in-game client.

### Launcher UI / UX

- New **Ctrl + K Eternal Command Center**
- Keyboard navigation with ↑ / ↓ / Enter / Esc
- Search launcher pages, Minecraft profiles, and real actions
- Launch any actual profile directly from the command center
- Refresh real instance state from disk
- Trigger the configured updater check
- New title-bar command search control
- Home hero now has a **real quick-play button** driven by actual recent-profile and process state
- Running Minecraft profiles are shown as running instead of pretending Play is idle
- Improved crimson micro-interactions, hover motion, sidebar glow, hero sheen, and command overlay
- Reduced-motion behavior remains respected

### Eternal Core in-game

Eternal Core now exposes **10 real modules**:

| Module | Real source |
|---|---|
| FPS | Minecraft live FPS |
| CPS | Actual left/right click activity |
| Keystrokes | Current WASD + mouse input |
| Coordinates | Player XYZ |
| Ping | Current player-list latency |
| Speed | Player horizontal velocity |
| Direction | Live player yaw + cardinal heading |
| Memory | Actual JVM heap use / maximum |
| Session | Real elapsed Eternal Core session time |
| Zoom | Real temporary Minecraft FOV change while holding `C` |

The HUD editor also gained real **4px snap-to-grid** and **Reset Layout** controls. Dragging, snapping, resetting, and saving all operate on the same persistent module configuration used in-game.

### Stability

- Keeps the Electron `tar` import fix (`import * as tar from 'tar'`)
- Eternal Core remains launcher-managed so it cannot be independently toggled/deleted into a broken state from the normal mod list
- Core launch preparation verifies the actual JAR and Fabric metadata
- Source-only regression suite expanded to cover Command Center wiring and the new in-game telemetry modules

---

# Real launcher features

### Isolated instances

Each profile has its own Minecraft data:

```text
EternalClient/
└── instances/
    └── <instance-id>/
        ├── instance.json
        ├── installed-content.json
        └── .minecraft/
            ├── mods/
            ├── resourcepacks/
            ├── shaderpacks/
            ├── saves/
            ├── screenshots/
            └── config/
```

Supported launcher profile families:

- Vanilla
- Fabric
- Quilt
- Forge
- NeoForge

Loader versions are resolved from provider metadata rather than invented lists.

### Real launch pipeline

Eternal tracks actual launch state through validation, Java selection, version/loader resolution, file checks, downloads, verification, mod preparation, authentication, JVM start, running state, stop state, and errors. Multiple Minecraft processes can exist at the same time and are tracked independently.

### Microsoft + Offline accounts

Microsoft auth uses the real chain:

```text
Microsoft OAuth
→ Xbox Live
→ XSTS
→ Minecraft Services
→ entitlement check
→ Minecraft profile
```

Offline accounts use Minecraft-compatible deterministic offline UUID semantics. Eternal does not claim offline accounts can authenticate to premium online-mode servers.

### Java manager

- Detect `JAVA_HOME`
- Search `PATH`
- Scan common Windows JDK/JRE folders
- Query JavaSoft registry locations
- Validate with `java -version`
- Download supported Eclipse Temurin runtimes through Adoptium

### Mod Hub

Modrinth-powered content support includes:

- Mods
- Resource packs
- Shaders
- `.mrpack` modpacks
- Minecraft-version filters
- Loader compatibility filters
- Required dependency resolution
- Hash verification
- Per-instance install state

Eternal never modifies the contents of third-party mod JARs.

### Downloads

The download manager uses real bytes and state:

- `.part` files
- HTTP Range resume where available
- real transferred bytes
- real speed
- ETA when calculable
- pause / resume / cancel
- hash verification
- configurable concurrency

No fake progress timers.

### Servers + Aternos standard mode

Eternal performs a real Minecraft status handshake/ping and can resolve server state, players, version, MOTD, and latency. Aternos standard mode supports legitimate status/join/dashboard flows only. Start/stop/console controls are not exposed without a documented authorized API contract.

---

# Eternal Core controls

| Key | Action |
|---|---|
| `Right Shift` | Open Eternal ClickGUI |
| `H` | Open HUD Editor |
| `C` | Hold to Zoom |

The ClickGUI is intentionally compact, black/charcoal/crimson, animated, and Minecraft-native rather than a generic config screen.

---

# Build on Windows

### Requirements

- Windows 10/11 x64
- Node.js 20+ (22 recommended)
- JDK 21 for Eternal Core
- Gradle 9.5.0, or the project build script can use `D:\Gradle\gradle-9.5.0-bin.zip`

### Development

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\RUN-DEV-WINDOWS.ps1
```

### Full verified Windows build

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\BUILD-WINDOWS.ps1
```

The full build stops if Core compilation, staging, tests, renderer compilation, or Electron packaging fails.

### Useful commands

```text
npm run doctor        source prerequisite checks
npm run test:source   dependency-free source/backend regression subset
npm run test          full launcher/backend tests after npm install
npm run core:stage    stage a successfully built Eternal Core JAR
npm run core:require  fail if a real staged Core JAR is missing
npm run build         Vite renderer production build
npm run verify        tests + real Core requirement + renderer build
npm run dist          verified Windows NSIS build
```

---

# Repository map

```text
Eternal-Client/
├── electron/          Electron main process + launcher services
├── eternal-core/      Real Fabric in-game client
├── src/               React launcher UI
├── tests/             Regression tests
├── scripts/           Verification + Core staging
├── assets/            Launcher assets / staged Core
├── .github/workflows/ Windows CI + release automation
├── BUILD.md
├── TESTING.md
├── TEST-RESULTS.md
├── RELEASE-CHECKLIST.md
└── CHANGELOG.md
```

---

# Beta → Release

```text
Beta
  ↓
Core compiles and loads in real Minecraft
  ↓
Launcher / instances / mods / downloads pass Windows CI
  ↓
Microsoft online authentication passes with a Minecraft-owning account
  ↓
Installer and updater paths pass
  ↓
Release Candidate
  ↓
Clean-machine regression test
  ↓
1.0 Release
```

See [`RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md) and [`TEST-RESULTS.md`](TEST-RESULTS.md) for evidence and outstanding release gates.

---

<p align="center">
  <strong>ETERNAL CLIENT</strong><br/>
  <em>The last client you'll ever need.</em>
</p>
