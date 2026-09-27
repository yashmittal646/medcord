import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/* ─── Supported languages ────────────────────────────────────── */
export type LangCode = 'en' | 'hi' | 'kn' | 'ta' | 'te';

export interface LanguageOption {
  code: LangCode;
  label: string;        // native-script name
  labelEn: string;      // English name
  flag: string;         // decorative emoji
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English',  labelEn: 'English',  flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी',    labelEn: 'Hindi',    flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ',    labelEn: 'Kannada',  flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்',     labelEn: 'Tamil',    flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు',    labelEn: 'Telugu',   flag: '🇮🇳' },
];

export const LANGUAGE_NAMES: Record<LangCode, string> = {
  en: 'English',
  hi: 'Hindi',
  kn: 'Kannada',
  ta: 'Tamil',
  te: 'Telugu',
};

const LOCALE_MAP: Record<LangCode, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

/* ─── Comprehensive Translation Dictionary ────────────────────── */
const translations: Record<LangCode, Record<string, string>> = {
  en: {
    // Nav & Sidebar
    'nav.patientPortal': 'Patient Portal',
    'nav.clinicalPortal': 'Doctor Portal',
    'nav.dashboard': 'Dashboard',
    'nav.medicalProfile': 'Medical Profile',
    'nav.medicalRecords': 'Medical Records & Reports',
    'nav.timeline': 'Treatment Timeline',
    'nav.healthPaths': 'Care Plans',
    'nav.askAdvice': 'Ask AI Advice',
    'nav.privacyFeed': 'Data Privacy & Access Log',
    'nav.patientLookup': 'Patient Search',
    'nav.myActivityLog': 'Activity Log',
    'nav.emergency': 'Emergency',
    'nav.emergencyHUD': 'Emergency HUD',
    'nav.signOut': 'Sign Out',

    // Dashboard
    'dash.bloodGroup': 'blood group',
    'dash.permissions': 'Permissions',
    'dash.uploadRecord': 'Upload Record',
    'dash.addAllergy': '+ Allergy',
    'dash.addMedication': '+ Medication',
    'dash.addCondition': '+ Condition',
    'dash.allergies': 'Allergies',
    'dash.medications': 'Medications',
    'dash.conditions': 'Conditions',
    'dash.recorded': 'recorded',
    'dash.active': 'active',
    'dash.listed': 'listed',
    'dash.noAllergies': 'No known allergies recorded. Click + to add.',
    'dash.noMedications': 'No active medications recorded.',
    'dash.noConditions': 'No conditions recorded.',
    'dash.activeTreatmentPlans': 'Active Treatment Plans',
    'dash.activeTreatmentSubtitle': 'Physician-directed treatment plans and active courses',
    'dash.viewAll': 'View All',
    'dash.noTreatmentEpisodes': 'No active treatment episodes at this time.',
    'dash.treatmentEpisodeHint': 'When a doctor creates a treatment path, it will appear here.',
    'dash.accessPendingTitle': 'Doctor Access Request Pending',
    'dash.reviewGrant': 'Review & Grant Permission',
    'dash.recentRecords': 'Recent Medical Records',
    'dash.recentRecordsSubtitle': 'Latest documents and clinical summaries in your vault',
    'dash.viewAllRecords': 'View All Records',
    'dash.loading': 'Loading patient chart...',

    // Medical Profile Page
    'profile.title': 'Medical Profile & Health Passport',
    'profile.subtitle': 'Manage your baseline health information, emergency contact, allergies, chronic conditions, and active medications.',
    'profile.basicInfo': 'Basic Clinical Information',
    'profile.bloodGroup': 'BLOOD GROUP',
    'profile.gender': 'GENDER',
    'profile.emergencyContact': 'Emergency Contact',
    'profile.name': 'NAME',
    'profile.phone': 'PHONE',
    'profile.relation': 'RELATION',
    'profile.save': 'Save Profile',
    'profile.allergiesTitle': 'Allergies',
    'profile.addBtn': '+ Add Allergy',
    'profile.noAllergies': 'No known allergies recorded.',
    'profile.conditionsTitle': 'Chronic Conditions',
    'profile.addConditionBtn': '+ Add Condition',
    'profile.noConditions': 'No chronic conditions recorded.',
    'profile.medicationsTitle': 'Current Medications',
    'profile.addMedicationBtn': '+ Add Medication',
    'profile.noMedications': 'No active medications recorded.',
    'profile.male': 'Male',
    'profile.female': 'Female',
    'profile.other': 'Other',

    // Records Page
    'records.title': 'Medical Records Vault',
    'records.subtitle': 'documents in your secure cloud medical repository',
    'records.uploadBtn': 'Upload New Record',
    'records.searchPlaceholder': 'Search records by title, doctor, facility, or tag...',
    'records.allTypes': 'All Record Types',
    'records.emptyTitle': 'No records found',
    'records.emptySubtitle': 'Upload your first medical record to get started.',
    'records.uploadFirst': 'Upload First Record',

    // Timeline Page
    'timeline.title': 'Treatment Timeline',
    'timeline.subtitle': 'Longitudinal chronological record of all medical events',
    'timeline.empty': 'No timeline events recorded yet.',

    // Health Paths
    'paths.title': 'Care Plans & Health Paths',
    'paths.subtitle': 'Structured clinical treatment plans assigned by your doctors',
    'paths.active': 'Active',
    'paths.completed': 'Completed',
    'paths.noPaths': 'No care plans created yet.',

    // Status & Severities
    'status.ACTIVE': 'ACTIVE',
    'status.MANAGED': 'MANAGED',
    'status.COMPLETED': 'COMPLETED',
    'status.PENDING': 'PENDING',
    'severity.LIFE_THREATENING': 'LIFE THREATENING',
    'severity.SEVERE': 'SEVERE',
    'severity.MODERATE': 'MODERATE',
    'severity.MILD': 'MILD',

    // Gender
    'gender.MALE': 'Male',
    'gender.FEMALE': 'Female',
    'gender.OTHER': 'Other',

    // Record types
    'recType.PRESCRIPTION': 'Prescription',
    'recType.LAB_REPORT': 'Lab Report',
    'recType.CONSULTATION': 'Consultation',
    'recType.CHECKUP': 'Checkup',
    'recType.OTHER': 'Other Document',

    // Common labels
    'common.emergencyPrefix': 'Emergency:',
    'common.medicinesLabel': 'Medicines:',
    'common.byLabel': 'By',
    'common.startedLabel': 'Started',
    'common.viewFile': 'View File',
    'common.download': 'Download',
    'common.ongoing': 'Ongoing',
    'common.diagnosed': 'Diagnosed:',

    // Frequencies
    'freq.Twice daily with meals': 'Twice daily with meals',
    'freq.Once daily in the morning': 'Once daily in the morning',
    'freq.Once daily before breakfast': 'Once daily before breakfast',

    // Common Clinical Entities
    'med.Metformin': 'Metformin',
    'med.Amlodipine': 'Amlodipine',
    'med.Pantoprazole': 'Pantoprazole',
    'allergy.Penicillin': 'Penicillin',
    'allergy.Peanuts': 'Peanuts',
    'allergy.Sulfonamides (Sulfa drugs)': 'Sulfonamides (Sulfa drugs)',
    'cond.Type 2 Diabetes Mellitus': 'Type 2 Diabetes Mellitus',
    'cond.Essential Hypertension (Stage 1)': 'Essential Hypertension (Stage 1)',
    'cond.Chronic Lower Back Pain (L4-L5 disc herniation)': 'Chronic Lower Back Pain (L4-L5 disc herniation)',

    // Ask Advice Page
    'page.askAdvice': 'Ask AI Health Advice',
    'page.askAdviceSubtitle': 'Get helpful health advice and guidance in simple words',
    'advice.disclaimer': 'Important Note:',
    'advice.disclaimerText': 'This AI provides general health guidance and is not a replacement for a doctor. Always consult a qualified doctor for diagnosis and treatment.',
    'advice.emptyTitle': 'How can I help you with your health today?',
    'advice.emptySubtitle': 'Tell me about your symptoms or ask any health question in simple words. I will ask a few quick questions to understand your condition better.',
    'advice.suggestion1': 'I have had a continuous headache for the last few days',
    'advice.suggestion2': 'What are common signs of vitamin D deficiency?',
    'advice.suggestion3': 'I have a sore throat and a mild fever',
    'advice.suggestion4': 'Simple ways to reduce stress and anxiety',
    'advice.placeholder': 'Tell me your symptoms or ask a health question…',
    'advice.speakInstead': 'Speak instead',
    'advice.stopListening': 'Stop listening',
    'advice.getAdvice': 'Get Advice',
    'advice.thinking': 'Thinking…',
    'advice.clearChat': 'Clear Chat',

    // Common
    'common.loading': 'Loading…',
    'common.authenticating': 'Checking login…',
    'common.changeLanguage': 'Change Language',
    'lang.title': 'Choose Your Preferred Language',
    'lang.subtitle': 'Select the language you are most comfortable reading and speaking in',
    'lang.continue': 'Continue to Portal',
  },

  te: {
    // Nav & Sidebar
    'nav.patientPortal': 'పేషెంట్ పోర్టల్',
    'nav.clinicalPortal': 'డాక్టర్ పోర్టల్',
    'nav.dashboard': 'డాష్‌బోర్డ్',
    'nav.medicalProfile': 'మెడికల్ ప్రొఫైల్',
    'nav.medicalRecords': 'మెడికల్ రికార్డులు & టెస్ట్ రిపోర్టులు',
    'nav.timeline': 'చికిత్స టైమ్‌లైన్',
    'nav.healthPaths': 'కేర్ ప్లాన్ (చికిత్స ప్రణాళిక)',
    'nav.askAdvice': 'AI ఆరోగ్య సలహా',
    'nav.privacyFeed': 'డేటా సెక్యూరిటీ & ప్రైవసీ లాగ్',
    'nav.patientLookup': 'పేషెంట్ సెర్చ్',
    'nav.myActivityLog': 'యాక్టివిటీ లాగ్',
    'nav.emergency': 'ఎమర్జెన్సీ',
    'nav.emergencyHUD': 'ఎమర్జెన్సీ డాష్‌బోర్డ్',
    'nav.signOut': 'లాగ్ అవుట్',

    // Dashboard
    'dash.bloodGroup': 'బ్లడ్ గ్రూప్',
    'dash.permissions': 'అనుమతులు (Permissions)',
    'dash.uploadRecord': 'రికార్డ్ అప్‌లోడ్',
    'dash.addAllergy': '+ అలర్జీ',
    'dash.addMedication': '+ మందులు',
    'dash.addCondition': '+ సమస్య',
    'dash.allergies': 'అలర్జీలు',
    'dash.medications': 'మందులు',
    'dash.conditions': 'ఆరోగ్య సమస్యలు',
    'dash.recorded': 'నమోదైనవి',
    'dash.active': 'యాక్టివ్',
    'dash.listed': 'జాబితాలో ఉన్నవి',
    'dash.noAllergies': 'ఎలాంటి అలర్జీలు నమోదు కాలేదు. జోడించడానికి + క్లిక్ చేయండి.',
    'dash.noMedications': 'ప్రస్తుతం ఎలాంటి మందులు నమోదు కాలేదు.',
    'dash.noConditions': 'ఎలాంటి సమస్యలు నమోదు కాలేదు.',
    'dash.activeTreatmentPlans': 'ప్రస్తుత చికిత్స ప్రణాళికలు (Care Plans)',
    'dash.activeTreatmentSubtitle': 'డాక్టర్ సూచించిన చికిత్స ప్రణాళికలు మరియు కోర్సులు',
    'dash.viewAll': 'అన్నీ చూడండి',
    'dash.noTreatmentEpisodes': 'ప్రస్తుతం ఎలాంటి చికిత్స ప్రణాళికలు లేవు.',
    'dash.treatmentEpisodeHint': 'డాక్టర్ కేర్ ప్లాన్ రూపొందించినప్పుడు, అది ఇక్కడ కనిపిస్తుంది.',
    'dash.accessPendingTitle': 'డాక్టర్ యాక్సెస్ రిక్వెస్ట్ పెండింగ్‌లో ఉంది',
    'dash.reviewGrant': 'పరిశీలించి అనుమతించండి',
    'dash.recentRecords': 'ఇటీవలి మెడికల్ రికార్డులు',
    'dash.recentRecordsSubtitle': 'మీ వాల్ట్‌లోని తాజా రిపోర్టులు మరియు పత్రాలు',
    'dash.viewAllRecords': 'అన్ని రికార్డులు చూడండి',
    'dash.loading': 'పేషెంట్ చార్ట్ లోడ్ అవుతోంది…',

    // Medical Profile Page
    'profile.title': 'మెడికల్ ప్రొఫైల్ & హెల్త్ పాస్‌పోర్ట్',
    'profile.subtitle': 'మీ ప్రాథమిక ఆరోగ్య సమాచారం, ఎమర్జెన్సీ కాంటాక్ట్, అలర్జీలు మరియు మందుల వివరాలు నిర్వహించండి.',
    'profile.basicInfo': 'ప్రాథమిక ఆరోగ్య సమాచారం',
    'profile.bloodGroup': 'బ్లడ్ గ్రూప్',
    'profile.gender': 'లింగం (జెండర్)',
    'profile.emergencyContact': 'ఎమర్జెన్సీ కాంటాక్ట్ వివరాలు',
    'profile.name': 'పేరు',
    'profile.phone': 'ఫోన్ నంబర్',
    'profile.relation': 'సంబంధం (రిలేషన్)',
    'profile.save': 'ప్రొఫైల్ సేవ్ చేయండి',
    'profile.allergiesTitle': 'అలర్జీలు',
    'profile.addBtn': '+ అలర్జీ జోడించండి',
    'profile.noAllergies': 'ఎలాంటి అలర్జీలు నమోదు కాలేదు.',
    'profile.conditionsTitle': 'దీర్ఘకాలిక ఆరోగ్య సమస్యలు (Conditions)',
    'profile.addConditionBtn': '+ సమస్యను జోడించండి',
    'profile.noConditions': 'ఎలాంటి సమస్యలు నమోదు కాలేదు.',
    'profile.medicationsTitle': 'ప్రస్తుతం వాడుతున్న మందులు',
    'profile.addMedicationBtn': '+ మందులను జోడించండి',
    'profile.noMedications': 'ప్రస్తుతం ఎలాంటి మందులు నమోదు కాలేదు.',
    'profile.male': 'పురుషుడు (Male)',
    'profile.female': 'స్త్రీ (Female)',
    'profile.other': 'ఇతర (Other)',

    // Records Page
    'records.title': 'మెడికల్ రికార్డ్స్ వాల్ట్',
    'records.subtitle': 'మీ సురక్షిత క్లౌడ్ రిపోజిటరీలోని పత్రాలు',
    'records.uploadBtn': 'కొత్త రికార్డ్ అప్‌లోడ్ చేయండి',
    'records.searchPlaceholder': 'పేరు, డాక్టర్ లేదా హాస్పిటల్ ద్వారా రికార్డులను వెతకండి…',
    'records.allTypes': 'అన్ని రకాల రికార్డులు',
    'records.emptyTitle': 'ఎలాంటి రికార్డులు కనుగొనబడలేదు',
    'records.emptySubtitle': 'ప్రారంభించడానికి మీ మొదటి మెడికల్ రికార్డ్‌ను అప్‌లోడ్ చేయండి.',
    'records.uploadFirst': 'మొదటి రికార్డ్ అప్‌లోడ్ చేయండి',

    // Timeline Page
    'timeline.title': 'చికిత్స టైమ్‌లైన్',
    'timeline.subtitle': 'అన్ని వైద్య సంఘటనల కాలక్రమ రికార్డు',
    'timeline.empty': 'ఇంకా ఎలాంటి టైమ్‌లైన్ రికార్డులు నమోదు కాలేదు.',

    // Health Paths
    'paths.title': 'కేర్ ప్లాన్ & చికిత్స ప్రణాళిక',
    'paths.subtitle': 'డాక్టర్ సూచించిన చికిత్స ప్రణాళికలు మరియు పురోగతి',
    'paths.active': 'యాక్టివ్',
    'paths.completed': 'పూర్తయింది',
    'paths.noPaths': 'ఇంకా ఎలాంటి కేర్ ప్లాన్‌లు లేవు.',

    // Status & Severities
    'status.ACTIVE': 'యాక్టివ్',
    'status.MANAGED': 'నియంత్రణలో ఉంది',
    'status.COMPLETED': 'పూర్తయింది',
    'status.PENDING': 'పెండింగ్‌లో ఉంది',
    'severity.LIFE_THREATENING': 'ప్రాణాంతకమైనది (తీవ్రం)',
    'severity.SEVERE': 'తీవ్రమైనది',
    'severity.MODERATE': 'మితమైనది',
    'severity.MILD': 'తేలికపాటిది',

    // Gender
    'gender.MALE': 'పురుషుడు (MALE)',
    'gender.FEMALE': 'స్త్రీ (FEMALE)',
    'gender.OTHER': 'ఇతర (OTHER)',

    // Record types
    'recType.PRESCRIPTION': 'ప్రిస్క్రిప్షన్ (మందుల చీటీ)',
    'recType.LAB_REPORT': 'ల్యాబ్ రిపోర్ట్',
    'recType.CONSULTATION': 'డాక్టర్ సంప్రదింపు నోట్స్',
    'recType.CHECKUP': 'రెగ్యులర్ చెకప్',
    'recType.OTHER': 'ఇతర పత్రాలు',

    // Common labels
    'common.emergencyPrefix': 'ఎమర్జెన్సీ కాంటాక్ట్:',
    'common.medicinesLabel': 'మందులు:',
    'common.byLabel': 'డాక్టర్:',
    'common.startedLabel': 'ప్రారంభం:',
    'common.viewFile': 'ఫైల్ చూడండి',
    'common.download': 'డౌన్‌లోడ్',
    'common.ongoing': 'కొనసాగుతోంది',
    'common.diagnosed': 'గుర్తించిన తేదీ:',

    // Frequencies
    'freq.Twice daily with meals': 'భోజనంతో పాటు రోజుకు 2 సార్లు',
    'freq.Once daily in the morning': 'ఉదయం పూట రోజుకు 1 సారి',
    'freq.Once daily before breakfast': 'టిఫిన్‌కు ముందు రోజుకు 1 సారి',

    // Common Clinical Entities
    'med.Metformin': 'మెట్‌ఫార్మిన్ (Metformin)',
    'med.Amlodipine': 'ఆమ్లోడిపైన్ (Amlodipine)',
    'med.Pantoprazole': 'పాంటోప్రజోల్ (Pantoprazole)',
    'allergy.Penicillin': 'పెన్సిలిన్ (Penicillin)',
    'allergy.Peanuts': 'వేరుశెనగలు / పల్లీలు (Peanuts)',
    'allergy.Sulfonamides (Sulfa drugs)': 'సల్ఫా మందులు (Sulfa drugs)',
    'cond.Type 2 Diabetes Mellitus': 'టైప్ 2 షుగర్ (Diabetes)',
    'cond.Essential Hypertension (Stage 1)': 'హైపర్ టెన్షన్ (High BP)',
    'cond.Chronic Lower Back Pain (L4-L5 disc herniation)': 'వెన్నునొప్పి / L4-L5 డిస్క్ సమస్య',

    // Ask Advice Page
    'page.askAdvice': 'AI ఆరోగ్య సలహా',
    'page.askAdviceSubtitle': 'సులభమైన మాటల్లో మీ ఆరోగ్య సలహా మరియు మార్గదర్శకత్వం పొందండి',
    'advice.disclaimer': 'ముఖ్య గమనిక:',
    'advice.disclaimerText': 'ఈ AI సాధారణ ఆరోగ్య మార్గదర్శకత్వం కోసం మాత్రమే, ఇది అసలైన డాక్టర్‌కు ప్రత్యామ్నాయం కాదు. సరైన చికిత్స కోసం ఎల్లప్పుడూ డాక్టర్‌ను సంప్రదించండి.',
    'advice.emptyTitle': 'మీ ఆరోగ్యం గురించి ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?',
    'advice.emptySubtitle': 'మీ లక్షణాలు లేదా ఆరోగ్య సమస్యలను సరళమైన మాటల్లో చెప్పండి. మీ పరిస్థితిని అర్థం చేసుకుని సరైన సలహా ఇస్తాను.',
    'advice.suggestion1': 'నాకు కొన్ని రోజులుగా నిరంతరం తలనొప్పి వస్తోంది',
    'advice.suggestion2': 'విటమిన్ డి లోపం వల్ల కనిపించే సాధారణ లక్షణాలు ఏమిటి?',
    'advice.suggestion3': 'గొంతు నొప్పి మరియు కొద్దిగా జ్వరం ఉంది, ఏమి చేయాలి?',
    'advice.suggestion4': 'ఒత్తిడి మరియు ఆందోళన తగ్గించుకోవడానికి సులభమైన మార్గాలు',
    'advice.placeholder': 'మీ సమస్య లేదా ఆరోగ్య ప్రశ్నను ఇక్కడ రాయండి…',
    'advice.speakInstead': 'మాట్లాడి చెప్పండి',
    'advice.stopListening': 'ఆపండి',
    'advice.getAdvice': 'సలహా పొందండి',
    'advice.thinking': 'సమాధానం సిద్ధమవుతోంది…',
    'advice.clearChat': 'చాట్ క్లియర్ చేయండి',

    // Common
    'common.loading': 'లోడ్ అవుతోంది…',
    'common.authenticating': 'లాగిన్ పరిశీలిస్తోంది…',
    'common.changeLanguage': 'భాషను మార్చండి',
    'lang.title': 'మీకు అనుకూలమైన భాషను ఎంచుకోండి',
    'lang.subtitle': 'చదవడానికి మరియు మాట్లాడటానికి సులభంగా ఉండే మీ భాషను ఎంచుకోండి',
    'lang.continue': 'ముందుకు సాగండి',
  },

  hi: {
    // Nav & Sidebar
    'nav.patientPortal': 'मरीज़ पोर्टल',
    'nav.clinicalPortal': 'डॉक्टर पोर्टल',
    'nav.dashboard': 'डैशबोर्ड (होम)',
    'nav.medicalProfile': 'मेरी मेडिकल प्रोफ़ाइल',
    'nav.medicalRecords': 'जाँच और मेडिकल रिपोर्ट्स',
    'nav.timeline': 'इलाज की टाइमलाइन',
    'nav.healthPaths': 'केयर प्लान (इलाज योजना)',
    'nav.askAdvice': 'डॉक्टर AI से सलाह लें',
    'nav.privacyFeed': 'डेटा सुरक्षा और प्राइवेसी',
    'nav.patientLookup': 'मरीज़ खोजें',
    'nav.myActivityLog': 'मेरी गतिविधि लॉग',
    'nav.emergency': 'इमरजेंसी (आपातकाल)',
    'nav.emergencyHUD': 'इमरजेंसी स्क्रीन',
    'nav.signOut': 'लॉग आउट',

    // Dashboard
    'dash.bloodGroup': 'ब्लड ग्रुप',
    'dash.permissions': 'अनुमतियाँ (Permissions)',
    'dash.uploadRecord': 'रिपोर्ट अपलोड',
    'dash.addAllergy': '+ एलर्जी',
    'dash.addMedication': '+ दवाई',
    'dash.addCondition': '+ बीमारी',
    'dash.allergies': 'एलर्जी',
    'dash.medications': 'दवाइयाँ',
    'dash.conditions': 'पुरानी बीमारियाँ',
    'dash.recorded': 'दर्ज हैं',
    'dash.active': 'चालू हैं',
    'dash.listed': 'सूचीबद्ध हैं',
    'dash.noAllergies': 'कोई एलर्जी दर्ज नहीं है। जोड़ने के लिए + दबाएं।',
    'dash.noMedications': 'वर्तमान में कोई दवाई दर्ज नहीं है।',
    'dash.noConditions': 'कोई बीमारी दर्ज नहीं है।',
    'dash.activeTreatmentPlans': 'चालू इलाज योजनाएं (Care Plans)',
    'dash.activeTreatmentSubtitle': 'डॉक्टर द्वारा तय की गई इलाज योजनाएं और प्रगति',
    'dash.viewAll': 'सभी देखें',
    'dash.noTreatmentEpisodes': 'वर्तमान में कोई सक्रिय इलाज योजना नहीं है।',
    'dash.treatmentEpisodeHint': 'जब डॉक्टर कोई केयर प्लान बनाएंगे, वह यहाँ दिखेगा।',
    'dash.accessPendingTitle': 'डॉक्टर का अनुमति अनुरोध लंबित है',
    'dash.reviewGrant': 'समीक्षा करें और अनुमति दें',
    'dash.recentRecords': 'हाल की मेडिकल रिपोर्ट्स',
    'dash.recentRecordsSubtitle': 'आपके वॉल्ट में हाल ही में जोड़ी गई रिपोर्ट्स और दस्तावेज़',
    'dash.viewAllRecords': 'सभी रिपोर्ट्स देखें',
    'dash.loading': 'मरीज़ का चार्ट लोड हो रहा है…',

    // Medical Profile Page
    'profile.title': 'मेडिकल प्रोफ़ाइल और हेल्थ पासपोर्ट',
    'profile.subtitle': 'अपनी बुनियादी स्वास्थ्य जानकारी, इमरजेंसी संपर्क, एलर्जी, पुरानी बीमारियाँ और दवाइयों का प्रबंधन करें।',
    'profile.basicInfo': 'बुनियादी स्वास्थ्य जानकारी',
    'profile.bloodGroup': 'ब्लड ग्रुप',
    'profile.gender': 'लिंग (जेंडर)',
    'profile.emergencyContact': 'इमरजेंसी संपर्क जानकारी',
    'profile.name': 'नाम',
    'profile.phone': 'फ़ोन नंबर',
    'profile.relation': 'संबंध (रिश्ता)',
    'profile.save': 'प्रोफ़ाइल सुरक्षित करें',
    'profile.allergiesTitle': 'एलर्जी',
    'profile.addBtn': '+ एलर्जी जोड़ें',
    'profile.noAllergies': 'कोई एलर्जी दर्ज नहीं है।',
    'profile.conditionsTitle': 'पुरानी बीमारियाँ (Chronic Conditions)',
    'profile.addConditionBtn': '+ बीमारी जोड़ें',
    'profile.noConditions': 'कोई पुरानी बीमारी दर्ज नहीं है।',
    'profile.medicationsTitle': 'वर्तमान में चल रही दवाइयाँ',
    'profile.addMedicationBtn': '+ दवाई जोड़ें',
    'profile.noMedications': 'कोई दवाई दर्ज नहीं है।',
    'profile.male': 'पुरुष (Male)',
    'profile.female': 'महिला (Female)',
    'profile.other': 'अन्य (Other)',

    // Records Page
    'records.title': 'मेडिकल रिकॉर्ड्स वॉल्ट',
    'records.subtitle': 'आपके सुरक्षित क्लाउड रिपॉजिटरी में मौजूद दस्तावेज़',
    'records.uploadBtn': 'नया रिकॉर्ड अपलोड करें',
    'records.searchPlaceholder': 'शीर्षक, डॉक्टर, अस्पताल या टैग से खोजें…',
    'records.allTypes': 'सभी प्रकार के रिकॉर्ड',
    'records.emptyTitle': 'कोई रिकॉर्ड नहीं मिला',
    'records.emptySubtitle': 'शुरुआत करने के लिए अपनी पहली मेडिकल रिपोर्ट अपलोड करें।',
    'records.uploadFirst': 'पहली रिपोर्ट अपलोड करें',

    // Timeline Page
    'timeline.title': 'इलाज की टाइमलाइन',
    'timeline.subtitle': 'सभी स्वास्थ्य घटनाओं का समय अनुसार रिकॉर्ड',
    'timeline.empty': 'अभी तक कोई टाइमलाइन रिकॉर्ड नहीं है।',

    // Health Paths
    'paths.title': 'केयर प्लान और इलाज योजनाएं',
    'paths.subtitle': 'डॉक्टर द्वारा निर्धारित उपचार योजना और आपकी प्रगति',
    'paths.active': 'चालू (Active)',
    'paths.completed': 'पूर्ण (Completed)',
    'paths.noPaths': 'अभी तक कोई केयर प्लान नहीं बना है।',

    // Status & Severities
    'status.ACTIVE': 'चालू',
    'status.MANAGED': 'नियंत्रित',
    'status.COMPLETED': 'पूर्ण',
    'status.PENDING': 'लंबित',
    'severity.LIFE_THREATENING': 'अति गंभीर (जानलेवा)',
    'severity.SEVERE': 'गंभीर',
    'severity.MODERATE': 'मध्यम',
    'severity.MILD': 'हल्का',

    // Gender
    'gender.MALE': 'पुरुष (MALE)',
    'gender.FEMALE': 'महिला (FEMALE)',
    'gender.OTHER': 'अन्य (OTHER)',

    // Record types
    'recType.PRESCRIPTION': 'प्रिस्क्रिप्शन (दवाई पर्ची)',
    'recType.LAB_REPORT': 'लैब रिपोर्ट / टेस्ट',
    'recType.CONSULTATION': 'डॉक्टर परामर्श',
    'recType.CHECKUP': 'नियमित चेकअप',
    'recType.OTHER': 'अन्य दस्तावेज़',

    // Common labels
    'common.emergencyPrefix': 'इमरजेंसी संपर्क:',
    'common.medicinesLabel': 'दवाइयाँ:',
    'common.byLabel': 'डॉक्टर:',
    'common.startedLabel': 'शुरू हुआ:',
    'common.viewFile': 'फ़ाइल देखें',
    'common.download': 'डाउनलोड',
    'common.ongoing': 'जारी है',
    'common.diagnosed': 'निदान की तारीख:',

    // Frequencies
    'freq.Twice daily with meals': 'भोजन के साथ दिन में 2 बार',
    'freq.Once daily in the morning': 'सुबह दिन में 1 बार',
    'freq.Once daily before breakfast': 'नाश्ते से पहले दिन में 1 बार',

    // Common Clinical Entities
    'med.Metformin': 'मेटफॉर्मिन (Metformin)',
    'med.Amlodipine': 'एम्लोडिपिन (Amlodipine)',
    'med.Pantoprazole': 'पैंटोप्राजोल (Pantoprazole)',
    'allergy.Penicillin': 'पेनिसिलिन (Penicillin)',
    'allergy.Peanuts': 'मूंगफली (Peanuts)',
    'allergy.Sulfonamides (Sulfa drugs)': 'सल्फा दवाइयाँ (Sulfa drugs)',
    'cond.Type 2 Diabetes Mellitus': 'टाइप 2 डायबिटीज (शुगर)',
    'cond.Essential Hypertension (Stage 1)': 'हाई बीपी (हाइपरटेंशन)',
    'cond.Chronic Lower Back Pain (L4-L5 disc herniation)': 'कमर दर्द / L4-L5 डिस्क समस्या',

    // Ask Advice Page
    'page.askAdvice': 'डॉक्टर AI से सलाह लें',
    'page.askAdviceSubtitle': 'अपनी सेहत से जुड़े सवाल पूछें और आसान भाषा में सलाह पाएं',
    'advice.disclaimer': 'ज़रूरी ध्यान दें:',
    'advice.disclaimerText': 'यह AI सिर्फ़ सामान्य स्वास्थ्य जानकारी और मार्गदर्शन के लिए है, यह असली डॉक्टर की जगह नहीं ले सकता। किसी भी बीमारी के सही इलाज के लिए हमेशा डॉक्टर से संपर्क करें।',
    'advice.emptyTitle': 'आज आप अपनी सेहत के बारे में क्या पूछना चाहते हैं?',
    'advice.emptySubtitle': 'अपनी परेशानी या लक्षण आसान शब्दों में बताएं। आपकी स्थिति को ठीक से समझने के लिए मैं आपसे 1-2 ज़रूरी सवाल पूछूँगा और फिर सही सलाह दूंगा।',
    'advice.suggestion1': 'मुझे कुछ दिनों से लगातार सिरदर्द हो रहा है',
    'advice.suggestion2': 'विटामिन डी की कमी होने पर क्या लक्षण दिखते हैं?',
    'advice.suggestion3': 'गले में खराश और हल्का बुखार है, क्या करूँ?',
    'advice.suggestion4': 'तनाव और घबराहट कम करने के आसान उपाय',
    'advice.placeholder': 'अपनी परेशानी या सेहत से जुड़ा सवाल यहाँ लिखें…',
    'advice.speakInstead': 'माइक से बोलें',
    'advice.stopListening': 'बोलना बंद करें',
    'advice.getAdvice': 'सलाह पाएं',
    'advice.thinking': 'जवाब तैयार हो रहा है…',
    'advice.clearChat': 'चैट साफ़ करें',

    // Common
    'common.loading': 'लोड हो रहा है…',
    'common.authenticating': 'लॉगिन जाँचा जा रहा है…',
    'common.changeLanguage': 'भाषा बदलें',
    'lang.title': 'अपनी पसंदीदा भाषा चुनें',
    'lang.subtitle': 'पोर्टल को समझने और AI से बात करने के लिए अपनी सहज भाषा चुनें',
    'lang.continue': 'आगे बढ़ें',
  },

  kn: {
    // Nav & Sidebar
    'nav.patientPortal': 'ಪೇಷೆಂಟ್ ಪೋರ್ಟಲ್',
    'nav.clinicalPortal': 'ಡಾಕ್ಟರ್ ಪೋರ್ಟಲ್',
    'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'nav.medicalProfile': 'ಮೆಡಿಕಲ್ ಪ್ರೊಫೈಲ್',
    'nav.medicalRecords': 'ಮೆಡಿಕಲ್ ರೆಕಾರ್ಡ್ಸ್ & ರಿಪೋರ್ಟ್ಸ್',
    'nav.timeline': 'ಚಿಕಿತ್ಸಾ ಟೈಮ್‌ಲೈನ್',
    'nav.healthPaths': 'ಕೇರ್ ಪ್ಲಾನ್ (ಆರೋಗ್ಯ ಯೋಜನೆ)',
    'nav.askAdvice': 'AI ಆರೋಗ್ಯ ಸಲಹೆ',
    'nav.privacyFeed': 'ಡೇಟಾ ಸೆಕ್ಯುರಿಟಿ & ಪ್ರೈವಸಿ',
    'nav.patientLookup': 'ಪೇಷೆಂಟ್ ಹುಡುಕಾಟ',
    'nav.myActivityLog': 'ಆಕ್ಟಿವಿಟಿ ಲಾಗ್',
    'nav.emergency': 'ಎಮರ್ಜೆನ್ಸಿ',
    'nav.emergencyHUD': 'ಎಮರ್ಜೆನ್ಸಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'nav.signOut': 'ಲಾಗ್ ಔಟ್',

    // Dashboard
    'dash.bloodGroup': 'ರಕ್ತದ ಗುಂಪು',
    'dash.permissions': 'ಅನುಮತಿಗಳು (Permissions)',
    'dash.uploadRecord': 'ರೆಕಾರ್ಡ್ ಅಪ್‌ಲೋಡ್',
    'dash.addAllergy': '+ ಅಲರ್ಜಿ',
    'dash.addMedication': '+ ಔಷಧಿ',
    'dash.addCondition': '+ ಸಮಸ್ಯೆ',
    'dash.allergies': 'ಅಲರ್ಜಿಗಳು',
    'dash.medications': 'ಔಷಧಿಗಳು',
    'dash.conditions': 'ಆರೋಗ್ಯ ಸಮಸ್ಯೆಗಳು',
    'dash.recorded': 'ದಾಖಲಾಗಿವೆ',
    'dash.active': 'ಸಕ್ರಿಯವಾಗಿವೆ',
    'dash.listed': 'ಪಟ್ಟಿ ಮಾಡಲಾಗಿದೆ',
    'dash.noAllergies': 'ಯಾವುದೇ ಅಲರ್ಜಿ ದಾಖಲಾಗಿಲ್ಲ. ಸೇರಿಸಲು + ಒತ್ತಿ.',
    'dash.noMedications': 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಔಷಧಿ ದಾಖಲಾಗಿಲ್ಲ.',
    'dash.noConditions': 'ಯಾವುದೇ ಸಮಸ್ಯೆ ದಾಖಲಾಗಿಲ್ಲ.',
    'dash.activeTreatmentPlans': 'ಸಕ್ರಿಯ ಕೇರ್ ಪ್ಲಾನ್‌ಗಳು',
    'dash.activeTreatmentSubtitle': 'ವೈದ್ಯರು ಸೂಚಿಸಿದ ಚಿಕಿತ್ಸಾ ಯೋಜನೆಗಳು ಮತ್ತು ಪ್ರಗತಿ',
    'dash.viewAll': 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
    'dash.noTreatmentEpisodes': 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಕ್ರಿಯ ಚಿಕಿತ್ಸಾ ಯೋಜನೆಗಳಿಲ್ಲ.',
    'dash.treatmentEpisodeHint': 'ವೈದ್ಯರು ಕೇರ್ ಪ್ಲಾನ್ ರಚಿಸಿದಾಗ, ಅದು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.',
    'dash.accessPendingTitle': 'ವೈದ್ಯರ ಅನುಮತಿ ವಿನಂತಿ ಬಾಕಿ ಇದೆ',
    'dash.reviewGrant': 'ಪರಿಶೀಲಿಸಿ ಅನುಮತಿ ನೀಡಿ',
    'dash.recentRecords': 'ಇತ್ತೀಚಿನ ಮೆಡಿಕಲ್ ರೆಕಾರ್ಡ್ಸ್',
    'dash.recentRecordsSubtitle': 'ನಿಮ್ಮ ವಾಲ್ಟ್‌ನಲ್ಲಿರುವ ಇತ್ತೀಚಿನ ದಾಖಲೆಗಳು ಮತ್ತು ವರದಿಗಳು',
    'dash.viewAllRecords': 'ಎಲ್ಲಾ ರೆಕಾರ್ಡ್ಸ್ ನೋಡಿ',
    'dash.loading': 'ಪೇಷೆಂಟ್ ಚಾರ್ಟ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ…',

    // Medical Profile Page
    'profile.title': 'ಮೆಡಿಕಲ್ ಪ್ರೊಫೈಲ್ & ಹೆಲ್ತ್ ಪಾಸ್‌ಪೋರ್ಟ್',
    'profile.subtitle': 'ನಿಮ್ಮ ಮೂಲ ಆರೋಗ್ಯ ಮಾಹಿತಿ, ತುರ್ತು ಸಂಪರ್ಕ, ಅಲರ್ಜಿಗಳು ಮತ್ತು ಔಷಧಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ.',
    'profile.basicInfo': 'ಮೂಲ ಆರೋಗ್ಯ ಮಾಹಿತಿ',
    'profile.bloodGroup': 'ರಕ್ತದ ಗುಂಪು',
    'profile.gender': 'ಲಿಂಗ (Gender)',
    'profile.emergencyContact': 'ತುರ್ತು ಸಂಪರ್ಕ ಮಾಹಿತಿ',
    'profile.name': 'ಹೆಸರು',
    'profile.phone': 'ಫೋನ್ ನಂಬರ್',
    'profile.relation': 'ಸಂಬಂಧ (Relation)',
    'profile.save': 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ',
    'profile.allergiesTitle': 'ಅಲರ್ಜಿಗಳು',
    'profile.addBtn': '+ ಅಲರ್ಜಿ ಸೇರಿಸಿ',
    'profile.noAllergies': 'ಯಾವುದೇ ಅಲರ್ಜಿ ದಾಖಲಾಗಿಲ್ಲ.',
    'profile.conditionsTitle': 'ದೀರ್ಘಕಾಲದ ಸಮಸ್ಯೆಗಳು (Conditions)',
    'profile.addConditionBtn': '+ ಸಮಸ್ಯೆ ಸೇರಿಸಿ',
    'profile.noConditions': 'ಯಾವುದೇ ಸಮಸ್ಯೆ ದಾಖಲಾಗಿಲ್ಲ.',
    'profile.medicationsTitle': 'ಪ್ರಸ್ತುತ ಔಷಧಿಗಳು',
    'profile.addMedicationBtn': '+ ಔಷಧಿ ಸೇರಿಸಿ',
    'profile.noMedications': 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಔಷಧಿ ದಾಖಲಾಗಿಲ್ಲ.',
    'profile.male': 'ಪುರುಷ (Male)',
    'profile.female': 'ಮಹಿಳೆ (Female)',
    'profile.other': 'ಇತರೆ (Other)',

    // Records Page
    'records.title': 'ಮೆಡಿಕಲ್ ರೆಕಾರ್ಡ್ಸ್ ವಾಲ್ಟ್',
    'records.subtitle': 'ನಿಮ್ಮ ಸುರಕ್ಷಿತ ಕ್ಲೌಡ್ ರೆಪೊಸಿಟರಿಯಲ್ಲಿರುವ ದಾಖಲೆಗಳು',
    'records.uploadBtn': 'ಹೊಸ ರೆಕಾರ್ಡ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    'records.searchPlaceholder': 'ಶೀರ್ಷಿಕೆ, ವೈದ್ಯರು ಅಥವಾ ಆಸ್ಪತ್ರೆಯ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ…',
    'records.allTypes': 'ಎಲ್ಲಾ ರೀತಿಯ ದಾಖಲೆಗಳು',
    'records.emptyTitle': 'ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
    'records.emptySubtitle': 'ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಮೊದಲ ವೈದ್ಯಕೀಯ ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
    'records.uploadFirst': 'ಮೊದಲ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',

    // Timeline Page
    'timeline.title': 'ಚಿಕಿತ್ಸಾ ಟೈಮ್‌ಲೈನ್',
    'timeline.subtitle': 'ಎಲ್ಲಾ ವೈದ್ಯಕೀಯ ಘಟನೆಗಳ ಕಾಲಾನುಕ್ರಮ ದಾಖಲೆ',
    'timeline.empty': 'ಇನ್ನೂ ಯಾವುದೇ ಟೈಮ್‌ಲೈನ್ ಘಟನೆಗಳು ದಾಖಲಾಗಿಲ್ಲ.',

    // Health Paths
    'paths.title': 'ಆರೋಗ್ಯ ಕೇರ್ ಪ್ಲಾನ್',
    'paths.subtitle': 'ವೈದ್ಯರು ಸೂಚಿಸಿದ ಚಿಕಿತ್ಸಾ ಯೋಜನೆ ಮತ್ತು ಪ್ರಗತಿ',
    'paths.active': 'ಸಕ್ರಿಯ (Active)',
    'paths.completed': 'ಪೂರ್ಣಗೊಂಡಿದೆ (Completed)',
    'paths.noPaths': 'ಇನ್ನೂ ಯಾವುದೇ ಕೇರ್ ಪ್ಲಾನ್ ಇಲ್ಲ.',

    // Status & Severities
    'status.ACTIVE': 'ಸಕ್ರಿಯ',
    'status.MANAGED': 'ನಿಯಂತ್ರಣದಲ್ಲಿದೆ',
    'status.COMPLETED': 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    'status.PENDING': 'ಬಾಕಿ ಇದೆ',
    'severity.LIFE_THREATENING': 'ಅತ್ಯಂತ ಗಂಭೀರ (ಪ್ರಾಣಾಪಾಯ)',
    'severity.SEVERE': 'ತೀವ್ರ',
    'severity.MODERATE': 'ಮಧ್ಯಮ',
    'severity.MILD': 'ಸೌಮ್ಯ',

    // Gender
    'gender.MALE': 'ಪುರುಷ (MALE)',
    'gender.FEMALE': 'ಮಹಿಳೆ (FEMALE)',
    'gender.OTHER': 'ಇತರೆ (OTHER)',

    // Record types
    'recType.PRESCRIPTION': 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್',
    'recType.LAB_REPORT': 'ಲ್ಯಾಬ್ ವರದಿ',
    'recType.CONSULTATION': 'ವೈದ್ಯರ ಸಮಾಲೋಚನೆ',
    'recType.CHECKUP': 'ನಿಯಮಿತ ತಪಾಸಣೆ',
    'recType.OTHER': 'ಇತರ ದಾಖಲೆಗಳು',

    // Common labels
    'common.emergencyPrefix': 'ತುರ್ತು ಸಂಪರ್ಕ:',
    'common.medicinesLabel': 'ಔಷಧಿಗಳು:',
    'common.byLabel': 'ವೈದ್ಯರು:',
    'common.startedLabel': 'ಪ್ರಾರಂಭವಾಗಿದೆ:',
    'common.viewFile': 'ಫೈಲ್ ನೋಡಿ',
    'common.download': 'ಡೌನ್‌ಲೋಡ್',
    'common.ongoing': 'ಮುಂದುವರಿಯುತ್ತಿದೆ',
    'common.diagnosed': 'ರೋಗನಿರ್ಣಯ ದಿನಾಂಕ:',

    // Frequencies
    'freq.Twice daily with meals': 'ಊಟದೊಂದಿಗೆ ದಿನಕ್ಕೆ 2 ಬಾರಿ',
    'freq.Once daily in the morning': 'ಬೆಳಿಗ್ಗೆ ದಿನಕ್ಕೆ 1 ಬಾರಿ',
    'freq.Once daily before breakfast': 'ಉಪಾಹಾರಕ್ಕೆ ಮೊದಲು ದಿನಕ್ಕೆ 1 ಬಾರಿ',

    // Common Clinical Entities
    'med.Metformin': 'ಮೆಟ್‌ಫಾರ್ಮಿನ್ (Metformin)',
    'med.Amlodipine': 'ಆಮ್ಲೋಡಿಪೈನ್ (Amlodipine)',
    'med.Pantoprazole': 'ಪ್ಯಾಂಟೊಪ್ರಜೋಲ್ (Pantoprazole)',
    'allergy.Penicillin': 'ಪೆನ್ಸಿಲಿನ್ (Penicillin)',
    'allergy.Peanuts': 'ಕಡಲೆಕಾಯಿ (Peanuts)',
    'allergy.Sulfonamides (Sulfa drugs)': 'ಸಲ್ಫಾ ಔಷಧಗಳು (Sulfa drugs)',
    'cond.Type 2 Diabetes Mellitus': 'ಟೈಪ್ 2 ಮಧುಮೇಹ (Diabetes)',
    'cond.Essential Hypertension (Stage 1)': 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡ (High BP)',
    'cond.Chronic Lower Back Pain (L4-L5 disc herniation)': 'ಬೆನ್ನು ನೋವು / L4-L5 ಡಿಸ್ಕ್ ಸಮಸ್ಯೆ',

    // Ask Advice Page
    'page.askAdvice': 'AI ಆರೋಗ್ಯ ಸಲಹೆ',
    'page.askAdviceSubtitle': 'ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಸುಲಭ ಭಾಷೆಯಲ್ಲಿ ಸರಿಯಾದ ಸಲಹೆ ಪಡೆಯಿರಿ',
    'advice.disclaimer': 'ಮುಖ್ಯ ಸೂಚನೆ:',
    'advice.disclaimerText': 'ಈ AI ಮಾಹಿತಿ ಮತ್ತು ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಮಾತ್ರ, ಇದು ನೈಜ ವೈದ್ಯರ ಪರ್ಯಾಯವಲ್ಲ. ಯಾವುದೇ ಗಂಭೀರ ಸಮಸ್ಯೆಗೆ ನೇರವಾಗಿ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    'advice.emptyTitle': 'ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಇಂದು ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    'advice.emptySubtitle': 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಸರಳ ಮಾತುಗಳಲ್ಲಿ ತಿಳಿಸಿ. ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಯನ್ನು ಸರಿಯಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಾನು 1-2 ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ ನಂತರ ಸೂಕ್ತ ಸಲಹೆ ನೀಡುತ್ತೇನೆ.',
    'advice.suggestion1': 'ನನಗೆ ಕಳೆದ ಕೆಲವು ದಿನಗಳಿಂದ ನಿರಂತರ ತಲೆನೋವು ಇದೆ',
    'advice.suggestion2': 'ವಿಟಮಿನ್ ಡಿ ಕೊರತೆಯ ಮುಖ್ಯ ಲಕ್ಷಣಗಳೇನು?',
    'advice.suggestion3': 'ಗಂಟಲು ನೋವು ಮತ್ತು ಸ್ವಲ್ಪ ಜ್ವರ ಇದೆ, ಏನು ಮಾಡಬೇಕು?',
    'advice.suggestion4': 'ಮಾನಸಿಕ ಒತ್ತಡ ಕಡಿಮೆ ಮಾಡುವ ಸರಳ ಉಪಾಯಗಳು',
    'advice.placeholder': 'ನಿಮ್ಮ ತೊಂದರೆ ಅಥವಾ ಆರೋಗ್ಯ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ…',
    'advice.speakInstead': 'ಮಾತನಾಡಿ ತಿಳಿಸಿ',
    'advice.stopListening': 'ನಿಲ್ಲಿಸಿ',
    'advice.getAdvice': 'ಸಲಹೆ ಪಡೆಯಿರಿ',
    'advice.thinking': 'ಉತ್ತರ ಸಿದ್ಧವಾಗುತ್ತಿದೆ…',
    'advice.clearChat': 'ಚಾಟ್ ಕ್ಲಿಯರ್ ಮಾಡಿ',

    // Common
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
    'common.authenticating': 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…',
    'common.changeLanguage': 'ಭಾಷೆ ಬದಲಿಸಿ',
    'lang.title': 'ನಿಮ್ಮ ಇಷ್ಟದ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    'lang.subtitle': 'ಸುಲಭವಾಗಿ ಓದಲು ಮತ್ತು ಮಾತನಾಡಲು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    'lang.continue': 'ಮುಂದುವರಿಯಿರಿ',
  },

  ta: {
    // Nav & Sidebar
    'nav.patientPortal': 'நோயாளி (Patient) போர்ட்டல்',
    'nav.clinicalPortal': 'டாக்டர் போர்ட்டல்',
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.medicalProfile': 'மருத்துவ விவரங்கள் (Medical Profile)',
    'nav.medicalRecords': 'மெடிக்கல் ரெக்கார்ட்ஸ் & ரிப்போர்ட்ஸ்',
    'nav.timeline': 'சிகிச்சை வரலாறு (Timeline)',
    'nav.healthPaths': 'சிகிச்சை திட்டம் (Care Plan)',
    'nav.askAdvice': 'AI மருத்துவ ஆலோசனை',
    'nav.privacyFeed': 'டேட்டா பாதுகாப்பு & பிரைவசி',
    'nav.patientLookup': 'நோயாளி தேடல்',
    'nav.myActivityLog': 'ஆக்டிவிட்டி லாக்',
    'nav.emergency': 'எமர்ஜென்சி',
    'nav.emergencyHUD': 'எமர்ஜென்சி டேஷ்போர்டு',
    'nav.signOut': 'லாக் அவுட்',

    // Dashboard
    'dash.bloodGroup': 'இரத்த வகை',
    'dash.permissions': 'அனுமதிகள் (Permissions)',
    'dash.uploadRecord': 'ஆவணம் பதிவேற்றம்',
    'dash.addAllergy': '+ அலர்ஜி',
    'dash.addMedication': '+ மருந்து',
    'dash.addCondition': '+ பிரச்சனை',
    'dash.allergies': 'அலர்ஜிகள்',
    'dash.medications': 'மருந்துகள்',
    'dash.conditions': 'ஆரோக்கிய பிரச்சனைகள்',
    'dash.recorded': 'பதிவு செய்யப்பட்டது',
    'dash.active': 'செயலில் உள்ளவை',
    'dash.listed': 'பட்டியலிடப்பட்டுள்ளது',
    'dash.noAllergies': 'அலர்ஜி விவரங்கள் எதுவும் இல்லை. சேர்க்க + கிளிக் செய்யவும்.',
    'dash.noMedications': 'செயலில் உள்ள மருந்துகள் எதுவும் பதிவு செய்யப்படவில்லை.',
    'dash.noConditions': 'பிரச்சனைகள் எதுவும் பதிவு செய்யப்படவில்லை.',
    'dash.activeTreatmentPlans': 'செயலில் உள்ள சிகிச்சை திட்டங்கள் (Care Plans)',
    'dash.activeTreatmentSubtitle': 'மருத்துவரால் பரிந்துரைக்கப்பட்ட சிகிச்சை திட்டங்கள்',
    'dash.viewAll': 'அனைத்தையும் பார்க்க',
    'dash.noTreatmentEpisodes': 'தற்போது செயலில் உள்ள சிகிச்சை திட்டங்கள் எதுவும் இல்லை.',
    'dash.treatmentEpisodeHint': 'மருத்துவர் சிகிச்சை திட்டத்தை உருவாக்கும் போது, அது இங்கே தோன்றும்.',
    'dash.accessPendingTitle': 'மருத்துவரின் அனுமதி கோரிக்கை நிலுவையில் உள்ளது',
    'dash.reviewGrant': 'சரிபார்த்து அனுமதி வழங்கவும்',
    'dash.recentRecords': 'சமீபத்திய மருத்துவ பதிவுகள்',
    'dash.recentRecordsSubtitle': 'உங்கள் வால்ட்டில் உள்ள சமீபத்திய ஆவணங்கள் மற்றும் அறிக்கைகள்',
    'dash.viewAllRecords': 'அனைத்து பதிவுகளையும் காண்க',
    'dash.loading': 'நோயாளி சார்ட் ஏற்றப்படுகிறது…',

    // Medical Profile Page
    'profile.title': 'மருத்துவ விவரங்கள் & ஹெல்த் பாஸ்போர்ட்',
    'profile.subtitle': 'உங்கள் அடிப்படை மருத்துவ தகவல், அவசர தொடர்பு, அலர்ஜிகள் மற்றும் மருந்துகளை நிர்வகிக்கவும்.',
    'profile.basicInfo': 'அடிப்படை மருத்துவ தகவல்கள்',
    'profile.bloodGroup': 'இரத்த வகை',
    'profile.gender': 'பாலினம் (Gender)',
    'profile.emergencyContact': 'அவசர தொடர்பு விவரங்கள்',
    'profile.name': 'பெயர்',
    'profile.phone': 'தொலைபேசி எண்',
    'profile.relation': 'உறவுமுறை (Relation)',
    'profile.save': 'விவரங்களைச் சேமிக்கவும்',
    'profile.allergiesTitle': 'அலர்ஜிகள்',
    'profile.addBtn': '+ அலர்ஜி சேர்க்கவும்',
    'profile.noAllergies': 'அலர்ஜி விவரங்கள் எதுவும் பதிவு செய்யப்படவில்லை.',
    'profile.conditionsTitle': 'நீண்டகால ஆரோக்கிய பிரச்சனைகள்',
    'profile.addConditionBtn': '+ பிரச்சனை சேர்க்கவும்',
    'profile.noConditions': 'பிரச்சனைகள் எதுவும் பதிவு செய்யப்படவில்லை.',
    'profile.medicationsTitle': 'தற்போது உட்கொள்ளும் மருந்துகள்',
    'profile.addMedicationBtn': '+ மருந்து சேர்க்கவும்',
    'profile.noMedications': 'மருந்துகள் எதுவும் பதிவு செய்யப்படவில்லை.',
    'profile.male': 'ஆண் (Male)',
    'profile.female': 'பெண் (Female)',
    'profile.other': 'மற்றவை (Other)',

    // Records Page
    'records.title': 'மெடிக்கல் ரெக்கார்ட்ஸ் வால்ட்',
    'records.subtitle': 'உங்கள் பாதுகாப்பான கிளவுட் களஞ்சியத்தில் உள்ள ஆவணங்கள்',
    'records.uploadBtn': 'புதிய ஆவணத்தை பதிவேற்றவும்',
    'records.searchPlaceholder': 'பெயர், மருத்துவர் அல்லது மருத்துவமனை மூலம் தேடவும்…',
    'records.allTypes': 'அனைத்து ஆவண வகைகள்',
    'records.emptyTitle': 'ஆவணங்கள் எதுவும் கிடைக்கவில்லை',
    'records.emptySubtitle': 'தொடங்குவதற்கு உங்கள் முதல் மருத்துவ ஆவணத்தை பதிவேற்றவும்.',
    'records.uploadFirst': 'முதல் ஆவணத்தை பதிவேற்றவும்',

    // Timeline Page
    'timeline.title': 'சிகிச்சை வரலாறு (Timeline)',
    'timeline.subtitle': 'அனைத்து மருத்துவ நிகழ்வுகளின் காலவரிசை பதிவு',
    'timeline.empty': 'நிகழ்வுகள் எதுவும் பதிவு செய்யப்படவில்லை.',

    // Health Paths
    'paths.title': 'சிகிச்சை திட்டம் & கேர் பிளான்',
    'paths.subtitle': 'மருத்துவர் பரிந்துரைத்த சிகிச்சை திட்டங்கள் மற்றும் முன்னேற்றம்',
    'paths.active': 'செயலில் உள்ளது',
    'paths.completed': 'முடிவடைந்தது',
    'paths.noPaths': 'சிகிச்சை திட்டங்கள் எதுவும் இல்லை.',

    // Status & Severities
    'status.ACTIVE': 'செயலில் உள்ளது',
    'status.MANAGED': 'கட்டுப்பாட்டில் உள்ளது',
    'status.COMPLETED': 'முடிவடைந்தது',
    'status.PENDING': 'நிலுவையில் உள்ளது',
    'severity.LIFE_THREATENING': 'உயிருக்கு ஆபத்தானது',
    'severity.SEVERE': 'தீவிரமானது',
    'severity.MODERATE': 'மிதமான',
    'severity.MILD': 'லேசான',

    // Gender
    'gender.MALE': 'ஆண் (MALE)',
    'gender.FEMALE': 'பெண் (FEMALE)',
    'gender.OTHER': 'மற்றவை (OTHER)',

    // Record types
    'recType.PRESCRIPTION': 'மருந்து சீட்டு',
    'recType.LAB_REPORT': 'லேப் ரிப்போர்ட்',
    'recType.CONSULTATION': 'மருத்துவர் ஆலோசனை',
    'recType.CHECKUP': 'வழக்கமான பரிசோதனை',
    'recType.OTHER': 'மற்ற ஆவணங்கள்',

    // Common labels
    'common.emergencyPrefix': 'அவசர தொடர்பு:',
    'common.medicinesLabel': 'மருந்துகள்:',
    'common.byLabel': 'மருத்துவர்:',
    'common.startedLabel': 'தொடங்கியது:',
    'common.viewFile': 'கோப்பை பார்க்க',
    'common.download': 'பதிவிறக்கு',
    'common.ongoing': 'தொடர்கிறது',
    'common.diagnosed': 'கண்டறியப்பட்ட நாள்:',

    // Frequencies
    'freq.Twice daily with meals': 'உணவுடன் தினமும் 2 முறை',
    'freq.Once daily in the morning': 'காலையில் தினமும் 1 முறை',
    'freq.Once daily before breakfast': 'காலை உணவுக்கு முன் தினமும் 1 முறை',

    // Common Clinical Entities
    'med.Metformin': 'மெட்ஃபோர்மின் (Metformin)',
    'med.Amlodipine': 'அம்லோடிபைன் (Amlodipine)',
    'med.Pantoprazole': 'பாண்டோபிரசோல் (Pantoprazole)',
    'allergy.Penicillin': 'பென்சிலின் (Penicillin)',
    'allergy.Peanuts': 'வேர்க்கடலை (Peanuts)',
    'allergy.Sulfonamides (Sulfa drugs)': 'சல்ஃபா மருந்துகள் (Sulfa drugs)',
    'cond.Type 2 Diabetes Mellitus': 'டைப் 2 சர்க்கரை நோய் (Diabetes)',
    'cond.Essential Hypertension (Stage 1)': 'உயர் இரத்த அழுத்தம் (High BP)',
    'cond.Chronic Lower Back Pain (L4-L5 disc herniation)': 'முதுகு வலி / L4-L5 டிஸ்க் பிரச்சனை',

    // Ask Advice Page
    'page.askAdvice': 'AI மருத்துவ ஆலோசனை',
    'page.askAdviceSubtitle': 'எளிய தமிழில் உங்கள் ஆரோக்கியம் பற்றிய வழிகாட்டுதலைப் பெறுங்கள்',
    'advice.disclaimer': 'முக்கிய குறிப்பு:',
    'advice.disclaimerText': 'இந்த AI பொதுவான சுகாதார வழிகாட்டுதலுக்கு மட்டுமே, இது நேரடி மருத்துவருக்கு மாற்றாகாது. சரியான சிகிச்சைக்கு எப்போதும் மருத்துவரை அணுகவும்.',
    'advice.emptyTitle': 'உங்கள் உடல்நலம் குறித்து நான் இன்று எவ்வாறு உதவலாம்?',
    'advice.emptySubtitle': 'உங்கள் உடல் பிரச்சனைகள் அல்லது அறிகுறிகளை எளிய வார்த்தைகளில் கூறவும். நிலைமையை நன்றாகப் புரிந்து கொண்டு சரியான ஆலோசனையை வழங்குவேன்.',
    'advice.suggestion1': 'எனக்கு சில நாட்களாக தொடர்ந்து தலைவலி இருக்கிறது',
    'advice.suggestion2': 'வைட்டமின் டி குறைபாட்டின் முக்கிய அறிகுறிகள் என்ன?',
    'advice.suggestion3': 'தொண்டை வலி மற்றும் லேசான காய்ச்சல் உள்ளது, என்ன செய்யலாம்?',
    'advice.suggestion4': 'மன அழுத்தத்தை குறைக்க எளிய வழிகள்',
    'advice.placeholder': 'உங்கள் அறிகுறிகள் அல்லது கேள்வியை இங்கு தட்டச்சு செய்யவும்…',
    'advice.speakInstead': 'பேசி தெரிவிக்கவும்',
    'advice.stopListening': 'நிறுத்தவும்',
    'advice.getAdvice': 'ஆலோசனை பெறுங்கள்',
    'advice.thinking': 'பதில் தயாராகிறது…',
    'advice.clearChat': 'சாட் அழிக்கவும்',

    // Common
    'common.loading': 'ஏற்றப்படுகிறது…',
    'common.authenticating': 'சரிபார்க்கப்படுகிறது…',
    'common.changeLanguage': 'மொழியை மாற்றவும்',
    'lang.title': 'உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்',
    'lang.subtitle': 'சுலபமாக புரிந்து கொள்ளவும் பேசவும் உங்கள் மொழியை தேர்வு செய்யவும்',
    'lang.continue': 'தொடரவும்',
  },
};

/* ─── Context ────────────────────────────────────────────────── */
interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string, fallback?: string) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  showPicker: boolean;
  setShowPicker: (show: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'medcord_language';
const PICKER_SHOWN_KEY = 'medcord_lang_picker_shown';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LangCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as LangCode) || 'en';
  });

  const [showPicker, setShowPicker] = useState<boolean>(() => {
    return !localStorage.getItem(PICKER_SHOWN_KEY);
  });

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const setShowPickerWrapped = useCallback((show: boolean) => {
    setShowPicker(show);
    if (!show) {
      localStorage.setItem(PICKER_SHOWN_KEY, 'true');
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return translations[lang]?.[key] || translations.en?.[key] || fallback || key;
    },
    [lang]
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      if (!date) return '';
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';
      const locale = LOCALE_MAP[lang] || 'en-US';
      const defaultOpts: Intl.DateTimeFormatOptions = options || {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      };
      return d.toLocaleDateString(locale, defaultOpts);
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, formatDate, showPicker, setShowPicker: setShowPickerWrapped }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
