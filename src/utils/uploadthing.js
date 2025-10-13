import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

// We can't import the type from a separate JS project, 
// so we'll just use the functions without the generic type.
// This is the correct approach for this project structure.

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const UploadButton = generateUploadButton({
  url: `${apiUrl}/uploadthing`,
});

export const UploadDropzone = generateUploadDropzone({
  url: `${apiUrl}/uploadthing`,
});