# Atelier UI Template

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


## Journey intro
python scripts/period_intro_narration.py --voice am_michael --upload-github --execute
python scripts/period_intro_narration.py --voice af_heart --upload-github --execute



- complete bible m/f, and journey
- regenerate fixed chapters
- generate and upload breviary

prompts
- fix all mp3s for ios
- fix artwork in pages, zoomed