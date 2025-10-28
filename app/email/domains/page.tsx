"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { deleteDomain, Domain, getDomains } from "@/utils/api/emailClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

export default function DomainsPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchDomains();
  }, [page]);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const result = await getDomains(page, limit);
      setDomains(result.data.domains);
      setTotal(result.data.pagination.total);
    } catch (error: any) {
      console.error("Error fetching domains:", error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        tokenStorage.removeTokens();
        router.push("/login");
        return;
      }

      // Handle other errors
      toast.error(error.response?.data?.message || "Failed to fetch domains");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (domainId: string) => {
    if (!confirm("Are you sure you want to delete this domain?")) return;

    try {
      setDeleting(domainId);
      await deleteDomain(domainId);
      toast.success("Domain deleted successfully");
      fetchDomains();
    } catch (error: any) {
      console.error("Error deleting domain:", error);
      toast.error(error.response?.data?.message || "Failed to delete domain");
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-100">Email Domains</h1>
            <p className="text-text-200 text-sm mt-1">
              Manage your sending domains
            </p>
          </div>
          <Link href="/email/domains/create">
            <Button className="bg-brand-main hover:bg-brand-main/80 text-text-100 px-6 py-2 rounded-lg transition">
              + Add Domain
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-200">Loading domains...</p>
            </div>
          </div>
        ) : domains?.length === 0 ? (
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-brand-main rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-text-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-100 mb-2">
              No Domains Yet
            </h3>
            <p className="text-text-200 mb-6">
              Get started by adding your first sending domain
            </p>
            <Link href="/email/domains/create">
              <Button className="bg-brand-main hover:bg-brand-main/80 text-text-100 px-6 py-2 rounded-lg transition">
                Create Your First Domain
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Domains Table */}
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-main/10 bg-brand-main/5">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Domain
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-200">
                        Created
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains?.map((domain) => (
                      <tr
                        key={domain.id}
                        className="border-b border-brand-main/10 hover:bg-brand-main/5 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-tertiary rounded-lg flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-text-100"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-text-100 font-medium">
                                {domain.domain}
                              </p>
                              <p className="text-text-200 text-xs">
                                ID: {domain.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              domain.verificationStatus
                                ? "bg-green-100 text-green-500"
                                : "bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            {domain.verificationStatus
                              ? "✓ Verified"
                              : "⏳ Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-text-200 text-sm">
                          {new Date(domain.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/email/domains/${domain.id}`}>
                              <Button className="bg-blue-200 hover:bg-blue-300 text-blue-500 text-xs px-3 py-1 rounded transition">
                                View
                              </Button>
                            </Link>
                            <Button
                              onClick={() => handleDelete(domain.id)}
                              disabled={deleting === domain.id}
                              className="bg-red-200 hover:bg-red-300 text-red-500 text-xs px-3 py-1 rounded transition disabled:opacity-50"
                            >
                              {deleting === domain.id
                                ? "Deleting..."
                                : "Delete"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="bg-brand-main/10 hover:bg-brand-main/20 text-text-100 disabled:opacity-50 px-4 py-2 rounded-lg transition"
                >
                  Previous
                </Button>
                <span className="text-text-200 text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="bg-brand-main/10 hover:bg-brand-main/20 text-text-100 disabled:opacity-50 px-4 py-2 rounded-lg transition"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
