package gg.eternal.core;

import gg.eternal.core.config.CoreConfig;
import net.minecraft.client.Minecraft;
import net.minecraft.server.level.ParticleStatus;

/** Applies supported Minecraft options, retaining the user's previous values for restoration. */
final class PerformanceController {
    private static Snapshot previous;
    private record Snapshot(int chunks, double entities, ParticleStatus particles, boolean shadows, int fps) {}
    private PerformanceController() {}
    static void tick(Minecraft mc, CoreConfig config) {
        var options = mc.options;
        if (config.on("FPSOptimizer")) {
            if (previous == null) previous = new Snapshot(options.renderDistance().get(), options.entityDistanceScaling().get(),
                    options.particles().get(), options.entityShadows().get(), options.framerateLimit().get());
            int chunks = config.number("FPSOptimizer", "renderDistance");
            if (options.renderDistance().get() != chunks) options.renderDistance().set(chunks);
            options.entityDistanceScaling().set(config.number("FPSOptimizer", "entityDistance") / 100.0D);
            options.particles().set(ParticleStatus.values()[config.number("FPSOptimizer", "particles")]);
            options.entityShadows().set(config.flag("FPSOptimizer", "entityShadows"));
            options.framerateLimit().set(mc.isWindowActive() ? previous.fps : Math.min(previous.fps, config.number("FPSOptimizer", "backgroundFps")));
        } else if (previous != null) {
            options.renderDistance().set(previous.chunks);
            options.entityDistanceScaling().set(previous.entities);
            options.particles().set(previous.particles);
            options.entityShadows().set(previous.shadows);
            options.framerateLimit().set(previous.fps);
            previous = null;
        }
    }
}
