import type { ExperienceEntity } from '../../salesman/experience/types';

export type PracticeAreaId = 'business' | 'real_estate' | 'employment' | 'estate';

export type Lawyer = {
  id: string;
  name: string;
  title: string;
  practiceAreas: PracticeAreaId[];
  offices: string[];
  languages: string[];
  consultationTypes: string[];
  initials: string;
};

export const PRACTICE_AREAS: Array<{ id: PracticeAreaId; name: string; description: string; matters: string[] }> = [
  { id: 'business', name: 'Business & Commercial', description: 'Configured intake for company, contract and commercial matters.', matters: ['commercial agreements','shareholder matters','business disputes'] },
  { id: 'real_estate', name: 'Real Estate', description: 'Configured intake for property transactions and commercial real-estate matters.', matters: ['commercial leases','property transactions','development matters'] },
  { id: 'employment', name: 'Employment', description: 'Configured intake for employer and workplace matters.', matters: ['employment agreements','workplace disputes','employer advisory'] },
  { id: 'estate', name: 'Estate Planning', description: 'Configured intake for estate-planning consultation requests.', matters: ['wills','trust planning','succession planning'] },
];

// Entire firm/team dataset is fictional and exists only to demonstrate deterministic intake/routing.
export const LAWYERS: Lawyer[] = [
  { id: 'LR-01', name: 'Mara Ellison', title: 'Partner', practiceAreas: ['business'], offices: ['Harbor Office'], languages: ['English'], consultationTypes: ['Business consultation'], initials: 'ME' },
  { id: 'LR-02', name: 'Daniel Ro', title: 'Partner', practiceAreas: ['real_estate','business'], offices: ['Central Office'], languages: ['English','Korean'], consultationTypes: ['Real-estate consultation','Business consultation'], initials: 'DR' },
  { id: 'LR-03', name: 'Leila Haddad', title: 'Counsel', practiceAreas: ['employment'], offices: ['Central Office'], languages: ['English','Arabic'], consultationTypes: ['Employment consultation'], initials: 'LH' },
  { id: 'LR-04', name: 'Jon Bell', title: 'Counsel', practiceAreas: ['estate'], offices: ['Harbor Office','Central Office'], languages: ['English'], consultationTypes: ['Estate-planning consultation'], initials: 'JB' },
  { id: 'LR-05', name: 'Nadia Mercer', title: 'Associate', practiceAreas: ['business','employment'], offices: ['Harbor Office'], languages: ['English','French'], consultationTypes: ['Business consultation','Employment consultation'], initials: 'NM' },
  { id: 'LR-06', name: 'Avery Chen', title: 'Associate', practiceAreas: ['real_estate'], offices: ['Central Office'], languages: ['English','Mandarin'], consultationTypes: ['Real-estate consultation'], initials: 'AC' },
];

export const LAWYER_EXPERIENCE_ENTITIES: ExperienceEntity[] = LAWYERS.map((lawyer) => ({
  id: lawyer.id,
  name: lawyer.name,
  subtitle: lawyer.title,
  swatch: 'linear-gradient(145deg,#283546,#131d29)',
  attributes: {
    practice_areas: lawyer.practiceAreas,
    offices: lawyer.offices,
    languages: lawyer.languages,
    consultation_types: lawyer.consultationTypes,
  },
}));

export function matchLawyers(practiceArea: PracticeAreaId, office?: string): Lawyer[] {
  return LAWYERS
    .filter((lawyer) => lawyer.practiceAreas.includes(practiceArea))
    .filter((lawyer) => !office || lawyer.offices.includes(office));
}
