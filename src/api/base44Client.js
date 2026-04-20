/**
 * Cliente de dados: mock local ou API real (Neon/Prisma) quando VITE_USE_REAL_API=true.
 * Com Firebase Auth activo, o mock local é usado para o catálogo e o login vem do Firebase.
 */
import { localMockClient } from '@/api/localMockClient';
import { realApiClient } from '@/api/realApiClient';
import { isFirebaseAuthMode } from '@/lib/firebaseApp';

const useRealApi = import.meta.env.VITE_USE_REAL_API === 'true';

export const base44 =
  useRealApi && !isFirebaseAuthMode() ? realApiClient : localMockClient;
