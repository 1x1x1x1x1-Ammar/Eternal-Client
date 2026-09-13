# Eternal Client — Beta → Release Checklist

## Source gates
- [x] Secure Electron renderer boundary (`contextIsolation`, no renderer Node access, sandbox).
- [x] Real isolated instance directories.
- [x] Real launcher process tracking and stop path.
- [x] Vanilla + Fabric source launch path.
- [x] Original Eternal logo/UI assets.
- [x] Real Minecraft TCP status protocol path.
- [x] Modrinth version/loader filtered install source.
- [x] Eternal Core ClickGUI/HUD/Zoom source.
- [x] Source regression suite passing (10/10 in this workspace).

## CI/runtime gates
- [ ] GitHub Actions npm install succeeds.
- [ ] Vite production build succeeds.
- [ ] Electron production boot succeeds.
- [ ] Eternal Core Gradle/Fabric build succeeds.
- [ ] Vanilla Minecraft launch tested.
- [ ] Fabric + Eternal Core loads in a real 1.21.11 client.
- [ ] Microsoft sign-in tested with a Minecraft-owning account.
- [ ] Modrinth live install smoke test.
- [ ] NSIS installer installs/launches/uninstalls cleanly.
- [ ] Windows 10 and Windows 11 clean-machine smoke tests.

Only after these gates have evidence should the project move to RC/1.0.
