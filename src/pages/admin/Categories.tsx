import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Briefcase, Layers, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Btn } from "../../components/ui";
import { C, F } from "../../constants/tokens";
import { createAdminCategory, deleteAdminCategory, getAdminCategories, updateAdminCategory } from "../../imports/api";

type Category = { id: number; name: string; jobs_count?: number; job_count?: number; jobs?: number | unknown[] };
const jobsCount = (category: Category) => category.jobs_count ?? category.job_count ?? (typeof category.jobs === "number" ? category.jobs : Array.isArray(category.jobs) ? category.jobs.length : 0);
const panel = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18 };

export default function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { (async () => {
    try {
      const response = await getAdminCategories(); const data = response?.data ?? response;
      setItems(Array.isArray(data) ? data : data?.categories ?? data?.data ?? []);
    } catch (error) {
      console.error("Could not load categories from /admin/categories.", error);
      setItems([]);
      toast.error("Could not load job categories");
    } finally { setLoading(false); }
  })(); }, []);
  const filtered = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase().trim())), [items, query]);
  const openForm = (category?: Category) => { setForm(category ?? "new"); setName(category?.name ?? ""); };
  const save = async () => {
    const clean = name.trim();
    if (!clean) return toast.error("Category name is required");
    if (items.some((item) => item.id !== (form === "new" ? undefined : form?.id) && item.name.toLowerCase() === clean.toLowerCase())) return toast.error("This category already exists");
    try {
      setBusy(true);
      if (form !== "new" && form) {
        await updateAdminCategory(form.id, { name: clean });
        setItems((current) => current.map((item) => item.id === form.id ? { ...item, name: clean } : item));
        toast.success("Category updated successfully", { description: `Category renamed to “${clean}”.` });
      } else {
        const response = await createAdminCategory({ name: clean }); const data = response?.data ?? response; const created = data?.category ?? data;
        setItems((current) => [...current, created?.id ? created : { id: Math.max(0, ...current.map((item) => item.id)) + 1, name: clean, jobs_count: 0 }]);
        toast.success("Category added successfully", { description: `“${clean}” is ready to use.` });
      }
      setForm(null); setName("");
    } catch (error: any) { toast.error("Could not save category", { description: error?.response?.data?.message }); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleting) return;
    if (jobsCount(deleting) > 0) { toast.error("Category cannot be deleted", { description: `Move its ${jobsCount(deleting)} jobs to another category first.` }); setDeleting(null); return; }
    try { setBusy(true); await deleteAdminCategory(deleting.id); setItems((current) => current.filter((item) => item.id !== deleting.id)); toast.success("Category deleted successfully"); setDeleting(null); }
    catch (error: any) { toast.error("Could not delete category", { description: error?.response?.data?.message || "The category may still be in use." }); } finally { setBusy(false); }
  };

  return <div className="admin-categories-page" style={{ fontFamily: F, color: C.text }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 24 }}><div><h1 style={{ fontSize: 25, fontWeight: 800, margin: 0 }}>Job Categories</h1><p style={{ color: C.textSec, fontSize: 14, margin: "6px 0 0" }}>Organize jobs using a consistent platform-wide category catalog.</p></div><Btn v="primary" size="sm" icon={Plus} onClick={() => openForm()}>Add Category</Btn></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
      {[{ label: "Total Categories", value: items.length, icon: Layers, color: C.purple, bg: C.purpleBg }, { label: "Categorized Jobs", value: items.reduce((sum, item) => sum + jobsCount(item), 0), icon: Briefcase, color: C.info, bg: C.infoBg }].map(({ label, value, icon: Icon, color, bg }) => <div key={label} style={{ ...panel, padding: 18, display: "flex", gap: 13, alignItems: "center" }}><div style={{ width: 42, height: 42, borderRadius: 12, background: bg, color, display: "grid", placeItems: "center" }}><Icon size={19}/></div><div><b style={{ fontSize: 21 }}>{loading ? "—" : value}</b><div style={{ color: C.textSec, fontSize: 12 }}>{label}</div></div></div>)}
    </div>
    <div style={{ ...panel, overflow: "hidden" }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div><b>Category catalog</b><div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{filtered.length} categories</div></div><div style={{ position: "relative", width: 280, maxWidth: "100%" }}><Search size={15} style={{ position: "absolute", left: 12, top: 11, color: C.textMuted }}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search categories..." style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 36px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontFamily: F }}/></div></div>
      <div style={{ overflowX: "auto" }}><div style={{ minWidth: 600 }}><div style={{ display: "grid", gridTemplateColumns: "90px 1fr 150px 160px", padding: "12px 20px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.textMuted }}><span>ID</span><span>CATEGORY</span><span>JOBS</span><span>ACTIONS</span></div>
      {loading ? <div style={{ padding: 40, textAlign: "center", color: C.textSec }}>Loading categories...</div> : filtered.length === 0 ? <div style={{ padding: 44, textAlign: "center", color: C.textSec }}>No categories found.</div> : filtered.map((item, index) => <div key={item.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 150px 160px", padding: "15px 20px", alignItems: "center", borderBottom: index < filtered.length - 1 ? `1px solid ${C.divider}` : "none" }}><span style={{ fontFamily: "monospace", color: C.textSec }}>#{item.id}</span><span style={{ fontWeight: 700, display: "flex", gap: 9, alignItems: "center" }}><Layers size={16} color={C.purple}/>{item.name}</span><span style={{ fontSize: 13, color: C.textSec }}>{jobsCount(item)} jobs</span><div style={{ display: "flex", gap: 7 }}><button onClick={() => openForm(item)} style={{ border: `1px solid ${C.border}`, background: C.infoBg, color: C.info, borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: F, fontSize: 12, fontWeight: 600 }}><Pencil size={13}/>Edit</button><button onClick={() => setDeleting(item)} style={{ border: `1px solid ${C.border}`, background: C.errorBg, color: C.error, borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}><Trash2 size={14}/></button></div></div>)}</div></div>
    </div>
    {form && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,23,42,.48)", backdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 20 }}><div style={{ ...panel, width: 420, maxWidth: "100%", padding: 24, boxShadow: "0 24px 70px rgba(0,0,0,.2)" }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><h2 style={{ margin: 0, fontSize: 18 }}>{form === "new" ? "Add Category" : "Edit Category"}</h2><p style={{ color: C.textSec, fontSize: 12 }}>Use a clear name that companies can understand.</p></div><button onClick={() => setForm(null)} style={{ border: 0, background: "none", cursor: "pointer" }}><X size={18}/></button></div><label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Category name</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="e.g. Cyber Security" style={{ width: "100%", boxSizing: "border-box", padding: 12, border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: F }}/><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 22 }}><Btn v="outline" size="sm" onClick={() => setForm(null)}>Cancel</Btn><Btn size="sm" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save Category"}</Btn></div></div></div>}
    {deleting && <div style={{ position: "fixed", inset: 0, zIndex: 101, background: "rgba(15,23,42,.48)", display: "grid", placeItems: "center", padding: 20 }}><div style={{ ...panel, width: 420, maxWidth: "100%", padding: 24 }}><AlertTriangle size={24} color={jobsCount(deleting) ? C.warning : C.error}/><h2 style={{ fontSize: 18 }}>Delete “{deleting.name}”?</h2><p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>{jobsCount(deleting) ? `This category contains ${jobsCount(deleting)} jobs and cannot be safely deleted. Move those jobs first.` : "This category has no linked jobs. This action cannot be undone."}</p><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}><Btn v="outline" size="sm" onClick={() => setDeleting(null)}>Cancel</Btn><Btn v="danger" size="sm" onClick={remove} disabled={busy || jobsCount(deleting) > 0}>{jobsCount(deleting) ? "Category in use" : "Delete Category"}</Btn></div></div></div>}
  </div>;
}
