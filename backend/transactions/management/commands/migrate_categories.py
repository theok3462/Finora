from django.core.management.base import BaseCommand
from transactions.models import Transaction

FAST_FOOD = {
    'Chipotle', 'Chick-fil-A', 'Whataburger', 'Taco Bell', 'Subway',
    "McDonald's", 'Panda Express', "Chili's", "Domino's", 'Pizza Hut',
    'Starbucks', 'Dunkin', 'Shake Shack', 'Five Guys', 'Burger King',
    "Wendy's", "Popeyes", "Jack in the Box", "Del Taco", "Arby's",
    "Sonic", "Dairy Queen", "Wingstop", "Raising Cane's",
}

GROCERY = {
    'H-E-B', 'HEB', 'Walmart', 'Kroger', 'Whole Foods', "Trader Joe's",
    'Sprouts', 'Aldi', 'Costco', "Sam's Club",
}

CLOTHING = {
    'H&M', 'ZARA', 'Gap', 'Nike', 'Adidas', 'Old Navy', 'Uniqlo',
    'Forever 21', 'Urban Outfitters', 'American Eagle', 'Hollister',
    'Express', 'Banana Republic',
}

MOVIES = {
    'Alamo Drafthouse', 'Fandango', 'AMC', 'Regal', 'Cinemark',
}

DIRECT = {
    'Employment': 'Hourly',
    'Housing':    'Rent',
    'Health':     'Lifetime Fitness',
    'Transport':  'Uber/Lyft',
}

# Maps every subcategory to its Budget parent group
PARENT_MAP = {
    'Hourly': 'Income', 'Tips': 'Income', 'Freelance': 'Income',
    'Rent': 'Housing',
    'Groceries': 'Food & Dining', 'Dining Out': 'Food & Dining',
    'Gas': 'Transportation', 'Uber/Lyft': 'Transportation',
    'Netflix': 'Subscriptions', 'Spotify': 'Subscriptions',
    'ChatGPT': 'Subscriptions', 'Google One': 'Subscriptions',
    'Lifetime Fitness': 'Health & Fitness', 'Supplements': 'Health & Fitness',
    'Movies': 'Entertainment', 'Concerts': 'Entertainment',
    'Dates': 'Social', 'Friends Night': 'Social',
    'Shopping': 'Shopping', 'Clothes': 'Shopping', 'Home Goods': 'Shopping',
}


class Command(BaseCommand):
    help = 'Remap transactions from broad parent categories to Budget subcategories and set parent_category'

    def handle(self, *args, **kwargs):
        updated = 0
        parent_fixed = 0
        skipped = 0

        for t in Transaction.objects.all():
            new_cat = remap(t.title, t.category, t.transaction_type)
            new_parent = PARENT_MAP.get(new_cat or t.category, '')
            changed_cat = new_cat is not None and new_cat != t.category
            changed_parent = new_parent != t.parent_category

            if not changed_cat and not changed_parent:
                skipped += 1
                continue

            if changed_cat:
                old = t.category
                t.category = new_cat
                self.stdout.write(f'  [{t.id}] "{t.title}" : {old} → {new_cat}')
                updated += 1

            if changed_parent:
                t.parent_category = new_parent
                parent_fixed += 1

            t.save()

        self.stdout.write(self.style.SUCCESS(
            f'\nDone — {updated} category remaps, {parent_fixed} parent_category fixes, {skipped} skipped.'
        ))


def remap(title, category, tx_type):
    if category in DIRECT:
        return DIRECT[category]

    if category == 'Food':
        tl = title.lower()
        if any(g.lower() in tl for g in GROCERY):
            return 'Groceries'
        if any(f.lower() in tl for f in FAST_FOOD):
            return 'Dining Out'
        return 'Dining Out'

    if category == 'Entertainment':
        tl = title.lower()
        if 'concert' in tl or 'festival' in tl:
            return 'Concerts'
        if any(m.lower() in tl for m in MOVIES):
            return 'Movies'
        return 'Movies'

    if category == 'Shopping':
        tl = title.lower()
        if any(c.lower() in tl for c in CLOTHING):
            return 'Clothes'
        return 'Shopping'

    return None
