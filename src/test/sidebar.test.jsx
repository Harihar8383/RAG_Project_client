import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, confirmDialog, clerkMock, apiClientMock } from "./helpers.jsx";
import apiClient from "../utils/apiClient";
import KnowledgeBaseSidebar from "../components/projects/KnowledgeBaseSidebar";

vi.mock("@clerk/clerk-react", () => clerkMock());
vi.mock("../utils/apiClient", () => apiClientMock());

// A dropzone stand-in that exposes the callbacks and props the sidebar passes to UploadThing
const dropzoneProps = {};
vi.mock("../utils/uploadthing", () => ({
  UploadDropzone: (props) => {
    Object.assign(dropzoneProps, props);
    return (
      <div data-testid="dropzone">
        <button onClick={() => props.onUploadProgress(40)}>sim-progress</button>
        <button onClick={() => props.onClientUploadComplete([{ name: "a.pdf" }])}>sim-complete</button>
        <button onClick={() => props.onUploadError(new Error("File type not allowed"))}>sim-error</button>
      </div>
    );
  },
}));

const doc = (over) => ({
  _id: "d1",
  name: "report.pdf",
  status: "indexed",
  createdAt: "2026-11-01T10:00:00Z",
  ...over,
});

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
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("document list and status", () => {
  it("D01 shows the empty state and a zero count", async () => {
    apiClient.get.mockResolvedValue({ data: [] });
    renderSidebar();
    expect(await screen.findByText("No documents uploaded yet.")).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith("/projects/p1/documents", { headers: { Authorization: "Bearer test-token" } });
  });

  it("D02 shows one status label for each document state and the failure reason", async () => {
    apiClient.get.mockResolvedValue({
      data: [
        doc({ _id: "a", name: "a.pdf", status: "uploaded" }),
        doc({ _id: "b", name: "b.docx", status: "processing" }),
        doc({ _id: "c", name: "c.csv", status: "indexed" }),
        doc({ _id: "d", name: "d.txt", status: "failed", failureReason: "No readable text was found." }),
      ],
    });
    renderSidebar();
    expect(await screen.findByTestId("status-a")).toHaveTextContent("Queued");
    expect(screen.getByTestId("status-b")).toHaveTextContent("Processing");
    expect(screen.getByTestId("status-c")).toHaveTextContent("Ready");
    expect(screen.getByTestId("status-d")).toHaveTextContent("Failed");
    expect(screen.getByText("No readable text was found.")).toBeInTheDocument();
  });

  it("D03 passes the project id and the bearer token to the upload component", async () => {
    apiClient.get.mockResolvedValue({ data: [] });
    renderSidebar();
    await screen.findByTestId("dropzone");
    expect(dropzoneProps.endpoint).toBe("documentUploader");
    expect(dropzoneProps.input).toEqual({ projectId: "p1" });
    expect(dropzoneProps.content.allowedContent).toBe("PDF, DOCX, TXT or CSV files");
    expect(await dropzoneProps.headers()).toEqual({ Authorization: "Bearer test-token" });
  });

  it("D04 a failed list request shows a load error, not the empty state", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiClient.get.mockRejectedValue(new Error("down"));
    renderSidebar();
    expect(await screen.findByText(/Could not load your documents/)).toBeInTheDocument();
    expect(screen.queryByText("No documents uploaded yet.")).not.toBeInTheDocument();
  });
});

