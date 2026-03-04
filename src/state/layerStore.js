const defaultColor = () => ({
  brightness: 0,
  contrast: 1,
  gamma: 1,
  saturation: 1,
  hue: 0,
  temperature: 0,
  tint: 0,
  blackPoint: 0,
  whitePoint: 1,
  invert: false
});

export function createLayer(name, count) {
  return {
    id: crypto.randomUUID(),
    name,
    visible: true,
    opacity: 1,
    deletedMask: new Uint8Array(count),
    colorTransformParams: defaultColor()
  };
}

export class LayerStore {
  constructor(count) {
    this.layers = [createLayer('Layer 1', count)];
    this.activeLayerId = this.layers[0].id;
  }

  get activeLayer() {
    return this.layers.find((l) => l.id === this.activeLayerId) || this.layers[0];
  }

  duplicateLayer(id) {
    const src = this.layers.find((l) => l.id === id);
    if (!src) return;
    const copy = {
      ...src,
      id: crypto.randomUUID(),
      name: `${src.name} copy`,
      deletedMask: src.deletedMask.slice(),
      colorTransformParams: { ...src.colorTransformParams }
    };
    this.layers.push(copy);
    this.activeLayerId = copy.id;
  }

  deleteLayer(id) {
    if (this.layers.length === 1) return;
    this.layers = this.layers.filter((l) => l.id !== id);
    if (!this.layers.find((l) => l.id === this.activeLayerId)) this.activeLayerId = this.layers[0].id;
  }
}
