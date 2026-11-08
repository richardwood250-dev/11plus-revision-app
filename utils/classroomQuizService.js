// 11+ Classroom Quiz Importer Service
// Normalizes and filters questions from all Dojo quiz banks for the whiteboard canvas

import { MATHS_QUIZ } from '../data/maths.js';
import { VERBAL_QUIZ } from '../data/verbal.js';
import { VR_COMPOUND_QUIZ } from '../data/vr_compound.js';
import { nonverbal } from '../data/nonverbal.js';
import { GRAMMAR_QUIZ } from '../data/grammar.js';
import { SPELLING_QUIZ } from '../data/spelling.js';
import { CLOZE_QUIZ } from '../data/cloze.js';
import { getQuestionPrompt } from '../data/instructions.js';

export const SUBJECTS = [
  { id: 'maths', name: 'Maths 🔢', color: '#BE1E2D' },
  { id: 'verbal', name: 'Verbal Reasoning 🔤', color: '#8B5CF6' },
  { id: 'nonverbal', name: 'Non-Verbal 🧩', color: '#0EA5E9' },
  { id: 'grammar', name: 'Grammar & English 📖', color: '#F59E0B' },
  { id: 'spelling', name: 'Spelling 📝', color: '#10B981' },
  { id: 'cloze', name: 'Cloze Tests 🔍', color: '#6366F1' },
];

/**
 * Returns available topics for a selected subject
 */
export function getTopicsForSubject(subjectId) {
  switch (subjectId) {
    case 'maths': {
      const set = new Set();
      MATHS_QUIZ.forEach(q => {
        if (q.topic) set.add(q.topic.trim());
      });
      return ['All Topics', ...Array.from(set).sort()];
    }
    case 'verbal': {
      const set = new Set(Object.keys(VERBAL_QUIZ));
      set.add('Compound Words (Special)');
      return ['All Topics', ...Array.from(set).sort()];
    }
    case 'nonverbal': {
      return ['All Topics', ...Object.keys(nonverbal).sort()];
    }
    case 'grammar': {
      return ['All Questions', 'Find the Error'];
    }
    case 'spelling': {
      return ['All Questions', 'Spelling in Passage'];
    }
    case 'cloze': {
      return ['All Cloze Passages'];
    }
    default:
      return ['All'];
  }
}

/**
 * Normalizes a raw question object into a standard format
 */
function normalizeQuestion(raw, subjectId, topicName) {
  const options = Array.isArray(raw.options) ? raw.options.map(String) : [];
  let qText = raw.question || 'Answer the following question:';
  const prompt = getQuestionPrompt(qText, topicName, raw.topic, subjectId);
  if (prompt && !qText.includes(prompt)) {
    qText = `${prompt}\n${qText}`;
  }
  return {
    id: raw.id || `q_${Math.random().toString(36).slice(2, 8)}`,
    subject: subjectId,
    topic: raw.topic || topicName || 'General',
    question: qText,
    passage: raw.passage || raw.text || null,
    image: raw.image || null,
    options: options,
    correctAnswer: raw.correctAnswer || raw.answer || 'N/A',
    explanation: raw.explanation || null,
    difficulty: raw.difficulty || raw.difficultyIndex || null,
  };
}

/**
 * Fetches and filters questions based on criteria
 */
