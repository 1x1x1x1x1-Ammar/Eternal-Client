import fs from 'node:fs';
const schema = JSON.parse(fs.readFileSync(new URL('./module-settings.json', import.meta.url), 'utf8'));
export { schema };
export function normalizeModuleSettings(input = {}) {
  const result = {};
  for (const [name, specific] of Object.entries(schema.modules)) {
    const definitions = { ...(schema.utilities.includes(name) ? {} : schema.hud), ...specific,
      keybind:{ type:'number', min:0, max:348, default:0 } };
    result[name] = {};
    for (const [key, rule] of Object.entries(definitions)) {
      const value = input?.[name]?.[key];
      result[name][key] = rule.type === 'boolean' ? (typeof value === 'boolean' ? value : rule.default)
        : Number.isFinite(Number(value)) && value !== null && value !== undefined
          ? rule.type === 'color' ? Number(value) | 0 : Math.min(rule.max, Math.max(rule.min, Math.round(Number(value))))
          : rule.default;
    }
  }
  return result;
}
