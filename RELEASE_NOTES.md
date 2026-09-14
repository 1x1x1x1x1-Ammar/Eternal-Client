# Eternal Client v0.5.0-beta.5

**First public GitHub beta.**

Eternal is a Windows-first Minecraft launcher **and** a real in-game Fabric client. This beta focuses on making the launcher feel like a premium Minecraft client while keeping visible state tied to real backend behavior.

## Highlights

- Reworked black/crimson release UI with the new Eternal red E emblem.
- Home now uses a direct **Play + real instance selector** flow.
- Dedicated Accounts, Downloads and Developer pages.
- Microsoft + offline account architecture.
- Isolated Minecraft instances.
- Vanilla + Fabric launch paths.
- Modrinth search/install filtered to the selected Minecraft version + loader.
- Genuine Minecraft server status/latency/player-count protocol handling.
- Multiple Minecraft processes tracked per profile.
- PID-aware exit state so one closing process does not falsely stop the others.
- Eternal Core is built and packaged into the launcher for the supported target.

## Eternal Core

Current certified source target: **Minecraft 1.21.11 + Fabric**.

Current in-game features include:

- Right Shift ClickGUI
- draggable HUD editor
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

## Important beta notes

This release is intentionally marked **pre-release**. Microsoft login still requires your own Entra/Azure public client ID, and additional loader/version combinations are not called supported until they are actually ported and tested.

Aternos privileged controls are not faked. Without an authorized partner API, Eternal only exposes legitimate server status, quick-join and dashboard behavior.

## Integrity rule

> If a button looks functional, it must perform a real action. If a feature is not ready, Eternal must say so instead of pretending.
