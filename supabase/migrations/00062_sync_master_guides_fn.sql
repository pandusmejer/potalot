-- ============================================================
-- sync_master_guides — atomisk to-pass upsert af master-guides
-- ============================================================
-- Envejs-spejling: IMPORTED_GUIDES → public.guides master-rækker (user_id NULL).
-- Kaldes KUN af scripts/guides-sync-master.ts med service-role-nøglen (bypasser
-- RLS). Funktionen ejer ALDRIG indhold — den er en afledt cache, hvis eneste
-- formål er at lade ensureGuideFor* genbruge masteren i stedet for at generere
-- et AI-udkast. Se Docs/product/guides-master-sync-spec.md §3.
--
-- Kontrakt:
--   p_guides  = JSONB-array af FÆRDIGMAPPEDE rækker (snake_case-kolonner +
--               'parent_slug' for sorter; guide_level allerede oversat art/sort).
--   p_dry_run = true → skriv INTET, returnér kun klassifikationen (create/
--               update/unchanged). false → udfør upsert i ÉN transaktion.
--
-- Atomicitet: hele kroppen kører i kaldets transaktion. En forældreløs sort
-- (parent-slug uden master-art) → RAISE EXCEPTION → hele kørslen ruller tilbage,
-- så DB aldrig står halvt synkroniseret.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_master_guides(p_guides JSONB, p_dry_run BOOLEAN DEFAULT true)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  g                     JSONB;
  v_slug                TEXT;
  v_parent_slug         TEXT;
  v_parent_uuid         UUID;
  v_guide_level         TEXT;
  v_plant_name          TEXT;
  v_variety             TEXT;
  v_latin_name          TEXT;
  v_primary_category_id TEXT;
  v_subcategory_id      TEXT;
  v_summary             TEXT;
  v_difficulty          TEXT;
  v_tags                TEXT[];
  v_quick_facts         JSONB;
  v_sections            JSONB;
  v_calendar_rules      JSONB;
  v_primary_image_url   TEXT;
  v_source_links        TEXT[];
  existing              public.guides%ROWTYPE;
  v_differs             BOOLEAN;
  v_created             TEXT[] := '{}';
  v_updated             TEXT[] := '{}';
  v_unchanged           TEXT[] := '{}';
  v_pass                INT;
  v_known_slugs         TEXT[];
