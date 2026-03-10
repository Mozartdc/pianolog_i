// src/utils/rhythmUtils.ts

import { Renderer, Stave, StaveNote, Voice, Formatter, Beam, Tuplet, Barline, Dot } from 'vexflow';

/**
 * Rhythm pattern definition
 */
export interface RhythmPattern {
  id: string;
  description: string;
  values: number[]; // Relative length of each note (1 = one beat)
  getTickPattern: () => (0 | 1)[]; // 0: rest, 1: sound
}

/**
 * Complete rhythm pattern definitions
 */
export const RHYTHM_PATTERNS: RhythmPattern[] = [
  {
    id: 'one_beat',
    description: '한 박 채우기',
    values: [1],
    getTickPattern: () => [1]
  },
  {
    id: 'two_parts',
    description: '한 박을 두 개로 나누기',
    values: [0.5, 0.5],
    getTickPattern: () => [1, 1]
  },
  {
    id: 'rest_plus_half',
    description: '한 박을 쉼표 + 반박으로 나누기',
    values: [0.5, 0.5],
    getTickPattern: () => [0, 1]
  },
  {
    id: 'triplet',
    description: '한 박을 세 개로 나누기 (3연음)',
    values: [0.333, 0.333, 0.333],
    getTickPattern: () => [1, 1, 1]
  },
  {
    id: 'triplet_rest_first',
    description: '한 박을 셋잇단으로 나누기 (첫 박 쉼표)',
    values: [0.333, 0.333, 0.333],
    getTickPattern: () => [0, 1, 1]
  },
  {
    id: 'triplet_rest_middle',
    description: '한 박을 셋잇단으로 나누기 (가운데 쉼표)',
    values: [0.333, 0.333, 0.333],
    getTickPattern: () => [1, 0, 1]
  },
  {
    id: 'triplet_rest_last',
    description: '한 박을 셋잇단으로 나누기 (마지막 쉼표)',
    values: [0.333, 0.333, 0.333],
    getTickPattern: () => [1, 1, 0]
  },
  {
    id: 'triplet_rest_edges',
    description: '한 박을 셋잇단으로 나누기 (앞뒤 쉼표)',
    values: [0.333, 0.333, 0.333],
    getTickPattern: () => [0, 1, 0]
  },
  {
    id: 'four_parts_A',
    description: '한 박을 네 개로 나누기 (16분음표형)',
    values: [0.25, 0.25, 0.25, 0.25],
    getTickPattern: () => [1, 1, 1, 1]
  },
  {
    id: 'four_parts_B',
    description: '한 박을 네 개로 나누기 (변형 자리)',
    values: [0.25, 0.25, 0.25, 0.25],
    getTickPattern: () => [1, 0, 1, 0]
  },
  {
    id: 'quarter_quarter_half',
    description: '한 박을 1/4 + 1/4 + 1/2로 나누기',
    values: [0.25, 0.25, 0.5],
    getTickPattern: () => [1, 1, 1]
  },
  {
    id: 'half_quarter_quarter',
    description: '한 박을 1/2 + 1/4 + 1/4로 나누기',
    values: [0.5, 0.25, 0.25],
    getTickPattern: () => [1, 1, 1]
  },
  {
    id: 'dotted_half_quarter',
    description: '한 박을 3/4 + 1/4로 나누기',
    values: [0.75, 0.25],
    getTickPattern: () => [1, 1]
  },
  {
    id: 'quarter_dotted_half',
    description: '한 박을 1/4 + 3/4로 나누기',
    values: [0.25, 0.75],
    getTickPattern: () => [1, 1]
  },
  {
    id: 'quarter_half_quarter',
    description: '한 박을 1/4 + 1/2 + 1/4로 나누기',
    values: [0.25, 0.5, 0.25],
    getTickPattern: () => [1, 1, 1]
  }
];

const getDenominatorNoteDuration = (denominator: number): string => {
  const map: Record<number, string> = { 1: 'w', 2: 'h', 4: 'q', 8: '8', 16: '16' };
  return map[denominator] || 'q';
};

const getDurationByDenominatorValue = (value: number): string => {
  const map: Record<number, string> = {
    1: 'w',
    2: 'h',
    4: 'q',
    8: '8',
    16: '16',
    32: '32',
    64: '64'
  };
  return map[value] || 'q';
};

const getDurationForBeatFraction = (denominator: number, beatFraction: number): string => {
  if (Math.abs(beatFraction - 1) < 0.001) {
    return getDenominatorNoteDuration(denominator);
  }

  if (Math.abs(beatFraction - 0.75) < 0.001) {
    return `${getDurationForBeatFraction(denominator, 0.5)}d`;
  }

  const denominatorValue = Math.round(denominator / beatFraction);
  return getDurationByDenominatorValue(denominatorValue);
};

const renderFallback = (container: HTMLDivElement) => {
  container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 20px; color: var(--text-primary);">♪</div>`;
};

/**
 * Helper function to create separate beams for note groups divided by rests
 */
const createBeamsForGroups = (notes: StaveNote[]): Beam[] => {
  const beams: Beam[] = [];
  let currentGroup: StaveNote[] = [];

  notes.forEach((note) => {
    const isBeamable = !note.isRest() && parseInt(note.getDuration(), 10) >= 8;
    if (isBeamable) {
      currentGroup.push(note);
    } else {
      if (currentGroup.length > 1) {
        beams.push(new Beam(currentGroup));
      }
      currentGroup = [];
    }
  });

  if (currentGroup.length > 1) {
    beams.push(new Beam(currentGroup));
  }
  return beams;
};

