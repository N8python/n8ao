import * as THREE from 'three';

const _geometry = new THREE.BufferGeometry();
_geometry.setAttribute(
  'position',
  new THREE.BufferAttribute(new Float32Array([-1, -1, 3, -1, -1, 3]), 2)
);
_geometry.setAttribute(
  'uv',
  new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2)
);

// Recent three.js versions break setDrawRange or itemSize <3 position
_geometry.boundingSphere = new THREE.Sphere();
_geometry.computeBoundingSphere = function() {};

const _camera = new THREE.OrthographicCamera()

export class FullScreenTriangle {
  constructor(material) {
    this._mesh = new THREE.Mesh(_geometry, material);
    this._mesh.frustumCulled = false;
  }

  render(renderer) {
    renderer.render(this._mesh, _camera);
  }

  get material() {
    return this._mesh.material;
  }

  set material(value) {
    this._mesh.material = value;
  }

  dispose() {
    this._mesh.material.dispose();
    this._mesh.geometry.dispose();
  }
}
