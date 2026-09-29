package gg.eternal.core.hud;

import gg.eternal.core.config.CoreConfig;
import net.minecraft.client.Minecraft;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import java.util.ArrayList;
import java.util.Locale;

/** Read-only combat telemetry. Never sends packets or changes player input. */
public final class CombatHud {
    private CombatHud() {}
    public static String value(String name) {
        var mc = Minecraft.getInstance();
        var player = mc.player;
        var config = CoreConfig.INSTANCE;
        if (player == null) return name + " --";
        return switch (name) {
            case "AttackCooldown" -> {
                int percent = Math.round(player.getAttackStrengthScale(0.0F) * 100);
                yield percent >= 100 ? "ATTACK  READY" : "ATTACK  " + percent + "%";
            }
            case "HeldItem" -> "HAND  " + item(player.getMainHandItem(), config.flag(name, "durability"));
            case "Offhand" -> "OFFHAND  " + item(player.getOffhandItem(), config.flag(name, "durability"));
            case "ArmorDurability" -> {
                int lowest = 100;
                var pieces = new ArrayList<String>();
                for (EquipmentSlot slot : new EquipmentSlot[]{EquipmentSlot.HEAD, EquipmentSlot.CHEST, EquipmentSlot.LEGS, EquipmentSlot.FEET}) {
                    ItemStack stack = player.getItemBySlot(slot);
                    if (!stack.isDamageableItem()) continue;
                    int remaining = durability(stack);
                    lowest = Math.min(lowest, remaining);
                    pieces.add(slot.name() + "  " + remaining + "%" + (remaining <= config.number(name, "warning") ? " !" : ""));
                }
                yield pieces.isEmpty() ? "ARMOR  NONE" : config.flag(name, "allPieces") ? String.join("\n", pieces)
                        : "ARMOR  " + lowest + "% MIN" + (lowest <= config.number(name, "warning") ? " !" : "");
            }
            case "Movement" -> String.format(Locale.ROOT, "FALL  %.1fm", (double) player.fallDistance)
                    + (config.flag(name, "vertical") ? String.format(Locale.ROOT, " | %+.1f m/s", player.getDeltaMovement().y * 20) : "");
            case "CombatSupplies" -> supplies();
            case "PotionEffects" -> {
                var effects = new ArrayList<String>();
                player.getActiveEffects().stream().sorted(java.util.Comparator.comparing(e -> e.getEffect().value().getDisplayName().getString()))
                    .limit(config.number(name, "limit")).forEach(effect -> {
                        int seconds = effect.getDuration() / 20;
                        String duration = effect.isInfiniteDuration() ? "INF" : String.format(Locale.ROOT, "%d:%02d", seconds / 60, seconds % 60);
                        effects.add(effect.getEffect().value().getDisplayName().getString() + " " + (effect.getAmplifier() + 1)
                                + (config.flag(name, "duration") ? "  " + duration : ""));
                    });
                yield effects.isEmpty() ? "EFFECTS  NONE" : String.join("\n", effects);
            }
            case "TargetDistance" -> mc.crosshairPickEntity == null ? "TARGET  --" : String.format(Locale.ROOT,
                    "TARGET  %." + config.number(name, "decimals") + "fm", player.distanceTo(mc.crosshairPickEntity));
            case "Biome" -> "BIOME  " + player.level().getBiome(player.blockPosition()).unwrapKey()
                    .map(key -> key.identifier().getPath().replace('_', ' ')).orElse("unknown");
            case "WorldTime" -> {
                long minutes = (Math.floorMod(player.level().getDayTime(), 24000) * 60 / 1000 + 360) % 1440;
                int hour = (int) minutes / 60;
                yield config.flag(name, "clock24") ? String.format(Locale.ROOT, "WORLD  %02d:%02d", hour, minutes % 60)
                    : String.format(Locale.ROOT, "WORLD  %d:%02d %s", hour % 12 == 0 ? 12 : hour % 12, minutes % 60, hour < 12 ? "AM" : "PM");
            }
            case "InventoryCounter" -> {
                int free = 0;
                for (int i = 0; i < 36; i++) if (player.getInventory().getItem(i).isEmpty()) free++;
                yield config.flag(name, "free") ? "INVENTORY  " + free + "/36 FREE" : "INVENTORY  " + (36 - free) + "/36 USED";
            }
            case "SprintStatus" -> player.isSprinting() ? "SPRINTING" : player.isCrouching() ? "CROUCHING" : "WALKING";
            default -> name;
        };
    }
    private static String supplies() {
        var lines = new ArrayList<String>();
        supply(lines, "crystals", "CRYSTAL", Items.END_CRYSTAL);
        supply(lines, "obsidian", "OBSIDIAN", Items.OBSIDIAN);
        supply(lines, "totems", "TOTEM", Items.TOTEM_OF_UNDYING);
        supply(lines, "wind", "WIND", Items.WIND_CHARGE);
        supply(lines, "carts", "CART", Items.TNT_MINECART);
        supply(lines, "rails", "RAIL", Items.RAIL, Items.POWERED_RAIL, Items.ACTIVATOR_RAIL, Items.DETECTOR_RAIL);
        supply(lines, "pearls", "PEARL", Items.ENDER_PEARL);
        supply(lines, "apples", "APPLE", Items.GOLDEN_APPLE, Items.ENCHANTED_GOLDEN_APPLE);
        if (lines.isEmpty()) return "SUPPLIES  NONE SELECTED";
        return String.join(CoreConfig.INSTANCE.flag("CombatSupplies", "vertical") ? "\n" : " | ", lines);
    }
    private static void supply(ArrayList<String> lines, String key, String label, Item... items) {
        var config = CoreConfig.INSTANCE;
        if (!config.flag("CombatSupplies", key)) return;
        int count = count(items);
        lines.add(label + "  " + count + (count <= config.number("CombatSupplies", "warning") ? " !" : ""));
    }
    private static int durability(ItemStack stack) {
        return Math.max(0, (int) Math.floor(100.0 * (stack.getMaxDamage() - stack.getDamageValue()) / Math.max(1, stack.getMaxDamage())));
    }
    private static String item(ItemStack stack, boolean showDurability) {
        if (stack.isEmpty()) return "EMPTY";
        String label = stack.getHoverName().getString();
        if (label.length() > 22) label = label.substring(0, 19) + "...";
        return label + (stack.isDamageableItem() ? showDurability ? " " + durability(stack) + "%" : "" : " x" + stack.getCount());
    }
    private static int count(Item... items) {
        var player = Minecraft.getInstance().player;
        if (player == null) return 0;
        int count = 0;
        var inventory = player.getInventory();
        for (int i = 0; i < inventory.getContainerSize(); i++) {
            ItemStack stack = inventory.getItem(i);
            for (Item item : items) if (stack.is(item)) { count += stack.getCount(); break; }
        }
        return count;
    }
}
