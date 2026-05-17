"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-bg min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="font-heading text-[48px] text-gold mb-2">Ошибка</h1>
        <p className="text-text2 text-[16px] font-light mb-6">
          Что-то пошло не так. Попробуйте обновить страницу.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-gold hover:bg-gold-hover text-bg font-medium px-6 py-2.5 rounded-[8px] transition-colors"
          >
            Попробовать снова
          </button>
          <Link
            href="/"
            className="border border-border text-text hover:border-gold hover:text-gold font-medium px-6 py-2.5 rounded-[8px] transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
