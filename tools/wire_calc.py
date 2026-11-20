#!/usr/bin/env python3
"""
Wire / fuse / voltage-drop verification for the S10 standalone headlight system (Rev D).

    python3 tools/wire_calc.py                                  # defaults (estimates)
    python3 tools/wire_calc.py --main 0.6 --left 1.3 --right 2.3 --trunk 2.2   # as-built lengths
    python3 tools/wire_calc.py --csv

Rev D topology
  Battery (top post) -> 30 A MRBF on the post -> MAIN -> independent Fuse/Relay Box (FRB, under hood)
  FRB -> one 12-way home-run harness per headlamp (all lamp power is fused in the FRB)
  FRB <-> Lighting Control Module (LCM, in cab) via trunk T1: VDECO out to the LCM, 8 PWM outputs back
  into FRB branch fuses, then to the headlamps. Decorative feed path = trunk + headlamp run.
  Turn lamps: FRB F10 (always hot) -> Turn Interface Module (in FRB) -> headlamp pin 7.

Method: design current = P/V_min or measured/budget; Cu resistance at 85 C; feed fuse >= max(1.25 I,
inrush) and <= guideline max fuse for the gauge; unfused returns <= 80 % of the guideline; branch
(feed + return) <= 3 %, battery-to-lamp total <= 5 %. The per-gauge table is a conservative guideline
for bundled TXL/GXL; confirm against the wire maker's derating data and contact ratings.
"""
import argparse, csv, sys

OHM_PER_M_20C = {22: 0.05296, 20: 0.03331, 18: 0.02095, 16: 0.01317,
                 14: 0.008286, 12: 0.005211, 10: 0.003277, 8: 0.002061}
MAX_FUSE_FOR_GAUGE = {22: 5, 20: 7.5, 18: 10, 16: 15, 14: 20, 12: 25, 10: 30, 8: 50}
STD_FUSES = [1, 2, 3, 4, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100]
V_NOM, BRANCH_LIMIT, TOTAL_LIMIT = 13.5, 0.03, 0.05

PRJ = 20.0 / 10.0          # HELLA L4060 max 20 W [SECONDARY] at 10 V
HONEY = DRL = 0.75         # FlexLight 50 cm: not published; ~5 W typical for 200 lm COB -> 2x margin budget. MEASURE
AMB_RUN = 0.03             # Diode Dynamics SS3 backlight 0.03 A @12.8 V [VERIFIED, DD info guide]
AMB_TURN = 1.1             # Diode Dynamics SS3 Sport main beam 1.1 A @12.8 V [VERIFIED]
AUX = 0.5                  # optional housing fan, budget
COILS = 7 * 0.15           # 7 relays, ESTIMATE
CTRL = 0.6                 # HMI 450 mA @5 V [VERIFIED] + LCM ESTIMATE
DECO_RTN = HONEY + DRL + AMB_RUN + AMB_TURN + AUX
VDECO = 2 * (HONEY + DRL + AMB_RUN + AUX)


def r(awg, t):
    return OHM_PER_M_20C[awg] * (1 + 0.00393 * (t - 20))


