"""
Seed the database with realistic men's wear categories and products.
Run from backend/ with:  uv run python -m app.db.seed
Idempotent: skips seeding if categories already exist.
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
PRODUCTS = [
    # Shirts
    {
        "name": "Classic White Oxford Shirt",
        "slug": "classic-white-oxford-shirt",
        "description": "A timeless white Oxford shirt crafted from 100% premium cotton. Features a button-down collar and relaxed fit perfect for any occasion.",
        "price": 8999,
        "stock": 45,
        "category_slug": "shirts",
        "image_url": "/images/products/shirts/classic-white-oxford.jpg",
    },
    {
        "name": "Navy Blue Polo Shirt",
        "slug": "navy-blue-polo-shirt",
        "description": "A refined navy polo made from breathable piqué cotton. Clean lines and a slim fit make this a wardrobe essential.",
        "price": 5999,
        "stock": 60,
        "category_slug": "shirts",
        "image_url": "/images/products/shirts/navy-polo.jpg",
    },
    {
        "name": "Slim Fit Check Dress Shirt",
        "slug": "slim-fit-check-dress-shirt",
        "description": "A sharp slim-fit shirt in a subtle window-pane check. Ideal for business casual or a smart evening look.",
        "price": 7499,
        "stock": 30,
        "category_slug": "shirts",
        "image_url": "/images/products/shirts/slim-check-dress.jpg",
    },
    {
        "name": "Linen Short Sleeve Shirt",
        "slug": "linen-short-sleeve-shirt",
        "description": "Lightweight 100% linen construction makes this the go-to shirt for warm days. Available in stone white.",
        "price": 6499,
        "stock": 40,
        "category_slug": "shirts",
        "image_url": "/images/products/shirts/linen-short-sleeve.jpg",
    },
    # Trousers
    {
        "name": "Slim Fit Khaki Chinos",
        "slug": "slim-fit-khaki-chinos",
        "description": "Tailored slim-fit chinos in classic khaki. Versatile enough to wear with a shirt or a hoodie.",
        "price": 6999,
        "stock": 50,
        "category_slug": "trousers",
        "image_url": "/images/products/trousers/slim-khaki-chinos.jpg",
    },
    {
        "name": "Tailored Charcoal Dress Trousers",
        "slug": "tailored-charcoal-dress-trousers",
        "description": "Premium charcoal wool-blend trousers with a flat front and straight leg. Built for the boardroom.",
        "price": 8499,
        "stock": 25,
        "category_slug": "trousers",
        "image_url": "/images/products/trousers/charcoal-dress-trousers.jpg",
    },
    {
        "name": "Straight Leg Indigo Jeans",
        "slug": "straight-leg-indigo-jeans",
        "description": "Classic straight-leg jeans in a deep indigo wash. Hard-wearing denim that breaks in beautifully over time.",
        "price": 7999,
        "stock": 55,
        "category_slug": "trousers",
        "image_url": "/images/products/trousers/indigo-jeans.jpg",
    },
    # Accessories
    {
        "name": "Full-Grain Leather Belt",
        "slug": "full-grain-leather-belt",
        "description": "Handcrafted full-grain brown leather belt with a brushed silver buckle. Will last a lifetime.",
        "price": 4999,
        "stock": 80,
        "category_slug": "accessories",
        "image_url": "/images/products/accessories/leather-belt-brown.jpg",
    },
    {
        "name": "Slim Bifold Leather Wallet",
        "slug": "slim-bifold-leather-wallet",
        "description": "A slim, minimalist bifold wallet in smooth black leather. Fits 6 cards and bills without bulk.",
        "price": 3999,
        "stock": 90,
        "category_slug": "accessories",
        "image_url": "/images/products/accessories/bifold-wallet-black.jpg",
    },
    {
        "name": "Brushed Steel Dress Watch",
        "slug": "brushed-steel-dress-watch",
        "description": "A refined minimalist watch with a brushed stainless steel case, white dial, and leather strap.",
        "price": 19999,
        "stock": 15,
        "category_slug": "accessories",
        "image_url": "/images/products/accessories/brushed-steel-watch.jpg",
    },
    {
        "name": "Classic Navy Baseball Cap",
        "slug": "classic-navy-baseball-cap",
        "description": "A structured six-panel cap in navy with a curved brim. Clean, embroidered AppleShirt logo on the front.",
        "price": 2999,
        "stock": 70,
        "category_slug": "accessories",
        "image_url": "/images/products/accessories/navy-baseball-cap.jpg",
    },
    # Outerwear
    {
        "name": "Camel Wool Blend Overcoat",
        "slug": "camel-wool-blend-overcoat",
        "description": "A statement overcoat in a luxurious camel wool-blend. Single-breasted with notched lapels. Timeless.",
        "price": 24999,
        "stock": 12,
        "category_slug": "outerwear",
        "image_url": "/images/products/outerwear/camel-overcoat.jpg",
    },
    {
        "name": "Olive Bomber Jacket",
        "slug": "olive-bomber-jacket",
        "description": "A clean MA-1 inspired bomber in olive nylon with a ribbed collar, cuffs, and hem. Versatile layer.",
        "price": 14999,
        "stock": 20,
        "category_slug": "outerwear",
        "image_url": "/images/products/outerwear/olive-bomber.jpg",
    },
    {
        "name": "Washed Blue Denim Jacket",
        "slug": "washed-blue-denim-jacket",
        "description": "A classic trucker-style denim jacket in a mid-blue wash. Raw brass hardware and a comfortable regular fit.",
        "price": 9999,
        "stock": 35,
        "category_slug": "outerwear",
        "image_url": "/images/products/outerwear/blue-denim-jacket.jpg",
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(Category).limit(1))).scalar_one_or_none()
        if existing:
            print("Seed data already present — skipping.")
            return

        print("Seeding categories...")
        slug_to_id: dict[str, int] = {}
        for cat_data in CATEGORIES:
            cat = Category(**cat_data)
            db.add(cat)
            await db.flush()  # get id without committing
            slug_to_id[cat_data["slug"]] = cat.id
            print(f"  + {cat_data['name']}")

        print("Seeding products...")
        for prod_data in PRODUCTS:
            category_slug = prod_data.pop("category_slug")
            prod = Product(**prod_data, category_id=slug_to_id[category_slug])
            db.add(prod)
            print(f"  + {prod_data['name']}")

        await db.commit()
        print(f"Done. {len(CATEGORIES)} categories, {len(PRODUCTS)} products seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
