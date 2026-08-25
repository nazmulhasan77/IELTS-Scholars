"use client";
import { useEffect,useState } from "react";
import AppShell from "../../components/AppShell";
import { listAttempts } from "../../lib/test-service";
import type { Attempt } from "../../lib/types";
import { useAuth } from "../providers";
export default function History(){const{user}=useAuth();const[attempts,setAttempts]=useState<Attempt[]>([]);useEffect(()=>{listAttempts(user?.uid??"demo-scholar").then(setAttempts)},[user]);return <AppShell><section className="product-page simple-page"><span className="mini-pill">ATTEMPT HISTORY</span><h1>Your practice record</h1><p>Review completed tests and pending writing or speaking evaluations.</p><div className="history-list">{attempts.map(a=><article key={a.id}><span className={`history-icon ${a.module}`}>{a.module.slice(0,2).toUpperCase()}</span><div><small>{a.module.toUpperCase()}</small><h2>{a.testTitle}</h2><p>{new Date(a.submittedAt).toLocaleString()}</p></div><div><strong>{a.status==="pending-review"?"Pending":`Band ${a.estimatedBand}`}</strong><span>{a.status==="scored"?`${a.score}/${a.total} correct`:"Examiner review"}</span></div></article>)}{!attempts.length&&<div className="empty-state"><strong>No attempts yet</strong><p>Choose a module from the dashboard to begin.</p><a href="/dashboard">Start practising →</a></div>}</div></section></AppShell>}
