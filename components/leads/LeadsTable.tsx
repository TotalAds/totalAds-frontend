"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCode,
  IconGripVertical,
  IconMail,
  IconTrash,
} from "@tabler/icons-react";

import ColumnFilterMenu, { FilterOption } from "@/components/leads/ColumnFilterMenu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface LeadRow {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
  status: string;
  sendError?: string | null;
  campaigns?: Array<{ id: string; name: string; status?: string }>;
  tags?: Array<{ id: string; name: string; color?: string }>;
  categories?: Array<{ id: string; name: string; color?: string }>;
  lists?: Array<{ id: string; name: string }>;
  verificationStatus?: string | null;
  isSafeToSend?: boolean | null;
  customFields?: Record<string, unknown> | null;
  enrichedData?: Record<string, unknown> | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface LeadColumnFilters {
  email: string;
  name: string;
  verification: string[];
  tagIds: string[];
  categoryIds: string[];
  listIds: string[];
  campaignIds: string[];
}

export interface LeadFilterOptions {
  tags: FilterOption[];
  categories: FilterOption[];
  lists: FilterOption[];
  campaigns: FilterOption[];
}

const VERIFICATION_OPTIONS: FilterOption[] = [
  { id: "safe", name: "Safe to send" },
  { id: "risky", name: "Risky" },
  { id: "unverified", name: "Unverified" },
  { id: "pending", name: "Pending" },
];

const STORAGE_KEY = "leadsnipper-leads-table-layout";

type MovableColumnId =
  | "email"
  | "status"
  | "name"
  | "tags"
  | "categories"
  | "lists"
  | "campaign";

type ColumnId = MovableColumnId | "select" | "actions";

const DEFAULT_COLUMN_ORDER: MovableColumnId[] = [
  "email",
  "status",
  "name",
  "tags",
  "categories",
  "lists",
  "campaign",
];

const DEFAULT_COLUMN_WIDTHS: Record<ColumnId, number> = {
  select: 52,
  email: 220,
  status: 130,
  name: 140,
  tags: 180,
  categories: 180,
  lists: 160,
  campaign: 150,
  actions: 132,
};

const MIN_COLUMN_WIDTHS: Record<ColumnId, number> = {
  select: 52,
  email: 140,
  status: 110,
  name: 100,
  tags: 120,
  categories: 120,
  lists: 120,
  campaign: 120,
  actions: 88,
};

interface TableLayout {
  order: MovableColumnId[];
  widths: Partial<Record<ColumnId, number>>;
}

interface LeadsTableProps {
  leads: LeadRow[];
  loading?: boolean;
  canEdit?: boolean;
  filters: LeadColumnFilters;
  filterOptions: LeadFilterOptions;
  onFiltersChange: (filters: LeadColumnFilters) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onVerify?: (lead: LeadRow) => void;
  onDelete?: (leadId: string) => void;
  onViewDetails?: (lead: LeadRow) => void;
  onCampaignClick?: (lead: LeadRow) => void;
  emptyMessage?: string;
  page: number;
  limit: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function loadTableLayout(): TableLayout {
  if (typeof window === "undefined") {
    return { order: DEFAULT_COLUMN_ORDER, widths: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: DEFAULT_COLUMN_ORDER, widths: {} };
    const parsed = JSON.parse(raw) as TableLayout;
    const validOrder = DEFAULT_COLUMN_ORDER.filter((id) =>
      parsed.order?.includes(id)
    );
    const missing = DEFAULT_COLUMN_ORDER.filter((id) => !validOrder.includes(id));
    return {
      order: [...validOrder, ...missing],
      widths: parsed.widths ?? {},
    };
  } catch {
    return { order: DEFAULT_COLUMN_ORDER, widths: {} };
  }
}

function VerificationBadge({ lead }: { lead: LeadRow }) {
  const hasStatus = !!lead.verificationStatus;
  const hasSafeFlag = typeof lead.isSafeToSend === "boolean";

  if (!hasStatus && !hasSafeFlag) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
        Unverified
      </span>
    );
  }

  const status = (lead.verificationStatus || "").toLowerCase();
  const riskyStatuses = [
    "invalid",
    "disposable",
    "spamtrap",
    "catch_all",
    "role_account",
  ];
  const isSafe = lead.isSafeToSend === true;
  const isRisky =
    lead.isSafeToSend === false || riskyStatuses.includes(status || "");

  if (isSafe) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        Safe to send
      </span>
    );
  }

  if (isRisky) {
    return (
      <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
        Risky
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
      {status || "Pending"}
    </span>
  );
}

