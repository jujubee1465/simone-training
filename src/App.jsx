import { useState, useCallback, useEffect, useRef } from "react";

const SUPABASE_URL = "https://qswsdgkosyjeczmtwrde.supabase.co";
const SUPABASE_KEY = "sb_publishable_n_GIwNQ6DgL78vHG_uocmw_CrdIuLI6";

const TEAL = "#0a7c5c";
const TEAL_LIGHT = "#e6f4ef";
const TEAL_MID = "#1a9e78";
const NAVY = "#0d2b45";
const SAND = "#f5f0e8";
const AMBER = "#c47f17";
const AMBER_LIGHT = "#fdf3e0";
const CORAL = "#c0392b";
const CORAL_LIGHT = "#fdf0ee";

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────

function useIsMobile() {
const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
useEffect(() => {
const handler = () => setIsMobile(window.innerWidth < 640);
window.addEventListener("resize", handler);
return () => window.removeEventListener("resize", handler);
}, []);
return isMobile;
}

// ─── SUPABASE HELPERS ────────────────────────────────────────────────────────

async function dbLoad() {
const res = await fetch(`${SUPABASE_URL}/rest/v1/training_weights?select=*`, {
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
});
if (!res.ok) return {};
const rows = await res.json();
const map = {};
for (const r of rows) map[r.id] = r.value;
return map;
}

async function dbSave(id, block_id, day_id, exercise_index, week, value) {
await fetch(`${SUPABASE_URL}/rest/v1/training_weights`, {
method: "POST",
headers: {
apikey: SUPABASE_KEY,
Authorization: `Bearer ${SUPABASE_KEY}`,
"Content-Type": "application/json",
Prefer: "resolution=merge-duplicates",
},
body: JSON.stringify({ id, block_id, day_id, exercise_index, week, value, updated_at: new Date().toISOString() }),
});
}

async function dbLoadCompletions() {
const res = await fetch(`${SUPABASE_URL}/rest/v1/simone_completions?select=*&order=completed_at.desc`, {
headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
});
if (!res.ok) return [];
return res.json();
}

async function dbSaveCompletion(blockId, dayId, blockLabel, dayLabel) {
const id = `${blockId}__${dayId}__${Date.now()}`;
await fetch(`${SUPABASE_URL}/rest/v1/simone_completions`, {
method: "POST",
headers: {
apikey: SUPABASE_KEY,
Authorization: `Bearer ${SUPABASE_KEY}`,
"Content-Type": "application/json",
},
body: JSON.stringify({ id, block_id: blockId, day_id: dayId, block_label: blockLabel, day_label: dayLabel, completed_at: new Date().toISOString() }),
});
return id;
}

function makeId(blockId, dayId, exIdx, wk) {
return `${blockId}__${dayId}__${exIdx}__${wk}`;
}
// ─── DEFAULT DATA ────────────────────────────────────────────────────────────

