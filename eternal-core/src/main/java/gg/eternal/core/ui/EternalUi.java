package gg.eternal.core.ui;

import net.minecraft.client.gui.GuiGraphics;

public final class EternalUi {
    public static final int TEXT = 0xFFF7F8FA;
    public static final int MUTED = 0xFF9299A5;
    public static final int DIM = 0xFF5B626E;
    public static final int GREEN = 0xFF58ED89;
    public static final int RED = 0xFFFF3038;
    public static final int SURFACE = 0xEE0B0D11;
    public static final int SURFACE_STRONG = 0xFA0D1015;
    public static final int SURFACE_SOFT = 0xD70F1217;
    public static final int LINE = 0x34474E59;
    public static final int LINE_STRONG = 0x675A626F;

    private EternalUi() {}

    public static float clamp01(float value) {
        return Math.max(0.0F, Math.min(1.0F, value));
    }

    public static float easeOutCubic(float value) {
        float t = clamp01(value);
        float inv = 1.0F - t;
        return 1.0F - inv * inv * inv;
    }

    public static int alpha(int color, int alpha) {
        return (Math.max(0, Math.min(255, alpha)) << 24) | (color & 0x00FFFFFF);
    }

    public static int mix(int from, int to, float amount) {
        float t = clamp01(amount);
        int a = Math.round(((from >>> 24) & 0xFF) + (((to >>> 24) & 0xFF) - ((from >>> 24) & 0xFF)) * t);
        int r = Math.round(((from >>> 16) & 0xFF) + (((to >>> 16) & 0xFF) - ((from >>> 16) & 0xFF)) * t);
        int g = Math.round(((from >>> 8) & 0xFF) + (((to >>> 8) & 0xFF) - ((from >>> 8) & 0xFF)) * t);
        int b = Math.round((from & 0xFF) + ((to & 0xFF) - (from & 0xFF)) * t);
        return (a << 24) | (r << 16) | (g << 8) | b;
    }

    public static int accentGlow(int accent, int alpha) {
        return alpha(accent, alpha);
    }

    public static int livingAccent(int accent, int y) {
        double wave = 0.08D + 0.18D * (0.5D + 0.5D * Math.sin(System.currentTimeMillis() / 720.0D + y * 0.023D));
        int r = (accent >> 16) & 0xFF;
        int g = (accent >> 8) & 0xFF;
        int b = accent & 0xFF;
        r = Math.min(255, r + (int) ((255 - r) * wave));
        g = Math.min(255, g + (int) ((255 - g) * wave));
        b = Math.min(255, b + (int) ((255 - b) * wave));
        return 0xFF000000 | (r << 16) | (g << 8) | b;
    }

    public static void backdrop(GuiGraphics graphics, int width, int height, int accent) {
        graphics.fill(0, 0, width, height, 0xFF050609);
        graphics.fill(0, 0, width, Math.max(1, height / 3), 0xFF080A0E);
        graphics.fill(0, Math.max(1, height / 3), width, height, 0xFF05070A);

        int centerX = width / 2;
        int centerY = Math.max(1, height / 3);
        for (int i = 8; i >= 1; i--) {
            int radiusX = Math.max(90, width / 5) + i * 42;
            int radiusY = Math.max(70, height / 6) + i * 24;
            int alpha = Math.max(2, 21 - i * 2);
            graphics.fill(
                    Math.max(0, centerX - radiusX),
                    Math.max(0, centerY - radiusY),
                    Math.min(width, centerX + radiusX),
                    Math.min(height, centerY + radiusY),
                    accentGlow(accent, alpha));
        }

        int grid = 38;
        int drift = (int) ((System.currentTimeMillis() / 46L) % grid);
        for (int x = -grid + drift; x < width; x += grid) {
            graphics.fill(x, 0, x + 1, height, 0x08000000 | (accent & 0x00FFFFFF));
        }
        for (int y = -grid + drift / 2; y < height; y += grid) {
            graphics.fill(0, y, width, y + 1, 0x06000000 | (accent & 0x00FFFFFF));
        }

        int sweep = (int) ((System.currentTimeMillis() / 9L) % Math.max(1, width + 220)) - 220;
        graphics.fill(sweep, 0, Math.min(width, sweep + 140), 1, 0x54FFFFFF);
        graphics.fill(0, height - 2, width, height, 0x22000000 | (accent & 0x00FFFFFF));
    }

    public static void veil(GuiGraphics graphics, int width, int height, int accent) {
        graphics.fill(0, 0, width, height, 0xB806070A);
        int cx = width / 2;
        int cy = height / 2;
        for (int i = 5; i >= 1; i--) {
            int w = Math.max(160, width / 4) + i * 46;
            int h = Math.max(100, height / 5) + i * 30;
            graphics.fill(Math.max(0, cx - w), Math.max(0, cy - h), Math.min(width, cx + w), Math.min(height, cy + h), accentGlow(accent, 4 + i * 3));
        }
    }

    public static void glass(GuiGraphics graphics, int x, int y, int width, int height, int accent, boolean active) {
        int glow = active ? 24 : 12;
        graphics.fill(x - 6, y - 6, x + width + 6, y + height + 6, 0x10000000);
        graphics.fill(x - 3, y - 3, x + width + 3, y + height + 3, active ? accentGlow(accent, glow) : 0x1A000000);
        graphics.fill(x, y, x + width, y + height, active ? SURFACE_STRONG : SURFACE);
        graphics.renderOutline(x, y, width, height, active ? alpha(accent, 112) : LINE);
        graphics.fill(x + 1, y + 1, x + width - 1, y + 2, active ? alpha(0xFFFFFFFF, 45) : 0x24FFFFFF);
        graphics.fill(x + 1, y + height - 2, x + width - 1, y + height - 1, 0x16000000);
    }

    public static void accentRail(GuiGraphics graphics, int x, int y, int height, int accent, boolean active) {
        graphics.fill(x, y, x + 2, y + height, active ? accent : alpha(accent, 72));
        if (active) graphics.fill(x + 2, y, x + 5, y + height, alpha(accent, 18));
    }

    public static void chip(GuiGraphics graphics, int x, int y, int width, int height, int accent, boolean active) {
        int fill = active ? alpha(accent, 42) : 0xD20B0E12;
        graphics.fill(x, y, x + width, y + height, fill);
        graphics.renderOutline(x, y, width, height, active ? alpha(accent, 120) : 0x3A49515C);
        if (active) graphics.fill(x, y, x + width, y + 1, alpha(0xFFFFFFFF, 52));
    }

    public static void divider(GuiGraphics graphics, int x, int y, int width, int accent) {
        graphics.fill(x, y, x + width, y + 1, 0x263E454F);
        int sweep = (int) ((System.currentTimeMillis() / 14L) % Math.max(1, width + 70)) - 70;
        int sx = x + sweep;
        graphics.fill(Math.max(x, sx), y, Math.min(x + width, sx + 54), y + 1, alpha(accent, 118));
    }

    public static void progress(GuiGraphics graphics, int x, int y, int width, int accent, float value) {
        graphics.fill(x, y, x + width, y + 2, 0xFF14181D);
        graphics.fill(x, y, x + Math.max(1, Math.round(width * clamp01(value))), y + 2, accent);
    }
}
