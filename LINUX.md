# Eternal Client 1.2.1 on Linux Mint XFCE

The Linux launcher is distributed as an **amd64 `.deb`** for Linux Mint 21.3/22.x and compatible Ubuntu systems. It uses the same interface, instances, Mod Hub and bundled Fabric Core as the Windows launcher.

## Install

Download `Eternal.Client.1.2.1.linux-amd64.deb` from the [v1.2.1 release](https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/tag/v1.2.1). Open a terminal in the download folder:

```bash
sudo apt install ./Eternal.Client.1.2.1.linux-amd64.deb
```

Open **Eternal Client** from the Xfce applications menu under Games, or run `eternal-client`. Run the launcher as your regular user. The package installs desktop integration, icons and the Electron sandbox support supplied by electron-builder.

## Java and Minecraft

Eternal Core targets **Minecraft 1.21.11 + Fabric + Java 21**. Java is not bundled. On a Mint installation that provides OpenJDK 21:

```bash
sudo apt install openjdk-21-jre
```

In **Settings → Java**, detect runtimes or select the `bin/java` executable from an existing Java 21 installation. Eternal checks `JAVA_HOME`, `PATH` and Linux JVM directories. If your repositories do not provide Java 21, install a Java 21 distribution and select its executable manually.

Create a Fabric 1.21.11 instance, choose an account, and press Play. Other installed Java versions can be selected for older Minecraft instances. Microsoft sign-in uses the existing device-code flow and requires the configured Microsoft application client ID.

## Files, accounts and updates

- Configuration normally lives under `~/.config/Eternal Client`; the launcher’s **Open current** data-folder button shows the actual location. Instances use that location unless you choose a custom data directory.
- Keep the desktop keyring available for Microsoft account storage. The installer recommends `gnome-keyring`, which is compatible with Xfce.
- Install a newer `.deb` with the same `sudo apt install ./filename.deb` command. This preserves your user data. Linux updater metadata is included with the release.
- Remove the launcher with `sudo apt remove eternal-client`. This does not remove your personal instances or saved configuration.
- The standalone Core JAR also works with another Linux launcher: put it in a compatible Fabric instance’s `mods` folder and remove the previous Eternal Core JAR.

## Verification

The Linux workflow builds the DEB on Ubuntu 22.04, validates package and updater metadata, then installs and smoke-starts the packaged launcher under Xfce on Ubuntu 22.04 and Ubuntu 24.04 before publishing. These are automated startup checks. A physical Linux Mint desktop, live Minecraft gameplay, graphics drivers and Microsoft sign-in have not been tested in this environment.

For troubleshooting, start `eternal-client` from a terminal and include its error output with your Mint version in a GitHub issue. Do not disable Chromium’s sandbox or run the launcher as root to work around startup errors.
