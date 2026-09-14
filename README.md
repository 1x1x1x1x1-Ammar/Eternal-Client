<p align="center"><img src="assets/logo.svg" width="132" alt="Eternal Client red E emblem" /></p>
<h1 align="center">ETERNAL CLIENT</h1>
<p align="center"><b>Beyond survival.</b></p>
<p align="center">A Windows-first Minecraft Java <b>launcher + real in-game client</b> with isolated instances, Microsoft/offline accounts, Modrinth, real server tools, and Eternal Core running inside Minecraft.</p>

<p align="center">
<img alt="version" src="https://img.shields.io/badge/version-v0.8.0--beta.8-EA272D?style=for-the-badge" />
<img alt="windows" src="https://img.shields.io/badge/Windows-10%20%2F%2011-111111?style=for-the-badge&logo=windows11" />
<img alt="core" src="https://img.shields.io/badge/Eternal_Core-Standalone%20%2B%20Launcher-FF3338?style=for-the-badge" />
<img alt="minecraft" src="https://img.shields.io/badge/Minecraft-1.21.11%20Fabric-39D676?style=for-the-badge" />
</p>
<p align="center"><a href="../../actions/workflows/ci.yml"><img src="../../actions/workflows/ci.yml/badge.svg" alt="Eternal CI" /></a></p>

<p align="center"><img src="assets/release-banner.svg" width="100%" alt="Eternal Client" /></p>

> [!IMPORTANT]
> **Eternal is real beta software, not a mock launcher.** If a control looks usable, it must execute a real code path. Fake player counts, fake progress, fake integrations and fake success states are not accepted.

# v0.8.0-beta.8 — Reality Pass

Beta 8 focuses on three things above everything else: **fix bugs, make visible controls real, and push the launcher + in-game UI/UX closer to the premium Eternal reference direction.**

### Beta 8 highlights

- New premium Beta 8 UI layer across Home, Instances, Mods, Servers, Accounts, Settings, Developer, Command Center and Eternal Core.
- Mojang's official version manifest now backs Minecraft release selection and instance creation validation.
- Configured Java runtimes are executed and version-checked before Minecraft starts.
- Modrinth required dependencies install recursively and downloaded files are verified using supplied SHA-512/SHA-1 hashes.
- Vanilla profiles no longer pretend mod JAR installation will work.
- Standard Minecraft `_minecraft._tcp` SRV records resolve before server status checks.
- Launcher lifecycle state is separated from noisy Minecraft log/debug messages.
- Core launcher mode now verifies the staged/installed JAR using metadata + SHA-256 and repairs a mismatch before Minecraft starts.
- Standalone Core export is metadata-checked and SHA-256 verified before the file is committed.
- Eternal Core ClickGUI receives a larger premium black/crimson UI with real switches, hover feedback and bulk HUD controls.
- ClickGUI, HUD Editor and Zoom keys are **rebindable inside Minecraft** and persist to Core config.
- HUD Editor supports real drag/snap, arrow-key nudging and Delete-to-disable.
- Packaged Windows startup smoke testing remains a release blocker.

## Launcher + Core architecture

```text
ETERNAL CLIENT
│
├── Launcher-managed mode
│     ↓
│  isolated profile
│     ↓
│  validate account + Java + Minecraft/loader
│     ↓
│  metadata + SHA-256 verify/repair Eternal Core
│     ↓
│  Minecraft launches with Core
│
└── Standalone mode
      ↓
   Eternal-Core-Standalone-0.8.0-beta.8.jar
      ↓
   compatible Fabric 1.21.11 mods folder
      ↓
   Minecraft launches normally — no Eternal launcher process required
```

The two modes use the **same Core binary**. The launcher does not contain a weaker fake version of Core.

# Eternal Core

Current certified target: **Minecraft 1.21.11 + Fabric + Java 21**.

### Default keybinds

| Default key | Action |
|---|---|
| `Right Shift` | Open Eternal Core ClickGUI |
| `H` | Open the real draggable HUD Editor |
| Hold `C` | Zoom using the configured Core FOV |

Beta 8 makes all three Eternal keybinds rebindable from the in-game Utility section. Changes persist to `config/eternal-core.json`, and duplicate Eternal bindings are rejected.

### Implemented modules

