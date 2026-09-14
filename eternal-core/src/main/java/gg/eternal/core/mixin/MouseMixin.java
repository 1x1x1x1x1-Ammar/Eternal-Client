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
        // GLFW mouse actions are release=0 / press=1. Ignore unknown values instead
        // of treating any non-zero value as a press, keeping Core input state exact.
        if (action != 0 && action != 1) return;
        EternalCore.onMouse(info.button(), action == 1);
    }
}
