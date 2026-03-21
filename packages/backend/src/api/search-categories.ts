/**
 * GET /api/search-categories?platform=twitch|kick&query=<text>
 *
 * Uses App Access Tokens to search for game/category suggestions.
 *
 * Response: SearchCategoriesResponse
 */

import { config } from "../config.ts";
import type { SearchCategoriesResponse, CategorySearchResult } from "@twirchat/shared";
import { getTwitchAppToken, getKickAppToken } from "./stream-status.ts";

// ----------------------------------------------------------------
// Twitch
// ----------------------------------------------------------------

async function searchTwitchCategories(
  query: string,
): Promise<CategorySearchResult[]> {
  const token = await getTwitchAppToken();

  const res = await fetch(
    `https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(query)}&first=25`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": config.TWITCH_CLIENT_ID,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Twitch search/categories failed: ${res.status}`);
  }

  const body = (await res.json()) as {
    data: Array<{
      id: string;
      name: string;
      box_art_url?: string;
    }>;
  };

  return body.data.map((g) => ({
    id: g.id,
    name: g.name,
    thumbnailUrl: g.box_art_url
      ? g.box_art_url.replace("{width}", "52").replace("{height}", "72")
      : undefined,
  }));
}

// ----------------------------------------------------------------
// Kick
// ----------------------------------------------------------------

async function searchKickCategories(
  query: string,
): Promise<CategorySearchResult[]> {
  const token = await getKickAppToken();

  const res = await fetch(
    `https://api.kick.com/public/v2/categories?name=${encodeURIComponent(query)}&limit=25`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-ID": config.KICK_CLIENT_ID,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Kick categories search failed: ${res.status}`);
  }

  const body = (await res.json()) as {
    data?: Array<{
      id: number;
      name: string;
      thumbnail?: string;
    }>;
  };

  return (body.data ?? []).map((c) => ({
    id: String(c.id),
    name: c.name,
    thumbnailUrl: c.thumbnail,
  }));
}

// ----------------------------------------------------------------
// Public handler
// ----------------------------------------------------------------

export async function handleSearchCategories(
  url: URL,
): Promise<SearchCategoriesResponse> {
  const platform = url.searchParams.get("platform");
  const query = url.searchParams.get("query") ?? "";

  if (!platform) {
    throw new Error("platform query param is required");
  }

  if (platform === "twitch") {
    const categories = await searchTwitchCategories(query);
    return { categories };
  }

  if (platform === "kick") {
    const categories = await searchKickCategories(query);
    return { categories };
  }

  throw new Error(`Unsupported platform: ${platform}`);
}
