package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.input.KeyEvent;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

import java.util.LinkedHashMap;
import java.util.Map;

public final class ClickGuiScreen extends Screen {
    private static final String[] SECTIONS = {"HUD", "CLIENT", "VISUAL", "STYLE", "ABOUT"};
    private static final String[] HUD_MODULES = {
            "Watermark", "FPS", "CPS", "Keystrokes", "Coordinates", "Ping",
            "Speed", "Direction", "Health", "Armor", "Food", "Server",
            "Memory", "Session", "Clock"
    };
    private static final String[] CLIENT_MODULES = {"Zoom", "Fullbright", "ToggleSprint", "ToggleSneak", "Perspective"};
    private static final int[] ACCENTS = {0xFFFF3038, 0xFFFF6B35, 0xFF8B5CF6, 0xFF3B82F6, 0xFF22C55E};
    private static final Map<String, String> DESCRIPTIONS = new LinkedHashMap<>();

    private static final int BG = 0xF907090C;
    private static final int SIDEBAR = 0xFA0A0C10;
    private static final int SURFACE = 0xFF111419;
    private static final int SURFACE_HOVER = 0xFF171A20;
    private static final int LINE = 0x33414852;
    private static final int LINE_STRONG = 0x554B515C;
    private static final int TEXT = 0xFFF7F8FA;
    private static final int MUTED = 0xFF7C828D;
    private static final int DIM = 0xFF555B66;
    private static final int GREEN = 0xFF58ED89;

    static {
        DESCRIPTIONS.put("Watermark", "Eternal identity");
        DESCRIPTIONS.put("FPS", "Live frame rate");
        DESCRIPTIONS.put("CPS", "Mouse clicks/sec");
        DESCRIPTIONS.put("Keystrokes", "WASD + mouse state");
        DESCRIPTIONS.put("Coordinates", "Player XYZ");
        DESCRIPTIONS.put("Ping", "Server latency");
        DESCRIPTIONS.put("Speed", "Movement speed");
        DESCRIPTIONS.put("Direction", "Facing direction");
        DESCRIPTIONS.put("Health", "Health / max");
        DESCRIPTIONS.put("Armor", "Armor points");
        DESCRIPTIONS.put("Food", "Hunger level");
        DESCRIPTIONS.put("Server", "Current server");
        DESCRIPTIONS.put("Memory", "JVM memory");
        DESCRIPTIONS.put("Session", "Session time");
        DESCRIPTIONS.put("Clock", "Local clock");
        DESCRIPTIONS.put("Zoom", "Smooth configurable FOV zoom");
        DESCRIPTIONS.put("Fullbright", "Maximum client brightness");
        DESCRIPTIONS.put("ToggleSprint", "Minecraft toggle sprint");
        DESCRIPTIONS.put("ToggleSneak", "Minecraft toggle sneak");
        DESCRIPTIONS.put("Perspective", "Cycle camera perspective");
        DESCRIPTIONS.put("Crosshair", "Pixel-perfect custom crosshair");
    }

    private int section;
    private String bindingTarget;
    private final long openedAt = System.currentTimeMillis();
    private long sectionChangedAt = openedAt;

