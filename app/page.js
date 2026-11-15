import Link from "next/link";

function OdysseyShip() {
  return (
    <svg
      viewBox="0 0 600 460"
      className="od-ship"
      role="img"
      aria-label="An ancient sailing ship heading toward a new horizon"
    >
      <circle
        cx="300"
        cy="210"
        r="174"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".16"
      />

      <circle
        cx="300"
        cy="210"
        r="151"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".2"
        strokeDasharray="3 12"
      />

      <path
        d="M300 20v25 M300 375v25 M110 210h25 M465 210h25"
        stroke="currentColor"
        strokeWidth="2"
        opacity=".4"
      />

      <text x="300" y="11" textAnchor="middle" fill="currentColor">
        N
      </text>

      <path
        d="M120 310 Q300 350 490 285 Q470 368 306 376 Q166 366 120 310Z"
        fill="currentColor"
      />

      <path
        d="M118 310 L94 281 M490 285 L507 248 L522 253"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />

      <path
        d="M149 335 Q315 377 470 314"
        fill="none"
        stroke="#e9dfc9"
        strokeWidth="3"
      />

      <path
        d="M304 101V326"
        stroke="currentColor"
        strokeWidth="7"
      />

      <path
        d="M304 105V69L354 85Z"
        fill="currentColor"
      />

      <path
        d="M206 133H395 Q370 199 401 263H201 Q237 198 206 133Z"
        fill="currentColor"
      />

      <path
        d="M216 141 Q245 198 214 253 M385 141 Q358 198 387 253"
        fill="none"
        stroke="#e9dfc9"
        strokeWidth="2"
      />

      <path
        d="M304 166L330 197L304 228L278 197Z"
        fill="none"
        stroke="#c6a76b"
        strokeWidth="3"
      />

      <path
        d="M304 183L316 197L304 211L292 197Z"
        fill="#c6a76b"
      />

      {[190, 235, 280, 325, 370, 415].map((x) => (
        <g key={x}>
          <circle cx={x} cy="288" r="7" fill="currentColor" />

          <path
            d={`M${x} 300l-5 18h16l-5-18Z`}
            fill="currentColor"
          />

          <path
            d={`M${x + 6} 317l-36 70`}
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      ))}

      <path
        d="M61 407 Q112 386 164 407 T267 407 T370 407 T473 407 T576 407"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity=".4"
      />

      <path
        d="M94 429 Q145 408 197 429 T300 429 T403 429 T506 429"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity=".2"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="od-home">
      <section className="od-hero">
        <div className="od-story">
          <p className="od-eyebrow">
            A NEW GENERATION. AN UNCHARTED HORIZON.
          </p>

          <h1>
            Every legend
            <br />
            starts with
            <br />
            <em>a voyage.</em>
          </h1>

          <p className="od-intro">
            The next great creator is still undiscovered.
            Assemble a crew of four rising talents each week,
            follow their journey, and prove you saw
            greatness before the world did.
          </p>

          <div className="od-actions">
            <Link href="/draft" className="od-button">
              Assemble your crew <span>↗</span>
            </Link>

            <Link href="/watchlist" className="od-text-link">
              Explore the horizon →
            </Link>
          </div>

          <div className="od-facts">
            <div>
              <strong>04</strong>
              <span>CREATORS</span>
            </div>

            <div>
              <strong>$50</strong>
              <span>WEEKLY BUDGET</span>
            </div>

            <div>
              <strong>01</strong>
              <span>GREAT ODYSSEY</span>
            </div>
          </div>
        </div>

        <div className="od-art">
          <span className="od-art-top">
            EXPEDITION I / THE NEXT WAVE
          </span>

          <OdysseyShip />

          <p className="od-art-caption">
            Find the stars.
            <br />
            <em>Before they become constellations.</em>
          </p>
        </div>
      </section>

      <section className="od-playbook">
        <div className="od-section-heading">
          <p className="od-eyebrow">YOUR CHART TO GREATNESS</p>
          <h2>Three steps. A thousand possibilities.</h2>
        </div>

        <div className="od-step-grid">
          <article>
            <span className="od-number">I</span>
            <h3>Choose your crew</h3>
            <p>
              Discover emerging gaming creators. Draft four
              with $50 each week. Changes cost $5.
            </p>
          </article>

          <article>
            <span className="od-number">II</span>
            <h3>Navigate their rise</h3>
            <p>
              Follow your creators’ momentum. Measured
              YouTube growth adds points to your squad.
            </p>
          </article>

          <article>
            <span className="od-number">III</span>
            <h3>Build your legacy</h3>
            <p>
              Top 3 scouts each week earn bonus points. Back
              the month’s top streamers to win a meet and
              greet, merch or a shoutout.
            </p>
          </article>
        </div>
      </section>

      <p className="od-disclaimer">
        Hackathon prototype. Starter creators are fictional.
        Participation does not guarantee FaZe scouting or signing.
      </p>

      <div className="od-ocean" aria-hidden="true">
        <svg viewBox="0 0 1440 150" preserveAspectRatio="none">
          <path
            d="M0 65 Q180 10 360 65 T720 65 T1080 65 T1440 65 V150 H0Z"
            fill="#638594"
            opacity=".35"
          />
          <path
            d="M0 85 Q180 140 360 85 T720 85 T1080 85 T1440 85 V150 H0Z"
            fill="#315a71"
            opacity=".6"
          />
          <path
            d="M0 112 Q180 60 360 112 T720 112 T1080 112 T1440 112 V150 H0Z"
            fill="#10364c"
          />
        </svg>
      </div>
    </div>
  );
}