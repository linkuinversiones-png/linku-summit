import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n/config';
import { getContent } from '@/lib/i18n/content';
import { getActiveTiers } from '@/lib/tickets';
import { getActiveSpeakers } from '@/lib/speakers';

// El landing siempre se renderiza fresh contra DB (tiers, sesión Supabase).
// Sin esto Next puede servir una versión cacheada después de un edit en admin.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import {
  eventJsonLd,
  faqJsonLd,
  organizationJsonLd
} from '@/lib/seo/structured-data';
import JsonLd from '@/components/seo/JsonLd';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/navigation/Footer';

import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import ForWhom from '@/components/sections/ForWhom';
import Thesis from '@/components/sections/Thesis';
import Agenda from '@/components/sections/Agenda';
import Speakers from '@/components/sections/Speakers';
import Tickets from '@/components/sections/Tickets';
import SponsorsWall from '@/components/sections/SponsorsWall';
import FinalCTA from '@/components/sections/FinalCTA';
import FAQ from '@/components/sections/FAQ';

async function getCurrentUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export default async function HomePage({
  params
}: {
  params: { locale: Locale };
}) {
  const [user, dbTiers, dbSpeakers] = await Promise.all([
    getCurrentUser(),
    getActiveTiers(params.locale),
    getActiveSpeakers(params.locale)
  ]);
  const c = getContent(params.locale);
  const ui = c.ui;

  // Tiers vienen de DB; el copy de intro viene del JSON.
  const ticketsForView = {
    intro: c.tickets.intro,
    tiers: dbTiers
  };

  const eventLd = eventJsonLd(
    {
      eventName: c.site.eventName,
      startDate: c.site.startDate,
      endDate: c.site.endDate,
      city: c.site.city,
      country: c.site.country,
      venue: c.site.venue,
      tagline: c.site.tagline
    },
    dbTiers.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
      ctaHref: t.ctaHref
    })),
    params.locale
  );
  const faqLd = faqJsonLd(c.faq);
  const orgLd = organizationJsonLd();

  return (
    <>
      <JsonLd data={eventLd} />
      <JsonLd data={faqLd} />
      <JsonLd data={orgLd} />
      <Navbar
        contacts={c.site.contacts}
        isLoggedIn={!!user}
        locale={params.locale}
        ui={ui.nav}
      />
      <main>
        <Hero site={c.site} ui={ui.hero} countdownLabels={ui.countdown} />
        <Speakers speakers={dbSpeakers} ui={ui.speakers} />
        <Agenda agenda={c.agenda} ui={ui.agenda} />
        <About about={c.site.about} site={c.site} ui={ui.about} />
        <ForWhom ui={ui.forWhom} />
        <Thesis items={c.site.thesis} ui={ui.thesis} />
        <Tickets tickets={ticketsForView} ui={ui.tickets} />
        <SponsorsWall
          locale={params.locale}
          copy={{
            eyebrow: ui.sponsors.eyebrow,
            title: ui.sponsors.title,
            emptyTitle: ui.sponsors.emptyTitle,
            emptyLead: ui.sponsors.emptyLead,
            emptyCta: ui.sponsors.emptyCta,
            emptyCtaSubject: ui.sponsors.emptyCtaSubject,
            contactEmail: c.site.contacts.sponsors
          }}
        />
        <FinalCTA finalCTA={c.site.finalCTA} />
        <FAQ items={c.faq} ui={ui.faq} />
      </main>
      <Footer site={c.site} ui={ui.footer} />
    </>
  );
}
