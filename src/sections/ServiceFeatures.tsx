import { SERVICE_FEATURES } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { ICON_MAP } from "@/components/ui/Icons";

export function ServiceFeatures() {
  return (
    <section className="border-y border-line bg-cream py-16 lg:py-20">
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_FEATURES.map((feature, i) => {
            const Icon = ICON_MAP[feature.icon];
            return (
              <Reveal
                key={feature.title}
                index={i}
                className="group flex flex-col items-center rounded-media border border-line bg-white p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ink/20 hover:shadow-lg"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-sage text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-[0.95rem] font-medium tracking-[0.01em] text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
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