| Feature | Real behavior |
|---|---|
| Watermark | Eternal Core identity chip |
| FPS | live Minecraft FPS |
| CPS | actual left/right click activity |
| Keystrokes | live WASD input state |
| Coordinates | live player XYZ |
| Ping | current player-list latency |
| Speed | horizontal player movement speed |
| Direction | live player direction/yaw |
| Memory | JVM heap usage |
| Session | elapsed Core runtime |
| Clock | local 24-hour clock |
| Zoom | configurable hold-key FOV, previous FOV restored on release |

Core settings persist locally:

```text
config/eternal-core.json
```

That config now includes module states, HUD positions, accent, HUD opacity, zoom FOV, snap grid, notifications and Eternal keybinds.

# Standalone installation

The GitHub release publishes:

```text
Eternal-Core-Standalone-0.8.0-beta.8.jar
```

To use it without the Eternal launcher:

1. Use **Minecraft Java 1.21.11**.
2. Install a compatible **Fabric Loader**.
3. Use **Java 21**.
4. Put the standalone JAR in that profile's `mods` folder.
5. Start Minecraft normally.
6. Press the configured Core key (default: **Right Shift**).

No launcher connection, background Eternal launcher process, account token or special launcher API is required by Core at runtime.

# Real launcher functions

- Isolated per-profile `.minecraft` directories.
- Official Mojang release metadata for version selection/validation.
- Vanilla + Fabric launch paths — other loaders are not falsely advertised.
- Multiple Minecraft child processes per profile.
- Microsoft OAuth → Xbox Live → XSTS → Minecraft Services ownership flow.
- Offline accounts with Minecraft-compatible deterministic UUIDs.
- Java detection plus runtime/version validation before launch.
- Modrinth search/install filtered by real Minecraft version + loader.
- Required Modrinth dependency resolution.
- SHA-512/SHA-1 verification for Modrinth files when supplied by Modrinth.
- Protected launcher-managed Eternal Core JAR.
- Minecraft protocol server status, latency, real player counts and SRV resolution.
- Modern Quick Play plus legacy server launch arguments where appropriate.
- Real launcher/download state rather than fake progress timers.
- Packaged startup smoke testing before release.
- NSIS installer, portable build, standalone Core JAR and SHA-256 release hashes.

# UI / UX direction

Eternal uses its own red-E identity and original code/assets while targeting the tight, premium feel of modern Minecraft clients:

- black / charcoal surfaces
- crimson active states
- compact desktop-client spacing
- cinematic play surface
- fast micro-interactions
- clear real-time status hierarchy
- responsive layouts for smaller windows
- reduced-motion support
- matching launcher + Core visual language

The desktop Core page is a **map/documentation view**. Actual module toggles, keybinds and HUD editing happen inside Minecraft so the launcher does not fake game interaction.

# Windows branding

The red Eternal **E** is the application identity across the launcher, README and Core.

Windows AppUserModelID:

```text
gg.eternal.client
```

The packaging pipeline generates the Windows executable/installer icon from Eternal branding and validates the branded icon source before packaging.

# Release gates

A Beta 8 release is blocked unless these pass:

```text
Eternal Core Gradle compile
        ↓
standalone JAR metadata + embedded icon validation
        ↓
Node dependency install
        ↓
Beta 8 source + runtime regression tests
        ↓
Vite production renderer build
        ↓
Eternal Windows brand asset validation
        ↓
Windows Electron / NSIS packaging
        ↓
PACKAGED EXE STARTUP SMOKE TEST
        ↓
standalone Core + installer + portable artifacts
        ↓
SHA-256 generation
        ↓
GitHub pre-release
```

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
├─ tests/               regression/source tests
├─ scripts/             build/Core/branding helpers
└─ .github/workflows/   CI + release automation
```

# Beta limits we do not fake

- Eternal Core is currently certified for **Fabric 1.21.11** only.
- The launcher currently implements **Vanilla + Fabric** profile launch paths.
- Microsoft login needs your own Entra/Azure public-client application ID.
- Aternos privileged controls require an authorized API/partnership; standard mode exposes only legitimate status/join/dashboard behavior.
- Other loaders/versions are not marked supported until their paths are actually implemented and tested.

> **If a button looks functional, it must perform a real action. If a feature is unavailable, Eternal disables it or explains why instead of pretending.**

<p align="center"><b>ETERNAL CLIENT</b><br/><i>Bigger. Faster. Better.</i></p>
