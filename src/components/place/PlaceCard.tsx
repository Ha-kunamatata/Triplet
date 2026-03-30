import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Place } from '@types/index';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';
import { SCHEDULE_CATEGORIES } from '@constants/index';

interface PlaceCardProps {
  place: Place;
  onPress: (place: Place) => void;
  onSave?: (place: Place) => void;
  isSaved?: boolean;
}

export function PlaceCard({ place, onPress, onSave, isSaved = false }: PlaceCardProps) {
  const categoryInfo = SCHEDULE_CATEGORIES.find((c) => c.key === place.category);

  return (
    <TouchableOpacity onPress={() => onPress(place)} activeOpacity={0.9} style={styles.container}>
      {place.images[0] && (
        <Image source={{ uri: place.images[0] }} style={styles.image} contentFit="cover" />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{categoryInfo?.label ?? '기타'}</Text>
          </View>
          {onSave && (
            <TouchableOpacity
              onPress={() => onSave(place)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? Colors.primary : Colors.gray400}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {place.address}
        </Text>

        {place.rating && (
          <View style={styles.rating}>
            <Ionicons name="star" size={13} color={Colors.accent} />
            <Text style={styles.ratingText}>
              {place.rating.toFixed(1)}
            </Text>
            {place.reviewCount && (
              <Text style={styles.reviewCount}>({place.reviewCount})</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    ...Layout.shadow.sm,
  },
  image: {
    height: 140,
    width: '100%',
  },
  content: {
    padding: Layout.spacing.md,
    gap: Layout.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: Colors.primary + '15',
    borderRadius: Layout.radius.sm,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  name: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  address: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  reviewCount: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
});
