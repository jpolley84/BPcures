// _challenge-vip-cap.js — ONE number for the VIP room size.
//
// 2026-09-14 (Joel, 8:02 PM CT): "i only have 9 more vip spots left". The
// roster held 5 at that moment, so the cap is 14. Every VIP now also gets a
// 1:1 hour with Joel, which is why the room cannot grow: the seats are
// bounded by his calendar, not by Zoom.
//
// Read by: create-embedded-checkout.js (cmlc-97-vip), challenge-vip-charge.js
// (+$100 upsell), challenge-vip-seats.js (the public "N left" count).
export const VIP_SEAT_CAP = 14;
export const VIP_ROSTER_KEY = 'challenge:2026-09-22:vip';
