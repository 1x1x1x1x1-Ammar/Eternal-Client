package gg.eternal.core.mixin;

import gg.eternal.core.hud.HudRenderer;
import gg.eternal.core.util.CoreLog;
import net.minecraft.client.DeltaTracker;
import net.minecraft.client.gui.Gui;
import net.minecraft.client.gui.GuiGraphics;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(Gui.class)
public class GuiMixin {
    private static boolean eternal$hudFailureLogged;

    @Inject(method = "render", at = @At("TAIL"))
    private void eternal$renderHud(GuiGraphics graphics, DeltaTracker tracker, CallbackInfo ci) {
        try {
            HudRenderer.render(graphics);
        } catch (Throwable error) {
            if (!eternal$hudFailureLogged) {
                eternal$hudFailureLogged = true;
                CoreLog.error("Top-level HUD render hook failed; Minecraft render loop was protected", error);
            }
        }
    }
}
