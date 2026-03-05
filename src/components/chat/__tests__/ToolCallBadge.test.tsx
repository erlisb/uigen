import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// str_replace_editor tests

test("shows 'Creating' label for str_replace_editor create command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/components/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor str_replace command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/src/components/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor insert command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("shows 'Viewing' label for str_replace_editor view command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "/src/index.ts" }}
      state="call"
    />
  );
  expect(screen.getByText("Viewing index.ts")).toBeDefined();
});

// file_manager tests

test("shows 'Renaming' label with old and new filenames for file_manager rename", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/src/Old.tsx", new_path: "/src/New.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming Old.tsx → New.tsx")).toBeDefined();
});

test("shows 'Deleting' label for file_manager delete command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/src/components/Unused.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

// State indicator tests

test("shows spinner when state is 'call'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when state is 'result' with a result", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is 'result' but result is undefined", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result={undefined}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

// Fallback test

test("falls back to toolName when tool is unrecognized", () => {
  render(
    <ToolCallBadge
      toolName="unknown_tool"
      args={{}}
      state="result"
      result="done"
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});
