#!/usr/bin/env python3
"""
Wire / fuse / voltage-drop verification for the S10 standalone headlight system (Rev B).

    python3 tools/wire_calc.py          # report
    python3 tools/wire_calc.py --csv    # conductor table as CSV

Rev B topology: every headlight is a single home-run harness with ONE 12-way connector at the lamp,
running back to the Power Distribution & Control Center (PDCC) under the driver-side dash.
Projector and decorative circuits each share one return conductor per headlight.

Method
  * Design current = P_max / V_min (constant-power LED drivers draw more at low voltage),
    or a measured/budget current.
  * Copper resistance from AWG tables at 20 C, corrected to the conductor temperature
    (alpha = 0.00393/C; default 85 C).
  * Feed conductors: fuse = smallest standard rating >= max(1.25 x I, inrush allowance); the fuse
    must not exceed the guideline maximum fuse for the gauge (the fuse protects the wire).
  * Unfused return conductors: worst-case current must be <= 80 % of the gauge's guideline maximum.
  * Voltage drop: each branch (feed + its return) <= 3 % of 13.5 V; battery-to-lamp total
    (main feed + main ground + branch) <= 5 %.
  * The per-gauge maximum-fuse table is a conservative engineering guideline for bundled TXL/GXL.
    Confirm against the wire maker's derating data and connector contact ratings.
Inputs tagged ESTIMATE must be replaced by datasheet or measured values before finalizing.
"""
import argparse, csv, sys

OHM_PER_M_20C = {22: 0.05296, 20: 0.03331, 18: 0.02095, 16: 0.01317,
                 14: 0.008286, 12: 0.005211, 10: 0.003277, 8: 0.002061}
MAX_FUSE_FOR_GAUGE = {22: 5, 20: 7.5, 18: 10, 16: 15, 14: 20, 12: 25, 10: 30, 8: 50}
STD_FUSES = [1, 2, 3, 4, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100]
V_NOM = 13.5
BRANCH_LIMIT, TOTAL_LIMIT = 0.03, 0.05

# ---- lengths (one way, metres) — ESTIMATE until measured on the truck ----
L_MAIN = 2.0        # battery -> FM -> firewall -> PDCC (driver-side dash)
L_HL_L = 2.5        # PDCC -> left headlamp connector
L_HL_R = 3.5        # PDCC -> right headlamp connector

# ---- loads ----
PRJ = 20.0 / 10.0   # HELLA L4060 "max 20 W" [SECONDARY] at 10 V design minimum = 2.0 A
HONEY, DRL, AMB_PARK = 1.5, 1.5, 1.0     # ESTIMATE budgets (O-4)
AMB_TURN, MARKER, AUX = 1.0, 0.5, 0.5     # ESTIMATE (turn is factory-flasher powered)
DECO_RTN = HONEY + DRL + AMB_PARK + AMB_TURN + MARKER + AUX
COILS = 9 * 0.15                          # ESTIMATE, take from relay datasheet
CTRL = 0.6                                # HMI 450 mA @5 V VERIFIED + LCM ESTIMATE
VDECO = 2 * (HONEY + DRL + AMB_PARK + AUX)

