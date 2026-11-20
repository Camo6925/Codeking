#!/usr/bin/env python3
"""
Wire gauge / voltage drop / fuse sizing check for the S10 standalone headlight system.

Re-run this whenever a load, length or measurement changes:

    python3 tools/wire_calc.py            # print the schedule
    python3 tools/wire_calc.py --csv      # CSV output

Method (documented in docs/s10-headlight/03-circuit-schedules.md):
  * Design current  I_d = P_max / V_min_operating   (constant-power LED drivers draw MORE current at
    low voltage), or the measured steady current at V_min if known.
  * Copper resistance at 20 C from AWG tables, corrected to the conductor design temperature
    (alpha = 0.00393 /C). Default 85 C (engine bay, bundled).
  * Round-trip length = feed length + return length (dedicated return wire, not chassis).
  * Voltage drop limit: 3 % of 13.5 V for lighting, 5 % for signal/coil circuits.
  * Fuse: smallest standard rating >= 1.25 x I_continuous AND >= user inrush minimum, and
    <= the guideline maximum fuse for the conductor (the fuse protects the WIRE).
  * The "max fuse per gauge" table is a conservative engineering guideline for bundled TXL/GXL
    in an engine compartment. Confirm against the wire manufacturer's derating data and the
    terminal/connector ratings before finalizing.

Every input marked ESTIMATE must be replaced with a datasheet or measured value.
"""
import argparse
import csv
import sys

# Ohms per metre at 20 C, solid-equivalent AWG copper (nominal).
OHM_PER_M_20C = {
    22: 0.05296, 20: 0.03331, 18: 0.02095, 16: 0.01317,
    14: 0.008286, 12: 0.005211, 10: 0.003277, 8: 0.002061,
}
# Conservative maximum fuse rating per gauge (guideline, bundled, under hood).
MAX_FUSE_FOR_GAUGE = {22: 5, 20: 7.5, 18: 10, 16: 15, 14: 20, 12: 25, 10: 30, 8: 50}
STD_FUSES = [1, 2, 3, 4, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100]
ALPHA_CU = 0.00393
V_NOM = 13.5

# name, function, P_max_W (or None), I_known_A (or None), V_min, feed_m, return_m,
# vdrop_limit_pct, min_fuse_for_inrush_A, min_gauge (mechanical), status
LOADS = [
    # Projectors: HELLA L4060 "max 20 W" [SECONDARY]; V_min 10 V design point [ESTIMATE].
    ("LO_L", "Left low beam",  20.0, None, 10.0, 1.2, 1.2, 3, 5, 16, "P from HELLA lit.; inrush MEASURE; length ESTIMATE"),
    ("LO_R", "Right low beam", 20.0, None, 10.0, 2.2, 2.2, 3, 5, 16, "P from HELLA lit.; inrush MEASURE; length ESTIMATE"),
    ("HI_L", "Left high beam", 20.0, None, 10.0, 1.2, 1.2, 3, 5, 16, "P ESTIMATE until HELLA data sheet"),
    ("HI_R", "Right high beam", 20.0, None, 10.0, 2.2, 2.2, 3, 5, 16, "P ESTIMATE until HELLA data sheet"),
    # Decorative: budget only, 1.5 A per branch [ESTIMATE] until products chosen (O-4).
    ("HONEY_L", "Left honeycomb (CH1)", None, 1.5, 10.0, 3.0, 3.0, 3, 3, 18, "ESTIMATE budget"),
    ("HONEY_R", "Right honeycomb (CH1)", None, 1.5, 10.0, 3.0, 3.0, 3, 3, 18, "ESTIMATE budget"),
    ("DRL_L", "Left DRL strip (CH2)", None, 1.5, 10.0, 3.0, 3.0, 3, 3, 18, "ESTIMATE budget"),
    ("DRL_R", "Right DRL strip (CH2)", None, 1.5, 10.0, 3.0, 3.0, 3, 3, 18, "ESTIMATE budget"),
    ("AMB_L", "Left amber running (CH3)", None, 1.0, 10.0, 3.0, 3.0, 3, 3, 18, "ESTIMATE budget"),
    ("AMB_R", "Right amber running (CH3)", None, 1.0, 10.0, 3.0, 3.0, 3, 3, 18, "ESTIMATE budget"),
    # LCM feeds
    ("VDECO", "LCM decorative bus (sum of 6 branches)", None, 8.0, 10.0, 2.0, 2.0, 3, 0, 14, "sum of ESTIMATE budgets"),
    ("CTRL", "LCM logic + HMI (latch)", None, 0.6, 10.0, 2.0, 2.0, 3, 0, 18, "HMI 450 mA@5 V VERIFIED; LCM ESTIMATE"),
    ("IGN_SW", "Relay coil bus (8 coils)", None, 1.2, 10.0, 0.5, 0.5, 5, 0, 18, "coil current ESTIMATE ~0.15 A each"),
    ("HMI_5V", "5 V to HMI (from LCM)", None, 0.45, 5.0, 2.0, 2.0, 3, 0, 18, "VERIFIED 450 mA; 3 % of 5 V"),
]


