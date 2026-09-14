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
    public static String[] modules() { return MODULES.clone(); }

    public static void render(GuiGraphics graphics) {
        Minecraft mc = Minecraft.getInstance();
        if (mc.options.hideGui || mc.player == null || mc.screen != null) return;

        int fallbackY = 10;
        for (String name : MODULES) {
            if (!CoreConfig.INSTANCE.on(name)) continue;
            int[] pos = CoreConfig.INSTANCE.pos(name, 10, fallbackY);
            drawModule(graphics, name, pos[0], pos[1], false, false);
            fallbackY += boxHeight(name) + 3;
        }
        NotificationCenter.render(graphics);
    }

    public static int boxWidth(String name) {
        Minecraft mc = Minecraft.getInstance();
        if ("Keystrokes".equals(name)) return 76;
        if ("Watermark".equals(name)) return 104;
        return Math.max(62, mc.font.width(value(name)) + 18);
    }

    public static int boxHeight(String name) {
        if ("Keystrokes".equals(name)) return 42;
        return "Watermark".equals(name) ? 22 : 19;
    }

    public static void drawModule(GuiGraphics graphics, String name, int x, int y, boolean hover, boolean selected) {
        Minecraft mc = Minecraft.getInstance();
        int width = boxWidth(name);
        int height = boxHeight(name);
        int alpha = CoreConfig.INSTANCE.hudAlpha();
        int accent = CoreConfig.INSTANCE.accentColor();
        int panelRgb = selected ? 0x001C0B0E : hover ? 0x00141619 : 0x0008090B;
        int panel = (alpha << 24) | panelRgb;

        graphics.fill(x, y, x + width, y + height, 0x44000000);
        graphics.fill(x + 1, y + 1, x + width - 1, y + height - 1, panel);
        graphics.fill(x, y, x + 2, y + height, accent);
        graphics.fill(x + 2, y, x + width, y + 1, selected ? accent : 0x443B3E45);
        if (selected || hover) graphics.renderOutline(x, y, width, height, selected ? accent : 0x66777B84);

        if ("Watermark".equals(name)) {
            graphics.drawString(mc.font, "ETERNAL", x + 8, y + 7, TEXT, true);
            int brandWidth = mc.font.width("ETERNAL");
            graphics.drawString(mc.font, " CORE", x + 8 + brandWidth, y + 7, accent, true);
            return;
        }
        if ("Keystrokes".equals(name)) {
            drawKeystrokes(graphics, x, y, accent);
            return;
        }
        graphics.drawString(mc.font, value(name), x + 8, y + 6, TEXT, true);
    }

    private static void drawKeystrokes(GuiGraphics graphics, int x, int y, int accent) {
        Minecraft mc = Minecraft.getInstance();
        int size = 14;
        int gap = 2;
        int baseX = x + 10;
        int topY = y + 5;
        drawKey(graphics, mc, baseX + size + gap, topY, size, "W", InputState.keyDown(87), accent);
        int bottomY = topY + size + gap;
        drawKey(graphics, mc, baseX, bottomY, size, "A", InputState.keyDown(65), accent);
        drawKey(graphics, mc, baseX + size + gap, bottomY, size, "S", InputState.keyDown(83), accent);
        drawKey(graphics, mc, baseX + (size + gap) * 2, bottomY, size, "D", InputState.keyDown(68), accent);
        graphics.drawString(mc.font, "MOVE", x + 59, y + 17, 0xFF777B84, false);
    }

    private static void drawKey(GuiGraphics graphics, Minecraft mc, int x, int y, int size, String label, boolean down, int accent) {
        graphics.fill(x, y, x + size, y + size, down ? (0xDD000000 | (accent & 0x00FFFFFF)) : 0xAA17191D);
        graphics.renderOutline(x, y, size, size, down ? 0xFFFFFFFF : 0x55464A52);
        int textX = x + (size - mc.font.width(label)) / 2;
        graphics.drawString(mc.font, label, textX, y + 4, down ? 0xFFFFFFFF : 0xFFB2B5BC, false);
    }

    public static String value(String name) {
        Minecraft mc = Minecraft.getInstance();
        if (name.equals("Watermark")) return "ETERNAL CORE";
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
            case "Direction" -> "DIR  " + direction(mc.player.getYRot());
            case "Memory" -> {
                Runtime runtime = Runtime.getRuntime();
                yield "MEM  " + ((runtime.totalMemory() - runtime.freeMemory()) / 1048576)
                        + " / " + (runtime.maxMemory() / 1048576) + " MB";
            }
            case "Session" -> "SESSION  " + format(EternalCore.sessionMillis());
            default -> name;
        };
    }

    public static int textColor(boolean enabled) { return enabled ? TEXT : MUTED; }

    private static String direction(float yaw) {
        float normalized = (yaw % 360 + 360) % 360;
        if (normalized >= 315 || normalized < 45) return "S";
        if (normalized < 135) return "W";
        if (normalized < 225) return "N";
        return "E";
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
