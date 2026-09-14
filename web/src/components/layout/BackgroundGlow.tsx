export const BackgroundGlow = () => (
  <>
    <div className="fixed inset-0 pointer-events-none cyan-ambient-radial -z-10" aria-hidden="true" />
    <div
      className="fixed top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10"
      aria-hidden="true"
    />
    <div
      className="fixed bottom-1/4 left-1/3 w-[500px] h-[500px] bg-secondary-container/10 rounded-full blur-[120px] pointer-events-none -z-10"
      aria-hidden="true"
    />
  </>
);