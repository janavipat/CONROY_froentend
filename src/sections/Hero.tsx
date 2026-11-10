import { PhotoBanner } from "@/sections/PhotoBanner";

/**
 * The cotton campaign as the opening frame: "Made for comfort, styled for
 * you." The artwork carries its own headline, so the page's h1 is given to
 * screen readers and search engines only, rather than printed over the
 * lettering already in the photograph.
 */
export function Hero() {
  return (
    <div aria-label="CONROY featured collection" role="region">
      <h1 className="sr-only">Made for comfort. Styled for you.</h1>
      <PhotoBanner
        src="/brand/hero-comfort.jpg"
        alt="Made for comfort, styled for you — two men in CONROY cotton trousers on a grassy hill"
        href="/cotton-twill"
        label="Made for comfort, styled for you — shop the cotton collection"
        priority
      />
    </div>
  );
}