    public ClickGuiScreen() {
        super(Component.literal("Eternal Core"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        renderBackground(graphics, mouseX, mouseY, delta);

        int panelWidth = Math.min(820, width - 18);
        int panelHeight = Math.min(468, height - 18);
        int x = (width - panelWidth) / 2;
        int y = (height - panelHeight) / 2;
        int sidebarWidth = 138;
        int accent = CoreConfig.INSTANCE.accentColor();
        long now = System.currentTimeMillis();
        float intro = Math.min(1.0F, (now - openedAt) / 220.0F);

        drawWindowChrome(graphics, x, y, panelWidth, panelHeight, sidebarWidth, accent, intro);
        graphics.drawString(font, "ETERNAL", x + 18, y + 17, TEXT, false);
        graphics.drawString(font, "CORE", x + 18 + font.width("ETERNAL") + 5, y + 17, accent, false);
        graphics.drawString(font, "CUSTOMIZATION STUDIO · " + EternalCore.VERSION, x + 18, y + 32, DIM, false);

        String state = CoreConfig.INSTANCE.notifications() ? "LIVE CONFIG" : "SILENT MODE";
        int stateWidth = font.width(state) + 24;
        int stateX = x + panelWidth - stateWidth - 14;
        graphics.fill(stateX, y + 14, stateX + stateWidth, y + 34, 0xFF0C1110);
        graphics.renderOutline(stateX, y + 14, stateWidth, 20, 0x334A7657);
        int pulse = 160 + (int) (70 * (0.5 + 0.5 * Math.sin(now / 330.0)));
        graphics.fill(stateX + 7, y + 21, stateX + 12, y + 26,
                CoreConfig.INSTANCE.notifications() ? ((pulse << 24) | (GREEN & 0x00FFFFFF)) : DIM);
        graphics.drawString(font, state, stateX + 16, y + 20, CoreConfig.INSTANCE.notifications() ? 0xFF9AE9B2 : MUTED, false);

        int tabY = y + 66;
        for (int i = 0; i < SECTIONS.length; i++) {
            int rowX = x + 10;
            int rowY = tabY + i * 34;
            int rowW = sidebarWidth - 20;
            boolean active = i == section;
            boolean hover = inside(mouseX, mouseY, rowX, rowY, rowW, 28);
            if (active || hover) {
                graphics.fill(rowX, rowY, rowX + rowW, rowY + 28, active ? 0xFF241014 : 0xFF12151A);
                graphics.renderOutline(rowX, rowY, rowW, 28, active ? 0x443F2529 : 0x223A4049);
            }
            if (active) graphics.fill(rowX, rowY, rowX + 3, rowY + 28, accent);
            graphics.drawString(font, SECTIONS[i], x + 22, rowY + 10, active ? TEXT : hover ? 0xFFD5D8DD : MUTED, false);
            if (active) graphics.drawString(font, "•", x + sidebarWidth - 24, rowY + 10, accent, false);
        }

        graphics.fill(x + 14, y + panelHeight - 58, x + sidebarWidth - 14, y + panelHeight - 57, 0x223B414A);
        graphics.drawString(font, "OPEN KEY", x + 18, y + panelHeight - 45, DIM, false);
        graphics.drawString(font, keyName(CoreConfig.INSTANCE.openKey()), x + 18, y + panelHeight - 29, accent, false);
        graphics.drawString(font, "V1.1 READY", x + 18, y + panelHeight - 15, 0xFF4B515B, false);

        int cx = x + sidebarWidth + 18;
        int cy = y + 18;
        int cw = panelWidth - sidebarWidth - 36;
        int sectionPulseWidth = Math.min(cw, (int) (cw * Math.min(1.0F, (now - sectionChangedAt) / 180.0F)));
        graphics.fill(cx, cy + 44, cx + sectionPulseWidth, cy + 45, 0x44000000 | (accent & 0x00FFFFFF));

        switch (section) {
            case 0 -> renderHud(graphics, mouseX, mouseY, cx, cy, cw);
            case 1 -> renderClient(graphics, mouseX, mouseY, cx, cy, cw);
            case 2 -> renderVisual(graphics, mouseX, mouseY, cx, cy, cw);
            case 3 -> renderStyle(graphics, mouseX, mouseY, cx, cy, cw);
            default -> renderAbout(graphics, cx, cy, cw);
        }
        super.render(graphics, mouseX, mouseY, delta);
    }

    private void drawWindowChrome(GuiGraphics graphics, int x, int y, int panelWidth, int panelHeight, int sidebarWidth, int accent, float intro) {
        graphics.fill(x - 8, y - 8, x + panelWidth + 8, y + panelHeight + 8, 0x22000000);
        graphics.fill(x - 4, y - 4, x + panelWidth + 4, y + panelHeight + 4, 0x44000000);
        graphics.fill(x, y, x + panelWidth, y + panelHeight, BG);
        graphics.renderOutline(x, y, panelWidth, panelHeight, 0x66444A55);
        graphics.renderOutline(x + 1, y + 1, panelWidth - 2, panelHeight - 2, 0x221D2026);
        graphics.fill(x, y, x + sidebarWidth, y + panelHeight, SIDEBAR);
        graphics.fill(x + sidebarWidth, y, x + sidebarWidth + 1, y + panelHeight, 0x33383F49);
        graphics.fill(x, y, x + 3, y + panelHeight, accent);
        graphics.fill(x + 3, y, x + panelWidth, y + 1, 0x22FFFFFF);
        int sweep = x + 4 + (int) ((System.currentTimeMillis() / 11L) % Math.max(1, panelWidth - 42));
        graphics.fill(sweep, y + 1, Math.min(x + panelWidth - 2, sweep + 36), y + 2, 0x66FFFFFF);
        graphics.fill(x, y + panelHeight - 2, x + Math.max(2, (int) (panelWidth * intro)), y + panelHeight, 0x66000000 | (accent & 0x00FFFFFF));
    }

    private void sectionHeader(GuiGraphics graphics, int x, int y, String kicker, String title, String subtitle) {
        graphics.drawString(font, kicker, x, y, DIM, false);
        graphics.drawString(font, title, x, y + 14, TEXT, false);
        graphics.drawString(font, subtitle, x, y + 29, MUTED, false);
    }

    private void renderHud(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "HUD SYSTEM · " + HUD_MODULES.length + " MODULES", "LIVE TELEMETRY", "Real Minecraft and JVM data · click any card to toggle");
        int columns = 3;
        int gap = 8;
        int cardWidth = (width - gap * (columns - 1)) / columns;
        int startY = y + 57;
        for (int i = 0; i < HUD_MODULES.length; i++) {
            String name = HUD_MODULES[i];
            int cardX = x + (i % columns) * (cardWidth + gap);
            int cardY = startY + (i / columns) * 48;
            boolean hover = inside(mouseX, mouseY, cardX, cardY, cardWidth, 40);
            moduleCard(graphics, cardX, cardY, cardWidth, 40, name, DESCRIPTIONS.get(name), CoreConfig.INSTANCE.on(name), hover, CoreConfig.INSTANCE.accentColor());
            drawToggle(graphics, cardX + cardWidth - 34, cardY + 14, CoreConfig.INSTANCE.on(name), CoreConfig.INSTANCE.accentColor());
        }
        int actionY = y + 306;
        button(graphics, mouseX, mouseY, x, actionY, 106, 27, "ENABLE ALL");
        button(graphics, mouseX, mouseY, x + 114, actionY, 106, 27, "DISABLE ALL");
        button(graphics, mouseX, mouseY, x + 228, actionY, 134, 27, "OPEN HUD EDITOR");
        graphics.drawString(font, "HUD ONLY · BEHAVIOR MODULES STAY UNCHANGED", x, actionY + 39, DIM, false);
    }

    private void renderClient(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "CLIENT MODULES", "PLAY YOUR WAY", "Legitimate local helpers backed by Minecraft options and Core state");
        int accent = CoreConfig.INSTANCE.accentColor();
        int rowY = y + 58;
        for (String name : CLIENT_MODULES) {
            boolean enabled = CoreConfig.INSTANCE.on(name);
            boolean hover = inside(mouseX, mouseY, x, rowY, width, 43);
            moduleCard(graphics, x, rowY, width, 43, name, DESCRIPTIONS.get(name), enabled, hover, accent);
            drawToggle(graphics, x + width - 40, rowY + 14, enabled, accent);
            rowY += 50;
        }

        graphics.drawString(font, "KEYBINDS · CLICK A ROW THEN PRESS A KEY", x, y + 316, DIM, false);
        keyRow(graphics, mouseX, mouseY, x, y + 334, width, "OPEN", keyName(CoreConfig.INSTANCE.openKey()), "Open ClickGUI", "OPEN");
        keyRow(graphics, mouseX, mouseY, x, y + 362, width, "HUD", keyName(CoreConfig.INSTANCE.hudEditorKey()), "Open HUD editor", "HUD");
        keyRow(graphics, mouseX, mouseY, x, y + 390, width, "ZOOM", keyName(CoreConfig.INSTANCE.zoomKey()), "Hold to zoom", "ZOOM");
        keyRow(graphics, mouseX, mouseY, x, y + 418, width, "VIEW", keyName(CoreConfig.INSTANCE.perspectiveKey()), "Cycle perspective", "PERSPECTIVE");
    }

