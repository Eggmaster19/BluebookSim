import React, { useState, useRef, useEffect } from 'react';

export const ImageStimulus: React.FC<{ src: string; alt?: string; caption?: string }> = ({ src, alt, caption }) => {
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -15 : 15;
    const newZoom = Math.min(400, Math.max(50, zoom + delta));
    setZoom(newZoom);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(400, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const handleReset = () => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 100 && !isFullscreen) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPanOffset({
      x: dragStartRef.current.startPanX + dx,
      y: dragStartRef.current.startPanY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  return (
    <>
      <div
        className="bb-image-stimulus"
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          margin: '16px 0',
        }}
        onWheel={handleWheel}
      >
        {/* Top Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            fontSize: '13px',
            color: '#333333',
            userSelect: 'none',
          }}
        >
          <button
            onClick={handleZoomIn}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', padding: '2px 6px', color: '#333' }}
            title="Zoom in"
          >
            ⊕
          </button>
          <button
            onClick={handleZoomOut}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', padding: '2px 6px', color: '#333' }}
            title="Zoom out"
          >
            ⊖
          </button>
          <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 600 }}>{zoom}%</span>
          <button
            onClick={handleReset}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#1a5fb4', fontWeight: 600, padding: '2px 6px' }}
          >
            Reset
          </button>
          <span style={{ color: '#ccc' }}>|</span>
          <button
            onClick={() => setIsFullscreen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#333', padding: '2px 6px' }}
            title="Full screen view"
          >
            ⤢
          </button>
        </div>

        {caption && (
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '15px', padding: '8px 0 0 0', color: '#111' }}>
            {caption}
          </div>
        )}

        {/* Image Container */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
            padding: '16px',
            cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '180px',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={src}
            alt={alt || 'Question diagram'}
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              transform: `scale(${zoom / 100}) translate(${panOffset.x / (zoom / 100)}px, ${panOffset.y / (zoom / 100)}px)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Fullscreen Popout Modal */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
              width: '90vw',
              maxWidth: '1000px',
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
          >
            {/* Popout Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e0e0e0',
                fontSize: '14px',
                userSelect: 'none',
              }}
            >
              <span style={{ fontWeight: 700, color: '#111' }}>{caption || 'Image View'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handleZoomIn}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', color: '#333' }}
                  title="Zoom in"
                >
                  ⊕
                </button>
                <button
                  onClick={handleZoomOut}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', color: '#333' }}
                  title="Zoom out"
                >
                  ⊖
                </button>
                <span style={{ minWidth: '45px', textAlign: 'center', fontWeight: 600 }}>{zoom}%</span>
                <button
                  onClick={handleReset}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#1a5fb4', fontWeight: 600 }}
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#333', marginLeft: '12px' }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Popout Body */}
            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: '#ffffff',
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={src}
                alt={alt || 'Question diagram'}
                style={{
                  maxWidth: '90%',
                  maxHeight: '90%',
                  transform: `scale(${zoom / 100}) translate(${panOffset.x / (zoom / 100)}px, ${panOffset.y / (zoom / 100)}px)`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageStimulus;