import { render, screen, fireEvent } from "@testing-library/react";
import { Editor } from "./Editor";
import { describe, it, expect } from "vitest";

describe("Editor integration", () => {
  it("allows typing text", () => {
    render(<Editor />);
    const textarea = screen.getByRole("textbox", { name: "" });
    fireEvent.change(textarea, { target: { value: "hello" } });
    expect((textarea as HTMLTextAreaElement).value).toBe("hello");
  });

  it("has copy button", () => {
    render(<Editor />);
    expect(screen.getByText("Копировать")).toBeInTheDocument();
  });
});

