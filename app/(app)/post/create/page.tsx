"use client";

import { AccessGate } from "@/app/(auth)/AccessGate";
import { PostForm } from "@/components/forms";
import { Roles } from "@/schemas";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreatePostPage() {
  const router = useRouter()
    const { user: userAuth } = useAuthStore();
    const roles = userAuth?.roles ?? [];
    const isSystemAdmin = roles.includes(Roles.SYSTEM_ADMIN);
    const isTenantAdmin = roles.includes(Roles.TENANT_ADMIN);
    const isLeagueAdmin = roles.includes(Roles.LEAGUE_ADMIN);
    const isTeamAdmin = roles.includes(Roles.TEAM_ADMIN);

  function handleSuccess() {
    toast.success(`Blog cree avec success`);
        if(isSystemAdmin){
          //router.push(`/post/dashboard?ctxTenantId=${team.tenantId}&ctxLeagueId=${team.leagueId}&ctxTeamId=${team.id}`); // Redirect to context dashboard
          router.push('/admin/posts');
        }
        else if(isTenantAdmin){
          //router.push(`/team/dashboard?ctxLeagueId=${team.leagueId}&ctxTeamId=${team.id}`)
          router.push('/tenant/posts');
        }
        else if(isLeagueAdmin){
          //router.push(`/team/dashboard?ctxTeamId=${team.id}`)
          router.push('/league/posts')
        }
        else if(isTeamAdmin){
            router.push('/team/posts')
        }
        else {
          router.push(`/posts`)///Fallback. Won't be necessary
        }
  }

  function handleCancel() {
    if(isSystemAdmin){
      router.push(`/admin/posts`); // Redirect to context dashboard
    }
    else if(isTenantAdmin){
      router.push(`/tenant/posts`)
    }
    else if(isLeagueAdmin){
      router.push(`/league/posts`)
    }
    else if(isTeamAdmin){
        router.push('/team/posts')
    }
    else {
      router.push(`/`)  ///Fallback. Won't be necessary
    }
  }

  return (
    <AccessGate allowedRoles={[Roles.SYSTEM_ADMIN, Roles.TENANT_ADMIN, Roles.LEAGUE_ADMIN, Roles.TEAM_ADMIN]}>
      <div className="container mx-auto max-w-3xl my-6">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Creer un Article</h1>
        <PostForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </AccessGate>
  );
}
