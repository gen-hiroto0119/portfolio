import { DesignColorsSection } from "@/components/design/design-colors";
import { DesignComponentsSection } from "@/components/design/design-components";
import { DesignMotionSection } from "@/components/design/design-motion";
import { DesignSpacingSection } from "@/components/design/design-spacing";
import { DesignTypographySection } from "@/components/design/design-typography";

export function DesignPageContent() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 pb-28 sm:px-8">
      <DesignColorsSection />
      <DesignTypographySection />
      <DesignSpacingSection />
      <DesignMotionSection />
      <DesignComponentsSection />
      <p className="border-t border-border pt-6 text-xs leading-6 text-muted-foreground">
        色や文字サイズは、ほかのページと同じ設定を使っています。
      </p>
    </div>
  );
}
