import path from "node:path";
import { URL } from "node:url";
import { JSDOM } from "jsdom";
import slugify from "slugify";

function getLinkUrl(currentUrl: string, element: HTMLAnchorElement) {
  // Skip template placeholders and invalid hrefs
  const href = element.getAttribute("href") || "";
  if (
    !href ||
    href.includes("[%") ||
    href.includes("%]") || // Template placeholders
    href.includes("{{") ||
    href.includes("}}") || // Handlebars/Mustache templates
    href.includes("${") || // Template literals
    href.startsWith("javascript:") || // JavaScript links
    href.startsWith("mailto:") || // Email links
    href.startsWith("#") || // Fragment-only links
    href === "/" || // Root link (usually not what we want)
    href.trim() === "" // Empty links
  ) {
    return null;
  }

  // Only keep links under or at the same level as currentUrl's path
  const parsedLink = new URL(href, currentUrl);
  const currentParsedUrl = new URL(currentUrl);
  if (
    parsedLink.hostname !== currentParsedUrl.hostname ||
    !parsedLink.pathname
  ) {
    return null;
  }

  // Get the base path of currentUrl (e.g., /fhir/R4)
  // If the current URL ends with a file (like index.html), get its directory
  let basePath = currentParsedUrl.pathname.replace(/\/$/, "");
  if (basePath.match(/\.(html?|htm)$/i)) {
    basePath = path.dirname(basePath);
  }

  const linkPath = parsedLink.pathname.replace(/\/$/, "");

  // Only keep links that are exactly the base path or are under the base path
  // This prevents /fhir/R4B from matching when base path is /fhir/R4
  if (linkPath !== basePath && !linkPath.startsWith(basePath + "/")) {
    return null;
  }

  return parsedLink.toString();
}

export function urlToFilename(url: string) {
  const parsedUrl = new URL(url);
  const urlPath = parsedUrl.pathname
    .split("/")
    .filter((component) => component !== "")
    .map((component) =>
      slugify(component.replace(/\.html$/, ""), { lower: true })
    )
    .join("/");
  const safeHostname = slugify(parsedUrl.hostname, { lower: true });
  let filename = path.join(safeHostname, urlPath);
  // Only append .html if not already present
  if (!filename.endsWith(".html") && !filename.endsWith(".htm")) {
    filename += ".html";
  }
  return filename;
}

export function getPageLinks(currentUrl: string, body: Buffer) {
  const dom = new JSDOM(body);
  const document = dom.window.document;
  const linkElements = document.querySelectorAll("a");
  const links = Array.from(linkElements)
    .map(function (element) {
      return getLinkUrl(currentUrl, element as HTMLAnchorElement);
    })
    .filter((link) => link !== null);
  return links;
}
