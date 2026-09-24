# Combat Workspace and Skins

## Use

- Launcher: Studio > Modules > PvP loadout. Choose Sword, Mace, Spear, Crystal or Cart.
- Standalone Core: Right Shift > Modules > Combat. The same preset catalog is bundled in the JAR.
- Presets enable relevant telemetry and set the crosshair while preserving other enabled modules and HUD positions.
- New HUD modules: AttackCooldown, HeldItem, ArmorDurability, Offhand, Movement and CombatSupplies. These display local Minecraft state; they do not automate attacks or movement.
- Accounts > Skin studio: select an account, upload a 64x64 PNG (or classic 64x32), choose the model, preview front/back, then apply.
- Microsoft skins upload through Minecraft Services using the selected account's session. Reset removes the active custom skin. Rejoin a server to refresh its cached skin.
- Offline skins are currently stored on this device for launcher previews and avatars. They are not distributed to other players and do not replace in-game textures. Cross-client offline skins require a shared skin service and Core integration.
- Servers > Create on Aternos opens the official dashboard. Complete creation there, save the address in Eternal, then ping or join. Eternal has no Aternos partnership or provisioning API access.

## Changes

Menu drawing and pointer hit testing share one scale transform. The HUD clamps positions to the current viewport and saves drags on release rather than every mouse event. HUD strings and inventory telemetry are cached once per client tick. Launcher slider previews update immediately; config mutations are serialized per instance to avoid lost updates. Reduced-motion preferences apply to nested animations.

## Validation

`npm run verify` runs the source and behavioral tests, dependency smoke check and renderer build. Skin tests use simulated Minecraft Services responses and verify offline isolation, multipart upload, model validation, reset and failure handling. They do not alter a real Microsoft account.

The browser smoke check (`node tests/ui/workspace-smoke.mjs`, with Playwright and Chromium installed) passed skin selection and apply flows for both account types, the Aternos dashboard action, all five combat presets, and layouts at 1440x900, 960x640, 640x480 and 390x844. It uses a simulated Electron bridge, so it does not test live account uploads or Minecraft. Screenshots are written to `build/ui-checks/`. `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` optionally select an existing Playwright installation and Chromium executable.

The Java menu geometry test runs when `javac` is available (otherwise it is explicitly skipped). Full Core compilation requires the repository's Fabric Loom plugin and Java 21. Although the initial local build could not resolve Loom, GitHub Actions run [35792504271](https://github.com/1x1x1x1x1-Ammar/Eternal-Client/actions/runs/35792504271) subsequently passed Core compilation on Linux and Windows, launcher verification, Core staging and packaged Windows startup smoke testing.

CI now packages an NSIS installer and uploads it together with the standalone Core JAR, SHA-256 checksums and build information. Download the `Eternal-Client-Windows-and-Core` artifact from the successful run. These are manual-install CI builds, not a published automatic update. Live Minecraft rendering, Microsoft skin uploads and Aternos creation still require account/game testing.
