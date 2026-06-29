import type { Bounds, HudState, InputState, StageDefinition, StageId, StageSelectItem, Vec2 } from './types';

export class UI {
  private readonly hud = requireElement<HTMLElement>('hud');
  private readonly startScreen = requireElement<HTMLElement>('start-screen');
  private readonly endScreen = requireElement<HTMLElement>('end-screen');
  private readonly stageSelectGrid = requireElement<HTMLElement>('stage-select-grid');
  private readonly howtoButton = requireElement<HTMLButtonElement>('howto-button');
  private readonly retryButton = requireElement<HTMLButtonElement>('retry-button');
  private readonly nextStageButton = requireElement<HTMLButtonElement>('next-stage-button');
  private readonly stageSelectButton = requireElement<HTMLButtonElement>('stage-select-button');
  private readonly howtoText = requireElement<HTMLElement>('howto-text');
  private readonly stageTitle = requireElement<HTMLElement>('stage-title');
  private readonly coinCount = requireElement<HTMLElement>('coin-count');
  private readonly coinGoal = requireElement<HTMLElement>('coin-goal');
  private readonly cpuCoinCount = requireElement<HTMLElement>('cpu-coin-count');
  private readonly cpuStatus = requireElement<HTMLElement>('cpu-status');
  private readonly hintLeft = requireElement<HTMLElement>('hint-left');
  private readonly hintList = requireElement<HTMLUListElement>('hint-list');
  private readonly prompt = requireElement<HTMLElement>('interact-prompt');
  private readonly mobileControls = requireElement<HTMLElement>('mobile-controls');
  private readonly mobileInteractButton = requireElement<HTMLButtonElement>('mobile-interact-button');
  private readonly toast = requireElement<HTMLElement>('toast');
  private readonly minimap = requireElement<HTMLCanvasElement>('mini-map');
  private readonly endKicker = requireElement<HTMLElement>('end-kicker');
  private readonly endTitle = requireElement<HTMLElement>('end-title');
  private readonly endMessage = requireElement<HTMLElement>('end-message');
  private stageSelectCallback: ((stageId: StageId) => void) | null = null;
  private toastTimer = 0;

  onStageSelect(callback: (stageId: StageId) => void): void {
    this.stageSelectCallback = callback;
  }

  onRetry(callback: () => void): void {
    this.retryButton.addEventListener('click', callback);
  }

  onNextStage(callback: () => void): void {
    this.nextStageButton.addEventListener('click', callback);
  }

  onStageSelectButton(callback: () => void): void {
    this.stageSelectButton.addEventListener('click', callback);
  }

