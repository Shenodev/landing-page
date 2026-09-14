"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchProjects, toSafeString, type Project } from "@/lib/api";

type UseProjectsResult = {
  projects: Project[];
  loading: boolean;
  error: string;
  reload: () => void;
};

export const useProjects = (): UseProjectsResult => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        const list = await fetchProjects();
        if (!cancelled) {
          setProjects(list);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = toSafeString(err);
          console.error("[Work] fetch failed:", message);
          setError(err instanceof ApiError ? `${message} (${err.status})` : message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback((): void => {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  }, []);

  return { projects, loading, error, reload };
};