import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Search from "./Search";

describe("Search", () => {
  it("can make a sample test pass", () => {
    render(<Search />);
    const testButton = screen.getByRole("button", { name: "test" });

    expect(testButton).toBeInTheDocument();
  });
});