const DEFAULT_BLOCKS = [
{
id: "accum", label: "Block 1 · Accumulation", weeks: "Weeks 1–4",
theme: "Max muscle stimulus · Motor pattern learning",
color: TEAL, colorLight: TEAL_LIGHT,
gymVol: "180 sets · 10 hrs/wk", cardio: "3–4 hrs Zone 2 cycling only", laserSim: "Hiking bench + wall sit daily",
days: [
{ id: "mon", label: "Monday", focus: "Power + Upper Pull", exercises: [
{ id: "pullup", name: "Pull-up progression", unit: "", sets: "3 sets", wk1: "5 reps band", wk2: "6 reps band", wk3: "4×5 band", wk4: "2×5 band", notes: "Full ROM, dead hang start" },
{ id: "row", name: "DB Bent-over row", unit: "lb", sets: "3×10", wk1: "15", wk2: "15", wk3: "20", wk4: "15", notes: "Flat back, elbow to hip" },
{ id: "renegade", name: "Renegade row", unit: "lb/side", sets: "3×6", wk1: "10", wk2: "10", wk3: "12", wk4: "10", notes: "Hips level, core tight" },
{ id: "curl", name: "Bicep curl", unit: "lb", sets: "3×12", wk1: "10", wk2: "12", wk3: "15", wk4: "10", notes: "Supinate at top" },
{ id: "upright", name: "Upright row", unit: "lb", sets: "3×12", wk1: "10", wk2: "12", wk3: "15", wk4: "10", notes: "Elbows above wrists only" },
{ id: "rotcore", name: "Rotational core (DB)", unit: "lb/side", sets: "3×10", wk1: "8", wk2: "8", wk3: "10", wk4: "8", notes: "Russian twist or woodchop" },
{ id: "hikebench", name: "Hiking bench", unit: "sec", sets: "3 sets", wk1: "45", wk2: "60", wk3: "60", wk4: "45", notes: "Back flat, iso hold" },
]},
{ id: "tue", label: "Tuesday", focus: "Lower + Plyometrics", exercises: [
{ id: "slsquat", name: "SL Squat (to box)", unit: "BW", sets: "3×6/side", wk1: "BW box", wk2: "BW box", wk3: "4×6 BW", wk4: "2×6 BW", notes: "Sit to 12–14\" box" },
{ id: "split", name: "Split squat", unit: "lb", sets: "3×10/side",wk1: "15", wk2: "15", wk3: "20", wk4: "15", notes: "Back knee ~1\" from floor" },
{ id: "rdl", name: "RDL", unit: "lb", sets: "3×10", wk1: "20", wk2: "20", wk3: "25", wk4: "20", notes: "Hinge, soft knee" },
{ id: "broad", name: "Broad jump", unit: "", sets: "4×3", wk1: "max", wk2: "4 reps", wk3: "5×3", wk4: "3×3", notes: "Stick landing 3 sec" },
{ id: "sqjump", name: "Squat jump", unit: "BW", sets: "4×5", wk1: "5", wk2: "6", wk3: "6", wk4: "4", notes: "Land soft" },
{ id: "wallsit", name: "Wall sit", unit: "sec", sets: "3 sets", wk1: "45", wk2: "60", wk3: "75", wk4: "45", notes: "90° knee angle" },
{ id: "plank", name: "Plank (front)", unit: "sec", sets: "3 sets", wk1: "30", wk2: "40", wk3: "45", wk4: "30", notes: "Ear to heel alignment" },
]},
{ id: "thu", label: "Thursday", focus: "Upper Push + Accessories", exercises: [
{ id: "bench", name: "Bench press (DB)", unit: "lb", sets: "3×10", wk1: "20", wk2: "22", wk3: "25", wk4: "20", notes: "3 sec descent, 1 sec pause" },
{ id: "pushup", name: "Push-up progression", unit: "", sets: "3 sets", wk1: "std ×8", wk2: "std ×10", wk3: "archer ×10", wk4: "std ×8", notes: "Chest to floor, full lock-out" },
{ id: "dips", name: "Dips progression", unit: "", sets: "3 sets", wk1: "bench ×6", wk2: "bench ×8", wk3: "parallel ×6", wk4: "bench ×6", notes: "Elbows back, not flared" },
{ id: "shoulder", name: "Shoulder stability", unit: "lb", sets: "3×12", wk1: "8", wk2: "8", wk3: "10", wk4: "8", notes: "Lateral raise, slight lean" },
{ id: "upright2", name: "Upright row", unit: "lb", sets: "3×12", wk1: "10", wk2: "12", wk3: "15", wk4: "10", notes: "Lead with elbows" },
{ id: "sideplank", name: "Side plank", unit: "sec/side",sets: "3 sets", wk1: "20", wk2: "25", wk3: "30", wk4: "20", notes: "Hip up, stacked feet" },
]},
{ id: "fri", label: "Friday", focus: "Full Body Integration", exercises: [
{ id: "slsquat_f", name: "SL Squat (to box)", unit: "BW", sets: "2×6/side", wk1: "BW", wk2: "BW", wk3: "3×6", wk4: "2×5", notes: "Reinforce Tuesday pattern" },
{ id: "split_f", name: "Split squat (light)", unit: "lb", sets: "2×10/side",wk1: "12", wk2: "12", wk3: "15", wk4: "10", notes: "Speed emphasis" },
{ id: "rdl_f", name: "RDL", unit: "lb", sets: "2×10", wk1: "15", wk2: "20", wk3: "20", wk4: "15", notes: "Same cues as Tuesday" },
{ id: "rotcore_f", name: "Rotational core (DB)", unit: "lb/side", sets: "3×10", wk1: "8", wk2: "8", wk3: "10", wk4: "8", notes: "Woodchop or standing twist" },
{ id: "hikebench_f",name: "Hiking bench", unit: "sec", sets: "3 sets", wk1: "45", wk2: "45", wk3: "60", wk4: "45", notes: "Simulate boat hiking" },
{ id: "wallsit_f", name: "Wall sit finisher", unit: "sec", sets: "1 set", wk1: "60", wk2: "75", wk3: "90", wk4: "60", notes: "One max effort, end of session" },
]},
]
},
{
id: "trans", label: "Block 2 · Transmutation", weeks: "Weeks 5–8",
theme: "Sport-specific power · VO2max · HIIT introduced",
color: AMBER, colorLight: AMBER_LIGHT,
gymVol: "100–120 sets · 6–7 hrs/wk", cardio: "7–8 hrs incl. HIIT 2×/wk", laserSim: "Weighted hiking bench + intervals",
days: [
{ id: "mon", label: "Monday", focus: "Power Pull + Sport Endurance", exercises: [
{ id: "pullup", name: "Pull-up progression", unit: "", sets: "4 sets", wk1: "4 less-assist", wk2: "5 reps", wk3: "5 or 1 unassist", wk4: "2×4", notes: "Reduce band each block" },
{ id: "row", name: "DB Bent-over row (heavy)", unit: "lb", sets: "4×6", wk1: "25", wk2: "28", wk3: "30", wk4: "22", notes: "Elbow to hip, controlled" },
{ id: "renegade", name: "Renegade row", unit: "lb/side", sets: "3×6", wk1: "15", wk2: "15", wk3: "20", wk4: "12", notes: "Hips level" },
{ id: "upright", name: "Upright row", unit: "lb", sets: "3×8", wk1: "18", wk2: "20", wk3: "22", wk4: "15", notes: "Lead with elbows" },
{ id: "rotcore", name: "Rotational core (heavy)", unit: "lb/side", sets: "3×10", wk1: "12", wk2: "15", wk3: "15", wk4: "10", notes: "Speed intent on drive" },
{ id: "hikebench", name: "Hiking bench (weighted)", unit: "", sets: "3 sets", wk1: "60s+5lb", wk2: "75s+5lb", wk3: "60s+10lb", wk4: "45s BW", notes: "Or hold DB on chest" },
]},
{ id: "tue", label: "Tuesday", focus: "Power Lower + Jumps", exercises: [
{ id: "pclean", name: "Power clean (DB)", unit: "lb", sets: "5×3", wk1: "15", wk2: "18", wk3: "20", wk4: "15", notes: "Fast hip extension, fast catch" },
{ id: "frontsq", name: "Front squat (DB)", unit: "lb", sets: "4×6", wk1: "20", wk2: "22", wk3: "25", wk4: "18", notes: "DBs at shoulders" },
{ id: "slsquat", name: "SL Squat progression", unit: "lb", sets: "4×5/side", wk1: "BW", wk2: "5–8",wk3: "8–10",wk4: "BW",notes: "Lower box each week" },
{ id: "split", name: "Split squat (heavy)", unit: "lb", sets: "4×6/side", wk1: "25", wk2: "28", wk3: "30", wk4: "20", notes: "Back knee controlled" },
{ id: "rdl", name: "RDL (heavy)", unit: "lb", sets: "4×6", wk1: "30", wk2: "33", wk3: "35", wk4: "25", notes: "Hinge, hamstring stretch" },
{ id: "wallsit", name: "Wall sit (heavy)", unit: "", sets: "3 sets", wk1: "90s BW", wk2: "90s+10lb", wk3: "90s+15lb", wk4: "60s BW", notes: "90° knee, arms crossed" },
]},
{ id: "thu", label: "Thursday", focus: "Upper Push Power", exercises: [
{ id: "bench", name: "Bench press (DB heavy)", unit: "lb", sets: "4×6", wk1: "28", wk2: "30", wk3: "33", wk4: "25", notes: "Controlled descent" },
{ id: "pushup", name: "Push-up progression", unit: "", sets: "3×10", wk1: "archer", wk2: "archer", wk3: "+1 decline", wk4: "std ×10", notes: "Max range each rep" },
{ id: "dips", name: "Dips progression", unit: "", sets: "4 sets",wk1: "parallel ×6", wk2: "parallel ×8",wk3: "slight load ×6",wk4: "BW ×6", notes: "Elbows back" },
{ id: "shoulder", name: "Shoulder stability", unit: "lb", sets: "3×12", wk1: "10", wk2: "10", wk3: "12", wk4: "8", notes: "Slow, controlled tempo" },
{ id: "sideplank", name: "Side plank + rotation", unit: "reps/side",sets: "3 sets",wk1: "8", wk2: "10", wk3: "10", wk4: "8", notes: "Rotate hip to floor and back" },
]},
{ id: "fri", label: "Friday", focus: "Full Body Power + HIIT Finisher", exercises: [
{ id: "complex", name: "Power clean + Front squat complex", unit: "lb", sets: "4×(3+3)", wk1: "15", wk2: "18", wk3: "20", wk4: "15", notes: "No rest between movements" },
{ id: "slsplit", name: "SL Squat + Split squat superset", unit: "", sets: "3×(5SL+8split)",wk1: "BW+20lb", wk2: "BW+22lb", wk3: "BW+25lb", wk4: "BW+18lb",notes: "Minimal rest between legs" },
{ id: "rotcore", name: "Rotational core (explosive)", unit: "lb/side", sets: "3×10", wk1: "12", wk2: "13", wk3: "15", wk4: "10", notes: "Speed intent on drive" },
{ id: "hikebench",name: "Hiking bench intervals", unit: "sec on/off", sets: "5 sets", wk1: "45/15", wk2: "45/15", wk3: "45/15", wk4: "30/15", notes: "Simulate gusts" },
{ id: "hiit", name: "HIIT finisher (bike/rower)", unit: "sec hard/easy",sets: "4 sets", wk1: "20/40", wk2: "20/40", wk3: "20/40", wk4: "skip", notes: "All-out each rep" },
]},
]
},
{
id: "real", label: "Block 3 · Realization", weeks: "Weeks 9–12",
theme: "Recovery · Express strength · Competition prep",
color: CORAL, colorLight: CORAL_LIGHT,
gymVol: "80 sets · 4–5 hrs/wk", cardio: "5–6 hrs Zone 2 social", laserSim: "Light hiking bench · mobility focus",
days: [
{ id: "mon", label: "Monday", focus: "Upper Body — Feel Good", exercises: [
{ id: "pullup", name: "Pull-up (best effort)", unit: "", sets: "3×(max-2)", wk1: "unassisted", wk2: "unassisted", wk3: "unassisted", wk4: "unassisted", notes: "Stop 2 short of failure" },
{ id: "row", name: "DB Bent-over row", unit: "lb", sets: "3×8", wk1: "25", wk2: "25", wk3: "28", wk4: "22", notes: "Controlled, quality reps" },
{ id: "curl", name: "Bicep curl", unit: "lb", sets: "2×12", wk1: "15", wk2: "15", wk3: "18", wk4: "15", notes: "Supinate at top" },
{ id: "upright", name: "Upright row", unit: "lb", sets: "2×10", wk1: "15", wk2: "15", wk3: "18", wk4: "15", notes: "Lead with elbows" },
{ id: "rotcore", name: "Rotational core", unit: "lb/side", sets: "3×10", wk1: "12", wk2: "12", wk3: "12", wk4: "10", notes: "Smooth and controlled" },
{ id: "hikebench", name: "Hiking bench (light)", unit: "sec BW", sets: "3 sets", wk1: "60", wk2: "60", wk3: "60", wk4: "45", notes: "Form and breathing focus" },
]},
{ id: "tue", label: "Tuesday", focus: "Lower + Light Power", exercises: [
{ id: "slsquat", name: "SL Squat (best depth)", unit: "lb", sets: "3×5/side", wk1: "10", wk2: "10", wk3: "10", wk4: "BW", notes: "Honor form limits" },
{ id: "split", name: "Split squat", unit: "lb", sets: "3×8/side", wk1: "25", wk2: "25", wk3: "25", wk4: "20", notes: "Controlled descent" },
{ id: "rdl", name: "RDL", unit: "lb", sets: "3×8", wk1: "28", wk2: "28", wk3: "28", wk4: "22", notes: "Hamstring stretch" },
{ id: "pclean", name: "Power clean (technique polish)", unit: "lb", sets: "3×4", wk1: "15", wk2: "15", wk3: "15", wk4: "12", notes: "Slow, perfect, repeatable" },
{ id: "wallsit", name: "Wall sit", unit: "sec BW", sets: "2 sets", wk1: "90", wk2: "90", wk3: "90", wk4: "60", notes: "90° knee angle" },
]},
{ id: "thu", label: "Thursday", focus: "Upper Push (Maintenance)", exercises: [
{ id: "bench", name: "Bench press (DB)", unit: "lb", sets: "3×8", wk1: "28", wk2: "28", wk3: "28", wk4: "25", notes: "Maintain — no grinding" },
{ id: "pushup", name: "Push-up (best variation)", unit: "", sets: "3×10", wk1: "archer/decline",wk2: "archer/decline",wk3: "archer/decline",wk4: "standard",notes: "Quality over quantity" },
{ id: "dips", name: "Dips", unit: "BW", sets: "3×8", wk1: "parallel", wk2: "parallel", wk3: "parallel", wk4: "parallel",notes: "Full range" },
{ id: "shoulder", name: "Shoulder stability", unit: "lb", sets: "2×15", wk1: "8", wk2: "8", wk3: "8", wk4: "8", notes: "Lateral raise + ext rotation" },
{ id: "sideplank", name: "Side plank", unit: "sec/side",sets: "2 sets",wk1: "35", wk2: "35", wk3: "35", wk4: "30", notes: "Hip up, stacked feet" },
]},
{ id: "fri", label: "Friday", focus: "Movement + Mobility + Mindset", exercises: [
{ id: "circuit", name: "Full body light circuit", unit: "rounds", sets: "2 rounds", wk1: "2", wk2: "2", wk3: "2", wk4: "1–2", notes: "10 split/8 push/6 pull/10 core/30s plank" },
{ id: "hikebench",name: "Hiking bench", unit: "sec", sets: "3 sets", wk1: "45",wk2: "45",wk3: "45",wk4: "45", notes: "Form and breathing" },
{ id: "plyo", name: "Plyometrics (fun)", unit: "", sets: "3×3", wk1: "broad/box",wk2: "broad/box",wk3: "broad/box",wk4: "broad/box", notes: "No pressure, just enjoy" },
{ id: "mobility", name: "Yoga / mobility flow", unit: "min", sets: "1 set", wk1: "20",wk2: "20",wk3: "20",wk4: "20", notes: "Hips, spine, shoulders" },
]},
]
}
];

