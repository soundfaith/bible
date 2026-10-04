# Atelier UI Template

## Upload narration to Internet Archive

The upload script creates one Archive.org item per book folder under
`narration/male`. It uses each book's `narrationAudioBaseUrl` identifier from
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
