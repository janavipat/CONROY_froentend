import { CustomerDetail } from "@/components/admin/CustomerDetail";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  return <CustomerDetail phone={decodeURIComponent(phone)} />;
}
