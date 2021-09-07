declare module 'ip-bigint' {
  export interface IPv4 {
    version: 4
    number: bigint
  }

  export interface IPv6 {
    version: 6
    number: bigint
    ipv4mapped?: true
    scopeid?: string
  }

  export type IP = IPv4 | IPv6

  export function parse(ip: string): IP
}
