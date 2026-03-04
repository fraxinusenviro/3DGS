export function boxSelect(renderer, rect, step = 10) {
  const picked = new Set();
  for (let x = rect.x0; x <= rect.x1; x += step) {
    for (let y = rect.y0; y <= rect.y1; y += step) {
      const id = renderer.pick(x, y);
      if (id != null) picked.add(id);
    }
  }
  return picked;
}
