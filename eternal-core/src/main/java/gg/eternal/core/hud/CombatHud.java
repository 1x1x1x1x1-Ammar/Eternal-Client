package gg.eternal.core.hud;

import gg.eternal.core.config.CoreConfig;
import net.minecraft.client.Minecraft;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;

import java.util.Locale;

/** Read-only combat telemetry. Never sends packets or changes player input. */
public final class CombatHud {
    private CombatHud() {}

    public static String value(String name) {
        var player = Minecraft.getInstance().player;
        if (player == null) return name + " --";
        return switch (name) {
            case "AttackCooldown" -> {
                int percent = Math.round(player.getAttackStrengthScale(0.0F) * 100);
                yield percent >= 100 ? "ATTACK  READY" : "ATTACK  " + percent + "%";
            }
            case "HeldItem" -> "HAND  " + item(player.getMainHandItem());
            case "Offhand" -> "OFFHAND  " + item(player.getOffhandItem());
            case "ArmorDurability" -> {
                int lowest = 100;
                boolean found = false;
                for (EquipmentSlot slot : new EquipmentSlot[]{EquipmentSlot.HEAD, EquipmentSlot.CHEST, EquipmentSlot.LEGS, EquipmentSlot.FEET}) {
                    ItemStack stack = player.getItemBySlot(slot);
                    if (!stack.isDamageableItem()) continue;
                    found = true;
                    lowest = Math.min(lowest, durability(stack));
                }
                yield found ? "ARMOR  " + lowest + "% MIN" + (lowest <= 20 ? " !" : "") : "ARMOR  NONE";
            }
            case "Movement" -> String.format(Locale.ROOT, "FALL  %.1fm | %+.1f m/s",
                    (double) player.fallDistance, player.getDeltaMovement().y * 20);
            case "CombatSupplies" -> switch (CoreConfig.INSTANCE.combatPreset()) {
                case "mace" -> "WIND  " + count(Items.WIND_CHARGE) + " | PEARL  " + count(Items.ENDER_PEARL);
                case "cart" -> "CART  " + count(Items.TNT_MINECART) + " | RAIL  " + count(Items.RAIL, Items.POWERED_RAIL, Items.ACTIVATOR_RAIL, Items.DETECTOR_RAIL);
                case "crystal" -> "CRYSTAL  " + count(Items.END_CRYSTAL) + " | OBS  " + count(Items.OBSIDIAN) + " | TOTEM  " + count(Items.TOTEM_OF_UNDYING);
                default -> "PEARL  " + count(Items.ENDER_PEARL) + " | APPLE  " + count(Items.GOLDEN_APPLE, Items.ENCHANTED_GOLDEN_APPLE);
            };
            default -> name;
        };
    }

    private static int durability(ItemStack stack) {
        return Math.max(0, (int) Math.floor(100.0 * (stack.getMaxDamage() - stack.getDamageValue()) / Math.max(1, stack.getMaxDamage())));
    }

    private static String item(ItemStack stack) {
        if (stack.isEmpty()) return "EMPTY";
        String label = stack.getHoverName().getString();
        if (label.length() > 22) label = label.substring(0, 19) + "...";
        return label + (stack.isDamageableItem() ? " " + durability(stack) + "%" : " x" + stack.getCount());
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
