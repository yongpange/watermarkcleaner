from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Wait a bit for server to be fully ready
    time.sleep(5)

    try:
        # Navigate without waiting for load event
        response = page.goto('http://127.0.0.1:3000/blog/how-to-clean-up-a-blurry-image', timeout=60000)
        print(f"Response status: {response.status if response else 'None'}")
        print(f"Response url: {response.url if response else 'None'}")
    except Exception as e:
        print(f"Navigation error: {e}")
        # Try to get page content anyway
        try:
            content = page.content()
            print(f"Page content length: {len(content)}")
        except:
            pass

    page.wait_for_timeout(3000)

    # Take full page screenshot
    page.screenshot(path='E:/1_CODE/watermarkcleaner_com/screenshot-table-test.png', full_page=True)
    print("Screenshot saved to screenshot-table-test.png")

    browser.close()
