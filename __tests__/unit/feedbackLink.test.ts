import { feedbackHref } from "@/components/layout/FeedbackLink";

describe("feedbackHref", () => {
  it("opens a mail with the page already written in", () => {
    const href = feedbackHref("/contracts/abc");
    expect(href.startsWith("mailto:")).toBe(true);
    const body = decodeURIComponent(href.split("body=")[1]);
    expect(body).toContain("Pagina: /contracts/abc");
    expect(decodeURIComponent(href)).toContain("subject=Parere su BCM");
  });
});
