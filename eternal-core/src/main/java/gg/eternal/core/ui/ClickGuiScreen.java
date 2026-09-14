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
    private static final String[] SECTIONS = {"HUD", "UTILITY", "STYLE", "ABOUT"};
    private static final String[] HUD_MODULES = {
            "Watermark", "FPS", "CPS", "Keystrokes", "Coordinates", "Ping",
            "Speed", "Direction", "Memory", "Session", "Clock"
    };
    private static final int[] ACCENTS = {
            0xFFFF3038, 0xFFFF6B35, 0xFF8B5CF6, 0xFF3B82F6, 0xFF22C55E
    };
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
        DESCRIPTIONS.put("Watermark", "Eternal Core identity chip");
        DESCRIPTIONS.put("FPS", "Live rendered frame rate");
        DESCRIPTIONS.put("CPS", "Left and right click activity");
        DESCRIPTIONS.put("Keystrokes", "WASD input state");
        DESCRIPTIONS.put("Coordinates", "Current XYZ position");
        DESCRIPTIONS.put("Ping", "Current server latency");
        DESCRIPTIONS.put("Speed", "Horizontal movement speed");
        DESCRIPTIONS.put("Direction", "Player yaw direction");
        DESCRIPTIONS.put("Memory", "JVM memory usage");
        DESCRIPTIONS.put("Session", "Current play session time");
        DESCRIPTIONS.put("Clock", "Local 24-hour clock");
        DESCRIPTIONS.put("Zoom", "Hold your configured zoom key for FOV zoom");
    }

    private int section;
    private String bindingTarget;

    public ClickGuiScreen() {
        super(Component.literal("Eternal Core"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        renderBackground(graphics, mouseX, mouseY, delta);

        int panelWidth = Math.min(700, width - 24);
        int panelHeight = Math.min(404, height - 24);
        int x = (width - panelWidth) / 2;
        int y = (height - panelHeight) / 2;
        int sidebarWidth = 128;
        int accent = CoreConfig.INSTANCE.accentColor();

        drawWindowChrome(graphics, x, y, panelWidth, panelHeight, sidebarWidth, accent);

        graphics.drawString(font, "ETERNAL", x + 18, y + 17, TEXT, false);
        graphics.drawString(font, "CORE", x + 18 + font.width("ETERNAL") + 5, y + 17, accent, false);
        graphics.drawString(font, "PREMIUM CLIENT · " + EternalCore.VERSION, x + 18, y + 32, DIM, false);

        String state = CoreConfig.INSTANCE.notifications() ? "LIVE CONFIG" : "SILENT MODE";
        int stateWidth = font.width(state) + 24;
        int stateX = x + panelWidth - stateWidth - 14;
        graphics.fill(stateX, y + 14, stateX + stateWidth, y + 34, 0xFF0C1110);
        graphics.renderOutline(stateX, y + 14, stateWidth, 20, 0x334A7657);
        graphics.fill(stateX + 7, y + 21, stateX + 12, y + 26, CoreConfig.INSTANCE.notifications() ? GREEN : DIM);
        graphics.drawString(font, state, stateX + 16, y + 20, CoreConfig.INSTANCE.notifications() ? 0xFF9AE9B2 : MUTED, false);

        int tabY = y + 66;
        for (int i = 0; i < SECTIONS.length; i++) {
            boolean active = i == section;
            boolean hover = inside(mouseX, mouseY, x + 10, tabY + i * 34, sidebarWidth - 20, 28);
            int rowX = x + 10;
            int rowY = tabY + i * 34;
            int rowW = sidebarWidth - 20;
            if (active || hover) {
                graphics.fill(rowX, rowY, rowX + rowW, rowY + 28, active ? 0xFF241014 : 0xFF12151A);
                graphics.renderOutline(rowX, rowY, rowW, 28, active ? 0x443F2529 : 0x223A4049);
            }
            if (active) {
                graphics.fill(rowX, rowY, rowX + 3, rowY + 28, accent);
                graphics.fill(rowX + 3, rowY, rowX + 34, rowY + 1, 0x33FFFFFF);
            }
            graphics.drawString(font, SECTIONS[i], x + 22, rowY + 10, active ? TEXT : hover ? 0xFFD5D8DD : MUTED, false);
            if (active) graphics.drawString(font, "•", x + sidebarWidth - 24, rowY + 10, accent, false);
        }

        graphics.fill(x + 14, y + panelHeight - 54, x + sidebarWidth - 14, y + panelHeight - 53, 0x223B414A);
        graphics.drawString(font, "OPEN KEY", x + 18, y + panelHeight - 42, DIM, false);
        graphics.drawString(font, keyName(CoreConfig.INSTANCE.openKey()), x + 18, y + panelHeight - 27, accent, false);
        graphics.drawString(font, "REBINDABLE", x + 18 + font.width(keyName(CoreConfig.INSTANCE.openKey())) + 8, y + panelHeight - 27, 0xFF4B515B, false);

        int cx = x + sidebarWidth + 18;
        int cy = y + 18;
        int cw = panelWidth - sidebarWidth - 36;
        switch (section) {
            case 0 -> renderHud(graphics, mouseX, mouseY, cx, cy, cw);
            case 1 -> renderUtility(graphics, mouseX, mouseY, cx, cy, cw);
            case 2 -> renderStyle(graphics, mouseX, mouseY, cx, cy, cw);
            default -> renderAbout(graphics, cx, cy, cw);
        }

        super.render(graphics, mouseX, mouseY, delta);
    }

    private void drawWindowChrome(GuiGraphics graphics, int x, int y, int panelWidth, int panelHeight, int sidebarWidth, int accent) {
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

        int glowWidth = 22;
        graphics.fill(x + 3, y + 1, x + 3 + glowWidth, y + panelHeight - 1, 0x11000000 | (accent & 0x00FFFFFF));
    }

    private void sectionHeader(GuiGraphics graphics, int x, int y, String kicker, String title, String subtitle) {
        graphics.drawString(font, kicker, x, y, DIM, false);
        graphics.drawString(font, title, x, y + 14, TEXT, false);
        graphics.drawString(font, subtitle, x, y + 29, MUTED, false);
    }

    private void renderHud(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "HUD SYSTEM", "MODULES", "Live telemetry rendered directly inside Minecraft");

        int cardWidth = (width - 10) / 2;
        int startY = y + 54;
        for (int i = 0; i < HUD_MODULES.length; i++) {
            String name = HUD_MODULES[i];
            int col = i % 2;
            int row = i / 2;
            int cardX = x + col * (cardWidth + 10);
            int cardY = startY + row * 46;
            boolean hover = inside(mouseX, mouseY, cardX, cardY, cardWidth, 38);
            boolean enabled = CoreConfig.INSTANCE.on(name);
            int accent = CoreConfig.INSTANCE.accentColor();

            moduleCard(graphics, cardX, cardY, cardWidth, 38, name, DESCRIPTIONS.getOrDefault(name, "Eternal module"), enabled, hover, accent);
            drawToggle(graphics, cardX + cardWidth - 37, cardY + 13, enabled, accent);
        }

        int actionY = y + 334;
        button(graphics, mouseX, mouseY, x, actionY, 106, 27, "ENABLE ALL");
        button(graphics, mouseX, mouseY, x + 114, actionY, 106, 27, "DISABLE ALL");
        graphics.drawString(font, "SAVES INSTANTLY", x + 232, actionY + 4, 0xFF505660, false);
        graphics.drawString(font, "config/eternal-core.json", x + 232, actionY + 15, 0xFF737984, false);
    }

    private void moduleCard(GuiGraphics graphics, int x, int y, int width, int height, String title, String body, boolean enabled, boolean hover, int accent) {
        graphics.fill(x, y, x + width, y + height, hover ? SURFACE_HOVER : SURFACE);
        graphics.renderOutline(x, y, width, height, enabled ? 0x553E292D : LINE);
        if (enabled) {
            graphics.fill(x, y, x + 2, y + height, accent);
            graphics.fill(x + 2, y, x + Math.min(width, 62), y + 1, 0x22FFFFFF);
        }
        graphics.drawString(font, title.toUpperCase(), x + 10, y + 8, enabled ? TEXT : 0xFF858B96, false);
        graphics.drawString(font, body, x + 10, y + 23, hover ? 0xFF777D88 : 0xFF616772, false);
    }

    private void renderUtility(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "UTILITY SYSTEM", "CONTROL CENTER", "Client-side helpers with persistent keybinds");

        int accent = CoreConfig.INSTANCE.accentColor();
        int rowY = y + 59;
        card(graphics, x, rowY, width, 58, "ZOOM", DESCRIPTIONS.get("Zoom"), CoreConfig.INSTANCE.on("Zoom"));
        graphics.drawString(font, "FOV", x + width - 141, rowY + 13, DIM, false);
        graphics.drawString(font, Integer.toString(CoreConfig.INSTANCE.zoomFov()), x + width - 141, rowY + 28, TEXT, false);
        button(graphics, mouseX, mouseY, x + width - 62, rowY + 12, 22, 24, "-");
        button(graphics, mouseX, mouseY, x + width - 34, rowY + 12, 22, 24, "+");
        drawToggle(graphics, x + width - 143, rowY + 43, CoreConfig.INSTANCE.on("Zoom"), accent);

        rowY += 70;
        card(graphics, x, rowY, width, 58, "NOTIFICATIONS", "Status, module and keybind feedback", CoreConfig.INSTANCE.notifications());
        graphics.drawString(font, CoreConfig.INSTANCE.notifications() ? "LIVE" : "MUTED", x + width - 84, rowY + 24, CoreConfig.INSTANCE.notifications() ? GREEN : DIM, false);
        drawToggle(graphics, x + width - 45, rowY + 23, CoreConfig.INSTANCE.notifications(), accent);

        rowY += 78;
        graphics.drawString(font, "KEYBINDS", x, rowY, 0xFF969CA6, false);
        graphics.drawString(font, "CLICK A ROW · THEN PRESS A KEY", x + 74, rowY, DIM, false);
        keyRow(graphics, mouseX, mouseY, x, rowY + 20, width, "OPEN", keyName(CoreConfig.INSTANCE.openKey()), "Open Eternal Core", "OPEN");
        keyRow(graphics, mouseX, mouseY, x, rowY + 52, width, "HUD", keyName(CoreConfig.INSTANCE.hudEditorKey()), "Open HUD editor", "HUD");
        keyRow(graphics, mouseX, mouseY, x, rowY + 84, width, "ZOOM", keyName(CoreConfig.INSTANCE.zoomKey()), "Hold to zoom", "ZOOM");
    }

    private void renderStyle(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "VISUAL SYSTEM", "STYLE + LAYOUT", "Premium visual settings that persist everywhere Core runs");

        int rowY = y + 62;
        graphics.drawString(font, "ACCENT PRESET", x, rowY, 0xFF969CA6, false);
        for (int i = 0; i < ACCENTS.length; i++) {
            int sx = x + i * 36;
            graphics.fill(sx, rowY + 18, sx + 26, rowY + 44, 0xFF0A0C10);
            graphics.fill(sx + 2, rowY + 20, sx + 24, rowY + 42, ACCENTS[i]);
            if ((CoreConfig.INSTANCE.accentColor() & 0x00FFFFFF) == (ACCENTS[i] & 0x00FFFFFF)) {
                graphics.renderOutline(sx - 2, rowY + 16, 30, 30, 0xFFFFFFFF);
            } else {
                graphics.renderOutline(sx, rowY + 18, 26, 26, LINE);
            }
        }

        rowY += 68;
        styleRow(graphics, x, rowY, width, "HUD OPACITY", Math.round(CoreConfig.INSTANCE.hudAlpha() / 255.0F * 100.0F) + "%");
        button(graphics, mouseX, mouseY, x + 152, rowY - 7, 28, 24, "-");
        button(graphics, mouseX, mouseY, x + 186, rowY - 7, 28, 24, "+");

        rowY += 46;
        styleRow(graphics, x, rowY, width, "SNAP GRID", CoreConfig.INSTANCE.snap() + " PX");
        button(graphics, mouseX, mouseY, x + 152, rowY - 7, 62, 24, "CYCLE");

        rowY += 48;
        graphics.drawString(font, "HUD LAYOUT PRESETS", x, rowY, 0xFF969CA6, false);
        button(graphics, mouseX, mouseY, x, rowY + 18, 82, 28, "DEFAULT");
        button(graphics, mouseX, mouseY, x + 90, rowY + 18, 82, 28, "COMPACT");
        button(graphics, mouseX, mouseY, x + 180, rowY + 18, 82, 28, "CORNERS");

        rowY += 66;
        int accent = CoreConfig.INSTANCE.accentColor();
        boolean hover = inside(mouseX, mouseY, x, rowY, Math.min(width, 282), 34);
        graphics.fill(x, rowY, x + Math.min(width, 282), rowY + 34, hover ? 0xFF2A1115 : 0xFF1D0E12);
        graphics.renderOutline(x, rowY, Math.min(width, 282), 34, hover ? 0x8860363A : 0x5560363A);
        graphics.fill(x, rowY, x + 3, rowY + 34, accent);
        graphics.drawString(font, "OPEN HUD EDITOR", x + 14, rowY + 13, TEXT, false);
        String key = keyName(CoreConfig.INSTANCE.hudEditorKey());
        graphics.drawString(font, key, x + Math.min(width, 282) - font.width(key) - 12, rowY + 13, accent, false);
    }

    private void styleRow(GuiGraphics graphics, int x, int y, int width, String label, String value) {
        graphics.fill(x, y - 10, x + Math.min(width, 232), y + 20, 0xFF0D1014);
        graphics.renderOutline(x, y - 10, Math.min(width, 232), 30, LINE);
        graphics.drawString(font, label, x + 10, y, 0xFF9298A2, false);
        graphics.drawString(font, value, x + 104, y, TEXT, false);
    }

    private void renderAbout(GuiGraphics graphics, int x, int y, int width) {
        int accent = CoreConfig.INSTANCE.accentColor();
        sectionHeader(graphics, x, y, "ETERNAL CORE", "PREMIUM CLIENT", "A real standalone-capable Fabric client, not a launcher mock-up");
        graphics.drawString(font, EternalCore.VERSION, x + width - font.width(EternalCore.VERSION), y + 14, accent, false);

        int cardY = y + 61;
        graphics.fill(x, cardY, x + width, cardY + 78, SURFACE);
        graphics.renderOutline(x, cardY, width, 78, LINE_STRONG);
        graphics.fill(x, cardY, x + 3, cardY + 78, accent);
        graphics.drawString(font, "STANDALONE FABRIC MOD", x + 14, cardY + 14, TEXT, false);
        graphics.drawString(font, "The exact verified Core JAR works without the Eternal launcher.", x + 14, cardY + 34, MUTED, false);
        graphics.drawString(font, "Minecraft 1.21.11 · Fabric · Java 21+", x + 14, cardY + 51, 0xFF6D7480, false);
        graphics.drawString(font, "VERIFIED", x + width - 70, cardY + 14, GREEN, false);

        cardY += 94;
        graphics.drawString(font, "RUNTIME MODEL", x, cardY, 0xFF969CA6, false);
        infoRow(graphics, x, cardY + 22, width, "LAUNCHER", "Verified + repaired automatically per compatible profile");
        infoRow(graphics, x, cardY + 58, width, "STANDALONE", "Released JAR runs from any compatible Fabric mods folder");
        infoRow(graphics, x, cardY + 94, width, "PERSISTENCE", "Modules, keybinds, style and HUD positions stay local");

        graphics.drawString(font, "NO LAUNCHER PROCESS REQUIRED WHILE MINECRAFT IS RUNNING", x, y + 304, DIM, false);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        int panelWidth = Math.min(700, width - 24);
        int panelHeight = Math.min(404, height - 24);
        int x = (width - panelWidth) / 2;
        int y = (height - panelHeight) / 2;
        int sidebarWidth = 128;
        int mouseX = (int) event.x();
        int mouseY = (int) event.y();

        int tabY = y + 66;
        for (int i = 0; i < SECTIONS.length; i++) {
            if (inside(mouseX, mouseY, x + 10, tabY + i * 34, sidebarWidth - 20, 28)) {
                section = i;
                bindingTarget = null;
                return true;
            }
        }

        int cx = x + sidebarWidth + 18;
        int cy = y + 18;
        int cw = panelWidth - sidebarWidth - 36;

        if (section == 0) {
            int cardWidth = (cw - 10) / 2;
            int startY = cy + 54;
            for (int i = 0; i < HUD_MODULES.length; i++) {
                int cardX = cx + (i % 2) * (cardWidth + 10);
                int cardY = startY + (i / 2) * 46;
                if (inside(mouseX, mouseY, cardX, cardY, cardWidth, 38)) {
                    String name = HUD_MODULES[i];
                    CoreConfig.INSTANCE.toggle(name);
                    NotificationCenter.push(name.toUpperCase(), CoreConfig.INSTANCE.on(name) ? "Enabled" : "Disabled");
                    return true;
                }
            }
            int actionY = cy + 334;
            if (inside(mouseX, mouseY, cx, actionY, 106, 27)) {
                CoreConfig.INSTANCE.setAllModules(true);
                NotificationCenter.push("HUD", "All HUD modules enabled");
                return true;
            }
            if (inside(mouseX, mouseY, cx + 114, actionY, 106, 27)) {
                CoreConfig.INSTANCE.setAllModules(false);
                NotificationCenter.push("HUD", "All HUD modules disabled");
                return true;
            }
        } else if (section == 1) {
            int rowY = cy + 59;
            if (inside(mouseX, mouseY, cx, rowY, cw, 58) && mouseX < cx + cw - 145) {
                CoreConfig.INSTANCE.toggle("Zoom");
                NotificationCenter.push("ZOOM", CoreConfig.INSTANCE.on("Zoom") ? "Enabled · hold " + keyName(CoreConfig.INSTANCE.zoomKey()) : "Disabled");
                return true;
            }
            if (inside(mouseX, mouseY, cx + cw - 62, rowY + 12, 22, 24)) {
                CoreConfig.INSTANCE.setZoomFov(CoreConfig.INSTANCE.zoomFov() - 5);
                return true;
            }
            if (inside(mouseX, mouseY, cx + cw - 34, rowY + 12, 22, 24)) {
                CoreConfig.INSTANCE.setZoomFov(CoreConfig.INSTANCE.zoomFov() + 5);
                return true;
            }
            rowY += 70;
            if (inside(mouseX, mouseY, cx, rowY, cw, 58)) {
                CoreConfig.INSTANCE.setNotifications(!CoreConfig.INSTANCE.notifications());
                if (CoreConfig.INSTANCE.notifications()) NotificationCenter.push("NOTIFICATIONS", "Enabled");
                return true;
            }

            rowY += 78;
            if (inside(mouseX, mouseY, cx, rowY + 20, cw, 25)) { bindingTarget = "OPEN"; return true; }
            if (inside(mouseX, mouseY, cx, rowY + 52, cw, 25)) { bindingTarget = "HUD"; return true; }
            if (inside(mouseX, mouseY, cx, rowY + 84, cw, 25)) { bindingTarget = "ZOOM"; return true; }
        } else if (section == 2) {
            int rowY = cy + 62;
            for (int i = 0; i < ACCENTS.length; i++) {
                int sx = cx + i * 36;
                if (inside(mouseX, mouseY, sx, rowY + 18, 26, 26)) {
                    CoreConfig.INSTANCE.setAccentColor(ACCENTS[i]);
                    return true;
                }
            }

            rowY += 68;
            if (inside(mouseX, mouseY, cx + 152, rowY - 7, 28, 24)) {
                CoreConfig.INSTANCE.setHudAlpha(CoreConfig.INSTANCE.hudAlpha() - 16);
                return true;
            }
            if (inside(mouseX, mouseY, cx + 186, rowY - 7, 28, 24)) {
                CoreConfig.INSTANCE.setHudAlpha(CoreConfig.INSTANCE.hudAlpha() + 16);
                return true;
            }

            rowY += 46;
            if (inside(mouseX, mouseY, cx + 152, rowY - 7, 62, 24)) {
                int snap = CoreConfig.INSTANCE.snap();
                CoreConfig.INSTANCE.setSnap(snap == 2 ? 4 : snap == 4 ? 8 : 2);
                return true;
            }

            rowY += 48;
            if (inside(mouseX, mouseY, cx, rowY + 18, 82, 28)) {
                CoreConfig.INSTANCE.applyPreset("DEFAULT", width, height);
                NotificationCenter.push("HUD PRESET", "Default layout restored");
                return true;
            }
            if (inside(mouseX, mouseY, cx + 90, rowY + 18, 82, 28)) {
                CoreConfig.INSTANCE.applyPreset("COMPACT", width, height);
                NotificationCenter.push("HUD PRESET", "Compact layout applied");
                return true;
            }
            if (inside(mouseX, mouseY, cx + 180, rowY + 18, 82, 28)) {
                CoreConfig.INSTANCE.applyPreset("CORNERS", width, height);
                NotificationCenter.push("HUD PRESET", "Corners layout applied");
                return true;
            }

            rowY += 66;
            if (inside(mouseX, mouseY, cx, rowY, Math.min(cw, 282), 34)) {
                Minecraft.getInstance().setScreen(new HudEditorScreen());
                return true;
            }
        }

        return super.mouseClicked(event, doubleClick);
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
                || (!"ZOOM".equals(target) && config.zoomKey() == key);
    }

    private void card(GuiGraphics graphics, int x, int y, int width, int height, String title, String body, boolean enabled) {
        int accent = CoreConfig.INSTANCE.accentColor();
        graphics.fill(x, y, x + width, y + height, SURFACE);
        graphics.renderOutline(x, y, width, height, enabled ? 0x553E292D : LINE);
        if (enabled) graphics.fill(x, y, x + 2, y + height, accent);
        graphics.drawString(font, title, x + 12, y + 12, enabled ? TEXT : MUTED, false);
        graphics.drawString(font, body, x + 12, y + 31, 0xFF676D78, false);
    }

    private void keyRow(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, String id, String key, String action, String target) {
        boolean hover = inside(mouseX, mouseY, x, y, width, 25);
        boolean listening = target.equals(bindingTarget);
        graphics.fill(x, y, x + width, y + 25, listening ? 0xFF2A1014 : hover ? SURFACE_HOVER : SURFACE);
        graphics.renderOutline(x, y, width, 25, listening ? CoreConfig.INSTANCE.accentColor() : hover ? LINE_STRONG : LINE);
        if (listening) graphics.fill(x, y, x + 2, y + 25, CoreConfig.INSTANCE.accentColor());
        graphics.drawString(font, id, x + 9, y + 9, 0xFF747A85, false);
        graphics.drawString(font, listening ? "PRESS A KEY" : key, x + 60, y + 9, listening ? CoreConfig.INSTANCE.accentColor() : TEXT, false);
        graphics.drawString(font, action, x + 158, y + 9, MUTED, false);
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

    private void button(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, int height, String label) {
        boolean hover = inside(mouseX, mouseY, x, y, width, height);
        graphics.fill(x, y, x + width, y + height, hover ? 0xFF20242A : 0xFF15181D);
        graphics.renderOutline(x, y, width, height, hover ? LINE_STRONG : LINE);
        if (hover) graphics.fill(x, y, x + width, y + 1, 0x33FFFFFF);
        graphics.drawCenteredString(font, label, x + width / 2, y + (height - 8) / 2, hover ? TEXT : 0xFFD4D7DC);
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
    public boolean isPauseScreen() {
        return false;
    }
}
