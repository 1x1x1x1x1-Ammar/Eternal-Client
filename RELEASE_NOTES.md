# Eternal Client v1.0.0

**The first stable Eternal release — real launcher, real in-game Core, stable update channel, premium UI.**

Eternal v1 promotes the project out of beta after a release-hardening pass across launcher lifecycle, instance management, Microsoft sessions, Modrinth discovery, Core persistence, stable updating, Windows packaging and both desktop/in-game UI systems.

## Launcher reliability

- Mojang's official version manifest backs the **complete version catalog**, not a hand-written list.
- New instances can target official releases, snapshots, old beta and old alpha entries from Mojang metadata.
- Vanilla and Fabric are the only launch paths advertised because they are the paths implemented in this release.
- Fabric compatibility is resolved against Fabric's own metadata when a profile launches.
- Java is detected/validated before launch and the Minecraft-required Java major is enforced.
- Microsoft sessions keep encrypted MSAL cache state and attempt silent renewal before launch when the Minecraft access token is near expiry.
- Microsoft ownership/profile checks still run through Xbox Live → XSTS → Minecraft Services.
- Offline profiles keep Minecraft-compatible deterministic UUID behavior.
- Launcher process errors are surfaced into real lifecycle state.
- Eternal is single-instance on Windows; opening it again restores/focuses the existing window.
- External windows are denied inside Electron and safe http/https destinations open through the system browser.
- Renderer stays context-isolated, sandboxed and without Node integration.

## Real Eternal Console

V1 adds a launcher operation console that opens automatically when real work starts and can also be toggled with **Ctrl+J**.

The console receives events from Electron backend operations rather than generated demo text. It covers instance create/edit/duplicate/delete/open/launch/stop, Modrinth installs and mod state changes, account actions, server actions, Core export, settings writes and updater operations. Separate tabs expose Minecraft launch logs and transfer events.

## Instance system

- Every profile gets an isolated `.minecraft` tree with mods, config, saves, resource packs, shader packs, screenshots and logs.
- Create from Mojang's complete official version catalog.
- Search/type a specific official Minecraft version instead of being limited to a small dropdown.
- Edit profile name and RAM without mutating unsafe identity fields.
- Duplicate an instance by copying its isolated files into a new profile.
- Duplicate/delete are blocked while the profile is running to avoid inconsistent copies or destructive races.
- Real playtime, last-played and running-process state remain visible on profile cards.

## Stable updater

V1 enables a real GitHub stable update feed. Settings exposes:

- Check for updates
- Available/current/error states
- Download update
- Real download percentage events
- Ready-to-install state
- Restart & install

The stable GitHub release includes `latest.yml`, which is validated in CI before publication.

## Mod Hub V1

- Modrinth search is filtered by the selected Minecraft version and loader.
- Discovery supports relevance, downloads, follows, newest and recently-updated sorting.
- Optional category filters such as optimization, utility, technology, adventure, worldgen and decoration are sent to Modrinth as real facets.
- Results are paginated with a real **Load more** request instead of rendering a fake local catalog.
- Project cards show real downloads/follows/categories supplied by Modrinth.
- Required dependencies resolve recursively.
- SHA-512/SHA-1 hashes are verified when Modrinth supplies them.
- Partial `.part` files are not treated as successful installs.
- Vanilla profiles disable mod installation instead of pretending JARs can load.
- Launcher-managed Eternal Core cannot be manually disabled or removed through Mod Hub.

## Servers

- Real Minecraft status handshake for online state, protocol, version, player count and latency.
- Standard `_minecraft._tcp` SRV resolution.
- Modern Quick Play and legacy `--server/--port` launch paths selected by Minecraft version.
- Aternos standard mode stays honest: save, ping, quick-join and official dashboard access only unless an authorized partner API exists.

## Eternal Core v1

Current certified target: **Minecraft Java 1.21.11 + Fabric + Java 21**.

### Eternal Start

Press the configured Core open key (default **Right Shift**) to open the new premium **Eternal Start** dashboard. It is an original Eternal control surface in the same premium black/charcoal/crimson direction as the launcher.

Eternal Start shows real live FPS, ping, session and server state and exposes working actions for Modules, HUD Editor, Resume, Enable All, Disable All, Reset Layout, Zoom and Notifications. The buttons change actual Core state; they are not a rendered mock menu.

### In-game module UI

- V1 ClickGUI with premium black/charcoal/crimson chrome.
- Three-column live module surface.
- Animated open/section detail, status pulse and premium interaction states.
- Real module toggles and Enable All / Disable All.
- Real configurable ClickGUI/HUD/Zoom bindings with duplicate-bind protection.
- Zoom FOV control.
- Notifications toggle.
- Accent presets, HUD opacity and snap grid.
- Default / Compact / Corners real layout presets.
- One-click transition into the real HUD Editor.

### HUD Editor

- Drag modules.
- Grid snapping.
- Arrow-key nudging.
- Real coordinate inspector.
- Default/Compact/Corners presets.
- Delete disables the selected module.
- Positions persist locally.

### Live Core modules

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

The HUD data is read from live Minecraft/JVM state, not generated demo values.

### Core persistence hardening

`config/eternal-core.json` uses a temporary write followed by atomic replacement when supported. Invalid config is backed up as `eternal-core.corrupt-<timestamp>.json` instead of silently disappearing into a catch block.

## Standalone Core

The release publishes:

`Eternal-Core-Standalone-1.0.0.jar`

It is the same Core binary the launcher verifies and installs. It works in a compatible Fabric 1.21.11 profile without the Eternal launcher running.

## Premium UI/UX

V1 keeps one coherent Eternal visual system across launcher and game:

- cinematic launch hero and animated Eternal emblem
- compact crimson/charcoal shell
- real live status hierarchy
- premium instance command center and profile cards
- full-version creation flow
- real operation console
- upgraded Mod Hub discovery/results/filtering
- server/account/settings/download/developer polish
- real stable-update progress UI
- route transitions and controlled micro-motion
- Eternal Start + matching Core ClickGUI/HUD/HUD Editor/notifications
- responsive layouts
- reduced-motion support

No visual state is allowed to invent runtime data.

## Stable release gate

The v1 release workflow rebuilds from the exact release commit and must pass:

1. Java 21 + clean Eternal Core Gradle build.
2. Core JAR metadata, mod id, icon and `1.0.0` version validation.
3. Node dependency install.
4. full source/runtime/UI regression tests.
5. Vite production renderer build.
6. Eternal Windows brand checks.
7. Windows NSIS/Electron packaging.
8. `latest.yml` updater metadata validation.
9. packaged `Eternal Client.exe --smoke-test` startup.
10. standalone Core JAR generation.
11. SHA-256 checksum generation.
12. normal GitHub release publication marked **latest** — not prerelease.

### Release files

V1 intentionally does **not** publish a portable ZIP. The stable release contains the Windows installer, standalone Eternal Core JAR, updater metadata and SHA-256 checksums.

## Scope

Eternal v1 does not claim unsupported functionality. Core is certified for Fabric 1.21.11; the launcher implements Vanilla and Fabric profiles across Mojang's official catalog where the underlying launch/loader metadata is available. Microsoft login requires your own Entra/Azure public-client application ID.

Passing CI proves the exact release source builds, packages and boots in the automated Windows environment. It cannot prove every PC, driver, network, Microsoft account or third-party server combination is bug-free, so real failures should be reported and fixed rather than hidden behind a “100% bug-free” label.
