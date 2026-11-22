import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="p-4 flex justify-between items-center border-b border-gray-800">
        <Link
          to="/"
          className="bg-gradient-to-r from-cyan-500 to-blue-400 bg-clip-text text-transparent text-2xl font-extrabold"
        >
          Verix
        </Link>
        <div className="flex items-center gap-4">
          <SignInButton mode="modal">
            <button className="text-gray-300 hover:text-white transition-colors">Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-5xl font-bold mb-4">Chat with your documents</h1>
        <p className="text-lg text-gray-400 max-w-2xl">
          Upload your PDFs, Word files, spreadsheets and notes, then ask questions and get answers
          that cite the pages they came from. Sign up to get started.
        </p>
      </main>
    </div>
  );
}
