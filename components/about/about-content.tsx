"use client";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { useLocale } from "@/components/i18n/locale-provider";
import { BorderGlow } from "@/components/visuals/border-glow";
import { DecryptedSubtitle, DecryptedTextView } from "@/components/visuals/decrypted-text";
import { profile } from "@/lib/profile";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  maxWidth,
  motion,
  radius,
  spacing,
} from "@/lib/theme/tokens.stylex";

const SKILL_BORDER_RADIUS = Number.parseInt(radius.sm, 10);

const styles = stylex.create({
  page: {
    paddingBottom: spacing.section,
  },
  hero: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingBlock: spacing.section,
    paddingInline: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.tight,
    color: colors.fg,
    marginBottom: spacing.lg,
  },
  strengths: {
    gap: spacing.xs,
  },
  strengthTag: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.xs,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  intro: {
    maxWidth: maxWidth.content,
    marginInline: "auto",
    paddingInline: spacing.lg,
    marginBottom: spacing.xxl,
  },
  paragraph: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    color: colors.fg,
    marginBottom: spacing.md,
    ":last-child": {
      marginBottom: 0,
    },
  },
  section: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  skillsGrid: {
    gap: spacing.lg,
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
    },
  },
  skillGroup: {
    gap: spacing.sm,
    padding: spacing.lg,
    height: "100%",
  },
  skillGlowShell: {
    height: "100%",
    width: "100%",
  },
  skillGroupName: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  skillList: {
    gap: spacing.xs,
  },
  skillItem: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fg,
    lineHeight: lineHeight.snug,
  },
  timeline: {
    gap: 0,
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    borderLeftColor: colors.border,
    marginLeft: spacing.xs,
  },
  timelineItem: {
    gap: spacing.lg,
    paddingLeft: spacing.lg,
    paddingBottom: spacing.xl,
    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
      gap: spacing.sm,
    },
  },
  marker: {
    backgroundColor: colors.accent,
  },
  period: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fgMuted,
    lineHeight: lineHeight.snug,
  },
  timelineContent: {
    gap: spacing.xs,
  },
  organization: {
    fontFamily: fonts.display,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    color: colors.fg,
  },
  role: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fgMuted,
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    color: colors.fgMuted,
    marginTop: spacing.xs,
  },
  contactLinks: {
    gap: spacing.lg,
  },
  contactLink: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
    color: colors.accent,
    transitionProperty: "opacity",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      opacity: 0.8,
    },
  },
});

export function AboutContent() {
  const { t } = useLocale();

  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.hero, x.width["100%"])}>
        <p {...stylex.props(styles.label, x.textTransform.uppercase)}>About</p>
        <h1 {...stylex.props(styles.title)}>
          <DecryptedTextView
            text={profile.name}
            revealDirection="center"
            speed={32}
          />
        </h1>
        <div
          {...stylex.props(styles.strengths, x.display.flex, x.flexWrap.wrap)}
        >
          {profile.strengths.map((strength) => (
            <span key={strength} {...stylex.props(styles.strengthTag)}>
              {strength}
            </span>
          ))}
        </div>
      </header>

      <div {...stylex.props(styles.intro, x.width["100%"])}>
        {t.about.intro.map((paragraph, index) => (
          <p key={paragraph.slice(0, 24)} {...stylex.props(styles.paragraph)}>
            <DecryptedSubtitle
              text={paragraph}
              viewDelay={820 + index * 680}
            />
          </p>
        ))}
      </div>

      <section
        aria-labelledby="skills-heading"
        {...stylex.props(styles.section, x.width["100%"])}
      >
        <h2
          id="skills-heading"
          {...stylex.props(styles.sectionLabel, x.textTransform.uppercase)}
        >
          <DecryptedTextView text="Skills" />
        </h2>
        <div
          {...stylex.props(
            styles.skillsGrid,
            x.display.grid,
            x.gridTemplateColumns["repeat(3, 1fr)"],
          )}
        >
          {profile.skills.map((group) => (
            <div key={group.name} {...stylex.props(styles.skillGlowShell)}>
              <BorderGlow borderRadius={SKILL_BORDER_RADIUS} fill>
                <div
                  {...stylex.props(
                    styles.skillGroup,
                    x.display.flex,
                    x.flexDirection.column,
                  )}
                >
                  <span
                    {...stylex.props(
                      styles.skillGroupName,
                      x.textTransform.uppercase,
                    )}
                  >
                    {group.name}
                  </span>
                  <ul
                    {...stylex.props(
                      styles.skillList,
                      x.listStyle.none,
                      x.margin._0,
                      x.padding._0,
                      x.display.flex,
                      x.flexDirection.column,
                    )}
                  >
                    {group.items.map((item) => (
                      <li key={item} {...stylex.props(styles.skillItem)}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </BorderGlow>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="timeline-heading"
        {...stylex.props(styles.section, x.width["100%"])}
      >
        <h2
          id="timeline-heading"
          {...stylex.props(styles.sectionLabel, x.textTransform.uppercase)}
        >
          <DecryptedTextView text="Timeline" />
        </h2>
        <div
          {...stylex.props(
            styles.timeline,
            x.display.flex,
            x.flexDirection.column,
            x.gap._0,
          )}
        >
          {t.about.timeline.map((entry) => (
            <div
              key={entry.id}
              {...stylex.props(
                styles.timelineItem,
                x.display.grid,
                x.gridTemplateColumns["10rem 1fr"],
                x.position.relative,
              )}
            >
              <span
                {...stylex.props(
                  styles.marker,
                  x.position.absolute,
                  x.left["-4px"],
                  x.top["0.35rem"],
                  x.width._7px,
                  x.height._7px,
                )}
                aria-hidden="true"
              />
              <span {...stylex.props(styles.period)}>{entry.period}</span>
              <div
                {...stylex.props(
                  styles.timelineContent,
                  x.display.flex,
                  x.flexDirection.column,
                )}
              >
                <span {...stylex.props(styles.organization)}>
                  {entry.organization}
                </span>
                <span {...stylex.props(styles.role)}>{entry.role}</span>
                <p {...stylex.props(styles.summary)}>{entry.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="contact-heading"
        {...stylex.props(styles.section, x.width["100%"])}
      >
        <h2
          id="contact-heading"
          {...stylex.props(styles.sectionLabel, x.textTransform.uppercase)}
        >
          <DecryptedTextView text="Contact" />
        </h2>
        <div
          {...stylex.props(
            styles.contactLinks,
            x.display.flex,
            x.flexWrap.wrap,
          )}
        >
          {profile.contact.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={
                link.href.startsWith("mailto:")
                  ? undefined
                  : "noopener noreferrer"
              }
              {...stylex.props(styles.contactLink, x.textDecoration.none)}
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
