# Web Spider 🕷️

A concurrent web spider/crawler for downloading web pages recursively with configurable depth and concurrency control.

## Features

✨ **Concurrent Downloads** - Download multiple pages simultaneously with configurable concurrency limits  
🎯 **Configurable Depth** - Control how deep the spider crawls with nesting level limits  
📂 **Target Directory** - Specify where to save downloaded files  
🎨 **Beautiful Progress** - Real-time progress tracking with colorful CLI output  
⚡ **Functional Design** - Clean, modern functional programming architecture  
🔄 **Event-Driven** - Extensible event system for monitoring crawling progress

## Installation

### Global Installation (Recommended)

Install globally to use the `web-spider` command from anywhere:

```bash
npm install -g web-spider
```

### Local Installation

```bash
npm install web-spider
```

## CLI Usage

After global installation, use the `web-spider` command:

```bash
web-spider <url> [options]
```

### Options

| Option                     | Description                    | Default       |
| -------------------------- | ------------------------------ | ------------- |
| `-n, --nesting <depth>`    | Maximum crawling depth         | `3`           |
| `-c, --concurrency <num>`  | Number of concurrent downloads | `2`           |
| `-t, --target <directory>` | Target directory for downloads | `./downloads` |
| `-h, --help`               | Display help information       | -             |
| `-V, --version`            | Show version number            | -             |

### Examples

```bash
# Basic usage - crawl a website with default settings
web-spider https://example.com

# Crawl with custom depth and concurrency
web-spider https://example.com -n 5 -c 4

# Save to a specific directory
web-spider https://example.com -t ./my-downloads

# Shallow crawl with high concurrency
web-spider https://example.com -n 1 -c 8

# Complete example with all options
web-spider https://httpbin.org/html -n 2 -c 3 -t ./test-crawl
```

## Programmatic Usage

You can also use the spider programmatically in your Node.js applications:

```typescript
import { createSpider } from "web-spider";

// Create a spider instance
const spider = createSpider({
  startUrl: "https://example.com",
  nesting: 3,
  concurrency: 2,
  targetDirectory: "./downloads",
});

// Listen to events
spider.on("page-downloaded", (data) => {
  console.log(`Downloaded: ${data.url} -> ${data.filePath}`);
});

spider.on("spider-complete", (data) => {
  console.log(`Spider completed! Downloaded ${data.totalFiles} files`);
});

spider.on("spider-error", (error) => {
  console.error("Spider error:", error);
});

// Start crawling
spider.start();
```

## API Reference

### `createSpider(config: SpiderConfig)`

Creates a new spider instance with the specified configuration.

#### Configuration Options

```typescript
interface SpiderConfig {
  startUrl: string; // URL to start crawling from
  nesting: number; // Maximum crawling depth
  concurrency: number; // Number of concurrent downloads
  targetDirectory: string; // Directory to save files
}
```

#### Events

The spider emits the following events:

- `page-downloaded` - Fired when a page is successfully downloaded
- `spider-complete` - Fired when all crawling is finished
- `spider-error` - Fired when an error occurs

#### Methods

- `start()` - Begins the crawling process
- `on(event, listener)` - Adds an event listener
- `off(event, listener)` - Removes an event listener

## How It Works

1. **URL Processing** - The spider starts with a seed URL and extracts all links from each page
2. **Depth Control** - Tracks crawling depth to respect the nesting limit
3. **Concurrent Downloads** - Uses a queue system to manage concurrent downloads
4. **File Saving** - Downloads and saves HTML content with organized file names
5. **Progress Tracking** - Provides real-time feedback on crawling progress

## File Organization

Downloaded files are saved with descriptive names based on the URL path:

```
downloads/
├── example.com.html                # https://example.com/
├── example.com/
│   ├── about.html                  # https://example.com/about
│   ├── contact-us.html             # https://example.com/contact-us
│   └── index.html                  # https://example.com/index.html
```

## Requirements

- Node.js >= 16.0.0
- TypeScript support for development

## Development

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd web-spider

# Install dependencies
npm install

# Build the project
npm run build
```

### Scripts

```bash
npm run build      # Compile TypeScript to JavaScript
npm run dev        # Watch mode for development
npm run clean      # Clean build artifacts
npm run cli        # Run CLI locally (for testing)
```

### Project Structure

```
web-spider/
├── src/
│   ├── index.ts       # Main exports
│   ├── spider.ts      # Core spider logic
│   ├── downloader.ts  # Download functionality
│   ├── types.ts       # TypeScript definitions
│   └── utils.ts       # Utility functions
├── cli.ts             # Command-line interface
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

The web spider uses a **functional programming** approach with:

- **Factory Functions** - `createSpider()` and `createDownloader()` for clean instantiation
- **Event-Driven Design** - EventEmitter pattern for extensible monitoring
- **Closure-Based State** - Encapsulated state management without classes
- **Pure Functions** - Predictable, testable utility functions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0

- ✨ Initial release
- 🚀 Concurrent web crawling
- 📂 Configurable target directories
- 🎨 Beautiful CLI with progress tracking
- ⚡ Functional programming architecture
- 🔄 Event-driven design

---

Made with ❤️ and TypeScript
