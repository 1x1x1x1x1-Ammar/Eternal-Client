# Eternal Client v1.0.0

**The first stable Eternal release — real launcher, real in-game Core, stable update channel, diagnostics and premium UI.**

Eternal v1 promotes the project out of beta after release hardening across launcher lifecycle, instances, Microsoft sessions, Modrinth, downloads, Core screen/input safety, persistence, stable updating, Windows packaging and both desktop/in-game UI systems.

## Launcher reliability

- Mojang's official version manifest backs the complete instance version catalog.
- New instances can target official releases, snapshots, old beta and old alpha entries.
- Vanilla and Fabric are the only launch paths advertised because they are the paths implemented in v1.
- Fabric compatibility resolves against Fabric metadata when a profile launches.
- Java is detected/validated before launch and Minecraft's required Java major is enforced.
- Microsoft sessions retain encrypted MSAL cache state and attempt silent renewal before launch.
- Microsoft ownership/profile checks use Xbox Live → XSTS → Minecraft Services.
- Offline profiles use Minecraft-compatible deterministic UUID behavior.
- Eternal is single-instance on Windows; launching it again focuses/restores the existing window.
- Electron renderer remains context-isolated, sandboxed and without Node integration.

## Eternal Console

Open **Ctrl+J** for a backend/runtime console built from real events.

- Operations: instance/account/mod/server/Core/settings/updater actions.
- Minecraft: launch lifecycle plus real stdout/debug lines.
- Transfers: Modrinth/Minecraft/update activity.
- Error/warning classification surfaces Minecraft exceptions, fatal/error lines, warning lines and abnormal process exits.
- Major operations open the console automatically; runtime warnings/errors can surface it automatically.
- Visible output can be copied for bug reports.

## Downloads V1

The Downloads tab is a real transfer center instead of a decorative progress page.

- Minecraft download/preparation events come from the launcher pipeline.
- Modrinth events use actual transferred/total bytes where available.
- Eternal updater events include real transferred bytes, total bytes and bytes/second.
- Unknown-size work is shown as indeterminate — Eternal never invents a percentage.
- All / Active / Complete / Errors filters operate on actual session events.

## Instance system

- Every profile owns an isolated `.minecraft` tree.
- Create from Mojang's complete official catalog.
- Search/type a specific official version instead of using a tiny hard-coded list.
- Edit profile name and RAM without mutating unsafe identity fields.
- Duplicate copies isolated files into a new profile.
- Duplicate/delete are blocked while the profile is running.
- Real playtime, last-played and running-process state remain visible.

## Mod Hub V1

- Modrinth discovery filters against selected Minecraft version and loader.
- Relevance, downloads, follows, newest and recently-updated sorting.
- Real Modrinth category facets.
- Real Load More pagination.
- Project cards use real downloads/follows/categories supplied by Modrinth.
- Required dependencies resolve recursively.
- SHA-512/SHA-1 hashes are verified when provided.
- Partial `.part` files never count as installed.
- Vanilla profiles disable mod install controls instead of pretending JARs load.
- Launcher-managed Eternal Core cannot be disabled/removed through Mod Hub.

## Servers

- Real Minecraft status handshake for online state, protocol, version, player count and latency.
- Standard `_minecraft._tcp` SRV resolution.
- Modern Quick Play and legacy `--server/--port` launch paths are selected by Minecraft version.
- Aternos standard mode stays honest: save, ping, quick join and official dashboard access only without an authorized partner API.

# Eternal Core v1

Automated target: **Minecraft Java 1.21.11 + Fabric + Java 21**. The exact release must compile under that target and pass the release gates; user-hardware gameplay remains the final compatibility check for a specific PC/mod/server combination.

## Right-Shift / input crash hardening

The Core input/UI path was rebuilt after a real crash report.

- GLFW key-repeat events are ignored for Eternal screen opening.
- Mouse actions are normalized to exact press/release values.
- Screen changes are queued onto Minecraft's client task queue instead of being performed re-entrantly inside the keyboard hook.
- Duplicate screen-open requests are blocked while one is pending.
- Keyboard and mouse hooks are guarded so Eternal can write a diagnostic instead of silently losing the cause.
- Core writes runtime diagnostics to stdout/stderr and `config/eternal-core.log`.
- The launcher Minecraft console classifies error/warning lines and shows abnormal process exits with the preceding runtime output.

## Eternal Minecraft title screen

