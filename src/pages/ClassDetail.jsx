import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getUser, fetchAll } from "../api/client";
import ClassFormModal from "../components/ClassFormModal";
import ScheduleSection from "../components/ScheduleSection";
import { classApi, classMemberApi } from "../api/classes";
import { lessonApi } from "../api/lessons";
import { assignmentApi } from "../api/assignments";
import { analyticsApi } from "../api/analytics";
import {
  CheckCircle, FileText, ArrowLeft, Plus, Download, X, Target, BookOpen, ClipboardList, Clock,
  AlarmClockOff, Infinity as InfinityIcon, ArrowRight, Check, ListOrdered, Trophy, CalendarClock,
  AlertTriangle, FilePlus2, BookPlus, Search, ArrowUpDown, ChevronLeft, ChevronRight, RotateCcw,
  Users, Mail, UserPlus, Pencil, Trash2, UserCheck, UserX, CalendarRange, CalendarDays, FileCheck, LayoutDashboard,
} from "lucide-react";

export default function ClassDetail() {
  const { classId } = useParams();
  const user = getUser();
  const isMentorOrAdmin = ["MENTOR", "ADMIN"].includes(user?.role);

  // Tabs: "CONTENT" (Lessons & Assignments), "SCHEDULE" (Lịch học) or "MEMBERS" (Class Members)
  const [activeTab, setActiveTab] = useState("CONTENT");

  const location = useLocation();
  const navigate = useNavigate();

  // Thông tin lớp: lấy từ state khi bấm từ danh sách; mở trực tiếp URL thì tìm trong danh sách lớp
  // (BE chưa có GET /classes/:id)
  const [cls, setCls] = useState(location.state?.cls?.id === classId ? location.state.cls : null);
  const [editingClass, setEditingClass] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);

  useEffect(() => {
    if (cls?.id === classId) return;
    fetchAll((p) => classApi.getAll(p))
      .then((all) => setCls(all.find((c) => c.id === classId) || null))
      .catch(() => {});
  }, [classId, cls?.id]);

  // Admin quản lý mọi lớp; Mentor chỉ lớp mình phụ trách (chưa biết lớp thì tạm cho hiện, BE sẽ chặn)
  const canManageClass = user?.role === "ADMIN" || (user?.role === "MENTOR" && (!cls || cls.mentor_id === user?.id));

  const handleDeleteClass = async () => {
    const name = cls?.name || "này";
    if (!window.confirm(`Xoá lớp "${name}"?\n\nToàn bộ dữ liệu của lớp (bài học, bài tập, lịch học, học viên...) có thể bị xoá theo. Thao tác này không thể hoàn tác.`)) return;
    setDeletingClass(true);
    try {
      await classApi.remove(classId);
      alert("Đã xoá lớp học!");
      navigate("/classes", { replace: true });
    } catch (err) {
      alert(err.message || "Xoá lớp học thất bại (lớp có thể còn dữ liệu liên quan)");
      setDeletingClass(false);
    }
  };

  // --- Lessons State ---
  const [lessons, setLessons] = useState([]);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonPage, setLessonPage] = useState(1);
  const [lessonLimit, setLessonLimit] = useState(6);
  const [lessonTotal, setLessonTotal] = useState(0);
  const [lessonTotalPages, setLessonTotalPages] = useState(1);
  const [lessonSearch, setLessonSearch] = useState("");
  const [lessonSearchTerm, setLessonSearchTerm] = useState("");
  const [lessonSort, setLessonSort] = useState("order:ASC");

  // --- Assignments State ---
  const [assignments, setAssignments] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [assignmentLimit, setAssignmentLimit] = useState(6);
  const [assignmentTotal, setAssignmentTotal] = useState(0);
  const [assignmentTotalPages, setAssignmentTotalPages] = useState(1);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState("");
  const [assignmentSort, setAssignmentSort] = useState("created_at:DESC");

  // --- Members State ---
  const [members, setMembers] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberPage, setMemberPage] = useState(1);
  const [memberLimit, setMemberLimit] = useState(8);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberTotalPages, setMemberTotalPages] = useState(1);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberSort, setMemberSort] = useState("joined_at:DESC");

  // Progress & Error
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // Modals
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: "", content: "", order: 1 });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", description: "", deadline: "", maximum_score: 10 });
  const [submitting, setSubmitting] = useState(false);

  // Action states
  const [completingId, setCompletingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Debounce refs
  const lessonDebounce = useRef(null);
  const assignmentDebounce = useRef(null);
  const memberDebounce = useRef(null);

  // 1. Load Progress
  const loadProgress = useCallback(() => {
    return classApi.getProgress(classId)
      .then(({ data }) => setProgress(data))
      .catch(() => {});
  }, [classId]);

  // 2. Load Lessons
  const loadLessons = useCallback(() => {
    setLessonLoading(true);
    const [sortBy, sortOrder] = lessonSort.split(":");
    lessonApi.getByClass(classId, {
      page: lessonPage,
      limit: lessonLimit,
      q: lessonSearch,
      sortBy,
      order: sortOrder,
    })
      .then((res) => {
        const items = res.data || res.lessons || [];
        setLessons(items);
        setLessonTotal(res.pagination?.total ?? items.length);
        setLessonTotalPages(res.pagination?.totalPages ?? 1);
      })
      .catch(() => setLessons([]))
      .finally(() => setLessonLoading(false));
  }, [classId, lessonPage, lessonLimit, lessonSearch, lessonSort]);

  // 3. Load Assignments
  const loadAssignments = useCallback(() => {
    setAssignmentLoading(true);
    const [sortBy, sortOrder] = assignmentSort.split(":");
    assignmentApi.getByClass(classId, {
      page: assignmentPage,
      limit: assignmentLimit,
      q: assignmentSearch,
      sortBy,
      order: sortOrder,
    })
      .then((res) => {
        const items = res.data || res.assignments || [];
        setAssignments(items);
        setAssignmentTotal(res.pagination?.total ?? items.length);
        setAssignmentTotalPages(res.pagination?.totalPages ?? 1);
      })
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentLoading(false));
  }, [classId, assignmentPage, assignmentLimit, assignmentSearch, assignmentSort]);

  // 4. Load Members
  const loadMembers = useCallback(() => {
    setMemberLoading(true);
    const [sortBy, sortOrder] = memberSort.split(":");
    classMemberApi.getMembers(classId, {
      page: memberPage,
      limit: memberLimit,
      q: memberSearch,
      sortBy,
      order: sortOrder,
    })
      .then((res) => {
        const items = res.data || res.members || [];
        setMembers(items);
        setMemberTotal(res.pagination?.total ?? items.length);
        setMemberTotalPages(res.pagination?.totalPages ?? 1);
      })
      .catch(() => setMembers([]))
      .finally(() => setMemberLoading(false));
  }, [classId, memberPage, memberLimit, memberSearch, memberSort]);

  // Initial load
  useEffect(() => {
    Promise.all([loadProgress()])
      .catch((e) => setError(e.message || "Lỗi tải dữ liệu lớp học"))
      .finally(() => setInitialLoading(false));
  }, [loadProgress]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    if (activeTab === "MEMBERS") {
      loadMembers();
    }
  }, [activeTab, loadMembers]);

  // Handlers for Lessons
  const handleLessonSearch = (val) => {
    setLessonSearchTerm(val);
    if (lessonDebounce.current) clearTimeout(lessonDebounce.current);
    lessonDebounce.current = setTimeout(() => {
      setLessonSearch(val.trim());
      setLessonPage(1);
    }, 300);
  };

  const handleLessonClearSearch = () => {
    setLessonSearchTerm("");
    setLessonSearch("");
    setLessonPage(1);
  };

  // Handlers for Assignments
  const handleAssignmentSearch = (val) => {
    setAssignmentSearchTerm(val);
    if (assignmentDebounce.current) clearTimeout(assignmentDebounce.current);
    assignmentDebounce.current = setTimeout(() => {
      setAssignmentSearch(val.trim());
      setAssignmentPage(1);
    }, 300);
  };

  const handleAssignmentClearSearch = () => {
    setAssignmentSearchTerm("");
    setAssignmentSearch("");
    setAssignmentPage(1);
  };

  // Handlers for Members
  const handleMemberSearch = (val) => {
    setMemberSearchTerm(val);
    if (memberDebounce.current) clearTimeout(memberDebounce.current);
    memberDebounce.current = setTimeout(() => {
      setMemberSearch(val.trim());
      setMemberPage(1);
    }, 300);
  };

  const handleMemberClearSearch = () => {
    setMemberSearchTerm("");
    setMemberSearch("");
    setMemberPage(1);
  };

  const handleComplete = async (lessonId) => {
    try {
      await lessonApi.complete(lessonId);
      await loadProgress();
      alert("Đã hoàn thành bài học!");
    } catch (e) {
      alert(e.message || "Lỗi khi đánh dấu hoàn thành");
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await lessonApi.create({ ...lessonForm, class_id: classId, order: Number(lessonForm.order) });
      alert("Tạo bài học thành công!");
      setShowLessonModal(false);
      setLessonForm({ title: "", content: "", order: lessonTotal + 1 });
      loadLessons();
      loadProgress();
    } catch (err) {
      alert(err.message || "Không thể tạo bài học");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await assignmentApi.create({
        ...assignmentForm,
        class_id: classId,
        maximum_score: Number(assignmentForm.maximum_score),
      });
      alert("Tạo bài tập thành công! Thông báo đã được gửi tới học viên.");
      setShowAssignmentModal(false);
      setAssignmentForm({ title: "", description: "", deadline: "", maximum_score: 10 });
      loadAssignments();
    } catch (err) {
      alert(err.message || "Không thể tạo bài tập");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      await analyticsApi.exportExcel(classId);
    } catch (err) {
      alert(err.message || "Không thể xuất file Excel");
    }
  };

  const onCompleteClick = async (lessonId) => {
    setCompletingId(lessonId);
    await handleComplete(lessonId);
    setCompletingId(null);
  };

  const onExportClick = async () => {
    setExporting(true);
    await handleExportExcel();
    setExporting(false);
  };

  if (initialLoading) {
    return (
      <div style={styles.centerText}>
        <style>{css}</style>
        <div className="cd-spinner" />
        Đang tải nội dung lớp học...
      </div>
    );
  }
  if (error) {
    return (
      <div style={styles.errorText}>
        <AlertTriangle size={18} style={{ flexShrink: 0 }} /> {error}
      </div>
    );
  }

  const percent = Math.min(100, progress?.progress || 0);

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Top navigation row */}
      <div style={styles.topRow}>
        <Link to="/classes" className="cd-back" style={styles.backBtn}>
          <ArrowLeft size={16} className="cd-back-icon" /> Quay lại danh sách lớp
        </Link>

        {isMentorOrAdmin && (
          <button onClick={onExportClick} disabled={exporting} className="cd-btn-excel" style={styles.excelBtn}>
            {exporting ? <div className="cd-spinner cd-spinner-sm" /> : <Download size={16} />}
            {exporting ? "Đang xuất..." : "Xuất Bảng Điểm Excel"}
          </button>
        )}
      </div>

      {/* Thông tin lớp + sửa/xoá */}
      {cls && (
        <section style={styles.classCard}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={styles.classKicker}>Lớp học</span>
            <h1 style={styles.className}>{cls.name || "Lớp học chưa đặt tên"}</h1>
            {cls.description && <p style={styles.classDesc}>{cls.description}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {(cls.start_date || cls.end_date) && (
                <span style={styles.classChip}>
                  <CalendarRange size={13} />
                  {cls.start_date ? fmtDay(cls.start_date) : "?"} – {cls.end_date ? fmtDay(cls.end_date) : "?"}
                </span>
              )}
              {isMentorOrAdmin && (cls.mentor_id ? (
                <span style={{ ...styles.classChip, ...styles.classChipMentor }}>
                  <UserCheck size={13} /> {cls.mentor_id === user?.id ? "Bạn là mentor phụ trách" : "Đã phân công mentor"}
                </span>
              ) : (
                <span style={{ ...styles.classChip, ...styles.classChipWarn }}>
                  <UserX size={13} /> Chưa phân công mentor
                </span>
              ))}
            </div>
          </div>
          {canManageClass && (
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => setEditingClass(true)} className="cd-btn-ghost" style={styles.classBtn}>
                <Pencil size={14} /> Sửa lớp
              </button>
              <button onClick={handleDeleteClass} disabled={deletingClass} className="cd-btn-danger" style={{ ...styles.classBtn, ...styles.classBtnDanger }}>
                {deletingClass ? <div className="cd-spinner cd-spinner-sm" /> : <Trash2 size={14} />} Xoá lớp
              </button>
            </div>
          )}
        </section>
      )}

      {editingClass && cls && (
        <ClassFormModal
          initial={cls}
          onClose={() => setEditingClass(false)}
          onSaved={(saved) => {
            setCls({ ...cls, ...saved });
            setEditingClass(false);
            alert("Đã cập nhật lớp học!");
          }}
        />
      )}

      {/* Mentor/Admin: tổng quan quản lý lớp */}
      {isMentorOrAdmin && (
        <section style={styles.manageCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={styles.manageIcon}><LayoutDashboard size={22} /></div>
            <div>
              <h2 style={styles.heroTitle}>Tổng quan quản lý lớp</h2>
              <p style={styles.heroSubtitle}>
                {canManageClass ? "Thêm bài học, giao bài tập, xếp lịch và chấm điểm học viên." : "Bạn đang xem lớp do mentor khác phụ trách."}
              </p>
            </div>
          </div>
          <div style={styles.manageStats}>
            <ManageStat icon={<BookOpen size={16} />} color="#2563eb" label="Bài học" value={lessonTotal} />
            <ManageStat icon={<ClipboardList size={16} />} color="#d97706" label="Bài tập" value={assignmentTotal} />
          </div>
        </section>
      )}

      {/* Member: tiến độ học tập */}
      {!isMentorOrAdmin && progress && (
        <section style={styles.heroCard}>
          <div style={{ ...styles.glow, top: -80, right: -80, backgroundColor: "rgba(37,99,235,0.12)" }} />
          <div style={{ ...styles.glow, bottom: -80, left: "33%", backgroundColor: "rgba(14,165,233,0.1)" }} />

          <div style={{ position: "relative" }}>
            <div style={styles.heroTop}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={styles.heroIcon}><Target size={24} /></div>
                <div>
                  <h2 style={styles.heroTitle}>Tiến độ học tập của bạn</h2>
                  <p style={styles.heroSubtitle}>
                    Đã hoàn thành{" "}
                    <strong style={{ color: "#1d4ed8" }}>
                      {progress.completedLessons || 0}/{progress.totalLessons || 0} bài học
                    </strong>
                    {percent === 100 ? " • Xuất sắc, bạn đã học xong lớp này!" : " • Hãy tiếp tục duy trì nhịp độ học tập!"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={styles.heroPercent}>{percent}%</span>
                <span style={styles.heroPercentLabel}>hoàn tất</span>
              </div>
            </div>

            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${percent}%` }} />
            </div>

            <div style={styles.heroStats}>
              <StatPill color="#3b82f6" label="Bài học" value={`${lessonTotal} bài`} />
              <StatPill color="#d97706" label="Bài tập" value={`${assignmentTotal} bài`} />
              <StatPill color="#059669" label="Đã hoàn thành" value={`${progress.completedLessons || 0} bài`} valueColor="#059669" />
            </div>
          </div>
        </section>
      )}

      {/* Tab Switcher: Lộ trình bài giảng & Bài tập vs Học viên lớp */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab("CONTENT")}
          className="cd-tab"
          style={{ ...styles.tabBtn, ...(activeTab === "CONTENT" ? styles.tabBtnActive : {}) }}
        >
          <BookOpen size={16} /> Lộ trình & Bài tập ({lessonTotal + assignmentTotal})
        </button>
        <button
          onClick={() => setActiveTab("SCHEDULE")}
          className="cd-tab"
          style={{ ...styles.tabBtn, ...(activeTab === "SCHEDULE" ? styles.tabBtnActive : {}) }}
        >
          <CalendarDays size={16} /> Lịch học
        </button>
        <button
          onClick={() => setActiveTab("MEMBERS")}
          className="cd-tab"
          style={{ ...styles.tabBtn, ...(activeTab === "MEMBERS" ? styles.tabBtnActive : {}) }}
        >
          <Users size={16} /> Thành viên lớp học ({memberTotal})
        </button>
      </div>

      {activeTab === "SCHEDULE" ? (
        <ScheduleSection classId={classId} canManage={isMentorOrAdmin && canManageClass} />
      ) : activeTab === "CONTENT" ? (
        <div className="cd-grid">
          {/* Cột 1: Danh sách Bài học */}
          <section style={styles.sectionBox}>
            <SectionHeader
              icon={<BookOpen size={18} />}
              color="#2563eb"
              title="Danh sách Bài học"
              subtitle="Lộ trình bài giảng của lớp"
              count={lessonTotal}
              action={isMentorOrAdmin && (
                <button onClick={() => setShowLessonModal(true)} className="cd-btn-primary" style={styles.addBtn}>
                  <Plus size={14} /> Bài học
                </button>
              )}
            />

            {/* Toolbar Bài học */}
            <div style={styles.sectionToolbar}>
              <div style={styles.searchWrap}>
                <Search size={14} style={styles.searchIcon} />
                <input
                  value={lessonSearchTerm}
                  onChange={(e) => handleLessonSearch(e.target.value)}
                  placeholder="Tìm bài học..."
                  className="cd-input"
                  style={{ ...styles.input, height: 34, paddingLeft: 32, paddingRight: lessonSearchTerm ? 28 : 10, fontSize: 12 }}
                />
                {lessonSearchTerm && (
                  <button type="button" onClick={handleLessonClearSearch} style={styles.clearBtn}>
                    <X size={12} />
                  </button>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <ArrowUpDown size={12} style={styles.sortIcon} />
                <select
                  value={lessonSort}
                  onChange={(e) => { setLessonSort(e.target.value); setLessonPage(1); }}
                  className="cd-input"
                  style={{ ...styles.input, height: 34, paddingLeft: 28, paddingRight: 10, fontSize: 12, cursor: "pointer", appearance: "none" }}
                >
                  <option value="order:ASC">Thứ tự: 1 → N</option>
                  <option value="order:DESC">Thứ tự: N → 1</option>
                  <option value="title:ASC">Tên bài: A → Z</option>
                  <option value="created_at:DESC">Mới tạo nhất</option>
                </select>
              </div>
            </div>

            {lessonLoading ? (
              <div style={styles.smallCenter}>
                <div className="cd-spinner cd-spinner-sm" /> Đang tải bài học...
              </div>
            ) : lessons.length === 0 ? (
              <EmptyState icon={<BookOpen size={20} />} text={lessonSearch ? "Không có bài học phù hợp tìm kiếm." : "Lớp học này chưa có bài học nào."} />
            ) : (
              <div style={styles.list}>
                {lessons.map((l, i) => (
                  <div key={l.id} className="cd-item" style={styles.itemCard}>
                    <div style={styles.orderCircle}>{l.order ?? (lessonPage - 1) * lessonLimit + i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 className="cd-item-title" style={styles.itemTitle}>{l.title}</h4>
                      {l.content && <p className="cd-clamp" style={styles.itemText}>{l.content}</p>}
                    </div>
                    {!isMentorOrAdmin && (
                      <button
                        onClick={() => onCompleteClick(l.id)}
                        disabled={completingId === l.id}
                        className="cd-btn-complete"
                        style={styles.completeBtn}
                      >
                        {completingId === l.id ? <div className="cd-spinner cd-spinner-sm cd-spinner-green" /> : <CheckCircle size={15} />}
                        Hoàn thành
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Phân trang bài học */}
            {lessonTotalPages > 1 && (
              <div style={styles.miniPagination}>
                <button
                  onClick={() => setLessonPage((p) => Math.max(1, p - 1))}
                  disabled={lessonPage <= 1}
                  className="cd-btn-page"
                  style={{ ...styles.pageBtn, ...(lessonPage <= 1 ? styles.pageBtnDisabled : {}) }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Trang {lessonPage}/{lessonTotalPages} ({lessonTotal} bài)
                </span>
                <button
                  onClick={() => setLessonPage((p) => Math.min(lessonTotalPages, p + 1))}
                  disabled={lessonPage >= lessonTotalPages}
                  className="cd-btn-page"
                  style={{ ...styles.pageBtn, ...(lessonPage >= lessonTotalPages ? styles.pageBtnDisabled : {}) }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </section>

          {/* Cột 2: Danh sách Bài tập */}
          <section style={styles.sectionBox}>
            <SectionHeader
              icon={<ClipboardList size={18} />}
              color="#d97706"
              title="Bài tập về nhà"
              subtitle={isMentorOrAdmin ? "Giao bài tập & chấm điểm học viên" : "Nộp bài & nhận phản hồi từ giảng viên"}
              count={assignmentTotal}
              action={isMentorOrAdmin && (
                <button onClick={() => setShowAssignmentModal(true)} className="cd-btn-amber" style={{ ...styles.addBtn, ...styles.addBtnAmber }}>
                  <Plus size={14} /> Bài tập
                </button>
              )}
            />

            {/* Toolbar Bài tập */}
            <div style={styles.sectionToolbar}>
              <div style={styles.searchWrap}>
                <Search size={14} style={styles.searchIcon} />
                <input
                  value={assignmentSearchTerm}
                  onChange={(e) => handleAssignmentSearch(e.target.value)}
                  placeholder="Tìm bài tập..."
                  className="cd-input cd-input-amber"
                  style={{ ...styles.input, height: 34, paddingLeft: 32, paddingRight: assignmentSearchTerm ? 28 : 10, fontSize: 12 }}
                />
                {assignmentSearchTerm && (
                  <button type="button" onClick={handleAssignmentClearSearch} style={styles.clearBtn}>
                    <X size={12} />
                  </button>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <ArrowUpDown size={12} style={styles.sortIcon} />
                <select
                  value={assignmentSort}
                  onChange={(e) => { setAssignmentSort(e.target.value); setAssignmentPage(1); }}
                  className="cd-input cd-input-amber"
                  style={{ ...styles.input, height: 34, paddingLeft: 28, paddingRight: 10, fontSize: 12, cursor: "pointer", appearance: "none" }}
                >
                  <option value="created_at:DESC">Mới tạo nhất</option>
                  <option value="deadline:ASC">Hạn nộp gần nhất</option>
                  <option value="maximum_score:DESC">Điểm tối đa cao</option>
                  <option value="title:ASC">Tên: A → Z</option>
                </select>
              </div>
            </div>

            {assignmentLoading ? (
              <div style={styles.smallCenter}>
                <div className="cd-spinner cd-spinner-sm" /> Đang tải bài tập...
              </div>
            ) : assignments.length === 0 ? (
              <EmptyState icon={<FileText size={20} />} text={assignmentSearch ? "Không có bài tập phù hợp tìm kiếm." : "Lớp học này chưa có bài tập nào."} />
            ) : (
              <div style={styles.list}>
                {assignments.map((a) => {
                  const dl = describeDeadline(a.deadline);
                  return (
                    <div key={a.id} className={`cd-item ${dl.overdue ? "cd-item-overdue" : "cd-item-amber"}`} style={{ ...styles.itemCard, alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                        <h4 className="cd-item-title" style={styles.itemTitle}>{a.title}</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          <span style={{ ...styles.chip, ...dl.style }}>
                            {dl.icon} {dl.text}
                          </span>
                          {a.maximum_score != null && (
                            <span style={{ ...styles.chip, ...styles.chipBlue }}>
                              <Trophy size={12} /> {a.maximum_score} điểm
                            </span>
                          )}
                        </div>
                      </div>
                      {isMentorOrAdmin ? (
                        <Link to={`/assignments/${a.id}/grade`} className="cd-btn-detail" style={styles.detailBtn}>
                          <FileCheck size={14} /> Chấm bài
                        </Link>
                      ) : (
                        <Link
                          to={`/assignments/${a.id}`}
                          className={dl.overdue ? "cd-btn-ghost" : "cd-btn-detail"}
                          style={{ ...styles.detailBtn, ...(dl.overdue ? styles.detailBtnMuted : {}) }}
                        >
                          {dl.overdue ? "Xem chi tiết" : "Chi tiết & Nộp bài"} <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Phân trang bài tập */}
            {assignmentTotalPages > 1 && (
              <div style={styles.miniPagination}>
                <button
                  onClick={() => setAssignmentPage((p) => Math.max(1, p - 1))}
                  disabled={assignmentPage <= 1}
                  className="cd-btn-page"
                  style={{ ...styles.pageBtn, ...(assignmentPage <= 1 ? styles.pageBtnDisabled : {}) }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Trang {assignmentPage}/{assignmentTotalPages} ({assignmentTotal} bài)
                </span>
                <button
                  onClick={() => setAssignmentPage((p) => Math.min(assignmentTotalPages, p + 1))}
                  disabled={assignmentPage >= assignmentTotalPages}
                  className="cd-btn-page"
                  style={{ ...styles.pageBtn, ...(assignmentPage >= assignmentTotalPages ? styles.pageBtnDisabled : {}) }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Tab 2: Danh sách Học viên lớp */
        <section style={styles.sectionBox}>
          <SectionHeader
            icon={<Users size={18} />}
            color="#0284c7"
            title="Thành viên Lớp Học"
            subtitle="Danh sách học viên tham gia lớp"
            count={memberTotal}
          />

          <div style={styles.sectionToolbar}>
            <div style={{ ...styles.searchWrap, maxWidth: 300 }}>
              <Search size={14} style={styles.searchIcon} />
              <input
                value={memberSearchTerm}
                onChange={(e) => handleMemberSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc email học viên..."
                className="cd-input"
                style={{ ...styles.input, height: 36, paddingLeft: 34, paddingRight: memberSearchTerm ? 28 : 10 }}
              />
              {memberSearchTerm && (
                <button type="button" onClick={handleMemberClearSearch} style={styles.clearBtn}>
                  <X size={13} />
                </button>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <ArrowUpDown size={12} style={styles.sortIcon} />
              <select
                value={memberSort}
                onChange={(e) => { setMemberSort(e.target.value); setMemberPage(1); }}
                className="cd-input"
                style={{ ...styles.input, height: 36, paddingLeft: 28, paddingRight: 12, cursor: "pointer", appearance: "none" }}
              >
                <option value="joined_at:DESC">Mới tham gia nhất</option>
                <option value="joined_at:ASC">Tham gia sớm nhất</option>
                <option value="full_name:ASC">Tên: A → Z</option>
              </select>
            </div>
          </div>

          {memberLoading ? (
            <div style={styles.smallCenter}>
              <div className="cd-spinner" /> Đang tải học viên...
            </div>
          ) : members.length === 0 ? (
            <EmptyState icon={<Users size={20} />} text={memberSearch ? "Không tìm thấy học viên nào phù hợp tìm kiếm." : "Lớp học này chưa có học viên nào."} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {members.map((m) => (
                <div key={m.member_id} style={styles.memberCard}>
                  <div style={styles.memberAvatar}>
                    {getInitials(m.full_name || m.name)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={styles.memberName}>{m.full_name || m.name || "Học viên"}</div>
                    <div style={styles.memberEmail}>{m.email}</div>
                    <div style={styles.memberDate}>
                      Tham gia: {m.joined_at ? new Date(m.joined_at).toLocaleDateString("vi-VN") : "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {memberTotalPages > 1 && (
            <div style={styles.paginationFooter}>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Hiển thị {members.length} / {memberTotal} học viên
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                  disabled={memberPage <= 1}
                  className="cd-btn-page"
                  style={{ ...styles.pageBtn, ...(memberPage <= 1 ? styles.pageBtnDisabled : {}) }}
                >
                  <ChevronLeft size={14} /> Trước
                </button>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Trang <strong style={{ color: "#0f172a" }}>{memberPage}</strong> / {memberTotalPages}
                </span>
                <button
                  onClick={() => setMemberPage((p) => Math.min(memberTotalPages, p + 1))}
                  disabled={memberPage >= memberTotalPages}
                  className="cd-btn-page"
                  style={{ ...styles.pageBtn, ...(memberPage >= memberTotalPages ? styles.pageBtnDisabled : {}) }}
                >
                  Sau <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Modal Tạo Bài Học */}
      {showLessonModal && (
        <Modal
          icon={<BookPlus size={20} />}
          color="#2563eb"
          title="Thêm Bài Học Mới"
          subtitle="Tạo nội dung bài giảng và thứ tự trong lớp học"
          onClose={() => setShowLessonModal(false)}
        >
          <form onSubmit={handleCreateLesson}>
            <div style={styles.modalBody}>
              <div style={styles.field}>
                <label style={styles.label}>Tiêu đề bài học <span style={styles.req}>*</span></label>
                <input
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Ví dụ: Bài 1 - Khái niệm RESTful API"
                  className="cd-input"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Nội dung bài học <span style={styles.req}>*</span></label>
                <textarea
                  required
                  rows={4}
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="Nội dung chi tiết..."
                  className="cd-input"
                  style={{ ...styles.input, ...styles.textarea }}
                />
              </div>
              <div style={{ ...styles.field, maxWidth: 220 }}>
                <label style={styles.label}>Thứ tự (Order)</label>
                <div style={{ position: "relative" }}>
                  <ListOrdered size={16} style={styles.inputIcon} />
                  <input
                    type="number"
                    value={lessonForm.order}
                    onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                    className="cd-input"
                    style={{ ...styles.input, paddingLeft: 36 }}
                  />
                </div>
                <span style={styles.hint}>Vị trí hiển thị trong danh sách (không được trùng)</span>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setShowLessonModal(false)} className="cd-btn-ghost" style={styles.cancelBtn}>Hủy</button>
              <button disabled={submitting} type="submit" className="cd-btn-primary" style={styles.saveBtn}>
                {submitting ? <div className="cd-spinner cd-spinner-sm" /> : <Check size={16} />}
                {submitting ? "Đang lưu..." : "Tạo bài học"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Tạo Bài Tập */}
      {showAssignmentModal && (
        <Modal
          icon={<FilePlus2 size={20} />}
          color="#d97706"
          title="Thêm Bài Tập Mới"
          subtitle="Học viên trong lớp sẽ nhận được thông báo"
          onClose={() => setShowAssignmentModal(false)}
        >
          <form onSubmit={handleCreateAssignment}>
            <div style={styles.modalBody}>
              <div style={styles.field}>
                <label style={styles.label}>Tiêu đề bài tập <span style={styles.req}>*</span></label>
                <input
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="Ví dụ: Bài tập Nộp bài qua Link Github"
                  className="cd-input cd-input-amber"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mô tả bài tập</label>
                <textarea
                  rows={3}
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Yêu cầu đề bài..."
                  className="cd-input cd-input-amber"
                  style={{ ...styles.input, ...styles.textarea }}
                />
              </div>
              <div style={styles.fieldRow}>
                <div style={{ ...styles.field, flex: "1 1 200px" }}>
                  <label style={styles.label}>Hạn nộp (Deadline)</label>
                  <div style={{ position: "relative" }}>
                    <CalendarClock size={16} style={styles.inputIcon} />
                    <input
                      type="datetime-local"
                      value={assignmentForm.deadline}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })}
                      className="cd-input cd-input-amber"
                      style={{ ...styles.input, paddingLeft: 36, colorScheme: "light" }}
                    />
                  </div>
                </div>
                <div style={{ ...styles.field, flex: "1 1 120px" }}>
                  <label style={styles.label}>Điểm tối đa</label>
                  <div style={{ position: "relative" }}>
                    <Trophy size={16} style={styles.inputIcon} />
                    <input
                      type="number"
                      value={assignmentForm.maximum_score}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, maximum_score: e.target.value })}
                      className="cd-input cd-input-amber"
                      style={{ ...styles.input, paddingLeft: 36 }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setShowAssignmentModal(false)} className="cd-btn-ghost" style={styles.cancelBtn}>Hủy</button>
              <button disabled={submitting} type="submit" className="cd-btn-amber" style={{ ...styles.saveBtn, ...styles.saveBtnAmber }}>
                {submitting ? <div className="cd-spinner cd-spinner-sm cd-spinner-dark" /> : <Check size={16} />}
                {submitting ? "Đang lưu..." : "Tạo bài tập"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ManageStat({ icon, color, label, value }) {
  return (
    <div style={styles.manageStat}>
      <span style={{ ...styles.manageStatIcon, color, backgroundColor: `${color}14`, borderColor: `${color}33` }}>{icon}</span>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
      </div>
    </div>
  );
}

function StatPill({ color, label, value, valueColor = "#0f172a" }) {
  return (
    <div style={styles.statPill}>
      <span style={{ ...styles.dot, backgroundColor: color }} />
      <span style={{ color: "#64748b" }}>{label}:</span>
      <strong style={{ color: valueColor }}>{value}</strong>
    </div>
  );
}

function SectionHeader({ icon, color, title, subtitle, count, action }) {
  return (
    <div style={styles.sectionHeader}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ ...styles.sectionIcon, color, backgroundColor: `${color}26`, borderColor: `${color}4d` }}>{icon}</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={styles.sectionTitle}>{title}</h3>
            <span style={{ ...styles.countBadge, color, backgroundColor: `${color}26`, borderColor: `${color}4d` }}>{count}</span>
          </div>
          <p style={styles.sectionSubtitle}>{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={styles.empty}>
      <div style={styles.emptyIcon}>{icon}</div>
      <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{text}</p>
    </div>
  );
}

function Modal({ icon, color, title, subtitle, onClose, children }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div className="cd-modal" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ ...styles.modalIcon, color, backgroundColor: `${color}26`, borderColor: `${color}4d` }}>{icon}</div>
            <div>
              <h3 style={styles.modalTitle}>{title}</h3>
              <p style={styles.modalSubtitle}>{subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="cd-btn-ghost" style={styles.closeBtn} title="Đóng">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const getInitials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

const DAY = 24 * 60 * 60 * 1000;
const fmtDay = (d) => new Date(d).toLocaleDateString("vi-VN");

const describeDeadline = (deadline) => {
  if (!deadline) {
    return { text: "Không có hạn nộp", icon: <InfinityIcon size={12} />, style: { color: "#94a3b8" }, overdue: false };
  }
  const date = new Date(deadline);
  const diff = date - new Date();
  const formatted = date.toLocaleString("vi-VN");
  if (diff < 0) {
    return { text: `Đã quá hạn (${formatted})`, icon: <AlarmClockOff size={12} />, style: styles.chipDanger, overdue: true };
  }
  const days = Math.floor(diff / DAY);
  const remain = days >= 1 ? `còn ${days} ngày` : "hết hạn hôm nay";
  return {
    text: `Hạn nộp: ${formatted} (${remain})`,
    icon: <Clock size={12} />,
    style: days < 2 ? styles.chipWarn : {},
    overdue: false,
  };
};

const css = `
  .cd-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; align-items: start; }
  @media (max-width: 900px) { .cd-grid { grid-template-columns: 1fr; } }
  .cd-tab:hover { color: #1d4ed8 !important; }
  .cd-back:hover { color: #0f172a !important; }
  .cd-back-icon { transition: transform .15s; }
  .cd-back:hover .cd-back-icon { transform: translateX(-2px); }
  .cd-item { transition: background-color .15s, border-color .15s; }
  .cd-item:hover { background-color: #ffffff !important; border-color: #bfdbfe !important; box-shadow: 0 4px 12px rgba(37,99,235,0.08); }
  .cd-item:hover .cd-item-title { color: #2563eb; }
  .cd-item-amber:hover { border-color: rgba(245,158,11,0.4) !important; }
  .cd-item-amber:hover .cd-item-title { color: #d97706; }
  .cd-item-overdue:hover { border-color: rgba(244,63,94,0.4) !important; }
  .cd-item-overdue:hover .cd-item-title { color: #e11d48; }
  .cd-item-title { transition: color .15s; }
  .cd-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cd-btn-primary, .cd-btn-amber, .cd-btn-excel, .cd-btn-complete, .cd-btn-detail { transition: background-color .15s, border-color .15s, color .15s, transform .1s; }
  .cd-btn-primary:hover:not(:disabled) { background-color: #1d4ed8 !important; }
  .cd-btn-amber:hover:not(:disabled) { background-color: #b45309 !important; }
  .cd-btn-excel:hover:not(:disabled) { background-color: rgba(16,185,129,0.2) !important; }
  .cd-btn-complete:hover:not(:disabled) { color: #059669 !important; background-color: rgba(16,185,129,0.12) !important; border-color: rgba(16,185,129,0.4) !important; }
  .cd-btn-detail:hover { background-color: rgba(245,158,11,0.2) !important; color: #92400e !important; }
  .cd-btn-danger { transition: background-color .15s; }
  .cd-btn-danger:hover:not(:disabled) { background-color: rgba(244,63,94,0.2) !important; }
  .cd-btn-ghost:hover { color: #0f172a !important; background-color: #e2e8f0 !important; }
  .cd-btn-page { transition: background-color .15s, color .15s; }
  .cd-btn-page:hover:not(:disabled) { background-color: #e2e8f0 !important; color: #0f172a !important; }
  .cd-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px #3b82f6; }
  .cd-input-amber:focus { border-color: #f59e0b !important; box-shadow: 0 0 0 1px #f59e0b; }
  .cd-input::placeholder { color: #94a3b8; }
  .cd-modal { animation: cd-pop .18s ease-out; }
  @keyframes cd-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  .cd-spinner { width: 28px; height: 28px; margin: 0 auto 12px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: cd-spin .8s linear infinite; }
  .cd-spinner-sm { width: 14px; height: 14px; margin: 0; border-width: 2px; border-color: currentColor; border-right-color: transparent; }
  .cd-spinner-green { border-color: rgba(52,211,153,0.3); border-top-color: #059669; }
  .cd-spinner-dark { border-color: currentColor; border-right-color: transparent; }
  @keyframes cd-spin { to { transform: rotate(360deg); } }
`;

const styles = {
  page: { fontFamily: "Inter, system-ui, sans-serif", display: "flex", flexDirection: "column", gap: 24 },
  centerText: { textAlign: "center", padding: 60, color: "#64748b", fontSize: 14 },
  smallCenter: { textAlign: "center", padding: 24, color: "#64748b", fontSize: 12 },
  errorText: { display: "flex", alignItems: "center", gap: 10, color: "#be123c", padding: 16, backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 12, fontSize: 14 },

  topRow: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", textDecoration: "none", fontSize: 13, fontWeight: 500, transition: "color .15s" },
  excelBtn: { display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.3)", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 500, fontSize: 13 },

  classCard: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 },
  classKicker: { display: "inline-block", marginBottom: 8, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#2563eb", backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" },
  className: { margin: 0, fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" },
  classDesc: { margin: "8px 0 0", fontSize: 13, lineHeight: 1.65, color: "#64748b", whiteSpace: "pre-wrap", maxWidth: 860 },
  classChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, color: "#334155", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" },
  classChipMentor: { color: "#047857", backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)" },
  classChipWarn: { color: "#d97706", backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" },
  classBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #cbd5e1", backgroundColor: "transparent", color: "#334155", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  classBtnDanger: { color: "#e11d48", backgroundColor: "rgba(244,63,94,0.1)", borderColor: "rgba(244,63,94,0.3)" },
  manageCard: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 20, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.05)" },
  manageIcon: { width: 46, height: 46, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "linear-gradient(135deg, #2563eb, #0ea5e9)", boxShadow: "0 8px 20px rgba(37,99,235,0.25)" },
  manageStats: { display: "flex", flexWrap: "wrap", gap: 12 },
  manageStat: { display: "flex", alignItems: "center", gap: 10, minWidth: 130, padding: "10px 14px", borderRadius: 12, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" },
  manageStatIcon: { width: 34, height: 34, borderRadius: 10, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  heroCard: { position: "relative", overflow: "hidden", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(15,23,42,0.05)" },
  glow: { position: "absolute", width: 260, height: 260, borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" },
  heroTop: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 20 },
  heroIcon: { width: 48, height: 48, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" },
  heroTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" },
  heroSubtitle: { margin: "4px 0 0", fontSize: 13, color: "#64748b" },
  heroPercent: { fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(90deg, #1d4ed8, #0ea5e9)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" },
  heroPercentLabel: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" },
  progressTrack: { marginTop: 20, height: 14, padding: 2, boxSizing: "border-box", borderRadius: 999, backgroundColor: "#e2e8f0", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #2563eb, #0ea5e9)", transition: "width .7s ease-out" },
  heroStats: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" },
  statPill: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, fontSize: 12, backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" },
  dot: { width: 8, height: 8, borderRadius: "50%" },

  tabBar: { display: "flex", flexWrap: "wrap", gap: 8, padding: 4, backgroundColor: "#eef2f7", border: "1px solid #e2e8f0", borderRadius: 12, alignSelf: "flex-start" },
  tabBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, border: "1px solid transparent", backgroundColor: "transparent", color: "#64748b", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  tabBtnActive: { backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#1d4ed8", fontWeight: 600, boxShadow: "0 1px 3px rgba(15,23,42,0.08)" },

  sectionBox: { display: "flex", flexDirection: "column", gap: 16, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(15,23,42,0.08)" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #e2e8f0" },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  sectionTitle: { margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" },
  sectionSubtitle: { margin: "2px 0 0", fontSize: 11, color: "#64748b" },
  countBadge: { padding: "1px 8px", borderRadius: 999, border: "1px solid", fontSize: 11, fontWeight: 600 },
  addBtn: { display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12, boxShadow: "0 4px 12px rgba(37,99,235,0.25)" },
  addBtnAmber: { backgroundColor: "#d97706", color: "#fff", boxShadow: "0 4px 12px rgba(251,191,36,0.2)" },

  sectionToolbar: { display: "flex", gap: 8, alignItems: "center" },
  searchWrap: { position: "relative", flex: 1 },
  searchIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" },
  sortIcon: { position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" },
  clearBtn: { position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", padding: 2 },

  list: { display: "flex", flexDirection: "column", gap: 12 },
  itemCard: { display: "flex", alignItems: "flex-start", gap: 14, padding: 14, borderRadius: 12, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" },
  orderCircle: { width: 32, height: 32, flexShrink: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#2563eb", backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)" },
  itemTitle: { margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" },
  itemText: { margin: "4px 0 0", fontSize: 12, lineHeight: 1.6, color: "#64748b", whiteSpace: "pre-wrap" },
  completeBtn: { alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, backgroundColor: "transparent", color: "#64748b", border: "1px solid #e2e8f0", padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500 },
  chip: { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, fontSize: 11, color: "#64748b", backgroundColor: "#e2e8f0", border: "1px solid transparent" },
  chipDanger: { color: "#e11d48", backgroundColor: "rgba(244,63,94,0.15)", borderColor: "rgba(244,63,94,0.3)", fontWeight: 500 },
  chipWarn: { color: "#d97706", backgroundColor: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)" },
  chipBlue: { color: "#2563eb", backgroundColor: "rgba(59,130,246,0.12)", borderColor: "rgba(59,130,246,0.3)" },
  detailBtn: { display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: "none", color: "#d97706", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" },
  detailBtnMuted: { color: "#64748b", backgroundColor: "#e2e8f0", borderColor: "#cbd5e1" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "28px 16px", textAlign: "center", borderRadius: 12, border: "1px dashed #e2e8f0", backgroundColor: "rgba(248,250,252,0.5)" },
  emptyIcon: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", backgroundColor: "#f1f5f9" },

  miniPagination: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #e2e8f0" },
  pageBtn: { display: "inline-flex", alignItems: "center", padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a", fontSize: 12, cursor: "pointer" },
  pageBtnDisabled: { opacity: 0.35, cursor: "not-allowed" },

  // Members Grid
  memberCard: { display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, backgroundColor: "#ffffff", border: "1px solid #e2e8f0" },
  memberAvatar: { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#1d4ed8", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 12, fontWeight: 600, flexShrink: 0 },
  memberName: { fontSize: 13, fontWeight: 600, color: "#0f172a" },
  memberEmail: { fontSize: 11, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  memberDate: { fontSize: 10, color: "#94a3b8", marginTop: 4 },
  paginationFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #e2e8f0" },

  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 1000 },
  modalContent: { width: "100%", maxWidth: 520, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, color: "#0f172a", overflow: "hidden", boxShadow: "0 25px 50px rgba(15,23,42,0.18)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" },
  modalIcon: { width: 40, height: 40, borderRadius: 12, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" },
  modalSubtitle: { margin: "2px 0 0", fontSize: 12, color: "#64748b" },
  closeBtn: { display: "flex", padding: 6, border: "none", borderRadius: 8, backgroundColor: "transparent", color: "#64748b", cursor: "pointer" },
  modalBody: { padding: 24 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 12, padding: "14px 24px", borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" },

  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  fieldRow: { display: "flex", flexWrap: "wrap", gap: 16 },
  label: { fontSize: 12, fontWeight: 600, color: "#0f172a" },
  req: { color: "#f43f5e" },
  hint: { fontSize: 11, color: "#94a3b8" },
  input: { width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a", fontSize: 13, outline: "none", fontFamily: "inherit" },
  textarea: { resize: "vertical", lineHeight: 1.6, minHeight: 96 },
  inputIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" },
  saveBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 8px 20px rgba(37,99,235,0.3)" },
  saveBtnAmber: { backgroundColor: "#d97706", color: "#fff", boxShadow: "0 8px 20px rgba(251,191,36,0.2)" },
  cancelBtn: { padding: "9px 16px", backgroundColor: "transparent", color: "#64748b", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" },
};
