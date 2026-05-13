import type { VercelRequest, VercelResponse } from '@vercel/node'

interface EmailDraftRequest {
  caseStats?: {
    confirmed: number
    deaths: number
    countries: number
    usStatesMonitoring: number
    lastUpdated: string
  }
  emsBullets?: string[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' })

  const body = req.body as EmailDraftRequest
  const stats = body?.caseStats
  const bullets = body?.emsBullets ?? []

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const statsText = stats
    ? `Global confirmed + probable cases: ${stats.confirmed}
Global deaths: ${stats.deaths}
Countries with confirmed/probable cases: ${stats.countries}
U.S. states with active monitoring: ${stats.usStatesMonitoring}
Data as of: ${stats.lastUpdated}`
    : 'Current statistics not available — see CDC Situation Summary for latest data.'

  const bulletsText =
    bullets.length > 0
      ? bullets.map((b: string) => `• ${b}`).join('\n')
      : '• See source documents below for full clinical guidance.'

  const prompt = `You are drafting a situational awareness email for EMS agency leadership, emergency managers, and medical directors about the 2026 Andes hantavirus outbreak linked to the MV Hondius cruise ship.

Write a professional, factual email using ONLY the data provided below. Do not add information not in the inputs. Do not speculate about future risk. Be concise.

Current data:
${statsText}

EMS operational briefing points:
${bulletsText}

Format the output as follows:
SUBJECT: [subject line]
---
[email body]
---

The email body should include:
1. A one-sentence situation summary
2. The case statistics (labeled as sourced from WHO/CDC/ECDC)
3. The EMS briefing bullet points (labeled as sourced from CDC HAN 528 + ECDC RRA)
4. Links to three source documents: CDC HAN 528, ECDC Surveillance Page, NYC DOH HAN Advisory #8
5. Standard EMERGENZ disclaimer: "This is an automated situational awareness briefing compiled from publicly available authoritative sources. It does not constitute medical advice. Follow your agency protocols and medical director directives."
6. Sign-off: "EMERGENZ Hantavirus Intelligence Dashboard | hantavirus-intel-dashboard.vercel.app"`

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!geminiRes.ok) {
      return res.status(502).json({ error: 'Gemini API error', status: geminiRes.status })
    }

    const data = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Extract subject and body
    const subjectMatch = rawText.match(/SUBJECT:\s*(.+)/i)
    const subject =
      subjectMatch?.[1]?.trim() ??
      `EMERGENZ Situational Alert: Andes Virus / MV Hondius Outbreak — ${today}`

    const bodyMatch = rawText.match(/---\s*([\s\S]+?)(?:---\s*$|$)/)
    const emailBody = bodyMatch?.[1]?.trim() ?? rawText

    return res.status(200).json({
      subject,
      body: emailBody,
      generatedAt: new Date().toISOString(),
      model: 'gemini-2.0-flash',
    })
  } catch (err) {
    console.error('email-draft error:', err)
    return res.status(500).json({ error: String(err) })
  }
}
