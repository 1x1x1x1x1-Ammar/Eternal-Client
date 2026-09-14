# Eternal Client Changelog

## v0.7.0-beta.7

### Eternal Core
- Rebuilt in-game ClickGUI with HUD / Utility / Style / About sections.
- Added persistent accent color, HUD opacity, Zoom FOV and snap-grid settings.
- Added Default / Compact / Corners HUD layout presets.
- Added real in-game notification feedback.
- Added Watermark and Clock HUD modules.
- Improved draggable HUD editor and persistent layout handling.
- Made the same Eternal Core JAR an explicit standalone Fabric mod as well as the launcher-managed Core.
- Embedded the Eternal icon in Fabric mod metadata.

### Launcher
- Added real standalone Core export through Electron IPC + save dialog.
- Added Windows AppUserModelID `gg.eternal.client`.
- Switched Windows packaging to the Eternal vector icon source.
- Fixed renderer logo paths so Vite bundles them for packaged `file://` builds.
- Rebuilt the launcher Core page around real status, launch and export actions.

### Release pipeline
- Added standalone Core metadata/icon validation.
- Added branded Windows asset validation before packaging.
- Release publishes installer, portable launcher, standalone Core JAR and SHA256 sums.
- Packaged Windows EXE startup smoke test remains a mandatory release gate.

## v0.6.0-beta.6

### Added / changed
- Reference-locked black/crimson launcher direction.
- Wider labelled sidebar, cinematic Home hero, real instance selector and dashboard panels.
- Packaged Windows EXE startup smoke-test gate.

### Fixed
- `electron-updater` CommonJS/ESM import crash that prevented Beta 5 from opening.

## v0.5.0-beta.5

### Added
- Original red Eternal **E** emblem used by the launcher and README.
- Premium launcher layout and crimson motion system.
- Real `Ctrl + K` Command Center.
- Real isolated Vanilla/Fabric instance creation and process tracking.
- Microsoft device-code/Xbox/XSTS/Minecraft ownership flow source.
- Modrinth compatibility-filtered search/install path.
- Genuine Minecraft TCP status ping.
- Eternal Core 1.21.11 source with ClickGUI, draggable HUD, live telemetry and hold-C FOV zoom.
- Minecraft `Gui.render` mixin for the real in-game HUD.

### Fixed
- Electron crash from `tar` default ESM import; now uses namespace import.
- Updated 1.21.11 keyboard/mouse mixins to the current input signatures.
