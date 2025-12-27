"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  getConversations,
  WhatsAppConversation,
} from "@/utils/api/whatsappClient";
import { tokenStorage } from "@/utils/auth/tokenStorage";

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<WhatsAppConversation | null>(null);

  // TODO: Get phoneNumberId from user settings
  const phoneNumberId = "default";

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const result = await getConversations(phoneNumberId, 1, 50, "open");
      setConversations(result.data);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);

      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        tokenStorage.removeTokens();
        router.push("/login");
        return;
      }

      toast.error("Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="backdrop-blur-xl bg-brand-main/5 border-b border-brand-main/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-text-100">WhatsApp Chat</h1>
          <p className="text-text-200 text-sm mt-1">
            Manage your WhatsApp conversations
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-4">
              <h2 className="text-lg font-semibold text-text-100 mb-4">
                Conversations
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-brand-main border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-text-200 text-sm text-center py-8">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedConversation?.id === conversation.id
                          ? "bg-brand-main/20"
                          : "bg-brand-main/5 hover:bg-brand-main/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-text-100">
                          {conversation.contactPhoneNumber}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-brand-main text-white text-xs px-2 py-1 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-200">
                        {new Date(conversation.lastMessageAt).toLocaleString()}
                      </p>
                      {conversation.isWithin24HourWindow && (
                        <span className="text-xs text-green-400 mt-1 block">
                          Active window
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat View */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-6">
                <div className="mb-4 pb-4 border-b border-brand-main/20">
                  <h3 className="text-lg font-semibold text-text-100">
                    {selectedConversation.contactPhoneNumber}
                  </h3>
                  <p className="text-sm text-text-200">
                    {selectedConversation.conversationType === "user_initiated"
                      ? "User initiated"
                      : "Business initiated"}
                  </p>
                </div>
                <div className="h-96 overflow-y-auto mb-4">
                  <p className="text-text-200 text-sm text-center py-8">
                    Messages will appear here
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-bg-200 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                  />
                  <button className="px-6 py-2 bg-brand-main hover:bg-brand-main/80 text-white rounded-lg transition">
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-12 text-center">
                <p className="text-text-200">
                  Select a conversation to start chatting
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