def r_per_m(awg, temp_c):
    return OHM_PER_M_20C[awg] * (1 + ALPHA_CU * (temp_c - 20))


def pick(load, temp_c):
    (name, func, p, i_known, vmin, feed, ret, vd_pct, inrush_min, min_g, status) = load
    i_d = i_known if i_known is not None else p / vmin
    v_ref = 5.0 if name == "HMI_5V" else V_NOM
    vd_limit = v_ref * vd_pct / 100.0
    length = feed + ret
    fuse_min = max(1.25 * i_d, inrush_min)
    fuse = next(f for f in STD_FUSES if f >= fuse_min)
    for awg in sorted(OHM_PER_M_20C, reverse=True):  # thinnest first
        if awg > min_g:
            continue
        vd = i_d * r_per_m(awg, temp_c) * length
        if vd <= vd_limit and MAX_FUSE_FOR_GAUGE[awg] >= fuse:
            return dict(name=name, function=func, I_design_A=round(i_d, 2), awg=awg,
                        round_trip_m=length, vdrop_V=round(vd, 3),
                        vdrop_pct=round(100 * vd / v_ref, 2), fuse_A=fuse,
                        wire_max_fuse_A=MAX_FUSE_FOR_GAUGE[awg], status=status)
    raise SystemExit(f"No gauge satisfies {name}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--temp", type=float, default=85.0, help="conductor design temperature C")
    ap.add_argument("--csv", action="store_true")
    a = ap.parse_args()
    rows = [pick(l, a.temp) for l in LOADS]
    if a.csv:
        w = csv.DictWriter(sys.stdout, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
        return
    print(f"Conductor temperature {a.temp:.0f} C — ALL VALUES PROVISIONAL until loads are measured\n")
    hdr = f"{'Circuit':8} {'I_d A':>6} {'AWG':>4} {'RT m':>5} {'Vd V':>6} {'Vd %':>5} {'Fuse':>5} {'WireMax':>7}  Status"
    print(hdr)
    print("-" * len(hdr))
    for r in rows:
        print(f"{r['name']:8} {r['I_design_A']:6.2f} {r['awg']:4d} {r['round_trip_m']:5.1f} "
              f"{r['vdrop_V']:6.3f} {r['vdrop_pct']:5.2f} {r['fuse_A']:5} {r['wire_max_fuse_A']:7}  {r['status']}")
    proj = sum(r["I_design_A"] for r in rows if r["name"][:2] in ("LO", "HI"))
    deco = next(r["I_design_A"] for r in rows if r["name"] == "VDECO")
    ctrl = next(r["I_design_A"] for r in rows if r["name"] == "CTRL")
    coils = next(r["I_design_A"] for r in rows if r["name"] == "IGN_SW")
    total = proj + deco + ctrl + coils
    print(f"\nMain feed design current (all on, high beam, V_min): {total:.1f} A")
    fm = next(f for f in STD_FUSES if f >= 1.25 * total)
    g = max((g for g, m in MAX_FUSE_FOR_GAUGE.items() if m >= fm), default=None)
    print(f"Main fuse (>= 1.25 x I): {fm} A minimum -> conductor guideline: {g} AWG or heavier")
    print("Inrush allowances (5 A projector, 3 A decorative minimum fuse) are ESTIMATES until scoped.")


if __name__ == "__main__":
    main()
