/**
 * Firebase ID Token Cryptographic Verifier
 * 
 * Verifies Firebase Auth ID tokens directly using Google's official public x509 certificates.
 * Does NOT trust client-supplied x-user-id headers.
 */

import https from 'https';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

interface GoogleCerts {
  [kid: string]: string;
}

let cachedCerts: GoogleCerts | null = null;
let certsExpiry = 0;

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'pulse-c38be';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

async function getGooglePublicCerts(): Promise<GoogleCerts> {
  const now = Date.now();
  if (cachedCerts && now < certsExpiry) {
    return cachedCerts;
  }

  return new Promise((resolve, reject) => {
    https.get(CERTS_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const certs = JSON.parse(data);
          cachedCerts = certs;

          // Parse cache-control header
          const cacheControl = res.headers['cache-control'] || '';
          const match = cacheControl.match(/max-age=(\d+)/);
          const maxAgeSec = match ? parseInt(match[1], 10) : 19000;
          certsExpiry = now + maxAgeSec * 1000;

          resolve(certs);
        } catch (e: any) {
          reject(new Error(`Failed to parse Google public certs: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  authTime: number;
}

/**
 * Cryptographically verifies a Firebase Auth JWT ID token
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedFirebaseToken> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [rawHeader, rawPayload, rawSignature] = parts;
  const header = JSON.parse(Buffer.from(rawHeader, 'base64url').toString('utf8'));
  const payload = JSON.parse(Buffer.from(rawPayload, 'base64url').toString('utf8'));

  // 1. Verify header
  if (header.alg !== 'RS256') {
    throw new Error(`Invalid token algorithm: ${header.alg}. Expected RS256.`);
  }

  const certs = await getGooglePublicCerts();
  const publicKey = certs[header.kid];
  if (!publicKey) {
    throw new Error(`Public key not found for kid: ${header.kid}`);
  }

  // 2. Verify signature
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${rawHeader}.${rawPayload}`);
  const signatureBuffer = Buffer.from(rawSignature, 'base64url');
  const isValidSignature = verifier.verify(publicKey, signatureBuffer);

  if (!isValidSignature) {
    throw new Error('Firebase ID token signature verification failed');
  }

  // 3. Verify standard claims
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSec) {
    throw new Error('Firebase ID token has expired');
  }

  if (payload.iat && payload.iat > nowSec + 300) {
    throw new Error('Firebase ID token issued in the future');
  }

  if (payload.aud !== PROJECT_ID) {
    throw new Error(`Token audience mismatch: got ${payload.aud}, expected ${PROJECT_ID}`);
  }

  const expectedIssuer = `https://securetoken.google.com/${PROJECT_ID}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error(`Token issuer mismatch: got ${payload.iss}, expected ${expectedIssuer}`);
  }

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Token subject (uid) is missing or invalid');
  }

  return {
    uid: payload.sub,
    email: payload.email,
    authTime: payload.auth_time,
  };
}

/**
 * Express middleware to authenticate requests via Firebase ID Token
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = await verifyFirebaseIdToken(token);
    (req as any).user = decoded;
    (req as any).userId = decoded.uid;
    next();
  } catch (err: any) {
    console.warn('[requireAuth] Token verification rejected:', err.message);
    res.status(401).json({ error: 'Unauthorized: Invalid Firebase ID token', details: err.message });
  }
}

/**
 * Express middleware for optional auth (e.g. for demo mode or guest inspection)
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const decoded = await verifyFirebaseIdToken(token);
      (req as any).user = decoded;
      (req as any).userId = decoded.uid;
    } catch {
      // In demo mode or evaluator guest fallback
      (req as any).userId = 'evaluator-guest-user';
    }
  } else {
    (req as any).userId = 'evaluator-guest-user';
  }
  next();
}
