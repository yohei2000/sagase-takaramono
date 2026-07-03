import type { MiniGameKind } from './types';

export class MiniGames {
  constructor(private readonly root: HTMLElement) {}

  play(kind: MiniGameKind, repeated: boolean, difficulty = 1): Promise<number> {
    this.root.classList.remove('is-hidden');
    if (kind === 'match') {
      return this.playMatch(repeated, difficulty);
    }
    if (kind === 'timing') {
      return this.playTiming(repeated, difficulty);
    }
    if (kind === 'order') {
      return this.playOrder(repeated, difficulty);
    }
    if (kind === 'color') {
      return this.playColor(repeated, difficulty);
    }
    if (kind === 'memory') {
      return this.playMemory(repeated, difficulty);
    }
    if (kind === 'find') {
      return this.playFind(repeated, difficulty);
    }
    if (kind === 'addition') {
      return this.playAddition(repeated, difficulty);
    }
    if (kind === 'subtraction') {
      return this.playSubtraction(repeated, difficulty);
    }
    if (kind === 'difference') {
      return this.playDifference(repeated, difficulty);
    }
    if (kind === 'shape') {
      return this.playShape(repeated, difficulty);
    }
    if (kind === 'sequence') {
      return this.playSequence(repeated, difficulty);
    }
    if (kind === 'sound') {
      return this.playSound(repeated, difficulty);
    }
    if (kind === 'kana') {
      return this.playKana(repeated, difficulty);
    }
    if (kind === 'compare') {
      return this.playCompare(repeated, difficulty);
    }
    if (kind === 'numberMemory') {
      return this.playNumberMemory(repeated, difficulty);
    }
    if (kind === 'quiz') {
      return this.playQuiz(repeated, difficulty);
    }
    if (kind === 'route') {
      return this.playRoute(repeated, difficulty);
    }
    return this.playCount(repeated, difficulty);
  }

