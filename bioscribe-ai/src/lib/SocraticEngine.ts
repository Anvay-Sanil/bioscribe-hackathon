// ─── BioScribe Scholar: Socratic AI Engine ──────────────────────────
// Generates infinite, unique patient scenarios and Socratic responses.
// Architecture: Swap `generateSocraticResponse()` for a real LLM call.
// ─────────────────────────────────────────────────────────────────────

export type Difficulty = 'intern' | 'resident' | 'attending' | 'house';

export interface GeneratedScenario {
    id: string;
    difficulty: Difficulty;
    patient: {
        age: number;
        sex: 'Male' | 'Female';
        occupation: string;
        presentingComplaint: string;
    };
    vitals: { hr: number; bp: string; spo2: number; rr: number; temp: number };
    history: string[];
    medications: string[];
    labResults: { label: string; value: string; abnormal: boolean }[];
    // The "correct" diagnosis and key drug
    diagnosis: string;
    keyDrug: string;
    keyMechanism: string;
    redHerring?: string;
}

export interface SocraticResponse {
    text: string;
    isCorrect: boolean;
    followUp?: string;
    houseQuote?: string;
}

// ─── Patient Templates ──────────────────────────────────────────────
const PATIENT_TEMPLATES = [
    {
        presentingComplaint: 'Severe epigastric pain radiating to the back after heavy drinking',
        diagnosis: 'Acute Pancreatitis',
        keyDrug: 'IV Normal Saline + Lactated Ringer\'s',
        keyMechanism: 'Aggressive fluid resuscitation to prevent pancreatic necrosis from hypoperfusion',
        medications: ['None'],
        history: ['Heavy alcohol use (15 drinks/week)', 'Gallstones on prior US'],
        labResults: [
            { label: 'Lipase', value: '1,840 U/L', abnormal: true },
            { label: 'Amylase', value: '920 U/L', abnormal: true },
            { label: 'WBC', value: '14,200/μL', abnormal: true },
            { label: 'Glucose', value: '190 mg/dL', abnormal: true },
        ],
        redHerring: 'Patient mentions occasional heartburn — not GERD',
    },
    {
        presentingComplaint: 'Progressive confusion, jaundice, and asterixis over 3 days',
        diagnosis: 'Hepatic Encephalopathy',
        keyDrug: 'Lactulose 20-30g PO q1-2h until bowel movement',
        keyMechanism: 'Lactulose is converted to lactic acid by gut bacteria, trapping NH3 as NH4+ for fecal excretion, reducing serum ammonia',
        medications: ['Furosemide 40mg PO daily', 'Spironolactone 100mg PO daily'],
        history: ['Known cirrhosis (Child-Pugh C)', 'Variceal bleeding 6 months ago', 'Ascites requiring paracentesis'],
        labResults: [
            { label: 'Ammonia', value: '185 μmol/L', abnormal: true },
            { label: 'Albumin', value: '2.1 g/dL', abnormal: true },
            { label: 'INR', value: '2.8', abnormal: true },
            { label: 'Bilirubin', value: '8.4 mg/dL', abnormal: true },
        ],
        redHerring: 'Family insists patient hit his head last week — not a subdural hematoma',
    },
    {
        presentingComplaint: 'Sudden onset severe headache "worst of my life" with neck stiffness',
        diagnosis: 'Subarachnoid Hemorrhage (SAH)',
        keyDrug: 'Nimodipine 60mg PO q4h',
        keyMechanism: 'Nimodipine is a calcium channel blocker selective for cerebral vasculature — prevents vasospasm (the leading cause of delayed ischemic injury in SAH)',
        medications: ['Lisinopril 20mg PO daily', 'Metformin 1000mg BID'],
        history: ['Hypertension × 10 years', 'Smoker (1 PPD × 20 years)', 'Family history: mother died of brain aneurysm'],
        labResults: [
            { label: 'CT Head', value: 'Blood in subarachnoid space', abnormal: true },
            { label: 'WBC', value: '11,800/μL', abnormal: true },
            { label: 'Glucose', value: '210 mg/dL', abnormal: true },
            { label: 'Troponin', value: '0.18 ng/mL', abnormal: true },
        ],
    },
    {
        presentingComplaint: 'Crushing chest pain, diaphoresis, nausea. ECG: ST elevation leads V1-V4',
        diagnosis: 'Anterior STEMI',
        keyDrug: 'Aspirin 325mg PO (chewed) + Heparin drip + Clopidogrel 600mg loading',
        keyMechanism: 'Dual antiplatelet therapy + anticoagulation to prevent thrombus propagation while preparing for PCI',
        medications: ['Atorvastatin 40mg daily'],
        history: ['Type 2 Diabetes', 'Hypercholesterolemia', 'Father had MI at 52'],
        labResults: [
            { label: 'Troponin I', value: '12.4 ng/mL', abnormal: true },
            { label: 'CK-MB', value: '48 U/L', abnormal: true },
            { label: 'BNP', value: '890 pg/mL', abnormal: true },
            { label: 'Potassium', value: '5.6 mEq/L', abnormal: true },
        ],
    },
    {
        presentingComplaint: 'Productive cough, fever 39.5°C, pleuritic chest pain, rigors',
        diagnosis: 'Community-Acquired Pneumonia (CURB-65 = 3)',
        keyDrug: 'Ceftriaxone 1g IV daily + Azithromycin 500mg IV daily',
        keyMechanism: 'Ceftriaxone covers typical bacteria (S. pneumoniae, H. influenzae). Azithromycin covers atypicals (Mycoplasma, Legionella). Dual therapy reduces mortality in bacteremic pneumonia.',
        medications: ['Metoprolol 50mg BID', 'Aspirin 81mg daily'],
        history: ['COPD (Gold Stage II)', 'Ex-smoker (quit 2 years ago)', 'No flu vaccine this season'],
        labResults: [
            { label: 'WBC', value: '18,400/μL', abnormal: true },
            { label: 'Procalcitonin', value: '4.2 ng/mL', abnormal: true },
            { label: 'Lactate', value: '3.1 mmol/L', abnormal: true },
            { label: 'PaO2', value: '58 mmHg', abnormal: true },
        ],
    },
    {
        presentingComplaint: 'Swollen, hot, erythematous right knee. Unable to bear weight. Fever 38.8°C',
        diagnosis: 'Septic Arthritis',
        keyDrug: 'Vancomycin 25mg/kg IV + Ceftriaxone 2g IV',
        keyMechanism: 'Empiric coverage for S. aureus (including MRSA with Vancomycin) and gram-negatives (Ceftriaxone). Joint destruction is irreversible if antibiotics are delayed > 24h.',
        medications: ['Prednisone 10mg PO daily', 'Methotrexate 15mg weekly'],
        history: ['Rheumatoid arthritis on immunosuppression', 'Recent dental procedure (2 weeks ago)', 'Prosthetic left knee (2019)'],
        labResults: [
            { label: 'Synovial WBC', value: '85,000/μL', abnormal: true },
            { label: 'Synovial Crystals', value: 'None seen', abnormal: false },
            { label: 'Serum CRP', value: '24.8 mg/L', abnormal: true },
            { label: 'ESR', value: '92 mm/hr', abnormal: true },
        ],
        redHerring: 'Patient on methotrexate — could be gout flare, but NO crystals rules it out',
    },
    {
        presentingComplaint: 'Rapid weight gain (5kg in 2 weeks), periorbital edema, foamy urine',
        diagnosis: 'Nephrotic Syndrome',
        keyDrug: 'Prednisone 1mg/kg/day PO (initial therapy for minimal change disease)',
        keyMechanism: 'Glucocorticoids suppress the immune-mediated podocyte injury causing massive proteinuria. Response rate > 90% in minimal change disease.',
        medications: ['Lisinopril 10mg PO daily'],
        history: ['Recent upper respiratory infection (3 weeks ago)', 'No prior kidney disease'],
        labResults: [
            { label: 'Urine Protein', value: '8.2 g/24h', abnormal: true },
            { label: 'Albumin', value: '1.8 g/dL', abnormal: true },
            { label: 'Cholesterol', value: '380 mg/dL', abnormal: true },
            { label: 'Creatinine', value: '1.2 mg/dL', abnormal: false },
        ],
    },
    {
        presentingComplaint: 'Polyuria, polydipsia, fruity breath odor, Kussmaul breathing',
        diagnosis: 'Diabetic Ketoacidosis (DKA)',
        keyDrug: 'Regular Insulin IV drip 0.1 units/kg/hr + Aggressive IV NS',
        keyMechanism: 'Insulin drives glucose and potassium into cells, halts ketogenesis. Fluids correct the profound dehydration (average deficit 5-7L). Must monitor K+ closely — insulin shifts K+ intracellularly.',
        medications: ['None — new diagnosis'],
        history: ['19-year-old university student', 'Weight loss × 3 months', 'Missed classes due to fatigue'],
        labResults: [
            { label: 'Glucose', value: '542 mg/dL', abnormal: true },
            { label: 'pH', value: '7.14', abnormal: true },
            { label: 'Bicarbonate', value: '8 mEq/L', abnormal: true },
            { label: 'Potassium', value: '5.8 mEq/L', abnormal: true },
            { label: 'Anion Gap', value: '28', abnormal: true },
        ],
    },
];

