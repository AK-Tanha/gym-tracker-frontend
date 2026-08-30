import {
  IconScale,
  IconPhoto,
  IconBell,
  IconRuler2,
  IconCalendarTime,
  IconLogout,
  IconChevronRight,
} from "@tabler/icons-react";

export default function ProfilePage() {
  return (
    <div className="px-5 pt-2">
      <div className="my-3.5 flex items-center gap-3.5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-plate-blue-bg font-display text-xl font-semibold text-[#7FB2E8]">
          AK
        </div>
        <div>
          <p className="font-display text-[19px] font-semibold text-chalk">
            AK Tanha
          </p>
          <p className="mt-0.5 text-xs text-chalk-faint">Member since Jan 2026</p>
        </div>
      </div>

      <SectionLabel>Body tracking</SectionLabel>
      <Row icon={IconScale} label="Log today's weight" chevron />
      <Row icon={IconPhoto} label="Progress photos" chevron />

      <SectionLabel>Preferences</SectionLabel>
      <Row icon={IconBell} label="Workout reminders" value="On" />
      <Row icon={IconRuler2} label="Units" value="kg" />
      <Row icon={IconCalendarTime} label="Schedule type" value="Weekday" />

      <SectionLabel>Account</SectionLabel>
      <Row icon={IconLogout} label="Sign out" />
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
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value?: string;
  chevron?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3.5">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-chalk-dim" />
        <span className="text-sm text-chalk">{label}</span>
      </div>
      {value && <span className="text-xs text-chalk-faint">{value}</span>}
      {chevron && <IconChevronRight size={16} className="text-chalk-faint" />}
    </div>
  );
}
