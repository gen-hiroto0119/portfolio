import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const uploadAnchorKey = new PluginKey<DecorationSet>("portfolio-image-upload");

type UploadAnchorAction =
  | { add: { id: string; position: number; count: number } }
  | { remove: string }
  | { clear: true };

export const UploadAnchor = Extension.create({
  name: "portfolioImageUpload",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: uploadAnchorKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, previous) {
            let decorations = previous.map(transaction.mapping, transaction.doc);
            const action = transaction.getMeta(uploadAnchorKey) as UploadAnchorAction | undefined;

            if (action && "clear" in action) return DecorationSet.empty;
            if (action && "add" in action) {
              const { id, position, count } = action.add;
              const widget = Decoration.widget(position, () => {
                const element = document.createElement("span");
                element.className = "my-4 inline-flex rounded border border-dashed border-border px-3 py-2 text-sm text-muted-foreground";
                element.textContent = `画像 ${count} 枚をアップロード中…`;
                element.setAttribute("role", "status");
                return element;
              }, { id, side: -1 });
              decorations = decorations.add(transaction.doc, [widget]);
            }
            if (action && "remove" in action) {
              decorations = decorations.remove(
                decorations.find(undefined, undefined, (spec) => spec.id === action.remove),
              );
            }
            return decorations;
          },
        },
        props: {
          decorations: (state) => uploadAnchorKey.getState(state),
        },
      }),
    ];
  },
});
