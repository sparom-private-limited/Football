import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';

export default function AppRefreshView({
  children,
  refreshing,
  onRefresh,
  style,
  contentStyle,
}) {
  return (
    <ScrollView
      style={style}
      contentContainerStyle={[
        { flexGrow: 1 },
        contentStyle,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2563EB']}
          tintColor="#2563EB"
        />
      }
    >
      {children}
    </ScrollView>
  );
}
