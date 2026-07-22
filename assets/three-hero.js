/**
 * Three.js 3D Hero Canvas Web Component
 * ConvertStudio Theme 3D Visual Effects
 */
if (!customElements.get('three-hero-canvas')) {
  customElements.define(
    'three-hero-canvas',
    class ThreeHeroCanvas extends HTMLElement {
      constructor() {
        super();
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.meshGroup = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.animationFrameId = null;
      }

      connectedCallback() {
        this.loadThreeJS()
          .then(() => this.init3D())
          .catch((err) => console.error('Three.js failed to load:', err));
      }

      disconnectedCallback() {
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
        }
        window.removeEventListener('resize', this.onWindowResize);
        document.removeEventListener('mousemove', this.onMouseMove);
      }

      loadThreeJS() {
        return new Promise((resolve, reject) => {
          if (window.THREE) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
          script.onload = () => resolve();
          script.onerror = (e) => reject(e);
          document.head.appendChild(script);
        });
      }

      init3D() {
        const THREE = window.THREE;
        const container = this;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // 1. Scene
        this.scene = new THREE.Scene();

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
        this.camera.position.z = 400;

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        // 4. Create 3D Particle Mesh Wave
        const particleCount = 1200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);

        let i = 0, j = 0;
        for (let ix = 0; ix < 40; ix++) {
          for (let iy = 0; iy < 30; iy++) {
            positions[i] = ix * 24 - (40 * 24) / 2; // x
            positions[i + 1] = 0;                  // y
            positions[i + 2] = iy * 24 - (30 * 24) / 2; // z
            scales[j] = 2;
            i += 3;
            j++;
          }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create canvas texture for soft circular particles
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.PointsMaterial({
          size: 6,
          map: texture,
          transparent: true,
          opacity: 0.65,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);

        // 5. Add 3D Wireframe Torus Ring Accent
        const torusGeo = new THREE.TorusKnotGeometry(80, 24, 100, 16);
        const torusMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.25
        });
        const torusMesh = new THREE.Mesh(torusGeo, torusMat);
        torusMesh.position.set(200, 50, -100);

        this.meshGroup = new THREE.Group();
        this.meshGroup.add(torusMesh);
        this.scene.add(this.meshGroup);

        // 6. Listeners
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);

        window.addEventListener('resize', this.onWindowResize, false);
        document.addEventListener('mousemove', this.onMouseMove, false);

        // 7. Animation Loop
        let count = 0;
        const animate = () => {
          this.animationFrameId = requestAnimationFrame(animate);

          count += 0.04;
          const pos = this.particles.geometry.attributes.position.array;

          let index = 0;
          for (let ix = 0; ix < 40; ix++) {
            for (let iy = 0; iy < 30; iy++) {
              pos[index + 1] = Math.sin((ix + count) * 0.3) * 30 + Math.sin((iy + count) * 0.5) * 30;
              index += 3;
            }
          }
          this.particles.geometry.attributes.position.needsUpdate = true;

          // Parallax camera easing
          this.targetX = this.mouseX * 0.08;
          this.targetY = this.mouseY * 0.08;

          this.camera.position.x += (this.targetX - this.camera.position.x) * 0.05;
          this.camera.position.y += (-this.targetY - this.camera.position.y) * 0.05;
          this.camera.lookAt(this.scene.position);

          if (this.meshGroup) {
            this.meshGroup.rotation.x += 0.005;
            this.meshGroup.rotation.y += 0.008;
          }

          this.renderer.render(this.scene, this.camera);
        };

        animate();
      }

      onWindowResize() {
        if (!this.camera || !this.renderer) return;
        const width = this.clientWidth || window.innerWidth;
        const height = this.clientHeight || window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }

      onMouseMove(event) {
        this.mouseX = event.clientX - window.innerWidth / 2;
        this.mouseY = event.clientY - window.innerHeight / 2;
      }
    }
  );
}
