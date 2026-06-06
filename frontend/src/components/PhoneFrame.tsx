interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="mx-auto max-w-[22rem] px-2 sm:max-w-sm sm:px-4">
      <div
        className="relative overflow-hidden rounded-[2.75rem] border border-[rgba(21,36,60,0.08)] bg-[linear-gradient(180deg,#fffef8_0%,#f6efe4_100%)] shadow-[0_32px_80px_rgba(15,23,42,0.16)]"
        style={{ animation: 'atlasFloat 8s ease-in-out infinite' }}
      >
        <div className="flex h-11 items-center justify-center bg-white/70">
          <div className="h-1 w-20 rounded-full bg-[rgba(21,36,60,0.18)]" />
        </div>
        <div className="px-4 pb-8 pt-4">{children}</div>
        <div className="absolute bottom-3 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-[rgba(21,36,60,0.18)]" />
      </div>
    </div>
  );
}
