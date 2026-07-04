"use client";

import { Dialog } from "@base-ui/react/dialog";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { useTheme } from "@/components/theme/theme-provider";
import {
  createStaticCommands,
  filterCommands,
  groupCommands,
  type CommandItem,
} from "@/lib/commands";
import type { ContentCommandData } from "@/lib/content-commands";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  motion,
  radius,
  spacing,
} from "@/lib/theme/tokens.stylex";

import { useCommandPalette } from "./command-palette-provider";

const styles = stylex.create({
  backdrop: {
    WebkitBackdropFilter: "blur(4px)",
    backgroundColor: `color-mix(in srgb, ${colors.bg} 60%, transparent)`,
  },
  popup: {
    transform: "translateX(-50%)",
    width: `min(calc(100% - ${spacing.lg} * 2), 36rem)`,
    backgroundColor: colors.bgElevated,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.md,
    boxShadow: `0 ${spacing.md} ${spacing.xl} color-mix(in srgb, ${colors.bg} 50%, transparent)`,
  },
  input: {
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
    backgroundColor: "transparent",
    color: colors.fg,
    borderWidth: 0,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    outline: "none",
    "::placeholder": {
      color: colors.fgFaint,
    },
  },
  list: {
    paddingBlock: spacing.xs,
  },
  groupLabel: {
    paddingBlock: spacing.xs,
    paddingInline: spacing.lg,
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgFaint,
  },
  option: {
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fg,
    transitionProperty: "background-color, color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
  },
  optionSelected: {
    backgroundColor: colors.accentMuted,
    color: colors.fg,
  },
  optionIndicator: {
    backgroundColor: colors.accent,
    opacity: 0,
  },
  optionIndicatorVisible: {
    opacity: 1,
  },
  footer: {
    gap: spacing.md,
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgFaint,
  },
  empty: {
    paddingBlock: spacing.lg,
    paddingInline: spacing.lg,
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fgMuted,
  },
  optionMeta: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgFaint,
    flexShrink: 0,
  },
});

type CommandPaletteProps = {
  contentItems?: ContentCommandData[];
  extraCommands?: CommandItem[];
};

function contentItemsToCommands(
  items: ContentCommandData[],
  router: AppRouterInstance,
): CommandItem[] {
  return items.map((item) => ({
    id: item.id,
    group: item.group,
    label: item.label,
    keywords: item.keywords,
    meta: item.meta,
    perform: () => router.push(item.href),
  }));
}

