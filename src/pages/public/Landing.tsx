import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Briefcase, Sparkles, Building2, Shield, ArrowRight, User, BadgeCheck, MapPin } from "lucide-react";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { getLandingCompanies } from "../../imports/api";


const FEATURES = [
  { icon: Briefcase, title: "10,000+ Live Jobs", desc: "From top startups to Fortune 500 companies, curated for graduates.", color: C.accent },
  { icon: Sparkles, title: "AI-Powered Matching", desc: "Get matched to roles that fit your skills, university, and ambitions.", color: C.purple },
  { icon: Building2, title: "500+ Partner Companies", desc: "Verified companies across tech, finance, design, and beyond.", color: C.info },
  { icon: Shield, title: "Verified & Secure", desc: "All companies are verified. Your data is private and protected.", color: C.success },
];

type LandingCompany = {
  id?: string | number;
  logo?: string | null;
  company_name?: string | null;
  industry?: string | null;
  location?: string | null;
  is_verified?: boolean;
};

function CompaniesCarousel() {
  const [companies, setCompanies] = useState<LandingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const pointerXRef = useRef(0);
  const scrollStartRef = useRef(0);

  useEffect(() => {
    let active = true;
    getLandingCompanies()
      .then((response) => {
        if (active) setCompanies(Array.isArray(response?.companies) ? response.companies : []);
      })
      .catch((error) => console.error("Failed to load landing companies:", error))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const carouselCompanies = useMemo(() => {
    if (!companies.length) return [];
    const repeatCount = Math.max(1, Math.ceil(8 / companies.length));
    return Array.from({ length: repeatCount }, () => companies).flat();
  }, [companies]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !carouselCompanies.length) return;
    let frame = 0;
    let previousTime = performance.now();

    const animate = (time: number) => {
      const halfWidth = viewport.scrollWidth / 2;
      if (!pausedRef.current && !draggingRef.current && halfWidth > 0) {
        viewport.scrollLeft += Math.min(time - previousTime, 32) * 0.035;
        if (viewport.scrollLeft >= halfWidth) viewport.scrollLeft -= halfWidth;
      }
      previousTime = time;
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [carouselCompanies]);

  const normalizeScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const halfWidth = viewport.scrollWidth / 2;
    if (viewport.scrollLeft >= halfWidth) viewport.scrollLeft -= halfWidth;
    if (viewport.scrollLeft < 0) viewport.scrollLeft += halfWidth;
  };

  const startDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    draggingRef.current = true;
    pausedRef.current = true;
    pointerXRef.current = event.clientX;
    scrollStartRef.current = viewport.scrollLeft;
    viewport.setPointerCapture(event.pointerId);
  };

  const drag = (event: React.PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || !draggingRef.current) return;
    viewport.scrollLeft = scrollStartRef.current - (event.clientX - pointerXRef.current);
    normalizeScroll();
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    pausedRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  if (loading) {
    return <div className="landing-companies-status">Loading partner companies...</div>;
  }

  if (!carouselCompanies.length) {
    return <div className="landing-companies-status">Partner companies will appear here soon.</div>;
  }

  const renderCompany = (company: LandingCompany, index: number, copy: number) => {
    const name = company.company_name?.trim() || "Company";
    return (
      <article className="landing-company-card" key={`${copy}-${company.id ?? name}-${index}`}>
        <div className="landing-company-logo">
          {company.logo ? (
            <img src={company.logo} alt={`${name} logo`} draggable={false} />
          ) : (
            <span>{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="landing-company-details">
          <div className="landing-company-name">
            <span>{name}</span>
            {company.is_verified === true && <BadgeCheck size={17} aria-label="Verified company" />}
          </div>
          <p>{company.industry || "Industry not specified"}</p>
          <div className="landing-company-location"><MapPin size={13} /><span>{company.location || "Location not specified"}</span></div>
        </div>
      </article>
    );
  };

  return (
    <div
      ref={viewportRef}
      className="landing-companies-carousel"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { if (!draggingRef.current) pausedRef.current = false; }}
      onPointerDown={startDragging}
      onPointerMove={drag}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      aria-label="Partner companies"
    >
      <div className="landing-companies-track">
        <div className="landing-companies-set">{carouselCompanies.map((company, index) => renderCompany(company, index, 0))}</div>
        <div className="landing-companies-set" aria-hidden="true">{carouselCompanies.map((company, index) => renderCompany(company, index, 1))}</div>
      </div>
    </div>
  );
}

export default function Landing() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(248,248,246,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>CB</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>CareerBridge</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["Browse Jobs", "For Companies", "How It Works"].map(l => (
            <button key={l} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, color: C.textSec, background: "transparent", border: "none", cursor: "pointer", fontFamily: F }}
              onMouseEnter={e => e.currentTarget.style.background = C.divider}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{l}</button>
          ))}
          <div style={{ width: 1, height: 20, background: C.border, margin: "0 4px" }} />
          <button onClick={() => nav("/login")} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.text, background: "transparent", border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: F }}>Sign In</button>
          <Btn onClick={() => nav("/register")}>Get Started</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: C.darker, padding: "100px 48px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 39px,${C.accent} 39px,${C.accent} 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,${C.accent} 39px,${C.accent} 40px)` }} />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: `${C.accent}20`, border: `1px solid ${C.accent}40`, marginBottom: 28 }}>
            <Sparkles size={12} style={{ color: C.accent }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>The Graduate Recruitment Platform</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px,5vw,64px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
            Launch Your Career<br /><span style={{ color: C.accent }}>with Confidence</span>
          </h1>
          <p style={{ fontSize: 18, color: "#9DA3AB", lineHeight: 1.7, margin: "0 0 40px" }}>
            CareerBridge connects ambitious graduates with the companies shaping tomorrow's world.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn size="lg" onClick={() => nav("/register")}>Get Started Free</Btn>
            <button onClick={() => nav("/login")} style={{ padding: "16px 32px", borderRadius: 14, fontSize: 15, fontWeight: 600, color: "#fff", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontFamily: F }}>Sign In</button>
            <button onClick={() => nav("/login")} style={{ padding: "16px 32px", borderRadius: 14, fontSize: 15, fontWeight: 600, color: "#fff", background: `${C.accent}20`, border: `1px solid ${C.accent}50`, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={15} />Post a Job
            </button>
          </div>
        </div>
      </section>

      {/* Partner companies */}
      <section className="landing-companies-section">
        <div className="landing-companies-heading">
          <p>Companies on CareerBridge</p>
          <h2>Meet the teams building what comes next</h2>
        </div>
        <CompaniesCarousel />
      </section>

      {/* Features */}
      <section style={{ padding: "80px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center", marginBottom: 12, fontFamily: F }}>Why CareerBridge</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: C.text, textAlign: "center", margin: "0 0 48px", fontFamily: F }}>Everything you need to succeed</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} style={{ padding: 28, borderRadius: 20, border: `1px solid ${C.border}`, background: C.surface }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 8px", fontFamily: F }}>{title}</h3>
                <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6, margin: 0, fontFamily: F }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role CTAs */}
      <section style={{ padding: "0 48px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: C.text, textAlign: "center", margin: "0 0 40px", fontFamily: F }}>Who are you?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { role: "Student", icon: User, color: C.success, desc: "Discover opportunities, build your resume, and land your first great job." },
              { role: "Company", icon: Building2, color: C.accent, desc: "Find exceptional graduate talent, manage hiring, and build your team." },
              { role: "Admin", icon: Shield, color: C.error, desc: "Platform administration, analytics, and system management tools." },
            ].map(({ role, icon: Icon, color, desc }) => (
              <div key={role} onClick={() => nav("/login")} style={{ padding: 32, borderRadius: 20, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = color + "60"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icon size={24} style={{ color }} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 10px", fontFamily: F }}>{role}</h3>
                <p style={{ fontSize: 13, color: C.textSec, margin: "0 0 20px", lineHeight: 1.6, fontFamily: F }}>{desc}</p>
                <span style={{ fontSize: 13, fontWeight: 700, color, display: "flex", alignItems: "center", gap: 5 }}>Get Started <ArrowRight size={13} /></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 48px", borderTop: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>CB</span>
          </div>
          <span style={{ fontSize: 13, color: C.textSec, fontFamily: F }}>© 2025 CareerBridge. All rights reserved.</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "Contact"].map(l => <span key={l} style={{ fontSize: 13, color: C.textSec, cursor: "pointer", fontFamily: F }}>{l}</span>)}
        </div>
      </footer>
    </div>
  );
}
