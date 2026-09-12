import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  prepareTermsHtml,
  softSentenceCaseHeading,
} from "@/lib/legal/terms-html";

describe("softSentenceCaseHeading", () => {
  it("sentence-cases ALL CAPS Termly titles", () => {
    assert.equal(softSentenceCaseHeading("1. OUR SERVICES"), "1. Our services");
    assert.equal(
      softSentenceCaseHeading("AGREEMENT TO OUR LEGAL TERMS"),
      "Agreement to our legal terms",
    );
  });
});

describe("prepareTermsHtml", () => {
  it("rewrites support mailto to Need help and soft-cases headings", () => {
    const raw = `<body>
      <h2>1. OUR SERVICES</h2>
      <p>email at <a href="mailto:support@nurahelp.com">support@nurahelp.com</a></p>
      <p>Reach us at support@nurahelp.com later.</p>
      <div id="ip"></div>
      <h2>2. INTELLECTUAL PROPERTY RIGHTS</h2>
    </body>`;
    const out = prepareTermsHtml(raw);
    assert.match(out, /1\. Our services/);
    assert.match(out, /data-open-help/);
    assert.doesNotMatch(out, /mailto:support@nurahelp\.com/i);
    assert.doesNotMatch(out, />support@nurahelp\.com</i);
    assert.match(out, /id="nura-product"/);
  });

  it("strips Termly inline colors and sizes so CSS owns the type", () => {
    const raw = `<body>
      <div class="MsoNormal" style="line-height: 1.5;">
        <strong><span style="font-size: 19px;"><h2>13. ADVERTISERS</h2></span></strong>
      </div>
      <div class="MsoNormal" data-custom-class="body_text" style="line-height: 1.5;">
        <span style="font-size:11.0pt;font-family:Arial;color:#595959;background:white;">
          We allow advertisers to display ads.
        </span>
      </div>
      <div id="ip"></div>
    </body>`;
    const out = prepareTermsHtml(raw);
    assert.doesNotMatch(out, /\sstyle=/i);
    assert.doesNotMatch(out, /#595959|font-size:\s*11|Arial|background:\s*white/i);
    assert.match(out, /13\. Advertisers/);
    assert.match(out, /We allow advertisers/);
  });
});
