package gg.eternal.core.ui;

import gg.eternal.core.config.CoreConfig;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

import java.util.ArrayDeque;
import java.util.Deque;

public final class NotificationCenter {
    private static final Deque<Notice> NOTICES = new ArrayDeque<>();
    private static final long LIFE_MS = 2600L;

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
        while (!NOTICES.isEmpty() && now - NOTICES.peekFirst().createdAt > LIFE_MS) {
            NOTICES.removeFirst();
        }
        if (NOTICES.isEmpty()) return;

        int screenWidth = mc.getWindow().getGuiScaledWidth();
        int y = 12;
        int accent = CoreConfig.INSTANCE.accentColor();
        for (Notice notice : NOTICES) {
            int messageWidth = mc.font.width(notice.message);
            int titleWidth = mc.font.width(notice.title);
            int width = Math.max(150, Math.max(messageWidth, titleWidth) + 28);
            int x = screenWidth - width - 12;
            long age = now - notice.createdAt;
            float life = Math.min(1.0F, age / (float) LIFE_MS);
            int alpha = life > 0.84F ? Math.max(0, (int) (255.0F * (1.0F - life) / 0.16F)) : 255;
            int panel = (alpha << 24) | 0x00101012;
            int line = (alpha << 24) | (accent & 0x00FFFFFF);
            int titleColor = (alpha << 24) | 0x00F4F5F7;
            int textColor = (alpha << 24) | 0x00898D96;

            graphics.fill(x, y, x + width, y + 42, panel);
            graphics.fill(x, y, x + 3, y + 42, line);
            graphics.renderOutline(x, y, width, 42, (alpha << 24) | 0x002B2D31);
            graphics.drawString(mc.font, notice.title, x + 12, y + 9, titleColor, false);
            graphics.drawString(mc.font, notice.message, x + 12, y + 24, textColor, false);
            y += 48;
        }
    }

    private record Notice(String title, String message, long createdAt) {}
}
