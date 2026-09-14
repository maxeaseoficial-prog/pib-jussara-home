import { createFileRoute } from "@tanstack/react-router";
import { AdminLogin } from "@/admin/AdminLogin";
import { AdminDenied, AdminChecking, AdminVerificationError } from "@/admin/AdminAccessState";
import { AdminShell } from "@/admin/AdminShell";
import { useAdminAccess } from "@/admin/useAdminAccess";

export const Route = createFileRoute("/adm")({
  head: () => ({
    meta: [
      { title: "Administração — PIB Jussara" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const { status, retry } = useAdminAccess();

  if (status === "checking") return <AdminChecking />;
  if (status === "guest") return <AdminLogin />;
  if (status === "denied") return <AdminDenied />;
  if (status === "error") return <AdminVerificationError onRetry={retry} />;

  return <AdminShell />;
}
