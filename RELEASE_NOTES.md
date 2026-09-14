# Eternal Client v1.0.1

**Critical Core startup hotfix + real Skin Studio + premium Accounts UI.**

Eternal v1.0.1 is a stability release built from a real user crash report. It fixes the fatal Eternal Core initialization bug, keeps the premium launcher/in-game systems from v1.0.0, and adds a real account/skin workflow instead of a decorative cosmetics page.

## Critical Eternal Core crash fix

A real v1.0.0 Minecraft crash showed:

```text
ExceptionInInitializerError
Caused by: NullPointerException
at gg.eternal.core.config.CoreConfig.<init>
at gg.eternal.core.config.CoreConfig.<clinit>
```

The Core singleton was constructed before its static module catalog had been initialized. The constructor then iterated a null `MODULES` array and Fabric crashed during Eternal's client entrypoint.

v1.0.1 fixes the initialization order permanently:

- `MODULES` is initialized before `CoreConfig.INSTANCE`.
- A dedicated regression gate fails CI if this declaration order is reversed again.
- Clean installs still start with all HUD/Zoom modules disabled.
- Existing saved module states continue to load from `config/eternal-core.json`.

The Mojang/Authlib `401 Failed to fetch user properties` line seen in the same log was not the fatal Eternal Core exception; the fatal code path was the Core static initializer above. Eternal Console still keeps authentication warnings/errors visible for diagnosis.

## Real Skin Studio

Accounts now includes a real Skin Studio backed by launcher services and Minecraft Services.

### Microsoft Minecraft accounts

- Reads the active skin, model variant and cape from the authenticated Minecraft profile.
- Refreshes current cosmetics from Minecraft Services.
- Accepts validated Minecraft skin PNGs only (`64x64` or legacy `64x32`).
- Supports **Classic** and **Slim** model selection.
- Uploads the selected PNG through the authenticated Minecraft Services skin endpoint.
- Reset uses the authenticated Minecraft Services skin reset endpoint.
- Refreshes the account profile after a successful change so the launcher preview matches the server-side profile.
- Uses the existing encrypted renewable Microsoft session state; skin actions do not store access tokens in the renderer.

### Offline accounts

- Can select a validated skin PNG for Eternal's local account preview.
- The PNG is stored under Eternal's own data directory, not uploaded to Mojang.
- The UI explicitly marks offline cosmetics as **local-only** and does not pretend they change premium online-server skins.
- Removing the offline account also removes its Eternal-managed local skin file.

### Skin preview

- Account cards show the real downloaded/local face texture when available.
- Skin Studio has a pixel-accurate front-body canvas with base + overlay layers.
- Classic/slim arm widths are reflected in the preview.
- Official `textures.minecraft.net` skin URLs are normalized to HTTPS and proxied through the Electron backend as safe data URLs so packaged Electron rendering is not dependent on fragile cross-origin canvas behavior.

## Accounts UI/UX

The Accounts page is rebuilt as a premium Eternal identity surface:

- cinematic active-profile hero
- Microsoft/offline identity status
- model + cape facts
- richer account cards and real active-account state
- animated Skin Studio stage
- Classic/Slim switch
- real Choose & Apply / Reset / Refresh controls
- Microsoft device-code login retained
- offline-account quick add retained
- responsive compact layouts
- reduced-motion fallback

Every visible control maps to a real backend action or is disabled when the selected account cannot perform it.

## Eternal Console

Open **Ctrl+J** for Eternal's real operation/runtime console.

It receives:

- instance create/edit/duplicate/delete/launch/stop operations
- account login/activate/remove/profile-refresh/skin operations
- Modrinth install/toggle/remove activity
- Minecraft launch lifecycle and stdout/debug messages
- downloads/transfers
- server operations
- Core export
- settings changes
- updater state
- classified warnings/errors and abnormal Minecraft exits

Major operations can open the console automatically. Visible lines can be copied for bug reports.

## Downloads

The Downloads tab remains a real transfer center:

- Minecraft preparation/download activity from the launch pipeline
- Modrinth byte progress where the provider supplies totals
- updater transfer bytes, total bytes and bytes/second
- indeterminate state when no measurable total exists
- real All / Active / Complete / Errors filters

Eternal does not generate fake percentages.

## Instance system

