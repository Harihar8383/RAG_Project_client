import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, clerkMock, apiClientMock, mockStreamFetch } from "./helpers.jsx";
import apiClient from "../utils/apiClient";
import ChatInterface from "../components/chat/ChatInterface";
import FormattedText from "../components/chat/FormattedText";
import KnowledgeBaseSidebar from "../components/projects/KnowledgeBaseSidebar";
import CreateProjectModal from "../components/modals/CreateProjectModal";
import { useToast } from "../components/ui/toast-context";
import { useConfirm } from "../components/ui/confirm-context";
import { timeAgo } from "../utils/timeAgo";

vi.mock("@clerk/clerk-react", () => clerkMock());
vi.mock("../utils/apiClient", () => apiClientMock());
vi.mock("../utils/uploadthing", () => ({ UploadDropzone: () => <div data-testid="dropzone" /> }));

const doc = (over) => ({ _id: "d1", name: "report.pdf", status: "indexed", createdAt: "2026-11-01T10:00:00Z", ...over });

function renderChat() {
  return render(
    <MemoryRouter initialEntries={["/projects/p1/chats/c1"]}>
      <Routes>
        <Route path="/projects/:projectId/chats/:chatId" element={<ChatInterface />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/projects/p1"]}>
      <Routes>
        <Route path="/projects/:projectId" element={<KnowledgeBaseSidebar />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  apiClient.get.mockResolvedValue({ data: [] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("notices", () => {
  function Buttons() {
    const toast = useToast();
    return (
      <>
        <button onClick={() => toast.success("Saved it.")}>win</button>
        <button onClick={() => toast.error("Broke it.")}>lose</button>
      </>
    );
  }

  it("T01 a notice appears with the status role and disappears by itself", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Buttons />);
    fireEvent.click(screen.getByText("win"));
    expect(screen.getByRole("status")).toHaveTextContent("Saved it.");
    await act(async () => { await vi.advanceTimersByTimeAsync(4500); });
    expect(screen.queryByText("Saved it.")).not.toBeInTheDocument();
  });

  it("T02 the close button removes a notice, and at most four show at once", async () => {
    const user = userEvent.setup();
    render(<Buttons />);
    await user.click(screen.getByText("lose"));
    await user.click(screen.getByLabelText("Dismiss notification"));
    expect(screen.queryByText("Broke it.")).not.toBeInTheDocument();

    for (let i = 0; i < 6; i += 1) await user.click(screen.getByText("win"));
    expect(screen.getAllByRole("status")).toHaveLength(4);
  });
});

describe("confirmation dialog", () => {
  function Ask({ onAnswer }) {
    const confirm = useConfirm();
    return <button onClick={async () => onAnswer(await confirm({ title: "Remove it?", message: "No undo.", confirmText: "Remove" }))}>ask</button>;
  }

  it("T03 shows the title and message, and the confirm button answers true", async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<Ask onAnswer={onAnswer} />);
    await user.click(screen.getByText("ask"));
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Remove it?");
    expect(screen.getByText("No undo.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(true));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("T04 Cancel, the Escape key and a click on the backdrop each answer false", async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<Ask onAnswer={onAnswer} />);

    await user.click(screen.getByText("ask"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByText("ask"));
    await user.keyboard("{Escape}");
    await user.click(screen.getByText("ask"));
    await user.click(screen.getByRole("dialog").parentElement);

    await waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(3));
    expect(onAnswer.mock.calls.every(([answer]) => answer === false)).toBe(true);
  });
});

describe("create project popup", () => {
  it("M01 Escape closes it, and Escape is ignored while a project is being created", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<CreateProjectModal isOpen onClose={onClose} onCreateProject={() => {}} isLoading={false} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<CreateProjectModal isOpen onClose={onClose} onCreateProject={() => {}} isLoading />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Creating...")).toBeInTheDocument();
  });

  it("M02 the name field counts its characters and stops at the limit", async () => {
    const user = userEvent.setup();
    render(<CreateProjectModal isOpen onClose={() => {}} onCreateProject={() => {}} isLoading={false} />);
    expect(screen.getByText("0/60")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Project name"), "x".repeat(70));
    expect(screen.getByLabelText("Project name")).toHaveValue("x".repeat(60));
    expect(screen.getByText("60/60")).toBeInTheDocument();
  });
});

describe("create project popup, reopened", () => {
  it("M03 reopening the popup shows empty fields, not the text of the earlier project", async () => {
    const user = userEvent.setup();
    const props = { onClose: () => {}, onCreateProject: () => {}, isLoading: false };
    const { rerender } = render(<CreateProjectModal isOpen {...props} />);
    await user.type(screen.getByLabelText("Project name"), "First project");
    await user.type(screen.getByLabelText("Description (optional)"), "First description");

    rerender(<CreateProjectModal isOpen={false} {...props} />);
    expect(screen.queryByLabelText("Project name")).not.toBeInTheDocument();
    rerender(<CreateProjectModal isOpen {...props} />);
    expect(screen.getByLabelText("Project name")).toHaveValue("");
    expect(screen.getByLabelText("Description (optional)")).toHaveValue("");
  });
});

describe("chat progress, sources and shortcuts", () => {
  it("C01 shows the searching step, then the writing step, and a cursor while text streams", async () => {
    const stream = mockStreamFetch();
    const user = userEvent.setup();
    renderChat();
    await user.type(await screen.findByLabelText("Message"), "Hello?");
    await user.click(screen.getByLabelText("Send"));

    await waitFor(() => expect(stream.fetchMock).toHaveBeenCalled());
    expect(screen.getByText("Thinking...")).toBeInTheDocument();
    stream.send({ status: "retrieving" });
    expect((await screen.findAllByText("Searching your documents")).length).toBeGreaterThan(0);

    stream.send({ status: "generating" });
    expect((await screen.findAllByText("Writing the answer")).length).toBeGreaterThan(0);

    stream.send({ chunk: "Streaming now" });
    const paragraph = await screen.findByText("Streaming now");
    expect(paragraph).toHaveClass("caret");

    stream.send({ done: true });
    stream.end();
    await waitFor(() => expect(screen.queryByLabelText("Stop")).not.toBeInTheDocument());
    expect(screen.getByText("Streaming now")).not.toHaveClass("caret");
  });

  it("C02 a source chip opens a popup with the file and page, and Escape closes it", async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { role: "user", content: "Q" },
        { role: "assistant", content: "A [S1].", sources: [{ label: "S1", fileName: "policy.pdf", page: 4 }] },
      ],
    });
    const user = userEvent.setup();
    renderChat();
    await user.click(await screen.findByText(/policy\.pdf \(page 4\)/));
    const popup = screen.getByRole("dialog", { name: "Source S1" });
    expect(popup).toHaveTextContent("policy.pdf");
    expect(popup).toHaveTextContent("Page 4");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Source S1" })).not.toBeInTheDocument();
  });

  it("C03 a source without a page says it is the whole file", async () => {
    apiClient.get.mockResolvedValue({
      data: [{ role: "assistant", content: "A", sources: [{ label: "S1", fileName: "notes.txt", page: null }] }],
    });
    const user = userEvent.setup();
    renderChat();
    await user.click(await screen.findByText(/notes\.txt/));
    expect(screen.getByRole("dialog", { name: "Source S1" })).toHaveTextContent("Whole file");
  });

  it("C04 a suggestion chip fills the message box", async () => {
    const user = userEvent.setup();
    renderChat();
    await user.click(await screen.findByText("List any dates, names or numbers that matter"));
    expect(screen.getByLabelText("Message")).toHaveValue("List any dates, names or numbers that matter");
  });

  it("C05 the copy button puts the answer on the clipboard and shows a notice", async () => {
    apiClient.get.mockResolvedValue({
      data: [{ role: "assistant", content: "Copy this answer", sources: [] }],
    });
    const user = userEvent.setup();
    renderChat();
    await user.click(await screen.findByLabelText("Copy answer"));
    expect(await navigator.clipboard.readText()).toBe("Copy this answer");
    expect(await screen.findByText("Answer copied.")).toBeInTheDocument();
  });

  it("C06 a failed copy shows an error notice", async () => {
    apiClient.get.mockResolvedValue({ data: [{ role: "assistant", content: "Text", sources: [] }] });
    const user = userEvent.setup();
    renderChat();
    const button = await screen.findByLabelText("Copy answer");
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    await user.click(button);
    expect(await screen.findByText("Could not copy the answer.")).toBeInTheDocument();
  });

  it("C07 a message near the limit shows a character counter", async () => {
    const user = userEvent.setup();
    renderChat();
    const box = await screen.findByLabelText("Message");
    await user.type(box, "short");
    expect(screen.queryByText(/\/4000/)).not.toBeInTheDocument();
    fireEvent.change(box, { target: { value: "x".repeat(3600) } });
    expect(screen.getByText("3600/4000")).toBeInTheDocument();
  });
});

