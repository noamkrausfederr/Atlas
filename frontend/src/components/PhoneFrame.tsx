interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="mx-auto max-w-[22rem] px-2 sm:max-w-sm sm:px-4">
      <div className="relative overflow-hidden rounded-[2.75rem] border border-slate-200 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.12)]">
        <div className="flex h-11 items-center justify-center bg-slate-50">
          <div className="h-1 w-20 rounded-full bg-slate-300" />
        </div>
        <div className="px-4 pb-8 pt-4">{children}</div>
        <div className="absolute bottom-3 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-slate-300" />
      </div>
    </div>
  );
}