const WED = {
accum: { title: "Wednesday · Cardio + Shoulder Stability", items: [["Zone 2 cycling","45–60 min @ conversational pace. Stationary bike, no intervals."],["Shoulder stability","3×15 each: lateral raise, front raise, external rotation. 5–8 lb max."],["Prone Y-T-W","2×12 each position. Tiny range, scapular control only."],["Foam roll + stretch","10–15 min. Quads, lats, thoracic spine."]] },
trans: { title: "Wednesday · HIIT + Recovery", items: [["Zone 2 warm-up","15 min easy cycling, HR below 140."],["HIIT — bike or rower","6–8 × (30 sec MAX / 90 sec easy). Wk 5–6: 6 reps. Wk 7: 8 reps."],["Zone 2 cool-down","10 min easy, HR back below 130."],["Shoulder stability","2×15 each: ext rotation, face pull sub, Y-T-W @ 8 lb."]] },
real: { title: "Wednesday · Zone 2 Social", items: [["Group ride / run / swim","45–75 min @ conversational pace with friends or teammates."],["OR sailing practice","1–2 hrs on water counts fully."],["Shoulder stability (maint.)","2×12 each @ 8 lb: lateral raise, external rotation, Y-T-W."]] },
};

const PROGRESSIONS = [
{ name: "Pull-up", steps: [["Wk 1–2","Heavy band-assist","3×5–6, full ROM, dead hang start"],["Wk 3–4","Medium band-assist","4×5, chin over bar"],["Wk 5–6","Light band / jump-lower","4×4–5, 4 sec negative"],["Wk 7–8","First unassisted","1–2 unassisted + band sets"],["Wk 9–12","Unassisted max-2","2–3 sets, stop 2 short of failure"]] },
{ name: "Push-up", steps: [["Wk 1–3","Standard","3×8–10, chest to floor"],["Wk 4–6","Archer","3×8–10/side, weight shift"],["Wk 7–8","Decline","3×8–10, feet on bench"],["Wk 9–12","Best variation","3×10, quality focus"]] },
{ name: "Single-Leg Squat", steps: [["Wk 1–4","SL to 14\" box BW","3×6–8/side, slow and controlled"],["Wk 5–6","SL to 10\" box BW","4×5/side, knee tracks toes"],["Wk 7–8","SL to box + 5–10 lb","4×5/side"],["Wk 9–12","SL to lowest box","3×5/side, honor form limits"]] },
{ name: "Dips", steps: [["Wk 1–4","Bench dips","3×6–8, elbows back"],["Wk 5–6","Parallel bar BW","4×6–8, lower to 90°"],["Wk 7–8","Parallel slight lean","4×6, chest emphasis"],["Wk 9–12","Parallel BW maintain","3×8, quality"]] },
{ name: "Power Clean (DB)", steps: [["Wk 2–4","BW or 10 lb DBs","Hip hinge → extension → high pull. No catch yet."],["Wk 5–6","12–15 lb DBs","Add the catch — DBs to shoulder, partial squat"],["Wk 7–8","18–20 lb DBs","Speed intent — fast hip ext, fast catch"],["Wk 9–12","15 lb polish","Smooth, controlled, repeatable"]] },
{ name: "Bench Press (DB)", steps: [["Wk 1–2","20–22 lb DBs","3×10, 3 sec descent, 1 sec pause"],["Wk 3","25 lb DBs","4×8"],["Wk 5–6","28–30 lb DBs","4×6"],["Wk 7","33 lb DBs","4×5"],["Wk 9–11","28–30 lb maintain","3×8"]] },
];
// ─── EDITABLE CELL ───────────────────────────────────────────────────────────

