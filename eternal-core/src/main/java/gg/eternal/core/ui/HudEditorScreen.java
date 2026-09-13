package gg.eternal.core.ui;

import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.input.KeyEvent;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

public final class HudEditorScreen extends Screen {
    private String draggingModule;
    private int dragOffsetX;
    private int dragOffsetY;

    public HudEditorScreen() {
        super(Component.literal("Eternal HUD Editor"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        renderBackground(graphics, mouseX, mouseY, delta);
        graphics.fill(0, 0, width, 44, 0xE6080809);
        graphics.drawCenteredString(font, "ETERNAL HUD EDITOR", width / 2, 12, 0xFFFF525A);
        graphics.drawCenteredString(font, "Drag enabled modules · 4px snap · R resets layout", width / 2, 25, 0xFF77777E);

        int fallbackIndex = 0;
        for (String name : HudRenderer.modules()) {
            if (!CoreConfig.INSTANCE.on(name)) continue;

            int[] position = CoreConfig.INSTANCE.pos(name, 12, 52 + fallbackIndex * 22);
            String value = HudRenderer.value(name);
            int boxWidth = font.width(value) + 16;
            boolean dragging = name.equals(draggingModule);
            boolean hover = mouseX >= position[0] && mouseX <= position[0] + boxWidth
                    && mouseY >= position[1] && mouseY <= position[1] + 20;

            graphics.fill(position[0], position[1], position[0] + boxWidth, position[1] + 20,
                    dragging ? 0xEE240B0D : hover ? 0xE6171719 : 0xD80A0B0D);
            graphics.fill(position[0], position[1], position[0] + 2, position[1] + 20, 0xFFFF303A);
            graphics.renderOutline(position[0], position[1], boxWidth, 20,
                    dragging ? 0xFFFF5962 : 0x55FFFFFF);
            graphics.drawString(font, value, position[0] + 8, position[1] + 6, 0xFFFFFFFF, false);
            fallbackIndex++;
        }

        graphics.drawString(font, "R  RESET LAYOUT", 12, height - 20, 0xFF8A8A91, false);
        super.render(graphics, mouseX, mouseY, delta);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        int fallbackIndex = 0;
        for (String name : HudRenderer.modules()) {
            if (!CoreConfig.INSTANCE.on(name)) continue;

            int[] position = CoreConfig.INSTANCE.pos(name, 12, 52 + fallbackIndex * 22);
            int boxWidth = font.width(HudRenderer.value(name)) + 16;
            if (event.x() >= position[0] && event.x() <= position[0] + boxWidth
                    && event.y() >= position[1] && event.y() <= position[1] + 20) {
                draggingModule = name;
                dragOffsetX = (int) event.x() - position[0];
                dragOffsetY = (int) event.y() - position[1];
                return true;
            }
            fallbackIndex++;
        }
        return super.mouseClicked(event, doubleClick);
    }

    @Override
    public boolean mouseDragged(MouseButtonEvent event, double dragX, double dragY) {
        if (draggingModule != null) {
            int x = Math.round(((float) event.x() - dragOffsetX) / 4.0F) * 4;
            int y = Math.round(((float) event.y() - dragOffsetY) / 4.0F) * 4;
            CoreConfig.INSTANCE.setPos(
                    draggingModule,
                    Math.max(0, Math.min(width - 20, x)),
                    Math.max(44, Math.min(height - 20, y))
            );
            return true;
        }
        return super.mouseDragged(event, dragX, dragY);
    }

    @Override
    public boolean mouseReleased(MouseButtonEvent event) {
        if (draggingModule != null) {
            draggingModule = null;
            return true;
        }
        return super.mouseReleased(event);
    }

    @Override
    public boolean keyPressed(KeyEvent event) {
        if (event.key() == 82) { // GLFW_KEY_R
            CoreConfig.INSTANCE.reset();
            return true;
        }
        return super.keyPressed(event);
    }

    @Override
    public boolean isPauseScreen() {
        return false;
    }
}
