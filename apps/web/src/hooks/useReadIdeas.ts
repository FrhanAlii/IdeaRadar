import { useState, useCallback } from "react";

const KEY = "ir_read_ideas";

function getReadSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function useReadIdeas() {
  const [readSet, setReadSet] = useState<Set<string>>(getReadSet);

  const markRead = useCallback((id: string) => {
    setReadSet(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isRead = useCallback((id: string) => readSet.has(id), [readSet]);

  return { markRead, isRead };
}
