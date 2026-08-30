import { prisma } from "@/lib/prisma";
import { Bell, FileText, ExternalLink, Calendar, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsListPage() {
  const documents = await prisma.examDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      file: true,
      examVersion: {
        include: {
          exam: { include: { category: true } },
        },
      },
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Official Exam Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Global repository of uploaded notifications, corrigendums, and AI extraction logs.
          </p>
        </div>
        <Button href="/admin/exams" variant="outline" className="gap-1.5 font-semibold min-h-[44px]">
          Browse Exams
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <Bell className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Documents Uploaded</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Open an exam from the exams directory to upload its official notification PDF.
            </p>
            <div className="mt-6">
              <Button href="/admin/exams" size="sm">Go to Exams</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const job = doc.jobs[0];
            return (
              <Card key={doc.id} className="shadow-sm hover:border-slate-300 transition-all">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-900 text-base">{doc.title}</span>
                      <Badge variant="outline" className="text-xs bg-slate-50">
                        {doc.documentType}
                      </Badge>
                      {job && (
                        <Badge
                          variant={
                            job.status === "COMPLETED"
                              ? "success"
                              : job.status === "FAILED"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {job.status === "COMPLETED" ? "AI Processed" : job.status}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      Exam: <strong className="text-slate-900">{doc.examVersion.exam.name}</strong> ({doc.examVersion.versionName}) • Category: {doc.examVersion.exam.category.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span>File: {doc.file.originalName}</span>
                      <span>Size: {(Number(doc.file.fileSize) / 1024).toFixed(1)} KB</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(doc.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button href={`/admin/exams/${doc.examVersion.examId}/documents`} size="sm" variant="outline" className="gap-1.5 text-xs font-semibold min-h-[36px]">
                      <Cpu className="h-3.5 w-3.5 text-blue-600" /> Manage & AI Extract <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
