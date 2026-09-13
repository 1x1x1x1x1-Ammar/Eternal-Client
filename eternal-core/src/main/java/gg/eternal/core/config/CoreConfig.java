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

    private final Path file = FabricLoader.getInstance().getConfigDir().resolve("eternal-core.json");

    private CoreConfig() {
        for (String name : new String[]{
                "FPS", "CPS", "Keystrokes", "Coordinates", "Ping",
                "Speed", "Direction", "Memory", "Session", "Zoom"
        }) {
            enabled.put(name, true);
        }
        load();
    }

    public boolean on(String name) {
        return enabled.getOrDefault(name, true);
    }

    public void toggle(String name) {
        enabled.put(name, !on(name));
        save();
    }

    public int[] pos(String name, int defaultX, int defaultY) {
        return positions.computeIfAbsent(name, ignored -> new int[]{defaultX, defaultY});
    }

    public void setPos(String name, int x, int y) {
        positions.put(name, new int[]{x, y});
        save();
    }

    public void reset() {
        positions.clear();
        save();
    }

    private void load() {
        try {
            if (!Files.exists(file)) return;
            JsonObject root = JsonParser.parseString(Files.readString(file)).getAsJsonObject();

            if (root.has("enabled")) {
                for (var entry : root.getAsJsonObject("enabled").entrySet()) {
                    enabled.put(entry.getKey(), entry.getValue().getAsBoolean());
                }
            }

            if (root.has("positions")) {
                for (var entry : root.getAsJsonObject("positions").entrySet()) {
                    JsonArray position = entry.getValue().getAsJsonArray();
                    if (position.size() >= 2) {
                        positions.put(entry.getKey(), new int[]{position.get(0).getAsInt(), position.get(1).getAsInt()});
                    }
                }
            }
        } catch (Exception ignored) {
            // A corrupt config should never prevent Minecraft from launching.
        }
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
                array.add(position[0]);
                array.add(position[1]);
                positionsJson.add(name, array);
            });

            root.add("enabled", enabledJson);
            root.add("positions", positionsJson);
            Files.writeString(file, new GsonBuilder().setPrettyPrinting().create().toJson(root), StandardCharsets.UTF_8);
        } catch (Exception ignored) {
            // Runtime config persistence is best-effort and must not crash the game.
        }
    }
}
