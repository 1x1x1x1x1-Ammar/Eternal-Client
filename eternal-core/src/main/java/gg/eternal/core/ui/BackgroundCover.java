package gg.eternal.core.ui;

/** Center-crops source pixels instead of submitting a quad outside the viewport. */
public record BackgroundCover(float u, float v, int width, int height) {
    public static BackgroundCover fit(int width, int height, int imageWidth, int imageHeight) {
        double scale = Math.max(Math.max(1, width) / (double) imageWidth, Math.max(1, height) / (double) imageHeight);
        int sourceWidth = Math.min(imageWidth, Math.max(1, (int) Math.round(width / scale)));
        int sourceHeight = Math.min(imageHeight, Math.max(1, (int) Math.round(height / scale)));
        return new BackgroundCover((imageWidth - sourceWidth) / 2.0F, (imageHeight - sourceHeight) / 2.0F, sourceWidth, sourceHeight);
    }
}
