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
    private static final int TEXT = 0xFFF7F8FA;
    private static final int MUTED = 0xFF949AA4;
    private static final int DIM = 0xFF5A606A;
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
            fallbackY += boxHeight(name) + 4;
        }
        NotificationCenter.render(graphics);
    }

    public static int boxWidth(String name) {
        Minecraft mc = Minecraft.getInstance();
        if ("Keystrokes".equals(name)) return 82;
        if ("Watermark".equals(name)) return 122;
        return Math.max(68, mc.font.width(value(name)) + 24);
    }

    public static int boxHeight(String name) {
        if ("Keystrokes".equals(name)) return 46;
        return "Watermark".equals(name) ? 24 : 21;
    }

    public static void drawModule(GuiGraphics graphics, String name, int x, int y, boolean hover, boolean selected) {
        Minecraft mc = Minecraft.getInstance();
        int width = boxWidth(name);
        int height = boxHeight(name);
        int alpha = CoreConfig.INSTANCE.hudAlpha();
        int accent = CoreConfig.INSTANCE.accentColor();
        int panelRgb = selected ? 0x00180A0D : hover ? 0x0013171C : 0x00090B0E;
        int panel = (alpha << 24) | panelRgb;

        drawPanel(graphics, x, y, width, height, panel, accent, hover, selected);

        if ("Watermark".equals(name)) {
            drawWatermark(graphics, mc, x, y, width, accent);
            return;
        }
        if ("Keystrokes".equals(name)) {
            drawKeystrokes(graphics, x, y, accent);
            return;
        }

        graphics.fill(x + 8, y + 9, x + 11, y + 12, accent);
        graphics.drawString(mc.font, value(name), x + 16, y + 7, TEXT, true);
    }

    private static void drawPanel(GuiGraphics graphics, int x, int y, int width, int height, int panel, int accent, boolean hover, boolean selected) {
        graphics.fill(x - 2, y - 2, x + width + 2, y + height + 2, 0x18000000);
        graphics.fill(x - 1, y - 1, x + width + 1, y + height + 1, 0x32000000);
        graphics.fill(x, y, x + width, y + height, panel);
        graphics.fill(x, y, x + 2, y + height, accent);
        graphics.fill(x + 2, y, x + width, y + 1, selected ? accent : 0x2AFFFFFF);
        graphics.fill(x + 2, y + height - 1, x + width, y + height, 0x17000000);
        if (selected || hover) graphics.renderOutline(x, y, width, height, selected ? accent : 0x665A616C);
    }

    private static void drawWatermark(GuiGraphics graphics, Minecraft mc, int x, int y, int width, int accent) {
        graphics.fill(x + 9, y + 9, x + 14, y + 14, accent);
        graphics.drawString(mc.font, "ETERNAL", x + 20, y + 8, TEXT, true);
        int brandWidth = mc.font.width("ETERNAL");
        graphics.drawString(mc.font, "CORE", x + 25 + brandWidth, y + 8, accent, true);
        graphics.drawString(mc.font, "•", x + width - 15, y + 8, 0xFF58ED89, false);
    }

    private static void drawKeystrokes(GuiGraphics graphics, int x, int y, int accent) {
        Minecraft mc = Minecraft.getInstance();
        int size = 15;
        int gap = 2;
        int baseX = x + 9;
        int topY = y + 6;
        drawKey(graphics, mc, baseX + size + gap, topY, size, "W", InputState.keyDown(87), accent);
        int bottomY = topY + size + gap;
        drawKey(graphics, mc, baseX, bottomY, size, "A", InputState.keyDown(65), accent);
        drawKey(graphics, mc, baseX + size + gap, bottomY, size, "S", InputState.keyDown(83), accent);
        drawKey(graphics, mc, baseX + (size + gap) * 2, bottomY, size, "D", InputState.keyDown(68), accent);
        graphics.fill(x + 61, y + 10, x + 62, y + 36, 0x2AFFFFFF);
        graphics.drawString(mc.font, "MOVE", x + 67, y + 13, DIM, false);
        graphics.drawString(mc.font, "WASD", x + 67, y + 27, MUTED, false);
    }

    private static void drawKey(GuiGraphics graphics, Minecraft mc, int x, int y, int size, String label, boolean down, int accent) {
        int fill = down ? (0xE8000000 | (accent & 0x00FFFFFF)) : 0xB315181D;
        graphics.fill(x, y, x + size, y + size, fill);
        graphics.renderOutline(x, y, size, size, down ? 0xAAFFFFFF : 0x4A474E58);
        if (down) graphics.fill(x, y, x + size, y + 1, 0x66FFFFFF);
        int textX = x + (size - mc.font.width(label)) / 2;
        graphics.drawString(mc.font, label, textX, y + 4, down ? 0xFFFFFFFF : 0xFFC3C7CE, false);
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
