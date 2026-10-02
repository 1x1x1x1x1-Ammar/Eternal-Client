package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.input.KeyEvent;
import java.util.ArrayList;
import java.util.function.IntConsumer;

/** Native buttons share Minecraft's layout, focus and pointer coordinate system. */
public final class ClickGuiScreen extends EternalScreen {
    private static final String[] SECTIONS = {"HUD", "CLIENT", "VISUAL", "STYLE", "COMBAT", "ABOUT"};
    private static final int[] ACCENTS = {0xFFFF3038, 0xFFFF6B35, 0xFF8B5CF6, 0xFF3B82F6, 0xFF22C55E};
    private final ArrayList<Row> entries = new ArrayList<>();
    private int section, page;
    private String bindingTarget;
    private MenuLayout layout;
    private record Row(String label, String value, Runnable action, Runnable minus, Runnable plus, boolean active) {}

    public ClickGuiScreen() { super("Customization studio", Minecraft.getInstance().screen); }

    @Override protected void init() {
        clearWidgets();
        layout = MenuLayout.list(width, height, 76, 30);
        entries.clear();
        populate();
        page = layout.clampPage(page, entries.size());
        int tabWidth = (width - 24 - 5 * 4) / 6;
        for (int i = 0; i < SECTIONS.length; i++) {
            int target = i;
            button(12 + i * (tabWidth + 4), 44, tabWidth, SECTIONS[i], section == i,
                () -> { section = target; page = 0; bindingTarget = null; init(); });
        }
        for (int i = page * layout.rows(); i < Math.min(entries.size(), (page + 1) * layout.rows()); i++) {
            Row row = entries.get(i);
            int y = layout.cellY(i - page * layout.rows());
            int controlX = width / 2, controlWidth = width - 12 - controlX;
            if (row.minus != null) {
                button(controlX, y, 24, "-", false, () -> { row.minus.run(); init(); });
                button(width - 36, y, 24, "+", false, () -> { row.plus.run(); init(); });
            } else if (row.action != null) {
                button(controlX, y, controlWidth, row.value, row.active, () -> { row.action.run(); if (minecraft.screen == this) init(); });
            }
        }
        button(12, height - 27, 66, "Back", false, this::onClose);
        button(84, height - 27, Math.min(98, width - 220), "All modules", false,
            () -> minecraft.setScreen(new ModuleLibraryScreen(this)));
        var previous = button(width - 116, height - 27, 48, "<", false, () -> { page--; init(); });
        previous.active = page > 0;
        var next = button(width - 60, height - 27, 48, ">", false, () -> { page++; init(); });
        next.active = page + 1 < layout.pages(entries.size());
    }

    private void populate() {
        var c = CoreConfig.INSTANCE;
        switch (section) {
            case 0 -> {
                action("HUD editor", "Open", () -> minecraft.setScreen(new HudEditorScreen()));
                action("All HUD widgets", "Enable all", () -> c.setAllModules(true));
                action("All HUD widgets", "Disable all", () -> c.setAllModules(false));
                for (String module : HudRenderer.modules()) module(module);
            }
            case 1 -> {
                for (String module : new String[]{"Zoom", "Fullbright", "ToggleSprint", "ToggleSneak", "Perspective"}) module(module);
                key("OPEN", "Open Eternal Start", c.openKey());
                key("HUD", "Open HUD editor", c.hudEditorKey());
                key("ZOOM", "Hold to zoom", c.zoomKey());
                key("PERSPECTIVE", "Cycle perspective", c.perspectiveKey());
            }
            case 2 -> {
                module("Crosshair");
                number("Crosshair gap", c.crosshairGap(), 1, c::setCrosshairGap);
                number("Crosshair length", c.crosshairLength(), 1, c::setCrosshairLength);
                number("Crosshair thickness", c.crosshairThickness(), 1, c::setCrosshairThickness);
                toggle("Center dot", c.crosshairDot(), () -> c.setCrosshairDot(!c.crosshairDot()));
                toggle("Crosshair outline", c.crosshairOutline(), () -> c.setCrosshairOutline(!c.crosshairOutline()));
                action("Crosshair colors", "Settings", () -> minecraft.setScreen(new ModuleSettingsScreen(this, "Crosshair")));
                number("Zoom FOV", c.zoomFov(), 5, c::setZoomFov);
                number("Zoom speed", c.zoomSpeed(), 1, c::setZoomSpeed);
                toggle("Smooth zoom", c.smoothZoom(), () -> c.setSmoothZoom(!c.smoothZoom()));
            }
            case 3 -> {
                action("Accent color", String.format("#%06X", c.accentColor() & 0xFFFFFF), () -> {
                    int index = -1;
                    for (int i = 0; i < ACCENTS.length; i++) if (ACCENTS[i] == c.accentColor()) index = i;
                    c.setAccentColor(ACCENTS[(index + 1) % ACCENTS.length]);
                });
                number("HUD opacity", c.hudAlpha(), 16, c::setHudAlpha);
                action("Snap grid", c.snap() + " px", () -> c.setSnap(c.snap() == 2 ? 4 : c.snap() == 4 ? 8 : 2));
                toggle("Text shadow", c.textShadow(), () -> c.setTextShadow(!c.textShadow()));
                toggle("Animated accent", c.gradientHud(), () -> c.setGradientHud(!c.gradientHud()));
                toggle("Notifications", c.notifications(), () -> c.setNotifications(!c.notifications()));
                for (String preset : new String[]{"DEFAULT", "COMPACT", "CORNERS"})
                    action("HUD layout", preset, () -> c.applyPreset(preset, width, height));
                action("HUD editor", "Open", () -> minecraft.setScreen(new HudEditorScreen()));
            }
            case 4 -> {
                for (String preset : new String[]{"sword", "mace", "spear", "crystal", "cart"})
                    entries.add(new Row(preset.substring(0, 1).toUpperCase() + preset.substring(1),
                        c.combatPreset().equals(preset) ? "Applied" : "Apply preset", () -> c.applyCombatPreset(preset), null, null, c.combatPreset().equals(preset)));
            }
            default -> {
                info("Eternal Core", EternalCore.VERSION);
                info("Minecraft", "1.21.11 / Fabric");
                info("Player", minecraft.getUser().getName());
                info("Java", System.getProperty("java.version"));
                action("Installed mods", "View", () -> minecraft.setScreen(new LoadedModsScreen(this)));
            }
        }
    }