  private playMatch(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const cards = [
        { icon: '★', label: 'ほし' },
        { icon: '◆', label: 'ひし' },
        { icon: '●', label: 'まる' },
        { icon: '♬', label: 'おと' },
        { icon: '✿', label: 'はな' },
        { icon: '▲', label: 'さんかく' },
        { icon: '■', label: 'しかく' }
      ];
      const target = cards[Math.floor(Math.random() * cards.length)];
      const choiceCount = difficulty >= 5 ? 5 : difficulty >= 3 ? 4 : 3;
      const choices = shuffle([target, ...shuffle(cards.filter((card) => card !== target)).slice(0, choiceCount - 1)]);
      const showAnswerLabels = difficulty <= 2;

      const card = this.createCard('おなじ えを えらぼう', showAnswerLabels ? `「${target.label}」と おなじ えは どれ？` : 'うえと おなじ しるしを えらぼう');
      if (!showAnswerLabels) {
        card.append(this.createTokenPreview([target.icon]));
      }
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      for (const choice of choices) {
        const button = document.createElement('button');
        button.className = 'choice-card';
        button.innerHTML = showAnswerLabels ? `${choice.icon}<span>${choice.label}</span>` : choice.icon;
        bindTap(button, () => {
          const correct = choice === target;
          const reward = correct ? (repeated ? 7 : 15) : 5;
          this.finish(`${correct ? 'せいかい！' : 'だいじょうぶ！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playTiming(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const card = this.createCard('きらきらを とめよう', 'まんなかに きたら とめてね');
      const track = document.createElement('div');
      track.className = 'star-track';
      const target = document.createElement('div');
      target.className = 'star-target';
      const star = document.createElement('div');
      star.className = 'moving-star';
      star.textContent = difficulty >= 4 ? '●' : '★';
      track.append(target, star);

      const button = document.createElement('button');
      button.className = 'mini-button';
      button.textContent = 'とめる';
      card.append(track, button);

      let raf = 0;
      let start = performance.now();
      let x = 0;
      const animate = (now: number) => {
        const width = Math.max(1, track.clientWidth - 58);
        const phase = (now - start) / Math.max(330, 610 - difficulty * 48);
        x = ((Math.sin(phase) + 1) / 2) * width;
        star.style.transform = `translateX(${x}px)`;
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);

      bindTap(button, () => {
        cancelAnimationFrame(raf);
        const center = track.clientWidth / 2;
        const starCenter = x + 29;
        const distance = Math.abs(starCenter - center);
        const perfectRange = Math.max(20, 44 - difficulty * 4);
        const goodRange = Math.max(50, 96 - difficulty * 7);
        const reward = distance < perfectRange ? (repeated ? 8 : 20) : distance < goodRange ? (repeated ? 6 : 10) : 5;
        const message = distance < perfectRange ? 'ぴったり！' : distance < goodRange ? 'おしい！' : 'つぎは できるよ！';
        this.finish(`${message} ${reward}まい もらったよ`, reward, resolve);
      });
    });
  }

  private playCount(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const buttonCount = difficulty >= 4 ? 12 : 9;
      const target =
        difficulty >= 5
          ? 7 + Math.floor(Math.random() * 5)
          : difficulty >= 3
            ? 5 + Math.floor(Math.random() * 4)
            : 3 + Math.floor(Math.random() * 4);
      const card = this.createCard('かずを あつめよう', `${target}こ タップして 「できた！」`);
      const grid = document.createElement('div');
      grid.className = 'coin-click-grid';

      let selected = 0;
      const positions = [
        [8, 12],
        [42, 8],
        [78, 16],
        [18, 38],
        [55, 36],
        [84, 48],
        [7, 70],
        [44, 72],
        [74, 75],
        [28, 14],
        [30, 60],
        [64, 62]
      ];

      for (let i = 0; i < buttonCount; i += 1) {
        const coin = document.createElement('button');
        coin.className = 'floating-coin';
        coin.textContent = `${i + 1}`;
        coin.style.left = `${positions[i][0]}%`;
        coin.style.top = `${positions[i][1]}%`;
        bindTap(coin, () => {
          if (coin.classList.contains('is-picked')) {
            return;
          }
          coin.classList.add('is-picked');
          selected += 1;
        });
        grid.append(coin);
      }

      const button = document.createElement('button');
      button.className = 'mini-button';
      button.textContent = 'できた！';
      bindTap(button, () => {
        const reward = selected === target ? (repeated ? 7 : 15) : 5;
        const message = selected === target ? 'ぴったり！' : 'すこし ちがったね';
        this.finish(`${message} ${reward}まい もらったよ`, reward, resolve);
      });

      card.append(grid, button);
    });
  }

  private playOrder(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const goal = Math.min(8, difficulty + 3);
      const numbers = Array.from({ length: goal }, (_, index) => index + 1);
      const card = this.createCard('じゅんばんに タップ', `1から ${goal}まで じゅんばんに えらぼう`);
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';
      let next = 1;
      let mistakes = 0;
      let finished = false;

      for (const value of shuffle(numbers)) {
        const button = document.createElement('button');
        button.className = 'choice-card number-choice';
        button.textContent = value.toString();
        bindTap(button, () => {
          if (finished || button.classList.contains('is-picked')) {
            return;
          }
          if (value !== next && button.classList.contains('is-wrong')) {
            return;
          }

          if (value === next) {
            button.classList.add('is-picked');
            next += 1;
          } else {
            mistakes += 1;
            button.classList.add('is-wrong');
          }

          if (next > goal) {
            finished = true;
            const reward = mistakes === 0 ? (repeated ? 8 : 18) : mistakes === 1 ? (repeated ? 6 : 10) : 5;
            const message = mistakes === 0 ? 'ばっちり！' : mistakes === 1 ? 'おしい！' : 'だいじょうぶ！';
            this.finish(`${message} ${reward}まい もらったよ`, reward, resolve);
          }
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playColor(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const colors = [
        { name: 'あか', value: '#ff6b6b' },
        { name: 'あお', value: '#4aa8ff' },
        { name: 'きいろ', value: '#ffd65b' },
        { name: 'みどり', value: '#70d88b' },
        { name: 'むらさき', value: '#b891ff' },
        { name: 'だいだい', value: '#ff9a3d' }
      ];
      const target = colors[Math.floor(Math.random() * colors.length)];
      const choiceCount = difficulty >= 5 ? 5 : difficulty >= 3 ? 4 : 3;
      const choices = shuffle([target, ...shuffle(colors.filter((color) => color !== target)).slice(0, choiceCount - 1)]);
      const showAnswerLabels = difficulty <= 2;
      const card = this.createCard('いろを えらぼう', showAnswerLabels ? `「${target.name}」の いろを タップしてね` : 'うえと おなじ いろを タップしてね');
      if (!showAnswerLabels) {
        card.append(this.createColorPreview(target.value));
      }
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      for (const choice of choices) {
        const button = document.createElement('button');
        button.className = 'choice-card color-choice';
        button.innerHTML = showAnswerLabels ? `<span class="color-swatch"></span><span>${choice.name}</span>` : '<span class="color-swatch"></span>';
        const swatch = button.querySelector<HTMLElement>('.color-swatch');
        if (swatch) {
          swatch.style.background = choice.value;
        }
        bindTap(button, () => {
          const correct = choice === target;
          const reward = correct ? (repeated ? 8 : 18) : 5;
          this.finish(`${correct ? 'せいかい！' : 'つぎは できるよ！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playMemory(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const icons = ['★', '●', '◆', '♬', '✿', '▲', '■'];
      const patternLength = difficulty >= 5 ? 5 : difficulty >= 3 ? 4 : 3;
      const pattern = shuffle(icons).slice(0, patternLength);
      const choiceCount = difficulty >= 4 ? 4 : 3;
      const choices = [pattern];
      while (choices.length < choiceCount) {
        const candidate = shuffle(icons).slice(0, patternLength);
        if (!choices.some((choice) => choice.join('') === candidate.join(''))) {
          choices.push(candidate);
        }
      }
      const card = this.createCard('おぼえて えらぼう', 'うえと おなじ ならびを タップしてね');
      const preview = this.createTokenPreview(pattern);
      const grid = document.createElement('div');
      grid.className = 'memory-choice-list';

      for (const choice of shuffle(choices)) {
        const button = document.createElement('button');
        button.className = 'memory-choice';
        button.innerHTML = choice.map((icon) => `<span class="memory-token">${icon}</span>`).join('');
        bindTap(button, () => {
          const correct = choice.join('') === pattern.join('');
          const reward = correct ? (repeated ? 8 : 18) : 5;
          this.finish(`${correct ? 'よく おぼえたね！' : 'だいじょうぶ！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(preview, grid);
    });
  }

  private playNumberMemory(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const patternLength = difficulty >= 5 ? 5 : difficulty >= 4 ? 4 : 3;
      const digitMax = difficulty >= 5 ? 9 : 6;
      const pattern = Array.from({ length: patternLength }, () => String(1 + Math.floor(Math.random() * digitMax)));
      const choiceCount = difficulty >= 4 ? 4 : 3;
      const choices = [pattern];
      while (choices.length < choiceCount) {
        const candidate = [...pattern];
        const index = Math.floor(Math.random() * candidate.length);
        candidate[index] = String(1 + Math.floor(Math.random() * digitMax));
        if (candidate.join('') !== pattern.join('') && !choices.some((choice) => choice.join('') === candidate.join(''))) {
          choices.push(candidate);
        }
      }

      const card = this.createCard('すうじを おぼえよう', 'すうじの ならびを おぼえて えらぼう');
      const preview = this.createTokenPreview(pattern);
      const maskDelay = Math.max(900, 1800 - difficulty * 170);
      window.setTimeout(() => {
        preview.innerHTML = pattern.map(() => '<span class="memory-token">?</span>').join('');
      }, maskDelay);

      const grid = document.createElement('div');
      grid.className = 'memory-choice-list';
      for (const choice of shuffle(choices)) {
        const button = document.createElement('button');
        button.className = 'memory-choice';
        button.innerHTML = choice.map((digit) => `<span class="memory-token">${digit}</span>`).join('');
        bindTap(button, () => {
          const correct = choice.join('') === pattern.join('');
          const reward = correct ? (repeated ? 9 : 20) : 5;
          this.finish(`${correct ? 'よく おぼえたね！' : 'もういちど！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(preview, grid);
    });
  }

  private playFind(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const tileCount = difficulty >= 4 ? 12 : 9;
      const card = this.createCard('ほうせきを さがそう', difficulty >= 4 ? 'あたりは ひとつ。よく かんがえて タップしてね' : 'あたりの はこを タップしてね');
      const grid = document.createElement('div');
      grid.className = tileCount > 9 ? 'find-grid find-grid-wide' : 'find-grid';
      const targetIndex = Math.floor(Math.random() * tileCount);
      let attempts = 0;
      let finished = false;

      for (let i = 0; i < tileCount; i += 1) {
        const button = document.createElement('button');
        button.className = 'find-tile';
        button.textContent = '?';
        bindTap(button, () => {
          if (finished || button.classList.contains('is-picked')) {
            return;
          }
          if (button.classList.contains('is-wrong')) {
            return;
          }

          attempts += 1;
          if (i === targetIndex) {
            finished = true;
            button.classList.add('is-picked');
            button.textContent = '◆';
            const reward = attempts === 1 ? (repeated ? 9 : 20) : attempts <= 3 ? (repeated ? 7 : 12) : 5;
            this.finish(`${attempts === 1 ? 'すごい！' : 'みつけた！'} ${reward}まい もらったよ`, reward, resolve);
          } else {
            button.classList.add('is-wrong');
            button.textContent = '×';
          }
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playAddition(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const a = difficulty >= 5 ? randomInt(21, 49) : difficulty >= 4 ? randomInt(12, 29) : randomInt(1, difficulty >= 3 ? 9 : 5);
      const b = difficulty >= 4 ? randomInt(2, 9) : randomInt(1, difficulty >= 3 ? 9 : Math.min(5, 10 - a));
      const answer = a + b;
      const choices = answerChoices(answer, difficulty >= 3 ? 4 : 3, 1, 70);
      const card = this.createCard('たしざん できるかな', `${a} + ${b} は いくつ？`);
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      for (const choice of choices) {
        const button = document.createElement('button');
        button.className = 'choice-card number-choice';
        button.textContent = choice.toString();
        bindTap(button, () => {
          const correct = choice === answer;
          const reward = correct ? (repeated ? 8 : 18) : 5;
          this.finish(`${correct ? 'せいかい！' : 'おしい！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playSubtraction(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const a = difficulty >= 5 ? randomInt(22, 59) : difficulty >= 4 ? randomInt(12, 29) : randomInt(6, 14);
      const b = difficulty >= 5 ? randomInt(4, Math.min(19, a - 1)) : randomInt(1, Math.min(9, a - 1));
      const answer = a - b;
      const choices = answerChoices(answer, 4, 0, 60);
      const card = this.createCard('ひきざん できるかな', `${a} - ${b} は いくつ？`);
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      for (const choice of choices) {
        const button = document.createElement('button');
        button.className = 'choice-card number-choice';
        button.textContent = choice.toString();
        bindTap(button, () => {
          const correct = choice === answer;
          const reward = correct ? (repeated ? 9 : 20) : 5;
          this.finish(`${correct ? 'せいかい！' : 'おしい！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playCompare(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const choiceCount = difficulty >= 4 ? 4 : 3;
      const maxNumber = difficulty >= 5 ? 99 : difficulty >= 3 ? 30 : 12;
      const numbers = uniqueNumbers(choiceCount, 1, maxNumber);
      const askSmallest = difficulty >= 4 && Math.random() < 0.45;
      const answer = askSmallest ? Math.min(...numbers) : Math.max(...numbers);
      const card = this.createCard('かずを くらべよう', askSmallest ? 'いちばん ちいさい かずは どれ？' : 'いちばん おおきい かずは どれ？');
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      for (const number of shuffle(numbers)) {
        const button = document.createElement('button');
        button.className = 'choice-card number-choice';
        button.textContent = number.toString();
        bindTap(button, () => {
          const correct = number === answer;
          const reward = correct ? (repeated ? 8 : 18) : 5;
          this.finish(`${correct ? 'そのとおり！' : 'もうすこし！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playDifference(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const scenes = [
        { same: 'りんご', sameIcon: '●', odd: 'みかん', oddIcon: '◆' },
        { same: 'ほん', sameIcon: '▣', odd: 'ノート', oddIcon: '□' },
        { same: 'はな', sameIcon: '✿', odd: 'はっぱ', oddIcon: '♣' },
        { same: 'ほし', sameIcon: '★', odd: 'つき', oddIcon: '◐' },
        { same: 'まる', sameIcon: '●', odd: 'さんかく', oddIcon: '▲' }
      ];
      const scene = scenes[Math.floor(Math.random() * scenes.length)];
      const choiceCount = difficulty >= 5 ? 5 : difficulty >= 3 ? 4 : 3;
      const oddIndex = Math.floor(Math.random() * choiceCount);
      const showAnswerLabels = difficulty <= 2;
      const card = this.createCard('まちがいさがし', 'ひとつだけ ちがうものを タップしてね');
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      for (let i = 0; i < choiceCount; i += 1) {
        const isOdd = i === oddIndex;
        const button = document.createElement('button');
        button.className = 'choice-card';
        button.innerHTML = showAnswerLabels
          ? `${isOdd ? scene.oddIcon : scene.sameIcon}<span>${isOdd ? scene.odd : scene.same}</span>`
          : `${isOdd ? scene.oddIcon : scene.sameIcon}`;
        bindTap(button, () => {
          const reward = isOdd ? (repeated ? 8 : 18) : 5;
          this.finish(`${isOdd ? 'みつけた！' : 'だいじょうぶ！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playShape(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const shapes = [
        { name: 'まる', icon: '●' },
        { name: 'さんかく', icon: '▲' },
        { name: 'しかく', icon: '■' },
        { name: 'ほし', icon: '★' },
        { name: 'ひしがた', icon: '◆' }
      ];
      const target = shapes[Math.floor(Math.random() * shapes.length)];
      const choiceCount = difficulty >= 5 ? 5 : difficulty >= 3 ? 4 : 3;
      const choices = shuffle([target, ...shuffle(shapes.filter((shape) => shape !== target)).slice(0, choiceCount - 1)]);
      const showAnswerLabels = difficulty <= 2;
      const card = this.createCard('かたちあわせ', showAnswerLabels ? `「${target.name}」を タップしてね` : 'うえと おなじ かたちを タップしてね');
      if (!showAnswerLabels) {
        card.append(this.createTokenPreview([target.icon]));
      }
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      for (const choice of choices) {
        const button = document.createElement('button');
        button.className = 'choice-card shape-choice';
        button.innerHTML = showAnswerLabels ? `${choice.icon}<span>${choice.name}</span>` : choice.icon;
        bindTap(button, () => {
          const correct = choice === target;
          const reward = correct ? (repeated ? 8 : 18) : 5;
          this.finish(`${correct ? 'ぴったり！' : 'おしい！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playSequence(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const patterns = [
        { min: 1, row: ['★', '●', '★', '●'], answer: '★', choices: ['★', '●', '◆'] },
        { min: 1, row: ['▲', '■', '▲', '■'], answer: '▲', choices: ['▲', '■', '●'] },
        { min: 2, row: ['1', '2', '3', '4'], answer: '5', choices: ['5', '3', '1', '6'] },
        { min: 3, row: ['2', '4', '6', '8'], answer: '10', choices: ['10', '9', '8', '12'] },
        { min: 4, row: ['3', '6', '9', '12'], answer: '15', choices: ['15', '14', '18', '13'] },
        { min: 5, row: ['あ', 'い', 'う', 'え'], answer: 'お', choices: ['お', 'か', 'え', 'い'] }
      ];
      const candidates = patterns.filter((pattern) => pattern.min <= difficulty);
      const pattern = candidates[Math.floor(Math.random() * candidates.length)];
      const card = this.createCard('ならべかえ', 'つぎに くるものを えらぼう');
      const preview = this.createTokenPreview([...pattern.row, '?']);
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      for (const choice of shuffle(pattern.choices.slice(0, difficulty >= 3 ? 4 : 3))) {
        const button = document.createElement('button');
        button.className = 'choice-card sequence-choice';
        button.textContent = choice;
        bindTap(button, () => {
          const correct = choice === pattern.answer;
          const reward = correct ? (repeated ? 8 : 18) : 5;
          this.finish(`${correct ? 'せいかい！' : 'もうすこし！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(preview, grid);
    });
  }

  private playSound(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const sounds = [
        { name: 'ぴんぽん', icon: '♪' },
        { name: 'どん', icon: '●' },
        { name: 'きらん', icon: '★' },
        { name: 'ぽん', icon: '◆' },
        { name: 'しゃらん', icon: '✿' }
      ];
      const target = sounds[Math.floor(Math.random() * sounds.length)];
      const choiceCount = difficulty >= 5 ? 5 : difficulty >= 3 ? 4 : 3;
      const choices = shuffle([target, ...shuffle(sounds.filter((sound) => sound !== target)).slice(0, choiceCount - 1)]);
      const showAnswerLabels = difficulty <= 2;
      const card = this.createCard('おとさがし', showAnswerLabels ? `きこえた おと「${target.name}」は どれ？` : 'うえの しるしと おなじ おとを えらぼう');
      const preview = document.createElement('div');
      preview.className = 'sound-preview';
      preview.textContent = target.icon;
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      for (const choice of choices) {
        const button = document.createElement('button');
        button.className = 'choice-card sound-choice';
        button.innerHTML = showAnswerLabels ? `${choice.icon}<span>${choice.name}</span>` : choice.icon;
        bindTap(button, () => {
          const correct = choice === target;
          const reward = correct ? (repeated ? 8 : 18) : 5;
          this.finish(`${correct ? 'よく きけたね！' : 'だいじょうぶ！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(preview, grid);
    });
  }

  private playKana(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const kana = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ'];
      const wordQuestions = [
        { word: 'あり', first: 'あ', last: 'り' },
        { word: 'いす', first: 'い', last: 'す' },
        { word: 'くつ', first: 'く', last: 'つ' },
        { word: 'さかな', first: 'さ', last: 'な' },
        { word: 'こま', first: 'こ', last: 'ま' }
      ];
      const choiceCount = difficulty >= 4 ? 4 : 3;
      const card = this.createCard('ひらがなさがし', '');
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      let answer: string;
      if (difficulty >= 3) {
        const question = wordQuestions[Math.floor(Math.random() * wordQuestions.length)];
        const askLast = difficulty >= 5 && Math.random() < 0.45;
        answer = askLast ? question.last : question.first;
        card.querySelector('p')!.textContent = `「${question.word}」の ${askLast ? 'さいご' : 'さいしょ'}の もじは？`;
      } else {
        answer = kana[Math.floor(Math.random() * 10)];
        card.querySelector('p')!.textContent = `「${answer}」を タップしてね`;
      }

      const choices = shuffle([answer, ...shuffle(kana.filter((letter) => letter !== answer)).slice(0, choiceCount - 1)]);
      for (const choice of choices) {
        const button = document.createElement('button');
        button.className = 'choice-card kana-choice';
        button.textContent = choice;
        bindTap(button, () => {
          const correct = choice === answer;
          const reward = correct ? (repeated ? 8 : 18) : 5;
          this.finish(`${correct ? 'せいかい！' : 'おしい！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playQuiz(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const questions = [
        { min: 3, text: 'よるに そらで ひかるものは？', choices: ['つき', 'くつ', 'いす'], answer: 'つき' },
        { min: 3, text: 'あめの ひに さすものは？', choices: ['かさ', 'さら', 'ほん'], answer: 'かさ' },
        { min: 4, text: 'テニスで ボールを うつ どうぐは？', choices: ['ラケット', 'スプーン', 'えんぴつ', 'くつ'], answer: 'ラケット' },
        { min: 4, text: '10より 2 おおきい かずは？', choices: ['12', '8', '11', '20'], answer: '12' },
        { min: 5, text: 'おみせで おかねを はらう ところは？', choices: ['レジ', 'トイレ', 'ベンチ', 'バス'], answer: 'レジ' },
        { min: 5, text: '20 + 5 と おなじ かずは？', choices: ['25', '15', '30', '52'], answer: '25' }
      ];
      const candidates = questions.filter((question) => question.min <= difficulty);
      const question = candidates[Math.floor(Math.random() * candidates.length)];
      const card = this.createCard('クイズに こたえよう', question.text);
      const grid = document.createElement('div');
      grid.className = 'choice-grid compact-choice-grid';

      for (const choice of shuffle(question.choices)) {
        const button = document.createElement('button');
        button.className = 'choice-card quiz-choice';
        button.textContent = choice;
        bindTap(button, () => {
          const correct = choice === question.answer;
          const reward = correct ? (repeated ? 9 : 20) : 5;
          this.finish(`${correct ? 'せいかい！' : 'なるほど！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private playRoute(repeated: boolean, difficulty: number): Promise<number> {
    return new Promise((resolve) => {
      const size = 3;
      const start = 4;
      const moves = this.makeRouteMoves(start, size, difficulty >= 5 ? 5 : 4);
      const finalIndex = applyMoves(start, size, moves);
      const card = this.createCard('みちを たどろう', `5から はじめて ${moves.join(' ')} に すすむと どこ？`);
      const grid = document.createElement('div');
      grid.className = 'route-grid';

      for (let i = 0; i < size * size; i += 1) {
        const button = document.createElement('button');
        button.className = 'route-tile';
        button.textContent = String(i + 1);
        if (i === start) {
          button.classList.add('route-start');
        }
        bindTap(button, () => {
          const correct = i === finalIndex;
          const reward = correct ? (repeated ? 10 : 22) : 5;
          this.finish(`${correct ? 'たどれた！' : 'もうすこし！'} ${reward}まい もらったよ`, reward, resolve);
        });
        grid.append(button);
      }

      card.append(grid);
    });
  }

  private makeRouteMoves(start: number, size: number, length: number): string[] {
    const symbols = ['↑', '↓', '←', '→'];
    let current = start;
    const moves: string[] = [];
    for (let step = 0; step < length; step += 1) {
      const valid = shuffle(symbols).filter((symbol) => canMove(current, size, symbol));
      const move = valid[0];
      moves.push(move);
      current = moveIndex(current, size, move);
    }
    return moves;
  }

  private createTokenPreview(tokens: string[]): HTMLElement {
    const preview = document.createElement('div');
    preview.className = 'memory-row';
    preview.innerHTML = tokens.map((token) => `<span class="memory-token">${token}</span>`).join('');
    return preview;
  }

  private createColorPreview(value: string): HTMLElement {
    const preview = document.createElement('div');
    preview.className = 'memory-row';
    const swatch = document.createElement('span');
    swatch.className = 'color-swatch color-preview-swatch';
    swatch.style.background = value;
    preview.append(swatch);
    return preview;
  }

  private createCard(title: string, text: string): HTMLElement {
    this.root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'mini-card';
    const heading = document.createElement('h2');
    heading.textContent = title;
    const body = document.createElement('p');
    body.textContent = text;
    card.append(heading, body);
    this.root.append(card);
    return card;
  }

  private finish(message: string, reward: number, resolve: (reward: number) => void): void {
    const card = this.createCard('やったね', message);
    const badge = document.createElement('div');
    badge.className = 'mini-reward-badge';
    badge.textContent = `+${reward}`;
    card.append(badge);

    const button = document.createElement('button');
    button.className = 'mini-button';
    button.textContent = 'もどる';
    bindTap(button, () => {
      this.root.classList.add('is-hidden');
      this.root.innerHTML = '';
      resolve(reward);
    });
    card.append(button);
  }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function answerChoices(answer: number, count: number, min: number, max: number): number[] {
  const choices = new Set<number>([answer]);
  const offsets = shuffle([1, -1, 2, -2, 3, -3, 10, -10, 5, -5]);
  for (const offset of offsets) {
    if (choices.size >= count) {
      break;
    }
    const value = answer + offset;
    if (value >= min && value <= max) {
      choices.add(value);
    }
  }
  while (choices.size < count) {
    choices.add(randomInt(min, max));
  }
  return shuffle([...choices]);
}

function uniqueNumbers(count: number, min: number, max: number): number[] {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    numbers.add(randomInt(min, max));
  }
  return [...numbers];
}

function canMove(index: number, size: number, move: string): boolean {
  const row = Math.floor(index / size);
  const col = index % size;
  if (move === '↑') {
    return row > 0;
  }
  if (move === '↓') {
    return row < size - 1;
  }
  if (move === '←') {
    return col > 0;
  }
  return col < size - 1;
}

function moveIndex(index: number, size: number, move: string): number {
  if (move === '↑') {
    return index - size;
  }
  if (move === '↓') {
    return index + size;
  }
  if (move === '←') {
    return index - 1;
  }
  return index + 1;
}

function applyMoves(start: number, size: number, moves: string[]): number {
  return moves.reduce((index, move) => moveIndex(index, size, move), start);
}

function bindTap(button: HTMLButtonElement, callback: () => void): void {
  let pointerActivatedAt = 0;

  button.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse') {
      return;
    }

    event.preventDefault();
    pointerActivatedAt = performance.now();
    callback();
  });

  button.addEventListener('click', (event) => {
    if (performance.now() - pointerActivatedAt < 500) {
      event.preventDefault();
      return;
    }
    callback();
  });
}
