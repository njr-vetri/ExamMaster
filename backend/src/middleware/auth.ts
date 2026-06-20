import type { NextFunction, Request, Response } from 'express';
import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

type AuthedRequest = Request & {
  user?: {
    uid: string;
    email?: string;
  };
};

function getPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
}

function getServiceAccountJson() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  const unwrapped = ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"')))
    ? raw.slice(1, -1)
    : raw;

  return JSON.parse(unwrapped);
}

function loadEnvFiles() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.join(__dirname, '../../../.env') });
  dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });
}

function getFirebaseAuth(): Auth {
  loadEnvFiles();

  if (getApps().length) return getAuth();

  const serviceAccount = getServiceAccountJson();

  if (serviceAccount) {
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && getPrivateKey()) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });
  } else {
    initializeApp({ credential: applicationDefault() });
  }

  return getAuth();
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = await getFirebaseAuth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
    };
    return next();
  } catch (err: any) {
    console.error('Firebase token verification failed:', err?.code || err?.message || err);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

export type { AuthedRequest };
