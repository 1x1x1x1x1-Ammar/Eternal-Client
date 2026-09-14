package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.util.CoreLog;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.input.KeyEvent;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

import java.util.LinkedHashMap;
import java.util.Map;

public final class ClickGuiScreen extends Screen {
    private static final String[] SECTIONS = {"HUD", "UTILITY", "STYLE", "ABOUT"};
    private static final String[] HUD_MODULES = {
            "Watermark", "FPS", "CPS", "Keystrokes", "Coordinates", "Ping",
            "Speed", "Direction", "Health", "Armor", "Food", "Server",
            "Memory", "Session", "Clock"
    };
    private static final int[] ACCENTS = {
            0xFFFF3038, 0xFFFF6B35, 0xFF8B5CF6, 0xFF3B82F6, 0xFF22C55E
    };
    private static final Map<String, String> DESCRIPTIONS = new LinkedHashMap<>();

    private static final int BG = 0xF907090C;
    private static final int SIDEBAR = 0xFA0A0C10;
    private static final int SURFACE = 0xFF111419;
    private static final int SURFACE_HOVER = 0xFF181C22;
    private static final int LINE = 0x33414852;
    private static final int LINE_STRONG = 0x66525A66;
    private static final int TEXT = 0xFFF7F8FA;
    private static final int MUTED = 0xFF7C828D;
    private static final int DIM = 0xFF555B66;
    private static final int GREEN = 0xFF58ED89;

    static {
        DESCRIPTIONS.put("Watermark", "Eternal identity");
        DESCRIPTIONS.put("FPS", "Live frame rate");
        DESCRIPTIONS.put("CPS", "Mouse clicks/sec");
        DESCRIPTIONS.put("Keystrokes", "WASD + mouse input");
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
        DESCRIPTIONS.put("Zoom", "Hold your configured zoom key for FOV zoom");
    }

    private int section;
    private String bindingTarget;
    private final long openedAt = System.currentTimeMillis();
    private long sectionChangedAt = openedAt;
    private boolean recovering;

