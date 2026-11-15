import {api} from "./client";

export const classApi = {
  getAll: (params = {}) => {
    let queryObj = {};
    if (typeof params === "number") {
      queryObj.page = params;
    } else if (params && typeof params === "object") {
      queryObj = { ...params };
    }

    const queryParts = [];
    Object.entries(queryObj).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });

    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return api(`/classes${queryString}`);
  },
  getById: (id) => api(`/classes/${id}`),
  create: (payload) => api("/classes", {method: "POST", body: payload}),
  getProgress: (classId) => api(`/classes/${classId}/progress`),
};

export const classMemberApi = {
  add: (class_id, member_id) => api("/class-members/add", {method: "POST", body: {class_id, member_id}}),
  getMembers: (classId, params = {}) => {
    const queryParts = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return api(`/class-members/${classId}/members${queryString}`);
  },
};
