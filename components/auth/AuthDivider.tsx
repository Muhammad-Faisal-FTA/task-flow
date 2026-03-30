// components/auth/AuthDivider.tsx

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div
        className="flex-1 h-px"
        style={{ backgroundColor: "rgba(21,101,168,0.3)" }}
      />
      <span
        className="text-[12px] font-medium uppercase tracking-widest"
        style={{ color: "#546E7A" }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-px"
        style={{ backgroundColor: "rgba(21,101,168,0.3)" }}
      />
    </div>
  );
}
