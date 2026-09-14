# Eternal Client v1.0.1

**Stable launch + Core safety hotfix.**

This release is focused on the failures reported after v1.0.0: the packaged launcher could fail around the `minecraft-launcher-core` **Client** export, and Eternal Core could crash Minecraft when opening the in-game Eternal screen on some systems. v1.0.1 makes both paths release-gated instead of assuming they work.

## Launcher: `Client` launch failure fixed

- `minecraft-launcher-core` is now loaded through Node's native CommonJS bridge (`createRequire`) instead of relying on packaged Electron ESM namespace interop.
- The launcher verifies that the `Client` export is a constructor before starting a Minecraft pipeline.
- Runtime CI now requires the package, constructs a real `new Client()`, and verifies its `launch`/event API before a release can pass.
- Launch errors before JVM startup are emitted to Eternal Console as real `PROCESS_ERROR` events with the original message.
- The launcher reports when the MCLC Client engine loads successfully, making startup failures much easier to locate.

## Minecraft version handling

- Instance creation now persists Mojang's real version type (`release`, `snapshot`, `old_beta`, `old_alpha`).
- The launch request passes that stored type to the Minecraft launch engine instead of hard-coding every profile as `release`.
- The Instances browser continues to use Mojang's complete official version manifest.
- Vanilla and Fabric remain the only loaders shown because those are the implemented launch paths.

## Real Eternal Console

Open **Ctrl+J** in the launcher.

- **Operations** — instance/account/mod/server/Core/settings/updater actions.
- **Minecraft** — launch lifecycle plus real stdout/debug lines.
- **Transfers** — actual Minecraft/Modrinth/updater transfer events.
- Error/warning classification surfaces exceptions, crashes, fatal/error lines, warnings and abnormal process exits.
- Major operations and runtime errors can open the console automatically.
- Visible output can be copied for bug reports.

## Downloads is a real transfer center

- Minecraft progress emitted by the launcher pipeline is retained as transfer history for the current launcher session.
- Modrinth events use actual transferred/total bytes where available.
- Eternal updater events use real transferred bytes, totals and bytes/second.
- Unknown-size work remains indeterminate; Eternal does not invent percentages.
- All / Active / Complete / Errors filters use real backend state.

# Eternal Core v1.0.1

Certified automated target remains **Minecraft Java 1.21.11 + Fabric + Java 21**.

## Right Shift / Eternal Start crash hardening

The in-game opening path now has multiple independent safety layers:

- GLFW key repeats are ignored for Eternal screen opening.
- Screen creation is queued onto Minecraft's client task queue.
- Duplicate screen-open requests are blocked while one is pending.
- Eternal in-world screens bypass the vanilla background/blur path and draw their own premium dim layer.
- Eternal Start rendering is guarded; if its premium renderer throws, Core logs the exact failure and presents an **Eternal Core Safe Mode** screen instead of intentionally letting the UI exception kill the game.
- Eternal Start button actions are guarded and written to `config/eternal-core.log` on failure.
- Keyboard and mouse hooks continue to log failures through Core diagnostics.

## Premium in-game experience

Eternal keeps its original black/charcoal/crimson identity while targeting the dense, polished interaction quality expected from premium Minecraft clients.

- Custom **Eternal Minecraft title screen** replaces the vanilla title screen while Core is active.
- Singleplayer, Multiplayer, Modules, HUD Editor, Options and Quit are real Minecraft actions.
- Right Shift opens the custom **Eternal Start** control surface.
- Modules opens the real ClickGUI.
- HUD Editor supports drag, snap, arrow-key nudge, presets, inspector and disabling selected modules.
- Keystrokes uses live WASD state plus live LMB/RMB state and CPS.
- Zoom, keybinds, accent, HUD opacity, snap size, notifications and module states persist locally.

## Modules are OFF on a clean install

Eternal does not cover a fresh session with HUD widgets by default. A clean config initializes modules disabled. The player chooses modules from the in-game Modules screen, then places them in HUD Editor.

Existing user configuration is respected.

## Real live modules

Watermark · FPS · CPS · Keystrokes · Coordinates · Ping · Speed · Direction · Health · Armor · Food · Server · JVM Memory · Session · Clock · Zoom utility.

Values come from Minecraft/JVM state rather than generated demo data.

## Standalone Core

`Eternal-Core-Standalone-1.0.1.jar` is the same verified Core binary staged by the launcher and can run from a compatible Fabric 1.21.11 `mods` folder without the Eternal launcher process.

## Stable release artifacts

v1.0.1 publishes only the requested stable artifacts:

- `Eternal.Client.Setup.1.0.1.exe`
- `Eternal-Core-Standalone-1.0.1.jar`
- `latest.yml`
- `SHA256SUMS.txt`

There is **no portable ZIP** in this stable release.

## Release gates

The exact release commit must pass:

1. Java 21 + clean Eternal Core Gradle build.
2. Core JAR metadata/icon/version validation.
3. Launcher dependency install.
4. Runtime smoke test that loads and constructs `minecraft-launcher-core` Client.
5. Source/functionality/UI regression tests.
6. Vite production renderer build.
7. Eternal Windows branding checks.
8. Windows NSIS/Electron packaging.
9. `latest.yml` updater validation.
10. Packaged `Eternal Client.exe --smoke-test` startup.
11. SHA-256 generation and normal latest GitHub release publication.

These gates validate source/build/package/startup behavior in CI. They do not prove every physical PC, GPU, Microsoft account, third-party mod or server combination is bug-free. Real gameplay failures should be captured through Eternal Console / `eternal-core.log` and fixed rather than hidden.
