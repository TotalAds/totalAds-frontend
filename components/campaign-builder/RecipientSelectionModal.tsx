"use client";

import {
  Check,
  CheckCircle2,
  ChevronDown,
  List,
  Plus,
  Search,
  Upload,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import CreatableSelect from "@/components/common/CreatableSelect";
import { Button } from "@/components/ui/button";
import emailClient, {
  createLeadCategory,
  createLeadTag,
  createList,
  EmailList,
  filterLeadsByCriteria,
  getFilterOptions,
  getLeadCategories,
  getLeads,
  getLeadTags,
  getLists,
  getUserCampaigns,
  LeadCategory,
  LeadTag,
} from "@/utils/api/emailClient";
import {
  findDuplicateEmails,
  isValidEmail,
} from "@/utils/validation/emailValidator";

interface RecipientSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (data: {
    type: "list" | "filter" | "individual" | "csv";
    ids: string[];
    count: number;
    csvData?: Array<Record<string, string>>;
    columns?: string[];
    emailColumn?: string;
    csvUploadNote?: string;
  }) => void;
  initialSelection?: {
    type: "list" | "filter" | "individual" | "csv";
    ids: string[];
    count: number;
  };
  selectedTags?: LeadTag[];
  selectedCategories?: LeadCategory[];
  onTagsChange?: (tags: LeadTag[]) => void;
  onCategoriesChange?: (categories: LeadCategory[]) => void;
}

type TabType = "lists" | "filter" | "individual" | "upload";

interface Campaign {
  id: string;
  name: string;
  count?: number;
}

interface Contact {
  id: string;
  email: string;
  name?: string;
}

