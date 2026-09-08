import { randomUUID } from "crypto";

function makeSlug(title: string): string {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")   // strip anything not alphanumeric/space/hyphen
        .trim()
        .replace(/\s+/g, "-")            // spaces to hyphens
        .replace(/-+/g, "-")            // collapse multiple hyphens
        .slice(0, 80);                  // leave room for the suffix under varchar(100)
    const suffix = randomUUID().slice(0, 8);
    return base ? `${base}-${suffix}` : suffix;
}