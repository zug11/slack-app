import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserWorkspaces } from "@/services/workspace.service";

export default async function HomePage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  const workspaceList = await getUserWorkspaces(user.id);

  if (workspaceList.length > 0) {
    redirect(`/${workspaceList[0].slug}`);
  }

  // No workspaces — show create workspace page
  redirect("/create-workspace");
}
