# PDF Master Workspace

PDF Master Workspace is a local-first PDF utility application built as a React + TypeScript + Vite project.
It lets users import PDF files, inspect metadata, render thumbnails, select and reorder pages, rotate or delete pages, fill simple AcroForms, preview an assembled PDF inside the app, and export the final result.

All heavy PDF processing is done in the browser. No server upload is required for the main workflow.

## Repository structure

This repository is a small workspace with one main app and two integration surfaces:

- `apps/pdf-master/` - the standalone PDF Master application.
- `src/components/PdfMasterEmbed.tsx` - iframe embed wrapper for the host site.
- `docs/utilities/` - utility documentation pages.
- `static/utilities/pdf-master/` - built static output.
- `pdf-master-technical-spec.md` - original technical task and feature scope notes.

## High-level architecture

The app follows a practical layered structure:

- `app/` - application shell, route entry, layout orchestration.
- `components/` - UI building blocks such as toolbar, document list, page grid, inspector, dialogs, notifications, and the embedded PDF viewer dialog.
- `store/` - Zustand store, global state, actions, and selectors.
- `domain/` - core types, workspace commands, validation, and error models.
- `services/` - app-level workflows such as import, export, metadata extraction, form field mapping, page selection logic, and thumbnail scheduling.
- `adapters/` - PDF engine integrations.
  - `reader/` uses `pdfjs-dist`.
  - `writer/` uses `pdf-lib`.
- `workers/` - browser workers for import, export, and thumbnail rendering.
- `utils/` - small shared helpers such as IDs, object URLs, file naming, promise queues, and caches.
- `test/` - fixtures and test setup.

## Main folders and important files

### Root

- `package.json` - workspace-level commands that proxy into the app.
- `README.md` - this file.
- `app.html` - integration shell page.

### App shell

- `apps/pdf-master/src/app/App.tsx` - main application composition and local UI state.
- `apps/pdf-master/src/app/routes.ts` - app routing entry.
- `apps/pdf-master/src/main.tsx` - React bootstrap.
- `apps/pdf-master/src/index.css` - global styles and design tokens.

### State and domain

- `apps/pdf-master/src/store/pdfStore.ts` - global Zustand store and actions.
- `apps/pdf-master/src/store/selectors.ts` - derived state helpers.
- `apps/pdf-master/src/domain/types.ts` - shared application types.
- `apps/pdf-master/src/domain/commands.ts` - pure workspace mutations.
- `apps/pdf-master/src/domain/validation.ts` - export and split validation helpers.
- `apps/pdf-master/src/domain/errors.ts` - typed error model.

### UI components

- `apps/pdf-master/src/components/Toolbar/Toolbar.tsx` - top app bar and contextual actions.
- `apps/pdf-master/src/components/DocumentList/DocumentList.tsx` - left-side document pane.
- `apps/pdf-master/src/components/PageGrid/PageGrid.tsx` - page thumbnail workspace.
- `apps/pdf-master/src/components/Inspector/Inspector.tsx` - right-side metadata and forms pane.
- `apps/pdf-master/src/components/PdfViewerDialog/PdfViewerDialog.tsx` - built-in modal PDF viewer.
- `apps/pdf-master/src/components/ExportDialog/ExportDialog.tsx` - export and split dialog.
- `apps/pdf-master/src/components/ConfirmDialog/ConfirmDialog.tsx` - confirm delete dialog.
- `apps/pdf-master/src/components/StatusBar/StatusBar.tsx` - slim operational status bar.
- `apps/pdf-master/src/components/Notifications/Notifications.tsx` - toast notifications.
- `apps/pdf-master/src/components/DropZone/DropZone.tsx` - file import UI.
- `apps/pdf-master/src/components/EmptyState/EmptyState.tsx` - minimal workspace empty state.

### PDF services and adapters

- `apps/pdf-master/src/adapters/reader/pdfjsReader.ts` - PDF reading, metadata access, and thumbnail fallback rendering.
- `apps/pdf-master/src/adapters/writer/pdfLibWriter.ts` - PDF writing and export operations.
- `apps/pdf-master/src/services/importPdf.ts` - ingest pipeline.
- `apps/pdf-master/src/services/exportPdf.ts` - export pipeline and worker bridge.
- `apps/pdf-master/src/services/thumbnailQueue.ts` - thumbnail scheduling, caching, worker fallback, and timeout handling.
- `apps/pdf-master/src/services/selectionService.ts` - single, additive, and range selection logic.
- `apps/pdf-master/src/services/formService.ts` - form field mapping helpers.
- `apps/pdf-master/src/services/metadataService.ts` - inspector metadata formatting.
- `apps/pdf-master/src/services/pdfInspection.ts` - PDF inspection helpers.

