"use client";
import { useParams } from "next/navigation";
import TestRunner from "../../../components/TestRunner";
export default function TestPage(){const params=useParams<{id:string}>();return <TestRunner testId={params.id}/>}
