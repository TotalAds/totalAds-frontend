"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  EnvelopeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";

interface WarmupPair {
  id: string;
  senderEmail: string;
  receiverEmail: string;
  status: string;
  sendAt: string;
  sentAt?: string;
  repliedAt?: string;
  replyCount: number;
  maxReplies: number;
  emailStrategy: string;
}

export default function WarmupPairsPage() {
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState<WarmupPair[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPairs();
  }, [filter]);

  const loadPairs = async () => {
    try {
      if (!loading) setRefreshing(true);
      
      const url = filter === "all" 
        ? "/api/warmup/pairs?limit=50"
        : `/api/warmup/pairs?status=${filter}&limit=50`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPairs(data.data?.pairs || []);
      }
    } catch (error) {
      console.error("Failed to load pairs:", error);
      toast.error("Failed to load warmup pairs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-500/20 text-green-400";
      case "delivered":
        return "bg-blue-500/20 text-blue-400";
      case "scheduled":
        return "bg-yellow-500/20 text-yellow-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      case "replied":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "scheduled":
        return <ClockIcon className="w-4 h-4" />;
      case "failed":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <EnvelopeIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-200">Loading warmup pairs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/email/warmup"
          className="p-2 hover:bg-brand-main/10 rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-text-200" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-100">Warmup Pairs</h1>
          <p className="text-text-200 text-sm">Monitor active email warmup conversations</p>
        </div>
        <button
          onClick={loadPairs}
          disabled={refreshing}
          className="p-2 bg-brand-main/20 hover:bg-brand-main/30 rounded-xl transition-all"
        >
          <ArrowPathIcon className={`w-5 h-5 text-brand-main ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "scheduled", "sent", "delivered", "replied", "failed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === status
                ? "bg-brand-main text-white"
                : "bg-brand-main/10 text-text-200 hover:bg-brand-main/20"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Pairs List */}
      {pairs.length > 0 ? (
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-200/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">From</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">To</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Strategy</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Replies</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-text-200 uppercase">Scheduled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-main/10">
                {pairs.map((pair) => (
                  <tr key={pair.id} className="hover:bg-brand-main/5">
                    <td className="px-6 py-4 text-text-100">{pair.senderEmail}</td>
                    <td className="px-6 py-4 text-text-100">{pair.receiverEmail}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadge(pair.status)}`}>
                        {getStatusIcon(pair.status)}
                        {pair.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-200 text-sm">{pair.emailStrategy || "N/A"}</td>
                    <td className="px-6 py-4 text-text-200">
                      {pair.replyCount}/{pair.maxReplies}
                    </td>
                    <td className="px-6 py-4 text-text-300 text-sm">
                      {pair.sendAt ? new Date(pair.sendAt).toLocaleString() : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
          <EnvelopeIcon className="w-16 h-16 text-text-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-100 mb-2">No Pairs Found</h3>
          <p className="text-text-200 mb-6">
            {filter === "all"
              ? "No warmup pairs have been created yet. Add accounts to start warming up."
              : `No pairs with status "${filter}" found.`}
          </p>
          <Link
            href="/email/warmup/accounts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-main hover:bg-brand-main/90 text-white font-medium rounded-xl transition-all"
          >
            Manage Accounts
          </Link>
        </div>
      )}
    </div>
  );
}
