#!/usr/bin/env python3
"""
Wire / fuse / voltage-drop verification for the S10 standalone headlight system (Rev E, paired branches).

    python3 tools/wire_calc.py
    python3 tools/wire_calc.py --main 0.6 --left 1.3 --right 2.3 --trunk 2.2      # as-built lengths
    python3 tools/wire_calc.py --csv

Rev E signal/output flow (owner's model):
  3.5" control screen --CAN--> Control Module (cab) --one output per PAIR--> standalone Fuse Box
  (one fuse per PAIR, split to left/right after the fuse) --> one 12-way connector per headlight.
Power source: Battery -> 30 A MRBF on post -> Fuse Box; the Fuse Box also feeds the Control Module.
Turn signals are the only per-side circuits (Turn Interface Module in the Fuse Box).

Method: design current = P/V_min or budget; Cu at 85 C; feed fuse >= max(1.25 I, inrush) and <= guideline
max fuse for the gauge; unfused returns <= 80 % of guideline; branch <= 3 %, battery-to-lamp <= 5 %.
"""
import argparse, csv, sys

OHM_PER_M_20C = {22: 0.05296, 20: 0.03331, 18: 0.02095, 16: 0.01317,
                 14: 0.008286, 12: 0.005211, 10: 0.003277, 8: 0.002061}
MAX_FUSE_FOR_GAUGE = {22: 5, 20: 7.5, 18: 10, 16: 15, 14: 20, 12: 25, 10: 30, 8: 50}
STD_FUSES = [1, 2, 3, 4, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100]
V_NOM, BRANCH_LIMIT, TOTAL_LIMIT = 13.5, 0.03, 0.05

PRJ = 20.0 / 10.0          # HELLA L4060 max 20 W [SECONDARY] at 10 V (per module)
HONEY = DRL = 0.75         # Diode Dynamics FlexLight per side: not published -> 2x-margin budget, MEASURE
AMB_RUN = 0.03             # SS3 backlight per side [VERIFIED DD]
AMB_TURN = 1.1             # SS3 Sport main beam per side [VERIFIED DD]
AUX = 0.5                  # optional fan per side, budget
COILS = 5 * 0.15           # K1-K5, ESTIMATE
CTRL = 0.6                 # screen 5 V + control module, ESTIMATE
VDECO = 2 * (HONEY + DRL + AMB_RUN + AUX)
DECO_RTN = HONEY + DRL + AMB_RUN + AMB_TURN + AUX


def r(awg, t, n=1):
    return OHM_PER_M_20C[awg] * (1 + 0.00393 * (t - 20)) / n


