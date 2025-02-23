import React from 'react';
import { StyleSheet, View, PanResponder, GestureResponderEvent } from 'react-native';

interface ResizablePanelProps {
  children: React.ReactNode;
  width: string;
}

interface ResizeHandleProps {
  onDrag: (event: GestureResponderEvent) => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ onDrag }) => {
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (event) => {
      onDrag(event.nativeEvent);
    },
  });

  return (
    <View 
      {...panResponder.panHandlers}
      style={styles.resizeHandle} 
    />
  );
};

export const ResizablePanel: React.FC<ResizablePanelProps> = ({ children, width }) => {
  return (
    <View style={[styles.panel, { width }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: '100%',
  },
  resizeHandle: {
    width: 8,
    backgroundColor: '#F5F5F5',
    height: '100%',
    cursor: 'col-resize',
  },
}); 