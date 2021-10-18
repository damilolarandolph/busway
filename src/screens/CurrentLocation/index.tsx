import React, { useContext, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import MapView, {
  Callout,
  Geojson,
  Marker,
  MarkerAnimated,
  Polyline,
} from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';

import * as Location from 'expo-location';
import MapButton from '../../components/MapButton';

import iconHome from '../../assets/home.png';
import iconHistory from '../../assets/history.png';
import iconCenter from '../../assets/map_center.png';
import marker from '../../assets/marker.png';
import customMapStyle from '../../mapstyle.json';

import destMarker from '../../assets/dest_marker.png';

import theme from '../../theme';

import * as S from './styles';
import useRouteEngine, {
  Route,
  Stop,
  Trip,
  Walk,
} from '../../hooks/router/useRouteEngine';
import context from '../../context/app';
import tailwind from 'tailwind-rn';
import { Coords } from 'hooks/router/routingEngine';
import { ScrollView } from 'native-base';

interface ILatLng {
  latitude: number;
  longitude: number;
}

const Map: React.FC = () => {
  const [latLng, setLatLng] = useState<ILatLng>({
    latitude: -19.916483,
    longitude: -43.935129,
  });

  const navigation = useNavigation();
  const { state: AppState, setState: setAppState } = useContext(context);
  let mapRef: MapView | null = null;
  let removeCallback: () => void;

  const setupLocation = async () => {
    if (!Location.PermissionStatus.GRANTED) {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        return;
      }
    }
    ({ remove: removeCallback } = await Location.watchPositionAsync(
      {},
      location => {
        setLatLng({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      },
    ));
  };

  useEffect(() => {
    setupLocation();

    return () => {
      if (removeCallback) {
        removeCallback();
      }
    };
  }, []);

  function centerMap() {
    mapRef?.animateToRegion(
      {
        ...latLng,
        latitudeDelta: 0.0143,
        longitudeDelta: 0.0134,
      },
      1000,
    );
  }

  return (
    <S.Container>
      <S.Map
        ref={map => {
          mapRef = map;
        }}
        region={{
          ...latLng,
          latitudeDelta: 0.0143,
          longitudeDelta: 0.0134,
        }}
        loadingEnabled
        showsCompass={false}
        mapType="hybrid"
        showsPointsOfInterest={true}
        customMapStyle={customMapStyle}
        showsTraffic={true}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        <Marker
          coordinate={{
            longitude: latLng.longitude,
            latitude: latLng.latitude,
          }}
          image={marker}
        />

        {AppState.onTrip ? (
          <>
            <Marker
              image={destMarker}
              coordinate={{
                longitude: (AppState.currentTrip[0] as Walk).to.long,
                latitude: (AppState.currentTrip[0] as Walk).to.lat,
              }}
            >
              <Callout>
                <Text>
                  Walk to {(AppState.currentTrip[1] as Stop).name}, take bus
                  going to {(AppState.currentTrip[2] as Route).name}{' '}
                </Text>
              </Callout>
            </Marker>
            {AppState.currentTrip?.map((item, idx, array) => {
              if (idx < 3) {
                return;
              }
              if (item.type === 'stop') {
                let nextItem = array[idx + 1];
                return (
                  <Marker
                    image={destMarker}
                    coordinate={{ longitude: item.long, latitude: item.lat }}
                  >
                    <Callout>
                      <Text>
                        Stop at {item.name}
                        {nextItem.type === 'route'
                          ? `Take a bus going to ${nextItem.name}`
                          : nextItem.type === 'walk'
                          ? 'Walk to your destination'
                          : ''}
                      </Text>
                    </Callout>
                  </Marker>
                );
              }
            })}
            <Marker
              image={destMarker}
              coordinate={{
                longitude: (AppState.currentTrip?.at(-1) as Walk).to.long,
                latitude: (AppState.currentTrip?.at(-1) as Walk).to.lat,
              }}
            />
          </>
        ) : null}
      </S.Map>
      <S.OptionsContainer>
        <S.LeftOptions>
          <MapButton
            onPress={() => {
              setAppState({ onTrip: false, currentTrip: null });
            }}
            icon={iconHome}
          />
          <MapButton icon={iconHistory} />
        </S.LeftOptions>
        <MapButton icon={iconCenter} noMargin onPress={centerMap} />
      </S.OptionsContainer>
      {!AppState.onTrip || !AppState.currentTrip ? (
        <S.WhereToContainer>
          <S.WhereToButton
            onPress={() => navigation.navigate('SelectDestination')}
          >
            {/* <S.From>From: Wilson Terrace 219 W</S.From> */}
            <S.ToContainer>
              <S.GreenDot />
              <S.To>Where to?</S.To>
            </S.ToContainer>
          </S.WhereToButton>
        </S.WhereToContainer>
      ) : (
        <S.WhereToContainer
          style={tailwind('bg-transparent border-0 w-full h-24')}
        >
          <RenderInstructions
            trip={AppState.currentTrip!}
            coords={{ lat: latLng.latitude, long: latLng.longitude }}
          />
        </S.WhereToContainer>
      )}
    </S.Container>
  );
};

function RenderInstructions(props: { trip: Trip; coords: Coords }) {
  const renderItem = ({ title, body }: { title: string; body: string }) => {
    return (
      <View
        style={tailwind(
          'flex mx-3 flex-col bg-blue-600 rounded-md border border-transparent w-40 p-3',
        )}
      >
        <Text style={tailwind('font-bold text-lg text-white')}>{title}</Text>
        <Text style={tailwind('text-white')}>{body}</Text>
      </View>
    );
  };
  return (
    <View style={tailwind('flex flex-row flex-nowrap  w-full h-full')}>
      <ScrollView horizontal>
        {props.trip.map((item, idx, arr) => {
          if (item.type === 'walk') {
            let nextItem = arr[idx + 1];
            if (nextItem) {
              return renderItem({
                title: 'Walk to',
                body: nextItem.type === 'stop' ? nextItem.name + ' bustop' : '',
              });
            } else {
              return renderItem({
                title: 'Walk to',
                body: 'Your destination',
              });
            }
          }

          if (item.type === 'stop') {
            return renderItem({
              title: 'Stop at',
              body: item.name + ' bustop',
            });
          }

          if (item.type === 'route') {
            return renderItem({
              title: 'Take a bus',
              body: 'Going to ' + item.name,
            });
          }
        })}
      </ScrollView>
    </View>
  );
}

export default Map;
