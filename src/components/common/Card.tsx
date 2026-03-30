import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof Layout.spacing;
  shadow?: keyof typeof Layout.shadow;
}

export function Card({
  children,
  onPress,
  style,
  padding = 'lg',
  shadow = 'sm',
}: CardProps) {
  const containerStyle = [
    styles.card,
    { padding: Layout.spacing[padding] },
    Layout.shadow[shadow],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={containerStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
  },
});
