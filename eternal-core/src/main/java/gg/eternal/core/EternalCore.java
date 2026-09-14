package gg.eternal.core;

import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import gg.eternal.core.state.InputState;
import gg.eternal.core.ui.ClickGuiScreen;
import gg.eternal.core.ui.EternalHomeScreen;
import gg.eternal.core.ui.HudEditorScreen;
import gg.eternal.core.ui.NotificationCenter;
import net.fabricmc.api.ClientModInitializer;
import net.minecraft.client.Minecraft;

public final class EternalCore implements ClientModInitializer {
    public static final String VERSION = "1.0.0";
    private static long sessionStarted;
    private static boolean zoomed;
    private static int previousFov = 70;

    @Override
    public void onInitializeClient() {
        sessionStarted = System.currentTimeMillis();
        HudRenderer.install();
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
        mc.options.fov().set(previousFov);
        zoomed = false;
    }

    public static void onKey(int key, boolean down) {
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
        if (key == config.openKey()) mc.setScreen(new EternalHomeScreen());
        else if (key == config.hudEditorKey()) mc.setScreen(new HudEditorScreen());
    }

    public static void onMouse(int button, boolean down) {
        InputState.mouse(button, down);
    }
}
