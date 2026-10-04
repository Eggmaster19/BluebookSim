import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Check, Crop as CropIcon, X } from 'lucide-react';
import type { MediaRequirement } from '../../utils/mediaWalker';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PdfViewerCropperProps {
  isOpen: boolean;
  pdfFile: File | null;
  requiredMedia: MediaRequirement[];
  activeMediaId: string | null;
  onSelectMediaId: (id: string) => void;
  onCropSaved: (mediaId: string, dataUrl: string) => void;
  onClose: () => void;
}

interface CropBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const PdfViewerCropper: React.FC<PdfViewerCropperProps> = ({
  isOpen,
  pdfFile,
  requiredMedia,
  activeMediaId,
  onSelectMediaId,
  onCropSaved,
  onClose,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [userPage, setUserPage] = useState<number | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.6);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Active requirement item
  const activeItem = requiredMedia.find((m) => m.id === activeMediaId) || requiredMedia[0];
  const currentPage = userPage ?? (activeItem?.page || 1);

  // Load PDF document whenever pdfFile changes
  useEffect(() => {
    if (!pdfFile) return;

    let isCancelled = false;
    const fileReader = new FileReader();

    fileReader.onload = async () => {
      try {
        const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to parse PDF document:', err);
        if (!isCancelled) setIsLoading(false);
      }
    };

    fileReader.readAsArrayBuffer(pdfFile);

    return () => {
      isCancelled = true;
    };
  }, [pdfFile]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Render current page to canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !isOpen) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Ignore cancellation error
      }
    }

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const task = page.render({
        canvas,
        canvasContext: context,
        viewport,
      });
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
        return;
      }
      console.error('Error rendering PDF page:', err);
    }
  }, [pdfDoc, currentPage, scale, isOpen]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Mouse drag selection handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setCropBox({ startX: x, startY: y, currentX: x, currentY: y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !cropBox || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setCropBox((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Execute crop from canvas
  const handleSaveCrop = () => {
    if (!cropBox || !canvasRef.current || !activeItem) return;

    const canvas = canvasRef.current;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x1 = Math.min(cropBox.startX, cropBox.currentX);
    const y1 = Math.min(cropBox.startY, cropBox.currentY);
    const w = Math.abs(cropBox.currentX - cropBox.startX);
    const h = Math.abs(cropBox.currentY - cropBox.startY);

    if (w < 10 || h < 10) return;

    // Scaling ratio between canvas resolution and displayed CSS size
    const ratioX = canvas.width / rect.width;
    const ratioY = canvas.height / rect.height;

    const sourceX = x1 * ratioX;
    const sourceY = y1 * ratioY;
    const sourceW = w * ratioX;
    const sourceH = h * ratioY;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = sourceW;
    cropCanvas.height = sourceH;
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);

    let dataUrl: string;
    try {
      dataUrl = cropCanvas.toDataURL('image/webp', 0.92);
    } catch {
      dataUrl = cropCanvas.toDataURL('image/png');
    }

    onCropSaved(activeItem.id, dataUrl);
    setCropBox(null);
    onClose();
  };

  if (!isOpen) return null;

  const boxX = cropBox ? Math.min(cropBox.startX, cropBox.currentX) : 0;
  const boxY = cropBox ? Math.min(cropBox.startY, cropBox.currentY) : 0;
  const boxW = cropBox ? Math.abs(cropBox.currentX - cropBox.startX) : 0;
  const boxH = cropBox ? Math.abs(cropBox.currentY - cropBox.startY) : 0;
  const hasValidSelection = boxW >= 15 && boxH >= 15;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
        color: '#ffffff',
      }}
    >
      {/* ── Top Header Toolbar ── */}
      <div
        style={{
          height: '60px',
          backgroundColor: '#161616',
          borderBottom: '1px solid #333',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        {/* Left: Active Item Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <CropIcon size={16} color="#ffd100" />
            <span style={{ color: '#ffd100' }}>Target:</span>
          </div>
          <select
            value={activeItem?.id || ''}
            onChange={(e) => {
              onSelectMediaId(e.target.value);
              setUserPage(null);
            }}
            style={{
              background: '#0a0a0a',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '5px 10px',
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {requiredMedia.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} {m.page ? `(Page ${m.page})` : ''} - {m.context}
              </option>
            ))}
          </select>
        </div>

        {/* Center: Page Navigation & Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Page nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => setUserPage(Math.max(1, currentPage - 1))}
              style={{
                background: '#242424',
                border: '1px solid #444',
                color: '#fff',
                borderRadius: '4px',
                padding: '5px 10px',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ fontSize: '13px', color: '#ccc', minWidth: '90px', textAlign: 'center' }}>
              Page <strong>{currentPage}</strong> of {numPages || '...'}
            </span>

            <button
              disabled={currentPage >= numPages}
              onClick={() => setUserPage(Math.min(numPages, currentPage + 1))}
              style={{
                background: '#242424',
                border: '1px solid #444',
                color: '#fff',
                borderRadius: '4px',
                padding: '5px 10px',
                cursor: currentPage >= numPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ width: '1px', height: '20px', background: '#333' }} />

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setScale((s) => Math.max(0.8, s - 0.2))}
              style={{
                background: '#242424',
                border: '1px solid #444',
                color: '#fff',
                borderRadius: '4px',
                padding: '5px 8px',
                cursor: 'pointer',
              }}
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span style={{ fontSize: '12px', color: '#aaa', minWidth: '42px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
              style={{
                background: '#242424',
                border: '1px solid #444',
                color: '#fff',
                borderRadius: '4px',
                padding: '5px 8px',
                cursor: 'pointer',
              }}
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setScale(1.6)}
              style={{
                background: '#242424',
                border: '1px solid #444',
                color: '#aaa',
                borderRadius: '4px',
                padding: '5px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right: Close Button */}
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid #444',
            color: '#ccc',
            borderRadius: '4px',
            padding: '6px 14px',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.2s',
          }}
        >
          <X size={16} /> Close (Esc)
        </button>
      </div>

      {/* ── Guidance Banner ── */}
      {activeItem && (
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: '#1c1800',
            borderBottom: '1px solid #423800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ffd100', fontWeight: 700, fontSize: '13px' }}>
              What to crop for {activeItem.id}:
            </span>
            <span style={{ color: '#fff', fontSize: '13px', fontStyle: activeItem.cropDescription ? 'italic' : 'normal' }}>
              {activeItem.cropDescription ? `"${activeItem.cropDescription}"` : 'Drag a box around the required figure.'}
            </span>
          </div>

          <span style={{ fontSize: '12px', color: '#888' }}>
            Click & drag over the figure to snip
          </span>
        </div>
      )}

      {/* ── Scrollable Document Workspace ── */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#0a0a0a',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '32px 24px 90px 24px',
          position: 'relative',
        }}
      >
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#ffd100',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Loading PDF Page {currentPage}...
          </div>
        )}

        <div
          ref={overlayRef}
          style={{
            position: 'relative',
            cursor: 'crosshair',
            userSelect: 'none',
            boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
            backgroundColor: '#fff',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <canvas ref={canvasRef} style={{ display: 'block' }} />

          {/* Active Crop Box Overlay */}
          {boxW > 5 && boxH > 5 && (
            <div
              style={{
                position: 'absolute',
                left: boxX,
                top: boxY,
                width: boxW,
                height: boxH,
                border: '2px dashed #ffd100',
                backgroundColor: 'rgba(255, 209, 0, 0.18)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>

      {/* ── Floating Bottom Action Bar ── */}
      {hasValidSelection && !isDragging && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#161616',
            padding: '10px 18px',
            borderRadius: '8px',
            border: '1px solid #444',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
          }}
        >
          <button
            onClick={handleSaveCrop}
            style={{
              background: '#ffd100',
              color: '#000',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              padding: '8px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={16} /> Save Crop for {activeItem?.id}
          </button>

          <button
            onClick={() => setCropBox(null)}
            style={{
              background: 'transparent',
              color: '#aaa',
              border: '1px solid #444',
              fontSize: '13px',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};
