"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  Mail,
  Eye,
  MousePointerClick,
  Reply,
  AlertTriangle,
  XCircle,
  Clock,
  Ban,
  CheckCircle,
  MoreHorizontal,
} from "lucide-react";
import { getCampaignLeadSequence, LeadFilters } from "@/utils/api/emailClient";
import toast from "react-hot-toast";

interface LeadActivityTableProps {
  leads: Array<{
    email: string;
    stepLabel: string;
    stepNumber?: number;
    status: string;
    nextSend?: string;
    sent: boolean;
    read: boolean;
    replied: boolean;
    onMarkReplied: () => void;
  }>;
  sequenceSteps?: number[];
  selectedStep?: number | "all";
  onStepChange?: (step: number | "all") => void;
  campaignId?: string;
  domainId?: string;
  onMarkReplied?: (leadId: string) => Promise<void>;
}

type FilterStatus =
  | "all"
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "replied"
  | "failed"
  | "bounced"
  | "complained"
  | "unsubscribed";

interface LeadData {
  id: string;
  leadId?: string;
  toEmail: string;
  status: string;
  sequenceStepIndex: number;
  sentAt?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
  readAt?: string | null;
  repliedAt?: string | null;
  clickedAt?: string | null;
  bouncedAt?: string | null;
  complaintAt?: string | null;
  unsubscribedAt?: string | null;
  failedAt?: string | null;
  nextRetryAt?: string | null;
  error?: string | null;
  errorDetails?: string | null;
  engagementStatus?: string;
  hasError?: boolean;
}

const STATUS_OPTIONS: { value: FilterStatus; label: string; color: string }[] = [
  { value: "all", label: "All Status", color: "bg-gray-100" },
  { value: "pending", label: "Pending", color: "bg-amber-100" },
  { value: "sent", label: "Sent", color: "bg-blue-100" },
  { value: "delivered", label: "Delivered", color: "bg-cyan-100" },
  { value: "opened", label: "Opened", color: "bg-green-100" },
  { value: "clicked", label: "Clicked", color: "bg-purple-100" },
  { value: "replied", label: "Replied", color: "bg-indigo-100" },
  { value: "failed", label: "Failed", color: "bg-orange-100" },
  { value: "bounced", label: "Bounced", color: "bg-rose-100" },
  { value: "complained", label: "Complained", color: "bg-red-100" },
  { value: "unsubscribed", label: "Unsubscribed", color: "bg-gray-200" },
];

