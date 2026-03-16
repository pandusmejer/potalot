import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const adminTools: Tool[] = [
  // === READ TOOLS ===
  {
    name: 'list_seeds',
    description: 'List alle frø i beholdningen. Kan filtrere på status eller søge på navn.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['in_stock', 'sown', 'depleted'], description: 'Filtrer på status' },
        search: { type: 'string', description: 'Søg på navn eller sort' },
      },
      required: [],
    },
  },
  {
    name: 'list_plants',
    description: 'List alle planter. Kan filtrere på status eller lokation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['planned', 'sown', 'germinated', 'pricked', 'hardening', 'planted_out', 'growing', 'flowering', 'harvesting', 'done', 'dead'] },
        search: { type: 'string', description: 'Søg på navn eller sort' },
      },
      required: [],
    },
  },
  {
    name: 'list_tasks',
    description: 'List opgaver. Kan filtrere på om de er udførte, type eller datointerval.',
    input_schema: {
      type: 'object' as const,
      properties: {
        completed: { type: 'boolean', description: 'true=kun udførte, false=kun åbne' },
        task_type: { type: 'string', enum: ['sow', 'water', 'fertilize', 'prick_out', 'harden_off', 'plant_out', 'harvest', 'prune', 'pest_check', 'custom'] },
        from_date: { type: 'string', description: 'Fra dato (YYYY-MM-DD)' },
        to_date: { type: 'string', description: 'Til dato (YYYY-MM-DD)' },
      },
      required: [],
    },
  },
  {
    name: 'list_notes',
    description: 'List noter. Kan filtrere på tags eller datointerval.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Søg i titel eller indhold' },
        tag: { type: 'string', description: 'Filtrer på tag' },
      },
      required: [],
    },
  },
  {
    name: 'list_guides',
    description: 'List alle dyrkningsguides. Kan filtrere på kategori.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', enum: ['vegetable', 'herb', 'flower', 'fruit'] },
      },
      required: [],
    },
  },
  {
    name: 'list_change_requests',
    description: 'List change requests (ændringsønsker til kode/design). Kan filtrere på status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['pending', 'in_progress', 'done', 'rejected'] },
      },
      required: [],
    },
  },

  // === SEED TOOLS ===
  {
    name: 'create_seed',
    description: 'Opret et nyt frø i beholdningen.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Navn (fx Tomat, Agurk)' },
        variety: { type: 'string', description: 'Sort (fx San Marzano)' },
        brand: { type: 'string', description: 'Mærke (fx Impecta, Nelson Garden)' },
        guide_id: { type: 'string', description: 'UUID af tilknyttet dyrkningsguide' },
        quantity: { type: 'number', description: 'Antal frø' },
        year_purchased: { type: 'number', description: 'Købsår' },
        expiry_year: { type: 'number', description: 'Udløbsår' },
        notes: { type: 'string', description: 'Noter om frøet' },
        status: { type: 'string', enum: ['in_stock', 'sown', 'depleted'], description: 'Status (standard: in_stock)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_seed',
    description: 'Opdater et eksisterende frø. Angiv kun de felter der skal ændres.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Frøets UUID' },
        name: { type: 'string' },
        variety: { type: 'string' },
        brand: { type: 'string' },
        guide_id: { type: 'string' },
        quantity: { type: 'number' },
        year_purchased: { type: 'number' },
        expiry_year: { type: 'number' },
        notes: { type: 'string' },
        status: { type: 'string', enum: ['in_stock', 'sown', 'depleted'] },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_seed',
    description: 'Slet et frø fra beholdningen.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Frøets UUID' },
      },
      required: ['id'],
    },
  },

  // === PLANT TOOLS ===
  {
    name: 'create_plant',
    description: 'Opret en ny plante.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Plantenavn' },
        variety: { type: 'string', description: 'Sort' },
        seed_id: { type: 'string', description: 'UUID af frø den stammer fra' },
        guide_id: { type: 'string', description: 'UUID af tilknyttet guide' },
        status: { type: 'string', enum: ['planned', 'sown', 'germinated', 'pricked', 'hardening', 'planted_out', 'growing', 'flowering', 'harvesting', 'done', 'dead'] },
        location: { type: 'string', description: 'Placering (fx vindueskarm, drivhus)' },
        sow_date: { type: 'string', description: 'Sådato (YYYY-MM-DD)' },
        quantity: { type: 'number', description: 'Antal planter' },
        notes: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_plant',
    description: 'Opdater en eksisterende plante. Angiv kun felter der skal ændres.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Plantens UUID' },
        name: { type: 'string' },
        variety: { type: 'string' },
        seed_id: { type: 'string' },
        guide_id: { type: 'string' },
        status: { type: 'string', enum: ['planned', 'sown', 'germinated', 'pricked', 'hardening', 'planted_out', 'growing', 'flowering', 'harvesting', 'done', 'dead'] },
        location: { type: 'string' },
        sow_date: { type: 'string' },
        germination_date: { type: 'string' },
        prick_date: { type: 'string' },
        plant_out_date: { type: 'string' },
        first_harvest_date: { type: 'string' },
        last_harvest_date: { type: 'string' },
        quantity: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_plant',
    description: 'Slet en plante.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Plantens UUID' },
      },
      required: ['id'],
    },
  },

  // === TASK TOOLS ===
  {
    name: 'create_task',
    description: 'Opret en ny opgave.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Opgavetitel' },
        description: { type: 'string', description: 'Beskrivelse' },
        task_type: { type: 'string', enum: ['sow', 'water', 'fertilize', 'prick_out', 'harden_off', 'plant_out', 'harvest', 'prune', 'pest_check', 'custom'] },
        due_date: { type: 'string', description: 'Forfaldsdato (YYYY-MM-DD)' },
        plant_id: { type: 'string', description: 'UUID af tilknyttet plante' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['title', 'due_date'],
    },
  },
  {
    name: 'complete_task',
    description: 'Markér en opgave som udført.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Opgavens UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Slet en opgave.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Opgavens UUID' },
      },
      required: ['id'],
    },
  },

  // === NOTE TOOLS ===
  {
    name: 'create_note',
    description: 'Opret en ny note.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Notetitel' },
        content: { type: 'string', description: 'Noteindhold' },
        plant_id: { type: 'string', description: 'UUID af tilknyttet plante' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags (fx ["tomat", "gødning"])' },
        note_date: { type: 'string', description: 'Dato (YYYY-MM-DD, standard: i dag)' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'update_note',
    description: 'Opdater en eksisterende note.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Notens UUID' },
        title: { type: 'string' },
        content: { type: 'string' },
        plant_id: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_note',
    description: 'Slet en note.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Notens UUID' },
      },
      required: ['id'],
    },
  },

  // === GUIDE TOOLS ===
  {
    name: 'create_guide',
    description: 'Opret en ny dyrkningsguide.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name_da: { type: 'string', description: 'Dansk navn' },
        name_en: { type: 'string', description: 'Engelsk navn' },
        slug: { type: 'string', description: 'URL-slug (fx "tomat", "chili")' },
        category: { type: 'string', enum: ['vegetable', 'herb', 'flower', 'fruit'] },
        description: { type: 'string' },
        sow_indoor_start: { type: 'string', description: 'Så indendørs fra (fx "marts")' },
        sow_indoor_end: { type: 'string', description: 'Så indendørs til' },
        sow_outdoor_start: { type: 'string' },
        sow_outdoor_end: { type: 'string' },
        plant_out_start: { type: 'string' },
        plant_out_end: { type: 'string' },
        harvest_start: { type: 'string' },
        harvest_end: { type: 'string' },
        days_to_germination_min: { type: 'number' },
        days_to_germination_max: { type: 'number' },
        days_to_harvest_min: { type: 'number' },
        days_to_harvest_max: { type: 'number' },
        spacing_cm: { type: 'number' },
        depth_cm: { type: 'number' },
        sun_requirement: { type: 'string', enum: ['full_sun', 'partial_shade', 'shade'] },
        water_need: { type: 'string', enum: ['low', 'medium', 'high'] },
        frost_hardy: { type: 'boolean' },
        tips: { type: 'string' },
        companion_plants: { type: 'array', items: { type: 'string' } },
      },
      required: ['name_da', 'slug', 'category'],
    },
  },
  {
    name: 'update_guide',
    description: 'Opdater en eksisterende dyrkningsguide.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Guidens UUID' },
        name_da: { type: 'string' },
        name_en: { type: 'string' },
        slug: { type: 'string' },
        category: { type: 'string', enum: ['vegetable', 'herb', 'flower', 'fruit'] },
        description: { type: 'string' },
        sow_indoor_start: { type: 'string' },
        sow_indoor_end: { type: 'string' },
        sow_outdoor_start: { type: 'string' },
        sow_outdoor_end: { type: 'string' },
        plant_out_start: { type: 'string' },
        plant_out_end: { type: 'string' },
        harvest_start: { type: 'string' },
        harvest_end: { type: 'string' },
        days_to_germination_min: { type: 'number' },
        days_to_germination_max: { type: 'number' },
        days_to_harvest_min: { type: 'number' },
        days_to_harvest_max: { type: 'number' },
        spacing_cm: { type: 'number' },
        depth_cm: { type: 'number' },
        sun_requirement: { type: 'string', enum: ['full_sun', 'partial_shade', 'shade'] },
        water_need: { type: 'string', enum: ['low', 'medium', 'high'] },
        frost_hardy: { type: 'boolean' },
        tips: { type: 'string' },
        companion_plants: { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
    },
  },

  // === CHANGE REQUEST TOOLS ===
  {
    name: 'create_change_request',
    description: 'Opret en ændringsanmodning for kode/design-ændringer der ikke kan gøres direkte. Brug denne når Anna beder om ændringer i layout, farver, nye features eller bugfixes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        description: { type: 'string', description: 'Kort beskrivelse af ændringen' },
        details: { type: 'string', description: 'Detaljeret beskrivelse med kontekst' },
        category: { type: 'string', enum: ['design', 'feature', 'bug'], description: 'Type ændring' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['description', 'category'],
    },
  },
]
