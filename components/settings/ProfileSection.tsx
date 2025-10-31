"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/utils/api/apiClient";
import { IconCheck, IconLoader } from "@tabler/icons-react";

interface ProfileData {
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  profilePicture?: string;
  billingEmail?: string;
  timezone?: string;
  isActive?: boolean;
  marketingUpdatesOptIn?: boolean;
  companyAddress?: string;
  companyZipcode?: string;
  companyCity?: string;
  companyCountry?: string;
}

const ProfileSection = () => {
  const { state } = useAuthContext();
  const { user } = state;

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || "",
    email: user?.email || "",
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
    if (!profileData.name?.trim()) {
      toast.error("Name is required");
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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-text-100 ">My Profile</h2>

      <div className="">
        <p className="text-xs text-text-200">
          Your email is read-only. To change it, contact support.
        </p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Full Name
              </label>
              <Input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                placeholder="Enter your full name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                First Name
              </label>
              <Input
                type="text"
                name="firstName"
                value={(profileData as any).firstName || ""}
                onChange={handleProfileChange}
                placeholder="First name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Last Name
              </label>
              <Input
                type="text"
                name="lastName"
                value={(profileData as any).lastName || ""}
                onChange={handleProfileChange}
                placeholder="Last name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Email Address
              </label>
              <Input
                type="email"
                name="email"
                value={profileData.email}
                disabled
                className="w-full opacity-60"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Phone Number
              </label>
              <Input
                type="text"
                name="phoneNumber"
                value={(profileData as any).phoneNumber || ""}
                onChange={handleProfileChange}
                placeholder="e.g., +1 555 000 0000"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Company
              </label>
              <Input
                type="text"
                name="company"
                value={(profileData as any).company || ""}
                onChange={handleProfileChange}
                placeholder="Company name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Job Title
              </label>
              <Input
                type="text"
                name="jobTitle"
                value={(profileData as any).jobTitle || ""}
                onChange={handleProfileChange}
                placeholder="e.g., Growth Lead"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Billing Email
              </label>
              <Input
                type="email"
                name="billingEmail"
                value={(profileData as any).billingEmail || ""}
                onChange={handleProfileChange}
                placeholder="Billing contact email"
                className="w-full"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Timezone
              </label>
              <TimezoneSelect
                value={(profileData as any).timezone || ""}
                onChange={(value) =>
                  setProfileData((prev) => ({ ...prev, timezone: value }))
                }
                placeholder="Select your timezone"
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Input
                  type="checkbox"
                  name="isActive"
                  checked={Boolean((profileData as any).isActive)}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-xs font-semibold text-text-100 uppercase tracking-wide">
                  Active
                </span>
              </label>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Input
                  type="checkbox"
                  name="marketingUpdatesOptIn"
                  checked={Boolean((profileData as any).marketingUpdatesOptIn)}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      marketingUpdatesOptIn: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-xs font-semibold text-text-100 uppercase tracking-wide">
                  Marketing Updates Opt-in
                </span>
              </label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="address" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Address
              </label>
              <Input
                type="text"
                name="companyAddress"
                value={(profileData as any).companyAddress || ""}
                onChange={handleProfileChange}
                placeholder="Street, Area"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                City
              </label>
              <Input
                type="text"
                name="companyCity"
                value={(profileData as any).companyCity || ""}
                onChange={handleProfileChange}
                placeholder="City"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Zip / Postal Code
              </label>
              <Input
                type="text"
                name="companyZipcode"
                value={(profileData as any).companyZipcode || ""}
                onChange={handleProfileChange}
                placeholder="Zip / Postal"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
                Country
              </label>
              <Input
                type="text"
                name="companyCountry"
                value={(profileData as any).companyCountry || ""}
                onChange={handleProfileChange}
                placeholder="Country"
                className="w-full"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4">
        <Button
          onClick={handleUpdateProfile}
          disabled={isLoadingProfile}
          className="w-full bg-brand-main hover:bg-brand-main/90 text-white py-3 px-4 text-sm"
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
