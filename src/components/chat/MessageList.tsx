"use client";

import { UIMessage, isToolUIPart, getToolName } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ToolCallBadge } from "./ToolCallBadge";

interface MessageListProps {
  messages: UIMessage[];
  isLoading?: boolean;
}

function mapToolState(state: string): "partial-call" | "call" | "result" {
  if (state === "input-streaming") return "partial-call";
  if (state === "output-available" || state === "output-error" || state === "output-denied") return "result";
  return "call";
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-700 mb-4 shadow-sm">
          <Bot className="h-7 w-7 text-slate-300" />
        </div>
        <p className="text-slate-100 font-semibold text-lg mb-2">Start a conversation to generate React components</p>
        <p className="text-slate-400 text-sm max-w-sm">I can help you create buttons, forms, cards, and more</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-4",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-slate-700 border border-slate-600 shadow-sm flex items-center justify-center">
                  <Bot className="h-4.5 w-4.5 text-slate-300" />
                </div>
              </div>
            )}

            <div className={cn(
              "flex flex-col gap-2 max-w-[85%]",
              message.role === "user" ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-xl px-4 py-3",
                message.role === "user"
                  ? "bg-slate-600 text-slate-100 shadow-sm"
                  : "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
              )}>
                <div className="text-sm">
                  <>
                    {message.parts.map((part, partIndex) => {
                      if (part.type === "text") {
                        return message.role === "user" ? (
                          <span key={partIndex} className="whitespace-pre-wrap">{part.text}</span>
                        ) : (
                          <MarkdownRenderer
                            key={partIndex}
                            content={part.text}
                            className="prose-sm"
                          />
                        );
                      }

                      if (part.type === "reasoning") {
                        return (
                          <div key={partIndex} className="mt-3 p-3 bg-slate-700/50 rounded-md border border-slate-600">
                            <span className="text-xs font-medium text-slate-400 block mb-1">Reasoning</span>
                            <span className="text-sm text-slate-300">{part.text}</span>
                          </div>
                        );
                      }

                      if (isToolUIPart(part)) {
                        const toolName = getToolName(part);
                        const state = mapToolState(part.state);
                        const output = "output" in part ? part.output : undefined;
                        return (
                          <ToolCallBadge
                            key={partIndex}
                            toolName={toolName}
                            args={(part.input as Record<string, unknown>) ?? {}}
                            state={state}
                            result={output}
                          />
                        );
                      }

                      if (part.type === "step-start") {
                        return partIndex > 0 ? <hr key={partIndex} className="my-3 border-slate-600" /> : null;
                      }

                      return null;
                    })}
                    {isLoading &&
                      message.role === "assistant" &&
                      messages.indexOf(message) === messages.length - 1 && (
                        <div className="flex items-center gap-2 mt-3 text-slate-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-sm">Generating...</span>
                        </div>
                      )}
                  </>
                </div>
              </div>
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-slate-600 shadow-sm flex items-center justify-center">
                  <User className="h-4.5 w-4.5 text-slate-100" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