const OCCUPATIONS = ['Teacher', 'Engineer', 'Student', 'Retired', 'Construction Worker', 'Office Worker', 'Chef', 'Mechanic', 'Nurse', 'Farmer'];

// ─── House Quotes ────────────────────────────────────────────────────
const HOUSE_INTROS = [
    'Everybody lies. Especially patients. But the blood work doesn\'t.',
    'It\'s a basic truth of the human condition that everybody lies. The interesting part is figuring out about what.',
    'Humanity is overrated. I prefer data.',
    'If you could reason with religious people, there would be no religious people. Same goes for patients who "forget" to mention symptoms.',
    'I don\'t ask why patients need help. I just find what\'s wrong and fix it.',
    'Treating illness is why we became doctors. Treating patients is what makes us miserable.',
    'You want to know how two chemicals interact, do you ask them? No. You apply science.',
    'The only value of that degree is that it proves you can suffer through anything.',
];

const HOUSE_WRONG_RESPONSES = [
    'You just killed the patient. Was that your plan? Look at the labs again.',
    'Interesting theory. Wrong, but interesting. What does the chief complaint ACTUALLY tell you?',
    'If your answer was a drug, the FDA would have pulled it years ago. Think harder.',
    'Congratulations, you\'ve just proven that medical school needs tougher admission standards.',
    'Wrong. But don\'t feel bad — that\'s what 90% of the people in this room would have said. And they\'d all be wrong too.',
    'Did you just throw a dart at the pharmacopeia? Because that\'s what it sounds like.',
    'I\'m going to pretend you didn\'t say that, and give you a chance to actually use that degree.',
];

