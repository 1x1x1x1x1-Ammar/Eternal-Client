package gg.eternal.core.hud;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.state.InputState;
import gg.eternal.core.ui.NotificationCenter;
import gg.eternal.core.util.CoreLog;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;

public final class HudRenderer {
    private static final String[] MODULES = {
            "Watermark", "FPS", "CPS", "Keystrokes", "Coordinates", "Ping",
            "Speed", "Direction", "Health", "Armor", "Food", "Server",
            "Memory", "Session", "Clock"
    };
    private static final int TEXT = 0xFFF7F8FA;
    private static final int MUTED = 0xFF949AA4;
    private static final int DIM = 0xFF5A606A;
    private static final DateTimeFormatter CLOCK = DateTimeFormatter.ofPattern("HH:mm");
    private static final Set<String> FAILED_MODULES = new HashSet<>();

    private HudRenderer() {}
    public static void install() {}
    public static String[] modules() { return MODULES.clone(); }

    public static void render(GuiGraphics graphics) {
        Minecraft mc = Minecraft.getInstance();
        if (mc.options.hideGui || mc.player == null || mc.screen != null) return;

        int fallbackY = 10;
        for (String name : MODULES) {
            if (!CoreConfig.INSTANCE.on(name)) continue;
            try {
                int[] pos = CoreConfig.INSTANCE.pos(name, 10, fallbackY);
                drawModule(graphics, name, pos[0], pos[1], false, false);
            } catch (Throwable error) {
                if (FAILED_MODULES.add(name)) {
                    CoreLog.error("HUD module " + name + " failed and was disabled for safety", error);
                    try {
                        if (CoreConfig.INSTANCE.on(name)) CoreConfig.INSTANCE.toggle(name);
                        NotificationCenter.push("HUD RECOVERY", name + " disabled · check eternal-core.log");
                    } catch (Throwable nested) {
                        CoreLog.error("Could not disable failed HUD module " + name, nested);
                    }
                }
            }
            fallbackY += boxHeight(name) + 4;
        }

        try {
            NotificationCenter.render(graphics);
        } catch (Throwable error) {
            CoreLog.error("Notification renderer failed", error);
        }
    }

    public static int boxWidth(String name) {
        Minecraft mc = Minecraft.getInstance();
        if ("Keystrokes".equals(name)) return 132;
        if ("Watermark".equals(name)) return 136;
        return Math.max(76, mc.font.width(value(name)) + 28);
    }

    public static int boxHeight(String name) {
        if ("Keystrokes".equals(name)) return 76;
        return "Watermark".equals(name) ? 26 : 22;
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

        int pulse = 150 + (int) (75 * (0.5 + 0.5 * Math.sin(System.currentTimeMillis() / 360.0)));
        int dot = (pulse << 24) | (accent & 0x00FFFFFF);
        graphics.fill(x + 8, y + 9, x + 11, y + 12, dot);
        graphics.drawString(mc.font, value(name), x + 17, y + 7, TEXT, true);
        drawTelemetryBar(graphics, name, x, y, width, accent);
    }

    private static void drawTelemetryBar(GuiGraphics graphics, String name, int x, int y, int width, int accent) {
        Minecraft mc = Minecraft.getInstance();
        if (mc.player == null) return;
        double ratio = -1;
        if ("Health".equals(name)) ratio = mc.player.getMaxHealth() <= 0 ? 0 : mc.player.getHealth() / mc.player.getMaxHealth();
        else if ("Armor".equals(name)) ratio = mc.player.getArmorValue() / 20.0;
        else if ("Food".equals(name)) ratio = mc.player.getFoodData().getFoodLevel() / 20.0;
        if (ratio < 0) return;
        ratio = Math.max(0, Math.min(1, ratio));
        int barWidth = Math.max(1, (int) ((width - 4) * ratio));
        graphics.fill(x + 2, y + 20, x + width - 2, y + 21, 0x261F242B);
        graphics.fill(x + 2, y + 20, x + 2 + barWidth, y + 21, 0xDD000000 | (accent & 0x00FFFFFF));
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
        graphics.fill(x + 9, y + 9, x + 14, y + 14, (pulse << 24) | (accent & 0x00FFFFFF));
        graphics.drawString(mc.font, "ETERNAL", x + 20, y + 8, TEXT, true);
        int brandWidth = mc.font.width("ETERNAL");
        graphics.drawString(mc.font, "CORE", x + 25 + brandWidth, y + 8, accent, true);
        graphics.drawString(mc.font, "V" + EternalCore.VERSION, x + width - mc.font.width("V" + EternalCore.VERSION) - 8, y + 8, 0xFF777E89, false);
    }

