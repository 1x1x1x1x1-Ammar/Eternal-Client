import gg.eternal.core.ui.MenuViewport;

public class MenuViewportTest {
    public static void main(String[] args) {
        int[][] windows = {{320, 240}, {480, 270}, {854, 480}, {1280, 720}, {1920, 1080}, {3840, 2160}, {390, 844}};
        for (int[] window : windows) {
            for (int guiScale = 1; guiScale <= 8; guiScale++) {
                int width = Math.max(1, window[0] / guiScale);
                int height = Math.max(1, window[1] / guiScale);
                MenuViewport view = MenuViewport.fit(width, height, 1000, 560);
                if (view.width() < 999 || view.height() < 559) throw new AssertionError("Undersized layout");
                if (view.width() * view.scale() > width + 1 || view.height() * view.scale() > height + 1) throw new AssertionError("Clipped layout");
                for (int x : new int[]{12, 130, 480, 920}) {
                    int restored = view.pointer((x + .5) * view.scale());
                    if (restored != x) throw new AssertionError("Pointer drift");
                }
            }
        }
    }
}
