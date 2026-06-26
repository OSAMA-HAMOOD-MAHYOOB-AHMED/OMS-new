using System.Data.Common;
using BCrypt.Net;
using Dapper;
using Oms.Api.Auth;
using Oms.Api.Data;
using Oms.Api.Models;

namespace Oms.Api.Users;

public sealed class UserProfileRepository(IDbConnectionFactory db, UserRepository users)
{
    private static async Task OpenAsync(System.Data.IDbConnection conn)
    {
        if (conn is DbConnection dbc)
            await dbc.OpenAsync();
        else
            conn.Open();
    }
    public async Task<UserRow?> Get(string email) => await users.GetByEmail(email);

    public async Task UpdateProfile(string email, UpdateProfileRequest req)
    {
        const string sql = """
            UPDATE "User"
            SET name = @name,
                phoneNumber = @phoneNumber,
                address = @address
            WHERE email = @email;
            """;

        using var conn = db.Create();
        var rows = await conn.ExecuteAsync(sql, new
        {
            email,
            name = req.Name.Trim(),
            phoneNumber = req.PhoneNumber.Trim(),
            address = req.Address.Trim()
        });

        if (rows != 1) throw new InvalidOperationException("User not found.");
    }

    public async Task ChangePassword(string email, ChangePasswordRequest req)
    {
        var u = await users.GetByEmail(email);
        if (u is null) throw new InvalidOperationException("User not found.");
        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword ?? "", u.Password))
            throw new InvalidOperationException("Current password is incorrect.");

        var hashed = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);

        const string sql = """
            UPDATE "User"
            SET password = @password
            WHERE email = @email;
            """;

        using var conn = db.Create();
        var rows = await conn.ExecuteAsync(sql, new { email, password = hashed });
        if (rows != 1) throw new InvalidOperationException("User not found.");
    }

    public async Task DeleteAccount(string email, DeleteAccountRequest req)
    {
        if (AuthValidator.IsDemoEmail(email))
            throw new InvalidOperationException("Demo accounts cannot be deleted.");

        var u = await users.GetByEmail(email);
        if (u is null) throw new InvalidOperationException("User not found.");
        if (!BCrypt.Net.BCrypt.Verify(req.Password ?? "", u.Password))
            throw new InvalidOperationException("Password is incorrect.");

        using var conn = db.Create();
        await OpenAsync(conn);
        using var tx = conn.BeginTransaction();

        await conn.ExecuteAsync("""
            DELETE FROM Invoice
            WHERE orderID IN (SELECT orderID FROM "Order" WHERE email = @email);
            """, new { email }, tx);

        await conn.ExecuteAsync("""
            DELETE FROM Invoice
            WHERE email = @email;
            """, new { email }, tx);

        await conn.ExecuteAsync("""
            DELETE FROM Order_Item
            WHERE orderID IN (SELECT orderID FROM "Order" WHERE email = @email);
            """, new { email }, tx);

        await conn.ExecuteAsync("""
            DELETE FROM "Order"
            WHERE email = @email;
            """, new { email }, tx);

        var rows = await conn.ExecuteAsync("""
            DELETE FROM "User"
            WHERE email = @email;
            """, new { email }, tx);

        if (rows != 1)
        {
            tx.Rollback();
            throw new InvalidOperationException("User not found.");
        }

        tx.Commit();
    }
}

