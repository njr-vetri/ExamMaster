import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { geminiRotator } from './apiKeyRotator.js';

const generationCache = new Map<string, any[]>();

interface GenerateParams {
  subject: string;
  language: string;
  difficulty: string;
  questionCount: number;
  optionsCount: number;
  extractedText?: string;
  filePath?: string;
  mimeType?: string;
  apiKey?: string;
  reuseQuestions?: any[];
}

export async function generateQuestions(params: GenerateParams) {
  const {
    subject,
    language,
    difficulty,
    questionCount,
    optionsCount,
    extractedText,
    filePath,
    mimeType,
    apiKey,
    reuseQuestions
  } = params;

  const langInstruction = {
    english: 'Generate all questions and explanations in English only.',
    tamil: 'Generate all questions, options, and explanations in Tamil (தமிழ்) only. Use proper Tamil script.',
    bilingual: `Generate each question with:
- "text" in English
- "textTamil" as the Tamil (தமிழ்) translation
- "options" in English
- "optionsTamil" as Tamil translations of each option
- "explanation" in English
- "explanationTamil" in Tamil`
  }[language] || 'Generate in English.';

  const difficultyGuide = {
    easy: 'Simple recall questions suitable for beginners.',
    medium: 'Conceptual understanding questions requiring some analysis.',
    hard: 'Deep analytical questions requiring critical thinking and application.'
  }[difficulty] || 'Medium difficulty.';

  const contentContext = extractedText
    ? `\n\nUse the following extracted text as the primary source material for your questions:\n\n---\n${extractedText.slice(0, 3000)}\n---`
    : `\n\nGenerate questions based on standard ${subject} curriculum knowledge.`;

  const reuseContext = reuseQuestions?.length
    ? `\n\nYou may reuse or adapt these approved prior questions where relevant. Mix them naturally with new questions:\n${JSON.stringify(reuseQuestions).slice(0, 2500)}`
    : '';

  const prompt = `You are an expert exam question generator for Tamil Nadu students.

Subject: ${subject}
Difficulty: ${difficulty} — ${difficultyGuide}
Language instruction: ${langInstruction}
Number of questions: ${questionCount}
Number of options per question: ${optionsCount}
${contentContext}
${reuseContext}

Generate exactly ${questionCount} multiple-choice questions.

Return ONLY a valid JSON array (no markdown, no explanation text) with this exact structure:
[
  {
    "text": "Question text in English",
    "textTamil": "Tamil translation (only for bilingual)",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "optionsTamil": ["Tamil A", "Tamil B", "Tamil C", "Tamil D"],
    "correctOptionIndex": 1,
    "explanation": "Detailed explanation in English",
    "explanationTamil": "Detailed explanation in Tamil (only for bilingual)"
  }
]

Rules:
- correctOptionIndex must be 0-based index (0 to ${optionsCount - 1})
- Make sure exactly one option is correct
- Explanations must be educational and helpful
- For non-bilingual modes, omit Tamil fields entirely
- Do not add any text outside the JSON array`;

  try {
    let response: any;
    let base64Image = '';

    // Only send the image to Gemini if local OCR (Tesseract) failed or wasn't run
    if (!extractedText && filePath && mimeType && mimeType.startsWith('image/')) {
      const imageData = fs.readFileSync(filePath);
      base64Image = imageData.toString('base64');
    }

    // Check Cache
    const cachePayload = JSON.stringify({
      subject, language, difficulty, questionCount, optionsCount,
      extractedText: extractedText || '',
      base64Image,
      reuseIds: reuseQuestions?.map(q => q.id) || []
    });
    const cacheKey = crypto.createHash('sha256').update(cachePayload).digest('hex');

    if (generationCache.has(cacheKey)) {
      console.log('Cache hit! Returning previously generated questions.');
      const cached = generationCache.get(cacheKey)!;
      // Return clones with fresh UUIDs
      return cached.map((q: any) => ({ ...q, id: `q-${uuidv4()}` }));
    }

    const generateOp = async (client: any) => {
      if (base64Image) {
        const result = await client.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: mimeType as any, data: base64Image } },
                { text: prompt }
              ]
            }
          ]
        });
        return result.text;
      } else {
        const result = await client.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        return result.text;
      }
    };

    response = await geminiRotator.withRetry(generateOp, apiKey);

    // Parse the JSON response
    const cleaned = (response || '')
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Attach IDs, subject, language, difficulty, approved=false
    const finalQuestions = parsed.map((q: any) => ({
      id: `q-${uuidv4()}`,
      subject,
      text: q.text,
      textTamil: q.textTamil || undefined,
      options: q.options,
      optionsTamil: q.optionsTamil || undefined,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
      explanationTamil: q.explanationTamil || undefined,
      language,
      difficulty,
      approved: false
    }));

    // Cache the result
    generationCache.set(cacheKey, finalQuestions);

    return finalQuestions;

  } catch (err: any) {
    console.error('Gemini generation error:', err.message);
    throw new Error('AI question generation failed: ' + err.message);
  }
}
