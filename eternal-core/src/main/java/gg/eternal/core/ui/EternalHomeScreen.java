package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import gg.eternal.core.util.CoreLog;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.gui.screens.options.OptionsScreen;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

public final class EternalHomeScreen extends Screen {
    private static final String[] QUICK_MODULES = {"Zoom", "Crosshair", "Fullbright", "ToggleSprint", "ToggleSneak", "Perspective"};
    private static final String[] QUICK_LABELS = {"ZOOM", "CROSSHAIR", "FULLBRIGHT", "TOGGLE SPRINT", "TOGGLE SNEAK", "PERSPECTIVE"};
    private static final int TEXT = EternalUi.TEXT;
    private static final int MUTED = EternalUi.MUTED;
    private static final int DIM = EternalUi.DIM;
    private static final int GREEN = EternalUi.GREEN;

    private final long openedAt = System.currentTimeMillis();
    private boolean renderFailureLogged;

    public EternalHomeScreen() {
        super(Component.literal("Eternal Start"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        try {
            renderEternal(graphics, mouseX, mouseY, delta);
        } catch (Throwable error) {
            if (!renderFailureLogged) {
                renderFailureLogged = true;
                CoreLog.error("Eternal Start render failed", error);
            }
            renderFallback(graphics);
        }
    }

    private void renderEternal(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        CoreConfig config = CoreConfig.INSTANCE;
        int accent = config.accentColor();
        Layout l = layout();
        long now = System.currentTimeMillis();
        float intro = EternalUi.easeOutCubic((now - openedAt) / 300.0F);

        EternalUi.veil(graphics, width, height, accent);
        drawHeader(graphics, l, accent, intro);
        drawRail(graphics, mouseX, mouseY, l, accent);
        drawOverview(graphics, l, accent);
        drawStats(graphics, l, accent);
        drawQuickModules(graphics, mouseX, mouseY, l, accent);
        drawHudWorkspace(graphics, mouseX, mouseY, l, accent);
        drawFooter(graphics, l, accent, intro);
        super.render(graphics, mouseX, mouseY, delta);
    }

    private void drawHeader(GuiGraphics graphics, Layout l, int accent, float intro) {
        graphics.fill(l.x, l.y, l.x + l.w, l.y + 54, 0xF20A0C10);
        graphics.renderOutline(l.x, l.y, l.w, 54, 0x584D5561);
        graphics.fill(l.x, l.y, l.x + 3, l.y + 54, accent);

        graphics.drawString(font, "ETERNAL", l.x + 18, l.y + 13, TEXT, false);
        graphics.drawString(font, "START", l.x + 18 + font.width("ETERNAL") + 6, l.y + 13, accent, false);
        graphics.drawString(font, "LIVE IN-GAME COMMAND CENTER · " + EternalCore.VERSION, l.x + 18, l.y + 30, DIM, false);

        String state = "CORE LIVE";
        int stateW = font.width(state) + 32;
        int stateX = l.x + l.w - stateW - 16;
        EternalUi.chip(graphics, stateX, l.y + 15, stateW, 23, accent, true);
        int pulse = 145 + (int) (95 * (0.5D + 0.5D * Math.sin(System.currentTimeMillis() / 390.0D)));
        graphics.fill(stateX + 9, l.y + 24, stateX + 14, l.y + 29, EternalUi.alpha(GREEN, pulse));
        graphics.drawString(font, state, stateX + 21, l.y + 22, 0xFFB8F3C9, false);

        EternalUi.progress(graphics, l.x + 3, l.y + 52, l.w - 6, accent, intro);
    }

    private void drawRail(GuiGraphics graphics, int mouseX, int mouseY, Layout l, int accent) {
        EternalUi.glass(graphics, l.railX, l.bodyY, l.railW, l.bodyH, accent, false);
        graphics.drawString(font, "QUICK ACCESS", l.railX + 14, l.bodyY + 15, DIM, false);

        railButton(graphics, mouseX, mouseY, l.railX + 10, l.bodyY + 39, l.railW - 20, 42, "RESUME", "Back to game", accent, true);
        railButton(graphics, mouseX, mouseY, l.railX + 10, l.bodyY + 88, l.railW - 20, 42, "MODULES", "ClickGUI 2.0", accent, false);
        railButton(graphics, mouseX, mouseY, l.railX + 10, l.bodyY + 137, l.railW - 20, 42, "HUD EDITOR", "Drag + snap", accent, false);
        railButton(graphics, mouseX, mouseY, l.railX + 10, l.bodyY + 186, l.railW - 20, 42, "OPTIONS", "Minecraft", accent, false);

        int lower = l.bodyY + l.bodyH - 92;
        graphics.fill(l.railX + 14, lower, l.railX + l.railW - 14, lower + 1, 0x2A424954);
        graphics.drawString(font, "KEYBINDS", l.railX + 14, lower + 14, DIM, false);
        graphics.drawString(font, "START", l.railX + 14, lower + 31, MUTED, false);
        graphics.drawString(font, ClickGuiScreen.keyName(CoreConfig.INSTANCE.openKey()), l.railX + l.railW - 14 - font.width(ClickGuiScreen.keyName(CoreConfig.INSTANCE.openKey())), lower + 31, TEXT, false);
        graphics.drawString(font, "HUD", l.railX + 14, lower + 48, MUTED, false);
        graphics.drawString(font, ClickGuiScreen.keyName(CoreConfig.INSTANCE.hudEditorKey()), l.railX + l.railW - 14 - font.width(ClickGuiScreen.keyName(CoreConfig.INSTANCE.hudEditorKey())), lower + 48, TEXT, false);
    }

    private void railButton(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h,
                            String title, String sub, int accent, boolean primary) {
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        int fill = primary ? EternalUi.alpha(accent, hover ? 70 : 48) : hover ? 0xF4161A20 : 0xE80D1015;
        graphics.fill(x, y, x + w, y + h, fill);
        graphics.renderOutline(x, y, w, h, primary || hover ? EternalUi.alpha(accent, 112) : 0x3B4A515C);
        EternalUi.accentRail(graphics, x, y, h, accent, primary || hover);
        graphics.drawString(font, title, x + 13, y + 9, TEXT, false);
        graphics.drawString(font, sub, x + 13, y + 24, primary || hover ? 0xFFC6CBD2 : DIM, false);
        if (hover) graphics.drawString(font, ">", x + w - 16, y + 17, accent, false);
    }

    private void drawOverview(GuiGraphics graphics, Layout l, int accent) {
        int x = l.mainX;
        int y = l.bodyY;
        int w = l.mainW;
        EternalUi.glass(graphics, x, y, w, 92, accent, false);
        EternalUi.accentRail(graphics, x, y, 92, accent, true);
        graphics.drawString(font, "WELCOME BACK", x + 18, y + 15, DIM, false);
        graphics.drawString(font, currentWorldLabel(), x + 18, y + 34, TEXT, false);
        graphics.drawString(font, "Tune the client live, then close this menu and keep playing.", x + 18, y + 52, MUTED, false);

        int enabled = enabledHudModules();
        String chip = enabled + " HUD MODULE" + (enabled == 1 ? "" : "S") + " ON";
        int chipW = font.width(chip) + 18;
        EternalUi.chip(graphics, x + w - chipW - 16, y + 15, chipW, 21, accent, enabled > 0);
        graphics.drawString(font, chip, x + w - chipW - 7, y + 22, enabled > 0 ? TEXT : MUTED, false);

        String status = CoreConfig.INSTANCE.notifications() ? "NOTIFICATIONS LIVE" : "NOTIFICATIONS MUTED";
        graphics.drawString(font, status, x + w - font.width(status) - 16, y + 56, CoreConfig.INSTANCE.notifications() ? 0xFF83DEA0 : DIM, false);
    }

    private void drawStats(GuiGraphics graphics, Layout l, int accent) {
        int y = l.bodyY + 102;
        int gap = 7;
        int statW = (l.mainW - gap * 3) / 4;
        stat(graphics, l.mainX, y, statW, "FPS", strip(HudRenderer.value("FPS"), "FPS  "), accent);
        stat(graphics, l.mainX + statW + gap, y, statW, "PING", strip(HudRenderer.value("Ping"), "PING  "), accent);
        stat(graphics, l.mainX + (statW + gap) * 2, y, statW, "HEALTH", strip(HudRenderer.value("Health"), "HP  "), accent);
        stat(graphics, l.mainX + (statW + gap) * 3, y, statW, "SESSION", strip(HudRenderer.value("Session"), "SESSION  "), accent);
    }

    private void stat(GuiGraphics graphics, int x, int y, int w, String title, String value, int accent) {
        EternalUi.glass(graphics, x, y, w, 54, accent, false);
        graphics.drawString(font, title, x + 11, y + 10, DIM, false);
        graphics.drawString(font, value, x + 11, y + 29, TEXT, false);
        graphics.fill(x + w - 13, y + 12, x + w - 9, y + 16, EternalUi.livingAccent(accent, y));
    }

    private void drawQuickModules(GuiGraphics graphics, int mouseX, int mouseY, Layout l, int accent) {
        int titleY = l.bodyY + 171;
        graphics.drawString(font, "QUICK MODULES", l.mainX, titleY, DIM, false);
        graphics.drawString(font, "CLICK TO TOGGLE · SAVES INSTANTLY", l.mainX + 93, titleY, 0xFF4F5661, false);

        int startY = titleY + 18;
        int gap = 7;
        int cardW = (l.mainW - gap * 2) / 3;
        for (int i = 0; i < QUICK_MODULES.length; i++) {
            int cardX = l.mainX + (i % 3) * (cardW + gap);
            int cardY = startY + (i / 3) * 50;
            quickModule(graphics, mouseX, mouseY, cardX, cardY, cardW, 43, QUICK_MODULES[i], QUICK_LABELS[i], accent);
        }
    }

    private void quickModule(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h,
                             String module, String label, int accent) {
        boolean enabled = CoreConfig.INSTANCE.on(module);
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        EternalUi.glass(graphics, x, y, w, h, accent, hover || enabled);
        EternalUi.accentRail(graphics, x, y, h, accent, enabled);
        graphics.drawString(font, label, x + 12, y + 9, enabled ? TEXT : 0xFFD0D4DA, false);
        graphics.drawString(font, enabled ? "ENABLED" : "DISABLED", x + 12, y + 25, enabled ? 0xFF8CE5A8 : DIM, false);
        toggle(graphics, x + w - 38, y + 15, enabled, accent);
    }

    private void drawHudWorkspace(GuiGraphics graphics, int mouseX, int mouseY, Layout l, int accent) {
        int y = l.bodyY + 299;
        int h = Math.max(82, l.bodyY + l.bodyH - y);
        EternalUi.glass(graphics, l.mainX, y, l.mainW, h, accent, false);
        graphics.drawString(font, "HUD WORKSPACE", l.mainX + 14, y + 13, TEXT, false);
        graphics.drawString(font, "Opacity " + Math.round(CoreConfig.INSTANCE.hudAlpha() / 255.0F * 100.0F) + "%  ·  Snap " + CoreConfig.INSTANCE.snap() + "px", l.mainX + 14, y + 29, MUTED, false);

        int buttonY = y + 49;
        actionButton(graphics, mouseX, mouseY, l.mainX + 14, buttonY, 94, 27, "EDIT HUD", accent, true);
        actionButton(graphics, mouseX, mouseY, l.mainX + 116, buttonY, 78, 27, "DEFAULT", accent, false);
        actionButton(graphics, mouseX, mouseY, l.mainX + 202, buttonY, 78, 27, "COMPACT", accent, false);
        actionButton(graphics, mouseX, mouseY, l.mainX + 288, buttonY, 78, 27, "CORNERS", accent, false);

        if (l.mainW > 520) {
            int right = l.mainX + l.mainW - 190;
            graphics.drawString(font, "COORDINATES", right, y + 14, DIM, false);
            graphics.drawString(font, strip(HudRenderer.value("Coordinates"), "XYZ  "), right, y + 31, TEXT, false);
        }
    }

    private void actionButton(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h, String text, int accent, boolean primary) {
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        int fill = primary ? EternalUi.alpha(accent, hover ? 84 : 58) : hover ? 0xFF181C22 : 0xFF101318;
        graphics.fill(x, y, x + w, y + h, fill);
        graphics.renderOutline(x, y, w, h, primary || hover ? EternalUi.alpha(accent, 116) : 0x3A4A515B);
        graphics.drawCenteredString(font, text, x + w / 2, y + 10, primary || hover ? TEXT : MUTED);
    }

    private void toggle(GuiGraphics graphics, int x, int y, boolean enabled, int accent) {
        graphics.fill(x, y, x + 28, y + 14, enabled ? EternalUi.alpha(accent, 190) : 0xFF232830);
        graphics.renderOutline(x, y, 28, 14, enabled ? EternalUi.alpha(accent, 132) : 0x4C4A525E);
        int knobX = enabled ? x + 17 : x + 2;
        graphics.fill(knobX, y + 2, knobX + 9, y + 12, enabled ? 0xFFFFFFFF : 0xFFC4C8CF);
    }

    private void drawFooter(GuiGraphics graphics, Layout l, int accent, float intro) {
        int y = l.y + l.h - 20;
        graphics.drawString(font, "ETERNAL CORE " + EternalCore.VERSION, l.x, y, DIM, false);
        String right = "ESC · RESUME   |   CONFIG AUTO-SAVES";
        graphics.drawString(font, right, l.x + l.w - font.width(right), y, DIM, false);
        EternalUi.progress(graphics, l.x, l.y + l.h - 4, l.w, accent, intro);
    }

    private void renderFallback(GuiGraphics graphics) {
        graphics.fill(0, 0, width, height, 0xF4050608);
        int accent = CoreConfig.INSTANCE.accentColor();
        int boxW = Math.min(540, Math.max(300, width - 48));
        int boxH = 132;
        int x = (width - boxW) / 2;
        int y = (height - boxH) / 2;
        EternalUi.glass(graphics, x, y, boxW, boxH, accent, true);
        graphics.drawCenteredString(font, "ETERNAL CORE SAFE MODE", width / 2, y + 24, TEXT);
        graphics.drawCenteredString(font, "The premium dashboard hit a render error but Minecraft was kept alive.", width / 2, y + 49, MUTED);
        graphics.drawCenteredString(font, "See config/eternal-core.log, then press ESC to return to the game.", width / 2, y + 71, 0xFF9CA2AC);
        graphics.drawCenteredString(font, "v" + EternalCore.VERSION, width / 2, y + 96, accent);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        try {
            Layout l = layout();
            int mx = (int) event.x();
            int my = (int) event.y();
            Minecraft mc = Minecraft.getInstance();

            if (inside(mx, my, l.railX + 10, l.bodyY + 39, l.railW - 20, 42)) { mc.setScreen(null); return true; }
            if (inside(mx, my, l.railX + 10, l.bodyY + 88, l.railW - 20, 42)) { EternalCore.openClickGui(); return true; }
            if (inside(mx, my, l.railX + 10, l.bodyY + 137, l.railW - 20, 42)) { EternalCore.openHudEditor(); return true; }
            if (inside(mx, my, l.railX + 10, l.bodyY + 186, l.railW - 20, 42)) { mc.setScreen(new OptionsScreen(this, mc.options)); return true; }

            int titleY = l.bodyY + 171;
            int startY = titleY + 18;
            int gap = 7;
            int cardW = (l.mainW - gap * 2) / 3;
            for (int i = 0; i < QUICK_MODULES.length; i++) {
                int cardX = l.mainX + (i % 3) * (cardW + gap);
                int cardY = startY + (i / 3) * 50;
                if (inside(mx, my, cardX, cardY, cardW, 43)) {
                    CoreConfig.INSTANCE.toggle(QUICK_MODULES[i]);
                    NotificationCenter.push(QUICK_LABELS[i], CoreConfig.INSTANCE.on(QUICK_MODULES[i]) ? "Enabled" : "Disabled");
                    return true;
                }
            }

            int workspaceY = l.bodyY + 299;
            int buttonY = workspaceY + 49;
            if (inside(mx, my, l.mainX + 14, buttonY, 94, 27)) { EternalCore.openHudEditor(); return true; }
            if (inside(mx, my, l.mainX + 116, buttonY, 78, 27)) { CoreConfig.INSTANCE.applyPreset("DEFAULT", width, height); NotificationCenter.push("HUD PRESET", "Default layout applied"); return true; }
            if (inside(mx, my, l.mainX + 202, buttonY, 78, 27)) { CoreConfig.INSTANCE.applyPreset("COMPACT", width, height); NotificationCenter.push("HUD PRESET", "Compact layout applied"); return true; }
            if (inside(mx, my, l.mainX + 288, buttonY, 78, 27)) { CoreConfig.INSTANCE.applyPreset("CORNERS", width, height); NotificationCenter.push("HUD PRESET", "Corners layout applied"); return true; }

            return super.mouseClicked(event, doubleClick);
        } catch (Throwable error) {
            CoreLog.error("Eternal Start click action failed", error);
            NotificationCenter.push("ETERNAL ERROR", "Action failed · check eternal-core.log");
            return true;
        }
    }

    private Layout layout() {
        int w = Math.min(950, Math.max(560, width - 24));
        int h = Math.min(520, Math.max(390, height - 24));
        int x = (width - w) / 2;
        int y = (height - h) / 2;
        int bodyY = y + 64;
        int bodyH = h - 92;
        int railW = Math.min(176, Math.max(150, w / 5));
        int railX = x;
        int mainX = x + railW + 12;
        int mainW = w - railW - 12;
        return new Layout(x, y, w, h, bodyY, bodyH, railX, railW, mainX, mainW);
    }

    private int enabledHudModules() {
        int total = 0;
        for (String module : HudRenderer.modules()) if (CoreConfig.INSTANCE.on(module)) total++;
        return total;
    }

    private String currentWorldLabel() {
        Minecraft mc = Minecraft.getInstance();
        if (mc.getCurrentServer() != null) return mc.getCurrentServer().ip;
        if (mc.hasSingleplayerServer()) return "Singleplayer world";
        return "Minecraft session";
    }

    private static String strip(String value, String prefix) {
        if (value == null) return "--";
        return value.startsWith(prefix) ? value.substring(prefix.length()) : value;
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int width, int height) {
        return mouseX >= x && mouseX < x + width && mouseY >= y && mouseY < y + height;
    }

    private record Layout(int x, int y, int w, int h, int bodyY, int bodyH,
                          int railX, int railW, int mainX, int mainW) {}

    @Override
    public boolean isPauseScreen() { return false; }
}
