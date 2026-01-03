-- ============================================
-- MIGRACIÓN 3: Seed Plans & Packages
-- ============================================
-- Copia este bloque en el Editor SQL de Supabase y ejecútalo

-- 1. Insertar Planes Básicos
INSERT INTO plans (name, description) VALUES
('Starter', 'Essential tools for small events'),
('Professional', 'Advanced tools for business events and conferences'),
('Enterprise', 'Full suite for large scale productions')
ON CONFLICT DO NOTHING;

-- 2. Vincular Paquetes a Planes
DO $$
DECLARE
    starter_id UUID;
    pro_id UUID;
    ent_id UUID;
    
    pkg_booth UUID;
    pkg_conf UUID;
    pkg_lead UUID;
    pkg_analytics UUID;
    pkg_portal UUID;
    pkg_game UUID;
    pkg_live UUID;
    pkg_comm UUID;
    pkg_sponsor UUID;
BEGIN
    -- Obtener IDs de Planes
    SELECT id INTO starter_id FROM plans WHERE name = 'Starter';
    SELECT id INTO pro_id FROM plans WHERE name = 'Professional';
    SELECT id INTO ent_id FROM plans WHERE name = 'Enterprise';

    -- Obtener IDs de Paquetes (asegúrate de haber ejecutado la Migración 2 primero)
    SELECT id INTO pkg_booth FROM feature_packages WHERE key = 'booth_management_suite';
    SELECT id INTO pkg_conf FROM feature_packages WHERE key = 'session_conference_tools';
    SELECT id INTO pkg_lead FROM feature_packages WHERE key = 'lead_capture_pro';
    SELECT id INTO pkg_analytics FROM feature_packages WHERE key = 'analytics_reporting';
    SELECT id INTO pkg_portal FROM feature_packages WHERE key = 'attendee_portal_standard';
    SELECT id INTO pkg_game FROM feature_packages WHERE key = 'gamification_engagement';
    SELECT id INTO pkg_live FROM feature_packages WHERE key = 'live_operations';
    SELECT id INTO pkg_comm FROM feature_packages WHERE key = 'communication_tools';
    SELECT id INTO pkg_sponsor FROM feature_packages WHERE key = 'sponsorship_management';

    -- Starter: Portal, Cmm
    INSERT INTO plan_packages (plan_id, package_id) VALUES 
    (starter_id, pkg_portal),
    (starter_id, pkg_comm)
    ON CONFLICT DO NOTHING;

    -- Professional: Starter + Booth, Conf, Lead, Analytics
    INSERT INTO plan_packages (plan_id, package_id) VALUES 
    (pro_id, pkg_portal),
    (pro_id, pkg_comm),
    (pro_id, pkg_booth),
    (pro_id, pkg_conf),
    (pro_id, pkg_lead),
    (pro_id, pkg_analytics)
    ON CONFLICT DO NOTHING;

    -- Enterprise: ALL
    INSERT INTO plan_packages (plan_id, package_id) VALUES 
    (ent_id, pkg_portal),
    (ent_id, pkg_comm),
    (ent_id, pkg_booth),
    (ent_id, pkg_conf),
    (ent_id, pkg_lead),
    (ent_id, pkg_analytics),
    (ent_id, pkg_game),
    (ent_id, pkg_live),
    (ent_id, pkg_sponsor)
    ON CONFLICT DO NOTHING;

    -- 3. Asignar 'Professional' a eventos existentes sin plan
    UPDATE events 
    SET plan_id = pro_id 
    WHERE plan_id IS NULL;

END $$;
