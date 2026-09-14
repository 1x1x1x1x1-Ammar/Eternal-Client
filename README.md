<p align="center"><img src="assets/logo.svg" width="132" alt="Eternal Client red E emblem" /></p>
<h1 align="center">ETERNAL CLIENT</h1>
<p align="center"><b>Beyond survival.</b></p>
<p align="center">A Windows-first Minecraft Java <b>launcher + real in-game client</b> with isolated instances, Microsoft/offline accounts, Modrinth, real server tools, and Eternal Core running inside Minecraft.</p>

<p align="center">
<img alt="version" src="https://img.shields.io/badge/version-v0.7.0--beta.7-EA272D?style=for-the-badge" />
<img alt="windows" src="https://img.shields.io/badge/Windows-10%20%2F%2011-111111?style=for-the-badge&logo=windows11" />
<img alt="core" src="https://img.shields.io/badge/Eternal_Core-Standalone%20%2B%20Launcher-FF3338?style=for-the-badge" />
<img alt="minecraft" src="https://img.shields.io/badge/Minecraft-1.21.11%20Fabric-39D676?style=for-the-badge" />
</p>
<p align="center"><a href="../../actions/workflows/ci.yml"><img src="../../actions/workflows/ci.yml/badge.svg" alt="Eternal CI" /></a></p>

<p align="center"><img src="assets/release-banner.svg" width="100%" alt="Eternal Client" /></p>

> [!IMPORTANT]
> **Eternal is real beta software, not a mock launcher.** If a control looks usable, it must execute a real action. Fake player counts, fake progress, fake integrations and fake success states are not accepted.

# v0.7.0-beta.7 — Core Evolution

Beta 7 focuses on the part that matters after the Play button: **Eternal Core inside Minecraft**.

The launcher keeps the black/crimson premium direction while Core now has a much more complete in-game interface: HUD / Utility / Style / About sections, persistent customization, notifications, layout presets and a redesigned HUD editor.

### New in Beta 7

- Reworked Eternal Core ClickGUI with premium black/crimson panels.
- Real **HUD**, **Utility**, **Style** and **About** sections.
- Persistent accent color selection.
- Persistent HUD opacity.
- Configurable Zoom FOV.
- Configurable HUD snap grid.
- Default / Compact / Corners HUD presets.
- In-game notifications for module/settings changes.
- Watermark + Clock HUD modules added to the existing Core HUD set.
- Redesigned HUD editor with snap-to-grid and persistent placement.
- **Standalone Eternal Core**: the exact same Core JAR works without the launcher.
- Launcher button to export the verified standalone JAR.
- Eternal icon embedded into the Fabric mod metadata.
- Windows app identity hardened with `gg.eternal.client` so packaged builds use Eternal branding rather than the Electron identity.
- Renderer logo paths are bundled by Vite so the Eternal mark also works in packaged `file://` builds.

## Launcher + Core architecture

```text
ETERNAL CLIENT
│
├── Launcher-managed mode
│     ↓
│  isolated profile
│     ↓
│  verified Eternal Core copied into that profile
│     ↓
│  Minecraft launches with Core
│
└── Standalone mode
      ↓
   Eternal-Core-Standalone-0.7.0-beta.7.jar
      ↓
   compatible Fabric 1.21.11 mods folder
      ↓
   Minecraft launches normally — no Eternal launcher process required
```

The two modes use the **same Core code and same JAR**. The launcher does not contain a weaker fake version of Core.

# Eternal Core

Current certified target: **Minecraft 1.21.11 + Fabric + Java 21**.

### Keybinds

| Key | Action |
|---|---|
| `Right Shift` | Open Eternal Core ClickGUI |
| `H` | Open the real draggable HUD Editor |
| Hold `C` | Zoom using the configured Core FOV |

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
| Zoom | configurable hold-C FOV, previous FOV restored on release |

Core settings persist to:

```text
config/eternal-core.json
```

# Standalone installation

The GitHub release publishes:

```text
Eternal-Core-Standalone-0.7.0-beta.7.jar
```

To use it without the Eternal launcher:

1. Use **Minecraft Java 1.21.11**.
2. Install a compatible **Fabric Loader**.
3. Use **Java 21**.
4. Put the standalone JAR in that profile's `mods` folder.
5. Start Minecraft normally.
6. Press **Right Shift** in-game.

No launcher connection, background Eternal launcher process, account token or special launcher API is required by Core at runtime.

# Real launcher functions

- Isolated per-profile `.minecraft` directories.
- Vanilla + Fabric launch paths.
- Multiple Minecraft child processes per profile.
- Microsoft OAuth → Xbox Live → XSTS → Minecraft Services flow.
- Offline accounts with Minecraft-compatible deterministic UUIDs.
- Java detection and compatibility checks.
- Modrinth search/install filtered by real Minecraft version + loader.
- Local mod enable/disable without rewriting JAR internals.
- Minecraft protocol server status, latency and player counts.
- Quick-play server launch.
- Real launcher/download state rather than fake progress timers.
- Packaged startup smoke testing before release.
- NSIS installer, portable build and SHA256 release hashes.

# Windows branding

The red Eternal **E** is the application identity across the launcher, README and Core.

Beta 7 specifically sets the Windows AppUserModelID to:

```text
gg.eternal.client
```

The packaging pipeline converts the Eternal vector mark into the Windows executable/installer icon. CI also verifies the branding source exists before packaging.

# Release gates

A Beta 7 release is blocked unless these pass:

```text
Eternal Core Gradle compile
        ↓
standalone JAR metadata + icon validation
        ↓
Node dependency install
        ↓
source + runtime regression tests
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
SHA256 generation
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
- Microsoft login needs your own Entra/Azure public-client application ID.
- Aternos privileged controls require an authorized API/partnership; standard mode exposes only legitimate status/join/dashboard behavior.
- Other loaders/versions are not marked supported until their paths are actually implemented and tested.

> **If a button looks functional, it must perform a real action. If a feature is unavailable, Eternal says so instead of pretending.**

<p align="center"><b>ETERNAL CLIENT</b><br/><i>Bigger. Faster. Better.</i></p>