    private void module(String name) { toggle(ModulePresentation.label(name), CoreConfig.INSTANCE.on(name), () -> CoreConfig.INSTANCE.toggle(name)); }
    private void toggle(String label, boolean on, Runnable action) { entries.add(new Row(label, on ? "Enabled" : "Disabled", action, null, null, on)); }
    private void action(String label, String value, Runnable action) { entries.add(new Row(label, value, action, null, null, false)); }
    private void info(String label, String value) { entries.add(new Row(label, value, null, null, null, false)); }
    private void number(String label, int value, int step, IntConsumer setter) {
        entries.add(new Row(label, Integer.toString(value), null, () -> setter.accept(value - step), () -> setter.accept(value + step), false));
    }
    private void key(String target, String label, int value) {
        action(label, target.equals(bindingTarget) ? "Press a key..." : keyName(value), () -> bindingTarget = target);
    }

    @Override public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        for (int i = page * layout.rows(); i < Math.min(entries.size(), (page + 1) * layout.rows()); i++) {
            Row row = entries.get(i);
            int y = layout.cellY(i - page * layout.rows());
            graphics.fill(12, y - 2, width - 12, y + 26, 0xDF161A20);
            graphics.drawString(font, font.plainSubstrByWidth(row.label, width / 2 - 30), 20, y + 7, EternalUi.TEXT, false);
            if (row.action == null) graphics.drawCenteredString(font,
                font.plainSubstrByWidth(row.value, width / 2 - (row.minus != null ? 70 : 24)), (width / 2 + width - 12) / 2, y + 7, EternalUi.MUTED);
        }
        String status = bindingTarget != null ? "Press a key / Esc cancels" : "Page " + (page + 1) + " / " + layout.pages(entries.size()) + " - changes save immediately";
        graphics.drawString(font, font.plainSubstrByWidth(status, width - 24), 12, height - 46, EternalUi.MUTED, false);
        super.render(graphics, mouseX, mouseY, delta);
    }

    @Override public boolean mouseScrolled(double x, double y, double horizontal, double vertical) {
        if (vertical == 0) return false;
        page += vertical < 0 ? 1 : -1;
        init(); return true;
    }

    @Override public boolean keyPressed(KeyEvent event) {
        if (bindingTarget == null) return super.keyPressed(event);
        int key = event.key();
        if (key == 256) { bindingTarget = null; init(); return true; }
        if (key < 32 || key > 348) return true;
        if (keyInUseByOther(bindingTarget, key)) {
            NotificationCenter.push("KEYBIND", keyName(key) + " is already assigned"); return true;
        }
        var c = CoreConfig.INSTANCE;
        switch (bindingTarget) {
            case "OPEN" -> c.setOpenKey(key);
            case "HUD" -> c.setHudEditorKey(key);
            case "ZOOM" -> c.setZoomKey(key);
            case "PERSPECTIVE" -> c.setPerspectiveKey(key);
        }
        bindingTarget = null; init(); return true;
    }

    private boolean keyInUseByOther(String target, int key) {
        var c = CoreConfig.INSTANCE;
        if ((!"OPEN".equals(target) && c.openKey() == key) || (!"HUD".equals(target) && c.hudEditorKey() == key)
            || (!"ZOOM".equals(target) && c.zoomKey() == key) || (!"PERSPECTIVE".equals(target) && c.perspectiveKey() == key)) return true;
        for (String module : CoreConfig.MODULES) if (c.number(module, "keybind") == key) return true;
        return false;
    }

    public static String keyName(int key) {
        if (key >= 65 && key <= 90 || key >= 48 && key <= 57) return Character.toString((char) key);
        if (key >= 290 && key <= 314) return "F" + (key - 289);
        return switch (key) {
            case 0 -> "None"; case 32 -> "Space"; case 256 -> "Esc"; case 257 -> "Enter";
            case 258 -> "Tab"; case 259 -> "Backspace"; case 260 -> "Insert"; case 261 -> "Delete";
            case 262 -> "Right"; case 263 -> "Left"; case 264 -> "Down"; case 265 -> "Up";
            case 340 -> "Left Shift"; case 341 -> "Left Ctrl"; case 342 -> "Left Alt";
            case 344 -> "Right Shift"; case 345 -> "Right Ctrl"; case 346 -> "Right Alt";
            default -> "Key " + key;
        };
    }
}
