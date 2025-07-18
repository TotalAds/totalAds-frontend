/**
 * @deprecated This file is deprecated. Use the functions from @/utils/api/scraperClient instead.
 *
 * This file is kept for backward compatibility but should be replaced with:
 * - scrapeUrl from @/utils/api/scraperClient
 * - checkScraperHealth from @/utils/api/scraperClient
 * - getScraperUsage from @/utils/api/scraperClient
 */

// Re-export functions from the new API client
export {
  scrapeUrl,
  checkScraperHealth,
  getScraperUsage,
} from "@/utils/api/scraperClient";
