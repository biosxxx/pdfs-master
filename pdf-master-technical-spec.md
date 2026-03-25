# Technical Specification
## PDF Master — Client-Side PDF Processing Application for cadautoscript.com

**Project type:** Web application  
**Deployment target:** `https://cadautoscript.com/utilities/pdf-master/`  
**Execution model:** 100% client-side in Chromium-based browsers  
**Primary goal:** Build a fast, maintainable, privacy-friendly PDF utility for simple PDF processing directly in the browser, with an architecture ready for progressive WASM enhancement.

---

## 1. Executive Summary

This document defines the optimal implementation scenario for a modern browser-based PDF processing application called **PDF Master**.

The recommended approach is:

- Keep the main website on its current portal architecture.
- Build PDF Master as an **isolated React + TypeScript + Vite application** inside the same repository.
- Use a **hybrid PDF architecture**:
  - **`pdf-lib`** for PDF writing and page manipulation
  - **`pdfjs-dist`** for document loading and preview rendering in version 1
  - Optional **PDFium WASM adapter** in a later phase for faster rendering, text extraction, and advanced browser-side processing
- Deploy the built application as static assets to the existing route:
  - `/utilities/pdf-master/`

This path minimizes migration risk, avoids unnecessary new dependencies, preserves the existing site structure, and provides a strong foundation for future WASM-based optimization.

---

## 2. Recommended Development Scenario

### 2.1 Final Recommendation

The application shall be developed as a **standalone sub-application** inside the existing website repository.

### 2.2 Why This Is the Optimal Scenario

This approach is optimal because it:

1. Reuses the existing web portal and deployment flow.
2. Avoids a full site migration.
3. Keeps the PDF tool isolated from the documentation portal code.
4. Supports modern React development patterns.
5. Supports Web Workers and WASM assets cleanly.
6. Enables gradual adoption of WASM without blocking delivery of version 1.
7. Minimizes the number of new libraries introduced into the project.

### 2.3 Architecture Decision

**Approved architecture:**

- **Portal shell:** Existing website
- **PDF application:** React + TypeScript + Vite sub-app
- **State management:** Zustand
- **Styling:** Tailwind CSS
- **Animation (minimal):** Framer Motion
- **Primary PDF editing engine:** `pdf-lib`
- **Preview/rendering engine (V1):** `pdfjs-dist`
- **Optional rendering/text extraction engine (V2+):** PDFium WASM
- **Heavy processing isolation:** Web Workers

---

## 3. Project Goals

### 3.1 Primary Goals

The application must:

1. Process simple PDF files fully in the browser.
2. Avoid server-side PDF upload for core operations.
3. Deliver fast interaction for common page-based workflows.
4. Be maintainable, modular, and ready for future feature expansion.
5. Be optimized for Chromium-based browsers.
6. Fit cleanly into the existing `cadautoscript.com` portal structure.

### 3.2 Product Positioning

Version 1 should be positioned as a:

- **PDF workspace**
- **PDF organizer**
- **Page manipulation tool**
- **Form helper**
- **Client-side PDF utility**

It should **not** be positioned as a full Adobe-class editor.

---

## 4. Non-Goals

The first production version shall **not** include:

1. OCR
2. Certified digital signatures
3. Advanced annotation editing
4. Secure redaction with forensic guarantees
5. Full desktop-grade editing of arbitrary PDF internals
6. Server-side conversion pipelines
7. Multi-user collaboration

These may be considered in future versions only after the browser-side architecture is stable.

---

## 5. Target Users

Primary users include:

- Engineers
- CAD users
- Technical documentation users
- Users combining, splitting, rotating, and exporting drawing sets
- Users extracting selected pages from PDF packages
- Users filling or flattening simple forms

---

## 6. Functional Scope for Version 1

### 6.1 Core Features

The application shall support the following features in version 1:

1. Import one or multiple PDF files
2. Display document list
3. Display page thumbnails
4. Reorder pages by drag and drop
5. Delete selected pages
6. Rotate selected pages
7. Merge multiple PDFs into one output
8. Split a PDF by page ranges
9. Extract selected pages into a new PDF
10. Export a reordered PDF
11. Display basic document metadata
12. Fill simple AcroForm fields
13. Flatten completed forms
14. Download the resulting PDF locally

### 6.2 Secondary Features

The application should also support:

1. Multi-selection of pages
2. “Select all pages” within a document
3. Per-document page grouping
4. Export progress state
5. Error handling for broken or unsupported files
6. Cancelable long-running operations where practical

---

## 7. Browser and Platform Requirements

### 7.1 Supported Browsers

Primary support target:

- Chromium-based browsers

Secondary support target:

- Recent Firefox
- Recent Safari, best effort only

### 7.2 Execution Model

All core PDF processing must run:

- In the browser
- On the client machine
- Without uploading source files to a server

### 7.3 Privacy Requirement

User PDF data must remain local to the browser for all core operations.

---

## 8. Technology Stack

## 8.1 Required Stack

The application shall use:

- **React**
- **TypeScript**
- **Vite**
- **Zustand**
- **Tailwind CSS**
- **pdf-lib**
- **pdfjs-dist**
- **Web Workers**

## 8.2 Optional Phase 2 Stack

The application may later add:

- **PDFium WASM**
- **Virtualized page grid/list rendering**
- **IndexedDB caching for large sessions**
- **PWA support**, only if needed

## 8.3 Libraries to Avoid Unless Strictly Necessary

The project should avoid introducing unnecessary heavy dependencies, especially:

- New state libraries
- New UI frameworks
- Full PDF editor frameworks
- Server-dependent PDF pipelines
- Commercial or license-risk PDF engines unless explicitly approved

---

## 9. High-Level Architecture

### 9.1 Architectural Principles

The codebase must follow these principles:

1. UI must be separated from PDF processing logic.
2. PDF engine access must be abstracted behind adapters.
3. Heavy operations must not block the main thread.
4. Rendering and exporting must be isolated.
5. The app must be replaceable or extensible at the engine layer.
6. The app must be deployable as static files.

### 9.2 High-Level Layers

The application shall be split into the following layers:

1. **Presentation layer**
   - React components
   - User interaction
   - Layout and controls

2. **Application state layer**
   - Zustand store
   - UI state
   - document/page selection state
   - job/progress state

3. **Domain layer**
   - file/page models
   - commands
   - business rules
   - validation

4. **Adapter layer**
   - PDF reading adapter
   - PDF writing adapter
   - optional WASM engine adapter

5. **Worker layer**
   - preview rendering worker
   - ingest/parsing worker
   - export worker

6. **Persistence/cache layer**
   - in-memory caches
   - optional IndexedDB in later phases

---

## 10. Recommended Repository Structure

```text
apps/
  pdf-master/
    src/
      app/
        App.tsx
        routes.ts
      components/
        DropZone/
        Toolbar/
        PageGrid/
        PageList/
        DocumentList/
        Inspector/
        ExportDialog/
        ProgressBar/
        EmptyState/
      store/
        pdfStore.ts
        selectors.ts
      domain/
        types.ts
        commands.ts
        validation.ts
        errors.ts
      adapters/
        reader/
          pdfjsReader.ts
          pdfiumReader.ts
        writer/
          pdfLibWriter.ts
      services/
        importPdf.ts
        exportPdf.ts
        thumbnailQueue.ts
        selectionService.ts
        metadataService.ts
        formService.ts
      workers/
        ingest.worker.ts
        render.worker.ts
        export.worker.ts
      utils/
        arrayBuffer.ts
        file.ts
        objectUrl.ts
        lru.ts
        promiseQueue.ts
    public/
      wasm/
        pdfium.wasm
    vite.config.ts
    tsconfig.json
    package.json

static/
  utilities/
    pdf-master/

src/
  components/
    PdfMasterEmbed.tsx

docs/
  utilities/
    pdf-master.mdx
```

---

## 11. Step-by-Step Development Plan

## Phase 1 — Foundation

### Step 1. Confirm Scope

Define the exact version 1 feature set:

- merge
- split
- rotate
- reorder
- delete
- extract pages
- export
- metadata
- fill forms
- flatten forms

**Output:** Approved feature scope.

### Step 2. Create the Sub-App

Create a dedicated `apps/pdf-master` Vite application inside the existing repository.

**Requirements:**
- TypeScript enabled
- React enabled
- Tailwind enabled
- Zustand installed
- basic routing optional
- build output configurable

**Output:** Running local sub-app.

### Step 3. Configure Static Build Target

Configure Vite so the application can be built for a nested public path:

- `/utilities/pdf-master/`