  onMobileMoveChange(callback: (input: InputState) => void): void {
    const input: InputState = { forward: false, back: false, left: false, right: false };
    const activePointers = new Map<number, keyof InputState>();
    const buttons = this.mobileControls.querySelectorAll<HTMLButtonElement>('[data-mobile-move]');

    const emit = () => callback({ ...input });
    const releasePointer = (event: PointerEvent) => {
      const key = activePointers.get(event.pointerId);
      if (!key) {
        return;
      }

      activePointers.delete(event.pointerId);
      input[key] = [...activePointers.values()].includes(key);
      emit();
    };

    for (const button of buttons) {
      const key = button.dataset.mobileMove as keyof InputState | undefined;
      if (!key) {
        continue;
      }

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        activePointers.set(event.pointerId, key);
        input[key] = true;
        emit();
      });
      button.addEventListener('pointerup', releasePointer);
      button.addEventListener('pointercancel', releasePointer);
      button.addEventListener('lostpointercapture', releasePointer);
    }
  }

  onMobileInteract(callback: () => void): void {
    let pointerActivatedAt = 0;
    const activate = () => {
      if (!this.mobileInteractButton.disabled) {
        callback();
      }
    };

    this.mobileInteractButton.addEventListener('pointerup', (event) => {
      if (event.pointerType === 'mouse') {
        return;
      }

      event.preventDefault();
      pointerActivatedAt = performance.now();
      activate();
    });

    this.mobileInteractButton.addEventListener('click', (event) => {
      if (performance.now() - pointerActivatedAt < 500) {
        event.preventDefault();
        return;
      }
      activate();
    });
  }

  bindHowTo(): void {
    this.howtoButton.addEventListener('click', () => {
      this.howtoText.classList.toggle('is-hidden');
    });
  }

  showGame(): void {
    this.startScreen.classList.add('is-hidden');
    this.endScreen.classList.add('is-hidden');
    this.hud.classList.remove('is-hidden');
  }

  showStageSelect(stages: StageSelectItem[]): void {
    this.hud.classList.add('is-hidden');
    this.endScreen.classList.add('is-hidden');
    this.startScreen.classList.remove('is-hidden');
    this.renderStageCards(stages);
  }

  showEnd(kind: 'win' | 'lose', stage: StageDefinition, nextStageId: StageId | null): void {
    this.hud.classList.add('is-hidden');
    this.endScreen.classList.remove('is-hidden');
    if (kind === 'win') {
      this.endKicker.textContent = 'クリア！';
      this.endTitle.textContent = `${stage.shortTitle}を クリア！`;
      this.endMessage.textContent = nextStageId
        ? `ステージ${nextStageId}が あそべるように なったよ。`
        : 'ぜんぶの たからものを みつけたね。';
      this.nextStageButton.classList.toggle('is-hidden', nextStageId === null);
    } else {
      this.endKicker.textContent = 'もういちど ちょうせん！';
      this.endTitle.textContent = 'CPUが さきに あけたよ';
      this.endMessage.textContent = 'つぎは ヒントと コインを もっと はやく あつめよう。';
      this.nextStageButton.classList.add('is-hidden');
    }
  }

  private renderStageCards(stages: StageSelectItem[]): void {
    this.stageSelectGrid.innerHTML = '';
    for (const stage of stages) {
      const button = document.createElement('button');
      button.className = 'stage-card';
      button.classList.toggle('is-locked', !stage.unlocked);
      button.disabled = !stage.unlocked;
      button.innerHTML = `
        <span class="stage-card-status">${stage.cleared ? 'クリア' : stage.unlocked ? 'あそべる' : 'ロック'}</span>
        <strong>${stage.title}</strong>
        <span>${stage.subtitle}</span>
        <small>${stage.unlocked ? stage.description : 'まえの ステージを クリアしよう'}</small>
      `;
      button.addEventListener('click', () => {
        if (stage.unlocked) {
          this.stageSelectCallback?.(stage.id);
        }
      });
      this.stageSelectGrid.append(button);
    }
  }

  updateHud(state: HudState): void {
    this.stageTitle.textContent = state.stageTitle;
    this.coinCount.textContent = state.coins.toString().padStart(2, '0');
    this.coinGoal.textContent = state.coinGoal.toString();
    this.cpuCoinCount.textContent = state.cpuCoins.toString().padStart(2, '0');
    this.hintLeft.textContent = Math.max(0, state.hintsTotal - state.hints.length).toString();
    this.hintList.innerHTML = '';
    for (const hint of state.hints) {
      const item = document.createElement('li');
      item.textContent = hint;
      this.hintList.append(item);
    }
  }

  setCpuStatus(label: string): void {
    this.cpuStatus.textContent = label;
  }

  setPrompt(label: string | null): void {
    if (!label) {
      this.prompt.classList.add('is-hidden');
      this.mobileInteractButton.disabled = true;
      this.mobileInteractButton.textContent = 'しらべる';
      return;
    }
    this.prompt.textContent = `Eで ${label}`;
    this.prompt.classList.remove('is-hidden');
    this.mobileInteractButton.disabled = false;
    this.mobileInteractButton.textContent = label;
  }

  showToast(message: string, timeout = 3200): void {
    this.toast.textContent = message;
    this.toast.classList.remove('is-hidden');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.add('is-hidden');
    }, timeout);
  }

  showReward(amount: number, variant: 'player' | 'cpu' | 'treasure' = 'player'): void {
    const popup = document.createElement('div');
    popup.className = `reward-popup reward-popup-${variant}`;
    popup.textContent = variant === 'treasure' ? 'やった！' : `+${amount}`;
    document.getElementById('app')?.append(popup);
    window.setTimeout(() => popup.remove(), 1300);
  }

  drawMinimap(player: Vec2, cpu: Vec2, bounds: Bounds): void {
    const context = this.minimap.getContext('2d');
    if (!context) {
      return;
    }

    const width = this.minimap.width;
    const height = this.minimap.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fffaf0';
    context.fillRect(0, 0, width, height);

    const mapX = (x: number) => ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * (width - 18) + 9;
    const mapZ = (z: number) => ((z - bounds.zMin) / (bounds.zMax - bounds.zMin)) * (height - 18) + 9;

    context.strokeStyle = '#43616a';
    context.lineWidth = 3;
    context.strokeRect(9, 9, width - 18, height - 18);

    context.strokeStyle = 'rgba(67, 97, 106, 0.28)';
    context.lineWidth = 1.5;
    context.beginPath();
    for (let i = 1; i <= 3; i += 1) {
      const x = 9 + ((width - 18) / 4) * i;
      const y = 9 + ((height - 18) / 4) * i;
      context.moveTo(x, 9);
      context.lineTo(x, height - 9);
      context.moveTo(9, y);
      context.lineTo(width - 9, y);
    }
    context.stroke();

    drawDot(context, mapX(cpu.x), mapZ(cpu.z), '#4aa8ff', 'C');
    drawDot(context, mapX(player.x), mapZ(player.z), '#ff7b53', 'P');
  }
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

function drawDot(context: CanvasRenderingContext2D, x: number, y: number, color: string, label: string): void {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, 8, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#173642';
  context.font = '900 10px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, x, y + 0.5);
}
