package gg.eternal.core.config;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.fabricmc.loader.api.FabricLoader;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.util.Map;

public final class CoreConfig {
    // IMPORTANT: MODULES must be initialized before INSTANCE. The singleton constructor
    // iterates this catalog, so reversing these declarations crashes Fabric during the
    // client entrypoint with ExceptionInInitializerError/NullPointerException.
    public static final String[] MODULES = {
            "Watermark", "FPS", "CPS", "Keystrokes", "Coordinates", "Ping",
            "Speed", "Direction", "Health", "Armor", "Food", "Server",
            "Memory", "Session", "Clock", "Zoom"
    };
    public static final CoreConfig INSTANCE = new CoreConfig();

    public final Map<String, Boolean> enabled = new LinkedHashMap<>();
    public final Map<String, int[]> positions = new LinkedHashMap<>();

    private int accentColor = 0xFFFF3038;
    private int hudAlpha = 196;
    private int zoomFov = 30;
    private int snap = 4;
    private boolean notifications = true;
    private int openKey = 344;
    private int hudEditorKey = 72;
    private int zoomKey = 67;

    private final Path file = FabricLoader.getInstance().getConfigDir().resolve("eternal-core.json");

    private CoreConfig() {
        // Clean installs start with every module disabled. The player explicitly chooses
        // what appears on-screen from Modules or the HUD editor instead of Eternal
        // covering a fresh Minecraft session with telemetry immediately.
        for (String name : MODULES) enabled.put(name, false);
        load();
    }

    public boolean on(String name) { return enabled.getOrDefault(name, false); }
    public void toggle(String name) { enabled.put(name, !on(name)); save(); }
    public void setAllModules(boolean value) {
        for (String name : enabled.keySet()) if (!"Zoom".equals(name)) enabled.put(name, value);
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
            positions.put("Health", new int[]{10, 97});
            positions.put("Armor", new int[]{10, 118});
            positions.put("Food", new int[]{10, 139});
            positions.put("Speed", new int[]{right, 10});
            positions.put("Direction", new int[]{right, 31});
            positions.put("Server", new int[]{right, 52});
            positions.put("Memory", new int[]{right, 73});
            positions.put("Clock", new int[]{right, 94});
            positions.put("CPS", new int[]{10, lower});
            positions.put("Keystrokes", new int[]{10, Math.max(54, lower - 44)});
            positions.put("Session", new int[]{right, lower});
        } else if ("CORNERS".equalsIgnoreCase(preset)) {
            positions.put("Watermark", new int[]{10, 10});
            positions.put("FPS", new int[]{10, 34});
            positions.put("CPS", new int[]{10, 55});
            positions.put("Health", new int[]{10, 76});
            positions.put("Armor", new int[]{10, 97});
            positions.put("Food", new int[]{10, 118});
            positions.put("Coordinates", new int[]{right, 10});
            positions.put("Ping", new int[]{right, 31});
            positions.put("Server", new int[]{right, 52});
            positions.put("Clock", new int[]{right, 73});
            positions.put("Keystrokes", new int[]{10, lower});
            positions.put("Speed", new int[]{right, lower});
            positions.put("Direction", new int[]{right, Math.max(54, lower - 21)});
            positions.put("Memory", new int[]{10, Math.max(54, lower - 21)});
            positions.put("Session", new int[]{right, Math.max(54, lower - 42)});
        } else {
            positions.put("Watermark", new int[]{10, 10});
            positions.put("FPS", new int[]{10, 34});
            positions.put("CPS", new int[]{10, 55});
            positions.put("Ping", new int[]{10, 76});
            positions.put("Health", new int[]{10, 97});
            positions.put("Armor", new int[]{10, 118});
            positions.put("Food", new int[]{10, 139});
            positions.put("Coordinates", new int[]{right, 10});
            positions.put("Direction", new int[]{right, 31});
            positions.put("Speed", new int[]{right, 52});
            positions.put("Server", new int[]{right, 73});
            positions.put("Memory", new int[]{right, 94});
            positions.put("Clock", new int[]{right, 115});
            positions.put("Session", new int[]{right, 136});
            positions.put("Keystrokes", new int[]{centerX, lower});
        }
        save();
    }

    private void load() {
        if (!Files.exists(file)) return;
        try {
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
        } catch (Exception error) {
            System.err.println("[Eternal Core] Invalid config, restoring defaults: " + error.getMessage());
            try {
                Path backup = file.resolveSibling("eternal-core.corrupt-" + System.currentTimeMillis() + ".json");
                Files.move(file, backup, StandardCopyOption.REPLACE_EXISTING);
            } catch (Exception backupError) {
                System.err.println("[Eternal Core] Could not back up invalid config: " + backupError.getMessage());
            }
            positions.clear();
        }
    }

    public synchronized void save() {
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

            String json = new GsonBuilder().setPrettyPrinting().create().toJson(root);
            Path temp = file.resolveSibling(file.getFileName() + ".tmp");
            Files.writeString(temp, json, StandardCharsets.UTF_8);
            try {
                Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (Exception atomicUnavailable) {
                Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception error) {
            System.err.println("[Eternal Core] Could not save config: " + error.getMessage());
        }
    }

    private void setSnapWithoutSave(int value) { snap = value <= 2 ? 2 : value <= 4 ? 4 : 8; }
    private static int normalizeKey(int value, int fallback) { return value >= 32 && value <= 348 ? value : fallback; }
    private static int clamp(int value, int min, int max) { return Math.max(min, Math.min(max, value)); }
}
