import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordFields } from "@/components/auth/PasswordFields";

describe("PasswordFields", () => {
  const defaultProps = {
    password: "",
    confirm: "",
    onPasswordChange: jest.fn(),
    onConfirmChange: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders password and confirm fields with default label", () => {
    render(<PasswordFields {...defaultProps} />);
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  });

  it("renders custom passwordLabel", () => {
    render(<PasswordFields {...defaultProps} passwordLabel="Password" />);
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("calls onPasswordChange when password input changes", async () => {
    render(<PasswordFields {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("New password"), "abc");
    expect(defaultProps.onPasswordChange).toHaveBeenCalled();
  });

  it("calls onConfirmChange when confirm input changes", async () => {
    render(<PasswordFields {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Confirm password"), "abc");
    expect(defaultProps.onConfirmChange).toHaveBeenCalled();
  });

  it("shows error message when error prop is provided", () => {
    render(<PasswordFields {...defaultProps} error="Passwords do not match." />);
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("does not render error paragraph when error is undefined", () => {
    render(<PasswordFields {...defaultProps} />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });
});
