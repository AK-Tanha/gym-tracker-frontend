"use client";

import {
  IconScale,
  IconPhoto,
  IconBell,
  IconRuler2,
  IconCalendarTime,
  IconLogout,
  IconChevronRight,
  IconUserEdit,
} from "@tabler/icons-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api, useApiMutation, queryKeys } from "@/lib/api";
import { logoutAction } from "@/app/actions/auth";
import { Modal } from "@/components/forms/Modal";
import EditProfileForm, { ProfileInput } from "@/components/forms/EditProfileForm";
import BodyWeightForm from "@/components/forms/BodyWeightForm";

type Profile = {
  name: string;
  memberSince: string;
  initials: string;
  reminders: boolean;
  units: string;
  schedule: string;
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [toast, setToast] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loggingWeight, setLoggingWeight] = useState(false);

  const authUser = session?.user;

  const { data } = useQuery<Profile>({
    queryKey: queryKeys.profile,
    queryFn: () => api.get<Profile>("/api/profile"),
    enabled: !!authUser,
  });

  const profile: Profile = data ?? {
    name: authUser?.name ?? "Athlete",
    memberSince: "Member",
    initials: (authUser?.name ?? "AT")
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
    reminders: true,
    units: authUser?.units ?? "kg",
    schedule: "Weekday",
  };

  const displayName = profile.name || authUser?.name || "Athlete";
  const displayInitials = profile.initials || displayName.slice(0, 2).toUpperCase();

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  };

  const updateProfile = useApiMutation("/api/profile", "PUT");
  const logWeight = useApiMutation<{ entries: { date: string; weight: number }[] }>(
    "/api/bodyweight",
    "POST"
  );

  const update = async (patch: Partial<Profile>, message?: string) => {
    const previous = queryClient.getQueryData<Profile>(queryKeys.profile);
    queryClient.setQueryData(queryKeys.profile, { ...profile, ...patch });
    try {
      await updateProfile.mutateAsync(patch as Record<string, unknown>);
      if (message) showToast(message);
    } catch {
      if (previous) queryClient.setQueryData(queryKeys.profile, previous);
      showToast("Update failed — reverted");
    }
  };

  const saveProfile = async (input: ProfileInput) => {
    await update({ name: input.name, initials: input.initials }, "Profile updated");
    setEditingProfile(false);
  };

  const submitWeight = async (weight: number, date: string) => {
    await logWeight.mutateAsync({ weight, date });
    queryClient.invalidateQueries({ queryKey: queryKeys.progress });
    setLoggingWeight(false);
    showToast(`Logged ${weight}${profile.units}`);
  };

  return (
    <div className="px-5 pt-2">
      <div className="my-3.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-plate-blue-bg font-display text-xl font-semibold text-[#7FB2E8]">
            {displayInitials || "AT"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[19px] font-semibold text-chalk">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-xs text-chalk-faint">
              Member since {profile.memberSince || "Unknown"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditingProfile(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-plate-blue px-3 py-2 text-xs font-semibold text-[#7FB2E8]"
        >
          <IconUserEdit size={15} /> Edit
        </button>
      </div>

      {toast && (
        <div className="mb-3 rounded-[10px] bg-plate-green px-4 py-3 text-sm font-semibold text-white">
          {toast}
        </div>
      )}

      <SectionLabel>Body tracking</SectionLabel>
      <Row icon={IconScale} label="Log today's weight" chevron onClick={() => setLoggingWeight(true)} />
      <Row icon={IconPhoto} label="Progress photos" chevron onClick={() => showToast("Opening photo gallery...")} />

      <SectionLabel>Preferences</SectionLabel>
      <Row
        icon={IconBell}
        label="Workout reminders"
        value={profile.reminders ? "On" : "Off"}
        onClick={() => update({ reminders: !profile.reminders })}
      />
      <Row
        icon={IconRuler2}
        label="Units"
        value={profile.units}
        onClick={() => update({ units: profile.units === "kg" ? "lbs" : "kg" })}
      />
      <Row
        icon={IconCalendarTime}
        label="Schedule type"
        value={profile.schedule}
        onClick={() =>
          update({ schedule: profile.schedule === "Weekday" ? "Weekend" : "Weekday" })
        }
      />

      <SectionLabel>Account</SectionLabel>
      <Row icon={IconLogout} label="Sign out" chevron onClick={() => logoutAction()} />

      <Modal open={editingProfile} onClose={() => setEditingProfile(false)} title="Edit profile">
        <EditProfileForm
          initial={{ name: profile.name, initials: profile.initials }}
          onSubmit={saveProfile}
          submitting={updateProfile.isPending}
        />
      </Modal>

      <Modal open={loggingWeight} onClose={() => setLoggingWeight(false)} title="Log body weight">
        <BodyWeightForm
          unit={profile.units as "kg" | "lbs"}
          onSubmit={submitWeight}
          submitting={logWeight.isPending}
        />
      </Modal>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 mt-5 text-[13px] font-semibold text-chalk-dim first:mt-0">
      {children}
    </p>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  chevron,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value?: string;
  chevron?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`card-3d mb-2 flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3.5 ${
        onClick ? "cursor-pointer active:bg-rubber-2" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-chalk-dim" />
        <span className="text-sm text-chalk">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs text-chalk-faint">{value}</span>}
        {chevron && <IconChevronRight size={16} className="text-chalk-faint" />}
      </div>
    </div>
  );
}
