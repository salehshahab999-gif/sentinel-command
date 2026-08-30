import type {
  ConnectivityTarget,
} from "./connectivity-types";

export const CONNECTIVITY_REGISTRY: ConnectivityTarget[] = [
  {
    id: "GLOBAL-CLOUDFLARE",
    name: "Cloudflare Global",
    scope: "GLOBAL",
    probeType: "TCP",
    host: "1.1.1.1",
    port: 443,
    priority: 1,
    enabled: true,
  },
  {
    id: "GLOBAL-GOOGLE",
    name: "Google Global",
    scope: "GLOBAL",
    probeType: "TCP",
    host: "8.8.8.8",
    port: 443,
    priority: 2,
    enabled: true,
  },
  {
    id: "DOMESTIC-DNS-1",
    name: "Iran DNS 1",
    scope: "DOMESTIC",
    probeType: "DNS",
    host: "217.218.127.127",
    port: 53,
    dnsName: "example.com",
    priority: 1,
    enabled: true,
  },
  {
    id: "DOMESTIC-DNS-2",
    name: "Iran DNS 2",
    scope: "DOMESTIC",
    probeType: "DNS",
    host: "5.200.200.200",
    port: 53,
    dnsName: "example.com",
    priority: 2,
    enabled: true,
  },
];