using Dapper;
using Oms.Api.Data;

namespace Oms.Api.Inventory;

public sealed class InventoryRepository(IDbConnectionFactory db)
{
    public async Task<IReadOnlyList<InventoryRow>> List()
    {
        const string sql = """
            SELECT
              i.inventoryID AS InventoryID,
              i.productID AS ProductID,
              p.name AS ProductName,
              i.location AS Location,
              i.quantityAvailable AS QuantityAvailable,
              i.quantityReserved AS QuantityReserved,
              i.lastCheckupDate AS LastCheckupDate
            FROM Inventory i
            JOIN Product p ON p.productID = i.productID
            ORDER BY p.name ASC;
            """;

        using var conn = db.Create();
        var rows = await conn.QueryAsync<InventoryRow>(sql);
        return rows.ToList();
    }

    public async Task ReceiveStock(string productID, int quantity, string? note)
    {
        if (quantity <= 0) throw new InvalidOperationException("Quantity must be > 0.");

        using var conn = db.Create();
        if (conn is System.Data.Common.DbConnection dbc)
            await dbc.OpenAsync();
        else
            conn.Open();

        using var tx = conn.BeginTransaction();

        const string lockInv = """
            SELECT inventoryID AS InventoryID
            FROM Inventory
            WHERE productID = @productID
            FOR UPDATE;
            """;

        var inventoryID = await conn.QuerySingleOrDefaultAsync<string?>(lockInv, new { productID }, tx);
        if (inventoryID is null)
        {
            tx.Rollback();
            throw new InvalidOperationException("No inventory row for product.");
        }

        const string updateInv = """
            UPDATE Inventory
            SET quantityAvailable = quantityAvailable + @qty
            WHERE inventoryID = @inventoryID;
            """;
        await conn.ExecuteAsync(updateInv, new { qty = quantity, inventoryID }, tx);

        const string updateProduct = """
            UPDATE Product
            SET stockLevel = stockLevel + @qty
            WHERE productID = @productID;
            """;
        await conn.ExecuteAsync(updateProduct, new { qty = quantity, productID }, tx);

        const string audit = """
            INSERT INTO Inventory_Audit (inventoryID, action, deltaQuantity, note, createdAt)
            VALUES (@inventoryID, 'RECEIVE', @delta, @note, @createdAt);
            """;
        await conn.ExecuteAsync(audit, new
        {
            inventoryID,
            delta = quantity,
            note,
            createdAt = DateTime.UtcNow
        }, tx);

        tx.Commit();
    }

    public async Task Checkup(string inventoryID, string? note)
    {
        using var conn = db.Create();
        if (conn is System.Data.Common.DbConnection dbc)
            await dbc.OpenAsync();
        else
            conn.Open();

        const string update = """
            UPDATE Inventory
            SET lastCheckupDate = @now
            WHERE inventoryID = @inventoryID;
            """;

        const string audit = """
            INSERT INTO Inventory_Audit (inventoryID, action, deltaQuantity, note, createdAt)
            VALUES (@inventoryID, 'CHECKUP', 0, @note, @now);
            """;

        using var tx = conn.BeginTransaction();
        var now = DateTime.UtcNow;

        var rows = await conn.ExecuteAsync(update, new { now, inventoryID }, tx);
        if (rows != 1)
        {
            tx.Rollback();
            throw new InvalidOperationException("Unknown inventoryID.");
        }

        await conn.ExecuteAsync(audit, new { inventoryID, note, now }, tx);
        tx.Commit();
    }

    public async Task<IReadOnlyList<InventoryAuditRow>> Audit(string inventoryID, int limit = 25)
    {
        const string sql = """
            SELECT
              auditID AS AuditID,
              inventoryID AS InventoryID,
              action AS Action,
              deltaQuantity AS DeltaQuantity,
              note AS Note,
              createdAt AS CreatedAt
            FROM Inventory_Audit
            WHERE inventoryID = @inventoryID
            ORDER BY auditID DESC
            LIMIT @limit;
            """;

        using var conn = db.Create();
        var rows = await conn.QueryAsync<InventoryAuditRow>(sql, new { inventoryID, limit });
        return rows.ToList();
    }
}

