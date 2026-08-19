import { useMemo, useState } from 'react';
import { Badge, Button, Chip } from '../../design-system';
import { SalesmanLayer } from '../../salesman/presence/SalesmanLayer';
import { useSalesmanEngine } from '../../salesman/runtime/useSalesmanEngine';
import { LAWYER_EXPERIENCE_ENTITIES, LAWYERS, PRACTICE_AREAS, matchLawyers, type PracticeAreaId } from './data';
import './law.css';

export default function LawFirmPage() {
  const [practiceArea, setPracticeArea] = useState<PracticeAreaId>('business');
  const [office, setOffice] = useState('Central Office');
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const engine = useSalesmanEngine({
    niche: 'law-firms',
    verifiedFacts: {
      practiceAreas: PRACTICE_AREAS,
      lawyers: LAWYER_EXPERIENCE_ENTITIES,
      offices: ['Central Office', 'Harbor Office'],
      safety: 'Intake/routing demo only. No legal advice, merit assessment, outcome prediction, case value or attorney-client relationship.',
    },
  });

  const matches = useMemo(() => matchLawyers(practiceArea, office), [practiceArea, office]);
  const profile = profileId ? LAWYERS.find((lawyer) => lawyer.id === profileId) : undefined;

  const chooseArea = (id: PracticeAreaId) => {
    setPracticeArea(id);
    engine.answer('matter_category', id);
    engine.emit({ type: 'section_view', page: '/law-firms', entityId: `practice-${id}` });
  };
  const chooseOffice = (next: string) => { setOffice(next); engine.answer('office', next); };
  const openExperience = (source: string) => { engine.emit({ type: 'experience_open', page: '/law-firms', entityId: source }); setExperienceOpen(true); };

  return (
    <div className="law-site" data-theme="law">
      <header className="law-nav">
        <a className="law-brand" href="/law-firms"><span>R&K</span><div><strong>Rowan & Kline</strong><small>fictional counsel demo</small></div></a>
        <nav><a href="#practice">Practice</a><a href="#team">People</a><a href="#consultation">Consultation</a><a href="#about-demo">About demo</a></nav>
        <Button size="sm" variant="secondary" onClick={() => openExperience('nav-consultation')}>Find the right consultation</Button>
      </header>

      <main>
        <section className="law-hero" data-sales-section="law-hero">
          <div className="law-hero__copy"><Badge tone="accent">Fictional law-firm routing demo</Badge><h1>Clarity before contact.</h1><p>A restrained intake guide can help a visitor reach the right configured consultation path without pretending to be a lawyer, predicting an outcome or assessing a case.</p><div><a href="#practice">Explore practice areas ↓</a><button onClick={() => openExperience('hero-route')}>Route my enquiry →</button></div></div>
          <div className="law-hero__mark" aria-hidden="true"><span>R</span><i/><i/><i/></div>
        </section>

        <section className="law-practice" id="practice" data-sales-section="practice-areas">
          <div className="law-heading"><div><span>Practice 01</span><h2>Start broad. Route from configured facts.</h2></div><p>The guide may help identify a consultation category. It never decides whether someone “has a case.”</p></div>
          <div className="law-practice-grid">{PRACTICE_AREAS.map((area) => <button key={area.id} className={practiceArea === area.id ? 'is-active' : ''} data-sales-entity={`practice-${area.id}`} onClick={() => chooseArea(area.id)}><span>{String(PRACTICE_AREAS.indexOf(area)+1).padStart(2,'0')}</span><h3>{area.name}</h3><p>{area.description}</p><small>{area.matters.join(' · ')}</small></button>)}</div>
        </section>

        <section className="law-router" id="consultation" data-sales-section="consultation-router">
          <div className="law-router__copy"><Badge>Routing 02</Badge><h2>Which configured team is the closest fit?</h2><p>This deterministic match uses only the selected broad category and office. It is not personalized legal advice.</p><div className="law-office"><span>Preferred office</span><div>{['Central Office','Harbor Office'].map((item) => <Chip key={item} selected={office===item} onClick={() => chooseOffice(item)}>{item}</Chip>)}</div></div></div>
          <div className="law-router__result"><span>Closest configured team</span>{matches.length ? matches.map((lawyer,index) => <button key={lawyer.id} data-sales-entity={lawyer.id} onClick={() => setProfileId(lawyer.id)}><i>{lawyer.initials}</i><div><small>{index===0?'Primary configured match':'Also configured'}</small><strong>{lawyer.name}</strong><span>{lawyer.title} · {lawyer.practiceAreas.join(', ')}</span></div><b>View →</b></button>) : <p>No configured lawyer in this demo matches both selections. Choose another office or category.</p>}<Button onClick={() => openExperience('team-routing')}>Continue to safe intake</Button></div>
        </section>

        <section className="law-team" id="team" data-sales-section="lawyer-team">
          <div className="law-heading"><div><span>People 03</span><h2>Profiles are data, not authority theater.</h2></div><p>Every person below is fictional. The guide can route to these configured profiles only.</p></div>
          <div className="law-team-grid">{LAWYERS.map((lawyer) => <button key={lawyer.id} data-sales-entity={lawyer.id} onClick={() => setProfileId(lawyer.id)}><div className="law-person-mark">{lawyer.initials}</div><span>{lawyer.title}</span><h3>{lawyer.name}</h3><p>{lawyer.practiceAreas.join(' · ')}<br/>{lawyer.offices.join(' · ')}</p></button>)}</div>
        </section>

        <section className="law-safety" id="about-demo" data-sales-section="legal-safety">
          <div><Badge>Safety boundary 04</Badge><h2>Useful intake stops where legal advice begins.</h2></div>
          <div className="law-safety-grid"><article><span>Can do</span><ul><li>Route by configured practice area</li><li>Match configured office/team</li><li>Collect consultation preferences</li><li>Carry known intake context forward</li></ul></article><article className="is-no"><span>Will not do</span><ul><li>Tell a visitor they have a valid case</li><li>Predict outcomes or damages</li><li>Create legal deadlines</li><li>Imply attorney-client relationship</li></ul></article></div>
        </section>
      </main>

      {profile ? <aside className="law-profile"><button className="law-profile__close" onClick={() => setProfileId(null)} aria-label="Close lawyer profile">×</button><div className="law-profile__portrait"><span>{profile.initials}</span></div><div className="law-profile__copy"><Badge tone="accent">Fictional profile</Badge><span>{profile.title}</span><h2>{profile.name}</h2><p>Configured for {profile.practiceAreas.join(' and ')} intake. This profile does not imply availability or create a lawyer-client relationship.</p><dl><div><dt>Offices</dt><dd>{profile.offices.join(', ')}</dd></div><div><dt>Languages</dt><dd>{profile.languages.join(', ')}</dd></div><div><dt>Consultation types</dt><dd>{profile.consultationTypes.join(', ')}</dd></div></dl><Button onClick={() => { setProfileId(null); engine.answer('preferred_lawyer', profile.id); openExperience('lawyer-profile'); }}>Use this consultation path</Button></div></aside> : null}

      <SalesmanLayer engine={engine} entities={LAWYER_EXPERIENCE_ENTITIES} experienceOpen={experienceOpen} onExperienceOpenChange={setExperienceOpen} />
    </div>
  );
}
