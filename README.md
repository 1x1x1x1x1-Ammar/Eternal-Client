<p align="center"><img src="assets/logo.svg" width="100" alt="Eternal emblem"></p>
<h1 align="center">ETERNAL CLIENT</h1>
<p align="center"><strong>Your world. Your edge.</strong><br>A Minecraft launcher, a personal HUD, and a workspace that feels like yours.</p>

<p align="center">
  <img src="https://img.shields.io/badge/release-v1.1.1-ef3049?style=for-the-badge" alt="Release v1.1.1">
  <img src="https://img.shields.io/badge/launcher-Windows_10%2F11-17191f?style=for-the-badge" alt="Windows 10 and 11 launcher">
  <img src="https://img.shields.io/badge/core-Fabric_1.21.11-17191f?style=for-the-badge" alt="Core for Fabric Minecraft 1.21.11">
  <img src="https://img.shields.io/badge/runtime-Java_21-17191f?style=for-the-badge" alt="Java 21">
</p>

<p align="center">
  <a href="https://1x1x1x1x1-ammar.github.io/Eternal-Client/client.html"><strong>Explore the client</strong></a> ·
  <a href="https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/tag/v1.1.1"><strong>Download v1.1.1</strong></a> ·
  <a href="https://discord.gg/HaN8HxzqCV">Join Discord</a> ·
  <a href="https://github.com/1x1x1x1x1-Ammar/Eternal-Client/issues">Report an issue</a>
</p>

<p align="center"><img src="website/assets/studio-preview.webp" width="1100" alt="Eternal Studio with five combat presets, module search and configurable HUD widgets"><br><sub>Launcher interface preview with a demo profile and simulated game connection.</sub></p>

## One workspace. Your Minecraft.

Eternal pairs a Windows launcher with **Eternal Core**, a Fabric mod that also works with your existing launcher. Keep your instances separate, find mods on Modrinth, shape your HUD and bring your own skin.

| In the launcher | Inside Minecraft |
| :--- | :--- |
| Isolated Vanilla and Fabric instances | Right Shift menu and HUD editor |
| Modrinth discovery and installation | Drag, snap and save your HUD layout |
| Microsoft sign-in and offline profiles | FPS, ping, CPS, keystrokes and coordinates |
| Skin Studio with classic/slim previews | Attack cooldown, durability and supplies |
| Saved servers, ping and join actions | Crosshair, zoom and visual utilities |
| Download progress and diagnostic console | Shared Sword, Mace, Spear, Crystal and Cart presets |

## v1.1.1 / Combat & Skins

Five presets put the information for your playstyle within reach. Select one in **Studio → Modules → PvP loadout**, or **Right Shift → Modules → Combat** in standalone Core. Presets adjust the HUD and crosshair while preserving existing module selections and positions.

| Loadout | Keep an eye on |
| :--- | :--- |
| **Sword** | Attack recovery, armor wear and offhand |
| **Mace** | Fall distance, vertical movement and wind charges |
| **Spear** | Speed, held weapon wear and recovery |
| **Crystal** | Crystals, obsidian, totems and armor |
| **Cart** | TNT minecarts, rails, ignition tools and offhand |

The six new HUD modules display local game information. They **do not automate combat**. Core menu drawing and mouse input now scale together, HUD positions stay within the viewport, and launcher animations respect reduced-motion preferences.

**Skin Studio:** select a PNG, choose classic or slim, preview front/back, then apply. Microsoft accounts upload to the Minecraft Java profile. Offline accounts store skins locally for launcher previews and avatars; they do not change in-game textures or share skins with other players.

Read the [release notes](RELEASE_NOTES_v1.1.1.md) and [combat and skins guide](COMBAT-AND-SKINS.md).

## Drop in

| Download | Use it for |
| :--- | :--- |
| [**Windows installer · EXE**](https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/download/v1.1.1/Eternal.Client.Setup.1.1.1.exe) | Full launcher, accounts, instances and Studio |
| [**Standalone Core · JAR**](https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/download/v1.1.1/Eternal-Core-Standalone-1.1.1.jar) | Eternal Core in your existing Fabric installation |
| [**SHA-256 checksums**](https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/download/v1.1.1/SHA256SUMS.txt) | Verify the release downloads |

**Launcher:** install the EXE on Windows 10/11 x64, add your account and create an instance. Use **Minecraft 1.21.11 + Fabric** for Eternal Core.

**Standalone:** use Minecraft **1.21.11**, **Fabric Loader 0.18.1+** and **Java 21**. Place the JAR in that installation's `mods` folder, replacing any older Eternal Core JAR, then start Minecraft.

| Shortcut | Action |
| :--- | :--- |
| **Right Shift** | Open Eternal Start in game |
| **H** | Open the HUD editor |
| **Hold C** | Zoom, when the Zoom module is enabled |
| **Ctrl K** | Search the launcher |
| **Ctrl J** | Open the launcher console |

Modules start **off** on a clean Core installation. Enable what you want or choose a preset.

## Servers & accounts

**Aternos:** Eternal opens the official dashboard. Create and manage your server there, then save its address in Eternal to ping or join. In-client provisioning, start/stop and console access are not implemented; Eternal has no Aternos partnership.

**Offline profiles:** local launcher profiles do not replace a licensed Microsoft account for authenticated online play. Microsoft skin uploads require a valid Minecraft Java session.

**Validation:** the v1.1.1 release passed Core compilation, launcher tests/build, JAR checks and packaged Windows startup checks. Browser checks used a simulated Electron bridge. Live Minecraft rendering and Microsoft skin uploads still need testing with a real game/account. See [release verification](RELEASE_NOTES_v1.1.1.md#verification-and-current-limits).

## Build your own

Use **Node.js 22**, **Java 21** and **Gradle 9.5.1** to match the release workflow.

```sh
npm install
gradle -p eternal-core clean build
node scripts/stage-core.mjs
npm run verify
npm run dev
```

On Windows, run `npm run dist` after building and staging Core to produce the NSIS installer. `npm run doctor` checks the development setup.

| Directory | What lives here |
| :--- | :--- |
| [`src/`](src/) | React launcher interface and Studio |
| [`electron/`](electron/) | Accounts, instances, downloads and desktop services |
| [`eternal-core/`](eternal-core/) | Fabric client, HUD and in-game screens |
| [`shared/`](shared/) | Shared combat preset catalog |
| [`website/`](website/) | SMP homepage and client website |
| [`tests/`](tests/) | Source, behavior and UI checks |

For website work, serve `website/` with a static HTTP server and run `node --test tests/website.test.mjs`. Keep `website/combat-presets.json` in sync with the shared catalog. GitHub Pages deploys website changes merged into `main`.

<hr>
<p align="center"><strong>BEYOND SURVIVAL.</strong><br><sub>Built for the Eternal community. Not an official Minecraft product or affiliated with Mojang or Microsoft.</sub></p>
