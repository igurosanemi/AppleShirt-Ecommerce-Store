"""
Seed the database with realistic men's wear categories and products.
Run from backend/ with:  uv run python -m app.db.seed
Idempotent per-slug: skips categories/products that already exist by slug.
Safe to re-run; will only insert missing rows.
"""

import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.category import Category
from app.models.product import Product

CATEGORIES = [
    {"name": "Shirts", "slug": "shirts", "description": "Dress shirts, polo shirts, and casual tops"},
    {"name": "Trousers", "slug": "trousers", "description": "Chinos, dress trousers, and jeans"},
    {"name": "Accessories", "slug": "accessories", "description": "Belts, wallets, watches, and caps"},
    {"name": "Outerwear", "slug": "outerwear", "description": "Jackets, coats, and blazers"},
]

# price in integer cents (e.g. 8999 = $89.99)
# stock=0 → out of stock demo; stock=1-5 → low-stock warning demo
PRODUCTS = [
    # ── Shirts ────────────────────────────────────────────────────────────────
    {
        "name": "Classic White Oxford Shirt",
        "slug": "classic-white-oxford-shirt",
        "description": (
            "A timeless white Oxford shirt crafted from 100% premium cotton. "
            "The button-down collar and relaxed fit make it the most versatile "
            "piece in the wardrobe — wears equally well under a blazer or with jeans."
        ),
        "price": 8999,
        "stock": 45,
        "category_slug": "shirts",
        "image_url": "/images/products/shirts/classic-white-oxford.jpg",
    },
    {
        "name": "Navy Blue Polo Shirt",
        "slug": "navy-blue-polo-shirt",
        "description": (
            "A refined navy polo made from breathable piqué cotton. "
            "Clean lines and a slim fit make this a wardrobe essential — "
            "polished enough for smart casual, relaxed enough for weekends."
        ),
        "price": 5999,
        "stock": 60,
        "category_slug": "shirts",
        "image_url": "/images/products/shirts/navy-polo.jpg",
    },
    {
        "name": "Slim Fit Check Dress Shirt",
        "slug": "slim-fit-check-dress-shirt",
        "description": (
            "A sharp slim-fit shirt in a subtle window-pane check woven from "
            "two-ply cotton. The spread collar sits cleanly under a tie or "
            "open for business casual. Ideal for the boardroom to bar."
        ),
        "price": 7499,
        "stock": 30,
        "category_slug": "shirts",
        "image_url": "/images/products/shirts/slim-check-dress.jpg",
    },
    {
        "name": "Linen Short Sleeve Shirt",
        "slug": "linen-short-sleeve-shirt",
        "description": (
            "Lightweight 100% linen construction makes this the go-to shirt "
            "for warm days. Stone white colourway keeps it clean and pairs "
            "effortlessly with chinos or tailored shorts."
        ),
        "price": 6499,
        "stock": 40,
        "category_slug": "shirts",
        "image_url": "/images/products/shirts/linen-short-sleeve.jpg",
    },
    {
        "name": "Midnight Black Oxford Shirt",
        "slug": "midnight-black-oxford-shirt",
        "description": (
            "The black counterpart to our classic Oxford, cut from the same "
            "100% premium cotton twill. Button-down collar, chest pocket, "
            "and a relaxed fit that transitions from desk to dinner."
        ),
        "price": 8999,
        "stock": 3,  # low stock — triggers warning
        "category_slug": "shirts",
        "image_url": "/images/products/shirts/classic-white-oxford.jpg",
    },
    {
        "name": "Washed Grey Chambray Shirt",
        "slug": "washed-grey-chambray-shirt",
        "description": (
            "Enzyme-washed chambray gives this shirt a lived-in texture from "
            "the first wear. The casual fit and single chest pocket make it "
            "the easiest layering piece in the collection."
        ),
        "price": 6999,
        "stock": 0,  # out of stock — tests OOS display
        "category_slug": "shirts",
        "image_url": "/images/products/shirts/linen-short-sleeve.jpg",
    },
    # ── Trousers ───────────────────────────────────────────────────────────────
    {
        "name": "Slim Fit Khaki Chinos",
        "slug": "slim-fit-khaki-chinos",
        "description": (
            "Tailored slim-fit chinos in classic khaki cut from stretch-cotton "
            "twill. Versatile enough to wear with a dress shirt or a hoodie — "
            "the backbone of a smart-casual wardrobe."
        ),
        "price": 6999,
        "stock": 50,
        "category_slug": "trousers",
        "image_url": "/images/products/trousers/slim-khaki-chinos.jpg",
    },
    {
        "name": "Tailored Charcoal Dress Trousers",
        "slug": "tailored-charcoal-dress-trousers",
        "description": (
            "Premium charcoal wool-blend trousers with a flat front and straight "
            "leg. The half-canvas construction holds the crease all day. "
            "Built for the boardroom, sharp enough for black tie."
        ),
        "price": 8499,
        "stock": 25,
        "category_slug": "trousers",
        "image_url": "/images/products/trousers/charcoal-dress-trousers.jpg",
    },
    {
        "name": "Straight Leg Indigo Jeans",
        "slug": "straight-leg-indigo-jeans",
        "description": (
            "Classic straight-leg jeans in a deep indigo wash, cut from "
            "Japanese selvedge denim. Hard-wearing and honest — these will "
            "break in beautifully over years of wear."
        ),
        "price": 7999,
        "stock": 55,
        "category_slug": "trousers",
        "image_url": "/images/products/trousers/indigo-jeans.jpg",
    },
    {
        "name": "Stone Linen Trousers",
        "slug": "stone-linen-trousers",
        "description": (
            "Wide-leg linen trousers in a warm stone tone. Elasticated waist "
            "and tapered hem combine comfort with a contemporary silhouette. "
            "Cut to be worn from the beach to an evening terrace."
        ),
        "price": 7499,
        "stock": 2,  # low stock
        "category_slug": "trousers",
        "image_url": "/images/products/trousers/slim-khaki-chinos.jpg",
    },
    # ── Accessories ────────────────────────────────────────────────────────────
    {
        "name": "Full-Grain Leather Belt",
        "slug": "full-grain-leather-belt",
        "description": (
            "Handcrafted from a single piece of full-grain brown leather with "
            "a brushed silver buckle. The hide develops a rich patina over "
            "time — this belt will genuinely last a lifetime."
        ),
        "price": 4999,
        "stock": 80,
        "category_slug": "accessories",
        "image_url": "/images/products/accessories/leather-belt-brown.jpg",
    },
    {
        "name": "Slim Bifold Leather Wallet",
        "slug": "slim-bifold-leather-wallet",
        "description": (
            "A minimalist bifold wallet in smooth vegetable-tanned black leather. "
            "Fits 6 cards and folded bills without adding bulk. The kind of object "
            "you carry every day and never think about replacing."
        ),
        "price": 3999,
        "stock": 90,
        "category_slug": "accessories",
        "image_url": "/images/products/accessories/bifold-wallet-black.jpg",
    },
    {
        "name": "Brushed Steel Dress Watch",
        "slug": "brushed-steel-dress-watch",
        "description": (
            "A refined minimalist watch with a brushed stainless steel case, "
            "white sunray dial, and tan leather strap. Swiss quartz movement. "
            "Understated enough to wear with anything."
        ),
        "price": 19999,
        "stock": 15,
        "category_slug": "accessories",
        "image_url": "/images/products/accessories/brushed-steel-watch.jpg",
    },
    {
        "name": "Classic Navy Baseball Cap",
        "slug": "classic-navy-baseball-cap",
        "description": (
            "A structured six-panel cap in navy cotton twill with a curved brim "
            "and tonal sweatband. Clean tone-on-tone AppleShirt wordmark "
            "embroidered at the front."
        ),
        "price": 2999,
        "stock": 70,
        "category_slug": "accessories",
        "image_url": "/images/products/accessories/navy-baseball-cap.jpg",
    },
    {
        "name": "Card Holder — Black Leather",
        "slug": "card-holder-black-leather",
        "description": (
            "An ultra-slim card holder that holds 4 cards and sits flat in "
            "any pocket. Hand-stitched black leather with a single back pocket "
            "for folded notes. The minimum viable wallet."
        ),
        "price": 2499,
        "stock": 0,  # out of stock
        "category_slug": "accessories",
        "image_url": "/images/products/accessories/bifold-wallet-black.jpg",
    },
    # ── Outerwear ──────────────────────────────────────────────────────────────
    {
        "name": "Camel Wool Blend Overcoat",
        "slug": "camel-wool-blend-overcoat",
        "description": (
            "A statement overcoat in a luxurious camel 70% wool–30% cashmere "
            "blend. Single-breasted with notched lapels, a half-lining, and "
            "a back vent. The coat that makes everything beneath it look better."
        ),
        "price": 24999,
        "stock": 12,
        "category_slug": "outerwear",
        "image_url": "/images/products/outerwear/camel-overcoat.jpg",
    },
    {
        "name": "Olive Bomber Jacket",
        "slug": "olive-bomber-jacket",
        "description": (
            "A clean MA-1 inspired bomber in olive ripstop nylon with "
            "ribbed collar, cuffs, and hem. Two hand pockets plus a chest "
            "zip. A versatile layering piece that earns its place year-round."
        ),
        "price": 14999,
        "stock": 20,
        "category_slug": "outerwear",
        "image_url": "/images/products/outerwear/olive-bomber.jpg",
    },
    {
        "name": "Washed Blue Denim Jacket",
        "slug": "washed-blue-denim-jacket",
        "description": (
            "A classic trucker-style denim jacket in a mid-blue wash, cut "
            "slightly longer than tradition with two chest pockets and two "
            "hand pockets. Raw brass hardware and a comfortable regular fit."
        ),
        "price": 9999,
        "stock": 35,
        "category_slug": "outerwear",
        "image_url": "/images/products/outerwear/blue-denim-jacket.jpg",
    },
    {
        "name": "Navy Double-Breasted Blazer",
        "slug": "navy-double-breasted-blazer",
        "description": (
            "A contemporary double-breasted blazer in navy wool-blend with "
            "peak lapels and gold-tone buttons. Slim through the chest with "
            "a slight flare to the hem. Dress it up or wear it with jeans."
        ),
        "price": 18999,
        "stock": 4,  # low stock
        "category_slug": "outerwear",
        "image_url": "/images/products/outerwear/camel-overcoat.jpg",
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        # Build slug→id map for existing categories
        existing_cats = (await db.execute(select(Category))).scalars().all()
        slug_to_id: dict[str, int] = {c.slug: c.id for c in existing_cats}

        # Insert any missing categories
        new_cats = [c for c in CATEGORIES if c["slug"] not in slug_to_id]
        if new_cats:
            print(f"Seeding {len(new_cats)} new categories...")
            for cat_data in new_cats:
                cat = Category(**cat_data)
                db.add(cat)
                await db.flush()
                slug_to_id[cat_data["slug"]] = cat.id
                print(f"  + {cat_data['name']}")
        else:
            print("Categories already present — skipping.")

        # Build set of existing product slugs
        existing_slugs = set(
            (await db.execute(select(Product.slug))).scalars().all()
        )

        # Insert any missing products
        new_products = [p for p in PRODUCTS if p["slug"] not in existing_slugs]
        if new_products:
            print(f"Seeding {len(new_products)} new products...")
            for prod_data in new_products:
                prod_data = dict(prod_data)  # copy so we don't mutate the list
                category_slug = prod_data.pop("category_slug")
                prod = Product(**prod_data, category_id=slug_to_id[category_slug])
                db.add(prod)
                print(f"  + {prod_data['name']}")
        else:
            print("All products already present — skipping.")

        await db.commit()
        print(
            f"Done. {len(slug_to_id)} categories, "
            f"{len(existing_slugs) + len(new_products)} products total."
        )


if __name__ == "__main__":
    asyncio.run(seed())