- Isolated `.minecraft` directory per profile.
- Complete official Mojang version catalog: releases, snapshots, old beta and old alpha entries.
- Search/type official versions rather than a tiny hard-coded list.
- Real Vanilla + Fabric paths only; loaders that Eternal does not implement are not advertised.
- Edit name/RAM.
- Duplicate isolated profile files.
- Delete/duplicate protected while the profile is running.
- Real playtime, last-played and process state.

## Mod Hub

- Real Modrinth discovery for the selected profile.
- Version/loader compatibility filtering.
- Search, categories and multiple real sort modes.
- Real pagination / Load More.
- Project downloads/follows/category metadata from Modrinth.
- Recursive required-dependency installation.
- SHA-512/SHA-1 verification where Modrinth supplies hashes.
- `.part` files never count as installed content.
- Vanilla instances cannot pretend mod JARs are loadable.
- Launcher-managed Eternal Core cannot be removed/disabled from Mod Hub.

# Eternal Core v1.0.1

Automated target: **Minecraft Java 1.21.11 + Fabric + Java 21**.

## Eternal Minecraft title screen

When Eternal Core is loaded, the vanilla Minecraft title screen is replaced by Eternal's original black/charcoal/crimson start menu.

Working actions:

- **Singleplayer** → Minecraft world selection
- **Multiplayer** → Minecraft server browser
- **Modules** → Eternal module manager
- **HUD Editor** → Eternal placement workspace
- **Options** → Minecraft settings
- **Quit Game** → Minecraft shutdown

The UI targets premium Minecraft-client density and motion while using Eternal's own code, identity and assets.

## Eternal Start / Right Shift

The configured Core key (default **Right Shift**) opens Eternal Start. Screen changes are queued onto Minecraft's client task queue instead of being opened re-entrantly from the keyboard hook. Duplicate queued opens are blocked and failures are written to `config/eternal-core.log`.

Working actions include Modules, HUD Editor, Resume, module bulk controls, Zoom and notifications.

## Modules are opt-in

A clean v1.0.1 config starts all modules **disabled**. The player chooses what becomes visible.

Implemented live modules:

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

Keystrokes uses live WASD/LMB/RMB state and live CPS. Telemetry comes from Minecraft/JVM state rather than generated demo values.

## HUD Editor

- Modules browser for hidden/disabled modules.
- Active modules render on the placement workspace.
- Drag + snap grid.
- Arrow-key nudging.
- Real coordinate inspector.
- Default / Compact / Corners layout presets.
- Delete disables the selected module.
- Positions/settings persist locally.

## Core diagnostics and persistence

- `config/eternal-core.log` records Core runtime diagnostics.
- `config/eternal-core.json` uses a temporary write and atomic replacement when available.
- Malformed config is backed up as `eternal-core.corrupt-<timestamp>.json`.

## Standalone Core

The release publishes:

`Eternal-Core-Standalone-1.0.1.jar`

This is the same verified Core binary staged by the launcher and can run in a compatible Fabric 1.21.11 profile without Eternal Launcher running.

# Stable release gate

v1.0.1 is published only after the exact release commit passes:

1. Java 21 + clean Eternal Core Gradle build.
2. Core JAR metadata, mod id, icon and `1.0.1` validation.
3. Node dependency install.
4. Full source/runtime/UI regression tests, including the static-initialization crash regression.
5. Vite production renderer build.
6. Eternal Windows branding checks.
7. Windows NSIS/Electron packaging.
8. `latest.yml` updater metadata validation.
9. Packaged `Eternal Client.exe --smoke-test` startup.
10. Standalone Core JAR generation.
11. SHA-256 checksum generation.
12. Normal GitHub release publication marked **latest**, not prerelease.

## Release files

v1.0.1 intentionally does **not** publish a portable ZIP:

- `Eternal.Client.Setup.1.0.1.exe`
- `Eternal-Core-Standalone-1.0.1.jar`
- `latest.yml`
- `SHA256SUMS.txt`

## Scope

Core v1.0.1 targets Fabric 1.21.11. The launcher implements Vanilla and Fabric across Mojang's official catalog where the underlying launch/loader metadata is available. Microsoft login requires a configured Entra/Azure public-client application ID.

Passing CI proves the exact source compiles, packages and boots in the automated environments. Real hardware, graphics drivers, networks, servers and account states can still expose issues, so Eternal logs real failures and fixes them rather than labeling untested combinations bug-free.
