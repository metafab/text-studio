type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    platform?: string
  }
}

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const nav = navigator as NavigatorWithUserAgentData
  const platform = nav.userAgentData?.platform ?? nav.platform
  if (platform) {
    return platform.toLowerCase().includes('mac')
  }

  return /mac os x/i.test(nav.userAgent)
}
