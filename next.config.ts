import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? '/GYM' : '',
  assetPrefix: isProd ? '/GYM/' : '',
}
export default nextConfig
