// Vercel Serverless Function: POST /api/comprehension
// Generates an original UK 11+ English comprehension passage + MCQs via Gemini structured JSON output.

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
      style = 'GL Assessment',
      theme = 'a vivid short story or natural history mystery',
      difficulty = 'Medium',
    } = body;

    const prompt = `Create an original UK 11+ English Comprehension exercise (${style} style, ${difficulty} difficulty) on the theme: ${theme}.
Return strictly valid JSON with this exact shape:
{
  "title": "Short engaging title",
  "passageText": "A rich, age-appropriate 280-340 word passage with 3-4 paragraphs separated by \\n\\n.",
  "questions": [
    {
      "id": "ai_q1",
      "question": "Clear 11+ comprehension question (mix literal, inference, vocabulary-in-context, and literary device).",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text", "Option E text"],
      "correctAnswer": "Exact text of one of the 5 options",
      "explanation": "1-2 sentence explanation citing evidence from the passage."
    }
  ]
}
Include exactly 6 questions. Each question must have 5 distinct options and correctAnswer must match one option verbatim.`;

    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const apiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({ error: `Gemini API error: ${errText}` });
    }

    const data = await apiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('') || '{}';
    const parsed = JSON.parse(rawText);

    if (!parsed.passageText || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(502).json({ error: 'Generated passage was incomplete. Please try again.' });
    }

    // Normalize questions to match ComprehensionScreen expectations
    const questions = parsed.questions.map((q, idx) => ({
      id: q.id || `ai_q${idx + 1}`,
      question: q.question,
      options: Array.isArray(q.options) ? q.options.slice(0, 5) : [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      passage: parsed.title || 'AI Passage',
    }));

    return res.status(200).json({
      title: parsed.title || '11+ Comprehension',
      passageText: parsed.passageText,
      questions,
      model,
    });
  } catch (err) {
    console.error('Sensei /api/comprehension error:', err);
    return res.status(500).json({ error: 'Failed to generate comprehension passage' });
  }
};
