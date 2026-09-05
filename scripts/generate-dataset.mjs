#!/usr/bin/env node

/**
 * IELTS Dataset Generator & Management CLI
 * 
 * Usage:
 *   node scripts/generate-dataset.mjs --stats
 *   node scripts/generate-dataset.mjs --validate
 *   node scripts/generate-dataset.mjs --help
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_PATH = path.resolve(__dirname, "../data/ielts-dataset.json");

function loadDataset() {
  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`Dataset file not found at: ${DATASET_PATH}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(DATASET_PATH, "utf-8");
  return JSON.parse(raw);
}

function printStats() {
  const tests = loadDataset();
  console.log("\n=======================================================");
  console.log("       IELTS SCHOLARS · DATASET SUMMARY & METRICS      ");
  console.log("=======================================================\n");

  const byModule = { reading: 0, listening: 0, writing: 0, speaking: 0 };
  const byTraining = { academic: 0, general: 0 };
  let totalQuestions = 0;
  let totalDuration = 0;
  const questionTypes = {};

  for (const test of tests) {
    byModule[test.module] = (byModule[test.module] || 0) + 1;
    byTraining[test.trainingType] = (byTraining[test.trainingType] || 0) + 1;
    totalDuration += test.durationMinutes || 0;
    totalQuestions += (test.questions || []).length;

    for (const q of test.questions || []) {
      questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
    }
  }

  console.log(`Total Practice Tests : ${tests.length}`);
  console.log(`Total Questions      : ${totalQuestions}`);
  console.log(`Total Exam Time      : ${totalDuration} minutes (~${(totalDuration / 60).toFixed(1)} hours)\n`);

  console.log("Breakdown by Module:");
  for (const [mod, count] of Object.entries(byModule)) {
    console.log(`  - ${mod.padEnd(12)}: ${count} test(s)`);
  }

  console.log("\nBreakdown by Training Type:");
  for (const [type, count] of Object.entries(byTraining)) {
    console.log(`  - ${type.padEnd(12)}: ${count} test(s)`);
  }

  console.log("\nQuestion Types Distribution:");
  for (const [type, count] of Object.entries(questionTypes)) {
    console.log(`  - ${type.padEnd(22)}: ${count}`);
  }

  console.log("\nDetailed Tests List:");
  tests.forEach((t, i) => {
    const qCount = (t.questions || []).length;
    console.log(`  ${String(i + 1).padStart(2, " ")}. [${t.module.toUpperCase()}/${t.trainingType}] ${t.title} (${t.durationMinutes}m, ${qCount} Qs)`);
  });
  console.log("\n=======================================================\n");
}

function validateDataset() {
  const tests = loadDataset();
  let errors = 0;
  let warnings = 0;

  console.log(`\nValidating ${tests.length} tests from ${DATASET_PATH}...`);

  const seenIds = new Set();

  tests.forEach((test, idx) => {
    const prefix = `Test #${idx + 1} (${test.id || "unnamed"})`;

    if (!test.id) {
      console.error(`❌ ${prefix}: Missing required 'id'`);
      errors++;
    } else if (seenIds.has(test.id)) {
      console.error(`❌ ${prefix}: Duplicate ID '${test.id}'`);
      errors++;
    } else {
      seenIds.add(test.id);
    }

    if (!test.title) {
      console.error(`❌ ${prefix}: Missing required 'title'`);
      errors++;
    }

    if (!["reading", "listening", "writing", "speaking"].includes(test.module)) {
      console.error(`❌ ${prefix}: Invalid module '${test.module}'`);
      errors++;
    }

    if (!["academic", "general"].includes(test.trainingType)) {
      console.error(`❌ ${prefix}: Invalid trainingType '${test.trainingType}'`);
      errors++;
    }

    if (!test.durationMinutes || test.durationMinutes <= 0) {
      console.error(`❌ ${prefix}: Invalid durationMinutes '${test.durationMinutes}'`);
      errors++;
    }

    if (test.module === "reading" && !test.passage) {
      console.warn(`⚠️  ${prefix}: Reading test is missing passage text`);
      warnings++;
    }

    if (test.module === "writing" && !test.taskPrompt) {
      console.warn(`⚠️  ${prefix}: Writing test is missing taskPrompt`);
      warnings++;
    }

    if (test.module === "speaking" && (!test.speakingParts || test.speakingParts.length === 0)) {
      console.warn(`⚠️  ${prefix}: Speaking test is missing speakingParts`);
      warnings++;
    }

    // Question validation
    if (test.module === "reading" || test.module === "listening") {
      if (!test.questions || test.questions.length === 0) {
        console.error(`❌ ${prefix}: Objective module has 0 questions`);
        errors++;
      }
      test.questions?.forEach((q, qIdx) => {
        if (!q.id) {
          console.error(`❌ ${prefix} Q#${qIdx + 1}: Missing question ID`);
          errors++;
        }
        if (!q.answer) {
          console.error(`❌ ${prefix} Q#${qIdx + 1}: Objective question missing canonical answer`);
          errors++;
        }
      });
    }
  });

  if (errors === 0) {
    console.log(`\n✅ Dataset Validation Passed! (0 errors, ${warnings} warnings)\n`);
  } else {
    console.error(`\n❌ Dataset Validation Failed with ${errors} error(s) and ${warnings} warning(s)!\n`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);

if (args.includes("--stats")) {
  printStats();
} else if (args.includes("--validate")) {
  validateDataset();
} else {
  console.log(`
IELTS Scholars Dataset Management Utility

Commands:
  --stats      Show comprehensive statistical overview of IELTS dataset
  --validate   Perform structural and scoring integrity validation
  --help       Show this help manual
`);
  printStats();
}
