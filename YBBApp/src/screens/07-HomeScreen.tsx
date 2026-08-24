import React from "react";
import { useApp } from "../context/AppContext";
import { GuestHomeScreen } from "./home/GuestHomeScreen";
import { EnrolledHomeScreen } from "./home/EnrolledHomeScreen";

/**
 * HomeScreen — thin router.
 * Non-enrolled users see GuestHomeScreen until they enrol;
 * enrolled users see EnrolledHomeScreen.
 * Each variant is a fully independent component in ./home/.
 */
export const HomeScreen: React.FC = () => {
  const { user } = useApp();
  const isEnrolled = Boolean(user?.isEnrolled);

  return isEnrolled ? <EnrolledHomeScreen /> : <GuestHomeScreen />;
};
