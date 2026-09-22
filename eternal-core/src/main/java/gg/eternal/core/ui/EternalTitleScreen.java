package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.util.CoreLog;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.gui.screens.multiplayer.JoinMultiplayerScreen;
import net.minecraft.client.gui.screens.options.OptionsScreen;
import net.minecraft.client.gui.screens.worldselection.SelectWorldScreen;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

public final class EternalTitleScreen extends Screen {
    private static final int TEXT = EternalUi.TEXT;
    private static final int MUTED = EternalUi.MUTED;
    private static final int DIM = EternalUi.DIM;
    private static final int GREEN = EternalUi.GREEN;

    private final long openedAt = System.currentTimeMillis();

    public EternalTitleScreen() {
        super(Component.literal("Eternal Client"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        MenuViewport view = viewport();
        graphics.pose().pushMatrix();
        graphics.pose().scale(view.scale(), view.scale());
        try { renderMenu(graphics, view.pointer(mouseX), view.pointer(mouseY), delta); }
        finally { graphics.pose().popMatrix(); }
    }

    private void renderMenu(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        CoreConfig config = CoreConfig.INSTANCE;
        int accent = config.accentColor();
        long now = System.currentTimeMillis();
        float intro = EternalUi.easeOutCubic((now - openedAt) / 420.0F);
        Layout layout = layout();

        EternalUi.backdrop(graphics, viewport().width(), viewport().height(), accent);

        int lift = 0;
        int alpha = Math.max(34, Math.round(255.0F * intro));
        int titleY = layout.y + 2 + lift;

        drawBrand(graphics, layout.x, titleY, accent, alpha);
        drawTopStatus(graphics, layout.x + layout.w, titleY, accent, alpha);

        int mainY = layout.contentY + lift;
        if (layout.wide) {
            drawHero(graphics, mouseX, mouseY, layout.contentX, mainY, layout.mainW, layout.heroH, accent);
            drawPlayRow(graphics, mouseX, mouseY, layout, mainY + layout.heroH + 12, accent);
            drawActionDock(graphics, mouseX, mouseY, layout, mainY + layout.heroH + 12 + layout.playH + 12, accent);
            drawCoreRail(graphics, layout.sideX, mainY, layout.sideW, layout.bodyH, accent);
        } else {
            drawHero(graphics, mouseX, mouseY, layout.contentX, mainY, layout.mainW, layout.heroH, accent);
            drawPlayRow(graphics, mouseX, mouseY, layout, mainY + layout.heroH + 10, accent);
            drawActionDock(graphics, mouseX, mouseY, layout, mainY + layout.heroH + 10 + layout.playH + 10, accent);
            drawCompactStatus(graphics, layout.contentX, mainY + layout.heroH + 10 + layout.playH + 62, layout.mainW, accent);
        }

        drawFooter(graphics, layout, accent, intro);
        super.render(graphics, mouseX, mouseY, delta);
    }

    private void drawBrand(GuiGraphics graphics, int x, int y, int accent, int alpha) {
        int mark = EternalUi.alpha(accent, alpha);
        graphics.fill(x, y + 1, x + 5, y + 33, mark);
        graphics.fill(x + 7, y + 1, x + 31, y + 5, mark);
        graphics.fill(x + 7, y + 15, x + 26, y + 19, mark);
        graphics.fill(x + 7, y + 29, x + 31, y + 33, mark);
        graphics.drawString(font, "ETERNAL", x + 43, y + 3, EternalUi.alpha(TEXT, alpha), false);
        graphics.drawString(font, "CLIENT", x + 43, y + 18, EternalUi.alpha(accent, alpha), false);
        graphics.drawString(font, "MINECRAFT · FABRIC · " + EternalCore.VERSION, x + 103, y + 18, EternalUi.alpha(DIM, alpha), false);
    }

    private void drawTopStatus(GuiGraphics graphics, int right, int y, int accent, int alpha) {
        String label = "CORE READY";
        int w = font.width(label) + 32;
        int x = right - w;
        EternalUi.chip(graphics, x, y + 4, w, 24, accent, true);
        int pulse = 150 + (int) (90 * (0.5D + 0.5D * Math.sin(System.currentTimeMillis() / 420.0D)));
        graphics.fill(x + 9, y + 13, x + 14, y + 18, EternalUi.alpha(GREEN, Math.min(alpha, pulse)));
        graphics.drawString(font, label, x + 21, y + 12, EternalUi.alpha(0xFFB6F4C9, alpha), false);
    }

    private void drawHero(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h, int accent) {
        EternalUi.glass(graphics, x, y, w, h, accent, false);
        EternalUi.accentRail(graphics, x, y, h, accent, true);
        graphics.drawString(font, "ETERNAL START", x + 20, y + 18, DIM, false);
        graphics.drawString(font, "Your Minecraft. Sharpened.", x + 20, y + 38, TEXT, false);
        graphics.drawString(font, "Worlds, servers and your combat workspace.", x + 20, y + 56, MUTED, false);

        int chipY = y + h - 31;
        int enabled = enabledCount();
        smallChip(graphics, x + 20, chipY, "CORE " + EternalCore.VERSION, accent, true);
        smallChip(graphics, x + 118, chipY, enabled + " MODULES ON", accent, enabled > 0);
        smallChip(graphics, x + 238, chipY, "RIGHT SHIFT · START", accent, false);

        int glowX = x + w - 122;
        int glowY = y + 22;
        for (int i = 4; i >= 1; i--) {
            int pad = i * 8;
            graphics.fill(glowX - pad, glowY - pad, glowX + 70 + pad, glowY + 70 + pad, EternalUi.accentGlow(accent, 3 + i * 3));
        }
        graphics.fill(glowX, glowY, glowX + 70, glowY + 70, 0xD5080A0E);
        graphics.renderOutline(glowX, glowY, 70, 70, EternalUi.alpha(accent, 92));
        graphics.fill(glowX + 17, glowY + 15, glowX + 23, glowY + 55, accent);
        graphics.fill(glowX + 27, glowY + 15, glowX + 54, glowY + 21, accent);
        graphics.fill(glowX + 27, glowY + 32, glowX + 49, glowY + 38, accent);
        graphics.fill(glowX + 27, glowY + 49, glowX + 54, glowY + 55, accent);
    }

    private void drawPlayRow(GuiGraphics graphics, int mouseX, int mouseY, Layout layout, int y, int accent) {
        int gap = 10;
        int cardW = (layout.mainW - gap) / 2;
        playCard(graphics, mouseX, mouseY, layout.contentX, y, cardW, layout.playH, "SINGLEPLAYER", "Continue a world or create a new one", "WORLD", accent);
        playCard(graphics, mouseX, mouseY, layout.contentX + cardW + gap, y, cardW, layout.playH, "MULTIPLAYER", "Servers, direct connect and PvP", "ONLINE", accent);
    }

    private void playCard(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h,
                          String title, String subtitle, String badge, int accent) {
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        EternalUi.glass(graphics, x, y, w, h, accent, hover);
        EternalUi.accentRail(graphics, x, y, h, accent, hover);
        graphics.drawString(font, title, x + 16, y + 14, hover ? TEXT : 0xFFE1E4E9, false);
        graphics.drawString(font, subtitle, x + 16, y + 31, MUTED, false);
        int badgeW = font.width(badge) + 16;
        EternalUi.chip(graphics, x + w - badgeW - 12, y + 12, badgeW, 19, accent, hover);
        graphics.drawCenteredString(font, badge, x + w - badgeW / 2 - 12, y + 18, hover ? TEXT : DIM);
        graphics.drawString(font, hover ? "ENTER  >" : "OPEN", x + w - 56, y + h - 18, hover ? accent : DIM, false);
    }

    private void drawActionDock(GuiGraphics graphics, int mouseX, int mouseY, Layout layout, int y, int accent) {
        int gap = 7;
        int itemW = (layout.mainW - gap * 3) / 4;
        dockButton(graphics, mouseX, mouseY, layout.contentX, y, itemW, 42, "MODULES", "Core", accent);
        dockButton(graphics, mouseX, mouseY, layout.contentX + itemW + gap, y, itemW, 42, "HUD EDITOR", "Layout", accent);
        dockButton(graphics, mouseX, mouseY, layout.contentX + (itemW + gap) * 2, y, itemW, 42, "OPTIONS", "Minecraft", accent);
        dockButton(graphics, mouseX, mouseY, layout.contentX + (itemW + gap) * 3, y, itemW, 42, "QUIT", "Exit game", accent);
    }

    private void dockButton(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h, String title, String sub, int accent) {
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        EternalUi.glass(graphics, x, y, w, h, accent, hover);
        graphics.drawString(font, title, x + 12, y + 9, hover ? TEXT : 0xFFD3D7DD, false);
        graphics.drawString(font, sub, x + 12, y + 24, hover ? EternalUi.livingAccent(accent, y) : DIM, false);
    }

    private void drawCoreRail(GuiGraphics graphics, int x, int y, int w, int h, int accent) {
        EternalUi.glass(graphics, x, y, w, h, accent, false);
        graphics.drawString(font, "CORE SNAPSHOT", x + 16, y + 16, DIM, false);
        graphics.drawString(font, "Ready to play", x + 16, y + 36, TEXT, false);
        graphics.fill(x + 16, y + 56, x + w - 16, y + 57, 0x263F4650);

        fact(graphics, x + 16, y + 74, "VERSION", EternalCore.VERSION, accent);
        fact(graphics, x + 16, y + 110, "MODULES ENABLED", Integer.toString(enabledCount()), accent);
        fact(graphics, x + 16, y + 146, "CLICKGUI", ClickGuiScreen.keyName(CoreConfig.INSTANCE.openKey()), accent);
        fact(graphics, x + 16, y + 182, "HUD EDITOR", ClickGuiScreen.keyName(CoreConfig.INSTANCE.hudEditorKey()), accent);
        fact(graphics, x + 16, y + 218, "ZOOM", ClickGuiScreen.keyName(CoreConfig.INSTANCE.zoomKey()), accent);

        int y2 = y + h - 76;
        graphics.fill(x + 16, y2, x + w - 16, y2 + 1, 0x263F4650);
        graphics.drawString(font, "CLIENT STATE", x + 16, y2 + 14, DIM, false);
        graphics.fill(x + 16, y2 + 34, x + 21, y2 + 39, GREEN);
        graphics.drawString(font, "LOCAL CONFIG · LIVE", x + 29, y2 + 32, 0xFFB5EFC6, false);
        graphics.drawString(font, "No launcher process required", x + 16, y2 + 49, MUTED, false);
    }

    private void drawCompactStatus(GuiGraphics graphics, int x, int y, int w, int accent) {
        EternalUi.glass(graphics, x, y, w, 43, accent, false);
        graphics.fill(x + 13, y + 18, x + 18, y + 23, GREEN);
        graphics.drawString(font, "CORE " + EternalCore.VERSION + " READY", x + 27, y + 11, TEXT, false);
        graphics.drawString(font, enabledCount() + " modules enabled · ClickGUI " + ClickGuiScreen.keyName(CoreConfig.INSTANCE.openKey()), x + 27, y + 25, MUTED, false);
    }

    private void fact(GuiGraphics graphics, int x, int y, String label, String value, int accent) {
        graphics.drawString(font, label, x, y, DIM, false);
        graphics.drawString(font, value, x, y + 14, TEXT, false);
        int dotX = x + 154;
        graphics.fill(dotX, y + 9, dotX + 4, y + 13, EternalUi.livingAccent(accent, y));
    }

    private void smallChip(GuiGraphics graphics, int x, int y, String text, int accent, boolean active) {
        int w = font.width(text) + 16;
        EternalUi.chip(graphics, x, y, w, 19, accent, active);
        graphics.drawString(font, text, x + 8, y + 6, active ? TEXT : MUTED, false);
    }

    private void drawFooter(GuiGraphics graphics, Layout layout, int accent, float intro) {
        int y = layout.y + layout.h - 24;
        String left = "ETERNAL · ORIGINAL CLIENT UI";
        String right = "RIGHT SHIFT  START   ·   H  HUD   ·   C  ZOOM   ·   V  VIEW";
        graphics.drawString(font, left, layout.x, y, DIM, false);
        graphics.drawString(font, right, layout.x + layout.w - font.width(right), y, DIM, false);
        EternalUi.progress(graphics, layout.x, layout.y + layout.h - 5, layout.w, accent, intro);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        Layout layout = layout();
        int y = layout.contentY;
        int playY = y + layout.heroH + (layout.wide ? 12 : 10);
        int dockY = playY + layout.playH + (layout.wide ? 12 : 10);
        int gap = 10;
        int cardW = (layout.mainW - gap) / 2;
        int dockGap = 7;
        int dockW = (layout.mainW - dockGap * 3) / 4;
        int mx = viewport().pointer(event.x());
        int my = viewport().pointer(event.y());
        Minecraft mc = Minecraft.getInstance();

        try {
            if (inside(mx, my, layout.contentX, playY, cardW, layout.playH)) {
                mc.setScreen(new SelectWorldScreen(this));
                return true;
            }
            if (inside(mx, my, layout.contentX + cardW + gap, playY, cardW, layout.playH)) {
                mc.setScreen(new JoinMultiplayerScreen(this));
                return true;
            }
            if (inside(mx, my, layout.contentX, dockY, dockW, 42)) {
                EternalCore.openClickGui();
                return true;
            }
            if (inside(mx, my, layout.contentX + dockW + dockGap, dockY, dockW, 42)) {
                EternalCore.openHudEditor();
                return true;
            }
            if (inside(mx, my, layout.contentX + (dockW + dockGap) * 2, dockY, dockW, 42)) {
                mc.setScreen(new OptionsScreen(this, mc.options));
                return true;
            }
            if (inside(mx, my, layout.contentX + (dockW + dockGap) * 3, dockY, dockW, 42)) {
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

    private MenuViewport viewport() { return MenuViewport.fit(width, height, 1000, 560); }

    private Layout layout() {
        int width = viewport().width();
        int height = viewport().height();
        int w = Math.min(960, Math.max(360, width - 34));
        int h = Math.min(510, Math.max(350, height - 34));
        int x = (width - w) / 2;
        int y = (height - h) / 2;
        boolean wide = w >= 760;
        int contentX = x;
        int contentY = y + 60;
        int sideGap = wide ? 14 : 0;
        int sideW = wide ? Math.min(234, Math.max(204, w / 4)) : 0;
        int mainW = wide ? w - sideW - sideGap : w;
        int sideX = contentX + mainW + sideGap;
        int heroH = 112;
        int playH = 64;
        int bodyH = Math.max(280, h - 94);
        return new Layout(x, y, w, h, wide, contentX, contentY, mainW, sideX, sideW, heroH, playH, bodyH);
    }

    private int enabledCount() {
        int count = 0;
        for (String module : CoreConfig.MODULES) if (CoreConfig.INSTANCE.on(module)) count++;
        return count;
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int width, int height) {
        return mouseX >= x && mouseX < x + width && mouseY >= y && mouseY < y + height;
    }

    private record Layout(int x, int y, int w, int h, boolean wide, int contentX, int contentY,
                          int mainW, int sideX, int sideW, int heroH, int playH, int bodyH) {}

    @Override
    public boolean isPauseScreen() { return false; }
}
