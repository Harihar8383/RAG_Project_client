import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, clerkMock, apiClientMock } from "./helpers.jsx";
import apiClient from "../utils/apiClient";
import ExamMap from "../components/projects/ExamMap";
import ProjectDetailPage from "../pages/ProjectDetailPage";
import { revisionList } from "../utils/examLabels";
import QuizModal from "../components/projects/QuizModal";

vi.mock("@clerk/clerk-react", () => clerkMock());
vi.mock("../utils/apiClient", () => apiClientMock());

const MAP = {
  _id: "m1",
  skippedFiles: ["later.pdf"],
  items: [
    { _id: "i1", topic: "Deadlock", label: "strong", matched: ["deadlock"], fileName: "os.pdf", page: 4, passage: "A deadlock is a cycle." },
    { _id: "i2", topic: "Paging", label: "none", matched: [] },
  ],
};
const renderMap = () =>
  render(
    <MemoryRouter initialEntries={["/projects/p1/exam-map"]}>
      <Routes>
        <Route path="/projects/:projectId/exam-map" element={<ExamMap />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  apiClient.get.mockResolvedValue({ data: null });
});

describe("Exam Map", () => {
  it("sends the pasted topics and shows labels, evidence, skipped files and the estimate warning", async () => {
    const user = userEvent.setup();
    apiClient.post.mockResolvedValue({ data: MAP });
    renderMap();
    await user.type(screen.getByLabelText(/Paste your syllabus/), "Deadlock");
    await user.click(screen.getByRole("button", { name: "Check my notes" }));
    expect(await screen.findByText("1 strong match · 0 check this · 1 no match found")).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith("/projects/p1/exam-map", { text: "Deadlock" }, expect.anything());
    expect(screen.getByText("os.pdf (page 4)")).toBeInTheDocument();
    expect(screen.getByText("A deadlock is a cycle.")).toBeInTheDocument();
    expect(screen.getByText(/later\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/This is an estimate/)).toBeInTheDocument();
    expect(screen.queryByText(/covered/i)).not.toBeInTheDocument();
  });

  it("saves a correction, and puts the old label back when saving fails", async () => {
    const user = userEvent.setup();
    apiClient.get.mockResolvedValue({ data: MAP });
    apiClient.patch.mockResolvedValueOnce({ data: {} }).mockRejectedValueOnce(new Error("down"));
    renderMap();
    const select = await screen.findByLabelText("Label for Paging");
    await user.selectOptions(select, "check");
    expect(apiClient.patch).toHaveBeenCalledWith("/projects/p1/exam-map/m1/items/i2", { label: "check" }, expect.anything());
    expect(screen.getByText("1 strong match · 1 check this · 0 no match found")).toBeInTheDocument();
    await user.selectOptions(select, "strong");
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save");
    await waitFor(() => expect(select).toHaveValue("check"));
  });

  it("shows the server's reason when a check is refused", async () => {
    const user = userEvent.setup();
    apiClient.post.mockRejectedValue({ response: { data: { error: "Upload a file and wait until it is Ready." } } });
    renderMap();
    await user.type(screen.getByLabelText(/Paste your syllabus/), "x1");
    await user.click(screen.getByRole("button", { name: "Check my notes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("wait until it is Ready");
  });

  it("builds the revision list from the user's labels and leaves strong matches out", () => {
    const list = revisionList([...MAP.items, { topic: "Threads", label: "strong", override: "check" }]);
    expect(list).toBe("No match found\n- Paging\n\nCheck this\n- Threads\n");
  });
});

describe("project page wiring", () => {
  it("opens the Exam Map from the project, and offers a quiz only for ready files", async () => {
    const user = userEvent.setup();
    apiClient.get.mockImplementation(async (url) => {
      if (url === "/projects/p1") return { data: { _id: "p1", name: "OS" } };
      if (url.endsWith("/documents")) {
        return {
          data: [
            { _id: "d1", name: "ready.pdf", status: "indexed", createdAt: "2026-11-01" },
            { _id: "d2", name: "bad.pdf", status: "failed", createdAt: "2026-11-01" },
          ],
        };
      }
      return { data: url.endsWith("/chats") ? [] : null };
    });
    apiClient.post.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={["/projects/p1"]}>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/exam-map" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    await user.click(await screen.findByRole("link", { name: "Exam Map" }));
    expect(await screen.findByLabelText(/Paste your syllabus/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quiz on bad.pdf" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Quiz on ready.pdf" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Writing your quiz");
    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith("/projects/p1/documents/d1/quiz", {}, expect.anything())
    );
  });
});

describe("quiz popup", () => {
  const QUIZ = {
    readChars: 50,
    totalChars: 100,
    questions: [
      { question: "First?", options: ["a1", "b1", "c1", "d1"], answer: 0, page: 2 },
      { question: "Second?", options: ["a2", "b2", "c2", "d2"], answer: 1, page: null },
    ],
  };

  it("scores the answers after all are picked and says how much of a long file was read", async () => {
    const user = userEvent.setup();
    apiClient.post.mockResolvedValue({ data: QUIZ });
    render(<QuizModal projectId="p1" document={{ _id: "d1", name: "os.pdf" }} onClose={() => {}} />);
    await user.click(await screen.findByLabelText("a1"));
    expect(screen.getByRole("button", { name: "Check answers" })).toBeDisabled();
    await user.click(screen.getByLabelText("a2"));
    await user.click(screen.getByRole("button", { name: "Check answers" }));
    expect(screen.getByText("You scored 1 of 2.")).toBeInTheDocument();
    expect(screen.getByText("Not correct. Answer: b2")).toBeInTheDocument();
    expect(screen.getByText(/about 50% of its text/)).toBeInTheDocument();
  });

  it("shows the server's reason on failure and closes with Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    apiClient.post.mockRejectedValue({ response: { data: { error: "The app reached today's shared answer limit." } } });
    render(<QuizModal projectId="p1" document={{ _id: "d1", name: "os.pdf" }} onClose={onClose} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("shared answer limit");
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
