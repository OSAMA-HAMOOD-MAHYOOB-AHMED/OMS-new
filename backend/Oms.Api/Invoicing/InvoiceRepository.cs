using Dapper;
using Oms.Api.Data;

namespace Oms.Api.Invoicing;

public sealed class InvoiceRepository(IDbConnectionFactory db)
{
    public async Task<long> Create(string orderID, string email, string subject, string body)
    {
        const string sql = """
            INSERT INTO Invoice (orderID, email, subject, body, createdAt)
            VALUES (@orderID, @email, @subject, @body, @createdAt)
            RETURNING invoiceid;
            """;

        using var conn = db.Create();
        var id = await conn.QuerySingleAsync<long>(sql, new
        {
            orderID,
            email,
            subject,
            body,
            createdAt = DateTime.UtcNow
        });

        return id;
    }
}

