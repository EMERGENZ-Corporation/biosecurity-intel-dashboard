import type { VercelRequest, VercelResponse } from '@vercel/node'

// Source passages used as Gemini input — verbatim from CDC HAN 528 + ECDC RRA
const SOURCE_TEXT = `
SOURCE: CDC Health Alert Network HAN 528 (May 8, 2026)

Andes virus (ANDV) is the only hantavirus known to spread from person to person. This person-to-person transmission occurs through close, prolonged contact with infected persons, including possible exposure to respiratory secretions, blood, or other bodily fluids. The incubation period is 4 to 42 days after exposure.

Clinical features: Early symptoms include fever, fatigue, and muscle aches. In severe cases, patients develop acute respiratory distress syndrome (ARDS), pulmonary edema, and cardiovascular shock. The case fatality rate for Andes virus HPS is approximately 38%.

Healthcare workers should use airborne infection isolation precautions when caring for suspected or confirmed ANDV patients: gown, gloves, eye protection, and N95 respirator or higher. Aerosol-generating procedures require full airborne PPE.

CDC recommends that patients with suspected ANDV be placed in a negative pressure airborne infection isolation room (AIIR) immediately. Contact CDC Emergency Operations Center (770-488-7100) for testing coordination.

SOURCE: ECDC Rapid Risk Assessment — Hantavirus, May 6, 2026

The risk of person-to-person transmission in healthcare settings is considered very low when appropriate standard and droplet precautions are applied. Airborne precautions are recommended for aerosol-generating procedures.

The overall risk to EU/EEA general population is assessed as very low. Risk for healthcare workers treating ANDV patients without appropriate PPE is higher and has been documented in historical outbreaks.

Monitoring period: Individuals with potential exposure should be monitored for 42 days from last exposure. Symptom onset with fever, myalgia, or respiratory symptoms during this window warrants immediate evaluation.
`

const SYSTEM_PROMPT = `You are preparing a briefing for an EMS provider who may respond to a suspected Andes hantavirus patient. Summarize only what is stated in the provided source text. Do not add any information not present in the input. Do not speculate. Output exactly 5 bullet points formatted as plain text (start each with "• "). Focus on: transmission mode, PPE requirements, clinical warning signs, testing contact, and monitoring period.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' })
  }

  try {
    const prompt = `${SYSTEM_PROMPT}\n\nSOURCE TEXT:\n${SOURCE_TEXT}`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 512,
            topP: 0.8,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '')
      console.error('Gemini error:', geminiRes.status, errText.slice(0, 200))
      return res.status(502).json({ error: 'Gemini API error', status: geminiRes.status })
    }

    const data = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Parse bullet points
    const bullets = rawText
      .split('\n')
      .map((line: string) => line.replace(/^[•\-*]\s*/, '').trim())
      .filter((line: string) => line.length > 10)
      .slice(0, 5)

    return res.status(200).json({
      bullets,
      rawText,
      generatedAt: new Date().toISOString(),
      sources: ['CDC HAN 528 (May 8, 2026)', 'ECDC Rapid Risk Assessment (May 6, 2026)'],
      model: 'gemini-2.0-flash',
    })
  } catch (err) {
    console.error('ems-summary error:', err)
    return res.status(500).json({ error: String(err) })
  }
}
