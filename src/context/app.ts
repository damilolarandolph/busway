import { createContext } from 'react';

export interface Place {
  name: string;
  long: number;
  lat: number;
}

export interface Trip {
  source: Place | null;
  stops: Array<Place>;
}

export interface AppContext {
  currentTrip: {
    trip: Trip;
  };
}

const context = createContext<{
  state: AppContext;
  setState: (slice: AppContext) => void;
}>({
  state: {
    currentTrip: {
      trip: { source: null, stops: [] },
    },
  },
  setState: () => {},
});

export default context;
