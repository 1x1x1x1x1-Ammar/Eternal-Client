# Eternal Client v1.2.1 — Launcher and GUI fixes

- Windows: `Eternal.Client.Setup.1.2.1.exe`.
- Linux Mint/Xfce amd64: `Eternal.Client.1.2.1.linux-amd64.deb`.
- Standalone Core: `Eternal-Core-Standalone-1.2.1.jar` for Fabric Minecraft 1.21.11 and Java 21.

## What changed

- Correct launcher sidebar offsets, readable labels and responsive control placement.
- Replace hardcoded preview statistics and key labels with actual saved settings and runtime state.
- Keep the selected instance across Home, Studio, Core, Mod Hub and Servers.
- Save Home memory settings to the selected instance; apply them on its next launch.
- Recover from failed launches, prevent duplicate startup requests, and show real download progress.
- Persist last played and playtime, including concurrent settings updates and multiple sessions.
- Reload Studio settings when focus returns from Minecraft.
- Use native Minecraft buttons and paginated layouts for Start, module settings and HUD editing across GUI scales.
- Decode the bundled menu landscape explicitly as RGBA and crop it to the current window with a fallback if loading fails.

## Installation

Install the Windows EXE over the existing launcher. On Linux, run:

```bash
sudo apt install ./Eternal.Client.1.2.1.linux-amd64.deb
```

Keep your existing instances and settings. For standalone Core, replace the previous Eternal Core JAR in the Fabric instance’s mods folder.

## Validation and limits

Publication requires Core compilation, launcher regression tests, renderer builds, JAR checks, a packaged Windows startup check, and installed-package startup checks under Xfce on Ubuntu 22.04 and 24.04. Browser interaction tests use a simulated Electron bridge; geometry tests cover 56 window/GUI-scale combinations.

Live Minecraft rendering, gameplay and a physical Linux Mint desktop have not been exercised here. The changes to background rendering still need visual confirmation in a real game session. Launcher previews are not live gameplay telemetry.
