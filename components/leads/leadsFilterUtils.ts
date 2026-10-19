import type { LeadColumnFilters } from "@/components/leads/LeadsTable";

export interface LeadVerificationCounts {
  total: number;
  unverified: number;
  safe: number;
  catchAll: number;
  unknown: number;
  risky: number;
}

function appendCsv(params: URLSearchParams, key: string, values: string[]) {
  if (values.length > 0) params.append(key, values.join(","));
}

export function appendLeadFilters(
  params: URLSearchParams,
  options: {
    search: string;
    excludeSearch?: string;
    filters: LeadColumnFilters;
    archived?: boolean;
  }
) {
  const { filters } = options;
  if (options.search.trim()) params.append("search", options.search.trim());
  if (options.excludeSearch?.trim()) {
    params.append("excludeSearch", options.excludeSearch.trim());
  }
  if (filters.email.trim()) params.append("email", filters.email.trim());
  if (filters.excludeEmail.trim()) {
    params.append("excludeEmail", filters.excludeEmail.trim());
  }
  if (filters.name.trim()) params.append("name", filters.name.trim());
  if (filters.excludeName.trim()) {
    params.append("excludeName", filters.excludeName.trim());
  }
  appendCsv(params, "categoryIds", filters.categoryIds);
  appendCsv(params, "excludeCategoryIds", filters.excludeCategoryIds);
  appendCsv(params, "tagIds", filters.tagIds);
  appendCsv(params, "excludeTagIds", filters.excludeTagIds);
  appendCsv(params, "campaignIds", filters.campaignIds);
  appendCsv(params, "excludeCampaignIds", filters.excludeCampaignIds);
  appendCsv(params, "listIds", filters.listIds);
  appendCsv(params, "excludeListIds", filters.excludeListIds);
  appendCsv(params, "verification", filters.verification);
  appendCsv(params, "excludeVerification", filters.excludeVerification);
  if (options.archived) params.append("archived", "true");
}

export function buildLeadsApiParams(options: {
  page: number;
  limit: number;
  search: string;
  excludeSearch?: string;
  filters: LeadColumnFilters;
  archived?: boolean;
}): URLSearchParams {
  const params = new URLSearchParams({
    page: String(options.page),
    limit: String(options.limit),
  });
  appendLeadFilters(params, options);
  return params;
}

export function filtersToApiBody(
  search: string,
  filters: LeadColumnFilters,
  excludeSearch = ""
): Record<string, unknown> {
  return {
    search: search.trim() || undefined,
    excludeSearch: excludeSearch.trim() || undefined,
    email: filters.email.trim() || undefined,
    excludeEmail: filters.excludeEmail.trim() || undefined,
    name: filters.name.trim() || undefined,
    excludeName: filters.excludeName.trim() || undefined,
    categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
    excludeCategoryIds:
      filters.excludeCategoryIds.length > 0 ? filters.excludeCategoryIds : undefined,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    excludeTagIds: filters.excludeTagIds.length > 0 ? filters.excludeTagIds : undefined,
    campaignIds: filters.campaignIds.length > 0 ? filters.campaignIds : undefined,
    excludeCampaignIds:
      filters.excludeCampaignIds.length > 0 ? filters.excludeCampaignIds : undefined,
    listIds: filters.listIds.length > 0 ? filters.listIds : undefined,
    excludeListIds: filters.excludeListIds.length > 0 ? filters.excludeListIds : undefined,
    verification: filters.verification.length > 0 ? filters.verification : undefined,
    excludeVerification:
      filters.excludeVerification.length > 0 ? filters.excludeVerification : undefined,
  };
}

export function countActiveLeadFilterGroups(
  filters: LeadColumnFilters,
  search = "",
  excludeSearch = ""
): number {
  let count = 0;
  if (search.trim() || excludeSearch.trim()) count++;
  if (filters.email.trim() || filters.excludeEmail.trim()) count++;
  if (filters.name.trim() || filters.excludeName.trim()) count++;
  if (filters.verification.length > 0 || filters.excludeVerification.length > 0) count++;
  if (filters.tagIds.length > 0 || filters.excludeTagIds.length > 0) count++;
  if (filters.categoryIds.length > 0 || filters.excludeCategoryIds.length > 0) count++;
  if (filters.listIds.length > 0 || filters.excludeListIds.length > 0) count++;
  if (filters.campaignIds.length > 0 || filters.excludeCampaignIds.length > 0) count++;
  return count;
}

export const EMPTY_LEAD_COUNTS: LeadVerificationCounts = {
  total: 0,
  unverified: 0,
  safe: 0,
  catchAll: 0,
  unknown: 0,
  risky: 0,
};
