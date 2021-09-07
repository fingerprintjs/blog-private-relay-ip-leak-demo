import { parse as parseIp } from 'ip-bigint'
import binarySearch from 'binary-search'

export interface IPRange {
  startIp: bigint
  subnetBits: number
}

export type IPRangeCache = {
  /** Sorted in ascending order */
  v4: IPRange[]
  /** Sorted in ascending order */
  v6: IPRange[]
}

function parseIpRange(rawIpRange: string): [4 | 6, IPRange] | undefined {
  try {
    const [, rawIp, , subnetString] = /^(.*?)(\/(\d*))?$/.exec(rawIpRange) || ['', '']
    const ipData = parseIp(rawIp)

    if (ipData.version === 4) {
      return [
        4,
        {
          startIp: ipData.number,
          subnetBits: 32 - Number(subnetString || 32),
        },
      ]
    }

    if (ipData.ipv4mapped) {
      return [
        4,
        {
          startIp: ipData.number & 0xffffffffn,
          subnetBits: 128 - Number(subnetString || 128),
        },
      ]
    }

    return [
      6,
      {
        startIp: ipData.number,
        subnetBits: 128 - Number(subnetString || 128),
      },
    ]
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid IP address: ')) {
      return undefined
    }
    throw error
  }
}

function compareIpRanges(range1: IPRange, range2: IPRange): number {
  return Number(range1.startIp - range2.startIp)
}

export async function parseIpRanges(rawIpRanges: AsyncIterable<string>): Promise<IPRangeCache> {
  const ipV4Ranges: IPRange[] = []
  const ipV6Ranges: IPRange[] = []

  for await (const rawIpRange of rawIpRanges) {
    const ipRangeData = parseIpRange(rawIpRange)
    if (ipRangeData) {
      const ipRanges = ipRangeData[0] === 4 ? ipV4Ranges : ipV6Ranges
      ipRanges.push(ipRangeData[1])
    }
  }

  return {
    v4: ipV4Ranges.sort(compareIpRanges),
    v6: ipV6Ranges.sort(compareIpRanges),
  }
}

/**
 * Finds the closest IP range that contains the IP or stands on the left of the IP.
 * The list of IP ranges must be in ascending order.
 */
function findClosestIpRange(ipRanges: IPRange[], ip: bigint): IPRange | undefined {
  const index = binarySearch(ipRanges, ip, ({ startIp }, needleIp) => Number(startIp - needleIp))
  if (index >= 0) {
    return ipRanges[index]
  }
  if (index === -1) {
    return undefined
  }
  return ipRanges[-index - 2]
}

function isIpInRange(ipRange: IPRange, ip: bigint): boolean {
  if (ip < ipRange.startIp) {
    return false
  }
  return ip < ipRange.startIp + BigInt(2) ** BigInt(ipRange.subnetBits)
}

export function isIpInRanges(ipRangeCache: IPRangeCache, rawIp: string): boolean {
  let ipRanges: IPRange[]
  let ipNumber: bigint
  const ipData = parseIp(rawIp)

  if (ipData.version === 4) {
    ipRanges = ipRangeCache.v4
    ipNumber = ipData.number
  } else if (ipData.ipv4mapped) {
    ipRanges = ipRangeCache.v4
    ipNumber = ipData.number & 0xffffffffn
  } else {
    ipRanges = ipRangeCache.v6
    ipNumber = ipData.number
  }

  const closestRange = findClosestIpRange(ipRanges, ipNumber)
  return !!closestRange && isIpInRange(closestRange, ipNumber)
}
