import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const textureDir = path.join(root, 'public', 'assets', 'textures');

const assets = [
  {
    name: 'floor_wood',
    prompt:
      "seamless bright wooden floor texture for a cheerful children's treasure hunt game, storybook illustration, soft warm colors, clean, tileable, no text",
    palette: ['#f8d99a', '#e8b869', '#fff2bf'],
    kind: 'wood'
  },
  {
    name: 'wall_room',
    prompt:
      "seamless cream wallpaper with tiny stars and circles, cheerful Japanese children's room, storybook style, soft pastel, tileable, no text",
    palette: ['#fff4c9', '#f7df97', '#f5b7d1'],
    kind: 'wall'
  },
  {
    name: 'rug_playful',
    prompt: 'round colorful play rug texture, simple geometric shapes, storybook style, soft fabric, no text',
    palette: ['#ffbf5b', '#79d6cf', '#f36f72'],
    kind: 'rug'
  },
  {
    name: 'sofa_fabric',
    prompt: "soft blue sofa fabric texture, cozy children's home, storybook style, seamless, no text",
    palette: ['#8cc8f5', '#5aa9df', '#d8f3ff'],
    kind: 'fabric'
  },
  {
    name: 'bed_blanket',
    prompt: 'cute star pattern blanket texture, pastel colors, storybook style, seamless, no text',
    palette: ['#aadfff', '#ffe78f', '#ffffff'],
    kind: 'stars'
  },
  {
    name: 'bookshelf_front',
    prompt:
      "front texture of a red children's bookshelf filled with colorful books, storybook style, clean shapes, no readable text",
    palette: ['#d9574f', '#ffd665', '#68c7e8'],
    kind: 'bookshelf'
  },
  {
    name: 'kitchen_tile',
    prompt: 'bright kitchen tile texture, cheerful home, pastel colors, seamless, no text',
    palette: ['#d8f8ff', '#9adbe7', '#ffffff'],
    kind: 'tile'
  },
  {
    name: 'treasure_chest',
    prompt:
      "front texture of a magical golden treasure chest, friendly children's game, sparkles, storybook style, no text",
    palette: ['#ffd34d', '#b97928', '#fff4a8'],
    kind: 'treasure'
  },
  {
    name: 'hint_card',
    prompt:
      "glowing hint card icon with magnifying glass and star, friendly children's treasure hunt game, storybook style, no text",
    palette: ['#fff4a8', '#79d6cf', '#ffbf5b'],
    kind: 'hint'
  },
  {
    name: 'coin',
    prompt: "round golden coin icon with a simple star symbol, children's game, clean storybook style, no text",
    palette: ['#ffd65b', '#c78d22', '#fff7b8'],
    kind: 'coin'
  },
  {
    name: 'cpu_character',
    prompt:
      'friendly rival child explorer outfit texture, cheerful, non-realistic, storybook game style, no text',
    palette: ['#7dc7ff', '#ffcf4d', '#ffffff'],
    kind: 'outfit'
  },
  {
    name: 'player_character',
    prompt:
      'cute original low-poly pixel-style girl player character with black twin pigtails, red hair clips, yellow shirt, white skirt, cheerful child-friendly treasure hunt game style, no text',
    palette: ['#f3e26f', '#302832', '#fff6f0'],
    kind: 'playerGirl'
  }
];

await mkdir(textureDir, { recursive: true });

const apiKey = process.env.OPENAI_API_KEY;
const imageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

let generated = 0;
let fallbacks = 0;

for (const asset of assets) {
  await writeFallbackSvg(asset);
  fallbacks += 1;

  if (!apiKey) {
    continue;
  }

  try {
    await generateWithOpenAI(asset, apiKey, imageModel);
    generated += 1;
  } catch (error) {
    console.warn(`[assets] ${asset.name}: image generation failed, using SVG fallback.`);
    console.warn(error instanceof Error ? error.message : error);
  }
}

if (!apiKey) {
  console.log(`[assets] OPENAI_API_KEY not set. Wrote ${fallbacks} SVG fallback textures.`);
} else {
  console.log(`[assets] Generated ${generated} PNG textures and wrote ${fallbacks} SVG fallbacks.`);
}

