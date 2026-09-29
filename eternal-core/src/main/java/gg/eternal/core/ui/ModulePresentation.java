package gg.eternal.core.ui;

import net.minecraft.world.item.Item;
import net.minecraft.world.item.Items;

/** Native item artwork keeps the interface legible at Minecraft GUI scales. */
public final class ModulePresentation {
    private ModulePresentation() {}
    public static String label(String name) { return name.replaceAll("([a-z])([A-Z])", "$1 $2"); }
    public static Item icon(String name) {
        return switch (name) {
            case "AttackCooldown", "HeldItem" -> Items.DIAMOND_SWORD;
            case "Armor", "ArmorDurability" -> Items.DIAMOND_CHESTPLATE;
            case "CombatSupplies" -> Items.END_CRYSTAL;
            case "Offhand" -> Items.TOTEM_OF_UNDYING;
            case "Movement" -> Items.MACE;
            case "PotionEffects" -> Items.POTION;
            case "TargetDistance", "Crosshair" -> Items.BOW;
            case "Coordinates", "Direction", "Biome" -> Items.COMPASS;
            case "Clock", "WorldTime", "Session" -> Items.CLOCK;
            case "InventoryCounter" -> Items.CHEST;
            case "Food" -> Items.GOLDEN_APPLE;
            case "Fullbright" -> Items.GLOWSTONE;
            case "Zoom", "Perspective" -> Items.SPYGLASS;
            case "FPSOptimizer", "FPS", "Memory", "ReducedMotion" -> Items.REDSTONE;
            case "ToggleSprint", "ToggleSneak", "SprintStatus", "Speed" -> Items.DIAMOND_BOOTS;
            default -> Items.NETHER_STAR;
        };
    }
    public static String description(String name) {
        return switch (name) {
            case "AttackCooldown" -> "Attack recovery and ready state";
            case "ArmorDurability" -> "Armor wear and low durability alerts";
            case "HeldItem" -> "Held item count and durability";
            case "Offhand" -> "Offhand item and durability";
            case "CombatSupplies" -> "Crystals, totems, pearls and more";
            case "Movement" -> "Fall distance and vertical speed";
            case "PotionEffects" -> "Active effects and remaining time";
            case "FPSOptimizer" -> "Reversible native graphics options";
            case "ReducedMotion" -> "Stop animated HUD accents";
            case "TargetDistance" -> "Distance to your crosshair target";
            case "InventoryCounter" -> "Used and available inventory slots";
            case "WorldTime" -> "12 or 24 hour world clock";
            case "Zoom" -> "Hold the configured zoom key";
            case "Fullbright" -> "Adjust native Minecraft brightness";
            default -> "Appearance, behavior and toggle key";
        };
    }
}
