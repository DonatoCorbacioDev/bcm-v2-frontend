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
    expect(screen.getByLabelText("Nuova password")).toBeInTheDocument();
    expect(screen.getByLabelText("Conferma password")).toBeInTheDocument();
  });

  it("marks both fields as a new password, so browsers suggest one instead of filling the old", () => {
    render(<PasswordFields {...defaultProps} />);
    expect(screen.getByLabelText("Nuova password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Conferma password")).toHaveAttribute("autocomplete", "new-password");
  });

  it("renders custom passwordLabel", () => {
    render(<PasswordFields {...defaultProps} passwordLabel="Password" />);
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("calls onPasswordChange when password input changes", async () => {
    render(<PasswordFields {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Nuova password"), "abc");
    expect(defaultProps.onPasswordChange).toHaveBeenCalled();
  });

  it("calls onConfirmChange when confirm input changes", async () => {
    render(<PasswordFields {...defaultProps} />);
    await userEvent.type(screen.getByLabelText("Conferma password"), "abc");
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