export default function RecipientSelectionModal({
  open,
  onClose,
  onSelect,
  initialSelection,
  selectedTags = [],
  selectedCategories = [],
  onTagsChange,
  onCategoriesChange,
}: RecipientSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("lists");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<{
    lists: string[];
    filterCriteria: {
      tagIds: string[];
      categoryIds: string[];
      campaignIds: string[];
      statuses: string[];
      listIds: string[];
    };
    contacts: string[];
    csvData: Array<Record<string, string>>;
    csvColumns: string[];
    csvEmailColumn: string;
    csvUploadNote?: string;
  }>({
    lists: [],
    filterCriteria: {
      tagIds: [],
      categoryIds: [],
      campaignIds: [],
      statuses: [],
      listIds: [],
    },
    contacts: [],
    csvData: [],
    csvColumns: [],
    csvEmailColumn: "email",
  });

  const [lists, setLists] = useState<EmailList[]>([]);
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredLeadIds, setFilteredLeadIds] = useState<string[]>([]);
  const [filteredLeadCount, setFilteredLeadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showCreateList, setShowCreateList] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV upload result: show modal with valid / invalid / duplicate breakdown instead of tooltips
  const [csvResultModal, setCsvResultModal] = useState<{
    totalUploaded: number;
    readyToAdd: number;
    invalidCount: number;
    duplicateCount: number;
    invalidEmails: Array<{ email: string; index: number }>;
    duplicateEmails: Array<{ email: string; count: number }>;
    validRows: Array<Record<string, any>>;
    columns: string[];
    emailField: string;
  } | null>(null);
  
  // Pagination for individual contacts
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsLimit] = useState(50);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsSearchTerm, setContactsSearchTerm] = useState("");
  
  // Filter options with counts
  const [filterOptions, setFilterOptions] = useState<{
    categories: Array<{ id: string; name: string; color: string; count: number }>;
    tags: Array<{ id: string; name: string; color: string; count: number }>;
    campaigns: Array<{ id: string; name: string; count: number }>;
    statuses: Array<{ value: string; label: string; count: number }>;
  }>({
    categories: [],
    tags: [],
    campaigns: [],
    statuses: [],
  });
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
  /** Distinct lead count for union of selected lists (Lists tab); avoids double-count when lists overlap */
  const [listsUnionCount, setListsUnionCount] = useState<number | null>(null);
  const [filterMatchLoading, setFilterMatchLoading] = useState(false);

  // Load data based on active tab
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, activeTab]);

  // Handle search with debounce for individual contacts
  useEffect(() => {
    if (activeTab === "individual" && open) {
      const timeoutId = setTimeout(() => {
        setContactsPage(1);
        loadContacts(1, contactsSearchTerm || undefined);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [contactsSearchTerm, activeTab, open]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Lists + filter options (tags, categories, campaigns) for every tab so Filter tab is prefetched
      const listsData = await getLists(1, 100);
      setLists(listsData.data.lists || []);
      await loadFilterOptions();
      if (activeTab === "individual") {
        await loadContacts(1, contactsSearchTerm || undefined);
      }
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load recipients");
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    setLoadingFilterOptions(true);
    try {
      const { tagIds, categoryIds, campaignIds, statuses, listIds } =
        selectedItems.filterCriteria;
      const options = await getFilterOptions({
        tagIds: tagIds.length > 0 ? tagIds : undefined,
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        campaignIds: campaignIds.length > 0 ? campaignIds : undefined,
        statuses: statuses.length > 0 ? statuses : undefined,
        listIds: listIds.length > 0 ? listIds : undefined,
      });
      setFilterOptions(options);
      
      // Update tags, categories from filter options
      setTags(
        options.tags.map((t) => ({ id: t.id, name: t.name, color: t.color }))
      );
      setCategories(
        options.categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        }))
      );
      // Update campaigns from filter options to get counts
      // The backend now always returns all campaigns with their total counts
      // Merge with all campaigns to ensure we have all campaigns available
      const allCampaigns = await getUserCampaigns();
      const campaignsWithCounts = allCampaigns.map((campaign) => {
        // Ensure ID comparison works by converting both to strings
        const campaignId = String(campaign.id);
        const optionCampaign = options.campaigns.find((c) => String(c.id) === campaignId);
        // Use count from filter options if available, otherwise preserve existing count or default to 0
        const existingCampaign = campaigns.find((c) => String(c.id) === campaignId);
        return {
          ...campaign,
          count: optionCampaign?.count ?? existingCampaign?.count ?? 0,
        };
      });
      // Use filter options campaigns which have counts, but ensure all campaigns are available
      setCampaigns(campaignsWithCounts);
    } catch (error: any) {
      console.error("Failed to load filter options:", error);
      toast.error("Failed to load filter options");
    } finally {
      setLoadingFilterOptions(false);
    }
  };

  const loadContacts = async (page: number, search?: string) => {
    setLoadingContacts(true);
    try {
      const response = await getLeads(
        page,
        contactsLimit,
        undefined,
        undefined,
        undefined,
        undefined,
        search
      );
      const leads = response.data?.leads || [];
      setContacts(
        leads.map((lead: any) => ({
          id: lead.id,
          email: lead.email,
          name: lead.name,
        }))
      );
      setContactsTotal(response.data?.pagination?.total || 0);
      setContactsPage(page);
    } catch (error: any) {
      console.error("Failed to load contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoadingContacts(false);
    }
  };

  // Load filter options when filter criteria changes
  useEffect(() => {
    if (activeTab === "filter") {
      loadFilterOptions();
    }
  }, [selectedItems.filterCriteria, activeTab]);

  // Lists tab: exact union count for selected lists (same semantics as backend / Apply)
  useEffect(() => {
    if (selectedItems.csvData.length > 0 || selectedItems.lists.length === 0) {
      setListsUnionCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await filterLeadsByCriteria({
          listIds: selectedItems.lists,
        });
        if (!cancelled) {
          const n = result.data?.count ?? result.data?.leadIds?.length ?? 0;
          setListsUnionCount(n);
        }
      } catch (e) {
        console.error("Failed to resolve list selection count:", e);
        if (!cancelled) setListsUnionCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedItems.lists, selectedItems.csvData.length]);

  // Apply filters (AND across campaign, lists, tags, categories, status) — server-side
  useEffect(() => {
    const applyFilters = async () => {
      const { tagIds, categoryIds, campaignIds, statuses, listIds } =
        selectedItems.filterCriteria;

      const hasFilters =
        tagIds.length > 0 ||
        categoryIds.length > 0 ||
        campaignIds.length > 0 ||
        statuses.length > 0 ||
        listIds.length > 0;

      if (!hasFilters) {
        setFilteredLeadIds([]);
        setFilteredLeadCount(0);
        setFilterMatchLoading(false);
        return;
      }

      setFilterMatchLoading(true);
      try {
        const result = await filterLeadsByCriteria({
          tagIds: tagIds.length > 0 ? tagIds : undefined,
          categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
          campaignIds: campaignIds.length > 0 ? campaignIds : undefined,
          statuses: statuses.length > 0 ? statuses : undefined,
          listIds: listIds.length > 0 ? listIds : undefined,
        });
        const leadIds = result.data.leadIds || [];
        setFilteredLeadIds(leadIds);
        setFilteredLeadCount(
          result.data.count ?? result.data.total ?? leadIds.length
        );
      } catch (error: any) {
        console.error("Failed to filter leads:", error);
        toast.error(
          error.response?.data?.message || "Failed to filter leads. Please try again."
        );
        setFilteredLeadIds([]);
        setFilteredLeadCount(0);
      } finally {
        setFilterMatchLoading(false);
      }
    };

    if (activeTab === "filter") {
      applyFilters();
    }
  }, [selectedItems.filterCriteria, activeTab]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const isCSV =
      file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
    const isExcel =
      file.type === "application/vnd.ms-excel" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.name.toLowerCase().endsWith(".xls");

    if (!isCSV && !isExcel) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setCsvUploading(true);

    const finalize = (rows: any[]) => {
      const cleanedRows = rows.filter((r) => {
        const vals = Object.values(r || {}).map((v) => String(v ?? "").trim());
        return vals.some((v) => v !== "");
      });

      if (cleanedRows.length === 0) {
        toast.error("File has no valid rows");
        setCsvUploading(false);
        return;
      }

      const rawCols = Object.keys(cleanedRows[0] || {});
      const columns = rawCols
        .map((c) => String(c || "").trim())
        .filter((c) => c.length > 0 && !/^(__?empty|empty|unnamed)/i.test(c));

      if (cleanedRows.length > 5000) {
        toast.error("Maximum 5000 rows allowed");
        setCsvUploading(false);
        return;
      }

      const inferEmailColumn = (
        cols: string[],
        rows: Array<Record<string, any>>
      ): string | null => {
        const direct = cols.find((c) => c.toLowerCase() === "email");
        if (direct) return direct;
        let bestCol: string | null = null;
        let bestCount = 0;
        for (const c of cols) {
          let count = 0;
          for (let i = 0; i < Math.min(rows.length, 200); i++) {
            const v = String(rows[i]?.[c] ?? "").trim();
            if (v && isValidEmail(v)) count++;
          }
          if (count > bestCount) {
            bestCount = count;
            bestCol = c;
          }
        }
        return bestCount > 0 ? bestCol : null;
      };

      const normalized = cleanedRows.map((r) => {
        const obj: Record<string, any> = {};
        for (const k of Object.keys(r)) {
          const nk = String(k || "").trim();
          if (nk && !/^(__?empty|empty|unnamed)/i.test(nk)) {
            const val = r[k];
            const strVal = String(val ?? "").trim();
            if (strVal && strVal !== "null" && strVal !== "undefined") {
              obj[nk] = strVal;
            }
          }
        }
        return obj;
      });

      const inferred = inferEmailColumn(columns, normalized);
      if (!inferred) {
        toast.error(
          "We couldn't detect the email column. Please select it manually."
        );
        setSelectedItems((prev) => ({
          ...prev,
          csvData: normalized,
          csvColumns: columns,
          csvEmailColumn: "",
        }));
        setCsvUploading(false);
        return;
      }

      const emailField = inferred;
      const invalidEmails: Array<{ email: string; index: number }> = [];
      const validatedData: typeof normalized = [];

      normalized.forEach((row, index) => {
        const email = row[emailField];
        if (!email || !isValidEmail(email)) {
          invalidEmails.push({ email: String(email || "EMPTY").trim(), index: index + 1 });
          return;
        }
        validatedData.push(row);
      });

      const { unique, duplicates } = findDuplicateEmails(validatedData, emailField);
      const seen = new Set<string>();
      const validUniqueRows: typeof validatedData = [];
      validatedData.forEach((row) => {
        const email = String(row[emailField] ?? "").trim().toLowerCase();
        if (seen.has(email)) return;
        seen.add(email);
        validUniqueRows.push(row);
      });

      const duplicateCount = validatedData.length - validUniqueRows.length;
      const duplicateEmails = duplicates.map((d) => ({ email: d.email, count: d.count }));

      setCsvResultModal({
        totalUploaded: normalized.length,
        readyToAdd: validUniqueRows.length,
        invalidCount: invalidEmails.length,
        duplicateCount,
        invalidEmails,
        duplicateEmails,
        validRows: validUniqueRows,
        columns,
        emailField,
      });
      setCsvUploading(false);
    };

    if (isCSV) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          try {
            finalize(results.data as any[]);
          } catch (e) {
            console.error(e);
            toast.error("Failed to parse CSV file");
            setCsvUploading(false);
          }
        },
        error: (error: any) => {
          console.error("CSV parse error:", error);
          toast.error("Failed to parse CSV file");
          setCsvUploading(false);
        },
      });
    } else if (isExcel) {
      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
          defval: "",
        });
        finalize(rows);
      } catch (e) {
        console.error("Excel parse error:", e);
        toast.error("Failed to parse Excel file");
        setCsvUploading(false);
      }
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    try {
      const newList = await createList({ name: newListName.trim() });
      setLists((prev) => [...prev, newList]);
      setNewListName("");
      setShowCreateList(false);
      toast.success("List created successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create list");
      console.error(error);
    }
  };

  const toggleListSelection = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      lists: prev.lists.includes(id)
        ? prev.lists.filter((i) => i !== id)
        : [...prev.lists, id],
    }));
  };

  const handleFilterChange = (
    type: "tag" | "category" | "campaign" | "status" | "list",
    selected: Array<{ id: string; name: string }>
  ) => {
    setSelectedItems((prev) => {
      const criteria = { ...prev.filterCriteria };
      if (type === "tag") {
        criteria.tagIds = selected.map((item) => item.id);
      } else if (type === "category") {
        criteria.categoryIds = selected.map((item) => item.id);
      } else if (type === "campaign") {
        criteria.campaignIds = selected.map((item) => item.id);
      } else if (type === "status") {
        // For status, the id is actually the value
        criteria.statuses = selected.map((item) => item.id);
      } else if (type === "list") {
        criteria.listIds = selected.map((item) => item.id);
      }
      return { ...prev, filterCriteria: criteria };
    });
  };

  const toggleFilterSelection = (
    type: "tag" | "category" | "campaign" | "status",
    id: string
  ) => {
    setSelectedItems((prev) => {
      const criteria = { ...prev.filterCriteria };
      if (type === "tag") {
        criteria.tagIds = criteria.tagIds.includes(id)
          ? criteria.tagIds.filter((i) => i !== id)
          : [...criteria.tagIds, id];
      } else if (type === "category") {
        criteria.categoryIds = criteria.categoryIds.includes(id)
          ? criteria.categoryIds.filter((i) => i !== id)
          : [...criteria.categoryIds, id];
      } else if (type === "campaign") {
        criteria.campaignIds = criteria.campaignIds.includes(id)
          ? criteria.campaignIds.filter((i) => i !== id)
          : [...criteria.campaignIds, id];
      } else if (type === "status") {
        criteria.statuses = criteria.statuses.includes(id)
          ? criteria.statuses.filter((i) => i !== id)
          : [...criteria.statuses, id];
      }
      return { ...prev, filterCriteria: criteria };
    });
  };

  const toggleContactSelection = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      contacts: prev.contacts.includes(id)
        ? prev.contacts.filter((i) => i !== id)
        : [...prev.contacts, id],
    }));
  };

  const handleCsvResultAddRecipients = () => {
    if (!csvResultModal) return;
    const note =
      csvResultModal.invalidCount > 0 || csvResultModal.duplicateCount > 0
        ? `From your file we added ${csvResultModal.readyToAdd} recipient${csvResultModal.readyToAdd !== 1 ? "s" : ""}. We skipped ${csvResultModal.invalidCount} email${csvResultModal.invalidCount !== 1 ? "s" : ""} with mistakes and ${csvResultModal.duplicateCount} duplicate${csvResultModal.duplicateCount !== 1 ? "s" : ""} to keep your list clean. This is only a basic check — full email verification happens later when you send the campaign.`
        : undefined;
    setSelectedItems((prev) => ({
      ...prev,
      csvData: csvResultModal.validRows,
      csvColumns: csvResultModal.columns,
      csvEmailColumn: csvResultModal.emailField,
      csvUploadNote: note,
    }));
    setCsvResultModal(null);
  };

  const handleApply = async () => {
    let type: "list" | "filter" | "individual" | "csv" = "individual";
    let ids: string[] = [];
    let count = 0;
    let csvData: Array<Record<string, string>> = [];
    let columns: string[] = [];
    let emailColumn = "email";
    let csvUploadNote: string | undefined;

    if (selectedItems.csvData.length > 0) {
      type = "csv";
      count = selectedItems.csvData.length;
      csvData = selectedItems.csvData;
      columns = selectedItems.csvColumns;
      emailColumn = selectedItems.csvEmailColumn;
      csvUploadNote = selectedItems.csvUploadNote;
    } else if (selectedItems.lists.length > 0) {
      type = "list";
      try {
        const result = await filterLeadsByCriteria({
          listIds: selectedItems.lists,
        });
        ids = result.data.leadIds || [];
        count = result.data.count ?? result.data.total ?? ids.length;
        ids = [...new Set(ids)];
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to resolve list recipients"
        );
        return;
      }
    } else if (
      selectedItems.filterCriteria.tagIds.length > 0 ||
      selectedItems.filterCriteria.categoryIds.length > 0 ||
      selectedItems.filterCriteria.campaignIds.length > 0 ||
      selectedItems.filterCriteria.statuses.length > 0 ||
      selectedItems.filterCriteria.listIds.length > 0
    ) {
      type = "filter";
      ids = filteredLeadIds;
      count = filteredLeadCount;
    } else if (selectedItems.contacts.length > 0) {
      type = "individual";
      ids = selectedItems.contacts;
      count = selectedItems.contacts.length;
    }

    if (count === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    onSelect({
      type,
      ids,
      count,
      csvData,
      columns,
      emailColumn,
      csvUploadNote,
    });
  };

  const getTotalSelected = () => {
    if (selectedItems.csvData.length > 0) {
      return selectedItems.csvData.length;
    }
    if (selectedItems.lists.length > 0) {
      if (listsUnionCount !== null) return listsUnionCount;
      return selectedItems.lists.reduce((sum, listId) => {
        const list = lists.find((l) => l.id === listId);
        return sum + (list?.contactCount || 0);
      }, 0);
    }
    // For filter criteria, use the filtered lead count
    const hasFilterCriteria =
      selectedItems.filterCriteria.tagIds.length > 0 ||
      selectedItems.filterCriteria.categoryIds.length > 0 ||
      selectedItems.filterCriteria.campaignIds.length > 0 ||
      selectedItems.filterCriteria.statuses.length > 0 ||
      selectedItems.filterCriteria.listIds.length > 0;
    
    if (hasFilterCriteria) {
      return filteredLeadCount;
    }
    return selectedItems.contacts.length;
  };

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.name &&
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className=" bg-bg-200 border border-brand-main/20 rounded-xl shadow-2xl flex flex-col max-h-[90vh] h-[90vh] max-w-[80vw] w-[80vw]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-brand-main/10 bg-bg-200/50">
          <div>
            <h2 className="text-xl font-semibold text-text-100">Recipients</h2>
            <p className="text-sm text-text-200 mt-1">
              The people who receive your campaign
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-300/50 rounded-lg transition-colors text-text-200 hover:text-text-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Send to Section */}
        <div className="px-6 py-4 border-b border-brand-main/10">
          <label className="block text-sm font-medium text-text-200 mb-2">
            Send to
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Select list(s), segment(s) or individual contacts"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
            />
            <ChevronDown
              size={20}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-200/60"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4  border-b border-brand-main/10 flex items-center gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("lists")}
            className={`flex items-center gap-2 px-2 py-1 text-sm rounded-lg transition whitespace-nowrap ${
              activeTab === "lists"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            <List size={16} />
            Lists
          </button>
          <button
            onClick={() => setActiveTab("filter")}
            className={`flex items-center gap-2 px-2 py-1 text-sm rounded-lg transition whitespace-nowrap ${
              activeTab === "filter"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            <Zap size={16} />
            Filter by Criteria
          </button>
          <button
            onClick={() => setActiveTab("individual")}
            className={`flex items-center gap-2 px-2 py-1 text-sm rounded-lg transition whitespace-nowrap ${
              activeTab === "individual"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            <User size={16} />
            Individual contacts
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-2 py-1 text-sm rounded-lg transition whitespace-nowrap ${
              activeTab === "upload"
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            <Upload size={16} />
            Upload CSV
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-main"></div>
            </div>
          ) : (
            <>
              {/* Lists Tab */}
              {activeTab === "lists" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-text-100">Lists</h3>
                    {!showCreateList ? (
                      <button
                        onClick={() => setShowCreateList(true)}
                        className="flex items-center gap-2 text-sm text-brand-main hover:text-brand-main/80"
                      >
                        <Plus size={16} />
                        Create list
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          placeholder="List name"
                          className="px-3 py-1.5 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleCreateList();
                            }
                          }}
                        />
                        <Button
                          onClick={handleCreateList}
                          className="px-3 py-1.5 text-sm bg-brand-main hover:bg-brand-main/90 text-white"
                        >
                          Create
                        </Button>
                        <button
                          onClick={() => {
                            setShowCreateList(false);
                            setNewListName("");
                          }}
                          className="px-3 py-1.5 text-sm text-text-200 hover:text-text-100"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  {filteredLists.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredLists.map((list) => (
                        <label
                          key={list.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-main/5 cursor-pointer border border-brand-main/10"
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.lists.includes(list.id)}
                            onChange={() => toggleListSelection(list.id)}
                            className="w-4 h-4 text-brand-main rounded focus:ring-brand-main"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text-100">
                              {list.name}
                            </p>
                            <p className={`text-xs ${
                              (list.contactCount || list.count || 0) === 0
                                ? "text-amber-400"
                                : "text-text-200"
                            }`}>
                              {list.contactCount ?? list.count ?? 0} contacts
                              {(list.contactCount ?? list.count ?? 0) === 0 && (
                                <span className="ml-1 block mt-0.5 text-text-200/80">
                                  No contacts in this list yet — add them from Leads or run a bulk upload with this list selected.
                                </span>
                              )}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-text-200/60">
                      <List size={48} className="mx-auto mb-4 opacity-40" />
                      <p>No lists found</p>
                      <p className="text-xs mt-2">
                        Create a list to organize your contacts
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Filter by Criteria Tab */}
              {activeTab === "filter" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-100 mb-2">
                      Filter by Criteria
                    </h3>
                    <p className="text-sm text-text-200 mb-6">
                      Select tags, categories, campaigns, or statuses to
                      retarget leads. All selected criteria will be combined
                      (AND logic). Available options update based on your selections.
                    </p>
                  </div>

                  {loadingFilterOptions && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-main"></div>
                      <span className="ml-2 text-text-200">Loading options...</span>
                    </div>
                  )}

                  {/* Campaigns - Show all campaigns regardless of domain */}
                  <div>
                    <CreatableSelect
                      options={campaigns.map((c) => ({
                        id: c.id,
                        name: `${c.name} (${c.count || 0} leads)`,
                      }))}
                      value={campaigns
                        .filter((c) =>
                          selectedItems.filterCriteria.campaignIds.includes(c.id)
                        )
                        .map((c) => ({
                          id: c.id,
                          name: `${c.name} (${c.count || 0} leads)`,
                        }))}
                      onChange={(selected) =>
                        handleFilterChange(
                          "campaign",
                          selected.map((s) => ({ id: s.id, name: s.name }))
                        )
                      }
                      placeholder="Select campaigns..."
                      label="Campaigns (All Domains)"
                      isMulti={true}
                      isLoading={loadingFilterOptions}
                    />
                    <p className="text-xs text-text-200/60 mt-1">
                      Select campaigns from all your domains to retarget recipients. Counts show available leads.
                    </p>
                  </div>

                  {/* Lists */}
                  <div>
                    <CreatableSelect
                      options={lists.map((l) => ({
                        id: l.id,
                        name: `${l.name} (${l.contactCount || 0} contacts)`,
                      }))}
                      value={lists
                        .filter((l) =>
                          selectedItems.filterCriteria.listIds.includes(l.id)
                        )
                        .map((l) => ({
                          id: l.id,
                          name: `${l.name} (${l.contactCount || 0} contacts)`,
                        }))}
                      onChange={(selected) =>
                        handleFilterChange(
                          "list",
                          selected.map((s) => ({ id: s.id, name: s.name }))
                        )
                      }
                      onCreateNew={async (name: string) => {
                        const newList = await createList({ name });
                        await loadData();
                        return {
                          id: newList.id,
                          name: `${newList.name} (0 contacts)`,
                        };
                      }}
                      placeholder="Select lists..."
                      label="Lists"
                      isMulti={true}
                      isLoading={loading}
                    />
                    <p className="text-xs text-text-200/60 mt-1">
                      Filter leads by lists. Lists with 0 contacts are shown but won't match any leads.
                    </p>
                  </div>

                  {/* Tags */}
                  <div>
                    <CreatableSelect
                      options={filterOptions.tags.map((t) => ({
                        id: t.id,
                        name: `${t.name} (${t.count} leads)`,
                        color: t.color,
                      }))}
                      value={filterOptions.tags
                        .filter((t) =>
                          selectedItems.filterCriteria.tagIds.includes(t.id)
                        )
                        .map((t) => ({
                          id: t.id,
                          name: `${t.name} (${t.count} leads)`,
                          color: t.color,
                        }))}
                      onChange={(selected) =>
                        handleFilterChange(
                          "tag",
                          selected.map((s) => ({ id: s.id, name: s.name }))
                        )
                      }
                      onCreateNew={async (name: string) => {
                        const newTag = await createLeadTag(name);
                        await loadFilterOptions();
                        return { id: newTag.id, name: newTag.name, color: newTag.color };
                      }}
                      placeholder="Select tags..."
                      label="Tags"
                      isMulti={true}
                      isLoading={loadingFilterOptions}
                    />
                  </div>

                  {/* Categories */}
                  <div>
                    <CreatableSelect
                      options={filterOptions.categories.map((c) => ({
                        id: c.id,
                        name: `${c.name} (${c.count} leads)`,
                        color: c.color,
                      }))}
                      value={filterOptions.categories
                        .filter((c) =>
                          selectedItems.filterCriteria.categoryIds.includes(c.id)
                        )
                        .map((c) => ({
                          id: c.id,
                          name: `${c.name} (${c.count} leads)`,
                          color: c.color,
                        }))}
                      onChange={(selected) =>
                        handleFilterChange(
                          "category",
                          selected.map((s) => ({ id: s.id, name: s.name }))
                        )
                      }
                      onCreateNew={async (name: string) => {
                        const newCategory = await createLeadCategory(name);
                        await loadFilterOptions();
                        return {
                          id: newCategory.id,
                          name: newCategory.name,
                          color: newCategory.color,
                        };
                      }}
                      placeholder="Select categories..."
                      label="Categories"
                      isMulti={true}
                      isLoading={loadingFilterOptions}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <CreatableSelect
                      options={filterOptions.statuses.map((s) => ({
                        id: s.value,
                        name: `${s.label} (${s.count} leads)`,
                      }))}
                      value={filterOptions.statuses
                        .filter((s) =>
                          selectedItems.filterCriteria.statuses.includes(s.value)
                        )
                        .map((s) => ({
                          id: s.value,
                          name: `${s.label} (${s.count} leads)`,
                        }))}
                      onChange={(selected) =>
                        handleFilterChange(
                          "status",
                          selected.map((s) => ({ id: s.id, name: s.name }))
                        )
                      }
                      placeholder="Select statuses..."
                      label="Status"
                      isMulti={true}
                      isLoading={loadingFilterOptions}
                    />
                  </div>

                  {/* Results */}
                  {filterMatchLoading && (
                    <div className="flex items-center gap-2 text-text-200 text-sm py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-main" />
                      Calculating matching recipients…
                    </div>
                  )}
                  {!filterMatchLoading &&
                    (selectedItems.filterCriteria.tagIds.length > 0 ||
                      selectedItems.filterCriteria.categoryIds.length > 0 ||
                      selectedItems.filterCriteria.campaignIds.length > 0 ||
                      selectedItems.filterCriteria.statuses.length > 0 ||
                      selectedItems.filterCriteria.listIds.length > 0) &&
                    filteredLeadCount === 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-text-200">
                        No leads match every selected criterion (all conditions
                        apply together). Try removing or changing a filter.
                      </div>
                    )}
                  {!filterMatchLoading && filteredLeadCount > 0 && (
                    <div className="bg-success/10 border-2 border-success/30 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-success" />
                        <p className="text-sm font-semibold text-success">
                          {filteredLeadCount} leads match your criteria
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Individual Contacts Tab */}
              {activeTab === "individual" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-text-100">
                      Individual contacts
                    </h3>
                    <p className="text-xs text-text-200">
                      {selectedItems.contacts.length} selected • {contactsTotal} total
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-200/60"
                    />
                    <input
                      type="text"
                      placeholder="Search by email or name..."
                      value={contactsSearchTerm}
                      onChange={(e) => {
                        setContactsSearchTerm(e.target.value);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          setContactsPage(1);
                          loadContacts(1, contactsSearchTerm || undefined);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                    {contactsSearchTerm && (
                      <button
                        onClick={() => {
                          setContactsSearchTerm("");
                          setContactsPage(1);
                          loadContacts(1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-200/60 hover:text-text-100 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {loadingContacts ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-main"></div>
                    </div>
                  ) : contacts.length > 0 ? (
                    <>
                      <div className="border border-brand-main/20 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-brand-main/5 border-b border-brand-main/20">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-text-200 w-12">
                                <input
                                  type="checkbox"
                                  checked={
                                    contacts.length > 0 &&
                                    contacts.every((c) =>
                                      selectedItems.contacts.includes(c.id)
                                    )
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const newSelections = contacts
                                        .filter((c) => !selectedItems.contacts.includes(c.id))
                                        .map((c) => c.id);
                                      setSelectedItems((prev) => ({
                                        ...prev,
                                        contacts: [...prev.contacts, ...newSelections],
                                      }));
                                    } else {
                                      const contactIds = contacts.map((c) => c.id);
                                      setSelectedItems((prev) => ({
                                        ...prev,
                                        contacts: prev.contacts.filter(
                                          (id) => !contactIds.includes(id)
                                        ),
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 text-brand-main rounded focus:ring-brand-main"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-text-200">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-text-200">
                                Name
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-main/10">
                            {contacts.map((contact) => (
                              <tr
                                key={contact.id}
                                className="hover:bg-brand-main/5 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.contacts.includes(
                                      contact.id
                                    )}
                                    onChange={() =>
                                      toggleContactSelection(contact.id)
                                    }
                                    className="w-4 h-4 text-brand-main rounded focus:ring-brand-main"
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm text-text-100">
                                  {contact.email}
                                </td>
                                <td className="px-4 py-3 text-sm text-text-200">
                                  {contact.name || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-200">
                          Page {contactsPage} of{" "}
                          {Math.ceil(contactsTotal / contactsLimit)} • Showing{" "}
                          {contacts.length} of {contactsTotal} contacts
                          {contactsSearchTerm && (
                            <span className="ml-2 text-brand-main">
                              (filtered by "{contactsSearchTerm}")
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => loadContacts(contactsPage - 1, contactsSearchTerm || undefined)}
                            disabled={contactsPage <= 1 || loadingContacts}
                            variant="outline"
                            className="px-3 py-1.5 text-sm"
                          >
                            Previous
                          </Button>
                          <Button
                            onClick={() => loadContacts(contactsPage + 1, contactsSearchTerm || undefined)}
                            disabled={
                              contactsPage >= Math.ceil(contactsTotal / contactsLimit) ||
                              loadingContacts
                            }
                            variant="outline"
                            className="px-3 py-1.5 text-sm"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-text-200/60">
                      <User size={48} className="mx-auto mb-4 opacity-40" />
                      <p>No contacts found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload CSV Tab */}
              {activeTab === "upload" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-text-100">
                    Upload CSV/Excel
                  </h3>
                  {csvUploading ? (
                    <div className="border-2 border-dashed border-brand-main/20 rounded-lg p-12 text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-main mx-auto mb-4" />
                      <p className="text-text-100 font-medium">Processing your file...</p>
                      <p className="text-xs text-text-200 mt-1">Checking for invalid and duplicate emails</p>
                    </div>
                  ) : selectedItems.csvData.length === 0 && !csvResultModal ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-brand-main/20 rounded-lg p-12 text-center cursor-pointer hover:border-brand-main/40 transition"
                    >
                      <Upload
                        size={48}
                        className="mx-auto mb-4 text-text-200/40"
                      />
                      <p className="text-text-200 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-text-200/60">
                        CSV, XLSX (Max 50MB, 5000 rows)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  ) : selectedItems.csvData.length > 0 ? (
                    <div className="bg-brand-main/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-text-100">
                          {selectedItems.csvData.length} contacts uploaded
                        </p>
                        <button
                          onClick={() => {
                            setSelectedItems((prev) => ({
                              ...prev,
                              csvData: [],
                              csvColumns: [],
                              csvEmailColumn: "email",
                              csvUploadNote: undefined,
                            }));
                            setCsvFile(null);
                          }}
                          className="text-xs text-error hover:text-error/80"
                        >
                          Remove
                        </button>
                      </div>
                      {selectedItems.csvEmailColumn && (
                        <p className="text-xs text-text-200">
                          Email column: {selectedItems.csvEmailColumn}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-main/10 bg-bg-200/50 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-text-100">
              {getTotalSelected()} recipients
            </p>
            <p className="text-xs text-text-200/60 mt-1">
              Send to as many recipients as you wish, within your plan limits.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-4 py-2 bg-brand-main/10 hover:bg-brand-main/20 text-brand-main"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={getTotalSelected() === 0}
              className="px-6 py-2 bg-brand-main hover:bg-brand-main/90 text-white disabled:opacity-50"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* CSV upload result modal: show valid / invalid / duplicate breakdown */}
      {csvResultModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-bg-200 border border-brand-main/20 rounded-xl shadow-2xl flex flex-col max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-main/10">
              <h3 className="text-lg font-semibold text-text-100">
                We&apos;ve checked your recipient list
              </h3>
              <p className="text-sm text-text-200 mt-1">
                Here&apos;s what we found in your file.
              </p>
            </div>
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <p className="text-sm text-text-200">
                We looked through your file and found some issues. We removed email addresses that are clearly wrong or repeated, so you only work with a clean list.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-brand-main/10 border border-brand-main/20 rounded-lg p-3">
                  <p className="text-xs text-text-200">Total uploaded</p>
                  <p className="text-lg font-semibold text-text-100">{csvResultModal.totalUploaded}</p>
                </div>
                <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                  <p className="text-xs text-text-200">Ready to add</p>
                  <p className="text-lg font-semibold text-success">{csvResultModal.readyToAdd}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-xs text-text-200">Duplicates skipped</p>
                  <p className="text-lg font-semibold text-amber-500">{csvResultModal.duplicateCount}</p>
                </div>
                <div className="bg-error/10 border border-error/30 rounded-lg p-3">
                  <p className="text-xs text-text-200">Invalid skipped</p>
                  <p className="text-lg font-semibold text-error">{csvResultModal.invalidCount}</p>
                </div>
              </div>
              {csvResultModal.invalidEmails.length > 0 && (
                <div className="border border-error/20 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm font-medium text-text-100 bg-error/10 flex items-center justify-between"
                  >
                    <span>Invalid emails ({csvResultModal.invalidEmails.length})</span>
                    <ChevronDown size={16} className="text-text-200" />
                  </button>
                  <div className="max-h-40 overflow-y-auto p-3 bg-bg-300/50 border-t border-error/10">
                    <p className="text-xs text-text-200 mb-2">
                      These email addresses have obvious mistakes and can&apos;t receive emails. Please fix them in your original file if needed.
                    </p>
                    <ul className="text-xs text-text-100 space-y-1 font-mono">
                      {csvResultModal.invalidEmails.map((item, i) => (
                        <li key={i}>• {item.email}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {csvResultModal.duplicateEmails.length > 0 && (
                <div className="border border-amber-500/20 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm font-medium text-text-100 bg-amber-500/10 flex items-center justify-between"
                  >
                    <span>Duplicate emails ({csvResultModal.duplicateEmails.length} unique, {csvResultModal.duplicateCount} extra skipped)</span>
                    <ChevronDown size={16} className="text-text-200" />
                  </button>
                  <div className="max-h-40 overflow-y-auto p-3 bg-bg-300/50 border-t border-amber-500/10">
                    <p className="text-xs text-text-200 mb-2">
                      These email addresses appeared more than once in your file. We kept only one copy and ignored the extra ones.
                    </p>
                    <ul className="text-xs text-text-100 space-y-1 font-mono">
                      {csvResultModal.duplicateEmails.map((d, i) => (
                        <li key={i}>• {d.email} (appears {d.count} times)</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {csvResultModal.readyToAdd > 0 && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <p className="text-sm text-text-100">
                    We will add <strong>{csvResultModal.readyToAdd}</strong> recipient{csvResultModal.readyToAdd !== 1 ? "s" : ""} to your campaign.
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-brand-main/10 bg-bg-200/50 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setCsvResultModal(null)}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCsvResultAddRecipients}
                disabled={csvResultModal.readyToAdd === 0}
                className="px-6 py-2 bg-brand-main hover:bg-brand-main/90 text-white disabled:opacity-50"
              >
                {csvResultModal.readyToAdd === 0
                  ? "No valid recipients to add"
                  : `Add ${csvResultModal.readyToAdd} recipient${csvResultModal.readyToAdd !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
