# Eternal Client v1.1.1 — UI, Combat and Skins

## Downloads

- `Eternal.Client.Setup.1.1.1.exe`: Windows x64 launcher installer, including the same updated Core JAR.
- `Eternal-Core-Standalone-1.1.1.jar`: standalone Fabric mod for Minecraft 1.21.11, Java 21 and Fabric Loader 0.18.1 or newer. Replace your old Eternal Core JAR in the mods folder.
- `latest.yml` and the EXE blockmap: launcher update metadata.
- `SHA256SUMS.txt`: checksums for the downloadable files.

## Updated UI and functions

- Responsive launcher Studio with reduced-motion support and smoother settings editing.
- Core menus scale drawing and mouse coordinates together; HUD widgets stay inside the screen and save dragged positions on release.
- Shared Sword, Mace, Spear, Crystal and Cart presets configure HUD modules and the crosshair while preserving existing module selections and positions.
- Six read-only HUD modules: AttackCooldown, HeldItem, ArmorDurability, Offhand, Movement and CombatSupplies. Telemetry is cached per game tick. These do not automate combat.
- Skin studio supports PNG selection, classic/slim models, front/back preview and reset. Microsoft accounts upload skins to the Minecraft Java profile; offline accounts save skins locally for launcher previews and avatars.
- Aternos setup opens the official dashboard; saved server addresses can be pinged and joined from Eternal.
- Native sprint/crouch preferences are restored when the corresponding module is disabled; zoom ends when a menu opens or the world closes.

## Verification and current limits

Release publishing requires Core compilation, launcher tests/build, JAR metadata checks and a packaged Windows startup smoke test. Browser tests previously covered skin account routing, all five presets and four window sizes using a simulated Electron bridge.

Live Minecraft rendering and Microsoft skin uploads have not been tested with a real game/account. Offline skins are not shared with other clients and do not change in-game textures. Aternos creation/start/stop/console controls inside Eternal are not implemented; there is no Aternos partnership.
