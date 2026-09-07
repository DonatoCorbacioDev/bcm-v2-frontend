import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
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

  it("renders nothing on the server-rendered pass, even when not dismissed", () => {
    // useSyncExternalStore uses getServerSnapshot (not isDismissed/localStorage,
    // which don't exist server-side) during renderToString — this must return
    // "dismissed" so the notice never flashes/mismatches on first hydration.
    const html = renderToString(<CookieNotice />);
    expect(html).not.toContain("Informativa sui cookie");
  });

  it("does not render again once already dismissed", async () => {
    localStorage.setItem("bcm-cookie-notice-dismissed", "1");
    render(<CookieNotice />);

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /informativa sui cookie/i })).not.toBeInTheDocument();
    });
  });

  it("treats an unavailable localStorage (private mode, blocked) as already dismissed", async () => {
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("localStorage is disabled");
    });

    render(<CookieNotice />);

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /informativa sui cookie/i })).not.toBeInTheDocument();
    });

    getItemSpy.mockRestore();
  });
});
