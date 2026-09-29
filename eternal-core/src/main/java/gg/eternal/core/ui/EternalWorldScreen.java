package gg.eternal.core.ui;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.gui.screens.worldselection.SelectWorldScreen;

/** Keeps native selection, creation, confirmation and connection behavior. */
public final class EternalWorldScreen extends SelectWorldScreen {
    public EternalWorldScreen(Screen parent) { super(parent); }
    @Override public void renderBackground(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        EternalUi.landscape(graphics, width, height);
        graphics.fill(0, 0, width, height, 0xAB090D15);
        graphics.fill(0, 0, width, 33, 0xEE121720);
        graphics.fill(0, 32, width, 33, 0xFFC6384D);
        graphics.fill(0, height - 64, width, height, 0xEE121720);
    }
}
