import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, clerkMock, apiClientMock, getToken, mockStreamFetch } from "./helpers.jsx";
import apiClient from "../utils/apiClient";
import ChatInterface from "../components/chat/ChatInterface";
import FormattedText from "../components/chat/FormattedText";
import { readEventStream } from "../utils/sse";

vi.mock("@clerk/clerk-react", () => clerkMock());
vi.mock("../utils/apiClient", () => apiClientMock());

const HISTORY_URL = "/projects/p1/chats/c1/messages";

function renderChat() {
  return render(
    <MemoryRouter initialEntries={["/projects/p1/chats/c1"]}>
      <Routes>
        <Route path="/projects/:projectId/chats/:chatId" element={<ChatInterface />} />
        <Route path="/projects/:projectId" element={<div>Conversation list page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  apiClient.get.mockResolvedValue({ data: [] });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chat history", () => {
  it("H01 shows the empty state when the conversation has no messages", async () => {
    renderChat();
    expect(await screen.findByText("Start the conversation")).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith(HISTORY_URL, { headers: { Authorization: "Bearer test-token" } });
  });

  it("H02 loads stored messages with their sources and the interrupted marker", async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { role: "user", content: "What is the refund window?" },
        {
          role: "assistant",
          content: "The window is **30 days** [S1].",
          sources: [{ label: "S1", fileName: "policy.pdf", page: 4 }],
        },
        { role: "user", content: "And for sale items?" },
        { role: "assistant", content: "Partial answer", incomplete: true, sources: [] },
      ],
    });
    renderChat();
    expect(await screen.findByText("What is the refund window?")).toBeInTheDocument();
    expect(screen.getByText("30 days").tagName).toBe("STRONG");
    expect(screen.getByText(/policy\.pdf \(page 4\)/)).toBeInTheDocument();
    expect(screen.getByText("This answer was interrupted.")).toBeInTheDocument();
  });

  it("H03 shows a message when the history cannot be loaded", async () => {
    apiClient.get.mockRejectedValue(new Error("network"));
    renderChat();
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load the conversation.");
  });

  it("H04 the back link returns to the conversation list", async () => {
    const user = userEvent.setup();
    renderChat();
    await user.click(await screen.findByLabelText("Back to conversations"));
    expect(screen.getByText("Conversation list page")).toBeInTheDocument();
  });
});

