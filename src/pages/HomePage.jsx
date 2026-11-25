import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { ArrowRight, FileText, FileSpreadsheet, File, Quote, ShieldCheck, Layers, UploadCloud, Cpu, MessageSquareText } from "lucide-react";
import Logo from "../components/ui/Logo";
import CountUp from "../components/ui/CountUp";
import { spotlightMove } from "../components/ui/spotlight";

const FEATURES = [
  {
    icon: Quote,
    title: "Answers that cite their pages",
    text: "Every answer carries labels such as S1 and S2 that name the file and the page the text came from.",
    tone: "from-brand-500/25 to-brand-500/0 text-brand-400",
  },
  {
    icon: ShieldCheck,
    title: "Projects stay separate",
    text: "Each question searches only your own project. The server sets that limit, not the browser. Answers are written by Google Gemini, so keep sensitive files out.",
    tone: "from-emerald-500/25 to-emerald-500/0 text-emerald-300",
  },
  {
    icon: Layers,
    title: "Four file types",
    text: "Upload PDF, Word, text and CSV files. Each one is read, split into passages and indexed for you.",
    tone: "from-violet-500/25 to-violet-500/0 text-violet-300",
  },
];

const STEPS = [
  { icon: UploadCloud, title: "Upload", text: "Drop your files into a project. A progress bar follows each upload." },
  { icon: Cpu, title: "Index", text: "Second Brain reads each file and stores its passages so they can be searched by meaning." },
  { icon: MessageSquareText, title: "Ask", text: "Ask in plain language. The answer streams in with the sources it used." },
];

function DemoChat() {
  return (
    <div className="glass anim-fade-up relative w-full max-w-md rounded-3xl p-5 text-left" style={{ animationDelay: "0.25s" }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-gray-400">Example conversation</span>
      </div>

      <div className="anim-fade-up flex justify-end" style={{ animationDelay: "0.7s" }}>
        <p className="rounded-2xl rounded-br-md bg-gradient-to-br from-brand-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white">
          How many days is the refund window?
        </p>
      </div>

      <div className="mt-3 flex gap-3">
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-brand-400">
          <Logo showText={false} size={18} />
        </span>
        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-white/[0.05] px-4 py-3 text-sm text-gray-200">
          <div className="relative h-5">
            <span
              className="absolute left-0 top-1 flex gap-1.5"
              style={{ animation: "show-then-hide 2.2s ease 1.2s both" }}
              aria-hidden="true"
            >
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
            <p className="typewriter absolute left-0 top-0" style={{ animationDelay: "3.5s" }}>
              The refund window is 30 days [S1].
            </p>
          </div>
          <div className="anim-fade-up mt-3 border-t border-white/10 pt-3" style={{ animationDelay: "5.2s" }}>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">Sources</p>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300">
              <b className="text-brand-400">S1</b> northwind-handbook.txt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-950 text-white">
      <div className="aurora" aria-hidden="true" />
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[760px]" aria-hidden="true" />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
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

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="text-center lg:text-left">
            <span className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-gray-300">
              <span className="pulse-ring h-2 w-2 rounded-full bg-emerald-400" />
              Retrieval-augmented answers from your own files
            </span>
            <h1 className="anim-fade-up mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl" style={{ animationDelay: "0.08s" }}>
              Chat with your <span className="text-gradient">documents</span>
            </h1>
            <p className="anim-fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-400 lg:mx-0" style={{ animationDelay: "0.16s" }}>
              Upload your PDFs, Word files, spreadsheets and notes, then ask questions and get answers that cite the pages
              they came from.
            </p>
            <div className="anim-fade-up mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start" style={{ animationDelay: "0.24s" }}>
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

          <div className="relative flex justify-center">
            <DemoChat />
            <span className="anim-float absolute -left-2 top-4 hidden rounded-xl border border-white/10 bg-ink-800/80 p-2.5 text-red-300 backdrop-blur sm:block">
              <FileText size={20} />
            </span>
            <span className="anim-float absolute -right-3 top-24 hidden rounded-xl border border-white/10 bg-ink-800/80 p-2.5 text-sky-300 backdrop-blur sm:block" style={{ animationDelay: "1.2s" }}>
              <File size={20} />
            </span>
            <span className="anim-float absolute -bottom-3 left-10 hidden rounded-xl border border-white/10 bg-ink-800/80 p-2.5 text-emerald-300 backdrop-blur sm:block" style={{ animationDelay: "2.4s" }}>
              <FileSpreadsheet size={20} />
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6">
          <div className="glass grid grid-cols-2 gap-6 rounded-3xl px-6 py-8 text-center md:grid-cols-4">
            {[
              { n: 768, s: "", label: "Dimensions per embedding" },
              { n: 5, s: "", label: "Sources behind each answer" },
              { n: 4, s: "", label: "File types supported" },
              { n: 32, s: " MB", label: "Largest PDF accepted" },
            ].map((x) => (
              <div key={x.label}>
                <p className="text-gradient text-4xl font-extrabold">
                  <CountUp to={x.n} suffix={x.s} />
                </p>
                <p className="mt-1 text-xs text-gray-400">{x.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Built for answers you can check</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-400">
            Second Brain finds the passages that match your question and writes the answer from those passages only.
          </p>
          <div className="stagger mt-12 grid gap-5 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <article
                key={f.title}
                style={{ "--i": i }}
                onMouseMove={spotlightMove}
                className="glass card-lift spotlight rounded-2xl p-7"
              >
                <span className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.tone}`}>
                  <f.icon size={22} />
                </span>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-5xl scroll-mt-10 px-6 pb-24">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Three steps from file to answer</h2>
          <div className="relative mt-14 grid gap-10 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent md:block" />
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center">
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-[0_10px_30px_-8px_rgba(91,124,250,0.8)]">
                  <s.icon size={24} />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-brand-400 ring-1 ring-white/10">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-gray-400">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-24">
          <div className="glass relative overflow-hidden rounded-3xl px-8 py-14 text-center">
            <div className="absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
            <h2 className="relative text-3xl font-bold tracking-tight">Ask your files a question</h2>
            <p className="relative mx-auto mt-3 max-w-md text-gray-400">Create a project, add a document and see the first cited answer in a minute.</p>
            <SignUpButton mode="modal">
              <button className="btn-primary relative mt-8 rounded-2xl px-8 py-3.5">Create your first project</button>
            </SignUpButton>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center text-xs text-gray-500">
        Verix, a personal knowledge system built with retrieval-augmented generation.
      </footer>
    </div>
  );
}
