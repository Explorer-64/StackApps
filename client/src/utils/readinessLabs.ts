export type ReadinessLabField =
  | 'scan_lab_llms_full'
  | 'scan_lab_openapi'
  | 'scan_lab_webmcp'
  | 'scan_lab_ap2_ucp_hint'
  | 'scan_lab_verifiable_intent_hint';

export const READINESS_LAB_CHECKS: Array<{
  label: string;
  field: ReadinessLabField;
  note: string;
}> = [
  {
    label: 'llms-full.txt',
    field: 'scan_lab_llms_full',
    note: 'Optional deep context file (labs). Not a public tier requirement yet.',
  },
  {
    label: 'OpenAPI / Swagger',
    field: 'scan_lab_openapi',
    note: 'Common machine-readable API map paths we probe (labs).',
  },
  {
    label: 'WebMCP signal',
    field: 'scan_lab_webmcp',
    note: 'Heuristic: /.well-known/mcp, or “webmcp” / MCP link patterns (labs).',
  },
  {
    label: 'AP2 / UCP (keyword)',
    field: 'scan_lab_ap2_ucp_hint',
    note: 'Weak text hint in page + llms/blueprint — not a protocol proof (labs).',
  },
  {
    label: 'Verifiable intent (keyword)',
    field: 'scan_lab_verifiable_intent_hint',
    note: 'Weak text hint for agent trust wording — not a crypto check (labs).',
  },
];
