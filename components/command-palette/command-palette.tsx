"use client";

import { Dialog } from "@base-ui/react/dialog";
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

import { useCommandPalette } from "./command-palette-provider";


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
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
        />
        <Dialog.Popup
          className="fixed left-1/2 top-[15%] z-50 flex max-h-[70dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl"
          initialFocus={inputRef}
        >
          <Dialog.Title className="sr-only">サイト内を検索</Dialog.Title>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="サイト内を検索"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={
              selectedCommand ? `command-option-${selectedCommand.id}` : undefined
            }
            aria-autocomplete="list"
            placeholder="ページ・記事を検索…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            className="w-full shrink-0 border-b border-border bg-transparent px-6 py-4 text-sm outline-none"
          />

          <div
            id={listboxId}
            role="listbox"
            aria-label="Commands"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2"
          >
            {flatCommands.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                検索結果が見つかりませんでした
              </p>
            ) : (
              groupedCommands.map(({ group, items }) => {
                const groupContent = (
                  <div
                    key={group}
                    className="flex flex-col"
                  >
                    <div
                      className="px-6 pb-1 pt-4 text-xs text-muted-foreground"
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
                          className={`relative flex cursor-pointer items-center px-6 py-3 text-sm ${isSelected ? "bg-surface" : ""}`}
                          onPointerMove={(event) => {
                            if (event.pointerType === "mouse") {
                              setSelectedIndex(index);
                            }
                          }}
                          onClick={() => executeCommand(command)}
                        >
                          <span
                            className="hidden"
                          />
                          {command.meta ? (
                            <span
                              className="flex w-full items-center justify-between gap-4"
                            >
                              <span>{command.label}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">
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
            className="flex shrink-0 gap-4 border-t border-border px-6 py-3 text-xs text-muted-foreground"
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
