"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

export default function CreateExamCategoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/exam-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, icon }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to create category");
        setIsLoading(false);
        return;
      }

      router.push(localizePath("/admin/exam-categories", locale));
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={localizePath("/admin/exam-categories", locale)}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Create Exam Category</CardTitle>
          <CardDescription>
            Add a top-level category such as &quot;Government Jobs&quot;, &quot;Teaching&quot;, or &quot;Medical&quot;.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              id="name"
              label="Category Name"
              placeholder="e.g. Government Jobs"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />

            <Input
              id="slug"
              label="URL Slug (lowercase letters, numbers and hyphens)"
              placeholder="e.g. government-jobs"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />

            <div className="w-full">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                id="description"
                className="flex w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                placeholder="Brief description of this examination vertical..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Input
              id="icon"
              label="Emoji / Icon Identifier (Optional)"
              placeholder="e.g. 🏛️ or GraduationCap"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Link href={localizePath("/admin/exam-categories", locale)}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isLoading} className="font-semibold">
              Save Category
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
