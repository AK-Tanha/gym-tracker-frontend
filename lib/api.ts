import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(url: string) =>
    apiFetch<T>(url, { method: "DELETE" }),
};

export const queryKeys = {
  programs: ["programs"] as const,
  program: (id: string) => ["programs", id] as const,
  activeProgram: ["programs", "active"] as const,
  profile: ["profile"] as const,
  progress: ["progress"] as const,
  loggedSets: ["logged-sets"] as const,
  adminUsers: ["admin", "users"] as const,
};

export function useApiQuery<T>(url: string, options?: Partial<UseQueryOptions<T, Error>>) {
  return useQuery<T, Error>({
    queryKey: [url],
    queryFn: () => api.get<T>(url),
    ...options,
  });
}

type MutationState = { success: true };

export function useApiMutation<TData = MutationState, TVariables = unknown>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => {
      const body = method === "DELETE" ? undefined : variables;
      return apiFetch<TData>(url, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
    ...options,
  });
}

export function useApiInvalidations() {
  const queryClient = useQueryClient();
  return {
    invalidate: (...keys: (readonly unknown[])[]) => {
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key as string[] }));
    },
  };
}
