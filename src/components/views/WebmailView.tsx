"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  api,
  WebmailFolder,
  WebmailMessageSummary,
  WebmailMessageDetail,
  SendWebmailRequest,
} from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  Inbox,
  Send,
  FileText,
  Archive,
  AlertOctagon,
  Trash2,
  PenSquare,
  RefreshCw,
  Search,
  Paperclip,
  Star,
  CornerUpLeft,
  CornerUpRight,
  ReplyAll,
  Mail,
  MailOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Plus,
  ArrowLeft,
  Clock,
  User,
} from "lucide-react";

export function WebmailView() {
  const toast = useToast();
  const [folders, setFolders] = useState<WebmailFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("inbox");
  const [messages, setMessages] = useState<WebmailMessageSummary[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageDetail, setMessageDetail] = useState<WebmailMessageDetail | null>(null);
  const [loadingFolders, setLoadingFolders] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");

  // Compose State
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>("");
  const [composeCc, setComposeCc] = useState<string>("");
  const [composeBcc, setComposeBcc] = useState<string>("");
  const [composeSubject, setComposeSubject] = useState<string>("");
  const [composeBody, setComposeBody] = useState<string>("");
  const [showCcBcc, setShowCcBcc] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [composeAttachments, setComposeAttachments] = useState<{ filename: string; contentType: string; dataB64: string; size: number }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Folders
  const loadFolders = useCallback(async () => {
    try {
      setLoadingFolders(true);
      const res = await api.getWebmailFolders();
      setFolders(res.folders || []);
      setUserEmail(res.email || "");
    } catch (err: unknown) {
      toast.error("Failed to load folders", err instanceof Error ? err.message : "Error fetching webmail folders");
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  // Fetch Messages for Current Folder
  const loadMessages = useCallback(async () => {
    try {
      setLoadingMessages(true);
      const res = await api.getWebmailMessages(currentFolder, page, 25, searchQuery);
      setMessages(res.messages || []);
      setTotalMessages(res.total || 0);
    } catch (err: unknown) {
      toast.error("Failed to load messages", err instanceof Error ? err.message : "Error fetching messages");
    } finally {
      setLoadingMessages(false);
    }
  }, [currentFolder, page, searchQuery]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Load Message Detail
  const handleSelectMessage = async (id: string) => {
    setSelectedMessageId(id);
    setMessageDetail(null);
    try {
      setLoadingDetail(true);
      const detail = await api.getWebmailMessageDetail(id, currentFolder);
      setMessageDetail(detail);
      // Mark as read locally
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
      );
      // Update unread count in current folder
      setFolders((prev) =>
        prev.map((f) => (f.id === currentFolder ? { ...f, unread_count: Math.max(0, f.unread_count - 1) } : f))
      );
    } catch (err: unknown) {
      toast.error("Failed to load email", err instanceof Error ? err.message : "Error opening email detail");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Toggle Read Status
  const handleToggleRead = async (id: string, currentRead: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newRead = !currentRead;
    try {
      await api.markWebmailMessageRead(id, newRead, currentFolder);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: newRead } : m))
      );
      if (messageDetail && messageDetail.id === id) {
        setMessageDetail({ ...messageDetail, is_read: newRead });
      }
      setFolders((prev) =>
        prev.map((f) =>
          f.id === currentFolder
            ? { ...f, unread_count: Math.max(0, f.unread_count + (newRead ? -1 : 1)) }
            : f
        )
      );
      toast.success(newRead ? "Marked as Read" : "Marked as Unread");
    } catch {
      toast.error("Failed to update read status");
    }
  };

  // Delete Message
  const handleDeleteMessage = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.deleteWebmailMessage(id, currentFolder);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessageId === id) {
        setSelectedMessageId(null);
        setMessageDetail(null);
      }
      loadFolders();
      toast.success(currentFolder === "trash" ? "Message Permanently Deleted" : "Message Moved to Trash");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      toast.error("Validation Error", "Please enter at least one recipient.");
      return;
    }

    const toList = composeTo.split(",").map((s) => s.trim()).filter(Boolean);
    const ccList = composeCc ? composeCc.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const bccList = composeBcc ? composeBcc.split(",").map((s) => s.trim()).filter(Boolean) : [];

    const payload: SendWebmailRequest = {
      to: toList,
      cc: ccList.length > 0 ? ccList : undefined,
      bcc: bccList.length > 0 ? bccList : undefined,
      subject: composeSubject.trim() || "(No Subject)",
      body_text: composeBody,
      body_html: `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #111;">${escapeHTML(
        composeBody
      ).replace(/\n/g, "<br/>")}</div>`,
      attachments: composeAttachments.map((a) => ({
        filename: a.filename,
        content_type: a.contentType,
        data_b64: a.dataB64,
      })),
    };

    try {
      setSending(true);
      await api.sendWebmailMessage(payload);
      toast.success("Email Sent Successfully", `Delivered to ${toList.join(", ")}`);
      setIsComposeOpen(false);
      resetCompose();
      loadFolders();
      if (currentFolder === "sent") {
        loadMessages();
      }
    } catch (err: unknown) {
      toast.error("Failed to send email", err instanceof Error ? err.message : "Delivery error");
    } finally {
      setSending(false);
    }
  };

  const resetCompose = () => {
    setComposeTo("");
    setComposeCc("");
    setComposeBcc("");
    setComposeSubject("");
    setComposeBody("");
    setShowCcBcc(false);
    setComposeAttachments([]);
  };

  // Reply / Forward Handlers
  const handleReply = (all: boolean = false) => {
    if (!messageDetail) return;
    const recipient = messageDetail.from || "";
    setComposeTo(recipient);
    if (all && messageDetail.cc && messageDetail.cc.length > 0) {
      setComposeCc(messageDetail.cc.join(", "));
      setShowCcBcc(true);
    }
    const sub = messageDetail.subject.startsWith("Re:") ? messageDetail.subject : `Re: ${messageDetail.subject}`;
    setComposeSubject(sub);
    const quote = `\n\n\n--- On ${new Date(messageDetail.date).toLocaleString()}, ${messageDetail.from} wrote ---\n> ${(
      messageDetail.body_text || stripHTML(messageDetail.body_html)
    )
      .split("\n")
      .join("\n> ")}`;
    setComposeBody(quote);
    setIsComposeOpen(true);
  };

  const handleForward = () => {
    if (!messageDetail) return;
    setComposeTo("");
    const sub = messageDetail.subject.startsWith("Fwd:") ? messageDetail.subject : `Fwd: ${messageDetail.subject}`;
    setComposeSubject(sub);
    const quote = `\n\n\n--- Forwarded Message ---\nFrom: ${messageDetail.from}\nDate: ${new Date(
      messageDetail.date
    ).toLocaleString()}\nSubject: ${messageDetail.subject}\nTo: ${messageDetail.to.join(", ")}\n\n${
      messageDetail.body_text || stripHTML(messageDetail.body_html)
    }`;
    setComposeBody(quote);
    setIsComposeOpen(true);
  };

  // Handle File Uploads for Attachments
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        toast.error("File Too Large", `File "${file.name}" exceeds 25MB attachment limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        setComposeAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            dataB64: base64Data,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setComposeAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFolderIcon = (iconName: string) => {
    switch (iconName) {
      case "inbox":
        return <Inbox className="w-4 h-4" />;
      case "send":
        return <Send className="w-4 h-4" />;
      case "file-text":
        return <FileText className="w-4 h-4" />;
      case "archive":
        return <Archive className="w-4 h-4" />;
      case "alert-octagon":
        return <AlertOctagon className="w-4 h-4" />;
      case "trash-2":
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const isThisYear = d.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAvatarInitials = (from: string) => {
    if (!from) return "?";
    const clean = from.replace(/<.*>/, "").trim();
    if (!clean) return from[0].toUpperCase();
    const parts = clean.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
      {/* 1. Left Folder Sidebar */}
      <div className="w-64 shrink-0 bg-zinc-50/70 border-r border-zinc-200/80 flex flex-col justify-between">
        <div className="p-4 space-y-4">
          {/* Compose Button */}
          <button
            onClick={() => {
              resetCompose();
              setIsComposeOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <PenSquare className="w-4 h-4" />
            <span>New Message</span>
          </button>

          {/* Folder Navigation */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono px-3">
              Mailbox Folders
            </span>
            <nav className="space-y-0.5 pt-1">
              {folders.map((f) => {
                const isActive = currentFolder.toLowerCase() === f.id.toLowerCase();
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setCurrentFolder(f.id);
                      setPage(1);
                      setSelectedMessageId(null);
                      setMessageDetail(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-zinc-900 text-white shadow-2xs font-semibold"
                        : "text-zinc-700 hover:bg-zinc-200/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? "text-white" : "text-zinc-500"}>
                        {getFolderIcon(f.icon)}
                      </span>
                      <span className="truncate">{f.display_name}</span>
                    </div>
                    {f.unread_count > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? "bg-white text-zinc-950" : "bg-blue-600 text-white"
                        }`}
                      >
                        {f.unread_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Account Info Footer */}
        <div className="p-4 border-t border-zinc-200/80 bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-700">
              <User className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-zinc-900 truncate">
                {userEmail.split("@")[0] || "User"}
              </div>
              <div className="text-[11px] text-zinc-500 truncate font-mono">{userEmail}</div>
            </div>
            <button
              onClick={() => {
                loadFolders();
                loadMessages();
              }}
              title="Refresh Mailbox"
              className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-200/60 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? "animate-spin text-zinc-900" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Middle Message List Column */}
      <div className={`w-96 shrink-0 border-r border-zinc-200/80 flex flex-col bg-white ${selectedMessageId ? "hidden md:flex" : "flex w-full md:w-96"}`}>
        {/* Search Header */}
        <div className="p-3 border-b border-zinc-200/80 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search sender, subject, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-100/80 border border-transparent focus:border-zinc-300 focus:bg-white rounded-xl outline-none transition-all placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono px-1">
            <span>
              {totalMessages} {totalMessages === 1 ? "email" : "emails"}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 25 >= totalMessages}
                className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Message Items Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
          {loadingMessages ? (
            <div className="p-8 text-center text-xs text-zinc-400 font-mono space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
              <span>Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400 font-sans space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-zinc-300 stroke-1" />
              <p className="font-semibold text-zinc-600">No messages in {currentFolder}</p>
              <p className="text-[11px] text-zinc-400">Incoming emails will appear here automatically.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isSelected = selectedMessageId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMessage(m.id)}
                  className={`p-3.5 transition-all cursor-pointer relative flex gap-3 select-none ${
                    isSelected
                      ? "bg-zinc-100/90 border-l-3 border-zinc-950"
                      : m.is_read
                      ? "bg-white hover:bg-zinc-50/80"
                      : "bg-blue-50/30 hover:bg-blue-50/60 font-semibold"
                  }`}
                >
                  {/* Unread Indicator */}
                  {!m.is_read && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}

                  {/* Sender Avatar */}
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-700 shrink-0 select-none">
                    {getAvatarInitials(m.from)}
                  </div>

                  {/* Message Preview Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs truncate ${!m.is_read ? "font-bold text-zinc-950" : "font-medium text-zinc-800"}`}>
                        {m.from.replace(/<.*>/, "").trim() || m.from}
                      </span>
                      <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                        {formatDate(m.date)}
                      </span>
                    </div>
                    <div className={`text-xs truncate ${!m.is_read ? "font-semibold text-zinc-900" : "text-zinc-700 font-normal"}`}>
                      {m.subject}
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 leading-relaxed font-normal">
                      {m.snippet || "(No preview text available)"}
                    </p>
                    {m.has_attachments && (
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono pt-0.5">
                        <Paperclip className="w-3 h-3 text-zinc-400" />
                        <span>Attachment</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Right Message Reader Pane */}
      <div className={`flex-1 flex flex-col bg-white overflow-hidden ${!selectedMessageId ? "hidden md:flex" : "flex w-full"}`}>
        {loadingDetail ? (
          <div className="flex-1 flex items-center justify-center text-xs text-zinc-400 font-mono space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
          </div>
        ) : !messageDetail ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3 bg-zinc-50/40">
            <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shadow-2xs">
              <Mail className="w-6 h-6 text-zinc-400 stroke-1" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-800">No Email Selected</h3>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Select an email from the message list on the left to read its full contents, download attachments, and reply.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Action Bar Header */}
            <div className="shrink-0 p-3.5 border-b border-zinc-200/80 flex items-center justify-between bg-white">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedMessageId(null)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 cursor-pointer"
                  title="Back to Message List"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReply(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
                <button
                  onClick={() => handleReply(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <ReplyAll className="w-3.5 h-3.5" />
                  <span>Reply All</span>
                </button>
                <button
                  onClick={handleForward}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <CornerUpRight className="w-3.5 h-3.5" />
                  <span>Forward</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleRead(messageDetail.id, messageDetail.is_read)}
                  className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg cursor-pointer transition-all"
                  title={messageDetail.is_read ? "Mark as Unread" : "Mark as Read"}
                >
                  {messageDetail.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDeleteMessage(messageDetail.id)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email Header Details */}
            <div className="p-6 border-b border-zinc-100 space-y-4 shrink-0 bg-white">
              <h1 className="text-lg font-bold text-zinc-950 leading-tight">
                {messageDetail.subject}
              </h1>

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                    {getAvatarInitials(messageDetail.from)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-zinc-950 flex items-center gap-2">
                      <span>{messageDetail.from}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <span>to:</span>
                      <span className="text-zinc-700 font-mono">{messageDetail.to.join(", ")}</span>
                      {messageDetail.cc && messageDetail.cc.length > 0 && (
                        <span className="text-zinc-400 text-[10px] ml-1">
                          (cc: {messageDetail.cc.join(", ")})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono text-zinc-500">
                    {new Date(messageDetail.date).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </div>

              {/* Attachments Bar */}
              {messageDetail.attachments && messageDetail.attachments.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attachments ({messageDetail.attachments.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {messageDetail.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={api.getWebmailAttachmentUrl(messageDetail.id, att.id, currentFolder)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-800 transition-all shadow-2xs group cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-800" />
                        <span className="font-medium truncate max-w-xs">{att.filename}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ({formatFileSize(att.size)})
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Email Body Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white select-text">
              {messageDetail.body_html ? (
                <div
                  className="prose prose-sm max-w-none text-zinc-900 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: messageDetail.body_html }}
                />
              ) : (
                <pre className="text-xs font-mono text-zinc-800 whitespace-pre-wrap leading-relaxed">
                  {messageDetail.body_text}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Rich Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl border border-zinc-200 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-zinc-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-semibold text-xs">
                <PenSquare className="w-4 h-4" />
                <span>New Message</span>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Compose Form */}
            <form onSubmit={handleSendMessage} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 space-y-2.5 border-b border-zinc-100 shrink-0 text-xs font-sans">
                {/* To Field */}
                <div className="flex items-center gap-2">
                  <span className="w-12 text-zinc-400 font-semibold text-right">To:</span>
                  <input
                    type="text"
                    required
                    placeholder="Recipient email address (e.g. user@example.com)"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:border-zinc-950 focus:bg-white transition-all font-mono"
                  />
                  {!showCcBcc && (
                    <button
                      type="button"
                      onClick={() => setShowCcBcc(true)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 font-semibold cursor-pointer"
                    >
                      Cc/Bcc
                    </button>
                  )}
                </div>

                {/* Optional Cc / Bcc */}
                {showCcBcc && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-zinc-400 font-semibold text-right">Cc:</span>
                      <input
                        type="text"
                        placeholder="Carbon copy recipients..."
                        value={composeCc}
                        onChange={(e) => setComposeCc(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:border-zinc-950 focus:bg-white transition-all font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-zinc-400 font-semibold text-right">Bcc:</span>
                      <input
                        type="text"
                        placeholder="Blind carbon copy recipients..."
                        value={composeBcc}
                        onChange={(e) => setComposeBcc(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:border-zinc-950 focus:bg-white transition-all font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Subject Field */}
                <div className="flex items-center gap-2">
                  <span className="w-12 text-zinc-400 font-semibold text-right">Subject:</span>
                  <input
                    type="text"
                    required
                    placeholder="Email subject..."
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:border-zinc-950 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              {/* Message Body Input */}
              <div className="flex-1 min-h-0 p-4">
                <textarea
                  required
                  placeholder="Write your email message here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full h-full resize-none outline-none text-xs text-zinc-900 font-sans leading-relaxed placeholder:text-zinc-400"
                />
              </div>

              {/* Attachments Preview Chips */}
              {composeAttachments.length > 0 && (
                <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-200 flex flex-wrap gap-2 shrink-0">
                  {composeAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2.5 py-1 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 shadow-2xs"
                    >
                      <Paperclip className="w-3 h-3 text-zinc-400" />
                      <span className="truncate max-w-[150px]">{att.filename}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ({formatFileSize(att.size)})
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-zinc-400 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 shadow-2xs transition-all cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach Files</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-1.5 px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? "Sending..." : "Send Message"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHTML(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}
