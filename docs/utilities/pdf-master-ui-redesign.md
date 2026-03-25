# PDF Master UI Redesign

## Desktop layout structure
- Top app bar: compact 56-64 px command surface with import/export/merge/split actions, search, view mode, thumbnail density, contextual selection actions, and inspector toggle.
- Left document pane: 264 px expanded / 72 px collapsed on desktop; temporary sheet below `xl`.
- Center workspace: dense thumbnail canvas with per-document grouping, drag reorder, and minimal empty/search states.
- Right inspector pane: 344 px fixed pane on desktop; temporary side sheet below `xl`.
- Bottom status bar: slim operational strip for documents, pages, selection, and background jobs.

## Component map
- `App`: shell orchestration, pane behavior, import/export/delete flows.
- `Toolbar`: top app bar and contextual actions.
- `DocumentList`: document tree, quick actions, collapse state, drag reorder.
- `PageGrid`: grouped thumbnail workspace, density modes, page actions, drag reorder.
- `Inspector`: metadata, file info, form editing, flatten toggle.
- `StatusBar`: slim job and workspace status line.
- `ConfirmDialog`: delete confirmation.
- `ExportDialog`: compact export/split dialog.
- `DropZone` and `EmptyState`: embedded empty-workspace entry point.

## Responsive behavior
- `xl` and above: 3-pane desktop workspace.
- Below `xl`: center workspace stays primary; documents and inspector switch to temporary side sheets.
- Small screens: one-pane working flow with temporary panels instead of permanent sidebars.

## Design tokens
- Spacing base: 8 px rhythm using 8 / 12 / 16 / 24 px increments.
- Radius: 8 px (`rounded-lg`), 12 px (`rounded-xl`), 16 px (`rounded-2xl`) for dialogs only.
- Typography: IBM Plex Sans, 11 px section labels, 14 px workspace text, 16-20 px headings.
- Icon sizes: 14-16 px inside 28-32 px hit areas.
- Color: neutral gray shell with blue accent (`--pm-accent`, `--pm-accent-strong`) and subtle blue selection state.

## Before / after summary
- Before: large hero header, card-heavy marketing composition, separated action zones, oversized empty states.
- After: continuous editor shell, toolbar-first hierarchy, denser page canvas, contextual bulk actions, compact dialogs, and pane-based navigation.

## Prototype
- The implemented React UI itself is the clickable prototype and can be launched with `npm run dev` at `/utilities/pdf-master/`.
