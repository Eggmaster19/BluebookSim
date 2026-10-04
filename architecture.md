# Bluebook Simulator Architecture

A high-level architectural overview of the Bluebook Simulator Progressive Web App (PWA).

## Architectural Principles

1. **Local-First & Zero-Telemetry**: All exam processing, storage, and rendering occur entirely in the user's browser.
2. **Faithful Simulation**: 1:1 adherence to College Board's Bluebook digital layout, typography, controls, and section rules.
3. **Modular Ingestion Pipeline**: Decoupled parsing architecture supporting multi-batch LLM output, manual JSON entry, and automated Gemini API translation.

---

## System Workflow

```
[Course Selection] 
       │
       ▼
[Exam Ingestion] ◄─── (PDF Upload / Crop Manifest / Gemini API)
       │
       ▼
[Section Directions]
       │
       ▼
[Active Testing Stage] ◄─── (Desmos Calculator, KaTeX Math, Annotations)
       │
       ▼
[Check Your Work / Breaks]
       │
       ▼
[Score Summary & Local History] ───► (IndexedDB Persistence)
```

---

## Core Subsystems

### 1. Simulation Engine (`src/components/exam/`, `src/components/screens/`)
- **Main Stage**: Dynamic split-pane layout with draggable divider for passage-based items and single-pane for standalone questions.
- **Section Lifecycle**: Coordinates active testing, directional screens, scheduled breaks (dark mode), and unscheduled break locks.
- **Tool Suite**: Full integration of Desmos Graphing & Scientific calculators, KaTeX math typesetting, answer eliminators, and text highlighting with persistent notes.

### 2. State & Persistence Engine (`src/store/`)
- **Exam Store (`examStore.ts`)**: Central Zustand store managing active questions, user responses, review flags, eliminated options, section timers, and UI modal states.
- **IndexedDB Storage (`idbStorage.ts`)**: Asynchronous local persistence preserving test progress across page reloads and browser restarts.
- **History Store (`historyStore.ts`)**: Stores completed exam attempts and question-level review logs locally.

### 3. Ingestion & Media Pipeline (`src/utils/`, `src/components/common/`)
- **Exam Parser (`examParser.ts`)**: Sanitizes and validates question schemas, infers module groupings, stitches multi-batch inputs, and maps subject configurations.
- **Media Walker (`mediaWalker.ts`)**: Traverses question trees to detect image placeholders (`IMG_#`) and link them to user-cropped image blobs.
- **PDF Cropper (`PdfViewerCropper.tsx`)**: Canvas-based PDF viewer powered by `pdfjs-dist` for high-resolution diagram capture.
- **Gemini Converter (`geminiDirectConverter.ts`)**: Client-side adapter leveraging Gemini 2.5 Flash for end-to-end PDF-to-exam conversion.

### 4. Subject Configuration Registry (`src/data/common/`)
- **Section Config (`sectionConfig.ts`)**: Configures official timing, question counts, calculator policies, and question formats across 26 AP courses.
- **Directions Templates (`directionsTemplate.ts`)**: Official College Board instructions for digital and hybrid administrations.
