import { SearchShell } from "@/components/search-shell";

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";

  return <SearchShell initialQuery={initialQuery} />;
}