const HOUSE_PARTIAL_RESPONSES = [
    'Getting warmer. But you\'re treating the symptom, not the disease. What\'s the ROOT cause?',
    'Good instinct, wrong execution. You identified the right system — now pick the right drug.',
    'Partial credit. You wouldn\'t die on the wards with that answer, but you wouldn\'t impress anyone either.',
    'Close. But "close" in pharmacology means the patient still has a problem. Think about the mechanism of action.',
    'You\'re in the right organ system. Now ask yourself: what SPECIFICALLY is failing, and what reverses it?',
];

const HOUSE_CORRECT_RESPONSES = [
    'Not bad. Even a broken clock is right twice a day. Now tell me WHY that\'s correct.',
    'Correct. I\'m almost impressed. Now the attending asks: what\'s the ceiling dose and what happens if you exceed it?',
    'Finally, someone who reads. Gold star. Now explain the mechanism to a first-year student.',
    'Right answer. But here\'s the harder question: what do you do when the patient is allergic to your correct answer?',
    'Correct. But I bet you can\'t tell me the three most dangerous side effects.',
];

// ─── Drug Options Generator ─────────────────────────────────────────
const DRUG_DISTRACTORS: Record<string, string[]> = {
    'Acute Pancreatitis': ['Morphine IV (may worsen sphincter of Oddi spasm)', 'Omeprazole 40mg IV (treats GERD, not pancreatitis)', 'Metoclopramide 10mg IV (antiemetic only)'],
    'Hepatic Encephalopathy': ['Flumazenil IV (only for benzo OD)', 'Metronidazole 500mg PO (second-line, neurotoxic)', 'Activated charcoal PO (useless—ammonia is endogenous)'],
    'Subarachnoid Hemorrhage (SAH)': ['Nifedipine SL (causes hypotension, wrong CCB)', 'Aminocaproic acid (antifibrinolytic—controversial)', 'Mannitol 20% IV (reduces ICP but not vasospasm)'],
    'Anterior STEMI': ['Nitroglycerin SL (check BP first—may be contraindicated)', 'Morphine IV (increases mortality in STEMI)', 'Magnesium sulfate IV (no proven benefit in STEMI)'],
    'Community-Acquired Pneumonia (CURB-65 = 3)': ['Levofloxacin 750mg IV alone (risk of resistance, not for admitted)', 'Amoxicillin 1g PO (oral route inappropriate for CURB-65=3)', 'Doxycycline 100mg PO BID (atypical coverage only, not severe)'],
    'Septic Arthritis': ['NSAID + Colchicine (treats gout, NOT infection)', 'Dexamethasone 8mg IV (immunosuppression is dangerous here)', 'Oral Clindamycin alone (inadequate for septic joint)'],
    'Nephrotic Syndrome': ['Furosemide 40mg IV (treats edema only, not the disease)', 'Cyclophosphamide PO (second-line, too toxic for initial therapy)', 'Losartan 50mg PO (reduces proteinuria but doesn\'t treat MCD)'],
    'Diabetic Ketoacidosis (DKA)': ['Glargine insulin SubQ (long-acting—too slow for DKA)', 'Oral metformin (contraindicated in DKA, causes lactic acidosis)', 'IV Bicarbonate (rarely indicated—only if pH < 6.9)'],
};

