import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, Outlet } from "react-router-dom";
import { render, confirmDialog, clerkMock, apiClientMock, authState } from "./helpers.jsx";
import apiClient from "../utils/apiClient";
import ProjectsPage from "../pages/ProjectsPage";
import ProjectDetailPage from "../pages/ProjectDetailPage";
import HomePage from "../pages/HomePage";
import App from "../App";

vi.mock("@clerk/clerk-react", () => clerkMock());
vi.mock("../utils/apiClient", () => apiClientMock());
vi.mock("../utils/uploadthing", () => ({ UploadDropzone: () => <div data-testid="dropzone" /> }));

const projects = [
  { _id: "p1", name: "Quarterly report", description: "Finance files", createdAt: "2026-10-01T00:00:00Z" },
  { _id: "p2", name: "Research notes", description: "Papers on RAG", createdAt: "2026-10-05T00:00:00Z" },
  { _id: "p3", name: "Travel", createdAt: "2026-10-09T00:00:00Z" },
];

function LayoutStub() {
  return <Outlet context={{ isModalOpen: false, setIsModalOpen: vi.fn() }} />;
}

function renderProjects() {
  return render(
    <MemoryRouter initialEntries={["/projects"]}>
      <Routes>
        <Route element={<LayoutStub />}>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<div>Project page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authState.userId = "user_1";
  authState.isLoaded = true;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("projects page", () => {
  it("P01 lists projects with a count and the creation date", async () => {
    apiClient.get.mockResolvedValue({ data: projects });
    renderProjects();
    expect(await screen.findByText("Quarterly report")).toBeInTheDocument();
    expect(screen.getByText("3 projects")).toBeInTheDocument();
    expect(screen.getByText("Finance files")).toBeInTheDocument();
    expect(screen.getAllByText(/^Created /)).toHaveLength(3);
  });

  it("P02 shows the empty state when there are no projects", async () => {
    apiClient.get.mockResolvedValue({ data: [] });
    renderProjects();
    expect(await screen.findByText("Create your first project")).toBeInTheDocument();
    expect(screen.getByText("0 projects")).toBeInTheDocument();
  });

  it("P03 search filters by name and description, ignoring case", async () => {
    apiClient.get.mockResolvedValue({ data: projects });
    const user = userEvent.setup();
    renderProjects();
    await screen.findByText("Quarterly report");

    await user.type(screen.getByLabelText("Search projects"), "RESEARCH");
    expect(screen.getByText("Research notes")).toBeInTheDocument();
    expect(screen.queryByText("Quarterly report")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search projects"));
    await user.type(screen.getByLabelText("Search projects"), "finance");
    expect(screen.getByText("Quarterly report")).toBeInTheDocument();
    expect(screen.queryByText("Travel")).not.toBeInTheDocument();
  });

  it("P04 a search with no match says so and keeps the total count", async () => {
    apiClient.get.mockResolvedValue({ data: projects });
    const user = userEvent.setup();
    renderProjects();
    await screen.findByText("Quarterly report");
    await user.type(screen.getByLabelText("Search projects"), "zzz");
    expect(screen.getByText("No projects match your search.")).toBeInTheDocument();
    expect(screen.getByText("3 projects")).toBeInTheDocument();
  });

  it("P05 the view toggle switches between grid and list layouts", async () => {
    apiClient.get.mockResolvedValue({ data: projects });
    const user = userEvent.setup();
    renderProjects();
    await screen.findByText("Quarterly report");
    const list = screen.getAllByRole("list")[0];
    expect(list.className).toContain("grid");
    expect(screen.getByLabelText("Grid view")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByLabelText("List view"));
    expect(list.className).toContain("flex-col");
    expect(screen.getByLabelText("List view")).toHaveAttribute("aria-pressed", "true");
  });

  it("P06 a project card links to its page", async () => {
    apiClient.get.mockResolvedValue({ data: projects });
    const user = userEvent.setup();
    renderProjects();
    await user.click(await screen.findByText("Research notes"));
    expect(screen.getByText("Project page")).toBeInTheDocument();
  });

  it("P07 delete opens a dialog, cancel keeps the project, confirm removes it and shows a notice", async () => {
    apiClient.get.mockResolvedValue({ data: projects });
    apiClient.delete.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderProjects();
    await screen.findByText("Travel");

    await user.click(screen.getByLabelText("Delete Travel"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(confirmDialog().getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(apiClient.delete).not.toHaveBeenCalled();
    expect(screen.getByText("Travel")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Delete Travel"));
    await user.click(confirmDialog().getByRole("button", { name: "Delete project" }));
    expect(apiClient.delete).toHaveBeenCalledWith("/projects/p3", { headers: { Authorization: "Bearer test-token" } });
    await waitFor(() => expect(screen.queryByText("Travel")).not.toBeInTheDocument());
    expect(screen.getByText("2 projects")).toBeInTheDocument();
    expect(await screen.findByText("Project deleted.")).toBeInTheDocument();
  });

  it("P07b the Escape key closes the delete dialog without deleting", async () => {
    apiClient.get.mockResolvedValue({ data: projects });
    const user = userEvent.setup();
    renderProjects();
    await user.click(await screen.findByLabelText("Delete Travel"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(apiClient.delete).not.toHaveBeenCalled();
  });

  it("P08 a failed delete keeps the project and shows an error notice", async () => {
    apiClient.get.mockResolvedValue({ data: projects });
    apiClient.delete.mockRejectedValue(new Error("500"));
    const user = userEvent.setup();
    renderProjects();
    await user.click(await screen.findByLabelText("Delete Travel"));
    await user.click(confirmDialog().getByRole("button", { name: "Delete project" }));
    expect(await screen.findByText("Failed to delete the project.")).toBeInTheDocument();
    expect(screen.getByText("Travel")).toBeInTheDocument();
  });

  it("P09 shows an error when the list cannot be loaded", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiClient.get.mockRejectedValue(new Error("down"));
    renderProjects();
    expect(await screen.findByText("Failed to fetch projects.")).toBeInTheDocument();
  });
});

function renderDetail(path = "/projects/p1") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/projects/:projectId/chats/:chatId" element={<ProjectDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function routeGets(chats) {
  apiClient.get.mockImplementation(async (url) => {
    if (url === "/projects/p1") return { data: projects[0] };
    if (url === "/projects/p1/chats") return { data: chats };
    if (url === "/projects/p1/documents") return { data: [] };
    if (url.endsWith("/messages")) return { data: [{ role: "user", content: "Stored question" }] };
    throw new Error(`unexpected GET ${url}`);
  });
}

describe("project detail page", () => {
  it("N01 shows the project, its conversations and the knowledge base", async () => {
    routeGets([{ _id: "c1", title: "Conversation 1" }, { _id: "c2", title: "Conversation 2" }]);
    renderDetail();
    expect(await screen.findByRole("heading", { name: "Quarterly report" })).toBeInTheDocument();
    expect(screen.getByText("Conversation 2")).toBeInTheDocument();
    expect(screen.getByText("Knowledge Base")).toBeInTheDocument();
  });

  it("N02 a conversation card opens the chat with its stored messages", async () => {
    routeGets([{ _id: "c1", title: "Conversation 1" }]);
    const user = userEvent.setup();
    renderDetail();
    await user.click(await screen.findByText("Conversation 1"));
    expect(await screen.findByText("Stored question")).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith("/projects/p1/chats/c1/messages", expect.anything());
    // The knowledge base stays visible next to the chat
    expect(screen.getByText("Knowledge Base")).toBeInTheDocument();
  });

  it("N03 a new conversation is numbered from the existing count and opens at once", async () => {
    routeGets([{ _id: "c1", title: "Conversation 1" }, { _id: "c2", title: "Conversation 2" }]);
    apiClient.post.mockResolvedValue({ data: { _id: "c3", title: "Conversation 3" } });
    const user = userEvent.setup();
    renderDetail();
    await user.click(await screen.findByText("New conversation"));
    expect(apiClient.post).toHaveBeenCalledWith("/projects/p1/chats", { title: "Conversation 3" }, { headers: { Authorization: "Bearer test-token" } });
    expect(await screen.findByLabelText("Back to conversations")).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith("/projects/p1/chats/c3/messages", expect.anything());
  });

  it("N04 deleting a conversation asks first and removes it", async () => {
    routeGets([{ _id: "c1", title: "Conversation 1" }, { _id: "c2", title: "Conversation 2" }]);
    apiClient.delete.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderDetail();
    await screen.findByText("Conversation 1");

    await user.click(screen.getByLabelText("Delete Conversation 1"));
    await user.click(confirmDialog().getByRole("button", { name: "Cancel" }));
    expect(apiClient.delete).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText("Delete Conversation 1"));
    await user.click(confirmDialog().getByRole("button", { name: "Delete conversation" }));
    expect(apiClient.delete).toHaveBeenCalledWith("/projects/p1/chats/c1", { headers: { Authorization: "Bearer test-token" } });
    await waitFor(() => expect(screen.queryByText("Conversation 1")).not.toBeInTheDocument());
    expect(screen.getByText("Conversation 2")).toBeInTheDocument();
  });

  it("N05 the back link in an open chat returns to the conversation list", async () => {
    routeGets([{ _id: "c1", title: "Conversation 1" }]);
    const user = userEvent.setup();
    renderDetail();
    await user.click(await screen.findByText("Conversation 1"));
    await screen.findByText("Stored question");
    await user.click(screen.getByLabelText("Back to conversations"));
    expect(await screen.findByRole("heading", { name: "Conversations" })).toBeInTheDocument();
    expect(screen.queryByText("Stored question")).not.toBeInTheDocument();
  });

  it("N06 shows an error when the project cannot be loaded", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiClient.get.mockRejectedValue(new Error("404"));
    renderDetail();
    expect(await screen.findByText("Failed to load project data.")).toBeInTheDocument();
  });

  it("N07 a failed chat creation shows an error notice and adds nothing", async () => {
    routeGets([]);
    apiClient.post.mockRejectedValue(new Error("500"));
    const user = userEvent.setup();
    renderDetail();
    await user.click(await screen.findByText("New conversation"));
    expect(await screen.findByText("Failed to create chat.")).toBeInTheDocument();
    expect(screen.getByText("No conversations yet")).toBeInTheDocument();
  });
});

describe("home page and routing", () => {
  it("R01 the landing page uses the Verix name and the product heading", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByText("Verix")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chat with your documents" })).toBeInTheDocument();
    expect(screen.queryByText(/OpenSlate/)).not.toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("R02 a signed-out visitor sees the landing page at the root", () => {
    authState.userId = null;
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Chat with your documents" })).toBeInTheDocument();
  });

  it("R03 a signed-out visitor to a protected route is sent to the landing page", () => {
    authState.userId = null;
    render(
      <MemoryRouter initialEntries={["/projects"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Chat with your documents" })).toBeInTheDocument();
  });

  it("R04 a signed-in user at the root lands on the projects page", async () => {
    apiClient.get.mockResolvedValue({ data: projects });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText("Quarterly report")).toBeInTheDocument();
  });

  it("R05 the chat route is registered", async () => {
    routeGets([{ _id: "c1", title: "Conversation 1" }]);
    render(
      <MemoryRouter initialEntries={["/projects/p1/chats/c1"]}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText("Stored question")).toBeInTheDocument();
  });

  it("R06 shows a loading screen while the session loads", () => {
    authState.isLoaded = false;
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
  });
});
