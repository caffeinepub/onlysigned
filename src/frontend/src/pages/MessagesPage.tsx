import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, Send, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Message as BackendMessage } from "../backend-types";
import ConnectWall from "../components/ConnectWall";
import { useAuth } from "../hooks/useAuth";
import {
  useMarkMessageRead,
  useMessages,
  useMyContacts,
  usePublicProfile,
  useSendMessage,
} from "../hooks/useQueries";
import { cn } from "../lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: bigint): string {
  const date = new Date(Number(ts) / 1_000_000);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Contact List Item ────────────────────────────────────────────────────────

function ContactListItem({
  principal,
  isSelected,
  myPrincipal,
  onClick,
}: {
  principal: string;
  isSelected: boolean;
  myPrincipal: string;
  onClick: () => void;
}) {
  const { data: profile } = usePublicProfile(principal);
  const { data: messages } = useMessages(principal);

  const msgs = (messages as BackendMessage[] | undefined) ?? [];
  const unread = msgs.filter(
    (m) => m.fromPrincipal.toString() !== myPrincipal && !m.readAt,
  ).length;
  const lastMsg = msgs[msgs.length - 1];
  const initials = profile?.displayName?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50 last:border-0 min-h-[60px]",
        isSelected ? "bg-accent/10" : "hover:bg-muted/30",
      )}
      data-ocid="contact-list-item"
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10 border border-border/50">
          <AvatarImage src={profile?.profilePhoto} alt={profile?.displayName} />
          <AvatarFallback className="bg-accent/10 text-accent font-bold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent rounded-full text-[10px] text-accent-foreground flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "font-medium text-sm truncate",
              isSelected ? "text-accent" : "text-foreground",
            )}
          >
            {profile?.displayName ?? "Loading…"}
          </span>
          {lastMsg && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {formatTime(lastMsg.sentAt)}
            </span>
          )}
        </div>
        {lastMsg ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {lastMsg.fromPrincipal.toString() === myPrincipal ? "You: " : ""}
            {lastMsg.content}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            No messages yet
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Conversation View ────────────────────────────────────────────────────────

function ConversationView({
  contactPrincipal,
  myPrincipal,
  onBack,
}: {
  contactPrincipal: string;
  myPrincipal: string;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMsgMutation = useSendMessage();
  const markRead = useMarkMessageRead();

  const { data: contactProfile } = usePublicProfile(contactPrincipal);
  const { data: messagesRaw, refetch } = useMessages(contactPrincipal);
  const messages = (messagesRaw as BackendMessage[] | undefined) ?? [];

  // Poll every 10s for real-time feel
  useEffect(() => {
    const id = setInterval(() => {
      refetch();
    }, 10_000);
    return () => clearInterval(id);
  }, [refetch]);

  // Scroll to bottom when new messages arrive
  const prevCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevCount.current) {
      prevCount.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Mark incoming messages as read
  useEffect(() => {
    for (const m of messages) {
      if (m.fromPrincipal.toString() !== myPrincipal && !m.readAt) {
        markRead.mutate(m.id);
      }
    }
  }, [messages, myPrincipal, markRead]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    sendMsgMutation.mutate(
      { to: contactPrincipal, content },
      {
        onError: () => toast.error("Failed to send message"),
        onSuccess: () => refetch(),
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const initials =
    contactProfile?.displayName?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50 flex-shrink-0 min-h-[60px]">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden flex-shrink-0 min-h-[44px] min-w-[44px]"
          onClick={onBack}
          aria-label="Back to contacts"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9 border border-border/50 flex-shrink-0">
          <AvatarImage
            src={contactProfile?.profilePhoto}
            alt={contactProfile?.displayName}
          />
          <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {contactProfile?.displayName ?? "Loading…"}
          </p>
          {contactProfile?.isVerified && (
            <p className="text-xs text-accent">Verified</p>
          )}
        </div>
        <div className="ml-auto flex-shrink-0">
          <Badge
            variant="outline"
            className="text-[10px] border-border/40 text-muted-foreground"
          >
            {messages.length} msgs
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
        data-ocid="messages-list"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="font-semibold text-foreground">
                Start the conversation
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Say hello to {contactProfile?.displayName ?? "your contact"}!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.fromPrincipal.toString() === myPrincipal;
            return (
              <div
                key={msg.id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
                data-ocid="message-bubble"
              >
                <div
                  className={cn(
                    "max-w-[78%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    isMine
                      ? "bg-accent text-accent-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm",
                  )}
                >
                  <p className="break-words">{msg.content}</p>
                  <div
                    className={cn(
                      "flex items-center gap-1 mt-1",
                      isMine ? "justify-end" : "justify-start",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px]",
                        isMine
                          ? "text-accent-foreground/60"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatTime(msg.sentAt)}
                    </span>
                    {isMine && msg.readAt && (
                      <span className="text-[10px] text-accent-foreground/60">
                        ✓✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/50 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-background border-border focus:border-accent min-h-[44px] sm:min-h-[36px]"
            data-ocid="message-input"
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sendMsgMutation.isPending}
            className="bg-accent text-accent-foreground hover:bg-accent/80 flex-shrink-0 min-h-[44px] sm:min-h-[36px] min-w-[44px] sm:min-w-[36px]"
            aria-label="Send message"
            data-ocid="send-message-btn"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { isAuthenticated, principal } = useAuth();
  const myPrincipal = principal?.toString() ?? "";

  // contacts returns string[] (principal strings)
  const { data: contactPrincipals, isLoading: contactsLoading } =
    useMyContacts();
  const contacts: string[] = contactPrincipals ?? [];

  const [selectedPrincipal, setSelectedPrincipal] = useState<string | null>(
    null,
  );

  if (!isAuthenticated) {
    return (
      <ConnectWall message="Connect your wallet to access private messages." />
    );
  }

  return (
    <div className="max-w-5xl mx-auto" data-ocid="messages-page">
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex h-[calc(100vh-10rem)] min-h-[480px]">
        {/* Contacts panel */}
        <div
          className={cn(
            "flex-shrink-0 w-full md:w-72 border-r border-border flex flex-col",
            selectedPrincipal ? "hidden md:flex" : "flex",
          )}
          data-ocid="contacts-sidebar"
        >
          <div className="p-4 border-b border-border bg-card/50 flex-shrink-0">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              Messages
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {contactsLoading ? (
              <div className="p-2 space-y-2">
                {["a", "b", "c", "d", "e"].map((k) => (
                  <div key={k} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center"
                data-ocid="messages-empty"
              >
                <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    No contacts yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add contacts to start private conversations
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-accent/30 text-accent hover:bg-accent/10"
                >
                  <Link to="/contacts">
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Add Contacts
                  </Link>
                </Button>
              </div>
            ) : (
              contacts.map((p) => (
                <ContactListItem
                  key={p}
                  principal={p}
                  isSelected={selectedPrincipal === p}
                  myPrincipal={myPrincipal}
                  onClick={() => setSelectedPrincipal(p)}
                />
              ))
            )}
          </div>
        </div>

        {/* Conversation panel */}
        <div
          className={cn(
            "flex-1 min-w-0 flex flex-col",
            !selectedPrincipal ? "hidden md:flex" : "flex",
          )}
        >
          {selectedPrincipal ? (
            <ConversationView
              contactPrincipal={selectedPrincipal}
              myPrincipal={myPrincipal}
              onBack={() => setSelectedPrincipal(null)}
            />
          ) : (
            <div
              className="flex flex-col items-center justify-center h-full gap-4 text-center px-6"
              data-ocid="no-conversation-selected"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                <MessageSquare className="h-7 w-7 text-accent" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">
                  Select a contact
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a contact from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
