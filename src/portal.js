// Production: this portal lives on the website domain at /<role>/admin/<id>/
// (e.g. /state-manager/callcenter/USR-1004/) and signs in through the website's
// common login (/login?type=admin). Its assets and API are served from
// /apps/admin/ (nginx). In development it still runs at / as before.
export const PORTAL = 'admin'
const LOGIN_TYPE = 'admin'
/** Path segment in place of the user id for pages that need no sign-in (reset password). */
export const PUBLIC_ID = 'account'
export const ON_SITE = import.meta.env.PROD

const match = window.location.pathname.match(new RegExp(`^/([^/]+)/${PORTAL}/([^/]+)`))

/** React Router basename: "/<role>/admin/<id>" in production, "" in development. */
export const BASENAME = ON_SITE && match ? `/${match[1]}/${PORTAL}/${match[2]}` : ''

export const portalBase = (role, id) => `/${encodeURIComponent(role)}/${PORTAL}/${encodeURIComponent(id)}`

/** The sign-in page: the website's common login in production. */
export const loginUrl = ({ expired = false } = {}) =>
    ON_SITE ? `/login?type=${LOGIN_TYPE}${expired ? '&expired=1' : ''}` : `/login${expired ? '?expired=1' : ''}`

/**
 * Runs before the app renders. `who` = { role, id } of the stored session, or null.
 * Sends the browser to the common login (signed out) or to the URL of this
 * user (wrong role / id in the address). Returns false while navigating away.
 */
export function enterPortal(who, landing = '/') {
    if (!ON_SITE || match?.[2] === PUBLIC_ID) return true
    if (!who) {
        window.location.replace(loginUrl())
        return false
    }
    const want = portalBase(who.role, who.id)
    if (BASENAME === want) return true
    window.location.replace(`${want}${landing}`)
    return false
}
