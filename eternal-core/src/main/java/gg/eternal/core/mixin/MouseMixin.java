package gg.eternal.core.mixin;
import gg.eternal.core.EternalCore; import net.minecraft.client.MouseHandler; import org.spongepowered.asm.mixin.Mixin; import org.spongepowered.asm.mixin.injection.At; import org.spongepowered.asm.mixin.injection.Inject; import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
@Mixin(MouseHandler.class) public class MouseMixin { @Inject(method="onPress",at=@At("HEAD")) private void eternal$mouse(long window,int button,int action,int mods,CallbackInfo ci){EternalCore.onMouse(button,action!=0);} }
