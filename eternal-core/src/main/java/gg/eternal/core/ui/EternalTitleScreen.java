package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.util.CoreLog;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.gui.screens.options.OptionsScreen;
import net.minecraft.client.gui.screens.multiplayer.JoinMultiplayerScreen;
import net.minecraft.client.gui.screens.worldselection.SelectWorldScreen;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

public final class EternalTitleScreen extends Screen {
    private static final int TEXT = 0xFFF7F8FA;
    private static final int MUTED = 0xFF858C97;
    private static final int DIM = 0xFF565D68;
    private static final int PANEL = 0xE90A0C10;
    private static final int SURFACE = 0xFF111419;
    private static final int SURFACE_HOVER = 0xFF191D23;
    private static final int LINE = 0x3A4B525C;
    private static final int GREEN = 0xFF58ED89;
    private final long openedAt = System.currentTimeMillis();
    private boolean degraded;
    private boolean renderErrorLogged;

    public EternalTitleScreen() {
        super(Component.literal("Eternal Client"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        if (degraded) {
            renderFallback(graphics, mouseX, mouseY);
            return;
        }
        try {
            renderPremium(graphics, mouseX, mouseY, delta);
        } catch (Throwable error) {
            degraded = true;
            if (!renderErrorLogged) {
                renderErrorLogged = true;
                CoreLog.error("Premium Eternal title screen render failed; using safe fallback", error);
            }
            renderFallback(graphics, mouseX, mouseY);
        }
    }

    private void renderPremium(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        int accent = CoreConfig.INSTANCE.accentColor();
        long now = System.currentTimeMillis();
        float intro = Math.min(1.0F, (now - openedAt) / 340.0F);

        graphics.fill(0, 0, width, height, 0xFF040507);
        graphics.fill(0, 0, width, Math.max(1, height / 3), 0xFF09090C);

        int centerX = width / 2;
        int glowW = Math.max(260, width / 2);
        for (int i = 0; i < 10; i++) {
            int alpha = Math.max(4, 40 - i * 4);
            int left = Math.max(0, centerX - glowW / 2 - i * 25);
            int right = Math.min(width, centerX + glowW / 2 + i * 25);
            int top = Math.max(0, height / 7 - i * 11);
            int bottom = Math.min(height, height * 3 / 5 + i * 17);
            graphics.fill(left, top, right, bottom, (alpha << 24) | (accent & 0x00FFFFFF));
        }

        int leftRail = Math.max(14, width / 34);
        graphics.fill(leftRail, 18, leftRail + 1, height - 94, 0x283F4650);
        graphics.fill(leftRail + 1, 18, leftRail + 3, Math.min(height - 94, 96 + (int) (160 * intro)), accent);

        int brandY = Math.max(30, height / 9);
        graphics.drawCenteredString(font, "ETERNAL", centerX, brandY, TEXT);
        graphics.drawCenteredString(font, "MINECRAFT CLIENT", centerX, brandY + 18, 0xFFFF5A61);
        graphics.drawCenteredString(font, "V" + EternalCore.VERSION + " · ORIGINAL ETERNAL INTERFACE", centerX, brandY + 34, DIM);

        int markY = brandY + 57;
        int pulse = 145 + (int) (95 * (0.5 + 0.5 * Math.sin(now / 430.0)));
        int mark = (pulse << 24) | (accent & 0x00FFFFFF);
        graphics.fill(centerX - 23, markY - 5, centerX + 23, markY + 41, 0x25000000);
        graphics.fill(centerX - 19, markY - 1, centerX + 19, markY + 37, 0xD2080A0D);
        graphics.renderOutline(centerX - 19, markY - 1, 38, 38, 0x88606872);
        graphics.fill(centerX - 16, markY + 2, centerX - 12, markY + 34, mark);
        graphics.fill(centerX - 11, markY + 2, centerX + 14, markY + 6, mark);
        graphics.fill(centerX - 11, markY + 16, centerX + 9, markY + 20, mark);
        graphics.fill(centerX - 11, markY + 30, centerX + 14, markY + 34, mark);

        int menuW = Math.min(620, width - 42);
        int menuX = centerX - menuW / 2;
        int menuY = markY + 54;
        int gap = 8;
        int largeW = (menuW - gap) / 2;
        tile(graphics, mouseX, mouseY, menuX, menuY, largeW, 52, "SINGLEPLAYER", "World library · local saves", true, "PLAY");
        tile(graphics, mouseX, mouseY, menuX + largeW + gap, menuY, largeW, 52, "MULTIPLAYER", "Servers · direct connect", true, "ONLINE");

        int rowY = menuY + 60;
        int smallW = (menuW - gap * 2) / 3;
        tile(graphics, mouseX, mouseY, menuX, rowY, smallW, 46, "MODULES", "Choose real Core modules", false, enabledCount() + " ON");
        tile(graphics, mouseX, mouseY, menuX + smallW + gap, rowY, smallW, 46, "HUD STUDIO", "Drag · snap · preview", false, "EDIT");
        tile(graphics, mouseX, mouseY, menuX + (smallW + gap) * 2, rowY, smallW, 46, "OPTIONS", "Minecraft settings", false, "GAME");

        int utilityY = rowY + 54;
        tile(graphics, mouseX, mouseY, menuX, utilityY, menuW, 36, "QUIT GAME", "", false, "EXIT");

        int statusY = height - 76;
        graphics.fill(0, statusY - 16, width, height, 0xD8040507);
        graphics.fill(0, statusY - 17, width, statusY - 16, 0x243F464F);

        int statusW = Math.min(260, Math.max(210, width / 5));
        graphics.fill(18, statusY, 18 + statusW, statusY + 42, PANEL);
        graphics.renderOutline(18, statusY, statusW, 42, LINE);
        graphics.fill(18, statusY, 21, statusY + 42, accent);
        graphics.fill(29, statusY + 16, 34, statusY + 21, GREEN);
        graphics.drawString(font, "ETERNAL CORE ACTIVE", 43, statusY + 9, TEXT, false);
        graphics.drawString(font, enabledCount() + " HUD modules enabled · " + (CoreConfig.INSTANCE.on("Zoom") ? "Zoom ready" : "Zoom off"), 43, statusY + 25, MUTED, false);

        int keyX = width - 18;
        String hint = ClickGuiScreen.keyName(CoreConfig.INSTANCE.openKey()) + "  START   ·   "
                + ClickGuiScreen.keyName(CoreConfig.INSTANCE.hudEditorKey()) + "  HUD   ·   "
                + ClickGuiScreen.keyName(CoreConfig.INSTANCE.zoomKey()) + "  ZOOM";
        graphics.drawString(font, hint, keyX - font.width(hint), statusY + 17, DIM, false);

        int sweep = (int) ((now / 12L) % Math.max(1, width + 140)) - 140;
        graphics.fill(sweep, 0, Math.min(width, sweep + 90), 1, 0x66FFFFFF);
        graphics.fill(0, height - 2, Math.max(2, (int) (width * intro)), height, 0x77000000 | (accent & 0x00FFFFFF));
        super.render(graphics, mouseX, mouseY, delta);
    }

    private void tile(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h, String title, String subtitle, boolean primary, String badge) {
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        int accent = CoreConfig.INSTANCE.accentColor();
        int fill = primary
                ? (hover ? 0xF0220B0F : 0xE9160B0E)
                : (hover ? SURFACE_HOVER : SURFACE);
        graphics.fill(x - 2, y - 2, x + w + 2, y + h + 2, 0x18000000);
        graphics.fill(x, y, x + w, y + h, fill);
        graphics.renderOutline(x, y, w, h, primary ? 0x775D3034 : hover ? 0x77565D68 : LINE);
        graphics.fill(x, y, x + 3, y + h, primary || hover ? accent : 0x55384049);
        if (hover) graphics.fill(x + 3, y, x + w, y + 1, 0x55FFFFFF);
        int titleY = subtitle.isEmpty() ? y + (h - 8) / 2 : y + 11;
        graphics.drawString(font, title, x + 13, titleY, hover || primary ? TEXT : 0xFFD3D6DC, false);
        if (!subtitle.isEmpty()) graphics.drawString(font, subtitle, x + 13, y + 29, MUTED, false);
        if (!badge.isEmpty()) {
            int badgeW = font.width(badge) + 12;
            graphics.fill(x + w - badgeW - 9, y + 9, x + w - 9, y + 24, primary ? 0xFF2A1014 : 0xFF0C0F13);
            graphics.drawString(font, badge, x + w - badgeW - 3, y + 13, primary ? 0xFFFF8B90 : DIM, false);
        }
        if (hover) graphics.drawString(font, ">", x + w - 17, y + h - 13, 0xFFFF747A, false);
    }

    private void renderFallback(GuiGraphics graphics, int mouseX, int mouseY) {
        graphics.fill(0, 0, width, height, 0xFF07080A);
        int accent = CoreConfig.INSTANCE.accentColor();
        int center = width / 2;
        graphics.drawCenteredString(font, "ETERNAL CLIENT · SAFE MENU", center, 34, TEXT);
        graphics.drawCenteredString(font, "Premium menu renderer recovered from an error. Details: config/eternal-core.log", center, 52, MUTED);
        int w = Math.min(360, width - 28);
        int x = center - w / 2;
        int y = 82;
        fallbackButton(graphics, mouseX, mouseY, x, y, w, "SINGLEPLAYER", accent);
        fallbackButton(graphics, mouseX, mouseY, x, y + 38, w, "MULTIPLAYER", accent);
        fallbackButton(graphics, mouseX, mouseY, x, y + 76, w, "OPTIONS", accent);
        fallbackButton(graphics, mouseX, mouseY, x, y + 114, w, "QUIT GAME", accent);
    }

    private void fallbackButton(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, String text, int accent) {
        boolean hover = inside(mouseX, mouseY, x, y, w, 30);
        graphics.fill(x, y, x + w, y + 30, hover ? 0xFF1A1D22 : 0xFF111419);
        graphics.renderOutline(x, y, w, 30, hover ? accent : LINE);
        graphics.drawCenteredString(font, text, x + w / 2, y + 11, hover ? TEXT : MUTED);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        try {
            if (degraded) return fallbackClick(event);
            return premiumClick(event, doubleClick);
        } catch (Throwable error) {
            CoreLog.error("Eternal title-screen action failed", error);
            NotificationCenter.push("ETERNAL ERROR", "Menu action failed · check eternal-core.log");
            return true;
        }
    }

    private boolean premiumClick(MouseButtonEvent event, boolean doubleClick) {
        int menuW = Math.min(620, width - 42);
        int menuX = width / 2 - menuW / 2;
        int brandY = Math.max(30, height / 9);
        int markY = brandY + 57;
        int menuY = markY + 54;
        int gap = 8;
        int largeW = (menuW - gap) / 2;
        int rowY = menuY + 60;
        int smallW = (menuW - gap * 2) / 3;
        int utilityY = rowY + 54;
        int mx = (int) event.x();
        int my = (int) event.y();
        Minecraft mc = Minecraft.getInstance();

        if (inside(mx, my, menuX, menuY, largeW, 52)) {
            mc.setScreen(new SelectWorldScreen(this));
            return true;
        }
        if (inside(mx, my, menuX + largeW + gap, menuY, largeW, 52)) {
            mc.setScreen(new JoinMultiplayerScreen(this));
            return true;
        }
        if (inside(mx, my, menuX, rowY, smallW, 46)) {
            EternalCore.openClickGui();
            return true;
        }
        if (inside(mx, my, menuX + smallW + gap, rowY, smallW, 46)) {
            EternalCore.openHudEditor();
            return true;
        }
        if (inside(mx, my, menuX + (smallW + gap) * 2, rowY, smallW, 46)) {
            mc.setScreen(new OptionsScreen(this, mc.options));
            return true;
        }
        if (inside(mx, my, menuX, utilityY, menuW, 36)) {
            mc.stop();
            return true;
        }
        return super.mouseClicked(event, doubleClick);
    }

    private boolean fallbackClick(MouseButtonEvent event) {
        int w = Math.min(360, width - 28);
        int x = width / 2 - w / 2;
        int y = 82;
        int mx = (int) event.x();
        int my = (int) event.y();
        Minecraft mc = Minecraft.getInstance();
        if (inside(mx, my, x, y, w, 30)) { mc.setScreen(new SelectWorldScreen(this)); return true; }
        if (inside(mx, my, x, y + 38, w, 30)) { mc.setScreen(new JoinMultiplayerScreen(this)); return true; }
        if (inside(mx, my, x, y + 76, w, 30)) { mc.setScreen(new OptionsScreen(this, mc.options)); return true; }
        if (inside(mx, my, x, y + 114, w, 30)) { mc.stop(); return true; }
        return true;
    }

    private int enabledCount() {
        int count = 0;
        for (String module : CoreConfig.MODULES) if (!"Zoom".equals(module) && CoreConfig.INSTANCE.on(module)) count++;
        return count;
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int width, int height) {
        return mouseX >= x && mouseX < x + width && mouseY >= y && mouseY < y + height;
    }

    @Override
    public boolean isPauseScreen() { return false; }
}
