# Eternal Client v1.0.0 — Stable Release Checklist

## Source / behavior gates
- [x] Secure Electron renderer boundary (`contextIsolation`, sandbox, no renderer Node integration).
- [x] Single-instance Windows launcher lifecycle.
- [x] Real isolated Minecraft instance directories.
- [x] Complete Mojang version catalog in instance creation.
- [x] Implemented launch paths advertised honestly: Vanilla + Fabric only.
- [x] Java runtime detection/validation before launch.
- [x] Renewable Microsoft session path + offline account path.
- [x] Real Minecraft process tracking, stop path, lifecycle and log output.
- [x] Real Eternal operation console for create/install/launch/error/warning activity.
- [x] Real Downloads center using backend bytes/progress or indeterminate state.
- [x] Real Minecraft TCP status + SRV resolution.
- [x] Modrinth version/loader filters, pagination, required dependencies and hash verification.
- [x] Eternal Core standalone export + launcher-managed Core SHA-256 verification.
- [x] Clean Core installs leave modules disabled until explicitly enabled.
- [x] Core keyboard repeat suppression + client-thread UI screen scheduling.
- [x] Core mouse action normalization + runtime crash diagnostics.
- [x] Custom Eternal Minecraft title/start screen with real Singleplayer/Multiplayer/Modules/HUD/Options/Quit actions.
- [x] Premium Modules UI + real HUD Editor + persistent positions/presets/keybinds.
- [x] Premium live keystrokes uses actual WASD, LMB/RMB and CPS state.
- [x] Core diagnostic log at `config/eternal-core.log`.
- [x] Stable release intentionally excludes portable ZIP.

## Automated release gates — must be green before merge/release
- [ ] Clean Java 21 Eternal Core Gradle build for the final PR head.
- [ ] Full Node source/runtime/UI regression suite for the final PR head.
- [ ] Vite production renderer build for the final PR head.
- [ ] Core JAR metadata/icon/version validation.
- [ ] Branded Windows Electron/NSIS packaging.
- [ ] `latest.yml` stable updater metadata validation.
- [ ] Packaged `Eternal Client.exe --smoke-test` succeeds.
- [ ] Installer + standalone Core + updater metadata + SHA-256 files created.
- [ ] Normal GitHub `v1.0.0` release publishes as latest, not prerelease.

## Real-machine certification after the automated build
These checks cannot be honestly inferred from compile/package CI and should be tested on actual user hardware:

- [ ] Install `Eternal.Client.Setup.1.0.0.exe` on Windows 10/11.
- [ ] Create and launch a Vanilla profile.
- [ ] Create Fabric 1.21.11 and launch Eternal Core.
- [ ] Verify the Eternal title screen replaces vanilla title screen.
- [ ] Verify Right Shift → Eternal Start without a crash.
- [ ] Verify Modules → enable module → HUD Editor → drag/save → restart → persisted.
- [ ] Verify LMB/RMB + WASD keystrokes in a real world/server.
- [ ] Verify console captures real Minecraft warnings/errors.
- [ ] Verify Modrinth live install on a compatible Fabric profile.
- [ ] Verify Microsoft sign-in with a Minecraft-owning account.
- [ ] Verify stable updater on a later signed/published version.

**Release rule:** automated gates must be green before publishing. Real-world failures are logged and fixed; Eternal does not use a “100% bug-free” claim as a substitute for evidence.
