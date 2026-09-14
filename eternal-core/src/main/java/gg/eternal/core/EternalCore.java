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
    public static final String VERSION = "1.0.0";
    private static long sessionStarted;
    private static boolean zoomed;
    private static int previousFov = 70;
    private static final AtomicBoolean screenOpenQueued = new AtomicBoolean(false);

    @Override
    public void onInitializeClient() {
        sessionStarted = System.currentTimeMillis();
        HudRenderer.install();
        CoreLog.info("Eternal Core v" + VERSION + " initialized. Clean-install modules default to disabled.");
        NotificationCenter.push("ETERNAL CORE", "v1 ready · press " + ClickGuiScreen.keyName(CoreConfig.INSTANCE.openKey()) + " for Eternal Start");
    }

    public static long sessionMillis() {
        return Math.max(0, System.currentTimeMillis() - sessionStarted);
    }

    public static boolean isZoomed() {
        return zoomed;
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
                if (!down && zoomed) {
                    restoreZoom();
                    return;
                }
                if (down && config.on("Zoom") && !zoomed && mc.screen == null) {
                    previousFov = mc.options.fov().get();
                    mc.options.fov().set(config.zoomFov());
                    zoomed = true;
                }
                return;
            }

            if (!down || mc.screen != null) return;
            if (key == config.openKey()) openHome();
            else if (key == config.hudEditorKey()) openHudEditor();
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
