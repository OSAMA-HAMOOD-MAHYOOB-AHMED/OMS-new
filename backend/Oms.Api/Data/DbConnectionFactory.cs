using System.Data;
using MySqlConnector;

namespace Oms.Api.Data;

public interface IDbConnectionFactory
{
    IDbConnection Create();
}

public sealed class DbConnectionFactory(IConfiguration configuration) : IDbConnectionFactory
{
    private readonly string _connectionString =
        configuration.GetConnectionString("OmsDb")
        ?? throw new InvalidOperationException("Missing connection string: ConnectionStrings:OmsDb");

    public IDbConnection Create() => new MySqlConnection(_connectionString);
}

