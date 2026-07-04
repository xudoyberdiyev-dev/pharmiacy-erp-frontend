import OrderApprovalTable from '../../components/admin/OrderApprovalTable';

export default function OrdersApprovalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasdiqlash</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Yetkazilgan, lekin hali tasdiqlanmagan buyurtmalar. 48 soatdan ko'p kutganlar qizil rangda ko'rsatiladi.
        </p>
      </div>
      <OrderApprovalTable overdueOnly={false} />
    </div>
  );
}
