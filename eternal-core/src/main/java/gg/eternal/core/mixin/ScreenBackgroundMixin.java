package gg.eternal.core.mixin;

import gg.eternal.core.ui.ClickGuiScreen;
import gg.eternal.core.ui.EternalHomeScreen;
import gg.eternal.core.ui.HudEditorScreen;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(Screen.class)
public abstract class ScreenBackgroundMixin {
    @Inject(method = "renderBackground", at = @At("HEAD"), cancellable = true)
    private void eternal$safeInWorldBackground(GuiGraphics graphics, int mouseX, int mouseY, float delta, CallbackInfo ci) {
        Object screen = this;
        if (!(screen instanceof ClickGuiScreen) && !(screen instanceof HudEditorScreen) && !(screen instanceof EternalHomeScreen)) return;

        Minecraft mc = Minecraft.getInstance();
        int width = mc.getWindow().getGuiScaledWidth();
        int height = mc.getWindow().getGuiScaledHeight();
        graphics.fill(0, 0, width, height, 0xB8050608);
        ci.cancel();
    }
}
