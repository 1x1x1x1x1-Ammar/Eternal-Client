package gg.eternal.core.ui;

/** One coordinate space for both menu drawing and pointer hit testing. */
public record MenuViewport(int width, int height, float scale) {
    public static MenuViewport fit(int width, int height, int minimumWidth, int minimumHeight) {
        float scale = Math.min(1.0F, Math.min(Math.max(1, width) / (float) minimumWidth,
                Math.max(1, height) / (float) minimumHeight));
        return new MenuViewport(Math.round(width / scale), Math.round(height / scale), scale);
    }

    public int pointer(double value) { return (int) Math.floor(value / scale); }
}
