import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { UserProvider } from "@/hooks/use-current-user";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return <UserProvider user={user}>{children}</UserProvider>;
}
