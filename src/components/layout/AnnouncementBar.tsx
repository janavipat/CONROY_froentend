const MESSAGES = [
  "Complimentary shipping on all orders",
  "Soft comfort · bold looks",
  "7-day easy returns",
  "Premium denim, made to last",
];

/** Top promotional marquee, mirroring the live site's rotating banner. */
export function AnnouncementBar() {
  // Duplicate the track so the marquee loops seamlessly.
  const track = [...MESSAGES, ...MESSAGES];
  return (
    <div className="overflow-hidden bg-accent text-white">
      <div className="flex w-max animate-marquee whitespace-nowrap py-2.5">
        {track.map((msg, i) => (
          <span
            key={i}
            className="mx-8 inline-flex items-center gap-8 text-[0.66rem] uppercase tracking-[0.22em]"
          >
            {msg}
            <span aria-hidden className="text-white/50">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
