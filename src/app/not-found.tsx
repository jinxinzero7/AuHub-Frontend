import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-bg min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="font-heading text-[72px] text-gold mb-2">404</h1>
        <p className="text-text2 text-[16px] font-light mb-6">
          Страница не найдена
        </p>
        <Link
          href="/"
          className="bg-gold hover:bg-gold-hover text-bg font-medium px-6 py-2.5 rounded-[8px] transition-colors inline-block"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
