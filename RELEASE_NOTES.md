# Eternal Client v0.7.0-beta.7

**Core Evolution beta — standalone Eternal Core, stronger in-game UI, and branded Windows packaging.**

Beta 7 focuses on the experience after Minecraft starts. Eternal Core now behaves as a much more complete in-game client and the exact same JAR can also be used without the Eternal launcher.

## Eternal Core UI

- Rebuilt ClickGUI with **HUD / Utility / Style / About** sections.
- Premium black/crimson visual language matching the Eternal launcher.
- Persistent module toggles and settings.
- Persistent accent-color selection.
- Persistent HUD opacity.
- Configurable Zoom FOV.
- Configurable HUD snap grid.
- Default / Compact / Corners HUD presets.
- Core notifications for module and setting changes.
- Improved draggable HUD editor.

## Current real Core modules

- Watermark
- FPS
- CPS
- Keystrokes
- Coordinates
- Ping
- Speed
- Direction
- JVM Memory
- Session time
- Clock
- configurable hold-C Zoom

Keybinds remain:

- **Right Shift** — Eternal Core ClickGUI
- **H** — HUD Editor
- **Hold C** — Zoom

## Standalone Core

The release now publishes:

```text
Eternal-Core-Standalone-0.7.0-beta.7.jar
```

It is the **same Core binary used by launcher-managed profiles**. For standalone use, place it into a compatible Minecraft 1.21.11 Fabric profile's `mods` folder and launch Minecraft normally with Java 21. No Eternal launcher process is required while the game is running.

The launcher also has a real **Export standalone JAR** action backed by Electron IPC and a save dialog.

## Branding / icon reliability

- Windows AppUserModelID is explicitly set to `gg.eternal.client`.
- The Eternal red-E mark is used as the application identity instead of falling back to Electron branding.
- electron-builder receives the Eternal vector mark as the Windows icon source.
- The launcher validates branding assets before packaging.
- Eternal Core embeds the Eternal icon into its Fabric mod metadata.
- Renderer logo imports are bundled through Vite, avoiding broken `/assets/...` paths in packaged `file://` builds.

## Launcher functions retained

- Isolated Minecraft instances.
- Vanilla + Fabric launch paths.
- Multiple Minecraft processes per profile.
- Microsoft + offline account architecture.
- Java runtime detection.
- Modrinth search/install filtered to the selected Minecraft version + loader.
- Real Minecraft server status, player count, protocol and latency handling.
- Real quick-play server launch path.
- Actual launcher/download activity state — no fake random progress.
- Packaged Windows startup smoke testing.

## Beta 7 release gate

This pre-release only publishes after:

1. Eternal Core Gradle compile.
2. standalone JAR metadata validation.
3. standalone JAR embedded-icon validation.
4. launcher dependency install.
5. source/runtime tests.
6. Vite production renderer build.
7. Eternal Windows icon-source validation.
8. Windows NSIS packaging.
9. **packaged executable startup smoke test**.
10. installer / portable / standalone Core artifact creation.
11. SHA256 generation.

## Current certification

Eternal Core is currently certified for **Minecraft 1.21.11 + Fabric + Java 21** only. Other versions/loaders are not marked supported until their real code paths are implemented and tested.

Microsoft login still requires your own Entra/Azure public-client application ID. Aternos privileged controls are not faked without an authorized API.

> If a control looks functional, it must perform a real action. If a feature is unavailable, Eternal must say so instead of pretending.
