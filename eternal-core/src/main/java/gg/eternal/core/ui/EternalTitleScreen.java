package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.gui.screens.options.OptionsScreen;
import net.minecraft.network.chat.Component;

public final class EternalTitleScreen extends Screen {
    public EternalTitleScreen() { super(Component.literal("Eternal Client")); }
    @Override protected void init() {
        int w = Math.min(244, width - 40), x = (width - w) / 2;
        int h = height < 300 ? 20 : 26, gap = height < 300 ? 4 : 6;
        int top = Math.max(55, (height - (h + gap) * 6) / 2);
        add(x, top, w, h, "Singleplayer", true, () -> minecraft.setScreen(new EternalWorldScreen(this)));
        add(x, top + (h + gap), w, h, "Multiplayer", true, () -> minecraft.setScreen(new EternalServerScreen(this)));
        add(x, top + (h + gap) * 2, (w - 6) / 2, h, "Modules", false, () -> minecraft.setScreen(new ModuleLibraryScreen(this)));
        add(x + (w + 6) / 2, top + (h + gap) * 2, (w - 6) / 2, h, "HUD editor", false, () -> minecraft.setScreen(new HudEditorScreen()));
        add(x, top + (h + gap) * 3, w, h, "Installed mods", false, () -> minecraft.setScreen(new LoadedModsScreen(this)));
        add(x, top + (h + gap) * 4, w, h, "Minecraft settings", false, () -> minecraft.setScreen(new OptionsScreen(this, minecraft.options)));
        add(x, top + (h + gap) * 5, w, h, "Quit game", false, () -> minecraft.stop());
    }
    private void add(int x, int y, int w, int h, String title, boolean primary, Runnable action) {
        addRenderableWidget(new EternalButton(x, y, w, h, title, primary, action));
    }
    @Override public void renderBackground(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        EternalUi.landscape(graphics, width, height);
        graphics.fill(0, 0, width, height, 0x65070A10);
        graphics.fill(width / 2 - Math.min(148, width / 2), 0, width / 2 + Math.min(148, width / 2), height, 0x680D1118);
    }
    @Override public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        graphics.pose().pushMatrix();
        graphics.pose().translate(width / 2.0F, height < 300 ? 17.0F : Math.max(20, height / 2 - 150));
        graphics.pose().scale(2.0F, 2.0F);
        graphics.drawCenteredString(font, "ETERNAL", 0, 0, 0xFFF5F6FA);
        graphics.pose().popMatrix();
        graphics.drawCenteredString(font, "C L I E N T", width / 2, height < 300 ? 39 : Math.max(44, height / 2 - 124), 0xFFFF6171);
        graphics.drawString(font, "ETERNAL " + EternalCore.VERSION, 10, height - 12, EternalUi.TEXT, false);
        String user = minecraft.getUser().getName();
        graphics.drawString(font, user, width - 10 - font.width(user), height - 12, EternalUi.TEXT, false);
        super.render(graphics, mouseX, mouseY, delta);
    }
    @Override public boolean shouldCloseOnEsc() { return false; }
}
