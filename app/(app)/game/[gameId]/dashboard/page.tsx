"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/services/api';
import { GameDetails, GameStatus, Roles } from '@/schemas';
import { useAuthStore } from '@/store/auth.store';
import { LoadingSpinner, Button, getStatusBadge } from '@/components/ui';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import { ChevronUp, ChevronDown, Flag,  Play, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { formatDateFr } from '@/utils';

interface TeamScoreProps {
  label: string;
  score: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  isLive: boolean;
  canEdit: boolean;
}

const TeamScore = ({ label, score, onIncrement, onDecrement, isLive, canEdit }: TeamScoreProps) => {
  return (
    <div className="flex flex-col items-center bg-gray-100 rounded-2xl shadow-inner dark:bg-gray-800 w-20 sm:w-24">
      <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2 dark:text-gray-300 text-center">
        {label}
      </h2>
      {canEdit && isLive && (
        <Button
          onClick={onIncrement}
          variant="outline"
          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 mb-2"
        >
          <ChevronUp className="w-4 h-4 text-green-500" />
        </Button>
      )}
      <span className="text-3xl sm:text-4xl font-extrabold dark:text-white">
        {score}
      </span>
      {canEdit && isLive && (
        <Button
          onClick={onDecrement}
          variant="outline"
          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 mt-2"
        >
          <ChevronDown className="w-4 h-4 text-red-500" />
        </Button>
      )}
    </div>
  );
};


export default function GameManagementDashboard() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles || [];
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);
  const isTeamAdmin = currentUserRoles.includes(Roles.TEAM_ADMIN);
  const redirectPath = isSystemAdmin ? "/admin/games":
                         isTenantAdmin ? "/tenant/games" :
                         isLeagueAdmin ? "/league/games" :
                         "/team/games"; // Default fallback path  

  // Use debounced values for API calls to avoid spamming the backend
  const [debouncedHomeScore] = useDebounce(homeScore, 500);
  const [debouncedAwayScore] = useDebounce(awayScore, 500);

  // Effect to fetch game data on load
  useEffect(() => {
    if (!gameId) {
      router.push('/games');
      return;
    }
    const fetchGame = async () => {
      setLoading(true);
      try {
        const response = await api.get<GameDetails>(`/games/${gameId}`);
        setGame(response.data);
        setHomeScore(response.data.homeScore || 0);
        setAwayScore(response.data.awayScore || 0);
      } catch (error) {
        toast.error('Failed to load game details.');
        console.log(error);
        router.push('/games');
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId, router]);

  const handleLiveScoreUpdate = useCallback(async (newHomeScore: number, newAwayScore: number) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await api.put(`/games/${gameId}/live-score`, {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
      });
    } catch (error) {
      toast.error('Failed to update live score.');
      console.log(error);
    } finally {
      setIsUpdating(false);
    }
  }, [gameId, isUpdating]);

  const handleStatusUpdate = async (newStatus: GameStatus) => {
    try {
      await api.put(`/games/${gameId}/status?newStatus=${newStatus}`);
      toast.success(`Game status updated to ${newStatus}.`);
      setGame(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      const errorMessage =  'Failed to update game status.';
      console.log(error);
      toast.error(errorMessage);
    }
  };

  const handleFinalScoreReport = async () => {
    try {
      await api.put(`/games/${gameId}/final-score`, {
        homeScore,
        awayScore,
      });
      toast.success('Final score reported successfully!');
      setGame(prev => prev ? { ...prev, status: GameStatus.COMPLETED } : null);
    } catch (error) {
      const errorMessage = 'Failed to report final score.';
      console.log(error);
      toast.error(errorMessage);
    }
  };

  // Effect to update live score when debounced scores change
  useEffect(() => {
    // Only send updates if the user can edit, the game exists, is IN_PROGRESS, and scores have changed
    if (!isTeamAdmin && game && game.status === GameStatus.IN_PROGRESS) {
      handleLiveScoreUpdate(debouncedHomeScore, debouncedAwayScore);
    }
  }, [debouncedHomeScore, debouncedAwayScore, game, isTeamAdmin, handleLiveScoreUpdate]);

  if (loading || !game) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner message="Chargement du match" />
      </div>
    );
  }

  const isLive = game.status === GameStatus.IN_PROGRESS;
  const canEdit = !isTeamAdmin;

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Header: Back + Status + CTA */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => router.push(redirectPath)}
          className="rounded-xl"
        >
          ← Retour
        </Button>
        <div className='flex flex-col justify-center items-center'>
          {getStatusBadge(game.status)}
          <span className='text-xs md:text-sm lg:text-base py-1 text-gray-500 dark:text-gray-300'>{formatDateFr(game.dateTime)}</span>
        </div>
        <div>
          {game.status === GameStatus.SCHEDULED && canEdit && (
            <Button
              onClick={() => handleStatusUpdate(GameStatus.IN_PROGRESS)}
              variant='primary'
            >
              <Play className="w-4 h-4 mr-2" /> Démarrer le match
            </Button>
          )}
          {game.status === GameStatus.IN_PROGRESS && canEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='danger' className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
                  <Flag className="w-4 h-4 mr-2" /> Clôturer le match
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action mettra fin au match et enregistrera le score final. Cette opération est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFinalScoreReport}>
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {game.status === GameStatus.COMPLETED && (
            <Button variant="outline" disabled className="rounded-xl">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Match terminé
            </Button>
          )}
        </div>
      </div>

      {/* Team logos + scores */}
      <div className="flex sm:flex-row items-center justify-around bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        
        {/* Home team logo */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            <Image
              src={game.homeTeam?.businessProfile?.logoAsset?.url || 'https://placehold.co/80x80/E2E8F0/1A202C?text=Home'}
              alt={game.homeTeam.name || "Équipe Domicile"}
              width={60}
              height={60}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="mt-2 font-semibold text-sm sm:text-base truncate max-w-[80px] sm:max-w-[120px] text-center">
            {game.homeTeam.shortCode || game.homeTeam.name}
          </span>
        </div>

        {/* Scores */}
        <div className="flex items-center space-x-6 sm:space-x-12 my-4 sm:my-0">
          <TeamScore
            label="Domicile"
            score={homeScore}
            onIncrement={() => setHomeScore(s => s + 1)}
            onDecrement={() => setHomeScore(s => Math.max(0, s - 1))}
            isLive={isLive}
            canEdit={canEdit}
          />
          
          <TeamScore
            label="Extérieur"
            score={awayScore}
            onIncrement={() => setAwayScore(s => s + 1)}
            onDecrement={() => setAwayScore(s => Math.max(0, s - 1))}
            isLive={isLive}
            canEdit={canEdit}
          />
        </div>

        {/* Away team logo */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            <Image
              src={game.awayTeam?.businessProfile?.logoAsset?.url || 'https://placehold.co/80x80/E2E8F0/1A202C?text=Away'}
              alt={game.awayTeam.name || "Équipe Extérieure"}
              width={60}
              height={60}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="mt-2 font-semibold text-sm sm:text-base truncate max-w-[80px] sm:max-w-[120px] text-center">
            {game.awayTeam.shortCode || game.awayTeam.name}
          </span>
        </div>
      </div>
    </div>
  );
}

