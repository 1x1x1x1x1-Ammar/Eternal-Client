# Eternal Client v0.8.0-beta.8

**Reality Pass — bug fixing, real controls, premium launcher UI, and a stronger in-game Core.**

Beta 8 is deliberately less about adding decorative feature labels and more about making existing Eternal features honest, resilient and polished. A visible control should either execute a real action or be disabled with a clear reason.

## Launcher reliability

- Minecraft instance creation now validates the selected release against Mojang's official version manifest.
- Configured Java paths are executed and version-checked before launch instead of being trusted blindly.
- Minecraft launch rejects loaders this build does not actually implement.
- Fabric profiles resolve loader metadata through Fabric's official metadata API.
- Modern server Quick Play and older `--server/--port` launch arguments are selected by Minecraft version.
- Launcher lifecycle state is no longer overwritten by noisy Minecraft log/debug lines.
- Bootstrap failures now produce a real retry screen instead of leaving an endless loading splash.
- External links and folder-opening actions surface backend errors to the UI.
- Existing packaged Electron startup smoke testing remains mandatory.

## Mod Hub — real install hardening

- Modrinth search remains filtered by selected Minecraft version + loader.
- Required Modrinth dependencies are resolved recursively.
- Downloaded Modrinth files are verified using supplied SHA-512/SHA-1 hashes before installation.
- Partial `.part` files are cleaned up after failures.
- Existing mod files are skipped only when their real hash matches the expected Modrinth file.
- Vanilla profiles disable mod-install/add controls instead of pretending JAR files will work.
- Launcher-managed `eternal-core.jar` is protected from manual toggle/remove/overwrite operations in Mod Hub.
- Real byte progress is emitted into Eternal's activity/download UI.

## Servers

- Real Minecraft status handshake remains the source of player count, version, protocol and latency.
- Standard `_minecraft._tcp` SRV records are now resolved before connecting.
- SRV-resolved endpoint information is shown in the server UI.
- Quick Join launches the selected real Minecraft instance.
- Aternos integration remains honest: save, ping, join and official dashboard links are available; privileged start/stop/console controls are not faked without an authorized API.

## Eternal Core — Beta 8 in-game UI

- ClickGUI receives a larger black/crimson premium layout with improved hover states, switches, spacing and subtle animated detail.
- HUD page has real **Enable All / Disable All** actions.
- ClickGUI open key, HUD Editor key and Zoom key are now **actually rebindable inside Minecraft**.
- Keybinds persist to `config/eternal-core.json` and duplicate Eternal bindings are rejected.
- Zoom FOV, notifications, accent, HUD opacity, snap grid and layout presets remain real persistent controls.
- HUD Editor keeps real drag + snap and adds arrow-key nudging.
- Pressing **Delete** in HUD Editor disables the selected module for real.
- Inspector shows actual saved module coordinates and snap size.
- Eternal Core remains a standalone Fabric mod and the exact same binary is used by launcher-managed profiles.

### Current live Core modules

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
- Zoom

Default Core keys are Right Shift / H / C, but Beta 8 lets you rebind them from inside Core.

## Core integrity

- Launcher-managed Core is validated as an Eternal Core JAR using `fabric.mod.json`.
- Staged and installed Core JARs receive SHA-256 hashes.
- Launcher reports whether installed Core is an exact match.
- **Launch with Core** refuses unsupported profiles and repairs/replaces a mismatched Core before starting Minecraft.
- Standalone export is copied through a temporary file, metadata-checked, SHA-256 compared and only then committed to the chosen destination.

## Launcher UI / UX

- New Beta 8 visual layer across Home, Core, Instances, Mods, Servers, Accounts, Settings, Developer and Command Center.
- Tighter Dawn-inspired desktop-client proportions while retaining original Eternal branding/assets/code.
- Refined cinematic hero, red-E lighting, glass/dark surfaces, compact sidebar, hover motion and status hierarchy.
- Responsive layouts for narrower windows.
- Reduced-motion preference is respected.
- Activity Dock uses real lifecycle/download state and never invents a percentage when total bytes are unavailable.
- Account/device-code flow, Java validation, Modrinth state, server state and Core integrity now expose explicit busy/error/success states.

## Release gate

Beta 8 is only published after GitHub Actions passes:

1. Eternal Core Gradle compile on Java 21.
2. standalone JAR metadata + embedded icon validation.
3. launcher dependency install.
4. Beta 8 source/runtime regression tests.
5. Vite production renderer build.
6. branded Windows resource validation.
7. Windows NSIS packaging.
8. **packaged `Eternal Client.exe` startup smoke test**.
9. installer / portable / standalone Core artifact generation.
10. SHA-256 checksum generation.
11. GitHub pre-release publication.

## Certification boundary

Eternal Core is currently certified for **Minecraft 1.21.11 + Fabric + Java 21**. The launcher creates and launches Vanilla/Fabric release profiles, but no other loader is labeled implemented until its real path exists and passes tests.

Microsoft login requires your own Entra/Azure public-client application ID. Eternal does not borrow another launcher's OAuth identity.

> **Beta 8 rule:** if a button looks usable, it must run a real code path. If Eternal cannot perform an action, the UI should disable it or explain why instead of faking success.