    public ClickGuiScreen() {
        super(Component.literal("Eternal Core Modules"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        try {
            renderSafe(graphics, mouseX, mouseY, delta);
        } catch (Throwable error) {
            recover("render", error);
        }
    }

    private void renderSafe(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        renderBackground(graphics, mouseX, mouseY, delta);

        int panelWidth = Math.max(420, Math.min(820, width - 24));
        int panelHeight = Math.max(350, Math.min(470, height - 24));
        int x = (width - panelWidth) / 2;
        int y = (height - panelHeight) / 2;
        int sidebarWidth = panelWidth < 620 ? 112 : 142;
        int accent = CoreConfig.INSTANCE.accentColor();
        long now = System.currentTimeMillis();
        float intro = Math.min(1.0F, (now - openedAt) / 230.0F);

        drawWindowChrome(graphics, x, y, panelWidth, panelHeight, sidebarWidth, accent, intro);

        graphics.drawString(font, "ETERNAL", x + 18, y + 17, TEXT, false);
        graphics.drawString(font, "CORE", x + 18 + font.width("ETERNAL") + 5, y + 17, accent, false);
        graphics.drawString(font, "MODULE CENTER · " + EternalCore.VERSION, x + 18, y + 33, DIM, false);

        String state = enabledHudCount() + "/" + HUD_MODULES.length + " HUD LIVE";
        int stateWidth = font.width(state) + 28;
        int stateX = x + panelWidth - stateWidth - 14;
        graphics.fill(stateX, y + 14, stateX + stateWidth, y + 35, 0xFF0B1110);
        graphics.renderOutline(stateX, y + 14, stateWidth, 21, 0x334A7657);
        int pulse = 160 + (int) (70 * (0.5 + 0.5 * Math.sin(now / 330.0)));
        graphics.fill(stateX + 8, y + 22, stateX + 13, y + 27, enabledHudCount() > 0 ? ((pulse << 24) | (GREEN & 0x00FFFFFF)) : DIM);
        graphics.drawString(font, state, stateX + 19, y + 21, enabledHudCount() > 0 ? 0xFF9AE9B2 : MUTED, false);

        int tabY = y + 67;
        for (int i = 0; i < SECTIONS.length; i++) {
            boolean active = i == section;
            boolean hover = inside(mouseX, mouseY, x + 10, tabY + i * 35, sidebarWidth - 20, 29);
            int rowX = x + 10;
            int rowY = tabY + i * 35;
            int rowW = sidebarWidth - 20;
            if (active || hover) {
                graphics.fill(rowX, rowY, rowX + rowW, rowY + 29, active ? 0xFF241014 : 0xFF12151A);
                graphics.renderOutline(rowX, rowY, rowW, 29, active ? 0x554F2A2F : 0x223A4049);
            }
            if (active) graphics.fill(rowX, rowY, rowX + 3, rowY + 29, accent);
            graphics.drawString(font, SECTIONS[i], x + 22, rowY + 10, active ? TEXT : hover ? 0xFFD5D8DD : MUTED, false);
            if (active) graphics.drawString(font, "•", x + sidebarWidth - 24, rowY + 10, accent, false);
        }

        int homeY = y + panelHeight - 88;
        boolean homeHover = inside(mouseX, mouseY, x + 10, homeY, sidebarWidth - 20, 30);
        graphics.fill(x + 10, homeY, x + sidebarWidth - 10, homeY + 30, homeHover ? 0xFF171A20 : 0xFF0F1216);
        graphics.renderOutline(x + 10, homeY, sidebarWidth - 20, 30, homeHover ? LINE_STRONG : LINE);
        graphics.drawString(font, "ETERNAL START", x + 20, homeY + 11, homeHover ? TEXT : MUTED, false);

        graphics.fill(x + 14, y + panelHeight - 45, x + sidebarWidth - 14, y + panelHeight - 44, 0x223B414A);
        graphics.drawString(font, "OPEN KEY", x + 18, y + panelHeight - 34, DIM, false);
        graphics.drawString(font, keyName(CoreConfig.INSTANCE.openKey()), x + 18, y + panelHeight - 20, accent, false);

        int cx = x + sidebarWidth + 18;
        int cy = y + 18;
        int cw = panelWidth - sidebarWidth - 36;
        int sectionPulseWidth = Math.min(cw, (int) (cw * Math.min(1.0F, (now - sectionChangedAt) / 190.0F)));
        graphics.fill(cx, cy + 45, cx + sectionPulseWidth, cy + 46, 0x44000000 | (accent & 0x00FFFFFF));

        switch (section) {
            case 0 -> renderHud(graphics, mouseX, mouseY, cx, cy, cw);
            case 1 -> renderUtility(graphics, mouseX, mouseY, cx, cy, cw);
            case 2 -> renderStyle(graphics, mouseX, mouseY, cx, cy, cw);
            default -> renderAbout(graphics, cx, cy, cw);
        }
    }

    private void drawWindowChrome(GuiGraphics graphics, int x, int y, int panelWidth, int panelHeight, int sidebarWidth, int accent, float intro) {
        graphics.fill(x - 9, y - 9, x + panelWidth + 9, y + panelHeight + 9, 0x18000000);
        graphics.fill(x - 4, y - 4, x + panelWidth + 4, y + panelHeight + 4, 0x4A000000);
        graphics.fill(x, y, x + panelWidth, y + panelHeight, BG);
        graphics.renderOutline(x, y, panelWidth, panelHeight, 0x66505A66);
        graphics.renderOutline(x + 1, y + 1, panelWidth - 2, panelHeight - 2, 0x221D2026);
        graphics.fill(x, y, x + sidebarWidth, y + panelHeight, SIDEBAR);
        graphics.fill(x + sidebarWidth, y, x + sidebarWidth + 1, y + panelHeight, 0x33383F49);
        graphics.fill(x, y, x + 3, y + panelHeight, accent);
        graphics.fill(x + 3, y, x + panelWidth, y + 1, 0x22FFFFFF);

        int sweep = x + 4 + (int) ((System.currentTimeMillis() / 11L) % Math.max(1, panelWidth - 54));
        graphics.fill(sweep, y + 1, Math.min(x + panelWidth - 2, sweep + 42), y + 2, 0x66FFFFFF);
        graphics.fill(x + 3, y + 1, x + 28, y + panelHeight - 1, 0x10000000 | (accent & 0x00FFFFFF));
        graphics.fill(x, y + panelHeight - 2, x + Math.max(2, (int) (panelWidth * intro)), y + panelHeight, 0x66000000 | (accent & 0x00FFFFFF));
    }

    private void sectionHeader(GuiGraphics graphics, int x, int y, String kicker, String title, String subtitle) {
        graphics.drawString(font, kicker, x, y, DIM, false);
        graphics.drawString(font, title, x, y + 15, TEXT, false);
        graphics.drawString(font, subtitle, x, y + 31, MUTED, false);
    }

    private void renderHud(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int contentWidth) {
        sectionHeader(graphics, x, y, "HUD SYSTEM · CLEAN BY DEFAULT", "MODULES", "Enable only what you want, then open Edit Layout to drag it in-game");

        int columns = 3;
        int gap = 8;
        int cardWidth = Math.max(88, (contentWidth - gap * (columns - 1)) / columns);
        int startY = y + 60;
        for (int i = 0; i < HUD_MODULES.length; i++) {
            String name = HUD_MODULES[i];
            int cardX = x + (i % columns) * (cardWidth + gap);
            int cardY = startY + (i / columns) * 45;
            boolean hover = inside(mouseX, mouseY, cardX, cardY, cardWidth, 38);
            boolean enabled = CoreConfig.INSTANCE.on(name);
            moduleCard(graphics, cardX, cardY, cardWidth, 38, name, DESCRIPTIONS.getOrDefault(name, "Eternal module"), enabled, hover, CoreConfig.INSTANCE.accentColor());
        }

        int actionY = startY + 5 * 45 + 4;
        button(graphics, mouseX, mouseY, x, actionY, 92, 28, "ENABLE ALL", false);
        button(graphics, mouseX, mouseY, x + 100, actionY, 92, 28, "DISABLE ALL", false);
        button(graphics, mouseX, mouseY, x + 200, actionY, 112, 28, "EDIT LAYOUT", true);
        graphics.drawString(font, enabledHudCount() + " active · changes save instantly", x + 324, actionY + 10, DIM, false);
    }

    private void moduleCard(GuiGraphics graphics, int x, int y, int width, int height, String title, String body, boolean enabled, boolean hover, int accent) {
        graphics.fill(x - 2, y - 2, x + width + 2, y + height + 2, 0x16000000);
        graphics.fill(x, y, x + width, y + height, hover ? SURFACE_HOVER : SURFACE);
        graphics.renderOutline(x, y, width, height, enabled ? 0x66462A2E : hover ? LINE_STRONG : LINE);
        if (enabled) {
            graphics.fill(x, y, x + 2, y + height, accent);
            graphics.fill(x + 2, y, x + Math.min(width, 64), y + 1, 0x2AFFFFFF);
        }
        graphics.drawString(font, title.toUpperCase(), x + 9, y + 7, enabled ? TEXT : 0xFF878D97, false);
        String state = enabled ? "ON" : "OFF";
        graphics.drawString(font, state, x + width - font.width(state) - 8, y + 7, enabled ? GREEN : DIM, false);
        graphics.drawString(font, body, x + 9, y + 22, hover ? 0xFF858B95 : 0xFF626873, false);
    }

    private void renderUtility(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "UTILITY SYSTEM", "CONTROL CENTER", "Real helpers, persistent keybinds and crash-safe screen transitions");

        int accent = CoreConfig.INSTANCE.accentColor();
        int rowY = y + 61;
        card(graphics, x, rowY, width, 60, "ZOOM", DESCRIPTIONS.get("Zoom"), CoreConfig.INSTANCE.on("Zoom"));
        graphics.drawString(font, "FOV", x + width - 143, rowY + 13, DIM, false);
        graphics.drawString(font, Integer.toString(CoreConfig.INSTANCE.zoomFov()), x + width - 143, rowY + 30, TEXT, false);
        button(graphics, mouseX, mouseY, x + width - 62, rowY + 13, 22, 24, "-", false);
        button(graphics, mouseX, mouseY, x + width - 34, rowY + 13, 22, 24, "+", false);
        drawToggle(graphics, x + width - 143, rowY + 44, CoreConfig.INSTANCE.on("Zoom"), accent);

        rowY += 72;
        card(graphics, x, rowY, width, 60, "NOTIFICATIONS", "Animated module, keybind and diagnostic feedback", CoreConfig.INSTANCE.notifications());
        graphics.drawString(font, CoreConfig.INSTANCE.notifications() ? "LIVE" : "MUTED", x + width - 84, rowY + 25, CoreConfig.INSTANCE.notifications() ? GREEN : DIM, false);
        drawToggle(graphics, x + width - 45, rowY + 24, CoreConfig.INSTANCE.notifications(), accent);

        rowY += 80;
        graphics.drawString(font, "KEYBINDS", x, rowY, 0xFF969CA6, false);
        graphics.drawString(font, "CLICK A ROW · PRESS A KEY · DUPLICATES BLOCKED", x + 74, rowY, DIM, false);
        keyRow(graphics, mouseX, mouseY, x, rowY + 20, width, "START", keyName(CoreConfig.INSTANCE.openKey()), "Open Eternal Start", "OPEN");
        keyRow(graphics, mouseX, mouseY, x, rowY + 53, width, "HUD", keyName(CoreConfig.INSTANCE.hudEditorKey()), "Open HUD editor", "HUD");
        keyRow(graphics, mouseX, mouseY, x, rowY + 86, width, "ZOOM", keyName(CoreConfig.INSTANCE.zoomKey()), "Hold to zoom", "ZOOM");
    }

    private void renderStyle(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "VISUAL SYSTEM", "STYLE + LAYOUT", "Persistent visual controls shared by launcher-managed and standalone Core");

        int rowY = y + 64;
        graphics.drawString(font, "ACCENT PRESET", x, rowY, 0xFF969CA6, false);
        for (int i = 0; i < ACCENTS.length; i++) {
            int sx = x + i * 38;
            graphics.fill(sx, rowY + 18, sx + 28, rowY + 46, 0xFF0A0C10);
            graphics.fill(sx + 3, rowY + 21, sx + 25, rowY + 43, ACCENTS[i]);
            if ((CoreConfig.INSTANCE.accentColor() & 0x00FFFFFF) == (ACCENTS[i] & 0x00FFFFFF)) graphics.renderOutline(sx - 2, rowY + 16, 32, 32, 0xFFFFFFFF);
            else graphics.renderOutline(sx, rowY + 18, 28, 28, LINE);
        }

        rowY += 72;
        styleRow(graphics, x, rowY, width, "HUD OPACITY", Math.round(CoreConfig.INSTANCE.hudAlpha() / 255.0F * 100.0F) + "%");
        button(graphics, mouseX, mouseY, x + 154, rowY - 7, 28, 24, "-", false);
        button(graphics, mouseX, mouseY, x + 188, rowY - 7, 28, 24, "+", false);

        rowY += 47;
        styleRow(graphics, x, rowY, width, "SNAP GRID", CoreConfig.INSTANCE.snap() + " PX");
        button(graphics, mouseX, mouseY, x + 154, rowY - 7, 64, 24, "CYCLE", false);

        rowY += 50;
        graphics.drawString(font, "HUD LAYOUT PRESETS", x, rowY, 0xFF969CA6, false);
        button(graphics, mouseX, mouseY, x, rowY + 19, 84, 28, "DEFAULT", false);
        button(graphics, mouseX, mouseY, x + 92, rowY + 19, 84, 28, "COMPACT", false);
        button(graphics, mouseX, mouseY, x + 184, rowY + 19, 84, 28, "CORNERS", false);

        rowY += 69;
        button(graphics, mouseX, mouseY, x, rowY, Math.min(width, 292), 34, "OPEN HUD EDITOR  ·  " + keyName(CoreConfig.INSTANCE.hudEditorKey()), true);
    }

