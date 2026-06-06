interface TagProps {
  label: string;
}

export default function Tag({ label }: TagProps) {
  return (
    <span className="rounded-full bg-[rgba(47,108,114,0.08)] px-2.5 py-1 text-[0.65rem] font-semibold capitalize tracking-[0.08em] text-[var(--atlas-sea)]">
      {label}
    </span>
  );
}
