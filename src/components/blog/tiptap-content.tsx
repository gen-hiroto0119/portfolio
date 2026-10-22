/* eslint-disable @next/next/no-img-element */
import { Fragment, type ReactNode, createElement } from "react";
import { CodeBlock } from "@/components/blog/code-block";
import { parseTiptapDocument, type TiptapDocument, type TiptapNode } from "@/lib/cms/document";

function renderNode(node: TiptapNode, index: number): ReactNode {
  const children = node.content?.map(renderNode);
  switch (node.type) {
    case "doc": return <Fragment key={index}>{children}</Fragment>;
    case "text": {
      let text: ReactNode = node.text;
      for (const mark of node.marks ?? []) {
        switch (mark.type) {
          case "bold": text = <strong>{text}</strong>; break;
          case "italic": text = <em>{text}</em>; break;
          case "strike": text = <s>{text}</s>; break;
          case "underline": text = <u>{text}</u>; break;
          case "code": text = <code>{text}</code>; break;
          case "link": text = <a href={mark.attrs?.href} target="_blank" rel="noopener noreferrer">{text}</a>; break;
        }
      }
      return <Fragment key={index}>{text}</Fragment>;
    }
    case "paragraph": return <p key={index}>{children?.length ? children : <br />}</p>;
    case "heading": return createElement(`h${Math.max(2, Number(node.attrs?.level ?? 2))}`, { key: index }, children);
    case "blockquote": return <blockquote key={index}>{children}</blockquote>;
    case "bulletList": return <ul key={index}>{children}</ul>;
    case "orderedList": return <ol key={index} start={Number(node.attrs?.start ?? 1)}>{children}</ol>;
    case "listItem": return <li key={index}>{children}</li>;
    case "table": return <div key={index} className="overflow-x-auto"><table><tbody>{children}</tbody></table></div>;
    case "tableRow": return <tr key={index}>{children}</tr>;
    case "tableCell":
    case "tableHeader": {
      const widths = node.attrs?.colwidth;
      const width = Array.isArray(widths) && widths.every((value) => value > 0) ? widths.reduce((sum, value) => sum + value, 0) : undefined;
      const align = node.attrs?.align;
      const className = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
      return createElement(node.type === "tableHeader" ? "th" : "td", {
        key: index,
        colSpan: Number(node.attrs?.colspan ?? 1),
        rowSpan: Number(node.attrs?.rowspan ?? 1),
        className,
        style: width ? { width } : undefined,
      }, children);
    }
    case "codeBlock": return <CodeBlock key={index} code={node.content?.map((child) => child.text ?? "").join("") ?? ""} language={typeof node.attrs?.language === "string" ? node.attrs.language : undefined} />;
    case "hardBreak": return <br key={index} />;
    case "horizontalRule": return <hr key={index} />;
    case "image": return <img key={index} src={String(node.attrs?.src)} alt={String(node.attrs?.alt ?? "")} loading="lazy" width={typeof node.attrs?.width === "number" ? node.attrs.width : undefined} height={typeof node.attrs?.height === "number" ? node.attrs.height : undefined} />;
    default: return null;
  }
}
export function TiptapContent({ document }: { document: TiptapDocument }) {
  return <div className="prose-content">{renderNode(parseTiptapDocument(document), 0)}</div>;
}