def build(m, l, rr, tr):
    main_i = 4 * PRJ + VDECO + CTRL + COILS + 2 * AMB_TURN
    # name, awg, parallel conductors, current, length, kind, inrush/min fuse
    C = [("MAIN+", 10, 1, main_i, m, "feed", 0), ("MAIN-", 10, 1, main_i, m, "return", 0),
         ("VDECO(2x16)", 16, 2, VDECO, tr, "feed", 0), ("PGND(2x16)", 16, 2, VDECO, tr, "return", 0),
         # pair outputs: control module -> fuse box (one wire per pair), protected by VDECO fuse + PROFET
         ("HONEY_PAIR_T", 18, 1, 2 * HONEY, tr, "trunk", 0), ("DRL_PAIR_T", 18, 1, 2 * DRL, tr, "trunk", 0),
         ("AMB_PAIR_T", 18, 1, 2 * AMB_RUN, tr, "trunk", 0),
         # pair fuses (sized on pair current), wires after the split carry one side
         ("F_LOW_PAIR", 16, 1, 2 * PRJ, 0.0, "fuse", 7.5), ("F_HIGH_PAIR", 16, 1, 2 * PRJ, 0.0, "fuse", 7.5),
         ("F_HONEY_PAIR", 18, 1, 2 * HONEY, 0.0, "fuse", 3), ("F_DRL_PAIR", 18, 1, 2 * DRL, 0.0, "fuse", 3),
         ("F_AMB_PAIR", 18, 1, 2 * AMB_RUN, 0.0, "fuse", 1)]
    for s, L in (("L", l), ("R", rr)):
        C += [(f"LO_{s}", 16, 1, PRJ, L, "side", 0), (f"HI_{s}", 16, 1, PRJ, L, "side", 0),
              (f"PRJ_RTN_{s}", 16, 1, 2 * PRJ, L, "return", 0),
              (f"HONEY_{s}", 18, 1, HONEY, L, "side", 0), (f"DRL_{s}", 18, 1, DRL, L, "side", 0),
              (f"AMB_RUN_{s}", 18, 1, AMB_RUN, L, "side", 0),
              (f"TURN_{s}", 18, 1, AMB_TURN, L, "feed", 3),
              (f"DECO_RTN_{s}", 14, 1, DECO_RTN, L, "return", 0)]
    return main_i, C


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--temp", type=float, default=85.0)
    ap.add_argument("--main", type=float, default=0.6)
    ap.add_argument("--left", type=float, default=1.3)
    ap.add_argument("--right", type=float, default=2.3)
    ap.add_argument("--trunk", type=float, default=2.2)
    ap.add_argument("--csv", action="store_true")
    a = ap.parse_args()
    main_i, C = build(a.main, a.left, a.right, a.trunk)
    pair_fuse = {}
    rows, ok = {}, True
    for name, awg, n, i, L, kind, inr in C:
        vd = i * r(awg, a.temp, n) * L
        fuse, good = "-", True
        if kind in ("feed", "fuse"):
            fuse = next(f for f in STD_FUSES if f >= max(1.25 * i, inr))
            good = fuse <= MAX_FUSE_FOR_GAUGE[awg]
            if kind == "fuse":
                pair_fuse[name] = fuse
        elif kind == "trunk":
            fuse, good = "VDECO", 10 <= MAX_FUSE_FOR_GAUGE[awg]
        elif kind == "side":
            fuse = "pair"
        else:
            good = i <= 0.8 * MAX_FUSE_FOR_GAUGE[awg] * n
        ok &= good
        rows[name] = dict(name=name, awg=f"{awg}" + (f"x{n}" if n > 1 else ""), I_A=round(i, 2), len_m=L,
                          vdrop_V=round(vd, 3), fuse=fuse, check="OK" if good else "UPSIZE")
    if a.csv:
        w = csv.DictWriter(sys.stdout, fieldnames=list(next(iter(rows.values()))))
        w.writeheader(); w.writerows(rows.values()); return
    print(f"Rev E (paired). {a.temp:.0f} C. main {a.main} m, left {a.left} m, right {a.right} m, "
          f"trunk {a.trunk} m. PROVISIONAL\n")
    print(f"{'Conductor':13} {'AWG':>5} {'I A':>6} {'L m':>4} {'Vd V':>6} {'Fuse':>6}  Check")
    for x in rows.values():
        print(f"{x['name']:13} {x['awg']:>5} {x['I_A']:6.2f} {x['len_m']:4.1f} {x['vdrop_V']:6.3f} {str(x['fuse']):>6}  {x['check']}")
    mvd = rows["MAIN+"]["vdrop_V"] + rows["MAIN-"]["vdrop_V"]
    dvd = rows["VDECO(2x16)"]["vdrop_V"] + rows["PGND(2x16)"]["vdrop_V"]
    print(f"\nMain {main_i:.1f} A -> FM >= {next(f for f in STD_FUSES if f >= 1.25 * main_i)} A; "
          f"main drop {mvd:.3f} V; VDECO/PGND trunk drop {dvd:.3f} V")
    print(f"\n{'Path':10} {'Branch %':>8} {'Total %':>8}  Check")
    for s in ("L", "R"):
        P = [(f"LO_{s}", [f"LO_{s}", f"PRJ_RTN_{s}"], 0), (f"HI_{s}", [f"HI_{s}", f"PRJ_RTN_{s}"], 0),
             (f"HONEY_{s}", ["HONEY_PAIR_T", f"HONEY_{s}", f"DECO_RTN_{s}"], dvd),
             (f"DRL_{s}", ["DRL_PAIR_T", f"DRL_{s}", f"DECO_RTN_{s}"], dvd),
             (f"AMB_RUN_{s}", ["AMB_PAIR_T", f"AMB_RUN_{s}", f"DECO_RTN_{s}"], dvd),
             (f"TURN_{s}", [f"TURN_{s}", f"DECO_RTN_{s}"], 0)]
        for name, segs, extra in P:
            b = sum(rows[x]["vdrop_V"] for x in segs) + extra
            tot = b + mvd
            good = b <= BRANCH_LIMIT * V_NOM and tot <= TOTAL_LIMIT * V_NOM
            ok &= good
            print(f"{name:10} {100*b/V_NOM:8.2f} {100*tot/V_NOM:8.2f}  {'OK' if good else 'FAIL'}")
    print("\nRESULT:", "all checks pass" if ok else "one or more checks FAIL — upsize flagged conductors")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
