import type { MiniGameKind } from './types';

export class MiniGames {
  constructor(private readonly root: HTMLElement) {}

  play(kind: MiniGameKind, repeated: boolean): Promise<number> {
    this.root.classList.remove('is-hidden');
    if (kind === 'match') {
      return this.playMatch(repeated);
    }
    if (kind === 'timing') {
      return this.playTiming(repeated);
    }
    return this.playCount(repeated);
  }

  private playMatch(repeated: boolean): Promise<number> {
    return new Promise((resolve) => {
      const cards = [
        { icon: '★', label: 'ほし' },
        { icon: '◆', label: 'ひし' },
        { icon: '●', label: 'まる' },
        { icon: '♬', label: 'おと' },
        { icon: '✿', label: 'はな' }
      ];
      const target = cards[Math.floor(Math.random() * cards.length)];
      const choices = shuffle([target, ...shuffle(cards.filter((card) => card !== target)).slice(0, 2)]);

      const card = this.createCard('おなじ えを えらぼう', `「${target.label}」と おなじ えは どれ？`);
      const grid = document.createElement('div');
      grid.className = 'choice-grid';

      for (const choice of choices) {
        const button = document.createElement('button');
        button.className = 'choice-card';
        button.innerHTML = `${choice.icon}<span>${choice.label}</span>`;
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

  private playTiming(repeated: boolean): Promise<number> {
    return new Promise((resolve) => {
      const card = this.createCard('きらきらを とめよう', 'まんなかに きたら とめてね');
      const track = document.createElement('div');
      track.className = 'star-track';
      const target = document.createElement('div');
      target.className = 'star-target';
      const star = document.createElement('div');
      star.className = 'moving-star';
      star.textContent = '★';
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
        const phase = (now - start) / 560;
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
        const reward = distance < 36 ? (repeated ? 8 : 20) : distance < 82 ? (repeated ? 6 : 10) : 5;
        const message = distance < 36 ? 'ぴったり！' : distance < 82 ? 'おしい！' : 'つぎは できるよ！';
        this.finish(`${message} ${reward}まい もらったよ`, reward, resolve);
      });
    });
  }

  private playCount(repeated: boolean): Promise<number> {
    return new Promise((resolve) => {
      const target = 3 + Math.floor(Math.random() * 4);
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
        [74, 75]
      ];

      for (let i = 0; i < 9; i += 1) {
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
