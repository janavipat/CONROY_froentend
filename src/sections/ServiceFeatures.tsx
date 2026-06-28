import { SERVICE_FEATURES } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { ICON_MAP } from "@/components/ui/Icons";

export function ServiceFeatures() {
  return (
    <section className="border-y border-line bg-cream py-12 lg:py-16">
      <Container>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_FEATURES.map((feature, i) => {
            const Icon = ICON_MAP[feature.icon];
            return (
              <Reveal key={feature.title} index={i} className="flex items-start gap-4">
                <Icon className="h-8 w-8 shrink-0 text-ink" />
                <div>
                  <h3 className="text-sm font-medium tracking-[0.01em] text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
