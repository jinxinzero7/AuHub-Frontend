import type { Metadata } from "next";
import SellerProfileClient from "@/components/SellerProfileClient";

export const metadata: Metadata = {
  title: "Профиль продавца | AuHub",
  description: "Рейтинг, отзывы и показатели надёжности продавца на AuHub.",
};

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SellerProfileClient sellerId={id} />;
}
