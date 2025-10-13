import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <a href="/" className="text-2xl font-bold">veRix</a>
      <div>
        <SignedOut>
          <div className="flex gap-4">
            <SignInButton mode="modal" className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600" />
            <SignUpButton mode="modal" className="px-4 py-2 bg-green-500 rounded hover:bg-green-600" />
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}