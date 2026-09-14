package gg.eternal.core.mixin;

import gg.eternal.core.ui.EternalTitleScreen;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.gui.screens.TitleScreen;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.ModifyVariable;

@Mixin(Minecraft.class)
public class MinecraftScreenMixin {
    @ModifyVariable(method = "setScreen", at = @At("HEAD"), argsOnly = true)
    private Screen eternal$replaceVanillaTitle(Screen screen) {
        if (screen instanceof TitleScreen) return new EternalTitleScreen();
        return screen;
    }
}
