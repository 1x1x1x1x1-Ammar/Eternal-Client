package gg.eternal.core.mixin;
import gg.eternal.core.EternalCore; import net.minecraft.client.KeyboardHandler; import org.spongepowered.asm.mixin.Mixin; import org.spongepowered.asm.mixin.injection.At; import org.spongepowered.asm.mixin.injection.Inject; import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
@Mixin(KeyboardHandler.class) public class KeyboardMixin { @Inject(method="keyPress",at=@At("HEAD")) private void eternal$key(long window,int key,int scanCode,int action,int modifiers,CallbackInfo ci){EternalCore.onKey(key,action!=0);} }
