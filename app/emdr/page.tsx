import { FrontendShell } from "@/app/components/frontend/FrontendShell";
import { EmdrKeepReading } from "@/app/components/frontend/EmdrKeepReading";
import { JsonLd } from "@/app/components/frontend/JsonLd";
import { LOGIN_PATH } from "@/lib/app-base";
import { EMDR_FAQ_ITEMS as EMDR_FAQ } from "@/lib/emdr-faq";
import { getPublicAppUrl } from "@/lib/platform-settings";
import { buildEmdrJsonLd } from "@/lib/seo-jsonld";
import { buildCachedPageMetadata } from "@/lib/site-seo-cache";
import { siteOrigin } from "@/lib/site-seo";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600; // PUBLIC_PAGE_REVALIDATE_SECONDS

export async function generateMetadata(): Promise<Metadata> {
  return buildCachedPageMetadata("emdr");
}

export default async function EmdrPage() {
  let publicUrl: string | undefined;
  try {
    publicUrl = await getPublicAppUrl();
  } catch {
    publicUrl = undefined;
  }
  const origin = siteOrigin(publicUrl);

  return (
    <FrontendShell>
      <JsonLd data={buildEmdrJsonLd(origin, EMDR_FAQ)} />
      <article className="frontend-legal frontend-legal--long">
        <h1>AI-guided EMDR therapy online</h1>
        <p>
          Nura is a guided self-help tool for bilateral stimulation. You work
          with a moving ball, optional tones, and a structured session that
          follows the shape of an EMDR protocol — intake, grounding, sets, and
          closure. An AI guides the pacing and checks in between sets.
        </p>
        <p>
          It is not therapy, it does not diagnose, and it does not replace a
          trained clinician. What it does is give you a structured, private
          place to practise the parts of EMDR that happen around the clinical
          work.
        </p>

        <h2>What AI-guided EMDR actually is</h2>
        <p>
          EMDR — Eye Movement Desensitization and Reprocessing — is a structured
          approach built around <strong>bilateral stimulation</strong>:
          alternating left–right input, usually eye movements, taps, or tones.
          While you hold a difficult memory or feeling in mind, the stimulation
          runs. Most people notice the memory becomes less vivid and less
          charged over a set.
        </p>
        <p>
          Nura takes that core mechanic and wraps an AI guide around it. The AI
          does not perform therapy. It runs the session structure:
        </p>
        <ul>
          <li>It opens with an intake conversation and a short safety screen</li>
          <li>It helps you settle before any set begins</li>
          <li>It paces sets and prompts the check-ins between them</li>
          <li>
            It watches for signs you are getting overwhelmed and pulls you back
            to grounding
          </li>
          <li>
            It closes every session properly, even if you try to leave mid-set
          </li>
        </ul>
        <p>
          The distinction matters. In clinical EMDR, a trained therapist holds
          the room — they judge whether you are ready to process, when to slow
          down, and what to do if something surfaces. Nura does not do that.
          What Nura does is give structure to the practice you do on your own,
          and refuse to let you skip the parts that keep it safe.
        </p>
        <p>
          <strong>AI-guided EMDR is not a faster version of therapy.</strong> It
          is a self-help tool for people who want structure, privacy, and
          something to do between sessions.
        </p>

        <h2>How a Nura session works, step by step</h2>

        <h3>1. Intake and grounding</h3>
        <p>
          Every session starts with a conversation, not a set. The AI asks what
          brings you in, what is present for you right now, and whether anything
          has changed since last time.
        </p>
        <p>
          Part of that intake is a <strong>safety screen</strong>. The AI asks
          directly about prior EMDR or therapy, dissociation or feeling unreal,
          self-harm or suicidal thoughts, and whether you are currently in
          crisis or feel unsafe. If any of those come back as a red flag, the
          session does not advance to processing. You get grounding only, and a
          clear recommendation to contact a professional.
        </p>
        <p>
          If screening is clear, you build resources first: a safe place, a
          container for difficult material, and a grounding technique you can
          return to. Nothing else happens until those are in place.
        </p>

        <h3>2. Choosing a target</h3>
        <p>
          You and the AI agree on <strong>one</strong> concrete target — a short
          phrase or image, not a whole history. Recent, specific, and manageable
          beats old, vague, and enormous.
        </p>
        <p>
          You rate how disturbing it feels right now on a 0–10 scale. That
          number is your baseline. Everything after this is measured against it.
        </p>

        <h3>3. Bilateral stimulation sets</h3>
        <p>
          The moving ball starts. You follow it with your eyes while holding the
          target in mind. The AI runs the set, stays quiet during it, and checks
          in when it ends.
        </p>
        <p>
          Between sets you rate the disturbance again. If the number is dropping,
          you continue. If it is not moving, the AI changes something — speed,
          channel, or the target itself. If it is <strong>rising</strong>, the
          set stops and you go back to grounding. That rule is not negotiable,
          and the design does not let you override it.
        </p>

        <h3>4. Check-in and closure</h3>
        <p>
          Every session ends with closure, and closure is mandatory. If you try
          to leave during a set, the app stops you and walks you through a short
          containment exercise first. If you close the tab mid-set, the next
          time you open Nura it offers to finish the closure you skipped.
        </p>
        <p>
          <strong>This is the part most self-help tools get wrong.</strong>{" "}
          Ending mid-processing is how people end up with material surfacing at
          2am with nothing to do about it. Nura does not let a session end that
          way.
        </p>
        <p>
          You finish with a body scan, a final rating, and a note on what to
          carry forward.
        </p>

        <h2>Bilateral stimulation: visual, audio, and tactile</h2>
        <p>Nura offers three channels, and you can switch between them:</p>
        <p>
          <strong>Visual.</strong> A ball moves side to side across the screen.
          This is the classic EMDR experience and the one most people start
          with. Size, speed, path, and background are adjustable — a slower,
          wider ball is usually easier to follow when you are already activated.
        </p>
        <p>
          <strong>Audio.</strong> Alternating tones through headphones. Useful if
          closing your eyes helps you stay with the material, or if you find the
          visual track distracting. Many people use audio when they are working
          on something that makes looking at the screen uncomfortable.
        </p>
        <p>
          <strong>Tactile.</strong> Gentle alternating pulses, for people who
          regulate better through physical sensation than through sight or
          sound.
        </p>
        <p>
          <strong>On speed:</strong> the research on bilateral stimulation points
          to working-memory load as the active ingredient. Following a moving
          ball while holding a memory taxes the same cognitive resources the
          memory needs to stay vivid. Faster is not better — pick a pace that
          lets you actually stay with the target. If you are losing the memory,
          slow down.
        </p>
        <p>
          There is no single correct channel. Try all three, notice which one
          lets you stay present, and use that.
        </p>

        <h2>What the AI does — and what it does not do</h2>
        <p>
          This section matters more than any other on this page, so it is worth
          being blunt.
        </p>
        <p>
          <strong>The AI does:</strong>
        </p>
        <ul>
          <li>Run the session structure and keep time</li>
          <li>Prompt grounding, check-ins, and closure</li>
          <li>Track your disturbance ratings across sets and respond to them</li>
          <li>
            Refuse to start or continue a set when the safety screen flags
            something
          </li>
          <li>Offer grounding and containment when you are flooded</li>
          <li>
            Sit with you between sessions when something surfaces and your
            therapist is not available
          </li>
        </ul>
        <p>
          <strong>The AI does not:</strong>
        </p>
        <ul>
          <li>Diagnose anything, ever</li>
          <li>Assess whether you are clinically ready to process trauma</li>
          <li>
            Hold a therapeutic relationship or remember you as a person across
            sessions
          </li>
          <li>
            Make clinical judgments about pacing when something unexpected comes
            up
          </li>
          <li>Provide emergency care</li>
          <li>Know when a reaction has crossed from uncomfortable into unsafe</li>
        </ul>
        <p>
          <strong>
            An AI cannot do EMDR reprocessing the way a trained clinician does
          </strong>
          , and this app does not claim otherwise. What Nura can do is give you
          structure, keep you inside the parts you can safely do alone, and stop
          you when you reach the edge of them.
        </p>
        <p>
          That boundary is deliberate. It is also the reason this tool exists
          rather than a claim that it replaces anyone. See the full list of{" "}
          <Link href="/limits">what Nura does not do</Link>.
        </p>

        <h2>AI-guided EMDR vs. in-person EMDR therapy</h2>
        <div className="frontend-legal-tablewrap">
          <table className="frontend-legal-table">
            <thead>
              <tr>
                <th scope="col">&nbsp;</th>
                <th scope="col">Nura (AI-guided)</th>
                <th scope="col">In-person EMDR therapy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Structure</th>
                <td>Full session shape, AI-paced</td>
                <td>Full 8-phase protocol</td>
              </tr>
              <tr>
                <th scope="row">Bilateral stimulation</th>
                <td>Visual, audio, tactile</td>
                <td>Visual, audio, tactile</td>
              </tr>
              <tr>
                <th scope="row">Assessment</th>
                <td>Safety screen only</td>
                <td>Full history and readiness assessment</td>
              </tr>
              <tr>
                <th scope="row">Clinical judgment</th>
                <td>None</td>
                <td>Trained clinician, in the room</td>
              </tr>
              <tr>
                <th scope="row">Handles abreactions</th>
                <td>No — stops and grounds</td>
                <td>Yes</td>
              </tr>
              <tr>
                <th scope="row">Cost</th>
                <td>Subscription</td>
                <td>Per session</td>
              </tr>
              <tr>
                <th scope="row">Waiting list</th>
                <td>None</td>
                <td>Often weeks to months</td>
              </tr>
              <tr>
                <th scope="row">Complex trauma</th>
                <td>Not appropriate</td>
                <td>Appropriate with a specialist</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The honest summary:{" "}
          <strong>
            Nura is a good place to practise and a bad place to do the hard part.
          </strong>{" "}
          If your material is manageable, recent, and specific, structured
          self-help practice may be useful. If your history is complex, early, or
          you lose time when you get distressed, you need a clinician — and no
          app, including this one, is a substitute.
        </p>
        <p>
          Many people use both. A session with your therapist, then structured
          practice in between so the work keeps moving. That is the use case Nura
          was built for.
        </p>

        <h2>Who this is for (and who it is not for)</h2>
        <p>
          <strong>Nura may suit you if:</strong>
        </p>
        <ul>
          <li>You want structured practice between therapy sessions</li>
          <li>
            You are working with everyday stress, a specific recent event, or a
            manageable worry
          </li>
          <li>You can notice when you are getting overwhelmed and stop</li>
          <li>
            You have no history of dissociation, complex trauma, or psychosis
          </li>
          <li>
            You want privacy and you do not want to wait for an appointment
          </li>
        </ul>
        <p>
          <strong>Nura is not for you if:</strong>
        </p>
        <ul>
          <li>
            You are in an active crisis, or having thoughts of harming yourself
          </li>
          <li>
            You have a diagnosed dissociative disorder, or you sometimes lose
            time
          </li>
          <li>
            You have complex or developmental trauma without clinical support
          </li>
          <li>You are under 18</li>
          <li>You are looking for diagnosis or treatment</li>
        </ul>
        <p>
          If you are in the second list, this tool can make things worse rather
          than better. Please talk to a clinician first. You can also{" "}
          <a
            href="https://www.emdria.org/find-an-emdr-therapist/"
            target="_blank"
            rel="noopener noreferrer"
          >
            find an EMDR-trained therapist
          </a>{" "}
          through EMDRIA.
        </p>

        <h2>Between sessions: support when your therapist is unavailable</h2>
        <p>
          EMDR has a well-known gap: processing does not stop when the
          appointment ends. Material surfaces on a Tuesday night, and your next
          session is eleven days away.
        </p>
        <p>
          Nura is useful here. You can open it, run grounding, use the container
          exercise to set something aside, or do a short stabilisation session
          without touching the difficult material at all. No processing, no sets
          — just the tools your therapist would want you to have between
          appointments.
        </p>
        <p>
          This is the least risky way to use the app, and for a lot of people it
          is the most valuable.
        </p>

        <h2>Safety: when to stop and when to get help</h2>
        <p>
          <strong>Stop the session and move to grounding if:</strong>
        </p>
        <ul>
          <li>Your disturbance rating is going up rather than down</li>
          <li>You feel detached from your body, or the room feels unreal</li>
          <li>You cannot remember what you were just doing</li>
          <li>Your heart is racing and you cannot settle</li>
          <li>
            You feel like you are back in the memory rather than looking at it
          </li>
        </ul>
        <p>
          <strong>Contact a professional before using Nura again if:</strong>
        </p>
        <ul>
          <li>Difficult material keeps surfacing outside sessions</li>
          <li>You feel worse rather than better over several days</li>
          <li>You are avoiding things you used to do</li>
          <li>
            You are using sessions to punish yourself rather than to process
          </li>
        </ul>
        <p className="frontend-legal-note">
          <strong>Get help immediately</strong> if you have thoughts of harming
          yourself or someone else, feel unable to keep yourself safe, or you are
          in crisis. In the US, call or text <strong>988</strong> (Suicide &amp;
          Crisis Lifeline). Outside the US, contact your local emergency number
          or a crisis line in your country. The full guide is on{" "}
          <Link href="/safety">Safety</Link>. Nura does not provide emergency
          care; the in-session <strong>“I need help now”</strong> button opens
          crisis resources at any point, including mid-set.
        </p>

        <h2>Frequently asked questions</h2>
        <dl className="frontend-legal-faq">
          {EMDR_FAQ.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              {item.q.startsWith("Is my data private") ? (
                <p>
                  Sessions are encrypted and never used to train AI models. Read
                  the <Link href="/privacy">Privacy Policy</Link> for exactly
                  what is stored, where, and for how long.
                </p>
              ) : (
                <p>{item.a}</p>
              )}
            </div>
          ))}
        </dl>

        <h2>Start a session</h2>
        <p>Nura is free to try. No waiting list, no referral, no appointment.</p>
        <div className="frontend-legal-actions">
          <Link href={LOGIN_PATH} className="frontend-btn-primary">
            Start a session
          </Link>
          <Link href="/safety" className="frontend-btn-ghost">
            Read the safety guide
          </Link>
          <Link href="/learn" className="frontend-btn-ghost">
            How a session is structured
          </Link>
        </div>
        <p className="frontend-legal-note">
          Nura is self-help software. It is not a licensed therapist, not a
          medical device, and it does not diagnose or treat any condition. If you
          are in crisis, call 988 (US) or your local emergency number.
        </p>

        <EmdrKeepReading />
      </article>
    </FrontendShell>
  );
}
