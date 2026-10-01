package gg.eternal.core.ui;

import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import gg.eternal.core.util.CoreLog;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.options.OptionsScreen;

public final class EternalHomeScreen extends EternalScreen {
    private static final String[] QUICK_MODULES = {"Zoom", "Crosshair", "Fullbright", "ToggleSprint", "ToggleSneak", "Perspective"};
    private boolean renderFailureLogged;
    private MenuLayout layout;

    public EternalHomeScreen() { super("Eternal Start", null); }

    @Override protected void init() {
        clearWidgets();
        int navWidth = (width - 40) / 3;
        button(12, 76, navWidth, "Modules", true, () -> minecraft.setScreen(new ModuleLibraryScreen(this)));
        button(20 + navWidth, 76, navWidth, "HUD editor", false, () -> minecraft.setScreen(new HudEditorScreen()));
        button(28 + navWidth * 2, 76, navWidth, "Options", false, () -> minecraft.setScreen(new OptionsScreen(this, minecraft.options)));
        int columns = width >= 620 ? 3 : 2;
        layout = new MenuLayout(12, width - 24, 122, height - 40, 26, columns);
        for (int i = 0; i < QUICK_MODULES.length; i++) {
            String module = QUICK_MODULES[i];
            boolean on = CoreConfig.INSTANCE.on(module);
            button(layout.cellX(i), layout.cellY(i), layout.cellWidth(), ModulePresentation.label(module) + ": " + (on ? "On" : "Off"), on,
                () -> { CoreConfig.INSTANCE.toggle(module); init(); });
        }
        button(12, height - 27, Math.min(120, (width - 32) / 2), "Resume game", true, this::onClose);
        button(width - 132, height - 27, 120, "Installed mods", false, () -> minecraft.setScreen(new LoadedModsScreen(this)));
    }

    @Override public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        try {
            String world = minecraft.getCurrentServer() != null ? minecraft.getCurrentServer().ip
                : minecraft.hasSingleplayerServer() ? "Singleplayer world" : minecraft.getUser().getName();
            graphics.drawString(font, font.plainSubstrByWidth(world, width - 24), 12, 44, EternalUi.TEXT, false);
            String stats = HudRenderer.value("FPS") + "  /  " + HudRenderer.value("Ping");
            graphics.drawString(font, font.plainSubstrByWidth(stats, width - 24), 12, 60, EternalUi.MUTED, false);
            graphics.drawString(font, "Quick modules", 12, 108, EternalUi.MUTED, false);
            super.render(graphics, mouseX, mouseY, delta);
        } catch (RuntimeException error) {
            if (!renderFailureLogged) { renderFailureLogged = true; CoreLog.error("Eternal Start render failed", error); }
            graphics.fill(0, 0, width, height, 0xF40B0D12);
            graphics.drawCenteredString(font, "ETERNAL CORE SAFE MODE", width / 2, height / 2 - 12, EternalUi.TEXT);
            graphics.drawCenteredString(font, "Press Esc to return to the game", width / 2, height / 2 + 8, EternalUi.MUTED);
        }
    }
}
