import type { Exam, Question, MCQuestion, FRQuestion, AudioResponseQuestion, Stimulus } from '../types/ExamSchema';

export interface MediaManifestItem {
  id: string;
  kind?: 'image' | 'audio';
  page?: number;
  sourceQuestion?: string | number;
  crop?: string;
  description?: string;
}

export interface MediaRequirement {
  id: string;
  kind: 'image' | 'audio';
  page?: number;
  sourceQuestion?: string;
  cropDescription?: string;
  context: string;
}

/**
 * Checks if a string looks like an image reference:
 * either an explicit placeholder (e.g. IMG_1, IMAGE_2),
 * or a filename ending with an image extension (.png, .jpg, .svg, .webp).
 */
export function isImageReference(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (/^IMG[_-]?\d+$/i.test(trimmed)) return true;
  if (/^IMAGE[_-]?\d+$/i.test(trimmed)) return true;
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(trimmed)) return true;
  return false;
}

/**
 * Checks if a string looks like an audio reference:
 * e.g. .mp3, .wav, .m4a, .ogg, or AUDIO_#
 */
export function isAudioReference(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (/^AUDIO[_-]?\d+$/i.test(trimmed)) return true;
  if (/\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(trimmed)) return true;
  return false;
}

/**
 * Recursively inspects all questions and extracts every media requirement
 * across top-level stimulus, optionsStimulus, individual options,
 * FRQ parts, and interlocutorAudio.
 */
export function walkExamMedia(
  questions: Question[],
  manifest: MediaManifestItem[] = []
): MediaRequirement[] {
  const reqMap = new Map<string, MediaRequirement>();
  const manifestMap = new Map<string, MediaManifestItem>();

  for (const item of manifest) {
    if (item && item.id) {
      manifestMap.set(item.id.trim(), item);
    }
  }

  const addMedia = (
    id: string,
    kind: 'image' | 'audio',
    context: string,
    sourceQuestion?: string
  ) => {
    if (!id || typeof id !== 'string') return;
    const cleanId = id.trim();
    if (cleanId.startsWith('data:') || cleanId.startsWith('blob:') || cleanId.startsWith('http')) {
      // Already an inline or resolved media url
      return;
    }

    const manifestInfo = manifestMap.get(cleanId);
    const existing = reqMap.get(cleanId);

    const requirement: MediaRequirement = {
      id: cleanId,
      kind: manifestInfo?.kind || kind,
      page: manifestInfo?.page || existing?.page,
      sourceQuestion:
        (manifestInfo?.sourceQuestion !== undefined ? String(manifestInfo.sourceQuestion) : undefined) ||
        sourceQuestion ||
        existing?.sourceQuestion,
      cropDescription: manifestInfo?.crop || manifestInfo?.description || existing?.cropDescription,
      context: existing ? `${existing.context}, ${context}` : context,
    };

    reqMap.set(cleanId, requirement);
  };

  questions.forEach((q, qIndex) => {
    const qNum = String(q.id || qIndex + 1);

    // 1. Top-level stimulus
    if (q.stimulus) {
      if (typeof q.stimulus === 'string') {
        addMedia(q.stimulus, isAudioReference(q.stimulus) ? 'audio' : 'image', `Q${qNum} Stimulus`, qNum);
      } else if (q.stimulus.type === 'image' && typeof q.stimulus.data === 'string') {
        addMedia(q.stimulus.data, 'image', `Q${qNum} Stimulus`, qNum);
      } else if (q.stimulus.type === 'audio' && typeof q.stimulus.data === 'string') {
        addMedia(q.stimulus.data, 'audio', `Q${qNum} Audio Stimulus`, qNum);
      }
    }

    // 2. MCQ: optionsStimulus & options
    if (q.questionType === 'mcq') {
      const mcq = q as MCQuestion;
      if (mcq.optionsStimulus && mcq.optionsStimulus.type === 'image' && typeof mcq.optionsStimulus.data === 'string') {
        addMedia(mcq.optionsStimulus.data, 'image', `Q${qNum} Options Image`, qNum);
      }

      if (Array.isArray(mcq.options)) {
        mcq.options.forEach((opt) => {
          if (opt.type === 'image' && typeof opt.text === 'string') {
            addMedia(opt.text, 'image', `Q${qNum} Option (${opt.id})`, qNum);
          } else if (isImageReference(opt.text)) {
            addMedia(opt.text, 'image', `Q${qNum} Option (${opt.id})`, qNum);
          }
        });
      }
    }

    // 3. FRQ: parts and part-level stimuli
    if (q.questionType === 'frq') {
      const frq = q as FRQuestion;
      if (Array.isArray(frq.parts)) {
        frq.parts.forEach((part) => {
          const partLabel = part.partLabel ? `Part ${part.partLabel}` : 'Part';
          if (part.stimulus && part.stimulus.type === 'image' && typeof part.stimulus.data === 'string') {
            addMedia(part.stimulus.data, 'image', `Q${qNum} ${partLabel} Stimulus`, qNum);
          }
          if (part.type === 'image' && typeof part.text === 'string') {
            addMedia(part.text, 'image', `Q${qNum} ${partLabel} Image`, qNum);
          }
        });
      }
    }

    // 4. Audio Response: interlocutorAudio
    if (q.questionType === 'audio-response') {
      const arq = q as AudioResponseQuestion;
      if (Array.isArray(arq.interlocutorAudio)) {
        arq.interlocutorAudio.forEach((clip, cIdx) => {
          if (clip && typeof clip === 'string') {
            addMedia(clip, 'audio', `Q${qNum} Conversation Turn ${cIdx + 1}`, qNum);
          }
        });
      }
    }
  });

  // Also include any media explicitly defined in the manifest that wasn't touched yet
  for (const item of manifest) {
    if (item && item.id && !reqMap.has(item.id.trim())) {
      reqMap.set(item.id.trim(), {
        id: item.id.trim(),
        kind: item.kind || 'image',
        page: item.page,
        sourceQuestion: item.sourceQuestion ? String(item.sourceQuestion) : undefined,
        cropDescription: item.crop || item.description,
        context: item.sourceQuestion ? `Q${item.sourceQuestion} Media` : 'Exam Media',
      });
    }
  }

  return Array.from(reqMap.values());
}

