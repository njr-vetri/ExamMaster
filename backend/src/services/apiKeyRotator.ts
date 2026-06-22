import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

export class GeminiKeyRotator {
  private keys: string[] = [];
  private currentIndex: number = 0;
  private clients: Map<string, GoogleGenAI> = new Map();
  private initialized = false;

  private init() {
    if (this.initialized) return;
    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    this.keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (this.keys.length === 0) {
      console.warn('No Gemini API keys provided!');
    } else {
      console.log(`Initialized GeminiKeyRotator with ${this.keys.length} key(s)`);
    }
    this.initialized = true;
  }

  public getClient(specificKey?: string): GoogleGenAI {
    this.init();
    const keyToUse = specificKey || this.getNextKey();
    if (!keyToUse) {
      // Fallback if completely missing
      return new GoogleGenAI({ apiKey: 'missing' });
    }
    
    if (!this.clients.has(keyToUse)) {
      this.clients.set(keyToUse, new GoogleGenAI({ apiKey: keyToUse }));
    }
    
    return this.clients.get(keyToUse)!;
  }

  public getNextKey(): string {
    this.init();
    if (this.keys.length === 0) return '';
    const key = this.keys[this.currentIndex];
    // Rotate to the next key
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  public async withRetry<T>(operation: (client: GoogleGenAI) => Promise<T>, specificKey?: string): Promise<T> {
    this.init();
    
    // If a specific key is provided, try it exactly once
    if (specificKey) {
      return operation(this.getClient(specificKey));
    }

    const retries = Math.max(1, this.keys.length);
    let lastError: any;

    for (let i = 0; i < retries; i++) {
      const client = this.getClient();
      try {
        return await operation(client);
      } catch (err: any) {
        lastError = err;
        const isQuotaError = err.status === 429 || 
                             err.status === 'RESOURCE_EXHAUSTED' || 
                             err.message?.includes('429') || 
                             err.message?.includes('Quota');
                             
        if (isQuotaError) {
          console.warn(`Gemini API rate limited or quota exceeded. Retrying with next key... (${i + 1}/${retries})`);
          continue; // Try next loop iteration with the next key
        }
        // If it's a different kind of error (e.g. bad request), throw immediately
        throw err;
      }
    }
    throw new Error(`All Gemini keys exhausted or failed. Last error: ${lastError?.message}`);
  }
}

export class GroqKeyRotator {
  private keys: string[] = [];
  private currentIndex: number = 0;
  private clients: Map<string, Groq> = new Map();
  private initialized = false;

  private init() {
    if (this.initialized) return;
    const rawKeys = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
    this.keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (this.keys.length === 0) {
      console.warn('No Groq API keys provided!');
    } else {
      console.log(`Initialized GroqKeyRotator with ${this.keys.length} key(s)`);
    }
    this.initialized = true;
  }

  public getClient(specificKey?: string): Groq {
    this.init();
    const keyToUse = specificKey || this.getNextKey();
    if (!keyToUse) {
      return new Groq({ apiKey: 'missing' });
    }
    
    if (!this.clients.has(keyToUse)) {
      this.clients.set(keyToUse, new Groq({ apiKey: keyToUse }));
    }
    
    return this.clients.get(keyToUse)!;
  }

  public getNextKey(): string {
    this.init();
    if (this.keys.length === 0) return '';
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  public async withRetry<T>(operation: (client: Groq) => Promise<T>, specificKey?: string): Promise<T> {
    this.init();
    
    if (specificKey) {
      return operation(this.getClient(specificKey));
    }

    const retries = Math.max(1, this.keys.length);
    let lastError: any;

    for (let i = 0; i < retries; i++) {
      const client = this.getClient();
      try {
        return await operation(client);
      } catch (err: any) {
        lastError = err;
        const isQuotaError = err.status === 429 || 
                             err.message?.includes('429') || 
                             err.message?.includes('rate_limit_exceeded') ||
                             err.error?.code === 'rate_limit_exceeded';
                             
        if (isQuotaError) {
          console.warn(`Groq API rate limited (429). Retrying with next key... (${i + 1}/${retries})`);
          continue; 
        }
        throw err;
      }
    }
    throw new Error(`All Groq keys exhausted or failed. Last error: ${lastError?.message || JSON.stringify(lastError?.error)}`);
  }
}

export const geminiRotator = new GeminiKeyRotator();
export const groqRotator = new GroqKeyRotator();
