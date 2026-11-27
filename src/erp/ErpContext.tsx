import React, { createContext, useContext, useState } from 'react';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';

export enum ErpOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: ErpOperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function logErpFirestoreError(
  error: unknown,
  operationType: ErpOperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

interface ErpContextValue {
  route: string;
  navigate: (path: string) => void;
  user: User | null;
  onExitErp: () => void;
}

const ErpContext = createContext<ErpContextValue>({
  route: '/',
  navigate: () => {},
  user: null,
  onExitErp: () => {},
});

export const ErpProvider: React.FC<{
  user: User | null;
  onExitErp: () => void;
  children: React.ReactNode;
}> = ({ user, onExitErp, children }) => {
  const [route, setRoute] = useState<string>('/');

  const navigate = (path: string) => {
    setRoute(path.startsWith('/') ? path : `/${path}`);
  };

  return (
    <ErpContext.Provider value={{ route, navigate, user, onExitErp }}>
      {children}
    </ErpContext.Provider>
  );
};

export const useErp = () => useContext(ErpContext);
