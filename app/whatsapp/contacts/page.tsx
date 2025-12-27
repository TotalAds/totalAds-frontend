"use client";

import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import AGGridWrapper from "@/components/common/AGGridWrapper";
import { Button } from "@/components/ui/button";
import {
  deleteContact,
  getContacts,
  optOutContact,
  WhatsAppContact,
} from "@/utils/api/whatsappClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;

  useEffect(() => {
    fetchContacts();
  }, [page, searchTerm]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const result = await getContacts(page, limit, searchTerm);
      setContacts(result.data);
      setTotal(result.total);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);

      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        tokenStorage.removeTokens();
        router.push("/login");
        return;
      }

      toast.error("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      await deleteContact(contactId);
      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  const handleOptOut = async (contactId: string) => {
    if (!confirm("Are you sure you want to opt-out this contact?")) return;

    try {
      await optOutContact(contactId);
      toast.success("Contact opted out successfully");
      fetchContacts();
    } catch (error: any) {
      console.error("Error opting out contact:", error);
      toast.error("Failed to opt-out contact");
    }
  };

  const ActionsCellRenderer = useCallback(
    (params: ICellRendererParams<WhatsAppContact>) => {
      const contact = params.data;
      if (!contact) return null;

      return (
        <div className="flex justify-end gap-2 py-1">
          {!contact.optOut && (
            <Button
              onClick={() => handleOptOut(contact.id)}
              className="bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs px-3 py-1.5 rounded-md font-medium transition border border-amber-200"
            >
              Opt Out
            </Button>
          )}
          <Button
            onClick={() => handleDelete(contact.id)}
            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-md font-medium transition border border-red-200"
          >
            Delete
          </Button>
        </div>
      );
    },
    []
  );

  const columnDefs = useMemo<ColDef<WhatsAppContact>[]>(
    () => [
      {
        headerName: "Phone Number",
        field: "phoneNumber",
        flex: 1.5,
        minWidth: 150,
        cellClass: "text-slate-800 font-medium",
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Name",
        field: "name",
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) => params.value || "-",
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Status",
        field: "optOut",
        flex: 1,
        minWidth: 100,
        valueFormatter: (params) => (params.value ? "Opted Out" : "Active"),
        cellClass: (params) =>
          params.value ? "text-red-600" : "text-green-600",
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Actions",
        flex: 1.5,
        minWidth: 200,
        cellRenderer: ActionsCellRenderer,
        sortable: false,
        filter: false,
      },
    ],
    [ActionsCellRenderer]
  );

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-100">
              WhatsApp Contacts
            </h1>
            <p className="text-text-200 text-sm mt-1">
              Manage your WhatsApp contacts
            </p>
          </div>
          <Button
            onClick={() => router.push("/whatsapp/contacts/create")}
            className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition"
          >
            + Add Contact
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by phone number or name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full max-w-md px-4 py-2 bg-brand-main/10 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand-main"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-200">Loading contacts...</p>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-brand-main rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              No Contacts Yet
            </h3>
            <p className="text-text-200 mb-6">
              Add your first WhatsApp contact to get started
            </p>
            <Button
              onClick={() => router.push("/whatsapp/contacts/create")}
              className="bg-brand-main hover:bg-brand-main/80 text-white px-6 py-2 rounded-lg transition"
            >
              Add Your First Contact
            </Button>
          </div>
        ) : (
          <AGGridWrapper<WhatsAppContact>
            rowData={contacts}
            columnDefs={columnDefs}
            loading={loading}
            height={500}
            emptyMessage="No contacts found"
            getRowId={(params) => params.data.id}
            showPagination={true}
            serverSidePagination={true}
            totalRows={total}
            currentPage={page}
            pageSize={limit}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </main>
    </div>
  );
}

