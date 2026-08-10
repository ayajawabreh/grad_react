import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { CandidateCard } from "../../components/cards/CandidateCard";
import { Search, CheckCircle2, Users, UserCheck, Calendar, UserX, X } from "lucide-react";
import {
  fetchApplicants,
  type UiApplicant,
  updateApplicationStatus,
} from "../../imports/applicants";
import { shortlistApplicant } from "../../imports/api";
import ScheduleInterviewModal from "./ScheduleInterviewModal";
import BulkScheduleModal from "./BulkScheduleModal";

export default function Applicants() {
  const nav = useNavigate();

  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("All");
  const [candidates, setCandidates] = useState<UiApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkSchedule, setShowBulkSchedule] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    let mounted = true;

    fetchApplicants()
      .then((data) => {
        if (mounted) {
          setCandidates(data);
        }
      })
      .catch((err) => {
        console.error(err);

        if (mounted) {
          setError("Failed to load applicants");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);


  const filtered = candidates.filter((candidate) => {
    const q = query.toLowerCase();

    const matchQuery =
      !q ||
      candidate.name.toLowerCase().includes(q) ||
      candidate.title.toLowerCase().includes(q) ||
      candidate.job.toLowerCase().includes(q);

    const matchJob =
      jobFilter === "All" ||
      candidate.job === jobFilter;

    return matchQuery && matchJob;
  });


  const jobOptions = [
    "All",
    ...Array.from(
      new Set(candidates.map((candidate) => candidate.job))
    ),
  ];

  const toggleSelect = (applicationId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }
      return next;
    });
  };

  const isAllSelected =
    filtered.length > 0 &&
    filtered.every((candidate) => selectedIds.has(candidate.application_id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.application_id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkShortlist = async () => {
    try {
      setBulkLoading(true);

      await Promise.all(
        Array.from(selectedIds).map((id) => shortlistApplicant(id))
      );

      clearSelection();
      nav("/company/shortlisted");
    } catch (err) {
      console.error(err);
      showToast("Failed to shortlist some candidates");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (!window.confirm(`Reject ${selectedIds.size} candidate(s)?`)) {
      return;
    }

    try {
      setBulkLoading(true);

      await Promise.all(
        Array.from(selectedIds).map((id) =>
          updateApplicationStatus(id, "Rejected")
        )
      );

      setCandidates((prev) =>
        prev.map((c) =>
          selectedIds.has(c.application_id)
            ? { ...c, status: "Rejected" }
            : c
        )
      );

      showToast("Selected candidates have been rejected.");
      clearSelection();
    } catch (err) {
      console.error(err);
      showToast("Failed to reject some candidates");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkScheduleSuccess = () => {
    clearSelection();
    showToast("Interviews scheduled successfully");
    nav("/company/interviews");
  };


  if (loading) {
    return (
      <div style={{ fontFamily: F, color: C.text }}>
        <p style={{ color: C.textSec, fontSize: 14 }}>
          Loading applicants…
        </p>
      </div>
    );
  }


  if (error) {
    return (
      <div style={{ fontFamily: F, color: C.text }}>
        <p style={{ color: C.textSec, fontSize: 14 }}>
          {error}
        </p>
      </div>
    );
  }


  return (
    <div style={{ fontFamily: F, color: C.text, position: "relative" }}>

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            borderRadius: 8,
            background: "#ffffff",
            color: "#1f2937",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#10b981" }} />
          <span>{toastMessage}</span>
        </div>
      )}


      <div style={{ marginBottom:24 }}>
        <h1
          style={{
            fontSize:24,
            fontWeight:900,
            margin:0
          }}
        >
          Applicants
        </h1>

        <p
          style={{
            color:C.textSec,
            fontSize:14,
            marginTop:6
          }}
        >
          {candidates.length} total candidates
        </p>
      </div>


      <div style={{ position:"relative", marginBottom:16 }}>
        <Search
          size={14}
          style={{
            position:"absolute",
            left:12,
            top:"50%",
            transform:"translateY(-50%)",
            color:C.textMuted
          }}
        />

        <input
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          placeholder="Search candidates…"
          style={{
            width:"100%",
            padding:"10px 12px 10px 36px",
            borderRadius:12,
            border:`1px solid ${C.border}`,
            fontFamily:F,
            fontSize:13,
            background:C.surface,
            boxSizing:"border-box"
          }}
        />
      </div>


      <div
        style={{
          display:"flex",
          gap:8,
          flexWrap:"wrap",
          marginBottom:16
        }}
      >
        {jobOptions.map((job)=>(
          <button
            key={job}
            onClick={()=>setJobFilter(job)}
            style={{
              padding:"6px 14px",
              borderRadius:99,
              border:`1px solid ${
                jobFilter===job ? C.accent : C.border
              }`,
              background:
                jobFilter===job
                ? C.accentLight
                : C.surface,
              color:
                jobFilter===job
                ? C.accentHover
                : C.textSec,
              fontSize:12,
              fontWeight:600,
              cursor:"pointer",
              fontFamily:F
            }}
          >
            {job}
          </button>
        ))}
      </div>


      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
          padding: "10px 14px",
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          background: C.surface,
        }}
      >
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={toggleSelectAll}
          disabled={filtered.length === 0}
          style={{
            width: 16,
            height: 16,
            cursor: filtered.length === 0 ? "default" : "pointer",
            accentColor: C.accent,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
          Select All
        </span>
        {selectedIds.size > 0 && (
          <span style={{ fontSize: 12, color: C.textSec }}>
            ({selectedIds.size} selected)
          </span>
        )}
      </div>


      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(2,1fr)",
          gap:16,
          marginBottom: selectedIds.size > 0 ? 100 : 0
        }}
      >

        {filtered.length===0 ? (
          <p style={{color:C.textSec,fontSize:14}}>
            No applicants found.
          </p>
        ) : (

          filtered.map((candidate)=>(

            <CandidateCard
              key={candidate.id}
              c={candidate}

              selected={selectedIds.has(candidate.application_id)}
              onToggleSelect={() => toggleSelect(candidate.application_id)}

              onView={() =>
                nav(`/company/applicants/${candidate.id}`)
              }

              onShortlist={async()=>{

  try{

    await shortlistApplicant(candidate.id);

    setCandidates(prev =>
      prev.map(c =>
        c.id === candidate.id
        ? {...c, status:"Shortlisted"}
        : c
      )
    );

    showToast(
      `${candidate.name} has been added to shortlist.`
    );

  }catch(error){
    console.error(error);
  }

}}


              onInterview={()=>{

                console.log("Selected application:", candidate.application_id, candidate);

                setSelectedApplication(
                  candidate.application_id ?? candidate.id
                );

                setShowSchedule(true);

              }}

              onReject={async()=>{

  try{

    await updateApplicationStatus(candidate.application_id, "Rejected");

    setCandidates(prev =>
      prev.map(c =>
        c.id === candidate.id
        ? {...c, status:"Rejected"}
        : c
      )
    );

    showToast(
      `${candidate.name} has been rejected.`
    );

  }catch(error){
    console.error(error);
  }

}}

            />

          ))

        )}

      </div>


      {selectedIds.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 16,
            background: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: "0 12px 30px -8px rgba(0,0,0,0.18)",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.text,
              padding: "0 8px",
              whiteSpace: "nowrap",
            }}
          >
            {selectedIds.size} selected
          </span>

          <button
            disabled={bulkLoading}
            onClick={handleBulkShortlist}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #a7f3d0",
              background: "#ecfdf5",
              color: "#059669",
              fontSize: 13,
              fontWeight: 600,
              cursor: bulkLoading ? "default" : "pointer",
              opacity: bulkLoading ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            <UserCheck size={14} />
            Shortlist
          </button>

          <button
            disabled={bulkLoading}
            onClick={() => setShowBulkSchedule(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#f3f4f6",
              color: C.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: bulkLoading ? "default" : "pointer",
              opacity: bulkLoading ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            <Calendar size={14} />
            Schedule Interview
          </button>

          <button
            disabled={bulkLoading}
            onClick={handleBulkReject}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #fee2e2",
              background: "#ffffff",
              color: "#ef4444",
              fontSize: 13,
              fontWeight: 600,
              cursor: bulkLoading ? "default" : "pointer",
              opacity: bulkLoading ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            <UserX size={14} />
            Reject
          </button>

          <button
            disabled={bulkLoading}
            onClick={clearSelection}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.bg,
              color: C.textSec,
              cursor: bulkLoading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}


      {showSchedule && selectedApplication && (

        <ScheduleInterviewModal

          applicationId={selectedApplication}

          onClose={()=>{
            setShowSchedule(false);
            setSelectedApplication(null);
          }}

          onSuccess={()=>{
            showToast("Interview scheduled successfully");
          }}

        />

      )}

      {showBulkSchedule && (

        <BulkScheduleModal

          applicationIds={Array.from(selectedIds)}

          onClose={() => setShowBulkSchedule(false)}

          onSuccess={handleBulkScheduleSuccess}

        />

      )}

    </div>
  );
}