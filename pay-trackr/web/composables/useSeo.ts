interface SeoOptions {
  title: string
  description: string
  path: string
  noindex?: boolean
}

const SITE_URL = 'https://paytrackr.wiseutils.com'
const SITE_NAME = 'PayTrackr'
const DEFAULT_IMAGE = `${SITE_URL}/img/new-logo.png`

export const useSeo = ({ title, description, path, noindex = false }: SeoOptions) => {
  const canonicalUrl = `${SITE_URL}${path}`

  useHead({
    title,
    link: [{ rel: 'canonical', href: canonicalUrl }],
    meta: noindex ? [{ name: 'robots', content: 'noindex, nofollow' }] : [],
  })

  useSeoMeta({
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl,
    ogImage: DEFAULT_IMAGE,
    ogType: 'website',
    ogSiteName: SITE_NAME,
    twitterCard: 'summary',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: DEFAULT_IMAGE,
  })
}
