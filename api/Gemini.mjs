// Vercel serverless function: Gemini key server pe rehti hai, browser mein nahi.
// Vercel env var: GEMINI_KEY
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_KEY not set' });

  let prompt = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    prompt = String((body && body.prompt) || '').slice(0, 2500);
  } catch { return res.status(400).json({ error: 'bad body' }); }
  if (!prompt.trim()) return res.status(400).json({ error: 'empty prompt' });

  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1800, thinkingConfig: { thinkingBudget: 0 } }
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (d.error && d.error.message) || 'Gemini error' });
    const text = (d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
}
