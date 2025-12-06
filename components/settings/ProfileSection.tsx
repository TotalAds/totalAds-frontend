"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/utils/api/apiClient";
import { IconCheck, IconLoader } from "@tabler/icons-react";

interface ProfileData {
  email: string;
  firstName?: string;
  lastName?: string;
  companyAddress?: string;
  companyZipcode?: string;
  companyCity?: string;
  companyCountry?: string;
}

const ProfileSection = () => {
  const { state } = useAuthContext();
  const { user } = state;

  const [profileData, setProfileData] = useState<ProfileData>({
    email: user?.email || "",
    firstName: "",
    lastName: "",
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };
  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await apiClient.get("/settings/profile");
      const data = res?.data?.payload?.data ?? res?.data?.data ?? res?.data;
      if (data) {
        setProfileData((prev) => ({ ...prev, ...data }));
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to load profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProfile = async () => {
    if (!profileData.firstName?.trim() || !profileData.lastName?.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setIsLoadingProfile(true);
    try {
      const payload: any = { ...profileData };
      delete payload.email;
      const res = await apiClient.put("/settings/profile", payload);
      const data = res?.data?.payload?.data ?? res?.data?.data ?? res?.data;
      if (!data) {
        // Fallback: refetch
        await fetchProfile();
      } else {
        setProfileData((prev) => ({ ...prev, ...data }));
      }
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
        <p className="text-sm text-slate-500 mt-1">
          Your email is read-only. To change it, contact support.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                First Name
              </label>
              <Input
                type="text"
                name="firstName"
                value={profileData.firstName || ""}
                onChange={handleProfileChange}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Last Name
              </label>
              <Input
                type="text"
                name="lastName"
                value={profileData.lastName || ""}
                onChange={handleProfileChange}
                placeholder="Last name"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <Input
                type="email"
                name="email"
                value={profileData.email}
                disabled
                placeholder="email@example.com"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="address" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Address
              </label>
              <Input
                type="text"
                name="companyAddress"
                value={(profileData as any).companyAddress || ""}
                onChange={handleProfileChange}
                placeholder="Street, Area"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                City
              </label>
              <Input
                type="text"
                name="companyCity"
                value={(profileData as any).companyCity || ""}
                onChange={handleProfileChange}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Zip / Postal Code
              </label>
              <Input
                type="text"
                name="companyZipcode"
                value={(profileData as any).companyZipcode || ""}
                onChange={handleProfileChange}
                placeholder="Zip / Postal"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Country
              </label>
              <Input
                type="text"
                name="companyCountry"
                value={(profileData as any).companyCountry || ""}
                onChange={handleProfileChange}
                placeholder="Country"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="pt-2">
        <Button
          onClick={handleUpdateProfile}
          disabled={isLoadingProfile}
          className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          {isLoadingProfile ? (
            <>
              <IconLoader className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <IconCheck className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProfileSection;
