"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

interface CategoryOption {
  id: string;
  name: string;
}

export default function CreateExamPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [code, setCode] = useState("");
  const [authority, setAuthority] = useState("");
  const [postName, setPostName] = useState("");
  const [description, setDescription] = useState("");
  const [initialYear, setInitialYear] = useState(2026);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/exam-categories");
        const data = await res.json();
        if (data.success && data.data?.categories) {
          setCategories(data.data.categories);
          if (data.data.categories.length > 0) {
            setCategoryId(data.data.categories[0].id);
          }
        }
      } catch {
        console.error("Failed to load categories");
      }
    }
    loadCategories();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug || slug === autoSlug) setSlug(autoSlug);
    const autoCode = val.split(/\s+/).map((w) => w[0]).join("").toUpperCase();
    if (!code || code === autoCode) setCode(autoCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Create Exam
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          name,
          slug,
          code,
          authority,
          postName,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to create exam");
        setIsLoading(false);
        return;
      }

      const examId = data.data.exam.id;

      // 2. Create Initial Version
      await fetch(`/api/exams/${examId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: initialYear,
          versionName: `${initialYear} Regular`,
          status: "DRAFT",
        }),
      });

      router.push(localizePath(`/admin/exams/${examId}`, locale));
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={localizePath("/admin/exams", locale)}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
            <ArrowLeft className="h-4 w-4" /> Back to Exams
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Create Examination</CardTitle>
          <CardDescription>
            Register an official examination entity and initiate its first version cycle.
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

            <div className="w-full">
              <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1.5">
                Exam Category
              </label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="name"
              label="Exam Name"
              placeholder="e.g. UP Health Officer Examination"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="slug"
                label="URL Slug"
                placeholder="e.g. up-health-officer"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />

              <Input
                id="code"
                label="Exam Code"
                placeholder="e.g. UP-CHO"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="authority"
                label="Conducting Authority"
                placeholder="e.g. UP Medical Recruitment Board"
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                required
              />

              <Input
                id="postName"
                label="Post / Designation"
                placeholder="e.g. Community Health Officer"
                value={postName}
                onChange={(e) => setPostName(e.target.value)}
                required
              />
            </div>

            <div className="w-full">
              <label htmlFor="initialYear" className="block text-sm font-medium text-slate-700 mb-1.5">
                Initial Notification Year
              </label>
              <input
                id="initialYear"
                type="number"
                min="2000"
                max="2050"
                className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={initialYear}
                onChange={(e) => setInitialYear(parseInt(e.target.value, 10))}
                required
              />
            </div>

            <div className="w-full">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                id="description"
                className="flex w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[90px]"
                placeholder="Official details, eligibility criteria, and notification overview..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Link href="/admin/exams">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isLoading} className="font-semibold">
              Save Exam & Proceed
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
