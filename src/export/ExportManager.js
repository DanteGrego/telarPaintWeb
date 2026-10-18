/**
 * ExportManager.js — Open/Closed plugin registry for exporters
 *
 * Register an exporter:
 *   exportManager.register('pdf', { label, export: async (state) => {} })
 */

class ExportManager {
  constructor() {
    /** @type {Map<string, { label: string, export: Function }>} */
    this._exporters = new Map();
  }

  register(name, impl) {
    this._exporters.set(name, impl);
  }

  get(name) {
    return this._exporters.get(name);
  }

  async run(name, stateRef) {
    const exporter = this._exporters.get(name);
    if (!exporter) throw new Error(`Exporter '${name}' not registered`);
    await exporter.export(stateRef);
  }
}

export const exportManager = new ExportManager();

