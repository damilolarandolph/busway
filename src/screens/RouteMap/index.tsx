import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import MapView, { Marker, MarkerAnimated } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';

import * as Location from 'expo-location';
import MapButton from '../../components/MapButton';

import iconHome from '../../assets/home.png';
import iconHistory from '../../assets/history.png';
import iconCenter from '../../assets/map_center.png';
import marker from '../../assets/marker.png';
import customMapStyle from '../../mapstyle.json';

import * as S from './styles';

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
  let mapRef: MapView | null = null;

  const setupLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    Location.watchPositionAsync({}, location => {
      setLatLng({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    });
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync();
      location.setLatLng({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  };

  useEffect(() => {
    const remove = Location.watchPositionAsync({}, location => {
      console.log(location);
      setLatLng({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    });

    return () => {
      remove.then(val => val.remove());
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
        showsPointsOfInterest={false}
        showsBuildings={false}
        customMapStyle={customMapStyle}
      >
        <Marker
          coordinate={{
            longitude: latLng.longitude,
            latitude: latLng.latitude,
          }}
          image={marker}
        />
      </S.Map>
      <S.OptionsContainer>
        <S.LeftOptions>
          <MapButton icon={iconHome} />
          <MapButton icon={iconHistory} />
        </S.LeftOptions>
        <MapButton icon={iconCenter} noMargin onPress={centerMap} />
      </S.OptionsContainer>
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
    </S.Container>
  );
};

export default Map;
