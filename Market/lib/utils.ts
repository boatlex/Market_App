import React, { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "@clerk/expo";
import { setClerkTokenGetter } from "./api"; // Ensure accurate import path
// import MainNavigation from "./navigation/MainNavigation";

export default function RootApp() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      // Passes Clerk's token manager function down to the static Axios instance
      setClerkTokenGetter(() => getToken());
    }
  }, [getToken, isLoaded]);

 

  // 2. Once load, mount your application navigation tree safely
  // return <MainNavigation isSignedIn={isSignedIn} />;
  return null; 
}















// import React, { useEffect } from "react";
// import { useAuth } from "@clerk/expo";
// import { setClerkTokenGetter } from "./api"; // Path to file above
// //import MainNavigation from "./navigation/MainNavigation";

// export default function RootApp() {
//   const { getToken } = useAuth();

//   useEffect(() => {
//     // Pass the Clerk token function to our custom Axios file
//     setClerkTokenGetter(getToken);
//   }, [getToken]);

//   //return <MainNavigation />;
// }
