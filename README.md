# Atelier UI Template

## Build an Android APK

The web app can be packaged as a native Android app with Capacitor. Install
Android Studio with an Android SDK, then run this from PowerShell on Windows:

```powershell
npm run android:build
```

The script builds the web app, generates Android launcher icons from
`assets/logo.svg`, and writes a debug APK to
`artifacts/android/soundfaith-bible-debug.apk`. Copy that APK to your phone,
open it, and allow installation from that source when Android asks. This is a
debug build intended for direct installation; a Play Store release needs a
separately signed release build.

## Baltimore Catechism

The app includes Baltimore Catechism Nos. 1–3 as a searchable, offline reader
and as a local reference source for Sofi. Source coverage, import details, and
the implementation decisions are documented in the
[Baltimore Catechism implementation plan](docs/baltimore-catechism-implementation-plan.md).
Rebuild the normalized text with `python scripts/catechism/build_data.py` and
the Sofi search vectors with `npm run chat:catechism-index`.

## Summa Theologiae

The Summa reader at `#/summa` follows the Torch & Lily data structure through
all five parts, 611 questions, and 3,076 articles. It presents each article's
objections, *sed contra*, *respondeo*, and replies, with links to individual
questions and articles. The source snapshots are the compressed JSON files in
`public/data/summa/` from the
[Torch & Lily open data repository](https://github.com/joshx2415/torch-data).
The reader loads and decompresses those files when opened, keeping them out of
the app's initial bundle.

## Saints of the day

The offline saints catalogue in `src/data/saints.json` is sourced from the
[Torch & Lily saints dataset](https://github.com/joshx2415/torch-data). It
includes feast days, biographies, ranks, patronage, and source quotations. The
app uses those records for the daily saint, searchable grouped catalogue, and
individual saint pages; it does not generate biographies. Torch & Lily asks
projects to link back to its site when practical; the Saints pages include
source and project links.

Saint narration is one MP3 per saint slug. The script uses the app's male
`am_michael` and female `af_heart` voices, skips existing local MP3s, and
uploads each voice to its own `saints-narration-<voice>` GitHub Release. To
generate and upload the full catalogue:

```powershell
python scripts/saint_narration.py --voice am_michael --upload-github --execute
python scripts/saint_narration.py --voice af_heart --upload-github --execute
```

Generation requires Kokoro, SoundFile, NumPy, and FFmpeg. Uploading also
requires GitHub CLI authenticated for `soundfaith/bible`.
Install the Python packages with `python -m pip install kokoro soundfile numpy`,
make FFmpeg available on PATH, and run `gh auth login` before uploading.

The uploader asks for `UPLOAD SAINTS` before publishing. To process one saint,
pass a slug prefix with `--only`, for example:

```powershell
python scripts/saint_narration.py --voice am_michael --only st-john-cantius --upload-github --execute
```

List available slugs or preview the number of files without generating audio:

```powershell
python scripts/saint_narration.py --list
python scripts/saint_narration.py --voice af_heart --plan
```

## Bible Journey period narrations

The 12 narration scripts live in `scripts/period_narrations.json`; their
selected passages are resolved from the same local Bible text used by the app.
One runner generates story WAV files with Kokoro, converts them to MP3 with
FFmpeg, uploads them to GitHub Releases, and checks that remote MP3 responses
contain playable MPEG audio frames. Playback uses GitHub MP3s when available,
then falls back to browser text-to-speech. On a period page, Listen plays its
story MP3s in order. Choose a story with its play button on desktop or the
vertical story dots on mobile.

## Bible chapter narrations

Use the voice preference in the navigation menu to choose male or female
narration. Playback tries the preferred voice's GitHub MP3 first, then the
other available voice, and finally browser text-to-speech. Existing
`narration-<book>` releases contain the `am_michael` recordings.
`generate_bible_narration.py` writes `af_heart` MP3s to separate
`narration-<book>-af_heart` releases, so the male releases are not replaced.
The generator can target specific chapters from
`scripts/audio_regeneration_plan.json`, regenerate either voice, and replace
same-named GitHub assets even when the new MP3 happens to have the same size:

```powershell
python scripts/generate_bible_narration.py --chapter-plan scripts/audio_regeneration_plan.json --voice am_michael --plan
python scripts/generate_bible_narration.py --chapter-plan scripts/audio_regeneration_plan.json --voice am_michael --overwrite --upload-github --replace-existing --execute
python scripts/generate_bible_narration.py --chapter-plan scripts/audio_regeneration_plan.json --voice af_heart --overwrite --upload-github --replace-existing --execute
```

The checked-in plan lists all 437 affected book chapters and 35 affected
Journey stories. `--overwrite` regenerates the selected WAV and MP3 files from
the corrected JSON. With `--upload-github`, each chapter is uploaded to the
selected voice's book release and remotely checked after local validation.
The runner asks for a confirmation phrase before generation and publishing,
validates local MP3 frames, and verifies each uploaded asset.

Journey passage text is resolved from the same `src/data/<book>.json` files as
the Bible reader; `src/data/bibleJourney.ts` stores story summaries and Bible
references, not a second copy of the verses. Journey stories also have their
own MP3s. Regenerate and replace the 35 affected story assets for both voices
after the chapter audio upload is finished:

```powershell
python scripts/regenerate_journey_audio.py --plan
python scripts/regenerate_journey_audio.py --execute
```

The Journey script rebuilds only affected stories from the updated verse JSON,
replaces the selected assets in both `journey-narration-am_michael` and
`journey-narration-af_heart`, and verifies each remote MP3. It prompts for
`REGENERATE JOURNEY AUDIO AM_MICHAEL AF_HEART` before generating or uploading.

List the periods, available voices, and validate all citations without creating
audio:

```powershell
python scripts/period_narration.py --list
python scripts/period_narration.py --plan
```

Install Kokoro and SoundFile for generation, and make FFmpeg available on PATH
(or place `ffmpeg.exe` in the project root). Generate and convert all periods
with the selected voice, or choose any voice listed by `generate_narration.py`:

```powershell
python -m pip install kokoro soundfile
python scripts/period_narration.py --voice am_michael
python scripts/period_narration.py --voice af_heart --period love-given-to-the-end
```

Audio is stored at `narration/periods/<voice>/period-NN-story-NN.wav` and
`.mp3`. Existing files are skipped unless `--overwrite` is supplied. To upload
selected MP3s to GitHub Releases, install `requirements-upload.txt`, authenticate
GitHub CLI with `gh auth login`, and use:

```powershell
python -m pip install -r requirements-upload.txt
python scripts/period_narration.py --voice af_heart --upload-github --validate-remote github --execute
```

The runner creates or updates one GitHub Release per voice. A remote validation
failure returns a non-zero exit code. Use `--skip-generate --skip-convert` to
upload already prepared MP3s. Check existing GitHub uploads without generating
audio or requiring local files with:

```powershell
python scripts/period_narration.py --voice af_heart --validate-only --validate-remote github
```

## Upload narration to Internet Archive

The backup upload script creates one Archive.org item per book folder under
`narration/male`. It uses each book's `archiveItemId` from
`src/data/index.json` (for example, `sf_ezra`). Every book with a local folder
of MP3 files is considered for upload. Books without local MP3 files are
skipped automatically.

Install the uploader dependency and preview the upload list:

```powershell
python -m pip install -r requirements-upload.txt
python scripts/upload_to_archive.py --dry-run
```

To upload one book first, use Ezra as a small sample:

```powershell
python scripts/upload_to_archive.py --only ezra
```

After that, omit `--only` to upload all books with local MP3 files.

When prompted, enter your Internet Archive S3 access and secret keys. The
prompts hide the keys, and they are not written to a file. Alternatively, set
`IA_ACCESS_KEY` and `IA_SECRET_KEY` in your current PowerShell session before
running the script; the script reads them from the environment. Review the listed
items and type `UPLOAD` to begin. Before each book, the script checks its
Archive.org file list and skips chapter filenames already present. It also
records each successful upload in `.archive_upload_state.json` after every
file. If a run stops, rerunning it checks both the remote item and that local
checkpoint, then sends only the remaining chapter files. The checkpoint is
ignored by Git and contains filenames and item IDs, not credentials.

To delete the 15 manually uploaded Archive.org items, preview the item IDs
first:

```powershell
python scripts/delete_manual_uploads.py
```

The script uses the explicit Archive.org IDs in its deletion list (for
example, Genesis is `1_20261001`) and does not look them up in the project
index. When the list is correct, run with `--execute`. The script asks for your
Internet Archive S3 keys and requires typing `DELETE 15 ITEMS`.
For each successful deletion, it removes that item's entry from the local
upload checkpoint so the uploader can send its chapters again. Deletion
removes the files from the Archive.org items; Archive.org system metadata may
remain.

A frontend-only React and Vite template for building thoughtful, consistent digital products. It keeps a warm editorial visual language, reusable cards, buttons, tabs, forms, upload boxes, modals, responsive navigation, and reference pages without a required backend.

## Run locally

```bash
npm install
npm run dev
```

## Customize the identity

Update the CSS variables at the top of `src/styles.css` to change the palette, fonts, corner radius, and shadows. Replace the sample content in `src/lib/template.ts` and the brand in `src/components/Brand.tsx`.

## Included reference screens

- Landing page with hero, featured cards, process section, and footer
- Searchable project library with category tabs
- Project detail page with progress and support modal
- Multi-section create form with upload box and confirmation state
- Profile page with preference controls
- Reference page with reusable list and upload patterns

The app uses hash routes so each screen can be opened directly while remaining easy to adapt to a router later.



$env:PATH = 'C:\Program Files\GitHub CLI;C:\Users\rmosi\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin;' + $env:PATH
$env:HF_HUB_OFFLINE = '1'
'UPLOAD BIBLE AF_HEART' | & 'C:\Users\rmosi\AppData\Local\bible-narration-venv\Scripts\python.exe' -u 'D:\projects\bible\scripts\generate_bible_narration.py' --upload-github --execute






-- regenerate missing verses with smart resume

python scripts/generate_bible_narration.py --chapter-plan scripts/audio_regeneration_plan.json --voice am_michael --plan
python scripts/generate_bible_narration.py --chapter-plan scripts/audio_regeneration_plan.json --voice am_michael --overwrite --upload-github --replace-existing --execute
python scripts/generate_bible_narration.py --chapter-plan scripts/audio_regeneration_plan.json --voice af_heart --overwrite --upload-github --replace-existing --execute


-- regenerate journey
python scripts/regenerate_journey_audio.py --plan
python scripts/regenerate_journey_audio.py --execute


## Breviary

Lauds, Vespers and Compline are assembled in `src/lib/breviary.ts` from `src/data/breviary.json` (imported once from the breviary project with `python scripts/build_breviary_data.py`). Psalms use this app's own text and audio.

Narration clips for the repeating prayers (460 per voice) are generated once and joined at playback:

```powershell
python scripts/breviary_narration.py --list
python scripts/breviary_narration.py --voice am_michael
python scripts/breviary_narration.py --voice af_heart
python scripts/breviary_narration.py --voice am_michael --upload-github --execute
python scripts/breviary_narration.py --voice af_heart --upload-github --execute
```

Clips upload to the `breviary-narration-<voice>` releases. Until they exist, playback falls back to browser speech.

Hour introductions use the same releases and voice fallback:

```powershell
python scripts/breviary_intro_narration.py --list
python scripts/breviary_intro_narration.py --voice am_michael --upload-github --execute
python scripts/breviary_intro_narration.py --voice af_heart --upload-github --execute
```


## Rosary

The Rosary is available from the home page and `#/rosary`. It includes the four
mystery sets, a guided prayer, and Traditional and Gospel modes. The audio
progress bar has seven selectable parts: the opening, five mysteries, and the
ending. Each prayer plays from its own MP3, with repeated prayers reusing the
same track; Gospel mode adds one reading before each decade. Playback tries the
selected voice's GitHub release, then the other supported voice, and falls back
to browser speech.

Generate the eight shared prayer recordings, twenty mystery announcements, and
twenty Gospel readings per voice with Kokoro and FFmpeg, then upload each voice
to its own GitHub Release. Existing local WAV/MP3 files are reused by default.
Uploads require `--execute` and a typed confirmation:

```powershell
python scripts/rosary_narration.py --list
python scripts/rosary_narration.py --voice am_michael
python scripts/rosary_narration.py --voice af_heart
python scripts/rosary_narration.py --voice am_michael --upload-github --execute
python scripts/rosary_narration.py --voice af_heart --upload-github --execute
```

If a narration run for the original clips is already in progress, let it finish,
then add just the new mystery announcements without revisiting the existing
clips:

```powershell
python scripts/rosary_narration.py --voice am_michael --only mystery- --upload-github --execute
python scripts/rosary_narration.py --voice af_heart --only mystery- --upload-github --execute
```

Install `kokoro`, `soundfile`, and `numpy`, make FFmpeg available on PATH, and
authenticate GitHub CLI with `gh auth login` before uploading. Recordings are
stored under `narration/rosary/<voice>` and uploaded to
`rosary-narration-<voice>` releases.

## Journey intro
python scripts/period_intro_narration.py --voice am_michael --upload-github --execute
python scripts/period_intro_narration.py --voice af_heart --upload-github --execute



- complete bible m/f, and journey
- regenerate fixed chapters
- generate and upload breviary

prompts
- fix all mp3s for ios
- fix artwork in pages, zoomed


python scripts/saint_narration.py --voice am_michael --upload-github --execute
python scripts/saint_narration.py --voice af_heart --upload-github --execute


python -m pip install --upgrade torch-directml
python -c "import torch_directml; print(torch_directml.device())"
