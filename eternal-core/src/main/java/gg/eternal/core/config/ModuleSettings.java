package gg.eternal.core.config;

import com.google.gson.*;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/** Shared schema is bundled in both the standalone JAR and launcher. */
public final class ModuleSettings {
    private static final JsonObject SCHEMA = readSchema();
    private ModuleSettings() {}
    private static JsonObject readSchema() {
        try (var stream = ModuleSettings.class.getResourceAsStream("/assets/eternal-core/module-settings.json")) {
            if (stream == null) throw new IllegalStateException("Module settings schema missing");
            return JsonParser.parseReader(new InputStreamReader(stream, StandardCharsets.UTF_8)).getAsJsonObject();
        } catch (Exception error) { throw new IllegalStateException("Cannot load module settings", error); }
    }
    public static boolean hud(String name) {
        for (var value : SCHEMA.getAsJsonArray("utilities")) if (value.getAsString().equals(name)) return false;
        return true;
    }
    public static Map<String, JsonObject> rules(String name) {
        Map<String, JsonObject> result = new LinkedHashMap<>();
        if (hud(name)) SCHEMA.getAsJsonObject("hud").entrySet().forEach(e -> result.put(e.getKey(), e.getValue().getAsJsonObject()));
        JsonObject module = SCHEMA.getAsJsonObject("modules").getAsJsonObject(name);
        if (module != null) module.entrySet().forEach(e -> result.put(e.getKey(), e.getValue().getAsJsonObject()));
        return result;
    }
    public static JsonElement clean(JsonObject rule, JsonElement value) {
        try {
            return switch (rule.get("type").getAsString()) {
                case "boolean" -> value.isJsonPrimitive() && value.getAsJsonPrimitive().isBoolean() ? value : rule.get("default");
                case "color" -> new JsonPrimitive(value.getAsInt());
                default -> new JsonPrimitive(Math.max(rule.get("min").getAsInt(), Math.min(rule.get("max").getAsInt(), value.getAsInt())));
            };
        } catch (Exception ignored) { return rule.get("default"); }
    }
    public static JsonObject normalize(JsonObject input) {
        JsonObject output = new JsonObject();
        for (String name : SCHEMA.getAsJsonObject("modules").keySet()) {
            JsonObject current = input.has(name) && input.get(name).isJsonObject() ? input.getAsJsonObject(name) : new JsonObject();
            JsonObject values = new JsonObject();
            rules(name).forEach((key, rule) -> values.add(key, clean(rule, current.get(key))));
            int key = 0;
            try { key = Math.max(0, Math.min(348, current.get("keybind").getAsInt())); } catch (Exception ignored) {}
            values.addProperty("keybind", key);
            output.add(name, values);
        }
        return output;
    }
}
