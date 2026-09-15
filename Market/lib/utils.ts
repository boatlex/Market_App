import React, { useEffect } from "react";
import { useAuth } from "@clerk/expo";
import { setClerkTokenGetter } from "./api"; // Path to file above
//import MainNavigation from "./navigation/MainNavigation";

export default function RootApp() {
  const { getToken } = useAuth();

  useEffect(() => {
    // Pass the Clerk token function to our custom Axios file
    setClerkTokenGetter(getToken);
  }, [getToken]);

  //return <MainNavigation />;
}
