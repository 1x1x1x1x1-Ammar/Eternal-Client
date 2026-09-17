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
            "Speed", "Direction", "Health", "Armor", "Food", "Server",
            "Memory", "Session", "Clock"
    };
    private static final int TEXT = 0xFFF7F8FA;
    private static final int MUTED = 0xFF949AA4;
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

    public static void renderCrosshair(GuiGraphics graphics) {
        Minecraft mc = Minecraft.getInstance();
        CoreConfig config = CoreConfig.INSTANCE;
        if (!config.on("Crosshair") || mc.options.hideGui || mc.player == null) return;

        int centerX = graphics.guiWidth() / 2;
        int centerY = graphics.guiHeight() / 2;
        int gap = config.crosshairGap();
        int length = config.crosshairLength();
        int thickness = config.crosshairThickness();
        int half = thickness / 2;
        int color = mc.crosshairPickEntity != null ? config.crosshairHitColor() : config.crosshairColor();

        if (config.crosshairOutline()) {
            int outline = 0xB0000000;
            arm(graphics, centerX - gap - length - 1, centerY - half - 1, length + 2, thickness + 2, outline);
            arm(graphics, centerX + gap - 1, centerY - half - 1, length + 2, thickness + 2, outline);
            arm(graphics, centerX - half - 1, centerY - gap - length - 1, thickness + 2, length + 2, outline);
            arm(graphics, centerX - half - 1, centerY + gap - 1, thickness + 2, length + 2, outline);
            if (config.crosshairDot()) arm(graphics, centerX - half - 1, centerY - half - 1, thickness + 2, thickness + 2, outline);
        }

        arm(graphics, centerX - gap - length, centerY - half, length, thickness, color);
        arm(graphics, centerX + gap, centerY - half, length, thickness, color);
        arm(graphics, centerX - half, centerY - gap - length, thickness, length, color);
        arm(graphics, centerX - half, centerY + gap, thickness, length, color);
        if (config.crosshairDot()) arm(graphics, centerX - half, centerY - half, thickness, thickness, color);
    }

    private static void arm(GuiGraphics graphics, int x, int y, int width, int height, int color) {
        graphics.fill(x, y, x + Math.max(1, width), y + Math.max(1, height), color);
    }

    public static int boxWidth(String name) {
        Minecraft mc = Minecraft.getInstance();
        if ("Keystrokes".equals(name)) return 118;
        if ("Watermark".equals(name)) return 132;
        return Math.max(72, mc.font.width(value(name)) + 26);
    }

    public static int boxHeight(String name) {
        if ("Keystrokes".equals(name)) return 72;
        return "Watermark".equals(name) ? 25 : 22;
    }

    public static void drawModule(GuiGraphics graphics, String name, int x, int y, boolean hover, boolean selected) {
        Minecraft mc = Minecraft.getInstance();
        CoreConfig config = CoreConfig.INSTANCE;
        int width = boxWidth(name);
        int height = boxHeight(name);
        int alpha = config.hudAlpha();
        int accent = accentAt(config.accentColor(), y);
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

        int pulse = 150 + (int) (75 * (0.5 + 0.5 * Math.sin(System.currentTimeMillis() / 360.0)));
        int dot = (pulse << 24) | (accent & 0x00FFFFFF);
        graphics.fill(x + 8, y + 9, x + 11, y + 12, dot);
        graphics.drawString(mc.font, value(name), x + 17, y + 7, TEXT, config.textShadow());
    }

    private static int accentAt(int base, int y) {
        if (!CoreConfig.INSTANCE.gradientHud()) return base;
        double wave = 0.12D + 0.16D * (0.5D + 0.5D * Math.sin((System.currentTimeMillis() / 760.0D) + y * 0.035D));
        int r = (base >> 16) & 0xFF;
        int g = (base >> 8) & 0xFF;
        int b = base & 0xFF;
        r = Math.min(255, r + (int) ((255 - r) * wave));
        g = Math.min(255, g + (int) ((255 - g) * wave));
        b = Math.min(255, b + (int) ((255 - b) * wave));
        return (base & 0xFF000000) | (r << 16) | (g << 8) | b;
    }

    private static void drawPanel(GuiGraphics graphics, int x, int y, int width, int height, int panel, int accent, boolean hover, boolean selected) {
        graphics.fill(x - 3, y - 3, x + width + 3, y + height + 3, 0x10000000);
        graphics.fill(x - 2, y - 2, x + width + 2, y + height + 2, 0x20000000);
        graphics.fill(x - 1, y - 1, x + width + 1, y + height + 1, 0x36000000);
        graphics.fill(x, y, x + width, y + height, panel);
        graphics.fill(x, y, x + 2, y + height, accent);
        graphics.fill(x + 2, y, x + width, y + 1, selected ? accent : 0x2AFFFFFF);
        graphics.fill(x + 2, y + height - 1, x + width, y + height, 0x17000000);
        if (selected || hover) graphics.renderOutline(x, y, width, height, selected ? accent : 0x665A616C);
    }

    private static void drawWatermark(GuiGraphics graphics, Minecraft mc, int x, int y, int width, int accent) {
        long now = System.currentTimeMillis();
        int pulse = 150 + (int) (90 * (0.5 + 0.5 * Math.sin(now / 420.0)));
        boolean shadow = CoreConfig.INSTANCE.textShadow();
        graphics.fill(x + 9, y + 9, x + 14, y + 14, (pulse << 24) | (accent & 0x00FFFFFF));
        graphics.drawString(mc.font, "ETERNAL", x + 20, y + 8, TEXT, shadow);
        int brandWidth = mc.font.width("ETERNAL");
        graphics.drawString(mc.font, "CORE", x + 25 + brandWidth, y + 8, accent, shadow);
        graphics.drawString(mc.font, "V1", x + width - 21, y + 8, 0xFF777E89, false);
    }

    private static void drawKeystrokes(GuiGraphics graphics, int x, int y, int accent) {
        Minecraft mc = Minecraft.getInstance();
        int key = 18;
        int gap = 3;
        int baseX = x + 10;
        int topY = y + 7;

        drawKey(graphics, mc, baseX + key + gap, topY, key, "W", InputState.keyDown(87), accent);
        int secondY = topY + key + gap;
        drawKey(graphics, mc, baseX, secondY, key, "A", InputState.keyDown(65), accent);
        drawKey(graphics, mc, baseX + key + gap, secondY, key, "S", InputState.keyDown(83), accent);
        drawKey(graphics, mc, baseX + (key + gap) * 2, secondY, key, "D", InputState.keyDown(68), accent);

        int mouseX = x + 75;
        graphics.fill(mouseX - 8, y + 8, mouseX - 7, y + 61, 0x2CFFFFFF);
        drawMouseKey(graphics, mc, mouseX, y + 8, 33, 23, "LMB", InputState.leftCps(), InputState.mouseDown(0), accent);
        drawMouseKey(graphics, mc, mouseX, y + 36, 33, 23, "RMB", InputState.rightCps(), InputState.mouseDown(1), accent);

        graphics.drawString(mc.font, "KEYSTROKES", x + 10, y + 60, 0xFF535A65, false);
    }

    private static void drawKey(GuiGraphics graphics, Minecraft mc, int x, int y, int size, String label, boolean down, int accent) {
        int fill = down ? (0xEA000000 | (accent & 0x00FFFFFF)) : 0xC315181D;
        graphics.fill(x - 1, y - 1, x + size + 1, y + size + 1, 0x21000000);
        graphics.fill(x, y, x + size, y + size, fill);
        graphics.renderOutline(x, y, size, size, down ? 0x99FFFFFF : 0x4A474E58);
        if (down) graphics.fill(x, y, x + size, y + 1, 0x77FFFFFF);
        int textX = x + (size - mc.font.width(label)) / 2;
        graphics.drawString(mc.font, label, textX, y + 5, down ? 0xFFFFFFFF : 0xFFC3C7CE, CoreConfig.INSTANCE.textShadow());
    }

    private static void drawMouseKey(GuiGraphics graphics, Minecraft mc, int x, int y, int width, int height, String label, int cps, boolean down, int accent) {
        int fill = down ? (0xE5000000 | (accent & 0x00FFFFFF)) : 0xC3111418;
        graphics.fill(x, y, x + width, y + height, fill);
        graphics.renderOutline(x, y, width, height, down ? 0x99FFFFFF : 0x3D4B525C);
        graphics.drawString(mc.font, label, x + 5, y + 4, down ? 0xFFFFFFFF : 0xFF9299A4, false);
        String value = Integer.toString(cps);
        graphics.drawString(mc.font, value, x + width - 5 - mc.font.width(value), y + 12, down ? 0xFFFFFFFF : 0xFFE2E5EA, false);
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
            case "Health" -> String.format("HP  %.1f / %.1f", mc.player.getHealth(), mc.player.getMaxHealth());
            case "Armor" -> "ARMOR  " + mc.player.getArmorValue() + " / 20";
            case "Food" -> "FOOD  " + mc.player.getFoodData().getFoodLevel() + " / 20";
            case "Server" -> mc.getCurrentServer() != null ? "SERVER  " + mc.getCurrentServer().ip : "SERVER  LOCAL WORLD";
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
