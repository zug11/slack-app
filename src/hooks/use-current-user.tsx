"use client";

import { useState, useEffect, createContext, useContext } from "react";

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

const UserContext = createContext<User | null>(null);

const Provider = UserContext.Provider;

export function UserProvider({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return <Provider value={user}>{children}</Provider>;
}

export function useCurrentUser(): User {
  const user = useContext(UserContext);
  if (!user) throw new Error("useCurrentUser must be used within UserProvider");
  return user;
}
