import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom/vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { apiClient, toastsAtom, userKeys, type User } from "@todo/shared";
import { getDefaultStore } from "jotai/vanilla";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserCreateForm } from "./UserCreateForm";

const createdUser: User = {
  id: "user-3",
  username: "Grace Hopper",
  createdAt: "2026-09-28T00:00:00.000Z",
  taskCount: 0,
};

function renderForm() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  client.setQueryData(userKeys.lists(), []);
  const view = render(
    <QueryClientProvider client={client}>
      <UserCreateForm />
    </QueryClientProvider>,
  );
  return { ...view, client };
}

describe("UserCreateForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    act(() => getDefaultStore().set(toastsAtom, []));
  });

  it("shows an accessible inline validation error without calling the API", () => {
    const createUser = vi.spyOn(apiClient, "createUser");
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Add user" }));

    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Name must be at least 3 characters.",
    );
    expect(createUser).not.toHaveBeenCalled();
  });

  it("clears the form, invalidates users, and announces success", async () => {
    vi.spyOn(apiClient, "createUser").mockResolvedValue(createdUser);
    const { client } = renderForm();
    const input = screen.getByRole("textbox", { name: "Name" });

    fireEvent.change(input, { target: { value: "  Grace Hopper  " } });
    fireEvent.click(screen.getByRole("button", { name: "Add user" }));

    await waitFor(() => expect(input).toHaveValue(""));
    expect(apiClient.createUser).toHaveBeenCalledWith({
      username: "Grace Hopper",
    });
    expect(client.getQueryState(userKeys.lists())?.isInvalidated).toBe(true);
    expect(getDefaultStore().get(toastsAtom)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "success",
          message: "User created successfully.",
        }),
      ]),
    );
  });

  it("retains input and announces an API failure", async () => {
    vi.spyOn(apiClient, "createUser").mockRejectedValue(new Error("offline"));
    renderForm();
    const input = screen.getByRole("textbox", { name: "Name" });

    fireEvent.change(input, { target: { value: "Grace Hopper" } });
    fireEvent.click(screen.getByRole("button", { name: "Add user" }));

    await waitFor(() =>
      expect(getDefaultStore().get(toastsAtom)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "error",
            message: "Unable to create user. Please try again.",
          }),
        ]),
      ),
    );
    expect(input).toHaveValue("Grace Hopper");
  });
});
