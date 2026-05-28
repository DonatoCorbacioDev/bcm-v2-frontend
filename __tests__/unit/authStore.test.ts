import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";

jest.mock("js-cookie");

const mockUser = { id: 1, username: "testuser", role: "ADMIN", roleId: 1, managerId: 1, verified: true, createdAt: "2024-01-01" };

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    jest.clearAllMocks();
  });

  it("setAuth stores user, sets isAuthenticated, and writes cookie", () => {
    useAuthStore.getState().setAuth(mockUser, "token-abc");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(Cookies.set).toHaveBeenCalledWith("auth_token", "token-abc", expect.objectContaining({ expires: 7 }));
  });

  it("clearAuth removes user, sets isAuthenticated false, and removes cookie", () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(Cookies.remove).toHaveBeenCalledWith("auth_token");
  });

  it("getToken returns the cookie value", () => {
    (Cookies.get as jest.Mock).mockReturnValue("my-token");
    expect(useAuthStore.getState().getToken()).toBe("my-token");
  });

  it("setAuth passes secure and sameSite options to cookie", () => {
    useAuthStore.getState().setAuth(mockUser, "token-abc");

    expect(Cookies.set).toHaveBeenCalledWith(
      "auth_token",
      "token-abc",
      expect.objectContaining({ sameSite: "strict" })
    );
  });
});
