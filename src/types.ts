export interface SpiderConfig {
  url: string;
  nesting: number;
  concurrency: number;
  targetDir: string;
  crawlDelay?: number;
}

export interface SpiderProgress {
  completed: number;
  active: number;
  queued: number;
  currentDownloads: string[];
  errors: string[];
}

export interface SpiderEvents {
  downloading: { url: string; filename: string };
  completed: { url: string; filename: string };
  "file-exists": { filename: string };
  "file-not-exists": { filename: string };
  "links-found": {
    currentUrl: string;
    total: number;
    unvisited: number;
    nesting: number;
  };
  "spider-recursive": { url: string; nesting: number };
  "spider-complete": void;
  "spider-error": { url?: string; link?: string; error: string };
  "task-starting": { active: number; concurrency: number; queueLength: number };
  "task-completed": {
    active: number;
    concurrency: number;
    queueLength: number;
  };
  "queue-initialized": { concurrency: number };
}

export type SpiderEventEmitter = {
  on<K extends keyof SpiderEvents>(
    event: K,
    listener: (data: SpiderEvents[K]) => void
  ): void;
  emit<K extends keyof SpiderEvents>(event: K, data: SpiderEvents[K]): boolean;
};
