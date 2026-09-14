package gg.eternal.core;

import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import gg.eternal.core.state.InputState;
import gg.eternal.core.ui.ClickGuiScreen;
import gg.eternal.core.ui.HudEditorScreen;
import gg.eternal.core.ui.NotificationCenter;
import net.fabricmc.api.ClientModInitializer;
import net.minecraft.client.Minecraft;

public final class EternalCore implements ClientModInitializer {
    public static final String VERSION = "0.8.0-beta.8";
    private static long sessionStarted;
    private static boolean zoomed;
    private static int previousFov = 70;

    @Override
    public void onInitializeClient() {
        sessionStarted = System.currentTimeMillis();
        HudRenderer.install();
        NotificationCenter.push("ETERNAL CORE", "Beta 8 ready · Right Shift opens Core");
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

        if (key == 67) {
            if (!down && zoomed) {
                restoreZoom();
                return;
            }
            if (down && CoreConfig.INSTANCE.on("Zoom") && !zoomed && mc.screen == null) {
                previousFov = mc.options.fov().get();
                mc.options.fov().set(CoreConfig.INSTANCE.zoomFov());
                zoomed = true;
            }
            return;
        }

        if (!down || mc.screen != null) return;
        if (key == 344) mc.setScreen(new ClickGuiScreen());
        if (key == 72) mc.setScreen(new HudEditorScreen());
    }

    public static void onMouse(int button, boolean down) {
        InputState.mouse(button, down);
    }
}
