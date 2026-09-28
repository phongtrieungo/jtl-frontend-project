import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { apiClient, userKeys, type User } from "@todo/shared";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserDetailCard } from "./UserDetailCard";
import { UserList } from "./UserList";

const user: User = {
  id: "user-1",
  username: "Ada Lovelace",
  createdAt: "2026-09-28T00:00:00.000Z",
  taskCount: 2,
};

function createClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderWithClient(ui: ReactNode, client = createClient()) {
  return {
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
    client,
  };
}

const renderUserLink = ({
  user: linkedUser,
  children,
  className,
}: {
  user: User;
  children: ReactNode;
  className: string;
}) => (
  <a className={className} href={`/profiles/${linkedUser.id}`}>
    {children}
  </a>
);

const renderUsersLink = ({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) => (
  <a className={className} href="/profiles">
    {children}
  </a>
);

const renderTasksLink = ({
  user: linkedUser,
  children,
  className,
}: {
  user: User;
  children: ReactNode;
  className: string;
}) => (
  <a className={className} href={`/work?owner=${linkedUser.id}`}>
    {children}
  </a>
);

describe("UserList", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders loading, empty, and populated states", () => {
    vi.spyOn(apiClient, "getUsers").mockReturnValue(
      new Promise(() => undefined),
    );
    const loading = renderWithClient(
      <UserList renderUserLink={renderUserLink} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading users");
    loading.unmount();

    const emptyClient = createClient();
    emptyClient.setQueryData(userKeys.lists(), []);
    const empty = renderWithClient(
      <UserList renderUserLink={renderUserLink} />,
      emptyClient,
    );
    expect(
      screen.getByText("No users yet. Add the first profile above."),
    ).toBeInTheDocument();
    empty.unmount();

    const populatedClient = createClient();
    populatedClient.setQueryData(userKeys.lists(), [user]);
    renderWithClient(
      <UserList renderUserLink={renderUserLink} />,
      populatedClient,
    );
    expect(screen.getByRole("link", { name: /Ada Lovelace/ })).toHaveAttribute(
      "href",
      "/profiles/user-1",
    );
    expect(screen.getByText("2 tasks")).toBeInTheDocument();
  });

  it("offers a keyboard-accessible retry after a failed query", async () => {
    const getUsers = vi
      .spyOn(apiClient, "getUsers")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([user]);
    renderWithClient(<UserList renderUserLink={renderUserLink} />);

    const retry = await screen.findByRole("button", { name: "Try again" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load users.",
    );
    fireEvent.click(retry);

    expect(
      await screen.findByRole("link", { name: /Ada Lovelace/ }),
    ).toBeInTheDocument();
    expect(getUsers).toHaveBeenCalledTimes(2);
  });
});

describe("UserDetailCard", () => {
  afterEach(() => vi.restoreAllMocks());

  function detail(userId = user.id) {
    return (
      <UserDetailCard
        userId={userId}
        renderTasksLink={renderTasksLink}
        renderUsersLink={renderUsersLink}
      />
    );
  }

  it("renders loading and populated profile states with composed navigation", () => {
    vi.spyOn(apiClient, "getUserById").mockReturnValue(
      new Promise(() => undefined),
    );
    const loading = renderWithClient(detail());
    expect(screen.getByRole("status")).toHaveTextContent("Loading profile");
    loading.unmount();

    const client = createClient();
    client.setQueryData(userKeys.detail(user.id), user);
    renderWithClient(detail(), client);
    expect(
      screen.getByRole("heading", { name: user.username }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View tasks" })).toHaveAttribute(
      "href",
      "/work?owner=user-1",
    );
  });

  it("offers retry and recovery navigation after a failed detail query", async () => {
    const getUser = vi
      .spyOn(apiClient, "getUserById")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(user);
    renderWithClient(detail());

    const retry = await screen.findByRole("button", { name: "Try again" });
    expect(
      screen.getByRole("link", { name: "Return to users" }),
    ).toHaveAttribute("href", "/profiles");
    fireEvent.click(retry);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: user.username }),
      ).toBeInTheDocument(),
    );
    expect(getUser).toHaveBeenCalledTimes(2);
  });
});
