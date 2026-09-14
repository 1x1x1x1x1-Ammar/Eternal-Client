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

        graphics.fill(0, 0, width, 52, 0xF507080A);
        graphics.fill(0, 51, width, 52, 0x55383A40);
        graphics.fill(0, 0, 3, 52, accent);
        graphics.drawString(font, "ETERNAL", 15, 12, 0xFFFFFFFF, true);
        graphics.drawString(font, "HUD EDITOR", 15 + font.width("ETERNAL") + 7, 12, accent, true);
        graphics.drawString(font, "BETA 8 · drag modules · arrows nudge · R default · ESC done", 15, 30, 0xFF747780, false);

        int buttonX = Math.max(300, width - 294);
        drawButton(graphics, mouseX, mouseY, buttonX, 11, 64, 28, "DEFAULT");
        drawButton(graphics, mouseX, mouseY, buttonX + 70, 11, 64, 28, "COMPACT");
        drawButton(graphics, mouseX, mouseY, buttonX + 140, 11, 64, 28, "CORNERS");
        drawButton(graphics, mouseX, mouseY, buttonX + 210, 11, 70, 28, "SNAP " + snap);

        drawGrid(graphics, snap);

        int fallbackY = 62;
        for (String name : HudRenderer.modules()) {
            if (!CoreConfig.INSTANCE.on(name)) continue;
            int[] position = CoreConfig.INSTANCE.pos(name, 12, fallbackY);
            int boxWidth = HudRenderer.boxWidth(name);
            int boxHeight = HudRenderer.boxHeight(name);
            boolean dragging = name.equals(draggingModule);
            boolean selected = name.equals(selectedModule);
            boolean hover = inside(mouseX, mouseY, position[0], position[1], boxWidth, boxHeight);

            HudRenderer.drawModule(graphics, name, position[0], position[1], hover, dragging || selected);
            if (hover || selected || dragging) {
                int labelY = Math.max(54, position[1] - 11);
                graphics.drawString(font, name.toUpperCase(), position[0], labelY, dragging ? accent : 0xFF9A9DA6, false);
            }
            fallbackY += boxHeight + 4;
        }

        drawInspector(graphics);
        super.render(graphics, mouseX, mouseY, delta);
    }

    private void drawGrid(GuiGraphics graphics, int snap) {
        int spacing = Math.max(8, snap * 4);
        for (int x = 0; x < width; x += spacing) graphics.fill(x, 52, x + 1, height, 0x151E2024);
        for (int y = 52; y < height; y += spacing) graphics.fill(0, y, width, y + 1, 0x151E2024);
        graphics.fill(width / 2, 52, width / 2 + 1, height, 0x2A383A40);
        graphics.fill(0, height / 2, width, height / 2 + 1, 0x2A383A40);
    }

    private void drawInspector(GuiGraphics graphics) {
        int panelWidth = Math.min(224, Math.max(164, width / 4));
        int x = width - panelWidth - 12;
        int y = height - 104;
        int accent = CoreConfig.INSTANCE.accentColor();
        graphics.fill(x, y, x + panelWidth, y + 90, 0xEE0D0E10);
        graphics.renderOutline(x, y, panelWidth, 90, 0x5541454D);
        graphics.fill(x, y, x + 3, y + 90, accent);

        if (selectedModule == null) {
            graphics.drawString(font, "SELECT A MODULE", x + 13, y + 14, 0xFFE5E7EA, true);
            graphics.drawString(font, "Click or drag any active HUD chip.", x + 13, y + 34, 0xFF777B84, false);
            graphics.drawString(font, "Positions save automatically.", x + 13, y + 51, 0xFF777B84, false);
            graphics.drawString(font, "Preset buttons are real layout actions.", x + 13, y + 68, 0xFF777B84, false);
            return;
        }

        int[] pos = CoreConfig.INSTANCE.pos(selectedModule, 12, 62);
        graphics.drawString(font, selectedModule.toUpperCase(), x + 13, y + 13, 0xFFFFFFFF, true);
        graphics.drawString(font, "POSITION  " + pos[0] + " / " + pos[1], x + 13, y + 33, 0xFF93969E, false);
        graphics.drawString(font, "SNAP  " + CoreConfig.INSTANCE.snap() + " PX", x + 13, y + 50, 0xFF93969E, false);
        graphics.drawString(font, "DRAG OR USE ARROW KEYS", x + 13, y + 69, accent, false);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        int mouseX = (int) event.x();
        int mouseY = (int) event.y();
        int buttonX = Math.max(300, width - 294);

        if (inside(mouseX, mouseY, buttonX, 11, 64, 28)) { apply("DEFAULT"); return true; }
        if (inside(mouseX, mouseY, buttonX + 70, 11, 64, 28)) { apply("COMPACT"); return true; }
        if (inside(mouseX, mouseY, buttonX + 140, 11, 64, 28)) { apply("CORNERS"); return true; }
        if (inside(mouseX, mouseY, buttonX + 210, 11, 70, 28)) {
            int snap = CoreConfig.INSTANCE.snap();
            CoreConfig.INSTANCE.setSnap(snap == 2 ? 4 : snap == 4 ? 8 : 2);
            NotificationCenter.push("HUD SNAP", CoreConfig.INSTANCE.snap() + "px grid");
            return true;
        }

        int fallbackY = 62;
        for (String name : HudRenderer.modules()) {
            if (!CoreConfig.INSTANCE.on(name)) continue;
            int[] position = CoreConfig.INSTANCE.pos(name, 12, fallbackY);
            int boxWidth = HudRenderer.boxWidth(name);
            int boxHeight = HudRenderer.boxHeight(name);
            if (inside(mouseX, mouseY, position[0], position[1], boxWidth, boxHeight)) {
                selectedModule = name;
                draggingModule = name;
                dragOffsetX = mouseX - position[0];
                dragOffsetY = mouseY - position[1];
                return true;
            }
            fallbackY += boxHeight + 4;
        }
        selectedModule = null;
        return super.mouseClicked(event, doubleClick);
    }

    private void apply(String preset) {
        CoreConfig.INSTANCE.applyPreset(preset, width, height);
        selectedModule = null;
        NotificationCenter.push("HUD PRESET", preset + " layout applied");
    }

    @Override
    public boolean mouseDragged(MouseButtonEvent event, double dragX, double dragY) {
        if (draggingModule != null) {
            moveSelected((int) event.x() - dragOffsetX, (int) event.y() - dragOffsetY, true);
            return true;
        }
        return super.mouseDragged(event, dragX, dragY);
    }

    private void moveSelected(int x, int y, boolean snapToGrid) {
        if (selectedModule == null && draggingModule == null) return;
        String module = draggingModule != null ? draggingModule : selectedModule;
        int snap = CoreConfig.INSTANCE.snap();
        if (snapToGrid) {
            x = Math.round((float) x / snap) * snap;
            y = Math.round((float) y / snap) * snap;
        }
        int boxWidth = HudRenderer.boxWidth(module);
        int boxHeight = HudRenderer.boxHeight(module);
        CoreConfig.INSTANCE.setPos(module, Math.max(0, Math.min(width - boxWidth, x)), Math.max(52, Math.min(height - boxHeight, y)));
    }

    @Override
    public boolean mouseReleased(MouseButtonEvent event) {
        if (draggingModule != null) { draggingModule = null; return true; }
        return super.mouseReleased(event);
    }

    @Override
    public boolean keyPressed(KeyEvent event) {
        if (event.key() == 82) { apply("DEFAULT"); return true; }
        if (selectedModule != null && (event.key() == 262 || event.key() == 263 || event.key() == 264 || event.key() == 265)) {
            int[] pos = CoreConfig.INSTANCE.pos(selectedModule, 12, 62);
            int amount = CoreConfig.INSTANCE.snap();
            int x = pos[0], y = pos[1];
            if (event.key() == 262) x += amount;
            if (event.key() == 263) x -= amount;
            if (event.key() == 264) y += amount;
            if (event.key() == 265) y -= amount;
            moveSelected(x, y, false);
            return true;
        }
        return super.keyPressed(event);
    }

    private void drawButton(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h, String text) {
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        graphics.fill(x, y, x + w, y + h, hover ? 0xFF27292E : 0xFF151619);
        graphics.renderOutline(x, y, w, h, hover ? CoreConfig.INSTANCE.accentColor() : 0x44383A40);
        graphics.drawCenteredString(font, text, x + w / 2, y + 10, hover ? 0xFFFFFFFF : 0xFFC0C2C8);
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int w, int h) {
        return mouseX >= x && mouseX < x + w && mouseY >= y && mouseY < y + h;
    }

    @Override
    public boolean isPauseScreen() { return false; }
}
