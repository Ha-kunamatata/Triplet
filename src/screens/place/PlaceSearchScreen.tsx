import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input } from '@components/common';
import { PlaceCard } from '@components/place';
import { EmptyState, LoadingSpinner } from '@components/common';
import { placeService } from '@services/placeService';
import { usePlaceStore } from '@store/usePlaceStore';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';
import type { PlaceStackParamList } from '@navigation/types';
import type { Place } from '@types/index';

type Props = NativeStackScreenProps<PlaceStackParamList, 'PlaceSearch'>;

export function PlaceSearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const { searchResults, recentSearches, isSearching, setSearchResults, addRecentSearch, setSearching } =
    usePlaceStore();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    addRecentSearch(query.trim());
    try {
      const results = await placeService.searchPlaces({ query: query.trim() });
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }, [query, setSearching, addRecentSearch, setSearchResults]);

  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetail', { placeId: place.id });
  };

  const handleRecentSearch = (q: string) => {
    setQuery(q);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.searchBar}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="장소, 지역을 검색해보세요"
          leftIcon="search-outline"
          rightIcon={query ? 'close-circle' : undefined}
          onRightIconPress={() => setQuery('')}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          containerStyle={styles.inputContainer}
        />
      </View>

      {isSearching ? (
        <LoadingSpinner message="검색 중..." />
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <PlaceCard place={item} onPress={handlePlacePress} />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.recentContainer}>
          {recentSearches.length > 0 && (
            <>
              <Text style={styles.recentTitle}>최근 검색</Text>
              {recentSearches.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => handleRecentSearch(q)}
                  style={styles.recentItem}
                >
                  <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.recentText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          {recentSearches.length === 0 && (
            <EmptyState
              icon="search-outline"
              title="장소를 검색해보세요"
              description="여행지의 관광지, 음식점, 카페를 찾아보세요"
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.sm,
  },
  inputContainer: { marginBottom: 0 },
  list: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl,
  },
  cardWrapper: {
    flex: 1,
    padding: Layout.spacing.sm,
  },
  recentContainer: {
    flex: 1,
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
  },
  recentTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
  },
  recentText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
  },
});
