import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import { mkdirp } from "mkdirp";
import PQueue from "p-queue";
import { SpiderEventEmitter } from "./types";

export function createDownloader(
  queue: PQueue,
  emitter: SpiderEventEmitter,
  crawlDelay: number = 1000
) {
  const userAgent = "Mozilla/5.0 (compatible; NodeSpider/1.0)";

  const saveFile = async (
    filename: string,
    content: string | Buffer
  ): Promise<void> => {
    await mkdirp(path.dirname(filename));
    await writeFile(filename, content);
  };

  const downloadFile = async (
    url: string,
    filename: string
  ): Promise<string | Buffer> => {
    return queue.add(async () => {
      emitter.emit("downloading", { url, filename });

      if (crawlDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, crawlDelay));
      }

      const response = await axios.get(url, {
        headers: { "User-Agent": userAgent },
      });

      await saveFile(filename, response.data);
      emitter.emit("completed", { url, filename });

      return response.data;
    });
  };

  const fileExists = async (
    filename: string
  ): Promise<string | Buffer | null> => {
    try {
      const content = await readFile(filename);
      emitter.emit("file-exists", { filename });
      return content;
    } catch (err: any) {
      if (err.code === "ENOENT") {
        emitter.emit("file-not-exists", { filename });
        return null;
      }
      throw err;
    }
  };

  return {
    saveFile,
    downloadFile,
    fileExists,
  };
}