export function queryQuizQuestions({
  subject = 'maths',
  topic = 'All Topics',
  searchTerm = '',
  limit = 100,
}) {
  let list = [];

  if (subject === 'maths') {
    let pool = MATHS_QUIZ;
    if (topic && topic !== 'All Topics') {
      pool = pool.filter(q => q.topic && q.topic.trim().toLowerCase() === topic.toLowerCase());
    }
    list = pool.slice(0, limit * 2).map(q => normalizeQuestion(q, 'Maths', q.topic));
  } else if (subject === 'verbal') {
    if (topic === 'Compound Words (Special)' || topic === 'Compound_words') {
      const pool = VR_COMPOUND_QUIZ.length > 0 ? VR_COMPOUND_QUIZ : (VERBAL_QUIZ['Compound_words']?.questions || []);
      list = pool.map(q => normalizeQuestion(q, 'Verbal Reasoning', 'Compound Words'));
    } else if (topic && topic !== 'All Topics' && VERBAL_QUIZ[topic]) {
      const pool = VERBAL_QUIZ[topic].questions || [];
      list = pool.map(q => normalizeQuestion(q, 'Verbal Reasoning', VERBAL_QUIZ[topic].title || topic));
    } else {
      // Gather from all verbal topics
      Object.entries(VERBAL_QUIZ).forEach(([key, val]) => {
        if (val && Array.isArray(val.questions)) {
          val.questions.slice(0, 15).forEach(q => {
            list.push(normalizeQuestion(q, 'Verbal Reasoning', val.title || key));
          });
        }
      });
      if (VR_COMPOUND_QUIZ && VR_COMPOUND_QUIZ.length > 0) {
        VR_COMPOUND_QUIZ.slice(0, 20).forEach(q => {
          list.push(normalizeQuestion(q, 'Verbal Reasoning', 'Compound Words'));
        });
      }
    }
  } else if (subject === 'nonverbal') {
    if (topic && topic !== 'All Topics' && nonverbal[topic]) {
      const pool = nonverbal[topic].questions || [];
      list = pool.map(q => normalizeQuestion(q, 'Non-Verbal', nonverbal[topic].title || topic));
    } else {
      Object.entries(nonverbal).forEach(([key, val]) => {
        if (val && Array.isArray(val.questions)) {
          val.questions.slice(0, 20).forEach(q => {
            list.push(normalizeQuestion(q, 'Non-Verbal', val.title || key));
          });
        }
      });
    }
  } else if (subject === 'grammar') {
    list = GRAMMAR_QUIZ.slice(0, limit * 2).map(q => normalizeQuestion(q, 'English Grammar', 'Punctuation & Grammar'));
  } else if (subject === 'spelling') {
    list = SPELLING_QUIZ.slice(0, limit * 2).map(q => normalizeQuestion(q, 'Spelling', 'Vocabulary & Spelling'));
  } else if (subject === 'cloze') {
    list = CLOZE_QUIZ.slice(0, limit * 2).map(q => normalizeQuestion(q, 'Cloze Reading', 'Cloze Text'));
  }

  // Filter by search term if provided
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    list = list.filter(q => 
      (q.id && q.id.toLowerCase().includes(term)) ||
      (q.question && q.question.toLowerCase().includes(term)) ||
      (q.topic && q.topic.toLowerCase().includes(term)) ||
      (q.passage && q.passage.toLowerCase().includes(term))
    );
  }

  return list.slice(0, limit);
}

// Helper for shuffling
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates an entire full quiz matching the main site's quiz engine
 */
