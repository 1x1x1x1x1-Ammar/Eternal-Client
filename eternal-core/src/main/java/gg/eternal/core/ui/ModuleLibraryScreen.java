package gg.eternal.core.ui;

import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.config.ModuleSettings;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.EditBox;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

public final class ModuleLibraryScreen extends EternalScreen {
    private String query = "";
    private int category, page;
    private List<String> shown = List.of();
    private int columns, rows, cardWidth;
    private EternalButton categoryButton;
    private static final String[] CATEGORIES = {"All modules", "Combat", "HUD", "Movement", "Visual", "Performance", "Utilities"};
    public ModuleLibraryScreen(Screen parent) { super("Modules", parent); }
    @Override protected void init() {
        clearWidgets();
        columns = Math.max(1, Math.min(4, (width - 24) / 172));
        rows = Math.max(1, (height - 156) / 76);
        cardWidth = (width - 24 - (columns - 1) * 8) / columns;
        int controls = width < 420 ? 92 : 130;
        var search = new EditBox(font, 12, 44, Math.max(70, width - controls - 32), 20, Component.literal("Search modules"));
        search.setHint(Component.literal("Search modules..."));
        search.setValue(query);
        search.setResponder(value -> { query = value; page = 0; rebuildCards(); });
        addRenderableWidget(search);
        categoryButton = button(width - controls - 12, 43, controls, CATEGORIES[category], false, () -> { category = (category + 1) % CATEGORIES.length; page = 0; init(); });
        rebuildCards();
    }
    private void rebuildCards() {
        // Preserve the search field and category selector while replacing only the grid and footer.
        for (var child : List.copyOf(children())) if (child instanceof EternalButton && child != categoryButton) removeWidget(child);
        shown = Arrays.stream(CoreConfig.MODULES).filter(name -> name.toLowerCase(Locale.ROOT).contains(query.toLowerCase(Locale.ROOT)))
                .filter(name -> matchesCategory(name)).toList();
        int presetWidth = (width - 40) / 5;
        String[] presets = {"sword", "mace", "spear", "crystal", "cart"};
        for (int i = 0; i < presets.length; i++) {
            String preset = presets[i];
            button(12 + i * (presetWidth + 4), 72, presetWidth, preset.substring(0, 1).toUpperCase(Locale.ROOT) + preset.substring(1),
                CoreConfig.INSTANCE.combatPreset().equals(preset), () -> { CoreConfig.INSTANCE.applyCombatPreset(preset); rebuildCards(); });
        }
        int size = columns * rows;
        page = Math.max(0, Math.min(page, Math.max(0, (shown.size() - 1) / size)));
        for (int i = page * size; i < Math.min(shown.size(), (page + 1) * size); i++) {
            String name = shown.get(i);
            int index = i - page * size, x = 12 + index % columns * (cardWidth + 8), y = 102 + index / columns * 76;
            button(x + 8, y + 45, Math.max(50, cardWidth - 91), CoreConfig.INSTANCE.on(name) ? "Enabled" : "Disabled", CoreConfig.INSTANCE.on(name), () -> { CoreConfig.INSTANCE.toggle(name); rebuildCards(); });
            button(x + cardWidth - 76, y + 45, 68, "Settings", false, () -> minecraft.setScreen(new ModuleSettingsScreen(this, name)));
        }
        int w = Math.max(36, Math.min(88, (width - 40) / 5));
        button(8, height - 27, w, "Back", false, this::onClose);
        button(12 + w, height - 27, w, "Mods", false, () -> minecraft.setScreen(new LoadedModsScreen(this)));
        button(16 + w * 2, height - 27, w, "Advanced", false, () -> minecraft.setScreen(new ClickGuiScreen()));
        var previous = button(width - w * 2 - 12, height - 27, w, "<", false, () -> { page--; rebuildCards(); }); previous.active = page > 0;
        var next = button(width - w - 8, height - 27, w, ">", false, () -> { page++; rebuildCards(); }); next.active = (page + 1) * size < shown.size();
    }
    private boolean matchesCategory(String name) {
        return switch (category) {
            case 1 -> java.util.Set.of("AttackCooldown", "HeldItem", "ArmorDurability", "Offhand", "Movement", "CombatSupplies", "TargetDistance").contains(name);
            case 2 -> ModuleSettings.hud(name);
            case 3 -> java.util.Set.of("ToggleSprint", "ToggleSneak", "SprintStatus", "Movement", "Speed").contains(name);
            case 4 -> java.util.Set.of("Crosshair", "Fullbright", "Perspective", "Zoom").contains(name);
            case 5 -> java.util.Set.of("FPSOptimizer", "ReducedMotion", "FPS", "Memory").contains(name);
            case 6 -> !ModuleSettings.hud(name);
            default -> true;
        };
    }
    @Override public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        int size = columns * rows;
        for (int i = page * size; i < Math.min(shown.size(), (page + 1) * size); i++) {
            int index = i - page * size, x = 12 + index % columns * (cardWidth + 8), y = 102 + index / columns * 76;
            graphics.fill(x, y, x + cardWidth, y + 70, 0xED161B23);
            graphics.renderOutline(x, y, cardWidth, 70, 0xFF343B46);
            String name = shown.get(i);
            graphics.renderItem(new net.minecraft.world.item.ItemStack(ModulePresentation.icon(name)), x + 8, y + 8);
            graphics.drawString(font, font.plainSubstrByWidth(ModulePresentation.label(name), cardWidth - 38), x + 30, y + 10, EternalUi.TEXT, false);
            graphics.drawString(font, font.plainSubstrByWidth(ModulePresentation.description(name), cardWidth - 16), x + 8, y + 29, EternalUi.MUTED, false);
        }
        if (shown.isEmpty()) graphics.drawCenteredString(font, "No matching modules", width / 2, 112, EternalUi.MUTED);
        super.render(graphics, mouseX, mouseY, delta);
    }
    @Override public boolean mouseScrolled(double x, double y, double horizontal, double vertical) {
        if (vertical != 0) { page += vertical < 0 ? 1 : -1; rebuildCards(); return true; }
        return super.mouseScrolled(x, y, horizontal, vertical);
    }
}
