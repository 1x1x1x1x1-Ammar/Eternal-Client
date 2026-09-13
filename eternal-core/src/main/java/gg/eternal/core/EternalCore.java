package gg.eternal.core;
import net.fabricmc.api.ClientModInitializer;
import net.minecraft.client.Minecraft;
import gg.eternal.core.ui.ClickGuiScreen;
import gg.eternal.core.ui.HudEditorScreen;
import gg.eternal.core.hud.HudRenderer;
import gg.eternal.core.state.InputState;
public final class EternalCore implements ClientModInitializer {
  public static final String VERSION="0.5.0-beta.5"; private static long sessionStarted;
  @Override public void onInitializeClient(){sessionStarted=System.currentTimeMillis();HudRenderer.install();}
  public static long sessionMillis(){return Math.max(0,System.currentTimeMillis()-sessionStarted);}
  public static void onKey(int key,boolean down){InputState.key(key,down);if(!down)return;Minecraft mc=Minecraft.getInstance();if(key==344&&mc.screen==null)mc.setScreen(new ClickGuiScreen());if(key==72&&mc.screen==null)mc.setScreen(new HudEditorScreen());}
  public static void onMouse(int button,boolean down){InputState.mouse(button,down);}
}
