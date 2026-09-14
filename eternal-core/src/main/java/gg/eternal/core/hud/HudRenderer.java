package gg.eternal.core.hud;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.state.InputState;
import gg.eternal.core.ui.NotificationCenter;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

public final class HudRenderer {
    private static final String[] MODULES = {
            "Watermark", "FPS", "CPS", "Keystrokes", "Coordinates", "Ping",
            "Speed", "Direction", "Memory", "Session", "Clock"
    };
    private static final int TEXT = 0xFFF4F5F7;
    private static final int MUTED = 0xFF9A9DA5;
    private static final DateTimeFormatter CLOCK = DateTimeFormatter.ofPattern("HH:mm");

    private HudRenderer() {}

    public static void install() {}

    public static String[] modules() {
        return MODULES.clone();
    }

    public static void render(GuiGraphics graphics) {
        Minecraft mc = Minecraft.getInstance();
        if (mc.options.hideGui || mc.player == null || mc.screen != null) return;

        int fallbackY = 10;
        for (String name : MODULES) {
            if (!CoreConfig.INSTANCE.on(name)) continue;
            int[] pos = CoreConfig.INSTANCE.pos(name, 10, fallbackY);
            drawModule(graphics, name, pos[0], pos[1], false, false);
            fallbackY += 21;
        }

        NotificationCenter.render(graphics);
    }

    public static int boxWidth(String name) {
        Minecraft mc = Minecraft.getInstance();
        return Math.max(58, mc.font.width(value(name)) + 16);
    }

    public static int boxHeight(String name) {
        return "Watermark".equals(name) ? 20 : 18;
    }

    public static void drawModule(GuiGraphics graphics, String name, int x, int y, boolean hover, boolean selected) {
        Minecraft mc = Minecraft.getInstance();
        String text = value(name);
        int width = boxWidth(name);
        int height = boxHeight(name);
        int alpha = CoreConfig.INSTANCE.hudAlpha();
        int panelRgb = selected ? 0x00200C0F : hover ? 0x0017181B : 0x000A0B0D;
        int panel = (alpha << 24) | panelRgb;
        int accent = CoreConfig.INSTANCE.accentColor();
        int border = selected ? accent : 0x552F3238;

        graphics.fill(x, y, x + width, y + height, panel);
        graphics.fill(x, y, x + 2, y + height, accent);
        if (selected || hover) graphics.renderOutline(x, y, width, height, border);

        if ("Watermark".equals(name)) {
            graphics.drawString(mc.font, "ETERNAL", x + 7, y + 6, TEXT, false);
            int brandWidth = mc.font.width("ETERNAL");
            graphics.drawString(mc.font, "  CORE", x + 7 + brandWidth, y + 6, accent, false);
        } else {
            graphics.drawString(mc.font, text, x + 7, y + 5, TEXT, true);
        }
    }

    public static String value(String name) {
        Minecraft mc = Minecraft.getInstance();
        if (name.equals("Watermark")) return "ETERNAL  CORE";
        if (name.equals("FPS")) return "FPS  " + mc.getFps();
        if (name.equals("CPS")) return "CPS  " + InputState.leftCps() + " | " + InputState.rightCps();
        if (name.equals("Keystrokes")) return keys();
        if (name.equals("Clock")) return "TIME  " + LocalTime.now().format(CLOCK);
        if (mc.player == null) return name + " --";

        return switch (name) {
            case "Coordinates" -> String.format("XYZ  %.0f / %.0f / %.0f", mc.player.getX(), mc.player.getY(), mc.player.getZ());
            case "Ping" -> "PING  " + (mc.getConnection() != null && mc.getConnection().getPlayerInfo(mc.player.getUUID()) != null
                    ? mc.getConnection().getPlayerInfo(mc.player.getUUID()).getLatency() : 0) + "ms";
            case "Speed" -> String.format("SPEED  %.2f", Math.sqrt(
                    mc.player.getDeltaMovement().x * mc.player.getDeltaMovement().x
                            + mc.player.getDeltaMovement().z * mc.player.getDeltaMovement().z) * 20.0);
            case "Direction" -> "DIR  " + Math.round(mc.player.getYRot()) + "°";
            case "Memory" -> {
                Runtime runtime = Runtime.getRuntime();
                yield "MEM  " + ((runtime.totalMemory() - runtime.freeMemory()) / 1048576)
                        + " / " + (runtime.maxMemory() / 1048576) + " MB";
            }
            case "Session" -> "SESSION  " + format(EternalCore.sessionMillis());
            default -> name;
        };
    }

    public static int textColor(boolean enabled) {
        return enabled ? TEXT : MUTED;
    }

    private static String keys() {
        return (InputState.keyDown(87) ? "[W]" : " W ") + " "
                + (InputState.keyDown(65) ? "[A]" : " A ") + " "
                + (InputState.keyDown(83) ? "[S]" : " S ") + " "
                + (InputState.keyDown(68) ? "[D]" : " D ");
    }

    private static String format(long ms) {
        long seconds = ms / 1000;
        return String.format("%02d:%02d:%02d", seconds / 3600, (seconds / 60) % 60, seconds % 60);
    }
}
