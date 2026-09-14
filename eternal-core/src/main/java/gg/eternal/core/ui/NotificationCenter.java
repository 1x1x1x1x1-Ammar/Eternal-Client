package gg.eternal.core.ui;

import gg.eternal.core.config.CoreConfig;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

import java.util.ArrayDeque;
import java.util.Deque;

public final class NotificationCenter {
    private static final Deque<Notice> NOTICES = new ArrayDeque<>();
    private static final long LIFE_MS = 2800L;
    private static final long ENTER_MS = 180L;

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
            int width = Math.max(164, Math.max(messageWidth, titleWidth) + 34);
            long age = now - notice.createdAt;
            float life = Math.min(1.0F, age / (float) LIFE_MS);
            float enter = Math.min(1.0F, age / (float) ENTER_MS);
            float enterEase = 1.0F - (1.0F - enter) * (1.0F - enter);
            int alpha = life > 0.84F ? Math.max(0, (int) (255.0F * (1.0F - life) / 0.16F)) : 255;
            int slide = Math.round((1.0F - enterEase) * 34.0F);
            if (life > 0.84F) slide += Math.round(((life - 0.84F) / 0.16F) * 18.0F);
            int x = screenWidth - width - 12 + slide;

            int panel = (alpha << 24) | 0x000B0D10;
            int inner = (alpha << 24) | 0x00101318;
            int line = (alpha << 24) | (accent & 0x00FFFFFF);
            int titleColor = (alpha << 24) | 0x00F5F6F8;
            int textColor = (alpha << 24) | 0x00858A94;
            int dimColor = (alpha << 24) | 0x00515862;

            graphics.fill(x - 3, y - 3, x + width + 3, y + 49, (Math.min(alpha, 74) << 24));
            graphics.fill(x, y, x + width, y + 46, panel);
            graphics.fill(x + 3, y + 1, x + width - 1, y + 45, inner);
            graphics.fill(x, y, x + 3, y + 46, line);
            graphics.fill(x + 3, y, x + width, y + 1, (Math.min(alpha, 54) << 24) | 0x00FFFFFF);
            graphics.renderOutline(x, y, width, 46, (alpha << 24) | 0x00373C45);

            graphics.fill(x + 12, y + 12, x + 17, y + 17, line);
            graphics.drawString(mc.font, notice.title.toUpperCase(), x + 23, y + 10, titleColor, false);
            graphics.drawString(mc.font, notice.message, x + 12, y + 27, textColor, false);
            graphics.drawString(mc.font, "ETERNAL", x + width - mc.font.width("ETERNAL") - 10, y + 10, dimColor, false);

            int progressWidth = Math.max(0, Math.round((width - 3) * (1.0F - life)));
            if (progressWidth > 0) graphics.fill(x + 3, y + 45, x + 3 + progressWidth, y + 46, line);
            y += 53;
        }
    }

    private record Notice(String title, String message, long createdAt) {}
}
