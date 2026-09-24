import presets from '../../shared/combat-presets.json';

export const combatPresets = presets;
export function combatPatch(id) {
  const preset = presets.find(item => item.id === id);
  if (!preset) throw new Error('Unknown combat preset');
  return {
    combatPreset: id,
    enabled: Object.fromEntries(preset.modules.map(name => [name, true])),
    crosshair: { ...preset.crosshair },
    gradientHud: false
  };
}
