"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button, Label, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from "@/components/ui";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import {
  Roles,
  TeamVisibility,
  CreateTeamFormSchema,
  TeamFilterParams,
} from "@/schemas"; // <- make sure these are exported
import { CheckCircle, ChevronLeft, ChevronRight, ListTodo, Image as ImageIcon } from "lucide-react";
import axios from "axios";

type TeamFormValues = z.infer<typeof CreateTeamFormSchema>;

interface TeamCreationFormProps {
  onSuccess: (teamId: string) => void;
  onCancel: () => void;
}

interface TenantLite { id: string; name: string; }
interface LeagueLite { id: string; name: string; tenantId: string; }
interface VenueLite { id: string; name: string; }
interface UserLite { id: string; username: string; email?: string; }

export function TeamCreationForm({ onSuccess, onCancel }: TeamCreationFormProps) {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const isSystemAdmin = roles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = roles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = roles.includes(Roles.LEAGUE_ADMIN);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setSubmitting] = useState(false);

  const [tenants, setTenants] = useState<TenantLite[]>([]);
  const [leagues, setLeagues] = useState<LeagueLite[]>([]);
  const [venues, setVenues] = useState<VenueLite[]>([]);
  const [owners, setOwners] = useState<UserLite[]>([]);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(CreateTeamFormSchema),
    defaultValues: {
      name: "",
      shortCode: "",
      visibility: TeamVisibility.PUBLIC,
      businessProfile: { description: "", logoUrl: "", bannerImageUrl: "" },
      ownerId: "",
      homeVenueId: "",
      leagueId: isLeagueAdmin ? (user?.managingLeagueId ?? "") : "",
      tenantId: isTenantAdmin ? (user?.tenantId ?? "") : "",
    },
  });

  const { register, setValue, watch, handleSubmit, trigger, formState: { errors } } = form;
  const selectedTenantId = watch("tenantId");
  const selectedLeagueId = watch("leagueId");

  // Load Tenants (SYS ADMIN only, for filtering leagues)
  useEffect(() => {
    
    setVenues([]) ///placeholder. Will be removed later when venues api is ready
    if (isSystemAdmin) {
      (async () => {
        try {
          const res = await api.get<{ data: TenantLite[] }>("/tenants", { params: { pageSize: 100 } });
          setTenants(res.data.data);
        } catch {
          toast.error("Failed to load tenants");
        }
      })();
    }
  }, [isSystemAdmin]);

  // Load Leagues based on role + tenant selection
  useEffect(() => {
    const load = async () => {
      try {
        // SYS: filter leagues by selected tenant; TENANT: filter by user.tenantId; LEAGUE: skip (pre-bound)
        if (isLeagueAdmin) return;
        const params: TeamFilterParams = { pageSize: 100 };
        if (isSystemAdmin && selectedTenantId) params.tenantId = selectedTenantId;
        if (isTenantAdmin) params.tenantId = user?.tenantId;

        const res = await api.get<{ data: LeagueLite[] }>("/leagues", { params });
        setLeagues(res.data.data);
      } catch(error) {
        let errorMessage = "Team creation failed. Please try again.";
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || errorMessage;
        }
        toast.error(errorMessage);
      }
    };
    load();
  }, [isSystemAdmin, isTenantAdmin, isLeagueAdmin, selectedTenantId, user]);