function PillGroup({
  items,
  emptyLabel = "-",
  maxVisible = 2,
  defaultColor = "#3b82f6",
}: {
  items?: Array<{ id: string; name: string; color?: string }>;
  emptyLabel?: string;
  maxVisible?: number;
  defaultColor?: string;
}) {
  if (!items || items.length === 0) {
    return <span className="text-sm text-slate-400">{emptyLabel}</span>;
  }

  const visible = items.slice(0, maxVisible);
  const remaining = items.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((item) => (
        <span
          key={item.id}
          className="inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: item.color ? `${item.color}15` : `${defaultColor}15`,
            color: item.color || defaultColor,
            borderColor: item.color ? `${item.color}30` : `${defaultColor}30`,
          }}
          title={item.name}
        >
          {item.name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          +{remaining}
        </span>
      )}
    </div>
  );
}

function ResizableHeaderCell({
  columnId,
  label,
  width,
  minWidth,
  filter,
  draggable = true,
  dragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onResizeStart,
}: {
  columnId: ColumnId;
  label: string;
  width: number;
  minWidth: number;
  filter?: ReactNode;
  draggable?: boolean;
  dragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  onResizeStart: (columnId: ColumnId, e: React.MouseEvent) => void;
}) {
  return (
    <TableHead
      style={{ width, minWidth, maxWidth: width }}
      className={cn(
        "relative h-11 select-none bg-slate-50/90 px-0",
        dragOver && "bg-brand-main/5 ring-1 ring-inset ring-brand-main/20"
      )}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
    >
      <div className="flex h-full items-center gap-1 px-3">
        {draggable && (
          <button
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", columnId);
              onDragStart?.();
            }}
            onDragEnd={onDragEnd}
            className="cursor-grab rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
            aria-label={`Drag ${label} column`}
          >
            <IconGripVertical size={14} />
          </button>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </span>
          {filter}
        </div>
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${label} column`}
        onMouseDown={(e) => onResizeStart(columnId, e)}
        className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize touch-none hover:bg-brand-main/30 active:bg-brand-main/50"
      />
    </TableHead>
  );
}

export default function LeadsTable({
  leads,
  loading = false,
  canEdit = false,
  filters,
  filterOptions,
  onFiltersChange,
  selectedIds,
  onSelectionChange,
  onVerify,
  onDelete,
  onViewDetails,
  onCampaignClick,
  emptyMessage = "No leads found",
  page,
  limit,
  total,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
}: LeadsTableProps) {
  const [columnOrder, setColumnOrder] =
    useState<MovableColumnId[]>(DEFAULT_COLUMN_ORDER);
  const [columnWidths, setColumnWidths] = useState<Record<ColumnId, number>>(
    DEFAULT_COLUMN_WIDTHS
  );
  const [draggingColumn, setDraggingColumn] = useState<MovableColumnId | null>(
    null
  );
  const [dragOverColumn, setDragOverColumn] = useState<MovableColumnId | null>(
    null
  );
  const layoutLoadedRef = useRef(false);

  useEffect(() => {
    const saved = loadTableLayout();
    setColumnOrder(saved.order);
    setColumnWidths((prev) => ({
      ...prev,
      ...saved.widths,
    }));
    layoutLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!layoutLoadedRef.current) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ order: columnOrder, widths: columnWidths })
    );
  }, [columnOrder, columnWidths]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);
  const columnCount = columnOrder.length + 1 + (canEdit ? 1 : 0);

  const allPageSelected = useMemo(
    () => leads.length > 0 && leads.every((lead) => selectedIds.has(lead.id)),
    [leads, selectedIds]
  );

  const somePageSelected = useMemo(
    () => leads.some((lead) => selectedIds.has(lead.id)) && !allPageSelected,
    [leads, selectedIds, allPageSelected]
  );

  const updateFilter = useCallback(
    <K extends keyof LeadColumnFilters>(key: K, value: LeadColumnFilters[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        onSelectionChange(new Set());
        return;
      }
      onSelectionChange(new Set(leads.map((lead) => lead.id)));
    },
    [leads, onSelectionChange]
  );

  const toggleRow = useCallback(
    (leadId: string, checked: boolean) => {
      const next = new Set(selectedIds);
      if (checked) next.add(leadId);
      else next.delete(leadId);
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange]
  );

  const handleResizeStart = useCallback(
    (columnId: ColumnId, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = columnWidths[columnId];
      const minWidth = MIN_COLUMN_WIDTHS[columnId];

      const onMouseMove = (moveEvent: MouseEvent) => {
        const nextWidth = Math.max(
          minWidth,
          startWidth + moveEvent.clientX - startX
        );
        setColumnWidths((prev) => ({ ...prev, [columnId]: nextWidth }));
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [columnWidths]
  );

  const reorderColumns = useCallback(
    (sourceId: MovableColumnId, targetId: MovableColumnId) => {
      if (sourceId === targetId) return;
      setColumnOrder((prev) => {
        const next = [...prev];
        const sourceIndex = next.indexOf(sourceId);
        const targetIndex = next.indexOf(targetId);
        if (sourceIndex < 0 || targetIndex < 0) return prev;
        next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, sourceId);
        return next;
      });
    },
    []
  );

  const columnMeta = useMemo(
    () =>
      ({
        email: {
          label: "Email",
          filter: (
            <ColumnFilterMenu
              type="text"
              label="Email"
              value={filters.email}
              placeholder="Filter by email…"
              onApply={(value) => updateFilter("email", value)}
            />
          ),
        },
        status: {
          label: "Status",
          filter: (
            <ColumnFilterMenu
              type="multi"
              label="Verification status"
              options={VERIFICATION_OPTIONS}
              selectedIds={filters.verification}
              onApply={(value) => updateFilter("verification", value)}
              searchable={false}
            />
          ),
        },
        name: {
          label: "Name",
          filter: (
            <ColumnFilterMenu
              type="text"
              label="Name"
              value={filters.name}
              placeholder="Filter by name…"
              onApply={(value) => updateFilter("name", value)}
            />
          ),
        },
        tags: {
          label: "Tags",
          filter: (
            <ColumnFilterMenu
              type="multi"
              label="Tags"
              options={filterOptions.tags}
              selectedIds={filters.tagIds}
              onApply={(value) => updateFilter("tagIds", value)}
            />
          ),
        },
        categories: {
          label: "Categories",
          filter: (
            <ColumnFilterMenu
              type="multi"
              label="Categories"
              options={filterOptions.categories}
              selectedIds={filters.categoryIds}
              onApply={(value) => updateFilter("categoryIds", value)}
            />
          ),
        },
        lists: {
          label: "Lists",
          filter: (
            <ColumnFilterMenu
              type="multi"
              label="Lists"
              options={filterOptions.lists}
              selectedIds={filters.listIds}
              onApply={(value) => updateFilter("listIds", value)}
            />
          ),
        },
        campaign: {
          label: "Campaign",
          filter: (
            <ColumnFilterMenu
              type="multi"
              label="Campaigns"
              options={filterOptions.campaigns}
              selectedIds={filters.campaignIds}
              onApply={(value) => updateFilter("campaignIds", value)}
            />
          ),
        },
      }) satisfies Record<
        MovableColumnId,
        { label: string; filter: ReactNode }
      >,
    [filters, filterOptions, updateFilter]
  );

  const renderCell = (columnId: MovableColumnId, lead: LeadRow) => {
    switch (columnId) {
      case "email":
        return (
          <span
            className="block truncate text-sm font-medium text-brand-main"
            title={lead.email}
          >
            {lead.email}
          </span>
        );
      case "status":
        return <VerificationBadge lead={lead} />;
      case "name":
        return (
          <span className="block truncate text-sm text-slate-700">
            {lead.name || "—"}
          </span>
        );
      case "tags":
        return <PillGroup items={lead.tags} defaultColor="#3b82f6" />;
      case "categories":
        return (
          <PillGroup items={lead.categories} defaultColor="#9333ea" />
        );
      case "lists":
        return (
          <PillGroup
            items={lead.lists?.map((l) => ({
              id: l.id,
              name: l.name,
              color: "#0891b2",
            }))}
            defaultColor="#0891b2"
          />
        );
      case "campaign":
        return lead.campaigns && lead.campaigns.length > 0 ? (
          <button
            type="button"
            onClick={() => onCampaignClick?.(lead)}
            className="block w-full truncate text-left text-sm text-brand-secondary hover:text-brand-main"
          >
            {lead.campaigns.length === 1
              ? lead.campaigns[0].name
              : `${lead.campaigns.length} campaigns`}
          </button>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table className="table-fixed min-w-full">
          <colgroup>
            {canEdit && (
              <col
                style={{
                  width: columnWidths.select,
                  minWidth: columnWidths.select,
                }}
              />
            )}
            {columnOrder.map((columnId) => (
              <col
                key={columnId}
                style={{
                  width: columnWidths[columnId],
                  minWidth: columnWidths[columnId],
                }}
              />
            ))}
            <col
              style={{
                width: columnWidths.actions,
                minWidth: columnWidths.actions,
              }}
            />
          </colgroup>

          <TableHeader>
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              {canEdit && (
                <TableHead
                  style={{
                    width: columnWidths.select,
                    minWidth: columnWidths.select,
                    maxWidth: columnWidths.select,
                  }}
                  className="relative h-11 bg-slate-50/90 px-4"
                >
                  <Checkbox
                    checked={
                      allPageSelected
                        ? true
                        : somePageSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(checked) =>
                      toggleSelectAll(checked === true)
                    }
                    aria-label="Select all filtered leads on this page"
                    className="border-slate-300 data-[state=checked]:border-brand-main data-[state=checked]:bg-brand-main"
                  />
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize selection column"
                    onMouseDown={(e) => handleResizeStart("select", e)}
                    className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize touch-none hover:bg-brand-main/30 active:bg-brand-main/50"
                  />
                </TableHead>
              )}

              {columnOrder.map((columnId) => (
                <ResizableHeaderCell
                  key={columnId}
                  columnId={columnId}
                  label={columnMeta[columnId].label}
                  width={columnWidths[columnId]}
                  minWidth={MIN_COLUMN_WIDTHS[columnId]}
                  filter={columnMeta[columnId].filter}
                  dragOver={dragOverColumn === columnId}
                  onDragStart={() => setDraggingColumn(columnId)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingColumn && draggingColumn !== columnId) {
                      setDragOverColumn(columnId);
                    }
                  }}
                  onDrop={() => {
                    if (draggingColumn) {
                      reorderColumns(draggingColumn, columnId);
                    }
                    setDraggingColumn(null);
                    setDragOverColumn(null);
                  }}
                  onDragEnd={() => {
                    setDraggingColumn(null);
                    setDragOverColumn(null);
                  }}
                  onResizeStart={handleResizeStart}
                />
              ))}

              <TableHead
                style={{
                  width: columnWidths.actions,
                  minWidth: columnWidths.actions,
                  maxWidth: columnWidths.actions,
                }}
                className="relative h-11 bg-slate-50/90 px-4"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </span>
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize actions column"
                  onMouseDown={(e) => handleResizeStart("actions", e)}
                  className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize touch-none hover:bg-brand-main/30 active:bg-brand-main/50"
                />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand-main" />
                    <p className="text-sm text-slate-500">Loading leads…</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-48 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const selected = selectedIds.has(lead.id);
                return (
                  <TableRow
                    key={lead.id}
                    className={cn(
                      "border-b border-slate-100 transition-colors hover:bg-slate-50/70",
                      selected && "bg-brand-main/[0.04]"
                    )}
                  >
                    {canEdit && (
                      <TableCell className="overflow-hidden px-4 py-3">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) =>
                            toggleRow(lead.id, checked === true)
                          }
                          aria-label={`Select ${lead.email}`}
                          className="border-slate-300 data-[state=checked]:border-brand-main data-[state=checked]:bg-brand-main"
                        />
                      </TableCell>
                    )}

                    {columnOrder.map((columnId) => (
                      <TableCell
                        key={`${lead.id}-${columnId}`}
                        className="overflow-hidden px-4 py-3"
                      >
                        {renderCell(columnId, lead)}
                      </TableCell>
                    ))}

                    <TableCell className="overflow-hidden px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewDetails?.(lead)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-main"
                          title="View lead JSON"
                        >
                          <IconCode size={16} />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => onVerify?.(lead)}
                              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-main"
                              title="Verify with Reoon"
                            >
                              <IconMail size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete?.(lead.id)}
                              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                              title="Delete lead"
                            >
                              <IconTrash size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="text-slate-500">Rows per page</span>
          <select
            value={limit}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-main/30"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-slate-600">
          {total === 0 ? "0 results" : `${startRow}–${endRow} of ${total}`}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            title="First page"
          >
            «
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-md p-1 text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            title="Previous page"
          >
            <IconChevronLeft size={18} />
          </button>
          <span className="min-w-[88px] px-2 text-center text-sm font-medium text-slate-700">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md p-1 text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            title="Next page"
          >
            <IconChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            title="Last page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}

export const EMPTY_LEAD_FILTERS: LeadColumnFilters = {
  email: "",
  name: "",
  verification: [],
  tagIds: [],
  categoryIds: [],
  listIds: [],
  campaignIds: [],
};

export function hasActiveLeadFilters(filters: LeadColumnFilters): boolean {
  return (
    filters.email.trim().length > 0 ||
    filters.name.trim().length > 0 ||
    filters.verification.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.categoryIds.length > 0 ||
    filters.listIds.length > 0 ||
    filters.campaignIds.length > 0
  );
}
