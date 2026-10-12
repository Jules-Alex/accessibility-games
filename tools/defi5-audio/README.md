# Extraits audio du défi 5 (Malentendance)

Le défi joue 5 extraits (un par étape) plus un échantillon de test, dans `apps/web/public/audio/defi5/`. Le navigateur les
**dégrade lui-même** (filtre passe-bas, souffle, coupures aléatoires) : il faut donc fournir des enregistrements **propres**,
sans traitement.

## État actuel : extraits provisoires

`python3 tools/defi5-audio/generate_placeholders.py` (depuis `accessibility-games-app/`) génère :

- `04-alerte-sirene.wav` : une sirène synthétique (balayage sinusoïdal 1000 ± 300 Hz à 1,5 Hz), reconnaissable une fois étouffée.
- `01-nom.wav`, `02-dossier.wav`, `03-jour.wav`, `05-confirmation.wav`, `test-echantillon.wav` : un bourdonnement rythmé qui
  ne dit rien. Le défi fonctionne mécaniquement, mais on ne peut pas y répondre avec ces fichiers.

Le script **ne réécrit pas** un fichier déjà présent (il affiche « ignoré » ou « écrit » pour chacun), y compris
`04-alerte-sirene.wav` : relancer le script ne détruit donc pas de vrais enregistrements déposés sous les mêmes noms.
`--force` réécrit tout ; `--out DOSSIER` écrit ailleurs (pour essayer sans toucher aux fichiers publiés).

## À remplacer par de vrais enregistrements (voix française, mono, 3 à 8 s, volume homogène)

| Fichier | À dire |
|---|---|
| `01-nom.wav` | « Bonjour, ici Madame Dumont. Je vous laisse ce message au sujet de mon contrat. » |
| `02-dossier.wav` | « Mon numéro de dossier est le quatre-huit-un-deux. » |
| `03-jour.wav` | « Pouvez-vous me rappeler mardi à quatorze heures ? C'est le meilleur moment pour moi. » |
| `05-confirmation.wav` | « Pour confirmer le rappel, appuyez sur le bouton de droite. Pour annuler, appuyez sur celui de gauche. » |
| `test-echantillon.wav` | « Ceci est un test du son. Si vous m'entendez, même mal, vous pouvez commencer. » |

- Format : **MP3** ou **WAV 16 bits mono de 22 à 44,1 kHz**. Éviter `.ogg` : Safari et iOS ne le décodent pas toujours, et
  ces participants basculeraient en silence sur la transcription.
- Taille : ces fichiers sont publiés sur GitHub Pages et téléchargés pendant le jeu. Viser **environ 100 à 300 ko chacun**
  (un WAV 48 kHz / 24 bits pèse environ 1 Mo : le ré-échantillonner ou l'encoder en MP3).
- Garder les mêmes noms de fichiers. Si les enregistrements sont en `.mp3`, changer l'extension dans
  `libs/defis/surdite/src/lib/surdite-content.ts` (une seule ligne par extrait) et supprimer l'ancien `.wav`.
- Ces fichiers sont **publiés avec le code** : n'utiliser qu'une voix dont les droits permettent la publication.
- Les transcriptions ci-dessus sont celles que l'alternative « Besoin d'une alternative ? » affiche : si le texte dit change,
  changer aussi `surdite-content.ts`.