/*
  // Load Venues in tenant scope (SYS uses selected tenant; others use their tenant)
  useEffect(() => {
    const load = async () => {
      try {
        const params: any = { pageSize: 100 };
        if (isSys && selectedTenantId) params.tenantId = selectedTenantId;
        if (!isSys) params.tenantId = user?.tenantId;
        const res = await api.get<{ data: VenueLite[] }>("/home-venues", { params });
        setVenues(res.data.data);
      } catch {
        // optional
      }
    };
    load();
  }, [isSys, selectedTenantId, user]);
*/

  // Load available owners: GENERAL_USERs within tenant scope
  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        params.append("roles", Roles.GENERAL_USER);
        if (isSystemAdmin && selectedTenantId) params.append("tenantId", selectedTenantId);
        if (!isSystemAdmin && user?.tenantId) params.append("tenantId", user.tenantId);
        const res = await api.get<{ data: UserLite[] }>("/users", { params });
        setOwners(res.data.data);
      } catch {
        // optional
      }
    };
    load();
  }, [isSystemAdmin, selectedTenantId, user]);

  // Stepper
  const steps = useMemo(() => ([
    { name: "Team Details", icon: ListTodo },
    { name: "Business Profile & Ownership", icon: ImageIcon },
    { name: "Review & Submit", icon: CheckCircle },
  ]), []);

  const nextStep = async () => {
    let isValid;
    if (currentStep === 0) {
      isValid = await trigger(["name", "shortCode", "leagueId"]);
    } else if (currentStep === 1) {
      isValid = await trigger([
        "businessProfile.description",
        "businessProfile.logoUrl",
        "businessProfile.bannerImageUrl",
        "ownerId",
        "homeVenueId",
      ]);
    } else {
      isValid = true;
    }
    if (isValid) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => setCurrentStep((s) => s - 1);

  const onSubmit: SubmitHandler<TeamFormValues> = async (data) => {
    setSubmitting(true);
    try {
      // Build payload exactly as TeamsService expects
      const payload = {
        name: data.name,
        shortCode: data.shortCode || undefined,
        leagueId: isLeagueAdmin ? (user?.managingLeagueId as string) : data.leagueId, // enforce role scope
        visibility: data.visibility,
        homeVenueId: data.homeVenueId || undefined,
        ownerId: data.ownerId || undefined,
        businessProfile: {
          ...data.businessProfile,
          name: data.name, // keep in sync with team name
        },
      };
      const res = await api.post("/teams", payload);
      toast.success(`Team ${data.name} created successfully`);
      onSuccess(res.data.id);
    } catch (error) {
      let errorMessage = "Team creation failed. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Renderers
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Team Details</CardTitle>
              <CardDescription>Basic information about your team.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isSystemAdmin && (
                <div className="space-y-2">
                  <Label>Tenant</Label>
                  <Select value={selectedTenantId} onValueChange={(v) => setValue("tenantId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!isLeagueAdmin && (
                <div className="space-y-2">
                  <Label>League</Label>
                  <Select value={selectedLeagueId} onValueChange={(v) => setValue("leagueId", v)} disabled={isSystemAdmin && !selectedTenantId}>
                    <SelectTrigger><SelectValue placeholder="Select league" /></SelectTrigger>
                    <SelectContent>
                      {leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.leagueId && <p className="text-xs text-red-500">{errors.leagueId.message}</p>}
                </div>
              )}

              {isLeagueAdmin && (
                <div className="space-y-2">
                  <Label>League</Label>
                  <Input value={user?.managingLeagueId ?? user?.managingLeagueId ?? ""} disabled />
                </div>
              )}

              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input {...register("name")} placeholder="e.g. Springfield Eagles" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Short Code</Label>
                <Input {...register("shortCode")} placeholder="e.g. SE" />
                {errors.shortCode && <p className="text-xs text-red-500">{errors.shortCode.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={String(watch("visibility"))}
                  onValueChange={(v) => setValue("visibility", v as unknown as TeamVisibility)}
                >
                  <SelectTrigger><SelectValue placeholder="Select visibility" /></SelectTrigger>
                  <SelectContent>
                    {Object.values(TeamVisibility).map(v => (
                      <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </>
        );

      case 1:
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Business Profile & Ownership</CardTitle>
              <CardDescription>Media, description, and optional owner/home venue.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Input {...register("businessProfile.description")} placeholder="Short description…" />
                {errors.businessProfile?.description && (
                  <p className="text-xs text-red-500">{errors.businessProfile.description.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input {...register("businessProfile.logoUrl")} placeholder="https://…" />
                {errors.businessProfile?.logoUrl && (
                  <p className="text-xs text-red-500">{errors.businessProfile.logoUrl.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Banner Image URL</Label>
                <Input {...register("businessProfile.bannerImageUrl")} placeholder="https://…" />
                {errors.businessProfile?.bannerImageUrl && (
                  <p className="text-xs text-red-500">{errors.businessProfile.bannerImageUrl.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Owner (optional)</Label>
                <Select
                  value={watch("ownerId") ?? ""}
                  onValueChange={(v) => setValue("ownerId", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">No owner</SelectItem>
                    {owners.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Home Venue (optional)</Label>
                <Select
                  value={watch("homeVenueId") ?? ""}
                  onValueChange={(v) => setValue("homeVenueId", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select home venue" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">No home venue</SelectItem>
                    {venues.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </>
        );

      default:
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Confirm the details before creating the team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div><strong>Name:</strong> {watch("name")}</div>
              <div><strong>Short Code:</strong> {watch("shortCode") || "—"}</div>
              <div><strong>Visibility:</strong> {String(watch("visibility"))}</div>
              <div><strong>League:</strong> {isLeagueAdmin ? (user?.managingLeague?.name ?? user?.managingLeagueId) : leagues.find(l => l.id === selectedLeagueId)?.name || "—"}</div>
              <div><strong>Description:</strong> {watch("businessProfile.description") || "—"}</div>
              <div><strong>Logo:</strong> {watch("businessProfile.logoUrl") || "—"}</div>
              <div><strong>Banner:</strong> {watch("businessProfile.bannerImageUrl") || "—"}</div>
              <div><strong>Owner:</strong> {owners.find(o => o.id === watch("ownerId"))?.username || "—"}</div>
              <div><strong>Home Venue:</strong> {venues.find(v => v.id === watch("homeVenueId"))?.name || "—"}</div>
            </CardContent>
          </>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            {/* simple stepper header to match your Tenant form */}
            <div className="flex justify-between items-center mb-6">
              {steps.map((s, i) => (
                <React.Fragment key={i}>
                  <div className="space-x-2">
                    <div className="flex items-center justify-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${i === currentStep ? "bg-blue-600 text-white shadow-lg" : "bg-gray-200 text-gray-500"}
                        ${i < currentStep ? "bg-green-500 text-white" : ""}`}>
                        <s.icon size={20} />
                      </div>
                    </div>
                    <span className={`text-sm hidden sm:inline-block transition-all duration-300 ${
                      i === currentStep ? "text-blue-600 font-semibold" : "text-gray-500"
                    }`}>{s.name}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-1 bg-gray-200 mx-2 rounded-full">
                      <div className={`h-full transition-all duration-300 rounded-full ${i < currentStep ? "bg-blue-600" : ""}`}
                           style={{ width: i < currentStep ? "100%" : "0" }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {renderStep()}
          </div>

          <div className="flex items-center justify-between p-6 border-t">
            <Button type="button" variant="danger" onClick={onCancel}>Cancel</Button>
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button type="button" variant="ghost" onClick={prevStep}>
                  <ChevronLeft size={16} /> Back
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next <ChevronRight size={16} />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting…" : "Create Team"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
