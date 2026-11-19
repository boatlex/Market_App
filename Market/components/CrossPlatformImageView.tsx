import React from 'react';
import { Platform } from 'react-native';
import WebImageView from './CrossPlatformImageView.web';

interface CrossPlatformImageViewProps {
  images: { uri: string }[];
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  doubleTapToZoomEnabled?: boolean;
  swipeToCloseEnabled?: boolean;
}

export default function CrossPlatformImageView(
  props: CrossPlatformImageViewProps
) {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return <WebImageView {...props} />;
  }

  const NativeImageView = require('react-native-image-viewing').default;
  return <NativeImageView {...props} />;
}
