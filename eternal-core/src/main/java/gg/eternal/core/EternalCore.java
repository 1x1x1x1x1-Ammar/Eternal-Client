package gg.eternal.core;

import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import gg.eternal.core.state.InputState;
import gg.eternal.core.ui.ClickGuiScreen;
import gg.eternal.core.ui.EternalHomeScreen;
import gg.eternal.core.ui.HudEditorScreen;
import gg.eternal.core.ui.NotificationCenter;
import gg.eternal.core.util.CoreLog;
import net.fabricmc.api.ClientModInitializer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.Screen;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Supplier;

public final class EternalCore implements ClientModInitializer {
    public static final String VERSION = "1.1.0";
    private static long sessionStarted;
    private static boolean zoomed;
    private static boolean zoomHeld;
    private static int previousFov = 70;
    private static boolean fullbrightApplied;
    private static double previousGamma = 0.5D;
    private static boolean sprintApplied;
    private static boolean sneakApplied;
    private static boolean previousSprint;
    private static boolean previousSneak;
    private static final AtomicBoolean screenOpenQueued = new AtomicBoolean(false);

    @Override
    public void onInitializeClient() {
        sessionStarted = System.currentTimeMillis();
        HudRenderer.install();
        CoreLog.info("Eternal Core v" + VERSION + " initialized. Clean-install modules default to disabled.");
        NotificationCenter.push("ETERNAL CORE", "v" + VERSION + " ready · press " + ClickGuiScreen.keyName(CoreConfig.INSTANCE.openKey()) + " for Eternal Start");
    }

    public static long sessionMillis() {
        return Math.max(0, System.currentTimeMillis() - sessionStarted);
    }

    public static boolean isZoomed() {
        return zoomed;
    }

    public static void tick() {
        try {
            HudRenderer.tick();
            CoreConfig config = CoreConfig.INSTANCE;
            config.reloadIfChanged();
            Minecraft mc = Minecraft.getInstance();
            if (mc == null || mc.options == null) return;

            syncToggleOptions(mc, config);
            syncFullbright(mc, config);
            tickZoom(mc, config);
        } catch (Throwable error) {
            CoreLog.error("Eternal runtime tick failed", error);
        }
    }

    private static void syncToggleOptions(Minecraft mc, CoreConfig config) {
        boolean sprint = config.on("ToggleSprint");
        boolean sneak = config.on("ToggleSneak");
        if (sprint && !sprintApplied) {
            previousSprint = mc.options.toggleSprint().get();
            mc.options.toggleSprint().set(true);
            sprintApplied = true;
        } else if (!sprint && sprintApplied) {
            mc.options.toggleSprint().set(previousSprint);
            sprintApplied = false;
        }
        if (sneak && !sneakApplied) {
            previousSneak = mc.options.toggleCrouch().get();
            mc.options.toggleCrouch().set(true);
            sneakApplied = true;
        } else if (!sneak && sneakApplied) {
            mc.options.toggleCrouch().set(previousSneak);
            sneakApplied = false;
        }
    }

    private static void syncFullbright(Minecraft mc, CoreConfig config) {
        if (config.on("Fullbright")) {
            if (!fullbrightApplied) {
                previousGamma = mc.options.gamma().get();
                fullbrightApplied = true;
            }
            if (mc.options.gamma().get() < 0.999D) mc.options.gamma().set(1.0D);
        } else if (fullbrightApplied) {
            mc.options.gamma().set(previousGamma);
            fullbrightApplied = false;
        }
    }

    private static void tickZoom(Minecraft mc, CoreConfig config) {
        if (!zoomed) return;
        if (!config.on("Zoom") || mc.screen != null || mc.player == null) zoomHeld = false;
        int target = zoomHeld ? config.zoomFov() : previousFov;
        int current = mc.options.fov().get();
        if (!config.smoothZoom()) {
            mc.options.fov().set(target);
            if (!zoomHeld) zoomed = false;
            return;
        }
        int difference = target - current;
        if (Math.abs(difference) <= 1) {
            mc.options.fov().set(target);
            if (!zoomHeld) zoomed = false;
            return;
        }
        double factor = 0.10D + config.zoomSpeed() * 0.025D;
        int step = Math.max(1, (int) Math.ceil(Math.abs(difference) * factor));
        mc.options.fov().set(current + (difference > 0 ? step : -step));
    }

    public static void restoreZoom() {
        if (!zoomed) return;
        Minecraft mc = Minecraft.getInstance();
        try {
            mc.options.fov().set(previousFov);
        } catch (Throwable error) {
            CoreLog.error("Could not restore zoom FOV", error);
        } finally {
            zoomed = false;
            zoomHeld = false;
        }
    }

    public static void openHome() {
        queueScreen("Eternal Start", EternalHomeScreen::new);
    }

    public static void openClickGui() {
        queueScreen("Modules", ClickGuiScreen::new);
    }

    public static void openHudEditor() {
        queueScreen("HUD Editor", HudEditorScreen::new);
    }

    private static void queueScreen(String name, Supplier<Screen> supplier) {
        Minecraft mc = Minecraft.getInstance();
        if (!screenOpenQueued.compareAndSet(false, true)) return;
        mc.execute(() -> {
            try {
                Screen target = supplier.get();
                mc.setScreen(target);
                CoreLog.info("Opened " + name + ".");
            } catch (Throwable error) {
                CoreLog.error("Could not open " + name, error);
                NotificationCenter.push("ETERNAL ERROR", name + " failed · check eternal-core.log");
            } finally {
                screenOpenQueued.set(false);
            }
        });
    }

    public static void onKey(int key, boolean down) {
        try {
            InputState.key(key, down);
            Minecraft mc = Minecraft.getInstance();
            CoreConfig config = CoreConfig.INSTANCE;

            if (key == config.zoomKey()) {
                if (!down) {
                    zoomHeld = false;
                    if (zoomed && !config.smoothZoom()) restoreZoom();
                    return;
                }
                if (config.on("Zoom") && !zoomed && mc.screen == null) {
                    previousFov = mc.options.fov().get();
                    zoomHeld = true;
                    zoomed = true;
                    if (!config.smoothZoom()) mc.options.fov().set(config.zoomFov());
                } else if (config.on("Zoom") && zoomed) {
                    zoomHeld = true;
                }
                return;
            }

            if (!down || mc.screen != null) return;
            if (key == config.openKey()) {
                openHome();
            } else if (key == config.hudEditorKey()) {
                openHudEditor();
            } else if (key == config.perspectiveKey() && config.on("Perspective")) {
                mc.options.setCameraType(mc.options.getCameraType().cycle());
                NotificationCenter.push("PERSPECTIVE", mc.options.getCameraType().name());
            }
        } catch (Throwable error) {
            CoreLog.error("Keyboard handler failed for key " + key, error);
        }
    }

    public static void onMouse(int button, boolean down) {
        try {
            InputState.mouse(button, down);
        } catch (Throwable error) {
            CoreLog.error("Mouse handler failed for button " + button, error);
        }
    }
}
