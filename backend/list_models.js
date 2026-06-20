import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function list() {
  const response = await ai.models.list();
  for (const model of response) {
    if (model.name.includes('flash')) {
      console.log(model.name);
    }
  }
}
list().catch(console.error);
