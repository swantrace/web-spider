#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { Listr } from "listr2";
import { createSpider } from "./src";

// CLI setup with Commander.js
const program = new Command();
program
  .name("web-spider")
  .description("Web spider with concurrent downloading")
  .version("1.0.0")
  .argument("<url>", "URL to start crawling from")
  .option("-n, --nesting <depth>", "nesting level depth", "3")
  .option("-c, --concurrency <num>", "concurrency limit", "2")
  .option(
    "-t, --target <directory>",
    "target directory to store downloaded files",
    "./downloads"
  )
  .parse();

const options = program.opts();
const url = program.args[0];
const nesting = parseInt(options.nesting, 10);
const concurrency = parseInt(options.concurrency, 10);
const targetDir = options.target;

if (!url) {
  console.error(chalk.red("Error: URL is required"));
  process.exit(1);
}

function formatUrl(url: string, maxLength: number = 40): string {
  return url.length > maxLength ? url.substring(0, maxLength - 3) + "..." : url;
}

async function main() {
  try {
    console.log(
      chalk.green(`🚀 Spider started: ${chalk.cyan(formatUrl(url, 60))}`)
    );
    console.log(
      chalk.gray(`   Nesting: ${nesting}, Concurrency: ${concurrency}`)
    );
    console.log(chalk.gray(`   Target directory: ${chalk.cyan(targetDir)}\n`));

    // Create spider with clean API
    const spider = createSpider({
      url,
      nesting,
      concurrency,
      targetDir,
      crawlDelay: parseInt(process.env.CRAWL_DELAY || "1000"),
    });

    // Initialize listr2 task
    const tasks = new Listr(
      [
        {
          title: "Spider Web Crawling",
          task: async (ctx, task) => {
            // Track progress data
            const progress = {
              completed: 0,
              active: 0,
              queued: 0,
              currentDownloads: [] as string[],
              errors: [] as string[],
            };

            // Update task output function
            const updateTask = () => {
              const total =
                progress.completed + progress.active + progress.queued;
              const percentage =
                total > 0 ? Math.round((progress.completed / total) * 100) : 0;

              let output = `Progress: ${progress.completed}/${total} files (${percentage}%)`;
              if (progress.active > 0) {
                output += `\nActive downloads: ${progress.active}`;
              }
              if (progress.currentDownloads.length > 0) {
                const current = progress.currentDownloads.slice(0, 2);
                output += `\nCurrent: ${current
                  .map((u) => formatUrl(u, 50))
                  .join(", ")}`;
                if (progress.currentDownloads.length > 2) {
                  output += ` (+${progress.currentDownloads.length - 2} more)`;
                }
              }
              if (progress.errors.length > 0) {
                output += `\nErrors: ${progress.errors.length}`;
                output += `\n${progress.errors.join("\n")}`;
              }

              task.output = output;
            };

            // IMPORTANT: Set up event listeners BEFORE starting to avoid race conditions
            spider.on("downloading", ({ url }) => {
              progress.currentDownloads.push(url);
              updateTask();
            });

            spider.on("completed", ({ url }) => {
              progress.completed++;
              const index = progress.currentDownloads.indexOf(url);
              if (index > -1) {
                progress.currentDownloads.splice(index, 1);
              }
              updateTask();
            });

            spider.on("task-starting", ({ active, queueLength }) => {
              progress.active = active;
              progress.queued = queueLength;
              updateTask();
            });

            spider.on("task-completed", ({ active, queueLength }) => {
              progress.active = active;
              progress.queued = queueLength;
              updateTask();
            });

            spider.on("spider-error", ({ url, link, error }) => {
              const errorUrl = url || link || "unknown";
              progress.errors.push(`${formatUrl(errorUrl)} - ${error}`);
              updateTask();
            });

            // Now start the spider - all listeners are ready!
            spider.start();

            return new Promise<void>((resolve) => {
              spider.on("spider-complete", () => {
                task.title = `Spider completed - ${progress.completed} files downloaded`;
                if (progress.errors.length > 0) {
                  task.title += ` (${progress.errors.length} errors)`;
                }
                resolve();
              });
            });
          },
        },
      ],
      {
        rendererOptions: {
          showSubtasks: false,
          collapseSkips: false,
        },
      }
    );

    await tasks.run();

    console.log(chalk.green("\n🎉 Spider completed successfully!"));
  } catch (err) {
    console.error(chalk.red("\n💥 Spider error:"), err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red("💥 Spider error:"), err);
  process.exit(1);
});