With Eternal Core loaded, the vanilla title screen is replaced by an original premium Eternal start menu.

Working destinations:

- Singleplayer → Minecraft world selection
- Multiplayer → Minecraft server browser
- Modules → Eternal module manager
- HUD Editor → Eternal placement workspace
- Options → Minecraft settings
- Quit Game → Minecraft shutdown

The design follows Eternal's black/charcoal/crimson identity. It does not ship Dawn assets or code.

## Eternal Start

Press the configured Core key (default **Right Shift**) in-game to open Eternal Start. It shows real FPS, ping, session/server state and working actions for Modules, HUD Editor, Resume, module bulk actions, Zoom and notifications.

## Modules are opt-in

Clean installs start with all HUD/Zoom modules **disabled**. The user chooses which modules appear. Existing saved configs continue to load.

### In-game module UI

- Premium black/charcoal/crimson ClickGUI.
- Three-column live module surface.
- Real module toggles and Enable All / Disable All.
- Persistent configurable ClickGUI/HUD/Zoom keybinds with duplicate-bind protection.
- Zoom FOV control.
- Notifications toggle.
- Accent presets, HUD opacity and snap grid.
- Default / Compact / Corners real layout presets.
- Direct access to the HUD Editor.

### HUD Editor

- Dedicated **Modules** button to enable hidden modules.
- Active modules render directly on the placement canvas.
- Drag and grid snap.
- Arrow-key nudging.
- Real coordinate inspector.
- Default/Compact/Corners saved presets.
- Delete disables the selected module.
- Responsive top controls for narrower GUI sizes.
- Positions persist locally.

### Live modules

- Watermark
- FPS
- CPS
- Keystrokes
- Coordinates
- Ping
- Speed
- Direction
- Health
- Armor
- Food
- Server
- JVM Memory
- Session time
- Clock
- Zoom

Keystrokes V1 renders WASD keys plus live LMB/RMB pressed state and real left/right CPS. HUD telemetry is sourced from Minecraft/JVM state, not demo values.

### Core persistence

`config/eternal-core.json` uses temporary writes followed by atomic replacement when supported. Invalid config is backed up as `eternal-core.corrupt-<timestamp>.json`.

`config/eternal-core.log` records Eternal Core runtime diagnostics.

## Standalone Core

The stable release publishes:

`Eternal-Core-Standalone-1.0.0.jar`

It is the same Core binary verified/installed by the launcher and can run in a compatible Fabric 1.21.11 profile without the Eternal launcher running.

# Premium UI/UX

V1 keeps one coherent visual system across launcher and game:

- cinematic launcher hero + Eternal red-E identity
- compact crimson/charcoal shell
- real state hierarchy and controlled micro-motion
- premium full-catalog instance workflow
- premium Mod Hub discovery/filtering/results
- real Eternal Console
- real Downloads telemetry
- server/account/settings/developer/update polish
- custom Eternal Minecraft title screen
- Eternal Start + matching ClickGUI/HUD/HUD Editor/notifications
- responsive behavior
- reduced-motion support in the desktop launcher

No visual state is allowed to invent runtime data.

# Stable release gate

The v1 workflow rebuilds the exact release commit and must pass:

1. Java 21 + clean Eternal Core Gradle build.
2. Core JAR metadata, mod id, icon and `1.0.0` version validation.
3. Node dependency install.
4. Full source/runtime/UI regression tests.
5. Vite production renderer build.
6. Eternal Windows brand checks.
7. Windows NSIS/Electron packaging.
8. `latest.yml` updater metadata validation.
9. Packaged `Eternal Client.exe --smoke-test` startup.
10. Standalone Core JAR generation.
11. SHA-256 checksum generation.
12. Normal GitHub release publication marked **latest** — not prerelease.

## Release files

V1 intentionally does **not** publish a portable ZIP:

- `Eternal.Client.Setup.1.0.0.exe`
- `Eternal-Core-Standalone-1.0.0.jar`
- `latest.yml`
- `SHA256SUMS.txt`

## Scope

The Core v1 build targets Fabric 1.21.11. The launcher implements Vanilla and Fabric profiles across Mojang's official catalog where the underlying launch/loader metadata is available. Microsoft login requires your own Entra/Azure public-client application ID.

Passing CI proves the exact source builds, packages and starts in the automated environment. It cannot prove every PC, driver, server, account or third-party mod combination is bug-free, so failures are logged and fixed rather than hidden behind a “100% bug-free” label.
