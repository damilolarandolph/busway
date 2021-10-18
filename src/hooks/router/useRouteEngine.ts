import { useCallback, useMemo, useState } from 'react';
import getWays, { Coords } from './routingEngine';

export interface Stop {
  type: 'stop';
  long: number;
  lat: number;
  name: string;
}

export interface Walk {
  type: 'walk';
  to: Stop | { type: 'custom'; lat: number; long: number };
}

export interface Route {
  type: 'route';
  name: string;
}

export type Trip = (Stop | Route | Walk)[];

export default function useRouteEngine() {
  const [status, setStatus] = useState<
    'idle' | 'routing' | 'failed' | 'success'
  >('idle');
  const [tripRoute, setTripRoute] = useState<Trip>([]);

  const routeTrip = useCallback(async (from: Coords, to: Coords) => {
    setStatus('routing');
    const trip = await getWays(from, to);
    if (!trip) {
      setStatus('failed');
      console.log('failed');
    } else {
      setTripRoute(trip);
      setStatus('success');
      console.log(trip);
    }
  }, []);

  const api = useMemo(() => {
    return {
      routeTrip,
      status,
      tripRoute,
    };
  }, [routeTrip, status, tripRoute]);

  return api;
}
