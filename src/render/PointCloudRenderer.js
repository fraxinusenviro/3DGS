import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/controls/OrbitControls.js';

export class PointCloudRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000);
    this.camera.position.set(0, 0, 3);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.pointSize = 2;
    this.opacity = 1;
    this.lastBounds = null;

    const light = new THREE.HemisphereLight(0xffffff, 0x555555, 1);
    this.scene.add(light);
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 0.03;
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  applyColorTransform(layer, srcColors) {
    const out = new Float32Array(srcColors.length);
    const c = layer.colorTransformParams;
    for (let i = 0; i < srcColors.length; i += 3) {
      let r = srcColors[i];
      let g = srcColors[i + 1];
      let b = srcColors[i + 2];
      r = Math.pow(Math.max(0, r + c.brightness), 1 / c.gamma);
      g = Math.pow(Math.max(0, g + c.brightness), 1 / c.gamma);
      b = Math.pow(Math.max(0, b + c.brightness), 1 / c.gamma);
      r = ((r - 0.5) * c.contrast + 0.5);
      g = ((g - 0.5) * c.contrast + 0.5);
      b = ((b - 0.5) * c.contrast + 0.5);
      const gray = (r + g + b) / 3;
      r = gray + (r - gray) * c.saturation;
      g = gray + (g - gray) * c.saturation;
      b = gray + (b - gray) * c.saturation;
      if (c.invert) {
        r = 1 - r; g = 1 - g; b = 1 - b;
      }
      out[i] = Math.min(1, Math.max(0, r));
      out[i + 1] = Math.min(1, Math.max(0, g));
      out[i + 2] = Math.min(1, Math.max(0, b));
    }
    return out;
  }

  load(canonical, layer, selectionSet) {
    if (this.points) this.scene.remove(this.points);
    const indices = [];
    for (let i = 0; i < canonical.count; i++) if (!layer.deletedMask[i]) indices.push(i);

    const positions = new Float32Array(indices.length * 3);
    const colors = new Float32Array(indices.length * 3);
    const transformed = this.applyColorTransform(layer, canonical.baseColor);

    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      positions.set(canonical.positions.subarray(idx * 3, idx * 3 + 3), i * 3);
      colors.set(transformed.subarray(idx * 3, idx * 3 + 3), i * 3);
      if (selectionSet.has(idx)) {
        colors[i * 3] = 1; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.2;
      }
    }

    this.renderIndexMap = indices;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: this.pointSize * 0.03, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: this.opacity * layer.opacity });
    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    this.lastBounds = {
      sphere: geo.boundingSphere?.clone(),
      box: geo.boundingBox?.clone()
    };
  }

  frameScene() {
    if (!this.lastBounds?.sphere) return;
    const sphere = this.lastBounds.sphere;
    const center = sphere.center;
    const radius = Math.max(sphere.radius, 0.01);
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const distance = radius / Math.sin(fov / 2);
    const dir = new THREE.Vector3(0, 0, 1);
    this.camera.position.copy(center).add(dir.multiplyScalar(distance * 1.15));
    this.controls.target.copy(center);
    this.camera.near = Math.max(0.001, distance / 1000);
    this.camera.far = Math.max(1000, distance * 20);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  pick(clientX, clientY) {
    if (!this.points) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera({ x, y }, this.camera);
    const hits = this.raycaster.intersectObject(this.points);
    if (!hits.length) return null;
    return this.renderIndexMap[hits[0].index];
  }

  frame() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
