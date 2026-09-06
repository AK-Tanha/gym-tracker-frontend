"use client";

import {
  IconUserPlus,
  IconEdit,
  IconTrash,
  IconShield,
  IconSearch,
  IconX,
  IconEye,
  IconChevronRight,
} from "@tabler/icons-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, useApiMutation } from "@/lib/api";
import { Modal } from "@/components/forms/Modal";
import AdminUserForm from "@/components/forms/AdminUserForm";

type User = {
  id: string;
  email: string;
  name: string;
  initials: string;
  units: string;
  role: string;
  memberSince: string;
};

type Stats = {
  totalUsers: number;
  superadmins: number;
  athletes: number;
  totalLoggedSets: number;
  totalPrograms: number;
};

type UserData = {
  user: Omit<User, "role"> & { role: string };
  profile: Record<string, unknown> | null;
  programs: { id: string; name: string; description?: string; workoutDays?: unknown[] }[];
  loggedSets: { id: string; exerciseName: string; date: string }[];
  bodyweight: { date: string; weight: number }[];
};

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery<{ users: User[] }>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<{ users: User[] }>("/api/superadmin/users"),
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<Stats>("/api/superadmin/stats"),
  });

  const { data: userData, isLoading: userDataLoading } = useQuery<UserData>({
    queryKey: ["admin", "user-data", viewUser?.id],
    queryFn: () =>
      api.get<UserData>(`/api/superadmin/users/${viewUser!.id}/data`),
    enabled: !!viewUser,
  });

  const createUser = useApiMutation("/api/superadmin/users", "POST");

  const users = data?.users ?? [];
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleCreate = async (input: {
    name: string;
    email: string;
    password: string;
    units: string;
    role: string;
  }) => {
    try {
      await createUser.mutateAsync(input);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setCreating(false);
      showToast(`Created ${input.name}`);
    } catch (err) {
      const msg = err instanceof Error && err.message.includes("409")
        ? "An account with this email already exists."
        : "Failed to create user.";
      showToast(msg);
    }
  };

  const handleEdit = async (input: {
    name: string;
    email: string;
    password: string;
    units: string;
    role: string;
  }) => {
    if (!editingUser) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: input.name,
      email: input.email,
      units: input.units,
      role: input.role,
    };
    if (input.password) payload.password = input.password;

    try {
      const res = await fetch(`/api/superadmin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 409) throw new Error("duplicate");
        throw new Error("failed");
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setEditingUser(null);
      showToast(`Updated ${input.name}`);
    } catch (err) {
      const msg = err instanceof Error && err.message === "duplicate"
        ? "An account with this email already exists."
        : "Failed to update user.";
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/superadmin/users/${deletingUser.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setDeletingUser(null);
      showToast(`Deleted ${deletingUser.name}`);
    } catch {
      showToast("Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleRole = async (user: User) => {
    const next = user.role === "superadmin" ? "user" : "superadmin";
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (!res.ok) throw new Error("failed");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      showToast(`${user.name} is now ${next === "superadmin" ? "a superadmin" : "an athlete"}`);
    } catch {
      showToast("Failed to change role.");
    }
  };

  const workoutDates = userData?.loggedSets
    ? [...new Set(userData.loggedSets.map((s) => s.date))].length
    : 0;

  return (
    <div className="px-5 pt-2">
      <div className="my-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-plate-red">
            <IconShield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-chalk">Guardian Panel</h1>
            <p className="text-xs text-chalk-faint">Full oversight of the platform</p>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-lg bg-plate-green px-3 py-2 text-xs font-semibold text-white"
        >
          <IconUserPlus size={15} /> Add User
        </button>
      </div>

      {toast && (
        <div className="mb-3 rounded-[10px] bg-plate-green px-4 py-3 text-sm font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatCard label="Athletes" value={stats?.athletes ?? 0} />
        <StatCard label="Guardians" value={stats?.superadmins ?? 0} />
        <StatCard label="Workouts Logged" value={stats?.totalLoggedSets ?? 0} />
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-[10px] bg-rubber-2 px-3.5 py-2.5">
        <IconSearch size={16} className="text-chalk-faint" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-chalk placeholder:text-chalk-faint outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")}>
            <IconX size={14} className="text-chalk-faint" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-chalk-dim border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-chalk-faint">
          {search ? "No users match your search." : "No users yet."}
        </p>
      ) : (
        <div className="space-y-2 pb-4">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="card-3d flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${
                    user.role === "superadmin"
                      ? "bg-plate-red/20 text-plate-red"
                      : "bg-plate-blue-bg text-[#7FB2E8]"
                  }`}
                >
                  {user.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-chalk">{user.name}</p>
                  <p className="truncate text-xs text-chalk-faint">{user.email}</p>
                  {user.role === "superadmin" && (
                    <span className="mt-0.5 inline-block rounded bg-plate-red/20 px-1.5 py-0.5 text-[10px] font-semibold text-plate-red">
                      GUARDIAN
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setViewUser(user)}
                  className="rounded-lg p-2 text-chalk-dim transition hover:text-chalk"
                  title="View data"
                >
                  <IconEye size={16} />
                </button>
                <button
                  onClick={() => toggleRole(user)}
                  className="rounded-lg p-2 text-chalk-dim transition hover:text-plate-yellow"
                  title={user.role === "superadmin" ? "Make athlete" : "Make guardian"}
                >
                  <IconShield size={16} />
                </button>
                <button
                  onClick={() => setEditingUser(user)}
                  className="rounded-lg p-2 text-chalk-dim transition hover:text-chalk"
                >
                  <IconEdit size={16} />
                </button>
                <button
                  onClick={() => setDeletingUser(user)}
                  className="rounded-lg p-2 text-chalk-dim transition hover:text-plate-red"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Create User">
        <AdminUserForm
          onSubmit={handleCreate}
          submitting={createUser.isPending}
          mode="create"
        />
      </Modal>

      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit ${editingUser?.name ?? "User"}`}
      >
        {editingUser && (
          <AdminUserForm
            key={editingUser.id}
            initial={{
              name: editingUser.name,
              email: editingUser.email,
              password: "",
              units: editingUser.units,
              role: editingUser.role,
            }}
            onSubmit={handleEdit}
            submitting={saving}
            mode="edit"
          />
        )}
      </Modal>

      <Modal
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Delete User"
      >
        <p className="mb-5 text-sm text-chalk-dim">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-chalk">{deletingUser?.name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeletingUser(null)}
            className="flex-1 rounded-[10px] bg-rubber-2 px-4 py-3 text-sm font-semibold text-chalk transition active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-plate-red px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {deleting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            Delete
          </button>
        </div>
      </Modal>

      <Modal
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        title={`${viewUser?.name ?? "User"} · Oversight`}
      >
        {userDataLoading || !userData ? (
          <div className="flex items-center justify-center py-10">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-chalk-dim border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Programs" value={userData.programs.length} />
              <MiniStat label="Workouts" value={workoutDates} />
              <MiniStat label="Logs" value={userData.loggedSets.length} />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-chalk-dim">
                Programs
              </p>
              {userData.programs.length === 0 ? (
                <p className="text-xs text-chalk-faint">No programs.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {userData.programs.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-[10px] bg-rubber-2 px-3 py-2.5"
                    >
                      <p className="text-sm text-chalk">{p.name}</p>
                      <p className="text-xs text-chalk-faint">
                        {p.workoutDays?.length ?? 0} days
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-chalk-dim">
                Body weight
              </p>
              {userData.bodyweight.length === 0 ? (
                <p className="text-xs text-chalk-faint">No weight entries.</p>
              ) : (
                <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                  {userData.bodyweight
                    .slice()
                    .reverse()
                    .map((b) => (
                      <div
                        key={b.date}
                        className="flex items-center justify-between rounded-[10px] bg-rubber-2 px-3 py-2"
                      >
                        <span className="text-xs text-chalk-faint">{b.date}</span>
                        <span className="font-mono text-sm text-chalk">
                          {b.weight}
                          {userData.user.units ?? "kg"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-chalk-dim">
                Recent activity
              </p>
              {userData.loggedSets.length === 0 ? (
                <p className="text-xs text-chalk-faint">No activity yet.</p>
              ) : (
                <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                  {userData.loggedSets
                    .slice()
                    .reverse()
                    .slice(0, 20)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-[10px] bg-rubber-2 px-3 py-2"
                      >
                        <span className="truncate text-xs text-chalk">{s.exerciseName}</span>
                        <IconChevronRight size={14} className="shrink-0 text-chalk-faint" />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-3d rounded-[10px] bg-rubber px-3 py-3 text-center">
      <p className="font-mono text-xl font-bold text-chalk">{value}</p>
      <p className="mt-0.5 text-[10px] text-chalk-faint">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] bg-rubber-2 px-2 py-2.5 text-center">
      <p className="font-mono text-lg font-bold text-chalk">{value}</p>
      <p className="text-[10px] text-chalk-faint">{label}</p>
    </div>
  );
}
