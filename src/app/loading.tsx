export default function Loading() {
  return (
    <div className="bg-bg min-h-screen">
      <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-bg2 rounded-[8px] w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-[4/3] bg-bg2 rounded-[10px]" />
              <div className="bg-surface border border-border rounded-[10px] p-6 space-y-4">
                <div className="h-6 bg-bg2 rounded w-2/3" />
                <div className="h-4 bg-bg2 rounded w-full" />
                <div className="h-4 bg-bg2 rounded w-1/2" />
                <div className="h-10 bg-bg2 rounded w-1/3" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-surface border border-border rounded-[10px] p-6 space-y-4">
                <div className="h-5 bg-bg2 rounded w-1/3" />
                <div className="h-4 bg-bg2 rounded w-full" />
                <div className="h-4 bg-bg2 rounded w-full" />
                <div className="h-4 bg-bg2 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