/**
 * Render rhythm pattern with VexFlow (center-aligned with minimal changes)
 * @param container - Container to render into
 * @param patternId - Rhythm pattern ID
 * @param denominator - Time signature denominator (fixed at 4 for quarter note base)
 * @param width - Kept for API compatibility (not used)
 * @param height - Kept for API compatibility (not used)
 */
export const renderRhythm = (
  container: HTMLDivElement,
  patternId: string,
  denominator: number = 4,
  width?: number,
  height?: number
) => {
  try {
    const pattern = RHYTHM_PATTERNS.find(p => p.id === patternId);
    if (!pattern) {
      renderFallback(container);
      return;
    }

    container.innerHTML = '';

    // Renderer setup: free rendering on large canvas
    const NAT_W = 350, NAT_H = 150;
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(NAT_W, NAT_H);
    const context = renderer.getContext();
    context.setFont('Bravura', 18, 'normal');

    // Create staff: adjust Y position for better vertical centering
    const stave = new Stave(0, 50, NAT_W);
    stave.setBegBarType(Barline.type.NONE);
    stave.setEndBarType(Barline.type.NONE);
    for (let i = 0; i < 5; i++) {
      stave.setConfigForLine(i, { visible: false });
    }
    stave.setContext(context).draw();

    // Add render_options to unify note head size across all StaveNotes
    const noteOptions = { render_options: { glyph_font_scale: 25 } };

    const tickPattern = pattern.getTickPattern();
    const notes: StaveNote[] = [];

    // Note creation logic - keep original logic
    const isTriplet = pattern.id.includes('triplet');
    
    if (isTriplet) {
      const tripletDuration = getDurationForBeatFraction(denominator, 0.5);
      pattern.values.forEach((_, index) => {
        const isRest = tickPattern[index] === 0;
        notes.push(new StaveNote({ keys: ['b/4'], duration: isRest ? `${tripletDuration}r` : tripletDuration, ...noteOptions }));
      });
    } else {
      pattern.values.forEach((value, index) => {
        const isRest = tickPattern[index] === 0;
        const duration = getDurationForBeatFraction(denominator, value);
        notes.push(new StaveNote({ keys: ['b/4'], duration: isRest ? `${duration}r` : duration, ...noteOptions }));
      });

      notes.forEach((note, index) => {
        const value = pattern.values[index];
        if (!note.isRest() && Math.abs(value - 0.75) < 0.001) {
          Dot.buildAndAttach([note]);
        }
      });
    }

    const voice = new Voice({ num_beats: 1, beat_value: denominator }).setStrict(false);
    voice.addTickables(notes);

    // Center alignment and formatting - dynamic width calculation
    const formatter = new Formatter();
    const PADDING = 24;
    const baseNoteWidth = 30;
    const desired = Math.max(80, notes.length * baseNoteWidth + PADDING);
    const formatWidth = Math.min(NAT_W - PADDING, desired);
    
    stave.setNoteStartX(12); // Fixed left margin instead of center alignment (to avoid collisions)
    formatter.joinVoices([voice]).format([voice], formatWidth);

    // Create beams and tuplets
    let beams: Beam[] = [];
    let tuplet: Tuplet | null = null;
    
    if (isTriplet) {
      beams = createBeamsForGroups(notes);
      tuplet = new Tuplet(notes, { num_notes: 3, notes_occupied: 2 });
    } else if (notes.length > 1) {
       beams = createBeamsForGroups(notes);
    }

    // Render
    voice.draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());
    if (tuplet) tuplet.setContext(context).draw();

    // SVG post-processing: apply 50% scale + center alignment
    const svg = container.querySelector('svg');
    if (svg) {
      const bbox = svg.getBBox();
      
      // Apply 50% scale
      const scaledWidth = bbox.width * 0.5;
      const scaledHeight = bbox.height * 0.5;
      
      const PAD = 4;
      const finalWidth = scaledWidth + PAD * 2;
      const finalHeight = scaledHeight + PAD * 2;
      
      svg.setAttribute('viewBox', `${bbox.x - PAD} ${bbox.y - PAD} ${bbox.width + PAD * 2} ${bbox.height + PAD * 2}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.removeAttribute('width');
      svg.removeAttribute('height');

      // Adjust container size
      container.style.width = `${finalWidth}px`;
      container.style.height = `${finalHeight}px`;
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';

      // Prevent baseline skew
      svg.style.display = 'block';
      svg.style.verticalAlign = 'middle';

      // Change fill/stroke attributes to 'currentColor' for dark/light mode support
      svg.querySelectorAll('path, rect').forEach(el => {
        el.setAttribute('fill', 'currentColor');
        el.setAttribute('stroke', 'currentColor');
      });
    }

  } catch (error) {
    console.warn('VexFlow rendering failed for pattern:', patternId, error);
    renderFallback(container);
  }
};

/**
 * Returns actual rendering size of pattern (for button size adjustment)
 */
export const getPatternDimensions = (patternId: string): { width: number; height: number } => {
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.visibility = 'hidden';
  document.body.appendChild(tempContainer);
  
  try {
    renderRhythm(tempContainer, patternId);
    const width = parseFloat(tempContainer.style.width) || 50;
    const height = parseFloat(tempContainer.style.height) || 40;
    return { width, height };
  } catch (error) {
    return { width: 50, height: 40 }; // Fallback
  } finally {
    document.body.removeChild(tempContainer);
  }
};
