"use client";

export function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-chalk-dim"
    >
      {children}
    </label>
  );
}

export function FieldError({ error }: { error?: string | null }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-plate-red">{error}</p>;
}

const baseField =
  "w-full rounded-[10px] bg-rubber-2 px-3.5 py-3 text-sm text-chalk placeholder:text-chalk-faint outline-none focus:ring-2 focus:ring-plate-blue";

export function TextInput({
  label,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <input className={baseField} {...props} />
      <FieldError error={error} />
    </div>
  );
}

export function TextArea({
  label,
  error,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <textarea className={`${baseField} resize-none`} {...props} />
      <FieldError error={error} />
    </div>
  );
}

export function Select({
  label,
  options,
  error,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div className={className}>
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <select className={`${baseField} appearance-none bg-rubber-2`} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-rubber-2 text-chalk">
            {o.label}
          </option>
        ))}
      </select>
      <FieldError error={error} />
    </div>
  );
}

type ButtonVariant = "primary" | "success" | "ghost" | "danger";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-plate-red text-white",
  success: "bg-plate-green text-white",
  ghost: "bg-rubber-2 text-chalk",
  danger: "bg-plate-red/10 text-plate-red",
};

export function FormButton({
  variant = "primary",
  className = "",
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
}) {
  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60 ${variantStyles[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {props.children}
    </button>
  );
}
