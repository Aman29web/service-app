import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { formatDate } from "../../utils/formatDate";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = async () => {
    setLoading(true);

    try {
      const response = await api.get("/admin/audit-logs", {
        params: { page },
      });

      const data = response.data?.data || response.data;

      setLogs(data.logs || data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to load audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-gray-500">
          Track administrative actions.
        </p>
      </div>

      {loading ? (
        <Loader />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3">Actor</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Target</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Timestamp</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-5 py-4">
                        {log.actor?.name || log.actorId || "-"}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {log.action}
                      </td>

                      <td className="px-5 py-4">
                        {log.targetType
                          ? `${log.targetType}:${log.targetId}`
                          : "-"}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {log.reason || "-"}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}