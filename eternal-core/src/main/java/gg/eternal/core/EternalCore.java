package gg.eternal.core;

import gg.eternal.core.config.CoreConfig;
import gg.eternal.core.hud.HudRenderer;
import gg.eternal.core.state.InputState;
import gg.eternal.core.ui.ClickGuiScreen;
import gg.eternal.core.ui.HudEditorScreen;
import net.fabricmc.api.ClientModInitializer;
import net.minecraft.client.Minecraft;

public final class EternalCore implements ClientModInitializer {
    public static final String VERSION = "0.5.0-beta.5";
    private static long sessionStarted;
    private static boolean zoomed;
    private static int previousFov = 70;
    @Override public void onInitializeClient(){sessionStarted=System.currentTimeMillis();HudRenderer.install();}
    public static long sessionMillis(){return Math.max(0,System.currentTimeMillis()-sessionStarted);}
    public static void onKey(int key,boolean down){InputState.key(key,down);Minecraft mc=Minecraft.getInstance();if(key==67&&CoreConfig.INSTANCE.on("Zoom")){if(down&&!zoomed&&mc.screen==null){previousFov=mc.options.fov().get();mc.options.fov().set(30);zoomed=true;}else if(!down&&zoomed){mc.options.fov().set(previousFov);zoomed=false;}return;}if(!down||mc.screen!=null)return;if(key==344)mc.setScreen(new ClickGuiScreen());if(key==72)mc.setScreen(new HudEditorScreen());}
    public static void onMouse(int button,boolean down){InputState.mouse(button,down);}
}
