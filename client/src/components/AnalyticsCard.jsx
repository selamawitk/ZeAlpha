const AnalyticsCard = ({ title, value, subtitle, percent, accent }) => {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-premium">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-secondary">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-primary-dark">{value}</p>
        </div>
        {percent !== undefined && (
          <div className={`rounded-2xl px-4 py-2 text-sm font-semibold ${accent || 'bg-primary/10 text-primary-dark'}`}>
            {percent}%
          </div>
        )}
      </div>
      {subtitle && <p className="mt-4 text-sm text-secondary">{subtitle}</p>}
      {percent !== undefined && (
        <div className="mt-5 h-2 rounded-full bg-gray-200/80">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
};

export default AnalyticsCard;
