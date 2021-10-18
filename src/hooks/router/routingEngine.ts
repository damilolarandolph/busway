import haversine from 'haversine';
import { Database } from '../../data';
import { Stop, Trip } from './useRouteEngine';

interface TripObject {
  type: 'trip';
  id: string;
  name: string;
  stops: string[];
}

interface StopObject {
  type: 'stop';
  id: string;
  name: string;
  long: number;
  lat: number;
  trips: string[];
  visited: boolean;
}

interface Connection {
  tripId: string;
  toStop: string;
}

interface StopNode {
  stopId: string;
  connections: Connection[];
}

let Graph: Map<string, StopNode>;
let routeObjects: {
  [key: string]: TripObject;
};
let stopsList: {
  [key: string]: StopObject;
};

async function setup() {
  if (!Graph || !routeObjects || !stopsList) {
    Graph = new Map<string, StopNode>();
    routeObjects = {};
    stopsList = {};
    const res = await Database.execSql(
      [
        {
          sql: `SELECT st.stop_id, t.trip_headsign, t.trip_id, s.stop_name, s.stop_lon, s.stop_lat
         FROM trips t
       INNER JOIN stop_times st on t.trip_id = st.trip_id
       INNER JOIN stops s on st.stop_id = s.stop_id
       ORDER BY st.stop_sequence ASC
       `,
          args: [],
        },
      ],
      true,
    );
    const routesDb = res[0]!.rows;
    for (let routeIndex = 0; routeIndex < routesDb.length; routeIndex += 1) {
      if (!stopsList[routesDb[routeIndex].stop_id]) {
        stopsList[routesDb[routeIndex].stop_id] = {
          type: 'stop',
          id: routesDb[routeIndex].stop_id,
          long: routesDb[routeIndex].stop_lon,
          lat: routesDb[routeIndex].stop_lat,
          name: routesDb[routeIndex].stop_name,
          visited: false,
          trips: [],
        };
      }
      stopsList[routesDb[routeIndex].stop_id].trips.push(
        routesDb[routeIndex].trip_id,
      );
      if (!routeObjects[routesDb[routeIndex].trip_id]) {
        routeObjects[routesDb[routeIndex].trip_id] = {
          type: 'trip',
          id: routesDb[routeIndex].trip_id,
          name: routesDb[routeIndex].trip_headsign,
          stops: [routesDb[routeIndex].stop_id],
        };
      } else {
        routeObjects[routesDb[routeIndex].trip_id].stops.push(
          routesDb[routeIndex].stop_id,
        );
      }
    }
    const objectKeys = Object.keys(routeObjects);
    // console.log(routeObjects['344']);
    for (let routeIndex = 0; routeIndex < objectKeys.length; routeIndex += 1) {
      const route = routeObjects[objectKeys[routeIndex]];

      const { stops } = route;

      for (let stopIndex = 0; stopIndex < stops.length; stopIndex += 1) {
        if (!Graph.get(stops[stopIndex])) {
          Graph.set(stops[stopIndex], {
            stopId: stops[stopIndex],
            connections: [],
          });
        }

        const nextStop = stops[stopIndex + 1];
        if (nextStop) {
          const node = Graph.get(stops[stopIndex]);
          if (node) {
            node.connections.push({ tripId: route.id, toStop: nextStop });
          }
        }
      }
    }
  }
}

export interface Coords {
  long: number;
  lat: number;
}

