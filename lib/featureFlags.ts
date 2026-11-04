/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * Features kept in the code but hidden from users until their results are
 * reliable: the semantic document search and the document AI actions
 * (field extraction, clause risk). Off unless NEXT_PUBLIC_EXPERIMENTAL_AI=true.
 */
export const SHOW_EXPERIMENTAL_AI = process.env.NEXT_PUBLIC_EXPERIMENTAL_AI === "true";