function EditableCell({ value, onChange, color, saving }) {
const [editing, setEditing] = useState(false);
const [local, setLocal] = useState(value);
useEffect(() => { if (!editing) setLocal(value); }, [value, editing]);
const commit = () => { if (local !== value) onChange(local); setEditing(false); };
if (editing) {
return (
<input autoFocus value={local}
onChange={e => setLocal(e.target.value)}
onBlur={commit}
onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setLocal(value); setEditing(false); } }}
style={{ width: "100%", minWidth: 52, border: `2px solid ${color}`, borderRadius: 5, padding: "4px 6px", fontSize: 14, background: "#fff", outline: "none", fontFamily: "sans-serif", color: "#111", textAlign: "center" }}
/>
);
}
return (
<span onClick={() => { setLocal(value); setEditing(true); }} title="Tap to edit"
style={{ cursor: "text", display: "inline-block", padding: "4px 8px", borderRadius: 4, border: "1.5px dashed transparent", fontSize: 13, fontFamily: "sans-serif", whiteSpace: "nowrap", transition: "all 0.12s", opacity: saving ? 0.5 : 1, minHeight: 32, lineHeight: "24px" }}
onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = "#f5fdf9"; }}
onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; }}
>{value || "—"}</span>
);
}

// ─── EXERCISE TABLE ──────────────────────────────────────────────────────────

