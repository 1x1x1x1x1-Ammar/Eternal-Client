# Eternal Client v1.0.0 — Verification Status

This file tracks evidence for the final stable candidate. It is intentionally conservative: source/build evidence is recorded separately from tests that require a real Windows/Minecraft machine.

## Automated final-candidate gates

The exact `release/v1.0.0` head must pass all of these before merge:

- Eternal Core Java 21 / Fabric Gradle build
- Node source/runtime/UI regression suite
- Vite production renderer build
- staged Eternal Core verification
- Windows Electron unpacked packaging
- packaged `Eternal Client.exe --smoke-test`

The stable workflow on merged `main` then additionally validates Core metadata/icon/version, branded NSIS installer output, `latest.yml`, standalone Core export artifact and SHA-256 sums before publishing.

## V1 runtime regressions covered in source tests

- `tar` ESM/CommonJS Electron startup regression
- `electron-updater` CommonJS export regression
- Right-Shift key-repeat suppression
- Minecraft client-task-queue Eternal screen opening
- exact mouse press/release normalization
- modules disabled by default on clean Core config
- Eternal title-screen replacement routes to real game/Core destinations
- durable Core runtime log (`config/eternal-core.log`)
- launcher Minecraft warning/error classification
- Eternal Console backend/preload/store/UI wiring
- full Mojang instance catalog + edit/duplicate paths
- Modrinth category/sort/pagination/dependency/hash paths
- real Downloads/update transfer telemetry + indeterminate unknown-size state
- premium WASD + LMB/RMB keystrokes from actual input state
- standalone/launcher-managed Core verification
- stable release excludes portable ZIP

## Real-machine tests still required after a verified build

- Windows installer install/launch/uninstall
- Vanilla profile first install + launch
- Fabric 1.21.11 first install + launch
- Eternal title screen appears in the real client
- Right Shift opens Eternal Start without a game crash
- Modules enable/disable correctly
- HUD Editor drag/snap/persistence across restart
- real LMB/RMB/WASD HUD behavior
- console captures a real warning/error from Minecraft
- live Modrinth install
- Microsoft login with a Minecraft-owning account

No document in this repository should turn those real-machine checks into a false "100% bug-free" claim.