**Requirements:**
- correct `base` configuration
- asset paths must work in production
- worker files must resolve correctly
- optional WASM files must resolve correctly

**Output:** Production build works under nested route.

### Step 4. Add Docusaurus Integration

Expose the tool through the existing portal.

Recommended options:
1. iframe embedding of built static app
2. thin wrapper page pointing to static build

**Preferred option:** thin wrapper or dedicated page with clean route ownership.

**Output:** Tool opens from the current website.

---

## Phase 2 — Core Data Model

### Step 5. Define Domain Types

Create explicit TypeScript types for:

- source file
- document model
- page model
- selection model
- transform job
- export job
- form field model
- thumbnail state
- processing status
- error model

**Output:** Stable domain type layer.

### Step 6. Build Application Store

Implement Zustand store modules for:

- documents
- pages
- selected page IDs
- selected document IDs
- thumbnails
- processing jobs
- export status
- UI settings
- undo/redo history (optional for V1, preferred for V1.1)

**Output:** Predictable state layer.

### Step 7. Design Command-Based Operations

Represent page operations as explicit commands:

- addDocument
- removeDocument
- reorderPages
- rotatePages
- deletePages
- extractPages
- mergeDocuments
- splitDocument
- exportDocument
- updateFormFields
- flattenForm

**Output:** Clear action model independent of UI.

---

## Phase 3 — PDF Engine Layer

### Step 8. Implement Reader Adapter

Create a `PdfReader` interface with methods such as:

- `loadDocument(file)`
- `getPageCount()`
- `renderPageThumbnail(pageIndex, scale)`
- `getMetadata()`
- `getTextContent(pageIndex)` (optional in V1)
- `destroy()`

Implement version 1 using `pdfjs-dist`.

**Output:** Reader abstraction with `pdfjs-dist` implementation.

### Step 9. Implement Writer Adapter

Create a `PdfWriter` interface with methods such as:

- `mergeDocuments(inputs)`
- `extractPages(input, pages)`
- `deletePages(input, pages)`
- `rotatePages(input, pages, degrees)`
- `reorderPages(input, newOrder)`
- `fillForm(input, values)`
- `flattenForm(input)`
- `save()`

Implement version 1 using `pdf-lib`.

**Output:** Writer abstraction with `pdf-lib` implementation.

### Step 10. Prepare Optional WASM Adapter

Design the reader adapter so a later implementation can be added for PDFium WASM without changing UI code.

**Requirements:**
- same interface
- no UI dependence on engine-specific objects
- separate capability flags

**Output:** WASM-ready engine boundary.

---

## Phase 4 — Import and Preview Pipeline

### Step 11. Implement File Import Service

Support:

- drag and drop
- file picker
- multiple PDF import
- file type validation
- basic size validation
- corrupted file detection

**Output:** Reliable import flow.

### Step 12. Parse Documents in Background

Move document parsing work to a Web Worker where practical.

The main thread must remain responsive during file ingestion.

**Output:** Background import architecture.

### Step 13. Build Thumbnail Queue

Create a controlled thumbnail rendering queue.

Requirements:
- do not render all thumbnails at once
- support concurrency limits
- prioritize visible thumbnails
- allow cancellation when documents are removed

**Output:** Scalable preview generation.

### Step 14. Implement Lazy Rendering

Only render thumbnails when needed.

Recommended techniques:
- IntersectionObserver
- viewport-based scheduling
- cache and reuse rendered previews

**Output:** Good performance on large files.

---

## Phase 5 — Page Interaction

### Step 15. Build Page Grid/List UI

Create components for:

- document group list
- page grid
- selected state
- drag handles
- rotate controls
- delete action
- status badges

**Output:** Interactive page workspace.

### Step 16. Add Multi-Selection

Support:

- single selection
- multi-selection
- range selection
- select all pages in document
- deselect all

**Output:** Efficient page selection UX.

### Step 17. Add Drag-and-Drop Reordering

Support page reordering:
- within one document
- across imported documents for final merge order

**Output:** Page ordering workflow works visually and logically.

---

## Phase 6 — Export Pipeline

### Step 18. Optimize Merge Logic

The export pipeline must not reload the same source document for every page.

Instead:
- group requested pages by source document
- load each document once
- copy pages in batches
- assemble final output once

**Output:** Efficient export architecture.

### Step 19. Move Export to Worker

Long-running export tasks should execute in a dedicated worker where possible.

