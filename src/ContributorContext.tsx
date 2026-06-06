import { createContext, useContext } from 'react';

interface ContributorContextValue {
  navigateToContributor: (name: string) => void;
}

export const ContributorContext = createContext<ContributorContextValue>({
  navigateToContributor: () => {},
});

export function useContributor() {
  return useContext(ContributorContext);
}
