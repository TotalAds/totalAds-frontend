"use client";
import React from "react";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthContext";
import { ScraperProvider } from "@/context/ScraperContext";
import { TokenProvider } from "@/context/TokenContext";

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <TokenProvider>
        <ScraperProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(15, 23, 42, 0.95)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </ScraperProvider>
      </TokenProvider>
    </AuthProvider>
  );
};

export default Provider;
