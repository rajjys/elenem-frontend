"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button,
  Label,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  TextArea,
} from "@/components/ui";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { GameDetails, GameStatus, Roles } from "@/schemas";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart2,
  Loader2,
  X,
  Shield,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";

// ---------------- Schema ----------------
const createGameSchema = z
  .object({
    tenantId: z.string(),
    leagueId: z.string().min(1, "League is required."),
    homeTeamId: z.string().min(1, "Home team is required."),
    awayTeamId: z.string().min(1, "Away team is required."),
    dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Valid date/time required.",
    }),
    homeVenueId: z.string().optional(),
    homeScore: z.coerce.number().int().min(0).optional(),
    awayScore: z.coerce.number().int().min(0).optional(),
    notes: z.string().optional(),
    bannerImageUrl: z.string().url().optional().or(z.literal("")),
    highlightsUrl: z.string().url().optional().or(z.literal("")),
  })
  .refine((d) => d.homeTeamId !== d.awayTeamId, {
    path: ["awayTeamId"],
    message: "Teams must differ.",
  });

export type CreateGameFormValues = z.infer<typeof createGameSchema>;

// ---------------- Types ----------------
interface BasicDto { id: string; name: string; currentSeasonId?: string | null }
interface TeamDto extends BasicDto { shortCode?: string }
interface VenueDto extends BasicDto { id: string; name: string; address?: string }

interface GameFormProps {
  onSuccess: (game: GameDetails) => void;
  onCancel: () => void;
}

function GuardNotice({ leagueId, className = "" }: { leagueId?: string; className?: string }) {
  if (!leagueId) return null;
  return (
    <div className={`border border-amber-300 bg-amber-50 text-amber-800 rounded-xl p-4 flex items-start gap-3 ${className}`}>
      <AlertTriangle className="text-red-600" size={30} />
      <div>
        <div className="font-semibold">No current season found for this league.</div>
        <p className="text-sm mt-1">
          You must create an active season or assign an existing one as the current season before scheduling games.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <a href="/season/create" className="underline underline-offset-2">Create a new season</a>
          <a href={`/league/settings/general?ctxLeagueId=${leagueId}`} className="underline underline-offset-2">Assign current season</a>
        </div>
      </div>
    </div>
  );
}

