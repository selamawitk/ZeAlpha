const mockOrders = [
  { id: 'ORD-0419', vendor: 'Flora & Co', status: 'In transit', due: 'May 2' },
  { id: 'ORD-0427', vendor: 'SoundWave Events', status: 'Ready', due: 'Apr 28' },
  { id: 'ORD-0391', vendor: 'Catering Plus', status: 'Delayed', due: 'May 6' },
];

const AdminOrders = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-[#121212] p-8 text-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)]">
        <h1 className="text-3xl font-semibold">Vendor Fulfillment</h1>
        <p className="mt-2 text-sm text-gray-400">Track orders and ensure every vendor milestone closes cleanly.</p>
      </section>

      <div className="overflow-hidden rounded-[2rem] bg-[#111111] shadow-lg">
        <table className="w-full border-separate border-spacing-0 text-left text-sm text-gray-200">
          <thead className="bg-[#151515] text-xs uppercase tracking-[0.2em] text-gray-400">
            <tr>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Due</th>
            </tr>
          </thead>
          <tbody>
            {mockOrders.map((order) => (
              <tr key={order.id} className="border-t border-white/10">
                <td className="px-6 py-5 font-medium text-white">{order.id}</td>
                <td className="px-6 py-5">{order.vendor}</td>
                <td className="px-6 py-5">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'Delayed' ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-gray-400">{order.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
