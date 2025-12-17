import { supabase, supabaseFinnegans } from './supabase';

export const api = {
    getItems: async (licitacionId) => {
        try {
            const { data, error } = await supabaseFinnegans
                .from('vista_plan_trabajo_final')
                .select('id, id_licitacion, orden, grupo, subgrupo, grupo_parent, subgrupo_parent, item, descripcion, unidad, cantidad')
                .eq('id_licitacion', licitacionId)
                .lt('orden', 9000)
                .order('orden', { ascending: true, nullsFirst: false })
                .order('id', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching items:', error);
            throw error;
        }
    },

    getItemHistory: async (itemId) => {
        try {
            // Fetch history with user details
            // We assume there is a foreign key relation between partes_diarios.user_id and mobile_users.id
            // If not, we might fail. But usually Supabase detects it if we named it user_id and both are in public.
            // Let's try explicit join or just fetch and then map if needed.

            // Checking database_setup.sql, we have user_id uuid references auth.users.
            // mobile_users is also references auth.users.
            // So we can join mobile_users on mobile_users.id = partes_diarios.user_id

            const { data, error } = await supabase
                .from('partes_diarios')
                .select(`
                    id,
                    avance,
                    fecha,
                    observaciones,
                    created_at,
                    mobile_users (
                        name,
                        email
                    )
                `)
                .eq('item_id', itemId)
                .order('fecha', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching history:', error);
            throw error;
        }
    },

    getActiveItemIds: async (licitacionId) => {
        try {
            // Fetch item_ids and their individual progress chunks
            const { data, error } = await supabase
                .from('partes_diarios')
                .select('item_id, avance')
                .eq('id_licitacion', licitacionId);

            if (error) throw error;

            // Aggregate progress by item_id
            const progressMap = new Map();

            data.forEach(row => {
                const current = progressMap.get(row.item_id) || 0;
                progressMap.set(row.item_id, current + row.avance);
            });

            return progressMap;
        } catch (error) {
            console.error('Error fetching active items:', error);
            return new Map();
        }
    },

    checkDateOverlap: async (itemId, start, end, excludeId = null) => {
        if (!start || !end) return false;
        let query = supabase.from('partes_diarios')
            .select('id', { count: 'exact', head: true })
            .eq('item_id', itemId)
            // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
            .lte('fecha_inicio', end)
            .gte('fecha_fin', start);

        if (excludeId) query = query.neq('id', excludeId);

        const { count, error } = await query;
        if (error) throw error;
        return count > 0;
    },

    saveProgress: async (payload) => {
        // payload: { item_id, id_licitacion, avance, fecha, observaciones, fecha_inicio, fecha_fin }
        const { item_id, id_licitacion, avance, fecha, observaciones, fecha_inicio, fecha_fin } = payload;

        // Validate basics
        if (!item_id || avance === undefined) throw new Error("Faltan datos obligatorios");

        // Validate Overlap
        if (fecha_inicio && fecha_fin) {
            if (fecha_inicio > fecha_fin) throw new Error("La fecha de inicio no puede ser posterior al fin.");
            const hasOverlap = await api.checkDateOverlap(item_id, fecha_inicio, fecha_fin);
            if (hasOverlap) throw new Error("El rango de fechas se superpone con otro reporte existente para este ítem.");
        }

        try {
            const { data, error } = await supabase
                .from('partes_diarios')
                .insert([{
                    item_id,
                    id_licitacion,
                    avance: parseFloat(avance),
                    fecha: fecha || new Date().toISOString().split('T')[0],
                    observaciones,
                    fecha_inicio,
                    fecha_fin
                }])
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving progress:', error);
            throw error;
        }
    },

    updateProgress: async (id, payload) => {
        try {
            // Get item_id first to check overlap (if dates changed)
            if (payload.fecha_inicio && payload.fecha_fin) {
                if (payload.fecha_inicio > payload.fecha_fin) throw new Error("La fecha de inicio no puede ser mayor al fin.");

                // We need item_id. 
                const { data: current } = await supabase.from('partes_diarios').select('item_id').eq('id', id).single();
                if (current) {
                    const hasOverlap = await api.checkDateOverlap(current.item_id, payload.fecha_inicio, payload.fecha_fin, id);
                    if (hasOverlap) throw new Error("El rango de fechas se superpone con otro reporte.");
                }
            }

            const { data, error } = await supabase
                .from('partes_diarios')
                .update({
                    avance: parseFloat(payload.avance),
                    observaciones: payload.observaciones,
                    fecha: payload.fecha,
                    fecha_inicio: payload.fecha_inicio,
                    fecha_fin: payload.fecha_fin
                })
                .eq('id', id)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating progress:', error);
            throw error;
        }
    },

    deleteProgress: async (id) => {
        try {
            const { error } = await supabase
                .from('partes_diarios')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting progress:', error);
            throw error;
        }
    },

    getLicitaciones: async () => {
        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            // 2. Get user role and permissions
            const { data: userData } = await supabase
                .from('mobile_users')
                .select('role')
                .eq('id', user.id)
                .single();

            const role = userData?.role;

            // 3. Base Query for Active Projects
            let query = supabase
                .from('datos_licitaciones')
                .select('id_licitacion, nombre_abreviado')
                .eq('obra_activa', true)
                .order('nombre_abreviado', { ascending: true });

            // 4. Apply filters based on role
            if (role === 'admin') {
                // Admins see all active projects
            } else {
                // Engineers see only assigned projects
                const { data: permissions } = await supabase
                    .from('mobile_permissions')
                    .select('licitacion_id')
                    .eq('user_id', user.id);

                const allowedIds = permissions?.map(p => p.licitacion_id) || [];

                if (allowedIds.length === 0) return []; // No access

                query = query.in('id_licitacion', allowedIds);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching licitaciones:', error);
            throw error;
        }
    },

    // --- Admin Dashboard APIs ---

    getRecentActivity: async (limit = 20) => {
        try {
            // 1. Fetch recent parts with user info
            const { data: parts, error } = await supabase
                .from('partes_diarios')
                .select(`
                    id, avance, fecha, observaciones, created_at, item_id, id_licitacion,
                    mobile_users (name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            if (!parts || parts.length === 0) return [];

            // 2. Resolve Items (Hybrid Strategy)
            const itemIds = [...new Set(parts.map(p => p.item_id))];

            // A. Public Table (ID -> Code, LicID)
            const { data: publicItems } = await supabase
                .from('datos_licitaciones_plan_trabajo')
                .select('id, item, id_licitacion')
                .in('id', itemIds);

            // B. Finnegans View (ID -> Desc)
            const { data: finItemsDirect } = await supabaseFinnegans
                .from('vista_plan_trabajo_final')
                .select('id, item, descripcion, id_licitacion')
                .in('id', itemIds);

            // C. Finnegans By Code (Code+LicID -> Desc) - For Public items
            let finItemsByCode = [];
            if (publicItems?.length > 0) {
                const codes = [...new Set(publicItems.map(i => i.item))];
                const licIds = [...new Set(publicItems.map(i => i.id_licitacion))];
                const { data: fCodes } = await supabaseFinnegans
                    .from('vista_plan_trabajo_final')
                    .select('item, id_licitacion, descripcion')
                    .in('item', codes)
                    .in('id_licitacion', licIds);
                finItemsByCode = fCodes || [];
            }

            // Build Maps
            const publicMap = new Map(publicItems?.map(i => [String(i.id), i]));
            const finDirectMap = new Map(finItemsDirect?.map(i => [String(i.id), i]));
            const finCodeMap = new Map(finItemsByCode?.map(i => [`${i.id_licitacion}_${i.item}`, i]));

            // 3. Resolve Project Names
            // Get all unique Lic IDs from Parts + Items
            const allLicIds = new Set([
                ...parts.map(p => p.id_licitacion),
                ...publicItems?.map(i => i.id_licitacion) || [],
                ...finItemsDirect?.map(i => i.id_licitacion) || []
            ]);

            const { data: projects } = await supabase
                .from('datos_licitaciones')
                .select('id_licitacion, nombre_abreviado')
                .in('id_licitacion', [...allLicIds].filter(Boolean));

            const projectMap = new Map(projects?.map(p => [p.id_licitacion, p.nombre_abreviado]));

            return parts.map(p => {
                const sId = String(p.item_id);
                let desc = 'Item Desconocido';
                let code = '???';
                // Prefer Part's LicId, fallback to Item's
                let licId = p.id_licitacion;

                // Resolve Item Details
                const pub = publicMap.get(sId);
                if (pub) {
                    code = pub.item;
                    if (!licId) licId = pub.id_licitacion;

                    // Try Code match
                    const key = `${pub.id_licitacion}_${pub.item}`;
                    const fCode = finCodeMap.get(key);
                    if (fCode) {
                        desc = fCode.descripcion;
                    } else {
                        desc = `Item ${code}`; // Fallback
                    }
                } else {
                    const fin = finDirectMap.get(sId);
                    if (fin) {
                        desc = fin.descripcion;
                        code = fin.item;
                        if (!licId) licId = fin.id_licitacion;
                    }
                }

                return {
                    ...p,
                    item_detail: { descripcion: desc, item: code },
                    project_name: projectMap.get(licId) || '---'
                };
            });
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            return [];
        }
    },

    getDashboardMetrics: async (licitacionId = null) => {
        try {
            const todayISO = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

            // Base queries
            let projectsQuery = supabase.from('datos_licitaciones').select('id_licitacion', { count: 'exact', head: true }).eq('obra_activa', true);
            let engineersQuery = supabase.from('mobile_users').select('id', { count: 'exact', head: true }).eq('role', 'engineer');
            let reportsQuery = supabase.from('partes_diarios').select('id', { count: 'exact', head: true }).gte('created_at', todayISO);

            // Apply filters
            if (licitacionId) {
                projectsQuery = projectsQuery.eq('id_licitacion', licitacionId);
                // For engineers, we check permissions (approximated by checking distinct users assigned)
                // Actually, let's query mobile_permissions for count
                engineersQuery = supabase.from('mobile_permissions').select('user_id', { count: 'exact', head: true }).eq('licitacion_id', licitacionId);
                reportsQuery = reportsQuery.eq('id_licitacion', licitacionId);
            }

            // Execute
            const [projectsRes, engineersRes, reportsRes] = await Promise.all([
                projectsQuery,
                engineersQuery,
                reportsQuery
            ]);

            // Calculate Items Metrics (Total / Completed)
            let totalItems = 0;
            let completedItems = 0;

            if (licitacionId) {
                // 1. Total Items
                const { count: tCount } = await supabase
                    .from('datos_licitaciones_plan_trabajo')
                    .select('id', { count: 'exact', head: true })
                    .eq('id_licitacion', licitacionId);
                totalItems = tCount || 0;

                // 2. Completed Items (Calculated from Advances)
                const { data: advances } = await supabase
                    .from('datos_licitaciones_avances')
                    .select('id_item, avance_real')
                    .eq('id_licitacion', licitacionId);

                if (advances) {
                    const progressMap = {};
                    advances.forEach(a => {
                        progressMap[a.id_item] = (progressMap[a.id_item] || 0) + (a.avance_real || 0);
                    });
                    completedItems = Object.values(progressMap).filter(p => p >= 0.99).length;
                }
            }

            return {
                activeProjects: projectsRes.count || 0,
                activeEngineers: engineersRes.count || 0,
                reportsToday: reportsRes.count || 0,
                totalItems: totalItems,
                completedItems: completedItems
            };
        } catch (error) {
            console.error('Error fetching metrics:', error);
            return { activeProjects: 0, activeEngineers: 0, reportsToday: 0, totalItems: 0, completedItems: 0 };
        }
    },

    getWeeklyActivity: async (licitacionId = null, startDate, endDate) => {
        try {
            // Defaults: Last 15 Days if not provided
            let start = startDate;
            let end = endDate;

            if (!start || !end) {
                const now = new Date();
                const past = new Date();
                past.setDate(now.getDate() - 15);
                start = past.toISOString().split('T')[0];
                end = now.toISOString().split('T')[0];
            }

            // 1. Fetch Parts in Range
            let query = supabase
                .from('partes_diarios')
                .select(`
                    id, avance, fecha, created_at, item_id, id_licitacion
                `)
                .gte('fecha', start)
                .lte('fecha', end)
                .order('fecha', { ascending: true });

            if (licitacionId) {
                query = query.eq('id_licitacion', licitacionId);
            }

            const { data: parts, error } = await query;

            if (error) throw error;
            if (!parts || parts.length === 0) return [];

            // Check User Role for Financial Data
            const { data: { user } } = await supabase.auth.getUser();
            const { data: userData } = await supabase.from('mobile_users').select('role').eq('id', user.id).single();
            const isAdmin = userData?.role === 'admin';

            let itemToCostMap = new Map();

            if (isAdmin) {
                // 2. Fetch Cost Data (Hybrid Strategy)
                const itemIds = [...new Set(parts.map(p => p.item_id))];

                // A. Direct Match
                const { data: publicItems } = await supabase
                    .from('datos_licitaciones_plan_trabajo')
                    .select('id, item, pu_mod_mo, pu_mod_mat, pu_mod_eq, cantidad, id_licitacion')
                    .in('id', itemIds);

                publicItems?.forEach(i => {
                    const totalCost = (i.pu_mod_mo || 0) + (i.pu_mod_mat || 0) + (i.pu_mod_eq || 0);
                    itemToCostMap.set(String(i.id), { price: totalCost, qty: i.cantidad });
                });

                // B. Code Match (Finnegans -> Public) for missing items
                const missingIds = itemIds.filter(id => !itemToCostMap.has(String(id)));

                if (missingIds.length > 0) {
                    // Get Codes for missing IDs (from Finnegans)
                    const { data: missingFinItems } = await supabaseFinnegans
                        .from('vista_plan_trabajo_final')
                        .select('id, item, id_licitacion')
                        .in('id', missingIds);

                    if (missingFinItems?.length > 0) {
                        const codes = [...new Set(missingFinItems.map(i => i.item))];
                        const licIds = [...new Set(missingFinItems.map(i => i.id_licitacion))];

                        // Fetch Public Items by Code
                        const { data: publicByCode } = await supabase
                            .from('datos_licitaciones_plan_trabajo')
                            .select('item, id_licitacion, pu_mod_mo, pu_mod_mat, pu_mod_eq, cantidad')
                            .in('item', codes)
                            .in('id_licitacion', licIds);

                        // Map Code+Lic -> Price
                        const codePriceMap = new Map();
                        publicByCode?.forEach(p => {
                            const cost = (p.pu_mod_mo || 0) + (p.pu_mod_mat || 0) + (p.pu_mod_eq || 0);
                            codePriceMap.set(`${p.id_licitacion}_${p.item}`, { price: cost, qty: p.cantidad });
                        });

                        // Fill itemToCostMap using the link: Id (Fin) -> Code -> Price
                        missingFinItems.forEach(fi => {
                            const priceData = codePriceMap.get(`${fi.id_licitacion}_${fi.item}`);
                            if (priceData) {
                                itemToCostMap.set(String(fi.id), priceData);
                            }
                        });
                    }
                }
            }

            // 3. Aggregate by Date
            const grouped = {};
            parts.forEach(part => {
                const dateKey = part.fecha; // YYYY-MM-DD
                if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey, parts: 0, money: 0 };

                grouped[dateKey].parts += 1;

                if (isAdmin) {
                    const costData = itemToCostMap.get(String(part.item_id));
                    if (costData) {
                        const executedMoney = (costData.price * costData.qty) * (part.avance / 100);
                        grouped[dateKey].money += executedMoney;
                    }
                }
            });

            return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));

        } catch (error) {
            console.error('Error fetching weekly activity:', error);
            return [];
        }
    },

    getProjectFinancials: async (licitacionId) => {
        try {
            if (!licitacionId) return { totalScope: 0, totalExecuted: 0 };

            // 1. Check Admin
            const { data: { user } } = await supabase.auth.getUser();
            const { data: userData } = await supabase.from('mobile_users').select('role').eq('id', user.id).single();
            if (userData?.role !== 'admin') return { totalScope: 0, totalExecuted: 0 };

            // 2. Fetch Project Definition (Total Scope)
            const { data: projectItems, error: itemsErr } = await supabase
                .from('datos_licitaciones_plan_trabajo')
                .select('id, item, cantidad, pu_mod_mo, pu_mod_mat, pu_mod_eq')
                .eq('id_licitacion', licitacionId);

            if (itemsErr) throw itemsErr;

            let totalScope = 0;
            const costMapById = new Map();       // ID -> Cost
            const costMapByItemCode = new Map(); // Code -> Cost

            projectItems?.forEach(ex => {
                const unitPrice = (Number(ex.pu_mod_mo) || 0) + (Number(ex.pu_mod_mat) || 0) + (Number(ex.pu_mod_eq) || 0);
                const total = unitPrice * (Number(ex.cantidad) || 0);
                totalScope += total;

                costMapById.set(String(ex.id), ex);
                costMapByItemCode.set(ex.item, ex);
            });

            // 3. Fetch Execution (Parts)
            const { data: parts, error: partsErr } = await supabase
                .from('partes_diarios')
                .select('item_id, avance')
                .eq('id_licitacion', licitacionId);

            if (partsErr) throw partsErr;

            // 4. Calculate Total Executed
            let totalExecuted = 0;
            const uniquePartItemIds = [...new Set(parts.map(p => p.item_id))];

            // Resolve Finnegans IDs to Codes for parts that don't match Direct IDs
            const missingIds = uniquePartItemIds.filter(id => !costMapById.has(String(id)));
            const itemCodeMap = new Map(); // ID -> Code

            if (missingIds.length > 0) {
                const { data: finItems } = await supabaseFinnegans
                    .from('vista_plan_trabajo_final')
                    .select('id, item')
                    .in('id', missingIds);
                finItems?.forEach(fi => itemCodeMap.set(String(fi.id), fi.item));
            }

            parts.forEach(part => {
                // Try Direct
                let cost = costMapById.get(String(part.item_id));

                // Try Code
                if (!cost) {
                    const code = itemCodeMap.get(String(part.item_id));
                    if (code) cost = costMapByItemCode.get(code);
                }

                if (cost) {
                    const unitPrice = (Number(cost.pu_mod_mo) || 0) + (Number(cost.pu_mod_mat) || 0) + (Number(cost.pu_mod_eq) || 0);
                    const totalItemScope = unitPrice * (Number(cost.cantidad) || 0);
                    const executedVal = totalItemScope * ((part.avance || 0) / 100);
                    totalExecuted += executedVal;
                }
            });

            return { totalScope, totalExecuted };
        } catch (e) {
            console.error("Error getting project financials:", e);
            return { totalScope: 0, totalExecuted: 0 };
        }
    }
};
