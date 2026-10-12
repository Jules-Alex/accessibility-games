import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { CLIPS, TEST_CLIP } from './surdite-content';

// Racine des fichiers publics de l'application, vue depuis libs/defis/surdite/src/lib.
const PUBLIC_DIR = resolve(__dirname, '../../../../../apps/web/public');

describe('extraits audio du défi 5', () => {
  it.each([...CLIPS, TEST_CLIP].map((c) => [c.url]))('%s existe dans les fichiers publics et dure plus de 2 secondes', (url) => {
    const file = resolve(PUBLIC_DIR, url);
    expect(existsSync(file)).toBe(true);
    const bytes = readFileSync(file);
    expect(bytes.length).toBeGreaterThan(1000);
    if (url.endsWith('.wav')) {
      expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString('ascii')).toBe('WAVE');
      const sampleRate = bytes.readUInt32LE(24);
      const dataBytes = bytes.length - 44;
      expect(dataBytes / (sampleRate * 2)).toBeGreaterThan(2);
    }
  });
});
