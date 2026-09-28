package gg.eternal.core.ui;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.Button;
import net.minecraft.network.chat.Component;

/** Native focus, narration and keyboard activation with Eternal's visual treatment. */
public final class EternalButton extends Button {
    private final boolean primary;
    public EternalButton(int x, int y, int width, int height, String text, boolean primary, Runnable action) {
        super(x, y, width, height, Component.literal(text), ignored -> action.run(), DEFAULT_NARRATION);
        this.primary = primary;
    }
    @Override
    protected void renderWidget(GuiGraphics graphics, int mouseX, int mouseY, float delta) {
        var font = Minecraft.getInstance().font;
        boolean focus = isHoveredOrFocused();
        int accent = gg.eternal.core.config.CoreConfig.INSTANCE.accentColor();
        graphics.fill(getX(), getY(), getX() + getWidth(), getY() + getHeight(),
                !active ? 0xA015171B : primary ? EternalUi.alpha(accent, focus ? 220 : 185) : focus ? 0xF52C3038 : 0xEA181C23);
        graphics.renderOutline(getX(), getY(), getWidth(), getHeight(), focus ? 0xFFCACFD7 : primary ? accent : 0xFF373D46);
        String label = font.plainSubstrByWidth(getMessage().getString(), Math.max(1, getWidth() - 12));
        graphics.drawCenteredString(font, label, getX() + getWidth() / 2, getY() + (getHeight() - 8) / 2, active ? EternalUi.TEXT : EternalUi.DIM);
    }
}
