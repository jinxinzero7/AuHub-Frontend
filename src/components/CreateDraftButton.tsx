"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";

export default function CreateDraftButton() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <Link
      href="/lots/create"
      className="inline-flex items-center justify-center gap-2 text-[14px] font-medium px-4 py-2.5 rounded-[8px] border border-border bg-surface text-text hover:border-gold hover:text-gold transition-colors"
    >
      <Plus className="w-4 h-4" />
      Создать лот
    </Link>
  );
}
