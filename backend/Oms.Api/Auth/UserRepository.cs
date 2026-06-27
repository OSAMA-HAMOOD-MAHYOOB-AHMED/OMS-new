using Dapper;
using Npgsql;
using Oms.Api.Data;
using Oms.Api.Models;

namespace Oms.Api.Auth;

public sealed class UserRepository(IDbConnectionFactory db)
{
    private const string SelectColumns = """
        email   AS Email,
        name    AS Name,
        phoneNumber AS PhoneNumber,
        password AS Password,
        address AS Address,
        role AS Role,
        emailVerified AS EmailVerified,
        verificationToken AS VerificationToken,
        verificationTokenExpires AS VerificationTokenExpires,
        avatarurl AS AvatarUrl,
        createdat AS CreatedAt
        """;

    public async Task<UserRow?> GetByEmail(string email)
    {
        var sql = $"""
            SELECT {SelectColumns}
            FROM "User"
            WHERE email = @email
            LIMIT 1;
            """;

        using var conn = db.Create();
        return await conn.QuerySingleOrDefaultAsync<UserRow>(sql, new { email });
    }

    public async Task<UserRow?> GetByVerificationToken(string token)
    {
        var sql = $"""
            SELECT {SelectColumns}
            FROM "User"
            WHERE verificationToken = @token
            LIMIT 1;
            """;

        using var conn = db.Create();
        return await conn.QuerySingleOrDefaultAsync<UserRow>(sql, new { token });
    }

    public async Task<bool> Create(UserRow user)
    {
        const string sql = """
            INSERT INTO "User" (email, name, phoneNumber, password, address, role, emailVerified, verificationToken, verificationTokenExpires)
            VALUES (@Email, @Name, @PhoneNumber, @Password, @Address, @Role, @EmailVerified, @VerificationToken, @VerificationTokenExpires);
            """;

        using var conn = db.Create();
        try
        {
            var rows = await conn.ExecuteAsync(sql, user);
            return rows == 1;
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return false;
        }
    }

    public async Task SetVerificationToken(string email, string token, DateTime expires)
    {
        const string sql = """
            UPDATE "User"
            SET verificationToken = @token,
                verificationTokenExpires = @expires
            WHERE email = @email;
            """;
        using var conn = db.Create();
        await conn.ExecuteAsync(sql, new { email, token, expires });
    }

    public async Task MarkEmailVerified(string email)
    {
        const string sql = """
            UPDATE "User"
            SET emailVerified = TRUE,
                verificationToken = NULL,
                verificationTokenExpires = NULL
            WHERE email = @email;
            """;
        using var conn = db.Create();
        await conn.ExecuteAsync(sql, new { email });
    }

    public async Task MarkDemoUsersVerified()
    {
        const string sql = """
            UPDATE "User"
            SET emailVerified = TRUE
            WHERE email LIKE '%@demo.local';
            """;
        using var conn = db.Create();
        await conn.ExecuteAsync(sql);
    }
}
