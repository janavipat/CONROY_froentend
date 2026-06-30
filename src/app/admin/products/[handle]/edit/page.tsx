import { EditProduct } from "@/components/admin/EditProduct";

export default async function EditProductPage(props: PageProps<"/admin/products/[handle]/edit">) {
  const { handle } = await props.params;
  return <EditProduct handle={handle} />;
}