    private void renderVisual(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "VISUAL LAB", "CROSSHAIR + ZOOM", "Fine controls persisted to eternal-core.json and synced from launcher Studio");
        int accent = CoreConfig.INSTANCE.accentColor();
        int rowY = y + 62;

        card(graphics, x, rowY, width, 54, "CUSTOM CROSSHAIR", DESCRIPTIONS.get("Crosshair"), CoreConfig.INSTANCE.on("Crosshair"));
        drawToggle(graphics, x + width - 40, rowY + 20, CoreConfig.INSTANCE.on("Crosshair"), accent);
        rowY += 63;

        settingControl(graphics, mouseX, mouseY, x, rowY, width, "GAP", CoreConfig.INSTANCE.crosshairGap() + " PX", "CROSS_GAP");
        rowY += 38;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "LENGTH", CoreConfig.INSTANCE.crosshairLength() + " PX", "CROSS_LENGTH");
        rowY += 38;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "THICKNESS", CoreConfig.INSTANCE.crosshairThickness() + " PX", "CROSS_THICKNESS");
        rowY += 44;

        toggleRow(graphics, mouseX, mouseY, x, rowY, width, "CENTER DOT", "Pixel at exact screen center", CoreConfig.INSTANCE.crosshairDot(), accent);
        rowY += 39;
        toggleRow(graphics, mouseX, mouseY, x, rowY, width, "OUTLINE", "Dark edge for bright scenes", CoreConfig.INSTANCE.crosshairOutline(), accent);
        rowY += 47;

        settingControl(graphics, mouseX, mouseY, x, rowY, width, "ZOOM FOV", Integer.toString(CoreConfig.INSTANCE.zoomFov()), "ZOOM_FOV");
        rowY += 38;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "ZOOM SPEED", Integer.toString(CoreConfig.INSTANCE.zoomSpeed()), "ZOOM_SPEED");
        rowY += 42;
        toggleRow(graphics, mouseX, mouseY, x, rowY, width, "SMOOTH ZOOM", "Interpolate into and out of target FOV", CoreConfig.INSTANCE.smoothZoom(), accent);
    }

    private void renderStyle(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "VISUAL SYSTEM", "STYLE + LAYOUT", "Persistent HUD styling for launcher-managed and standalone Core");
        int accent = CoreConfig.INSTANCE.accentColor();
        int rowY = y + 62;
        graphics.drawString(font, "ACCENT PRESET", x, rowY, 0xFF969CA6, false);
        for (int i = 0; i < ACCENTS.length; i++) {
            int sx = x + i * 36;
            graphics.fill(sx, rowY + 18, sx + 26, rowY + 44, 0xFF0A0C10);
            graphics.fill(sx + 2, rowY + 20, sx + 24, rowY + 42, ACCENTS[i]);
            if ((accent & 0x00FFFFFF) == (ACCENTS[i] & 0x00FFFFFF)) graphics.renderOutline(sx - 2, rowY + 16, 30, 30, 0xFFFFFFFF);
            else graphics.renderOutline(sx, rowY + 18, 26, 26, LINE);
        }

        rowY += 68;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "HUD OPACITY", Math.round(CoreConfig.INSTANCE.hudAlpha() / 255.0F * 100.0F) + "%", "HUD_ALPHA");
        rowY += 42;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "SNAP GRID", CoreConfig.INSTANCE.snap() + " PX", "SNAP");
        rowY += 44;
        toggleRow(graphics, mouseX, mouseY, x, rowY, width, "TEXT SHADOW", "Keep HUD readable over bright terrain", CoreConfig.INSTANCE.textShadow(), accent);
        rowY += 39;
        toggleRow(graphics, mouseX, mouseY, x, rowY, width, "LIVING ACCENT", "Subtle animated highlight variation", CoreConfig.INSTANCE.gradientHud(), accent);
        rowY += 39;
        toggleRow(graphics, mouseX, mouseY, x, rowY, width, "NOTIFICATIONS", "Module and keybind feedback", CoreConfig.INSTANCE.notifications(), accent);
        rowY += 50;

        graphics.drawString(font, "HUD LAYOUT", x, rowY, 0xFF969CA6, false);
        button(graphics, mouseX, mouseY, x, rowY + 18, 82, 28, "DEFAULT");
        button(graphics, mouseX, mouseY, x + 90, rowY + 18, 82, 28, "COMPACT");
        button(graphics, mouseX, mouseY, x + 180, rowY + 18, 82, 28, "CORNERS");
        button(graphics, mouseX, mouseY, x + 270, rowY + 18, 124, 28, "HUD EDITOR");
    }

    private void renderAbout(GuiGraphics graphics, int x, int y, int width) {
        int accent = CoreConfig.INSTANCE.accentColor();
        sectionHeader(graphics, x, y, "ETERNAL CORE", "V1.1 CUSTOMIZATION", "One local config shared by Minecraft and Eternal Studio");
        graphics.drawString(font, EternalCore.VERSION, x + width - font.width(EternalCore.VERSION), y + 14, accent, false);
        int cardY = y + 61;
        graphics.fill(x, cardY, x + width, cardY + 84, SURFACE);
        graphics.renderOutline(x, cardY, width, 84, LINE_STRONG);
        graphics.fill(x, cardY, x + 3, cardY + 84, accent);
        graphics.drawString(font, "STANDALONE + LIVE-SYNC READY", x + 14, cardY + 14, TEXT, false);
        graphics.drawString(font, "Launcher Studio writes the same local config that this menu uses.", x + 14, cardY + 35, MUTED, false);
        graphics.drawString(font, "Minecraft reloads safe settings live while the game is running.", x + 14, cardY + 52, MUTED, false);
        graphics.drawString(font, "1.21.11 · FABRIC · JAVA 21", x + 14, cardY + 68, 0xFF6D7480, false);
        graphics.drawString(font, "LOCAL ONLY", x + width - 74, cardY + 14, GREEN, false);

        cardY += 101;
        infoRow(graphics, x, cardY, width, "CONFIG", "config/eternal-core.json · atomic saves + launcher sync");
        infoRow(graphics, x, cardY + 37, width, "PROFILES", "Launcher Studio can snapshot and apply real Core setups");
        infoRow(graphics, x, cardY + 74, width, "HUD", "Drag, snap, nudge, presets and per-module visibility");
        infoRow(graphics, x, cardY + 111, width, "PRIVACY", "No cloud account or launcher process required at runtime");
        graphics.drawString(font, "ETERNAL CLIENT · ORIGINAL UI · REAL CONFIGURATION", x, y + 326, DIM, false);
    }

    private void moduleCard(GuiGraphics graphics, int x, int y, int width, int height, String title, String body, boolean enabled, boolean hover, int accent) {
        graphics.fill(x, y, x + width, y + height, hover ? SURFACE_HOVER : SURFACE);
        graphics.renderOutline(x, y, width, height, enabled ? 0x553E292D : LINE);
        if (enabled) graphics.fill(x, y, x + 2, y + height, accent);
        graphics.drawString(font, title.toUpperCase(), x + 9, y + 8, enabled ? TEXT : 0xFF858B96, false);
        graphics.drawString(font, body, x + 9, y + 24, hover ? 0xFF777D88 : 0xFF616772, false);
    }

    private void card(GuiGraphics graphics, int x, int y, int width, int height, String title, String body, boolean enabled) {
        int accent = CoreConfig.INSTANCE.accentColor();
        graphics.fill(x, y, x + width, y + height, SURFACE);
        graphics.renderOutline(x, y, width, height, enabled ? 0x553E292D : LINE);
        if (enabled) graphics.fill(x, y, x + 2, y + height, accent);
        graphics.drawString(font, title, x + 12, y + 12, enabled ? TEXT : MUTED, false);
        graphics.drawString(font, body, x + 12, y + 31, 0xFF676D78, false);
    }

    private void settingControl(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, String label, String value, String id) {
        graphics.fill(x, y, x + width, y + 31, SURFACE);
        graphics.renderOutline(x, y, width, 31, LINE);
        graphics.drawString(font, label, x + 10, y + 11, 0xFF9298A2, false);
        graphics.drawString(font, value, x + width - 104, y + 11, TEXT, false);
        button(graphics, mouseX, mouseY, x + width - 59, y + 4, 23, 23, "-");
        button(graphics, mouseX, mouseY, x + width - 30, y + 4, 23, 23, "+");
    }

    private void toggleRow(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, String title, String body, boolean value, int accent) {
        boolean hover = inside(mouseX, mouseY, x, y, width, 33);
        graphics.fill(x, y, x + width, y + 33, hover ? SURFACE_HOVER : SURFACE);
        graphics.renderOutline(x, y, width, 33, LINE);
        graphics.drawString(font, title, x + 10, y + 7, value ? TEXT : 0xFF858B96, false);
        graphics.drawString(font, body, x + 112, y + 12, MUTED, false);
        drawToggle(graphics, x + width - 39, y + 9, value, accent);
    }

    private void keyRow(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, String id, String key, String action, String target) {
        boolean hover = inside(mouseX, mouseY, x, y, width, 25);
        boolean listening = target.equals(bindingTarget);
        graphics.fill(x, y, x + width, y + 25, listening ? 0xFF2A1014 : hover ? SURFACE_HOVER : SURFACE);
        graphics.renderOutline(x, y, width, 25, listening ? CoreConfig.INSTANCE.accentColor() : hover ? LINE_STRONG : LINE);
        if (listening) graphics.fill(x, y, x + 2, y + 25, CoreConfig.INSTANCE.accentColor());
        graphics.drawString(font, id, x + 9, y + 9, 0xFF747A85, false);
        graphics.drawString(font, listening ? "PRESS A KEY" : key, x + 66, y + 9, listening ? CoreConfig.INSTANCE.accentColor() : TEXT, false);
        graphics.drawString(font, action, x + 172, y + 9, MUTED, false);
    }

    private void drawToggle(GuiGraphics graphics, int x, int y, boolean enabled, int accent) {
        graphics.fill(x - 1, y - 1, x + 29, y + 15, 0x22000000);
        graphics.fill(x, y, x + 28, y + 14, enabled ? (0xFF000000 | (accent & 0x00FFFFFF)) : 0xFF292D34);
        graphics.renderOutline(x, y, 28, 14, enabled ? 0x66FFFFFF : 0x33464C56);
        graphics.fill(enabled ? x + 17 : x + 2, y + 2, enabled ? x + 26 : x + 11, y + 12, 0xFFFFFFFF);
    }

    private void infoRow(GuiGraphics graphics, int x, int y, int width, String title, String text) {
        graphics.fill(x, y, x + width, y + 29, SURFACE);
        graphics.renderOutline(x, y, width, 29, 0x223B414A);
        graphics.drawString(font, title, x + 10, y + 10, 0xFFDADDE2, false);
        graphics.drawString(font, text, x + 142, y + 10, 0xFF6F7580, false);
    }

    private void button(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, int height, String label) {
        boolean hover = inside(mouseX, mouseY, x, y, width, height);
        graphics.fill(x, y, x + width, y + height, hover ? 0xFF20242A : 0xFF15181D);
        graphics.renderOutline(x, y, width, height, hover ? LINE_STRONG : LINE);
        if (hover) graphics.fill(x, y, x + width, y + 1, 0x33FFFFFF);
        graphics.drawCenteredString(font, label, x + width / 2, y + (height - 8) / 2, hover ? TEXT : 0xFFD4D7DC);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        int panelWidth = Math.min(820, width - 18);
        int panelHeight = Math.min(468, height - 18);
        int x = (width - panelWidth) / 2;
        int y = (height - panelHeight) / 2;
        int sidebarWidth = 138;
        int mouseX = (int) event.x();
        int mouseY = (int) event.y();

        int tabY = y + 66;
        for (int i = 0; i < SECTIONS.length; i++) {
            if (inside(mouseX, mouseY, x + 10, tabY + i * 34, sidebarWidth - 20, 28)) {
                section = i;
                sectionChangedAt = System.currentTimeMillis();
                bindingTarget = null;
                return true;
            }
        }

        int cx = x + sidebarWidth + 18;
        int cy = y + 18;
        int cw = panelWidth - sidebarWidth - 36;

        if (section == 0) return clickHud(mouseX, mouseY, cx, cy, cw) || super.mouseClicked(event, doubleClick);
        if (section == 1) return clickClient(mouseX, mouseY, cx, cy, cw) || super.mouseClicked(event, doubleClick);
        if (section == 2) return clickVisual(mouseX, mouseY, cx, cy, cw) || super.mouseClicked(event, doubleClick);
        if (section == 3) return clickStyle(mouseX, mouseY, cx, cy, cw) || super.mouseClicked(event, doubleClick);
        return super.mouseClicked(event, doubleClick);
    }

    private boolean clickHud(int mouseX, int mouseY, int x, int y, int width) {
        int columns = 3;
        int gap = 8;
        int cardWidth = (width - gap * (columns - 1)) / columns;
        int startY = y + 57;
        for (int i = 0; i < HUD_MODULES.length; i++) {
            int cardX = x + (i % columns) * (cardWidth + gap);
            int cardY = startY + (i / columns) * 48;
            if (inside(mouseX, mouseY, cardX, cardY, cardWidth, 40)) {
                String name = HUD_MODULES[i];
                CoreConfig.INSTANCE.toggle(name);
                notifyToggle(name);
                return true;
            }
        }
        int actionY = y + 306;
        if (inside(mouseX, mouseY, x, actionY, 106, 27)) {
            CoreConfig.INSTANCE.setAllModules(true);
            NotificationCenter.push("HUD", "All HUD modules enabled");
            return true;
        }
        if (inside(mouseX, mouseY, x + 114, actionY, 106, 27)) {
            CoreConfig.INSTANCE.setAllModules(false);
            NotificationCenter.push("HUD", "All HUD modules disabled");
            return true;
        }
        if (inside(mouseX, mouseY, x + 228, actionY, 134, 27)) {
            Minecraft.getInstance().setScreen(new HudEditorScreen());
            return true;
        }
        return false;
    }

    private boolean clickClient(int mouseX, int mouseY, int x, int y, int width) {
        int rowY = y + 58;
        for (String name : CLIENT_MODULES) {
            if (inside(mouseX, mouseY, x, rowY, width, 43)) {
                CoreConfig.INSTANCE.toggle(name);
                notifyToggle(name);
                return true;
            }
            rowY += 50;
        }
        if (inside(mouseX, mouseY, x, y + 334, width, 25)) { bindingTarget = "OPEN"; return true; }
        if (inside(mouseX, mouseY, x, y + 362, width, 25)) { bindingTarget = "HUD"; return true; }
        if (inside(mouseX, mouseY, x, y + 390, width, 25)) { bindingTarget = "ZOOM"; return true; }
        if (inside(mouseX, mouseY, x, y + 418, width, 25)) { bindingTarget = "PERSPECTIVE"; return true; }
        return false;
    }

    private boolean clickVisual(int mouseX, int mouseY, int x, int y, int width) {
        CoreConfig config = CoreConfig.INSTANCE;
        int rowY = y + 62;
        if (inside(mouseX, mouseY, x, rowY, width, 54)) { config.toggle("Crosshair"); notifyToggle("Crosshair"); return true; }
        rowY += 63;
        if (minus(mouseX, mouseY, x, rowY, width)) { config.setCrosshairGap(config.crosshairGap() - 1); return true; }
        if (plus(mouseX, mouseY, x, rowY, width)) { config.setCrosshairGap(config.crosshairGap() + 1); return true; }
        rowY += 38;
        if (minus(mouseX, mouseY, x, rowY, width)) { config.setCrosshairLength(config.crosshairLength() - 1); return true; }
        if (plus(mouseX, mouseY, x, rowY, width)) { config.setCrosshairLength(config.crosshairLength() + 1); return true; }
        rowY += 38;
        if (minus(mouseX, mouseY, x, rowY, width)) { config.setCrosshairThickness(config.crosshairThickness() - 1); return true; }
        if (plus(mouseX, mouseY, x, rowY, width)) { config.setCrosshairThickness(config.crosshairThickness() + 1); return true; }
        rowY += 44;
        if (inside(mouseX, mouseY, x, rowY, width, 33)) { config.setCrosshairDot(!config.crosshairDot()); return true; }
        rowY += 39;
        if (inside(mouseX, mouseY, x, rowY, width, 33)) { config.setCrosshairOutline(!config.crosshairOutline()); return true; }
        rowY += 47;
        if (minus(mouseX, mouseY, x, rowY, width)) { config.setZoomFov(config.zoomFov() - 5); return true; }
        if (plus(mouseX, mouseY, x, rowY, width)) { config.setZoomFov(config.zoomFov() + 5); return true; }
        rowY += 38;
        if (minus(mouseX, mouseY, x, rowY, width)) { config.setZoomSpeed(config.zoomSpeed() - 1); return true; }
        if (plus(mouseX, mouseY, x, rowY, width)) { config.setZoomSpeed(config.zoomSpeed() + 1); return true; }
        rowY += 42;
        if (inside(mouseX, mouseY, x, rowY, width, 33)) { config.setSmoothZoom(!config.smoothZoom()); return true; }
        return false;
    }

    private boolean clickStyle(int mouseX, int mouseY, int x, int y, int width) {
        CoreConfig config = CoreConfig.INSTANCE;
        int rowY = y + 62;
        for (int i = 0; i < ACCENTS.length; i++) {
            int sx = x + i * 36;
            if (inside(mouseX, mouseY, sx, rowY + 18, 26, 26)) { config.setAccentColor(ACCENTS[i]); return true; }
        }
        rowY += 68;
        if (minus(mouseX, mouseY, x, rowY, width)) { config.setHudAlpha(config.hudAlpha() - 16); return true; }
        if (plus(mouseX, mouseY, x, rowY, width)) { config.setHudAlpha(config.hudAlpha() + 16); return true; }
        rowY += 42;
        if (minus(mouseX, mouseY, x, rowY, width) || plus(mouseX, mouseY, x, rowY, width)) {
            int snap = config.snap();
            config.setSnap(snap == 2 ? 4 : snap == 4 ? 8 : 2);
            return true;
        }
        rowY += 44;
        if (inside(mouseX, mouseY, x, rowY, width, 33)) { config.setTextShadow(!config.textShadow()); return true; }
        rowY += 39;
        if (inside(mouseX, mouseY, x, rowY, width, 33)) { config.setGradientHud(!config.gradientHud()); return true; }
        rowY += 39;
        if (inside(mouseX, mouseY, x, rowY, width, 33)) {
            config.setNotifications(!config.notifications());
            if (config.notifications()) NotificationCenter.push("NOTIFICATIONS", "Enabled");
            return true;
        }
        rowY += 50;
        if (inside(mouseX, mouseY, x, rowY + 18, 82, 28)) { config.applyPreset("DEFAULT", this.width, this.height); NotificationCenter.push("HUD PRESET", "Default layout applied"); return true; }
        if (inside(mouseX, mouseY, x + 90, rowY + 18, 82, 28)) { config.applyPreset("COMPACT", this.width, this.height); NotificationCenter.push("HUD PRESET", "Compact layout applied"); return true; }
        if (inside(mouseX, mouseY, x + 180, rowY + 18, 82, 28)) { config.applyPreset("CORNERS", this.width, this.height); NotificationCenter.push("HUD PRESET", "Corners layout applied"); return true; }
        if (inside(mouseX, mouseY, x + 270, rowY + 18, 124, 28)) { Minecraft.getInstance().setScreen(new HudEditorScreen()); return true; }
        return false;
    }

    private static boolean minus(int mouseX, int mouseY, int x, int y, int width) {
        return inside(mouseX, mouseY, x + width - 59, y + 4, 23, 23);
    }
    private static boolean plus(int mouseX, int mouseY, int x, int y, int width) {
        return inside(mouseX, mouseY, x + width - 30, y + 4, 23, 23);
    }

    private void notifyToggle(String name) {
        NotificationCenter.push(name.toUpperCase(), CoreConfig.INSTANCE.on(name) ? "Enabled" : "Disabled");
    }

    @Override
    public boolean keyPressed(KeyEvent event) {
        if (bindingTarget != null) {
            int key = event.key();
            if (key == 256) {
                bindingTarget = null;
                NotificationCenter.push("KEYBIND", "Rebind canceled");
                return true;
            }
            if (key < 32 || key > 348) return true;
            if (keyInUseByOther(bindingTarget, key)) {
                NotificationCenter.push("KEYBIND", keyName(key) + " is already used by Eternal Core");
                return true;
            }
            switch (bindingTarget) {
                case "OPEN" -> CoreConfig.INSTANCE.setOpenKey(key);
                case "HUD" -> CoreConfig.INSTANCE.setHudEditorKey(key);
                case "ZOOM" -> CoreConfig.INSTANCE.setZoomKey(key);
                case "PERSPECTIVE" -> CoreConfig.INSTANCE.setPerspectiveKey(key);
            }
            NotificationCenter.push("KEYBIND", bindingTarget + " = " + keyName(key));
            bindingTarget = null;
            return true;
        }
        return super.keyPressed(event);
    }

    private boolean keyInUseByOther(String target, int key) {
        CoreConfig config = CoreConfig.INSTANCE;
        return (!"OPEN".equals(target) && config.openKey() == key)
                || (!"HUD".equals(target) && config.hudEditorKey() == key)
                || (!"ZOOM".equals(target) && config.zoomKey() == key)
                || (!"PERSPECTIVE".equals(target) && config.perspectiveKey() == key);
    }

    public static String keyName(int key) {
        if (key >= 65 && key <= 90) return Character.toString((char) key);
        if (key >= 48 && key <= 57) return Character.toString((char) key);
        return switch (key) {
            case 32 -> "SPACE";
            case 256 -> "ESC";
            case 257 -> "ENTER";
            case 258 -> "TAB";
            case 259 -> "BACKSPACE";
            case 260 -> "INSERT";
            case 261 -> "DELETE";
            case 262 -> "RIGHT";
            case 263 -> "LEFT";
            case 264 -> "DOWN";
            case 265 -> "UP";
            case 340 -> "LSHIFT";
            case 341 -> "LCTRL";
            case 342 -> "LALT";
            case 344 -> "RSHIFT";
            case 345 -> "RCTRL";
            case 346 -> "RALT";
            default -> "KEY " + key;
        };
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int width, int height) {
        return mouseX >= x && mouseX < x + width && mouseY >= y && mouseY < y + height;
    }

    @Override
    public boolean isPauseScreen() { return false; }
}
