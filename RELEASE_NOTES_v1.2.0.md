# Eternal Client v1.2.0 — Studio, Modules and Mod Hub

- Windows installer: `Eternal.Client.Setup.1.2.0.exe`.
- Standalone Core: `Eternal-Core-Standalone-1.2.0.jar` for Minecraft 1.21.11, Fabric and Java 21. Replace the previous Eternal Core JAR.
- Launcher and standalone contain the same Core implementation and shared settings schema.

## Changes

- Charcoal/crimson launcher home with a new landscape, account/instance selectors and real launch controls.
- Per-module settings in launcher Studio and Core, including HUD size, background, opacity, colors and toggle keys. Changes save immediately.
- New effect, target distance, biome, world time, inventory and sprint HUD modules.
- Configurable armor durability and combat supplies readouts, alongside sword, mace, spear, crystal and cart presets.
- FPS Optimizer applies native render distance, entity distance, particle, shadow and unfocused frame-limit settings; disabling it restores previous values. FPS gains depend on the system and scene.
- Searchable Core module browser and loaded Fabric mod list.
- Landscape title screen at startup and themed native world/server selection backgrounds.
- Mod Hub tabs for mods, resource packs, datapacks and shaders. Datapacks target a selected local world. Pack downloads verify supplied hashes and validate ZIP structure. Close the instance before changing content.
- Resource packs still need selection in Minecraft; shaders need a compatible loader and selection in its settings.

## Validation and limits

Release publication requires Core compilation, launcher regression tests, renderer build, JAR checks and packaged Windows startup smoke testing. Browser UI checks use a simulated Electron bridge. Live Minecraft rendering and Microsoft skin uploads have not been tested with a real game/account.

Offline skins remain local launcher previews. Microsoft skin changes use the authenticated Minecraft profile. Aternos opens its official dashboard; embedded server administration and an Aternos partnership are not implemented.
