import React from 'react';
import ImageView from 'react-native-image-viewing';

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
  return <ImageView {...props} />;
}
