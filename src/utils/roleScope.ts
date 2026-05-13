import type { StateStorage } from 'zustand/middleware';

export type DataScope = 'owner' | 'viewer' | 'guest';

const DATA_SCOPE_KEY = 'hisab-data-scope';

export function getDataScope(): DataScope {
  const storedScope = localStorage.getItem(DATA_SCOPE_KEY);
  if (storedScope === 'owner' || storedScope === 'viewer') {
    return storedScope;
  }
  return 'guest';
}

export function setDataScope(scope: 'owner' | 'viewer') {
  localStorage.setItem(DATA_SCOPE_KEY, scope);
}

export function clearDataScope() {
  localStorage.removeItem(DATA_SCOPE_KEY);
}

export function createScopedStorage(baseKey: string): StateStorage {
  return {
    getItem: () => localStorage.getItem(`${baseKey}:${getDataScope()}`),
    setItem: (_name, value) => {
      localStorage.setItem(`${baseKey}:${getDataScope()}`, value);
    },
    removeItem: () => {
      localStorage.removeItem(`${baseKey}:${getDataScope()}`);
    },
  };
}