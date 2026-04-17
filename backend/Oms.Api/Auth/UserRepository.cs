using Dapper;
using Oms.Api.Data;
using Oms.Api.Models;

namespace Oms.Api.Auth;

public sealed class UserRepository(IDbConnectionFactory db)
{
    public async Task<UserRow?> GetByEmail(string email)
    {
        const string sql = """
            SELECT
              email   AS Email,
              name    AS Name,
              phoneNumber AS PhoneNumber,
              password AS Password,
              address AS Address,
              role AS Role
            FROM `User`
            WHERE email = @email
            LIMIT 1;
            """;

        using var conn = db.Create();
        return await conn.QuerySingleOrDefaultAsync<UserRow>(sql, new { email });
    }

    public async Task<bool> Create(UserRow user)
    {
        const string sql = """
            INSERT INTO `User` (email, name, phoneNumber, password, address, role)
            VALUES (@Email, @Name, @PhoneNumber, @Password, @Address, @Role);
            """;

        using var conn = db.Create();
        try
        {
            var rows = await conn.ExecuteAsync(sql, user);
            return rows == 1;
        }
        catch (MySqlConnector.MySqlException ex) when (ex.Number is 1062) // duplicate key
        {
            return false;
        }
    }
}