    private void renderAbout(GuiGraphics graphics, int x, int y, int width) {
        int accent = CoreConfig.INSTANCE.accentColor();
        sectionHeader(graphics, x, y, "ETERNAL CORE", "PREMIUM IN-GAME CLIENT", "Standalone-capable Fabric client with real persistent modules");
        graphics.drawString(font, EternalCore.VERSION, x + width - font.width(EternalCore.VERSION), y + 15, accent, false);

        int cardY = y + 64;
        graphics.fill(x, cardY, x + width, cardY + 82, SURFACE);
        graphics.renderOutline(x, cardY, width, 82, LINE_STRONG);
        graphics.fill(x, cardY, x + 3, cardY + 82, accent);
        graphics.drawString(font, "STANDALONE + LAUNCHER-MANAGED", x + 14, cardY + 15, TEXT, false);
        graphics.drawString(font, "The same verified Core JAR works with or without the Eternal launcher.", x + 14, cardY + 36, MUTED, false);
        graphics.drawString(font, "Minecraft 1.21.11 · Fabric · Java 21+", x + 14, cardY + 55, 0xFF6D7480, false);
        graphics.drawString(font, "CRASH LOG", x + width - 96, cardY + 15, GREEN, false);
        graphics.drawString(font, "config/eternal-core.log", x + width - 142, cardY + 33, DIM, false);

        cardY += 98;
        graphics.drawString(font, "RUNTIME MODEL", x, cardY, 0xFF969CA6, false);
        infoRow(graphics, x, cardY + 22, width, "MODULES", "Disabled on clean install until you choose what should render");
        infoRow(graphics, x, cardY + 58, width, "HUD EDITOR", "Drag, snap, nudge, preview and disable real module widgets");
        infoRow(graphics, x, cardY + 94, width, "SAFETY", "Screen failures are logged and recovered back to Eternal Start");

        graphics.drawString(font, "NO FAKE DATA · NO REQUIRED LAUNCHER PROCESS IN-GAME", x, y + 317, DIM, false);
    }

