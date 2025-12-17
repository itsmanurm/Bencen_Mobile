
import { createClient } from '@supabase/supabase-js';

const url = 'https://gpvphodzkcjtjhhkfhqd.supabase.co';
const key = 'sb_publishable_ZXUZqdyRpL5Oj8USubxCuQ_GEVPnvHI'; // This looks like a dummy/masked key from previous output? 
// Wait, the key in .env was: sb_publishable_ZXUZqdyRpL5Oj8USubxCuQ_GEVPnvHI 
// AND usually anon keys are JWTs (eyJ...). 
// 'sb_publishable_...' is a valid format for some newer systems or custom keys, but typically Supabase keys are JWTs.
// BUT I must trust the .env I just read.
// Actually, I should re-check the .env content from the tool output carefully.
// The output was: VITE_SUPABASE_ANON_KEY=sb_publishable_ZXUZqdyRpL5Oj8USubxCuQ_GEVPnvHI
// It seems short. Let's try it.

const supabase = createClient(url, key);
const supabaseFinnegans = createClient(url, key, { db: { schema: 'Finnegans' } });

async function run() {
    console.log("Checking ID overlaps...");

    // 1. Get recent parts IDs
    const { data: parts, error: pErr } = await supabase.from('partes_diarios').select('item_id').limit(10);
    if (pErr) { console.error("Parts Error:", pErr); return; }

    const partIds = [...new Set(parts.map(p => p.item_id))];
    console.log("Sample Part IDs (Finnegans IDs):", partIds);

    // 2. Check if these IDs exist in 'datos_licitaciones_plan_trabajo'
    const { data: directMatch, error: dErr } = await supabase.from('datos_licitaciones_plan_trabajo').select('id').in('id', partIds);
    if (dErr) console.error("Direct Match Error:", dErr);
    else console.log("Direct ID Matches found:", directMatch.length);

    // 3. Resolve to Codes
    const { data: finItems, error: fErr } = await supabaseFinnegans.from('vista_plan_trabajo_final').select('id, item').in('id', partIds);
    if (fErr) { console.error("Finnegans Error:", fErr); return; }

    const items = finItems.map(i => i.item);
    console.log("Resolved Codes:", items);

    // 4. Check Code Match
    const { data: codeMatch, error: cErr } = await supabase.from('datos_licitaciones_plan_trabajo').select('item').in('item', items);
    if (cErr) console.error("Code Match Error:", cErr);
    else console.log("Code Matches found:", codeMatch.length);
}

run();