describe("source markers in answers", () => {
  it("F01 [S1] shows as a badge and the rest of the sentence stays text", () => {
    const { container } = render(<FormattedText text="The window is 30 days [S1] and more [S2]." />);
    const badges = container.querySelectorAll("span[title^='Source']");
    expect([...badges].map((b) => b.textContent)).toEqual(["S1", "S2"]);
    expect(container.querySelector("p").textContent).toBe("The window is 30 days S1 and more S2.");
  });
});

describe("document readiness", () => {
  it("R01 shows how many documents are ready", async () => {
    apiClient.get.mockResolvedValue({ data: [doc(), doc({ _id: "d2", name: "b.pdf", status: "processing" })] });
    renderSidebar();
    expect(await screen.findByText("1 of 2 ready")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("R02 shows no readiness bar for an empty project", async () => {
    renderSidebar();
    await screen.findByText("No documents uploaded yet.");
    expect(screen.queryByText(/ready$/)).not.toBeInTheDocument();
  });

  it("R03 a notice appears when a document finishes indexing during polling", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    apiClient.get
      .mockResolvedValueOnce({ data: [doc({ status: "processing" })] })
      .mockResolvedValue({ data: [doc({ status: "indexed" })] });
    renderSidebar();
    expect(await screen.findByTestId("status-d1")).toHaveTextContent("Processing");
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(await screen.findByText("report.pdf is ready for questions.")).toBeInTheDocument();
  });

  it("R03b several documents finishing in one poll give one notice, not one each", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const pending = [doc({ _id: "a", name: "a.pdf", status: "processing" }), doc({ _id: "b", name: "b.pdf", status: "processing" }), doc({ _id: "c", name: "c.pdf", status: "processing" })];
    apiClient.get
      .mockResolvedValueOnce({ data: pending })
      .mockResolvedValue({ data: pending.map((d) => ({ ...d, status: "indexed" })) });
    renderSidebar();
    await screen.findByTestId("status-a");
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(await screen.findByText("3 documents are ready for questions.")).toBeInTheDocument();
    expect(screen.queryByText("a.pdf is ready for questions.")).not.toBeInTheDocument();
  });

  it("R04 a notice reports a document that failed while polling", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    apiClient.get
      .mockResolvedValueOnce({ data: [doc({ status: "processing" })] })
      .mockResolvedValue({ data: [doc({ status: "failed", failureReason: "Nothing readable." })] });
    renderSidebar();
    await screen.findByTestId("status-d1");
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(await screen.findByText("report.pdf could not be indexed.")).toBeInTheDocument();
  });

  it("R05 a document that was already ready on load raises no notice", async () => {
    apiClient.get.mockResolvedValue({ data: [doc()] });
    renderSidebar();
    await screen.findByTestId("status-d1");
    expect(screen.queryByText(/is ready for questions/)).not.toBeInTheDocument();
  });

  it("R06 a pending document shows a moving bar and a settled one does not", async () => {
    apiClient.get.mockResolvedValue({ data: [doc({ status: "processing" }), doc({ _id: "d2", name: "b.pdf" })] });
    renderSidebar();
    const pending = (await screen.findByText("report.pdf")).closest("li");
    const settled = screen.getByText("b.pdf").closest("li");
    expect(pending.querySelector(".progress-indeterminate")).not.toBeNull();
    expect(settled.querySelector(".progress-indeterminate")).toBeNull();
  });
});

describe("relative time", () => {
  const now = new Date("2026-11-22T12:00:00Z").getTime();
  it("U01 describes recent times in words and older times as a date", () => {
    expect(timeAgo("2026-11-22T11:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-11-22T11:55:00Z", now)).toBe("5 min ago");
    expect(timeAgo("2026-11-22T11:00:00Z", now)).toBe("1 hour ago");
    expect(timeAgo("2026-11-22T07:00:00Z", now)).toBe("5 hours ago");
    expect(timeAgo("2026-11-20T12:00:00Z", now)).toBe("2 days ago");
    expect(timeAgo("2026-10-01T12:00:00Z", now)).toBe(new Date("2026-10-01T12:00:00Z").toLocaleDateString());
  });

  it("U02 returns an empty string for a bad date", () => {
    expect(timeAgo("not a date", now)).toBe("");
  });
});
