import { vi } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import ToastProvider from "../components/ui/ToastProvider.jsx";
import ConfirmProvider from "../components/ui/ConfirmProvider.jsx";

// Every test renders inside the same providers as the application.
export function render(ui, options = {}) {
  const wrapper = ({ children }) => (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
  return rtlRender(ui, { wrapper, ...options });
}

/** Queries inside the open confirmation dialog. */
export const confirmDialog = () => within(screen.getByRole("dialog"));

// One stable getToken for every test, so effects that depend on it do not run again on each render.
export const getToken = vi.fn(async () => "test-token");

export const authState = { userId: "user_1", isLoaded: true };

export const clerkMock = () => ({
  useAuth: () => ({ ...authState, getToken }),
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => <div data-testid="user-button" />,
});

export const apiClientMock = () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    defaults: { baseURL: "http://api.test/api" },
  },
});

const encoder = new TextEncoder();

export const sseFrame = (payload) => `data: ${JSON.stringify(payload)}\n\n`;

/**
 * Replaces global fetch with a function that answers with a stream the test controls.
 * The stream errors with an AbortError when the request signal aborts, like a real fetch.
 */
export function mockStreamFetch() {
  let controller;
  const fetchMock = vi.fn((url, init) => {
    const body = new ReadableStream({
      start(c) {
        controller = c;
        init?.signal?.addEventListener("abort", () => c.error(new DOMException("Aborted", "AbortError")));
      },
    });
    return Promise.resolve({ ok: true, status: 200, body });
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    fetchMock,
    send: (payload) => controller.enqueue(encoder.encode(sseFrame(payload))),
    sendRaw: (text) => controller.enqueue(encoder.encode(text)),
    end: () => controller.close(),
  };
}
