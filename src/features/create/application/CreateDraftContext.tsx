import { createContext, useContext, type ReactNode } from 'react';
import { useCreateDraft } from '../application/useCreateDraft';

type CreateDraftContextValue = ReturnType<typeof useCreateDraft>;

const CreateDraftContext = createContext<CreateDraftContextValue | null>(null);

export function CreateDraftProvider({ children }: { children: ReactNode }) {
  const value = useCreateDraft();
  return (
    <CreateDraftContext.Provider value={value}>
      {children}
    </CreateDraftContext.Provider>
  );
}

export function useCreateDraftContext() {
  const ctx = useContext(CreateDraftContext);
  if (!ctx) {
    throw new Error('useCreateDraftContext must be used within CreateDraftProvider');
  }
  return ctx;
}
