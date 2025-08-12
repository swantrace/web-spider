import path from "node:path";
import { EventEmitter } from "node:events";
import PQueue from "p-queue";
import { SpiderConfig, SpiderEventEmitter } from "./types";
import { createDownloader } from "./downloader";
import { getPageLinks, urlToFilename } from "./utils";

export function createSpider(config: SpiderConfig) {
  const emitter = new EventEmitter() as EventEmitter & SpiderEventEmitter;
  const queue = new PQueue({ concurrency: config.concurrency });
  const visitedUrls = new Set<string>();
  const downloader = createDownloader(
    queue,
    emitter,
    config.crawlDelay || 1000
  );

  const crawlRecursive = async (
    url: string,
    nesting: number
  ): Promise<void> => {
    const filename = path.join(config.targetDir, urlToFilename(url));

    if (visitedUrls.has(url)) {
      return;
    }

    visitedUrls.add(url);
    emitter.emit("spider-recursive", { url, nesting });

    try {
      const existingContent = await downloader.fileExists(filename);
      let fileContent: string | Buffer;

      if (existingContent) {
        fileContent = existingContent;
      } else {
        fileContent = await downloader.downloadFile(url, filename);
      }

      await processLinks(url, fileContent, nesting);
    } catch (err: any) {
      emitter.emit("spider-error", { url, error: err.message });
    }
  };

  const processLinks = async (
    currentUrl: string,
    body: string | Buffer,
    nesting: number
  ): Promise<void> => {
    if (nesting <= 0) {
      return;
    }

    const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
    const links = getPageLinks(currentUrl, bodyBuffer);

    if (links.length === 0) {
      return;
    }

    const unvisitedLinks = links.filter((link) => !visitedUrls.has(link));

    emitter.emit("links-found", {
      currentUrl,
      total: links.length,
      unvisited: unvisitedLinks.length,
      nesting: nesting - 1,
    });

    const promises = unvisitedLinks.map(async (link) => {
      try {
        await crawlRecursive(link, nesting - 1);
      } catch (err: any) {
        emitter.emit("spider-error", { link, error: err.message });
      }
    });

    await Promise.all(promises);
  };

  // Setup queue listeners immediately
  emitter.emit("queue-initialized", { concurrency: config.concurrency });

  queue.on("add", () => {
    emitter.emit("task-starting", {
      active: queue.pending,
      concurrency: config.concurrency,
      queueLength: queue.size,
    });
  });

  queue.on("completed", () => {
    emitter.emit("task-completed", {
      active: queue.pending,
      concurrency: config.concurrency,
      queueLength: queue.size,
    });
  });

  // Return a simple, clean API
  return {
    start() {
      crawlRecursive(config.url, config.nesting)
        .then(async () => {
          await queue.onIdle();
          emitter.emit("spider-complete", undefined);
        })
        .catch((err) => emitter.emit("spider-error", { error: err.message }));
    },

    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),

    get config() {
      return { ...config };
    },
    get visited() {
      return new Set(visitedUrls);
    },
  };
}
