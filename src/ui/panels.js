export function renderLayerList(store, root, onChange) {
  root.innerHTML = '';
  for (const layer of store.layers) {
    const row = document.createElement('div');
    row.className = 'layer-row';
    const active = document.createElement('button');
    active.textContent = layer.name;
    active.className = store.activeLayerId === layer.id ? 'active' : '';
    active.onclick = () => { store.activeLayerId = layer.id; onChange(); };

    const vis = document.createElement('input');
    vis.type = 'checkbox'; vis.checked = layer.visible;
    vis.onchange = () => { layer.visible = vis.checked; onChange(); };

    const op = document.createElement('input');
    op.type = 'range'; op.min = 0; op.max = 1; op.step = 0.01; op.value = layer.opacity;
    op.oninput = () => { layer.opacity = Number(op.value); onChange(); };

    row.append(active, vis, op);
    root.append(row);
  }
}

export function bindColorControls(container, layer, onChange) {
  for (const input of container.querySelectorAll('[data-color]')) {
    const key = input.dataset.color;
    input.value = layer.colorTransformParams[key];
    input.oninput = () => {
      layer.colorTransformParams[key] = input.type === 'checkbox' ? input.checked : Number(input.value);
      onChange();
    };
  }
}
