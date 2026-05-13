import { useCallback, useEffect, useState } from "react";

const KEY = "auren.academy.progress.v1";

type Progress = Record<string, true>; // `${moduleId}:${lessonId}` => true

function read(): Progress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Progress;
  } catch {
    return {};
  }
}

export function useAcademyProgress() {
  const [progress, setProgress] = useState<Progress>({});

  useEffect(() => {
    setProgress(read());
  }, []);

  const isDone = useCallback(
    (mod: string, lesson: string) => Boolean(progress[`${mod}:${lesson}`]),
    [progress],
  );

  const toggle = useCallback((mod: string, lesson: string) => {
    setProgress((prev) => {
      const k = `${mod}:${lesson}`;
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = true;
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const moduleProgress = useCallback(
    (mod: string, lessonIds: string[]) => {
      const done = lessonIds.filter((id) => progress[`${mod}:${id}`]).length;
      return { done, total: lessonIds.length, pct: lessonIds.length === 0 ? 0 : Math.round((done / lessonIds.length) * 100) };
    },
    [progress],
  );

  return { isDone, toggle, moduleProgress };
}
