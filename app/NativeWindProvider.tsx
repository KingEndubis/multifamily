import React from 'react';
import { StyleSheet } from 'react-native';

type Props = {
  children: React.ReactNode;
};

export function NativeWindProvider({ children }: Props) {
  return <>{children}</>;
}

// Force StyleSheet to be used (prevents tree-shaking)
const _ = StyleSheet.create({});