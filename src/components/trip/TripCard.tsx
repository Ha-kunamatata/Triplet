import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Trip } from '@types/index';
import { Colors } from '@constants/colors';
import { FontSize, FontFamily } from '@constants/typography';
import { Layout } from '@constants/layout';

interface TripCardProps {
  trip: Trip;
  onPress: (trip: Trip) => void;
}

const STATUS_LABELS: Record<Trip['status'], string> = {
  upcoming: '예정',
  ongoing: '여행 중',
  completed: '완료',
};

const STATUS_COLORS: Record<Trip['status'], string> = {
  upcoming: Colors.primary,
  ongoing: Colors.success,
  completed: Colors.gray400,
};

export function TripCard({ trip, onPress }: TripCardProps) {
  const startDate = format(new Date(trip.startDate), 'M.d', { locale: ko });
  const endDate = format(new Date(trip.endDate), 'M.d (E)', { locale: ko });

  return (
    <TouchableOpacity
      onPress={() => onPress(trip)}
      activeOpacity={0.9}
      style={styles.container}
    >
      <ImageBackground
        source={trip.coverImage ? { uri: trip.coverImage } : require('@assets/placeholder-trip.png')}
        style={styles.image}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[trip.status] }]} />
            <Text style={styles.statusText}>{STATUS_LABELS[trip.status]}</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.destination}>{trip.destination}</Text>
            <Text style={styles.title}>{trip.title}</Text>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={Colors.white} />
                <Text style={styles.metaText}>
                  {startDate} - {endDate}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={13} color={Colors.white} />
                <Text style={styles.metaText}>{trip.memberCount}명</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    ...Layout.shadow.md,
  },
  image: {
    height: 200,
  },
  imageStyle: {
    borderRadius: Layout.radius.lg,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Layout.spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Layout.radius.full,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.white,
  },
  info: {
    gap: Layout.spacing.xs,
  },
  destination: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.white,
  },
  meta: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginTop: Layout.spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
  },
});
