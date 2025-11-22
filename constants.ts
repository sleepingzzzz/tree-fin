
import * as THREE from 'three';

export const COLORS = {
  background: '#000000',
  treePrimary: '#d41c1c', // Deep Christmas Red
  treeSecondary: '#e6b800', // Gold
  treeHighlight: '#ffffff', // White sparkles
  floor: '#88ccff', // Icy whitish blue for the floor ripples
  text: '#ffdac1', // Peach/Gold for text
  gold: '#ffd700',
  firework: ['#ff0040', '#ff4000', '#ff8000', '#ffff00', '#80ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff'],
  ornaments: [
    '#FF0000', // Classic Red
    '#FFD700', // Gold
    '#C0C0C0', // Silver
    '#0000FF', // Blue
    '#00FF00', // Green
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
  ]
};

export const FONT_URL = 'https://fonts.gstatic.com/s/greatvibes/v14/RWmMoKWR9v4ksMfaWd_JN9XLIaQ.woff';

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Generate a soft glow texture for particles
export const getParticleTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  // Radial gradient for soft light point
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};
