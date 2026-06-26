"use client";

export function CardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 space-y-6 overflow-hidden animate-pulse">
      {/* IMAGE PLACEHOLDER */}
      <div className="relative w-full h-[220px] bg-white/10 rounded-2xl" />
      
      {/* TITLE PLACEHOLDER */}
      <div className="h-8 bg-white/10 rounded-lg w-3/4" />
      
      {/* DESCRIPTION PLACEHOLDER */}
      <div className="space-y-3">
        <div className="h-4 bg-white/5 rounded-lg w-full" />
        <div className="h-4 bg-white/5 rounded-lg w-5/6" />
      </div>
      
      {/* BUTTON PLACEHOLDER */}
      <div className="h-14 bg-white/10 rounded-2xl w-full" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between animate-pulse"
        >
          <div className="flex items-center gap-4 w-2/3">
            <div className="w-12 h-12 bg-white/10 rounded-xl" />
            <div className="space-y-2 w-full">
              <div className="h-5 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          </div>
          <div className="w-20 h-8 bg-white/10 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
    </div>
  );
}
