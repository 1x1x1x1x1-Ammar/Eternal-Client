package gg.eternal.core.ui;

import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.config.ModuleSettings;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.EditBox;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.input.KeyEvent;
import net.minecraft.network.chat.Component;
import java.util.ArrayList;
import java.util.Map;

public final class ModuleSettingsScreen extends EternalScreen {
    private final String module;
    private int page, rows;
    private boolean binding;
    private String message = "Changes save and apply immediately.";
    private final ArrayList<Map.Entry<String, JsonObject>> rules;
    public ModuleSettingsScreen(Screen parent, String module) {
        super(module + " settings", parent);
        this.module = module;
        rules = new ArrayList<>(ModuleSettings.rules(module).entrySet());
    }
    @Override protected void init() {
        clearWidgets();
        var config = CoreConfig.INSTANCE;
        int half = (width - 32) / 2;
        button(12, 44, half, config.on(module) ? "Enabled" : "Disabled", config.on(module), () -> { config.toggle(module); init(); });
        button(20 + half, 44, half, binding ? "Press key / Del clears" : "Toggle key: " + (config.number(module, "keybind") == 0 ? "None" : ClickGuiScreen.keyName(config.number(module, "keybind"))), false, () -> { binding = true; init(); });
        rows = Math.max(1, (height - 138) / 28);
        page = Math.max(0, Math.min(page, Math.max(0, (rules.size() - 1) / rows)));
        for (int i = page * rows; i < Math.min(rules.size(), (page + 1) * rows); i++) {
            var entry = rules.get(i);
            String key = entry.getKey(); var rule = entry.getValue();
            int y = 76 + (i - page * rows) * 28;
            int x = Math.max(120, width / 2), available = width - x - 12;
            switch (rule.get("type").getAsString()) {
                case "boolean" -> button(x, y, available, config.flag(module, key) ? "On" : "Off", config.flag(module, key), () -> { config.setSetting(module, key, new JsonPrimitive(!config.flag(module, key))); init(); });
                case "color" -> {
                    var color = new EditBox(font, x, y, available, 20, Component.literal(rule.get("label").getAsString()));
                    color.setMaxLength(7);
                    color.setValue(String.format("#%06X", config.number(module, key) & 0xFFFFFF));
                    color.setResponder(value -> { if (value.matches("#[0-9a-fA-F]{6}")) config.setSetting(module, key, new JsonPrimitive((int) (0xFF000000L | Long.parseLong(value.substring(1), 16)))); });
                    addRenderableWidget(color);
                }
                default -> {
                    int step = rule.get("step").getAsInt();
                    var minus = button(x, y, 24, "-", false, () -> { config.setSetting(module, key, new JsonPrimitive(config.number(module, key) - step)); init(); });
                    minus.active = config.number(module, key) > rule.get("min").getAsInt();
                    var plus = button(width - 36, y, 24, "+", false, () -> { config.setSetting(module, key, new JsonPrimitive(config.number(module, key) + step)); init(); });
                    plus.active = config.number(module, key) < rule.get("max").getAsInt();
                }
            }
        }
        int w = Math.max(36, Math.min(95, (width - 40) / 4));
        button(12, height - 27, w, "Back", false, this::onClose);
        button(20 + w, height - 27, w, "Reset", false, () -> { config.resetModule(module); init(); });
        var prev = button(width - 2 * w - 20, height - 27, w, "< " + (page + 1), false, () -> { page--; init(); }); prev.active = page > 0;
        var next = button(width - w - 12, height - 27, w, ">", false, () -> { page++; init(); }); next.active = (page + 1) * rows < rules.size();
    }
    @Override public void render(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        for (int i = page * rows; i < Math.min(rules.size(), (page + 1) * rows); i++) {
            var entry = rules.get(i); int y = 83 + (i - page * rows) * 28, x = Math.max(120, width / 2);
            graphics.drawString(font, font.plainSubstrByWidth(entry.getValue().get("label").getAsString(), x - 24), 12, y, EternalUi.MUTED, false);
            if (entry.getValue().get("type").getAsString().equals("number"))
                graphics.drawCenteredString(font, Integer.toString(CoreConfig.INSTANCE.number(module, entry.getKey())), (x + width - 12) / 2, y, EternalUi.TEXT);
        }
        graphics.drawString(font, font.plainSubstrByWidth(message, width - 24), 12, height - 47, EternalUi.MUTED, false);
        super.render(graphics, mouseX, mouseY, delta);
    }
    @Override public boolean keyPressed(KeyEvent event) {
        if (!binding) return super.keyPressed(event);
        if (event.key() == 256) { binding = false; init(); return true; }
        int key = event.key() == 259 || event.key() == 261 ? 0 : event.key();
        var config = CoreConfig.INSTANCE;
        if (key == config.openKey() || key == config.hudEditorKey() || key == config.zoomKey() || key == config.perspectiveKey()) {
            message = "Reserved Eternal key. Choose another.";
            return true;
        }
        config.setSetting(module, "keybind", new JsonPrimitive(key));
        binding = false; init(); return true;
    }
    @Override public boolean mouseScrolled(double x, double y, double horizontal, double vertical) {
        if (vertical != 0) { page += vertical < 0 ? 1 : -1; init(); return true; }
        return super.mouseScrolled(x, y, horizontal, vertical);
    }
}