const StatusBadge: React.FC<{ status: string; engagementStatus?: string }> = ({
  status,
  engagementStatus,
}) => {
  const effectiveStatus = engagementStatus || status;

  const getStyles = () => {
    switch (effectiveStatus) {
      case "clicked":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "replied":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "opened":
      case "read":
        return "bg-green-50 text-green-700 border-green-200";
      case "delivered":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "sent":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "bounced":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "complained":
        return "bg-red-50 text-red-700 border-red-200";
      case "unsubscribed":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "failed":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "pending":
      case "processing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStyles()}`}
    >
      {effectiveStatus}
    </span>
  );
};

const ActionIcons: React.FC<{
  lead: LeadData;
  onMarkReplied?: (leadId: string) => Promise<void>;
}> = ({ lead, onMarkReplied }) => {
  return (
    <div className="flex items-center gap-1">
      {lead.sentAt && (
        <span className="text-blue-500" title="Sent">
          <Mail size={14} />
        </span>
      )}
      {(lead.openedAt || lead.readAt) && (
        <span className="text-green-500" title="Opened">
          <Eye size={14} />
        </span>
      )}
      {lead.clickedAt && (
        <span className="text-purple-500" title="Clicked">
          <MousePointerClick size={14} />
        </span>
      )}
      {lead.repliedAt && (
        <span className="text-indigo-500" title="Replied">
          <Reply size={14} />
        </span>
      )}
      {lead.bouncedAt && (
        <span className="text-rose-500" title="Bounced">
          <XCircle size={14} />
        </span>
      )}
      {lead.complaintAt && (
        <span className="text-red-500" title="Complained">
          <AlertTriangle size={14} />
        </span>
      )}
      {lead.unsubscribedAt && (
        <span className="text-gray-500" title="Unsubscribed">
          <Ban size={14} />
        </span>
      )}
      {lead.failedAt && (
        <span className="text-orange-500" title="Failed">
          <AlertTriangle size={14} />
        </span>
      )}
    </div>
  );
};

export const LeadActivityTable: React.FC<LeadActivityTableProps> = ({
  leads: initialLeads,
  sequenceSteps = [],
  selectedStep = "all",
  onStepChange,
  campaignId,
  onMarkReplied,
}) => {
  // State for server-side data
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [stepFilter, setStepFilter] = useState<number | "all">(selectedStep);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchQuery);
      setPagination((p) => ({ ...p, page: 1 })); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync step filter from parent
  useEffect(() => {
    setStepFilter(selectedStep);
  }, [selectedStep]);

  // Fetch leads from server
  const fetchLeads = useCallback(async () => {
    if (!campaignId) {
      // Use initial leads if no campaignId provided (backward compat)
      setLeads(
        initialLeads.map((l) => ({
          id: l.email,
          toEmail: l.email,
          status: l.status,
          sequenceStepIndex: (l.stepNumber || 1) - 1,
          engagementStatus: l.status,
        })) as LeadData[]
      );
      return;
    }

    setLoading(true);
    try {
      const filters: LeadFilters = {};
      if (statusFilter !== "all") filters.status = statusFilter;
      if (stepFilter !== "all" && typeof stepFilter === "number")
        filters.step = stepFilter - 1; // API uses 0-indexed
      if (searchDebounced) filters.search = searchDebounced;

      const response = await getCampaignLeadSequence(
        campaignId,
        pagination.page,
        pagination.limit,
        filters
      );

      setLeads(response.leads);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      toast.error("Failed to load lead activity");
    } finally {
      setLoading(false);
    }
  }, [
    campaignId,
    pagination.page,
    pagination.limit,
    statusFilter,
    stepFilter,
    searchDebounced,
    initialLeads,
  ]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handle status filter change
  const handleStatusChange = (status: FilterStatus) => {
    setStatusFilter(status);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // Handle step filter change
  const handleStepChange = (step: number | "all") => {
    setStepFilter(step);
    onStepChange?.(step);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // Handle mark replied
  const handleMarkReplied = async (leadId?: string) => {
    if (!leadId || !onMarkReplied) return;
    try {
      await onMarkReplied(leadId);
      toast.success("Marked as replied");
      fetchLeads(); // Refresh
    } catch {
      toast.error("Failed to mark as replied");
    }
  };

  // Format date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
  };

  // Truncate error
  const truncateError = (error?: string | null) => {
    if (!error) return null;
    return error.length > 50 ? error.slice(0, 50) + "..." : error;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Step Filter */}
          {sequenceSteps.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Step:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStepChange("all")}
                  className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                    stepFilter === "all"
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All
                </button>
                {sequenceSteps.slice(0, 6).map((step) => (
                  <button
                    key={step}
                    onClick={() => handleStepChange(step)}
                    className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                      stepFilter === step
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <Filter size={14} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as FilterStatus)}
              className="h-9 text-xs rounded-md border border-gray-200 bg-white px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(statusFilter !== "all" || stepFilter !== "all" || searchDebounced) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Active filters:</span>
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                Status: {statusFilter}
                <button
                  onClick={() => handleStatusChange("all")}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            {stepFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                Step: {stepFilter}
                <button onClick={() => handleStepChange("all")} className="hover:text-blue-900">
                  ×
                </button>
              </span>
            )}
            {searchDebounced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                Search: “{searchDebounced}”
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchDebounced("");
                  }}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                handleStatusChange("all");
                handleStepChange("all");
                setSearchQuery("");
                setSearchDebounced("");
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="text-xs font-medium text-gray-600">Lead</TableHead>
                <TableHead className="text-xs font-medium text-gray-600">Step</TableHead>
                <TableHead className="text-xs font-medium text-gray-600">Status</TableHead>
                <TableHead className="text-xs font-medium text-gray-600">Timeline</TableHead>
                <TableHead className="text-xs font-medium text-gray-600">Next Send</TableHead>
                <TableHead className="text-xs font-medium text-gray-600">Error</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 text-center">Activity</TableHead>
                <TableHead className="text-xs font-medium text-gray-600 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Loading leads...</p>
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <div className="text-gray-400">
                      <MoreHorizontal className="mx-auto h-8 w-8 mb-2" />
                      <p className="text-sm">No leads found matching your filters</p>
                      <button
                        onClick={() => {
                          handleStatusChange("all");
                          handleStepChange("all");
                          setSearchQuery("");
                        }}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="font-medium text-sm text-gray-900">
                      {lead.toEmail}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      Email {lead.sequenceStepIndex + 1}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} engagementStatus={lead.engagementStatus} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      <div className="space-y-0.5">
                        {lead.sentAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle size={10} className="text-green-500" />
                            <span>Sent {formatDate(lead.sentAt).split(",")[0]}</span>
                          </div>
                        )}
                        {!lead.sentAt && lead.nextRetryAt && (
                          <div className="flex items-center gap-1">
                            <Clock size={10} className="text-amber-500" />
                            <span>Scheduled</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {lead.nextRetryAt ? formatDate(lead.nextRetryAt) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {lead.error ? (
                        <span className="text-orange-600" title={lead.error}>
                          {truncateError(lead.error)}
                        </span>
                      ) : lead.hasError ? (
                        <span className="text-orange-600">Error</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <ActionIcons lead={lead} onMarkReplied={onMarkReplied} />
                    </TableCell>
                    <TableCell className="text-right">
                      {lead.leadId && !lead.repliedAt && lead.engagementStatus !== "replied" && (
                        <button
                          onClick={() => handleMarkReplied(lead.leadId)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark replied
                        </button>
                      )}
                      {lead.repliedAt && (
                        <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                          <CheckCircle size={12} />
                          Replied
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {pagination.total > 0 ? (
              <>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total.toLocaleString()} leads
              </>
            ) : (
              "No leads"
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
              }
              disabled={pagination.page <= 1 || loading}
              className="h-8 px-2"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xs text-gray-600">
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))
              }
              disabled={pagination.page >= pagination.pages || loading}
              className="h-8 px-2"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
