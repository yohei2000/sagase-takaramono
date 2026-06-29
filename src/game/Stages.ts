import type { StageDefinition, StageId } from './types';

export const STAGES: StageDefinition[] = [
  {
    id: 1,
    title: 'ステージ1 おうち',
    shortTitle: 'おうち',
    subtitle: 'いつもの いえ',
    description: 'へやを まわって ヒントを あつめよう',
    difficulty: 1,
    coinGoal: 60,
    bounds: { xMin: -16.65, xMax: 16.65, zMin: -12.65, zMax: 12.65 },
    playerStart: { x: -10.2, z: 7.2 },
    cpuStart: { x: 8.8, z: -7.2 },
    treasurePosition: { x: -12.1, z: -5.1 },
    treasureRevealHints: 3,
    treasurePromptHints: 2,
    treasureClue: 'あかい ほんだなの うしろを しらべてみよう！',
    floorColor: 0xf4cf8a,
    wallColor: 0xfff0c6,
    skyColor: 0xb9edff,
    fogNear: 26,
    fogFar: 58,
    boundaryHeight: 2.45,
    cpu: { treasureDelay: 100, treasureHints: 4, speed: 2.05 },
    hints: [
      { id: 'hint-genkan', position: { x: -9.5, z: 6.8 }, text: 'たからは こどもべやの ちかく' },
      { id: 'hint-living', position: { x: -0.6, z: 4.1 }, text: 'ほんが たくさん あるところ' },
      { id: 'hint-kitchen', position: { x: 11.2, z: 4.7 }, text: 'うしろを しらべてみよう' },
      { id: 'hint-desk', position: { x: -3.5, z: -6.45 }, text: 'あかい ほんだなの そば' },
      { id: 'hint-bed', position: { x: 8.85, z: -8.45 }, text: 'かべの ちかくに かくれているよ' },
      { id: 'hint-bookshelf', position: { x: -10.45, z: -3.1 }, text: 'ちいさな はこの かたちが みえるかも' }
    ],
    miniSpots: [
      { id: 'mini-living', position: { x: 1.85, z: 6.3 }, kind: 'match', label: 'おなじ え' },
      { id: 'mini-kitchen', position: { x: 9.15, z: 4.45 }, kind: 'timing', label: 'きらきら' },
      { id: 'mini-genkan', position: { x: -10.7, z: 8.55 }, kind: 'count', label: 'かず' },
      { id: 'mini-bedroom', position: { x: 4.65, z: -8.45 }, kind: 'match', label: 'おなじ え' },
      { id: 'mini-desk', position: { x: -6.25, z: -8.55 }, kind: 'timing', label: 'きらきら' },
      { id: 'mini-order-playroom', position: { x: -13.95, z: -3.15 }, kind: 'order', label: 'じゅんばん' },
      { id: 'mini-color-bath', position: { x: 13.55, z: 6.8 }, kind: 'color', label: 'いろ' },
      { id: 'mini-memory-storage', position: { x: 0.2, z: -10.95 }, kind: 'memory', label: 'おぼえる' },
      { id: 'mini-find-bedroom', position: { x: 12.9, z: -9.45 }, kind: 'find', label: 'さがす' },
      { id: 'mini-addition-entry', position: { x: -14.3, z: 8.35 }, kind: 'addition', label: 'たしざん' }
    ]
  },
  {
    id: 2,
    title: 'ステージ2 がっこう',
    shortTitle: 'がっこう',
    subtitle: 'きょうしつと こうてい',
    description: 'つくえや ほんだな、げたばこを よくみよう',
    difficulty: 2,
    coinGoal: 65,
    bounds: { xMin: -19.8, xMax: 19.8, zMin: -14.8, zMax: 14.8 },
    playerStart: { x: -15.4, z: 10.7 },
    cpuStart: { x: 13.4, z: -9.7 },
    treasurePosition: { x: 10.8, z: 9.8 },
    treasureRevealHints: 4,
    treasurePromptHints: 3,
    treasureClue: 'ずこうだなの したを そっと しらべてみよう！',
    floorColor: 0xf2d68b,
    wallColor: 0xeaf6ff,
    skyColor: 0xb8edff,
    fogNear: 30,
    fogFar: 70,
    boundaryHeight: 1.85,
    cpu: { treasureDelay: 116, treasureHints: 4, speed: 2.12 },
    areas: [
      { label: 'きょうしつ', x: -9.8, z: 7.1, width: 14, depth: 11, color: 0xfff0c6 },
      { label: 'ろうか', x: 3.4, z: 7.1, width: 9.8, depth: 11, color: 0xe8f8e1 },
      { label: 'げたばこ', x: 14.3, z: 8.6, width: 8.2, depth: 8, color: 0xffefd2 },
      { label: 'としょコーナー', x: -11.6, z: -6.8, width: 11, depth: 11, color: 0xe3f2ff },
      { label: 'ほけんしつまえ', x: 0.2, z: -6.8, width: 11, depth: 11, color: 0xffe5ec },
      { label: 'こうてい', x: 12.8, z: -6.7, width: 12.5, depth: 11, color: 0xdaf5b8 }
    ],
    walls: [
      { label: 'きょうしつのかべ', x: -2.4, z: 7.1, width: 0.28, depth: 10.5 },
      { label: 'ろうかのかべ', x: 8.4, z: 7.1, width: 0.28, depth: 9.3 },
      { label: 'したのかべ', x: -5.9, z: 0.9, width: 26, depth: 0.28 },
      { label: 'こうていフェンス', x: 6.6, z: -0.7, width: 0.28, depth: 12.5, height: 1.2, color: 0xb5d6b8 }
    ],
    props: [
      { label: 'こくばん', x: -9.8, z: 12.1, width: 5.4, depth: 0.24, height: 1.55, color: 0x285d48 },
      { label: 'せんせいのつくえ', x: -15.0, z: 10.7, width: 2.4, depth: 1.1, height: 0.78, color: 0xc89458, texture: 'floor_wood' },
      { label: 'つくえ1', x: -12.7, z: 6.2, width: 1.4, depth: 1.1, height: 0.66, color: 0xd8a35c },
      { label: 'つくえ2', x: -9.4, z: 6.2, width: 1.4, depth: 1.1, height: 0.66, color: 0xd8a35c },
      { label: 'つくえ3', x: -6.1, z: 6.2, width: 1.4, depth: 1.1, height: 0.66, color: 0xd8a35c },
      { label: 'ランドセルだな', x: -17.4, z: 4.0, width: 1.1, depth: 3.8, height: 1.25, color: 0xd85a51, texture: 'bookshelf_front' },
      { label: 'げたばこ', x: 15.5, z: 10.8, width: 4.3, depth: 1.0, height: 1.35, color: 0xc89458, texture: 'floor_wood' },
      { label: 'としょだなA', x: -15.2, z: -8.8, width: 1.0, depth: 4.8, height: 1.85, color: 0xd85a51, texture: 'bookshelf_front' },
      { label: 'としょだなB', x: -8.3, z: -9.4, width: 4.5, depth: 0.9, height: 1.85, color: 0xd85a51, texture: 'bookshelf_front' },
      { label: 'ほけんしつベンチ', x: 0.5, z: -6.2, width: 3.4, depth: 0.8, height: 0.55, color: 0x9bd6ff },
      { label: 'サッカーゴール', x: 14.7, z: -10.2, width: 3.6, depth: 0.35, height: 1.8, color: 0xffffff },
      { label: 'ずこうだな', x: 10.8, z: 9.8, width: 1.6, depth: 1.0, height: 1.15, color: 0xffcf4d, collider: true }
    ],
    labels: [
      { text: 'きょうしつ', x: -10, z: 12.6, background: '#fff0c6' },
      { text: 'ろうか', x: 2.6, z: 12.6, background: '#e8f8e1' },
      { text: 'げたばこ', x: 14.3, z: 12.5, background: '#ffefd2' },
      { text: 'としょ', x: -12.1, z: -1.6, background: '#e3f2ff' },
      { text: 'こうてい', x: 12.7, z: -1.6, background: '#daf5b8' }
    ],
    plants: [{ x: 17.2, z: -4.4 }, { x: 9.5, z: -12.1 }, { x: -18.0, z: -1.5 }],
    hints: [
      { id: 's2-hint-classroom', position: { x: -13.7, z: 7.5 }, text: 'たからは がっこうの みぎがわ' },
      { id: 's2-hint-blackboard', position: { x: -7.4, z: 11.2 }, text: 'こうていでは ないよ' },
      { id: 's2-hint-library', position: { x: -11.2, z: -5.1 }, text: 'つくったものを おくところ' },
      { id: 's2-hint-hall', position: { x: 3.3, z: 4.6 }, text: 'げたばこの ちかく' },
      { id: 's2-hint-yard', position: { x: 14.8, z: -5.7 }, text: 'きいろい たなの した' },
      { id: 's2-hint-nurse', position: { x: 0.2, z: -9.4 }, text: 'ずこうだなを しらべよう' }
    ],
    miniSpots: [
      { id: 's2-mini-match', position: { x: -11.0, z: 4.3 }, kind: 'match', label: 'おなじ え' },
      { id: 's2-mini-order', position: { x: -6.1, z: 8.6 }, kind: 'order', label: 'じゅんばん' },
      { id: 's2-mini-shape', position: { x: -15.9, z: 2.8 }, kind: 'shape', label: 'かたち' },
      { id: 's2-mini-color', position: { x: 2.1, z: 9.0 }, kind: 'color', label: 'いろ' },
      { id: 's2-mini-kana', position: { x: -12.8, z: -10.1 }, kind: 'kana', label: 'ひらがな' },
      { id: 's2-mini-count', position: { x: 1.2, z: -3.3 }, kind: 'count', label: 'かず' },
      { id: 's2-mini-timing', position: { x: 12.9, z: -7.8 }, kind: 'timing', label: 'きらきら' },
      { id: 's2-mini-difference', position: { x: 16.1, z: 6.6 }, kind: 'difference', label: 'ちがい' },
      { id: 's2-mini-addition', position: { x: 5.1, z: -9.7 }, kind: 'addition', label: 'たしざん' },
      { id: 's2-mini-sound', position: { x: 10.4, z: 2.9 }, kind: 'sound', label: 'おと' }
    ]
  },
  {
    id: 3,
    title: 'ステージ3 こうえん',
    shortTitle: 'こうえん',
    subtitle: 'ゆうぐと ひろば',
    description: 'にた かたちの ゆうぐの あいだを さがそう',
    difficulty: 3,
    coinGoal: 75,
    bounds: { xMin: -22, xMax: 22, zMin: -16, zMax: 16 },
    playerStart: { x: -16.8, z: 11.0 },
    cpuStart: { x: 16.5, z: -10.3 },
    treasurePosition: { x: -14.6, z: -9.6 },
    treasureRevealHints: 4,
    treasurePromptHints: 3,
    treasureClue: 'すなばの ちかくの ベンチしたを みてみよう！',
    floorColor: 0xbde7a8,
    wallColor: 0xb5d6b8,
    skyColor: 0xb6eeff,
    fogNear: 34,
    fogFar: 78,
    boundaryHeight: 1.1,
    cpu: { treasureDelay: 132, treasureHints: 5, speed: 2.18 },
    areas: [
      { label: 'すべりだい', x: -12.8, z: 7.6, width: 10, depth: 9, color: 0xffedd2 },
      { label: 'ブランコ', x: 0.0, z: 8.0, width: 11, depth: 9, color: 0xe7f4ff },
      { label: 'みずのみば', x: 13.3, z: 8.0, width: 10, depth: 9, color: 0xd9f8ff },
      { label: 'すなば', x: -12.4, z: -6.6, width: 11, depth: 11, color: 0xf6d789 },
      { label: 'ひろば', x: 1.2, z: -6.8, width: 13, depth: 11, color: 0xdff1b5 },
      { label: 'はなだん', x: 14.2, z: -6.8, width: 10, depth: 11, color: 0xffe0ec }
    ],
    walls: [
      { label: 'すなばふち', x: -12.4, z: -1.2, width: 10.8, depth: 0.24, height: 0.45, color: 0xc89458 },
      { label: 'ひろばさかい', x: -5.8, z: -6.8, width: 0.24, depth: 10.8, height: 0.45, color: 0xc89458 },
      { label: 'はなだんさく', x: 9.4, z: -6.8, width: 0.24, depth: 10.6, height: 0.65, color: 0xffffff }
    ],
    props: [
      { label: 'すべりだいだい', x: -14.4, z: 7.9, width: 3.2, depth: 2.0, height: 1.45, color: 0x4aa8ff },
      { label: 'すべるところ', x: -11.0, z: 6.9, width: 3.8, depth: 1.0, height: 0.45, color: 0xffcf4d },
      { label: 'ブランコのわく', x: 0.0, z: 8.5, width: 4.8, depth: 0.35, height: 2.0, color: 0x73c8f3 },
      { label: 'ブランコいすA', x: -1.2, z: 7.0, width: 1.1, depth: 0.55, height: 0.35, color: 0xffcf4d },
      { label: 'ブランコいすB', x: 1.2, z: 7.0, width: 1.1, depth: 0.55, height: 0.35, color: 0xffcf4d },
      { label: 'みずのみば', x: 13.5, z: 9.0, width: 1.2, depth: 0.9, height: 0.9, color: 0x9bd6ff },
      { label: 'ベンチA', x: -16.1, z: -10.3, width: 3.5, depth: 0.8, height: 0.6, color: 0xc89458, texture: 'floor_wood' },
      { label: 'ベンチB', x: 3.0, z: -11.0, width: 3.5, depth: 0.8, height: 0.6, color: 0xc89458, texture: 'floor_wood' },
      { label: 'とけいだい', x: 18.1, z: 1.0, width: 1.2, depth: 1.2, height: 2.6, color: 0xffffff },
      { label: 'はなだんA', x: 13.0, z: -8.8, width: 3.4, depth: 1.3, height: 0.5, color: 0xff9a9e },
      { label: 'はなだんB', x: 17.0, z: -5.0, width: 3.0, depth: 1.3, height: 0.5, color: 0xffe17d },
      { label: 'かくれたベンチした', x: -14.6, z: -9.6, width: 1.5, depth: 0.65, height: 0.35, color: 0x9a6b3b }
    ],
    labels: [
      { text: 'すべりだい', x: -12.8, z: 12.4, background: '#ffedd2' },
      { text: 'ブランコ', x: 0, z: 12.4, background: '#e7f4ff' },
      { text: 'すなば', x: -12.4, z: -1.1, background: '#f6d789' },
      { text: 'ひろば', x: 1.2, z: -1.1, background: '#dff1b5' },
      { text: 'はなだん', x: 14.2, z: -1.1, background: '#ffe0ec' }
    ],
    plants: [{ x: -19.2, z: 1.0 }, { x: 19.0, z: -12.1 }, { x: 8.4, z: 13.0 }, { x: -3.8, z: -14.1 }],
    hints: [
      { id: 's3-hint-slide', position: { x: -13.0, z: 5.0 }, text: 'たからは すべりだいの したでは ないよ' },
      { id: 's3-hint-swing', position: { x: 0.4, z: 10.7 }, text: 'すなばの ほうに あるよ' },
      { id: 's3-hint-fountain', position: { x: 15.0, z: 7.2 }, text: 'ベンチの ちかくを さがそう' },
      { id: 's3-hint-sand', position: { x: -10.4, z: -5.1 }, text: 'みぎではなく ひだりの ベンチ' },
      { id: 's3-hint-plaza', position: { x: 2.4, z: -6.7 }, text: 'じめんに ちいさく かくれているよ' },
      { id: 's3-hint-clock', position: { x: 18.2, z: 2.9 }, text: 'ベンチしたを しらべよう' },
      { id: 's3-hint-flower', position: { x: 15.8, z: -9.9 }, text: 'すなばの となりだよ' }
    ],
    miniSpots: [
      { id: 's3-mini-find', position: { x: -16.1, z: 8.8 }, kind: 'find', label: 'さがす' },
      { id: 's3-mini-shape', position: { x: -9.2, z: 9.2 }, kind: 'shape', label: 'かたち' },
      { id: 's3-mini-timing', position: { x: -0.8, z: 5.3 }, kind: 'timing', label: 'きらきら' },
      { id: 's3-mini-difference', position: { x: 5.4, z: 8.8 }, kind: 'difference', label: 'ちがい' },
      { id: 's3-mini-sound', position: { x: 13.0, z: 5.2 }, kind: 'sound', label: 'おと' },
      { id: 's3-mini-count', position: { x: -16.4, z: -4.7 }, kind: 'count', label: 'かず' },
      { id: 's3-mini-memory', position: { x: -7.2, z: -9.4 }, kind: 'memory', label: 'おぼえる' },
      { id: 's3-mini-sequence', position: { x: 1.8, z: -3.6 }, kind: 'sequence', label: 'つぎ' },
      { id: 's3-mini-color', position: { x: 12.0, z: -4.7 }, kind: 'color', label: 'いろ' },
      { id: 's3-mini-kana', position: { x: 17.2, z: -8.6 }, kind: 'kana', label: 'ひらがな' },
      { id: 's3-mini-addition', position: { x: 5.6, z: -11.8 }, kind: 'addition', label: 'たしざん' }
    ]
  },
  {
    id: 4,
    title: 'ステージ4 としょかん',
    shortTitle: 'としょかん',
    subtitle: 'ほんと じどうかん',
    description: 'ほんだなや つくえで すこし みとおしが むずかしいよ',
    difficulty: 4,
    coinGoal: 85,
    bounds: { xMin: -23, xMax: 23, zMin: -17, zMax: 17 },
    playerStart: { x: -17.8, z: 12.4 },
    cpuStart: { x: 17.2, z: -12.0 },
    treasurePosition: { x: 14.9, z: -11.4 },
    treasureRevealHints: 5,
    treasurePromptHints: 4,
    treasureClue: 'こうさくづくえの よこ、ちいさな はこの うら！',
    floorColor: 0xf1d9a1,
    wallColor: 0xf5efe1,
    skyColor: 0xc6efff,
    fogNear: 34,
    fogFar: 82,
    boundaryHeight: 2.15,
    cpu: { treasureDelay: 150, treasureHints: 5, speed: 2.24 },
    areas: [
      { label: 'うけつけ', x: -14.0, z: 10.7, width: 12, depth: 9, color: 0xffefd2 },
      { label: 'ほんだなA', x: 0, z: 10.7, width: 14, depth: 9, color: 0xe3f2ff },
      { label: 'ほんだなB', x: 14.3, z: 10.7, width: 11, depth: 9, color: 0xe6f7e6 },
      { label: 'よむところ', x: -13.4, z: -4.4, width: 13, depth: 13, color: 0xfff3d9 },
      { label: 'おはなし', x: 0.6, z: -4.4, width: 13, depth: 13, color: 0xffe5ec },
      { label: 'こうさく', x: 14.2, z: -4.4, width: 12, depth: 13, color: 0xe8f8e1 }
    ],
    walls: [
      { label: 'うけつけかべ', x: -7.5, z: 10.7, width: 0.28, depth: 8.5 },
      { label: 'ほんだなさかい', x: 7.2, z: 10.7, width: 0.28, depth: 8.5 },
      { label: 'まんなかかべ', x: 0, z: 3.4, width: 43, depth: 0.28 },
      { label: 'したのさかいA', x: -6.8, z: -4.4, width: 0.28, depth: 11.4 },
      { label: 'したのさかいB', x: 7.4, z: -4.4, width: 0.28, depth: 11.4 }
    ],
    props: [
      { label: 'うけつけカウンター', x: -15.4, z: 11.7, width: 5.8, depth: 1.0, height: 0.9, color: 0xc89458, texture: 'floor_wood' },
      { label: 'カードボックス', x: -18.0, z: 7.3, width: 1.6, depth: 1.1, height: 0.9, color: 0xffcf4d },
      { label: 'ほんだな1', x: -2.8, z: 12.2, width: 1.0, depth: 4.7, height: 2.1, color: 0xd85a51, texture: 'bookshelf_front' },
      { label: 'ほんだな2', x: 2.8, z: 9.1, width: 1.0, depth: 4.7, height: 2.1, color: 0xd85a51, texture: 'bookshelf_front' },
      { label: 'ほんだな3', x: 12.1, z: 12.2, width: 1.0, depth: 4.7, height: 2.1, color: 0xd85a51, texture: 'bookshelf_front' },
      { label: 'ほんだな4', x: 17.6, z: 9.1, width: 1.0, depth: 4.7, height: 2.1, color: 0xd85a51, texture: 'bookshelf_front' },
      { label: 'よむテーブルA', x: -14.8, z: -4.8, width: 3.8, depth: 1.8, height: 0.62, color: 0xc89458, texture: 'floor_wood' },
      { label: 'よむテーブルB', x: -8.2, z: -9.6, width: 3.5, depth: 1.6, height: 0.62, color: 0xc89458, texture: 'floor_wood' },
      { label: 'おはなしマット', x: -0.2, z: -4.3, width: 4.2, depth: 3.1, height: 0.1, color: 0xffb45c, texture: 'rug_playful', collider: false },
      { label: 'けいじばん', x: 3.3, z: -11.2, width: 3.4, depth: 0.35, height: 1.7, color: 0x9bd6ff },
      { label: 'こうさくづくえ', x: 14.2, z: -8.6, width: 4.1, depth: 2.0, height: 0.72, color: 0xc89458, texture: 'floor_wood' },
      { label: 'どうぐばこ', x: 14.9, z: -11.4, width: 1.45, depth: 1.0, height: 0.8, color: 0xffcf4d }
    ],
    labels: [
      { text: 'うけつけ', x: -14.0, z: 15.0, background: '#ffefd2' },
      { text: 'ほんだな', x: 0, z: 15.0, background: '#e3f2ff' },
      { text: 'よむところ', x: -13.4, z: 2.0, background: '#fff3d9' },
      { text: 'おはなし', x: 0.6, z: 2.0, background: '#ffe5ec' },
      { text: 'こうさく', x: 14.2, z: 2.0, background: '#e8f8e1' }
    ],
    plants: [{ x: -20.4, z: 14.0 }, { x: 20.2, z: 14.2 }, { x: -20.0, z: -13.5 }],
    hints: [
      { id: 's4-hint-front', position: { x: -16.8, z: 8.2 }, text: 'たからは ほんだなの なかでは ないよ' },
      { id: 's4-hint-books-a', position: { x: 0.3, z: 13.0 }, text: 'しずかな へやの したのほう' },
      { id: 's4-hint-books-b', position: { x: 15.2, z: 8.2 }, text: 'つくったものの ちかく' },
      { id: 's4-hint-read', position: { x: -12.3, z: -2.2 }, text: 'きいろい はこが めじるし' },
      { id: 's4-hint-story', position: { x: 0.4, z: -7.8 }, text: 'こうさくづくえの よこ' },
      { id: 's4-hint-board', position: { x: 4.0, z: -12.4 }, text: 'どうぐばこの うらを みよう' },
      { id: 's4-hint-craft', position: { x: 17.8, z: -6.8 }, text: 'おくの みぎしたに あるよ' }
    ],
    miniSpots: [
      { id: 's4-mini-kana', position: { x: -19.0, z: 10.6 }, kind: 'kana', label: 'ひらがな' },
      { id: 's4-mini-memory', position: { x: -2.8, z: 8.0 }, kind: 'memory', label: 'おぼえる' },
      { id: 's4-mini-sequence', position: { x: 4.5, z: 12.8 }, kind: 'sequence', label: 'つぎ' },
      { id: 's4-mini-difference', position: { x: 11.7, z: 8.2 }, kind: 'difference', label: 'ちがい' },
      { id: 's4-mini-shape', position: { x: 19.0, z: 12.2 }, kind: 'shape', label: 'かたち' },
      { id: 's4-mini-addition', position: { x: -17.3, z: -8.5 }, kind: 'addition', label: 'たしざん' },
      { id: 's4-mini-find', position: { x: -8.4, z: -5.8 }, kind: 'find', label: 'さがす' },
      { id: 's4-mini-order', position: { x: -1.8, z: -10.5 }, kind: 'order', label: 'じゅんばん' },
      { id: 's4-mini-sound', position: { x: 5.1, z: -3.2 }, kind: 'sound', label: 'おと' },
      { id: 's4-mini-color', position: { x: 11.6, z: -4.7 }, kind: 'color', label: 'いろ' },
      { id: 's4-mini-timing', position: { x: 18.4, z: -10.5 }, kind: 'timing', label: 'きらきら' }
    ]
  },
  {
    id: 5,
    title: 'ステージ5 おみせどおり',
    shortTitle: 'おみせどおり',
    subtitle: 'まちの みぢかな ばしょ',
    description: 'おみせの まえを ぐるっと たんけんしよう',
    difficulty: 5,
    coinGoal: 95,
    bounds: { xMin: -25, xMax: 25, zMin: -18, zMax: 18 },
    playerStart: { x: -19.5, z: 13.0 },
    cpuStart: { x: 19.3, z: -12.4 },
    treasurePosition: { x: 17.3, z: 11.2 },
    treasureRevealHints: 5,
    treasurePromptHints: 4,
    treasureClue: 'パンやさんの となり、けいじばんの うしろ！',
    floorColor: 0xd7e4e7,
    wallColor: 0xe7f2f5,
    skyColor: 0xc0f0ff,
    fogNear: 38,
    fogFar: 92,
    boundaryHeight: 1.8,
    cpu: { treasureDelay: 172, treasureHints: 6, speed: 2.3 },
    areas: [
      { label: 'スーパーまえ', x: -16.0, z: 9.8, width: 14, depth: 10, color: 0xe5f5ff },
      { label: 'パンや', x: -1.0, z: 9.8, width: 12, depth: 10, color: 0xffefd2 },
      { label: 'けいじばん', x: 13.4, z: 9.8, width: 13, depth: 10, color: 0xe8f8e1 },
      { label: 'ベンチひろば', x: -16.0, z: -6.0, width: 14, depth: 13, color: 0xdff1b5 },
      { label: 'じはんき', x: -1.0, z: -6.0, width: 12, depth: 13, color: 0xd9f8ff },
      { label: 'バスてい', x: 13.4, z: -6.0, width: 13, depth: 13, color: 0xffe5ec }
    ],
    walls: [
      { label: 'まちなみさかい上', x: -1.2, z: 3.0, width: 46, depth: 0.28 },
      { label: 'おみせさかいA', x: -8.6, z: 9.8, width: 0.28, depth: 9.4 },
      { label: 'おみせさかいB', x: 5.7, z: 9.8, width: 0.28, depth: 9.4 },
      { label: 'ひろばさかいA', x: -8.6, z: -6.0, width: 0.28, depth: 12.4, height: 0.7, color: 0xb5d6b8 },
      { label: 'ひろばさかいB', x: 5.7, z: -6.0, width: 0.28, depth: 12.4, height: 0.7, color: 0xb5d6b8 }
    ],
    props: [
      { label: 'スーパーかんばん', x: -16.2, z: 13.5, width: 5.5, depth: 0.3, height: 1.5, color: 0x4aa8ff },
      { label: 'カートおきば', x: -20.6, z: 7.3, width: 2.3, depth: 1.4, height: 0.7, color: 0x9bd6ff },
      { label: 'パンやカウンター', x: -1.2, z: 12.1, width: 5.2, depth: 1.0, height: 0.85, color: 0xc89458, texture: 'floor_wood' },
      { label: 'パンのたな', x: -4.5, z: 7.0, width: 1.0, depth: 3.5, height: 1.35, color: 0xffcf4d },
      { label: 'けいじばん', x: 17.3, z: 11.2, width: 3.2, depth: 0.55, height: 1.9, color: 0x9bd6ff },
      { label: 'はなやだい', x: 10.4, z: 8.0, width: 3.6, depth: 1.4, height: 0.75, color: 0xff9a9e },
      { label: 'ベンチA', x: -19.0, z: -4.6, width: 3.4, depth: 0.8, height: 0.6, color: 0xc89458, texture: 'floor_wood' },
      { label: 'ベンチB', x: -13.0, z: -9.6, width: 3.4, depth: 0.8, height: 0.6, color: 0xc89458, texture: 'floor_wood' },
      { label: 'あおじはんき', x: -3.9, z: -4.8, width: 1.5, depth: 1.0, height: 2.0, color: 0x4aa8ff },
      { label: 'あかじはんき', x: 1.4, z: -8.7, width: 1.5, depth: 1.0, height: 2.0, color: 0xff6b6b },
      { label: 'バスていひょうしき', x: 13.2, z: -3.5, width: 1.0, depth: 1.0, height: 2.2, color: 0xffcf4d },
      { label: 'まちのベンチ', x: 18.8, z: -9.8, width: 3.6, depth: 0.8, height: 0.6, color: 0xc89458, texture: 'floor_wood' }
    ],
    labels: [
      { text: 'スーパー', x: -16, z: 15.0, background: '#e5f5ff' },
      { text: 'パンや', x: -1, z: 15.0, background: '#ffefd2' },
      { text: 'けいじばん', x: 13.4, z: 15.0, background: '#e8f8e1' },
      { text: 'ベンチ', x: -16, z: 1.4, background: '#dff1b5' },
      { text: 'じはんき', x: -1, z: 1.4, background: '#d9f8ff' },
      { text: 'バスてい', x: 13.4, z: 1.4, background: '#ffe5ec' }
    ],
    plants: [{ x: -23.0, z: 4.3 }, { x: 22.5, z: 6.4 }, { x: -22.2, z: -14.5 }, { x: 8.6, z: -14.2 }],
    hints: [
      { id: 's5-hint-super', position: { x: -18.9, z: 9.0 }, text: 'たからは あおいものの そばでは ないよ' },
      { id: 's5-hint-cart', position: { x: -21.3, z: 5.2 }, text: 'パンやさんの となりの ほう' },
      { id: 's5-hint-bread', position: { x: -1.1, z: 7.2 }, text: 'けいじばんが めじるし' },
      { id: 's5-hint-flower', position: { x: 10.2, z: 6.3 }, text: 'おみせの まえ、みぎうえ' },
      { id: 's5-hint-bench', position: { x: -17.6, z: -7.0 }, text: 'バスていでは ないよ' },
      { id: 's5-hint-vending', position: { x: -1.1, z: -10.7 }, text: 'けいじばんの うしろを みよう' },
      { id: 's5-hint-bus', position: { x: 14.0, z: -7.6 }, text: 'パンやの となりだよ' },
      { id: 's5-hint-board', position: { x: 18.8, z: 8.3 }, text: 'ちいさな はこが かくれているよ' }
    ],
    miniSpots: [
      { id: 's5-mini-difference', position: { x: -20.2, z: 11.8 }, kind: 'difference', label: 'ちがい' },
      { id: 's5-mini-addition', position: { x: -13.2, z: 7.0 }, kind: 'addition', label: 'たしざん' },
      { id: 's5-mini-sequence', position: { x: -3.6, z: 12.5 }, kind: 'sequence', label: 'つぎ' },
      { id: 's5-mini-sound', position: { x: 2.4, z: 6.8 }, kind: 'sound', label: 'おと' },
      { id: 's5-mini-kana', position: { x: 9.0, z: 12.3 }, kind: 'kana', label: 'ひらがな' },
      { id: 's5-mini-memory', position: { x: 18.2, z: 7.0 }, kind: 'memory', label: 'おぼえる' },
      { id: 's5-mini-shape', position: { x: -20.2, z: -9.2 }, kind: 'shape', label: 'かたち' },
      { id: 's5-mini-find', position: { x: -13.4, z: -3.6 }, kind: 'find', label: 'さがす' },
      { id: 's5-mini-order', position: { x: -3.7, z: -6.0 }, kind: 'order', label: 'じゅんばん' },
      { id: 's5-mini-count', position: { x: 2.6, z: -12.0 }, kind: 'count', label: 'かず' },
      { id: 's5-mini-color', position: { x: 11.0, z: -10.5 }, kind: 'color', label: 'いろ' },
      { id: 's5-mini-timing', position: { x: 20.0, z: -5.5 }, kind: 'timing', label: 'きらきら' }
    ]
  }
];

export function getStage(id: StageId): StageDefinition {
  return STAGES.find((stage) => stage.id === id) ?? STAGES[0];
}

export function getNextStageId(id: StageId): StageId | null {
  const next = id + 1;
  return next >= 1 && next <= STAGES.length ? (next as StageId) : null;
}
