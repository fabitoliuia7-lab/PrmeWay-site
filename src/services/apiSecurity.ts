import { auth } from '../firebase';

export async function getFirebaseIdToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('É necessário iniciar sessão para executar esta operação.');
  }
  return currentUser.getIdToken();
}

export async function checkAdminSession(): Promise<{ admin: boolean; status: number }> {
  const sessionUid = auth.currentUser?.uid;
  const token = await getFirebaseIdToken();
  const response = await fetch('/api/admin/session', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  let body: { admin?: boolean } = {};
  try {
    body = await response.json();
  } catch {
    // A resposta de uma sessão inválida pode não conter JSON.
  }

  return {
    admin: sessionUid === auth.currentUser?.uid && response.ok && body.admin === true,
    status: response.status
  };
}
