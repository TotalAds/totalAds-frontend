import type { LeadColumnFilters } from "@/components/leads/LeadsTable";

export interface LeadVerificationCounts {
  total: number;
  unverified: number;
  safe: number;
  catchAll: number;
  unknown: number;
  risky: number;
}

export function buildLeadsApiParams(options: {
  page: number;
  limit: number;
  search: string;
  filters: LeadColumnFilters;
  archived?: boolean;
}): URLSearchParams {
  const params = new URLSearchParams({
    page: String(options.page),
    limit: String(options.limit),
  });

  if (options.search.trim()) params.append("search", options.search.trim());
  if (options.filters.email.trim()) params.append("email", options.filters.email.trim());
  if (options.filters.name.trim()) params.append("name", options.filters.name.trim());
  if (options.filters.categoryIds.length > 0) {
    params.append("categoryIds", options.filters.categoryIds.join(","));
  }
  if (options.filters.tagIds.length > 0) {
    params.append("tagIds", options.filters.tagIds.join(","));
  }
  if (options.filters.campaignIds.length > 0) {
    params.append("campaignIds", options.filters.campaignIds.join(","));
  }
  if (options.filters.listIds.length > 0) {
    params.append("listIds", options.filters.listIds.join(","));
  }
  if (options.filters.verification.length > 0) {
    params.append("verification", options.filters.verification.join(","));
  }
  if (options.archived) params.append("archived", "true");

  return params;
}

export function filtersToApiBody(
  search: string,
  filters: LeadColumnFilters
): Record<string, unknown> {
  return {
    search: search.trim() || undefined,
    email: filters.email.trim() || undefined,
    name: filters.name.trim() || undefined,
    categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    campaignIds: filters.campaignIds.length > 0 ? filters.campaignIds : undefined,
    listIds: filters.listIds.length > 0 ? filters.listIds : undefined,
    verification:
      filters.verification.length > 0 ? filters.verification : undefined,
  };
}

export const EMPTY_LEAD_COUNTS: LeadVerificationCounts = {
  total: 0,
  unverified: 0,
  safe: 0,
  catchAll: 0,
  unknown: 0,
  risky: 0,
};
