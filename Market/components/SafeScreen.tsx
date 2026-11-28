import { View, Platform } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const SafeScreen = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-white"
      style={{
        flex: 1,
        minHeight: 0,
        paddingTop: Platform.OS === 'web' ? 0 : insets.top,
      }}
    >
      <StatusBar hidden={false} style="dark" />
      {children}
    </View>
  );
};

export default SafeScreen;



// import { View, Platform } from 'react-native';
// import React from 'react';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// const SafeScreen = ({ children }: { children: React.ReactNode }) => {
//   const insets = useSafeAreaInsets();

//   return (
//     <View
//       className="flex-1 bg-white"
//       style={{
//         flex: 1,
//         minHeight: 0,
//         paddingTop: Platform.OS === 'web' ? 0 : insets.top,
//       }}
//     >
//       {children}
//     </View>
//   );
// };

// export default SafeScreen;
