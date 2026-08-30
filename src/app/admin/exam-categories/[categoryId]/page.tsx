"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

export default function EditExamCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const categoryId = params.categoryId as string;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    async function loadCategory() {
      try {
        const res = await fetch(`/api/exam-categories/${categoryId}`);
        const data = await res.json();
        if (data.success && data.data?.category) {
          const cat = data.data.category;
          setName(cat.name);
          setSlug(cat.slug);
          setDescription(cat.description || "");
          setIcon(cat.icon || "");
        } else {
          setError(data.error?.message || "Category not found");
        }
      } catch {
        setError("Failed to load category details");
      } finally {
        setIsFetching(false);
      }
    }
    loadCategory();
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/exam-categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, icon }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to update category");
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/exam-categories/${categoryId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to delete category");
        setIsLoading(false);
        return;
      }

      router.push(localizePath("/admin/exam-categories", locale));
      router.refresh();
    } catch {
      setError("An unexpected error occurred while deleting.");
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-slate-500">
        Loading category details...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href={localizePath("/admin/exam-categories", locale)}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="gap-1.5 min-h-[36px]"
        >
          <Trash2 className="h-4 w-4" /> Delete Category
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Edit Exam Category</CardTitle>
          <CardDescription>Update category details or slug identifier.</CardDescription>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              id="slug"
              label="URL Slug"
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Input
              id="icon"
              label="Emoji / Icon (Optional)"
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
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
