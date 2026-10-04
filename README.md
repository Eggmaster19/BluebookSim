# Bluebook Simulator

A local-first Progressive Web App (PWA) that provides an authentic, 1:1 simulation of the College Board's Bluebook digital testing environment.

## Overview

Bluebook Simulator allows students and educators to practice official AP exams within the exact interface, constraints, and toolset of the real digital exam application.

## Key Features

- **Authentic Bluebook Testing Engine**: Replicates Bluebook's split-pane stimulus layout, collapsible timer (with red 5-minute alert), answer eliminator, question review grid, check-your-work screens, and scheduled break workflows.
- **26 Supported AP Subjects**: Pre-configured section structures, official module directions, timing constraints, and calculator policies across Humanities, STEM, Social Sciences, Computer Science, and AP Career Kickstart.
- **Embedded Tools**: Built-in Desmos Graphing & Scientific Calculator overlays and full KaTeX mathematical typesetting.
- **Active Annotations**: Full text highlighting with persistent notes panel for passage analysis.
- **Faithful Figures & Media Manifest**: Integrated PDF viewer and interactive figure-cropping utility to capture diagrams directly from source exam PDFs.
- **AI-Powered Exam Ingestion**: Automated PDF-to-exam conversion via Google Gemini API or copy-paste prompt generator for external LLMs.
- **Privacy & Offline Persistence**: 100% client-side application using IndexedDB for local storage of in-progress exams, history, and configuration. Zero telemetry, no external database required.

## Tech Stack

- **Framework**: React 19, TypeScript, Vite
- **Styling**: Pure CSS replicating Bluebook design tokens
- **Math & Charts**: KaTeX, Function Plot, Mermaid.js
- **State & Storage**: Zustand, IndexedDB (`idb-keyval`)
- **PDF & Media**: `pdfjs-dist`, HTML5 Canvas cropper

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Eggmaster19/BluebookSim.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```
