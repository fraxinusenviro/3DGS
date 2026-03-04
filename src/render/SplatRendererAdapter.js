export class SplatRendererAdapter {
  constructor(canvas) {
    this.canvas = canvas;
    this.viewer = null;
    this.loaded = false;
  }

  async init() {
    const mod = await import('https://cdn.jsdelivr.net/npm/@mkkellogg/gaussian-splats-3d@0.4.7/+esm');
    this.lib = mod;
  }

  async loadSplatData(canonical) {
    this.canonical = canonical;
    this.loaded = false;
    if (this.viewer) this.viewer.dispose();

    // Fallback: this OSS renderer expects external splat assets.
    // Keep adapter available while editor uses point-cloud rendering for PLY inputs.
    this.viewer = null;
  }

  setLayerControls(layer) {
    this.layer = layer;
  }

  setRenderSettings(settings) {
    this.settings = settings;
  }

  setCamera() {}

  pick() {
    return null;
  }

  render() {
    // no-op for fallback mode
  }

  dispose() {
    if (this.viewer) this.viewer.dispose();
  }
}
