package gg.eternal.core.util;

import net.fabricmc.loader.api.FabricLoader;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class CoreLog {
    private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Path FILE = FabricLoader.getInstance().getConfigDir().resolve("eternal-core.log");

    private CoreLog() {}

    public static void info(String message) { write("INFO", message, false); }
    public static void warn(String message) { write("WARN", message, false); }
    public static void error(String message, Throwable error) {
        String detail = error == null ? message : message + " :: " + error.getClass().getSimpleName() + ": " + error.getMessage();
        write("ERROR", detail, true);
    }

    private static synchronized void write(String level, String message, boolean stderr) {
        String line = "[Eternal Core/" + level + "] " + message;
        if (stderr) System.err.println(line); else System.out.println(line);
        try {
            Files.createDirectories(FILE.getParent());
            String disk = "[" + LocalDateTime.now().format(FORMAT) + "] " + line + System.lineSeparator();
            Files.writeString(FILE, disk, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (Exception ignored) {
            // Console output above remains available to the Eternal launcher even if disk logging fails.
        }
    }
}
