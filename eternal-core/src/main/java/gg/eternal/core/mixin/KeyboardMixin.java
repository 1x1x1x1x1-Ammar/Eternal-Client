package gg.eternal.core.mixin;

import gg.eternal.core.EternalCore;
import net.minecraft.client.KeyboardHandler;
import net.minecraft.client.input.KeyEvent;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(KeyboardHandler.class)
public class KeyboardMixin {
    @Inject(method = "keyPress", at = @At("HEAD"))
    private void eternal$key(long window, int action, KeyEvent event, CallbackInfo ci) {
        // GLFW: 0 = release, 1 = press, 2 = repeat. Repeats used to re-enter
        // screen opening while the first Right Shift press was still being handled.
        // That is unsafe for Screen lifecycle and could crash Minecraft on some PCs.
        if (action == 2) return;
        EternalCore.onKey(event.key(), action == 1);
    }
}
