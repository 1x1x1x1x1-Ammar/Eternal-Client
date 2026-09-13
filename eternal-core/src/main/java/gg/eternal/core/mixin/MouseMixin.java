package gg.eternal.core.mixin;

import gg.eternal.core.EternalCore;
import net.minecraft.client.MouseHandler;
import net.minecraft.client.input.MouseButtonInfo;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(MouseHandler.class)
public class MouseMixin {
    @Inject(method = "onButton", at = @At("HEAD"))
    private void eternal$mouse(long window, MouseButtonInfo info, int action, CallbackInfo ci) {
        EternalCore.onMouse(info.button(), action != 0);
    }
}