describe("polling", () => {
  it("D05 refreshes while a document is processing and stops once everything is settled", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    apiClient.get
      .mockResolvedValueOnce({ data: [doc({ status: "processing" })] })
      .mockResolvedValueOnce({ data: [doc({ status: "processing" })] })
      .mockResolvedValue({ data: [doc({ status: "indexed" })] });
    renderSidebar();

    expect(await screen.findByTestId("status-d1")).toHaveTextContent("Processing");
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(apiClient.get).toHaveBeenCalledTimes(2);

    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    await waitFor(() => expect(screen.getByTestId("status-d1")).toHaveTextContent("Ready"));
    const settledCalls = apiClient.get.mock.calls.length;
    expect(settledCalls).toBe(3);

    await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    expect(apiClient.get).toHaveBeenCalledTimes(settledCalls);
  });

  it("D06 does not poll when every document is already settled", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    apiClient.get.mockResolvedValue({ data: [doc({ status: "indexed" }), doc({ _id: "d2", status: "failed" })] });
    renderSidebar();
    await screen.findByTestId("status-d1");
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it("D07 stops polling when the sidebar unmounts", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    apiClient.get.mockResolvedValue({ data: [doc({ status: "uploaded" })] });
    const { unmount } = renderSidebar();
    await screen.findByTestId("status-d1");
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});

describe("delete and retry", () => {
  it("D08 delete opens a dialog and does nothing when cancelled", async () => {
    apiClient.get.mockResolvedValue({ data: [doc()] });
    const user = userEvent.setup();
    renderSidebar();
    await user.click(await screen.findByLabelText("Delete report.pdf"));
    expect(screen.getByRole("dialog")).toHaveAccessibleName(/report\.pdf/);
    await user.click(confirmDialog().getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(apiClient.delete).not.toHaveBeenCalled();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("D09 a confirmed delete calls the API, removes the document and shows a notice", async () => {
    apiClient.get.mockResolvedValue({ data: [doc(), doc({ _id: "d2", name: "other.pdf" })] });
    apiClient.delete.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderSidebar();
    await user.click(await screen.findByLabelText("Delete report.pdf"));
    await user.click(confirmDialog().getByRole("button", { name: "Delete document" }));
    expect(apiClient.delete).toHaveBeenCalledWith("/projects/p1/documents/d1", { headers: { Authorization: "Bearer test-token" } });
    await waitFor(() => expect(screen.queryByText("report.pdf")).not.toBeInTheDocument());
    expect(screen.getByText("other.pdf")).toBeInTheDocument();
    expect(await screen.findByText("report.pdf deleted.")).toBeInTheDocument();
  });

  it("D10 a failed delete keeps the document and shows an error", async () => {
    apiClient.get.mockResolvedValue({ data: [doc()] });
    apiClient.delete.mockRejectedValue(new Error("500"));
    const user = userEvent.setup();
    renderSidebar();
    await user.click(await screen.findByLabelText("Delete report.pdf"));
    await user.click(confirmDialog().getByRole("button", { name: "Delete document" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not delete report.pdf");
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("D11 retry appears only for failed documents and restarts processing", async () => {
    apiClient.get.mockResolvedValue({
      data: [doc({ _id: "ok", name: "ok.pdf" }), doc({ _id: "bad", name: "bad.pdf", status: "failed", failureReason: "Embedding failed." })],
    });
    apiClient.post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderSidebar();
    await screen.findByTestId("status-bad");
    expect(screen.queryByLabelText("Retry ok.pdf")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Retry bad.pdf"));
    expect(apiClient.post).toHaveBeenCalledWith("/projects/p1/documents/bad/retry", {}, { headers: { Authorization: "Bearer test-token" } });
    await waitFor(() => expect(screen.getByTestId("status-bad")).toHaveTextContent("Processing"));
    expect(screen.queryByText("Embedding failed.")).not.toBeInTheDocument();
  });

  it("D12 a failed retry shows an error and keeps the failed state", async () => {
    apiClient.get.mockResolvedValue({ data: [doc({ status: "failed" })] });
    apiClient.post.mockRejectedValue(new Error("500"));
    const user = userEvent.setup();
    renderSidebar();
    await user.click(await screen.findByLabelText("Retry report.pdf"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not retry report.pdf");
    expect(screen.getByTestId("status-d1")).toHaveTextContent("Failed");
  });
});

describe("upload overlays", () => {
  it("D13 moves through uploading, processing and complete, then clears", async () => {
    apiClient.get.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    renderSidebar();
    await screen.findByTestId("dropzone");

    await user.click(screen.getByText("sim-progress"));
    expect(screen.getByText("Uploading...")).toBeInTheDocument();

    // Fake timers start after the first render so userEvent keeps working
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => { screen.getByText("sim-complete").click(); });
    expect(screen.getByText("Processing file...")).toBeInTheDocument();

    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByText("Upload Complete!")).toBeInTheDocument();
    // The list is fetched again after an upload
    expect(apiClient.get.mock.calls.length).toBeGreaterThanOrEqual(2);

    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(screen.queryByText("Upload Complete!")).not.toBeInTheDocument();
  });

  it("D14 an upload error shows a message in the page and clears the overlay", async () => {
    apiClient.get.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    renderSidebar();
    await screen.findByTestId("dropzone");
    await user.click(screen.getByText("sim-progress"));
    await user.click(screen.getByText("sim-error"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Upload failed. File type not allowed");
    expect(screen.queryByText("Uploading...")).not.toBeInTheDocument();
  });

  it("D16 closing the sidebar during the upload overlay cancels its timers", async () => {
    apiClient.get.mockResolvedValue({ data: [] });
    const { unmount } = renderSidebar();
    await screen.findByTestId("dropzone");
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => { screen.getByText("sim-complete").click(); });
    expect(screen.getByText("Processing file...")).toBeInTheDocument();
    const callsBefore = apiClient.get.mock.calls.length;

    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(apiClient.get).toHaveBeenCalledTimes(callsBefore);
  });

  it("D15 the document count matches the list", async () => {
    apiClient.get.mockResolvedValue({ data: [doc(), doc({ _id: "d2", name: "b.pdf" })] });
    renderSidebar();
    const heading = await screen.findByText("Sources");
    await waitFor(() => expect(within(heading.parentElement).getByText("2")).toBeInTheDocument());
  });
});
