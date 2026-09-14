package gg.eternal.core.config;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.fabricmc.loader.api.FabricLoader;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

public final class CoreConfig {
    public static final CoreConfig INSTANCE = new CoreConfig();

    public final Map<String, Boolean> enabled = new LinkedHashMap<>();
    public final Map<String, int[]> positions = new LinkedHashMap<>();

    private int accentColor = 0xFFFF3038;
    private int hudAlpha = 196;
    private int zoomFov = 30;
    private int snap = 4;
    private boolean notifications = true;
    private int openKey = 344;      // GLFW_KEY_RIGHT_SHIFT
    private int hudEditorKey = 72;  // H
    private int zoomKey = 67;       // C

    private final Path file = FabricLoader.getInstance().getConfigDir().resolve("eternal-core.json");

    private CoreConfig() {
        for (String name : new String[]{
                "Watermark", "FPS", "CPS", "Keystrokes", "Coordinates", "Ping",
                "Speed", "Direction", "Memory", "Session", "Clock", "Zoom"
        }) enabled.put(name, true);
        load();
    }

    public boolean on(String name) { return enabled.getOrDefault(name, true); }
    public void toggle(String name) { enabled.put(name, !on(name)); save(); }
    public void setAllModules(boolean value) {
        for (String name : enabled.keySet()) {
            if (!"Zoom".equals(name)) enabled.put(name, value);
        }
        save();
    }

    public int[] pos(String name, int defaultX, int defaultY) { return positions.computeIfAbsent(name, ignored -> new int[]{defaultX, defaultY}); }
    public void setPos(String name, int x, int y) { positions.put(name, new int[]{x, y}); save(); }
    public int accentColor() { return accentColor; }
    public int hudAlpha() { return hudAlpha; }
    public int zoomFov() { return zoomFov; }
    public int snap() { return snap; }
    public boolean notifications() { return notifications; }
    public int openKey() { return openKey; }
    public int hudEditorKey() { return hudEditorKey; }
    public int zoomKey() { return zoomKey; }

    public void setAccentColor(int color) { accentColor = 0xFF000000 | (color & 0x00FFFFFF); save(); }
    public void setHudAlpha(int value) { hudAlpha = clamp(value, 80, 245); save(); }
    public void setZoomFov(int value) { zoomFov = clamp(value, 10, 60); save(); }
    public void setSnap(int value) { snap = value <= 2 ? 2 : value <= 4 ? 4 : 8; save(); }
    public void setNotifications(boolean value) { notifications = value; save(); }
    public void setOpenKey(int value) { openKey = normalizeKey(value, 344); save(); }
    public void setHudEditorKey(int value) { hudEditorKey = normalizeKey(value, 72); save(); }
    public void setZoomKey(int value) { zoomKey = normalizeKey(value, 67); save(); }
    public void reset() { positions.clear(); save(); }

    public void applyPreset(String preset, int screenWidth, int screenHeight) {
        positions.clear();
        int right = Math.max(12, screenWidth - 205);
        int lower = Math.max(90, screenHeight - 106);
        int centerX = Math.max(12, screenWidth / 2 - 46);

        if ("COMPACT".equalsIgnoreCase(preset)) {
            positions.put("Watermark", new int[]{10, 10});
            positions.put("FPS", new int[]{10, 34});
            positions.put("Ping", new int[]{10, 55});
            positions.put("Coordinates", new int[]{10, 76});
            positions.put("Speed", new int[]{right, 10});
            positions.put("Direction", new int[]{right, 31});
            positions.put("Memory", new int[]{right, 52});
            positions.put("Clock", new int[]{right, 73});
            positions.put("CPS", new int[]{10, lower});
            positions.put("Keystrokes", new int[]{10, lower + 22});
            positions.put("Session", new int[]{right, lower});
        } else if ("CORNERS".equalsIgnoreCase(preset)) {
            positions.put("Watermark", new int[]{10, 10});
            positions.put("FPS", new int[]{10, 34});
            positions.put("CPS", new int[]{10, 55});
            positions.put("Coordinates", new int[]{right, 10});
            positions.put("Ping", new int[]{right, 31});
            positions.put("Clock", new int[]{right, 52});
            positions.put("Keystrokes", new int[]{10, lower});
            positions.put("Speed", new int[]{right, lower});
            positions.put("Direction", new int[]{right, lower + 21});
            positions.put("Memory", new int[]{10, lower - 21});
            positions.put("Session", new int[]{right, lower - 21});
        } else {
            positions.put("Watermark", new int[]{10, 10});
            positions.put("FPS", new int[]{10, 34});
            positions.put("CPS", new int[]{10, 55});
            positions.put("Ping", new int[]{10, 76});
            positions.put("Coordinates", new int[]{right, 10});
            positions.put("Direction", new int[]{right, 31});
            positions.put("Speed", new int[]{right, 52});
            positions.put("Memory", new int[]{right, 73});
            positions.put("Clock", new int[]{right, 94});
            positions.put("Session", new int[]{right, 115});
            positions.put("Keystrokes", new int[]{centerX, lower});
        }
        save();
    }

