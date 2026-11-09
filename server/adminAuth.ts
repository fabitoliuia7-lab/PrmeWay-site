import type { RequestHandler } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import firebaseConfig from '../firebase-applet-config.json';

const ADMIN_EMAILS = new Set(['fabitoliuia7@gmail.com', 'comercial@primewayinvest.com']);
const firebaseApp = getApps().find(app => app.name === 'primeway-server') ?? initializeApp({
  projectId: firebaseConfig.projectId
}, 'primeway-server');

// ID-token signature, issuer, audience and expiry are verified against this Firebase project.
// No client-provided email/role/UID is trusted. Never enable an emulator bypass in the live server.
async function verifyToken(token: string): Promise<DecodedIdToken> {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Firebase Auth emulator is not allowed in the application server.');
  return getAuth(firebaseApp).verifyIdToken(token);
}

async function storedAdminRole(uid: string, token: string): Promise<boolean> {
  // Read only the authenticated user's own role with their token: no service-account secret
  // is needed and Firestore rules remain enforced. No production writes are performed here.
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${encodeURIComponent(firebaseConfig.firestoreDatabaseId)}/documents/users/${encodeURIComponent(uid)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000)
  });
  if (response.status === 404 || response.status === 403) return false;
  if (!response.ok) throw new Error('Admin role lookup unavailable.');
  const data = await response.json();
  return data.fields?.role?.stringValue === 'admin';
}

export function hasTrustedAdminClaim(claims: Pick<DecodedIdToken, 'email' | 'email_verified'> & { admin?: unknown }): boolean {
  return claims.admin === true || (claims.email_verified === true && ADMIN_EMAILS.has(claims.email ?? ''));
}

export function createAdminGuard(dependencies: {
  verify: (token: string) => Promise<DecodedIdToken>;
  storedRole: (uid: string, token: string) => Promise<boolean>;
} = { verify: verifyToken, storedRole: storedAdminRole }): RequestHandler {
  return async (req, res, next) => {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get('Authorization') ?? '');
    if (!match || match[1].length > 8192) {
      res.status(401).json({ error: 'Inicie sessão para realizar esta operação.' });
      return;
    }
    let claims: DecodedIdToken;
    try {
      claims = await dependencies.verify(match[1]);
    } catch {
      res.status(401).json({ error: 'Sessão inválida ou expirada. Volte a iniciar sessão.' });
      return;
    }
    try {
      if (!hasTrustedAdminClaim(claims) && !await dependencies.storedRole(claims.uid, match[1])) {
        res.status(403).json({ error: 'Esta operação está reservada aos administradores.' });
        return;
      }
    } catch {
      res.status(503).json({ error: 'Não foi possível verificar as permissões. Tente novamente mais tarde.' });
      return;
    }
    res.locals.adminUid = claims.uid;
    next();
  };
}

export const requireAdmin = createAdminGuard();
