/** PROTOTYPE — in-memory fixtures only. */

export const PROTO_DISPLAY_NAME = "FinalsFan";
export const PROTO_PUBLIC_LINK = `/p/${PROTO_DISPLAY_NAME}`;

export type ProtoEntry = {
  id: string;
  rs: number;
  recordedAt: string;
};

export const PROTO_POPULATED_ENTRIES: ProtoEntry[] = [
  { id: "e1", rs: 42_100, recordedAt: "2026-07-18T18:12:00.000Z" },
  { id: "e2", rs: 42_480, recordedAt: "2026-07-19T21:05:00.000Z" },
  { id: "e3", rs: 42_310, recordedAt: "2026-07-20T11:40:00.000Z" },
];

export const PROTO_SCREENS = [
  { key: "settings", name: "Settings" },
  { key: "populated", name: "Populated" },
  { key: "empty", name: "Empty" },
  { key: "unavailable", name: "Unavailable" },
] as const;

export type ProtoScreen = (typeof PROTO_SCREENS)[number]["key"];

export function isProtoScreen(value: string): value is ProtoScreen {
  return PROTO_SCREENS.some((screen) => screen.key === value);
}
