# Kroon Cannabis Menu

A mobile-friendly menu for QR-code visitors. It is a static site designed for GitHub Pages; there is no server or database to maintain.

## Update the menu

The live menu is read from [`menu.csv`](menu.csv). To update it in GitHub:

1. Open `menu.csv` in the repository and choose **Edit this file** to change existing items, or choose **Add file → Upload files** to upload a replacement with the exact name `menu.csv`.
2. Keep the first row (the column headings) unchanged. Update `stock` with the number of units available; for flower (`unit` is `g`), this is the number of grams. Set it to `0` when sold out. Set `is_new` to `true` to feature it under **Just landed**. Set `on_special` to `true` and enter a `special_price` to feature it under **On special**.
3. Commit the change to the `main` branch. GitHub Pages will publish the updated menu automatically.

Each row is one menu item. Keep `id` unique, enter prices as numbers in rand per `unit`, and leave `special_price` blank when the item is not on special. Use `g` for flower sold by the gram, `each` for individual items, or `pack` for packs. Flower stock is recorded in grams; other stock is in items or packs. Descriptions containing commas must stay inside double quotes. To add an item, add a row with a unique ID and all the columns; use a publicly accessible image URL in `image`. Categories such as `Accessories` or `Equipment` appear automatically. To remove an item, delete its row. The product names, descriptions, prices and stock in the included CSV are examples and should be replaced with the shop's real details before sharing the QR code.

| Column | What to enter |
| --- | --- |
| `id` | Unique, permanent identifier such as `sunset-haze` |
| `name`, `category`, `size` | The name and menu grouping, plus pack size or `Loose` for flower |
| `unit` | `g` for gram-priced flower, `each` for singles, or `pack` for packs |
| `price` | Regular price in rand per unit, as a number |
| `description` | Short customer-facing description |
| `image`, `imageAlt` | Public image URL and a short image description |
| `stock` | Grams available for `g`, or item/pack count for other units; the basket enforces this limit |
| `is_new` | `true` to include under **Just landed** |
| `on_special`, `special_price` | Set `on_special` to `true` and enter the sale price to show under **On special** |
| `label` | Optional small product label, such as `Staff pick` |

## Publish on GitHub Pages

The workflow in `.github/workflows/pages.yml` builds the site on pushes to `main`. In the repository's **Settings → Pages**, select **GitHub Actions** as the build and deployment source. After the first successful workflow run, the Pages URL appears in that settings page. Create the shop's QR code from that URL and print it for the counter or packaging. The URL does not change when the CSV changes.

## WhatsApp

The basket creates an advance order message for Travin at `+27 83 584 1120` (`27835841120` in the WhatsApp link). Customers pay when they pick up. The customer sends the message themselves, and the shop confirms availability and collection time. Change the `whatsapp` value in `app.js` if the shop number changes; use country code digits only. Social profile links can be added once the shop's accounts are ready.

## Local preview

Because the page fetches `menu.csv`, serve the files over HTTP rather than opening `index.html` directly. From the project folder run `python3 -m http.server 8000`, then open `http://localhost:8000`.