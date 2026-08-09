import { Loader } from "@/components/ui/Loader";
import { RouteProgress } from "@/components/ui/RouteProgress";

/**
 * Shown while a denim fit (Slim / Straight / Relaxed / Vintage) resolves.
 *
 * The root `loading.tsx` reserves 60vh for a full-size brand mark, which is far
 * too much weight for a filter change one click away in the nav. Here it is a
 * hairline bar under the header plus the small mark, so the page reads as
 * working rather than as gone.
 */
export default function Loading() {
  return (
    <>
      <RouteProgress label="Loading denim" />
      <div className="grid place-items-center py-24">
        <Loader size="sm" label="" />
      </div>
    </>
  );
}
