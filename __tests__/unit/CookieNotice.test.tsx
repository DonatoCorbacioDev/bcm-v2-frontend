import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CookieNotice } from "@/components/legal/CookieNotice";

describe("CookieNotice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the notice on first visit", async () => {
    render(<CookieNotice />);
    expect(await screen.findByRole("region", { name: /informativa sui cookie/i })).toBeInTheDocument();
  });

  it("links to the cookie policy page", async () => {
    render(<CookieNotice />);
    const link = await screen.findByRole("link", { name: /cookie policy/i });
    expect(link).toHaveAttribute("href", "/cookie-policy");
  });

  it("dismisses and persists the choice to localStorage", async () => {
    const user = userEvent.setup();
    render(<CookieNotice />);
    await screen.findByRole("region", { name: /informativa sui cookie/i });

    await user.click(screen.getByRole("button", { name: /capito/i }));

    expect(screen.queryByRole("region", { name: /informativa sui cookie/i })).not.toBeInTheDocument();
    expect(localStorage.getItem("bcm-cookie-notice-dismissed")).toBe("1");
  });

  it("does not render again once already dismissed", async () => {
    localStorage.setItem("bcm-cookie-notice-dismissed", "1");
    render(<CookieNotice />);

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /informativa sui cookie/i })).not.toBeInTheDocument();
    });
  });
});
