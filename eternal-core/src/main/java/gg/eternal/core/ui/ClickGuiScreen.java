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

        graphics.fill(x - 3, y - 3, x + panelWidth + 3, y + panelHeight + 3, 0x44000000);
        graphics.fill(x, y, x + panelWidth, y + panelHeight, 0xF708090B);
        graphics.renderOutline(x, y, panelWidth, panelHeight, 0x663B3E45);
        graphics.fill(x, y, x + 3, y + panelHeight, accent);
        graphics.fill(x + sidebarWidth, y, x + sidebarWidth + 1, y + panelHeight, 0x33383A40);

        int sweep = x + 3 + (int) ((System.currentTimeMillis() / 9L) % Math.max(1, panelWidth - 8));
        graphics.fill(sweep, y, Math.min(x + panelWidth, sweep + 32), y + 1, 0x99FFFFFF);

        graphics.drawString(font, "ETERNAL", x + 18, y + 18, 0xFFF7F7F8, false);
        graphics.drawString(font, "CORE", x + 18 + font.width("ETERNAL") + 5, y + 18, accent, false);
        graphics.drawString(font, "BETA 8 · " + EternalCore.VERSION, x + 18, y + 34, 0xFF676A72, false);

        int tabY = y + 66;
        for (int i = 0; i < SECTIONS.length; i++) {
            boolean active = i == section;
            boolean hover = inside(mouseX, mouseY, x + 10, tabY + i * 34, sidebarWidth - 20, 28);
            int bg = active ? 0xFF251013 : hover ? 0xFF15171A : 0x00000000;
            if (bg != 0) graphics.fill(x + 10, tabY + i * 34, x + sidebarWidth - 10, tabY + i * 34 + 28, bg);
            if (active) graphics.fill(x + 10, tabY + i * 34, x + 13, tabY + i * 34 + 28, accent);
            graphics.drawString(font, SECTIONS[i], x + 22, tabY + i * 34 + 10, active ? 0xFFFFFFFF : 0xFF8A8D95, false);
        }

        graphics.drawString(font, keyName(CoreConfig.INSTANCE.openKey()), x + 18, y + panelHeight - 39, accent, false);
        graphics.drawString(font, "OPEN CORE", x + 18, y + panelHeight - 25, 0xFF8A8D95, false);

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

    private void renderHud(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        graphics.drawString(font, "HUD MODULES", x, y, 0xFFFFFFFF, false);
        graphics.drawString(font, "Real live modules rendered directly in Minecraft", x, y + 15, 0xFF73767E, false);

        int cardWidth = (width - 10) / 2;
        int startY = y + 42;
        for (int i = 0; i < HUD_MODULES.length; i++) {
            String name = HUD_MODULES[i];
            int col = i % 2;
            int row = i / 2;
            int cardX = x + col * (cardWidth + 10);
            int cardY = startY + row * 48;
            boolean hover = inside(mouseX, mouseY, cardX, cardY, cardWidth, 39);
            boolean enabled = CoreConfig.INSTANCE.on(name);
            int accent = CoreConfig.INSTANCE.accentColor();

            graphics.fill(cardX, cardY, cardX + cardWidth, cardY + 39, hover ? 0xFF181A1E : 0xFF111316);
            graphics.renderOutline(cardX, cardY, cardWidth, 39, enabled ? 0x66562329 : 0x33383A40);
            if (enabled) graphics.fill(cardX, cardY, cardX + 2, cardY + 39, accent);
            graphics.drawString(font, name.toUpperCase(), cardX + 10, cardY + 8, enabled ? 0xFFF6F6F7 : 0xFF777A82, false);
            graphics.drawString(font, DESCRIPTIONS.getOrDefault(name, "Eternal module"), cardX + 10, cardY + 23, 0xFF62656D, false);
            drawToggle(graphics, cardX + cardWidth - 35, cardY + 10, enabled, accent);
        }

        int actionY = y + 334;
        button(graphics, mouseX, mouseY, x, actionY, 106, 27, "ENABLE ALL");
        button(graphics, mouseX, mouseY, x + 114, actionY, 106, 27, "DISABLE ALL");
        graphics.drawString(font, "Changes save immediately to config/eternal-core.json", x + 230, actionY + 10, 0xFF62656D, false);
    }

    private void renderUtility(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        graphics.drawString(font, "UTILITY + KEYBINDS", x, y, 0xFFFFFFFF, false);
        graphics.drawString(font, "Client-side helpers and persistent controls", x, y + 15, 0xFF73767E, false);

        int accent = CoreConfig.INSTANCE.accentColor();
        int rowY = y + 47;
        card(graphics, x, rowY, width, 58, "ZOOM", DESCRIPTIONS.get("Zoom"), CoreConfig.INSTANCE.on("Zoom"));
        graphics.drawString(font, "FOV " + CoreConfig.INSTANCE.zoomFov(), x + width - 136, rowY + 22, 0xFFD4D5D8, false);
        button(graphics, mouseX, mouseY, x + width - 62, rowY + 12, 22, 24, "-");
        button(graphics, mouseX, mouseY, x + width - 34, rowY + 12, 22, 24, "+");
        drawToggle(graphics, x + width - 138, rowY + 37, CoreConfig.INSTANCE.on("Zoom"), accent);

        rowY += 70;
        card(graphics, x, rowY, width, 58, "NOTIFICATIONS", "Core status and module feedback", CoreConfig.INSTANCE.notifications());
        drawToggle(graphics, x + width - 45, rowY + 20, CoreConfig.INSTANCE.notifications(), accent);

        rowY += 78;
        graphics.drawString(font, "KEYBINDS · CLICK A ROW, THEN PRESS A KEY", x, rowY, 0xFF8D9098, false);
        keyRow(graphics, mouseX, mouseY, x, rowY + 20, width, "OPEN", keyName(CoreConfig.INSTANCE.openKey()), "Open Eternal Core", "OPEN");
        keyRow(graphics, mouseX, mouseY, x, rowY + 52, width, "HUD", keyName(CoreConfig.INSTANCE.hudEditorKey()), "Open HUD editor", "HUD");
        keyRow(graphics, mouseX, mouseY, x, rowY + 84, width, "ZOOM", keyName(CoreConfig.INSTANCE.zoomKey()), "Hold to zoom", "ZOOM");
    }

    private void renderStyle(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        graphics.drawString(font, "STYLE + HUD LAYOUT", x, y, 0xFFFFFFFF, false);
        graphics.drawString(font, "Persistent settings work launcher-managed and standalone", x, y + 15, 0xFF73767E, false);

        int rowY = y + 50;
        graphics.drawString(font, "ACCENT", x, rowY, 0xFF92959D, false);
        for (int i = 0; i < ACCENTS.length; i++) {
            int sx = x + i * 34;
            graphics.fill(sx, rowY + 17, sx + 24, rowY + 41, ACCENTS[i]);
            if ((CoreConfig.INSTANCE.accentColor() & 0x00FFFFFF) == (ACCENTS[i] & 0x00FFFFFF)) {
                graphics.renderOutline(sx - 2, rowY + 15, 28, 28, 0xFFFFFFFF);
            }
        }

        rowY += 66;
        graphics.drawString(font, "HUD OPACITY", x, rowY, 0xFF92959D, false);
        int percent = Math.round(CoreConfig.INSTANCE.hudAlpha() / 255.0F * 100.0F);
        graphics.drawString(font, percent + "%", x + 104, rowY, 0xFFE0E1E3, false);
        button(graphics, mouseX, mouseY, x + 152, rowY - 7, 28, 24, "-");
        button(graphics, mouseX, mouseY, x + 186, rowY - 7, 28, 24, "+");

        rowY += 46;
        graphics.drawString(font, "SNAP GRID", x, rowY, 0xFF92959D, false);
        graphics.drawString(font, CoreConfig.INSTANCE.snap() + " PX", x + 104, rowY, 0xFFE0E1E3, false);
        button(graphics, mouseX, mouseY, x + 152, rowY - 7, 62, 24, "CYCLE");

        rowY += 48;
        graphics.drawString(font, "LAYOUT PRESETS", x, rowY, 0xFF92959D, false);
        button(graphics, mouseX, mouseY, x, rowY + 18, 82, 28, "DEFAULT");
        button(graphics, mouseX, mouseY, x + 90, rowY + 18, 82, 28, "COMPACT");
        button(graphics, mouseX, mouseY, x + 180, rowY + 18, 82, 28, "CORNERS");

        rowY += 66;
        int accent = CoreConfig.INSTANCE.accentColor();
        boolean hover = inside(mouseX, mouseY, x, rowY, Math.min(width, 282), 34);
        graphics.fill(x, rowY, x + Math.min(width, 282), rowY + 34, hover ? 0xFF2A1013 : 0xFF201013);
        graphics.renderOutline(x, rowY, Math.min(width, 282), 34, accent);
        graphics.drawString(font, "OPEN HUD EDITOR", x + 14, rowY + 13, 0xFFFFFFFF, false);
        String key = keyName(CoreConfig.INSTANCE.hudEditorKey());
        graphics.drawString(font, key, x + Math.min(width, 282) - font.width(key) - 12, rowY + 13, accent, false);
    }

    private void renderAbout(GuiGraphics graphics, int x, int y, int width) {
        int accent = CoreConfig.INSTANCE.accentColor();
        graphics.drawString(font, "ETERNAL CORE", x, y, 0xFFFFFFFF, false);
        graphics.drawString(font, EternalCore.VERSION, x, y + 17, accent, false);

        int cardY = y + 48;
        graphics.fill(x, cardY, x + width, cardY + 76, 0xFF111214);
        graphics.renderOutline(x, cardY, width, 76, 0x3336383D);
        graphics.drawString(font, "STANDALONE FABRIC MOD", x + 14, cardY + 14, 0xFFFFFFFF, false);
        graphics.drawString(font, "This exact Core JAR works without the Eternal launcher.", x + 14, cardY + 34, 0xFF858891, false);
        graphics.drawString(font, "Drop it into Fabric mods for Minecraft 1.21.11 + Java 21.", x + 14, cardY + 50, 0xFF858891, false);

        cardY += 90;
        graphics.drawString(font, "SAME CORE · TWO REAL WAYS TO USE IT", x, cardY, 0xFF92959D, false);
        infoRow(graphics, x, cardY + 22, width, "LAUNCHER", "Verified and repaired automatically per profile");
        infoRow(graphics, x, cardY + 58, width, "STANDALONE", "Use the released JAR in a compatible Fabric profile");
        infoRow(graphics, x, cardY + 94, width, "CONFIG", "Modules, keybinds, style and HUD positions persist locally");

        graphics.drawString(font, "No launcher process is required while Minecraft is running.", x, y + 286, 0xFF676A72, false);
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
            int startY = cy + 42;
            for (int i = 0; i < HUD_MODULES.length; i++) {
                int cardX = cx + (i % 2) * (cardWidth + 10);
                int cardY = startY + (i / 2) * 48;
                if (inside(mouseX, mouseY, cardX, cardY, cardWidth, 39)) {
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
            int rowY = cy + 47;
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
            int rowY = cy + 50;
            for (int i = 0; i < ACCENTS.length; i++) {
                int sx = cx + i * 34;
                if (inside(mouseX, mouseY, sx, rowY + 17, 24, 24)) {
                    CoreConfig.INSTANCE.setAccentColor(ACCENTS[i]);
                    return true;
                }
            }

            rowY += 66;
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
        graphics.fill(x, y, x + width, y + height, 0xFF111316);
        graphics.renderOutline(x, y, width, height, enabled ? 0x66562329 : 0x33383A40);
        if (enabled) graphics.fill(x, y, x + 2, y + height, accent);
        graphics.drawString(font, title, x + 12, y + 12, enabled ? 0xFFFFFFFF : 0xFF858891, false);
        graphics.drawString(font, body, x + 12, y + 31, 0xFF676A72, false);
    }

    private void keyRow(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, String id, String key, String action, String target) {
        boolean hover = inside(mouseX, mouseY, x, y, width, 25);
        boolean listening = target.equals(bindingTarget);
        graphics.fill(x, y, x + width, y + 25, listening ? 0xFF2A1013 : hover ? 0xFF181A1E : 0xFF111316);
        graphics.renderOutline(x, y, width, 25, listening ? CoreConfig.INSTANCE.accentColor() : 0x33383A40);
        graphics.drawString(font, id, x + 9, y + 9, 0xFF7A7D86, false);
        graphics.drawString(font, listening ? "PRESS A KEY" : key, x + 60, y + 9, listening ? CoreConfig.INSTANCE.accentColor() : 0xFFE1E2E5, false);
        graphics.drawString(font, action, x + 158, y + 9, 0xFF858891, false);
    }

    private void drawToggle(GuiGraphics graphics, int x, int y, boolean enabled, int accent) {
        graphics.fill(x, y, x + 26, y + 12, enabled ? (0xFF000000 | (accent & 0x00FFFFFF)) : 0xFF2A2C31);
        graphics.fill(enabled ? x + 16 : x + 2, y + 2, enabled ? x + 24 : x + 10, y + 10, 0xFFFFFFFF);
    }

    private void infoRow(GuiGraphics graphics, int x, int y, int width, String title, String text) {
        graphics.fill(x, y, x + width, y + 29, 0xFF111316);
        graphics.drawString(font, title, x + 10, y + 10, 0xFFDADCE0, false);
        graphics.drawString(font, text, x + 136, y + 10, 0xFF6F727A, false);
    }

    private void button(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, int height, String label) {
        boolean hover = inside(mouseX, mouseY, x, y, width, height);
        graphics.fill(x, y, x + width, y + height, hover ? 0xFF25272B : 0xFF191A1D);
        graphics.renderOutline(x, y, width, height, hover ? 0x55777B84 : 0x33383A40);
        graphics.drawCenteredString(font, label, x + width / 2, y + (height - 8) / 2, hover ? 0xFFFFFFFF : 0xFFDADCE0);
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
