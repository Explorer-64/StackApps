import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoadingScreen } from "@/components/LoadingScreen";

export function LegacyAppDetailsQueryRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      setLocation(`/app/${id}`, { replace: true });
    } else {
      setLocation("/dashboard", { replace: true });
    }
  }, [setLocation]);

  return <LoadingScreen />;
}

export function LegacyManageAppRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/dashboard", { replace: true });
  }, [setLocation]);

  return <LoadingScreen />;
}
