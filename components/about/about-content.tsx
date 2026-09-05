"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { profile } from "@/lib/profile";

export function AboutContent() {
  const { locale, t } = useLocale();
  const isJapanese = locale === "ja";

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-8 sm:py-24">
      <header className="mb-10">
        <h1 className="text-3xl leading-relaxed font-medium tracking-tight text-foreground">{profile.name}</h1>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {profile.strengths.map((strength) => <li key={strength}>{strength}</li>)}
        </ul>
      </header>
      <div className="mb-16 max-w-2xl space-y-5 text-base leading-8 text-foreground">
        {t.about.intro.map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
      </div>
      <section aria-labelledby="skills-heading" className="mb-16">
        <h2 id="skills-heading" className="mb-7 text-lg font-medium text-foreground">{isJapanese ? "できること" : "Skills"}</h2>
        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
          {profile.skills.map((group) => (
            <div key={group.name}>
              <h3 className="mb-3 text-sm font-medium text-foreground">{group.name}</h3>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {group.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="timeline-heading" className="mb-16">
        <h2 id="timeline-heading" className="mb-7 text-lg font-medium text-foreground">{isJapanese ? "これまで" : "Experience"}</h2>
        <div className="space-y-9">
          {t.about.timeline.map((entry) => (
            <div key={entry.id} className="grid gap-3 sm:grid-cols-[9rem_1fr] sm:gap-8">
              <span className="pt-1 text-sm text-muted-foreground">{entry.period}</span>
              <div>
                <h3 className="text-lg leading-7 font-medium text-foreground">{entry.organization}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{entry.role}</p>
                <p className="mt-3 text-base leading-8 text-muted-foreground">{entry.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="mb-5 text-lg font-medium text-foreground">{isJapanese ? "連絡先" : "Contact"}</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {profile.contact.map((link) => (
            <a key={link.label} href={link.href} target={link.href.startsWith("mailto:") ? undefined : "_blank"} rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"} className="text-sm text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
