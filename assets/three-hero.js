/**
 * Three.js 3D Hero Canvas Web Component
 * ConvertStudio & Gaia Theme 3D Visual Effects Suite (10 Animations)
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
        this.activeGroup = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.animationFrameId = null;
        this.clock = null;
        this.observer = null;
      }

      connectedCallback() {
        this.loadThreeJS()
          .then(() => {
            this.init3D();
            this.setupObserver();
          })
          .catch((err) => console.error('Three.js failed to load:', err));
      }

      disconnectedCallback() {
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
        }
        if (this.observer) {
          this.observer.disconnect();
        }
        window.removeEventListener('resize', this.onWindowResize);
        document.removeEventListener('mousemove', this.onMouseMove);
      }

      setupObserver() {
        this.observer = new MutationObserver(() => {
          this.rebuild3D();
        });
        this.observer.observe(this, { attributes: true });
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

      getProp(name, fallback) {
        return this.getAttribute(name) || fallback;
      }

      init3D() {
        const THREE = window.THREE;
        const container = this;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // 1. Scene & Clock
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
        this.camera.position.z = 400;

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Clean previous canvas if any
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);

        // 4. Build Selected 3D Object Group
        this.buildSceneGroup();

        // 5. Listeners
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);

        window.addEventListener('resize', this.onWindowResize, false);
        document.addEventListener('mousemove', this.onMouseMove, false);

        // 6. Animation Loop
        this.startAnimationLoop();
      }

      rebuild3D() {
        if (!this.scene || !window.THREE) return;
        if (this.activeGroup) {
          this.scene.remove(this.activeGroup);
          this.activeGroup = null;
        }
        this.buildSceneGroup();
      }

      buildSceneGroup() {
        const THREE = window.THREE;
        const animationType = this.getProp('data-animation', 'wave_field');
        const primaryColorHex = this.getProp('data-primary-color', '#38bdf8');
        const accentColorHex = this.getProp('data-accent-color', '#818cf8');
        const isWireframe = this.getProp('data-wireframe', 'true') === 'true';

        const primaryColor = new THREE.Color(primaryColorHex);
        const accentColor = new THREE.Color(accentColorHex);

        this.activeGroup = new THREE.Group();

        switch (animationType) {
          case 'torus_knot':
            this.buildTorusKnot(primaryColor, accentColor, isWireframe);
            break;
          case 'icosahedron':
            this.buildIcosahedron(primaryColor, accentColor, isWireframe);
            break;
          case 'galaxy_orbs':
            this.buildGalaxyOrbs(primaryColor, accentColor);
            break;
          case 'dna_helix':
            this.buildDNAHelix(primaryColor, accentColor);
            break;
          case 'cyber_ring':
            this.buildCyberRings(primaryColor, accentColor, isWireframe);
            break;
          case 'hyper_sphere':
            this.buildHyperSphere(primaryColor, accentColor, isWireframe);
            break;
          case 'particle_tunnel':
            this.buildParticleTunnel(primaryColor, accentColor);
            break;
          case 'cube_matrix':
            this.buildCubeMatrix(primaryColor, accentColor, isWireframe);
            break;
          case 'diamond_grid':
            this.buildDiamondGrid(primaryColor, accentColor, isWireframe);
            break;
          case 'wave_field':
          default:
            this.buildWaveField(primaryColor, accentColor);
            break;
        }

        this.scene.add(this.activeGroup);
      }

      // Helper to generate soft particle texture
      createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        return new window.THREE.CanvasTexture(canvas);
      }

      // 1. Dynamic Wave Field
      buildWaveField(primaryColor, accentColor) {
        const THREE = window.THREE;
        const countX = 45;
        const countY = 35;
        const total = countX * countY;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(total * 3);
        const colors = new Float32Array(total * 3);

        let idx = 0;
        for (let ix = 0; ix < countX; ix++) {
          for (let iy = 0; iy < countY; iy++) {
            positions[idx] = ix * 22 - (countX * 22) / 2;
            positions[idx + 1] = 0;
            positions[idx + 2] = iy * 22 - (countY * 22) / 2;

            const ratio = ix / countX;
            const c = primaryColor.clone().lerp(accentColor, ratio);
            colors[idx] = c.r;
            colors[idx + 1] = c.g;
            colors[idx + 2] = c.b;

            idx += 3;
          }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
          size: 7,
          map: this.createParticleTexture(),
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        const points = new THREE.Points(geometry, material);
        this.activeGroup.add(points);
        this.activeGroup.userData.animate = (time, speed) => {
          const pos = geometry.attributes.position.array;
          let i = 0;
          for (let ix = 0; ix < countX; ix++) {
            for (let iy = 0; iy < countY; iy++) {
              pos[i + 1] = Math.sin((ix + time * speed * 2) * 0.25) * 28 + Math.sin((iy + time * speed * 2) * 0.35) * 28;
              i += 3;
            }
          }
          geometry.attributes.position.needsUpdate = true;
        };
      }

      // 2. Sculpted Torus Knot
      buildTorusKnot(primaryColor, accentColor, isWireframe) {
        const THREE = window.THREE;
        const geometry = new THREE.TorusKnotGeometry(100, 30, 120, 16);
        const material = new THREE.MeshBasicMaterial({
          color: primaryColor,
          wireframe: isWireframe,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending
        });

        const knotMesh = new THREE.Mesh(geometry, material);
        this.activeGroup.add(knotMesh);

        // Add accent particle halo
        const haloGeo = new THREE.TorusGeometry(160, 2, 16, 100);
        const haloMat = new THREE.MeshBasicMaterial({
          color: accentColor,
          wireframe: true,
          transparent: true,
          opacity: 0.35
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.rotation.x = Math.PI / 2;
        this.activeGroup.add(halo);

        this.activeGroup.userData.animate = (time, speed, rotation) => {
          knotMesh.rotation.x = time * 0.3 * (rotation / 5);
          knotMesh.rotation.y = time * 0.5 * (rotation / 5);
          halo.rotation.z = -time * 0.2 * (rotation / 5);
        };
      }

      // 3. Floating Crystal Mesh (Icosahedron)
      buildIcosahedron(primaryColor, accentColor, isWireframe) {
        const THREE = window.THREE;
        const geometry = new THREE.IcosahedronGeometry(110, 2);
        const material = new THREE.MeshBasicMaterial({
          color: primaryColor,
          wireframe: isWireframe,
          transparent: true,
          opacity: 0.55
        });
        const mesh = new THREE.Mesh(geometry, material);
        this.activeGroup.add(mesh);

        // Inner glowing core
        const coreGeo = new THREE.IcosahedronGeometry(60, 0);
        const coreMat = new THREE.MeshBasicMaterial({
          color: accentColor,
          wireframe: true,
          transparent: true,
          opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        this.activeGroup.add(core);

        this.activeGroup.userData.animate = (time, speed, rotation) => {
          mesh.rotation.y = time * 0.4 * (rotation / 5);
          mesh.rotation.z = time * 0.2 * (rotation / 5);
          core.rotation.x = -time * 0.6 * (rotation / 5);
          core.rotation.y = -time * 0.3 * (rotation / 5);
        };
      }

      // 4. Cosmic Galaxy Orbs
      buildGalaxyOrbs(primaryColor, accentColor) {
        const THREE = window.THREE;
        const count = 1600;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
          const r = 80 + Math.random() * 160;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);

          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = r * Math.cos(phi);

          const c = Math.random() > 0.5 ? primaryColor : accentColor;
          colors[i * 3] = c.r;
          colors[i * 3 + 1] = c.g;
          colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
          size: 6,
          map: this.createParticleTexture(),
          vertexColors: true,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        const points = new THREE.Points(geometry, material);
        this.activeGroup.add(points);

        this.activeGroup.userData.animate = (time, speed, rotation) => {
          points.rotation.y = time * 0.15 * (rotation / 5);
          points.rotation.x = time * 0.08 * (rotation / 5);
        };
      }

      // 5. DNA Double Helix
      buildDNAHelix(primaryColor, accentColor) {
        const THREE = window.THREE;
        const count = 300;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 6); // 2 strands
        const colors = new Float32Array(count * 6);

        for (let i = 0; i < count; i++) {
          const y = (i - count / 2) * 2.5;
          const angle = i * 0.15;
          const radius = 70;

          // Strand A
          positions[i * 6] = Math.cos(angle) * radius;
          positions[i * 6 + 1] = y;
          positions[i * 6 + 2] = Math.sin(angle) * radius;
          colors[i * 6] = primaryColor.r;
          colors[i * 6 + 1] = primaryColor.g;
          colors[i * 6 + 2] = primaryColor.b;

          // Strand B
          positions[i * 6 + 3] = Math.cos(angle + Math.PI) * radius;
          positions[i * 6 + 4] = y;
          positions[i * 6 + 5] = Math.sin(angle + Math.PI) * radius;
          colors[i * 6 + 3] = accentColor.r;
          colors[i * 6 + 4] = accentColor.g;
          colors[i * 6 + 5] = accentColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
          size: 8,
          map: this.createParticleTexture(),
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(geometry, material);
        this.activeGroup.add(points);

        this.activeGroup.userData.animate = (time, speed, rotation) => {
          points.rotation.y = time * 0.6 * (rotation / 5);
          points.rotation.z = Math.sin(time * 0.5) * 0.15;
        };
      }

      // 6. Pulsing Cyber Rings
      buildCyberRings(primaryColor, accentColor, isWireframe) {
        const THREE = window.THREE;
        const ringGroup = new THREE.Group();

        for (let i = 0; i < 5; i++) {
          const radius = 50 + i * 35;
          const geometry = new THREE.RingGeometry(radius, radius + 2, 64);
          const color = i % 2 === 0 ? primaryColor : accentColor;
          const material = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5 - i * 0.08
          });

          const ring = new THREE.Mesh(geometry, material);
          ring.rotation.x = Math.PI / 3;
          ring.userData = { speed: (i + 1) * 0.2, dir: i % 2 === 0 ? 1 : -1 };
          ringGroup.add(ring);
        }

        this.activeGroup.add(ringGroup);

        this.activeGroup.userData.animate = (time, speed, rotation) => {
          ringGroup.children.forEach((ring) => {
            ring.rotation.z = time * ring.userData.speed * ring.userData.dir * (rotation / 5);
          });
          ringGroup.rotation.y = Math.sin(time * 0.3) * 0.2;
        };
      }

      // 7. Deforming Hyper-Sphere
      buildHyperSphere(primaryColor, accentColor, isWireframe) {
        const THREE = window.THREE;
        const geometry = new THREE.SphereGeometry(100, 48, 48);
        const originalPos = geometry.attributes.position.clone();

        const material = new THREE.MeshBasicMaterial({
          color: primaryColor,
          wireframe: isWireframe,
          transparent: true,
          opacity: 0.65
        });

        const sphere = new THREE.Mesh(geometry, material);
        this.activeGroup.add(sphere);

        this.activeGroup.userData.animate = (time, speed, rotation) => {
          const pos = geometry.attributes.position.array;
          const orig = originalPos.array;

          for (let i = 0; i < pos.length; i += 3) {
            const vx = orig[i];
            const vy = orig[i + 1];
            const vz = orig[i + 2];
            const wave = Math.sin(vx * 0.04 + time * speed * 2) * Math.cos(vy * 0.04 + time * speed * 2) * 18;

            pos[i] = vx + (vx / 100) * wave;
            pos[i + 1] = vy + (vy / 100) * wave;
            pos[i + 2] = vz + (vz / 100) * wave;
          }

          geometry.attributes.position.needsUpdate = true;
          sphere.rotation.y = time * 0.3 * (rotation / 5);
        };
      }

      // 8. Warp Speed Particle Tunnel
      buildParticleTunnel(primaryColor, accentColor) {
        const THREE = window.THREE;
        const count = 1200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
          const radius = 60 + Math.random() * 120;
          const angle = Math.random() * Math.PI * 2;
          const z = Math.random() * 800 - 400;

          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = Math.sin(angle) * radius;
          positions[i * 3 + 2] = z;

          const c = Math.random() > 0.5 ? primaryColor : accentColor;
          colors[i * 3] = c.r;
          colors[i * 3 + 1] = c.g;
          colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
          size: 6,
          map: this.createParticleTexture(),
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(geometry, material);
        this.activeGroup.add(points);

        this.activeGroup.userData.animate = (time, speed) => {
          const pos = geometry.attributes.position.array;
          for (let i = 0; i < count; i++) {
            pos[i * 3 + 2] += speed * 3;
            if (pos[i * 3 + 2] > 400) {
              pos[i * 3 + 2] = -400;
            }
          }
          geometry.attributes.position.needsUpdate = true;
          points.rotation.z = time * 0.1;
        };
      }

      // 9. Wireframe Cube Matrix
      buildCubeMatrix(primaryColor, accentColor, isWireframe) {
        const THREE = window.THREE;
        const gridGroup = new THREE.Group();
        const size = 35;
        const gap = 55;

        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
              const geometry = new THREE.BoxGeometry(size, size, size);
              const color = (x + y + z) % 2 === 0 ? primaryColor : accentColor;
              const material = new THREE.MeshBasicMaterial({
                color: color,
                wireframe: isWireframe,
                transparent: true,
                opacity: 0.65
              });

              const cube = new THREE.Mesh(geometry, material);
              cube.position.set(x * gap, y * gap, z * gap);
              gridGroup.add(cube);
            }
          }
        }

        this.activeGroup.add(gridGroup);

        this.activeGroup.userData.animate = (time, speed, rotation) => {
          gridGroup.rotation.x = time * 0.3 * (rotation / 5);
          gridGroup.rotation.y = time * 0.4 * (rotation / 5);
        };
      }

      // 10. Diamond Lattice Grid
      buildDiamondGrid(primaryColor, accentColor, isWireframe) {
        const THREE = window.THREE;
        const gridGroup = new THREE.Group();
        const count = 12;

        for (let i = 0; i < count; i++) {
          const geometry = new THREE.OctahedronGeometry(25 + (i % 3) * 10, 0);
          const color = i % 2 === 0 ? primaryColor : accentColor;
          const material = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: isWireframe,
            transparent: true,
            opacity: 0.6
          });

          const diamond = new THREE.Mesh(geometry, material);
          const angle = (i / count) * Math.PI * 2;
          diamond.position.x = Math.cos(angle) * 140;
          diamond.position.y = Math.sin(angle * 2) * 30;
          diamond.position.z = Math.sin(angle) * 140;
          diamond.userData = { offset: i };

          gridGroup.add(diamond);
        }

        this.activeGroup.add(gridGroup);

        this.activeGroup.userData.animate = (time, speed, rotation) => {
          gridGroup.rotation.y = time * 0.25 * (rotation / 5);
          gridGroup.children.forEach((d) => {
            d.rotation.x = time * 0.8 + d.userData.offset;
            d.rotation.y = time * 0.6;
          });
        };
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

      startAnimationLoop() {
        const animate = () => {
          this.animationFrameId = requestAnimationFrame(animate);

          const time = this.clock.getElapsedTime();
          const speed = parseFloat(this.getProp('data-speed', 5));
          const rotation = parseFloat(this.getProp('data-rotation', 5));
          const enableParallax = this.getProp('data-parallax', 'true') === 'true';

          // Animate 3D Object Group
          if (this.activeGroup && this.activeGroup.userData.animate) {
            this.activeGroup.userData.animate(time, speed, rotation);
          }

          // Camera Parallax Easing
          if (enableParallax) {
            this.targetX = this.mouseX * 0.08;
            this.targetY = this.mouseY * 0.08;
            this.camera.position.x += (this.targetX - this.camera.position.x) * 0.05;
            this.camera.position.y += (-this.targetY - this.camera.position.y) * 0.05;
          } else {
            this.camera.position.x += (0 - this.camera.position.x) * 0.05;
            this.camera.position.y += (0 - this.camera.position.y) * 0.05;
          }

          this.camera.lookAt(this.scene.position);
          this.renderer.render(this.scene, this.camera);
        };

        animate();
      }
    }
  );
}
