import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-24 text-center">
      <p className="eyebrow text-stone">Error 404</p>
      <h1 className="font-display text-5xl text-ink sm:text-6xl">Page not found</h1>
      <p className="max-w-md text-ink-soft">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to
        the collection.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        <Button href="/">Back home</Button>
        <Button href="/collections/all" variant="outline">
          Shop all
        </Button>
      </div>
    </Container>
  );
}