async function generateWithOpenAI(asset, apiKeyValue, model) {
  if (typeof fetch !== 'function') {
    throw new Error('This Node.js runtime does not provide fetch.');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKeyValue}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt: `${asset.prompt}. 512x512 game texture, safe for young children.`,
      size: '512x512'
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI image API returned ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  const item = json.data?.[0];
  if (!item) {
    throw new Error('OpenAI image API returned no image data.');
  }

  const pngPath = path.join(textureDir, `${asset.name}.png`);
  if (item.b64_json) {
    await writeFile(pngPath, Buffer.from(item.b64_json, 'base64'));
    return;
  }

  if (item.url) {
    const imageResponse = await fetch(item.url);
    if (!imageResponse.ok) {
      throw new Error(`Could not download generated image: ${imageResponse.status}`);
    }
    await writeFile(pngPath, Buffer.from(await imageResponse.arrayBuffer()));
    return;
  }

  throw new Error('OpenAI image API response did not include b64_json or url.');
}

async function writeFallbackSvg(asset) {
  const [a, b, c] = asset.palette;
  const svgPath = path.join(textureDir, `${asset.name}.svg`);
  const body = svgBody(asset.kind, a, b, c);
  const background = asset.kind === 'playerGirl' ? '' : `  <rect width="512" height="512" fill="${a}"/>
`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
${background}  ${body}
</svg>
`;
  await writeFile(svgPath, svg, 'utf8');
}

function svgBody(kind, a, b, c) {
  if (kind === 'wood') {
    return range(9)
      .map((i) => `<path d="M0 ${i * 64 + 18} C 120 ${i * 64 - 10}, 260 ${i * 64 + 48}, 512 ${i * 64 + 16}" stroke="${i % 2 ? b : c}" stroke-width="18" fill="none" opacity="0.55"/>`)
      .join('\n  ');
  }
  if (kind === 'wall') {
    return `${range(42)
      .map((i) => {
        const x = (i * 73) % 512;
        const y = (i * 47) % 512;
        return i % 3 === 0
          ? `<polygon points="${x},${y - 12} ${x + 6},${y - 2} ${x + 18},${y} ${x + 8},${y + 8} ${x + 10},${y + 20} ${x},${y + 14} ${x - 10},${y + 20} ${x - 8},${y + 8} ${x - 18},${y} ${x - 6},${y - 2}" fill="${b}" opacity="0.48"/>`
          : `<circle cx="${x}" cy="${y}" r="${8 + (i % 5)}" fill="${c}" opacity="0.38"/>`;
      })
      .join('\n  ')}`;
  }
  if (kind === 'rug') {
    return `<circle cx="256" cy="256" r="224" fill="${b}"/>
  <circle cx="256" cy="256" r="168" fill="${c}" opacity="0.9"/>
  <circle cx="256" cy="256" r="92" fill="${a}" opacity="0.95"/>
  ${range(18).map((i) => `<circle cx="${72 + ((i * 83) % 368)}" cy="${74 + ((i * 59) % 360)}" r="${16 + (i % 4) * 5}" fill="${i % 2 ? a : b}" opacity="0.72"/>`).join('\n  ')}`;
  }
  if (kind === 'fabric') {
    return range(12)
      .map((i) => `<path d="M${i * 45 - 80} 0 C ${i * 45 + 20} 140, ${i * 45 - 40} 320, ${i * 45 + 72} 512" stroke="${i % 2 ? b : c}" stroke-width="24" fill="none" opacity="0.34"/>`)
      .join('\n  ');
  }
  if (kind === 'stars') {
    return range(26)
      .map((i) => {
        const x = 36 + ((i * 89) % 440);
        const y = 40 + ((i * 61) % 430);
        return `<polygon points="${x},${y - 18} ${x + 6},${y - 5} ${x + 20},${y - 4} ${x + 9},${y + 5} ${x + 13},${y + 18} ${x},${y + 10} ${x - 13},${y + 18} ${x - 9},${y + 5} ${x - 20},${y - 4} ${x - 6},${y - 5}" fill="${i % 2 ? b : c}" opacity="0.78"/>`;
      })
      .join('\n  ');
  }
  if (kind === 'bookshelf') {
    return `<rect x="52" y="44" width="408" height="424" rx="24" fill="${a}"/>
  ${range(4).map((i) => `<rect x="78" y="${94 + i * 88}" width="356" height="16" fill="#8d382f" opacity="0.75"/>`).join('\n  ')}
  ${range(32).map((i) => `<rect x="${84 + (i % 8) * 43}" y="${62 + Math.floor(i / 8) * 88}" width="${22 + (i % 3) * 5}" height="${58 + (i % 2) * 18}" rx="5" fill="${[b, c, '#9be8cf', '#fff7c7'][i % 4]}"/>`).join('\n  ')}`;
  }
  if (kind === 'tile') {
    return range(9)
      .map((i) => `<path d="M${i * 64} 0 V512 M0 ${i * 64} H512" stroke="${b}" stroke-width="6" opacity="0.5"/>`)
      .join('\n  ');
  }
  if (kind === 'treasure') {
    return `<rect x="74" y="198" width="364" height="218" rx="28" fill="${b}"/>
  <path d="M88 216 Q256 84 424 216 Z" fill="${a}"/>
  <rect x="224" y="226" width="64" height="86" rx="10" fill="${c}"/>
  ${range(20).map((i) => `<circle cx="${52 + ((i * 97) % 420)}" cy="${48 + ((i * 73) % 408)}" r="${4 + (i % 4)}" fill="${c}" opacity="0.75"/>`).join('\n  ')}`;
  }
  if (kind === 'hint') {
    return `<rect x="94" y="76" width="324" height="360" rx="34" fill="${c}" opacity="0.92"/>
  <circle cx="226" cy="224" r="72" fill="none" stroke="${b}" stroke-width="24"/>
  <path d="M274 274 L346 346" stroke="${b}" stroke-width="26" stroke-linecap="round"/>
  <polygon points="350,126 365,158 400,162 374,184 382,218 350,200 318,218 326,184 300,162 335,158" fill="${a}"/>`;
  }
  if (kind === 'coin') {
    return `<circle cx="256" cy="256" r="196" fill="${b}"/>
  <circle cx="256" cy="256" r="156" fill="${a}"/>
  <polygon points="256,118 294,210 394,218 318,282 342,382 256,328 170,382 194,282 118,218 218,210" fill="${c}" opacity="0.85"/>`;
  }
  if (kind === 'playerGirl') {
    return `<rect x="190" y="222" width="132" height="112" rx="16" fill="${a}"/>
  <rect x="176" y="324" width="160" height="54" rx="8" fill="${c}"/>
  <rect x="206" y="374" width="30" height="92" rx="6" fill="#272632"/>
  <rect x="276" y="374" width="30" height="92" rx="6" fill="#272632"/>
  <rect x="124" y="242" width="68" height="26" rx="8" fill="${c}"/>
  <rect x="320" y="242" width="68" height="26" rx="8" fill="${c}"/>
  <rect x="104" y="248" width="28" height="28" rx="6" fill="#ffdcc9"/>
  <rect x="380" y="248" width="28" height="28" rx="6" fill="#ffdcc9"/>
  <rect x="157" y="96" width="198" height="142" rx="28" fill="#ffdcc9"/>
  <rect x="148" y="78" width="216" height="72" rx="18" fill="${b}"/>
  <rect x="142" y="128" width="42" height="112" rx="10" fill="${b}"/>
  <rect x="328" y="128" width="42" height="112" rx="10" fill="${b}"/>
  <rect x="114" y="106" width="54" height="62" rx="10" fill="${b}"/>
  <rect x="80" y="156" width="60" height="64" rx="10" fill="${b}"/>
  <rect x="108" y="212" width="48" height="58" rx="10" fill="${b}"/>
  <rect x="344" y="106" width="54" height="62" rx="10" fill="${b}"/>
  <rect x="372" y="156" width="60" height="64" rx="10" fill="${b}"/>
  <rect x="356" y="212" width="48" height="58" rx="10" fill="${b}"/>
  <rect x="210" y="158" width="24" height="50" rx="4" fill="#27232a"/>
  <rect x="278" y="158" width="24" height="50" rx="4" fill="#27232a"/>
  <rect x="184" y="210" width="32" height="16" rx="4" fill="#ff9a9e" opacity="0.86"/>
  <rect x="296" y="210" width="32" height="16" rx="4" fill="#ff9a9e" opacity="0.86"/>
  <rect x="176" y="92" width="34" height="38" rx="6" fill="#f05d67"/>
  <rect x="302" y="92" width="34" height="38" rx="6" fill="#f05d67"/>`;
  }
  if (kind === 'outfit') {
    return `<rect x="86" y="70" width="340" height="372" rx="46" fill="${a}"/>
  <path d="M96 166 C180 126, 334 126, 416 166 L388 226 C318 194, 194 194, 124 226 Z" fill="${b}"/>
  <circle cx="186" cy="294" r="34" fill="${c}" opacity="0.85"/>
  <circle cx="326" cy="294" r="34" fill="${c}" opacity="0.85"/>
  <path d="M180 380 Q256 420 332 380" stroke="${c}" stroke-width="28" fill="none" stroke-linecap="round"/>`;
  }
  return `<circle cx="256" cy="256" r="180" fill="${b}" opacity="0.7"/><circle cx="256" cy="256" r="90" fill="${c}" opacity="0.7"/>`;
}

function range(count) {
  return Array.from({ length: count }, (_, index) => index);
}
