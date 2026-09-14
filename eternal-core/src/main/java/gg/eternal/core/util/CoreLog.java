package gg.eternal.core.util;

import net.fabricmc.loader.api.FabricLoader;

import java.io.PrintWriter;
import java.io.StringWriter;
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

    public static void info(String message) { write("INFO", message, null, false); }
    public static void warn(String message) { write("WARN", message, null, false); }
    public static void error(String message, Throwable error) { write("ERROR", message, error, true); }
    public static Path file() { return FILE; }

    private static synchronized void write(String level, String message, Throwable error, boolean stderr) {
        String detail = message == null ? "" : message;
        if (error != null) detail += " :: " + error.getClass().getName() + ": " + String.valueOf(error.getMessage());
        String line = "[Eternal Core/" + level + "] " + detail;
        if (stderr) System.err.println(line); else System.out.println(line);

        String stack = "";
        if (error != null) {
            StringWriter writer = new StringWriter();
            error.printStackTrace(new PrintWriter(writer));
            stack = writer.toString();
            if (stderr) System.err.print(stack);
        }

        try {
            Files.createDirectories(FILE.getParent());
            String prefix = "[" + LocalDateTime.now().format(FORMAT) + "] ";
            StringBuilder disk = new StringBuilder(prefix).append(line).append(System.lineSeparator());
            if (!stack.isBlank()) {
                for (String stackLine : stack.split("\\R")) {
                    if (!stackLine.isBlank()) disk.append(prefix).append(stackLine).append(System.lineSeparator());
                }
            }
            Files.writeString(FILE, disk.toString(), StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (Exception loggingError) {
            System.err.println("[Eternal Core/WARN] Could not persist diagnostic log: " + loggingError.getMessage());
        }
    }
}
