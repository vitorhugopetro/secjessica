import AppShellLayout from "@/components/layout/app-shell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
