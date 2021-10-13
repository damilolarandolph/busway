import React, { useContext, useState } from 'react';
import { AppState, ImageURISource, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import tailwind from 'tailwind-rn';
import { TouchableHighlight } from 'react-native-gesture-handler';
import context, { Place } from '../../context/app';
import Button from '../../components/Button';

import * as S from './styles';
import homeIcon from '../../assets/home.png';
import historyIcon from '../../assets/history.png';

import GooglePlaces from '../../hooks/autocomplete/index';

export interface IItemProps {
  id: number;
  icon: ImageURISource;
  text: string;
  subtext?: string;
}

interface IRenderItemProps {
  item: IItemProps; // TODO: Verificar
}

const data: IItemProps[] = [
  { id: 1, icon: homeIcon, text: 'Casa', subtext: 'Spring St. 140' },
  { id: 2, icon: historyIcon, text: 'Minas Shopping' },
  { id: 3, icon: historyIcon, text: 'Estação Santa Inês' },
  { id: 4, icon: historyIcon, text: 'Cidade Administrativa' },
];

export type ResultType = ReturnType<typeof GooglePlaces>['results'];

const SelectDestination: React.FC = () => {
  const navigation = useNavigation();
  const { loading, results, onChange, onSelect } = GooglePlaces({
    apiKey: 'AIzaSyDMI1DefoND2YwVgxW9sn3YrcLw7t7yvBs',
    delay: 100,
  });
  const AppState = useContext(context);
  const [currentlyEntering, setCurrentlyEntering] = useState(0);

  function renderItem({ item }: any) {
    return (
      <TouchableHighlight
        onPress={() => alert('Pressed')}
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

  const onPress = item => {
    onSelect(item, ({ coordinates }) => {
      const patch: Place = {
        name: item.description,
        lat: coordinates.latitude,
        long: coordinates.longitude,
      };
      const { stops } = AppState.state.currentTrip.trip;
      const current =
        AppState.state.currentTrip.trip.stops[currentlyEntering - 1];
      switch (currentlyEntering) {
        case 0:
          AppState.state.currentTrip.trip.source = patch;
          break;
        default:
          if (!current) {
            AppState.state.currentTrip.trip.stops.push(patch);
          } else {
            stops.splice(currentlyEntering - 1, 1, patch);
            AppState.state.currentTrip.trip.stops = stops;
          }
      }

      AppState.setState({ ...AppState.state });
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
            onChangeText={i => onChange(i)}
            placeholder="Choose source"
          />
          <S.From
            onFocus={() => setCurrentlyEntering(1)}
            onChangeText={i => onChange(i)}
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
        <Button onPress={() => navigation.navigate('Request')}>Done</Button>
      </S.BottomContainer>
    </S.Container>
  );
};

export default SelectDestination;
