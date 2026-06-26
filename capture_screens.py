"""
OMS Screenshot Capture Script
Run this from Windows: python capture_screens.py
It will save screenshots of the current screen to the screenshots/ folder.
Usage: Navigate to each page in Chrome, then press Enter in this script.
"""
import os
import subprocess
import time

try:
    from PIL import ImageGrab
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import ctypes
    HAS_CTYPES = True
except ImportError:
    HAS_CTYPES = False


def take_screenshot(filename):
    """Take a screenshot using PIL ImageGrab (Windows)."""
    if HAS_PIL:
        img = ImageGrab.grab()
        img.save(filename)
        print(f"  Saved: {filename} ({img.size[0]}x{img.size[1]})")
        return True
    else:
        print("  PIL not available")
        return False


def main():
    out_dir = os.path.join(os.path.dirname(__file__), "screenshots")
    os.makedirs(out_dir, exist_ok=True)

    pages = [
        ("01_home", "Home Page — https://alwakeel-alshamel.vercel.app"),
        ("02_login", "Login Page — click Login in top right"),
        ("03_signup", "Sign Up Page — click Sign Up"),
        ("04_products", "Products Page — log in as customer, click Products"),
        ("05_product_detail", "Product Detail — click any product card"),
        ("06_cart", "Shopping Cart — click the cart icon"),
        ("07_checkout_payment", "Checkout Payment Step"),
        ("08_checkout_confirm", "Order Confirmation Page"),
        ("09_invoice", "Invoice Page"),
        ("10_orders", "Order History — click Orders in nav"),
        ("11_profile", "Profile Page — click Profile in nav"),
        ("12_admin_login", "Admin Login — go to /admin/login"),
        ("13_admin_dashboard", "Admin Dashboard"),
        ("14_admin_products", "Admin Products Management"),
        ("15_admin_orders", "Admin Orders Management"),
        ("16_admin_customers", "Admin Customers Management"),
        ("17_admin_reports", "Admin Sales Reports"),
        ("18_sales_dashboard", "Sales Dashboard — log in as sales@demo.local"),
        ("19_sales_orders", "Sales Orders View"),
        ("20_warehouse_dashboard", "Warehouse Dashboard — log in as warehouse@demo.local"),
        ("21_warehouse_inventory", "Warehouse Inventory Management"),
    ]

    print("=" * 60)
    print("OMS Screenshot Capture")
    print("=" * 60)
    print(f"Saving to: {out_dir}")
    print()

    for slug, instruction in pages:
        print(f"\n[{slug}]")
        print(f"Navigate to: {instruction}")
        input("  Press Enter when ready to capture... ")
        time.sleep(0.5)
        path = os.path.join(out_dir, f"{slug}.png")
        take_screenshot(path)

    print("\n\nAll screenshots captured!")
    print(f"Check folder: {out_dir}")


if __name__ == "__main__":
    main()