/**
 * Traverses an Exam and replaces every placeholder media ID / filename
 * with its corresponding resolved Data URL or Blob URL.
 */
export function resolveExamMedia(
  exam: Exam,
  mediaMap: Record<string, string>
): Exam {
  const resolveStimulus = (stim?: Stimulus | string): Stimulus | undefined => {
    if (!stim) return undefined;
    if (typeof stim === 'string') {
      const trimmed = stim.trim();
      const resolved = mediaMap[trimmed] || trimmed;
      return {
        type: isAudioReference(trimmed) ? 'audio' : 'image',
        data: resolved,
      };
    }
    if ((stim.type === 'image' || stim.type === 'audio') && typeof stim.data === 'string') {
      const resolved = mediaMap[stim.data.trim()];
      if (resolved) {
        return { ...stim, data: resolved };
      }
    }
    return stim;
  };

  const newSections = exam.sections.map((section) => {
    const newQuestions = section.questions.map((q) => {
      const updated = { ...q };

      // Top-level stimulus
      if (updated.stimulus) {
        updated.stimulus = resolveStimulus(updated.stimulus);
      }

      // MCQ options
      if (updated.questionType === 'mcq') {
        const mcq = updated as MCQuestion;
        if (mcq.optionsStimulus) {
          mcq.optionsStimulus = resolveStimulus(mcq.optionsStimulus);
        }
        if (Array.isArray(mcq.options)) {
          mcq.options = mcq.options.map((opt) => {
            const trimmed = opt.text?.trim();
            if (mediaMap[trimmed]) {
              return { ...opt, type: 'image', text: mediaMap[trimmed] };
            }
            return opt;
          });
        }
      }

      // FRQ parts
      if (updated.questionType === 'frq') {
        const frq = updated as FRQuestion;
        if (Array.isArray(frq.parts)) {
          frq.parts = frq.parts.map((part) => {
            const updatedPart = { ...part };
            if (updatedPart.stimulus) {
              updatedPart.stimulus = resolveStimulus(updatedPart.stimulus);
            }
            const trimmed = updatedPart.text?.trim();
            if (trimmed && mediaMap[trimmed]) {
              updatedPart.type = 'image';
              updatedPart.text = mediaMap[trimmed];
            }
            return updatedPart;
          });
        }
      }

      // Audio Response interlocutorAudio
      if (updated.questionType === 'audio-response') {
        const arq = updated as AudioResponseQuestion;
        if (Array.isArray(arq.interlocutorAudio)) {
          arq.interlocutorAudio = arq.interlocutorAudio.map((clip) => {
            const trimmed = clip?.trim();
            return (trimmed && mediaMap[trimmed]) || clip;
          });
        }
      }

      return updated;
    });

    return { ...section, questions: newQuestions };
  });

  return { ...exam, sections: newSections };
}

/**
 * Optimizes and converts an image File or Blob to a clean, persistent Data URL.
 * Scales down large images to a maximum dimension (default: 1600px) and compresses to WebP
 * (or JPEG fallback) so the stored exam remains lightweight.
 */
export async function fileToOptimizedDataUrl(
  file: File | Blob,
  maxDimension = 1600,
  quality = 0.85
): Promise<string> {
  // If it's an audio file or SVG, read as standard data URL
  if (file.type.startsWith('audio/') || file.type.includes('svg')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // If it's an image, draw to canvas to resize and compress
  return new Promise((resolve, reject) => {
    const img = new Image();
    const tempUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(tempUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to standard FileReader
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP, fall back to JPEG or PNG
      try {
        const webpUrl = canvas.toDataURL('image/webp', quality);
        if (webpUrl.startsWith('data:image/webp')) {
          resolve(webpUrl);
          return;
        }
      } catch {
        // pass
      }

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      // Fallback
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };

    img.src = tempUrl;
  });
}
