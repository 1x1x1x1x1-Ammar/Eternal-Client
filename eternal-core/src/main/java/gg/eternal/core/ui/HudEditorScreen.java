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
    private final Screen parent = net.minecraft.client.Minecraft.getInstance().screen;
    private boolean controlsVisible = true;

    public HudEditorScreen() {
        super(Component.literal("Eternal HUD Editor"));
    }

    private int toolbarColumns() { return Math.max(3, Math.min(6, (width - 24) / 92)); }
    private int canvasTop() { return controlsVisible ? 34 + ((6 + toolbarColumns() - 1) / toolbarColumns()) * 26 : 0; }

    @Override protected void init() {
        clearWidgets();
        if (!controlsVisible) return;
        String[] labels = {"Modules", "Default", "Compact", "Corners", "Snap " + CoreConfig.INSTANCE.snap(), "Done"};
        Runnable[] actions = {
            () -> minecraft.setScreen(new ModuleLibraryScreen(this)),
            () -> apply("DEFAULT"), () -> apply("COMPACT"), () -> apply("CORNERS"),
            () -> { int snap = CoreConfig.INSTANCE.snap(); CoreConfig.INSTANCE.setSnap(snap == 2 ? 4 : snap == 4 ? 8 : 2); init(); },
            this::onClose
        };
        int columns = toolbarColumns(), w = (width - 24 - (columns - 1) * 6) / columns;
        for (int i = 0; i < labels.length; i++)
            addRenderableWidget(new EternalButton(12 + i % columns * (w + 6), 30 + i / columns * 26, w, 22, labels[i], i == 0, actions[i]));
    }

    @Override public void onClose() { minecraft.setScreen(parent); }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        int accent = CoreConfig.INSTANCE.accentColor();
        int snap = CoreConfig.INSTANCE.snap();

        EternalUi.veil(graphics, width, height, accent);
        drawGrid(graphics, snap, accent);
        drawCanvasGuides(graphics, accent);

        int fallbackY = 10;
        for (String name : HudRenderer.modules()) {
            if (!CoreConfig.INSTANCE.on(name)) continue;
            int[] position = visiblePosition(name, fallbackY);
            int boxWidth = HudRenderer.boxWidth(name);
            int boxHeight = HudRenderer.boxHeight(name);
            boolean dragging = name.equals(draggingModule);
            boolean selected = name.equals(selectedModule);
            boolean hover = inside(mouseX, mouseY, position[0], position[1], boxWidth, boxHeight);

            if (selected || dragging) {
                int glow = dragging ? accent : EternalUi.alpha(accent, 132);
                graphics.fill(position[0] - 5, position[1] - 5, position[0] + boxWidth + 5, position[1] + boxHeight + 5, EternalUi.alpha(accent, dragging ? 26 : 15));
                graphics.renderOutline(position[0] - 3, position[1] - 3, boxWidth + 6, boxHeight + 6, glow);
                graphics.fill(position[0] - 3, position[1] - 3, position[0] + Math.min(boxWidth + 3, 40), position[1] - 2, accent);
            }

            HudRenderer.drawModule(graphics, name, position[0], position[1], hover, dragging || selected);
            if (hover || selected || dragging) drawModuleLabel(graphics, name, position[0], Math.max(canvasTop() + 1, position[1] - 13), accent, dragging);
            fallbackY += boxHeight + 5;
        }

        if (controlsVisible) {
            drawInspector(graphics, accent);
            drawFooterHint(graphics, accent);
            drawTopbar(graphics, accent);
        }
        super.render(graphics, mouseX, mouseY, delta);
    }

    private void drawTopbar(GuiGraphics graphics, int accent) {
        graphics.fill(0, 0, width, canvasTop(), 0xF4111419);
        graphics.fill(0, canvasTop() - 1, width, canvasTop(), accent);
        graphics.drawString(font, "ETERNAL / HUD STUDIO", 12, 12, EternalUi.TEXT, false);
        String hint = "F1: hide controls";
        if (width > 370) graphics.drawString(font, hint, width - 12 - font.width(hint), 12, EternalUi.MUTED, false);
    }

    private void drawGrid(GuiGraphics graphics, int snap, int accent) {
        int top = canvasTop();
        int spacing = Math.max(12, snap * 5);
        int drift = 0;
        for (int x = -spacing + drift; x < width; x += spacing) graphics.fill(x, top, x + 1, height, 0x0DFFFFFF);
        for (int y = top - spacing + drift / 2; y < height; y += spacing) graphics.fill(0, y, width, y + 1, 0x0CFFFFFF);
        graphics.fill(width / 2, top, width / 2 + 1, height, EternalUi.alpha(accent, 38));
        graphics.fill(0, Math.max(top, height / 2), width, Math.max(top, height / 2) + 1, EternalUi.alpha(accent, 32));
    }

    private void drawCanvasGuides(GuiGraphics graphics, int accent) {
        int safe = 10;
        int top = canvasTop() + 10;
        graphics.renderOutline(safe, top, Math.max(1, width - safe * 2), Math.max(1, height - top - 12), 0x24454C56);
        graphics.drawString(font, "HUD CANVAS", 15, top - 1, EternalUi.DIM, false);
        graphics.drawString(font, "CENTER", width / 2 + 5, Math.max(top + 8, height / 2 + 4), EternalUi.alpha(accent, 70), false);
        graphics.fill(width / 2 - 2, Math.max(top + 6, height / 2 - 2), width / 2 + 3, Math.max(top + 11, height / 2 + 3), EternalUi.alpha(accent, 55));

        if (selectedModule != null) {
            graphics.drawString(font, "SELECTED", 15, height - 22, EternalUi.DIM, false);
            graphics.drawString(font, selectedModule.toUpperCase(), 72, height - 22, accent, false);
        }
    }

    private void drawModuleLabel(GuiGraphics graphics, String name, int x, int y, int accent, boolean dragging) {
        int labelW = font.width(name.toUpperCase()) + 16;
        graphics.fill(x, y - 2, x + labelW, y + 11, 0xEE090C10);
        graphics.renderOutline(x, y - 2, labelW, 13, dragging ? EternalUi.alpha(accent, 148) : 0x3C4C535D);
        graphics.fill(x, y - 2, x + 2, y + 11, dragging ? accent : EternalUi.alpha(accent, 110));
        graphics.drawString(font, name.toUpperCase(), x + 7, y + 1, dragging ? EternalUi.TEXT : 0xFFA1A7B0, false);
    }

    private void drawInspector(GuiGraphics graphics, int accent) {
        int panelW = Math.min(260, Math.max(190, width / 4));
        int x = width - panelW - 12;
        int y = height - 140;
        if (width < 760 || height < 360) return;

        EternalUi.glass(graphics, x, y, panelW, 126, accent, selectedModule != null);
        EternalUi.accentRail(graphics, x, y, 126, accent, selectedModule != null);
        graphics.drawString(font, "INSPECTOR", x + 14, y + 13, EternalUi.DIM, false);

        if (selectedModule == null) {
            graphics.drawString(font, "SELECT A HUD MODULE", x + 14, y + 31, EternalUi.TEXT, true);
            graphics.drawString(font, "Click or drag any active widget.", x + 14, y + 52, EternalUi.MUTED, false);
            graphics.drawString(font, "Use MODULES to enable hidden widgets.", x + 14, y + 69, EternalUi.MUTED, false);
            graphics.drawString(font, "All positions save instantly.", x + 14, y + 86, EternalUi.MUTED, false);
            graphics.drawString(font, "CORE KEY  " + ClickGuiScreen.keyName(CoreConfig.INSTANCE.openKey()), x + 14, y + 105, accent, false);
            return;
        }

        int[] pos = CoreConfig.INSTANCE.pos(selectedModule, 10, 10);
        graphics.drawString(font, selectedModule.toUpperCase(), x + 14, y + 31, EternalUi.TEXT, true);
        inspectorFact(graphics, x + 14, y + 51, "POSITION", pos[0] + " / " + pos[1]);
        inspectorFact(graphics, x + 14, y + 69, "SNAP", CoreConfig.INSTANCE.snap() + " PX");
        graphics.drawString(font, "ARROWS · NUDGE", x + 14, y + 91, EternalUi.MUTED, false);
        graphics.drawString(font, "DELETE · DISABLE", x + 14, y + 108, 0xFFE86A71, false);
    }

    private void inspectorFact(GuiGraphics graphics, int x, int y, String label, String value) {
        graphics.drawString(font, label, x, y, EternalUi.DIM, false);
        graphics.drawString(font, value, x + 74, y, EternalUi.TEXT, false);
    }

    private void drawFooterHint(GuiGraphics graphics, int accent) {
        if (width < 1100 || height < 360) return;
        int boxW = Math.min(510, width - 24);
        int x = 12;
        int y = height - 46;
        EternalUi.glass(graphics, x, y, boxW, 31, accent, false);
        graphics.drawString(font, "ARROWS", x + 11, y + 11, 0xFFB3B8C0, false);
        graphics.drawString(font, "NUDGE", x + 61, y + 11, EternalUi.DIM, false);
        graphics.drawString(font, "R", x + 111, y + 11, 0xFFB3B8C0, false);
        graphics.drawString(font, "RESET", x + 127, y + 11, EternalUi.DIM, false);
        graphics.drawString(font, "DEL", x + 176, y + 11, 0xFFE86A71, false);
        graphics.drawString(font, "DISABLE", x + 203, y + 11, EternalUi.DIM, false);
        graphics.drawString(font, "MODULES", x + 274, y + 11, accent, false);
        graphics.drawString(font, "ADD WIDGETS", x + 330, y + 11, EternalUi.DIM, false);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        if (event.button() != 0) return super.mouseClicked(event, doubleClick);
        if (controlsVisible && super.mouseClicked(event, doubleClick)) return true;
        if (controlsVisible && event.y() < canvasTop()) return true;
        int mouseX = (int) event.x();
        int mouseY = (int) event.y();
        int fallbackY = 10;
        for (String name : HudRenderer.modules()) {
            if (!CoreConfig.INSTANCE.on(name)) continue;
            int[] position = visiblePosition(name, fallbackY);
            int boxWidth = HudRenderer.boxWidth(name);
            int boxHeight = HudRenderer.boxHeight(name);
            if (inside(mouseX, mouseY, position[0], position[1], boxWidth, boxHeight)) {
                selectedModule = name;
                draggingModule = name;
                dragOffsetX = mouseX - position[0];
                dragOffsetY = mouseY - position[1];
                return true;
            }
            fallbackY += boxHeight + 5;
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
        int nextX = Math.max(0, Math.min(width - boxWidth, x));
        int nextY = Math.max(0, Math.min(height - boxHeight, y));
        if (draggingModule != null) CoreConfig.INSTANCE.previewPos(module, nextX, nextY);
        else CoreConfig.INSTANCE.setPos(module, nextX, nextY);
    }

    @Override
    public boolean mouseReleased(MouseButtonEvent event) {
        if (draggingModule != null) { CoreConfig.INSTANCE.savePositions(); draggingModule = null; return true; }
        return super.mouseReleased(event);
    }

    @Override
    public boolean keyPressed(KeyEvent event) {
        if (event.key() == 290) { controlsVisible = !controlsVisible; init(); return true; }
        if (event.key() == 257 && selectedModule != null) {
            minecraft.setScreen(new ModuleSettingsScreen(this, selectedModule));
            return true;
        }
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
            int[] pos = CoreConfig.INSTANCE.pos(selectedModule, 10, 10);
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

    private int[] visiblePosition(String name, int fallbackY) {
        int[] pos = CoreConfig.INSTANCE.pos(name, 10, fallbackY);
        return new int[]{Math.max(0, Math.min(width - HudRenderer.boxWidth(name), pos[0])),
                Math.max(0, Math.min(height - HudRenderer.boxHeight(name), pos[1]))};
    }

    @Override
    public void removed() {
        CoreConfig.INSTANCE.savePositions();
        draggingModule = null;
        super.removed();
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int w, int h) {
        return mouseX >= x && mouseX < x + w && mouseY >= y && mouseY < y + h;
    }

    @Override
    public boolean isPauseScreen() { return false; }
}
