package gg.eternal.core.ui;

/** Layout stays in Minecraft's GUI coordinates; only the amount of content changes. */
public record MenuLayout(int x, int width, int top, int bottom, int rowHeight, int columns) {
    public static MenuLayout list(int screenWidth, int screenHeight, int top, int rowHeight) {
        return new MenuLayout(12, screenWidth - 24, top, screenHeight - 54, rowHeight, 1);
    }

    public static MenuLayout modules(int screenWidth, int screenHeight) {
        int columns = Math.max(1, Math.min(4, (screenWidth - 16) / 180));
        return new MenuLayout(12, screenWidth - 24, 102, screenHeight - 40, 76, columns);
    }

    public int rows() { return Math.max(1, (bottom - top) / rowHeight); }
    public int capacity() { return rows() * columns; }
    public int cellWidth() { return (width - (columns - 1) * 8) / columns; }
    public int cellX(int index) { return x + index % columns * (cellWidth() + 8); }
    public int cellY(int index) { return top + index / columns * rowHeight; }
    public int pages(int count) { return Math.max(1, (count + capacity() - 1) / capacity()); }
    public int clampPage(int page, int count) { return Math.max(0, Math.min(page, pages(count) - 1)); }
}
