"use client";

import {
  IconScale,
  IconPhoto,
  IconBell,
  IconRuler2,
  IconCalendarTime,
  IconLogout,
  IconChevronRight,
} from "@tabler/icons-react";
import { useState } from "react";
import { useApi, api } from "@/lib/api";

type Profile = {
  name: string;
  memberSince: string;
  initials: string;
  reminders: boolean;
  units: string;
  schedule: string;
};

export default function ProfilePage() {
  const { data, mutate } = useApi<Profile>("/api/profile");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const profile = data ?? {
    name: "AK Tanha",
    memberSince: "Jan 2026",
    initials: "AK",
    reminders: true,
    units: "kg",
    schedule: "Weekday",
  };

  const update = async (patch: Partial<Profile>, message?: string) => {
    const next = { ...profile, ...patch };
    mutate(next);
    try {
      await api.put("/api/profile", patch);
    } catch {
      // ignore — UI state already updated optimistically
    }
    if (message) showToast(message);
  };

  return (
    <div className="px-5 pt-2">
      <div className="my-3.5 flex items-center gap-3.5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-plate-blue-bg font-display text-xl font-semibold text-[#7FB2E8]">
          {profile.initials}
        </div>
        <div>
          <p className="font-display text-[19px] font-semibold text-chalk">
            {profile.name}
          </p>
          <p className="mt-0.5 text-xs text-chalk-faint">
            Member since {profile.memberSince}
          </p>
        </div>
      </div>

      {toast && (
        <div className="mb-3 rounded-[10px] bg-plate-green px-4 py-3 text-sm font-semibold text-white">
          {toast}
        </div>
      )}

      <SectionLabel>Body tracking</SectionLabel>
      <Row icon={IconScale} label="Log today's weight" chevron onClick={() => showToast("Opening weight logger...")} />
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
      <Row icon={IconLogout} label="Sign out" chevron onClick={() => showToast("Signed out")} />
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
      className={`mb-2 flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3.5 ${
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