import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const generationCache = new Map<string, any[]>();

// Lazy client — created on first request so that dotenv has already loaded the key by then
let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      throw new Error('GROQ_API_KEY is not set in your .env file!');
    }
    _groq = new Groq({ apiKey });
  }
  return _groq;
}

interface GenerateParams {
  subject: string;
  language: string;
  difficulty: string;
  questionCount: number;
  optionsCount: number;
  extractedText?: string;
  filePath?: string; // Groq doesn't support images, so we ignore this
  mimeType?: string;
  apiKey?: string;
  reuseQuestions?: any[];
  excludeQuestionTexts?: string[];
}

async function generateQuestionsSingleBatch(params: GenerateParams) {
  const {
    subject,
    language,
    difficulty,
    questionCount,
    optionsCount,
    extractedText,
    reuseQuestions,
    excludeQuestionTexts
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
    ? `\n\nYou may reuse or adapt these approved prior questions where relevant. Mix them naturally with new questions:\n${JSON.stringify(reuseQuestions).slice(0, 1500)}`
    : '';

  const excludeContext = excludeQuestionTexts?.length
    ? `\n\nAvoid generating questions similar to these already generated questions:\n- ${excludeQuestionTexts.join('\n- ')}`
    : '';

  const prompt = `You are an expert exam question generator for Tamil Nadu students.

Subject: ${subject}
Difficulty: ${difficulty} — ${difficultyGuide}
Language instruction: ${langInstruction}
Number of questions: ${questionCount}
Number of options per question: ${optionsCount}
${contentContext}
${reuseContext}
${excludeContext}

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
    // Check Cache
    const cachePayload = JSON.stringify({
      subject, language, difficulty, questionCount, optionsCount,
      extractedText: extractedText || '',
      reuseIds: reuseQuestions?.map(q => q.id) || [],
      excludeQuestionTexts: excludeQuestionTexts || []
    });
    const cacheKey = crypto.createHash('sha256').update(cachePayload).digest('hex');

    if (generationCache.has(cacheKey)) {
      console.log('Cache hit! Returning previously generated questions.');
      const cached = generationCache.get(cacheKey)!;
      return cached.map((q: any) => ({ ...q, id: `q-${uuidv4()}` }));
    }

    // Call Groq (using Llama-3 8B which is lightning fast and free)
    const groq = getGroq();
    // Compute max_tokens dynamically. For 10 bilingual questions, 3000 tokens is perfect.
    const dynamicMaxTokens = Math.min(4500, Math.max(1000, questionCount * 300));
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: dynamicMaxTokens,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '[]';

    // Parse the JSON response
    let cleaned = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      // If the JSON got cut off (token limit reached), try to recover the completed questions
      console.warn("AI response was cut off. Attempting to recover completed questions...");
      const lastBraceIndex = cleaned.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        // Find the last complete object and close the array
        const truncated = cleaned.substring(0, lastBraceIndex + 1) + ']';
        try {
          parsed = JSON.parse(truncated);
          console.log(`Successfully recovered ${parsed.length} questions from cut-off response.`);
        } catch (recoveryError) {
          throw new Error('Could not recover cut-off JSON: ' + (recoveryError as Error).message);
        }
      } else {
        throw parseError; // Rethrow original if recovery completely fails
      }
    }

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

    generationCache.set(cacheKey, finalQuestions);
    return finalQuestions;

  } catch (err: any) {
    console.error('Groq generation error:', err.message);
    throw new Error('AI question generation failed (Groq): ' + err.message);
  }
}

export async function generateQuestions(params: GenerateParams) {
  const requestedCount = params.questionCount;
  
  if (requestedCount <= 10) {
    return generateQuestionsSingleBatch(params);
  }

  console.log(`Requested ${requestedCount} questions. Splitting into batches of 10...`);
  const allQuestions: any[] = [];
  let remaining = requestedCount;
  
  while (remaining > 0) {
    const currentBatchSize = Math.min(remaining, 10);
    console.log(`Generating batch of ${currentBatchSize} questions (${remaining} remaining)...`);
    
    try {
      const batchParams: GenerateParams = {
        ...params,
        questionCount: currentBatchSize,
        excludeQuestionTexts: allQuestions.map(q => q.text)
      };

      const batchResult = await generateQuestionsSingleBatch(batchParams);
      if (batchResult && batchResult.length > 0) {
        allQuestions.push(...batchResult);
      } else {
        console.warn('Batch generation returned empty results. Stopping.');
        break;
      }
    } catch (batchError) {
      console.error('Error generating batch:', batchError);
      // If we have some questions generated, we can stop and return what we got rather than failing entirely
      if (allQuestions.length > 0) {
        console.warn(`Returning partial results: ${allQuestions.length} of ${requestedCount} questions.`);
        break;
      } else {
        throw batchError;
      }
    }

    remaining -= currentBatchSize;
    
    // Add a short delay to stay within rate limits (RPM/TPM)
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return allQuestions;
}

// ----------------------------------------------------
// Tutor Service Ported to Groq
// ----------------------------------------------------
interface TutorParams {
  message: string;
  language?: string;
  doubtQuestion?: {
    text: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    subject: string;
  } | null;
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
}

export async function chatWithTutor(params: TutorParams): Promise<string> {
  const { message, language = 'bilingual', doubtQuestion, history = [] } = params;

  const langNote = {
    english: 'Respond in English only.',
    tamil: 'Respond in Tamil (தமிழ்) only. Use clear and simple Tamil.',
    bilingual: 'Respond in both English and Tamil. First give English, then Tamil translation below.'
  }[language] || 'Respond in English.';

  let systemContext = `You are ExamMaster AI Tutor — a helpful, encouraging study assistant for Tamil Nadu students.
You specialize in Tamil, English, Science, Math, and History subjects.
${langNote}
Keep answers concise, clear, and educational. Be warm and encouraging.`;

  if (doubtQuestion) {
    systemContext += `\n\nThe student has a doubt about this question:
Question: ${doubtQuestion.text}
Options: ${doubtQuestion.options.map((o, i) => `${i + 1}. ${o}`).join(', ')}
Correct Answer: Option ${doubtQuestion.correctOptionIndex + 1} — "${doubtQuestion.options[doubtQuestion.correctOptionIndex]}"
Explanation: ${doubtQuestion.explanation}
Subject: ${doubtQuestion.subject}

Help the student understand why the correct answer is right and why others are wrong.`;
  }

  const messages: any[] = [
    { role: 'system', content: systemContext }
  ];

  for (const msg of history.slice(-6)) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  }

  messages.push({ role: 'user', content: message });

  try {
    const groq = getGroq();
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1000,
    });

    return chatCompletion.choices[0]?.message?.content || 'I am sorry, I could not generate a response. Please try again.';
  } catch (err: any) {
    console.error('Groq Tutor Error:', err.message);
    throw new Error('AI tutor unavailable (Groq): ' + err.message);
  }
}
