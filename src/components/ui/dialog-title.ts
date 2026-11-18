import { createContext, useContext } from 'react';

export const DialogTitleContext = createContext<string | undefined>(undefined);

export function useDialogTitleId(): string | undefined {
  return useContext(DialogTitleContext);
}
