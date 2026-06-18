import type { Metadata } from "next";
import AdminUserProfileClient from "@/components/AdminUserProfileClient";

export const metadata: Metadata = {
  title: "Профиль пользователя | AuHub Admin",
};

export default async function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminUserProfileClient key={id} userId={id} />;
}
