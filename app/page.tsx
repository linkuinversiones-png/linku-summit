import siteData from '@/content/site.json';
import speakersData from '@/content/speakers.json';
import sponsorsData from '@/content/sponsors.json';
import partnersData from '@/content/partners.json';
import agendaData from '@/content/agenda.json';
import ticketsData from '@/content/tickets.json';
import faqData from '@/content/faq.json';

import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/navigation/Footer';

import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import ForWhom from '@/components/sections/ForWhom';
import WhyNow from '@/components/sections/WhyNow';
import Thesis from '@/components/sections/Thesis';
import Audience from '@/components/sections/Audience';
import Experience from '@/components/sections/Experience';
import Agenda from '@/components/sections/Agenda';
import Speakers from '@/components/sections/Speakers';
import Partners from '@/components/sections/Partners';
import Tickets from '@/components/sections/Tickets';
import Sponsorship from '@/components/sections/Sponsorship';
import SponsorsConfirmed from '@/components/sections/SponsorsConfirmed';
import WhyLinkU from '@/components/sections/WhyLinkU';
import FinalCTA from '@/components/sections/FinalCTA';
import FAQ from '@/components/sections/FAQ';

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <>
      <Navbar contacts={siteData.contacts} isLoggedIn={!!user} />
      <main>
        <Hero site={siteData} />
        <Speakers speakers={speakersData} />
        <Agenda agenda={agendaData} />
        <About about={siteData.about} site={siteData} />
        <ForWhom contacts={siteData.contacts} />
        <WhyNow items={siteData.whyNow} />
        <Thesis items={siteData.thesis} />
        <Audience audience={siteData.audience} />
        <Experience items={siteData.experience} />
        <Partners partners={partnersData} />
        <Tickets tickets={ticketsData} />
        <Sponsorship sponsorship={ticketsData.sponsorship} />
        <SponsorsConfirmed sponsors={sponsorsData} />
        <WhyLinkU items={siteData.whyLinkU} />
        <FinalCTA finalCTA={siteData.finalCTA} />
        <FAQ items={faqData} />
      </main>
      <Footer site={siteData} />
    </>
  );
}