function ExerciseTable({ exercises, blockColor, blockId, dayId, onEdit, savingSet, isMobile }) {
const wks = [{ k: "wk1", l: "Wk 1" },{ k: "wk2", l: "Wk 2" },{ k: "wk3", l: "Wk 3" },{ k: "wk4", l: "Wk 4 ↓", muted: true }];
if (isMobile) {
return (
<div style={{ padding: "8px 0" }}>
{exercises.map((ex, ei) => (
<div key={ex.id} style={{ borderBottom: "1px solid #f2efe9", padding: "10px 14px", background: ei % 2 === 0 ? "#fff" : "#fdfcfb" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
<div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 13, color: "#1a1a1a", flex: 1, paddingRight: 8 }}>{ex.name}</div>
<div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#999", whiteSpace: "nowrap" }}>{ex.sets}</div>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: ex.notes ? 6 : 0 }}>
{wks.map(w => (
<div key={w.k} style={{ textAlign: "center" }}>
<div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 700, color: w.muted ? `${blockColor}88` : blockColor, textTransform: "uppercase", marginBottom: 2 }}>{w.l}</div>
<EditableCell
value={ex[w.k]} color={blockColor}
saving={savingSet.has(makeId(blockId, dayId, ei, w.k))}
onChange={v => onEdit(blockId, dayId, ei, w.k, v)}
/>
</div>
))}
</div>
{ex.notes && <div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#b0aaa0", fontStyle: "italic" }}>{ex.notes}{ex.unit ? ` · ${ex.unit}` : ""}</div>}
</div>
))}
</div>
);
}
return (
<div style={{ overflowX: "auto" }}>
<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
<thead>
<tr style={{ background: "#fafaf8" }}>
<th style={TH("left")}>Exercise</th>
<th style={TH("center", "#ccc")}>Sets</th>
{wks.map(w => <th key={w.k} style={TH("center", w.muted ? `${blockColor}88` : blockColor)}>{w.l}</th>)}
<th style={TH("center", "#ccc")}>Unit</th>
<th style={TH("left", "#ccc")}>Notes</th>
</tr>
</thead>
<tbody>
{exercises.map((ex, ei) => (
<tr key={ex.id} style={{ borderBottom: "1px solid #f2efe9", background: ei % 2 === 0 ? "#fff" : "#fdfcfb" }}>
<td style={{ padding: "8px 14px", fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", fontFamily: "sans-serif" }}>{ex.name}</td>
<td style={{ padding: "8px 10px", color: "#999", textAlign: "center", fontFamily: "sans-serif", fontSize: 12 }}>{ex.sets}</td>
{wks.map(w => (
<td key={w.k} style={{ padding: "6px 8px", textAlign: "center" }}>
<EditableCell
value={ex[w.k]} color={blockColor}
saving={savingSet.has(makeId(blockId, dayId, ei, w.k))}
onChange={v => onEdit(blockId, dayId, ei, w.k, v)}
/>
</td>
))}
<td style={{ padding: "8px 10px", color: "#bbb", textAlign: "center", fontFamily: "sans-serif", fontSize: 11 }}>{ex.unit}</td>
<td style={{ padding: "8px 14px", color: "#c0bab0", fontFamily: "sans-serif", fontSize: 11, fontStyle: "italic" }}>{ex.notes}</td>
</tr>
))}
</tbody>
</table>
</div>
);
}

const TH = (align, color = "#999") => ({
padding: "9px 10px", textAlign: align, fontFamily: "sans-serif",
fontSize: 11, fontWeight: 700, color, textTransform: "uppercase",
letterSpacing: "0.06em", borderBottom: "1.5px solid #ede9e2", whiteSpace: "nowrap"
});

// ─── SAVE STATUS BADGE ───────────────────────────────────────────────────────

function SaveBadge({ status }) {
const cfg = {
idle: { bg: "transparent", color: "transparent", text: "" },
saving: { bg: "#fff8e6", color: AMBER, text: "⏳ Saving..." },
saved: { bg: "#e6f4ef", color: TEAL, text: "✓ Saved" },
error: { bg: "#fdf0ee", color: CORAL, text: "⚠ Save failed" },
}[status];
return (
<div style={{ fontFamily: "sans-serif", fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: status === "idle" ? 0 : "4px 12px", borderRadius: 999, transition: "all 0.2s", minWidth: 80, textAlign: "center", whiteSpace: "nowrap" }}>
{cfg.text}
</div>
);
}

// ─── COMPLETE BUTTON ─────────────────────────────────────────────────────────

function CompleteButton({ blockId, dayId, blockLabel, dayLabel, onComplete, isMobile, completedToday }) {
const [status, setStatus] = useState(completedToday ? "done" : "idle");
useEffect(() => { setStatus(completedToday ? "done" : "idle"); }, [completedToday]);
const handleClick = async () => {
if (status === "done") return;
setStatus("saving");
await dbSaveCompletion(blockId, dayId, blockLabel, dayLabel);
setStatus("done");
onComplete();
};
return (
<button
onClick={handleClick}
disabled={status === "saving"}
style={{
padding: isMobile ? "6px 10px" : "7px 14px",
background: status === "done" ? TEAL_LIGHT : "#fff",
color: status === "done" ? TEAL : TEAL,
border: `2px solid ${status === "done" ? TEAL : "#fff6"}`,
borderRadius: 7,
fontFamily: "sans-serif",
fontSize: isMobile ? 11 : 12,
fontWeight: 700,
cursor: status === "saving" ? "wait" : "pointer",
transition: "all 0.2s",
whiteSpace: "nowrap",
flexShrink: 0,
}}
>
{status === "saving" ? "Saving…" : status === "done" ? "✓ Logged!" : "✅ Mark Complete"}
</button>
);
}

// ─── PROGRESSIONS PAGE ───────────────────────────────────────────────────────

function Progressions() {
return (
<div>
{PROGRESSIONS.map(p => (
<div key={p.name} style={{ marginBottom: 28 }}>
<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
<div style={{ width: 3, height: 18, background: TEAL_MID, borderRadius: 2 }} />
<span style={{ fontWeight: 700, fontSize: 15, color: NAVY, fontFamily: "sans-serif" }}>{p.name}</span>
</div>
<div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }}>
{p.steps.map(([phase, ex, desc], i) => (
<div key={i} style={{ flex: "0 0 auto", width: 160, background: "#fff", border: "1px solid #e8e4de", borderRadius: 8, padding: "12px 14px" }}>
<div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 700, color: TEAL, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{phase}</div>
<div style={{ fontFamily: "sans-serif", fontWeight: 600, fontSize: 12, color: "#222", marginBottom: 5, lineHeight: 1.4 }}>{ex}</div>
<div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#999", lineHeight: 1.5 }}>{desc}</div>
</div>
))}
</div>
</div>
))}
<div style={{ background: TEAL_LIGHT, border: `1.5px solid ${TEAL_MID}40`, borderRadius: 10, padding: "18px 20px", marginTop: 8 }}>
<div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 14, color: TEAL, marginBottom: 8 }}>⛵ Hiking Bench — Laser Simulation Setup</div>
<p style={{ fontFamily: "sans-serif", fontSize: 13, color: "#3a6e5a", lineHeight: 1.7, margin: "0 0 14px" }}>Lie flat on a bench. Hook feet under a dumbbell or have a partner hold. Hinge at the hip to 30–45° below bench level — simulating boat hiking. Hold isometrically. Back flat, core braced. This is <em>not</em> a crunch — it's a sustained eccentric hold.</p>
<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
{[["Block 1","BW iso holds","3–4 × 45–90 sec"],["Block 2","Weighted vest or DB on chest","3–5 × 45–75 sec + intervals"],["Block 3","BW technique focus","2–3 × 45–60 sec"]].map(([b, setup, rx]) => (
<div key={b} style={{ background: "#fff", borderRadius: 7, padding: "10px 12px" }}>
<div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 700, color: TEAL, textTransform: "uppercase", letterSpacing: "0.06em" }}>{b}</div>
<div style={{ fontFamily: "sans-serif", fontWeight: 600, fontSize: 12, color: "#333", margin: "4px 0" }}>{setup}</div>
<div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#888" }}>{rx}</div>
</div>
))}
</div>
</div>
</div>
);
}

// ─── NUTRITION PAGE ──────────────────────────────────────────────────────────

