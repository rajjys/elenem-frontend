"use client";

import React, { useState, useEffect, useRef } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Button,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import { toast } from 'sonner';
import { api } from '@/services/api';
import {
  SportType,
  Roles,
  TenantTypes,
  UserResponseDto,
  PaginatedResponseDto,
  CreateTenantSchema,
} from '@/schemas';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ListTodo,
  User,
  X,
  Trash,
  Camera,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import axios from 'axios';
import Image from 'next/image';


// Define a type for the full form data
type TenantFormValues = z.infer<typeof CreateTenantSchema>;

interface TenantFormProps {
  onSuccess: (tenantId: string) => void;
  onCancel: () => void;
}

export function TenantCreationForm({ onSuccess, onCancel }: TenantFormProps) {
  const { user: userAuth } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableOwners, setAvailableOwners] = useState<UserResponseDto[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const [bannerProgress, setBannerProgress] = useState(0);


  // Initialize react-hook-form with the full schema
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(CreateTenantSchema),
    defaultValues: {
      name: '',
      tenantCode: '',
      tenantType: TenantTypes.COMMERCIAL,
      sportType: SportType.FOOTBALL,
      country: '',
      businessProfile: {
        description: '',
        logoAssetId: null,
        bannerAssetId: null,
        physicalAddress: '',
        city: '',
        region: '',
      },
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = form;
  const currentUserRoles = userAuth?.roles || [];
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  // Watch for changes on the country field to manage the region dropdown
  const country = watch('country');

  // Fetch available owners if the user is a SYSTEM_ADMIN 
  useEffect(() => { 
    if (isSystemAdmin) { 
      const fetchOwners = async () => { 
        setOwnersLoading(true); 
        try { // The roles filter ensures we only get valid owners. 
          const params = new URLSearchParams(); 
          params.append('roles', Roles.GENERAL_USER );
          const response = await api.get<PaginatedResponseDto<UserResponseDto>>( '/users', { params } ); 
          setAvailableOwners(response.data.data); 
        } catch (error) { 
            console.error('Failed to fetch available owners:', error); 
            toast.error('Failed to load available owners.'); 
        } finally { 
          setOwnersLoading(false); 
          } 
      }; 
        fetchOwners(); } 
      }, [isSystemAdmin]);

  // Handle step navigation
  const nextStep = async () => {
    // Validate the current step's fields before moving on
    let isValid;
    if (currentStep === 0) {
      isValid = await trigger(['name', 'tenantCode', 'tenantType', 'sportType', 'country']);
    } else if (currentStep === 1) {
      isValid = await trigger(['businessProfile.city', 'businessProfile.region', 'ownerId']);
    }

    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  async function uploadAndConfirm(file: File, field: 'logo' | 'banner') {
  const setUploading = field === 'logo' ? setUploadingLogo : setUploadingBanner;
  const setProgress = field === 'logo' ? setLogoProgress : setBannerProgress;
  const setPreview = field === 'logo' ? setLogoPreview : setBannerPreview;
  const setAssetId = (id: string | null) => {
    if (field === 'logo') setValue('businessProfile.logoAssetId', id);
    else setValue('businessProfile.bannerAssetId', id);
    // validate that field
    trigger(`businessProfile.${field}AssetId`);
  };

  setUploading(true);
  setProgress(0);

  try {
    // 1) Get presign from your backend
    const presignResp = await api.post('/uploads/presign', {
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      // you could pass usageType/role here if you want
    });
    const presign = presignResp.data;
    console.log(presign);
    // support common field names (robust)
    const uploadUrl =
      presign.presignedUrl ?? presign.url ?? presign.uploadUrl ?? presign.signedUrl;
    const assetId = presign.assetId ?? presign.id;

    if (!uploadUrl) throw new Error('No upload URL returned from presign.');

    // 2) Upload to S3 (axios so we get progress)
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      onUploadProgress: (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      },
    });

    // 3) Confirm on backend (we expect backend to update MediaAsset -> ACTIVE and return it)
    if (!assetId) throw new Error('presign response missing assetId.');

    const confirmResp = await api.post('/uploads/confirm', { assetId });
    const asset = confirmResp.data;
    // 4) update form (id) + preview (url)
    setAssetId(asset.id);
    setPreview(asset.url ?? null);
    toast.success('Upload successful');
    return asset;
  } catch (err) {
    console.error('upload error', err);
    toast.error('Upload failed — please try again.');
    // clear partial state on failure
    if (field === 'logo') {
      setValue('businessProfile.logoAssetId', null);
      setLogoPreview(null);
      setLogoProgress(0);
    } else {
      setValue('businessProfile.bannerAssetId', null);
      setBannerPreview(null);
      setBannerProgress(0);
    }
    throw err;
  } finally {
    setUploading(false);
  }
}


  // Handle form submission
  const onSubmit: SubmitHandler<TenantFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // The `ownerId` logic is handled by the backend, as you mentioned.
      // If the user is GENERAL_USER, the frontend doesn't send ownerId, and the backend assigns the user as owner.
      // If the user is SYSTEM_ADMIN, the frontend sends the selected ownerId or null.
      const payload = {
        ...data,
        businessProfile: {
        ...data.businessProfile,
        name: data.name, // use tenant name as default
    },
        // The DTOs should be structured to handle the nested businessProfile object.
        // The backend should handle the creation of the business profile and linking it.
      };

      // This is a placeholder for your API call.
      const response = await api.post('/tenants/create', payload);
      toast.success(`Tenant ${data.tenantCode} created successfully!`);
      onSuccess(response.data.id);
    } catch (error) {
      let errorMessage = "Tenant creation failed. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stepper UI
  const steps = [
    { name: 'Tenant Details', icon: ListTodo },
    { name: 'Business Profile', icon: User },
    { name: 'Review & Submit', icon: CheckCircle },
  ];

  const renderStepper = () => (
    <div className="flex justify-between items-center mb-6">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className={`space-x-2`}>
            <div className='flex items-center justify-center'>
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${index === currentStep ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'}
                        ${index < currentStep ? 'bg-green-500 text-white' : ''}
                    `}
                    >
                    <step.icon size={20} />
                </div>
            </div>
            <span
              className={`text-sm hidden sm:inline-block transition-all duration-300 ${
                index === currentStep ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}
            >
              {step.name}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-1 bg-gray-200 mx-2 rounded-full">
              <div
                className={`h-full transition-all duration-300 rounded-full ${index < currentStep ? 'bg-blue-600' : ''}`}
                style={{ width: index < currentStep ? '100%' : '0' }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tenant Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Tenant Name</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>

                {/* Tenant Code */}
                <div className="space-y-2">
                  <Label htmlFor="tenantCode">Tenant Code</Label>
                  <Input id="tenantCode" {...register('tenantCode')} placeholder="e.g., ABC" />
                  {errors.tenantCode && <p className="text-red-500 text-xs">{errors.tenantCode.message}</p>}
                </div>

                {/* Tenant Type */}
                <div className="space-y-2">
                  <Label htmlFor="tenantType">Tenant Type</Label>
                  <Select onValueChange={(value) => setValue('tenantType', value as TenantTypes)} value={watch('tenantType')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tenant type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TenantTypes).map(type => (
                        <SelectItem key={type} value={type}>{type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tenantType && <p className="text-red-500 text-xs">{errors.tenantType.message}</p>}
                </div>

                {/* Sport Type */}
                <div className="space-y-2">
                  <Label htmlFor="sportType">Sport Type</Label>
                  <Select onValueChange={(value) => setValue('sportType', value as SportType)} value={watch('sportType')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SportType).map(type => (
                        <SelectItem key={type} value={type}>{type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sportType && <p className="text-red-500 text-xs">{errors.sportType.message}</p>}
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <CountryDropdown
                    value={country}
                    onChange={(val) => setValue('country', val)}
                    className="w-full h-10 px-3 py-2 text-sm border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
                </div>
              </div>
            </CardContent>
          </>
        );

      case 1:
        return (
          <>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                {/* Banner and Logo Area */}
                <div className="relative col-span-1">
                  {/* Banner */}
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {bannerPreview ? (
                      <Image src={bannerPreview} alt="Banner preview" width={736} height={480} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-400">No banner yet — upload one</div>
                    )}
                    {/* Banner overlay controls */}
                    <div className="absolute top-3 right-3 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="sr-only">Upload banner</span>
                        {/* use your icon component */}
                        <Camera className="w-5 h-5" />
                      </button>
                      {bannerPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setBannerPreview(null);
                            setValue('businessProfile.bannerAssetId', null);
                          }}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-50"
                        >
                          <span className="sr-only">Remove banner</span>
                          <Image src="/icons/trash.svg" width={8} height={8} className="w-4 h-4" alt="" />
                        </button>
                      )}
                    </div>

                    {/* Uploading banner overlay */}
                    {uploadingBanner && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="text-white">
                          Uploading... {bannerProgress}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logo overlaying the banner */}
                  <div className="absolute left-2 -bottom-10">
                    <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
                      {logoPreview ? (
                        <Image src={logoPreview} alt="Logo preview" width={80} height={80} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Logo</div>
                      )}

                      {/* Logo overlay controls */}
                      <div className="absolute bottom-1 right-1 flex space-x-2 z-50">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-50 cursor-pointer"
                        >
                          <span className="sr-only">Upload logo</span>
                          <Camera className="w-5 h-5" />
                        </button>

                        {logoPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setLogoPreview(null);
                              setValue('businessProfile.logoAssetId', null);
                            }}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-50"
                          >
                            <span className="sr-only">Remove logo</span>
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Uploading logo overlay */}
                      {uploadingLogo && (
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-full">
                          <div className="text-white text-sm">{logoProgress}%</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      await uploadAndConfirm(file, 'banner');
                    } catch { /* handled in helper */ }
                    if (bannerInputRef.current) bannerInputRef.current.value = '';
                  }}
                />
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      await uploadAndConfirm(file, 'logo');
                    } catch { /* handled in helper */ }
                    if (logoInputRef.current) logoInputRef.current.value = '';
                  }}
                />

                {/* Remaining form fields */}
                <div className="mt-14 md:ml-36 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="businessProfile.description">Description (Optional)</Label>
                    <Input id="businessProfile.description" {...register('businessProfile.description')} />
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="businessProfile.physicalAddress">Street Address (Optional)</Label>
                    <Input id="businessProfile.physicalAddress" {...register('businessProfile.physicalAddress')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessProfile.city">City (Optional)</Label>
                    <Input id="businessProfile.city" {...register('businessProfile.city')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessProfile.region">Region (Optional)</Label>
                    <RegionDropdown
                      country={country}
                      value={watch('businessProfile.region') || ''}
                      onChange={(val) => setValue('businessProfile.region', val)}
                      className="w-full h-10 px-3 py-2 text-sm border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Owner Selection (SYSTEM_ADMIN only) */}
                  {currentUserRoles.includes(Roles.SYSTEM_ADMIN) && (
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label htmlFor="ownerId">Tenant Owner (Optional)</Label>
                      <Select
                        onValueChange={(value) => setValue('ownerId', value === 'null' ? undefined : value)}
                        value={watch('ownerId') || 'null'}
                        disabled={ownersLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an owner (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">No Owner</SelectItem>
                          {availableOwners.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              {owner.username} ({owner.firstName} {owner.lastName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.ownerId && <p className="text-red-500 text-xs">{errors.ownerId.message}</p>}
                      <p className="text-gray-500 text-xs mt-1">
                        Assign an existing GENERAL_USER or SYSTEM_ADMIN as the primary owner.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </>
        );


      case 2:
        const formData = watch(); // Get all form data for review
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Please review all the information before submitting.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Tenant Details</h3>
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Code:</strong> {formData.tenantCode}</p>
                  <p><strong>Type:</strong> {formData.tenantType}</p>
                  <p><strong>Sport:</strong> {formData.sportType}</p>
                  <p><strong>Country:</strong> {formData.country}</p>
                  {currentUserRoles.includes(Roles.SYSTEM_ADMIN) && (
                    <p><strong>Owner:</strong> {formData.ownerId || 'N/A'}</p>
                  )}
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Business Profile</h3>
                  <p><strong>Description:</strong> {formData.businessProfile.description || 'N/A'}</p>
                  <p><strong>Street Address:</strong> {formData.businessProfile.physicalAddress || 'N/A'}</p>
                  <p><strong>City:</strong> {formData.businessProfile.city || 'N/A'}</p>
                  <p><strong>Region:</strong> {formData.businessProfile.region || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-4xl shadow-lg rounded-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            {renderStepper()}
            {renderStepContent()}
          </div>
          <div className="flex items-center justify-between p-6 border-t">
            {/* Left side: Cancel button */}
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

            {/* Right side: Step navigation */}
            <div className="flex items-center space-x-4">
              {currentStep > 0 && (
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

              {currentStep < steps.length - 1 && (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </Button>
              )}

              {currentStep === steps.length - 1 && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Create Tenant</span>
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