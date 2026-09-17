package gg.eternal.core.ui;

import gg.eternal.core.config.CoreConfig;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

import java.util.ArrayDeque;
import java.util.Deque;

public final class NotificationCenter {
    private static final Deque<Notice> NOTICES = new ArrayDeque<>();
    private static final long LIFE_MS = 3000L;
    private static final long ENTER_MS = 210L;
    private static final long EXIT_MS = 420L;

    private NotificationCenter() {}

    public static void push(String title, String message) {
        if (!CoreConfig.INSTANCE.notifications()) return;
        while (NOTICES.size() >= 4) NOTICES.removeFirst();
        NOTICES.addLast(new Notice(title, message, System.currentTimeMillis()));
    }

    public static void render(GuiGraphics graphics) {
        Minecraft mc = Minecraft.getInstance();
        if (mc.player == null || mc.options.hideGui) return;

        long now = System.currentTimeMillis();
        while (!NOTICES.isEmpty() && now - NOTICES.peekFirst().createdAt > LIFE_MS) NOTICES.removeFirst();
        if (NOTICES.isEmpty()) return;

        int screenWidth = mc.getWindow().getGuiScaledWidth();
        int screenHeight = mc.getWindow().getGuiScaledHeight();
        int accent = CoreConfig.INSTANCE.accentColor();
        int index = 0;
        int total = NOTICES.size();

        for (Notice notice : NOTICES) {
            int messageWidth = mc.font.width(notice.message);
            int titleWidth = mc.font.width(notice.title.toUpperCase());
            int width = Math.max(182, Math.min(286, Math.max(messageWidth, titleWidth) + 50));
            int height = 48;
            long age = now - notice.createdAt;
            float enter = EternalUi.easeOutCubic(age / (float) ENTER_MS);
            float exit = age > LIFE_MS - EXIT_MS
                    ? EternalUi.clamp01((LIFE_MS - age) / (float) EXIT_MS)
                    : 1.0F;
            float visibility = enter * exit;
            int alpha = Math.max(0, Math.min(255, Math.round(255.0F * visibility)));

            int targetX = screenWidth - width - 12;
            int slide = Math.round((1.0F - enter) * 42.0F) + Math.round((1.0F - exit) * 22.0F);
            int x = targetX + slide;
            int y = screenHeight - 16 - (total - index) * 54;
            index++;

            int panel = EternalUi.alpha(0xFF090C10, Math.min(alpha, 238));
            int inner = EternalUi.alpha(0xFF0E1217, Math.min(alpha, 242));
            int line = EternalUi.alpha(accent, Math.min(alpha, 170));
            int titleColor = EternalUi.alpha(EternalUi.TEXT, alpha);
            int textColor = EternalUi.alpha(EternalUi.MUTED, alpha);
            int dimColor = EternalUi.alpha(EternalUi.DIM, alpha);

            graphics.fill(x - 5, y - 5, x + width + 5, y + height + 5, EternalUi.alpha(0xFF000000, Math.min(alpha, 28)));
            graphics.fill(x - 2, y - 2, x + width + 2, y + height + 2, EternalUi.alpha(accent, Math.min(alpha, 18)));
            graphics.fill(x, y, x + width, y + height, panel);
            graphics.fill(x + 3, y + 1, x + width - 1, y + height - 1, inner);
            graphics.renderOutline(x, y, width, height, EternalUi.alpha(0xFF4A525D, Math.min(alpha, 96)));
            graphics.fill(x, y, x + 3, y + height, line);
            graphics.fill(x + 3, y, x + width, y + 1, EternalUi.alpha(0xFFFFFFFF, Math.min(alpha, 44)));

            int pulse = 145 + (int) (85 * (0.5D + 0.5D * Math.sin((now + notice.createdAt) / 410.0D)));
            int dotColor = EternalUi.alpha(accent, Math.min(alpha, pulse));
            graphics.fill(x + 12, y + 12, x + 17, y + 17, dotColor);
            graphics.fill(x + 13, y + 11, x + 16, y + 18, EternalUi.alpha(accent, Math.min(alpha, Math.max(60, pulse / 2))));

            graphics.drawString(mc.font, notice.title.toUpperCase(), x + 24, y + 10, titleColor, false);
            graphics.drawString(mc.font, notice.message, x + 12, y + 27, textColor, false);
            graphics.drawString(mc.font, "ETERNAL", x + width - mc.font.width("ETERNAL") - 10, y + 10, dimColor, false);

            float remaining = Math.max(0.0F, 1.0F - age / (float) LIFE_MS);
            int progress = Math.max(0, Math.round((width - 3) * remaining));
            if (progress > 0) graphics.fill(x + 3, y + height - 2, x + 3 + progress, y + height - 1, line);
        }
    }

    private record Notice(String title, String message, long createdAt) {}
}
