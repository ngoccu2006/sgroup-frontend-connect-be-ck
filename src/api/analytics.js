import { api } from "./client";

export const analyticsApi = {
  assignmentsSummary: (classId) => api(`/analytics/class/${classId}/assignments-summary`),
  membersGpa: (classId) => api(`/analytics/class/${classId}/members-gpa`),
  exportExcel: async (classId) => {
    const res = await api(`/analytics/class/${classId}/export-excel`, { raw: true });
    const disposition = res.headers.get("Content-Disposition") || "";
    const filename = disposition.match(/filename=([^;]+)/)?.[1] || `Bang_Diem_Lop_${classId}.xlsx`;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};