import { BrandLoader } from "@/components/admin/ui";

/**
 * Loading UI for every admin route.
 *
 * Sits inside the admin layout, so the sidebar and top bar stay put and only
 * the working area swaps — the chrome never flashes. Uses the same branded
 * loader the dashboard shows while its own data arrives, so a route change and
 * a data fetch look like one continuous state rather than two different ones.
 */
export default function AdminLoading() {
  return <BrandLoader />;
}
