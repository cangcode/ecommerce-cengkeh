// src/components/Providers.tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AnnouncementModal from "./AnnouncementModal";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Membuat queryClient di dalam Client Component menggunakan useState
  // agar instance tidak dibuat ulang di setiap render.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AnnouncementModal />
    </QueryClientProvider>
  );
}
