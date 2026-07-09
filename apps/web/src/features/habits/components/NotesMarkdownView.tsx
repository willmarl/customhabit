import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";

type NotesMarkdownViewProps = {
  value: string;
};

export default function NotesMarkdownView({ value }: NotesMarkdownViewProps) {
  const components = useMemo<Components>(
    () => ({
      ul: ({ className, children, ...props }) => (
        <ul
          className={cn(
            className,
            className?.includes("contains-task-list") && "my-1 list-none pl-0",
          )}
          {...props}
        >
          {children}
        </ul>
      ),
      li: ({ className, children, ...props }) => {
        const isTask = className?.includes("task-list-item");
        if (!isTask) {
          return (
            <li className={className} {...props}>
              {children}
            </li>
          );
        }
        return (
          <li
            className={cn(
              className,
              "task-list-item my-0.5 flex list-none items-start gap-2 pl-0",
              "[&>p]:my-0 [&>p]:flex [&>p]:items-start [&>p]:gap-2",
              "has-[input:checked]:text-muted-foreground has-[input:checked]:[&_p]:line-through",
            )}
            {...props}
          >
            {children}
          </li>
        );
      },
      input: ({ type, checked }) => {
        if (type !== "checkbox") return null;
        return (
          <input
            type="checkbox"
            checked={checked ?? false}
            readOnly
            tabIndex={-1}
            className="mt-0.5 size-4 shrink-0 pointer-events-none rounded border border-border accent-violet-600"
            aria-hidden
          />
        );
      },
    }),
    [],
  );

  return (
    <div className="prose prose-sm max-w-none text-left dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {value}
      </ReactMarkdown>
    </div>
  );
}