    private void load() {
        try {
            if (!Files.exists(file)) return;
            JsonObject root = JsonParser.parseString(Files.readString(file)).getAsJsonObject();
            if (root.has("enabled")) for (var entry : root.getAsJsonObject("enabled").entrySet()) enabled.put(entry.getKey(), entry.getValue().getAsBoolean());
            if (root.has("positions")) {
                for (var entry : root.getAsJsonObject("positions").entrySet()) {
                    JsonArray position = entry.getValue().getAsJsonArray();
                    if (position.size() >= 2) positions.put(entry.getKey(), new int[]{position.get(0).getAsInt(), position.get(1).getAsInt()});
                }
            }
            if (root.has("accentColor")) accentColor = 0xFF000000 | (root.get("accentColor").getAsInt() & 0x00FFFFFF);
            if (root.has("hudAlpha")) hudAlpha = clamp(root.get("hudAlpha").getAsInt(), 80, 245);
            if (root.has("zoomFov")) zoomFov = clamp(root.get("zoomFov").getAsInt(), 10, 60);
            if (root.has("snap")) setSnapWithoutSave(root.get("snap").getAsInt());
            if (root.has("notifications")) notifications = root.get("notifications").getAsBoolean();
            if (root.has("openKey")) openKey = normalizeKey(root.get("openKey").getAsInt(), 344);
            if (root.has("hudEditorKey")) hudEditorKey = normalizeKey(root.get("hudEditorKey").getAsInt(), 72);
            if (root.has("zoomKey")) zoomKey = normalizeKey(root.get("zoomKey").getAsInt(), 67);
        } catch (Exception ignored) {}
    }

    public void save() {
        try {
            Files.createDirectories(file.getParent());
            JsonObject root = new JsonObject();
            JsonObject enabledJson = new JsonObject();
            JsonObject positionsJson = new JsonObject();
            enabled.forEach(enabledJson::addProperty);
            positions.forEach((name, position) -> {
                JsonArray array = new JsonArray();
                array.add(position[0]); array.add(position[1]);
                positionsJson.add(name, array);
            });
            root.add("enabled", enabledJson);
            root.add("positions", positionsJson);
            root.addProperty("accentColor", accentColor);
            root.addProperty("hudAlpha", hudAlpha);
            root.addProperty("zoomFov", zoomFov);
            root.addProperty("snap", snap);
            root.addProperty("notifications", notifications);
            root.addProperty("openKey", openKey);
            root.addProperty("hudEditorKey", hudEditorKey);
            root.addProperty("zoomKey", zoomKey);
            Files.writeString(file, new GsonBuilder().setPrettyPrinting().create().toJson(root), StandardCharsets.UTF_8);
        } catch (Exception ignored) {}
    }

    private void setSnapWithoutSave(int value) { snap = value <= 2 ? 2 : value <= 4 ? 4 : 8; }
    private static int normalizeKey(int value, int fallback) { return value >= 32 && value <= 348 ? value : fallback; }
    private static int clamp(int value, int min, int max) { return Math.max(min, Math.min(max, value)); }
}
