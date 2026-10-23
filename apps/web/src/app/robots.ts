import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/superadmin/',
          '/api/',
          '/overview/',
          '/reports/',
          '/my-teams/',
        ],
      },
    ],
    sitemap: 'https://app.tracmatrix.com/sitemap.xml',
  }
}
