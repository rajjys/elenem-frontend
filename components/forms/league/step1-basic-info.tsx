"use client";

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { LeagueLiteResponseDto } from '@/schemas/league-schemas';
import { Gender, LeagueVisibility, TenantDetails, UserResponseDto } from '@/schemas';
import { Roles } from '@/schemas';

export default function Step1_BasicInfo() {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.roles.includes(Roles.SYSTEM_ADMIN);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { register, control, watch, setValue, getValues } = useFormContext();

  const [tenants, setTenants] = useState<TenantDetails[]>([]);
  const [parentLeagues, setParentLeagues] = useState([]);
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  
  const watchedTenantId = watch('tenantId');

  // Fetch tenants for System Admin
  useEffect(() => {
    if (isSystemAdmin) {
      const fetchTenants = async () => {
        try {
          const res = await api.get('/tenants');
          setTenants(res.data.data);
        } catch (error) {
          console.error("Failed to fetch tenants", error);
        }
      };
      fetchTenants();
    }
  }, [isSystemAdmin]);

  // Fetch leagues and users when tenantId changes (for System Admin)
  useEffect(() => {
    if (watchedTenantId) {
      // Fetch Parent Leagues for the selected tenant
      const fetchLeagues = async () => {
        try {
          const res = await api.get(`/leagues?tenantId=${watchedTenantId}`);
          setParentLeagues(res.data.data);
        } catch (error) {
          console.error("Failed to fetch leagues", error);
          setParentLeagues([]);
        }
      };
      
      // Fetch users for the selected tenant
      const fetchUsers = async () => {
        try {
          const res = await api.get(`/users?tenantId=${watchedTenantId}`);
          setUsers(res.data.data);
        } catch (error) {
          console.error("Failed to fetch users", error);
          setUsers([]);
        }
      };

      fetchLeagues();
      fetchUsers();
    }
  }, [watchedTenantId]);

  // Handle case where it's a Tenant Admin
  useEffect(() => {
    if (!isSystemAdmin && user?.tenantId) {
      // Fetch users for the current tenant
      const fetchUsers = async () => {
        try {
          const res = await api.get(`/users?tenantId=${user.tenantId}`);
          setUsers(res.data.data);
        } catch (error) {
          console.error("Failed to fetch users", error);
          setUsers([]);
        }
      };

      fetchUsers();
    }
  }, [isSystemAdmin, user]);


  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="name">League Name</Label>
        <Input id="name" {...register("name")} />
      </div>

      {/* Conditional rendering for System Admin to select tenant */}
      {isSystemAdmin && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="tenantId">Tenant</Label>
          <Select onValueChange={(value) => setValue('tenantId', value)} value={watchedTenantId || ""}>
            <SelectTrigger id="tenantId">
              <SelectValue placeholder="Select a tenant..." />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Parent League Selection */}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="parentLeagueId">Parent League (Optional)</Label>
        <Select onValueChange={(value) => setValue('parentLeagueId', value)} value={watch('parentLeagueId') || ""}>
          <SelectTrigger id="parentLeagueId">
            <SelectValue placeholder="Select a parent league..." />
          </SelectTrigger>
          <SelectContent>
            {parentLeagues.map((league: LeagueLiteResponseDto) => (
              <SelectItem key={league.id} value={league.id}>
                {league.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Division and Gender */}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="division">Division</Label>
        <Input id="division" {...register("division")} defaultValue="D1" />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="gender">Gender</Label>
        <Select onValueChange={(value) => setValue('gender', value)} value={watch('gender') || ""}>
          <SelectTrigger id="gender">
            <SelectValue placeholder="Select gender..." />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Gender).map((gender) => (
              <SelectItem key={gender} value={gender}>
                {gender}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Owner Selection */}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="ownerId">League Owner (Optional)</Label>
        <Select onValueChange={(value) => setValue('ownerId', value)} value={watch('ownerId') || ""}>
          <SelectTrigger id="ownerId">
            <SelectValue placeholder="Select a league owner..." />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="visibility">Visibility</Label>
        <Select onValueChange={(value) => setValue('visibility', value)} defaultValue={LeagueVisibility.PUBLIC} value={watch('visibility') || LeagueVisibility.PUBLIC}>
          <SelectTrigger id="visibility">
            <SelectValue placeholder="Select visibility..." />
          </SelectTrigger>
          <SelectContent>
            {Object.values(LeagueVisibility).map((vis) => (
              <SelectItem key={vis} value={vis}>
                {vis.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}