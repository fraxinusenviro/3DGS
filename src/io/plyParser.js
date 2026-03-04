const TYPE_READERS = {
  char: { size: 1, get: 'getInt8' },
  int8: { size: 1, get: 'getInt8' },
  uchar: { size: 1, get: 'getUint8' },
  uint8: { size: 1, get: 'getUint8' },
  short: { size: 2, get: 'getInt16' },
  int16: { size: 2, get: 'getInt16' },
  ushort: { size: 2, get: 'getUint16' },
  uint16: { size: 2, get: 'getUint16' },
  int: { size: 4, get: 'getInt32' },
  int32: { size: 4, get: 'getInt32' },
  uint: { size: 4, get: 'getUint32' },
  uint32: { size: 4, get: 'getUint32' },
  float: { size: 4, get: 'getFloat32' },
  float32: { size: 4, get: 'getFloat32' },
  double: { size: 8, get: 'getFloat64' },
  float64: { size: 8, get: 'getFloat64' }
};

const COLOR_KEYS = [
  ['red', 'green', 'blue'],
  ['r', 'g', 'b'],
  ['f_dc_0', 'f_dc_1', 'f_dc_2']
];

function parseHeader(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== 'ply') throw new Error('Not a PLY file');
  const header = {
    format: null,
    vertexCount: 0,
    properties: [],
    headerLength: 0,
    originalPropertyOrder: [],
    originalTypes: {}
  };

  let inVertex = false;
  let offset = 0;
  for (const line of lines) {
    offset += line.length + 1;
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'format') header.format = parts[1];
    if (parts[0] === 'element') inVertex = parts[1] === 'vertex';
    if (parts[0] === 'element' && parts[1] === 'vertex') header.vertexCount = Number(parts[2]);
    if (parts[0] === 'property' && inVertex && parts[1] !== 'list') {
      header.properties.push({ type: parts[1], name: parts[2] });
      header.originalPropertyOrder.push(parts[2]);
      header.originalTypes[parts[2]] = parts[1];
    }
    if (line.trim() === 'end_header') {
      header.headerLength = offset;
      break;
    }
  }
  if (!header.format) throw new Error('PLY format missing');
  return header;
}

function allocateColumns(header) {
  const columns = {};
  for (const p of header.properties) {
    columns[p.name] = new Float32Array(header.vertexCount);
  }
  return columns;
}

function parseBinaryLittleEndian(buffer, header) {
  const view = new DataView(buffer, header.headerLength);
  const columns = allocateColumns(header);
  let cursor = 0;
  for (let i = 0; i < header.vertexCount; i++) {
    for (const p of header.properties) {
      const reader = TYPE_READERS[p.type];
      if (!reader) throw new Error(`Unsupported type: ${p.type}`);
      columns[p.name][i] = view[reader.get](cursor, true);
      cursor += reader.size;
    }
  }
  return columns;
}

function parseAscii(text, header) {
  const rows = text.slice(header.headerLength).trim().split(/\r?\n/);
  const columns = allocateColumns(header);
  for (let i = 0; i < header.vertexCount; i++) {
    const vals = rows[i].trim().split(/\s+/);
    for (let p = 0; p < header.properties.length; p++) {
      columns[header.properties[p].name][i] = Number(vals[p]);
    }
  }
  return columns;
}

function pickColumn(columns, names) {
  for (const n of names) if (columns[n]) return columns[n];
  return null;
}

function deriveBaseColor(columns, count) {
  for (const [rKey, gKey, bKey] of COLOR_KEYS) {
    const r = columns[rKey];
    const g = columns[gKey];
    const b = columns[bKey];
    if (r && g && b) {
      const out = new Float32Array(count * 3);
      const asRgb = rKey === 'red' || rKey === 'r';
      for (let i = 0; i < count; i++) {
        out[i * 3] = asRgb ? r[i] / 255 : (r[i] + 1) / 2;
        out[i * 3 + 1] = asRgb ? g[i] / 255 : (g[i] + 1) / 2;
        out[i * 3 + 2] = asRgb ? b[i] / 255 : (b[i] + 1) / 2;
      }
      return out;
    }
  }
  const out = new Float32Array(count * 3);
  out.fill(0.6);
  return out;
}

function getRotation(columns, count) {
  const keys = [['rot_0', 'rot_1', 'rot_2', 'rot_3'], ['qx', 'qy', 'qz', 'qw']];
  for (const keySet of keys) {
    if (keySet.every((k) => columns[k])) {
      const out = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        for (let j = 0; j < 4; j++) out[i * 4 + j] = columns[keySet[j]][i];
      }
      return out;
    }
  }
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) out[i * 4 + 3] = 1;
  return out;
}

function getScale(columns, count) {
  const sets = [['scale_0', 'scale_1', 'scale_2'], ['sx', 'sy', 'sz']];
  for (const keySet of sets) {
    if (keySet.every((k) => columns[k])) {
      const out = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        out[i * 3] = columns[keySet[0]][i];
        out[i * 3 + 1] = columns[keySet[1]][i];
        out[i * 3 + 2] = columns[keySet[2]][i];
      }
      return out;
    }
  }
  const out = new Float32Array(count * 3);
  out.fill(1);
  return out;
}

export function parsePly(arrayBuffer) {
  const text = new TextDecoder().decode(arrayBuffer.slice(0, 8192));
  const header = parseHeader(text);
  const columns = header.format === 'binary_little_endian'
    ? parseBinaryLittleEndian(arrayBuffer, header)
    : parseAscii(new TextDecoder().decode(arrayBuffer), header);

  const count = header.vertexCount;
  const x = pickColumn(columns, ['x']);
  const y = pickColumn(columns, ['y']);
  const z = pickColumn(columns, ['z']);
  if (!x || !y || !z) throw new Error('PLY missing x/y/z');

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = x[i];
    positions[i * 3 + 1] = y[i];
    positions[i * 3 + 2] = z[i];
  }

  const opacity = pickColumn(columns, ['opacity', 'alpha']) || new Float32Array(count).fill(1);
  const scale = getScale(columns, count);
  const rotation = getRotation(columns, count);
  const baseColor = deriveBaseColor(columns, count);

  const splatCapable = ['opacity', 'scale_0', 'rot_0'].some((k) => columns[k]);

  return {
    count,
    positions,
    opacity,
    scale,
    rotation,
    baseColor,
    extraAttributes: columns,
    schema: {
      originalPropertyOrder: header.originalPropertyOrder,
      originalNames: header.originalPropertyOrder,
      originalTypes: header.originalTypes,
      format: header.format
    },
    classification: splatCapable ? 'splat-capable' : 'point-cloud'
  };
}
