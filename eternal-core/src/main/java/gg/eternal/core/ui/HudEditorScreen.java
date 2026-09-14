package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
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

    private static final int TOP = 0xF7080A0D;
    private static final int PANEL = 0xF20C0F13;
    private static final int LINE = 0x443E444E;
    private static final int TEXT = 0xFFF7F8FA;
    private static final int MUTED = 0xFF777D88;
    private static final int DIM = 0xFF515761;

    public HudEditorScreen() {
        super(Component.literal("Eternal HUD Editor"));
    }

    private int canvasTop() { return width < 700 ? 86 : 56; }
    private int controlsY() { return width < 700 ? 50 : 12; }
    private int controlsX() { return width < 700 ? 12 : Math.max(220, width - 382); }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        renderBackground(graphics, mouseX, mouseY, delta);
        int accent = CoreConfig.INSTANCE.accentColor();
        int snap = CoreConfig.INSTANCE.snap();

        drawTopbar(graphics, mouseX, mouseY, accent, snap);
        drawGrid(graphics, snap);
        drawCanvasGuides(graphics, accent);

        int fallbackY = canvasTop() + 8;
        for (String name : HudRenderer.modules()) {
            if (!CoreConfig.INSTANCE.on(name)) continue;
            int[] position = CoreConfig.INSTANCE.pos(name, 12, fallbackY);
            int boxWidth = HudRenderer.boxWidth(name);
            int boxHeight = HudRenderer.boxHeight(name);
            boolean dragging = name.equals(draggingModule);
            boolean selected = name.equals(selectedModule);
            boolean hover = inside(mouseX, mouseY, position[0], position[1], boxWidth, boxHeight);

            if (selected || dragging) {
                graphics.fill(position[0] - 3, position[1] - 3, position[0] + boxWidth + 3, position[1] + boxHeight + 3, 0x18000000 | (accent & 0x00FFFFFF));
                graphics.renderOutline(position[0] - 2, position[1] - 2, boxWidth + 4, boxHeight + 4, dragging ? accent : 0x884B515B);
            }

            HudRenderer.drawModule(graphics, name, position[0], position[1], hover, dragging || selected);
            if (hover || selected || dragging) {
                int labelY = Math.max(canvasTop() + 1, position[1] - 12);
                int labelWidth = font.width(name.toUpperCase()) + 10;
                graphics.fill(position[0], labelY - 2, position[0] + labelWidth, labelY + 10, 0xE90A0C0F);
                graphics.drawString(font, name.toUpperCase(), position[0] + 5, labelY, dragging ? accent : 0xFF9A9FA8, false);
            }
            fallbackY += boxHeight + 4;
        }

        drawInspector(graphics);
        drawFooterHint(graphics);
        super.render(graphics, mouseX, mouseY, delta);
    }

    private void drawTopbar(GuiGraphics graphics, int mouseX, int mouseY, int accent, int snap) {
        int top = canvasTop();
        graphics.fill(0, 0, width, top, TOP);
        graphics.fill(0, top - 1, width, top, 0x553A404A);
        graphics.fill(0, 0, 3, top, accent);
        graphics.fill(3, 0, width, 1, 0x22FFFFFF);

        int sweep = (int) ((System.currentTimeMillis() / 10L) % Math.max(1, width));
        graphics.fill(sweep, top - 1, Math.min(width, sweep + 42), top, 0x66FFFFFF);

        graphics.drawString(font, "ETERNAL", 15, 11, TEXT, true);
        graphics.drawString(font, "HUD EDITOR", 15 + font.width("ETERNAL") + 7, 11, accent, true);
        graphics.drawString(font, "MODULES · DRAG · SNAP · NUDGE · PRESET · DISABLE", 15, 29, DIM, false);

        int x = controlsX();
        int y = controlsY();
        drawButton(graphics, mouseX, mouseY, x, y, 76, 28, "MODULES");
        drawButton(graphics, mouseX, mouseY, x + 82, y, 62, 28, "DEFAULT");
        drawButton(graphics, mouseX, mouseY, x + 150, y, 62, 28, "COMPACT");
        drawButton(graphics, mouseX, mouseY, x + 218, y, 62, 28, "CORNERS");
        drawButton(graphics, mouseX, mouseY, x + 286, y, 72, 28, "SNAP " + snap);
    }

    private void drawGrid(GuiGraphics graphics, int snap) {
        int top = canvasTop();
        int spacing = Math.max(8, snap * 4);
        for (int x = 0; x < width; x += spacing) graphics.fill(x, top, x + 1, height, 0x121E2228);
        for (int y = top; y < height; y += spacing) graphics.fill(0, y, width, y + 1, 0x121E2228);
        graphics.fill(width / 2, top, width / 2 + 1, height, 0x2A3B414A);
        graphics.fill(0, height / 2, width, height / 2 + 1, 0x2A3B414A);
    }

    private void drawCanvasGuides(GuiGraphics graphics, int accent) {
        int safe = 10;
        int top = canvasTop() + 10;
        graphics.renderOutline(safe, top, Math.max(1, width - safe * 2), Math.max(1, height - top - 12), 0x163C424B);
        graphics.drawString(font, "HUD CANVAS · ENABLE/DISABLE FROM MODULES", 14, top - 1, DIM, false);
        graphics.drawString(font, "CENTER", width / 2 + 5, height / 2 + 4, 0x334F555F, false);

        if (selectedModule != null) {
            graphics.drawString(font, "SELECTED", 14, height - 22, DIM, false);
            graphics.drawString(font, selectedModule.toUpperCase(), 70, height - 22, accent, false);
        }
    }

    private void drawFooterHint(GuiGraphics graphics) {
        int boxWidth = Math.min(474, width - 24);
        int x = 12;
        int y = height - 42;
        graphics.fill(x, y, x + boxWidth, y + 28, 0xD90A0C0F);
        graphics.renderOutline(x, y, boxWidth, 28, 0x263B414A);
        graphics.drawString(font, "ARROWS", x + 10, y + 10, 0xFF9CA1AA, false);
        graphics.drawString(font, "nudge", x + 58, y + 10, MUTED, false);
        graphics.drawString(font, "R", x + 106, y + 10, 0xFF9CA1AA, false);
        graphics.drawString(font, "default", x + 121, y + 10, MUTED, false);
        graphics.drawString(font, "DEL", x + 179, y + 10, 0xFFDE5960, false);
        graphics.drawString(font, "disable selected", x + 206, y + 10, MUTED, false);
        graphics.drawString(font, "MODULES", x + 318, y + 10, 0xFFFF646B, false);
        graphics.drawString(font, "enable more", x + 371, y + 10, MUTED, false);
    }

    private void drawInspector(GuiGraphics graphics) {
        int panelWidth = Math.min(248, Math.max(184, width / 4));
        int x = width - panelWidth - 12;
        int y = height - 126;
        int accent = CoreConfig.INSTANCE.accentColor();
        graphics.fill(x - 3, y - 3, x + panelWidth + 3, y + 112, 0x22000000);
        graphics.fill(x, y, x + panelWidth, y + 109, PANEL);
        graphics.renderOutline(x, y, panelWidth, 109, LINE);
        graphics.fill(x, y, x + 3, y + 109, accent);
        graphics.fill(x + 3, y, x + panelWidth, y + 1, 0x22FFFFFF);

        graphics.drawString(font, "INSPECTOR", x + 13, y + 12, DIM, false);

        if (selectedModule == null) {
            graphics.drawString(font, "SELECT A MODULE", x + 13, y + 28, TEXT, true);
            graphics.drawString(font, "Click or drag an active HUD chip.", x + 13, y + 48, MUTED, false);
            graphics.drawString(font, "MODULES enables hidden chips.", x + 13, y + 64, MUTED, false);
            graphics.drawString(font, "Positions save automatically.", x + 13, y + 80, MUTED, false);
            graphics.drawString(font, "CORE KEY  " + ClickGuiScreen.keyName(CoreConfig.INSTANCE.openKey()), x + 13, y + 96, accent, false);
            return;
        }

        int[] pos = CoreConfig.INSTANCE.pos(selectedModule, 12, canvasTop() + 8);
        graphics.drawString(font, selectedModule.toUpperCase(), x + 13, y + 29, TEXT, true);
        graphics.drawString(font, "POSITION", x + 13, y + 49, DIM, false);
        graphics.drawString(font, pos[0] + " / " + pos[1], x + 78, y + 49, 0xFFD9DCE1, false);
        graphics.drawString(font, "SNAP GRID", x + 13, y + 66, DIM, false);
        graphics.drawString(font, CoreConfig.INSTANCE.snap() + " PX", x + 78, y + 66, 0xFFD9DCE1, false);
        graphics.drawString(font, "DRAG OR USE ARROW KEYS", x + 13, y + 86, accent, false);
        graphics.drawString(font, "DELETE TO DISABLE", x + 13, y + 101, 0xFFE65A60, false);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        int mouseX = (int) event.x();
        int mouseY = (int) event.y();
        int buttonX = controlsX();
        int buttonY = controlsY();

        if (inside(mouseX, mouseY, buttonX, buttonY, 76, 28)) { EternalCore.openClickGui(); return true; }
        if (inside(mouseX, mouseY, buttonX + 82, buttonY, 62, 28)) { apply("DEFAULT"); return true; }
        if (inside(mouseX, mouseY, buttonX + 150, buttonY, 62, 28)) { apply("COMPACT"); return true; }
        if (inside(mouseX, mouseY, buttonX + 218, buttonY, 62, 28)) { apply("CORNERS"); return true; }
        if (inside(mouseX, mouseY, buttonX + 286, buttonY, 72, 28)) {
            int snap = CoreConfig.INSTANCE.snap();
            CoreConfig.INSTANCE.setSnap(snap == 2 ? 4 : snap == 4 ? 8 : 2);
            NotificationCenter.push("HUD SNAP", CoreConfig.INSTANCE.snap() + "px grid");
            return true;
        }

        int fallbackY = canvasTop() + 8;
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
        CoreConfig.INSTANCE.setPos(module, Math.max(0, Math.min(width - boxWidth, x)), Math.max(canvasTop(), Math.min(height - boxHeight, y)));
    }

    @Override
    public boolean mouseReleased(MouseButtonEvent event) {
        if (draggingModule != null) { draggingModule = null; return true; }
        return super.mouseReleased(event);
    }

    @Override
    public boolean keyPressed(KeyEvent event) {
        if (event.key() == 82) { apply("DEFAULT"); return true; }
        if (event.key() == 261 && selectedModule != null) {
            String module = selectedModule;
            CoreConfig.INSTANCE.toggle(module);
            selectedModule = null;
            draggingModule = null;
            NotificationCenter.push(module.toUpperCase(), "Disabled from HUD editor");
            return true;
        }
        if (selectedModule != null && (event.key() == 262 || event.key() == 263 || event.key() == 264 || event.key() == 265)) {
            int[] pos = CoreConfig.INSTANCE.pos(selectedModule, 12, canvasTop() + 8);
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
        graphics.fill(x, y, x + w, y + h, hover ? 0xFF20242A : 0xFF12151A);
        graphics.renderOutline(x, y, w, h, hover ? 0x66505762 : 0x333B414A);
        if (hover) graphics.fill(x, y, x + w, y + 1, 0x33FFFFFF);
        graphics.drawCenteredString(font, text, x + w / 2, y + 10, hover ? TEXT : 0xFFBEC2C9);
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int w, int h) {
        return mouseX >= x && mouseX < x + w && mouseY >= y && mouseY < y + h;
    }

    @Override
    public boolean isPauseScreen() { return false; }
}
