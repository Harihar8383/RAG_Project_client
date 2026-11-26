import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { ArrowRight, Quote, ListChecks, CircleHelp, UploadCloud, Search, MessageSquareText } from "lucide-react";
import Logo from "../components/ui/Logo";
import ThemeToggle from "../components/ui/ThemeToggle";

const FEATURES = [
  {
    icon: Quote,
    title: "Answers that cite their pages",
    text: "Each answer is written from your files only and marks every claim with a label such as S1, naming the file and page.",
  },
  {
    icon: ListChecks,
    title: "Exam Map",
    text: "Paste a syllabus or past questions. See which topics your notes match well, which to check, and which seem missing.",
  },
  {
    icon: CircleHelp,
    title: "Quick quiz",
    text: "Five multiple-choice questions from one file, each with the page to read if you get it wrong.",
  },
];

const STEPS = [
  { icon: UploadCloud, title: "Upload", text: "Add PDF, Word, text or CSV files to a project." },
  { icon: Search, title: "Index", text: "Each file is split into passages that can be searched by meaning." },
  { icon: MessageSquareText, title: "Ask", text: "Ask in plain language and read the answer with its sources." },
];

function ExampleAnswer() {
  return (
    <figure className="clay w-full max-w-md rounded-3xl p-6 text-left" aria-label="Example question and answer">
      <p className="ml-auto w-fit rounded-2xl rounded-br-md fill-accent px-4 py-2.5 text-sm font-medium">
        How many days is the refund window?
      </p>
      <div className="mt-4 flex gap-3">
        <Logo showText={false} size={30} className="shrink-0 self-start" />
        <div className="min-w-0 flex-1 text-sm text-gray-200">
          <p>The refund window is 30 days from delivery [S1].</p>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-gray-500">Source</p>
          <span className="clay-inset mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-300">
            <b className="text-brand-400">S1</b> handbook.pdf, page 4
          </span>
        </div>
      </div>
    </figure>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SignInButton mode="modal">
            <button className="rounded-xl px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn-primary rounded-xl px-5 py-2 text-sm">Sign Up</button>
          </SignUpButton>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="anim-fade-up text-center lg:text-left">
            <h1 className="heading-gradient pb-1 text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
              Chat with your documents
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-400 lg:mx-0">
              Upload your notes and books, ask questions, and get answers that point to the page they came from. Then check
              your notes against the syllabus before the exam.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <SignUpButton mode="modal">
                <button className="btn-primary group flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base">
                  Get started free
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </SignUpButton>
              <a href="#how" className="btn-ghost rounded-2xl px-6 py-3.5 text-base font-medium text-gray-200">
                See how it works
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <ExampleAnswer />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Made for studying from your own notes</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="clay rounded-3xl p-7">
                <span className="icon-tile mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl">
                  <f.icon size={22} />
                </span>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-5xl scroll-mt-10 px-6 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Three steps from file to answer</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="clay rounded-3xl p-7 text-center">
                <span className="icon-tile mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                  <s.icon size={24} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">
                  {i + 1}. {s.title}
                </h3>
                <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-gray-400">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-24 pt-8">
          <div className="clay rounded-3xl px-8 py-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ask your files a question</h2>
            <p className="mx-auto mt-3 max-w-md text-gray-400">Create a project, add a document and read the first cited answer in a minute.</p>
            <SignUpButton mode="modal">
              <button className="btn-primary mt-8 rounded-2xl px-8 py-3.5">Create your first project</button>
            </SignUpButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-6 py-8 text-center text-xs text-gray-500">
        Answers are written by Google Gemini from the passages your question matches, so keep sensitive files out.
      </footer>
    </div>
  );
}
