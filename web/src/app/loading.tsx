const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-outline-variant/30 border-t-primary-container animate-spin" />
        <p className="text-[13px] leading-[20px] text-on-surface-variant">Loading ShenoDev...</p>
      </div>
    </div>
  );
};

export default Loading;
