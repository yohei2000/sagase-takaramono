import * as THREE from 'three';
import { distance2 } from './Collision';
import { GameAudio } from './Audio';
import { MiniGames } from './MiniGames';
import { Player } from './Player';
import { getNextStageId, getStage, STAGES } from './Stages';
import { UI } from './UI';
import { World } from './World';
import type { GameMode, HudState, InputState, Interactable, StageDefinition, StageId, StageSelectItem, Vec2 } from './types';

type Sparkle = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  velocity: THREE.Vector3;
  life: number;
};

type StageProgress = {
  highestUnlockedStage: StageId;
  clearedStages: StageId[];
};

const PROGRESS_KEY = 'sagase-takaramono-progress-v1';

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
  private stage: StageDefinition = STAGES[0];
  private progress: StageProgress = this.loadProgress();
  private readonly devMode = this.isDeveloperMode();
  private world!: World;
  private player!: Player;
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
    this.ui.onStageSelect((stageId) => this.beginRun(stageId));
    this.ui.onRetry(() => this.beginRun(this.stage.id));
    this.ui.onNextStage(() => {
      const nextStageId = getNextStageId(this.stage.id);
      if (nextStageId && this.isStageUnlocked(nextStageId)) {
        this.beginRun(nextStageId);
        return;
      }
      this.showStageSelect();
    });
    this.ui.onStageSelectButton(() => this.showStageSelect());
    this.ui.onMobileMoveChange((input) => {
      this.touchInput = input;
    });
    this.ui.onMobileInteract(() => this.tryInteract());
    this.bindInput(canvas);
    this.applyDeveloperUnlockFromUrl();
    this.createScene();
    this.resize();
    this.showStageSelect();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  private beginRun(stageId: StageId = this.stage.id): void {
    if (!this.isStageUnlocked(stageId)) {
      this.ui.showToast('まえの ステージを クリアすると あそべるよ', 3200);
      this.showStageSelect();
      return;
    }

    this.stage = getStage(stageId);
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
    this.ui.updateHud(this.hudState());
    this.ui.showToast(`${this.stage.shortTitle}で たからさがし スタート！`);
  }

  private createScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.stage.skyColor);
    this.scene.fog = new THREE.Fog(this.stage.skyColor, this.stage.fogNear, this.stage.fogFar);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x9ec7c0, 2.6);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(8, 14, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const shadowSpan = Math.max(
      Math.abs(this.stage.bounds.xMin),
      Math.abs(this.stage.bounds.xMax),
      Math.abs(this.stage.bounds.zMin),
      Math.abs(this.stage.bounds.zMax),
      18
    );
    sun.shadow.camera.left = -shadowSpan;
    sun.shadow.camera.right = shadowSpan;
    sun.shadow.camera.top = shadowSpan;
    sun.shadow.camera.bottom = -shadowSpan;
    this.scene.add(sun);

    this.world = new World(this.scene, this.stage);
    this.player = new Player(this.scene, this.world.playerStart);
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
    this.updateCamera();
    this.player.update(dt, this.inputState(), this.screenMovementBasis(), this.world.colliders, this.world.houseBounds);
    this.nearby = this.findNearby();
    this.world.setFocusedInteractable(this.nearby?.id ?? null);
    this.world.setTreasureGlowLevel(this.hints.length);
    this.ui.setPrompt(this.nearby ? 'しらべる' : null);

    if (this.elapsed >= this.nextGuideAt && this.mode === 'playing') {
      this.nextGuideAt += 24;
      this.showGuidanceMessage();
    }

    this.ui.updateHud(this.hudState());
    this.ui.drawMinimap(this.player.position, this.world.houseBounds);
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
    void this.miniGames.play(target.miniGameKind!, repeated, this.stage.difficulty).then((reward) => {
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
    if (this.coins < this.stage.coinGoal) {
      this.ui.showToast(`たからばこを みつけた！でも コインが ${this.stage.coinGoal}まい いるよ`, 4400);
      return;
    }

    target.done = true;
    this.mode = 'won';
    this.markStageCleared(this.stage.id);
    this.world.openTreasure();
    this.spawnSparkles(this.world.treasurePosition, 230, 1.75);
    this.spawnSparkles(this.player.position, 70, 1.05);
    this.ui.showReward(0, 'treasure');
    this.ui.showToast('やった！ たからばこが ひらいたよ！', 2300);
    this.audio.treasure();
    window.setTimeout(() => this.ui.showEnd(this.stage, getNextStageId(this.stage.id)), 1700);
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

      const radius = item.type === 'treasure' ? this.world.treasureSearchRadius(this.hints.length) : item.radius;
      const d2 = distance2(this.player.position, item.position);
      if (d2 <= radius * radius && d2 < bestDistance) {
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

  private screenMovementBasis(): { forward: Vec2; right: Vec2 } {
    this.camera.updateMatrixWorld(true);

    const screenRight3 = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    const screenUp3 = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
    const right = new THREE.Vector2(screenRight3.x, screenRight3.z);
    const forward = new THREE.Vector2(screenUp3.x, screenUp3.z);

    if (right.lengthSq() < 0.0001) {
      right.set(Math.cos(this.cameraYaw), -Math.sin(this.cameraYaw));
    }
    if (forward.lengthSq() < 0.0001) {
      forward.set(Math.sin(this.cameraYaw), Math.cos(this.cameraYaw));
    }

    right.normalize();
    forward.normalize();

    return {
      forward: { x: forward.x, z: forward.y },
      right: { x: right.x, z: right.y }
    };
  }

  private inputState(): InputState {
    return {
      forward: this.touchInput.forward || this.keys.has('KeyW') || this.keys.has('ArrowUp'),
      back: this.touchInput.back || this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      left: this.touchInput.left || this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
      right: this.touchInput.right || this.keys.has('KeyD') || this.keys.has('ArrowRight')
    };
  }

  private hudState(): HudState {
    return {
      coins: this.coins,
      coinGoal: this.stage.coinGoal,
      hints: this.hints,
      hintsTotal: this.stage.hints.length,
      stageTitle: this.stage.title
    };
  }

  private showGuidanceMessage(): void {
    if (this.hints.length < this.stage.treasurePromptHints) {
      this.ui.showToast('まよったら ひかる ヒントカードを さがそう！', 4300);
      return;
    }

    if (this.coins < this.stage.coinGoal) {
      this.ui.showToast(`コインが ${this.stage.coinGoal}まい いるよ。きんいろの ゲームへ いこう！`, 4300);
      return;
    }

    this.ui.showToast(this.stage.treasureClue, 4300);
  }

  private showStageSelect(): void {
    this.mode = 'menu';
    this.keys.clear();
    this.touchInput = { forward: false, back: false, left: false, right: false };
    this.ui.showStageSelect(this.stageSelectItems(), this.devMode ? this.developerUnlockUrl() : null);
  }

  private stageSelectItems(): StageSelectItem[] {
    return STAGES.map((stage) => ({
      id: stage.id,
      title: stage.title,
      subtitle: stage.subtitle,
      description: stage.description,
      unlocked: this.isStageUnlocked(stage.id),
      cleared: this.progress.clearedStages.includes(stage.id)
    }));
  }

  private isStageUnlocked(stageId: StageId): boolean {
    return stageId <= this.progress.highestUnlockedStage;
  }

  private markStageCleared(stageId: StageId): void {
    if (!this.progress.clearedStages.includes(stageId)) {
      this.progress.clearedStages.push(stageId);
    }

    const nextStageId = getNextStageId(stageId);
    if (nextStageId && nextStageId > this.progress.highestUnlockedStage) {
      this.progress.highestUnlockedStage = nextStageId;
    }

    this.saveProgress();
  }

  private applyDeveloperUnlockFromUrl(): void {
    if (!this.devMode) {
      return;
    }

    const url = new URL(window.location.href);
    if (!url.searchParams.has('unlockAllStages')) {
      return;
    }

    this.unlockAllStages();
    url.searchParams.delete('unlockAllStages');
    url.searchParams.set('dev', '1');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    this.ui.showToast('開発者モード: すべてのステージを解放しました', 3200);
  }

  private unlockAllStages(): void {
    this.progress = {
      highestUnlockedStage: STAGES[STAGES.length - 1].id,
      clearedStages: STAGES.map((stage) => stage.id)
    };
    this.saveProgress();
  }

  private developerUnlockUrl(): string {
    const url = new URL(window.location.href);
    url.searchParams.set('dev', '1');
    url.searchParams.set('unlockAllStages', '1');
    return `${url.pathname}${url.search}${url.hash}`;
  }

  private isDeveloperMode(): boolean {
    return import.meta.env.DEV || new URL(window.location.href).searchParams.has('dev');
  }

  private loadProgress(): StageProgress {
    try {
      const raw = window.localStorage.getItem(PROGRESS_KEY);
      if (!raw) {
        return { highestUnlockedStage: 1, clearedStages: [] };
      }
      const parsed = JSON.parse(raw) as Partial<StageProgress>;
      const clearedStages = (parsed.clearedStages ?? [])
        .filter((id): id is StageId => STAGES.some((stage) => stage.id === id));
      const highest = Number(parsed.highestUnlockedStage);
      const highestUnlockedStage = STAGES.some((stage) => stage.id === highest)
        ? (highest as StageId)
        : 1;
      return {
        highestUnlockedStage: Math.max(1, highestUnlockedStage) as StageId,
        clearedStages
      };
    } catch {
      return { highestUnlockedStage: 1, clearedStages: [] };
    }
  }

  private saveProgress(): void {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.progress));
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
