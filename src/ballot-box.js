// esm.sh rewrites bare 'three' imports internally - required for GLTFLoader/OrbitControls to resolve.
// jsDelivr examples/jsm files use bare specifiers, which fail without an importmap.
const THREE_URL         = 'https://esm.sh/three@0.160.0';
const GLTF_LOADER_URL   = 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader';
const ORBIT_CONTROL_URL = 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls';

class BallotBoxElement extends HTMLElement {
  constructor() {
    super();
    this._shadow      = this.attachShadow({ mode: 'open' });
    this._initialized = false;
    this._dropCount   = 0;
    this._isDropping  = false;
    this._animFrame   = null;
    this._renderer    = null;
    this._scene       = null;
    this._camera      = null;
    this._controls    = null;
    this._resizeObs   = null;
    this._THREE       = null;
    this._hitTarget   = null;
  }

  async connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;
    await this._init();
  }

  async _init() {
    this._shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
        .wrap {
          width: 100%;
          height: 100%;
          position: relative;
          background: #0b1428;
          cursor: grab;
          -webkit-user-select: none;
          user-select: none;
          overflow: hidden;
          border-radius: 4px;
        }
        .wrap:active { cursor: grabbing; }
        canvas { display: block; }


      </style>
      <div class="wrap">
      </div>
    `;

    const wrap    = this._shadow.querySelector('.wrap');

    let THREE, GLTFLoader, OrbitControls;
    try {
      THREE           = await import(THREE_URL);
      ({ GLTFLoader } = await import(GLTF_LOADER_URL));
      ({ OrbitControls } = await import(ORBIT_CONTROL_URL));
    } catch (err) {
      console.error('[ballot-box] Three.js import failed:', err);
      return;
    }
    this._THREE = THREE;

    const rect = wrap.getBoundingClientRect();
    const w = rect.width  || 400;
    const h = rect.height || 400;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1428);
    this._scene = scene;

    // Camera - top-tilted view
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 4.5, 3.5);
    this._camera = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    wrap.appendChild(renderer.domElement);
    this._renderer = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 3);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0x8da4c4, 0.4);
    fill.position.set(-3, 1, -2);
    scene.add(fill);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan     = false;
    controls.minDistance   = 2.5;
    controls.maxDistance   = 9;
    controls.autoRotate    = true;
    controls.autoRotateSpeed = 0.7;
    controls.target.set(0, 0, 0);
    this._controls = controls;

    // GLB or procedural fallback
    try {
      const loader = new GLTFLoader();
      const gltf   = await new Promise((res, rej) =>
        loader.load('/src/assets/ballot-box.glb', res, undefined, rej)
      );

      const model = gltf.scene;

      // Center model - Blender exports often have offset origin
      const box3   = new THREE.Box3().setFromObject(model);
      const center = box3.getCenter(new THREE.Vector3());
      model.position.sub(center);

      // Match project color palette, keep PBR shading
      model.traverse((child) => {
        if (child.isMesh) {
          child.material.color.setHex(0x1a3a6e);
          child.material.roughness  = 0.65;
          child.material.metalness  = 0.08;
          child.material.needsUpdate = true;
        }
      });

      // Edge highlight so slot geometry reads clearly
      model.traverse((child) => {
        if (child.isMesh) {
          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(child.geometry, 15),
            new THREE.LineBasicMaterial({ color: 0x3a6aae }),
          );
          model.add(edges);
        }
      });

      scene.add(model);

      // Fit camera to actual model size - top-tilted view
      const size   = box3.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      camera.position.set(0, maxDim * 1.6, maxDim * 1.4);
      controls.minDistance = maxDim * 0.9;
      controls.maxDistance = maxDim * 4.5;
      controls.update();

      // Store box top Y so ballot drop lands at the slot
      this._boxTopY = size.y / 2;

      // Hit target sized to centered model
      const hitGeo = new THREE.BoxGeometry(size.x * 1.15, size.y * 1.15, size.z * 1.15);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      this._hitTarget = new THREE.Mesh(hitGeo, hitMat);
      scene.add(this._hitTarget);

    } catch (err) {
      console.warn('[ballot-box] GLB load failed, using procedural fallback:', err);
      this._buildBox(THREE, scene);
    }

    // Click removed - drop triggered externally via drop()

    // Resize
    this._resizeObs = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      renderer.setSize(r.width, r.height);
    });
    this._resizeObs.observe(wrap);

    // Render loop
    const loop = () => {
      this._animFrame = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();
  }

  // ── Procedural ballot box ───────────────────────────────────────────────
  _buildBox(THREE, scene) {
    const body   = new THREE.MeshToonMaterial({ color: 0x1a3a6e });
    const accent = new THREE.MeshToonMaterial({ color: 0xf15613 });
    const g      = new THREE.Group();

    // Walls + floor
    [
      [[2, 1.5, 0.07], [0, 0, -0.75]],   // back
      [[2, 1.5, 0.07], [0, 0,  0.75]],   // front
      [[0.07, 1.5, 1.5], [-1, 0, 0]],    // left
      [[0.07, 1.5, 1.5], [ 1, 0, 0]],    // right
      [[2, 0.07, 1.5], [0, -0.75, 0]],   // floor
    ].forEach(([size, pos]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...size), body);
      m.position.set(...pos);
      g.add(m);
    });

    // Top - two panels with ballot slot
    const slotW = 0.55;
    const panW  = (2 - slotW) / 2 - 0.02;
    [-1, 1].forEach((s) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(panW, 0.07, 1.5), body);
      panel.position.set(s * (panW / 2 + slotW / 2), 0.75, 0);
      g.add(panel);
    });
    // Slot accent edges
    [-1, 1].forEach((s) => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 1.5), accent);
      edge.position.set(s * slotW / 2, 0.77, 0);
      g.add(edge);
    });

    // Wireframe outline
    g.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 1.5, 1.5)),
      new THREE.LineBasicMaterial({ color: 0x3a6aae }),
    ));

    scene.add(g);

    // Hit target
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this._hitTarget = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.7, 1.7), hitMat);
    scene.add(this._hitTarget);
  }

  // ── Public API ──────────────────────────────────────────────────────────
  drop() {
    if (!this._isDropping && this._THREE) this._drop();
  }

  // ── Click → raycast → drop ──────────────────────────────────────────────
  _onClick(e, wrap) {
    if (this._isDropping || !this._THREE || !this._hitTarget) return;

    const THREE = this._THREE;
    const rect  = wrap.getBoundingClientRect();
    const ndc   = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );

    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this._camera);
    if (!ray.intersectObject(this._hitTarget, true).length) return;

    this._drop();
  }

  _drop() {
    const THREE = this._THREE;
    this._isDropping = true;
    if (this._controls) this._controls.autoRotate = false;

    const topY   = this._boxTopY ?? 0.75;
    const slotY  = topY - 0.05;      // enters slot
    const insideY = -(topY * 0.4);   // disappears into box

    const geo    = new THREE.PlaneGeometry(0.46, 0.3);
    const mat    = new THREE.MeshBasicMaterial({ color: 0xf5f0e0, side: THREE.DoubleSide });
    const ballot = new THREE.Mesh(geo, mat);
    ballot.rotation.x = -Math.PI / 2;
    ballot.position.set((Math.random() - 0.5) * 0.15, topY + 2.5, (Math.random() - 0.5) * 0.15);
    this._scene.add(ballot);

    const cleanup = () => {
      this._scene.remove(ballot);
      geo.dispose();
      mat.dispose();
      this._isDropping = false;
      if (this._controls) this._controls.autoRotate = true;
      this._dropCount++;

      this.dispatchEvent(new CustomEvent('ballot-dropped', {
        bubbles:  true,
        composed: true,
        detail:   { count: this._dropCount },
      }));
    };

    if (window.gsap) {
      window.gsap.timeline()
        .to(ballot.position, { y: slotY,   duration: 0.55, ease: 'power2.in' })
        .to(ballot.position, { y: insideY, duration: 0.18, ease: 'power2.out', onComplete: cleanup });
    } else {
      const from = ballot.position.y;
      const t0   = performance.now(), dur = 550;
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        ballot.position.y = from + (slotY - from) * p * p;
        if (p < 1) requestAnimationFrame(tick);
        else cleanup();
      };
      requestAnimationFrame(tick);
    }
  }

  // ── Lifecycle cleanup ───────────────────────────────────────────────────
  disconnectedCallback() {
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    if (this._resizeObs) this._resizeObs.disconnect();
    if (this._controls)  this._controls.dispose();
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer.domElement?.remove();
    }
    if (this._scene) {
      this._scene.traverse((obj) => {
        obj.geometry?.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
    }
    this._initialized = false;
  }
}

if (!customElements.get('ballot-box')) {
  customElements.define('ballot-box', BallotBoxElement);
}
