export type Grade = "A" | "B" | "C" | "D";
export type SourceType = "reddit" | "hn";
export type CrawlStatus = "running" | "done" | "failed";

export interface Idea {
  id: string;
  title: string;
  summary: string;
  evidence: string;
  source_url: string | null;
  source_type: SourceType;
  subreddit: string | null;
  upvotes: number;
  grade: Grade;
  score_demand: number;
  score_mobile_fit: number;
  score_monetization: number;
  score_buildability: number;
  score_competition: number;
  crawled_at: string;
  crawl_job_id: string | null;
}

export interface SavedIdea {
  id: string;
  user_id: string;
  idea_id: string;
  notes: string | null;
  saved_at: string;
  ideas?: Idea;
}

export interface CrawlJob {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: CrawlStatus;
  posts_scanned: number;
  ideas_found: number;
  sources: string | null;
}