function Nutrition({ isMobile }) {
const meals = [["Breakfast","Within 1 hr of waking","30g protein + carbs","3 eggs + Greek yogurt + oats"],["Pre-workout","60–90 min before gym","Carbs + some protein","Banana + peanut butter + milk"],["Post-workout","Within 30–45 min","30–35g protein + fast carbs","Shake + rice cakes or fruit"],["Lunch / Dinner","Regular meal times","Balanced plate","Chicken / fish / eggs + rice + veg"],["Evening snack","Before bed","Slow protein","Cottage cheese or Greek yogurt"]];
return (
<div>
<div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
{[["Calorie surplus","+200–300/day"],["Protein target","0.8–1g / lb BW"],["Protein per meal","25–35g"],["Meals per day","4–5"]].map(([l, v]) => (
<div key={l} style={{ background: TEAL_LIGHT, borderRadius: 8, padding: "14px 16px" }}>
<div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 700, color: TEAL, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{l}</div>
<div style={{ fontFamily: "sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: NAVY }}>{v}</div>
</div>
))}
</div>
<div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Daily Framework</div>
{isMobile ? (
<div style={{ marginBottom: 28 }}>
{meals.map(([meal, timing, target, ex]) => (
<div key={meal} style={{ borderBottom: "1px solid #f2efe9", padding: "12px 0" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
<span style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 13, color: "#222" }}>{meal}</span>
<span style={{ fontFamily: "sans-serif", fontSize: 12, color: TEAL, fontWeight: 600 }}>{target}</span>
</div>
<div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#888", marginBottom: 2 }}>{timing}</div>
<div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#bbb", fontStyle: "italic" }}>{ex}</div>
</div>
))}
</div>
) : (
<div style={{ overflowX: "auto", marginBottom: 28 }}>
<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
<thead><tr style={{ background: "#fafaf8" }}>{["Meal","Timing","Target","Example"].map(h => <th key={h} style={TH("left")}>{h}</th>)}</tr></thead>
<tbody>{meals.map(([meal, timing, target, ex], i) => (
<tr key={meal} style={{ borderBottom: "1px solid #f2efe9", background: i % 2 === 0 ? "#fff" : "#fdfcfb" }}>
<td style={{ padding: "9px 14px", fontFamily: "sans-serif", fontWeight: 600, color: "#222" }}>{meal}</td>
<td style={{ padding: "9px 14px", fontFamily: "sans-serif", color: "#888" }}>{timing}</td>
<td style={{ padding: "9px 14px", fontFamily: "sans-serif", color: TEAL, fontWeight: 600 }}>{target}</td>
<td style={{ padding: "9px 14px", fontFamily: "sans-serif", color: "#999", fontSize: 12 }}>{ex}</td>
</tr>
))}</tbody>
</table>
</div>
)}
<div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Supplements</div>
<div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
{[["Creatine monohydrate","3–5g/day with a meal","Significant muscle and strength benefit. No loading needed."],["Protein powder (optional)","Post-workout only","Only if food protein targets can't be met."],["Vitamin D + Omega-3","2,000 IU D3 + 1–2g fish oil","Especially important for sailors on the water."]].map(([n, d, desc]) => (
<div key={n} style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: 8, padding: "14px 16px" }}>
<div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 5 }}>{n}</div>
<div style={{ fontFamily: "sans-serif", fontSize: 12, color: TEAL, fontWeight: 600, marginBottom: 5 }}>{d}</div>
<div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#999", lineHeight: 1.5 }}>{desc}</div>
</div>
))}
</div>
<div style={{ background: AMBER_LIGHT, border: `1.5px solid ${AMBER}40`, borderRadius: 10, padding: "16px 20px" }}>
<div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 14, color: AMBER, marginBottom: 7 }}>📊 +5 lbs in 3 months — Reality Check</div>
<p style={{ fontFamily: "sans-serif", fontSize: 13, color: "#6b4f1a", lineHeight: 1.7, margin: 0 }}>Achievable with a consistent caloric surplus and high protein intake. Scale weight may jump early due to glycogen and creatine water — totally normal. Actual lean tissue becomes visible around Weeks 6–10. Track monthly, not weekly.</p>
</div>
</div>
);
}

// ─── COMPLETED WORKOUTS PAGE ─────────────────────────────────────────────────