// ─── Generator Function ─────────────────────────────────────────────
export function generateScenario(difficulty: Difficulty): GeneratedScenario {
    const template = PATIENT_TEMPLATES[Math.floor(Math.random() * PATIENT_TEMPLATES.length)];

    // Randomize patient demographics
    const ageRange = difficulty === 'intern' ? [25, 45] : difficulty === 'resident' ? [30, 65] : [18, 85];
    const age = Math.floor(Math.random() * (ageRange[1] - ageRange[0])) + ageRange[0];
    const sex = Math.random() > 0.5 ? 'Male' as const : 'Female' as const;
    const occupation = OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)];

    return {
        id: `case-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        difficulty,
        patient: { age, sex, occupation, presentingComplaint: template.presentingComplaint },
        vitals: {
            hr: 60 + Math.floor(Math.random() * 80),
            bp: `${90 + Math.floor(Math.random() * 60)}/${50 + Math.floor(Math.random() * 40)}`,
            spo2: 85 + Math.floor(Math.random() * 15),
            rr: 14 + Math.floor(Math.random() * 20),
            temp: 36.5 + Math.round(Math.random() * 3.5 * 10) / 10,
        },
        history: template.history,
        medications: template.medications,
        labResults: template.labResults,
        diagnosis: template.diagnosis,
        keyDrug: template.keyDrug,
        keyMechanism: template.keyMechanism,
        redHerring: template.redHerring,
    };
}

export function getDrugOptions(scenario: GeneratedScenario): { label: string; isCorrect: boolean }[] {
    const distractors = DRUG_DISTRACTORS[scenario.diagnosis] || [
        'Acetaminophen 1g PO (symptomatic only)',
        'IV Normal Saline 500ml bolus (supportive only)',
        'Ondansetron 4mg IV (treats nausea, not the disease)',
    ];
    const options = [
        { label: scenario.keyDrug, isCorrect: true },
        ...distractors.map(d => ({ label: d, isCorrect: false })),
    ];
    // Shuffle
    return options.sort(() => Math.random() - 0.5);
}

export function getSocraticResponse(correct: boolean, scenario: GeneratedScenario): SocraticResponse {
    if (correct) {
        return {
            text: HOUSE_CORRECT_RESPONSES[Math.floor(Math.random() * HOUSE_CORRECT_RESPONSES.length)],
            isCorrect: true,
            followUp: `Explain: Why does ${scenario.keyDrug.split(' ')[0]} work at the molecular level for ${scenario.diagnosis}?`,
            houseQuote: `The mechanism: ${scenario.keyMechanism}`,
        };
    } else {
        const isPartial = Math.random() > 0.5;
        if (isPartial) {
            return {
                text: HOUSE_PARTIAL_RESPONSES[Math.floor(Math.random() * HOUSE_PARTIAL_RESPONSES.length)],
                isCorrect: false,
                followUp: `Hint: Look at the ${scenario.labResults.filter(l => l.abnormal)[0]?.label}. What does it tell you about the underlying pathology?`,
            };
        }
        return {
            text: HOUSE_WRONG_RESPONSES[Math.floor(Math.random() * HOUSE_WRONG_RESPONSES.length)],
            isCorrect: false,
            followUp: scenario.redHerring
                ? `🚩 Red herring alert: "${scenario.redHerring}" — Don't let the family distract you.`
                : `Focus on the chief complaint: "${scenario.patient.presentingComplaint}". What organ system is FAILING?`,
        };
    }
}

export function getHouseIntro(): string {
    return HOUSE_INTROS[Math.floor(Math.random() * HOUSE_INTROS.length)];
}

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; icon: string; description: string }> = {
    intern: { label: 'Intern', color: '#3b82f6', icon: '🔬', description: 'Straightforward cases. Classic presentations.' },
    resident: { label: 'Resident', color: '#8b5cf6', icon: '🩺', description: 'Complex cases with comorbidities.' },
    attending: { label: 'Attending', color: '#f59e0b', icon: '⚗️', description: 'Atypical presentations. Red herrings.' },
    house: { label: 'House M.D.', color: '#ef4444', icon: '🏥', description: 'Everybody lies. Nothing is what it seems.' },
};
