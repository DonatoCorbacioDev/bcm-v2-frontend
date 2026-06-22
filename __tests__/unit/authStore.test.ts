import { useAuthStore } from "@/store/authStore";

const mockUser = { id: 1, username: "testuser", role: "ADMIN", roleId: 1, managerId: 1, verified: true, createdAt: "2024-01-01" };

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null });
  });

  it("setAuth stores user, sets isAuthenticated, and keeps the access token in memory", () => {
    useAuthStore.getState().setAuth(mockUser, "token-abc");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe("token-abc");
  });

  it("clearAuth removes user, sets isAuthenticated false, and clears the access token", () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true, accessToken: "token-abc" });

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });

  it("setAccessToken updates only the access token", () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true, accessToken: "old-token" });

    useAuthStore.getState().setAccessToken("new-token");

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("new-token");
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it("getToken returns the in-memory access token", () => {
    useAuthStore.setState({ accessToken: "my-token" });
    expect(useAuthStore.getState().getToken()).toBe("my-token");
  });

  it("getToken returns null when no access token is set", () => {
    expect(useAuthStore.getState().getToken()).toBeNull();
  });
});
