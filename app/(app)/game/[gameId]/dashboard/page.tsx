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
    <div className="flex flex-col items-center p-4 bg-gray-100 rounded-2xl shadow-inner dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2 dark:text-gray-300">
        {label}
      </h2>
      <div className="flex items-center space-x-4">
        {canEdit && (
          <Button
            onClick={onDecrement}
            variant="outline"
            className="w-10 h-10 rounded-full border-2 border-gray-300 hover:bg-gray-200 transition-colors duration-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <ChevronDown className="w-5 h-5 text-red-500" />
          </Button>
        )}
        <span className={`text-4xl font-extrabold transition-colors duration-300 dark:text-white ${isLive ? 'text-primary-600' : 'text-gray-900'}`}>
          {score}
        </span>
        {canEdit && (
          <Button
            onClick={onIncrement}
            variant="outline"
            className="w-10 h-10 rounded-full border-2 border-gray-300 hover:bg-gray-200 transition-colors duration-200 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <ChevronUp className="w-5 h-5 text-green-500" />
          </Button>
        )}
      </div>
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
  const isTeamAdmin = currentUserRoles.includes(Roles.TEAM_ADMIN);

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
        <LoadingSpinner message='Chargement du match' />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <h1 className="text-lg md:text-xl lg:text-2xl font-extrabold mb-2 text-center text-primary-600 dark:text-primary-500">
        {game.homeTeam.name} - {game.awayTeam.name}
      </h1>
      <div className="text-center mb-2">
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-300 mb-2">
            {formatDateFr(game.dateTime)}
        </p>
        {getStatusBadge(game.status)}
      </div>

      {/* Game Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-around items-center text-center space-x-4">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden dark:bg-gray-700">
              <Image
                src={game.homeTeam?.businessProfile?.logoAsset?.url || 'https://placehold.co/80x80/E2E8F0/1A202C?text=Home'}
                alt={game.homeTeam.name || 'Home Team'}
                width={60}
                height={60}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="mt-2 font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 text-ellipsis overflow-hidden whitespace-nowrap max-w-[100px] sm:max-w-full">
              {game.homeTeam.shortCode || game.homeTeam.name}
            </span>
          </div>
          <div className="flex items-center text-3xl font-bold dark:text-white">
            <span className="text-primary-600 dark:text-primary-500">{game.homeScore}</span>
            <span className="mx-4 text-gray-400">-</span>
            <span className="text-primary-600 dark:text-primary-500">{game.awayScore}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden dark:bg-gray-700">
              <Image
                src={game.awayTeam?.businessProfile?.logoAsset?.url || 'https://placehold.co/80x80/E2E8F0/1A202C?text=Away'}
                alt={game.awayTeam.name || 'Away Team'}
                className="object-cover w-full h-full"
                width={60}
                height={60}
              />
            </div>
            <span className="mt-2 font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 text-ellipsis overflow-hidden whitespace-nowrap max-w-[100px] sm:max-w-full">
              {game.awayTeam.shortCode || game.awayTeam.name}
            </span>
          </div>
        </div>
      </div>

      {/* Conditional rendering for Team Admin */}
      {isTeamAdmin ? (
        <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-900">
          <p className="text-yellow-800 dark:text-yellow-200 font-semibold text-lg">
            You have view-only access.
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-2">
            You cannot make changes to the score or game status.
          </p>
        </div>
      ) : (
        <>
          {/* Score Management */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <TeamScore
              label={game.homeTeam.shortCode || 'Home'}
              score={homeScore}
              onIncrement={() => setHomeScore(s => s + 1)}
              onDecrement={() => setHomeScore(s => Math.max(0, s - 1))}
              isLive={game.status === GameStatus.IN_PROGRESS}
              canEdit={true}
            />
            <TeamScore
              label={game.awayTeam.shortCode || 'Away'}
              score={awayScore}
              onIncrement={() => setAwayScore(s => s + 1)}
              onDecrement={() => setAwayScore(s => Math.max(0, s - 1))}
              isLive={game.status === GameStatus.IN_PROGRESS}
              canEdit={true}
            />
          </div>

          {/* Game Status Management */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 flex flex-col items-center space-y-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Game Status</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Current Status: <span className="font-semibold">{game.status}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {game.status === GameStatus.SCHEDULED && (
                <Button
                  onClick={() => handleStatusUpdate(GameStatus.IN_PROGRESS)}
                  variant="default"
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-2" /> Start Game
                </Button>
              )}

              {game.status === GameStatus.IN_PROGRESS && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="default"
                        className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
                      >
                        <Flag className="w-5 h-5 mr-2" /> Report Final Score
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will end the game and finalize the score. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFinalScoreReport}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              
              {game.status === GameStatus.COMPLETED && (
                <Button
                  variant="outline"
                  disabled
                  className="w-full border-gray-300 text-gray-400 bg-gray-100 rounded-xl"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Game Completed
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
