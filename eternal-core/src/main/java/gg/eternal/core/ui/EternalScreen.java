package gg.eternal.core.ui;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;

/** Uses native GUI coordinates so text and hit targets follow every Minecraft GUI scale. */
public abstract class EternalScreen extends Screen {
    protected final Screen parent;
    protected EternalScreen(String title, Screen parent) { super(Component.literal(title)); this.parent = parent; }
    protected EternalButton button(int x, int y, int w, String label, boolean primary, Runnable action) {
        return addRenderableWidget(new EternalButton(x, y, Math.max(20, w), 22, label, primary, action));
    }
    @Override public void renderBackground(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        if (minecraft.level == null) EternalUi.landscape(graphics, width, height);
        graphics.fill(0, 0, width, height, minecraft.level == null ? 0xC50B0D12 : 0x990B0D12);
    }
    @Override public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        graphics.fill(0, 0, width, 36, 0xEE11151B);
        graphics.fill(0, 35, width, 36, 0xFF88313C);
        graphics.drawString(font, font.plainSubstrByWidth("ETERNAL / " + title.getString(), width - 24), 12, 14, EternalUi.TEXT, false);
        graphics.fill(0, height - 34, width, height, 0xEE11151B);
        super.render(graphics, mouseX, mouseY, delta);
    }
    @Override public void onClose() { minecraft.setScreen(parent); }
    @Override public boolean isPauseScreen() { return false; }
}
