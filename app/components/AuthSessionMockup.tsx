/**
 * Decorative right-pane mockup for auth: flat ball sweeping edge ↔ edge,
 * plus calm supporting copy so the pane isn’t empty.
 * Pure CSS motion; respects reduced-motion.
 */
export function AuthSessionMockup() {
  return (
    <div className="auth-visual">
      <div className="auth-visual-atmosphere" aria-hidden="true" />
      <div className="auth-visual-stack">
        <div className="auth-visual-device" aria-hidden="true">
          <div className="auth-visual-chrome">
            <span className="auth-visual-dots" />
          </div>
          <div className="auth-visual-stage">
            <div className="auth-visual-track">
              <span className="auth-visual-ball" />
            </div>
          </div>
        </div>
        <div className="auth-visual-copy">
          <p className="auth-visual-kicker">EMDR Support</p>
          <p className="auth-visual-title">A quiet rhythm — left, then right</p>
          <p className="auth-visual-lead">
            Settle in. The ball moves at your pace.
          </p>
        </div>
      </div>
    </div>
  );
}
