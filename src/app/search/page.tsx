import { fetchAllProducts } from "@/services/catalog";
import { SearchExperience } from "@/components/search/SearchExperience";

/**
 * Search reads the live catalogue on the server, exactly as the wishlist and
 * collection pages do, and hands it to the client component that filters it as
 * the visitor types. It previously imported the bundled four-product sample.
 */
export default async function SearchPage() {
  const products = await fetchAllProducts();
  return <SearchExperience products={products} />;
}
