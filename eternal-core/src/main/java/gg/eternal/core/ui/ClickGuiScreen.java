package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
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
        DESCRIPTIONS.put("Zoom", "Hold C for configurable zoom");
    }

    private int section;

    public ClickGuiScreen() {
        super(Component.literal("Eternal Core"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        renderBackground(graphics, mouseX, mouseY, delta);

        int panelWidth = Math.min(680, width - 24);
        int panelHeight = Math.min(390, height - 24);
        int x = (width - panelWidth) / 2;
        int y = (height - panelHeight) / 2;
        int sidebarWidth = 124;
        int accent = CoreConfig.INSTANCE.accentColor();

        graphics.fill(x, y, x + panelWidth, y + panelHeight, 0xF507080A);
        graphics.renderOutline(x, y, panelWidth, panelHeight, 0x55383A40);
        graphics.fill(x, y, x + 3, y + panelHeight, accent);
        graphics.fill(x + sidebarWidth, y, x + sidebarWidth + 1, y + panelHeight, 0x332F3238);

        graphics.drawString(font, "ETERNAL", x + 18, y + 18, 0xFFF7F7F8, false);
        graphics.drawString(font, "CORE", x + 18 + font.width("ETERNAL") + 5, y + 18, accent, false);
        graphics.drawString(font, "BETA 7 · " + EternalCore.VERSION, x + 18, y + 34, 0xFF676A72, false);

        int tabY = y + 64;
        for (int i = 0; i < SECTIONS.length; i++) {
            boolean active = i == section;
            boolean hover = inside(mouseX, mouseY, x + 10, tabY + i * 34, sidebarWidth - 20, 28);
            int bg = active ? 0xFF231013 : hover ? 0xFF151619 : 0x00000000;
            if (bg != 0) graphics.fill(x + 10, tabY + i * 34, x + sidebarWidth - 10, tabY + i * 34 + 28, bg);
            if (active) graphics.fill(x + 10, tabY + i * 34, x + 12, tabY + i * 34 + 28, accent);
            graphics.drawString(font, SECTIONS[i], x + 22, tabY + i * 34 + 10, active ? 0xFFFFFFFF : 0xFF8A8D95, false);
        }

        graphics.drawString(font, "RIGHT SHIFT", x + 18, y + panelHeight - 39, 0xFF5C5F66, false);
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
        graphics.drawString(font, "Live modules rendered directly in Minecraft", x, y + 15, 0xFF73767E, false);

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

            graphics.fill(cardX, cardY, cardX + cardWidth, cardY + 39, hover ? 0xFF17181B : 0xFF111214);
            graphics.renderOutline(cardX, cardY, cardWidth, 39, enabled ? 0x554D2024 : 0x332F3238);
            if (enabled) graphics.fill(cardX, cardY, cardX + 2, cardY + 39, accent);
            graphics.drawString(font, name.toUpperCase(), cardX + 10, cardY + 8, enabled ? 0xFFF6F6F7 : 0xFF777A82, false);
            graphics.drawString(font, DESCRIPTIONS.getOrDefault(name, "Eternal module"), cardX + 10, cardY + 23, 0xFF62656D, false);
            String state = enabled ? "ON" : "OFF";
            graphics.drawString(font, state, cardX + cardWidth - font.width(state) - 9, cardY + 8, enabled ? accent : 0xFF5D6068, false);
        }
    }

    private void renderUtility(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        graphics.drawString(font, "UTILITY", x, y, 0xFFFFFFFF, false);
        graphics.drawString(font, "Gameplay helpers that stay client-side", x, y + 15, 0xFF73767E, false);

        int accent = CoreConfig.INSTANCE.accentColor();
        int rowY = y + 47;
        card(graphics, x, rowY, width, 58, "ZOOM", DESCRIPTIONS.get("Zoom"), CoreConfig.INSTANCE.on("Zoom"));
        graphics.drawString(font, "FOV " + CoreConfig.INSTANCE.zoomFov(), x + width - 128, rowY + 22, 0xFFD4D5D8, false);
        button(graphics, mouseX, mouseY, x + width - 62, rowY + 12, 22, 24, "-");
        button(graphics, mouseX, mouseY, x + width - 34, rowY + 12, 22, 24, "+");
        graphics.drawString(font, CoreConfig.INSTANCE.on("Zoom") ? "ON" : "OFF", x + width - 128, rowY + 39,
                CoreConfig.INSTANCE.on("Zoom") ? accent : 0xFF5D6068, false);

        rowY += 70;
        card(graphics, x, rowY, width, 58, "NOTIFICATIONS", "Core status and module feedback", CoreConfig.INSTANCE.notifications());
        graphics.drawString(font, CoreConfig.INSTANCE.notifications() ? "ENABLED" : "DISABLED",
                x + width - 86, rowY + 24, CoreConfig.INSTANCE.notifications() ? accent : 0xFF5D6068, false);

        rowY += 80;
        graphics.drawString(font, "KEYBINDS", x, rowY, 0xFF8D9098, false);
        keyRow(graphics, x, rowY + 21, width, "RIGHT SHIFT", "Open Eternal Core");
        keyRow(graphics, x, rowY + 53, width, "H", "Open HUD editor");
        keyRow(graphics, x, rowY + 85, width, "HOLD C", "Zoom while enabled");
    }

    private void renderStyle(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        graphics.drawString(font, "STYLE + HUD LAYOUT", x, y, 0xFFFFFFFF, false);
        graphics.drawString(font, "Persistent settings work in launcher-managed and standalone mode", x, y + 15, 0xFF73767E, false);

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
        boolean hover = inside(mouseX, mouseY, x, rowY, Math.min(width, 262), 34);
        graphics.fill(x, rowY, x + Math.min(width, 262), rowY + 34, hover ? 0xFF2A1013 : 0xFF201013);
        graphics.renderOutline(x, rowY, Math.min(width, 262), 34, accent);
        graphics.drawString(font, "OPEN HUD EDITOR", x + 14, rowY + 13, 0xFFFFFFFF, false);
        graphics.drawString(font, "H", x + Math.min(width, 262) - 20, rowY + 13, accent, false);
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
        graphics.drawString(font, "Drop it into the Fabric mods folder for Minecraft 1.21.11 + Java 21.", x + 14, cardY + 50, 0xFF858891, false);

        cardY += 90;
        graphics.drawString(font, "SAME CORE · TWO WAYS TO USE IT", x, cardY, 0xFF92959D, false);
        infoRow(graphics, x, cardY + 22, width, "LAUNCHER MANAGED", "Eternal installs and verifies Core automatically");
        infoRow(graphics, x, cardY + 58, width, "STANDALONE", "Use the released JAR with any compatible Fabric profile");
        infoRow(graphics, x, cardY + 94, width, "CONFIG", "Saved locally in config/eternal-core.json");

        graphics.drawString(font, "No launcher process is required while Minecraft is running.", x, y + 284, 0xFF676A72, false);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        int panelWidth = Math.min(680, width - 24);
        int panelHeight = Math.min(390, height - 24);
        int x = (width - panelWidth) / 2;
        int y = (height - panelHeight) / 2;
        int sidebarWidth = 124;
        int mouseX = (int) event.x();
        int mouseY = (int) event.y();

        int tabY = y + 64;
        for (int i = 0; i < SECTIONS.length; i++) {
            if (inside(mouseX, mouseY, x + 10, tabY + i * 34, sidebarWidth - 20, 28)) {
                section = i;
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
        } else if (section == 1) {
            int rowY = cy + 47;
            if (inside(mouseX, mouseY, cx, rowY, cw, 58) && mouseX < cx + cw - 145) {
                CoreConfig.INSTANCE.toggle("Zoom");
                NotificationCenter.push("ZOOM", CoreConfig.INSTANCE.on("Zoom") ? "Enabled · hold C" : "Disabled");
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
            if (inside(mouseX, mouseY, cx, rowY, Math.min(cw, 262), 34)) {
                Minecraft.getInstance().setScreen(new HudEditorScreen());
                return true;
            }
        }

        return super.mouseClicked(event, doubleClick);
    }

    private void card(GuiGraphics graphics, int x, int y, int width, int height, String title, String body, boolean enabled) {
        int accent = CoreConfig.INSTANCE.accentColor();
        graphics.fill(x, y, x + width, y + height, 0xFF111214);
        graphics.renderOutline(x, y, width, height, enabled ? 0x554D2024 : 0x332F3238);
        if (enabled) graphics.fill(x, y, x + 2, y + height, accent);
        graphics.drawString(font, title, x + 12, y + 12, enabled ? 0xFFFFFFFF : 0xFF858891, false);
        graphics.drawString(font, body, x + 12, y + 31, 0xFF676A72, false);
    }

    private void keyRow(GuiGraphics graphics, int x, int y, int width, String key, String action) {
        graphics.fill(x, y, x + width, y + 25, 0xFF111214);
        graphics.drawString(font, key, x + 9, y + 9, CoreConfig.INSTANCE.accentColor(), false);
        graphics.drawString(font, action, x + 108, y + 9, 0xFF858891, false);
    }

    private void infoRow(GuiGraphics graphics, int x, int y, int width, String title, String text) {
        graphics.fill(x, y, x + width, y + 29, 0xFF111214);
        graphics.drawString(font, title, x + 10, y + 10, 0xFFDADCE0, false);
        graphics.drawString(font, text, x + 136, y + 10, 0xFF6F727A, false);
    }

    private void button(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, int height, String label) {
        boolean hover = inside(mouseX, mouseY, x, y, width, height);
        graphics.fill(x, y, x + width, y + height, hover ? 0xFF25272B : 0xFF191A1D);
        graphics.renderOutline(x, y, width, height, hover ? 0x55777B84 : 0x33383A40);
        graphics.drawCenteredString(font, label, x + width / 2, y + (height - 8) / 2, 0xFFDADCE0);
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int width, int height) {
        return mouseX >= x && mouseX < x + width && mouseY >= y && mouseY < y + height;
    }

    @Override
    public boolean isPauseScreen() {
        return false;
    }
}
