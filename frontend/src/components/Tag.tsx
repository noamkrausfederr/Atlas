interface TagProps {
  label: string;
}

export default function Tag({ label }: TagProps) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.65rem] font-medium capitalize text-slate-600">
      {label}
    </span>
  );
}
