package gg.eternal.core.ui;

import gg.eternal.core.config.CoreConfig;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

public final class ClickGuiScreen extends Screen {
    private static final int WIDTH = 420;
    private static final int HEIGHT = 280;
    private static final int ROW_HEIGHT = 24;

    public ClickGuiScreen() {
        super(Component.literal("Eternal Client"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        renderBackground(graphics, mouseX, mouseY, delta);

        int x = (width - WIDTH) / 2;
        int y = (height - HEIGHT) / 2;

        graphics.fill(x, y, x + WIDTH, y + HEIGHT, 0xF20A0A0B);
        graphics.renderOutline(x, y, WIDTH, HEIGHT, 0x66FF2E38);
        graphics.fill(x, y, x + WIDTH, y + 3, 0xFFFF202B);

        graphics.drawString(font, "ETERNAL", x + 16, y + 16, 0xFFFFFFFF, false);
        graphics.drawString(font, "IN-GAME CLIENT", x + 16, y + 31, 0xFFFF515A, false);
        graphics.drawString(font, "Click a module to toggle it", x + 250, y + 18, 0xFF78787F, false);

        int rowY = y + 58;
        int index = 0;
        for (var entry : CoreConfig.INSTANCE.enabled.entrySet()) {
            int currentY = rowY + index * ROW_HEIGHT;
            boolean enabled = entry.getValue();
            boolean hover = mouseX >= x + 16 && mouseX <= x + WIDTH - 16
                    && mouseY >= currentY && mouseY < currentY + 20;

            graphics.fill(x + 16, currentY, x + WIDTH - 16, currentY + 20,
                    hover ? 0xFF171719 : 0xFF101012);
            if (enabled) {
                graphics.fill(x + 16, currentY, x + 19, currentY + 20, 0xFFFF202B);
            }
            graphics.drawString(font, entry.getKey(), x + 28, currentY + 6,
                    enabled ? 0xFFFFFFFF : 0xFF7B7B82, false);
            graphics.drawString(font, enabled ? "ON" : "OFF", x + WIDTH - 48, currentY + 6,
                    enabled ? 0xFFFF5962 : 0xFF64646B, false);
            index++;
        }

        super.render(graphics, mouseX, mouseY, delta);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        int x = (width - WIDTH) / 2;
        int firstRowY = (height - HEIGHT) / 2 + 58;
        int index = (int) ((event.y() - firstRowY) / ROW_HEIGHT);

        if (event.x() >= x + 16 && event.x() <= x + WIDTH - 16
                && event.y() >= firstRowY
                && index >= 0 && index < CoreConfig.INSTANCE.enabled.size()) {
            String name = CoreConfig.INSTANCE.enabled.keySet().toArray(String[]::new)[index];
            CoreConfig.INSTANCE.toggle(name);
            return true;
        }

        return super.mouseClicked(event, doubleClick);
    }

    @Override
    public boolean isPauseScreen() {
        return false;
    }
}
