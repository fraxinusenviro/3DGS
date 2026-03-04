import { parsePly } from './io/plyParser.js';
import { exportPlyBinary } from './io/plyExport.js';
import { SplatRendererAdapter } from './render/SplatRendererAdapter.js';
import { PointCloudRenderer } from './render/PointCloudRenderer.js';
import { boxSelect } from './render/Picking.js';
import { LayerStore } from './state/layerStore.js';
import { CommandStack } from './state/commandStack.js';
import { bindColorControls, renderLayerList } from './ui/panels.js';

const canvas = document.getElementById('viewport');
const fileInput = document.getElementById('importFile');
const layerRoot = document.getElementById('layers');
const stats = document.getElementById('stats');
const modeSel = document.getElementById('renderMode');

const pointRenderer = new PointCloudRenderer(canvas);
const splatAdapter = new SplatRendererAdapter(canvas);
await splatAdapter.init();
const commands = new CommandStack();
const selection = new Set();

let canonical = null;
let store = null;
let dragStart = null;

function refresh() {
  if (!canonical || !store) return;
  renderLayerList(store, layerRoot, refresh);
  bindColorControls(document.getElementById('colorControls'), store.activeLayer, refresh);
  pointRenderer.load(canonical, store.activeLayer, selection);
  stats.textContent = `Points: ${canonical.count} | Selected: ${selection.size} | Type: ${canonical.classification}`;
}

function resize() {
  pointRenderer.resize(canvas.clientWidth, canvas.clientHeight);
}
window.addEventListener('resize', resize);
resize();

async function loadFile(file) {
  const buf = await file.arrayBuffer();
  canonical = parsePly(buf);
  store = new LayerStore(canonical.count);
  selection.clear();
  await splatAdapter.loadSplatData(canonical);
  refresh();
  pointRenderer.frameScene();
}

fileInput.addEventListener('change', (e) => {
  const [file] = e.target.files;
  if (file) loadFile(file);
});

window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const [file] = e.dataTransfer.files;
  if (file?.name.endsWith('.ply')) loadFile(file);
});

canvas.addEventListener('click', (e) => {
  if (!canonical || !store) return;
  const idx = pointRenderer.pick(e.clientX, e.clientY);
  if (idx == null) return;
  if (!e.shiftKey) selection.clear();
  if (selection.has(idx)) selection.delete(idx); else selection.add(idx);
  refresh();
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || e.shiftKey) dragStart = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('mouseup', (e) => {
  if (!dragStart) return;
  const rect = {
    x0: Math.min(dragStart.x, e.clientX), x1: Math.max(dragStart.x, e.clientX),
    y0: Math.min(dragStart.y, e.clientY), y1: Math.max(dragStart.y, e.clientY)
  };
  for (const id of boxSelect(pointRenderer, rect, 12)) selection.add(id);
  dragStart = null;
  refresh();
});

function deleteSelection() {
  if (!store || !selection.size) return;
  const layer = store.activeLayer;
  const selected = Array.from(selection);
  commands.execute({
    do: () => selected.forEach((i) => { layer.deletedMask[i] = 1; selection.delete(i); }),
    undo: () => selected.forEach((i) => { layer.deletedMask[i] = 0; })
  });
  refresh();
}

document.getElementById('deleteBtn').onclick = deleteSelection;
document.getElementById('dupLayer').onclick = () => { store.duplicateLayer(store.activeLayerId); refresh(); };
document.getElementById('removeLayer').onclick = () => { store.deleteLayer(store.activeLayerId); refresh(); };
document.getElementById('exportBtn').onclick = () => {
  if (!canonical) return;
  const blob = exportPlyBinary(canonical, store.layers, selection, { mode: document.getElementById('exportMode').value });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'edited.ply';
  a.click();
  URL.revokeObjectURL(a.href);
};

document.getElementById('pointSize').oninput = (e) => { pointRenderer.pointSize = Number(e.target.value); refresh(); };
document.getElementById('pointOpacity').oninput = (e) => { pointRenderer.opacity = Number(e.target.value); refresh(); };
modeSel.onchange = refresh;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Delete') deleteSelection();
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); commands.undo(); refresh(); }
  if ((e.ctrlKey || e.metaKey) && ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y')) { e.preventDefault(); commands.redo(); refresh(); }
  if (e.key.toLowerCase() === 'f') pointRenderer.frameScene();
  if (e.key === 'Escape') { selection.clear(); refresh(); }
});

(function animate() {
  requestAnimationFrame(animate);
  const mode = modeSel.value;
  if (mode === 'splats') {
    splatAdapter.render();
  } else if (mode === 'composite') {
    pointRenderer.frame();
    splatAdapter.render();
  } else {
    pointRenderer.frame();
  }
})();
