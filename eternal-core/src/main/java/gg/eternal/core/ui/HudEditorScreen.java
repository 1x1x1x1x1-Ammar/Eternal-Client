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
    private String selectedModule;
    private int dragOffsetX;
    private int dragOffsetY;

    public HudEditorScreen() {
        super(Component.literal("Eternal HUD Editor"));
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        renderBackground(graphics, mouseX, mouseY, delta);
        int accent = CoreConfig.INSTANCE.accentColor();
        int snap = CoreConfig.INSTANCE.snap();

        graphics.fill(0, 0, width, 48, 0xF307080A);
        graphics.fill(0, 47, width, 48, 0x44383A40);
        graphics.drawString(font, "ETERNAL", 14, 13, 0xFFFFFFFF, false);
        graphics.drawString(font, "HUD EDITOR", 14 + font.width("ETERNAL") + 6, 13, accent, false);
        graphics.drawString(font, "Drag modules · " + snap + "px snap · R reset · ESC done", 14, 29, 0xFF71747C, false);

        int buttonX = Math.max(270, width - 282);
        drawButton(graphics, mouseX, mouseY, buttonX, 10, 62, 27, "DEFAULT");
        drawButton(graphics, mouseX, mouseY, buttonX + 68, 10, 62, 27, "COMPACT");
        drawButton(graphics, mouseX, mouseY, buttonX + 136, 10, 62, 27, "CORNERS");
        drawButton(graphics, mouseX, mouseY, buttonX + 204, 10, 64, 27, "SNAP " + snap);

        drawGrid(graphics, snap);

        int fallbackIndex = 0;
        for (String name : HudRenderer.modules()) {
            if (!CoreConfig.INSTANCE.on(name)) continue;

            int[] position = CoreConfig.INSTANCE.pos(name, 12, 58 + fallbackIndex * 22);
            int boxWidth = HudRenderer.boxWidth(name);
            int boxHeight = HudRenderer.boxHeight(name);
            boolean dragging = name.equals(draggingModule);
            boolean selected = name.equals(selectedModule);
            boolean hover = mouseX >= position[0] && mouseX <= position[0] + boxWidth
                    && mouseY >= position[1] && mouseY <= position[1] + boxHeight;

            HudRenderer.drawModule(graphics, name, position[0], position[1], hover, dragging || selected);
            if (hover || selected || dragging) {
                int labelY = Math.max(50, position[1] - 11);
                graphics.drawString(font, name.toUpperCase(), position[0], labelY, dragging ? accent : 0xFF8C8F97, false);
            }
            fallbackIndex++;
        }

        drawInspector(graphics);
        super.render(graphics, mouseX, mouseY, delta);
    }

    private void drawGrid(GuiGraphics graphics, int snap) {
        int spacing = Math.max(8, snap * 4);
        for (int x = 0; x < width; x += spacing) {
            graphics.fill(x, 48, x + 1, height, 0x151E2024);
        }
        for (int y = 48; y < height; y += spacing) {
            graphics.fill(0, y, width, y + 1, 0x151E2024);
        }
        graphics.fill(width / 2, 48, width / 2 + 1, height, 0x22383A40);
        graphics.fill(0, height / 2, width, height / 2 + 1, 0x22383A40);
    }

    private void drawInspector(GuiGraphics graphics) {
        int panelWidth = Math.min(210, Math.max(150, width / 4));
        int x = width - panelWidth - 12;
        int y = height - 94;
        int accent = CoreConfig.INSTANCE.accentColor();
        graphics.fill(x, y, x + panelWidth, y + 80, 0xE70D0E10);
        graphics.renderOutline(x, y, panelWidth, 80, 0x44383A40);
        graphics.fill(x, y, x + 2, y + 80, accent);

        if (selectedModule == null) {
            graphics.drawString(font, "SELECT A MODULE", x + 12, y + 13, 0xFFD5D7DB, false);
            graphics.drawString(font, "Click any HUD chip to inspect it.", x + 12, y + 31, 0xFF6F727A, false);
            graphics.drawString(font, "Changes save automatically.", x + 12, y + 47, 0xFF6F727A, false);
            return;
        }

        int[] pos = CoreConfig.INSTANCE.pos(selectedModule, 12, 58);
        graphics.drawString(font, selectedModule.toUpperCase(), x + 12, y + 12, 0xFFFFFFFF, false);
        graphics.drawString(font, "POSITION  " + pos[0] + " / " + pos[1], x + 12, y + 30, 0xFF888B93, false);
        graphics.drawString(font, "SNAP  " + CoreConfig.INSTANCE.snap() + " PX", x + 12, y + 46, 0xFF888B93, false);
        graphics.drawString(font, "DRAG TO MOVE", x + 12, y + 62, accent, false);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        int mouseX = (int) event.x();
        int mouseY = (int) event.y();
        int buttonX = Math.max(270, width - 282);

        if (inside(mouseX, mouseY, buttonX, 10, 62, 27)) {
            CoreConfig.INSTANCE.applyPreset("DEFAULT", width, height);
            selectedModule = null;
            return true;
        }
        if (inside(mouseX, mouseY, buttonX + 68, 10, 62, 27)) {
            CoreConfig.INSTANCE.applyPreset("COMPACT", width, height);
            selectedModule = null;
            return true;
        }
        if (inside(mouseX, mouseY, buttonX + 136, 10, 62, 27)) {
            CoreConfig.INSTANCE.applyPreset("CORNERS", width, height);
            selectedModule = null;
            return true;
        }
        if (inside(mouseX, mouseY, buttonX + 204, 10, 64, 27)) {
            int snap = CoreConfig.INSTANCE.snap();
            CoreConfig.INSTANCE.setSnap(snap == 2 ? 4 : snap == 4 ? 8 : 2);
            return true;
        }

        int fallbackIndex = 0;
        for (String name : HudRenderer.modules()) {
            if (!CoreConfig.INSTANCE.on(name)) continue;

            int[] position = CoreConfig.INSTANCE.pos(name, 12, 58 + fallbackIndex * 22);
            int boxWidth = HudRenderer.boxWidth(name);
            int boxHeight = HudRenderer.boxHeight(name);
            if (inside(mouseX, mouseY, position[0], position[1], boxWidth, boxHeight)) {
                selectedModule = name;
                draggingModule = name;
                dragOffsetX = mouseX - position[0];
                dragOffsetY = mouseY - position[1];
                return true;
            }
            fallbackIndex++;
        }
        selectedModule = null;
        return super.mouseClicked(event, doubleClick);
    }

    @Override
    public boolean mouseDragged(MouseButtonEvent event, double dragX, double dragY) {
        if (draggingModule != null) {
            int snap = CoreConfig.INSTANCE.snap();
            int x = Math.round(((float) event.x() - dragOffsetX) / snap) * snap;
            int y = Math.round(((float) event.y() - dragOffsetY) / snap) * snap;
            int boxWidth = HudRenderer.boxWidth(draggingModule);
            int boxHeight = HudRenderer.boxHeight(draggingModule);
            CoreConfig.INSTANCE.setPos(
                    draggingModule,
                    Math.max(0, Math.min(width - boxWidth, x)),
                    Math.max(48, Math.min(height - boxHeight, y))
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
        if (event.key() == 82) {
            CoreConfig.INSTANCE.reset();
            selectedModule = null;
            return true;
        }
        return super.keyPressed(event);
    }

    private void drawButton(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h, String text) {
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        graphics.fill(x, y, x + w, y + h, hover ? 0xFF222429 : 0xFF151619);
        graphics.renderOutline(x, y, w, h, hover ? 0x55777B84 : 0x33383A40);
        graphics.drawCenteredString(font, text, x + w / 2, y + 10, hover ? 0xFFFFFFFF : 0xFFB2B4BA);
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int w, int h) {
        return mouseX >= x && mouseX < x + w && mouseY >= y && mouseY < y + h;
    }

    @Override
    public boolean isPauseScreen() {
        return false;
    }
}
