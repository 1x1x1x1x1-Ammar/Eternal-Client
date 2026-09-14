package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

public final class EternalHomeScreen extends Screen {
    private static final int BG = 0xF707080B;
    private static final int SURFACE = 0xFF111419;
    private static final int SURFACE_HOVER = 0xFF181C22;
    private static final int LINE = 0x33464C56;
    private static final int TEXT = 0xFFF6F7F9;
    private static final int MUTED = 0xFF7C838E;
    private static final int DIM = 0xFF555C67;
    private static final int GREEN = 0xFF58ED89;

    private final long openedAt = System.currentTimeMillis();

    public EternalHomeScreen() {
        super(Component.literal("Eternal Core Home"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        renderBackground(graphics, mouseX, mouseY, delta);
        int panelWidth = Math.min(840, width - 24);
        int panelHeight = Math.min(468, height - 24);
        int x = (width - panelWidth) / 2;
        int y = (height - panelHeight) / 2;
        int accent = CoreConfig.INSTANCE.accentColor();
        float intro = Math.min(1.0F, (System.currentTimeMillis() - openedAt) / 220.0F);

        drawShell(graphics, x, y, panelWidth, panelHeight, accent, intro);

        graphics.drawString(font, "ETERNAL", x + 22, y + 20, TEXT, false);
        graphics.drawString(font, "CORE", x + 22 + font.width("ETERNAL") + 6, y + 20, accent, false);
        graphics.drawString(font, "V1 · IN-GAME CLIENT", x + 22, y + 36, DIM, false);

        int liveX = x + panelWidth - 122;
        graphics.fill(liveX, y + 16, liveX + 98, y + 38, 0xFF0B1110);
        graphics.renderOutline(liveX, y + 16, 98, 22, 0x33476E53);
        graphics.fill(liveX + 9, y + 24, liveX + 14, y + 29, GREEN);
        graphics.drawString(font, "CORE LIVE", liveX + 22, y + 23, 0xFF9AE9B2, false);

        int heroX = x + 22;
        int heroY = y + 72;
        int heroW = panelWidth - 44;
        int heroH = 122;
        graphics.fill(heroX, heroY, heroX + heroW, heroY + heroH, 0xFF0E1116);
        graphics.renderOutline(heroX, heroY, heroW, heroH, 0x44464C56);
        graphics.fill(heroX, heroY, heroX + 3, heroY + heroH, accent);
        graphics.fill(heroX + 3, heroY, heroX + Math.min(heroW, 210), heroY + 1, 0x33FFFFFF);
        graphics.drawString(font, "YOUR CLIENT. YOUR HUD. YOUR RULES.", heroX + 18, heroY + 18, DIM, false);
        graphics.drawString(font, "ETERNAL START", heroX + 18, heroY + 38, TEXT, false);
        graphics.drawString(font, "A premium control surface for real client modules, persistent HUD layouts and utility settings.", heroX + 18, heroY + 56, MUTED, false);
        graphics.drawString(font, "Fresh installs start clean: modules stay OFF until you choose them.", heroX + 18, heroY + 76, 0xFF666D78, false);

        button(graphics, mouseX, mouseY, heroX + 18, heroY + 91, 122, 25, "MODULES", true);
        button(graphics, mouseX, mouseY, heroX + 148, heroY + 91, 122, 25, "HUD EDITOR", false);
        button(graphics, mouseX, mouseY, heroX + 278, heroY + 91, 104, 25, "RESUME", false);

        int statY = heroY + heroH + 12;
        int gap = 8;
        int statW = (heroW - gap * 3) / 4;
        stat(graphics, heroX, statY, statW, "FPS", trim(HudRenderer.value("FPS"), "FPS  "), accent);
        stat(graphics, heroX + statW + gap, statY, statW, "PING", trim(HudRenderer.value("Ping"), "PING  "), accent);
        stat(graphics, heroX + (statW + gap) * 2, statY, statW, "SESSION", trim(HudRenderer.value("Session"), "SESSION  "), accent);
        stat(graphics, heroX + (statW + gap) * 3, statY, statW, "SERVER", trim(HudRenderer.value("Server"), "SERVER  "), accent);

        int controlY = statY + 74;
        int leftW = (heroW - 10) / 2;
        panel(graphics, heroX, controlY, leftW, 126, "HUD SYSTEM", "Choose modules, then drag them exactly where you want", accent);
        graphics.drawString(font, enabledModules() + " HUD modules enabled", heroX + 16, controlY + 49, TEXT, false);
        graphics.drawString(font, "Opacity " + CoreConfig.INSTANCE.hudAlpha() + " · Snap " + CoreConfig.INSTANCE.snap() + "px", heroX + 16, controlY + 66, MUTED, false);
        button(graphics, mouseX, mouseY, heroX + 16, controlY + 88, 92, 24, "ENABLE ALL", false);
        button(graphics, mouseX, mouseY, heroX + 116, controlY + 88, 92, 24, "DISABLE ALL", false);
        button(graphics, mouseX, mouseY, heroX + 216, controlY + 88, 100, 24, "EDIT HUD", false);

        int rightX = heroX + leftW + 10;
        panel(graphics, rightX, controlY, leftW, 126, "UTILITY", "Persistent controls with real state", accent);
        graphics.drawString(font, "Zoom " + (CoreConfig.INSTANCE.on("Zoom") ? "ON" : "OFF") + " · FOV " + CoreConfig.INSTANCE.zoomFov(), rightX + 16, controlY + 49, TEXT, false);
        graphics.drawString(font, "Notifications " + (CoreConfig.INSTANCE.notifications() ? "ON" : "OFF"), rightX + 16, controlY + 66, MUTED, false);
        button(graphics, mouseX, mouseY, rightX + 16, controlY + 88, 112, 24, "TOGGLE ZOOM", false);
        button(graphics, mouseX, mouseY, rightX + 136, controlY + 88, 142, 24, "NOTIFICATIONS", false);

        graphics.drawString(font, "ETERNAL CORE " + EternalCore.VERSION, x + 22, y + panelHeight - 22, DIM, false);
        String footer = "MODULES · HUD · ZOOM · KEYBINDS · STYLE · STANDALONE";
        graphics.drawString(font, footer, x + panelWidth - 22 - font.width(footer), y + panelHeight - 22, 0xFF4C525C, false);
        super.render(graphics, mouseX, mouseY, delta);
    }

    private void drawShell(GuiGraphics graphics, int x, int y, int w, int h, int accent, float intro) {
        graphics.fill(0, 0, width, height, 0xB8000000);
        graphics.fill(x - 8, y - 8, x + w + 8, y + h + 8, 0x26000000);
        graphics.fill(x - 3, y - 3, x + w + 3, y + h + 3, 0x4A000000);
        graphics.fill(x, y, x + w, y + h, BG);
        graphics.renderOutline(x, y, w, h, 0x66505A66);
        graphics.fill(x, y, x + 3, y + h, accent);
        graphics.fill(x + 3, y, x + w, y + 1, 0x24FFFFFF);
        int progress = Math.max(2, (int) ((w - 6) * intro));
        graphics.fill(x + 3, y + h - 2, x + 3 + progress, y + h, 0x66000000 | (accent & 0x00FFFFFF));
        int sweep = x + 4 + (int) ((System.currentTimeMillis() / 13L) % Math.max(1, w - 52));
        graphics.fill(sweep, y + 1, Math.min(x + w - 2, sweep + 44), y + 2, 0x55FFFFFF);
    }

    private void stat(GuiGraphics graphics, int x, int y, int w, String label, String value, int accent) {
        graphics.fill(x, y, x + w, y + 62, SURFACE);
        graphics.renderOutline(x, y, w, 62, LINE);
        graphics.fill(x, y, x + 2, y + 62, accent);
        graphics.drawString(font, label, x + 12, y + 12, DIM, false);
        graphics.drawString(font, value, x + 12, y + 32, TEXT, false);
    }

    private void panel(GuiGraphics graphics, int x, int y, int w, int h, String title, String sub, int accent) {
        graphics.fill(x, y, x + w, y + h, SURFACE);
        graphics.renderOutline(x, y, w, h, LINE);
        graphics.fill(x, y, x + 2, y + h, 0x55000000 | (accent & 0x00FFFFFF));
        graphics.drawString(font, title, x + 16, y + 14, TEXT, false);
        graphics.drawString(font, sub, x + 16, y + 29, MUTED, false);
    }

    private void button(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h, String text, boolean primary) {
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        int accent = CoreConfig.INSTANCE.accentColor();
        int fill = primary ? (0xE8000000 | (accent & 0x00FFFFFF)) : hover ? SURFACE_HOVER : 0xFF15181D;
        graphics.fill(x, y, x + w, y + h, fill);
        graphics.renderOutline(x, y, w, h, primary ? 0x77FFFFFF : hover ? 0x66545C67 : LINE);
        if (hover) graphics.fill(x, y, x + w, y + 1, 0x44FFFFFF);
        graphics.drawCenteredString(font, text, x + w / 2, y + (h - 8) / 2, primary || hover ? TEXT : 0xFFD1D5DB);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        int panelWidth = Math.min(840, width - 24);
        int panelHeight = Math.min(468, height - 24);
        int x = (width - panelWidth) / 2;
        int y = (height - panelHeight) / 2;
        int heroX = x + 22;
        int heroY = y + 72;
        int heroW = panelWidth - 44;
        int statY = heroY + 134;
        int controlY = statY + 74;
        int leftW = (heroW - 10) / 2;
        int rightX = heroX + leftW + 10;
        int mouseX = (int) event.x();
        int mouseY = (int) event.y();

        if (inside(mouseX, mouseY, heroX + 18, heroY + 91, 122, 25)) { EternalCore.openClickGui(); return true; }
        if (inside(mouseX, mouseY, heroX + 148, heroY + 91, 122, 25)) { EternalCore.openHudEditor(); return true; }
        if (inside(mouseX, mouseY, heroX + 278, heroY + 91, 104, 25)) { Minecraft.getInstance().setScreen(null); return true; }

        if (inside(mouseX, mouseY, heroX + 16, controlY + 88, 92, 24)) {
            CoreConfig.INSTANCE.setAllModules(true);
            NotificationCenter.push("HUD", "All HUD modules enabled");
            return true;
        }
        if (inside(mouseX, mouseY, heroX + 116, controlY + 88, 92, 24)) {
            CoreConfig.INSTANCE.setAllModules(false);
            NotificationCenter.push("HUD", "All HUD modules disabled");
            return true;
        }
        if (inside(mouseX, mouseY, heroX + 216, controlY + 88, 100, 24)) {
            EternalCore.openHudEditor();
            return true;
        }
        if (inside(mouseX, mouseY, rightX + 16, controlY + 88, 112, 24)) {
            CoreConfig.INSTANCE.toggle("Zoom");
            NotificationCenter.push("ZOOM", CoreConfig.INSTANCE.on("Zoom") ? "Enabled" : "Disabled");
            return true;
        }
        if (inside(mouseX, mouseY, rightX + 136, controlY + 88, 142, 24)) {
            CoreConfig.INSTANCE.setNotifications(!CoreConfig.INSTANCE.notifications());
            if (CoreConfig.INSTANCE.notifications()) NotificationCenter.push("NOTIFICATIONS", "Enabled");
            return true;
        }
        return super.mouseClicked(event, doubleClick);
    }

    private int enabledModules() {
        int total = 0;
        for (String module : HudRenderer.modules()) if (CoreConfig.INSTANCE.on(module)) total++;
        return total;
    }

    private static String trim(String value, String prefix) {
        String raw = value == null ? "--" : value;
        return raw.startsWith(prefix) ? raw.substring(prefix.length()) : raw;
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int width, int height) {
        return mouseX >= x && mouseX < x + width && mouseY >= y && mouseY < y + height;
    }

    @Override
    public boolean isPauseScreen() { return false; }
}