    private static void drawKeystrokes(GuiGraphics graphics, int x, int y, int accent) {
        Minecraft mc = Minecraft.getInstance();
        int key = 19;
        int gap = 3;
        int baseX = x + 9;
        int topY = y + 7;

        drawKey(graphics, mc, baseX + key + gap, topY, key, "W", InputState.keyDown(87), accent);
        int secondY = topY + key + gap;
        drawKey(graphics, mc, baseX, secondY, key, "A", InputState.keyDown(65), accent);
        drawKey(graphics, mc, baseX + key + gap, secondY, key, "S", InputState.keyDown(83), accent);
        drawKey(graphics, mc, baseX + (key + gap) * 2, secondY, key, "D", InputState.keyDown(68), accent);

        int mouseX = x + 82;
        graphics.fill(mouseX - 9, y + 8, mouseX - 8, y + 62, 0x30FFFFFF);
        drawMouseKey(graphics, mc, mouseX, y + 8, 40, 24, "LMB", InputState.leftCps(), InputState.mouseDown(0), accent);
        drawMouseKey(graphics, mc, mouseX, y + 37, 40, 24, "RMB", InputState.rightCps(), InputState.mouseDown(1), accent);

        graphics.drawString(mc.font, "KEYSTROKES", x + 9, y + 63, 0xFF535A65, false);
        String cps = (InputState.leftCps() + InputState.rightCps()) + " CPS";
        graphics.drawString(mc.font, cps, x + 122 - mc.font.width(cps), y + 63, 0xFF686F79, false);
    }

    private static void drawKey(GuiGraphics graphics, Minecraft mc, int x, int y, int size, String label, boolean down, int accent) {
        int fill = down ? (0xEA000000 | (accent & 0x00FFFFFF)) : 0xD315181D;
        graphics.fill(x - 2, y - 2, x + size + 2, y + size + 2, down ? 0x24000000 | (accent & 0x00FFFFFF) : 0x1B000000);
        graphics.fill(x, y, x + size, y + size, fill);
        graphics.renderOutline(x, y, size, size, down ? 0xB6FFFFFF : 0x4A474E58);
        if (down) graphics.fill(x, y, x + size, y + 1, 0x88FFFFFF);
        int textX = x + (size - mc.font.width(label)) / 2;
        graphics.drawString(mc.font, label, textX, y + 5, down ? 0xFFFFFFFF : 0xFFC3C7CE, false);
    }

    private static void drawMouseKey(GuiGraphics graphics, Minecraft mc, int x, int y, int width, int height, String label, int cps, boolean down, int accent) {
        int fill = down ? (0xE5000000 | (accent & 0x00FFFFFF)) : 0xD3111418;
        graphics.fill(x - 1, y - 1, x + width + 1, y + height + 1, 0x18000000);
        graphics.fill(x, y, x + width, y + height, fill);
        graphics.renderOutline(x, y, width, height, down ? 0xA8FFFFFF : 0x3D4B525C);
        graphics.drawString(mc.font, label, x + 5, y + 4, down ? 0xFFFFFFFF : 0xFF9299A4, false);
        String value = Integer.toString(cps);
        graphics.drawString(mc.font, value, x + width - 5 - mc.font.width(value), y + 13, down ? 0xFFFFFFFF : 0xFFE2E5EA, false);
        graphics.fill(x + 5, y + height - 4, x + width - 5, y + height - 3, 0x2AFFFFFF);
        int activity = Math.min(width - 10, cps * 3);
        if (activity > 0) graphics.fill(x + 5, y + height - 4, x + 5 + activity, y + height - 3, 0xDD000000 | (accent & 0x00FFFFFF));
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
