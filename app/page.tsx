import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { AboutSection } from "@/components/home/about-section";
import { FeaturedWorks } from "@/components/home/featured-works";
import { Hero } from "@/components/home/hero";
import { WritingSection } from "@/components/home/writing-section";
import { getAllWorks } from "@/app/works/_lib/get-works";
import { getAllPosts } from "@/lib/content";
import { maxWidth, spacing } from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  sections: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
    paddingBlock: spacing.section,
    gap: spacing.section,
  },
});

export default async function Home() {
  const [works, posts] = await Promise.all([getAllWorks(), getAllPosts()]);

  return (
    <div
      {...stylex.props(
        x.display.flex,
        x.flexDirection.column,
        x.width["100%"],
      )}
    >
      <Hero />
      <div
        {...stylex.props(
          x.width["100%"],
          x.display.flex,
          x.flexDirection.column,
          styles.sections,
        )}
      >
        <AboutSection />
        <FeaturedWorks works={works} />
        <WritingSection posts={posts} />
      </div>
    </div>
  );
}