# conductor: name, awg, current, length, kind('feed'|'return'), inrush_min_fuse, note
CONDUCTORS = [
    ("MAIN+",        8,  None, L_MAIN, "feed",   0, "battery -> FM -> PDCC"),
    ("MAIN-",        8,  None, L_MAIN, "return", 0, "PDCC ground stud -> battery -"),
    ("LO_L",        16,  PRJ,  L_HL_L, "feed",   5, "inrush allowance ESTIMATE"),
    ("HI_L",        16,  PRJ,  L_HL_L, "feed",   5, ""),
    ("PRJ_RTN_L",   16,  2*PRJ, L_HL_L, "return", 0, "low+high shared return"),
    ("LO_R",        16,  PRJ,  L_HL_R, "feed",   5, ""),
    ("HI_R",        16,  PRJ,  L_HL_R, "feed",   5, ""),
    ("PRJ_RTN_R",   16,  2*PRJ, L_HL_R, "return", 0, ""),
    ("HONEY_L",     18,  HONEY, L_HL_L, "feed",  3, ""),
    ("DRL_L",       18,  DRL,  L_HL_L, "feed",   3, ""),
    ("AMB_PARK_L",  18,  AMB_PARK, L_HL_L, "feed", 3, ""),
    ("MARKER_L",    18,  MARKER, L_HL_L, "feed", 2, ""),
    ("AUX_L",       18,  AUX,  L_HL_L, "feed",   3, ""),
    ("DECO_RTN_L",  14,  DECO_RTN, L_HL_L, "return", 0, "all decorative/amber/marker/aux returns"),
    ("HONEY_R",     18,  HONEY, L_HL_R, "feed",  3, ""),
    ("DRL_R",       18,  DRL,  L_HL_R, "feed",   3, ""),
    ("AMB_PARK_R",  18,  AMB_PARK, L_HL_R, "feed", 3, ""),
    ("MARKER_R",    18,  MARKER, L_HL_R, "feed", 2, ""),
    ("AUX_R",       18,  AUX,  L_HL_R, "feed",   3, ""),
    ("DECO_RTN_R",  14,  DECO_RTN, L_HL_R, "return", 0, ""),
]
# branch paths: (name, feed conductor, return conductor)
PATHS = [("LO_R", "LO_R", "PRJ_RTN_R"), ("HI_R", "HI_R", "PRJ_RTN_R"),
         ("LO_L", "LO_L", "PRJ_RTN_L"), ("HONEY_R", "HONEY_R", "DECO_RTN_R"),
         ("DRL_R", "DRL_R", "DECO_RTN_R"), ("AMB_PARK_R", "AMB_PARK_R", "DECO_RTN_R"),
         ("MARKER_R", "MARKER_R", "DECO_RTN_R")]


def r(awg, t):
    return OHM_PER_M_20C[awg] * (1 + 0.00393 * (t - 20))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--temp", type=float, default=85.0)
    ap.add_argument("--csv", action="store_true")
    a = ap.parse_args()

    main_i = 4 * PRJ + VDECO + CTRL + COILS + 2 * MARKER
    rows, ok = {}, True
    for name, awg, i, length, kind, inrush, note in CONDUCTORS:
        i = main_i if i is None else i
        vd = i * r(awg, a.temp) * length
        if kind == "feed":
            fuse = next(f for f in STD_FUSES if f >= max(1.25 * i, inrush))
            good = fuse <= MAX_FUSE_FOR_GAUGE[awg]
        else:
            fuse = None
            good = i <= 0.8 * MAX_FUSE_FOR_GAUGE[awg]
        ok &= good
        rows[name] = dict(name=name, awg=awg, I_A=round(i, 2), len_m=length, vdrop_V=round(vd, 3),
                          fuse_A=fuse if fuse else "-", wire_max_fuse_A=MAX_FUSE_FOR_GAUGE[awg],
                          check="OK" if good else "UPSIZE", note=note)
    if a.csv:
        w = csv.DictWriter(sys.stdout, fieldnames=list(next(iter(rows.values()))))
        w.writeheader(); w.writerows(rows.values()); return

    print(f"Conductor temp {a.temp:.0f} C. ALL VALUES PROVISIONAL (lengths and decorative loads are ESTIMATES)\n")
    print(f"{'Conductor':12} {'AWG':>3} {'I A':>6} {'L m':>4} {'Vd V':>6} {'Fuse':>5} {'Max':>4}  Check")
    for x in rows.values():
        print(f"{x['name']:12} {x['awg']:3d} {x['I_A']:6.2f} {x['len_m']:4.1f} {x['vdrop_V']:6.3f} "
              f"{str(x['fuse_A']):>5} {x['wire_max_fuse_A']:4}  {x['check']}  {x['note']}")
    main_vd = rows["MAIN+"]["vdrop_V"] + rows["MAIN-"]["vdrop_V"]
    print(f"\nMain feed current (all on, high beam, 10 V): {main_i:.1f} A -> FM "
          f"{next(f for f in STD_FUSES if f >= 1.25 * main_i)} A min; main round-trip drop {main_vd:.3f} V")
    print(f"\n{'Path':12} {'Branch V':>8} {'Branch %':>8} {'Total %':>8}  Check")
    for name, fd, rt in PATHS:
        b = rows[fd]["vdrop_V"] + rows[rt]["vdrop_V"]
        tot = b + main_vd
        good = b <= BRANCH_LIMIT * V_NOM and tot <= TOTAL_LIMIT * V_NOM
        ok &= good
        print(f"{name:12} {b:8.3f} {100*b/V_NOM:8.2f} {100*tot/V_NOM:8.2f}  {'OK' if good else 'FAIL'}")
    print("\nRESULT:", "all checks pass" if ok else "one or more checks FAIL — upsize flagged conductors")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
