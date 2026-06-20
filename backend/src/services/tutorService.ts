import { geminiRotator } from './apiKeyRotator.js';

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
    systemContext += `

The student has a doubt about this question:
Question: ${doubtQuestion.text}
Options: ${doubtQuestion.options.map((o, i) => `${i + 1}. ${o}`).join(', ')}
Correct Answer: Option ${doubtQuestion.correctOptionIndex + 1} — "${doubtQuestion.options[doubtQuestion.correctOptionIndex]}"
Explanation: ${doubtQuestion.explanation}
Subject: ${doubtQuestion.subject}

Help the student understand why the correct answer is right and why others are wrong.`;
  }

  // Build conversation history
  const messages: any[] = [
    { role: 'user', parts: [{ text: systemContext + '\n\nStart now.' }] },
    { role: 'model', parts: [{ text: 'Understood! I am ready to help.' }] }
  ];

  for (const msg of history.slice(-6)) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  }

  messages.push({ role: 'user', parts: [{ text: message }] });

  try {
    const generateOp = async (client: any) => {
      const result = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: messages,
        config: { maxOutputTokens: 600 }
      });
      return result.text || 'I am sorry, I could not generate a response. Please try again.';
    };

    return await geminiRotator.withRetry(generateOp);
  } catch (err: any) {
    console.error('Tutor chat error:', err.message);
    throw new Error('AI tutor unavailable: ' + err.message);
  }
}