export function CommandPalette({
  contentItems = [],
  extraCommands = [],
}: CommandPaletteProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollOnKeyboardRef = useRef(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { open, closePalette } = useCommandPalette();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const contentCommands = useMemo(
    () => contentItemsToCommands(contentItems, router),
    [contentItems, router],
  );

  const allCommands = useMemo(
    () => [
      ...createStaticCommands(router, setTheme),
      ...contentCommands,
      ...extraCommands,
    ],
    [router, setTheme, contentCommands, extraCommands],
  );

  const filteredCommands = useMemo(
    () => filterCommands(allCommands, query),
    [allCommands, query],
  );

  const groupedCommands = useMemo(
    () => groupCommands(filteredCommands),
    [filteredCommands],
  );

  const flatCommands = useMemo(
    () => groupedCommands.flatMap(({ items }) => items),
    [groupedCommands],
  );

  const clampedSelectedIndex =
    flatCommands.length === 0
      ? 0
      : Math.min(selectedIndex, flatCommands.length - 1);

  const selectedCommand = flatCommands[clampedSelectedIndex] ?? null;

  const resetState = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        closePalette();
        resetState();
      }
    },
    [closePalette, resetState],
  );

  const executeCommand = useCallback(
    (command: CommandItem) => {
      command.perform();
      closePalette();
      resetState();
    },
    [closePalette, resetState],
  );

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!scrollOnKeyboardRef.current || !selectedCommand) {
      return;
    }

    scrollOnKeyboardRef.current = false;
    document
      .getElementById(`command-option-${selectedCommand.id}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [clampedSelectedIndex, selectedCommand]);

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (flatCommands.length > 0) {
          scrollOnKeyboardRef.current = true;
          setSelectedIndex(
            (current) =>
              (Math.min(current, flatCommands.length - 1) + 1) %
              flatCommands.length,
          );
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (flatCommands.length > 0) {
          scrollOnKeyboardRef.current = true;
          setSelectedIndex(
            (current) =>
              (Math.min(current, flatCommands.length - 1) -
                1 +
                flatCommands.length) %
              flatCommands.length,
          );
        }
        break;
      case "Enter":
        event.preventDefault();
        if (selectedCommand) {
          executeCommand(selectedCommand);
        }
        break;
      case "Escape":
        event.preventDefault();
        closePalette();
        resetState();
        break;
      default:
        break;
    }
  }

  let optionOffset = 0;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          {...stylex.props(
            styles.backdrop,
            x.position.fixed,
            x.inset._0,
            x.backdropFilter["blur(4px)"],
          )}
        />
        <Dialog.Popup
          {...stylex.props(
            styles.popup,
            x.position.fixed,
            x.top["20%"],
            x.left["50%"],
            x.display.flex,
            x.flexDirection.column,
            x.overflow.hidden,
          )}
          initialFocus={inputRef}
        >
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={
              selectedCommand ? `command-option-${selectedCommand.id}` : undefined
            }
            aria-autocomplete="list"
            placeholder="ページ・記事・メモを検索…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            {...stylex.props(styles.input, x.width["100%"])}
          />

          <div
            id={listboxId}
            role="listbox"
            aria-label="Commands"
            {...stylex.props(
              styles.list,
              x.maxHeight["18rem"],
              x.overflowY.auto,
            )}
          >
            {flatCommands.length === 0 ? (
              <p {...stylex.props(styles.empty, x.textAlign.center)}>
                一致するコマンドがありません
              </p>
            ) : (
              groupedCommands.map(({ group, items }) => {
                const groupContent = (
                  <div
                    key={group}
                    {...stylex.props(x.display.flex, x.flexDirection.column)}
                  >
                    <div
                      {...stylex.props(
                        styles.groupLabel,
                        x.textTransform.uppercase,
                      )}
                    >
                      {group}
                    </div>
                    {items.map((command) => {
                      const index = optionOffset;
                      optionOffset += 1;
                      const isSelected = index === clampedSelectedIndex;

                      return (
                        <div
                          key={command.id}
                          id={`command-option-${command.id}`}
                          role="option"
                          aria-selected={isSelected}
                          {...stylex.props(
                            styles.option,
                            x.position.relative,
                            x.display.flex,
                            x.alignItems.center,
                            x.cursor.pointer,
                            isSelected && styles.optionSelected,
                          )}
                          onMouseEnter={() => setSelectedIndex(index)}
                          onClick={() => executeCommand(command)}
                        >
                          <span
                            {...stylex.props(
                              styles.optionIndicator,
                              x.position.absolute,
                              x.left._0,
                              x.top._0,
                              x.bottom._0,
                              x.width["2px"],
                              isSelected && styles.optionIndicatorVisible,
                            )}
                          />
                          {command.meta ? (
                            <span
                              {...stylex.props(
                                x.display.flex,
                                x.alignItems.center,
                                x.justifyContent["space-between"],
                                x.width["100%"],
                              )}
                            >
                              <span>{command.label}</span>
                              <span {...stylex.props(styles.optionMeta)}>
                                {command.meta}
                              </span>
                            </span>
                          ) : (
                            command.label
                          )}
                        </div>
                      );
                    })}
                  </div>
                );

                return groupContent;
              })
            )}
          </div>

          <div
            {...stylex.props(styles.footer, x.display.flex)}
          >
            <span>↑↓ 移動</span>
            <span>↵ 実行</span>
            <span>esc 閉じる</span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
