import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { apiClient, userKeys, type User } from "@todo/shared";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCreateUser } from "./useCreateUser";
import { useUser } from "./useUser";
import { useUsers } from "./useUsers";

const user: User = {
  id: "user-1",
  username: "Ada Lovelace",
  createdAt: "2026-09-28T00:00:00.000Z",
  taskCount: 2,
};

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("user query hooks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the user directory with the shared query key", async () => {
    const getUsers = vi.spyOn(apiClient, "getUsers").mockResolvedValue([user]);
    const client = createQueryClient();
    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([user]);
    expect(getUsers).toHaveBeenCalledOnce();
    expect(client.getQueryData(userKeys.lists())).toEqual([user]);
  });

  it("loads one user and does not request an empty id", async () => {
    const getUser = vi.spyOn(apiClient, "getUserById").mockResolvedValue(user);
    const client = createQueryClient();
    const populated = renderHook(() => useUser(user.id), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(populated.result.current.isSuccess).toBe(true));
    expect(getUser).toHaveBeenCalledWith(user.id);
    expect(client.getQueryData(userKeys.detail(user.id))).toEqual(user);

    populated.unmount();
    renderHook(() => useUser(""), { wrapper: createWrapper(client) });
    expect(getUser).toHaveBeenCalledOnce();
  });

  it("creates a user and invalidates the directory query", async () => {
    const createUser = vi
      .spyOn(apiClient, "createUser")
      .mockResolvedValue(user);
    const client = createQueryClient();
    client.setQueryData(userKeys.lists(), []);
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ username: user.username });
    });

    expect(createUser).toHaveBeenCalledWith({ username: user.username });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: userKeys.lists() });
  });

  it("exposes creation failures without invalidating the directory", async () => {
    vi.spyOn(apiClient, "createUser").mockRejectedValue(new Error("offline"));
    const client = createQueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current
        .mutateAsync({ username: user.username })
        .catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