BEGIN
  -- Alle kilde-slugs i denne kørsel — bruges i dry-run til at acceptere en
  -- forælder der endnu ikke er "skrevet" (da vi ikke skriver i dry-run).
  SELECT array_agg(item->>'slug') INTO v_known_slugs
  FROM jsonb_array_elements(p_guides) AS t(item);

  -- To pass: art (pass 1) FØR sort (pass 2), så en sorts parent-UUID kan
  -- resolves fra den netop-upsertede art i samme transaktion.
  FOR v_pass IN 1..2 LOOP
    FOR g IN
      SELECT item FROM jsonb_array_elements(p_guides) AS t(item)
      WHERE (item->>'guide_level') = CASE WHEN v_pass = 1 THEN 'art' ELSE 'sort' END
    LOOP
      v_slug                := g->>'slug';
      v_guide_level         := g->>'guide_level';
      v_parent_slug         := g->>'parent_slug';
      v_plant_name          := g->>'plant_name';
      v_variety             := g->>'variety';
      v_latin_name          := g->>'latin_name';
      v_primary_category_id := g->>'primary_category_id';
      v_subcategory_id      := g->>'subcategory_id';
      v_summary             := g->>'summary';
      v_difficulty          := g->>'difficulty';
      v_tags                := COALESCE(ARRAY(SELECT jsonb_array_elements_text(g->'tags')), '{}');
      v_quick_facts         := COALESCE(g->'quick_facts', '{}'::jsonb);
      v_sections            := COALESCE(g->'sections', '[]'::jsonb);
      v_calendar_rules      := COALESCE(g->'calendar_rules', '[]'::jsonb);
      v_primary_image_url   := g->>'primary_image_url';
      v_source_links        := COALESCE(ARRAY(SELECT jsonb_array_elements_text(g->'source_links')), '{}');

      -- Parent-resolution (kun sort). Forælderen SKAL være en master-art.
      v_parent_uuid := NULL;
      IF v_guide_level = 'sort' THEN
        SELECT id INTO v_parent_uuid
        FROM public.guides
        WHERE slug = v_parent_slug AND user_id IS NULL;

        IF v_parent_uuid IS NULL THEN
          IF p_dry_run AND v_parent_slug = ANY(v_known_slugs) THEN
            NULL;  -- preview: forælderen findes i kilden, ville være oprettet i pass 1
          ELSE
            RAISE EXCEPTION 'Foraeldreloes sortsguide "%": parent-slug "%" findes ikke som master-art', v_slug, v_parent_slug;
          END IF;
        END IF;
      END IF;

      SELECT * INTO existing
      FROM public.guides
      WHERE slug = v_slug AND user_id IS NULL;

      IF NOT FOUND THEN
        v_created := array_append(v_created, v_slug);
        IF NOT p_dry_run THEN
          INSERT INTO public.guides (
            slug, user_id, plant_name, variety, latin_name, guide_level,
            parent_guide_id, primary_category_id, subcategory_id, summary,
            difficulty, tags, quick_facts, sections, calendar_rules,
            primary_image_url, source_links, status, is_ai_generated
          ) VALUES (
            v_slug, NULL, v_plant_name, v_variety, v_latin_name, v_guide_level,
            v_parent_uuid, v_primary_category_id, v_subcategory_id, v_summary,
            v_difficulty, v_tags, v_quick_facts, v_sections, v_calendar_rules,
            v_primary_image_url, v_source_links, 'published', false
          );
        END IF;
      ELSE
        v_differs :=
             existing.plant_name          IS DISTINCT FROM v_plant_name
          OR existing.variety             IS DISTINCT FROM v_variety
          OR existing.latin_name          IS DISTINCT FROM v_latin_name
          OR existing.guide_level         IS DISTINCT FROM v_guide_level
          OR existing.parent_guide_id     IS DISTINCT FROM v_parent_uuid
          OR existing.primary_category_id IS DISTINCT FROM v_primary_category_id
          OR existing.subcategory_id      IS DISTINCT FROM v_subcategory_id
          OR existing.summary             IS DISTINCT FROM v_summary
          OR existing.difficulty          IS DISTINCT FROM v_difficulty
          OR existing.tags                IS DISTINCT FROM v_tags
          OR existing.quick_facts         IS DISTINCT FROM v_quick_facts
          OR existing.sections            IS DISTINCT FROM v_sections
          OR existing.calendar_rules      IS DISTINCT FROM v_calendar_rules
          OR existing.primary_image_url   IS DISTINCT FROM v_primary_image_url
          OR existing.source_links        IS DISTINCT FROM v_source_links
          OR existing.status              IS DISTINCT FROM 'published'
          OR existing.is_ai_generated     IS DISTINCT FROM false;

        IF v_differs THEN
          v_updated := array_append(v_updated, v_slug);
          IF NOT p_dry_run THEN
            UPDATE public.guides SET
              plant_name          = v_plant_name,
              variety             = v_variety,
              latin_name          = v_latin_name,
              guide_level         = v_guide_level,
              parent_guide_id     = v_parent_uuid,
              primary_category_id = v_primary_category_id,
              subcategory_id      = v_subcategory_id,
              summary             = v_summary,
              difficulty          = v_difficulty,
              tags                = v_tags,
              quick_facts         = v_quick_facts,
              sections            = v_sections,
              calendar_rules      = v_calendar_rules,
              primary_image_url   = v_primary_image_url,
              source_links        = v_source_links,
              status              = 'published',
              is_ai_generated     = false,
              updated_at          = now()
            WHERE id = existing.id;
          END IF;
        ELSE
          v_unchanged := array_append(v_unchanged, v_slug);
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'dry_run',         p_dry_run,
    'created',         to_jsonb(v_created),
    'updated',         to_jsonb(v_updated),
    'unchanged',       to_jsonb(v_unchanged),
    'create_count',    COALESCE(array_length(v_created, 1), 0),
    'update_count',    COALESCE(array_length(v_updated, 1), 0),
    'unchanged_count', COALESCE(array_length(v_unchanged, 1), 0)
  );
END $$;

-- Kun service-role må køre syncen. Selv hvis en almindelig bruger kaldte den,
-- ville RLS blokere INSERT af user_id=NULL-rækker — men vi lukker døren helt.
REVOKE ALL ON FUNCTION public.sync_master_guides(JSONB, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_master_guides(JSONB, BOOLEAN) TO service_role;
