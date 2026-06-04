import { useAuthStore } from "@/store/authStore";

const mockUser = { id: 1, username: "testuser", role: "ADMIN", roleId: 1, managerId: 1, verified: true, createdAt: "2024-01-01" };

let setItemSpy: jest.SpyInstance;
let removeItemSpy: jest.SpyInstance;
let getItemSpy: jest.SpyInstance;

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    localStorage.clear();
    setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");
    getItemSpy = jest.spyOn(Storage.prototype, "getItem");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("setAuth stores user, sets isAuthenticated, and writes tokens to localStorage", () => {
    useAuthStore.getState().setAuth(mockUser, "token-abc", "refresh-xyz");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(setItemSpy).toHaveBeenCalledWith("auth_token", "token-abc");
    expect(setItemSpy).toHaveBeenCalledWith("auth_refresh_token", "refresh-xyz");
  });

  it("clearAuth removes user, sets isAuthenticated false, and removes tokens from localStorage", () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(removeItemSpy).toHaveBeenCalledWith("auth_token");
    expect(removeItemSpy).toHaveBeenCalledWith("auth_refresh_token");
  });

  it("getToken returns the localStorage value", () => {
    localStorage.setItem("auth_token", "my-token");
    expect(useAuthStore.getState().getToken()).toBe("my-token");
  });

  it("getToken returns null when no token in localStorage", () => {
    expect(useAuthStore.getState().getToken()).toBeNull();
  });

  it("getRefreshToken returns the localStorage value", () => {
    localStorage.setItem("auth_refresh_token", "my-refresh");
    expect(useAuthStore.getState().getRefreshToken()).toBe("my-refresh");
  });

  it("getRefreshToken returns null when no refresh token in localStorage", () => {
    expect(useAuthStore.getState().getRefreshToken()).toBeNull();
  });
});