function CompletedPage({ completions, isMobile }) {
const grouped = {};
for (const c of completions) {
const date = new Date(c.completed_at).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
if (!grouped[date]) grouped[date] = [];
grouped[date].push(c);
}
const thisWeekCount = completions.filter(c => {
const d = new Date(c.completed_at);
const now = new Date();
const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
return d >= weekAgo;
}).length;
const streakDays = (() => {
const days = [...new Set(completions.map(c => new Date(c.completed_at).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
let streak = 0;
let prev = new Date();
prev.setHours(23, 59, 59, 999);
for (const d of days) {
const day = new Date(d);
const diff = (prev - day) / (1000 * 60 * 60 * 24);
if (diff < 2) { streak++; prev = day; } else break;
}
return streak;
})();
if (completions.length === 0) {
return (
<div style={{ textAlign: "center", padding: "60px 20px", fontFamily: "sans-serif", color: "#aaa" }}>
<div style={{ fontSize: 48, marginBottom: 16 }}>🏋️</div>
<div style={{ fontSize: 16, fontWeight: 700, color: "#777", marginBottom: 8 }}>No workouts logged yet</div>
<div style={{ fontSize: 13 }}>Hit "Mark Complete" on any day to track your progress!</div>
</div>
);
}
return (
<div>
<div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
{[["Total sessions", completions.length], ["This week", thisWeekCount], ["Day streak 🔥", streakDays]].map(([label, val]) => (
<div key={label} style={{ background: TEAL_LIGHT, borderRadius: 8, padding: "14px 16px" }}>
<div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 700, color: TEAL, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</div>
<div style={{ fontFamily: "sans-serif", fontSize: 28, fontWeight: 700, color: NAVY }}>{val}</div>
</div>
))}
</div>
{Object.entries(grouped).map(([date, items]) => (
<div key={date} style={{ marginBottom: 16 }}>
<div style={{ fontFamily: "sans-serif", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{date}</div>
{items.map(c => (
<div key={c.id} style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
<div style={{ width: 10, height: 10, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
<div style={{ flex: 1 }}>
<div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 13, color: NAVY }}>{c.day_label}</div>
<div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>{c.block_label}</div>
</div>
<div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#ccc" }}>
{new Date(c.completed_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
</div>
</div>
))}
</div>
))}
</div>
);
}
// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
const [activeTab, setActiveTab] = useState("overview");
const [loadStatus, setLoadStatus] = useState("loading");
const [saveStatus, setSaveStatus] = useState("idle");
const [savingSet, setSavingSet] = useState(new Set());
const [completions, setCompletions] = useState([]);
const saveTimer = useRef(null);
const isMobile = useIsMobile();

useEffect(() => {
dbLoad().then(map => {
if (Object.keys(map).length === 0) { setLoadStatus("ready"); return; }
setBlocks(prev => prev.map(b => ({
...b,
days: b.days.map(d => ({
...d,
exercises: d.exercises.map((ex, ei) => {
const updated = { ...ex };
for (const wk of ["wk1","wk2","wk3","wk4"]) {
const id = makeId(b.id, d.id, ei, wk);
if (map[id] !== undefined) updated[wk] = map[id];
}
return updated;
})
}))
})));
setLoadStatus("ready");
}).catch(() => setLoadStatus("error"));
dbLoadCompletions().then(rows => setCompletions(rows)).catch(() => {});
}, []);

const reloadCompletions = useCallback(() => {
dbLoadCompletions().then(rows => setCompletions(rows)).catch(() => {});
}, []);

const handleEdit = useCallback(async (blockId, dayId, exIdx, wk, val) => {
setBlocks(prev => prev.map(b =>
b.id !== blockId ? b : {
...b,
days: b.days.map(d =>
d.id !== dayId ? d : {
...d,
exercises: d.exercises.map((ex, i) => i !== exIdx ? ex : { ...ex, [wk]: val })
}
)
}
));
const id = makeId(blockId, dayId, exIdx, wk);
setSavingSet(s => new Set([...s, id]));
setSaveStatus("saving");
clearTimeout(saveTimer.current);
try {
await dbSave(id, blockId, dayId, exIdx, wk, val);
setSavingSet(s => { const n = new Set(s); n.delete(id); return n; });
setSaveStatus("saved");
saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
} catch {
setSavingSet(s => { const n = new Set(s); n.delete(id); return n; });
setSaveStatus("error");
saveTimer.current = setTimeout(() => setSaveStatus("idle"), 3000);
}
}, []);

const TABS = [
{ id: "overview", label: isMobile ? "Home" : "Overview" },
{ id: "accum", label: isMobile ? "Block 1" : "Block 1 · Accumulation" },
{ id: "trans", label: isMobile ? "Block 2" : "Block 2 · Transmutation" },
{ id: "real", label: isMobile ? "Block 3" : "Block 3 · Realization" },
{ id: "progressions", label: isMobile ? "Progress" : "Progressions" },
{ id: "nutrition", label: isMobile ? "Nutrition": "Nutrition" },
{ id: "completed", label: isMobile ? "Done ✅" : "Completed ✅" },
];

if (loadStatus === "loading") {
return (
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, fontFamily: "sans-serif" }}>
<div style={{ width: 36, height: 36, border: `3px solid ${TEAL_LIGHT}`, borderTop: `3px solid ${TEAL}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
<div style={{ color: "#888", fontSize: 14 }}>Loading Simone's program…</div>
<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
</div>
);
}

const px = isMobile ? "16px" : "32px";
const contentPad = isMobile ? "16px 12px 60px" : "32px 24px 60px";

return (
<div style={{ fontFamily: "Georgia, serif", background: SAND, minHeight: "100vh" }}>
<style>{`
* { box-sizing: border-box; }
::-webkit-scrollbar { height: 4px; width: 4px; }
::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
`}</style>

{/* Header */}
<div style={{ background: NAVY, color: "#fff", padding: isMobile ? "20px 16px 18px" : "32px 32px 28px" }}>
<div style={{ maxWidth: 980, margin: "0 auto" }}>
<div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: TEAL_MID, marginBottom: 8 }}>⛵ MindBodyBoat · ILCA Laser Program</div>
<h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>Simone's 3-Month<br />Training Plan</h1>
<p style={{ fontFamily: "sans-serif", fontSize: 12, color: "#7a9db8", margin: "0 0 14px" }}>
5-day split · 3 blocks · Goal: +5 lbs muscle ·{" "}
<span style={{ color: TEAL_MID, fontWeight: 600 }}>Tap any value to edit ✏️</span>
</p>
<div style={{ display: "flex", gap: isMobile ? 16 : 24, fontFamily: "sans-serif" }}>
{[["Duration","12 weeks"],["Goal","+5 lbs lean"],["Days/wk","5 sessions"]].map(([l, v]) => (
<div key={l}>
<div style={{ fontSize: 9, color: "#5a8098", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{l}</div>
<div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "#fff" }}>{v}</div>
</div>
))}
</div>
</div>
</div>

{/* Sticky nav */}
<div style={{ background: "#fff", borderBottom: "1px solid #ddd8d0", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
<div style={{ maxWidth: 980, margin: "0 auto", display: "flex", alignItems: "center", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
{TABS.map(t => (
<button key={t.id} onClick={() => setActiveTab(t.id)} style={{
padding: isMobile ? "12px 12px" : "14px 18px",
background: "none", border: "none",
borderBottom: `3px solid ${activeTab === t.id ? TEAL : "transparent"}`,
fontFamily: "sans-serif",
fontSize: isMobile ? 12 : 13,
fontWeight: activeTab === t.id ? 700 : 400,
color: activeTab === t.id ? TEAL : "#999",
cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
flexShrink: 0,
}}>{t.label}</button>
))}
<div style={{ marginLeft: "auto", paddingRight: 12, flexShrink: 0 }}>
<SaveBadge status={saveStatus} />
</div>
</div>
</div>

{loadStatus === "error" && (
<div style={{ maxWidth: 980, margin: "12px auto 0", padding: `0 ${px}` }}>
<div style={{ background: CORAL_LIGHT, border: `1px solid ${CORAL}40`, borderRadius: 8, padding: "10px 16px", fontFamily: "sans-serif", fontSize: 13, color: CORAL }}>
⚠ Could not connect to database. Edits will not be saved this session.
</div>
</div>
)}

{/* Content */}
<div style={{ maxWidth: 980, margin: "0 auto", padding: contentPad }}>

{/* OVERVIEW */}
{activeTab === "overview" && (
<div>
<div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
{blocks.map(b => (
<div key={b.id} onClick={() => setActiveTab(b.id)}
style={{ background: "#fff", border: `2px solid ${b.color}20`, borderRadius: 12, padding: isMobile ? "16px" : "20px 22px", cursor: "pointer", transition: "all 0.15s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: isMobile ? "flex" : "block", alignItems: isMobile ? "center" : "flex-start", gap: isMobile ? 12 : 0 }}
onMouseEnter={e => { e.currentTarget.style.borderColor = b.color; }}
onMouseLeave={e => { e.currentTarget.style.borderColor = `${b.color}20`; }}>
<div style={{ flex: isMobile ? "0 0 auto" : undefined }}>
<div style={{ fontFamily: "sans-serif", display: "inline-block", background: b.colorLight, color: b.color, padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: isMobile ? 0 : 10 }}>{b.weeks}</div>
</div>
<div style={{ flex: 1 }}>
<div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 17, color: NAVY, marginBottom: 4, marginTop: isMobile ? 0 : 6 }}>{b.label.split("·")[1].trim()}</div>
{!isMobile && <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#888", lineHeight: 1.6, marginBottom: 14 }}>{b.theme}</div>}
{!isMobile && (
<div style={{ fontFamily: "sans-serif", display: "flex", flexDirection: "column", gap: 4 }}>
{[["🏋️", b.gymVol],["🚴", b.cardio],["⛵", b.laserSim]].map(([icon, val]) => (
<div key={val} style={{ fontSize: 11, color: "#aaa" }}><span style={{ marginRight: 5 }}>{icon}</span>{val}</div>
))}
</div>
)}
</div>
<div style={{ fontFamily: "sans-serif", fontSize: 11, color: b.color, fontWeight: 600, marginTop: isMobile ? 0 : 14, flexShrink: 0 }}>→</div>
</div>
))}
</div>

<div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e4de", padding: isMobile ? "16px" : "22px 26px", marginBottom: 14 }}>
<div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>5-Day Weekly Template</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: isMobile ? 6 : 10 }}>
{[["Mon","Power + Upper Pull",TEAL],["Tue","Lower + Plyo",TEAL],["Wed","Cardio","#aaa"],["Thu","Upper Push",TEAL],["Fri","Full Body",TEAL]].map(([day, focus, color]) => (
<div key={day} style={{ background: SAND, borderRadius: 8, padding: isMobile ? "8px 6px" : "12px 14px", textAlign: "center", borderTop: `3px solid ${color}` }}>
<div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: isMobile ? 12 : 14, color: NAVY, marginBottom: 4 }}>{day}</div>
<div style={{ fontFamily: "sans-serif", fontSize: isMobile ? 10 : 11, color: "#777", lineHeight: 1.3 }}>{focus}</div>
</div>
))}
</div>
<div style={{ fontFamily: "sans-serif", textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 10 }}>Sat + Sun = sailing · recovery · social</div>
</div>

<div style={{ background: "#e8f7f1", border: `1.5px solid ${TEAL_MID}50`, borderRadius: 10, padding: "14px 16px", fontFamily: "sans-serif", fontSize: 13, color: TEAL }}>
✏️ <strong>All values are editable.</strong> Tap any week cell to update. Auto-saves to cloud ☁️
</div>
</div>
)}

{/* BLOCK PAGES */}
{["accum","trans","real"].includes(activeTab) && (() => {
const b = blocks.find(x => x.id === activeTab);
const wed = WED[activeTab];
return (
<div>
<div style={{ background: "#fff", border: `1.5px solid ${b.color}30`, borderLeft: `5px solid ${b.color}`, borderRadius: 12, padding: isMobile ? "14px 16px" : "18px 24px", marginBottom: 18 }}>
<div style={{ fontFamily: "sans-serif", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
<span style={{ background: b.colorLight, color: b.color, padding: "3px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>{b.weeks}</span>
<span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16, color: NAVY }}>{b.theme}</span>
</div>
<div style={{ fontFamily: "sans-serif", display: "flex", gap: isMobile ? 14 : 28, flexWrap: "wrap" }}>
{[["🏋️ Gym", b.gymVol],["🚴 Cardio", b.cardio],["⛵ Laser", b.laserSim]].map(([l, v]) => (
<div key={l} style={{ fontSize: isMobile ? 12 : 13 }}><span style={{ fontSize: 11, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.05em" }}>{l} </span><span style={{ color: "#555" }}>{v}</span></div>
))}
</div>
</div>

{b.days.map(day => (
<div key={day.id} style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: 12, marginBottom: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
<div style={{ background: b.color, color: "#fff", padding: isMobile ? "10px 14px" : "12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
<span style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: isMobile ? 14 : 15 }}>{day.label}</span>
<span style={{ opacity: 0.6 }}>·</span>
<span style={{ fontFamily: "sans-serif", fontSize: isMobile ? 12 : 13, opacity: 0.85, flex: 1 }}>{day.focus}</span>
<CompleteButton
blockId={b.id}
dayId={day.id}
blockLabel={b.label}
dayLabel={`${day.label} · ${day.focus}`}
onComplete={reloadCompletions}
isMobile={isMobile}
completedToday={completions.some(c => c.block_id === b.id && c.day_id === day.id && new Date(c.completed_at).toDateString() === new Date().toDateString())}
/>
</div>
<ExerciseTable
exercises={day.exercises} blockColor={b.color}
blockId={b.id} dayId={day.id}
onEdit={handleEdit} savingSet={savingSet}
isMobile={isMobile}
/>
</div>
))}

<div style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: 12, overflow: "hidden" }}>
<div style={{ background: "#777", color: "#fff", padding: isMobile ? "10px 14px" : "12px 20px" }}>
<span style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: isMobile ? 13 : 15 }}>{wed.title}</span>
</div>
<div style={{ padding: isMobile ? "14px" : "18px 20px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 12 }}>
{wed.items.map(([label, desc]) => (
<div key={label} style={{ fontFamily: "sans-serif", fontSize: 13, color: "#555" }}>
<span style={{ fontWeight: 700, color: "#333" }}>{label}:</span> {desc}
</div>
))}
</div>
</div>
</div>
);
})()}

{activeTab === "progressions" && (
<div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e4de", padding: isMobile ? "16px" : "28px" }}>
<Progressions />
</div>
)}

{activeTab === "nutrition" && (
<div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e4de", padding: isMobile ? "16px" : "28px" }}>
<Nutrition isMobile={isMobile} />
</div>
)}

{activeTab === "completed" && (
<div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e4de", padding: isMobile ? "16px" : "28px" }}>
<CompletedPage completions={completions} isMobile={isMobile} />
</div>
)}
</div>

<div style={{ fontFamily: "sans-serif", textAlign: "center", fontSize: 11, color: "#c0bab0", paddingBottom: 32 }}>
Simone · ILCA Laser · MindBodyBoat · Powered by Supabase ☁️
</div>
</div>
);
}
