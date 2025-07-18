import React from "react";

import ApiTokenManager from "@/components/tokens/ApiTokenManager";

export const metadata = {
  title: "API Token Management | Leadsnipper",
  description: "Manage your API tokens for Leadsnipper API access",
};

export default function ApiTokensPage() {
  return <ApiTokenManager />;
}
