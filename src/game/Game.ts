import * as THREE from 'three';
import { CPU, type CPUEvent } from './CPU';
import { distance2 } from './Collision';
import { GameAudio } from './Audio';
import { MiniGames } from './MiniGames';
import { Player } from './Player';
import { UI } from './UI';
import { World } from './World';
import type { GameMode, InputState, Interactable, Vec2 } from './types';

type Sparkle = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  velocity: THREE.Vector3;
  life: number;
};

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
  private readonly clock = new THREE.Clock();
  private readonly ui = new UI();
  private readonly audio = new GameAudio();
  private readonly miniGames: MiniGames;
  private readonly keys = new Set<string>();
  private touchInput: InputState = { forward: false, back: false, left: false, right: false };
  private readonly sparkles: Sparkle[] = [];

  private scene = new THREE.Scene();
  private world!: World;
  private player!: Player;
  private cpu!: CPU;
  private mode: GameMode = 'menu';
  private cameraYaw = Math.PI * 0.28;
  private dragging = false;
  private lastPointerX = 0;
  private coins = 0;
  private hints: string[] = [];
  private nearby: Interactable | null = null;
  private elapsed = 0;
  private nextGuideAt = 30;

  constructor(canvas: HTMLCanvasElement, miniGameRoot: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.miniGames = new MiniGames(miniGameRoot);

    this.ui.bindHowTo();
    this.ui.onStart(() => this.beginRun());
    this.ui.onRetry(() => this.beginRun());
    this.ui.onMobileMoveChange((input) => {
      this.touchInput = input;
    });
    this.ui.onMobileInteract(() => this.tryInteract());
    this.bindInput(canvas);
    this.createScene();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  private beginRun(): void {
    this.audio.unlock();
    this.keys.clear();
    this.touchInput = { forward: false, back: false, left: false, right: false };
    this.coins = 0;
    this.hints = [];
    this.elapsed = 0;
    this.nextGuideAt = 30;
    this.nearby = null;
    this.mode = 'playing';
    this.createScene();
    this.ui.showGame();
    this.ui.setCpuStatus('さがす');
    this.ui.updateHud(this.hudState());
    this.ui.showToast('たからさがし スタート！');
  }

  private createScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xb9edff);
    this.scene.fog = new THREE.Fog(0xb9edff, 26, 58);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x9ec7c0, 2.6);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(8, 14, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    this.scene.add(sun);

    this.world = new World(this.scene);
    this.player = new Player(this.scene, this.world.playerStart);
    this.cpu = new CPU(this.scene, this.world.cpuStart);
    this.sparkles.length = 0;
    this.updateCamera();
  }

  private bindInput(canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', (event) => {
      if (this.isGameKey(event.code)) {
        event.preventDefault();
      }

      if (this.mode !== 'playing') {
        return;
      }

      this.keys.add(event.code);
      if (event.code === 'Space' || event.code === 'Enter' || event.code === 'KeyE') {
        this.tryInteract();
      }
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });

    canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.dragging = true;
      this.lastPointerX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!this.dragging || this.mode !== 'playing') {
        return;
      }
      event.preventDefault();
      const delta = event.clientX - this.lastPointerX;
      this.lastPointerX = event.clientX;
      this.cameraYaw -= delta * 0.006;
    });

    canvas.addEventListener('pointerup', (event) => {
      this.dragging = false;
      canvas.releasePointerCapture(event.pointerId);
    });
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.mode === 'playing') {
      this.updatePlaying(dt);
    }

    this.world.update(dt);
    this.updateSparkles(dt);
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  };

  private updatePlaying(dt: number): void {
    this.elapsed += dt;
    this.updateCameraControls(dt);
    this.player.update(dt, this.inputState(), this.cameraYaw, this.world.colliders, this.world.houseBounds);
    this.nearby = this.findNearby();
    this.world.setFocusedInteractable(this.nearby?.id ?? null);
    this.world.setTreasureGlowLevel(this.hints.length);
    this.ui.setPrompt(this.nearby ? 'しらべる' : null);

    const events = this.cpu.update(dt, {
      elapsed: this.elapsed,
      interactables: this.world.interactables,
      colliders: this.world.colliders,
      houseBounds: this.world.houseBounds,
      treasurePosition: this.world.treasurePosition
    });
    this.handleCPUEvents(events);

    if (this.elapsed >= this.nextGuideAt && this.mode === 'playing') {
      this.nextGuideAt += 24;
      this.showGuidanceMessage();
    }

    this.ui.updateHud(this.hudState());
    this.ui.drawMinimap(this.player.position, this.cpu.position, this.world.houseBounds);
  }

  private tryInteract(): void {
    if (!this.nearby || this.mode !== 'playing') {
      return;
    }

    this.audio.unlock();
    const target = this.nearby;
    if (target.type === 'hint') {
      this.collectHint(target);
      return;
    }

    if (target.type === 'minigame' && target.miniGameKind) {
      this.startMiniGame(target);
      return;
    }

    if (target.type === 'treasure') {
      this.tryOpenTreasure(target);
    }
  }

  private collectHint(target: Interactable): void {
    if (target.done || !target.hintText) {
      return;
    }
    target.done = true;
    target.object?.traverse((child) => {
      child.visible = false;
    });
    this.hints.push(target.hintText);
    this.world.setTreasureGlowLevel(this.hints.length);
    this.audio.hint();
    const extra = this.hints.length >= 3 ? ' たからの ちかくが すこし ひかったよ' : '';
    this.ui.showToast(`ヒントを みつけた！ ${target.hintText}${extra}`, 4600);
  }

  private startMiniGame(target: Interactable): void {
    const repeated = target.plays > 0;
    this.mode = 'miniGame';
    this.ui.setPrompt(null);
    void this.miniGames.play(target.miniGameKind!, repeated).then((reward) => {
      target.plays += 1;
      this.coins += reward;
      this.audio.coin();
      this.ui.showReward(reward);
      this.spawnSparkles(this.player.position, reward >= 10 ? 28 : 14, reward >= 10 ? 0.8 : 0.55);
      if (reward >= 10) {
        this.audio.success();
      }
      this.mode = 'playing';
      this.ui.showToast(`コインを ${reward}まい もらったよ！`, 2600);
      this.ui.updateHud(this.hudState());
    });
  }

  private tryOpenTreasure(target: Interactable): void {
    if (this.coins < 60) {
      this.ui.showToast('たからばこを みつけた！でも コインが 60まい いるよ', 4400);
      return;
    }

    target.done = true;
    this.mode = 'won';
    this.world.openTreasure();
    this.spawnSparkles(this.world.treasurePosition, 230, 1.75);
    this.spawnSparkles(this.player.position, 70, 1.05);
    this.ui.showReward(0, 'treasure');
    this.ui.showToast('やった！ たからばこが ひらいたよ！', 2300);
    this.audio.treasure();
    window.setTimeout(() => this.ui.showEnd('win'), 1700);
  }

  private handleCPUEvents(events: CPUEvent[]): void {
    for (const event of events) {
      if (event.type === 'coin') {
        this.ui.showReward(event.amount, 'cpu');
        this.ui.showToast(`CPUが コインを ${event.amount}まい もらったよ`, 1800);
      }
      if (event.type === 'hint') {
        this.ui.showToast('CPUが ヒントを みつけたよ', 1800);
      }
      if (event.type === 'state') {
        const status = this.cpuStateStatus(event.state);
        if (status) {
          this.ui.setCpuStatus(status);
        }
        const label = this.cpuStateToast(event.state);
        if (label) {
          this.ui.showToast(`CPUは ${label}`, event.state === 'goToTreasure' ? 2600 : 1600);
        }
      }
      if (event.type === 'treasure' && this.mode === 'playing') {
        this.mode = 'lost';
        this.world.openTreasure();
        this.spawnSparkles(this.world.treasurePosition, 110, 1.25);
        this.audio.lose();
        window.setTimeout(() => this.ui.showEnd('lose'), 1000);
      }
    }
  }

  private findNearby(): Interactable | null {
    let best: Interactable | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const item of this.world.interactables) {
      if (item.type === 'hint' && item.done) {
        continue;
      }
      if (item.type === 'treasure' && item.done) {
        continue;
      }

      const d2 = distance2(this.player.position, item.position);
      if (d2 <= item.radius * item.radius && d2 < bestDistance) {
        best = item;
        bestDistance = d2;
      }
    }
    return best;
  }

  private updateCameraControls(dt: number): void {
    const rotateSpeed = 1.65;
    if (this.keys.has('KeyQ')) {
      this.cameraYaw += rotateSpeed * dt;
    }
    if (this.keys.has('KeyE') && !this.nearby) {
      this.cameraYaw -= rotateSpeed * dt;
    }
  }

  private updateCamera(): void {
    const target = this.player?.position ?? { x: 0, z: 0 };
    const forward = new THREE.Vector3(Math.sin(this.cameraYaw), 0, Math.cos(this.cameraYaw));
    const distance = 12.6;
    const height = 9.6;
    this.camera.position.set(target.x - forward.x * distance, height, target.z - forward.z * distance);
    this.camera.lookAt(target.x, 1.1, target.z);
  }

  private inputState(): InputState {
    return {
      forward: this.touchInput.forward || this.keys.has('KeyW') || this.keys.has('ArrowUp'),
      back: this.touchInput.back || this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      left: this.touchInput.left || this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
      right: this.touchInput.right || this.keys.has('KeyD') || this.keys.has('ArrowRight')
    };
  }

  private hudState() {
    return {
      coins: this.coins,
      cpuCoins: this.cpu.coins,
      hints: this.hints,
      hintsTotal: 6
    };
  }

  private showGuidanceMessage(): void {
    if (this.hints.length < 2) {
      this.ui.showToast('まよったら ひかる ヒントカードを さがそう！', 4300);
      return;
    }

    if (this.coins < 60) {
      this.ui.showToast('コインが 60まい いるよ。きんいろの ゲームへ いこう！', 4300);
      return;
    }

    this.ui.showToast('あかい ほんだなの うしろを しらべてみよう！', 4300);
  }

  private cpuStateStatus(state: string): string {
    if (state === 'goToHint') {
      return 'ヒントへ';
    }
    if (state === 'playMiniGame') {
      return 'ゲーム中';
    }
    if (state === 'goToTreasure' || state === 'openTreasure') {
      return 'たからへ';
    }
    return 'さがす';
  }

  private cpuStateToast(state: string): string {
    if (state === 'goToHint') {
      return 'ヒントへ いくよ';
    }
    if (state === 'playMiniGame') {
      return 'ゲーム中';
    }
    if (state === 'goToTreasure' || state === 'openTreasure') {
      return 'たからへ いくよ';
    }
    return '';
  }

  private spawnSparkles(position: Vec2, count = 82, power = 1): void {
    for (let i = 0; i < count; i += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.18 + 0.08, 0.95, 0.62),
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry((0.045 + Math.random() * 0.06) * power, 8, 8), material);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.8 * power,
        0.8 + Math.random() * 0.6 * power,
        position.z + (Math.random() - 0.5) * 0.8 * power
      );
      this.scene.add(mesh);
      this.sparkles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2.4 * power,
          (1.2 + Math.random() * 3.2) * power,
          (Math.random() - 0.5) * 2.4 * power
        ),
        life: 1.8 + Math.random() * 1.6 * power
      });
    }
  }

  private updateSparkles(dt: number): void {
    for (let i = this.sparkles.length - 1; i >= 0; i -= 1) {
      const sparkle = this.sparkles[i];
      sparkle.life -= dt;
      sparkle.velocity.y -= dt * 2.7;
      sparkle.mesh.position.addScaledVector(sparkle.velocity, dt);
      sparkle.mesh.material.opacity = Math.max(0, Math.min(1, sparkle.life / 1.6));
      if (sparkle.life <= 0) {
        this.scene.remove(sparkle.mesh);
        sparkle.mesh.geometry.dispose();
        sparkle.mesh.material.dispose();
        this.sparkles.splice(i, 1);
      }
    }
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  private isGameKey(code: string): boolean {
    return [
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'Enter',
      'KeyE',
      'KeyQ'
    ].includes(code);
  }
}