export default async function getWays(
  from: Coords,
  to: Coords,
): Promise<Trip | null> {
  const start = '5030924913';
  const stop = '5027303266';
  // const start = '5010786347';
  // const stop = 'SA5036738889';
  try {
    await setup();
  } catch (e) {
    console.log(e);
  }

  if (!Graph || !routeObjects || !stopsList) {
    return null;
  }
  const graphValues = Array.from(Object.values(stopsList));

  graphValues.sort((firstEl, secondEl) => {
    const distance = haversine(
      { latitude: from.lat, longitude: from.long },
      { latitude: firstEl.lat, longitude: firstEl.long },
    );
    const otherDistance = haversine(
      { latitude: from.lat, longitude: from.long },
      { latitude: secondEl.lat, longitude: secondEl.long },
    );
    if (distance < otherDistance) {
      return -1;
    }
    if (distance > otherDistance) {
      return 1;
    }
    return 0;
  });

  const closestStartingStops = graphValues.slice(0, 3);

  graphValues.sort((firstEl, secondEl) => {
    const distance = haversine(
      { latitude: to.lat, longitude: to.long },
      { latitude: firstEl.lat, longitude: firstEl.long },
    );
    const otherDistance = haversine(
      { latitude: to.lat, longitude: to.long },
      { latitude: secondEl.lat, longitude: secondEl.long },
    );
    if (distance < otherDistance) {
      return -1;
    }
    if (distance > otherDistance) {
      return 1;
    }
    return 0;
  });

  const closestEndingStops = graphValues.slice(0, 3);

  let currMinTrip: Trip | null = null;

  for (
    let startStop = 0;
    startStop < closestStartingStops.length;
    startStop += 1
  ) {
    for (let endStop = 0; endStop < closestEndingStops.length; endStop += 1) {
      const trip = dijkstra(
        closestStartingStops[startStop].id,
        closestEndingStops[endStop].id,
      );
      if (trip) {
        if (!currMinTrip) {
          currMinTrip = trip;
        } else if (currMinTrip.length > trip.length) {
          currMinTrip = trip;
        }
      }
    }
  }

  if (currMinTrip) {
    currMinTrip.unshift({ type: 'walk', to: currMinTrip[0] as Stop });
    currMinTrip.push({
      type: 'walk',
      to: { type: 'custom', lat: to.lat, long: to.long },
    });
  }

  return currMinTrip;
}

function findMin(
  vertices: Set<string>,
  dist: { [key: string]: any[] },
): string {
  const iterator = vertices.values();
  let currentMin = 90000000;
  let stop = '';
  let result = iterator.next();
  while (!result.done) {
    const distItem = dist[result.value];
    if (distItem && distItem.length !== 0 && distItem.length < currentMin) {
      currentMin = distItem.length;
      stop = result.value;
    }
    result = iterator.next();
  }

  return stop;
}

function dijkstra(start: string, stop: string): Trip | null {
  const dist: { [key: string]: any[] } = {};
  const prev: { [key: string]: string } = {};

  const vertices = new Set<string>(Graph.keys());
  let found = false;

  dist[start] = [];
  prev[start] = '';
  vertices.delete(start);
  relax(Graph.get(start)!, vertices, dist, prev);
  while (vertices.size > 0 && !found) {
    const min = findMin(vertices, dist);
    if (min === stop) {
      found = true;
    }
    vertices.delete(min);
    const item = Graph.get(min);
    if (item !== undefined) {
      relax(item, vertices, dist, prev);
    } else {
      return null;
    }
  }
  const result: string[] = dist[stop];

  const trip: Trip = [];

  trip.push({
    type: 'stop',
    name: stopsList[start].name,
    long: stopsList[start].long,
    lat: stopsList[start].lat,
  });

  for (let distIndex = 0; distIndex < result.length; distIndex += 1) {
    const stopItem = result[distIndex];
    if (stopItem.startsWith('#')) {
      trip.push({
        type: 'route',
        name: routeObjects[stopItem.slice(1)].name,
      });
    } else {
      const stopListItem = stopsList[stopItem.slice(1)];
      trip.push({
        type: 'stop',
        name: stopListItem.name,
        long: stopListItem.long,
        lat: stopListItem.lat,
      });
    }
  }

  trip.push({
    type: 'stop',
    name: stopsList[stop].name,
    long: stopsList[stop].long,
    lat: stopsList[stop].lat,
  });

  return trip;
}