    private void styleRow(GuiGraphics graphics, int x, int y, int width, String label, String value) {
        int rowWidth = Math.min(width, 238);
        graphics.fill(x, y - 10, x + rowWidth, y + 20, 0xFF0D1014);
        graphics.renderOutline(x, y - 10, rowWidth, 30, LINE);
        graphics.drawString(font, label, x + 10, y, 0xFF9298A2, false);
        graphics.drawString(font, value, x + 108, y, TEXT, false);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        try {
            return mouseClickedSafe(event, doubleClick);
        } catch (Throwable error) {
            recover("mouse input", error);
            return true;
        }
    }

    private boolean mouseClickedSafe(MouseButtonEvent event, boolean doubleClick) {
        int panelWidth = Math.max(420, Math.min(820, width - 24));
        int panelHeight = Math.max(350, Math.min(470, height - 24));
        int x = (width - panelWidth) / 2;
        int y = (height - panelHeight) / 2;
        int sidebarWidth = panelWidth < 620 ? 112 : 142;
        int mouseX = (int) event.x();
        int mouseY = (int) event.y();

        int tabY = y + 67;
        for (int i = 0; i < SECTIONS.length; i++) {
            if (inside(mouseX, mouseY, x + 10, tabY + i * 35, sidebarWidth - 20, 29)) {
                section = i;
                sectionChangedAt = System.currentTimeMillis();
                bindingTarget = null;
                return true;
            }
        }

        int homeY = y + panelHeight - 88;
        if (inside(mouseX, mouseY, x + 10, homeY, sidebarWidth - 20, 30)) {
            EternalCore.openHome();
            return true;
        }

        int cx = x + sidebarWidth + 18;
        int cy = y + 18;
        int cw = panelWidth - sidebarWidth - 36;

        if (section == 0) {
            int columns = 3;
            int gap = 8;
            int cardWidth = Math.max(88, (cw - gap * (columns - 1)) / columns);
            int startY = cy + 60;
            for (int i = 0; i < HUD_MODULES.length; i++) {
                int cardX = cx + (i % columns) * (cardWidth + gap);
                int cardY = startY + (i / columns) * 45;
                if (inside(mouseX, mouseY, cardX, cardY, cardWidth, 38)) {
                    String name = HUD_MODULES[i];
                    CoreConfig.INSTANCE.toggle(name);
                    NotificationCenter.push(name.toUpperCase(), CoreConfig.INSTANCE.on(name) ? "Enabled" : "Disabled");
                    return true;
                }
            }
            int actionY = startY + 5 * 45 + 4;
            if (inside(mouseX, mouseY, cx, actionY, 92, 28)) {
                CoreConfig.INSTANCE.setAllModules(true);
                NotificationCenter.push("HUD", "All HUD modules enabled");
                return true;
            }
            if (inside(mouseX, mouseY, cx + 100, actionY, 92, 28)) {
                CoreConfig.INSTANCE.setAllModules(false);
                NotificationCenter.push("HUD", "All HUD modules disabled");
                return true;
            }
            if (inside(mouseX, mouseY, cx + 200, actionY, 112, 28)) {
                EternalCore.openHudEditor();
                return true;
            }
        } else if (section == 1) {
            int rowY = cy + 61;
            if (inside(mouseX, mouseY, cx, rowY, cw, 60) && mouseX < cx + cw - 145) {
                CoreConfig.INSTANCE.toggle("Zoom");
                NotificationCenter.push("ZOOM", CoreConfig.INSTANCE.on("Zoom") ? "Enabled · hold " + keyName(CoreConfig.INSTANCE.zoomKey()) : "Disabled");
                return true;
            }
            if (inside(mouseX, mouseY, cx + cw - 62, rowY + 13, 22, 24)) { CoreConfig.INSTANCE.setZoomFov(CoreConfig.INSTANCE.zoomFov() - 5); return true; }
            if (inside(mouseX, mouseY, cx + cw - 34, rowY + 13, 22, 24)) { CoreConfig.INSTANCE.setZoomFov(CoreConfig.INSTANCE.zoomFov() + 5); return true; }
            rowY += 72;
            if (inside(mouseX, mouseY, cx, rowY, cw, 60)) {
                CoreConfig.INSTANCE.setNotifications(!CoreConfig.INSTANCE.notifications());
                if (CoreConfig.INSTANCE.notifications()) NotificationCenter.push("NOTIFICATIONS", "Enabled");
                return true;
            }
            rowY += 80;
            if (inside(mouseX, mouseY, cx, rowY + 20, cw, 25)) { bindingTarget = "OPEN"; return true; }
            if (inside(mouseX, mouseY, cx, rowY + 53, cw, 25)) { bindingTarget = "HUD"; return true; }
            if (inside(mouseX, mouseY, cx, rowY + 86, cw, 25)) { bindingTarget = "ZOOM"; return true; }
        } else if (section == 2) {
            int rowY = cy + 64;
            for (int i = 0; i < ACCENTS.length; i++) {
                int sx = cx + i * 38;
                if (inside(mouseX, mouseY, sx, rowY + 18, 28, 28)) { CoreConfig.INSTANCE.setAccentColor(ACCENTS[i]); return true; }
            }
            rowY += 72;
            if (inside(mouseX, mouseY, cx + 154, rowY - 7, 28, 24)) { CoreConfig.INSTANCE.setHudAlpha(CoreConfig.INSTANCE.hudAlpha() - 16); return true; }
            if (inside(mouseX, mouseY, cx + 188, rowY - 7, 28, 24)) { CoreConfig.INSTANCE.setHudAlpha(CoreConfig.INSTANCE.hudAlpha() + 16); return true; }
            rowY += 47;
            if (inside(mouseX, mouseY, cx + 154, rowY - 7, 64, 24)) {
                int snap = CoreConfig.INSTANCE.snap();
                CoreConfig.INSTANCE.setSnap(snap == 2 ? 4 : snap == 4 ? 8 : 2);
                return true;
            }
            rowY += 50;
            if (inside(mouseX, mouseY, cx, rowY + 19, 84, 28)) { CoreConfig.INSTANCE.applyPreset("DEFAULT", width, height); NotificationCenter.push("HUD PRESET", "Default layout restored"); return true; }
            if (inside(mouseX, mouseY, cx + 92, rowY + 19, 84, 28)) { CoreConfig.INSTANCE.applyPreset("COMPACT", width, height); NotificationCenter.push("HUD PRESET", "Compact layout applied"); return true; }
            if (inside(mouseX, mouseY, cx + 184, rowY + 19, 84, 28)) { CoreConfig.INSTANCE.applyPreset("CORNERS", width, height); NotificationCenter.push("HUD PRESET", "Corners layout applied"); return true; }
            rowY += 69;
            if (inside(mouseX, mouseY, cx, rowY, Math.min(cw, 292), 34)) { EternalCore.openHudEditor(); return true; }
        }
        return super.mouseClicked(event, doubleClick);
    }

