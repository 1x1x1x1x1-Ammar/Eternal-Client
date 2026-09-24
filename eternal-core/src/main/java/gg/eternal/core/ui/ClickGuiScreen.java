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
    private static final String[] SECTIONS = {"HUD", "CLIENT", "VISUAL", "STYLE", "COMBAT", "ABOUT"};
    private static final String[] SECTION_SUBS = {"Telemetry", "Gameplay", "Crosshair", "Theme", "PvP presets", "Runtime"};
    private static final String[] COMBAT_PRESETS = {"sword", "mace", "spear", "crystal", "cart"};
    private static final String[] HUD_MODULES = {
            "Watermark", "FPS", "CPS", "Keystrokes", "Coordinates", "Ping",
            "Speed", "Direction", "Health", "Armor", "Food", "Server",
            "Memory", "Session", "Clock", "AttackCooldown", "HeldItem", "ArmorDurability", "Offhand", "Movement", "CombatSupplies"
    };
    private static final String[] CLIENT_MODULES = {"Zoom", "Fullbright", "ToggleSprint", "ToggleSneak", "Perspective"};
    private static final int[] ACCENTS = {0xFFFF3038, 0xFFFF6B35, 0xFF8B5CF6, 0xFF3B82F6, 0xFF22C55E};
    private static final Map<String, String> DESCRIPTIONS = new LinkedHashMap<>();

    private static final int TEXT = EternalUi.TEXT;
    private static final int MUTED = EternalUi.MUTED;
    private static final int DIM = EternalUi.DIM;
    private static final int GREEN = EternalUi.GREEN;

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
        DESCRIPTIONS.put("ToggleSprint", "Native Minecraft toggle sprint");
        DESCRIPTIONS.put("ToggleSneak", "Native Minecraft toggle sneak");
        DESCRIPTIONS.put("Perspective", "Cycle camera perspective");
        DESCRIPTIONS.put("Crosshair", "Pixel-perfect custom crosshair");
        DESCRIPTIONS.put("AttackCooldown", "Attack recovery");
        DESCRIPTIONS.put("HeldItem", "Held item + wear");
        DESCRIPTIONS.put("ArmorDurability", "Lowest armor %");
        DESCRIPTIONS.put("Offhand", "Offhand status");
        DESCRIPTIONS.put("Movement", "Fall + vertical speed");
        DESCRIPTIONS.put("CombatSupplies", "Carried PvP supplies");
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
        MenuViewport view = viewport();
        graphics.pose().pushMatrix();
        graphics.pose().scale(view.scale(), view.scale());
        try { renderMenu(graphics, view.pointer(mouseX), view.pointer(mouseY), delta); }
        finally { graphics.pose().popMatrix(); }
    }

    private void renderMenu(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        CoreConfig config = CoreConfig.INSTANCE;
        int accent = config.accentColor();
        Layout l = layout();
        long now = System.currentTimeMillis();
        float intro = EternalUi.easeOutCubic((now - openedAt) / 280.0F);
        float sectionIntro = EternalUi.easeOutCubic((now - sectionChangedAt) / 180.0F);

        EternalUi.veil(graphics, viewport().width(), viewport().height(), accent);
        drawShell(graphics, l, accent, intro);
        drawSidebar(graphics, mouseX, mouseY, l, accent);
        drawTopbar(graphics, l, accent);

        int shift = 0;
        int cx = l.contentX + shift;
        int cy = l.contentY;
        int cw = l.contentW - shift;
        EternalUi.divider(graphics, l.contentX, l.contentY + 44, l.contentW, accent);

        switch (section) {
            case 0 -> renderHud(graphics, mouseX, mouseY, cx, cy, cw);
            case 1 -> renderClient(graphics, mouseX, mouseY, cx, cy, cw);
            case 2 -> renderVisual(graphics, mouseX, mouseY, cx, cy, cw);
            case 3 -> renderStyle(graphics, mouseX, mouseY, cx, cy, cw);
            case 4 -> renderCombat(graphics, mouseX, mouseY, cx, cy, cw);
            default -> renderAbout(graphics, cx, cy, cw);
        }

        super.render(graphics, mouseX, mouseY, delta);
    }

    private void drawShell(GuiGraphics graphics, Layout l, int accent, float intro) {
        graphics.fill(l.x - 8, l.y - 8, l.x + l.w + 8, l.y + l.h + 8, 0x20000000);
        EternalUi.glass(graphics, l.x, l.y, l.w, l.h, accent, false);
        graphics.fill(l.x, l.y, l.x + l.sidebarW, l.y + l.h, 0xFA080A0E);
        graphics.fill(l.x + l.sidebarW, l.y, l.x + l.sidebarW + 1, l.y + l.h, 0x34454C57);
        graphics.fill(l.x, l.y, l.x + 3, l.y + l.h, accent);
        EternalUi.progress(graphics, l.x + 3, l.y + l.h - 3, l.w - 6, accent, intro);
    }

    private void drawTopbar(GuiGraphics graphics, Layout l, int accent) {
        graphics.drawString(font, "ETERNAL", l.x + 18, l.y + 16, TEXT, false);
        graphics.drawString(font, "CORE", l.x + 18 + font.width("ETERNAL") + 5, l.y + 16, accent, false);
        graphics.drawString(font, "CUSTOMIZATION STUDIO · " + EternalCore.VERSION, l.x + 18, l.y + 32, DIM, false);

        String live = CoreConfig.INSTANCE.notifications() ? "LIVE CONFIG" : "SILENT MODE";
        int w = font.width(live) + 29;
        int x = l.x + l.w - w - 14;
        EternalUi.chip(graphics, x, l.y + 15, w, 22, accent, CoreConfig.INSTANCE.notifications());
        int color = CoreConfig.INSTANCE.notifications() ? GREEN : DIM;
        graphics.fill(x + 8, l.y + 23, x + 13, l.y + 28, color);
        graphics.drawString(font, live, x + 20, l.y + 22, CoreConfig.INSTANCE.notifications() ? 0xFFB3EFC5 : MUTED, false);
    }

    private void drawSidebar(GuiGraphics graphics, int mouseX, int mouseY, Layout l, int accent) {
        int navY = l.y + 67;
        graphics.drawString(font, "CORE MENU", l.x + 18, l.y + 51, 0xFF4E5560, false);
        for (int i = 0; i < SECTIONS.length; i++) {
            int y = navY + i * 48;
            boolean active = section == i;
            boolean hover = inside(mouseX, mouseY, l.x + 9, y, l.sidebarW - 18, 41);
            int fill = active ? EternalUi.alpha(accent, 38) : hover ? 0xFF11151A : 0x00000000;
            if (active || hover) {
                graphics.fill(l.x + 9, y, l.x + l.sidebarW - 9, y + 41, fill);
                graphics.renderOutline(l.x + 9, y, l.sidebarW - 18, 41, active ? EternalUi.alpha(accent, 108) : 0x2F474E58);
            }
            EternalUi.accentRail(graphics, l.x + 9, y, 41, accent, active);
            graphics.drawString(font, SECTIONS[i], l.x + 22, y + 9, active ? TEXT : hover ? 0xFFD9DDE3 : MUTED, false);
            graphics.drawString(font, SECTION_SUBS[i], l.x + 22, y + 24, active ? EternalUi.livingAccent(accent, y) : DIM, false);
        }

        int footer = l.y + l.h - 82;
        graphics.fill(l.x + 16, footer, l.x + l.sidebarW - 16, footer + 1, 0x29424953);
        graphics.drawString(font, "OPEN", l.x + 18, footer + 13, DIM, false);
        graphics.drawString(font, keyName(CoreConfig.INSTANCE.openKey()), l.x + 18, footer + 29, accent, false);
        graphics.drawString(font, "CONFIG AUTO-SAVES", l.x + 18, footer + 48, 0xFF4D545E, false);
    }

    private void sectionHeader(GuiGraphics graphics, int x, int y, String kicker, String title, String subtitle) {
        graphics.drawString(font, kicker, x, y, DIM, false);
        graphics.drawString(font, title, x, y + 15, TEXT, false);
        graphics.drawString(font, subtitle, x, y + 30, MUTED, false);
    }

    private void renderHud(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "HUD SYSTEM · " + HUD_MODULES.length + " MODULES", "LIVE TELEMETRY", "Real Minecraft/JVM data · click any card to toggle");
        int columns = 3;
        int gap = 7;
        int cardW = (width - gap * (columns - 1)) / columns;
        int startY = y + 59;
        for (int i = 0; i < HUD_MODULES.length; i++) {
            String name = HUD_MODULES[i];
            int cardX = x + (i % columns) * (cardW + gap);
            int cardY = startY + (i / columns) * 48;
            moduleCard(graphics, mouseX, mouseY, cardX, cardY, cardW, 41, name, DESCRIPTIONS.get(name), CoreConfig.INSTANCE.on(name), CoreConfig.INSTANCE.accentColor());
        }

        int actionY = startY + ((HUD_MODULES.length + 2) / 3) * 48 + 7;
        actionButton(graphics, mouseX, mouseY, x, actionY, 105, 28, "ENABLE ALL", false);
        actionButton(graphics, mouseX, mouseY, x + 112, actionY, 105, 28, "DISABLE ALL", false);
        actionButton(graphics, mouseX, mouseY, x + 224, actionY, 142, 28, "OPEN HUD EDITOR", true);
        graphics.drawString(font, "HUD-only actions never enable gameplay modules.", x, actionY + 39, DIM, false);
    }

    private void renderClient(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "CLIENT MODULES", "PLAY YOUR WAY", "Local quality-of-life controls backed by real Minecraft options");
        int rowY = y + 59;
        for (String name : CLIENT_MODULES) {
            moduleCard(graphics, mouseX, mouseY, x, rowY, width, 43, name, DESCRIPTIONS.get(name), CoreConfig.INSTANCE.on(name), CoreConfig.INSTANCE.accentColor());
            rowY += 49;
        }

        int keysY = rowY + 9;
        graphics.drawString(font, "KEYBINDS", x, keysY, DIM, false);
        graphics.drawString(font, "CLICK A ROW, THEN PRESS A KEY", x + 64, keysY, 0xFF505762, false);
        keyRow(graphics, mouseX, mouseY, x, keysY + 18, width, "OPEN", keyName(CoreConfig.INSTANCE.openKey()), "Open Eternal Start", "OPEN");
        keyRow(graphics, mouseX, mouseY, x, keysY + 47, width, "HUD", keyName(CoreConfig.INSTANCE.hudEditorKey()), "Open HUD editor", "HUD");
        keyRow(graphics, mouseX, mouseY, x, keysY + 76, width, "ZOOM", keyName(CoreConfig.INSTANCE.zoomKey()), "Hold to zoom", "ZOOM");
        keyRow(graphics, mouseX, mouseY, x, keysY + 105, width, "VIEW", keyName(CoreConfig.INSTANCE.perspectiveKey()), "Cycle perspective", "PERSPECTIVE");
    }

    private void renderCombat(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "COMBAT WORKSPACE", "PVP PRESETS", "Local telemetry + crosshair. Existing modules and layout stay intact.");
        String[] details = {"Attack recovery, armor durability and offhand", "Fall distance, wind charges and vertical speed",
                "Movement speed, weapon wear and attack recovery", "Crystal, obsidian and totem counts", "TNT minecart, rail and ignition tool status"};
        for (int i = 0; i < COMBAT_PRESETS.length; i++) {
            String id = COMBAT_PRESETS[i];
            moduleCard(graphics, mouseX, mouseY, x, y + 59 + i * 55, width, 47, id,
                    details[i], id.equals(CoreConfig.INSTANCE.combatPreset()), CoreConfig.INSTANCE.accentColor());
        }
        graphics.drawString(font, "Read-only helpers. No automatic attacks, aiming or item switching.", x, y + 350, MUTED, false);
    }

    private void renderVisual(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "VISUAL LAB", "CROSSHAIR + ZOOM", "Fine control with live config persistence");
        int accent = CoreConfig.INSTANCE.accentColor();
        int previewY = y + 58;
        EternalUi.glass(graphics, x, previewY, width, 90, accent, CoreConfig.INSTANCE.on("Crosshair"));
        EternalUi.accentRail(graphics, x, previewY, 90, accent, CoreConfig.INSTANCE.on("Crosshair"));
        graphics.drawString(font, "CUSTOM CROSSHAIR", x + 14, previewY + 13, TEXT, false);
        graphics.drawString(font, DESCRIPTIONS.get("Crosshair"), x + 14, previewY + 29, MUTED, false);
        drawToggle(graphics, x + width - 43, previewY + 13, CoreConfig.INSTANCE.on("Crosshair"), accent);
        drawCrosshairPreview(graphics, x + width / 2, previewY + 62, accent);

        int rowY = previewY + 101;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "GAP", CoreConfig.INSTANCE.crosshairGap() + " PX");
        rowY += 34;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "LENGTH", CoreConfig.INSTANCE.crosshairLength() + " PX");
        rowY += 34;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "THICKNESS", CoreConfig.INSTANCE.crosshairThickness() + " PX");
        rowY += 38;
        toggleSetting(graphics, mouseX, mouseY, x, rowY, width, "CENTER DOT", "Exact center pixel", CoreConfig.INSTANCE.crosshairDot(), accent);
        rowY += 37;
        toggleSetting(graphics, mouseX, mouseY, x, rowY, width, "OUTLINE", "Dark edge for bright scenes", CoreConfig.INSTANCE.crosshairOutline(), accent);
        rowY += 43;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "ZOOM FOV", Integer.toString(CoreConfig.INSTANCE.zoomFov()));
        rowY += 34;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "ZOOM SPEED", Integer.toString(CoreConfig.INSTANCE.zoomSpeed()));
        rowY += 38;
        toggleSetting(graphics, mouseX, mouseY, x, rowY, width, "SMOOTH ZOOM", "Ease into and out of target FOV", CoreConfig.INSTANCE.smoothZoom(), accent);
    }

    private void drawCrosshairPreview(GuiGraphics graphics, int centerX, int centerY, int accent) {
        CoreConfig config = CoreConfig.INSTANCE;
        int gap = config.crosshairGap() + 2;
        int length = Math.min(14, config.crosshairLength() + 4);
        int thickness = Math.max(1, config.crosshairThickness());
        int color = config.crosshairColor();
        if (config.crosshairOutline()) {
            int outline = 0xB0000000;
            graphics.fill(centerX - gap - length - 1, centerY - thickness, centerX - gap + 1, centerY + thickness + 1, outline);
            graphics.fill(centerX + gap - 1, centerY - thickness, centerX + gap + length + 1, centerY + thickness + 1, outline);
            graphics.fill(centerX - thickness, centerY - gap - length - 1, centerX + thickness + 1, centerY - gap + 1, outline);
            graphics.fill(centerX - thickness, centerY + gap - 1, centerX + thickness + 1, centerY + gap + length + 1, outline);
        }
        graphics.fill(centerX - gap - length, centerY, centerX - gap, centerY + thickness, color);
        graphics.fill(centerX + gap, centerY, centerX + gap + length, centerY + thickness, color);
        graphics.fill(centerX, centerY - gap - length, centerX + thickness, centerY - gap, color);
        graphics.fill(centerX, centerY + gap, centerX + thickness, centerY + gap + length, color);
        if (config.crosshairDot()) graphics.fill(centerX, centerY, centerX + thickness, centerY + thickness, color);
        graphics.fill(centerX - 33, centerY + 25, centerX + 33, centerY + 26, EternalUi.alpha(accent, 22));
    }

    private void renderStyle(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width) {
        sectionHeader(graphics, x, y, "VISUAL SYSTEM", "STYLE + LAYOUT", "One shared visual identity across HUD, notifications and menus");
        int accent = CoreConfig.INSTANCE.accentColor();
        int rowY = y + 62;
        graphics.drawString(font, "ACCENT", x, rowY, DIM, false);
        for (int i = 0; i < ACCENTS.length; i++) {
            int sx = x + 74 + i * 39;
            boolean active = (accent & 0x00FFFFFF) == (ACCENTS[i] & 0x00FFFFFF);
            graphics.fill(sx, rowY - 6, sx + 28, rowY + 22, 0xFF090B0F);
            graphics.fill(sx + 3, rowY - 3, sx + 25, rowY + 19, ACCENTS[i]);
            graphics.renderOutline(sx - 1, rowY - 7, 30, 30, active ? 0xFFFFFFFF : 0x3C505762);
        }

        rowY += 48;
        settingControl(graphics, mouseX, mouseY, x, rowY, width, "HUD OPACITY", Math.round(CoreConfig.INSTANCE.hudAlpha() / 255.0F * 100.0F) + "%");
        rowY += 36;
        cycleRow(graphics, mouseX, mouseY, x, rowY, width, "SNAP GRID", CoreConfig.INSTANCE.snap() + " PX", accent);
        rowY += 43;
        toggleSetting(graphics, mouseX, mouseY, x, rowY, width, "TEXT SHADOW", "Improve readability on bright scenes", CoreConfig.INSTANCE.textShadow(), accent);
        rowY += 39;
        toggleSetting(graphics, mouseX, mouseY, x, rowY, width, "LIVING ACCENT", "Subtle animated accent variation on HUD cards", CoreConfig.INSTANCE.gradientHud(), accent);
        rowY += 39;
        toggleSetting(graphics, mouseX, mouseY, x, rowY, width, "NOTIFICATIONS", "Module and keybind feedback toasts", CoreConfig.INSTANCE.notifications(), accent);
        rowY += 48;

        graphics.drawString(font, "HUD PRESETS", x, rowY, DIM, false);
        actionButton(graphics, mouseX, mouseY, x, rowY + 18, 88, 28, "DEFAULT", false);
        actionButton(graphics, mouseX, mouseY, x + 95, rowY + 18, 88, 28, "COMPACT", false);
        actionButton(graphics, mouseX, mouseY, x + 190, rowY + 18, 88, 28, "CORNERS", false);
        actionButton(graphics, mouseX, mouseY, x + 288, rowY + 18, 138, 28, "OPEN HUD EDITOR", true);
    }

    private void renderAbout(GuiGraphics graphics, int x, int y, int width) {
        int accent = CoreConfig.INSTANCE.accentColor();
        sectionHeader(graphics, x, y, "ETERNAL CORE", "BUILT AS A REAL CLIENT", "Launcher-managed or standalone Fabric mod · same local config");

        int heroY = y + 61;
        EternalUi.glass(graphics, x, heroY, width, 102, accent, true);
        EternalUi.accentRail(graphics, x, heroY, 102, accent, true);
        graphics.drawString(font, "ETERNAL CORE " + EternalCore.VERSION, x + 18, heroY + 17, TEXT, false);
        graphics.drawString(font, "Minecraft Java 1.21.11 · Fabric · Java 21+", x + 18, heroY + 38, MUTED, false);
        graphics.drawString(font, "Persistent modules, keybinds, HUD layout, crosshair and theme settings.", x + 18, heroY + 58, MUTED, false);
        graphics.drawString(font, "No launcher process is required while Minecraft is running.", x + 18, heroY + 75, 0xFF717985, false);

        int rowY = heroY + 119;
        infoRow(graphics, x, rowY, width, "CONFIG", "config/eternal-core.json", accent);
        rowY += 43;
        infoRow(graphics, x, rowY, width, "OPEN KEY", keyName(CoreConfig.INSTANCE.openKey()), accent);
        rowY += 43;
        infoRow(graphics, x, rowY, width, "HUD KEY", keyName(CoreConfig.INSTANCE.hudEditorKey()), accent);
        rowY += 43;
        infoRow(graphics, x, rowY, width, "ZOOM KEY", keyName(CoreConfig.INSTANCE.zoomKey()), accent);
        rowY += 43;
        infoRow(graphics, x, rowY, width, "VIEW KEY", keyName(CoreConfig.INSTANCE.perspectiveKey()), accent);

        String footer = "ORIGINAL ETERNAL UI · LOCAL-FIRST · ATOMIC CONFIG · CLEAN INSTALL MODULES OFF";
        graphics.drawString(font, footer, x, rowY + 57, DIM, false);
    }

    private void moduleCard(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, int height,
                            String name, String description, boolean enabled, int accent) {
        boolean hover = inside(mouseX, mouseY, x, y, width, height);
        EternalUi.glass(graphics, x, y, width, height, accent, hover || enabled);
        EternalUi.accentRail(graphics, x, y, height, accent, enabled);
        graphics.drawString(font, font.plainSubstrByWidth(prettyName(name), width - 52), x + 11, y + 8, enabled ? TEXT : 0xFFD0D4DB, false);
        if (width > 135 && description != null) graphics.drawString(font, font.plainSubstrByWidth(description, width - 52), x + 11, y + 23, enabled ? 0xFF848C97 : DIM, false);
        else graphics.drawString(font, enabled ? "ENABLED" : "DISABLED", x + 11, y + 23, enabled ? 0xFF83DFA0 : DIM, false);
        drawToggle(graphics, x + width - 37, y + 14, enabled, accent);
    }

    private void settingControl(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, String label, String value) {
        int accent = CoreConfig.INSTANCE.accentColor();
        EternalUi.glass(graphics, x, y, width, 28, accent, false);
        graphics.drawString(font, label, x + 10, y + 10, MUTED, false);
        graphics.drawString(font, value, x + width - 95 - font.width(value), y + 10, TEXT, false);
        miniButton(graphics, mouseX, mouseY, x + width - 82, y + 4, 30, 20, "-");
        miniButton(graphics, mouseX, mouseY, x + width - 44, y + 4, 30, 20, "+");
    }

    private void cycleRow(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, String label, String value, int accent) {
        EternalUi.glass(graphics, x, y, width, 31, accent, false);
        graphics.drawString(font, label, x + 10, y + 11, MUTED, false);
        graphics.drawString(font, value, x + width - 122 - font.width(value), y + 11, TEXT, false);
        boolean hover = inside(mouseX, mouseY, x + width - 98, y + 5, 84, 21);
        graphics.fill(x + width - 98, y + 5, x + width - 14, y + 26, hover ? EternalUi.alpha(accent, 48) : 0xFF15191F);
        graphics.renderOutline(x + width - 98, y + 5, 84, 21, hover ? EternalUi.alpha(accent, 116) : 0x3A4A515C);
        graphics.drawCenteredString(font, "CYCLE", x + width - 56, y + 12, hover ? TEXT : MUTED);
    }

    private void toggleSetting(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width,
                               String title, String sub, boolean enabled, int accent) {
        boolean hover = inside(mouseX, mouseY, x, y, width, 32);
        EternalUi.glass(graphics, x, y, width, 32, accent, hover || enabled);
        graphics.drawString(font, title, x + 10, y + 7, enabled ? TEXT : 0xFFD1D5DB, false);
        graphics.drawString(font, sub, x + 128, y + 12, hover ? MUTED : DIM, false);
        drawToggle(graphics, x + width - 40, y + 9, enabled, accent);
    }

    private void keyRow(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width,
                        String id, String key, String action, String target) {
        boolean hover = inside(mouseX, mouseY, x, y, width, 24);
        boolean listening = target.equals(bindingTarget);
        int accent = CoreConfig.INSTANCE.accentColor();
        EternalUi.glass(graphics, x, y, width, 24, accent, listening || hover);
        if (listening) EternalUi.accentRail(graphics, x, y, 24, accent, true);
        graphics.drawString(font, id, x + 9, y + 8, DIM, false);
        graphics.drawString(font, listening ? "PRESS A KEY" : key, x + 60, y + 8, listening ? accent : TEXT, false);
        graphics.drawString(font, action, x + 160, y + 8, MUTED, false);
    }

    private void infoRow(GuiGraphics graphics, int x, int y, int width, String label, String value, int accent) {
        EternalUi.glass(graphics, x, y, width, 34, accent, false);
        graphics.drawString(font, label, x + 11, y + 13, DIM, false);
        graphics.drawString(font, value, x + 132, y + 13, TEXT, false);
        graphics.fill(x + width - 18, y + 15, x + width - 14, y + 19, EternalUi.livingAccent(accent, y));
    }

    private void actionButton(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, int height, String text, boolean primary) {
        int accent = CoreConfig.INSTANCE.accentColor();
        boolean hover = inside(mouseX, mouseY, x, y, width, height);
        int fill = primary ? EternalUi.alpha(accent, hover ? 84 : 60) : hover ? 0xFF181C22 : 0xFF101318;
        graphics.fill(x, y, x + width, y + height, fill);
        graphics.renderOutline(x, y, width, height, primary || hover ? EternalUi.alpha(accent, 122) : 0x3A4A515C);
        graphics.drawCenteredString(font, text, x + width / 2, y + (height - 8) / 2, primary || hover ? TEXT : MUTED);
    }

    private void miniButton(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int width, int height, String text) {
        int accent = CoreConfig.INSTANCE.accentColor();
        boolean hover = inside(mouseX, mouseY, x, y, width, height);
        graphics.fill(x, y, x + width, y + height, hover ? EternalUi.alpha(accent, 55) : 0xFF15191F);
        graphics.renderOutline(x, y, width, height, hover ? EternalUi.alpha(accent, 126) : 0x3C4A525D);
        graphics.drawCenteredString(font, text, x + width / 2, y + 7, hover ? TEXT : MUTED);
    }

    private void drawToggle(GuiGraphics graphics, int x, int y, boolean enabled, int accent) {
        graphics.fill(x, y, x + 28, y + 14, enabled ? EternalUi.alpha(accent, 195) : 0xFF232830);
        graphics.renderOutline(x, y, 28, 14, enabled ? EternalUi.alpha(accent, 136) : 0x4A4A525E);
        int knob = enabled ? x + 17 : x + 2;
        graphics.fill(knob, y + 2, knob + 9, y + 12, enabled ? 0xFFFFFFFF : 0xFFC4C8CF);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        Layout l = layout();
        int mx = viewport().pointer(event.x());
        int my = viewport().pointer(event.y());
        int accent = CoreConfig.INSTANCE.accentColor();

        int navY = l.y + 67;
        for (int i = 0; i < SECTIONS.length; i++) {
            if (inside(mx, my, l.x + 9, navY + i * 48, l.sidebarW - 18, 41)) {
                section = i;
                bindingTarget = null;
                sectionChangedAt = System.currentTimeMillis();
                return true;
            }
        }

        int x = l.contentX;
        int y = l.contentY;
        int width = l.contentW;

        if (section == 0) {
            int columns = 3;
            int gap = 7;
            int cardW = (width - gap * 2) / 3;
            int startY = y + 59;
            for (int i = 0; i < HUD_MODULES.length; i++) {
                int cardX = x + (i % columns) * (cardW + gap);
                int cardY = startY + (i / columns) * 48;
                if (inside(mx, my, cardX, cardY, cardW, 41)) {
                    toggleModule(HUD_MODULES[i]);
                    return true;
                }
            }
            int actionY = startY + ((HUD_MODULES.length + 2) / 3) * 48 + 7;
            if (inside(mx, my, x, actionY, 105, 28)) { CoreConfig.INSTANCE.setAllModules(true); NotificationCenter.push("HUD", "All HUD modules enabled"); return true; }
            if (inside(mx, my, x + 112, actionY, 105, 28)) { CoreConfig.INSTANCE.setAllModules(false); NotificationCenter.push("HUD", "All HUD modules disabled"); return true; }
            if (inside(mx, my, x + 224, actionY, 142, 28)) { Minecraft.getInstance().setScreen(new HudEditorScreen()); return true; }
        } else if (section == 1) {
            int rowY = y + 59;
            for (String name : CLIENT_MODULES) {
                if (inside(mx, my, x, rowY, width, 43)) { toggleModule(name); return true; }
                rowY += 49;
            }
            int keysY = rowY + 9;
            if (inside(mx, my, x, keysY + 18, width, 24)) { bindingTarget = "OPEN"; return true; }
            if (inside(mx, my, x, keysY + 47, width, 24)) { bindingTarget = "HUD"; return true; }
            if (inside(mx, my, x, keysY + 76, width, 24)) { bindingTarget = "ZOOM"; return true; }
            if (inside(mx, my, x, keysY + 105, width, 24)) { bindingTarget = "PERSPECTIVE"; return true; }
        } else if (section == 2) {
            int previewY = y + 58;
            if (inside(mx, my, x, previewY, width, 90)) { toggleModule("Crosshair"); return true; }
            int rowY = previewY + 101;
            if (stepperClick(mx, my, x, rowY, width, () -> CoreConfig.INSTANCE.setCrosshairGap(CoreConfig.INSTANCE.crosshairGap() - 1), () -> CoreConfig.INSTANCE.setCrosshairGap(CoreConfig.INSTANCE.crosshairGap() + 1))) return true;
            rowY += 34;
            if (stepperClick(mx, my, x, rowY, width, () -> CoreConfig.INSTANCE.setCrosshairLength(CoreConfig.INSTANCE.crosshairLength() - 1), () -> CoreConfig.INSTANCE.setCrosshairLength(CoreConfig.INSTANCE.crosshairLength() + 1))) return true;
            rowY += 34;
            if (stepperClick(mx, my, x, rowY, width, () -> CoreConfig.INSTANCE.setCrosshairThickness(CoreConfig.INSTANCE.crosshairThickness() - 1), () -> CoreConfig.INSTANCE.setCrosshairThickness(CoreConfig.INSTANCE.crosshairThickness() + 1))) return true;
            rowY += 38;
            if (inside(mx, my, x, rowY, width, 32)) { CoreConfig.INSTANCE.setCrosshairDot(!CoreConfig.INSTANCE.crosshairDot()); return true; }
            rowY += 37;
            if (inside(mx, my, x, rowY, width, 32)) { CoreConfig.INSTANCE.setCrosshairOutline(!CoreConfig.INSTANCE.crosshairOutline()); return true; }
            rowY += 43;
            if (stepperClick(mx, my, x, rowY, width, () -> CoreConfig.INSTANCE.setZoomFov(CoreConfig.INSTANCE.zoomFov() - 5), () -> CoreConfig.INSTANCE.setZoomFov(CoreConfig.INSTANCE.zoomFov() + 5))) return true;
            rowY += 34;
            if (stepperClick(mx, my, x, rowY, width, () -> CoreConfig.INSTANCE.setZoomSpeed(CoreConfig.INSTANCE.zoomSpeed() - 1), () -> CoreConfig.INSTANCE.setZoomSpeed(CoreConfig.INSTANCE.zoomSpeed() + 1))) return true;
            rowY += 38;
            if (inside(mx, my, x, rowY, width, 32)) { CoreConfig.INSTANCE.setSmoothZoom(!CoreConfig.INSTANCE.smoothZoom()); return true; }
        } else if (section == 4) {
            for (int i = 0; i < COMBAT_PRESETS.length; i++) {
                if (inside(mx, my, x, y + 59 + i * 55, width, 47)) {
                    CoreConfig.INSTANCE.applyCombatPreset(COMBAT_PRESETS[i]);
                    NotificationCenter.push("COMBAT", COMBAT_PRESETS[i].toUpperCase() + " preset applied");
                    return true;
                }
            }
        } else if (section == 3) {
            int rowY = y + 62;
            for (int i = 0; i < ACCENTS.length; i++) {
                int sx = x + 74 + i * 39;
                if (inside(mx, my, sx - 1, rowY - 7, 30, 30)) { CoreConfig.INSTANCE.setAccentColor(ACCENTS[i]); return true; }
            }
            rowY += 48;
            if (stepperClick(mx, my, x, rowY, width, () -> CoreConfig.INSTANCE.setHudAlpha(CoreConfig.INSTANCE.hudAlpha() - 16), () -> CoreConfig.INSTANCE.setHudAlpha(CoreConfig.INSTANCE.hudAlpha() + 16))) return true;
            rowY += 36;
            if (inside(mx, my, x + width - 98, rowY + 5, 84, 21)) {
                int snap = CoreConfig.INSTANCE.snap();
                CoreConfig.INSTANCE.setSnap(snap == 2 ? 4 : snap == 4 ? 8 : 2);
                return true;
            }
            rowY += 43;
            if (inside(mx, my, x, rowY, width, 32)) { CoreConfig.INSTANCE.setTextShadow(!CoreConfig.INSTANCE.textShadow()); return true; }
            rowY += 39;
            if (inside(mx, my, x, rowY, width, 32)) { CoreConfig.INSTANCE.setGradientHud(!CoreConfig.INSTANCE.gradientHud()); return true; }
            rowY += 39;
            if (inside(mx, my, x, rowY, width, 32)) { CoreConfig.INSTANCE.setNotifications(!CoreConfig.INSTANCE.notifications()); if (CoreConfig.INSTANCE.notifications()) NotificationCenter.push("NOTIFICATIONS", "Enabled"); return true; }
            rowY += 48;
            if (inside(mx, my, x, rowY + 18, 88, 28)) { CoreConfig.INSTANCE.applyPreset("DEFAULT", this.width, height); NotificationCenter.push("HUD PRESET", "Default layout applied"); return true; }
            if (inside(mx, my, x + 95, rowY + 18, 88, 28)) { CoreConfig.INSTANCE.applyPreset("COMPACT", this.width, height); NotificationCenter.push("HUD PRESET", "Compact layout applied"); return true; }
            if (inside(mx, my, x + 190, rowY + 18, 88, 28)) { CoreConfig.INSTANCE.applyPreset("CORNERS", this.width, height); NotificationCenter.push("HUD PRESET", "Corners layout applied"); return true; }
            if (inside(mx, my, x + 288, rowY + 18, 138, 28)) { Minecraft.getInstance().setScreen(new HudEditorScreen()); return true; }
        }
        return super.mouseClicked(event, doubleClick);
    }

    private boolean stepperClick(int mx, int my, int x, int y, int width, Runnable minus, Runnable plus) {
        if (inside(mx, my, x + width - 82, y + 4, 30, 20)) { minus.run(); return true; }
        if (inside(mx, my, x + width - 44, y + 4, 30, 20)) { plus.run(); return true; }
        return false;
    }

    private void toggleModule(String name) {
        CoreConfig.INSTANCE.toggle(name);
        NotificationCenter.push(prettyName(name), CoreConfig.INSTANCE.on(name) ? "Enabled" : "Disabled");
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

    private MenuViewport viewport() { return MenuViewport.fit(width, height, 960, 560); }

    private Layout layout() {
        int width = viewport().width();
        int height = viewport().height();
        int panelW = Math.min(930, Math.max(560, width - 16));
        int panelH = Math.min(520, Math.max(420, height - 16));
        int x = (width - panelW) / 2;
        int y = (height - panelH) / 2;
        int sidebarW = 146;
        int contentX = x + sidebarW + 18;
        int contentY = y + 62;
        int contentW = panelW - sidebarW - 36;
        return new Layout(x, y, panelW, panelH, sidebarW, contentX, contentY, contentW);
    }

    private static String prettyName(String name) {
        return switch (name) {
            case "ToggleSprint" -> "TOGGLE SPRINT";
            case "ToggleSneak" -> "TOGGLE SNEAK";
            default -> name.toUpperCase();
        };
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

    private record Layout(int x, int y, int w, int h, int sidebarW, int contentX, int contentY, int contentW) {}

    @Override
    public boolean isPauseScreen() { return false; }
}