Requirements:
- progress updates
- failure reporting
- downloadable result Blob
- memory cleanup after completion

**Output:** Non-blocking export process.

### Step 20. Implement Download Flow

Support:
- generated file naming rules
- direct download
- export success notification
- reset or continue editing after export

**Output:** Stable export user experience.

---

## Phase 7 — Forms and Metadata

### Step 21. Add Metadata Inspection

Display:
- file name
- page count
- PDF metadata if available
- form presence indicator

**Output:** Metadata panel.

### Step 22. Add Form Filling

Support basic AcroForm fields:
- text inputs
- checkboxes
- dropdowns
- radio buttons where supported

**Output:** Basic form editing.

### Step 23. Add Form Flattening

Allow the user to flatten completed forms before export.

**Output:** Flattened output PDF support.

---

## Phase 8 — Production Hardening

### Step 24. Add Error Handling and Recovery

Handle:
- invalid PDF
- encrypted/unsupported PDF
- memory pressure failures
- rendering failures
- partial import failures
- worker crashes

**Output:** Stable application behavior.

### Step 25. Add Performance Safeguards

Requirements:
- concurrency limits
- object URL cleanup
- canvas cleanup
- optional memory guards for very large documents
- avoid base64 thumbnail storage
- avoid full rerender of all page items

**Output:** Improved runtime stability.

### Step 26. Add Accessibility and Keyboard Support

Support:
- keyboard navigation
- visible focus states
- button labeling
- screen-reader-friendly controls where practical

**Output:** Better accessibility baseline.

---

## Phase 9 — Testing and Release

### Step 27. Add Unit Tests

Cover:
- domain commands
- page reorder logic
- export page mapping
- form value handling
- validation rules

**Output:** Tested core logic.

### Step 28. Add Integration Tests

Cover:
- file import
- merge flow
- split flow
- rotate flow
- delete flow
- export flow

**Output:** End-to-end workflow validation.

### Step 29. Add Browser Performance Tests

Measure:
- import time
- thumbnail render time
- export time
- UI responsiveness during long operations

**Output:** Performance baseline and regression control.

### Step 30. Build and Deploy

Build the Vite sub-app and publish the static assets into the website deployment path.

**Output:** Live route available at `/utilities/pdf-master/`.

---

## 12. Functional Requirements

### 12.1 File Import

The system shall:
- accept `.pdf` files only
- support multiple files
- reject unsupported input cleanly
- preserve document order initially

### 12.2 Thumbnail Preview

The system shall:
- render page thumbnails
- load thumbnails lazily
- cache thumbnails temporarily
- avoid blocking the UI

### 12.3 Page Operations

The system shall:
- rotate pages
- delete pages
- reorder pages
- extract selected pages
- merge pages from multiple documents

### 12.4 Export

The system shall:
- generate a downloadable PDF Blob
- support renamed export files
- preserve requested page order
- preserve form field values when applicable
- support form flattening

---

## 13. Non-Functional Requirements

### 13.1 Performance

The application should:
- stay responsive during import and export
- avoid unnecessary rerenders
- avoid loading the same document repeatedly in export
- support medium-size engineering PDFs with acceptable responsiveness

### 13.2 Maintainability

The codebase must:
- be modular
- isolate PDF engine logic
- isolate worker logic
- avoid large monolithic files
- support future engine replacement

### 13.3 Security and Privacy

The application must:
- process files locally
- avoid sending user PDFs to external services
- avoid hidden telemetry on PDF contents

### 13.4 Deployment

The application must:
- build as static files
- work under nested route deployment
- support cache-safe asset versioning

---

## 14. State Model Requirements

The application store should track:

- imported documents
- page entities
- selected page IDs
- current document order
- current page order
- render job queue
- thumbnail cache state
- export job state
- error notifications
- UI preferences

Example conceptual store shape:

```ts
type PdfAppState = {
  documents: Record<string, DocumentEntity>;
  pages: Record<string, PageEntity>;
  documentOrder: string[];
  pageOrderByDocument: Record<string, string[]>;
  selectedPageIds: string[];
  thumbnails: Record<string, ThumbnailState>;
  jobs: {
    ingest: JobState;
    render: JobState;
    export: JobState;
  };
  ui: {
    viewMode: 'grid' | 'list';
    activeDocumentId?: string;
  };
};
```

---

## 15. Worker Strategy

