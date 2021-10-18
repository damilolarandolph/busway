import React, { useContext, useEffect, useState } from 'react';
import { AppState, ImageURISource, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import tailwind from 'tailwind-rn';
import { TouchableHighlight } from 'react-native-gesture-handler';
import context from '../../context/app';
import Button from '../../components/Button';

import * as S from './styles';
import homeIcon from '../../assets/home.png';
import historyIcon from '../../assets/history.png';

import GooglePlaces from '../../hooks/autocomplete/index';
import useRouteEngine from '../../hooks/router/useRouteEngine';

export interface IItemProps {
  id: number;
  icon: ImageURISource;
  text: string;
  subtext?: string;
}

export type ResultType = ReturnType<typeof GooglePlaces>['results'];

const SelectDestination: React.FC = () => {
  const navigation = useNavigation();
  const { loading, results, onChange, onSelect } = GooglePlaces({
    apiKey: 'AIzaSyDMI1DefoND2YwVgxW9sn3YrcLw7t7yvBs',
    delay: 100,
  });
  const AppState = useContext(context);
  const [routeState, setRouteState] = useState({
    source: { name: '', lat: 0, long: 0 },
    destination: { name: '', lat: 0, long: 0 },
  });
  const [currentlyEntering, setCurrentlyEntering] = useState(0);
  const routeEngine = useRouteEngine();

  useEffect(() => {
    if (routeEngine.status === 'success') {
      console.log(routeEngine.tripRoute, 'trip route');
      AppState.setState({ onTrip: true, currentTrip: routeEngine.tripRoute });
      navigation.navigate('CurrentLocation');
    }
  }, [routeEngine.status]);

  const onPress = item => {
    onSelect(item, ({ coordinates }) => {
      switch (currentlyEntering) {
        case 0:
          setRouteState({
            ...routeState,
            source: {
              name: item.description,
              lat: coordinates.latitude,
              long: coordinates.longitude,
            },
          });
          break;
        case 1:
          setRouteState({
            ...routeState,
            destination: {
              name: item.description,
              lat: coordinates.latitude,
              long: coordinates.longitude,
            },
          });
      }
    });
  };

  function renderItem({ item }: any) {
    return (
      <TouchableHighlight
        onPress={() => onPress(item)}
        activeOpacity={0.6}
        underlayColor="#DDDDDD"
      >
        <S.HistoryItem style={tailwind('flex w-full p-3')}>
          <S.ItemIcon style={tailwind('mx-2')} source={historyIcon} />
          <View style={tailwind('flex-1 ')}>
            <S.ItemText>{item.description}</S.ItemText>
          </View>
          {/* <S.ItemText small>{item.description}</S.ItemText> */}
        </S.HistoryItem>
      </TouchableHighlight>
    );
  }

  return (
    <S.Container>
      <S.TopContainer>
        <S.Timeline>
          <S.Dot />
          <S.Dash />
          <S.Dot secondary />
        </S.Timeline>
        <S.FromTo>
          <S.From
            onFocus={() => setCurrentlyEntering(0)}
            onChangeText={i => {
              setRouteState({
                ...routeState,
                source: { ...routeState.source, name: i },
              });
              onChange(i);
            }}
            value={routeState.source.name}
            placeholder="Choose source"
          />
          <S.From
            onFocus={() => setCurrentlyEntering(1)}
            onChangeText={i => {
              setRouteState({
                ...routeState,
                destination: { ...routeState.destination, name: i },
              });
              onChange(i);
            }}
            value={routeState.destination.name}
            placeholder="Choose destination"
          />
        </S.FromTo>
      </S.TopContainer>
      <S.Shadow />
      <S.HistoryList
        style={tailwind('')}
        data={results}
        renderItem={renderItem}
      />
      <S.BottomContainer>
        <Button
          onPress={async () => {
            routeEngine.routeTrip(
              { lat: routeState.source.lat, long: routeState.source.long },
              {
                lat: routeState.destination.lat,
                long: routeState.destination.long,
              },
            );
          }}
        >
          Done
        </Button>
      </S.BottomContainer>
    </S.Container>
  );
};

export default SelectDestination;
