"use client";

import { IconCheck, IconClock, IconX } from "@tabler/icons-react";

import { ReferredUser } from "@/utils/api/affiliateClient";

interface ReferralsTableProps {
  referrals: ReferredUser[];
}

export default function ReferralsTable({ referrals }: ReferralsTableProps) {
  if (referrals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-200">No referrals yet.</p>
        <p className="text-sm text-text-200 mt-2">
          Share your referral link to start earning commissions!
        </p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (referral: ReferredUser) => {
    if (!referral.hasPaid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
          <IconClock className="w-3 h-3" />
          Pending Payment
        </span>
      );
    }

    if (!referral.commission) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-500">
          Processing
        </span>
      );
    }

    const status = referral.commission.status;
    if (status === "pending") {
      const availableDate = new Date(referral.commission.availableDate);
      const daysLeft = Math.ceil(
        (availableDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-500">
          <IconClock className="w-3 h-3" />
          {daysLeft > 0 ? `${daysLeft} days left` : "Unlocking..."}
        </span>
      );
    }

    if (status === "available") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-500">
          <IconCheck className="w-3 h-3" />
          Available
        </span>
      );
    }

    if (status === "withdrawn") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-500">
          <IconCheck className="w-3 h-3" />
          Withdrawn
        </span>
      );
    }

    if (status === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-500">
          <IconX className="w-3 h-3" />
          Cancelled
        </span>
      );
    }

    return null;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-text-200 text-sm border-b border-brand-main/10">
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Signup Date</th>
            <th className="pb-3 font-medium">Commission</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((referral, index) => (
            <tr
              key={index}
              className="border-b border-brand-main/5 text-text-100"
            >
              <td className="py-4">{referral.email}</td>
              <td className="py-4 text-text-200">
                {formatDate(referral.signupDate)}
              </td>
              <td className="py-4">
                {referral.commission ? (
                  <span className="text-green-500 font-medium">
                    ₹{referral.commission.amount}
                  </span>
                ) : (
                  <span className="text-text-200">—</span>
                )}
              </td>
              <td className="py-4">{getStatusBadge(referral)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

