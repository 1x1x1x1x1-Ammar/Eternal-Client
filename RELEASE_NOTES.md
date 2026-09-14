# Eternal Client v1.0.1

**Stable reliability + premium UI patch for the launcher and Eternal Core.**

v1.0.1 focuses on the real issues found after the first stable release: Core screen crashes, in-game UI resilience, diagnostics, HUD editing, keystrokes presentation, launch/download visibility and another launcher-wide polish pass.

## Core crash hardening

The Core screen path is now defensive at multiple levels instead of allowing a UI/module failure to take down the Minecraft render loop.

- Eternal screen opens remain queued onto Minecraft's client task queue.
- GLFW repeat events remain blocked for Eternal screen opening.
- Modules screen rendering, mouse input and keyboard input are guarded.
- HUD Studio rendering, dragging, mouse release and keyboard input are guarded.
- Top-level HUD mixin rendering is guarded.
- Individual HUD modules are isolated: if one module throws, Eternal logs the full failure and disables that module instead of crashing the whole game.
- `config/eternal-core.log` now persists complete Java stack traces, not only the first exception line.
- Screen recovery returns to Eternal Start when possible and logs the exact recovery failure if that also fails.

## Eternal Minecraft start screen

The normal Minecraft title surface is replaced while Eternal Core is loaded by an original Eternal start screen using the same black/charcoal/crimson visual language as the launcher.

Real destinations remain real:

- Singleplayer → Minecraft world selection
- Multiplayer → Minecraft server browser
- Modules → Eternal module center
- HUD Studio → real draggable HUD workspace
- Options → Minecraft settings
- Quit Game → Minecraft shutdown

v1.0.1 adds stronger visual hierarchy, status information, current keybind hints, active module count, premium hover states and a safe fallback menu if the advanced title renderer ever fails.

## Eternal Start + Modules

The Core key (default **Right Shift**) opens Eternal Start, then the user chooses Modules or HUD Studio. Clean installs keep HUD/Zoom modules **off by default**.

The rebuilt module center now includes:

- live enabled-module count
- real ON/OFF module cards
- Enable All / Disable All
- **Edit Layout** button that opens the real HUD Studio
- Eternal Start return control
- real Zoom FOV and notifications controls
- persistent ClickGUI/HUD/Zoom key rebinding with duplicate-bind protection
- accent, opacity and snap-grid controls
- Default / Compact / Corners presets
- crash recovery with full diagnostic logging

Nothing in the module grid is a decorative fake control.

## HUD Studio

The in-game HUD editor received a full interaction/UI pass:

- live preview of active modules
- drag positioning with grid snap
- arrow-key nudging
- visible selection anchors
- real position and size inspector
- active-module counter
- Modules button to add/remove HUD widgets
- Default / Compact / Corners presets
- Delete disables the selected module
- saved position confirmation
- guarded render/input/drag recovery

Disabled modules do not render until the user enables them.

## Keystrokes + HUD visuals

Keystrokes now has a more complete premium HUD presentation while remaining entirely backed by real input state:

- W/A/S/D pressed-state glow
- LMB/RMB pressed state
- real left/right CPS
- total CPS footer
- CPS activity bars
- deeper panel layering and selected/hover chrome

Health, Armor and Food telemetry cards now receive real value bars based on the player's actual current values. Other HUD values continue to come from Minecraft/JVM runtime state.

## Launcher Console

Eternal Console remains accessible with **Ctrl+J** and now works as the primary place to inspect launcher and game problems.

- Operations: instance/account/mod/server/Core/settings/updater actions
- Minecraft: lifecycle plus real stdout/debug output
- Transfers: Minecraft/Modrinth/updater transfer events
- Java/Fabric/account/Core preparation failures are now emitted as explicit Minecraft `ERROR` lifecycle events even when Minecraft never reaches JVM startup.
- Runtime error/warning lines and abnormal exit codes automatically surface as problem states.

## Real Downloads tab

Downloads now exposes the actual session transfer/launch stream and includes:

- Active / Complete / Errors filtering
- real transferred/total bytes when available
- bytes/second when supplied by the backend
- indeterminate progress for unknown-size work instead of invented percentages
- explicit pre-launch and runtime error rows
- **Open console** action from the page and directly from failed rows
- **Clear session transfers** action that clears only stored transfer-event history, not active runtime state

## Launcher UI/UX polish

A new final `v1.0.1.css` layer loads after the existing premium system and improves the whole desktop experience without changing runtime truth:

- tighter sidebar navigation states and Eternal red-E presence
- stronger page hierarchy and section dividers
- premium button hover/press/focus states
- richer Home hero depth
- instance running/busy states and modal motion
- Mod Hub cards/toolbars
- servers/accounts/settings/developer surfaces
- Core desktop status surfaces
- Console severity styling
- Downloads error/completion hierarchy
- responsive layouts and reduced-motion handling

## Instances + versions

The existing v1 instance system remains intact:

- isolated per-profile `.minecraft`
- complete official Mojang version catalog, including releases/snapshots/old beta/old alpha
- Vanilla + Fabric launch paths only because those are the implemented loaders
- Fabric metadata resolution at launch
- per-instance RAM/name editing
- isolated duplication
- running-state protection for destructive operations

## Mod Hub

The existing real Modrinth flow remains intact:

- actual selected Minecraft version + loader filtering
- relevance/download/follow/newest/update sorting
- categories/facets
- pagination
- required dependency resolution
- SHA-512/SHA-1 verification when provided
- `.part` protection
- Vanilla install blocking
- launcher-managed Eternal Core protection

## Standalone Core

The same Core used by the launcher is published as:

`Eternal-Core-Standalone-1.0.1.jar`

It runs in a compatible Fabric 1.21.11 profile without the Eternal launcher process running.

## Stable release files

v1.0.1 intentionally remains **installer-only** for the desktop launcher. No portable ZIP is published.

- `Eternal.Client.Setup.1.0.1.exe`
- `Eternal-Core-Standalone-1.0.1.jar`
- `latest.yml`
- `SHA256SUMS.txt`

## Release gates

The exact v1.0.1 release commit must pass:

1. Java 21 + clean Eternal Core Gradle build.
2. Core metadata/icon/version inspection.
3. Launcher dependency install.
4. Full source/runtime/UI regression suite, including crash-recovery/console/download tests.
5. Vite production renderer build.
6. Windows Eternal branding validation.
7. NSIS/Electron packaging.
8. `latest.yml` updater metadata validation for `1.0.1`.
9. Packaged `Eternal Client.exe --smoke-test` startup.
10. Standalone Core JAR preparation.
11. SHA-256 checksum generation.
12. Normal GitHub release publication marked latest, not prerelease.

Passing these automated gates proves the exact source compiles, packages and the packaged launcher boots in CI. Real gameplay on different PCs/mod stacks can still reveal runtime compatibility problems; Eternal now records those failures in the launcher console and `eternal-core.log` so they can be fixed rather than hidden.
