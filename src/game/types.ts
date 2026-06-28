import type * as THREE from 'three';

export type Vec2 = {
  x: number;
  z: number;
};

export type Bounds = {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  label?: string;
};

export type MiniGameKind = 'match' | 'timing' | 'count' | 'order' | 'color' | 'memory' | 'find' | 'addition';

export type InteractableType = 'hint' | 'minigame' | 'treasure';

export type Interactable = {
  id: string;
  type: InteractableType;
  position: Vec2;
  radius: number;
  label: string;
  done: boolean;
  plays: number;
  hintText?: string;
  miniGameKind?: MiniGameKind;
  object?: THREE.Object3D;
};

export type InputState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
};

export type HudState = {
  coins: number;
  cpuCoins: number;
  hints: string[];
  hintsTotal: number;
};

export type GameMode = 'menu' | 'playing' | 'miniGame' | 'won' | 'lost';

export type CPUState = 'wander' | 'goToHint' | 'playMiniGame' | 'goToTreasure' | 'openTreasure';
