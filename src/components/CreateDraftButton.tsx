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
      className="inline-flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-[8px] border-none bg-gold text-[#FFF8E8] hover:bg-gold-hover transition-colors"
    >
      <Plus className="w-4 h-4" />
      Создать лот
    </Link>
  );
}