def conductors(m, l, rr, tr):
    main_i = 4 * PRJ + VDECO + CTRL + COILS + 2 * AMB_TURN
    C = [("MAIN+", 10, main_i, m, "feed", 0), ("MAIN-", 10, main_i, m, "return", 0),
         ("VDECO", 14, VDECO, tr, "feed", 0), ("LCM_PGND", 14, VDECO, tr, "return", 0)]
    for side, L in (("L", l), ("R", rr)):
        C += [(f"LO_{side}", 16, PRJ, L, "feed", 5), (f"HI_{side}", 16, PRJ, L, "feed", 5),
              (f"PRJ_RTN_{side}", 16, 2 * PRJ, L, "return", 0),
              (f"HONEY_T_{side}", 18, HONEY, tr, "trunk", 0), (f"HONEY_{side}", 18, HONEY, L, "feed", 3),
              (f"DRL_T_{side}", 18, DRL, tr, "trunk", 0), (f"DRL_{side}", 18, DRL, L, "feed", 3),
              (f"AMB_RUN_T_{side}", 18, AMB_RUN, tr, "trunk", 0), (f"AMB_RUN_{side}", 18, AMB_RUN, L, "feed", 2),
              (f"TURN_{side}", 18, AMB_TURN, L, "feed", 3),
              (f"DECO_RTN_{side}", 14, DECO_RTN, L, "return", 0)]
    return main_i, C


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--temp", type=float, default=85.0)
    ap.add_argument("--main", type=float, default=0.6, help="battery -> FRB, one way, m")
    ap.add_argument("--left", type=float, default=1.3, help="FRB -> left headlamp, m")
    ap.add_argument("--right", type=float, default=2.3, help="FRB -> right headlamp, m")
    ap.add_argument("--trunk", type=float, default=2.2, help="FRB -> LCM (cab), m")
    ap.add_argument("--csv", action="store_true")
    a = ap.parse_args()
    main_i, C = conductors(a.main, a.left, a.right, a.trunk)
    rows, ok = {}, True
    for name, awg, i, length, kind, inrush in C:
        vd = i * r(awg, a.temp) * length
        if kind == "feed":
            fuse = next(f for f in STD_FUSES if f >= max(1.25 * i, inrush))
            good = fuse <= MAX_FUSE_FOR_GAUGE[awg]
        elif kind == "trunk":       # LCM output -> FRB fuse; protected upstream by F5 (10 A) + PROFET
            fuse, good = "F5", 10 <= MAX_FUSE_FOR_GAUGE[awg]
        else:
            fuse, good = "-", i <= 0.8 * MAX_FUSE_FOR_GAUGE[awg]
        ok &= good
        rows[name] = dict(name=name, awg=awg, I_A=round(i, 2), len_m=length, vdrop_V=round(vd, 3),
                          fuse=fuse, check="OK" if good else "UPSIZE")
    if a.csv:
        w = csv.DictWriter(sys.stdout, fieldnames=list(next(iter(rows.values()))))
        w.writeheader(); w.writerows(rows.values()); return
    print(f"Rev D. {a.temp:.0f} C. main {a.main} m, left {a.left} m, right {a.right} m, trunk {a.trunk} m. PROVISIONAL\n")
    print(f"{'Conductor':13} {'AWG':>3} {'I A':>6} {'L m':>4} {'Vd V':>6} {'Fuse':>5}  Check")
    for x in rows.values():
        print(f"{x['name']:13} {x['awg']:3d} {x['I_A']:6.2f} {x['len_m']:4.1f} {x['vdrop_V']:6.3f} {str(x['fuse']):>5}  {x['check']}")
    mvd = rows["MAIN+"]["vdrop_V"] + rows["MAIN-"]["vdrop_V"]
    dvd = rows["VDECO"]["vdrop_V"] + rows["LCM_PGND"]["vdrop_V"]
    print(f"\nMain {main_i:.1f} A -> FM >= {next(f for f in STD_FUSES if f >= 1.25 * main_i)} A; "
          f"main drop {mvd:.3f} V; VDECO/PGND trunk drop {dvd:.3f} V")
    paths = []
    for s in ("L", "R"):
        for p in ("LO", "HI"):
            paths.append((f"{p}_{s}", [f"{p}_{s}", f"PRJ_RTN_{s}"], 0))
        for p in ("HONEY", "DRL", "AMB_RUN"):
            paths.append((f"{p}_{s}", [f"{p}_T_{s}", f"{p}_{s}", f"DECO_RTN_{s}"], dvd))
        paths.append((f"TURN_{s}", [f"TURN_{s}", f"DECO_RTN_{s}"], 0))
    print(f"\n{'Path':10} {'Branch %':>8} {'Total %':>8}  Check")
    for name, segs, extra in paths:
        b = sum(rows[x]["vdrop_V"] for x in segs) + extra
        tot = b + mvd
        good = b <= BRANCH_LIMIT * V_NOM and tot <= TOTAL_LIMIT * V_NOM
        ok &= good
        print(f"{name:10} {100*b/V_NOM:8.2f} {100*tot/V_NOM:8.2f}  {'OK' if good else 'FAIL'}")
    print("\nRESULT:", "all checks pass" if ok else "one or more checks FAIL — upsize flagged conductors")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
