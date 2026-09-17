# Eternal Client v1.1.0

## The Client Update

Eternal Client v1.1.0 is the first release where the launcher and the in-game client are designed as one product.

The launcher, Customization Studio, Minecraft title screen, Right-Shift Start center, ClickGUI 2.0, HUD Studio, HUD widgets and notifications now share the same Eternal black / charcoal / crimson visual language while staying connected to real launcher and Minecraft state.

This is not a demo skin. Every control shipped here is backed by implemented local behavior.

---

## A completely rebuilt in-game Eternal experience

### Eternal Minecraft start screen

When Eternal Core is active, Minecraft opens into the custom Eternal title experience with:

- Real Singleplayer and Multiplayer navigation.
- Modules / ClickGUI access.
- HUD Studio access.
- Minecraft Options and Quit actions.
- Live Eternal Core status and enabled-module count.
- Premium animated depth, grid, glow and glass treatment.
- Original Eternal artwork and UI code.

### Right Shift — Eternal Start

Right Shift opens the new Eternal in-world command center with:

- Resume.
- ClickGUI 2.0.
- HUD Studio.
- Minecraft Options.
- Current world/server context.
- Live FPS, ping, health, coordinates and session telemetry.
- Quick module controls.
- One-click HUD layout presets.

The screen opening path remains queued on Minecraft's client task thread, repeat-safe and protected by Eternal Core's safe-mode fallback.

### ClickGUI 2.0

The module UI is now a full client configuration surface organized into:

- HUD
- Client
- Visual
- Style
- About

It includes real persisted toggles, keybind rebinding, style controls, HUD settings, presets and Crosshair customization.

### HUD Studio

The HUD editor has been rebuilt into a real visual workspace:

- Drag widgets directly on the game canvas.
- Snap grid and center guides.
- Arrow-key nudging.
- Selected-widget inspector.
- Disable selected widgets.
- Default / Compact / Corners presets.
- Local auto-save.

### Premium live HUD

The HUD renderer now presents real Minecraft/JVM values with the shared Eternal design system, including:

- Eternal watermark
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
- Memory
- Session
- Clock

Keystrokes uses live WASD plus LMB/RMB state and real CPS tracking.

---

## New Core modules and controls

### Custom Crosshair

A real custom crosshair renderer with:

- Gap
- Length
- Thickness
- Center dot
- Outline
- Normal color
- Target color

### Fullbright

Fullbright raises brightness while enabled and restores the player's previous gamma state when disabled.

### Toggle Sprint / Toggle Sneak

Native persistent sprint and sneak toggles integrated into Core state.

### Perspective

A rebindable perspective key cycles the supported Minecraft camera perspectives.

### Smooth Zoom

Zoom now supports:

- Configurable target FOV.
- Smooth interpolation.
- Configurable zoom speed.
- Rebindable zoom key.

### HUD styling

- HUD opacity.
- Text shadows.
- Living accent treatment.
- Snap size.
- Layout presets.
- Persistent local settings.

Clean installations still start with modules disabled. Eternal does not cover the player's screen with unwanted widgets on first launch.

---

# Eternal Launcher v1.1.0

## Final stable visual shell

The stable launcher receives an additional v1.1 release polish layer:

- Deeper black/charcoal surfaces.
- Animated ambient background treatment.
- Refined crimson edge-lighting.
- Improved glass depth and elevation.
- Stronger active navigation feedback.
- Better card and control interaction states.
- Improved focus states and scrollbars.
- Responsive behavior preserved at compact window sizes.
- Reduced-motion behavior respected.
- Dedicated 1.1 release identity in the launcher chrome.

## Customization Studio

The launcher now contains a dedicated Eternal Studio connected to each compatible Minecraft instance.

Studio provides real controls for:

- Modules.
- Appearance.
- Crosshair configuration.
- Saved local Core profiles.
- Minecraft screenshots/media.

Changes are written atomically into the selected instance's Eternal Core config. Core can reload external launcher changes while Minecraft is running.

## Local Core profiles

Save and apply real local Core configuration snapshots without requiring a cloud account.

## Screenshot management

Studio can discover the selected instance's real Minecraft screenshots, open the screenshot folder and delete selected screenshots.

## Launcher systems retained

v1.1 keeps the real systems already hardened in v1.0.1:

- Complete Mojang version catalog handling.
- Vanilla and Fabric launch paths.
- Java validation before launch.
- Microsoft/offline account support.
- Modrinth install verification and required dependencies.
- Real server protocol/SRV checks and quick-play arguments.
- Ctrl+J Eternal Console.
- Real transfer/download events instead of invented percentages.
- Stable updater integration.
- Packaged Electron startup smoke gate.

---

# Standalone Eternal Core v1.1.0

`Eternal-Core-Standalone-1.1.0.jar` is the same verified Core binary staged into compatible launcher instances.

It can be placed directly in the `mods` folder of a compatible **Minecraft Java 1.21.11 + Fabric + Java 21** installation and used without keeping the Eternal launcher process open.

The standalone build includes the same:

- Eternal title/start UI.
- Right-Shift command center.
- ClickGUI 2.0.
- HUD Studio.
- HUD widgets.
- Custom crosshair.
- Fullbright.
- Toggle Sprint / Toggle Sneak.
- Perspective.
- Smooth Zoom.
- Notifications.
- Local persistence and crash-safe UI path.

---

## Stable v1.1.0 release artifacts

The release publishes:

- `Eternal.Client.Setup.1.1.0.exe`
- `Eternal-Core-Standalone-1.1.0.jar`
- `latest.yml`
- `SHA256SUMS.txt`

No portable ZIP is included in this stable channel.

---

## Release verification

The exact v1.1.0 release commit must pass all of these gates before GitHub publication:

1. Clean Java 21 Eternal Core Gradle build.
2. Standalone Core JAR metadata, icon, class and version validation.
3. Launcher dependency installation.
4. Complete source/UI/runtime regression suite.
5. `minecraft-launcher-core` runtime constructor smoke test.
6. Vite production renderer build.
7. v1.1 final visual-layer ordering checks.
8. Eternal branding validation.
9. Windows x64 NSIS packaging.
10. `latest.yml` updater metadata validation.
11. Packaged `Eternal Client.exe --smoke-test` startup.
12. SHA-256 generation for every published release artifact.

These automated gates validate source, build, package and startup behavior. Third-party mods, servers, GPUs and account environments can still behave differently on individual systems; Eternal Console and `config/eternal-core.log` remain the primary diagnostic paths for real-world failures.
