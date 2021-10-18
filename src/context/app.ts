import { Trip } from 'hooks/router/useRouteEngine';
import { createContext } from 'react';

export interface AppContext {
  currentTrip: Trip | null;
  onTrip: boolean;
}

const context = createContext<{
  state: AppContext;
  setState: (slice: AppContext) => void;
}>({
  state: {
    currentTrip: null,
    onTrip: false,
  },
  setState: () => {},
});

export default context;
