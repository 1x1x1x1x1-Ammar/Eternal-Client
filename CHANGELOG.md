# Eternal Client Changelog

## v0.5.0-beta.5

### Added
- Original red faceted **E** emblem used by the launcher and README.
- Compact Dawn-inspired (not copied) launcher layout and crimson motion system.
- Real `Ctrl + K` Command Center.
- Real isolated Vanilla/Fabric instance creation and process tracking.
- Microsoft device-code/Xbox/XSTS/Minecraft ownership flow source.
- Modrinth compatibility-filtered search/install path.
- Genuine Minecraft TCP status ping.
- Eternal Core 1.21.11 source with ClickGUI, draggable HUD, live telemetry and hold-C FOV zoom.
- Minecraft `Gui.render` mixin for the real in-game HUD.

### Fixed
- Electron crash from `tar` default ESM import; now uses namespace import.
- Updated 1.21.11 keyboard/mouse mixins to the current `KeyEvent` and `MouseButtonInfo` input signatures.

### Verification
- Dependency-free source regression checks in this workspace: **10/10 passing**.
- Full npm/Vite/Electron and Gradle/Fabric CI remain release gates and are not silently marked PASS.
