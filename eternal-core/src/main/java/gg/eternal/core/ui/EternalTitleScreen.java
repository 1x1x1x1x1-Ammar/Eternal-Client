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

    public EternalTitleScreen() {
        super(Component.literal("Eternal Client"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        int accent = CoreConfig.INSTANCE.accentColor();
        long now = System.currentTimeMillis();
        float intro = Math.min(1.0F, (now - openedAt) / 320.0F);

        graphics.fill(0, 0, width, height, 0xFF050608);
        graphics.fill(0, 0, width, Math.max(1, height / 3), 0xFF09090C);
        int glowW = Math.max(220, width / 2);
        for (int i = 0; i < 9; i++) {
            int alpha = Math.max(5, 38 - i * 4);
            int left = Math.max(0, width / 2 - glowW / 2 - i * 24);
            int right = Math.min(width, width / 2 + glowW / 2 + i * 24);
            int top = Math.max(0, height / 5 - i * 12);
            int bottom = Math.min(height, height * 3 / 5 + i * 16);
            graphics.fill(left, top, right, bottom, (alpha << 24) | (accent & 0x00FFFFFF));
        }
        graphics.fill(0, height - 86, width, height, 0xD8040507);
        graphics.fill(0, height - 87, width, height - 86, 0x223F464F);

        int centerX = width / 2;
        int brandY = Math.max(34, height / 7);
        String brand = "ETERNAL";
        String sub = "MINECRAFT CLIENT";
        graphics.drawCenteredString(font, brand, centerX, brandY, TEXT);
        graphics.drawCenteredString(font, sub, centerX, brandY + 18, 0xFFB23A40);
        graphics.drawCenteredString(font, "V" + EternalCore.VERSION + " · PREMIUM CORE", centerX, brandY + 34, DIM);

        int markY = brandY + 58;
        int pulse = 150 + (int) (80 * (0.5 + 0.5 * Math.sin(now / 430.0)));
        int mark = (pulse << 24) | (accent & 0x00FFFFFF);
        graphics.fill(centerX - 18, markY, centerX + 18, markY + 36, 0xA5090B0E);
        graphics.renderOutline(centerX - 18, markY, 36, 36, 0x77575E68);
        graphics.fill(centerX - 15, markY + 3, centerX - 11, markY + 33, mark);
        graphics.fill(centerX - 10, markY + 3, centerX + 13, markY + 7, mark);
        graphics.fill(centerX - 10, markY + 16, centerX + 8, markY + 20, mark);
        graphics.fill(centerX - 10, markY + 29, centerX + 13, markY + 33, mark);

        int menuW = Math.min(540, width - 36);
        int menuX = centerX - menuW / 2;
        int menuY = markY + 54;
        int gap = 7;
        int largeW = (menuW - gap) / 2;
        tile(graphics, mouseX, mouseY, menuX, menuY, largeW, 48, "SINGLEPLAYER", "World library", true);
        tile(graphics, mouseX, mouseY, menuX + largeW + gap, menuY, largeW, 48, "MULTIPLAYER", "Servers + direct connect", true);

        int rowY = menuY + 55;
        int smallW = (menuW - gap * 2) / 3;
        tile(graphics, mouseX, mouseY, menuX, rowY, smallW, 43, "MODULES", "Eternal Core", false);
        tile(graphics, mouseX, mouseY, menuX + smallW + gap, rowY, smallW, 43, "HUD EDITOR", "Drag + snap", false);
        tile(graphics, mouseX, mouseY, menuX + (smallW + gap) * 2, rowY, smallW, 43, "OPTIONS", "Minecraft settings", false);

        int quitY = rowY + 50;
        tile(graphics, mouseX, mouseY, menuX, quitY, menuW, 33, "QUIT GAME", "", false);

        int statusY = height - 64;
        graphics.fill(16, statusY, 216, statusY + 38, PANEL);
        graphics.renderOutline(16, statusY, 200, 38, LINE);
        graphics.fill(24, statusY + 15, 29, statusY + 20, GREEN);
        graphics.drawString(font, "ETERNAL CORE ACTIVE", 38, statusY + 9, TEXT, false);
        graphics.drawString(font, enabledCount() + " HUD modules enabled", 38, statusY + 23, MUTED, false);

        String hint = "RIGHT SHIFT · ETERNAL START     H · HUD EDITOR     C · ZOOM (WHEN ENABLED)";
        graphics.drawString(font, hint, width - 18 - font.width(hint), statusY + 15, DIM, false);

        int sweep = (int) ((now / 12L) % Math.max(1, width + 120)) - 120;
        graphics.fill(sweep, 0, Math.min(width, sweep + 80), 1, 0x66FFFFFF);
        graphics.fill(0, height - 2, Math.max(2, (int) (width * intro)), height, 0x66000000 | (accent & 0x00FFFFFF));
        super.render(graphics, mouseX, mouseY, delta);
    }

    private void tile(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h, String title, String subtitle, boolean primary) {
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        int accent = CoreConfig.INSTANCE.accentColor();
        int fill = primary
                ? (hover ? 0xEF1D0B0E : 0xE9140B0E)
                : (hover ? SURFACE_HOVER : SURFACE);
        graphics.fill(x, y, x + w, y + h, fill);
        graphics.renderOutline(x, y, w, h, primary ? 0x665D3034 : hover ? 0x66565D68 : LINE);
        graphics.fill(x, y, x + 2, y + h, primary || hover ? accent : 0x55384049);
        if (hover) graphics.fill(x, y, x + w, y + 1, 0x44FFFFFF);
        int titleY = subtitle.isEmpty() ? y + (h - 8) / 2 : y + 11;
        graphics.drawString(font, title, x + 12, titleY, hover || primary ? TEXT : 0xFFD3D6DC, false);
        if (!subtitle.isEmpty()) graphics.drawString(font, subtitle, x + 12, y + 27, MUTED, false);
        if (hover) graphics.drawString(font, ">", x + w - 16, y + (h - 8) / 2, 0xFFFF747A, false);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        int menuW = Math.min(540, width - 36);
        int menuX = width / 2 - menuW / 2;
        int brandY = Math.max(34, height / 7);
        int markY = brandY + 58;
        int menuY = markY + 54;
        int gap = 7;
        int largeW = (menuW - gap) / 2;
        int rowY = menuY + 55;
        int smallW = (menuW - gap * 2) / 3;
        int quitY = rowY + 50;
        int mx = (int) event.x();
        int my = (int) event.y();
        Minecraft mc = Minecraft.getInstance();

        try {
            if (inside(mx, my, menuX, menuY, largeW, 48)) {
                mc.setScreen(new SelectWorldScreen(this));
                return true;
            }
            if (inside(mx, my, menuX + largeW + gap, menuY, largeW, 48)) {
                mc.setScreen(new JoinMultiplayerScreen(this));
                return true;
            }
            if (inside(mx, my, menuX, rowY, smallW, 43)) {
                EternalCore.openClickGui();
                return true;
            }
            if (inside(mx, my, menuX + smallW + gap, rowY, smallW, 43)) {
                EternalCore.openHudEditor();
                return true;
            }
            if (inside(mx, my, menuX + (smallW + gap) * 2, rowY, smallW, 43)) {
                mc.setScreen(new OptionsScreen(this, mc.options));
                return true;
            }
            if (inside(mx, my, menuX, quitY, menuW, 33)) {
                mc.stop();
                return true;
            }
        } catch (Throwable error) {
            CoreLog.error("Eternal title-screen action failed", error);
            NotificationCenter.push("ETERNAL ERROR", "Menu action failed · check eternal-core.log");
            return true;
        }
        return super.mouseClicked(event, doubleClick);
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
