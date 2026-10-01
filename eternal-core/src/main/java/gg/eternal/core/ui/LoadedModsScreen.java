package gg.eternal.core.ui;

import net.fabricmc.loader.api.FabricLoader;
import net.fabricmc.loader.api.ModContainer;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.EditBox;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

public final class LoadedModsScreen extends EternalScreen {
    private String query = "";
    private int page, rows;
    private List<ModContainer> mods = List.of();
    public LoadedModsScreen(Screen parent) { super("Installed mods", parent); }
    @Override protected void init() {
        clearWidgets();
        rows = MenuLayout.list(width, height, 76, 34).rows();
        var search = new EditBox(font, 12, 44, width - 24, 20, Component.literal("Search installed mods"));
        search.setHint(Component.literal("Search loaded Fabric mods...")); search.setValue(query);
        search.setResponder(value -> { query = value; page = 0; updateList(); }); addRenderableWidget(search);
        updateList();
        page = Math.min(page, Math.max(0, (mods.size() - 1) / rows));
        button(12, height - 27, 72, "Back", false, this::onClose);
        button(width - 116, height - 27, 48, "<", false, () -> { page = Math.max(0, page - 1); });
        button(width - 60, height - 27, 48, ">", false, () -> { page = Math.min(Math.max(0, (mods.size() - 1) / rows), page + 1); });
    }
    private void updateList() {
        mods = FabricLoader.getInstance().getAllMods().stream()
            .filter(mod -> (mod.getMetadata().getName() + " " + mod.getMetadata().getId()).toLowerCase(Locale.ROOT).contains(query.toLowerCase(Locale.ROOT)))
            .sorted(Comparator.comparing(mod -> mod.getMetadata().getName().toLowerCase(Locale.ROOT))).toList();
    }
    @Override public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        for (int i = page * rows; i < Math.min(mods.size(), (page + 1) * rows); i++) {
            int y = 76 + (i - page * rows) * 34; var metadata = mods.get(i).getMetadata();
            graphics.fill(12, y, width - 12, y + 29, 0xEE181D25);
            graphics.fill(12, y, 14, y + 29, 0xFFCF394E);
            graphics.drawString(font, font.plainSubstrByWidth(metadata.getName() + "  " + metadata.getVersion().getFriendlyString(), width - 42), 21, y + 4, EternalUi.TEXT, false);
            graphics.drawString(font, font.plainSubstrByWidth(metadata.getDescription().replace('\n', ' '), width - 42), 21, y + 16, EternalUi.MUTED, false);
        }
        graphics.drawString(font, font.plainSubstrByWidth(mods.size() + " loaded · manage files in launcher Mod Hub", width - 24), 12, height - 45, EternalUi.MUTED, false);
        super.render(graphics, mouseX, mouseY, delta);
    }
    @Override public boolean mouseScrolled(double x, double y, double horizontal, double vertical) {
        page = Math.max(0, Math.min(Math.max(0, (mods.size() - 1) / rows), page + (vertical < 0 ? 1 : -1)));
        return true;
    }
}
