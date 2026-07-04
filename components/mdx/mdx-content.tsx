import type { CompileOptions } from "@mdx-js/mdx";
import type { ComponentPropsWithoutRef } from "react";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  motion,
  radius,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  h2: {
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.snug,
    color: colors.fg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  h3: {
    fontFamily: fonts.display,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    color: colors.fg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    color: colors.fg,
    marginBottom: spacing.md,
  },
  link: {
    color: colors.accent,
    textUnderlineOffset: "0.15em",
    transitionProperty: "opacity",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      opacity: 0.8,
    },
  },
  list: {
    marginBottom: spacing.md,
    paddingLeft: spacing.lg,
    color: colors.fg,
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
  },
  listItem: {
    marginBottom: spacing.xs,
  },
  blockquote: {
    marginBlock: spacing.lg,
    paddingLeft: spacing.md,
    borderLeftWidth: "2px",
    borderLeftStyle: "solid",
    borderLeftColor: colors.border,
    color: colors.fgMuted,
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
  },
  hr: {
    border: "none",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
    marginBlock: spacing.xl,
  },
  inlineCode: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.sm,
    paddingInline: spacing.xs,
    paddingBlock: spacing.xxs,
  },
  pre: {
    marginBlock: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.bgSubtle,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.md,
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.snug,
  },
  codeBlockFigure: {
    marginBlock: spacing.lg,
  },
  codeBlockPre: {
    margin: 0,
    padding: spacing.lg,
    backgroundColor: colors.bgSubtle,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.md,
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.snug,
  },
  codeBlockCode: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    backgroundColor: "transparent",
  },
  image: {
    marginBlock: spacing.lg,
    borderRadius: radius.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
  },
  tableWrapper: {
    marginBlock: spacing.lg,
  },
  table: {
    borderCollapse: "collapse",
    fontSize: fontSize.sm,
    lineHeight: lineHeight.snug,
  },
  tableHeadCell: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    padding: spacing.sm,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    color: colors.fgMuted,
    backgroundColor: colors.bgSubtle,
  },
  tableCell: {
    padding: spacing.sm,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    color: colors.fg,
    verticalAlign: "top",
  },
});

function H2({
  children,
  id,
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2 id={id} {...stylex.props(styles.h2)} {...props}>
      {children}
    </h2>
  );
}

function H3({
  children,
  id,
  ...props
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3 id={id} {...stylex.props(styles.h3)} {...props}>
      {children}
    </h3>
  );
}

function Paragraph({ children, ...props }: ComponentPropsWithoutRef<"p">) {
  return (
    <p {...stylex.props(styles.paragraph)} {...props}>
      {children}
    </p>
  );
}

function Anchor({ children, href, ...props }: ComponentPropsWithoutRef<"a">) {
  return (
    <a
      href={href}
      {...stylex.props(styles.link, x.textDecoration.underline)}
      {...props}
    >
      {children}
    </a>
  );
}

function UnorderedList({
  children,
  ...props
}: ComponentPropsWithoutRef<"ul">) {
  return (
    <ul
      {...stylex.props(styles.list, x.listStyleType.disc)}
      {...props}
    >
      {children}
    </ul>
  );
}

function OrderedList({ children, ...props }: ComponentPropsWithoutRef<"ol">) {
  return (
    <ol
      {...stylex.props(styles.list, x.listStyleType.decimal)}
      {...props}
    >
      {children}
    </ol>
  );
}

function ListItem({ children, ...props }: ComponentPropsWithoutRef<"li">) {
  return (
    <li {...stylex.props(styles.listItem)} {...props}>
      {children}
    </li>
  );
}

function Blockquote({
  children,
  ...props
}: ComponentPropsWithoutRef<"blockquote">) {
  return (
    <blockquote {...stylex.props(styles.blockquote)} {...props}>
      {children}
    </blockquote>
  );
}

function HorizontalRule(props: ComponentPropsWithoutRef<"hr">) {
  return <hr {...stylex.props(styles.hr)} {...props} />;
}

function Pre({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const child = children as { props?: { "data-theme"?: string } } | undefined;
  const isPrettyCode =
    "data-theme" in props || child?.props?.["data-theme"] !== undefined;

  if (isPrettyCode) {
    return (
      <pre
        {...stylex.props(styles.codeBlockPre, x.overflowX.auto)}
        {...props}
      >
        {children}
      </pre>
    );
  }

  return (
    <pre {...stylex.props(styles.pre, x.overflowX.auto)} {...props}>
      {children}
    </pre>
  );
}

function Code({
  children,
  ...props
}: ComponentPropsWithoutRef<"code"> & {
  "data-theme"?: string;
}) {
  const isBlock = "data-theme" in props;

  if (isBlock) {
    return (
      <code
        {...stylex.props(styles.codeBlockCode, x.padding._0)}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <code {...stylex.props(styles.inlineCode)} {...props}>
      {children}
    </code>
  );
}

function Figure({
  children,
  ...props
}: ComponentPropsWithoutRef<"figure"> & {
  "data-rehype-pretty-code-figure"?: string;
}) {
  const isPrettyCode = "data-rehype-pretty-code-figure" in props;

  if (isPrettyCode) {
    return (
      <figure {...stylex.props(styles.codeBlockFigure)} {...props}>
        {children}
      </figure>
    );
  }

  return <figure {...props}>{children}</figure>;
}

function Image({ alt, ...props }: ComponentPropsWithoutRef<"img">) {
  return (
    <img
      alt={alt ?? ""}
      {...stylex.props(
        styles.image,
        x.display.block,
        x.maxWidth["100%"],
        x.height.auto,
      )}
      {...props}
    />
  );
}

function Table({ children, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div {...stylex.props(styles.tableWrapper, x.overflowX.auto)}>
      <table {...stylex.props(styles.table, x.width["100%"])} {...props}>
        {children}
      </table>
    </div>
  );
}

function TableHead({ children, ...props }: ComponentPropsWithoutRef<"thead">) {
  return <thead {...props}>{children}</thead>;
}

function TableBody({ children, ...props }: ComponentPropsWithoutRef<"tbody">) {
  return <tbody {...props}>{children}</tbody>;
}

function TableRow({ children, ...props }: ComponentPropsWithoutRef<"tr">) {
  return <tr {...props}>{children}</tr>;
}

function TableHeaderCell({
  children,
  ...props
}: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      {...stylex.props(
        styles.tableHeadCell,
        x.textTransform.uppercase,
        x.textAlign.left,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

function TableCell({ children, ...props }: ComponentPropsWithoutRef<"td">) {
  return (
    <td {...stylex.props(styles.tableCell)} {...props}>
      {children}
    </td>
  );
}

const mdxComponents = {
  h2: H2,
  h3: H3,
  p: Paragraph,
  a: Anchor,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  blockquote: Blockquote,
  hr: HorizontalRule,
  pre: Pre,
  code: Code,
  figure: Figure,
  img: Image,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: TableRow,
  th: TableHeaderCell,
  td: TableCell,
};

const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [
      rehypePrettyCode,
      {
        // Dual themes: tokens carry --shiki-light/--shiki-dark variables,
        // switched by html[data-theme] rules in globals.css.
        theme: {
          dark: "vesper",
          light: "github-light",
        },
        keepBackground: false,
      },
    ],
  ],
} satisfies CompileOptions;

type MdxContentProps = {
  source: string;
};

export async function MdxContent({ source }: MdxContentProps) {
  return (
    <MDXRemote
      source={source}
      components={mdxComponents}
      options={{ mdxOptions }}
    />
  );
}