### Workers

- `apps/pdf-master/src/workers/ingest.worker.ts` - import worker.
- `apps/pdf-master/src/workers/export.worker.ts` - export worker.
- `apps/pdf-master/src/workers/render.worker.ts` - thumbnail rendering worker.
- `apps/pdf-master/src/workers/protocols.ts` - shared worker message contracts.

## Interface structure

The UI is organized like a compact desktop editor:

1. Top app bar
- Import, export, merge, split, search, display mode, thumbnail density.
- Contextual selection actions such as rotate, delete, clear selection.

2. Left document pane
- Imported documents list.
- Document activation.
- Document reorder by drag-and-drop.
- Select all pages per document.
- Split and remove actions.

3. Center workspace
- Dense page thumbnail grid or list.
- Page selection.
- Exact page toggling via thumbnail selection icon.
- Page reorder by drag-and-drop.
- Page preview click opens the built-in PDF viewer.

4. Right inspector pane
- File info.
- Metadata.
- Form field editing.
- Flatten-on-export toggle.

5. Viewer dialog
- Embedded assembled PDF viewer opened from page thumbnails.
- Expand and close actions.
- Open in browser and download actions.

6. Bottom status bar
- Document count.
- Page count.
- Selection count.
- Ingest and export progress.

## Main application state and variables

There are two main state layers: global store state and local app shell state.

### Global store state (`pdfStore.ts`)

Important store fields:

- `documents` - map of imported PDF documents.
- `pages` - map of all page entities in the workspace.
- `documentOrder` - current document order.
- `pageOrder` - current page order across the whole workspace.
- `pageOrderByDocument` - page order grouped by document.
- `selectedPageIds` - currently selected pages.
- `selectedDocumentIds` - selected documents derived from page selection.
- `anchorPageId` - anchor for range selection.
- `thumbnails` - thumbnail render state per page.
- `jobs` - worker/job progress for ingest, render, and export.
- `ui.viewMode` - `grid` or `list`.
- `ui.activeDocumentId` - currently focused document.
- `ui.exportDialogOpen` - export modal state.
- `ui.exportMode` - workspace, selection, or split export mode.
- `ui.exportFileName` - export base file name.
- `ui.splitRangeInput` - split range string.
- `notifications` - active toast messages.

Important store actions:

- `importDocuments()`
- `removeDocument()`
- `reorderDocuments()`
- `setActiveDocument()`
- `selectPage()`
- `selectAllDocumentPages()`
- `clearSelection()`
- `reorderPages()`
- `rotateSelectedPages()`
- `deleteSelectedPages()`
- `openExportDialog()`
- `closeExportDialog()`
- `setExportMode()`
- `setExportFileName()`
- `setSplitRangeInput()`
- `setThumbnailState()`
- `updateFormField()`
- `setDocumentFlattening()`
- `pushNotification()`

### Local app shell state (`App.tsx`)

Important local variables:

- `thumbnailDensity` - selected thumbnail size (`small`, `medium`, `large`).
- `searchQuery` - workspace page search text.
- `documentsPaneCollapsed` - desktop left pane compact mode.
- `documentsSheetOpen` - mobile/tablet left pane sheet state.
- `inspectorOpen` - inspector visibility state.
- `deleteDialog` - delete confirmation dialog state.
- `viewerDialog` - built-in PDF viewer state.
  - `open`
  - `expanded`
  - `loading`
  - `progress`
  - `pageNumber`
  - `title`
  - `pdfUrl`
  - `revision`
  - `error`
  - `loadingMessage`
- `workspaceRevision` - cached workspace signature used to reuse the assembled viewer PDF when nothing changed.
- `thumbnailMaxWidth` - per-density thumbnail rendering width.

## Main code flows

### Import flow

1. User drops or selects PDF files.
2. `handleImport()` starts the ingest job.
3. `importPdfFiles()` processes files and returns imported payloads.
4. Store action `importDocuments()` adds documents and pages to the workspace.
5. Notifications report success or per-file errors.

### Thumbnail flow

1. `PageGrid` requests thumbnails when cards enter the viewport.
2. `thumbnailQueue.requestThumbnail()` checks cache and pending work.
3. `render.worker` attempts worker-side thumbnail rendering.
4. If the worker is unavailable or times out, the queue falls back to `PdfjsReader.renderPageThumbnail()`.
5. The store updates each page thumbnail state to `loading`, `ready`, or `error`.

### Selection flow

