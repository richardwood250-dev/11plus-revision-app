// Vercel Serverless Function: POST /api/explain
// Uses Gemini to provide age-appropriate 11+ hints and step-by-step explanations.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server.',
      code: 'MISSING_API_KEY',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      subject = '11+ Practice',
      topic = 'General',
      question = '',
      options = [],
      userAnswer = '',
      correctAnswer = '',
      passageText = '',
      imageUrl = '',
      mode = 'explain', // 'hint' | 'explain'
    } = body;

    if (!question && !imageUrl) {
      return res.status(400).json({ error: 'Missing question text or image' });
    }

    const isHint = mode === 'hint';
    const systemPrompt = isHint
      ? 'You are Sensei, a friendly, encouraging UK 11+ tutor for 9–11 year old students. Give a short 1–2 sentence Socratic hint to help the student solve the question themselves. If an image/diagram is attached, refer specifically to the shapes, patterns, or numbers visible in the image. NEVER reveal the final answer or option letter.'
      : 'You are Sensei, a friendly, encouraging UK 11+ tutor for 9–11 year old students. Explain clearly in 2–4 short steps why the correct answer is right. If an image/diagram is attached, reference the specific visual details in the diagram. If the student chose a wrong answer, gently point out the trap or misconception. Keep it concise and easy to read.';

    const partsText = [
      `Subject: ${subject} (${topic})`,
      passageText ? `Passage excerpt: ${String(passageText).slice(0, 1800)}` : '',
      question ? `Question: ${question}` : '',
      Array.isArray(options) && options.length ? `Options: ${options.join(' | ')}` : '',
      !isHint && correctAnswer ? `Correct Answer: ${correctAnswer}` : '',
      !isHint && userAnswer ? `Student's Answer: ${userAnswer}` : '',
    ].filter(Boolean).join('\n');

    const userParts = [{ text: partsText }];

    // Attach image inline if provided (supports data URLs and http(s) URLs)
    if (imageUrl && typeof imageUrl === 'string') {
      try {
        if (imageUrl.startsWith('data:image/')) {
          const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
          if (match) {
            userParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
          }
        } else if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
          let imgRes = await fetch(imageUrl);
          // Match ResilientImage.js uppercase filename fallback
          if (!imgRes.ok) {
            const parts = imageUrl.split('/');
            const filename = parts.pop();
            if (filename && filename.toUpperCase() !== filename) {
              imgRes = await fetch([...parts, filename.toUpperCase()].join('/'));
            }
          }
          if (imgRes.ok) {
            const contentType = imgRes.headers.get('content-type') || 'image/png';
            const mimeType = contentType.split(';')[0].trim();
            const buf = Buffer.from(await imgRes.arrayBuffer());
            userParts.push({ inlineData: { mimeType, data: buf.toString('base64') } });
          }
        }
      } catch (imgErr) {
        console.warn('Sensei image fetch skipped:', imgErr.message);
      }
    }

    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const apiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: userParts }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 320,
        },
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({ error: `Gemini API error: ${errText}` });
    }

    const data = await apiRes.json();
    const explanation =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n').trim() ||
      'Sensei could not generate an explanation right now.';

    return res.status(200).json({ explanation, model });
  } catch (err) {
    console.error('Sensei /api/explain error:', err);
    return res.status(500).json({ error: 'Failed to generate explanation' });
  }
};