function relax(
  vertex: StopNode,
  vertices: Set<string>,
  dist: { [key: string]: any[] },
  prev: { [key: string]: any },
) {
  const currentDistance = dist[vertex.stopId];
  const currentPrev = prev[vertex.stopId];

  const lastDistanceItem = currentDistance.at(-1);
  for (let conIndex = 0; conIndex < vertex.connections.length; conIndex += 1) {
    const connection = vertex.connections[conIndex];
    const routeObject = routeObjects[connection.tripId];
    const stopsAhead = routeObject.stops.indexOf(vertex.stopId);
    for (
      let ahead = stopsAhead + 1;
      ahead < routeObject.stops.length;
      ahead += 1
    ) {
      if (vertices.has(routeObject.stops[ahead])) {
        const stopNode = Graph.get(routeObject.stops[ahead]);

        if (!dist[stopNode!.stopId]) {
          // eslint-disable-next-line no-param-reassign
          dist[stopNode!.stopId] = [];
        }

        if (!prev[stopNode!.stopId]) {
          // eslint-disable-next-line no-param-reassign
          prev[stopNode!.stopId] = '';
        }
        const connectionDistance = dist[stopNode!.stopId];

        if (lastDistanceItem) {
          let newDistance: string[];
          let newPrev: string;
          if (lastDistanceItem === `#${connection.tripId}`) {
            newDistance = [...currentDistance];
            newPrev = currentPrev;
          } else {
            newDistance = [
              ...currentDistance,
              `$${vertex.stopId}`,
              `#${connection.tripId}`,
            ];
            newPrev = vertex.stopId;
          }

          if (
            connectionDistance.length === 0 ||
            newDistance.length < connectionDistance.length
          ) {
            // eslint-disable-next-line no-param-reassign
            dist[stopNode!.stopId] = newDistance;
            // eslint-disable-next-line no-param-reassign
            prev[stopNode!.stopId] = newPrev;
          }
        } else {
          // eslint-disable-next-line no-param-reassign
          dist[stopNode!.stopId] = [`#${connection.tripId}`];
          // eslint-disable-next-line no-param-reassign
          prev[stopNode!.stopId] = vertex.stopId;
        }
      }
    }
  }
}

// function relax(
//   vertex: StopNode,
//   vertices: Set<string>,
//   dist: { [key: string]: any[] },
//   prev: { [key: string]: any },
// ) {
//   let currentDistance = dist[vertex.stopId];
//   let currentPrev = prev[vertex.stopId];

//   const lastDistanceItem = currentDistance.at(-1);
//   for (let conIndex = 0; conIndex < vertex.connections.length; conIndex += 1) {
//     let connection = vertex.connections[conIndex];
//     if (vertices.has(connection.toStop)) {
//       let stopNode = Graph.get(connection.toStop);

//       if (!dist[stopNode!.stopId]) {
//         dist[stopNode!.stopId] = [];
//       }

//       if (!prev[stopNode!.stopId]) {
//         prev[stopNode!.stopId] = '';
//       }
//       const connectionDistance = dist[stopNode!.stopId];

//       if (lastDistanceItem) {
//         let newDistance: string[];
//         let newPrev: string;
//         if (lastDistanceItem === '#' + connection.tripId) {
//           newDistance = [...currentDistance];
//           newPrev = currentPrev;
//         } else {
//           newDistance = [
//             ...currentDistance,
//             '$' + vertex.stopId,
//             '#' + connection.tripId,
//           ];
//           newPrev = vertex.stopId;
//         }

//         if (
//           connectionDistance.length === 0 ||
//           newDistance.length < connectionDistance.length
//         ) {
//           dist[stopNode!.stopId] = newDistance;
//           prev[stopNode!.stopId] = newPrev;
//         }
//       } else {
//         dist[stopNode!.stopId] = ['#' + connection.tripId];
//         prev[stopNode!.stopId] = vertex.stopId;
//       }
//     }
//   }
// }
