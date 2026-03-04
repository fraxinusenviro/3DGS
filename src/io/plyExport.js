function collectIndices(canonical, layers, mode, selectedSet) {
  const keep = [];
  for (let i = 0; i < canonical.count; i++) {
    if (mode === 'selection' && !selectedSet.has(i)) continue;
    let visible = false;
    for (const layer of layers) {
      if (!layer.visible) continue;
      if (!layer.deletedMask[i]) {
        visible = true;
        break;
      }
    }
    if (visible) keep.push(i);
  }
  return keep;
}

function clamp255(v) {
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

export function exportPlyBinary(canonical, layers, selectedSet, options = { mode: 'visible' }) {
  const kept = collectIndices(canonical, layers, options.mode, selectedSet);
  const header = [
    'ply',
    'format binary_little_endian 1.0',
    `element vertex ${kept.length}`,
    'property float x',
    'property float y',
    'property float z',
    'property uchar red',
    'property uchar green',
    'property uchar blue',
    'end_header\n'
  ].join('\n');

  const rowSize = 4 * 3 + 3;
  const out = new ArrayBuffer(header.length + rowSize * kept.length);
  const bytes = new Uint8Array(out);
  bytes.set(new TextEncoder().encode(header), 0);
  const view = new DataView(out, header.length);

  let offset = 0;
  for (const idx of kept) {
    view.setFloat32(offset, canonical.positions[idx * 3], true); offset += 4;
    view.setFloat32(offset, canonical.positions[idx * 3 + 1], true); offset += 4;
    view.setFloat32(offset, canonical.positions[idx * 3 + 2], true); offset += 4;
    view.setUint8(offset++, clamp255(canonical.baseColor[idx * 3]));
    view.setUint8(offset++, clamp255(canonical.baseColor[idx * 3 + 1]));
    view.setUint8(offset++, clamp255(canonical.baseColor[idx * 3 + 2]));
  }
  return new Blob([out], { type: 'application/octet-stream' });
}
