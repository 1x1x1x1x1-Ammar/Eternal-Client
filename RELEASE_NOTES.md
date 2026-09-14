# Eternal Client v0.6.0-beta.6

**Reference-locked UI + packaged-startup reliability beta.**

This release focuses on two things: making Eternal look much closer to the supplied black/crimson premium Minecraft-client reference, and preventing packaged builds from shipping when the Electron main process cannot actually start.

## Critical fix from beta 5

Beta 5 could crash immediately with:

```text
SyntaxError: Named export 'autoUpdater' not found. The requested module 'electron-updater' is a CommonJS module.
```

Beta 6 fixes that by loading `electron-updater` through its CommonJS default export. The release pipeline now also launches the **packaged Windows executable** with a dedicated `--smoke-test` mode before publishing the GitHub release. If the real packaged main process cannot import its dependencies or load the renderer, the release fails instead of shipping a broken installer.

## UI / UX — beta 6

- Launcher proportions and visual language reworked around the supplied Eternal reference image.
- Wider premium left rail with labelled Home / Instances / Mods / Servers / Accounts / Settings / Downloads / Developer navigation.
- Cinematic black/crimson Home hero with Eternal emblem, direct Play action and a **real instance selector**.
- Reference-style four-panel dashboard:
  - **Command Center** — every action calls a real route or launcher API.
  - **HUD Editor preview** — clearly marked as preview; actual editing still happens inside Minecraft with `H`.
  - **Accounts** — real Microsoft/offline account state.
  - **Instances** — actual profiles and real running-state indicators.
- Bottom capability strip wired to real Eternal pages rather than decorative cards.
- Improved animations, glows, panel depth, hover states, spacing and responsive behavior.
- New Eternal Core page styled like the in-game side of the reference while only listing implemented Core features.

## Real launcher functions retained

- Isolated Minecraft instances.
- Vanilla + Fabric launch paths.
- Multiple Minecraft processes per profile.
- Microsoft + offline account architecture.
- Java runtime detection.
- Modrinth search/install filtered to the selected Minecraft version + loader.
- Real Minecraft server status, player count, protocol and latency handling.
- Real quick-play server launch path.
- Actual launcher/download activity state — no fake random progress.

## Eternal Core

Current certified target: **Minecraft 1.21.11 + Fabric**.

Current implemented in-game features include:

- Right Shift ClickGUI
- draggable HUD editor (`H`)
- hold-C zoom
- FPS
- CPS
- keystrokes
- coordinates
- ping
- movement speed
- direction
- JVM memory
- session time

## New release gate

Beta 6 will only publish after all of these pass:

1. Eternal Core Gradle build.
2. launcher dependency install.
3. source/runtime tests.
4. renderer production build.
5. Windows Electron packaging.
6. **packaged executable startup smoke test**.
7. installer / portable artifact creation.
8. SHA256 generation.

## Important beta notes

Microsoft login still requires your own Entra/Azure public client ID. Additional loader/version combinations are not called supported until they are actually implemented and tested.

Aternos privileged controls are not faked. Without an authorized API, Eternal only exposes legitimate standard-mode server status, quick-join and dashboard behavior.

## Eternal rule

> If a control looks functional, it must perform a real action. If a feature is unavailable, Eternal must say so instead of pretending.
