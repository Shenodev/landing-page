import Link from "next/link";

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-12 text-center bg-background">
      <div className="w-16 h-16 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-primary text-3xl">search_off</span>
      </div>
      <h2 className="text-[28px] font-bold text-on-surface mb-2">Page not found</h2>
      <p className="text-[13px] text-on-surface-variant max-w-md mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center bg-primary-container hover:bg-primary text-on-primary-container text-[14px] font-medium px-6 py-3 rounded-lg font-semibold glow-button"
      >
        Back to home
      </Link>
    </div>
  );
};

export default NotFound;
