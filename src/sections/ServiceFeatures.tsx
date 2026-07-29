import { SERVICE_FEATURES } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { ICON_MAP } from "@/components/ui/Icons";

/**
 * Service promises as four plain columns — no card surface, no border, no
 * shadow. Separation comes from a single hairline between columns on desktop
 * and from whitespace everywhere else.
 */
export function ServiceFeatures() {
  return (
    <section className="border-y border-line py-section-sm">
      <Container>
        <div className="grid gap-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {SERVICE_FEATURES.map((feature, i) => {
            const Icon = ICON_MAP[feature.icon];
            return (
              <Reveal
                key={feature.title}
                index={i}
                className="group flex flex-col items-center px-4 text-center lg:px-10 lg:not-first:border-l lg:not-first:border-line"
              >
                <Icon className="h-6 w-6 text-accent transition-colors duration-(--duration-base) group-hover:text-ink" />
                <h3 className="mt-8 font-display text-xl text-ink">{feature.title}</h3>
                <p className="mt-4 text-[0.9375rem] leading-[1.85] text-ink-soft">
                  {feature.description}
                </p>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
