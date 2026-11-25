/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { Newsreader } from "next/font/google";

/**
 * The landing's display face, for its large headings only (the `font-display`
 * utility): a serif that reads like an important document, beside Geist for
 * everything else. next/font serves it from our own domain, so visitors'
 * browsers ask nothing of Google and the CSP's font-src 'self' holds.
 */
export const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-newsreader",
});
