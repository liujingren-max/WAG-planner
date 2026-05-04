#!/usr/bin/env node
// Run: node scripts/extract-activities.js
// Reads CSV from ~/Downloads and writes public/activities-data.json

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(process.env.HOME, 'Downloads', 'Clean Progressions 11_2024 - FL Copy of Master Progressions.csv');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'activities-data.json');

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseStyles(facilitation) {
  if (!facilitation) return ['teacher'];
  const styles = [];
  const f = facilitation.toLowerCase();
  if (f.includes('teacher')) styles.push('teacher');
  if (f.includes('independent')) styles.push('individual');
  if (f.includes('collaborative') || f.includes('pair') || f.includes('group')) styles.push('collaborative');
  return styles.length > 0 ? styles : ['teacher'];
}

function normalizeHyphen(s) {
  return s.replace(/([A-Za-z])-([A-Za-z])/g, '$1 - $2');
}

function buildTitle(task, online, steps, taskRowCount) {
  const isMultiRow = taskRowCount > 1;

  if (task === 'Direct Instruction' && online) {
    return `Direct Instruction: ${online}`;
  }

  if (!isMultiRow) {
    return task;
  }

  // Multi-row task: derive substep
  if (task.includes('/') || task.includes(' and ')) {
    return normalizeHyphen(steps);
  }

  if (steps.startsWith(task + '-')) {
    return task + ' - ' + steps.slice(task.length + 1);
  }

  // Check short prefix (before "/" or " and ")
  const prefix = task.split('/')[0].split(' and ')[0].trim();
  if (prefix !== task && steps.startsWith(prefix + '-')) {
    return prefix + ' - ' + steps.slice(prefix.length + 1);
  }

  if (steps === task) return task;

  // Fallback: prefix with task name to avoid ambiguous short titles
  return `${task} - ${normalizeHyphen(steps)}`;
}

const content = fs.readFileSync(CSV_PATH, 'utf-8').replace(/^﻿/, '');
const lines = content.split('\n').filter(l => l.trim());
const dataLines = lines.slice(1); // skip header

// Group rows by module key
const moduleRows = {};
for (const line of dataLines) {
  const row = parseCSVLine(line);
  const grade = parseInt(row[0]);
  const unit = parseInt(row[1]);
  const module = parseInt(row[2]);
  if (isNaN(grade) || isNaN(unit) || isNaN(module)) continue;

  const task = row[4] || '';
  const online = row[5] || '';
  const steps = row[6] || '';
  const time = parseInt(row[7]);
  const optional = (row[8] || '').trim() === 'Optional';
  const facilitation = row[9] || '';

  if (isNaN(time) || !steps) continue;

  const key = `${grade}|${unit}|${module}`;
  if (!moduleRows[key]) moduleRows[key] = { grade, unit, module, rows: [] };
  moduleRows[key].rows.push({ task, online, steps, time, optional, facilitation });
}

// Build output indexed by grade → unit → module
const output = {};
let moduleCount = 0;

for (const { grade, unit, module, rows } of Object.values(moduleRows)) {
  // Count rows per task within this module (excluding Direct Instruction)
  const taskCount = {};
  for (const { task } of rows) {
    if (task !== 'Direct Instruction') {
      taskCount[task] = (taskCount[task] || 0) + 1;
    }
  }

  const activities = rows.map(({ task, online, steps, time, optional, facilitation }) => ({
    title: buildTitle(task, online, steps, taskCount[task] || 1),
    minutes: time,
    optional,
    styles: parseStyles(facilitation),
  }));

  const mustHaveTaskNames = activities.some(a => a.title === 'Develop') ? ['Develop'] : [];

  if (!output[grade]) output[grade] = {};
  if (!output[grade][unit]) output[grade][unit] = {};
  output[grade][unit][module] = { activities, mustHaveTaskNames };
  moduleCount++;
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
console.log(`Extracted ${moduleCount} modules → ${OUTPUT_PATH}`);