describe("chat streaming", () => {
  it("C01 streams an answer with a thinking indicator, status events, bold text and sources", async () => {
    const stream = mockStreamFetch();
    const user = userEvent.setup();
    renderChat();
    await screen.findByText("Start the conversation");

    await user.type(screen.getByLabelText("Message"), "What is the refund window?");
    await user.click(screen.getByLabelText("Send"));

    // Request shape: URL, bearer token and JSON body
    await waitFor(() => expect(stream.fetchMock).toHaveBeenCalled());
    const [url, init] = stream.fetchMock.mock.calls[0];
    expect(url).toBe(`http://api.test/api${HISTORY_URL}`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(init.body)).toEqual({ content: "What is the refund window?" });

    // The question shows at once, the input clears and the thinking indicator waits for the first chunk
    expect(screen.getByText("What is the refund window?")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("");
    expect(await screen.findByText("Thinking...")).toBeInTheDocument();
    expect(screen.getByLabelText("Stop")).toBeInTheDocument();

    stream.send({ status: "retrieving" });
    stream.send({ status: "generating" });
    stream.send({ chunk: "The window is **30 " });
    stream.send({ chunk: "days** [S1]." });
    expect(await screen.findByText("30 days")).toBeInTheDocument();
    expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();

    stream.send({ sources: [{ label: "S1", fileName: "policy.pdf", page: 4 }] });
    stream.send({ done: true });
    stream.end();

    expect(await screen.findByText(/policy\.pdf \(page 4\)/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Send")).toBeInTheDocument());
    expect(screen.queryByText("This answer was interrupted.")).not.toBeInTheDocument();
  });

  it("C02 Enter sends the message and Shift+Enter does not", async () => {
    const stream = mockStreamFetch();
    const user = userEvent.setup();
    renderChat();
    await screen.findByText("Start the conversation");
    const box = screen.getByLabelText("Message");

    await user.type(box, "first line{Shift>}{Enter}{/Shift}second line");
    expect(stream.fetchMock).not.toHaveBeenCalled();
    expect(box).toHaveValue("first line\nsecond line");

    await user.type(box, "{Enter}");
    await waitFor(() => expect(stream.fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(stream.fetchMock.mock.calls[0][1].body).content).toBe("first line\nsecond line");
  });

  it("C03 an empty or whitespace-only message cannot be sent", async () => {
    const stream = mockStreamFetch();
    const user = userEvent.setup();
    renderChat();
    await screen.findByText("Start the conversation");
    const send = screen.getByLabelText("Send");
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText("Message"), "   {Enter}");
    expect(stream.fetchMock).not.toHaveBeenCalled();
  });

  it("C04 the stop button cancels the request and marks the answer as interrupted", async () => {
    const stream = mockStreamFetch();
    const user = userEvent.setup();
    renderChat();
    await screen.findByText("Start the conversation");

    await user.type(screen.getByLabelText("Message"), "Summarise the report{Enter}");
    await waitFor(() => expect(stream.fetchMock).toHaveBeenCalled());
    stream.send({ chunk: "Half an ans" });
    expect(await screen.findByText("Half an ans")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Stop"));

    expect(stream.fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(await screen.findByText("This answer was interrupted.")).toBeInTheDocument();
    expect(screen.getByText("Half an ans")).toBeInTheDocument();
    expect(screen.getByLabelText("Send")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("C05 an error event shows the message and keeps the partial answer as interrupted", async () => {
    const stream = mockStreamFetch();
    const user = userEvent.setup();
    renderChat();
    await screen.findByText("Start the conversation");

    await user.type(screen.getByLabelText("Message"), "Question{Enter}");
    await waitFor(() => expect(stream.fetchMock).toHaveBeenCalled());
    stream.send({ chunk: "Partial" });
    stream.send({ error: "The model is unavailable." });
    stream.end();

    expect(await screen.findByRole("alert")).toHaveTextContent("The model is unavailable.");
    expect(screen.getByText("Partial")).toBeInTheDocument();
    expect(screen.getByText("This answer was interrupted.")).toBeInTheDocument();
  });

  it("C06 a rejected request shows the server message and removes the empty answer", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "Message is too long." }) });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderChat();
    await screen.findByText("Start the conversation");

    await user.type(screen.getByLabelText("Message"), "Question{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Message is too long.");
    expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Send")).toBeInTheDocument();
    // Only the user's question remains
    expect(screen.getByText("Question")).toBeInTheDocument();
    expect(screen.queryByTestId("sources")).not.toBeInTheDocument();
  });

  it("C07 a stream that closes without a done event is marked as interrupted", async () => {
    const stream = mockStreamFetch();
    const user = userEvent.setup();
    renderChat();
    await screen.findByText("Start the conversation");

    await user.type(screen.getByLabelText("Message"), "Question{Enter}");
    await waitFor(() => expect(stream.fetchMock).toHaveBeenCalled());
    stream.send({ chunk: "Cut off" });
    stream.end();

    expect(await screen.findByText("This answer was interrupted.")).toBeInTheDocument();
  });

  it("C08 events split across network chunks are still parsed", async () => {
    const stream = mockStreamFetch();
    const user = userEvent.setup();
    renderChat();
    await screen.findByText("Start the conversation");

    await user.type(screen.getByLabelText("Message"), "Question{Enter}");
    await waitFor(() => expect(stream.fetchMock).toHaveBeenCalled());
    stream.sendRaw('data: {"chunk":"Hel');
    stream.sendRaw('lo there"}\n\ndata: {"done":true}\n\n');
    stream.end();

    expect(await screen.findByText("Hello there")).toBeInTheDocument();
    expect(screen.queryByText("This answer was interrupted.")).not.toBeInTheDocument();
  });

  it("C09 a second question is blocked while an answer is streaming", async () => {
    const stream = mockStreamFetch();
    const user = userEvent.setup();
    renderChat();
    await screen.findByText("Start the conversation");

    await user.type(screen.getByLabelText("Message"), "One{Enter}");
    await waitFor(() => expect(stream.fetchMock).toHaveBeenCalledTimes(1));
    await user.type(screen.getByLabelText("Message"), "Two{Enter}");
    expect(stream.fetchMock).toHaveBeenCalledTimes(1);
    stream.send({ done: true });
    stream.end();
  });

  it("C10 the token is read for each request", async () => {
    const stream = mockStreamFetch();
    const user = userEvent.setup();
    renderChat();
    await screen.findByText("Start the conversation");
    const before = getToken.mock.calls.length;
    await user.type(screen.getByLabelText("Message"), "Question{Enter}");
    await waitFor(() => expect(stream.fetchMock).toHaveBeenCalled());
    expect(getToken.mock.calls.length).toBeGreaterThan(before);
    stream.send({ done: true });
    stream.end();
  });
});

describe("FormattedText", () => {
  it("F01 renders paragraphs, bullet lists and bold text", () => {
    const { container } = render(<FormattedText text={"Intro line\n\n* first **key** point\n- second point\nClosing"} />);
    expect(container.querySelectorAll("p")).toHaveLength(2);
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByText("key").tagName).toBe("STRONG");
  });

  it("F02 never injects HTML from the text", () => {
    const { container } = render(<FormattedText text={'<img src=x onerror="alert(1)"> and <script>alert(2)</script>'} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>alert(2)</script>");
  });

  it("F03 handles empty and missing text", () => {
    const { container } = render(<FormattedText text={undefined} />);
    expect(container.textContent).toBe("");
  });
});

describe("readEventStream", () => {
  const streamOf = (...parts) => ({
    body: new ReadableStream({
      start(c) {
        const enc = new TextEncoder();
        parts.forEach((p) => c.enqueue(enc.encode(p)));
        c.close();
      },
    }),
  });

  it("E01 delivers each event in order and ignores malformed ones", async () => {
    const events = [];
    await readEventStream(streamOf('data: {"a":1}\n\n', "data: not-json\n\n", ": comment\n\n", 'data: {"a":2}\n\n'), (e) => events.push(e));
    expect(events).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("E02 does not deliver an unfinished final event", async () => {
    const events = [];
    await readEventStream(streamOf('data: {"a":1}\n\ndata: {"a":2}'), (e) => events.push(e));
    expect(events).toEqual([{ a: 1 }]);
  });
});

describe("audit fixes", () => {
  it("A01 a rejected question goes back into the message box and leaves the list", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 429, json: async () => ({ error: "You reached today's question limit." }) })));
    renderChat();
    await screen.findByText("Start the conversation");
    await user.type(screen.getByLabelText("Message"), "Keep this text");
    await user.click(screen.getByLabelText("Send"));
    expect(await screen.findByRole("alert")).toHaveTextContent("question limit");
    expect(screen.getByLabelText("Message")).toHaveValue("Keep this text");
    expect(screen.getByText("Start the conversation")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveAttribute("maxLength", "4000");
  });

  it("A02 a grouped citation shows one badge per source", () => {
    render(<FormattedText text="Both agree [S1, S3]." />);
    expect(screen.getByTitle("Source S1")).toBeInTheDocument();
    expect(screen.getByTitle("Source S3")).toBeInTheDocument();
  });

  it("A03 opening a source shows the cited passage", async () => {
    const user = userEvent.setup();
    apiClient.get.mockResolvedValue({
      data: [{ role: "assistant", content: "A [S1].", sources: [{ label: "S1", fileName: "p.pdf", page: 2, text: "The cited passage." }] }],
    });
    renderChat();
    await user.click(await screen.findByRole("button", { name: /p\.pdf/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("The cited passage.");
  });
});
