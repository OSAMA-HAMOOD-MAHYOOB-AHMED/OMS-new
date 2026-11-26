using Dapper;
using Oms.Api.Data;

namespace Oms.Api.Catalog;

/// <summary>
/// Tables and columns for the storefront features: sale prices, specifications, reviews,
/// discount codes and store settings. Safe to run on every start.
/// </summary>
public static class StoreFeaturesSchema
{
    public static async Task EnsureAsync(WebApplication app)
    {
        var factory = app.Services.GetRequiredService<IDbConnectionFactory>();
        using var conn = factory.Create();
        await conn.ExecuteAsync("""
            -- Sale price: compareatprice is the original price shown crossed out when it is above price.
            ALTER TABLE product ADD COLUMN IF NOT EXISTS compareatprice DECIMAL(10,2) NULL;
            -- Specifications, one "Label: value" per line.
            ALTER TABLE product ADD COLUMN IF NOT EXISTS specs TEXT NULL;
            ALTER TABLE product ADD COLUMN IF NOT EXISTS createdat TIMESTAMPTZ NOT NULL DEFAULT NOW();
            -- Arabic description and specifications (the English ones are description / specs).
            ALTER TABLE product ADD COLUMN IF NOT EXISTS descriptionar TEXT NULL;
            ALTER TABLE product ADD COLUMN IF NOT EXISTS specsar TEXT NULL;

            CREATE TABLE IF NOT EXISTS product_review (
              reviewid BIGSERIAL PRIMARY KEY,
              productid VARCHAR(50) NOT NULL REFERENCES product(productid) ON DELETE CASCADE,
              email VARCHAR(255) NOT NULL,
              name VARCHAR(255) NOT NULL,
              rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
              comment TEXT NULL,
              verifiedbuyer BOOLEAN NOT NULL DEFAULT FALSE,
              createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              UNIQUE (productid, email)
            );
            CREATE INDEX IF NOT EXISTS ix_product_review_product ON product_review (productid);

            CREATE TABLE IF NOT EXISTS coupon (
              code VARCHAR(40) PRIMARY KEY,
              percent SMALLINT NOT NULL CHECK (percent BETWEEN 1 AND 90),
              minsubtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
              expiresat TIMESTAMPTZ NULL,
              active BOOLEAN NOT NULL DEFAULT TRUE,
              createdat TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) NOT NULL DEFAULT 0;
            ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS couponcode VARCHAR(40) NULL;

            CREATE TABLE IF NOT EXISTS site_setting (
              key VARCHAR(60) PRIMARY KEY,
              value TEXT NULL
            );
            """);

        await ConvertToRiyalsOnceAsync(conn, app.Logger);
        await RoundPricesOnceAsync(conn, app.Logger);
    }

    /// <summary>
    /// After the riyal conversion prices looked like 172.46. The owner asked for whole riyals:
    /// .50 and above goes up, below .50 goes down. Runs once; past orders keep what was charged.
    /// </summary>
    private static async Task RoundPricesOnceAsync(System.Data.IDbConnection conn, ILogger logger)
    {
        if (conn.State != System.Data.ConnectionState.Open) conn.Open();
        using var tx = conn.BeginTransaction();
        await conn.ExecuteAsync("LOCK TABLE site_setting IN EXCLUSIVE MODE;", transaction: tx);
        var done = await conn.ExecuteScalarAsync<string?>(
            "SELECT value FROM site_setting WHERE key = 'pricesRounded';", transaction: tx);
        if (done is not null)
        {
            tx.Rollback();
            return;
        }

        // ROUND(x) on numeric rounds halves away from zero: 172.50 -> 173, 172.46 -> 172.
        var rows = await conn.ExecuteAsync("""
            UPDATE product SET price = ROUND(price), compareatprice = ROUND(compareatprice);
            -- A sale needs an original price above the selling price.
            UPDATE product SET compareatprice = NULL WHERE compareatprice IS NOT NULL AND compareatprice <= price;
            INSERT INTO site_setting (key, value) VALUES ('pricesRounded', NOW()::text);
            """, transaction: tx);
        tx.Commit();
        logger.LogWarning("Rounded product prices to whole riyals ({Rows} rows changed)", rows);
    }

    /// <summary>The store's currency. All amounts in the database are in this currency.</summary>
    public const string Currency = "SAR";

    /// <summary>Saudi riyal peg: 1 US dollar = 3.75 riyals.</summary>
    private const decimal UsdToSar = 3.75m;

    /// <summary>
    /// Prices and order amounts used to be stored in US dollars. This converts all of them to Saudi
    /// riyals once, in one transaction, and records that it ran so it never runs twice.
    /// </summary>
    private static async Task ConvertToRiyalsOnceAsync(System.Data.IDbConnection conn, ILogger logger)
    {
        if (conn.State != System.Data.ConnectionState.Open) conn.Open();
        using var tx = conn.BeginTransaction();
        await conn.ExecuteAsync("LOCK TABLE site_setting IN EXCLUSIVE MODE;", transaction: tx);
        var current = await conn.ExecuteScalarAsync<string?>(
            "SELECT value FROM site_setting WHERE key = 'baseCurrency';", transaction: tx);
        if (current == Currency)
        {
            tx.Rollback();
            return;
        }

        var products = await conn.ExecuteAsync(
            "UPDATE product SET price = ROUND(price * @r, 2), compareatprice = ROUND(compareatprice * @r, 2);",
            new { r = UsdToSar }, tx);
        var orders = await conn.ExecuteAsync(
            """UPDATE "Order" SET totalprice = ROUND(totalprice * @r, 2), discount = ROUND(discount * @r, 2);""",
            new { r = UsdToSar }, tx);
        await conn.ExecuteAsync("""
            UPDATE order_item SET subtotal = ROUND(subtotal * @r, 2);
            UPDATE coupon SET minsubtotal = ROUND(minsubtotal * @r, 2);
            INSERT INTO site_setting (key, value) VALUES ('baseCurrency', @c)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
            """, new { r = UsdToSar, c = Currency }, tx);
        tx.Commit();
        logger.LogWarning("Converted stored amounts from USD to SAR at {Rate}: {Products} products, {Orders} orders",
            UsdToSar, products, orders);
    }
}
