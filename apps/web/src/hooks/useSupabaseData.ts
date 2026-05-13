import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CalendarEvent {
  id: string; title: string; description: string; project_id: string | null;
  start_time: string; end_time: string | null; user_id: string;
  status: string; created_at: string;
}

// ---- CALENDAR EVENTS ----
export function useCalendarEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["calendar_events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("calendar_events").select("*").order("start_time", { ascending: true });
      if (error) throw error;
      return data as unknown as CalendarEvent[];
    },
    enabled: !!user,
  });
}

export function useAddEvent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (e: { title: string; description: string; project_id: string | null; start_time: string; end_time: string | null }) => {
      const { error } = await supabase.from("calendar_events").insert({ ...e, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendar_events"] }); toast({ title: "Event created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("calendar_events").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendar_events"] }); toast({ title: "Event updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendar_events"] }); toast({ title: "Event deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ---- IDEAS ----
export const useIdeas = () =>
  useQuery({
    queryKey: ["ideas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ideas").select("*, idea_sources(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useSavedIdeas = (userId: string) =>
  useQuery({
    queryKey: ["saved_ideas", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_ideas").select("*, ideas(*, idea_sources(*))").eq("user_id", userId).order("saved_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

export const useDashboardStats = (userId: string) =>
  useQuery({
    queryKey: ["dashboard_stats", userId],
    queryFn: async () => {
      const [ideasRes, aGradeRes, savedRes, crawlRes] = await Promise.all([
        supabase.from("ideas").select("id", { count: "exact", head: true }),
        supabase.from("ideas").select("id", { count: "exact", head: true }).eq("grade", "A"),
        supabase.from("saved_ideas").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("crawl_jobs").select("finished_at").eq("status", "done").order("finished_at", { ascending: false }).limit(1),
      ]);
      const lastCrawlHours = crawlRes.data?.[0]?.finished_at
        ? Math.floor((Date.now() - new Date(crawlRes.data[0].finished_at).getTime()) / 3600000)
        : null;
      return {
        totalIdeas:   ideasRes.count  ?? 0,
        aGradeIdeas:  aGradeRes.count ?? 0,
        savedIdeas:   savedRes.count  ?? 0,
        lastCrawlHours,
      };
    },
    enabled: !!userId,
  });

export const useCrawlJobs = () =>
  useQuery({
    queryKey: ["crawl_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crawl_jobs").select("*").order("started_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useUserSubscription = (userId: string) =>
  useQuery({
    queryKey: ['user_subscription', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) return { tier: 'free', ideas_per_crawl: 6, crawls_per_day: 2 };
      return data;
    },
    enabled: !!userId,
  });

export const useViewedIdeas = (userId: string, since?: string) =>
  useQuery({
    queryKey: ['viewed_ideas', userId, since ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('viewed_ideas')
        .select('idea_id, viewed_at, ideas(*, idea_sources(*))')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false });
      if (since) query = query.gte('viewed_at', since);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row: any) => row.ideas).filter(Boolean);
    },
    enabled: !!userId,
  });

export const useUserDashboardStats = (userId: string) =>
  useQuery({
    queryKey: ['user_dashboard_stats', userId],
    queryFn: async () => {
      const { data: viewed, count: totalCount } = await supabase
        .from('viewed_ideas')
        .select('idea_id, viewed_at, ideas(grade, score_demand)', { count: 'exact' })
        .eq('user_id', userId);

      const ideas = (viewed ?? []).map((r: any) => r.ideas).filter(Boolean);
      const aGrade = ideas.filter((i: any) => i.grade === 'A').length;

      const { count: savedCount } = await supabase
        .from('saved_ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      const lastViewed = viewed?.[0]?.viewed_at;
      const lastCrawlHours = lastViewed
        ? Math.floor((Date.now() - new Date(lastViewed).getTime()) / 3600000)
        : null;

      return {
        totalIdeas: totalCount ?? 0,
        aGradeIdeas: aGrade,
        savedIdeas: savedCount ?? 0,
        lastCrawlHours,
        ideas,
      };
    },
    enabled: !!userId,
  });

export const useUserIdeasOverTime = (userId: string) =>
  useQuery({
    queryKey: ['user_ideas_over_time', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('viewed_ideas')
        .select('viewed_at')
        .eq('user_id', userId)
        .gte('viewed_at', new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString())
        .order('viewed_at', { ascending: true });
      const counts: Record<string, number> = {};
      (data || []).forEach(row => {
        const day = new Date(row.viewed_at).toLocaleDateString('en-US', { weekday: 'short' });
        counts[day] = (counts[day] || 0) + 1;
      });
      return Object.entries(counts).map(([day, count]) => ({ day, count }));
    },
    enabled: !!userId,
  });

export const useUserGradeBreakdown = (userId: string) =>
  useQuery({
    queryKey: ['user_grade_breakdown', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('viewed_ideas')
        .select('ideas(grade)')
        .eq('user_id', userId);
      const grades = { A: 0, B: 0, C: 0, D: 0 };
      (data ?? []).forEach((r: any) => {
        const g = r.ideas?.grade;
        if (g && g in grades) grades[g as keyof typeof grades]++;
      });
      return Object.entries(grades).map(([grade, count]) => ({ grade, count }));
    },
    enabled: !!userId,
  });

export const useUserSourceBreakdown = (userId: string) =>
  useQuery({
    queryKey: ['user_source_breakdown', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('viewed_ideas')
        .select('ideas(idea_sources(source_type))')
        .eq('user_id', userId);
      let reddit = 0, hn = 0;
      (data ?? []).forEach((r: any) => {
        (r.ideas?.idea_sources ?? []).forEach((s: any) => {
          if (s.source_type === 'reddit') reddit++;
          else if (s.source_type === 'hn') hn++;
        });
      });
      return [{ source: 'Reddit', count: reddit }, { source: 'HN', count: hn }];
    },
    enabled: !!userId,
  });

export const useUserTopIdeasToday = (userId: string) =>
  useQuery({
    queryKey: ['user_top_ideas_today', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('viewed_ideas')
        .select('ideas(id, title, grade, score_demand)')
        .eq('user_id', userId)
        .gte('viewed_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order('viewed_at', { ascending: false });
      return (data ?? [])
        .map((r: any) => r.ideas)
        .filter(Boolean)
        .sort((a: any, b: any) => b.score_demand - a.score_demand)
        .slice(0, 3);
    },
    enabled: !!userId,
  });

export const useUserCrawlSessions = (userId: string) =>
  useQuery({
    queryKey: ['user_crawl_sessions', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('viewed_ideas')
        .select('idea_id, viewed_at')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false });

      if (!data || data.length === 0) return [];

      const sessions: Array<{ started_at: string; ideas_found: number; status: string }> = [];
      let currentSession = { started_at: data[0].viewed_at, ideas_found: 1, status: 'done' };

      for (let i = 1; i < data.length; i++) {
        const gap = new Date(currentSession.started_at).getTime()
          - new Date(data[i].viewed_at).getTime();
        if (gap < 60000) {
          currentSession.ideas_found++;
        } else {
          sessions.push({ ...currentSession });
          currentSession = { started_at: data[i].viewed_at, ideas_found: 1, status: 'done' };
        }
      }
      sessions.push(currentSession);
      return sessions;
    },
    enabled: !!userId,
  });

export const useUserCrawlsToday = (userId: string) =>
  useQuery({
    queryKey: ['user_crawls_today', userId],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('viewed_ideas')
        .select('viewed_at')
        .eq('user_id', userId)
        .gte('viewed_at', startOfDay.toISOString())
        .order('viewed_at', { ascending: true });

      if (!data || data.length === 0) return { sessionsToday: 0, nextResetAt: null };

      let sessions = 1;
      for (let i = 1; i < data.length; i++) {
        const gap = new Date(data[i].viewed_at).getTime()
          - new Date(data[i - 1].viewed_at).getTime();
        if (gap > 60000) sessions++;
      }

      const nextReset = new Date();
      nextReset.setHours(24, 0, 0, 0);

      return { sessionsToday: sessions, nextResetAt: nextReset.toISOString() };
    },
    enabled: !!userId,
    refetchInterval: 60000,
  });