1. `selectPage()` applies single, additive, or range selection.
2. `selectionService.ts` computes the next selection model.
3. Exact page picking can also be done through the small selection icon on each thumbnail.
4. Document-level `Select all` uses `selectAllDocumentPages()`.

### Viewer flow

1. Clicking a thumbnail opens the built-in viewer dialog.
2. The app generates an assembled workspace PDF by calling `runExport()` in `workspace` mode.
3. The generated blob is cached by `workspaceRevision`.
4. The embedded viewer opens on the clicked page number.

### Export flow

1. User opens the export dialog.
2. Export mode is resolved as workspace, selection, or split.
3. `runExport()` sends work to `export.worker.ts`.
4. `pdf-lib` writer logic produces one or more output PDFs.
5. Files are downloaded locally.

## User-facing functionality

### File management

- Import one or many PDF files.
- Keep all files local in the browser.
- Reorder source documents.
- Remove documents.

### Page operations

- Render page thumbnails.
- Open a full assembled PDF viewer from a page thumbnail.
- Select one page.
- Select multiple pages.
- Range select with Shift.
- Toggle pages into or out of selection.
- Select all pages in a document.
- Reorder pages by drag-and-drop.
- Rotate selected pages.
- Delete selected pages.

### Viewer features

- Built-in modal PDF viewer.
- Open on the clicked workspace page.
- Expand to a larger windowed mode.
- Open the same PDF in the browser viewer.
- Download the currently assembled PDF.
- Browser-native text search, text selection, and text copying inside the embedded viewer where supported.

### Metadata and forms

- Inspect file metadata.
- Inspect file size and page count.
- Edit supported AcroForm fields.
- Flatten form fields on export.

### Export modes

- Export full workspace.
- Extract only the current selection.
- Split an active document by custom ranges.

### Feedback and status

- Toast notifications.
- Background job progress.
- Import and export status.
- Error reporting for failed operations.

### Responsive behavior

- Desktop-first three-pane editor.
- Temporary side sheets for document pane and inspector on smaller screens.
- Embedded iframe host integration through `PdfMasterEmbed.tsx`.

## Technologies and library versions

### Runtime dependencies

- React `19.2.4`
- React DOM `19.2.4`
- TypeScript `~5.9.3`
- Vite `^8.0.1`
- Tailwind CSS `^4.1.17`
- `@tailwindcss/vite` `^4.1.17`
- Zustand `^5.0.8`
- pdf-lib `^1.17.1`
- pdfjs-dist `^5.5.207`
- Framer Motion `^12.23.24`
- clsx `^2.1.1`

### Development and testing

- ESLint `^9.39.4`
- `@eslint/js` `^9.39.4`
- `typescript-eslint` `^8.57.0`
- `eslint-plugin-react-hooks` `^7.0.1`
- `eslint-plugin-react-refresh` `^0.5.2`
- Vitest `^4.0.7`
- Testing Library React `^16.3.0`
- Testing Library User Event `^14.6.1`
- Testing Library Jest DOM `^6.9.1`
- jsdom `^27.2.0`
- `@vitejs/plugin-react` `^6.0.1`
- `@types/react` `^19.2.14`
- `@types/react-dom` `^19.2.3`
- `@types/node` `^24.12.0`

## Commands

### Root workspace commands

Run these from the repository root:

- `npm run dev`
  - Starts the PDF Master Vite dev server through the app workspace.
- `npm run build`
  - Builds the PDF Master app for production.
- `npm run preview`
  - Runs a local preview server for the built app.
- `npm run lint`
  - Runs ESLint on the app.
- `npm run test`
  - Runs the test suite once.
- `npm run test:watch`
  - Runs Vitest in watch mode.

### App-level commands

Run these from `apps/pdf-master/`:

- `npm run dev`
  - Starts Vite in development mode.
- `npm run build`
  - Runs TypeScript build and Vite production build.
- `npm run preview`
  - Starts Vite preview for the production build.
- `npm run lint`
  - Lints the app source.
- `npm run test`
  - Starts Vitest in interactive mode.
- `npm run test:run`
  - Runs Vitest once and exits.

## Testing

The repository includes:

- domain tests
- validation tests
- writer integration tests
- PDF inspection integration tests
- performance baseline tests

Main test helpers live in:

- `apps/pdf-master/src/test/setup.ts`
- `apps/pdf-master/src/test/pdfFixtures.ts`

## Notes

- The app is designed as a local-first browser PDF tool.
- Worker-based processing is used for better UI responsiveness.
- The built-in viewer uses an assembled PDF generated from the current workspace state.
- Some browser-native viewer features depend on the browser engine.
- Build output currently includes large `pdfjs` worker assets, so chunk-size warnings may appear during production builds.
