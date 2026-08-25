"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "../app/providers";
const links = [["/dashboard","⌂","Dashboard"],["/history","↻","History"],["/mock","◇","Full Mock Test"],["/tests/reading","▤","Reading"],["/tests/listening","◉","Listening"],["/tests/writing","✎","Writing"],["/tests/speaking","◌","Speaking"],["/typing","⌨","Typing Practice"]];
export default function AppShell({ children }: { children: ReactNode }) { const pathname=usePathname(); const {role,demoMode}=useAuth(); return <div className="product-shell"><aside className="product-sidebar"><Link className="product-logo" href="/"><span>IS</span><strong>IELTS Scholars</strong></Link><p className="side-label">Overview</p><nav>{links.map(([href,icon,label])=><Link className={pathname===href?"active":""} href={href} key={href}><i>{icon}</i>{label}</Link>)}</nav>{role==="admin"&&<><p className="side-label">Administration</p><nav><Link className={pathname.startsWith("/admin")?"active":""} href="/admin"><i>⚙</i>Admin Panel</Link></nav></>}<div className="side-account"><span>{demoMode?"DEMO MODE":role.toUpperCase()}</span><strong>{role==="admin"?"Administrator":"Scholar account"}</strong><Link href="/login">Account settings →</Link></div></aside><main className="product-main">{children}</main></div>; }