    @Override
    public boolean keyPressed(KeyEvent event) {
        try {
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
                }
                NotificationCenter.push("KEYBIND", bindingTarget + " = " + keyName(key));
                bindingTarget = null;
                return true;
            }
            return super.keyPressed(event);
        } catch (Throwable error) {
            recover("keyboard input", error);
            return true;
        }
    }

    private boolean keyInUseByOther(String target, int key) {
        CoreConfig config = CoreConfig.INSTANCE;
        return (!"OPEN".equals(target) && config.openKey() == key)
                || (!"HUD".equals(target) && config.hudEditorKey() == key)
                || (!"ZOOM".equals(target) && config.zoomKey() == key);
    }

    private void card(GuiGraphics graphics, int x, int y, int width, int height, String title, String body, boolean enabled) {
        int accent = CoreConfig.INSTANCE.accentColor();
        graphics.fill(x, y, x + width, y + height, SURFACE);
        graphics.renderOutline(x, y, width, height, enabled ? 0x55462A2E : LINE);
        if (enabled) graphics.fill(x, y, x + 2, y + height, accent);
        graphics.drawString(font, title, x + 12, y + 12, enabled ? TEXT : MUTED, false);
        graphics.drawString(font, body, x + 12, y + 32, 0xFF676D78, false);
    }

    private void keyRow(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, String id, String key, String action, String target) {
        boolean hover = inside(mouseX, mouseY, x, y, width, 25);
        boolean listening = target.equals(bindingTarget);
        graphics.fill(x, y, x + width, y + 25, listening ? 0xFF2A1014 : hover ? SURFACE_HOVER : SURFACE);
        graphics.renderOutline(x, y, width, 25, listening ? CoreConfig.INSTANCE.accentColor() : hover ? LINE_STRONG : LINE);
        if (listening) graphics.fill(x, y, x + 2, y + 25, CoreConfig.INSTANCE.accentColor());
        graphics.drawString(font, id, x + 9, y + 9, 0xFF747A85, false);
        graphics.drawString(font, listening ? "PRESS A KEY" : key, x + 66, y + 9, listening ? CoreConfig.INSTANCE.accentColor() : TEXT, false);
        graphics.drawString(font, action, x + 166, y + 9, MUTED, false);
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
        graphics.drawString(font, text, x + 136, y + 10, 0xFF6F7580, false);
    }

    private void button(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, int height, String label, boolean primary) {
        boolean hover = inside(mouseX, mouseY, x, y, width, height);
        int accent = CoreConfig.INSTANCE.accentColor();
        int fill = primary ? (hover ? 0xF0000000 | (accent & 0x00FFFFFF) : 0xC9000000 | (accent & 0x00FFFFFF)) : hover ? 0xFF20242A : 0xFF15181D;
        graphics.fill(x, y, x + width, y + height, fill);
        graphics.renderOutline(x, y, width, height, primary ? 0x66FFFFFF : hover ? LINE_STRONG : LINE);
        if (hover) graphics.fill(x, y, x + width, y + 1, 0x44FFFFFF);
        graphics.drawCenteredString(font, label, x + width / 2, y + (height - 8) / 2, primary || hover ? TEXT : 0xFFD4D7DC);
    }

    private int enabledHudCount() {
        int count = 0;
        for (String module : HUD_MODULES) if (CoreConfig.INSTANCE.on(module)) count++;
        return count;
    }

    private void recover(String stage, Throwable error) {
        if (recovering) return;
        recovering = true;
        CoreLog.error("Modules screen " + stage + " failed", error);
        Minecraft mc = Minecraft.getInstance();
        mc.execute(() -> {
            try {
                NotificationCenter.push("ETERNAL RECOVERY", "Modules screen recovered · check eternal-core.log");
                if (mc.screen == this) mc.setScreen(new EternalHomeScreen());
            } catch (Throwable nested) {
                CoreLog.error("Could not recover from Modules screen failure", nested);
                if (mc.screen == this) mc.setScreen(null);
            } finally {
                recovering = false;
            }
        });
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