export function generateMainSiteQuiz({
  subject = 'maths',
  topic = 'All Topics',
  length = 10,
  difficulty = 'all',
}) {
  let questions = [];
  let title = '';

  if (subject === 'maths') {
    let pool = MATHS_QUIZ;
    const isAll = !topic || topic === 'All Topics';

    if (!isAll) {
      pool = pool.filter(q => q.topic && q.topic.trim().toLowerCase() === topic.toLowerCase());
      title = `Maths: ${topic} Quiz`;
    } else {
      title = '11+ Maths: Mixed Topics Dojo Quiz';
    }

    if (difficulty === 'easy') {
      pool = pool.filter(q => q.difficultyIndex <= 25);
    } else if (difficulty === 'medium') {
      pool = pool.filter(q => q.difficultyIndex >= 13 && q.difficultyIndex <= 38);
    } else if (difficulty === 'hard') {
      pool = pool.filter(q => q.difficultyIndex >= 26);
    }

    // Select diverse questions with unique prefix/stem if possible
    const shuffled = shuffle(pool);
    const selected = [];
    const usedPrefixes = new Set();

    for (const q of shuffled) {
      if (selected.length >= length) break;
      const prefix = q.prefix || q.id.split('_')[0];
      if (!isAll || !usedPrefixes.has(prefix)) {
        selected.push(normalizeQuestion(q, 'Maths', q.topic));
        usedPrefixes.add(prefix);
      }
    }

    // Fallback if unique prefixes were fewer than length
    if (selected.length < length) {
      for (const q of shuffled) {
        if (selected.length >= length) break;
        if (!selected.some(s => s.id === q.id)) {
          selected.push(normalizeQuestion(q, 'Maths', q.topic));
        }
      }
    }

    questions = selected;

  } else if (subject === 'verbal') {
    const isCompound = topic === 'Compound Words (Special)' || topic === 'Compound_words';
    const isAll = !topic || topic === 'All Topics';

    if (isCompound) {
      title = 'Verbal: Compound Words Quiz';
      const pool = VR_COMPOUND_QUIZ.length > 0 ? VR_COMPOUND_QUIZ : (VERBAL_QUIZ['Compound_words']?.questions || []);
      questions = shuffle(pool).slice(0, length).map(q => normalizeQuestion(q, 'Verbal Reasoning', 'Compound Words'));
    } else if (!isAll && VERBAL_QUIZ[topic]) {
      const topicObj = VERBAL_QUIZ[topic];
      title = `Verbal: ${topicObj.title || topic} Quiz`;
      const qCount = topic === 'Logical_deduction' ? 5 : length;
      questions = shuffle(topicObj.questions || []).slice(0, qCount).map(q => normalizeQuestion(q, 'Verbal Reasoning', topicObj.title || topic));
    } else {
      title = '11+ Verbal Reasoning: Mixed Quiz';
      const allQs = [];
      Object.entries(VERBAL_QUIZ).forEach(([key, val]) => {
        if (val && Array.isArray(val.questions)) {
          val.questions.forEach(q => allQs.push(normalizeQuestion(q, 'Verbal Reasoning', val.title || key)));
        }
      });
      questions = shuffle(allQs).slice(0, length);
    }

  } else if (subject === 'nonverbal') {
    const isAll = !topic || topic === 'All Topics';
    const targetCount = length <= 10 ? 8 : length;

    if (!isAll && nonverbal[topic]) {
      title = `Non-Verbal: ${nonverbal[topic].title || topic} Quiz`;
      const dataset = nonverbal[topic].questions || [];
      const shuffled = shuffle(dataset);
      const selected = [];
      const seenStems = new Set();

      for (const q of shuffled) {
        if (selected.length >= targetCount) break;
        let stem = q.id;
        if (q.image) {
          try {
            let filename = decodeURIComponent(q.image.split('/').pop());
            filename = filename.replace(/\.\w+$/, '').replace(/\s*\(\d+\)$/, '');
            const lastUnderscore = filename.lastIndexOf('_');
            stem = lastUnderscore > -1 ? filename.substring(0, lastUnderscore) : filename.replace(/\d+$/, '');
          } catch (e) {
            stem = q.id;
          }
        }
        if (!seenStems.has(stem)) {
          selected.push(normalizeQuestion(q, 'Non-Verbal', nonverbal[topic].title || topic));
          seenStems.add(stem);
        }
      }

      if (selected.length < targetCount) {
        for (const q of shuffled) {
          if (selected.length >= targetCount) break;
          if (!selected.some(s => s.id === q.id)) {
            selected.push(normalizeQuestion(q, 'Non-Verbal', nonverbal[topic].title || topic));
          }
        }
      }
      questions = selected;

    } else {
      title = '11+ Non-Verbal: Mixed Dojo Quiz';
      const allQs = [];
      Object.entries(nonverbal).forEach(([key, val]) => {
        if (val && Array.isArray(val.questions)) {
          val.questions.forEach(q => allQs.push(normalizeQuestion(q, 'Non-Verbal', val.title || key)));
        }
      });
      questions = shuffle(allQs).slice(0, targetCount);
    }

  } else if (subject === 'grammar') {
    title = 'English: Grammar & Punctuation Story Quiz';
    const groups = {};
    GRAMMAR_QUIZ.forEach(q => {
      const parts = q.id.split('_');
      let key = parts.length >= 3 ? parts.slice(0, -1).join('_') : q.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    });

    const validKeys = Object.keys(groups).filter(k => groups[k].length >= 10);
    const chosenKey = validKeys.length > 0 
      ? validKeys[Math.floor(Math.random() * validKeys.length)] 
      : Object.keys(groups)[0];

    const groupQuestions = [...(groups[chosenKey] || [])];
    groupQuestions.sort((a, b) => {
      const getLine = (id) => {
        const parts = id.split('_');
        const num = parseInt(parts[parts.length - 1], 10);
        return isNaN(num) ? 0 : num;
      };
      return getLine(a.id) - getLine(b.id);
    });

    questions = groupQuestions.slice(0, Math.max(12, length)).map(q => normalizeQuestion(q, 'English Grammar', 'Grammar in Story'));

  } else if (subject === 'spelling') {
    title = 'English: Spelling Passage Quiz';
    const groups = {};
    SPELLING_QUIZ.forEach(q => {
      const key = q.passage ? q.passage.trim() : 'Unique';
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    });

    const validKeys = Object.keys(groups).filter(k => groups[k].length >= 5);
    const chosenKey = validKeys.length > 0 
      ? validKeys[Math.floor(Math.random() * validKeys.length)] 
      : Object.keys(groups)[0];

    const groupQuestions = [...(groups[chosenKey] || [])];
    questions = groupQuestions.slice(0, length).map(q => normalizeQuestion(q, 'Spelling', 'Spelling in Passage'));

  } else if (subject === 'cloze') {
    title = 'English: Cloze Reading Test';
    const groups = {};
    CLOZE_QUIZ.forEach(q => {
      const key = q.passage ? q.passage.trim() : 'Unique';
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    });

    const validKeys = Object.keys(groups).filter(k => groups[k].length >= 5);
    const chosenKey = validKeys.length > 0 
      ? validKeys[Math.floor(Math.random() * validKeys.length)] 
      : Object.keys(groups)[0];

    const groupQuestions = [...(groups[chosenKey] || [])];
    questions = groupQuestions.slice(0, length).map(q => normalizeQuestion(q, 'Cloze Reading', 'Cloze Test'));
  }

  return {
    title,
    subject,
    topic,
    questionCount: questions.length,
    questions,
  };
}

