#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const title = process.argv[2];
if (!title) { console.error('Usage: pnpm new:post "My Title"'); process.exit(1); }

const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const d = new Date();
const iso = d.toISOString().slice(0,10);
const dir = join(process.cwd(), "content", "blog");
mkdirSync(dir, { recursive: true });

const filepath = join(dir, `${iso}-${slug}.mdx`);
const fm = `---
title: "${title}"
date: "${iso}"
excerpt: "One-liner that sells the click."
tags: ["general"]
draft: true
---
`;

writeFileSync(filepath, fm);
console.log("Created", filepath);