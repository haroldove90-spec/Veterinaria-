-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Owners Table
CREATE TABLE IF NOT EXISTS owners (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Pets Table
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES owners(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    birth_date DATE,
    weight_kg DECIMAL(5,2),
    medical_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
    vet_id UUID REFERENCES owners(id) NOT NULL, -- Assuming vet is also an auth user
    consultation_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    reason TEXT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    ia_analysis JSONB, -- Gemini clinical analysis
    embedding vector(1536), -- Gemini embeddings for semantic search
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
    medication TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Authenticated users can read/write their own data)
-- Note: In a real app, you'd have more granular roles (Vet vs Owner)
CREATE POLICY "Users can view their own owner profile" ON owners FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own owner profile" ON owners FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Vets can view all pets" ON pets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Vets can manage pets" ON pets FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Vets can view all consultations" ON consultations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Vets can manage consultations" ON consultations FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Vets can view all prescriptions" ON prescriptions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Vets can manage prescriptions" ON prescriptions FOR ALL USING (auth.role() = 'authenticated');

-- Example JSON for Gemini Analysis (Dermatitis)
/*
{
  "summary": "Canine Atopic Dermatitis suspected with secondary bacterial infection.",
  "risk_level": "Moderate",
  "ai_observations": [
    "Bilateral erythema in axillary and inguinal regions.",
    "Presence of papules and crusts suggests Pyoderma.",
    "Patient history of seasonal itching aligns with environmental allergies."
  ],
  "recommended_tests": [
    "Skin scraping for ectoparasites.",
    "Cytology of lesions to confirm bacterial/yeast overgrowth.",
    "Elimination diet trial if symptoms persist."
  ],
  "differential_diagnoses": [
    "Sarcoptic mange",
    "Food allergy",
    "Flea allergy dermatitis (FAD)"
  ],
  "urgency": "Non-emergency but requires prompt treatment to prevent self-trauma."
}
*/
