/**
 * Shared domain-change confirmation message — the `content` of every module's domain-change
 * confirm/info dialog (Gateways, Destinations, Outbound Routes, Announcements, Call Block, Call
 * Center Queue, Call Center Agent). Centralized here per CLAUDE.md's "a component/hook/utility
 * only moves into a shared location once genuinely used by more than one module" — this one is
 * used by seven, so it belongs in `components/common/` rather than being duplicated per module.
 *
 * Text content matches the project's specified wording exactly. The Axion reference implementation
 * this is derived from applies a `text-900 fs-9` className, which is a Bootstrap-style utility
 * class from Axion's own CSS setup — not present in this codebase (Ant Design is the only UI
 * framework here, see README's Dependency Policy), so it's intentionally omitted rather than
 * carried over as a dead/no-op class name.
 */
export const domainChangeMessage = () => (
  <p>
    <strong>Please note:</strong> Once you update the context, any pre-selected values will be
    reset. Kindly make sure to re-select them after the update.
  </p>
)

export default domainChangeMessage
