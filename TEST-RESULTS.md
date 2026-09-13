# Eternal Client v0.5.0-beta.5 — Test Results

## Verified in the current workspace

`node --test tests/*.test.mjs`

```text
10 tests
10 passed
0 failed
```

Covered: tar import regression, Command Center source wiring, no random/fake server count logic, offline UUID namespace, Electron isolation flags, MSA launcher-auth object wiring, official Fabric metadata endpoint, Modrinth MC/loader filters, real Minecraft TCP handshake path, and Eternal logo presence.

## Not yet marked PASS

The following require dependency/network/runtime execution and remain explicit release gates:

- `npm install` / dependency-enabled Vite build
- packaged Electron boot on Windows
- NSIS installer run
- Gradle/Fabric compilation of Eternal Core
- real Minecraft Vanilla launch
- real Fabric + Eternal Core launch
- Microsoft sign-in using a configured public client and Minecraft-owning account
- live Modrinth install smoke test
- clean Windows 10/11 smoke test

No missing runtime test is converted into a fake PASS.
