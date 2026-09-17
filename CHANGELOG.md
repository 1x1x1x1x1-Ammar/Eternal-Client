# Changelog

## 1.1.0 — Customization Studio

### Launcher
- Added the premium **Eternal Studio** workspace with Modules, Appearance, Crosshair, Profiles and Media surfaces.
- Added a real per-instance launcher ↔ Core config bridge; Studio edits the same `config/eternal-core.json` used by Minecraft.
- Added atomic Core config writes, sanitized module/settings patches and live status feedback.
- Added local Core profile snapshots with save/apply/delete flows.
- Added real screenshot discovery, metadata, delete and open-folder actions for each instance.
- Core overview now links directly into Studio and reflects the shared live-config model.
- Added a deterministic npm override for published `type-fest@5.9.0` after upstream registry metadata attempted to resolve a missing 5.10.0 tarball during CI.

### Eternal Core
- Rebuilt the in-game menu as **ClickGUI 2.0** with HUD, Client, Visual, Style and About sections.
- Added custom Crosshair with configurable color, target color, gap, length, thickness, center dot and outline.
- Added Fullbright with restoration of the player's prior gamma when disabled.
- Added native Toggle Sprint and Toggle Sneak synchronization.
- Added rebindable Perspective camera cycling.
- Upgraded Zoom with smooth interpolation and configurable transition speed.
- Added HUD text-shadow and animated living-accent options.
- Added live config reload so safe Studio changes are picked up while Minecraft is running.
- HUD bulk enable/disable intentionally affects HUD telemetry only and does not switch gameplay/visual helpers.
- Preserved clean-install module defaults as OFF, queued screen opening, safe-mode logging and the v1.0.1 static-init crash regression guard.

### Verification target
- Minecraft Java 1.21.11 + Fabric + Java 21.
- Launcher test/build, Core Gradle build and packaged Windows startup smoke remain release gates.

## 1.0.0 — Stable candidate

### Launcher
- Promoted launcher/Core versions to stable `1.0.0`.
- Premium Eternal black/charcoal/crimson UI system across Home, Instances, Mod Hub, Servers, Accounts, Downloads, Developer, Core and Settings.
- Complete Mojang official version catalog for instance creation, including releases, snapshots, old beta and old alpha entries.
- Real isolated instance create/edit/duplicate/delete/open/launch/stop flows.
- Real Eternal Console (`Ctrl+J`) for backend operations, Minecraft runtime output, warnings/errors and transfer activity.
- Real Downloads center with backend bytes/progress/speed when measurable and indeterminate states when total size is unknown.
- Mod Hub V1: Modrinth sort/category filters, real pagination, dependency resolution and hash verification.
- Stable GitHub updater: check/download/progress/ready/restart-install.
- Renewable encrypted Microsoft session cache and pre-launch silent renewal.
- Single-instance Electron lifecycle, safe external links and packaged startup smoke testing.
- Windows package keeps Eternal branding instead of generic Electron branding.

### Eternal Core
- Certified build target remains Minecraft Java 1.21.11 + Fabric + Java 21.
- Replaces the vanilla Minecraft title screen with an original Eternal premium start menu wired to real Singleplayer, Multiplayer, Modules, HUD Editor, Options and Quit destinations.
- Right Shift opens a dedicated Eternal Start dashboard; H opens the HUD Editor.
- Crash hardening: ignores GLFW key repeats, normalizes mouse actions, queues screen transitions on the Minecraft client task queue, prevents duplicate screen-open requests and logs Core handler failures.
- Core runtime diagnostics are written to stdout/stderr and `config/eternal-core.log`.
- Clean installations keep HUD and Zoom modules disabled until explicitly enabled.
- HUD modules: Watermark, FPS, CPS, Keystrokes, Coordinates, Ping, Speed, Direction, Health, Armor, Food, Server, Memory, Session and Clock; Zoom remains a utility module.
- Premium keystrokes now include live WASD + LMB/RMB pressed states and real CPS.
- HUD Editor includes a Modules button, live placement canvas, drag/snap, arrow nudging, coordinate inspector, presets and Delete-to-disable.
- Persistent keybinds, accent, HUD opacity, snap grid, Zoom FOV, module states and positions.
- Atomic config replacement where supported and malformed-config backup.
- Same verified Core JAR works launcher-managed or standalone.

### Stable release
- Normal/latest GitHub release, not a prerelease.
- Publishes `Eternal.Client.Setup.1.0.0.exe`, `Eternal-Core-Standalone-1.0.0.jar`, `latest.yml`, and `SHA256SUMS.txt`.
- Stable v1 intentionally does **not** publish a portable ZIP.
- Release gate rebuilds Core/launcher, runs regression tests, validates branding/updater metadata, packages Windows and starts the packaged `Eternal Client.exe --smoke-test` before publication.

## 0.8.0-beta.8
- Reality pass across launcher UI, Mojang/Java validation, Modrinth verification, Core integrity and in-game controls.

## 0.7.0-beta.7
- Standalone Eternal Core artifact, Windows Eternal identity and expanded in-game UI.

## 0.6.0-beta.6
- Fixed packaged `electron-updater` import crash and added packaged EXE startup smoke testing.

## 0.5.0-beta.5
- First GitHub-packaged beta with launcher/Core release artifacts and Command Center/HUD expansion.
