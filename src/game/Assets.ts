import * as THREE from 'three';

type TextureOptions = {
  repeat?: [number, number];
  transparent?: boolean;
  roughness?: number;
  metalness?: number;
};

const loader = new THREE.TextureLoader();
const textureBaseUrl = `${import.meta.env.BASE_URL}assets/textures/`;

function applyTextureOptions(texture: THREE.Texture, options: TextureOptions): void {
  texture.colorSpace = THREE.SRGBColorSpace;
  if (options.repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(options.repeat[0], options.repeat[1]);
  }
}

function loadTexture(name: string, options: TextureOptions, onLoad: (texture: THREE.Texture) => void): void {
  const pngPath = `${textureBaseUrl}${name}.png`;
  const svgPath = `${textureBaseUrl}${name}.svg`;

  loader.load(
    pngPath,
    (texture) => {
      applyTextureOptions(texture, options);
      onLoad(texture);
    },
    undefined,
    () => {
      loader.load(
        svgPath,
        (texture) => {
          applyTextureOptions(texture, options);
          onLoad(texture);
        },
        undefined,
        () => {
          // Color materials keep the game playable when neither generated nor fallback assets exist.
        }
      );
    }
  );
}

export function texturedMaterial(
  textureName: string,
  fallbackColor: THREE.ColorRepresentation,
  options: TextureOptions = {}
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: fallbackColor,
    roughness: options.roughness ?? 0.82,
    metalness: options.metalness ?? 0.02,
    transparent: options.transparent ?? false
  });

  loadTexture(textureName, options, (texture) => {
    material.map = texture;
    material.needsUpdate = true;
  });

  return material;
}

export function iconMaterial(
  textureName: string,
  fallbackColor: THREE.ColorRepresentation
): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({
    color: fallbackColor,
    transparent: true,
    side: THREE.DoubleSide
  });

  loadTexture(textureName, {}, (texture) => {
    material.map = texture;
    material.color.set(0xffffff);
    material.needsUpdate = true;
  });

  return material;
}

export function spriteMaterial(
  textureName: string,
  fallbackColor: THREE.ColorRepresentation
): THREE.SpriteMaterial {
  const material = new THREE.SpriteMaterial({
    color: fallbackColor,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    alphaTest: 0.02
  });

  loadTexture(textureName, {}, (texture) => {
    material.map = texture;
    material.color.set(0xffffff);
    material.needsUpdate = true;
  });

  return material;
}

export function makeTextSprite(text: string, color = '#173642', background = '#fff7c7'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.Sprite(new THREE.SpriteMaterial({ color }));
  }

  context.fillStyle = background;
  roundRect(context, 16, 16, 480, 128, 24);
  context.fill();
  context.lineWidth = 10;
  context.strokeStyle = 'rgba(23, 54, 66, 0.18)';
  context.stroke();

  context.fillStyle = color;
  context.font = '900 56px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 256, 82);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(3.6, 1.1, 1);
  return sprite;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}
