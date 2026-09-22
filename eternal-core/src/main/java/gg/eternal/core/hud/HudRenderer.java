package gg.eternal.core.hud;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.state.InputState;
import gg.eternal.core.ui.EternalUi;
import gg.eternal.core.ui.NotificationCenter;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

public final class HudRenderer {
    private static final String[] MODULES = {
            "Watermark", "FPS", "CPS", "Keystrokes", "Coordinates", "Ping",
            "Speed", "Direction", "Health", "Armor", "Food", "Server",
            "Memory", "Session", "Clock", "AttackCooldown", "HeldItem", "ArmorDurability",
            "Offhand", "Movement", "CombatSupplies"
    };
    private static final int TEXT = EternalUi.TEXT;
    private static final int MUTED = EternalUi.MUTED;
    private static final DateTimeFormatter CLOCK = DateTimeFormatter.ofPattern("HH:mm");
    private static final Map<String, String> VALUES = new HashMap<>();

    private HudRenderer() {}
    public static void install() {}
    public static void tick() { VALUES.clear(); }
    public static String[] modules() { return MODULES.clone(); }

    public static void render(GuiGraphics graphics) {
        Minecraft mc = Minecraft.getInstance();
        if (mc.options.hideGui || mc.player == null || mc.screen != null) return;

        int fallbackY = 10;
        for (String name : MODULES) {
            if (!CoreConfig.INSTANCE.on(name)) continue;
            int[] pos = CoreConfig.INSTANCE.pos(name, 10, fallbackY);
            int x = Math.max(0, Math.min(graphics.guiWidth() - boxWidth(name), pos[0]));
            int y = Math.max(0, Math.min(graphics.guiHeight() - boxHeight(name), pos[1]));
            drawModule(graphics, name, x, y, false, false);
            fallbackY += boxHeight(name) + 5;
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
        if ("Keystrokes".equals(name)) return 126;
        if ("Watermark".equals(name)) return 146;
        return Math.min(mc.getWindow().getGuiScaledWidth(), Math.max(80, mc.font.width(value(name)) + 30));
    }

    public static int boxHeight(String name) {
        if ("Keystrokes".equals(name)) return 76;
        return "Watermark".equals(name) ? 27 : 23;
    }

    public static void drawModule(GuiGraphics graphics, String name, int x, int y, boolean hover, boolean selected) {
        Minecraft mc = Minecraft.getInstance();
        CoreConfig config = CoreConfig.INSTANCE;
        int width = boxWidth(name);
        int height = boxHeight(name);
        int alpha = config.hudAlpha();
        int accent = accentAt(config.accentColor(), y);
        int panelRgb = selected ? 0x00120B0E : hover ? 0x0012161B : 0x00090C10;
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

        int pulse = 145 + (int) (85 * (0.5D + 0.5D * Math.sin(System.currentTimeMillis() / 380.0D + y * 0.02D)));
        int dot = EternalUi.alpha(accent, pulse);
        graphics.fill(x + 9, y + 9, x + 13, y + 13, dot);
        graphics.fill(x + 10, y + 8, x + 12, y + 14, EternalUi.alpha(accent, Math.max(50, pulse / 2)));
        graphics.drawString(mc.font, mc.font.plainSubstrByWidth(value(name), Math.max(1, width - 26)), x + 19, y + 8, TEXT, config.textShadow());
        if ("AttackCooldown".equals(name) && mc.player != null) {
            int progress = Math.round((width - 4) * mc.player.getAttackStrengthScale(0.0F));
            graphics.fill(x + 2, y + height - 2, x + 2 + progress, y + height - 1, accent);
        }
    }

    private static int accentAt(int base, int y) {
        if (!CoreConfig.INSTANCE.gradientHud()) return base;
        return EternalUi.livingAccent(base, y);
    }

    private static void drawPanel(GuiGraphics graphics, int x, int y, int width, int height, int panel, int accent, boolean hover, boolean selected) {
        graphics.fill(x - 4, y - 4, x + width + 4, y + height + 4, 0x0B000000);
        graphics.fill(x - 2, y - 2, x + width + 2, y + height + 2, hover || selected ? EternalUi.alpha(accent, 20) : 0x1B000000);
        graphics.fill(x, y, x + width, y + height, panel);
        graphics.renderOutline(x, y, width, height, selected ? EternalUi.alpha(accent, 158) : hover ? EternalUi.alpha(accent, 96) : 0x3B4B535E);
        graphics.fill(x, y, x + 2, y + height, selected ? accent : EternalUi.alpha(accent, hover ? 180 : 118));
        graphics.fill(x + 2, y, x + width - 1, y + 1, selected ? 0x65FFFFFF : 0x2BFFFFFF);

        int travel = Math.max(1, width + 48);
        int sweep = (int) ((System.currentTimeMillis() / 15L + y * 3L) % travel) - 48;
        if (sweep < width) {
            int sx = x + Math.max(2, sweep);
            int ex = x + Math.min(width - 1, sweep + 36);
            if (ex > sx) graphics.fill(sx, y, ex, y + 1, EternalUi.alpha(accent, hover || selected ? 100 : 44));
        }
    }

    private static void drawWatermark(GuiGraphics graphics, Minecraft mc, int x, int y, int width, int accent) {
        long now = System.currentTimeMillis();
        int pulse = 150 + (int) (90 * (0.5D + 0.5D * Math.sin(now / 420.0D)));
        boolean shadow = CoreConfig.INSTANCE.textShadow();

        int markX = x + 9;
        int markY = y + 7;
        int mark = EternalUi.alpha(accent, pulse);
        graphics.fill(markX, markY, markX + 3, markY + 13, mark);
        graphics.fill(markX + 4, markY, markX + 11, markY + 2, mark);
        graphics.fill(markX + 4, markY + 5, markX + 9, markY + 7, mark);
        graphics.fill(markX + 4, markY + 11, markX + 11, markY + 13, mark);

        graphics.drawString(mc.font, "ETERNAL", x + 26, y + 9, TEXT, shadow);
        int brandWidth = mc.font.width("ETERNAL");
        graphics.drawString(mc.font, "CORE", x + 31 + brandWidth, y + 9, accent, shadow);
        String version = "V" + EternalCore.VERSION;
        graphics.drawString(mc.font, version, x + width - 9 - mc.font.width(version), y + 9, 0xFF737B86, false);
    }

    private static void drawKeystrokes(GuiGraphics graphics, int x, int y, int accent) {
        Minecraft mc = Minecraft.getInstance();
        int key = 19;
        int gap = 3;
        int baseX = x + 10;
        int topY = y + 8;

        drawKey(graphics, mc, baseX + key + gap, topY, key, "W", InputState.keyDown(87), accent);
        int secondY = topY + key + gap;
        drawKey(graphics, mc, baseX, secondY, key, "A", InputState.keyDown(65), accent);
        drawKey(graphics, mc, baseX + key + gap, secondY, key, "S", InputState.keyDown(83), accent);
        drawKey(graphics, mc, baseX + (key + gap) * 2, secondY, key, "D", InputState.keyDown(68), accent);

        int mouseX = x + 80;
        graphics.fill(mouseX - 8, y + 8, mouseX - 7, y + 64, 0x2CFFFFFF);
        drawMouseKey(graphics, mc, mouseX, y + 8, 36, 25, "LMB", InputState.leftCps(), InputState.mouseDown(0), accent);
        drawMouseKey(graphics, mc, mouseX, y + 38, 36, 25, "RMB", InputState.rightCps(), InputState.mouseDown(1), accent);

        graphics.drawString(mc.font, "INPUT", x + 10, y + 65, 0xFF555D68, false);
        graphics.drawString(mc.font, InputState.leftCps() + " / " + InputState.rightCps() + " CPS", x + 48, y + 65, 0xFF767E89, false);
    }

    private static void drawKey(GuiGraphics graphics, Minecraft mc, int x, int y, int size, String label, boolean down, int accent) {
        int fill = down ? EternalUi.alpha(accent, 214) : 0xD014181D;
        graphics.fill(x - 2, y - 2, x + size + 2, y + size + 2, 0x14000000);
        graphics.fill(x, y, x + size, y + size, fill);
        graphics.renderOutline(x, y, size, size, down ? 0xB0FFFFFF : 0x4A4A525D);
        if (down) graphics.fill(x, y, x + size, y + 1, 0x88FFFFFF);
        int textX = x + (size - mc.font.width(label)) / 2;
        graphics.drawString(mc.font, label, textX, y + 6, down ? 0xFFFFFFFF : 0xFFC4C9D0, CoreConfig.INSTANCE.textShadow());
    }

    private static void drawMouseKey(GuiGraphics graphics, Minecraft mc, int x, int y, int width, int height, String label, int cps, boolean down, int accent) {
        int fill = down ? EternalUi.alpha(accent, 208) : 0xD0101418;
        graphics.fill(x, y, x + width, y + height, fill);
        graphics.renderOutline(x, y, width, height, down ? 0xA8FFFFFF : 0x424A525D);
        if (down) graphics.fill(x, y, x + width, y + 1, 0x77FFFFFF);
        graphics.drawString(mc.font, label, x + 5, y + 5, down ? 0xFFFFFFFF : 0xFF939AA5, false);
        String value = Integer.toString(cps);
        graphics.drawString(mc.font, value, x + width - 5 - mc.font.width(value), y + 14, down ? 0xFFFFFFFF : 0xFFE1E4E9, false);
    }

    public static String value(String name) {
        return VALUES.computeIfAbsent(name, HudRenderer::readValue);
    }

    private static String readValue(String name) {
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
            case "AttackCooldown", "HeldItem", "ArmorDurability", "Offhand", "Movement", "CombatSupplies" -> CombatHud.value(name);
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
