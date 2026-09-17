package gg.eternal.core.mixin;

import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import net.minecraft.client.DeltaTracker;
import net.minecraft.client.gui.Gui;
import net.minecraft.client.gui.GuiGraphics;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(Gui.class)
public class GuiMixin {
    @Inject(method = "render", at = @At("TAIL"))
    private void eternal$renderHud(GuiGraphics graphics, DeltaTracker tracker, CallbackInfo ci) {
        HudRenderer.render(graphics);
    }

    @Inject(method = "renderCrosshair", at = @At("HEAD"), cancellable = true)
    private void eternal$renderCrosshair(GuiGraphics graphics, DeltaTracker tracker, CallbackInfo ci) {
        if (!CoreConfig.INSTANCE.on("Crosshair")) return;
        HudRenderer.renderCrosshair(graphics);
        ci.cancel();
    }
}
