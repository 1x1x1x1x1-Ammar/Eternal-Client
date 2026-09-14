package gg.eternal.core.ui;

import gg.eternal.core.EternalCore;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import gg.eternal.core.util.CoreLog;
import net.minecraft.client.Minecraft;
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
    private boolean recovering;
    private final long openedAt = System.currentTimeMillis();

    private static final int TOP = 0xF7080A0D;
    private static final int PANEL = 0xF20C0F13;
    private static final int LINE = 0x443E444E;
    private static final int TEXT = 0xFFF7F8FA;
    private static final int MUTED = 0xFF777D88;
    private static final int DIM = 0xFF515761;
    private static final int GREEN = 0xFF58ED89;

    public HudEditorScreen() {
        super(Component.literal("Eternal HUD Studio"));
    }

    private int canvasTop() { return width < 700 ? 96 : 62; }
    private int controlsY() { return width < 700 ? 54 : 15; }
    private int controlsX() { return width < 700 ? 12 : Math.max(232, width - 416); }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        try {
            renderSafe(graphics, mouseX, mouseY, delta);
        } catch (Throwable error) {
            recover("render", error);
        }
    }

    private void renderSafe(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        renderBackground(graphics, mouseX, mouseY, delta);
        int accent = CoreConfig.INSTANCE.accentColor();
        int snap = CoreConfig.INSTANCE.snap();

        drawTopbar(graphics, mouseX, mouseY, accent, snap);
        drawGrid(graphics, snap);
        drawCanvasGuides(graphics, accent);

        int fallbackY = canvasTop() + 12;
        for (String name : HudRenderer.modules()) {
            if (!CoreConfig.INSTANCE.on(name)) continue;
            int[] position = CoreConfig.INSTANCE.pos(name, 12, fallbackY);
            int boxWidth = HudRenderer.boxWidth(name);
            int boxHeight = HudRenderer.boxHeight(name);
            boolean dragging = name.equals(draggingModule);
            boolean selected = name.equals(selectedModule);
            boolean hover = inside(mouseX, mouseY, position[0], position[1], boxWidth, boxHeight);

            if (selected || dragging) {
                graphics.fill(position[0] - 5, position[1] - 5, position[0] + boxWidth + 5, position[1] + boxHeight + 5, 0x14000000 | (accent & 0x00FFFFFF));
                graphics.renderOutline(position[0] - 3, position[1] - 3, boxWidth + 6, boxHeight + 6, dragging ? accent : 0x99545B66);
                drawAnchor(graphics, position[0] - 4, position[1] - 4, accent);
                drawAnchor(graphics, position[0] + boxWidth + 1, position[1] - 4, accent);
                drawAnchor(graphics, position[0] - 4, position[1] + boxHeight + 1, accent);
                drawAnchor(graphics, position[0] + boxWidth + 1, position[1] + boxHeight + 1, accent);
            }

            HudRenderer.drawModule(graphics, name, position[0], position[1], hover, dragging || selected);
            if (hover || selected || dragging) {
                int labelY = Math.max(canvasTop() + 2, position[1] - 13);
                int labelWidth = font.width(name.toUpperCase()) + 48;
                graphics.fill(position[0], labelY - 2, position[0] + labelWidth, labelY + 11, 0xF20A0C0F);
                graphics.renderOutline(position[0], labelY - 2, labelWidth, 13, 0x363F4650);
                graphics.drawString(font, name.toUpperCase(), position[0] + 5, labelY, dragging ? accent : 0xFFA5AAB3, false);
                String state = dragging ? "DRAG" : selected ? "SELECTED" : "HOVER";
                graphics.drawString(font, state, position[0] + labelWidth - font.width(state) - 5, labelY, dragging ? accent : DIM, false);
            }
            fallbackY += boxHeight + 5;
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

        int sweep = (int) ((System.currentTimeMillis() / 11L) % Math.max(1, width));
        graphics.fill(sweep, top - 1, Math.min(width, sweep + 48), top, 0x66FFFFFF);
        int intro = Math.min(width, (int) (width * Math.min(1.0F, (System.currentTimeMillis() - openedAt) / 260.0F)));
        graphics.fill(0, top - 3, intro, top - 2, 0x55000000 | (accent & 0x00FFFFFF));

        graphics.drawString(font, "ETERNAL", 15, 12, TEXT, true);
        graphics.drawString(font, "HUD STUDIO", 15 + font.width("ETERNAL") + 7, 12, accent, true);
        graphics.drawString(font, "DRAG · SNAP · NUDGE · PRESET · DISABLE · LIVE PREVIEW", 15, 31, DIM, false);

        int enabled = enabledCount();
        graphics.fill(15, 43, 142, 58, 0xFF0C1110);
        graphics.renderOutline(15, 43, 127, 15, 0x294A7657);
        graphics.fill(22, 48, 26, 52, enabled > 0 ? GREEN : DIM);
        graphics.drawString(font, enabled + " ACTIVE MODULES", 32, 47, enabled > 0 ? 0xFF9AE9B2 : MUTED, false);

        int x = controlsX();
        int y = controlsY();
        drawButton(graphics, mouseX, mouseY, x, y, 84, 28, "MODULES", true);
        drawButton(graphics, mouseX, mouseY, x + 90, y, 64, 28, "DEFAULT", false);
        drawButton(graphics, mouseX, mouseY, x + 160, y, 64, 28, "COMPACT", false);
        drawButton(graphics, mouseX, mouseY, x + 230, y, 64, 28, "CORNERS", false);
        drawButton(graphics, mouseX, mouseY, x + 300, y, 84, 28, "SNAP " + snap + "PX", false);
    }

    private void drawGrid(GuiGraphics graphics, int snap) {
        int top = canvasTop();
        int spacing = Math.max(8, snap * 4);
        for (int x = 0; x < width; x += spacing) graphics.fill(x, top, x + 1, height, 0x111E2228);
        for (int y = top; y < height; y += spacing) graphics.fill(0, y, width, y + 1, 0x111E2228);
        graphics.fill(width / 2, top, width / 2 + 1, height, 0x293B414A);
        graphics.fill(0, height / 2, width, height / 2 + 1, 0x293B414A);
    }

    private void drawCanvasGuides(GuiGraphics graphics, int accent) {
        int safe = 10;
        int top = canvasTop() + 10;
        int safeHeight = Math.max(1, height - top - 12);
        graphics.renderOutline(safe, top, Math.max(1, width - safe * 2), safeHeight, 0x1B3C424B);
        graphics.drawString(font, "HUD CANVAS", 14, top - 1, DIM, false);
        graphics.drawString(font, "CENTER X", width / 2 + 5, top + 4, 0x334F555F, false);
        graphics.drawString(font, "CENTER Y", 14, height / 2 + 4, 0x334F555F, false);

        if (selectedModule != null) {
            graphics.fill(12, height - 69, 176, height - 49, 0xD90A0C0F);
            graphics.renderOutline(12, height - 69, 164, 20, 0x263B414A);
            graphics.drawString(font, "SELECTED", 21, height - 62, DIM, false);
            graphics.drawString(font, selectedModule.toUpperCase(), 75, height - 62, accent, false);
        }
    }

    private void drawFooterHint(GuiGraphics graphics) {
        int boxWidth = Math.min(548, width - 24);
        int x = 12;
        int y = height - 42;
        graphics.fill(x, y, x + boxWidth, y + 28, 0xE20A0C0F);
        graphics.renderOutline(x, y, boxWidth, 28, 0x303B414A);
        graphics.drawString(font, "ARROWS", x + 10, y + 10, 0xFF9CA1AA, false);
        graphics.drawString(font, "NUDGE", x + 58, y + 10, MUTED, false);
        graphics.drawString(font, "R", x + 105, y + 10, 0xFF9CA1AA, false);
        graphics.drawString(font, "RESET", x + 120, y + 10, MUTED, false);
        graphics.drawString(font, "DEL", x + 172, y + 10, 0xFFDE5960, false);
        graphics.drawString(font, "DISABLE", x + 199, y + 10, MUTED, false);
        graphics.drawString(font, "MODULES", x + 261, y + 10, 0xFFFF646B, false);
        graphics.drawString(font, "ADD / REMOVE", x + 314, y + 10, MUTED, false);
        graphics.drawString(font, "ESC", x + 405, y + 10, 0xFF9CA1AA, false);
        graphics.drawString(font, "BACK", x + 432, y + 10, MUTED, false);
    }

    private void drawInspector(GuiGraphics graphics) {
        int panelWidth = Math.min(270, Math.max(196, width / 4));
        int x = width - panelWidth - 12;
        int y = height - 144;
        int accent = CoreConfig.INSTANCE.accentColor();
        graphics.fill(x - 4, y - 4, x + panelWidth + 4, y + 126, 0x24000000);
        graphics.fill(x, y, x + panelWidth, y + 122, PANEL);
        graphics.renderOutline(x, y, panelWidth, 122, LINE);
        graphics.fill(x, y, x + 3, y + 122, accent);
        graphics.fill(x + 3, y, x + panelWidth, y + 1, 0x22FFFFFF);

        graphics.drawString(font, "MODULE INSPECTOR", x + 13, y + 12, DIM, false);

        if (selectedModule == null) {
            graphics.drawString(font, "SELECT AN ACTIVE MODULE", x + 13, y + 30, TEXT, true);
            graphics.drawString(font, "Click or drag any live HUD widget.", x + 13, y + 50, MUTED, false);
            graphics.drawString(font, "MODULES opens the full module center.", x + 13, y + 67, MUTED, false);
            graphics.drawString(font, "Disabled widgets never render in-game.", x + 13, y + 84, MUTED, false);
            graphics.drawString(font, "Positions save automatically.", x + 13, y + 101, 0xFF656C77, false);
            return;
        }

        int[] pos = CoreConfig.INSTANCE.pos(selectedModule, 12, canvasTop() + 12);
        graphics.drawString(font, selectedModule.toUpperCase(), x + 13, y + 30, TEXT, true);
        graphics.drawString(font, "POSITION", x + 13, y + 51, DIM, false);
        graphics.drawString(font, pos[0] + " / " + pos[1], x + 86, y + 51, 0xFFD9DCE1, false);
        graphics.drawString(font, "SIZE", x + 13, y + 68, DIM, false);
        graphics.drawString(font, HudRenderer.boxWidth(selectedModule) + " × " + HudRenderer.boxHeight(selectedModule), x + 86, y + 68, 0xFFD9DCE1, false);
        graphics.drawString(font, "SNAP", x + 13, y + 85, DIM, false);
        graphics.drawString(font, CoreConfig.INSTANCE.snap() + " PX", x + 86, y + 85, 0xFFD9DCE1, false);
        graphics.drawString(font, "DRAG OR USE ARROWS", x + 13, y + 103, accent, false);
        graphics.drawString(font, "DELETE DISABLES MODULE", x + 13, y + 116, 0xFFE65A60, false);
    }

    private void drawAnchor(GuiGraphics graphics, int x, int y, int accent) {
        graphics.fill(x, y, x + 4, y + 4, 0xFF000000 | (accent & 0x00FFFFFF));
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        try {
            return mouseClickedSafe(event, doubleClick);
        } catch (Throwable error) {
            recover("mouse click", error);
            return true;
        }
    }

    private boolean mouseClickedSafe(MouseButtonEvent event, boolean doubleClick) {
        int mouseX = (int) event.x();
        int mouseY = (int) event.y();
        int buttonX = controlsX();
        int buttonY = controlsY();

        if (inside(mouseX, mouseY, buttonX, buttonY, 84, 28)) { EternalCore.openClickGui(); return true; }
        if (inside(mouseX, mouseY, buttonX + 90, buttonY, 64, 28)) { apply("DEFAULT"); return true; }
        if (inside(mouseX, mouseY, buttonX + 160, buttonY, 64, 28)) { apply("COMPACT"); return true; }
        if (inside(mouseX, mouseY, buttonX + 230, buttonY, 64, 28)) { apply("CORNERS"); return true; }
        if (inside(mouseX, mouseY, buttonX + 300, buttonY, 84, 28)) {
            int snap = CoreConfig.INSTANCE.snap();
            CoreConfig.INSTANCE.setSnap(snap == 2 ? 4 : snap == 4 ? 8 : 2);
            NotificationCenter.push("HUD SNAP", CoreConfig.INSTANCE.snap() + "px grid");
            return true;
        }

        int fallbackY = canvasTop() + 12;
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
            fallbackY += boxHeight + 5;
        }
        selectedModule = null;
        return super.mouseClicked(event, doubleClick);
    }

    private void apply(String preset) {
        CoreConfig.INSTANCE.applyPreset(preset, width, height);
        selectedModule = null;
        draggingModule = null;
        NotificationCenter.push("HUD PRESET", preset + " layout applied");
    }

    @Override
    public boolean mouseDragged(MouseButtonEvent event, double dragX, double dragY) {
        try {
            if (draggingModule != null) {
                moveSelected((int) event.x() - dragOffsetX, (int) event.y() - dragOffsetY, true);
                return true;
            }
            return super.mouseDragged(event, dragX, dragY);
        } catch (Throwable error) {
            recover("drag", error);
            return true;
        }
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
        try {
            if (draggingModule != null) {
                NotificationCenter.push("HUD POSITION", draggingModule + " saved");
                draggingModule = null;
                return true;
            }
            return super.mouseReleased(event);
        } catch (Throwable error) {
            recover("mouse release", error);
            return true;
        }
    }

    @Override
    public boolean keyPressed(KeyEvent event) {
        try {
            if (event.key() == 82) { apply("DEFAULT"); return true; }
            if (event.key() == 261 && selectedModule != null) {
                String module = selectedModule;
                CoreConfig.INSTANCE.toggle(module);
                selectedModule = null;
                draggingModule = null;
                NotificationCenter.push(module.toUpperCase(), "Disabled from HUD Studio");
                return true;
            }
            if (selectedModule != null && (event.key() == 262 || event.key() == 263 || event.key() == 264 || event.key() == 265)) {
                int[] pos = CoreConfig.INSTANCE.pos(selectedModule, 12, canvasTop() + 12);
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
        } catch (Throwable error) {
            recover("keyboard input", error);
            return true;
        }
    }

    private int enabledCount() {
        int total = 0;
        for (String name : HudRenderer.modules()) if (CoreConfig.INSTANCE.on(name)) total++;
        return total;
    }

    private void drawButton(GuiGraphics graphics, int mouseX, int mouseY, int x, int y, int w, int h, String text, boolean primary) {
        boolean hover = inside(mouseX, mouseY, x, y, w, h);
        int accent = CoreConfig.INSTANCE.accentColor();
        int fill = primary ? (0xD5000000 | (accent & 0x00FFFFFF)) : hover ? 0xFF20242A : 0xFF12151A;
        graphics.fill(x, y, x + w, y + h, fill);
        graphics.renderOutline(x, y, w, h, primary ? 0x66FFFFFF : hover ? 0x66505762 : 0x333B414A);
        if (hover) graphics.fill(x, y, x + w, y + 1, 0x44FFFFFF);
        graphics.drawCenteredString(font, text, x + w / 2, y + 10, primary || hover ? TEXT : 0xFFBEC2C9);
    }

    private void recover(String stage, Throwable error) {
        if (recovering) return;
        recovering = true;
        CoreLog.error("HUD Studio " + stage + " failed", error);
        Minecraft mc = Minecraft.getInstance();
        mc.execute(() -> {
            try {
                NotificationCenter.push("ETERNAL RECOVERY", "HUD Studio recovered · check eternal-core.log");
                if (mc.screen == this) mc.setScreen(new EternalHomeScreen());
            } catch (Throwable nested) {
                CoreLog.error("Could not recover from HUD Studio failure", nested);
                if (mc.screen == this) mc.setScreen(null);
            } finally {
                recovering = false;
            }
        });
    }

    private static boolean inside(int mouseX, int mouseY, int x, int y, int w, int h) {
        return mouseX >= x && mouseX < x + w && mouseY >= y && mouseY < y + h;
    }

    @Override
    public boolean isPauseScreen() { return false; }
}
