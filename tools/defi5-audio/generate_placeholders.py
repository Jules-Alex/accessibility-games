#!/usr/bin/env python3
"""Génère les extraits audio PROVISOIRES du défi 5 (bibliothèque standard seulement).

- 04-alerte-sirene.wav : une sirène synthétique (balayage sinusoïdal 1000 ± 300 Hz à 1,5 Hz), reconnaissable une fois étouffée.
- 01, 02, 03, 05 et test-echantillon : un bourdonnement rythmé qui imite le débit d'une phrase (une syllabe par
  mot). Ce sont des PLACEHOLDERS : ils permettent de tester le défi mais ne disent rien. Les remplacer par de
  vrais enregistrements (voir README.md).

Les fichiers déjà présents (vrais enregistrements déposés sous les mêmes noms, sirène comprise) sont CONSERVÉS :
ils ne sont réécrits qu'avec --force.

Usage : python3 tools/defi5-audio/generate_placeholders.py [--force] [--out DOSSIER]   (depuis accessibility-games-app/)
"""
import argparse
import math
import pathlib
import struct
import wave

RATE = 11025
DEFAULT_OUT = pathlib.Path(__file__).resolve().parents[2] / 'apps' / 'web' / 'public' / 'audio' / 'defi5'


def write_wav(path, samples):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', max(-32767, min(32767, int(s * 32767)))) for s in samples))


def siren(seconds=3.0):
    out = []
    phase = 0.0
    for i in range(int(RATE * seconds)):
        t = i / RATE
        freq = 1000 + 300 * math.sin(2 * math.pi * 1.5 * t)
        phase += 2 * math.pi * freq / RATE
        envelope = min(1.0, t / 0.05, (seconds - t) / 0.05)
        out.append(0.5 * envelope * math.sin(phase))
    return out


def hum(words, base=140.0):
    out = []
    syllable = int(RATE * 0.22)
    gap = int(RATE * 0.08)
    for w in range(words):
        pitch = base * (1 + 0.15 * math.sin(w * 1.7))
        for i in range(syllable):
            t = i / RATE
            envelope = math.sin(math.pi * i / syllable) ** 2
            tone = sum(math.sin(2 * math.pi * pitch * k * t) / k for k in (1, 2, 3, 4))
            out.append(0.25 * envelope * tone / 2)
        out.extend([0.0] * gap)
    return out


# Nombre de mots de chaque transcription (voir surdite-content.ts).
CLIPS = {
    '01-nom.wav': 13,
    '02-dossier.wav': 8,
    '03-jour.wav': 14,
    '05-confirmation.wav': 19,
    'test-echantillon.wav': 14,
}

def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--force', action='store_true', help='réécrit aussi les fichiers déjà présents')
    parser.add_argument('--out', type=pathlib.Path, default=DEFAULT_OUT, help='dossier de sortie (défaut : public/audio/defi5)')
    args = parser.parse_args()
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    clips = {'04-alerte-sirene.wav': siren(), **{name: None for name in CLIPS}}
    for name in sorted(clips):
        path = out / name
        if path.exists() and not args.force:
            print(f'ignoré  {path} (déjà présent ; --force pour réécrire)')
            continue
        write_wav(path, clips[name] if clips[name] is not None else hum(CLIPS[name]))
        print(f'écrit   {path}')


if __name__ == '__main__':
    main()
