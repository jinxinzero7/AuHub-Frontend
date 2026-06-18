import Header from "@/components/Header";
import { LoadingState } from "@/components/UiState";

export default function SellerProfileLoading() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-bg">
        <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-8">
          <LoadingState label="Загружаем профиль продавца..." />
        </div>
      </main>
    </>
  );
}
