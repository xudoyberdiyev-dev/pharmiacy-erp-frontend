import { AlertTriangle } from 'lucide-react';
import OrderApprovalTable from '../../components/admin/OrderApprovalTable';

export default function OverdueOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Muddati o'tgan buyurtmalar</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            48 soatdan beri tasdiqlanmagan buyurtmalar — tezroq ko'rib chiqilishi kerak.
          </p>
        </div>
      </div>
      <OrderApprovalTable overdueOnly={true} />
    </div>
  );
}
