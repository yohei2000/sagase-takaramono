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

export type MiniGameKind =
  | 'match'
  | 'timing'
  | 'count'
  | 'order'
  | 'color'
  | 'memory'
  | 'find'
  | 'addition'
  | 'difference'
  | 'shape'
  | 'sequence'
  | 'sound'
  | 'kana';

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
  coinGoal: number;
  cpuCoins: number;
  hints: string[];
  hintsTotal: number;
  stageTitle: string;
};

export type GameMode = 'menu' | 'playing' | 'miniGame' | 'won' | 'lost';

export type CPUState = 'wander' | 'goToHint' | 'playMiniGame' | 'goToTreasure' | 'openTreasure';

export type StageId = 1 | 2 | 3 | 4 | 5;

export type StageArea = {
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  color: number;
};

export type StageWall = {
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height?: number;
  color?: number;
};

export type StageProp = {
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: number;
  texture?: string;
  collider?: boolean;
  y?: number;
};

export type StageLabel = {
  text: string;
  x: number;
  z: number;
  background: string;
};

export type StageHint = {
  id: string;
  position: Vec2;
  text: string;
};

export type StageMiniSpot = {
  id: string;
  position: Vec2;
  kind: MiniGameKind;
  label: string;
};

export type StageDefinition = {
  id: StageId;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  difficulty: number;
  coinGoal: number;
  bounds: Bounds;
  playerStart: Vec2;
  cpuStart: Vec2;
  treasurePosition: Vec2;
  treasureRevealHints: number;
  treasurePromptHints: number;
  treasureClue: string;
  floorColor: number;
  wallColor: number;
  skyColor: number;
  fogNear: number;
  fogFar: number;
  boundaryHeight: number;
  cpu: {
    treasureDelay: number;
    treasureHints: number;
    speed: number;
  };
  hints: StageHint[];
  miniSpots: StageMiniSpot[];
  areas?: StageArea[];
  walls?: StageWall[];
  props?: StageProp[];
  labels?: StageLabel[];
  plants?: Vec2[];
};

export type StageSelectItem = {
  id: StageId;
  title: string;
  subtitle: string;
  description: string;
  unlocked: boolean;
  cleared: boolean;
};
