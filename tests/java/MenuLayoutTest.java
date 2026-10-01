import gg.eternal.core.ui.MenuLayout;
import gg.eternal.core.ui.BackgroundCover;

public class MenuLayoutTest {
    public static void main(String[] args) {
        int[][] windows = {{640, 480}, {854, 480}, {1280, 720}, {1920, 1080}, {2560, 1440}, {3840, 2160}, {3440, 1440}};
        int checked = 0;
        for (int[] window : windows) for (int scale = 1; scale <= 8; scale++) {
            // Minecraft limits the GUI to at least 320 x 240 before applying Unicode rounding.
            int actual = Math.max(1, Math.min(scale, Math.min(window[0] / 320, window[1] / 240)));
            int width = (int) Math.ceil(window[0] / (double) actual);
            int height = (int) Math.ceil(window[1] / (double) actual);
            for (MenuLayout layout : new MenuLayout[]{MenuLayout.modules(width, height), MenuLayout.list(width, height, 76, 30), MenuLayout.list(width, height, 76, 28)}) {
                for (int i = 0; i < layout.capacity(); i++) {
                    check(layout.cellX(i) >= 12, "Left clipping");
                    check(layout.cellX(i) + layout.cellWidth() <= width - 12, "Right clipping");
                    check(layout.cellY(i) >= 76, "Header overlap");
                    check(layout.cellY(i) + layout.rowHeight() <= layout.bottom(), "Footer overlap");
                }
                check(layout.pages(35) * layout.capacity() >= 35, "Unreachable modules");
                check(layout.clampPage(100, 35) == layout.pages(35) - 1, "Page overflow after resize");
                check(layout.clampPage(-1, 35) == 0, "Negative page");
                check(layout.clampPage(3, 0) == 0, "Empty list page");
            }
            BackgroundCover crop = BackgroundCover.fit(width, height, 1672, 941);
            check(crop.u() >= 0 && crop.v() >= 0, "Negative texture coordinates");
            check(crop.u() + crop.width() <= 1672 && crop.v() + crop.height() <= 941, "Texture outside image");
            check(Math.abs(crop.width() / (double) crop.height() - width / (double) height) < .02, "Distorted background");
            checked++;
        }
        System.out.println("PASS: native layouts and texture crops at " + checked + " window / GUI-scale combinations");
    }
    private static void check(boolean condition, String message) { if (!condition) throw new AssertionError(message); }
}