export function GameForm({ onSuccess, onCancel }: GameFormProps) {
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles ?? [];
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);

  const [currentStep, setCurrentStep] = useState(isLeagueAdmin ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>(GameStatus.SCHEDULED); // UX-only

  const [tenants, setTenants] = useState<BasicDto[]>([]);
  const [leagues, setLeagues] = useState<BasicDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [venues, setVenues] = useState<VenueDto[]>([]);

  const [loading, setLoading] = useState({ tenants: false, leagues: false, deps: false });

  const form = useForm<CreateGameFormValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      tenantId: isTenantAdmin ? userAuth?.tenantId ?? undefined : undefined,
      leagueId: isLeagueAdmin ? userAuth?.managingLeagueId ?? undefined : "",
      dateTime: new Date().toISOString().slice(0, 16),
    },
  });
  const { handleSubmit, setValue, watch, register, trigger, formState: { errors } } = form;

  const selectedTenantId = watch("tenantId");
  const selectedLeagueId = watch("leagueId");

  const selectedLeague = useMemo(() => leagues.find(l => l.id === selectedLeagueId), [leagues, selectedLeagueId]);
  const hasCurrentSeason = !!selectedLeague?.currentSeasonId;
  // ---------------- Load Data ----------------
  useEffect(() => {
    if (isSystemAdmin) {
      setLoading((s) => ({ ...s, tenants: true }));
      (async () => {
        try {
          const res = await api.get("/tenants", { params: { pageSize: 100 } });
          setTenants(res.data.data);
        } catch {
          toast.error("Failed to load tenants");
        } finally {
          setLoading((s) => ({ ...s, tenants: false }));
        }
      })();
    }
  }, [isSystemAdmin]);

  // Load leagues for SYS/TENANT; for LEAGUE, fetch the single league (to read currentSeasonId)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading((s) => ({ ...s, leagues: true }));
        if (isLeagueAdmin && userAuth?.managingLeagueId) {
          const response = await api.get(`/leagues/${userAuth.managingLeagueId}`);
          const leagueResponse = response.data;
          setLeagues([{ id: leagueResponse.id, name: leagueResponse.name, currentSeasonId: leagueResponse.currentSeasonId }]);
          setValue("leagueId", leagueResponse.id);
          return;
        }
        if (isLeagueAdmin) return; // nothing else to load

        const params = new URLSearchParams({ 'pageSize' : '100' });
        if (isSystemAdmin && selectedTenantId) params.append('tenantId', selectedTenantId);
        if (isTenantAdmin) params.append('tenantId', userAuth?.tenantId || '');
        const res = await api.get("/leagues", { params });
        console.log(res);
        // Expect API to include currentSeasonId on each league
        setLeagues(res.data.data);
      } catch {
        toast.error("Failed to load leagues");
      } finally {
        setLoading((s) => ({ ...s, leagues: false }));
      }
    };
    load();
  }, [isSystemAdmin, isTenantAdmin, isLeagueAdmin, selectedTenantId, userAuth, setValue]);

  // Load teams & venues when league changes
  useEffect(() => {
    if (!selectedLeagueId) {
      setTeams([]); setVenues([]);
      return;
    }
    setLoading((s) => ({ ...s, deps: true }));
    (async () => {
      try {
        const [teamsRes, venuesRes] = await Promise.all([
          api.get(`/teams`, { params: { leagueId: selectedLeagueId, pageSize: 100 } }),
          []
          //api.get(`/venues`, { params: { leagueId: selectedLeagueId, pageSize: 100 } }),
        ]);
        setTeams(teamsRes.data.data);
        setVenues(venuesRes);
      } catch {
        toast.error("Failed to load teams/venues");
      } finally {
        setLoading((s) => ({ ...s, deps: false }));
      }
    })();
  }, [selectedLeagueId]);

  // ---------------- Stepper ----------------
  const steps = useMemo(() => [
    { name: "Context", icon: Shield },
    { name: "Schedule", icon: Calendar },
    { name: "Scores", icon: BarChart2 },
    { name: "Review", icon: CheckCircle },
  ], []);

  const nextStep = async () => {
    // Season guard blocks moving forward where applicable
    const seasonGuardActive = (!hasCurrentSeason) && ((currentStep === 0 && (isSystemAdmin || isTenantAdmin)) || (currentStep === 1));
    if (seasonGuardActive) {
      toast.warning("Please set a current season for the selected league before proceeding.");
      return;
    }

    let valid = true;
    if (currentStep === 0) {
      valid = await trigger(["tenantId", "leagueId"]);
    } else if (currentStep === 1) {
      valid = await trigger(["homeTeamId", "awayTeamId", "dateTime"]);
    } else if (currentStep === 2 && gameStatus === "COMPLETED") {
      valid = await trigger(["homeScore", "awayScore"]);
    }
    if (valid) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => setCurrentStep((s) => s - 1);

  // ---------------- Submit ----------------
  const onSubmit: SubmitHandler<CreateGameFormValues> = async (data) => {
    // Final guard before submit (in case of direct jump)
    if (!hasCurrentSeason) {
      toast.warning("Cannot submit without a current season set for the league.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        dateTime: new Date(data.dateTime).toISOString(),
      };
      const res = await api.post<GameDetails>("/games", payload);
      onSuccess(res.data);
    } catch(error) {
      let errorMessage = "Failed to create game.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- Step Renderers ----------------
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Context Selection</CardTitle>
              <CardDescription>Select Tenant/League context. Season is auto-managed via league.currentSeason.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isSystemAdmin && (
                <div className="space-y-2">
                  <Label>Tenant</Label>
                  <Select value={selectedTenantId ?? ""} onValueChange={(v) => setValue("tenantId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                    <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {!isLeagueAdmin && (
                <div className="space-y-2">
                  <Label>League</Label>
                  <Select value={selectedLeagueId ?? ""} onValueChange={(v) => setValue("leagueId", v)} disabled={isSystemAdmin && !selectedTenantId}>
                    <SelectTrigger><SelectValue placeholder="Select league" /></SelectTrigger>
                    <SelectContent>{leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {isLeagueAdmin && (
                <div className="space-y-2 md:col-span-2">
                  <Label>League</Label>
                  <Input value={userAuth?.managingLeague?.name ?? ""} disabled />
                </div>
              )}

              {/* Guard if no currentSeason on selected league */}
              {selectedLeagueId && !hasCurrentSeason && (
                <div className="md:col-span-2"><GuardNotice leagueId={selectedLeagueId} /></div>
              )}
            </CardContent>
          </>
        );

      case 1:
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Game Scheduling</CardTitle>
              <CardDescription>Set matchup, venue and timing.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guard shown here as well (esp. for League Admin who starts at this step) */}
              {selectedLeagueId && !hasCurrentSeason && (
                <div className="md:col-span-2"><GuardNotice leagueId={selectedLeagueId} /></div>
              )}

              <div className="space-y-2">
                <Label>Home Team</Label>
                <Select value={watch("homeTeamId") ?? ""} onValueChange={(v) => setValue("homeTeamId", v)} disabled={!selectedLeagueId || loading.deps}>
                  <SelectTrigger><SelectValue placeholder="Select home team" /></SelectTrigger>
                  <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.homeTeamId && <p className="text-xs text-red-500">{errors.homeTeamId.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label>Away Team</Label>
                <Select value={watch("awayTeamId") ?? ""} onValueChange={(v) => setValue("awayTeamId", v)} disabled={!selectedLeagueId || loading.deps}>
                  <SelectTrigger><SelectValue placeholder="Select away team" /></SelectTrigger>
                  <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.awayTeamId && <p className="text-xs text-red-500">{errors.awayTeamId.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label>Home Venue</Label>
                <Select value={watch("homeVenueId") ?? ""} onValueChange={(v) => setValue("homeVenueId", v)} disabled={!selectedLeagueId || loading.deps}>
                  <SelectTrigger><SelectValue placeholder="Select venue" /></SelectTrigger>
                  <SelectContent>{venues.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input type="datetime-local" {...register("dateTime")} />
                {errors.dateTime && <p className="text-xs text-red-500">{errors.dateTime.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label>Game Status (UX only)</Label>
                <Select value={gameStatus} onValueChange={(v) => setGameStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="POSTPONED">Postponed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <TextArea {...register("notes")} placeholder="Any notes..." />
              </div>

              <div className="space-y-2">
                <Label>Banner Image URL</Label>
                <Input {...register("bannerImageUrl")} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label>Highlights URL</Label>
                <Input {...register("highlightsUrl")} placeholder="https://youtube.com/..." />
              </div>
            </CardContent>
          </>
        );

      case 2:
        if (gameStatus !== "COMPLETED") {
          return (
            <>
              <CardHeader className="text-center">
                <CardTitle>Scores</CardTitle>
                <CardDescription>Scores appear when status is &quot;Completed&quot;.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500">Change the status to <span className="font-medium">Completed</span> to enter scores.</p>
              </CardContent>
            </>
          );
        }
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Scores</CardTitle>
              <CardDescription>Enter final scores.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Home Score</Label>
                <Input type="number" {...register("homeScore", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Away Score</Label>
                <Input type="number" {...register("awayScore", { valueAsNumber: true })} />
              </div>
            </CardContent>
          </>
        );

      default:
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Confirm before creating game.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div><strong>League:</strong> {selectedLeague?.name ?? userAuth?.managingLeague?.name}</div>
              <div><strong>Home Team:</strong> {teams.find(t => t.id === watch("homeTeamId"))?.name || "—"}</div>
              <div><strong>Away Team:</strong> {teams.find(t => t.id === watch("awayTeamId"))?.name || "—"}</div>
              <div><strong>Date/Time:</strong> {watch("dateTime")}</div>
              <div><strong>Status:</strong> {gameStatus}</div>
              <div><strong>Notes:</strong> {watch("notes") || "—"}</div>
              <div><strong>Banner:</strong> {watch("bannerImageUrl") || "—"}</div>
              <div><strong>Highlights:</strong> {watch("highlightsUrl") || "—"}</div>
              {gameStatus === "COMPLETED" && (
                <div><strong>Score:</strong> {watch("homeScore") ?? "—"} - {watch("awayScore") ?? "—"}</div>
              )}
            </CardContent>
          </>
        );
    }
  };

  const isBackVisible = currentStep > 0;
  const isNextVisible = currentStep < steps.length - 1;
  const seasonGuardActive = (!hasCurrentSeason) && ((currentStep === 0 && (isSystemAdmin || isTenantAdmin)) || (currentStep === 1));
  const disableNext = isSubmitting || loading.tenants || loading.leagues || loading.deps || seasonGuardActive;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            {/* Stepper */}
            <div className="flex justify-between items-center mb-6">
              {steps.map((s, i) => (
                <React.Fragment key={i}>
                  <div className="space-x-2">
                    <div className="flex items-center justify-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${i === currentStep ? "bg-blue-600 text-white shadow-lg" : "bg-gray-200 text-gray-500"}
                        ${i < currentStep ? "bg-green-500 text-white" : ""}`}
                      >
                        <s.icon size={20} />
                      </div>
                    </div>
                    <span className={`text-sm hidden sm:inline-block ${i === currentStep ? "text-blue-600 font-semibold" : "text-gray-500"}`}>{s.name}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-1 bg-gray-200 mx-2 rounded-full">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${i < currentStep ? "bg-blue-600" : ""}`}
                        style={{ width: i < currentStep ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {renderStep()}
          </div>

          <div className="flex items-center justify-between p-6 border-t">
            {/* Left: Cancel */}
            <Button
              type="button"
              variant="danger"
              onClick={onCancel}
              className="flex items-center space-x-2"
              disabled={isSubmitting}
            >
              <X size={16} />
              <span>Cancel</span>
            </Button>

            {/* Right: Navigation */}
            <div className="flex items-center space-x-4">
              {isBackVisible && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  className="flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </Button>
              )}

              {isNextVisible && (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center space-x-2"
                  disabled={disableNext}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </Button>
              )}

              {!isNextVisible && (
                <Button
                  type="submit"
                  disabled={isSubmitting || seasonGuardActive}
                  className="flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Create Game</span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
