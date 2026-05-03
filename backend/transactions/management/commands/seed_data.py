import random
import datetime
import calendar
from collections import defaultdict
from django.core.management.base import BaseCommand
from transactions.models import Transaction


class Command(BaseCommand):
    help = 'Seed 16 months of realistic transactions (Jan 2025 – Apr 2026)'

    def handle(self, *args, **kwargs):
        Transaction.objects.all().delete()
        self.stdout.write('Wiped all existing transactions.\n')

        rows = []

        PARENT_MAP = {
            'Employment': 'Income', 'Tips': 'Income', 'Freelance': 'Income',
            'Housing':    'Housing',
            'Groceries':  'Food & Dining', 'Dining Out': 'Food & Dining',
            'Gas':        'Transportation', 'Uber/Lyft': 'Transportation',
            'Netflix':    'Subscriptions', 'Spotify': 'Subscriptions',
            'ChatGPT':    'Subscriptions', 'Google One': 'Subscriptions',
            'Lifetime Fitness': 'Health & Fitness', 'Supplements': 'Health & Fitness',
            'Movies':     'Entertainment', 'Concerts': 'Entertainment',
            'Dates':      'Social',
            'Clothes':    'Shopping', 'Home Goods': 'Shopping',
        }

        def tx(title, amount, tx_type, category, date):
            return dict(
                title=title,
                amount=round(float(amount), 2),
                transaction_type=tx_type,
                category=category,
                parent_category=PARENT_MAP.get(category, ''),
                date=str(date),
                note='',
            )

        def exp(title, amount, category, date):
            return tx(title, amount, 'expense', category, date)

        def inc(title, amount, category, date):
            return tx(title, amount, 'income', category, date)

        # ── Biweekly income (Hourly + Tips on the same day) ───────────────────
        # Starting 2025-01-10 (Friday), every 14 days.
        # Anchors April 2026 exactly:
        #   Jan 10 + 32×14 = Apr 03 2026  (Hourly + Tips)
        #   Jan 10 + 33×14 = Apr 17 2026  (Hourly + Tips)
        # April total biweekly income: 2 × ($1,050 + $420) = $2,940

        END = datetime.date(2026, 4, 30)

        d = datetime.date(2025, 1, 10)
        while d <= END:
            rows.append(inc('Hourly', 1050.00, 'Employment', d))
            rows.append(inc('Tips',    420.00, 'Tips',       d))
            d += datetime.timedelta(days=14)

        # ── Fixed monthly expenses ─────────────────────────────────────────────
        MONTHS = []
        y, m = 2025, 1
        while (y, m) <= (2026, 4):
            MONTHS.append((y, m))
            m += 1
            if m > 12:
                m, y = 1, y + 1

        for y, m in MONTHS:
            last = calendar.monthrange(y, m)[1]
            rows += [
                exp('Rent',             750.00, 'Housing',          datetime.date(y, m, 1)),
                exp('Netflix',           15.99, 'Netflix',          datetime.date(y, m, 8)),
                exp('Spotify',            9.99, 'Spotify',          datetime.date(y, m, 8)),
                exp('ChatGPT',           20.00, 'ChatGPT',          datetime.date(y, m, 20)),
                exp('Google One',         2.99, 'Google One',       datetime.date(y, m, 27)),
                exp('Lifetime Fitness',  49.99, 'Lifetime Fitness', datetime.date(y, m, min(28, last))),
            ]

        # ── Vendor pools ───────────────────────────────────────────────────────

        FAST_FOOD      = ['Chipotle', 'Chick-fil-A', 'Whataburger', 'Taco Bell',
                          'Subway', "McDonald's", 'Panda Express']
        GAS_PLACES     = ['Shell', 'Circle K', '7-Eleven']
        ENT_PLACES     = ['Alamo Drafthouse', 'Fandango']
        CONCERT_VENUES = ["Stubb's", 'Moody Center', 'ACL Live']
        DATE_PLACES    = ['Top Golf', 'Pinballz', "Mozart's Coffee",
                          'Epoch Coffee', 'Lake Travis outing']
        CLOTH_PLACES   = ['H&M', 'ZARA', 'Nordstrom Rack']
        HOME_PLACES    = ['Target', 'Amazon']

        # ── Variable expenses + Freelance income, Jan 2025 – Mar 2026 ─────────
        for y, m in MONTHS[:-1]:          # skip April 2026 (handled separately)
            rng  = random.Random(y * 100 + m)
            last = calendar.monthrange(y, m)[1]

            def rday(lo=1, hi=None):
                return datetime.date(y, m, rng.randint(lo, hi or last))

            def pick(lst):
                return lst[rng.randrange(len(lst))]

            def amt(lo, hi):
                return round(rng.uniform(lo, hi), 2)

            # Per-month personality
            dining_mult  = rng.uniform(0.8, 1.3)
            concert_roll = rng.random()   # < 0.40 → concerts this month
            clothes_roll = rng.random()   # < 0.65 → clothing purchase
            date_mult    = rng.uniform(0.8, 1.4)

            # Freelance income — once per month around the 15th, $200–$500
            rows.append(inc('Freelance', amt(400, 700), 'Freelance', rday(12, 18)))

            # Groceries — 3–5 trips spread across the month
            n_grocery = rng.randint(3, 5)
            g_days    = sorted(rng.sample(range(2, last), min(n_grocery, last - 2)))
            for gd in g_days:
                rows.append(exp('H-E-B', amt(18, 52), 'Groceries', datetime.date(y, m, gd)))

            # Dining out — 6–12 fast-food visits
            for _ in range(rng.randint(6, 12)):
                raw = rng.uniform(7, 18) * dining_mult
                rows.append(exp(pick(FAST_FOOD), round(raw, 2), 'Dining Out', rday()))

            # Gas — 2–4 fill-ups
            for _ in range(rng.randint(2, 4)):
                rows.append(exp(pick(GAS_PLACES), amt(28, 55), 'Gas', rday()))

            # Supplements — once a month
            rows.append(exp('Amazon', amt(32, 58), 'Supplements', rday(5, 25)))

            # Movies — 1–2x
            for _ in range(rng.randint(1, 2)):
                rows.append(exp(pick(ENT_PLACES), amt(12, 22), 'Movies', rday()))

            # Concerts — 40% of months, 1–2 shows
            if concert_roll < 0.40:
                for _ in range(rng.randint(1, 2)):
                    rows.append(exp(pick(CONCERT_VENUES), amt(25, 75), 'Concerts', rday()))

            # Dates — 1–3 outings
            for _ in range(rng.randint(1, 3)):
                raw = rng.uniform(15, 65) * date_mult
                rows.append(exp(pick(DATE_PLACES), round(raw, 2), 'Dates', rday()))

            # Clothes — 65% of months, 1–2 purchases
            if clothes_roll < 0.65:
                for _ in range(rng.randint(1, 2)):
                    rows.append(exp(pick(CLOTH_PLACES), amt(25, 85), 'Clothes', rday()))

            # Home goods — 1–3 purchases
            for _ in range(rng.randint(1, 3)):
                rows.append(exp(pick(HOME_PLACES), amt(15, 55), 'Home Goods', rday()))

            # Transport — 2–4 Ubers
            for _ in range(rng.randint(2, 4)):
                rows.append(exp('Uber', amt(12, 28), 'Uber/Lyft', rday()))

        # ── April 2026 — exact transactions ───────────────────────────────────
        # Biweekly income already generated by the loop above (Apr 3 + Apr 17).
        # No Freelance for April — biweekly alone gives exactly $2,940.
        # Variable expenses total: $1,005.44

        def d26(day):
            return datetime.date(2026, 4, day)

        rows += [
            # Groceries — 5 trips  ($186.40)
            exp('H-E-B',              32.45, 'Groceries',    d26(3)),
            exp('H-E-B',              44.20, 'Groceries',    d26(9)),
            exp('H-E-B',              29.85, 'Groceries',    d26(16)),
            exp('H-E-B',              38.60, 'Groceries',    d26(23)),
            exp('H-E-B',              41.30, 'Groceries',    d26(29)),

            # Dining Out — 11 visits  ($129.45)
            exp('Whataburger',        12.85, 'Dining Out',   d26(2)),
            exp('Chipotle',           12.45, 'Dining Out',   d26(4)),
            exp('Chick-fil-A',        10.25, 'Dining Out',   d26(6)),
            exp('Taco Bell',          10.35, 'Dining Out',   d26(11)),
            exp('Whataburger',        11.80, 'Dining Out',   d26(13)),
            exp("McDonald's",          9.15, 'Dining Out',   d26(15)),
            exp('Subway',             13.25, 'Dining Out',   d26(18)),
            exp('Taco Bell',           9.75, 'Dining Out',   d26(20)),
            exp('Panda Express',      13.90, 'Dining Out',   d26(25)),
            exp('Chipotle',           11.50, 'Dining Out',   d26(27)),
            exp('Chick-fil-A',        14.20, 'Dining Out',   d26(29)),

            # Gas — 3 fill-ups  ($113.45)
            exp('Shell',              38.40, 'Gas',          d26(5)),
            exp('Circle K',           41.25, 'Gas',          d26(14)),
            exp('7-Eleven',           33.80, 'Gas',          d26(22)),

            # Supplements  ($44.99)
            exp('Amazon',             44.99, 'Supplements',  d26(15)),

            # Movies — 2x  ($33.75)
            exp('Alamo Drafthouse',   18.50, 'Movies',       d26(12)),
            exp('Fandango',           15.25, 'Movies',       d26(26)),

            # Concerts  ($65.00)
            exp("Stubb's",            65.00, 'Concerts',     d26(19)),

            # Dates — 3 outings  ($119.50)
            exp('Top Golf',           58.00, 'Dates',        d26(7)),
            exp("Mozart's Coffee",    16.50, 'Dates',        d26(21)),
            exp('Lake Travis outing', 45.00, 'Dates',        d26(28)),

            # Clothes  ($85.00)
            exp('Nordstrom Rack',     85.00, 'Clothes',      d26(23)),

            # Home Goods — 4 purchases  ($152.75)
            exp('Target',             34.75, 'Home Goods',   d26(10)),
            exp('Amazon',             27.50, 'Home Goods',   d26(17)),
            exp('Amazon',             38.50, 'Home Goods',   d26(21)),
            exp('Target',             52.00, 'Home Goods',   d26(24)),

            # Uber/Lyft — 4 rides  ($75.15)
            exp('Uber',               15.25, 'Uber/Lyft',    d26(8)),
            exp('Uber',               18.40, 'Uber/Lyft',    d26(17)),
            exp('Uber',               19.50, 'Uber/Lyft',    d26(26)),
            exp('Uber',               22.00, 'Uber/Lyft',    d26(30)),
        ]

        # ── Bulk insert ────────────────────────────────────────────────────────
        Transaction.objects.bulk_create([Transaction(**r) for r in rows])

        # ── Month-by-month summary ─────────────────────────────────────────────
        monthly = defaultdict(lambda: {
            'income': 0.0, 'expense': 0.0,
            'cats': defaultdict(float), 'count': 0,
        })
        for r in rows:
            ym = r['date'][:7]
            monthly[ym][r['transaction_type']] += r['amount']
            monthly[ym]['count'] += 1
            if r['transaction_type'] == 'expense':
                monthly[ym]['cats'][r['category']] += r['amount']

        self.stdout.write(self.style.SUCCESS(
            f'\nSeeded {len(rows)} transactions across {len(monthly)} months.\n'
        ))

        header = f"{'Month':<10}  {'Income':>10}  {'Expenses':>10}  {'Top Category':<22}  {'Txns':>4}"
        self.stdout.write(header)
        self.stdout.write('─' * len(header))

        for ym in sorted(monthly):
            info    = monthly[ym]
            top_cat = max(info['cats'].items(), key=lambda x: x[1], default=('—', 0))[0]
            self.stdout.write(
                f"{ym:<10}  ${info['income']:>8.2f}  ${info['expense']:>8.2f}"
                f"  {top_cat:<22}  {info['count']:>4}"
            )

        self.stdout.write('')
