import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useExamStore } from '../../store/examStore';
import { buildSubjectPrompt } from '../../utils/promptBuilder';
import { parseAndRepairExam, EXAM_META } from '../../utils/examParser';
import { resolveExamMedia, fileToOptimizedDataUrl } from '../../utils/mediaWalker';
import { PdfViewerCropper } from '../common/PdfViewerCropper';
import { convertPdfWithGemini } from '../../utils/geminiDirectConverter';
import { Copy, Check, FileText, Sparkles, Upload, Music, Image as ImageIcon, Crop as CropIcon } from 'lucide-react';
import type { Exam } from '../../types/ExamSchema';
import '../../styles/bluebook.css';

export const JsonInputScreen: React.FC = () => {
  const selectedExamType = useExamStore((s) => s.selectedExamType);
  const clearInputState = useExamStore((s) => s.clearInputState);
  const loadExam = useExamStore((s) => s.loadExam);

  // Core state
  const [jsonText, setJsonText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedFixup, setCopiedFixup] = useState(false);

  // Persistent Media map: Media ID / filename -> Data URL
  const [mediaMap, setMediaMap] = useState<Record<string, string>>({});

  // PDF Cropper state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // 1-Click Gemini API state
  const [showGeminiPanel, setShowGeminiPanel] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('bluebook_gemini_key') || '');
  const [isGeminiProcessing, setIsGeminiProcessing] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<string | null>(null);

  const examType = selectedExamType ?? 'calc_ab';
  const meta = EXAM_META[examType] ?? EXAM_META['calc_ab'];
  const aiPrompt = useMemo(() => buildSubjectPrompt(examType), [examType]);

  // Save Gemini API key locally
  useEffect(() => {
    if (geminiApiKey) {
      localStorage.setItem('bluebook_gemini_key', geminiApiKey);
    }
  }, [geminiApiKey]);

  // Parse and auto-repair exam JSON whenever jsonText or examType changes
  const parseResult = useMemo(() => parseAndRepairExam(jsonText, examType), [jsonText, examType]);
  const { exam, error, fixupPrompt, requiredMedia, questionCount } = parseResult;

  // Check if all media is provided
  const allMediaProvided = requiredMedia.length === 0 || requiredMedia.every((m) => !!mediaMap[m.id]);
  const canStart = exam !== null && allMediaProvided && questionCount > 0;

  // Derive active media ID cleanly without setState in effect
  const activeMediaId = useMemo(() => {
    if (selectedMediaId && requiredMedia.some((m) => m.id === selectedMediaId)) {
      return selectedMediaId;
    }
    const firstUnset = requiredMedia.find((m) => !mediaMap[m.id]);
    return firstUnset?.id || requiredMedia[0]?.id || null;
  }, [selectedMediaId, requiredMedia, mediaMap]);

  // ── Handlers ──

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPrompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1800);
    });
  };

  const handleCopyFixup = () => {
    if (!fixupPrompt) return;
    navigator.clipboard.writeText(fixupPrompt).then(() => {
      setCopiedFixup(true);
      setTimeout(() => setCopiedFixup(false), 1800);
    });
  };

  const handleCropSaved = useCallback((mediaId: string, dataUrl: string) => {
    setMediaMap((prev) => ({ ...prev, [mediaId]: dataUrl }));
  }, []);

  const handleOpenCropper = (mediaId: string) => {
    setSelectedMediaId(mediaId);
    setIsCropperOpen(true);
  };

  const handleRemoveMedia = (mediaId: string) => {
    setMediaMap((prev) => {
      const copy = { ...prev };
      delete copy[mediaId];
      return copy;
    });
  };

  const handleFileUpload = async (mediaId: string, file: File | Blob) => {
    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      setMediaMap((prev) => ({ ...prev, [mediaId]: dataUrl }));
      const nextUnset = requiredMedia.find((m) => m.id !== mediaId && !mediaMap[m.id]);
      if (nextUnset) {
        setSelectedMediaId(nextUnset.id);
      }
    } catch (err) {
      console.error('Failed to process uploaded file:', err);
      alert('Could not process this file. Please ensure it is a valid image or audio format.');
    }
  };

  const handleCardPaste = (mediaId: string) => async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          await handleFileUpload(mediaId, file);
          return;
        }
      }
    }
  };

  const handleCardDrop = (mediaId: string) => async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('audio/'))) {
      await handleFileUpload(mediaId, file);
    }
  };

  const handlePasteClipboard = async (mediaId: string) => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageType = clipboardItem.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await clipboardItem.getType(imageType);
          await handleFileUpload(mediaId, blob);
          return;
        }
      }
      alert('No image found on your clipboard. Take a screenshot (⌘⇧4 or ⌘⌃⇧4) and try again.');
    } catch (err) {
      console.error('Failed to read clipboard contents:', err);
      alert('To paste directly without browser prompts, click this card and press ⌘V, or drag & drop the image directly.');
    }
  };

  // Global Cmd+V / Ctrl+V listener: pastes screenshots directly without permission prompts
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const targetId = (selectedMediaId && !mediaMap[selectedMediaId])
              ? selectedMediaId
              : requiredMedia.find((m) => !mediaMap[m.id])?.id || selectedMediaId;

            if (targetId) {
              try {
                const dataUrl = await fileToOptimizedDataUrl(file);
                setMediaMap((prev) => ({ ...prev, [targetId]: dataUrl }));
                const nextUnset = requiredMedia.find((m) => m.id !== targetId && !mediaMap[m.id]);
                if (nextUnset) {
                  setSelectedMediaId(nextUnset.id);
                }
              } catch (err) {
                console.error('Failed to process pasted screenshot:', err);
              }
            }
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [selectedMediaId, requiredMedia, mediaMap]);


  const handleGeminiConvert = async () => {
    if (!pdfFile) {
      alert('Please upload an Exam PDF first.');
      return;
    }
    if (!geminiApiKey.trim()) {
      alert('Please enter your Gemini API key.');
      return;
    }

    try {
      setIsGeminiProcessing(true);
      setGeminiStatus('Initializing Gemini...');
      const resultJson = await convertPdfWithGemini(pdfFile, geminiApiKey, aiPrompt, (status) => {
        setGeminiStatus(status);
      });
      setJsonText(resultJson);
      setGeminiStatus('Completed!');
      setShowGeminiPanel(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gemini Conversion Error: ${msg}`);
      setGeminiStatus(null);
    } finally {
      setIsGeminiProcessing(false);
    }
  };

  const handleStart = () => {
    if (!exam) return;

    // Resolve all media placeholders across the entire exam tree into persistent data URLs
    const finalExam: Exam = resolveExamMedia(exam, mediaMap);
    loadExam(finalExam, meta.studentName);
  };

  return (
    <div className="json-input-screen">
      {/* ── Header ── */}
      <div className="json-input-header">
        <button className="json-input-back" onClick={clearInputState}>
          ← back
        </button>
        <span className="json-input-exam-label" style={{ fontWeight: 600, color: '#fff' }}>
          {meta.title}
        </span>
        <div className="json-input-header-spacer" />

        {/* Gemini API Toggle */}
        <button
          onClick={() => setShowGeminiPanel((p) => !p)}
          style={{
            background: showGeminiPanel ? '#252525' : 'transparent',
            border: '1px solid #444',
            color: '#ffd100',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Sparkles size={14} />
          {showGeminiPanel ? 'close gemini api' : 'gemini api'}
        </button>
      </div>

      {/* ── Gemini API Panel ── */}
      {showGeminiPanel && (
        <div
          style={{
            backgroundColor: '#0c0c0c',
            borderBottom: '1px solid #222',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#ffd100" />
              <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>
                Gemini API Auto-Conversion
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#4ade80' }}>
              Your API key and PDF remain strictly local in your browser. The key is remembered across sessions.
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              alignItems: 'end',
            }}
          >
            {/* Spot 1: Upload Exam PDF */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#ccc', marginBottom: '6px' }}>
                1. Upload Exam PDF
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="file"
                  id="gemini-pdf-input"
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPdfFile(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('gemini-pdf-input')?.click()}
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid #444',
                    color: '#fff',
                    borderRadius: '4px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Upload size={14} />
                  {pdfFile ? 'Change PDF' : 'Select Exam PDF'}
                </button>
                {pdfFile ? (
                  <span style={{ fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={14} />
                    <strong>{pdfFile.name}</strong> ({Math.round(pdfFile.size / 1024)} KB)
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#777' }}>
                    No PDF chosen yet
                  </span>
                )}
              </div>
            </div>

            {/* Spot 2: Gemini API Key */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#ccc' }}>
                  2. Gemini API Key
                </label>
                {geminiApiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeminiApiKey('');
                      localStorage.removeItem('bluebook_gemini_key');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      fontSize: '11px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Clear key
                  </button>
                )}
              </div>
              <input
                type="password"
                placeholder="Paste Gemini API Key (AIzaSy...)"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#161616',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Spot 3: Convert Action Button */}
            <div>
              <button
                disabled={isGeminiProcessing || !pdfFile || !geminiApiKey.trim()}
                onClick={handleGeminiConvert}
                style={{
                  width: '100%',
                  background: isGeminiProcessing ? '#444' : (!pdfFile || !geminiApiKey.trim() ? '#333' : '#ffd100'),
                  color: !pdfFile || !geminiApiKey.trim() || isGeminiProcessing ? '#888' : '#000',
                  border: 'none',
                  fontWeight: 700,
                  padding: '9px 18px',
                  borderRadius: '4px',
                  cursor: isGeminiProcessing ? 'wait' : (!pdfFile || !geminiApiKey.trim() ? 'not-allowed' : 'pointer'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '13px',
                }}
              >
                <Sparkles size={15} />
                {isGeminiProcessing ? 'Converting PDF with Gemini...' : 'Convert PDF with Gemini'}
              </button>
            </div>
          </div>

          {geminiStatus && (
            <div style={{ fontSize: '12px', color: '#ffd100', background: 'rgba(255, 209, 0, 0.08)', padding: '6px 10px', borderRadius: '4px' }}>
              {geminiStatus}
            </div>
          )}
        </div>
      )}

      {/* ── Instructions Bar ── */}
      <div className="json-input-instructions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          <strong>How to import:</strong> Copy the prompt below, give it to an AI along with your exam PDF or screenshots, and paste the JSON output here. Then crop or upload any images directly.
        </span>
      </div>

      {/* ── Copy Prompt Bar ── */}
      <button className="json-input-copy-bar" onClick={handleCopyPrompt}>
        {copiedPrompt ? (
          <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} /> Copied Prompt to Clipboard!
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Copy size={14} /> Click to Copy {meta.subject} AI Prompt
          </span>
        )}
      </button>

      {/* ── Split Layout ── */}
      <div className="json-input-split">
        {/* ── Left Side: JSON Input ── */}
        <div className="json-input-left">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <label className="json-input-label" style={{ marginBottom: 0 }}>
                Paste Exam JSON
              </label>
              <span style={{ fontSize: '11px', color: '#888' }}>
                You can paste multiple batches of JSON below
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>

              {examType === 'test' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      background: '#222',
                      border: '1px solid #444',
                      color: '#fff',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      setJsonText(
                        JSON.stringify(
                          {
                            media: [],
                            questions: [
                              {
                                id: '1',
                                section: '1',
                                text: 'test',
                                options: [
                                  { id: 'A', text: 'true' },
                                  { id: 'B', text: 'false' },
                                  { id: 'C', text: 'false' },
                                  { id: 'D', text: 'false' },
                                ],
                                correctAnswer: 'A',
                              },
                            ],
                          },
                          null,
                          2
                        )
                      )
                    }
                  >
                    Load Test
                  </button>
                  <button
                    style={{
                      background: '#222',
                      border: '1px solid #444',
                      color: '#fff',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      setJsonText(
                        JSON.stringify(
                          {
                            media: [
                              {
                                id: 'IMG_1',
                                kind: 'image',
                                page: 1,
                                crop: 'Diagram of coordinate plane',
                              },
                            ],
                            questions: [
                              {
                                id: '1',
                                section: '1',
                                stimulus: { type: 'image', data: 'IMG_1' },
                                text: 'test',
                                options: [
                                  { id: 'A', text: 'true' },
                                  { id: 'B', text: 'false' },
                                  { id: 'C', text: 'false' },
                                  { id: 'D', text: 'false' },
                                ],
                                correctAnswer: 'A',
                              },
                            ],
                          },
                          null,
                          2
                        )
                      )
                    }
                  >
                    Load Test (with image)
                  </button>
                </div>
              )}
            </div>
          </div>

          <textarea
            className="json-input-textarea"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={'{\n  "media": [\n    { "id": "IMG_1", "page": 2, "crop": "Graph above Q1" }\n  ],\n  "questions": [\n    { "id": "1", "section": "1A", "text": "...", "options": [...] }\n  ]\n}'}
            spellCheck={false}
          />

          {/* Validation Status & Auto-Repair Feedback */}
          {jsonText.trim() && (
            <div
              className={`json-input-status ${error ? 'json-input-status--error' : 'json-input-status--valid'}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span className="json-input-status-icon">{error ? '✗' : '✓'}</span>
                <span style={{ fontWeight: 600 }}>
                  {error
                    ? 'Formatting Issue Detected'
                    : `${questionCount} Question${questionCount !== 1 ? 's' : ''} Ready · ${exam?.sections.length || 1} Section${(exam?.sections.length || 1) !== 1 ? 's' : ''}`}
                </span>

                {error && fixupPrompt && (
                  <button
                    onClick={handleCopyFixup}
                    style={{
                      marginLeft: 'auto',
                      background: '#222',
                      border: '1px solid #f87171',
                      color: '#fff',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copiedFixup ? <Check size={12} /> : <Copy size={12} />}
                    {copiedFixup ? 'Copied!' : 'Copy Fix-Up Message for AI'}
                  </button>
                )}
              </div>

              {error && <div style={{ fontSize: '11px', color: '#ffaaaa' }}>{error}</div>}
            </div>
          )}

          {/* Section Summary */}
          {exam && exam.sections.length > 0 && (
            <div className="json-input-section-breakdown" style={{ marginTop: '10px' }}>
              {exam.sections.map((s) => (
                <div key={s.id} className="json-input-section-tag">
                  <span className="json-input-section-tag__name">{s.title}</span>
                  <span className="json-input-section-tag__count">{s.questions.length}q</span>
                  {s.breakAfterMinutes !== null && (
                    <span className="json-input-section-tag__break">→ {s.breakAfterMinutes}min break</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="json-input-divider" />

        {/* ── Right Side: Media Cropper & Checklist ── */}
        <div className="json-input-right">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label className="json-input-label" style={{ marginBottom: 0 }}>
              Exam Figures & Media ({requiredMedia.filter((m) => !!mediaMap[m.id]).length}/{requiredMedia.length})
            </label>
          </div>

          {/* Show PDF upload block ONLY after JSON is cleanly parsed and media items are required, and no PDF is uploaded yet */}
          {exam && requiredMedia.length > 0 && !pdfFile && (
            <div
              className="json-input-pdf-upload-card"
              onClick={() => pdfInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const file = e.dataTransfer.files[0];
                  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                    setPdfFile(file);
                  }
                }
              }}
              style={{
                border: '2px dashed #444',
                borderRadius: '8px',
                padding: '24px 16px',
                textAlign: 'center',
                backgroundColor: '#111',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'border-color 0.2s',
              }}
            >
              <Upload size={28} color="#ffd100" style={{ marginBottom: '8px' }} />
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                Upload Exam PDF for In-App Cropping
              </div>
              <div style={{ color: '#888', fontSize: '12px' }}>
                Drag & drop your PDF here or click to browse. Enables 1-click "Crop on Page #" navigation.
              </div>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPdfFile(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {/* Once PDF is uploaded: the big upload block is gone, replaced with this compact status line */}
          {exam && requiredMedia.length > 0 && pdfFile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#161616',
                borderRadius: '6px',
                marginBottom: '14px',
                border: '1px solid #282828',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '12px' }}>
                <FileText size={15} color="#ffd100" />
                <span>PDF loaded: <strong>{pdfFile.name}</strong></span>
              </div>
              <button
                onClick={() => setPdfFile(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Change PDF
              </button>
            </div>
          )}

          {/* Media Checklist or Initial Guidance */}
          {requiredMedia.length === 0 ? (
            <div className="json-input-no-images">
              {jsonText.trim() ? (
                exam ? (
                  '✓ All questions parsed. No figures or audio clips required for this exam.'
                ) : (
                  'Resolve any JSON formatting issues on the left to detect required figures.'
                )
              ) : (
                <div style={{ textAlign: 'left', lineHeight: '1.6', color: '#aaa', padding: '8px' }}>
                  <div style={{ color: '#ffd100', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
                    Step 1: Generate & Paste Exam JSON
                  </div>
                  <div>1. Click <strong>"Click to Copy {meta.subject} AI Prompt"</strong> above.</div>
                  <div>2. Provide the prompt and your exam PDF or screenshots to ChatGPT, Claude, or Gemini.</div>
                  <div>3. Paste the returned JSON into the box on the left.</div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#777' }}>
                    Once questions are parsed, required figures will appear here for 1-click in-app cropping.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="json-input-checklist">
              {requiredMedia.map((m) => {
                const isReady = !!mediaMap[m.id];
                const isActive = activeMediaId === m.id;

                return (
                  <div
                    key={m.id}
                    className="json-input-checklist-item"
                    onClick={() => setSelectedMediaId(m.id)}
                    onPaste={handleCardPaste(m.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleCardDrop(m.id)}
                    tabIndex={0}
                    style={{
                      border: isActive ? '1px solid #ffd100' : '1px solid #222',
                      borderRadius: '6px',
                      padding: '12px',
                      backgroundColor: isActive ? 'rgba(255, 209, 0, 0.03)' : '#0d0d0d',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="json-input-checklist-header">
                      <span className={`json-input-checklist-status ${isReady ? 'json-input-checklist-status--done' : ''}`}>
                        {isReady ? '✓' : '○'}
                      </span>

                      <span className="json-input-checklist-filename" style={{ fontWeight: 600, color: '#fff' }}>
                        {m.id}
                      </span>

                      {m.page && (
                        <span
                          style={{
                            fontSize: '11px',
                            background: '#222',
                            color: '#ffd100',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          Page {m.page}
                        </span>
                      )}

                      <span style={{ fontSize: '12px', color: '#888', marginLeft: '6px' }}>
                        {m.context}
                      </span>

                      {isActive && !isReady && (
                        <span style={{ fontSize: '11px', color: '#ffd100', marginLeft: 'auto', fontWeight: 500 }}>
                          Press ⌘V to paste
                        </span>
                      )}

                      {isReady && (
                        <button
                          className="json-input-checklist-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMedia(m.id);
                          }}
                          title="Remove media"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {m.cropDescription && (
                      <div style={{ fontSize: '12px', color: '#bbb', fontStyle: 'italic', paddingLeft: '24px', margin: '4px 0 8px 0' }}>
                        "{m.cropDescription}"
                      </div>
                    )}

                    {/* Media Slot Content */}
                    <div style={{ paddingLeft: '24px', marginTop: '4px' }}>
                      {isReady ? (
                        m.kind === 'audio' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontSize: '13px' }}>
                            <Music size={16} /> Audio ready ({m.id})
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="json-input-thumbnail-wrap">
                              <img src={mediaMap[m.id]} alt={m.id} className="json-input-thumbnail" />
                            </div>
                            {pdfFile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCropper(m.id);
                                }}
                                style={{
                                  background: '#252525',
                                  border: '1px solid #444',
                                  color: '#ffd100',
                                  borderRadius: '4px',
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                Re-crop
                              </button>
                            )}
                          </div>
                        )
                      ) : (
                        <div>
                          {m.kind === 'audio' ? (
                            <label
                              style={{
                                background: '#252525',
                                border: '1px solid #444',
                                color: '#fff',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Upload size={14} /> Upload Audio File (.mp3/.wav)
                              <input
                                type="file"
                                accept="audio/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileUpload(m.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          ) : pdfFile ? (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCropper(m.id);
                                }}
                                style={{
                                  background: '#ffd100',
                                  border: 'none',
                                  color: '#000',
                                  fontWeight: 700,
                                  borderRadius: '4px',
                                  padding: '6px 14px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <CropIcon size={14} /> Crop on Page {m.page || '...'}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMediaId(m.id);
                                  handlePasteClipboard(m.id);
                                }}
                                style={{
                                  background: '#222',
                                  border: '1px solid #444',
                                  color: '#fff',
                                  borderRadius: '4px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                                title="Click to paste or press ⌘V"
                              >
                                <ImageIcon size={14} /> Paste Screenshot
                              </button>

                              <label
                                style={{
                                  background: '#222',
                                  border: '1px solid #444',
                                  color: '#aaa',
                                  borderRadius: '4px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Upload size={14} /> Upload File
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleFileUpload(m.id, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          ) : (
                            <div
                              className="json-input-dropzone"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMediaId(m.id);
                                handlePasteClipboard(m.id);
                              }}
                              onPaste={handleCardPaste(m.id)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={handleCardDrop(m.id)}
                              tabIndex={0}
                              style={{
                                border: isActive ? '1px dashed #ffd100' : '1px dashed #3a3a3a',
                                backgroundColor: isActive ? 'rgba(255, 209, 0, 0.04)' : '#141414',
                                borderRadius: '6px',
                                padding: '16px 20px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                outline: 'none',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fff' }}>
                                <ImageIcon size={16} color={isActive ? '#ffd100' : '#888'} />
                                <span><strong>Click to paste</strong> or press <strong>⌘V</strong></span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>drag & drop image, or</span>
                                <label
                                  style={{ color: '#ffd100', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  choose file
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleFileUpload(m.id, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Fullscreen In-App PDF Cropper Modal ── */}
      <PdfViewerCropper
        isOpen={isCropperOpen}
        pdfFile={pdfFile}
        requiredMedia={requiredMedia}
        activeMediaId={activeMediaId}
        onSelectMediaId={(id) => setSelectedMediaId(id)}
        onCropSaved={handleCropSaved}
        onClose={() => setIsCropperOpen(false)}
      />

      {/* ── Footer ── */}
      <div className="json-input-footer" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {exam && (
            <span className="json-input-meta">
              {questionCount} question{questionCount !== 1 ? 's' : ''}
              {exam.sections.length > 1 && ` · ${exam.sections.length} sections`}
            </span>
          )}

          {requiredMedia.length > 0 && (
            <span style={{ fontSize: '13px', color: allMediaProvided ? '#4ade80' : '#ffd100' }}>
              {allMediaProvided
                ? '✓ All figures attached'
                : `${requiredMedia.filter((m) => !mediaMap[m.id]).length} figure${requiredMedia.filter((m) => !mediaMap[m.id]).length !== 1 ? 's' : ''} remaining`}
            </span>
          )}
        </div>

        <button className="json-input-start" onClick={handleStart} disabled={!canStart}>
          next →
        </button>
      </div>
    </div>
  );
};
