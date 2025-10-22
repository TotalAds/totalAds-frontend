"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import JobDetail from "@/components/lead-enhancement/JobDetail";

export default function JobDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  if (!id) return <div className="p-6">Invalid job id</div>;
  return (
    <div className="p-6">
      <JobDetail jobId={id} />
    </div>
  );
}