### 15.1 Required Workers

Recommended workers:

1. `ingest.worker.ts`
   - file parsing
   - metadata extraction
   - basic page inventory creation

2. `render.worker.ts`
   - thumbnail rendering
   - queue processing
   - cancellation support

3. `export.worker.ts`
   - merge/export operations
   - progress reporting
   - result Blob generation

### 15.2 Worker Rules

Workers must:
- communicate with the UI via typed messages
- return progress updates
- support cleanup
- avoid leaking object references

---

## 16. Adapter Interfaces

Example reader interface:

```ts
export interface PdfReader {
  loadDocument(file: File): Promise<LoadedDocument>;
  renderThumbnail(input: RenderThumbnailInput): Promise<Blob>;
  getMetadata(documentId: string): Promise<PdfMetadata>;
  destroy(documentId: string): Promise<void>;
}
```

Example writer interface:

```ts
export interface PdfWriter {
  merge(inputs: MergeInput[]): Promise<Uint8Array>;
  extractPages(input: ExtractInput): Promise<Uint8Array>;
  deletePages(input: DeleteInput): Promise<Uint8Array>;
  rotatePages(input: RotateInput): Promise<Uint8Array>;
  reorderPages(input: ReorderInput): Promise<Uint8Array>;
  fillForm(input: FillFormInput): Promise<Uint8Array>;
  flattenForm(input: FlattenFormInput): Promise<Uint8Array>;
}
```

---

## 17. UI Requirements

The interface should include:

1. Header / title section
2. File import zone
3. Document list
4. Page grid or list view
5. Selection toolbar
6. Transform toolbar
7. Metadata / inspector panel
8. Export dialog
9. Progress indicator
10. Error and warning notifications

The UI should remain simple and technical rather than decorative.

---

## 18. Code Quality Requirements

The project must enforce:

- TypeScript strict mode
- ESLint
- consistent naming
- small focused modules
- adapter boundaries
- domain-first logic for PDF operations
- no inline monolithic processing logic in UI components

---

## 19. Acceptance Criteria

The project will be considered ready for version 1 release when all of the following are true:

1. A user can import multiple PDFs.
2. A user can view page thumbnails.
3. A user can reorder pages.
4. A user can rotate selected pages.
5. A user can delete selected pages.
6. A user can extract selected pages into a new PDF.
7. A user can merge multiple PDFs into one output.
8. A user can export the result without UI freezing.
9. A user can fill and flatten simple forms.
10. The application runs from `/utilities/pdf-master/`.
11. The application works without server-side PDF upload.
12. The codebase is modular and split by responsibility.
13. The PDF engine layer can be replaced or extended later.

---

## 20. Future Enhancements

After version 1 is stable, future versions may add:

1. PDFium WASM reader adapter
2. better text extraction
3. image extraction
4. page virtualization
5. IndexedDB session persistence
6. annotation stamping
7. OCR pipeline
8. advanced search in extracted text
9. engineering document-specific page labeling
10. batch utility presets

---

## 21. Final Implementation Decision

### Approved Development Path

The project should be implemented as:

- **Existing portal remains unchanged as the main website**
- **A dedicated React + TypeScript + Vite PDF sub-app is added inside the same repository**
- **Version 1 uses `pdf-lib` + `pdfjs-dist`**
- **The architecture is prepared for an optional PDFium WASM adapter in later phases**
- **The sub-app is deployed as static assets to `/utilities/pdf-master/`**

This is the most practical, scalable, and low-risk solution for the current portal and for the intended PDF-processing use case.

---

## 22. Delivery Checklist

Before starting implementation, confirm:

- [ ] version 1 scope approved
- [ ] repository structure approved
- [ ] Vite sub-app creation approved
- [ ] worker-based processing approved
- [ ] `pdf-lib` + `pdfjs-dist` baseline approved
- [ ] optional PDFium WASM deferred to later phase
- [ ] deployment path approved
- [ ] acceptance criteria approved

---

## 23. Short Summary for Developers

Build **PDF Master** as a **standalone Vite React TypeScript app** inside the current repository, deploy it as static files to `/utilities/pdf-master/`, use **`pdf-lib`** for writing/editing, use **`pdfjs-dist`** for previews in version 1, isolate heavy work in **Web Workers**, and keep the architecture ready for a future **PDFium WASM** upgrade without changing the UI layer.