/**
 * Renders a question onto an HTML5 Canvas and returns a high-resolution PNG data URL
 */
export async function renderQuestionWorksheetCanvas(question, pageIndex = 1, totalPages = 1) {
  if (typeof document === 'undefined') return null;

  const width = 1000;
  const height = 1380;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Subtle Outer Card Border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // 1. Top Header Banner
  const gradient = ctx.createLinearGradient(30, 30, width - 60, 30);
  gradient.addColorStop(0, '#0F172A');
  gradient.addColorStop(1, '#1E293B');
  ctx.fillStyle = gradient;
  roundRect(ctx, 36, 36, width - 72, 70, 8, true, false);

  // Header Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('🥋 11+ Ninja Dojo • Tutoring Practice Worksheet', 56, 78);

  // Page Indicator Badge in Header
  if (totalPages > 1) {
    ctx.fillStyle = '#BE1E2D';
    roundRect(ctx, width - 180, 50, 120, 42, 6, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`Question ${pageIndex}/${totalPages}`, width - 168, 77);
  }

  // 2. Sub-header Badges: Subject, Topic & ID
  let curY = 135;
  const subjectColor = getSubjectColor(question.subject);

  // Subject Pill
  ctx.fillStyle = subjectColor;
  roundRect(ctx, 40, curY, 130, 32, 6, true, false);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(question.subject.toUpperCase(), 52, curY + 22);

  // Topic Pill
  ctx.fillStyle = '#F1F5F9';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  const topicText = `Topic: ${question.topic || 'General'}`;
  ctx.font = '600 14px system-ui, sans-serif';
  const topicWidth = ctx.measureText(topicText).width + 24;
  roundRect(ctx, 180, curY, topicWidth, 32, 6, true, true);
  ctx.fillStyle = '#334155';
  ctx.fillText(topicText, 192, curY + 22);

  // ID Pill
  const idText = `ID: ${question.id}`;
  const idWidth = ctx.measureText(idText).width + 20;
  roundRect(ctx, width - 40 - idWidth, curY, idWidth, 32, 6, true, true);
  ctx.fillStyle = '#64748B';
  ctx.fillText(idText, width - 30 - idWidth, curY + 22);

  curY += 55;

  // 3. Optional Passage (Comprehension / Grammar / Spelling)
  if (question.passage) {
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    const passageBoxY = curY;
    const passageHeight = 180;
    roundRect(ctx, 40, passageBoxY, width - 80, passageHeight, 8, true, true);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('📖 REFERENCE PASSAGE / STORY:', 55, passageBoxY + 24);

    ctx.fillStyle = '#1E293B';
    ctx.font = '14px system-ui, serif';
    wrapText(ctx, question.passage, 55, passageBoxY + 48, width - 110, 20, 7);

    curY += passageHeight + 25;
  }

  // 4. Question Prompt
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  const promptLines = wrapText(ctx, question.question, 42, curY + 28, width - 84, 32, 5);
  curY += promptLines * 32 + 20;

  // 5. Diagram / Image (if present, e.g. for Non-Verbal matrices or geometry)
  if (question.image && typeof Image !== 'undefined') {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const loaded = await new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = question.image;
        setTimeout(() => resolve(false), 2500); // 2.5s timeout fallback
      });

      if (loaded) {
        const maxImgWidth = 450;
        const maxImgHeight = 220;
        let imgW = img.width || maxImgWidth;
        let imgH = img.height || maxImgHeight;
        const scale = Math.min(maxImgWidth / imgW, maxImgHeight / imgH, 1);
        imgW = imgW * scale;
        imgH = imgH * scale;

        const imgX = (width - imgW) / 2;
        ctx.fillStyle = '#FFFFFF';
        roundRect(ctx, imgX - 10, curY - 5, imgW + 20, imgH + 20, 8, true, true);
        ctx.drawImage(img, imgX, curY + 5, imgW, imgH);
        curY += imgH + 30;
      }
    } catch (e) {
      console.warn('Could not draw question diagram:', e);
    }
  }

  // 6. Multiple Choice Options
  if (question.options && question.options.length > 0) {
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('SELECT THE CORRECT OPTION:', 42, curY + 16);
    curY += 28;

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const optWidth = (width - 100) / (question.options.length > 3 ? (question.options.length > 4 ? 5 : 4) : 3);
    const useRowLayout = question.options.some(o => o.length > 18);

    if (useRowLayout) {
      // Stack vertically
      question.options.forEach((opt, idx) => {
        const letter = letters[idx] || String(idx + 1);
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1.5;
        roundRect(ctx, 42, curY, width - 84, 46, 8, true, true);

        // Letter Circle
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(68, curY + 23, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText(letter, 62, curY + 28);

        // Option Text
        ctx.fillStyle = '#1E293B';
        ctx.font = '600 16px system-ui, sans-serif';
        ctx.fillText(opt, 96, curY + 29);

        curY += 56;
      });
    } else {
      // Horizontal grid
      const colWidth = (width - 84) / question.options.length;
      question.options.forEach((opt, idx) => {
        const letter = letters[idx] || String(idx + 1);
        const colX = 42 + idx * colWidth;
        const boxW = colWidth - 12;

        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1.5;
        roundRect(ctx, colX, curY, boxW, 58, 8, true, true);

        // Letter
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(colX + 24, curY + 29, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText(letter, colX + 19, curY + 34);

        // Option text
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText(opt, colX + 46, curY + 35);
      });
      curY += 72;
    }
  }

  // 7. Student Working Out Section (Ample blank/grid space)
  const workingTop = Math.max(curY + 20, 680);
  const workingHeight = height - workingTop - 70;

  if (workingHeight > 180) {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 42, workingTop, width - 84, workingHeight, 8, true, true);

    // Working Header
    ctx.fillStyle = '#F1F5F9';
    roundRect(ctx, 42, workingTop, width - 84, 38, 8, true, false);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('✏️ STUDENT WORKING OUT & CALCULATIONS SPACE', 58, workingTop + 24);

    // Grid lines for neat working out
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let gy = workingTop + 65; gy < workingTop + workingHeight - 15; gy += 28) {
      ctx.beginPath();
      ctx.moveTo(55, gy);
      ctx.lineTo(width - 55, gy);
      ctx.stroke();
    }
  }

  // 8. Footer
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('11+ Ninja Dojo • 1-on-1 Tutoring Session • www.11plusninja.com', 46, height - 35);
  ctx.fillText('All calculations and answers remain synchronized on the shared whiteboard', width - 460, height - 35);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    displayWidth: 800,
    displayHeight: 1104,
  };
}

function getSubjectColor(sub = '') {
  const s = sub.toLowerCase();
  if (s.includes('math')) return '#BE1E2D';
  if (s.includes('verb') && !s.includes('non')) return '#8B5CF6';
  if (s.includes('non')) return '#0EA5E9';
  if (s.includes('gram')) return '#F59E0B';
  if (s.includes('spell')) return '#10B981';
  return '#6366F1';
}

function roundRect(ctx, x, y, width, height, radius = 5, fill = false, stroke = true) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function wrapText(ctx, text = '', x, y, maxWidth, lineHeight, maxLines = 10) {
  const words = String(text).split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1) {
        ctx.fillText(line + '...', x, y);
        return lineCount + 1;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  return lineCount + 1;
}
