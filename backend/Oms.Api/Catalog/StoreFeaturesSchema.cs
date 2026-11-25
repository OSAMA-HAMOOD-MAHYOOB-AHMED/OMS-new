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
    }
}
